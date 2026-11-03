-- ============================================================
-- RAES TECH — Product catalogue import (server-side, secure)
-- Adds an import audit log and a single RPC that validates and
-- upserts products/variants by SKU. Only admins may execute it.
-- ============================================================

-- ------------------------------------------------------------
-- Import audit log
-- ------------------------------------------------------------
create table if not exists public.import_audit_log (
  id uuid primary key default gen_random_uuid(),
  catalog_type text not null,
  mode text not null,
  total integer not null default 0,
  imported integer not null default 0,
  updated integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table public.import_audit_log enable row level security;

drop policy if exists "import_audit_admin_select" on public.import_audit_log;
create policy "import_audit_admin_select" on public.import_audit_log
  for select using (public.is_admin());

drop policy if exists "import_audit_admin_insert" on public.import_audit_log;
create policy "import_audit_admin_insert" on public.import_audit_log
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- Server-side import for
-- ------------------------------------------------------------
create or replace function public.import_products(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_catalog text;
  v_mode text;
  v_records jsonb;
  v_rec jsonb;
  v_brand_id uuid;
  v_category_id uuid;
  v_product_id uuid;
  v_slug text;
  v_sku text;
  v_brand text;
  v_category text;
  v_cond text;
  v_pta text;
  v_simlock text;
  v_listed numeric;
  v_colors text[];

  -- parsed field locals (defensive against empty strings)
  v_buy numeric;
  v_instalment numeric;
  v_stock int;
  v_low int;
  v_req boolean;
  v_featured boolean;
  v_new boolean;
  v_best boolean;

  v_failed int := 0;
  v_imported int := 0;
  v_updated int := 0;
  v_skipped int := 0;
  v_total int := 0;
  v_idx int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_is_jv boolean;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  v_catalog := p_payload->>'catalog_type';
  v_mode := coalesce(p_payload->>'mode', 'upsert');
  v_records := coalesce(p_payload->'records', '[]'::jsonb);
  v_total := jsonb_array_length(v_records);
  v_is_jv := (v_catalog = 'apple-jv');

  for v_rec in select value from jsonb_array_elements(v_records)
  loop
    v_idx := v_idx + 1;

    v_sku := trim(coalesce(v_rec->>'sku', ''));
    v_brand := trim(coalesce(v_rec->>'brand', ''));
    v_category := trim(coalesce(v_rec->>'category', ''));
    v_listed := coalesce((v_rec->>'listed_price')::numeric, -1);

    -- ---- minimal server-side validation ----
    if v_sku = '' then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', null, 'message', 'SKU is required');
      continue;
    end if;
    if v_listed < 0 then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'Listed price must be a non-negative number');
      continue;
    end if;
    if v_brand = '' then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'Brand is required');
      continue;
    end if;

    v_cond := lower(coalesce(v_rec->>'condition', 'box_pack'));
    if v_cond not in ('box_pack', 'used', 'refurbished') then
      v_cond := 'box_pack';
    end if;

    v_pta := coalesce(v_rec->>'pta_status', '');
    v_simlock := coalesce(v_rec->>'sim_lock_status', '');

    -- ---- JV hardening ----
    if v_is_jv then
      v_simlock := 'SIM-Locked';
      if position('approved' in lower(v_pta)) > 0 then
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'JV iPhone cannot be PTA-approved');
        continue;
      end if;
    end if;

    -- ---- resolve / create brand ----
    insert into brands (name, slug)
      values (v_brand, lower(regexp_replace(v_brand, '[^a-z0-9]+', '-', 'g')))
      on conflict (slug) do update set name = excluded.name
      returning id into v_brand_id;

    -- ---- resolve / create category (optional) ----
    v_category_id := null;
    if v_category <> '' then
      insert into categories (name, slug)
        values (v_category, lower(regexp_replace(v_category, '[^a-z0-9]+', '-', 'g')))
        on conflict (slug) do nothing
        returning id into v_category_id;
      if v_category_id is null then
        select id into v_category_id
          from categories
          where slug = lower(regexp_replace(v_category, '[^a-z0-9]+', '-', 'g'));
      end if;
    end if;

    -- ---- upsert product (by slug) ----
    v_slug := lower(coalesce(v_rec->>'slug', ''));
    if v_slug = '' then
      v_slug := lower(regexp_replace(coalesce(v_rec->>'name', v_brand || '-' || v_sku), '[^a-z0-9]+', '-', 'g'));
    end if;

    v_featured := coalesce((v_rec->>'featured')::boolean, false);
    v_new := coalesce((v_rec->>'new_arrival')::boolean, false);
    v_best := coalesce((v_rec->>'bestseller')::boolean, false);

    insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller, seo_title, seo_description, keywords)
      values (
        v_slug, v_brand_id, v_category_id,
        coalesce(v_rec->>'name', v_brand || ' ' || v_sku),
        nullif(v_rec->>'model', ''), nullif(v_rec->>'description', ''),
        coalesce(v_rec->>'status', 'active'), v_featured, v_new, v_best,
        nullif(v_rec->>'seo_title', ''), nullif(v_rec->>'seo_description', ''), nullif(v_rec->>'keywords', '')
      )
      on conflict (slug) do update set
        brand_id = excluded.brand_id,
        category_id = coalesce(excluded.category_id, products.category_id),
        name = excluded.name,
        model = excluded.model,
        description = excluded.description,
        status = excluded.status,
        featured = excluded.featured,
        new_arrival = excluded.new_arrival,
        bestseller = excluded.bestseller,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        keywords = excluded.keywords,
        updated_at = now()
      returning id into v_product_id;

    v_colors := array(select jsonb_array_elements_text(coalesce(v_rec->'colors', '[]'::jsonb)));

    v_buy := case when v_rec->>'buy_now_price' in ('', 'null') then 0 else (v_rec->>'buy_now_price')::numeric end;
    v_instalment := case when v_rec->>'instalment_total' in ('', 'null') then null else (v_rec->>'instalment_total')::numeric end;
    v_stock := case when v_rec->>'stock' in ('', 'null') then 0 else (v_rec->>'stock')::int end;
    v_low := case when v_rec->>'low_stock_threshold' in ('', 'null') then 5 else (v_rec->>'low_stock_threshold')::int end;
    v_req := case when v_rec->>'requires_verification' in ('', 'null') then v_is_jv else (v_rec->>'requires_verification')::boolean end;

    -- ---- variant handling by mode ----
    if v_mode = 'add' then
      if exists (select 1 from product_variants where sku = v_sku) then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      insert into product_variants (
        product_id, sku, supplier_sku, storage, ram, colors, display, chipset,
        rear_camera, front_camera, battery, network, regional_model, pta_status,
        sim_lock_status, condition, warranty_type, warranty_duration, warranty_provider,
        warranty_exclusions, listed_price, buy_now_price, instalment_total, stock,
        low_stock_threshold, requires_verification
      ) values (
        v_product_id, v_sku, nullif(v_rec->>'supplier_sku', ''), nullif(v_rec->>'storage', ''),
        nullif(v_rec->>'ram', ''), v_colors, nullif(v_rec->>'display', ''), nullif(v_rec->>'chipset', ''),
        nullif(v_rec->>'rear_camera', ''), nullif(v_rec->>'front_camera', ''),
        nullif(v_rec->>'battery', ''), nullif(v_rec->>'network', ''), nullif(v_rec->>'regional_model', ''),
        nullif(v_pta, ''), nullif(v_simlock, ''), v_cond,
        nullif(v_rec->>'warranty_type', ''), nullif(v_rec->>'warranty_duration', ''),
        nullif(v_rec->>'warranty_provider', ''), nullif(v_rec->>'warranty_exclusions', ''),
        v_listed, v_buy, v_instalment, v_stock, v_low, v_req
      );
      v_imported := v_imported + 1;
    elsif v_mode = 'update' then
      update product_variants set
        product_id = v_product_id,
        supplier_sku = nullif(v_rec->>'supplier_sku', ''),
        storage = nullif(v_rec->>'storage', ''), ram = nullif(v_rec->>'ram', ''), colors = v_colors,
        display = nullif(v_rec->>'display', ''), chipset = nullif(v_rec->>'chipset', ''),
        rear_camera = nullif(v_rec->>'rear_camera', ''), front_camera = nullif(v_rec->>'front_camera', ''),
        battery = nullif(v_rec->>'battery', ''), network = nullif(v_rec->>'network', ''),
        regional_model = nullif(v_rec->>'regional_model', ''),
        pta_status = nullif(v_pta, ''), sim_lock_status = nullif(v_simlock, ''), condition = v_cond,
        warranty_type = nullif(v_rec->>'warranty_type', ''), warranty_duration = nullif(v_rec->>'warranty_duration', ''),
        warranty_provider = nullif(v_rec->>'warranty_provider', ''), warranty_exclusions = nullif(v_rec->>'warranty_exclusions', ''),
        listed_price = v_listed, buy_now_price = v_buy, instalment_total = v_instalment,
        stock = v_stock, low_stock_threshold = v_low, requires_verification = v_req,
        updated_at = now()
      where sku = v_sku;
      if found then
        v_updated := v_updated + 1;
      else
        v_skipped := v_skipped + 1;
      end if;
    else
      -- upsert (default)
      if exists (select 1 from product_variants where sku = v_sku) then
        update product_variants set
          product_id = v_product_id,
          supplier_sku = nullif(v_rec->>'supplier_sku', ''),
          storage = nullif(v_rec->>'storage', ''), ram = nullif(v_rec->>'ram', ''), colors = v_colors,
          display = nullif(v_rec->>'display', ''), chipset = nullif(v_rec->>'chipset', ''),
          rear_camera = nullif(v_rec->>'rear_camera', ''), front_camera = nullif(v_rec->>'front_camera', ''),
          battery = nullif(v_rec->>'battery', ''), network = nullif(v_rec->>'network', ''),
          regional_model = nullif(v_rec->>'regional_model', ''),
          pta_status = nullif(v_pta, ''), sim_lock_status = nullif(v_simlock, ''), condition = v_cond,
          warranty_type = nullif(v_rec->>'warranty_type', ''), warranty_duration = nullif(v_rec->>'warranty_duration', ''),
          warranty_provider = nullif(v_rec->>'warranty_provider', ''), warranty_exclusions = nullif(v_rec->>'warranty_exclusions', ''),
          listed_price = v_listed, buy_now_price = v_buy, instalment_total = v_instalment,
          stock = v_stock, low_stock_threshold = v_low, requires_verification = v_req,
          updated_at = now()
        where sku = v_sku;
        v_updated := v_updated + 1;
      else
        insert into product_variants (
          product_id, sku, supplier_sku, storage, ram, colors, display, chipset,
          rear_camera, front_camera, battery, network, regional_model, pta_status,
          sim_lock_status, condition, warranty_type, warranty_duration, warranty_provider,
          warranty_exclusions, listed_price, buy_now_price, instalment_total, stock,
          low_stock_threshold, requires_verification
        ) values (
          v_product_id, v_sku, nullif(v_rec->>'supplier_sku', ''), nullif(v_rec->>'storage', ''),
          nullif(v_rec->>'ram', ''), v_colors, nullif(v_rec->>'display', ''), nullif(v_rec->>'chipset', ''),
          nullif(v_rec->>'rear_camera', ''), nullif(v_rec->>'front_camera', ''),
          nullif(v_rec->>'battery', ''), nullif(v_rec->>'network', ''), nullif(v_rec->>'regional_model', ''),
          nullif(v_pta, ''), nullif(v_simlock, ''), v_cond,
          nullif(v_rec->>'warranty_type', ''), nullif(v_rec->>'warranty_duration', ''),
          nullif(v_rec->>'warranty_provider', ''), nullif(v_rec->>'warranty_exclusions', ''),
          v_listed, v_buy, v_instalment, v_stock, v_low, v_req
        );
        v_imported := v_imported + 1;
      end if;
    end if;
  end loop;

  insert into import_audit_log (catalog_type, mode, total, imported, updated, skipped, failed, summary, created_by)
    values (v_catalog, v_mode, v_total, v_imported, v_updated, v_skipped, v_failed,
            jsonb_build_object('errors', v_errors),
            auth.uid());

  return jsonb_build_object(
    'total', v_total,
    'imported', v_imported,
    'updated', v_updated,
    'skipped', v_skipped,
    'failed', v_failed,
    'errors', v_errors
  );
end;
$$;

-- Only admins should be able to invoke the import function.
revoke all on function public.import_products(jsonb) from public;
grant execute on function public.import_products(jsonb) to authenticated;
