-- ============================================================
-- 00010_place_order_buynow.sql
-- Authoritative, atomic buy-now order placement.
--
-- Resolves variants by SKU, validates availability and atomically decrements
-- stock (optimistic concurrency), then inserts the order header and its line
-- items in a single transaction. Because it is `security definer` it runs as
-- the function owner, so it bypasses RLS on orders/order_items but still uses
-- auth.uid() (the real session) as the order owner — a client can never
-- attribute an order to another user.
-- ============================================================

create or replace function public.place_order_buynow(p_payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_user_id uuid := auth.uid();
  v_order_number text := 'ORD-' || upper(substr(md5(clock_timestamp()::text), 1, 10));
  v_discount numeric := coalesce((p_payload->>'discount_percent')::numeric, 0);
  v_shipping numeric := coalesce((p_payload->>'shipping_charge')::numeric, 0);
  v_subtotal numeric := 0;
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

  -- Pass 1: validate every item and atomically reserve stock.
  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::int;

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
  end loop;

  insert into orders (
    order_number, user_id, email, phone, subtotal, discount_amount,
    shipping_charge, total, payment_method, customer_notes
  ) values (
    v_order_number, v_user_id,
    p_payload->>'email', p_payload->>'phone',
    v_subtotal, round(v_subtotal * (v_discount / 100), 2),
    v_shipping, v_subtotal + v_shipping,
    coalesce(p_payload->>'payment_method', 'manual_bank_transfer')::payment_method,
    p_payload->>'customer_notes'
  ) returning id into v_order_id;

  -- Pass 2: write the line items.
  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::int;

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
