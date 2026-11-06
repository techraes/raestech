-- ============================================================
-- 00018_product_image_staging.sql
-- RAES TECH — Secure product-image staging / review system.
--
-- Adds a PRIVATE Supabase Storage bucket `product-images-staging` and a
-- `product_image_assets` registry that tracks every staged image (gallery
-- originals AND generic preview concepts). Nothing here is published to the
-- live product feed automatically:
--   * assets land with status 'staged';
--   * only an approved image may be attached to a product/variant, and that
--     is an explicit admin action in the review UI;
--   * `preview_only` assets (the 250 white/dark concepts) can never be
--     promoted to published product photos.
--
-- All rows and objects are protected by RLS / storage policies so that only
-- admins can view or write the staging data. Guests see nothing. Public
-- rendering of approved images uses short-lived signed URLs (see
-- src/lib/image-assets.ts).
-- ============================================================

-- ---------- Private storage bucket -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images-staging', 'product-images-staging', false, 10485760,
   array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Asset registry ---------------------------------------------
create table if not exists public.product_image_assets (
  id          uuid primary key default gen_random_uuid(),
  -- Product identity (denormalised so staging works even before a product row
  -- exists in the DB; matched at import time to the catalogue seed).
  brand       text not null,
  model       text not null,
  product_slug text not null,
  sku        text,                          -- variant SKU when variant-specific
  -- Source classification
  asset_kind  text not null check (asset_kind in ('gallery_original','concept_preview')),
  sub_kind    text not null check (sub_kind in ('gallery','white','dark')),
  preview_only boolean not null default true,  -- concept assets are preview-only
  -- Idempotency / duplicate detection keys
  sha256       text not null,
  source_key    text not null,               -- mapped asset key (stable across re-imports)
  storage_path text not null,                -- path inside product-images-staging
  -- Review workflow
  status        text not null default 'staged' check (status in ('staged','approved','rejected')),
  is_featured   boolean not null default false,
  created_by    uuid references public.profiles(id),
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  review_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint image_assets_unique_sha unique (sha256),
  constraint image_assets_unique_source unique (source_key)
);

create index if not exists image_assets_status_idx on public.product_image_assets(status);
create index if not exists image_assets_slug_idx on public.product_image_assets(product_slug);
create index if not exists image_assets_sku_idx on public.product_image_assets(sku);

-- ---------- Import / audit log -----------------------------------------
create table if not exists public.image_import_log (
  id          uuid primary key default gen_random_uuid(),
  import_batch text not null,
  kind         text not null,               -- gallery | concept_preview
  total        integer not null default 0,
  staged       integer not null default 0,
  matched_products integer not null default 0,
  matched_skus integer not null default 0,
  duplicates    integer not null default 0,   -- skipped as already staged
  failed       integer not null default 0,
  summary      jsonb not null default '{}'::jsonb,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

-- ---------- Row Level Security -----------------------------------------
alter table public.product_image_assets enable row level security;
alter table public.image_import_log enable row level security;

-- Registry + import log: only admins can read or write. Guests and regular
-- customers never see staged imagery (private previews).
create policy "image_assets_admin_all" on public.product_image_assets
  for all using (public.is_admin()) with check (public.is_admin());

create policy "image_import_log_admin_all" on public.image_import_log
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage policies (admin-only bucket) -----------------------
create policy "staging_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images-staging' and public.is_admin());

create policy "staging_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images-staging' and public.is_admin());

create policy "staging_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images-staging' and public.is_admin());

create policy "staging_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images-staging' and public.is_admin());

-- ---------- Review function --------------------------------------------
-- Only an admin can transition an asset's status. `preview_only` concepts may
-- be reviewed but can never be flagged as ready for publication.
create or replace function public.review_image_asset(
  p_id uuid,
  p_decision text,          -- 'approve' | 'reject'
  p_note text default null
)
returns public.product_image_assets
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.product_image_assets;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  if p_decision not in ('approve','reject') then
    raise exception 'Invalid decision: must be approve or reject';
  end if;

  update public.product_image_assets
    set status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
        is_featured = case when p_decision = 'approve' and not preview_only and is_featured then is_featured else false end,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        review_note = coalesce(p_note, review_note),
        updated_at = now()
  where id = p_id
  returning * into v_row;

  if v_row is null then
    raise exception 'Asset not found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.review_image_asset(uuid, text, text) from public;
grant execute on function public.review_image_asset(uuid, text, text) to authenticated;
