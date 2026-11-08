-- ============================================================
-- 00029_admin_review_actions.sql
-- Server-side review actions used by Admin -> Orders so that allowed status
-- transitions are enforced at the database, duplicate approval events cannot
-- occur, and the reviewer/decision/timestamp/reason are recorded.
--
-- IMPORTANT — payment verification is separated from order confirmation:
--   * review_order_payment('approve') verifies the proof of payment. It marks
--     the payment verified and moves the order to 'confirmed'. It does NOT set
--     the order to 'approved', so the order-approved email trigger (00024,
--     fires on new.status='approved') is NOT fired at this stage.
--   * confirm_order() is a separate, explicit step that promotes a payment-
--     verified order to 'approved' and thereby triggers the confirmation email
--     exactly once.
--   This is the "reviewing payment proof" vs "approving the order" split the
--   UI asks admins to make explicit.
--
-- Atomicity: each function body runs as a single transaction; if any statement
-- inside fails, the whole call rolls back (nothing is left half-applied).
--
-- All functions are `security definer`, admin-gated, lock the target row, and
-- are guarded so repeating an action cannot create a second event or re-send
-- an email. Nothing here deletes or rewrites existing rows.
-- ============================================================

-- ---- 1. order_status: add 'approved' (idempotent) ----
alter type public.order_status add value if not exists 'approved';

-- ---- 2. Audit columns on orders ----
alter table public.orders
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz;

-- ---- 3. Verify / reject a Buy Now order payment proof. ----
-- 'approve' only records the payment as verified and advances the order to
-- 'confirmed'. It does NOT approve the order or send the confirmation email.
create or replace function public.review_order_payment(
  p_order_id uuid,
  p_decision text,
  p_reason text default null
) returns table (ok boolean, message text)
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  -- Idempotent transition guard: only one final decision per payment proof.
  if v_order.payment_status = 'verified' then
    return query select true, 'Payment already verified';
    return;
  end if;
  if v_order.payment_status = 'rejected' then
    return query select true, 'Payment already rejected';
    return;
  end if;

  if p_decision = 'approve' then
    -- Verify funds received. Keep the order OUT of 'approved' (no email).
    update public.orders
      set payment_status = 'verified',
          status = 'confirmed',
          rejection_reason = null,
          reviewed_by = auth.uid(),
          reviewed_at = now()
      where id = p_order_id;
    update public.payments
      set status = 'verified', verified_by = auth.uid(), verified_at = now()
      where order_id = p_order_id and status in ('pending_verification','unpaid');
    return query select true, 'Payment verified. Order confirmed (confirmation email is sent on order approval).';
  else
    if p_reason is null or btrim(p_reason) = '' then
      raise exception 'A rejection reason is required';
    end if;
    update public.orders
      set payment_status = 'rejected',
          rejection_reason = p_reason,
          reviewed_by = auth.uid(),
          reviewed_at = now()
      where id = p_order_id;
    update public.payments
      set status = 'rejected', rejection_reason = p_reason, verified_by = auth.uid(), verified_at = now()
      where order_id = p_order_id;
    return query select true, 'Payment rejected';
  end if;
end $$;

-- ---- 4. Explicitly approve a payment-verified order (fires the confirmation
--         email exactly once via the 00024 trigger). ----
create or replace function public.confirm_order(
  p_order_id uuid
) returns table (ok boolean, message text)
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'approved' then
    return query select true, 'Order already approved';
    return;
  end if;
  if v_order.payment_status <> 'verified' then
    raise exception 'Payment must be verified before the order can be approved';
  end if;

  update public.orders
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_order_id;
  return query select true, 'Order approved';
end $$;

-- ---- 5. Verify / reject an instalment ADVANCE receipt. ----
-- Verifying the advance must NOT auto-approve the CNIC application or mark the
-- whole instalment balance paid; it only records the advance as received.
create or replace function public.review_instalment_advance(
  p_application_id uuid,
  p_decision text,
  p_reason text default null
) returns table (ok boolean, message text)
language plpgsql security definer set search_path = public
as $$
declare
  v_app public.instalment_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  select * into v_app from public.instalment_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found';
  end if;

  -- Guard: once the advance is verified or the application is decided, a
  -- repeat call must not re-run the effect.
  if v_app.status in ('advance_payment_verified','approved','rejected') then
    return query select true, 'Already ' || v_app.status::text;
    return;
  end if;

  if p_decision = 'approve' then
    update public.instalment_applications
      set status = 'advance_payment_verified',
          advance_received = coalesce(advance_received,0) + coalesce(advance_payment,0),
          rejection_reason = null,
          reviewed_by = auth.uid(),
          reviewed_at = now()
      where id = p_application_id;
    update public.payments
      set status = 'verified', verified_by = auth.uid(), verified_at = now()
      where instalment_application_id = p_application_id and status in ('pending_verification','unpaid');
    return query select true, 'Advance verified (application still requires review)';
  else
    if p_reason is null or btrim(p_reason) = '' then
      raise exception 'A rejection reason is required';
    end if;
    update public.instalment_applications
      set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_application_id;
    update public.payments
      set status = 'rejected', rejection_reason = p_reason, verified_by = auth.uid(), verified_at = now()
      where instalment_application_id = p_application_id;
    return query select true, 'Application rejected';
  end if;
end $$;

-- ---- 6. Review the instalment APPLICATION itself (CNIC/documents). ----
-- Separate decision: approving the application is independent of verifying the
-- advance. Only allowed once the application is not already decided.
create or replace function public.review_instalment_application(
  p_application_id uuid,
  p_decision text,
  p_reason text default null
) returns table (ok boolean, message text)
language plpgsql security definer set search_path = public
as $$
declare
  v_app public.instalment_applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  select * into v_app from public.instalment_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found';
  end if;

  if v_app.status in ('approved','rejected') then
    return query select true, 'Already ' || v_app.status::text;
    return;
  end if;

  if p_decision = 'approve' then
    update public.instalment_applications
      set status = 'approved', rejection_reason = null, reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_application_id;
    return query select true, 'Application approved';
  else
    if p_reason is null or btrim(p_reason) = '' then
      raise exception 'A rejection reason is required';
    end if;
    update public.instalment_applications
      set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_application_id;
    return query select true, 'Application rejected';
  end if;
end $$;

-- ---- 7. Grants: authenticated (admin) may invoke; no public execution ----
revoke all on function public.review_order_payment(uuid, text, text) from public;
grant execute on function public.review_order_payment(uuid, text, text) to authenticated;

revoke all on function public.confirm_order(uuid) from public;
grant execute on function public.confirm_order(uuid) to authenticated;

revoke all on function public.review_instalment_advance(uuid, text, text) from public;
grant execute on function public.review_instalment_advance(uuid, text, text) to authenticated;

revoke all on function public.review_instalment_application(uuid, text, text) from public;
grant execute on function public.review_instalment_application(uuid, text, text) to authenticated;
