-- RAES TECH — Seed the primary website administrator.
--
-- Assigns the `super_admin` role to tech.raes@gmail.com.
--
-- The Auth user itself is created through Supabase Auth (Dashboard / `supabase`
-- CLI `auth` flow or the app sign-up). This migration is idempotent: it runs
-- only when that user already exists, creates their profile if missing, and
-- ensures their role is `super_admin`.

do $$
begin
  if exists (select 1 from auth.users where lower(email) = 'tech.raes@gmail.com') then
    -- Ensure a profile row exists (with the email already on auth.users).
    insert into public.profiles (id, email, full_name)
    select id, email, coalesce(raw_user_meta_data->>'full_name', 'RAES TECH Admin')
    from auth.users
    where lower(email) = 'tech.raes@gmail.com'
    on conflict (id) do nothing;

    -- Grant the super-admin role (idempotent upsert).
    insert into public.user_roles (user_id, role)
    select id, 'super_admin'
    from auth.users
    where lower(email) = 'tech.raes@gmail.com'
    on conflict (user_id) do update set role = 'super_admin';
  end if;
end $$;
