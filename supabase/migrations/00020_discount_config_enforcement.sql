-- ============================================================
-- 00020_discount_config_enforcement.sql
-- Server-side enforcement of Discount Management.
--
-- 1. Exposes `instalment_discount_percent` through the `public_settings` view
--    so the storefront client shares the same dynamic sale rate as the server.
-- 2. Restricts writes to the discount/pricing configuration keys to the
--    **Super Admin** via RLS. Previously the broad `settings_admin_all`
--    policy let any admin write every settings row, so a non-superadmin (or a
--    direct client call) could change discount percentages and shipping.
-- 3. Adds a SECURITY DEFINER RPC `upsert_discount_config` that only a Super
--    Admin may call. The Discount Management dashboard saves through it.
-- ============================================================

-- Keys that are considered sensitive pricing/discount configuration.
create or replace function public.discount_setting_keys()
returns text[]
language sql stable
as $$
  select array[
    'buy_now_discount_percent', 'instalment_discount_percent',
    'instalment_advance_percent', 'instalment_markup_percent',
    'instalment_tenures', 'shipping_charge', 'free_shipping_threshold'
  ]::text[];
$$;

-- Public safe settings view — include the instalment discount rate.
create or replace view public_settings as
  select key, value, value_kind
  from public.website_settings
  where key in (
    'store_name', 'store_tagline', 'currency', 'currency_symbol',
    'domain', 'support_email', 'support_phone', 'whatsapp_number',
    'instagram_url', 'facebook_url', 'tiktok_url',
    'announcement_text', 'primary_color', 'secondary_color',
    'free_shipping_threshold', 'shipping_charge', 'buy_now_discount_percent',
    'instalment_discount_percent', 'instalment_advance_percent',
    'instalment_markup_percent', 'instalment_tenures', 'cod_enabled',
    'terms_url', 'privacy_url'
  );

-- RLS: general admins manage everything EXCEPT the discount keys.
drop policy if exists "settings_admin_all" on website_settings;
create policy "settings_admin_all"
  on website_settings for all
  using (public.is_admin() and not (key = any (public.discount_setting_keys())))
  with check (public.is_admin() and not (key = any (public.discount_setting_keys())));

-- RLS: only the Super Admin can write the discount keys.
drop policy if exists "discount_settings_superadmin" on website_settings;
create policy "discount_settings_superadmin"
  on website_settings for all
  using (public.is_super_admin() and (key = any (public.discount_setting_keys())))
  with check (public.is_super_admin() and (key = any (public.discount_setting_keys())));

-- SECURITY DEFINER RPC the Discount Management dashboard calls. Only a Super
-- Admin may use it; it whitelists the managed keys and upserts them.
create or replace function public.upsert_discount_config(p_settings jsonb)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_key text;
  v_value text;
  v_kind text;
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can update discount configuration';
  end if;

  for v_key, v_value in
    select key, value from jsonb_each_text(p_settings)
  loop
    if not (v_key = any (public.discount_setting_keys())) then
      raise exception 'Key % is not a managed discount setting', v_key;
    end if;

    v_kind := case
      when v_key = 'instalment_tenures' then 'json'
      else 'number'
    end;

    insert into public.website_settings (key, value, value_kind, group_name)
    values (v_key, v_value, v_kind::setting_value_kind, 'pricing')
    on conflict (key) do update
      set value = excluded.value, value_kind = excluded.value_kind;
  end loop;
end;
$$;

grant execute on function public.upsert_discount_config(jsonb) to authenticated;
