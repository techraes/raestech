-- ============================================================
-- 00039_order_variant_snapshot.sql
-- Preserve the exact variant the customer ordered at order time so later
-- catalogue edits cannot change what an order/application shows in the admin
-- views.
--
--   * order_items : add model / storage / ram / pta_status / jv_status
--     snapshots next to the already-stored sku, colour and variant_id.
--   * instalment_applications : add product_name / sku / model / storage / ram
--     / pta_status / jv_status snapshots next to variant_id and colour.
--   * place_order_buynow : persist those snapshots (preferring the values the
--     customer saw, falling back to the catalogue row) and validate that each
--     variant belongs to the product being ordered.
-- ============================================================

alter table public.order_items
  add column if not exists model text,
  add column if not exists storage text,
  add column if not exists ram text,
  add column if not exists pta_status text,
  add column if not exists jv_status text;

alter table public.instalment_applications
  add column if not exists product_name text,
  add column if not exists sku text,
  add column if not exists model text,
  add column if not exists storage text,
  add column if not exists ram text,
  add column if not exists pta_status text,
  add column if not exists jv_status text;

-- ============================================================
-- Idempotent backfill: fill ONLY missing fields from the variant/product
-- records reliably linked to each order/application (via variant_id). Each
-- statement guards on IS NULL so re-running is a no-op. Amounts, payment
-- records and approval statuses are untouched.
-- ============================================================

update public.order_items oi
   set storage = v.storage
  from product_variants v
 where oi.variant_id = v.id and oi.storage is null;

update public.order_items oi
   set ram = v.ram
  from product_variants v
 where oi.variant_id = v.id and oi.ram is null;

update public.order_items oi
   set pta_status = v.pta_status
  from product_variants v
 where oi.variant_id = v.id and oi.pta_status is null;

update public.order_items oi
   set jv_status = v.sim_lock_status
  from product_variants v
 where oi.variant_id = v.id and oi.jv_status is null;

update public.order_items oi
   set model = p.model
  from product_variants v
  join products p on p.id = v.product_id
 where oi.variant_id = v.id and oi.model is null;

update public.instalment_applications a
   set sku = v.sku
  from product_variants v
 where a.variant_id = v.id and a.sku is null;

update public.instalment_applications a
   set storage = v.storage
  from product_variants v
 where a.variant_id = v.id and a.storage is null;

update public.instalment_applications a
   set ram = v.ram
  from product_variants v
 where a.variant_id = v.id and a.ram is null;

update public.instalment_applications a
   set pta_status = v.pta_status
  from product_variants v
 where a.variant_id = v.id and a.pta_status is null;

update public.instalment_applications a
   set jv_status = v.sim_lock_status
  from product_variants v
 where a.variant_id = v.id and a.jv_status is null;

update public.instalment_applications a
   set model = p.model, product_name = p.name
  from product_variants v
  join products p on p.id = v.product_id
 where a.variant_id = v.id and a.model is null;

create or replace function public.place_order_buynow(p_payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_number text;
  v_discount numeric;
  v_shipping numeric;
  v_subtotal numeric := 0;
  v_listed_subtotal numeric := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_product_slug text;
  v_sku text;
  v_qty int;
  v_listed numeric;
  v_unit numeric;
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'Must be authenticated to place an order';
  end if;

  v_order_number := p_payload->>'order_number';
  if v_order_number is null or v_order_number = '' then
    v_order_number := 'ORD-' || upper(substr(md5(random()::text), 1, 8));
  end if;

  v_discount := coalesce((p_payload->>'discount_percent')::numeric, 0);
  if v_discount < 0 or v_discount > 100 then
    raise exception 'discount_percent must be between 0 and 100';
  end if;

  v_shipping := coalesce((p_payload->>'shipping_charge')::numeric, 0);

  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::int;
    if coalesce(v_qty, 0) <= 0 then
      raise exception 'Quantity must be positive';
    end if;
    if v_sku is null or v_sku = '' then
      raise exception 'Item missing SKU';
    end if;

    -- Resolve the variant; the globally-unique SKU ties it to exactly one
    -- product row, so we can authoritatively validate the requested product.
    select v.listed_price, v.price, v.id, p.slug
      into v_listed, v_unit, v_variant_id, v_product_slug
      from product_variants v
      join products p on p.id = v.product_id
      where v.sku = v_sku;

    if not found then
      raise exception 'Invalid SKU %', v_sku;
    end if;

    -- The variant must belong to the product the customer ordered. Only enforced
    -- when BOTH the requested and the stored product carry a non-empty slug, so
    -- a NULL slug (or a legacy client that doesn't send product_slug) never
    -- fails a valid order — NULL is distinct from every non-NULL value.
    if (v_item->>'product_slug') is not null and (v_item->>'product_slug') <> ''
       and v_product_slug is not null and v_product_slug <> ''
       and v_product_slug is distinct from v_item->>'product_slug' then
      raise exception 'Variant % does not belong to the selected product', v_sku;
    end if;

    if (select stock <= 0 from product_variants where sku = v_sku) then
      raise exception 'Insufficient stock for %', v_sku;
    end if;

    v_unit := case when v_discount > 0 then round(v_listed * (1 - v_discount / 100), 2) else v_listed end;
    v_subtotal := v_subtotal + (v_unit * v_qty);
    v_listed_subtotal := v_listed_subtotal + (v_listed * v_qty);

    update product_variants set stock = stock - v_qty where sku = v_sku;
  end loop;

  insert into orders (
    order_number, user_id, email, phone, status, subtotal, discount_amount,
    shipping_charge, total, payment_method, payment_status, customer_notes,
    shipping_full_name, shipping_city, shipping_province, shipping_address,
    shipping_area, shipping_postal
  ) values (
    v_order_number, v_user_id,
    p_payload->>'email', p_payload->>'phone',
    'pending'::order_status,
    v_subtotal, round(v_listed_subtotal * (v_discount / 100), 2),
    v_shipping, v_subtotal + v_shipping,
    coalesce(p_payload->>'payment_method', 'manual_bank_transfer')::payment_method,
    'unpaid'::payment_status,
    p_payload->>'customer_notes',
    p_payload->>'shipping_full_name',
    p_payload->>'shipping_city',
    p_payload->>'shipping_province',
    p_payload->>'shipping_address',
    p_payload->>'shipping_area',
    p_payload->>'shipping_postal'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::int;
    select v.listed_price, v.price, v.id
      into v_listed, v_unit, v_variant_id
      from product_variants v where v.sku = v_sku;
    v_unit := case when v_discount > 0 then round(v_listed * (1 - v_discount / 100), 2) else v_listed end;

    insert into order_items (
      order_id, variant_id, product_name, sku, quantity, unit_price, buy_now,
      subtotal, color, model, storage, ram, pta_status, jv_status
    ) values (
      v_order_id,
      v_variant_id,
      coalesce(v_item->>'product_name', ''),
      v_sku,
      v_qty,
      v_unit,
      v_unit,
      round(v_unit * v_qty, 2),
      coalesce(v_item->>'color', ''),
      coalesce(
        nullif(v_item->>'model', ''),
        (select p.model from product_variants v join products p on p.id = v.product_id where v.sku = v_sku)
      ),
      coalesce(
        nullif(v_item->>'storage', ''),
        (select v.storage from product_variants v where v.sku = v_sku)
      ),
      coalesce(
        nullif(v_item->>'ram', ''),
        (select v.ram from product_variants v where v.sku = v_sku)
      ),
      coalesce(
        nullif(v_item->>'pta_status', ''),
        (select v.pta_status from product_variants v where v.sku = v_sku)
      ),
      coalesce(
        nullif(v_item->>'jv_status', ''),
        -- Fallback mirrors the front-end JV detection exactly: a case-insensitive
        -- regex over pta_status + notes, not the separate sim_lock_status column
        -- (whose presence/semantics may differ from what the client displays).
        (select case
           when coalesce(v.pta_status, '') ~* 'jv|sim-locked|carrier-locked'
             or coalesce(v.notes, '') ~* 'jv|sim-locked|carrier-locked'
           then 'JV / SIM-Locked'
         end
         from product_variants v where v.sku = v_sku)
      )
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.place_order_buynow(jsonb) to authenticated;
