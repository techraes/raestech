-- ============================================================
-- RAES TECH — Manual "Mark as sent" tracking for approval emails
-- ------------------------------------------------------------
-- Admins can send a failed approval email from their own mailbox. When they
-- do, we record who and when, keep the original automatic failure visible for
-- history, and prevent any later automatic retry from sending a duplicate.
-- ============================================================

alter table public.order_email_jobs
  add column if not exists manually_sent_at timestamptz,
  add column if not exists manually_sent_by uuid references public.profiles(id) on delete set null;

-- Record a manual send for an order/instalment approval email (admin only).
-- The automatic job status/error history is preserved; the manual-sent marker
-- is what future retries check to avoid duplicates.
create or replace function public.mark_order_email_manual_sent(p_order_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_kind text;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  select case when exists (
    select 1 from public.instalment_applications where id = p_order_id
  ) then 'instalment' else 'order' end
  into v_kind;

  update public.order_email_jobs
    set manually_sent_at = now(),
        manually_sent_by = auth.uid(),
        updated_at = now()
    where kind = v_kind and subject_id = p_order_id;

  if not found then
    insert into public.order_email_jobs (kind, subject_id, status, manually_sent_at, manually_sent_by)
    values (v_kind, p_order_id, 'failed', now(), auth.uid());
  end if;
end;
$$;
revoke all on function public.mark_order_email_manual_sent(uuid) from public;
grant execute on function public.mark_order_email_manual_sent(uuid) to authenticated;

-- Read a job by kind + subject id (orders and instalment applications), including
-- the manual-sent marker so the admin can see whether the email was already sent
-- by hand. Admin-gated: this is a `security definer` function, so RLS does not
-- apply — we must enforce `is_admin()` inside the function, exactly like
-- `mark_order_email_manual_sent` / `retry_order_email`.
create or replace function public.get_email_job_state(p_kind text, p_subject_id uuid)
returns table(status text, attempts integer, last_attempt_at timestamptz, last_error text, delivery_id text, delivered_at timestamptz, masked_recipient text, manually_sent_at timestamptz, manually_sent_by uuid)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  return query
    select j.status, j.attempts, j.last_attempt_at, j.last_error, j.delivery_id,
           j.delivered_at, j.masked_recipient, j.manually_sent_at, j.manually_sent_by
    from public.order_email_jobs j
    where j.kind = p_kind and j.subject_id = p_subject_id;
end;
$$;
revoke all on function public.get_email_job_state(text, uuid) from public;
grant execute on function public.get_email_job_state(text, uuid) to authenticated;
