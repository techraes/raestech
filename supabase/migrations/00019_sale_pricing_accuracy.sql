-- ============================================================
-- 00019_sale_pricing_accuracy.sql
-- 11.11 Sale pricing accuracy.
--
-- 1. Sets the Buy-now discount default to 22% (the 11.11 sale prepaid rate).
-- 2. Redefines `place_order_buynow` to compute the discount amount from the
--    *listed* (pre-discount) total so the stored discount reflects the true
--    saving (e.g. 22% of the listed price for Buy Now), instead of deriving it
--    from the already-discounted subtotal.
--
-- Cash on Delivery is intentionally NOT added to the `payment_method` enum —
-- the store does not offer COD.
-- ============================================================

insert into public.website_settings (key, value, value_kind, group_name)
values
  ('buy_now_discount_percent', '22', 'number', 'pricing'),
  ('instalment_discount_percent', '11', 'number', 'pricing')
on conflict (key) do update
  set value = excluded.value, value_kind = excluded.value_kind, group_name = excluded.group_name;

create or replace function public.place_order_buynow(p_payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_user_id uuid := auth.uid();
  v_order_number text := 'ORD-' || upper(substr(md5(clock_timestamp()::text), 1, 10));
  -- The Buy-now discount is authoritative server-side: it is read from the
  -- managed `buy_now_discount_percent` setting (edited via Discount Management),
  -- never trusted from the client payload. This prevents a client from
  -- supplying an arbitrary discount_percent to inflate a discount.
  v_discount numeric := coalesce(
    (select value::numeric from public.website_settings where key = 'buy_now_discount_percent'),
    0
  );
  v_shipping numeric := coalesce((p_payload->>'shipping_charge')::numeric, 0);
  v_subtotal numeric := 0;
  v_listed_subtotal numeric := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_sku text;
  v_qty int;
  v_listed numeric;
  v_unit numeric;
begin
  if v_user_id is null then
    raise exception 'Must be authenticated to place an order';
  end if;

  if v_discount < 0 or v_discount > 100 then
    raise exception 'discount_percent must be between 0 and 100';
  end if;

  -- Pass 1: validate every item and atomically reserve stock.
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

    select id, listed_price into v_variant_id, v_listed
      from product_variants
     where sku = v_sku;

    if v_variant_id is null then
      raise exception 'Invalid SKU %', v_sku;
    end if;

    -- Optimistic concurrency: only reserve when enough stock remains.
    update product_variants
       set stock = stock - v_qty
     where id = v_variant_id and stock >= v_qty;

    if not found then
      raise exception 'Insufficient stock for %', v_sku;
    end if;

    v_unit := case when v_discount > 0 then round(v_listed * (1 - v_discount / 100), 2) else v_listed end;
    v_subtotal := v_subtotal + (v_unit * v_qty);
    v_listed_subtotal := v_listed_subtotal + (v_listed * v_qty);
  end loop;

  insert into orders (
    order_number, user_id, email, phone, status, subtotal, discount_amount,
    shipping_charge, total, payment_method, payment_status, customer_notes
  ) values (
    v_order_number, v_user_id,
    p_payload->>'email', p_payload->>'phone',
    'pending'::order_status,
    v_subtotal, round(v_listed_subtotal * (v_discount / 100), 2),
    v_shipping, v_subtotal + v_shipping,
    coalesce(p_payload->>'payment_method', 'manual_bank_transfer')::payment_method,
    'unpaid'::payment_status,
    p_payload->>'customer_notes'
  ) returning id into v_order_id;

  -- Pass 2: write the line items.
  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::int;

    if coalesce(v_qty, 0) <= 0 then
      raise exception 'Quantity must be positive';
    end if;

    select listed_price into v_listed from product_variants where sku = v_sku;
    v_unit := case when v_discount > 0 then round(v_listed * (1 - v_discount / 100), 2) else v_listed end;

    insert into order_items (order_id, variant_id, product_name, sku, quantity, unit_price, buy_now, subtotal)
    values (
      v_order_id,
      (select id from product_variants where sku = v_sku),
      coalesce(v_item->>'product_name', ''),
      v_sku,
      v_qty,
      v_unit,
      v_unit,
      round(v_unit * v_qty, 2)
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.place_order_buynow(jsonb) to authenticated;
