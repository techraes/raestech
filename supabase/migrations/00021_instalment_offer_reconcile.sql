-- ============================================================
-- RAES TECH — Instalment offer resolution & colour tracking
-- ------------------------------------------------------------
-- 1. Adds a nullable `colour` column to instalment_applications so the exact
--    colour chosen on the product page is carried through to the saved
--    application and the payment step (additive; existing rows untouched).
-- 2. Adds `instalment_confirm_offer(p_sku, p_color, p_tenure)` — the
--    authoritative availability + pricing check. It resolves the offer by its
--    canonical SKU (never by label/price/position), validates that the colour is
--    actually offered for that variant, verifies the variant is active and in
--    stock, and recomputes the payable amount from the configured instalment
--    discount, advance and 0% markup rules. The frontend must call this before
--    a customer advances to payment.
-- ============================================================

alter table public.instalment_applications
  add column if not exists colour text;

-- ------------------------------------------------------------
-- `instalment_confirm_offer`
-- ------------------------------------------------------------
create or replace function public.instalment_confirm_offer(
  p_sku text,
  p_color text default '',
  p_tenure integer default 12
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant public.product_variants%rowtype;
  v_product public.products%rowtype;
  v_discount numeric := public.get_setting_num('instalment_discount_percent', 11);
  v_advance numeric := public.get_setting_num('instalment_advance_percent', 20);
  v_markup numeric := public.get_setting_num('instalment_markup_percent', 0);
  v_colors text[] := '{}';
  v_discounted numeric;
  v_total numeric;
  v_advance_amount numeric;
  v_remaining numeric;
  v_monthly numeric;
  v_last numeric;
begin
  if p_tenure is null or p_tenure not in (3, 6, 9, 12) then
    return jsonb_build_object('found', false, 'reason', 'invalid_tenure');
  end if;

  select * into v_variant from public.product_variants where sku = p_sku;
  if not found then
    return jsonb_build_object('found', false, 'reason', 'not_in_catalogue');
  end if;

  if v_variant.is_active is distinct from true then
    return jsonb_build_object('found', true, 'ok', false, 'reason', 'inactive');
  end if;
  if coalesce(v_variant.stock, 0) <= 0 then
    return jsonb_build_object('found', true, 'ok', false, 'reason', 'out_of_stock');
  end if;

  select * into v_product from public.products where id = v_variant.product_id;
  v_colors := coalesce(v_variant.colors, '{}');
  -- If the variant lists colours, the chosen colour must be one of them.
  if array_length(v_colors, 1) > 0 and (p_color is null or p_color = '' or not (p_color = any (v_colors))) then
    return jsonb_build_object('found', true, 'ok', false, 'reason', 'color_unavailable');
  end if;

  v_discounted := round((v_variant.listed_price * (1 - v_discount / 100.0)));
  v_total := round(v_discounted * (1 + v_markup / 100.0));
  v_advance_amount := round((v_total * v_advance) / 100.0);
  v_remaining := v_total - v_advance_amount;
  v_monthly := round((v_remaining / p_tenure) * 100) / 100;
  v_last := round((v_remaining - v_monthly * (p_tenure - 1)) * 100) / 100;

  return jsonb_build_object(
    'found', true,
    'ok', true,
    'variant_id', v_variant.id,
    'product_name', v_product.name,
    'model', v_product.model,
    'storage', v_variant.storage,
    'ram', v_variant.ram,
    'pta_status', v_variant.pta_status,
    'condition_note', v_variant.condition,
    'listed_price', v_variant.listed_price,
    'instalment_total', v_discounted,
    'advance', v_advance_amount,
    'remaining', v_remaining,
    'monthly', v_monthly,
    'total', v_total,
    'last', v_last
  );
end;
$$;

revoke all on function public.instalment_confirm_offer(text, text, integer) from public;
grant execute on function public.instalment_confirm_offer(text, text, integer) to authenticated, anon;

-- ------------------------------------------------------------
-- `check_instalment_offer_coverage(p_skus text[])`
-- Authoritative catalogue-wide coverage check used by the reconciliation
-- pipeline. Returns one row per requested SKU with present/active/in_stock
-- flags so operators can see exactly which storefront offers are missing,
-- inactive or out of stock in the live database.
-- ------------------------------------------------------------
create or replace function public.check_instalment_offer_coverage(p_skus text[])
returns table(sku text, present boolean, is_active boolean, in_stock boolean)
language sql
stable
security definer
set search_path = public
as $$
  select v.sku,
         true,
         coalesce(v.is_active, false),
         coalesce(v.stock, 0) > 0
  from public.product_variants v
  where v.sku = any (p_skus)

  union all

  select s, false, false, false
  from unnest(p_skus) s
  where not exists (
    select 1 from public.product_variants v where v.sku = s
  );
$$;

revoke all on function public.check_instalment_offer_coverage(text[]) from public;
grant execute on function public.check_instalment_offer_coverage(text[]) to anon, authenticated;
