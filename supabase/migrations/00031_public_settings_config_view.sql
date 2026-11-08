-- ============================================================
-- 00023_public_settings_config_view.sql
-- ------------------------------------------------------------
-- The client settings store reads from the `public_settings` view, but the
-- view previously exposed only a small whitelist of scalar keys. Admin-saved
-- JSON settings (payment methods, theme, homepage sections, social links, SEO,
-- branding assets and maintenance/announcement toggles) were therefore never
-- loaded back after a refresh/redeploy — the admin Payments screen appeared to
-- save (Badge "Saved") yet the fields returned blank on reload, and checkout
-- could not see the saved bank details.
--
-- This widens the view to include exactly the keys the storefront + admin UI
-- read. Payment/bank details are intentionally customer-facing (shown at
-- checkout), so exposing them through the public view is by design.
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
    'terms_url', 'privacy_url',
    'announcement_enabled', 'maintenance_mode',
    'browser_title', 'default_seo_description', 'favicon_data_url', 'logo_data_url',
    'theme', 'homepage_sections', 'payment_methods', 'social_links', 'seo_analytics'
  );

grant select on public_settings to anon, authenticated;
