-- ============================================================
-- RAES TECH — Wishlist persistence (slug-keyed, owner-only RLS)
-- ------------------------------------------------------------
-- The storefront catalogue uses the product slug as the stable, public
-- identity across cards, the product detail page and the wishlist page.
-- This table persists a signed-in user's saved slugs so a wishlist survives
-- refresh and sign-in, and so customer B can never read or modify customer A's
-- saved items (ownership enforced by row-level security).
--
-- This migration is deliberately self-contained: owner-only RLS is ALWAYS
-- applied (so the table is never left open). The admin clause is added only if
-- public.is_admin() exists (it is defined in migration 00001, so it does in the
-- normal ordered run; gating here makes the migration safe even if applied in
-- isolation).
-- ============================================================

create table if not exists public.user_wishlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

alter table public.user_wishlist enable row level security;

-- Owner-only base policy: a user can read/insert/delete their own rows. This is
-- always applied so the table is never readable/writable by other users.
drop policy if exists user_wishlist_owner_all on public.user_wishlist;
create policy user_wishlist_owner_all on public.user_wishlist
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Extend to admins (support) only if the admin helper exists. Gated so the
-- migration never fails on a project that hasn't defined is_admin() yet.
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    execute 'drop policy if exists user_wishlist_admin_all on public.user_wishlist';
    execute 'create policy user_wishlist_admin_all on public.user_wishlist
             for all
             using (public.is_admin())
             with check (public.is_admin())';
  end if;
end $$;

create index if not exists user_wishlist_user_idx on public.user_wishlist(user_id);
