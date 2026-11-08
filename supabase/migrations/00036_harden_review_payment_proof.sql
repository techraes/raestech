-- ============================================================
-- 00036_harden_review_payment_proof.sql
-- Harden `review_payment_proof` against concurrent duplicate reviews.
--
-- The previous implementation locked the proof row with `SELECT ... FOR
-- UPDATE` and then checked the status afterwards. Because the row is re-read
-- after the lock is acquired, that pattern is already safe against double
-- crediting. This migration makes the guard explicit and airtight by moving the
-- status predicate INTO the locked SELECT, so a proof that a concurrent review
-- already decided is never even selected for locking. A second caller then
-- short-circuits and returns the recorded decision (already_reviewed = true)
-- without touching the ledger.
--
-- Idempotent: CREATE OR REPLACE. Safe to apply on top of 00023.
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

revoke all on function public.review_payment_proof(uuid, text, text, numeric) from public;
grant execute on function public.review_payment_proof(uuid, text, text, numeric) to authenticated;
