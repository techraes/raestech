-- ------------------------------------------------------------
-- 00009_grants.sql
-- Grant API (PostgREST/anon/authenticated) access to the objects the
-- storefront reads and writes. Without these, the site's Supabase calls
-- fail with 403/404 even after the schema tables exist.
-- ------------------------------------------------------------

-- The storefront reads settings through the whitelisted `public_settings` view.
-- It is an RLS-invoker view over `website_settings`, so anon/authenticated must
-- be able to select the underlying rows. We expose a read policy for only the
-- whitelisted keys (mirrors the view's key list).
create policy "settings_public_read" on website_settings
  for select
  using (
    key in (
      'store_name', 'store_tagline', 'currency', 'currency_symbol',
      'domain', 'support_email', 'support_phone', 'whatsapp_number',
      'instagram_url', 'facebook_url', 'tiktok_url',
      'announcement_text', 'primary_color', 'secondary_color',
      'free_shipping_threshold', 'shipping_charge', 'buy_now_discount_percent',
      'instalment_advance_percent', 'instalment_markup_percent',
      'instalment_tenures', 'cod_enabled', 'terms_url', 'privacy_url'
    )
  );

grant select on public_settings to anon, authenticated;

-- Customers manage their own orders (RLS rows are scoped by user_id below).
grant select, insert on orders to authenticated;
grant select, insert on order_items to authenticated;
