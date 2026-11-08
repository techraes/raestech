-- ============================================================
-- 00026_live_catalog_seed.sql
-- ------------------------------------------------------------
-- Seeds the Apple iPhone 17 family into the live `products` /
-- `product_variants` tables so the server-side instalment confirmation RPC
-- (and order validation) can resolve these SKUs. The storefront renders from
-- the client catalog seed; this DB seed keeps server-side validation in sync.
--
-- Matches the LIVE schema (products has `category_id`, no `category` column;
-- product_variants enforces `listed_price <= buy_now_price OR buy_now_price=0`,
-- so `buy_now_price` is stored equal to `listed_price` — it is not read by the
-- order/instalment RPCs, which compute prices from `listed_price` + settings).
-- Idempotent: ON CONFLICT DO NOTHING.

insert into brands (name, slug) values ('Apple', 'apple')
on conflict (slug) do nothing;

insert into products (slug, brand_id, category_id, name, model, description, status)
select 'apple-iphone-17', id, null, 'Apple iPhone 17', 'iPhone 17',
       'Apple iPhone 17 — 5G, 6.3 OLED 120Hz (reported), A19.', 'active'
from brands where slug = 'apple'
on conflict (slug) do nothing;

insert into product_variants
  (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
select id, 'RT-00143', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 399000, 399000, 399000, 1, false, true
from products where slug = 'apple-iphone-17'
on conflict (sku) do nothing;

insert into product_variants
  (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
select id, 'RT-00144', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 295000, 295000, 295000, 1, false, true
from products where slug = 'apple-iphone-17'
on conflict (sku) do nothing;

insert into product_variants
  (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
select id, 'RT-00145', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 482500, 482500, 482500, 1, false, true
from products where slug = 'apple-iphone-17'
on conflict (sku) do nothing;

insert into product_variants
  (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
select id, 'RT-00146', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 348000, 348000, 348000, 1, false, true
from products where slug = 'apple-iphone-17'
on conflict (sku) do nothing;
