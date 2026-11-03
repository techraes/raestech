-- ============================================================
-- RAES TECH — Admin Control Centre (roles, permissions, audit)
-- Idempotent; safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Extend the user_role enum (idempotent)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'content_manager'
      and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type public.user_role add value 'content_manager';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'finance_manager'
      and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type public.user_role add value 'finance_manager';
  end if;
end $$;

-- ------------------------------------------------------------
-- Role -> permission map (used for server-side checks + admin UI)
-- ------------------------------------------------------------
create table if not exists public.admin_permissions (
  role text primary key,
  permissions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_permissions enable row level security;

drop policy if exists "admin_permissions_admin_select" on public.admin_permissions;
create policy "admin_permissions_admin_select" on public.admin_permissions
  for select using (public.is_admin());

drop policy if exists "admin_permissions_admin_write" on public.admin_permissions;
create policy "admin_permissions_admin_write" on public.admin_permissions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

insert into public.admin_permissions (role, permissions) values
  ('super_admin', '["dashboard","settings","appearance","homepage","payments","shipping","warranty","content","menus","coupons","social","seo","roles","system","audit","products","orders","customers","instalments","communications"]'),
  ('product_manager', '["dashboard","products","homepage","seo","settings"]'),
  ('order_manager', '["dashboard","orders","customers"]'),
  ('payment_verifier', '["dashboard","payments","orders","audit"]'),
  ('instalment_reviewer', '["dashboard","instalments","customers"]'),
  ('content_manager', '["dashboard","content","menus","social","seo","appearance","homepage"]'),
  ('finance_manager', '["dashboard","payments","orders","audit","settings"]'),
  ('support_staff', '["dashboard","customers","orders","content"]')
on conflict (role) do update set permissions = excluded.permissions, updated_at = now();

-- ------------------------------------------------------------
-- Admin audit log (append-only for non-admins)
-- ------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text,
  record_id text,
  prior_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

drop policy if exists "audit_insert_auth" on public.admin_audit_log;
create policy "audit_insert_auth" on public.admin_audit_log
  for insert with check (auth.uid() is not null);

drop policy if exists "audit_select_admin" on public.admin_audit_log;
create policy "audit_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

-- Only Super Admin may purge audit records.
drop policy if exists "audit_delete_super" on public.admin_audit_log;
create policy "audit_delete_super" on public.admin_audit_log
  for delete using (public.is_super_admin());

create index if not exists admin_audit_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_actor_idx on public.admin_audit_log(actor_id);
create index if not exists admin_audit_action_idx on public.admin_audit_log(action);
