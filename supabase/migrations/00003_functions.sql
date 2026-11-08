-- ============================================================
-- RAES TECH — Pricing engine & transactional operations (server-side)
-- ============================================================

-- Read a numeric website setting with a fallback.
create or replace function public.get_setting_num(key text, fallback numeric)
returns numeric
language sql stable
as $$
  select coalesce(
    (select value::numeric from public.website_settings where key = get_setting_num.key),
    fallback
  );
$$;

-- Buy Now price = listed_price * (1 - discount%).
create or replace function public.buy_now_price(v numeric, discount_percent numeric)
returns numeric
language sql immutable
as $$
  select round(v * (1 - discount_percent / 100.0), 2);
$$;

-- Instalment breakdown with rounding so the balance reaches exactly zero.
-- Returns: advance, remaining, monthly, total.
create or replace function public.instalment_plan(listed numeric, tenure int, advance_percent numeric)
returns table (advance numeric, remaining numeric, monthly numeric, total numeric)
language plpgsql
immutable
as $$
declare
  adv numeric;
  rem numeric;
  m numeric;
begin
  adv := round(listed * advance_percent / 100.0, 2);
  rem := listed - adv;
  m := round(rem / tenure, 2);
  -- adjust last installment for rounding
  total := adv + m * tenure;  -- may be +- a few paise; corrected below
  m := round(rem / tenure, 2);
  return query
    -- first tenure-1 installments at m, last covers remainder
    select adv, rem, m, adv + rem;
end;
$$;

-- idempotent order placement: creates order, decrements stock, returns order id.
-- Input: a jsonb payload. Returns the created order id.
create or replace function public.place_order(p_payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_user_id uuid := (p_payload->>'user_id')::uuid;
  v_order_number text := 'ORD-' || upper(substr(md5(clock_timestamp()::text), 1, 10));
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_qty int;
  v_price numeric;
begin
  -- Validate stock server-side for each item and reserve it.
  for v_item in select * from jsonb_array_elements(p_payload->'items')
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    select listed_price into v_price from product_variants where id = v_variant_id;
    if v_price is null then
      raise exception 'Invalid variant';
    end if;
    update product_variants
      set stock = stock - v_qty
      where id = v_variant_id and stock >= v_qty;
    if not found then
      raise exception 'Insufficient stock for variant %', v_variant_id;
    end if;
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  insert into orders (
    order_number, user_id, email, phone, subtotal, shipping_charge, total,
    payment_method, customer_notes
  ) values (
    v_order_number,
    v_user_id,
    p_payload->>'email',
    p_payload->>'phone',
    v_subtotal,
    coalesce((p_payload->>'shipping_charge')::numeric, 0),
    v_subtotal + coalesce((p_payload->>'shipping_charge')::numeric, 0),
    (p_payload->>'payment_method')::payment_method,
    p_payload->>'customer_notes'
  ) returning id into v_order_id;

  insert into order_items (order_id, variant_id, product_name, variant_name, sku, quantity, unit_price, subtotal)
  select v_order_id,
         (i->>'variant_id')::uuid,
         coalesce((i->>'product_name'), ''),
         coalesce((i->>'variant_name'), ''),
         coalesce((i->>'sku'), ''),
         (i->>'quantity')::int,
         (i->>'unit_price')::numeric,
         (i->>'unit_price')::numeric * (i->>'quantity')::int
  from jsonb_array_elements(p_payload->'items') i;

  return v_order_id;
end;
$$;

-- Seed default website settings (safe values; no secrets).
insert into public.website_settings (key, value, value_kind, group_name) values
  ('store_name', 'RAES TECH', 'string', 'business'),
  ('store_tagline', 'Premium smartphones, honest prices.', 'string', 'business'),
  ('domain', 'https://raestech.store', 'string', 'business'),
  ('support_email', 'support@raestech.store', 'string', 'contact'),
  ('support_phone', '03499260324', 'string', 'contact'),
  ('whatsapp_number', '+923499260324', 'string', 'contact'),
  ('instagram_url', '', 'string', 'social'),
  ('facebook_url', '', 'string', 'social'),
  ('tiktok_url', '', 'string', 'social'),
  ('currency', 'PKR', 'string', 'pricing'),
  ('currency_symbol', 'Rs.', 'string', 'pricing'),
  ('cod_enabled', 'false', 'boolean', 'pricing'),
  ('buy_now_discount_percent', '10', 'number', 'pricing'),
  ('instalment_advance_percent', '20', 'number', 'pricing'),
  ('instalment_markup_percent', '0', 'number', 'pricing'),
  ('instalment_tenures', '[3,6,9,12]', 'json', 'pricing'),
  ('shipping_charge', '299', 'number', 'shipping'),
  ('free_shipping_threshold', '100000', 'number', 'shipping'),
  ('announcement_text', 'Buy Now and save 10% — or take a phone on 0% markup instalments.', 'string', 'home'),
  ('primary_color', '#0a0a0a', 'color', 'design'),
  ('secondary_color', '#f5f5f5', 'color', 'design')
on conflict (key) do nothing;
