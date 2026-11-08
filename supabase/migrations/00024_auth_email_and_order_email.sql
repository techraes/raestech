-- ============================================================
-- RAES TECH — Admin-controlled signup email verification & order approval emails
-- ------------------------------------------------------------
-- 1. Signup OTP config (singleton) + audit trail. The effective value defaults
--    to `true` (require OTP) so enabling this feature does NOT change the live
--    signup flow until a Super Admin explicitly switches it off.
-- 2. Order approval email jobs: a pending email job is created when an order
--    (or instalment application) first reaches Approved. A unique (kind,
--    subject_id) constraint prevents duplicate jobs from double-clicks,
--    refreshes or concurrent admin actions.
-- 3. The `order_approved` email template.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Signup OTP config + audit
-- ------------------------------------------------------------
create table if not exists public.auth_email_config (
  id boolean primary key default true,
  require_signup_otp boolean not null default true,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  constraint auth_email_config_singleton check (id = true)
);

create table if not exists public.auth_config_audit (
  id bigint generated always as identity primary key,
  changed_by uuid references profiles(id),
  previous_value boolean,
  new_value boolean,
  changed_at timestamptz not null default now()
);

-- Seed with current behaviour (require OTP) so the switch never changes the
-- live signup flow on first setup.
insert into public.auth_email_config (id, require_signup_otp)
values (true, true)
on conflict (id) do nothing;

create or replace function public.get_signup_otp_required()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select require_signup_otp from public.auth_email_config where id = true), true);
$$;
revoke all on function public.get_signup_otp_required() from public;
grant execute on function public.get_signup_otp_required() to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Order approval email jobs
-- ------------------------------------------------------------
create table if not exists public.order_email_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'order' check (kind in ('order','instalment')),
  subject_id uuid not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','delivered','failed')),
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  last_error text,
  delivery_id text,
  delivered_at timestamptz,
  masked_recipient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, subject_id)
);
create index if not exists order_email_jobs_status_idx on public.order_email_jobs(status);
create index if not exists order_email_jobs_kind_idx on public.order_email_jobs(kind);

-- Fire when an order first reaches Approved.
create or replace function public.handle_order_approved()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.order_email_jobs (kind, subject_id)
  values ('order', new.id)
  on conflict (kind, subject_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_order_approved on public.orders;
create trigger trg_order_approved
after update of status on public.orders
for each row
when (new.status = 'approved' and old.status is distinct from 'approved')
execute function public.handle_order_approved();

-- Fire when an instalment application first reaches Approved.
create or replace function public.handle_instalment_approved()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.order_email_jobs (kind, subject_id)
  values ('instalment', new.id)
  on conflict (kind, subject_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_instalment_approved on public.instalment_applications;
create trigger trg_instalment_approved
after update of status on public.instalment_applications
for each row
when (new.status = 'approved' and old.status is distinct from 'approved')
execute function public.handle_instalment_approved();

-- Read the email-job state for the admin order page.
create or replace function public.get_order_email_job(p_order_id uuid)
returns table(kind text, status text, attempts integer, last_attempt_at timestamptz, last_error text, delivery_id text, delivered_at timestamptz, masked_recipient text)
language sql stable security definer set search_path = public
as $$
  select j.kind, j.status, j.attempts, j.last_attempt_at, j.last_error, j.delivery_id, j.delivered_at, j.masked_recipient
  from public.order_email_jobs j
  where j.kind = 'order' and j.subject_id = p_order_id;
$$;
revoke all on function public.get_order_email_job(uuid) from public;
grant execute on function public.get_order_email_job(uuid) to authenticated;

-- Reset a failed/pending job so the sender reprocesses it. Admin only.
create or replace function public.retry_order_email(p_order_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;
  update public.order_email_jobs
    set status = 'pending', last_error = null, updated_at = now()
    where kind = 'order' and subject_id = p_order_id;
  if not found then
    insert into public.order_email_jobs (kind, subject_id)
    values ('order', p_order_id)
    on conflict (kind, subject_id) do nothing;
  end if;
end;
$$;
revoke all on function public.retry_order_email(uuid) from public;
grant execute on function public.retry_order_email(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. Order-approved email template
-- ------------------------------------------------------------
insert into public.email_templates (key, subject, body, enabled)
values (
  'order_approved',
  'RAES TECH | Order {{order_number}} approved',
  '<h1>Your order {{order_number}} has been approved</h1>'
    '<p>Hi {{first_name}},</p>'
    '<p>Great news — your order has been approved and is being prepared for delivery.</p>'
    '<p><strong>Order:</strong> {{order_number}}<br>'
    '<strong>Item:</strong> {{product_name}} — {{variant_name}} {{color}}<br>'
    '<strong>Approved amount:</strong> {{total}} PKR<br>'
    '<strong>Payment:</strong> {{payment_method}}</p>'
    '{{instalment_block}}'
    '<p>Your order will be delivered to your shipping address. Please keep your phone and CNIC handy for verification at delivery.</p>'
    '<p>Thank you for shopping with RAES TECH.</p>',
  true
)
on conflict (key) do update set
  subject = excluded.subject,
  body = excluded.body,
  enabled = excluded.enabled,
  updated_at = now();
