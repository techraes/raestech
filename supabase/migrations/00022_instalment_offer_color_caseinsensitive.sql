-- ============================================================
-- 00022_instalment_offer_color_caseinsensitive.sql
-- ------------------------------------------------------------
-- Hardens `instalment_confirm_offer` so colour matching is
-- case-insensitive and whitespace-tolerant.
--
-- The storefront now sends the canonical stored label, and a DB row
-- stored with different casing (e.g. "black" vs "Black") must not
-- reject a genuinely available selection. Genuine availability checks
-- (active / stock) and pricing are unchanged — this is purely a
-- matching-normalisation fix, it never invents availability.
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
  v_color_match boolean := false;
  v_color_match_count int := 0;
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
  -- If the variant lists colours, the chosen colour must be one of them,
  -- matched case-insensitively (trimmed). Availability is still enforced.
  if array_length(v_colors, 1) > 0 then
    if p_color is null or p_color = '' then
      v_color_match := false;
    else
      select count(*) into v_color_match_count
      from unnest(v_colors) c
      where lower(trim(c)) = lower(trim(p_color));
      v_color_match := v_color_match_count > 0;
    end if;
    if not v_color_match then
      return jsonb_build_object('found', true, 'ok', false, 'reason', 'color_unavailable');
    end if;
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
