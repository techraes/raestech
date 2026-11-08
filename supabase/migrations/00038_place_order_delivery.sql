-- ============================================================
-- 00038_place_order_delivery.sql
-- Persist the delivery address captured at checkout inside the atomic
-- `place_order_buynow` RPC so later profile edits cannot change the original
-- delivery destination. Runs after 00037 adds the columns.
-- ============================================================

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

    select v.listed_price, v.price
      into v_listed, v_unit
      from product_variants v
      where v.sku = v_sku;
    if not found then
      raise exception 'Invalid SKU %', v_sku;
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
    select v.listed_price, v.price into v_listed, v_unit
      from product_variants v where v.sku = v_sku;
    v_unit := case when v_discount > 0 then round(v_listed * (1 - v_discount / 100), 2) else v_listed end;
    insert into order_items (order_id, variant_id, product_name, sku, quantity, unit_price, buy_now, subtotal, color)
    values (
      v_order_id,
      (select id from product_variants where sku = v_sku),
      coalesce(v_item->>'product_name', ''),
      v_sku,
      v_qty,
      v_unit,
      v_unit,
      round(v_unit * v_qty, 2),
      coalesce(v_item->>'color', '')
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.place_order_buynow(jsonb) to authenticated;
