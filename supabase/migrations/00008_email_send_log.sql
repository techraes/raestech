-- ============================================================
-- RAES TECH — Email send accounting & rate limiting.
-- Backs the send-email Edge Function's anti-abuse controls.
-- (See supabase/functions/send-email/index.ts)
-- ============================================================

-- Every outbound transactional email attempt is recorded here so the
-- send-email function can enforce per-IP, per-recipient and global daily
-- caps, and so arbitrary-recipient abuse is visible/auditable.
create table if not exists public.email_send_log (
  id bigint generated always as identity primary key,
  recipient text not null,
  sender_ip text,
  template_key text,
  created_at timestamptz not null default now()
);

-- Index expressions may only use IMMUTABLE functions; date_trunc on a
-- timestamptz is only STABLE, so a UTC-day helper is injected instead.
create or replace function public.email_log_day(ts timestamptz)
returns date
language sql immutable
set search_path = public
as $$
  select (ts at time zone 'utc')::date;
$$;

create index if not exists email_send_log_recipient_day_idx
  on public.email_send_log (recipient, public.email_log_day(created_at));
create index if not exists email_send_log_sender_ip_day_idx
  on public.email_send_log (sender_ip, public.email_log_day(created_at));
create index if not exists email_send_log_created_idx
  on public.email_send_log (created_at);

alter table public.email_send_log enable row level security;

-- No client-facing policies: the table is written/read only by server-side
-- code using the service-role key, which bypasses RLS. End users have no
-- direct access, so they cannot tamper with the quota counters.

-- Helper: is a given email a confirmed auth user?
create or replace function public.is_email_verified(p_email text)
returns boolean
language sql stable security definer
set search_path = auth, public
as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = lower(trim(p_email))
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_email_verified(text) from public;
grant execute on function public.is_email_verified(text) to service_role;
