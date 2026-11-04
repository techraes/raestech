-- RAES TECH — Operational provisioning script (admin bootstrap).
--
-- Creates `tech.raes@gmail.com` as a CONFIRMED Auth user (only if missing),
-- attaches their profile row, and grants the `super_admin` role. Idempotent.
--
-- This is the SQL equivalent of the `create-admin` Edge Function. It is a
-- MANUAL, operational script — it is intentionally NOT part of `supabase/migrations`
-- because it requires a runtime password and must not run as part of `supabase
-- db push` (which would otherwise fail without the secret).
--
-- ── Security ────────────────────────────────────────────────────────────────
-- No password is stored in this file. The initial admin password MUST be
-- supplied at run time, otherwise this script fails.
--
--   psql -v admin_password='<strong-password>' -f supabase/scripts/provision_admin.sql
--   -- or, in the Dashboard SQL Editor, first run:
--   select set_config('app.admin_password', '<strong-password>', false);
--   -- then run the rest of this file.
--
-- An existing account's password is never overwritten.
-- ─────────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

create extension if not exists pgcrypto;

do $$
declare
  v_email constant text := 'tech.raes@gmail.com';
  v_id uuid;
  v_password text := nullif(current_setting('app.admin_password', true), '');
begin
  -- Fail fast: never fall back to a committed default credential.
  if v_password is null or v_password = '' then
    raise exception 'Admin password was not supplied. Provide it via psql -v admin_password=... or set_config(''app.admin_password'', ''...'', false). Refusing to continue.';
  end if;

  select id into v_id from auth.users where lower(email) = lower(v_email);

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', 'RAES TECH Admin'),
      now(), now()
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_id::text, v_id,
      jsonb_build_object(
        'sub', v_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email', now(), now(), now()
    );

    raise notice 'Created admin user %: initial password supplied at runtime — change it after first login.', v_email;
  end if;

  -- Ensure a profile row exists (never overwrites an existing one).
  insert into public.profiles (id, email, full_name)
  values (v_id, v_email, 'RAES TECH Admin')
  on conflict (id) do nothing;

  -- Grant the super-admin role (idempotent).
  insert into public.user_roles (user_id, role)
  values (v_id, 'super_admin')
  on conflict (user_id) do update set role = 'super_admin';
end $$;
