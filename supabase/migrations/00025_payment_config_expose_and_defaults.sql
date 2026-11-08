-- ============================================================
-- 00025_payment_config_expose_and_defaults.sql
-- ------------------------------------------------------------
-- 1. Exposes the admin-saved JSON settings (payment methods, theme, homepage,
--    social, SEO, announcements) through the `public_settings` view so the
--    storefront and admin UI read the same persisted configuration after a
--    refresh/redeploy.
--
-- 2. Payment methods are returned through a role-aware, sanitized projection:
--      - Admins (server-side `is_admin()`) receive the complete configuration
--        so the Payments admin page can edit gateway/QR fields.
--      - Everyone else (anon + customers) receives ONLY enabled, customer-facing
--        methods with just the transfer details needed to pay. Disabled methods
--        and online-gateway secrets (card processor, merchant id, wallet
--        address, QR payload, test/live/verified flags) are removed.
--
-- NOTE: No live bank account / IBAN values are committed here. The initial
-- Faysal Bank defaults live in application code (src/features/settings/store.tsx,
-- DEFAULT_PAYMENT_METHODS) and are persisted on the admin's first save.

create or replace function public.public_payment_methods_value()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v text;
  parsed jsonb;
  out_json jsonb;
begin
  select s.value into v from public.website_settings s where s.key = 'payment_methods' limit 1;
  if v is null or btrim(v) = '' then
    return null;
  end if;

  begin
    parsed := v::jsonb;
    if jsonb_typeof(parsed) <> 'array' then
      return null;
    end if;
  exception when others then
    return null;
  end;

  -- Admins manage the full payment configuration (gateway/QR fields).
  if coalesce(public.is_admin(), false) then
    return v;
  end if;

  -- Non-admins: only enabled, customer-facing methods with transfer fields.
  begin
    select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', m->>'id',
          'code', m->>'code',
          'name', m->>'name',
          'enabled', (m->>'enabled')::boolean,
          'type', m->>'type',
          'kind', m->>'kind',
          'displayOrder', (m->>'displayOrder')::int,
          'customerDescription', m->>'customerDescription',
          'bankName', m->>'bankName',
          'accountTitle', m->>'accountTitle',
          'accountNumber', m->>'accountNumber',
          'iban', m->>'iban',
          'branch', m->>'branch',
          'instructions', m->>'instructions',
          'network', m->>'network',
          'coinSymbol', m->>'coinSymbol'
        )
      ), '[]'::jsonb)
      into out_json
    from jsonb_array_elements(parsed) m
    where (m->>'enabled')::boolean = true;
  exception when others then
    return null;
  end;

  return out_json::text;
end;
$$;

create or replace view public_settings as
  select s.key,
         case
           when s.key = 'payment_methods' then public.public_payment_methods_value()
           else s.value
         end as value,
         s.value_kind
  from public.website_settings s
  where s.key in (
    'store_name', 'store_tagline', 'currency', 'currency_symbol',
    'domain', 'support_email', 'support_phone', 'whatsapp_number',
    'instagram_url', 'facebook_url', 'tiktok_url',
    'announcement_text', 'primary_color', 'secondary_color',
    'free_shipping_threshold', 'shipping_charge', 'buy_now_discount_percent',
    'instalment_discount_percent', 'instalment_advance_percent',
    'instalment_markup_percent', 'instalment_tenures', 'cod_enabled',
    'terms_url', 'privacy_url',
    'announcement_enabled', 'maintenance_mode',
    'browser_title', 'default_seo_description', 'favicon_data_url', 'logo_data_url',
    'theme', 'homepage_sections', 'payment_methods', 'social_links', 'seo_analytics'
  );

grant select on public_settings to anon, authenticated;
