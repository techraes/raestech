-- ============================================================
-- 00023_payment_proof_workflow.sql
-- Manual bank-transfer verification workflow.
--
-- One row per customer screenshot submission + a single immutable review
-- decision. Sixing is re-applied exactly once (row lock + status guard) and
-- updates the obligation (order balance, instalment advance received, or
-- instalment schedule payment) together with an immutable ledger entry in one
-- transaction.
--
-- Storage: screenshots live in the PRIVATE `receipts` bucket, owner-folder,
-- and are only ever served through short-lived signed URLs.
-- ============================================================

-- The order-approval trigger (migration 00024) references the 'approved'
-- order status. The enum value must exist in its own transaction first
-- (Postgres forbids using a just-added enum value in the same transaction).
alter type public.order_status add value if not exists 'approved';

-- ---- Finance-staff helper (reviewers + super admin) ----
create or replace function public.is_finance_staff()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select (select public.current_role()) in (
    'super_admin'::user_role, 'payment_verifier'::user_role, 'finance_manager'::user_role
  );
$$;

-- ---- Track advance actually received on an application ----
alter table public.instalment_applications
  add column if not exists advance_received numeric(14,2) not null default 0;

-- ---- Submission ledger ----
create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('buy_now','instalment_advance','instalment_monthly')),
  order_id uuid references public.orders(id) on delete cascade,
  instalment_application_id uuid references public.instalment_applications(id) on delete cascade,
  instalment_schedule_id uuid references public.instalment_schedules(id) on delete set null,
  claimed_amount numeric(14,2) not null check (claimed_amount > 0),
  verified_amount numeric(14,2),
  transfer_date date not null,
  bank_reference text not null,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size integer,
  status text not null default 'pending_verification'
    check (status in ('pending_verification','verified','rejected')),
  mismatch_reason text,
  rejection_reason text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  balance_before numeric(14,2),
  balance_after numeric(14,2),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);
create index if not exists proofs_queue_idx on public.payment_proofs(status, created_at desc);
create index if not exists proofs_order_idx on public.payment_proofs(order_id);
create index if not exists proofs_app_idx on public.payment_proofs(instalment_application_id);
create index if not exists proofs_schedule_idx on public.payment_proofs(instalment_schedule_id);

-- ---- RLS ----
alter table public.payment_proofs enable row level security;

drop policy if exists "proofs_owner_all" on public.payment_proofs;
create policy "proofs_owner_all" on public.payment_proofs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "proofs_staff_select" on public.payment_proofs;
create policy "proofs_staff_select" on public.payment_proofs
  for select using (public.is_finance_staff());

grant select, insert on public.payment_proofs to authenticated;

-- ---- Storage: finance staff may read all receipts (owners already can) ----
drop policy if exists "verifier reads all receipts" on storage.objects;
create policy "verifier reads all receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and public.is_finance_staff());

-- ============================================================
-- SUBMIT — customer uploads a proof (idempotent via idempotency_key)
-- ============================================================
create or replace function public.submit_payment_proof(
  p_order_id uuid,
  p_instalment_application_id uuid,
  p_instalment_schedule_id uuid,
  p_kind text,
  p_claimed_amount numeric,
  p_transfer_date date,
  p_bank_reference text,
  p_file_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size integer,
  p_idempotency_key text
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := p_kind;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Must be authenticated to submit a payment proof';
  end if;
  if p_claimed_amount is null or p_claimed_amount <= 0 then
    raise exception 'A positive claimed amount is required';
  end if;
  if p_transfer_date is null then
    raise exception 'Transfer date is required';
  end if;
  if p_bank_reference is null or length(btrim(p_bank_reference)) < 3 then
    raise exception 'A valid bank transaction reference is required';
  end if;
  if p_file_path is null or btrim(p_file_path) = '' then
    raise exception 'A screenshot is required';
  end if;

  -- Resolve kind from what is linked, if not given.
  if v_kind is null then
    if p_instalment_schedule_id is not null then
      v_kind := 'instalment_monthly';
    elsif p_instalment_application_id is not null then
      v_kind := 'instalment_advance';
    elsif p_order_id is not null then
      v_kind := 'buy_now';
    else
      raise exception 'A linked order or instalment is required';
    end if;
  end if;

  -- Ownership checks.
  if p_order_id is not null then
    if not exists (select 1 from public.orders o where o.id = p_order_id and o.user_id = v_uid) then
      raise exception 'Order not found or not yours';
    end if;
  end if;
  if p_instalment_application_id is not null then
    if not exists (select 1 from public.instalment_applications a where a.id = p_instalment_application_id and a.user_id = v_uid) then
      raise exception 'Instalment application not found or not yours';
    end if;
  end if;
  if p_instalment_schedule_id is not null then
    if not exists (
      select 1
      from public.instalment_schedules s
      join public.instalment_agreements g on g.id = s.agreement_id
      join public.instalment_applications a on a.id = g.application_id
      where s.id = p_instalment_schedule_id and a.user_id = v_uid
    ) then
      raise exception 'Instalment schedule not found or not yours';
    end if;
  end if;

  -- Retry-safe: reuse an existing submission with the same idempotency key.
  select id into v_id from public.payment_proofs where idempotency_key = p_idempotency_key;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.payment_proofs (
    user_id, kind, order_id, instalment_application_id, instalment_schedule_id,
    claimed_amount, transfer_date, bank_reference, file_path, file_name,
    mime_type, file_size, idempotency_key
  ) values (
    v_uid, v_kind, p_order_id, p_instalment_application_id, p_instalment_schedule_id,
    p_claimed_amount, p_transfer_date, p_bank_reference, p_file_path, p_file_name,
    p_mime_type, p_file_size, p_idempotency_key
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_payment_proof(uuid, uuid, uuid, text, numeric, date, text, text, text, text, integer, text) to authenticated;

-- ============================================================
-- REVIEW — approve/reject in ONE atomic, idempotent step
-- ============================================================
create or replace function public.review_payment_proof(
  p_proof_id uuid,
  p_decision text,
  p_reason text default null,
  p_received_amount numeric default null
) returns table (
  decision text,
  already_reviewed boolean,
  balance_before numeric,
  balance_after numeric,
  reviewed_by uuid,
  reviewed_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_rec public.payment_proofs%rowtype;
  v_eff numeric;
  v_before numeric;
  v_after numeric;
  v_order_total numeric;
  v_order_verified numeric;
  v_kind text;
begin
  -- Authorization FIRST: only finance staff / super admin may invoke review at
  -- all — including reading an already-reviewed proof's decision, reviewer and
  -- balances. Without this, an authenticated caller could probe terminal proofs.
  if not public.is_finance_staff() then
    raise exception 'Forbidden: finance staff only';
  end if;

  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  -- Serialize concurrent reviews: lock ONLY a proof that is still pending. If a
  -- concurrent review commits before this transaction obtains the lock, this
  -- select finds nothing and we return the recorded decision without re-crediting.
  select * into v_rec from public.payment_proofs
    where id = p_proof_id and status = 'pending_verification'
    for update;

  if not found then
    -- Distinguish a missing proof from one that was already decided concurrently.
    select * into v_rec from public.payment_proofs where id = p_proof_id;
    if not found then
      raise exception 'Payment proof not found';
    end if;
    return query select
      v_rec.status, true, v_rec.balance_before, v_rec.balance_after,
      v_rec.reviewed_by, v_rec.reviewed_at;
    return;
  end if;

  if p_decision = 'approve' then
    v_kind := v_rec.kind;
    v_eff := coalesce(p_received_amount, v_rec.claimed_amount);
    if v_eff <= 0 then
      raise exception 'Verified amount must be positive';
    end if;

    -- Compute outstanding before.
    if v_kind = 'buy_now' then
      select o.total into v_order_total from public.orders o where o.id = v_rec.order_id;
      select coalesce(sum(pf.verified_amount), 0) into v_order_verified
        from public.payment_proofs pf
        where pf.order_id = v_rec.order_id and pf.status = 'verified';
      v_before := greatest(coalesce(v_order_total,0) - v_order_verified, 0);
    elsif v_kind = 'instalment_advance' then
      select greatest(coalesce(a.advance_payment,0) - coalesce(a.advance_received,0), 0)
        into v_before
        from public.instalment_applications a where a.id = v_rec.instalment_application_id;
    else -- instalment_monthly
      select greatest(coalesce(s.amount,0) - coalesce(s.amount_paid,0), 0)
        into v_before
        from public.instalment_schedules s where s.id = v_rec.instalment_schedule_id;
    end if;
    v_after := greatest(v_before - v_eff, 0);

    update public.payment_proofs
      set status = 'verified',
          verified_amount = v_eff,
          balance_before = v_before,
          balance_after = v_after,
          mismatch_reason = case
            when p_received_amount is not null and p_received_amount <> v_rec.claimed_amount
            then coalesce(p_reason, 'Verified amount differs from claimed amount')
            else null end,
          reviewed_by = auth.uid(),
          reviewed_at = now()
      where id = p_proof_id;

    -- Credit the correct obligation.
    if v_kind = 'buy_now' then
      update public.orders o
        set payment_status = case
          when coalesce((select sum(pf.verified_amount) from public.payment_proofs pf
                         where pf.order_id = o.id and pf.status = 'verified'), 0) >= o.total
          then 'verified'
          else o.payment_status end
        where o.id = v_rec.order_id;
      insert into public.ledger_entries
        (entry_type, account_type, account_id, amount, balance_after, reference_id, created_by, note)
      values
        ('credit', 'order', v_rec.order_id, v_eff, v_after, p_proof_id, auth.uid(), 'bank transfer approved');
    elsif v_kind = 'instalment_advance' then
      update public.instalment_applications a
        set advance_received = coalesce(a.advance_received,0) + v_eff
        where a.id = v_rec.instalment_application_id;
      insert into public.ledger_entries
        (entry_type, account_type, account_id, amount, balance_after, reference_id, created_by, note)
      values
        ('credit', 'instalment', v_rec.instalment_application_id, v_eff, v_after, p_proof_id, auth.uid(), 'advance approved');
    else
      update public.instalment_schedules s
        set amount_paid = coalesce(s.amount_paid,0) + v_eff,
            status = case when coalesce(s.amount_paid,0) + v_eff >= s.amount then 'paid' else 'part_paid' end,
            payment_reference = v_rec.bank_reference,
            verified_by = auth.uid(),
            verified_at = now()
        where s.id = v_rec.instalment_schedule_id;
      insert into public.ledger_entries
        (entry_type, account_type, account_id, amount, balance_after, reference_id, created_by, note)
      values
        ('credit', 'instalment', v_rec.instalment_schedule_id, v_eff, v_after, p_proof_id, auth.uid(), 'instalment approved');
    end if;

    return query select 'approved', false, v_before, v_after, auth.uid(), now();
  else
    update public.payment_proofs
      set status = 'rejected',
          rejection_reason = coalesce(p_reason, 'Rejected'),
          reviewed_by = auth.uid(),
          reviewed_at = now()
      where id = p_proof_id;
    return query select 'rejected', false, null::numeric, null::numeric, auth.uid(), now();
  end if;
end;
$$;

grant execute on function public.review_payment_proof(uuid, text, text, numeric) to authenticated;
