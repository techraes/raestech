-- ============================================================
-- RAES TECH — Fix RLS infinite recursion in role helper functions
--
-- Problem
--   `public.is_admin()` reads `public.user_roles` (via
--   `public.current_role()`). But `user_roles` has an RLS policy
--   (`user_roles_admin_all` → `for all using (public.is_admin())`)
--   that itself calls `public.is_admin()`. The result is infinite
--   recursion: any query touching `profiles` or `user_roles` blows
--   up the stack ("stack depth limit exceeded", SQLSTATE 54001).
--   This breaks login role resolution, admin access, and the
--   `send-email` verification path.
--
-- Fix
--   Mark the role helpers SECURITY DEFINER with a pinned search_path,
--   so their internal reads of `user_roles` run as the function owner
--   (which bypasses RLS) and never re-enter the recursive policy.
--   This matches the pattern already used by `handle_new_user()` and
--   `is_email_verified()`.
-- ============================================================

create or replace function public.current_role()
returns user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select (select public.current_role()) in (
    'super_admin'::user_role, 'product_manager'::user_role,
    'order_manager'::user_role, 'payment_verifier'::user_role,
    'instalment_reviewer'::user_role, 'support_staff'::user_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select (select public.current_role()) = 'super_admin'::user_role;
$$;

-- Ensure the general public can still use these in RLS policy
-- expressions (security definer does not change default EXECUTE
-- privilege, which is PUBLIC for functions).
