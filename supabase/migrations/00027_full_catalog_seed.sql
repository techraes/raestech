-- Generated from src/data/catalog_seed.json -> matches the LIVE schema.
-- Idempotent: ON CONFLICT DO NOTHING. buy_now_price stored = listed_price to
-- satisfy product_variants check (listed_price <= buy_now_price OR buy_now_price=0);
-- buy_now_price is not read by the order/instalment RPCs.

insert into brands (name, slug) values ('Apple', 'apple') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Google', 'google') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Samsung', 'samsung') on conflict (slug) do nothing;
insert into brands (name, slug) values ('OPPO', 'oppo') on conflict (slug) do nothing;
insert into brands (name, slug) values ('realme', 'realme') on conflict (slug) do nothing;
insert into brands (name, slug) values ('vivo', 'vivo') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Infinix', 'infinix') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Tecno', 'tecno') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Xiaomi', 'xiaomi') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Honor', 'honor') on conflict (slug) do nothing;
insert into brands (name, slug) values ('itel', 'itel') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Nothing', 'nothing') on conflict (slug) do nothing;
insert into brands (name, slug) values ('Motorola', 'motorola') on conflict (slug) do nothing;

insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-12-mini', id, null, 'Apple iPhone 12 mini', 'iPhone 12 mini', 'Apple iPhone 12 mini — 5G, 5.4 OLED 60Hz, A14 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00001', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 81000, 81000, 81000, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00002', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 50500, 50500, 50500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00366', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 45500, 45500, 45500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00003', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 89000, 89000, 89000, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00004', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 55500, 55500, 55500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00367', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 50000, 50000, 50000, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00005', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 98500, 98500, 98500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00006', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 61500, 61500, 61500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00368', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 55500, 55500, 55500, 1, false, true from products where slug = 'apple-iphone-12-mini'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-12', id, null, 'Apple iPhone 12', 'iPhone 12', 'Apple iPhone 12 — 5G, 6.1 OLED 60Hz, A14 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00007', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 85000, 85000, 85000, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00008', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 51500, 51500, 51500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00369', '64GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 46500, 46500, 46500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00009', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 93500, 93500, 93500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00010', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 56500, 56500, 56500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00370', '128GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 51000, 51000, 51000, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00011', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 103500, 103500, 103500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00012', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 63000, 63000, 63000, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00371', '256GB', '4GB', ARRAY['Black','White','Red','Green','Blue','Purple']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 56500, 56500, 56500, 1, false, true from products where slug = 'apple-iphone-12'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-12-pro', id, null, 'Apple iPhone 12 Pro', 'iPhone 12 Pro', 'Apple iPhone 12 Pro — 5G, 6.1 OLED 60Hz, A14 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00013', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 116000, 116000, 116000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00014', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 80000, 80000, 80000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00372', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 72000, 72000, 72000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00015', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 127500, 127500, 127500, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00016', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 88000, 88000, 88000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00373', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 79000, 79000, 79000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00017', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 141500, 141500, 141500, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00018', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 97500, 97500, 97500, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00374', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 88000, 88000, 88000, 1, false, true from products where slug = 'apple-iphone-12-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-12-pro-max', id, null, 'Apple iPhone 12 Pro Max', 'iPhone 12 Pro Max', 'Apple iPhone 12 Pro Max — 5G, 6.7 OLED 60Hz, A14 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00019', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 114500, 114500, 114500, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00020', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 95500, 95500, 95500, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00375', '128GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 86000, 86000, 86000, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00021', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 126000, 126000, 126000, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00022', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 105000, 105000, 105000, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00376', '256GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 94500, 94500, 94500, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00023', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 140000, 140000, 140000, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00024', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 116500, 116500, 116500, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00377', '512GB', '6GB', ARRAY['Silver','Graphite','Gold','Pacific Blue']::text[], '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 105000, 105000, 105000, 1, false, true from products where slug = 'apple-iphone-12-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-13-mini', id, null, 'Apple iPhone 13 mini', 'iPhone 13 mini', 'Apple iPhone 13 mini — 5G, 5.4 OLED 60Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00025', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 90000, 90000, 90000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00026', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 58000, 58000, 58000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00378', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 52000, 52000, 52000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00027', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 99000, 99000, 99000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00028', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 64000, 64000, 64000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00379', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 57500, 57500, 57500, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00029', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 109500, 109500, 109500, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00030', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 71000, 71000, 71000, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00380', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 63500, 63500, 63500, 1, false, true from products where slug = 'apple-iphone-13-mini'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-13', id, null, 'Apple iPhone 13', 'iPhone 13', 'Apple iPhone 13 — 5G, 6.1 OLED 60Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00031', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 112000, 112000, 112000, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00032', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 66000, 66000, 66000, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00381', '128GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 59500, 59500, 59500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00033', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 123500, 123500, 123500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00034', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 72500, 72500, 72500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00382', '256GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 65500, 65500, 65500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00035', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 137000, 137000, 137000, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00036', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 80500, 80500, 80500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00383', '512GB', '4GB', ARRAY['Pink','Blue','Midnight','Starlight','Red','Green']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 72500, 72500, 72500, 1, false, true from products where slug = 'apple-iphone-13'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-13-pro', id, null, 'Apple iPhone 13 Pro', 'iPhone 13 Pro', 'Apple iPhone 13 Pro — 5G, 6.1 OLED 120Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00037', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 137000, 137000, 137000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00038', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 105500, 105500, 105500, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00384', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 95000, 95000, 95000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00039', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 151000, 151000, 151000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00040', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 116000, 116000, 116000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00385', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 104500, 104500, 104500, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00041', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 167500, 167500, 167500, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00042', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 128500, 128500, 128500, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00386', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 116000, 116000, 116000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00043', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 184000, 184000, 184000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00044', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 141500, 141500, 141500, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00387', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-13-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-13-pro-max', id, null, 'Apple iPhone 13 Pro Max', 'iPhone 13 Pro Max', 'Apple iPhone 13 Pro Max — 5G, 6.7 OLED 120Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00045', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 171500, 171500, 171500, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00046', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 132000, 132000, 132000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00388', '128GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 119000, 119000, 119000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00047', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 189000, 189000, 189000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00048', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 145000, 145000, 145000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00389', '256GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 130500, 130500, 130500, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00049', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 209500, 209500, 209500, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00050', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 161000, 161000, 161000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00390', '512GB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 145000, 145000, 145000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00051', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 230000, 230000, 230000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00052', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 177000, 177000, 177000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00391', '1TB', '6GB', ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green']::text[], '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 159000, 159000, 159000, 1, false, true from products where slug = 'apple-iphone-13-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-14', id, null, 'Apple iPhone 14', 'iPhone 14', 'Apple iPhone 14 — 5G, 6.1 OLED 60Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00053', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 124000, 124000, 124000, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00054', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 95500, 95500, 95500, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00392', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 86000, 86000, 86000, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00055', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 136500, 136500, 136500, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00056', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 105000, 105000, 105000, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00393', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 94500, 94500, 94500, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00057', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 151500, 151500, 151500, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00058', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 116500, 116500, 116500, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00394', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 105000, 105000, 105000, 1, false, true from products where slug = 'apple-iphone-14'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-14-plus', id, null, 'Apple iPhone 14 Plus', 'iPhone 14 Plus', 'Apple iPhone 14 Plus — 5G, 6.7 OLED 60Hz, A15 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00059', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 104000, 104000, 104000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00060', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 80000, 80000, 80000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00395', '128GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 72000, 72000, 72000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00061', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 114500, 114500, 114500, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00062', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 88000, 88000, 88000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00396', '256GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 79000, 79000, 79000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00063', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00064', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 97500, 97500, 97500, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00397', '512GB', '6GB', ARRAY['Midnight','Purple','Starlight','Blue','Yellow','Red']::text[], '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 88000, 88000, 88000, 1, false, true from products where slug = 'apple-iphone-14-plus'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-14-pro', id, null, 'Apple iPhone 14 Pro', 'iPhone 14 Pro', 'Apple iPhone 14 Pro — 5G, 6.1 OLED 120Hz, A16 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00065', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 154000, 154000, 154000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00066', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 110000, 110000, 110000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00398', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 99000, 99000, 99000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00067', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 169500, 169500, 169500, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00068', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 121000, 121000, 121000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00399', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 109000, 109000, 109000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00069', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 188000, 188000, 188000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00070', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 134000, 134000, 134000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00400', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 121000, 121000, 121000, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00071', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 206500, 206500, 206500, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00072', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 147500, 147500, 147500, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00401', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 132500, 132500, 132500, 1, false, true from products where slug = 'apple-iphone-14-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-14-pro-max', id, null, 'Apple iPhone 14 Pro Max', 'iPhone 14 Pro Max', 'Apple iPhone 14 Pro Max — 5G, 6.7 OLED 120Hz, A16 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00073', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 209000, 209000, 209000, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00074', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 144000, 144000, 144000, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00402', '128GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 129500, 129500, 129500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00075', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 229500, 229500, 229500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00076', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 158500, 158500, 158500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00403', '256GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 142500, 142500, 142500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00077', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 254500, 254500, 254500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00078', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 175500, 175500, 175500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00404', '512GB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 158000, 158000, 158000, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00079', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 280000, 280000, 280000, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00080', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 193000, 193000, 193000, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00405', '1TB', '6GB', ARRAY['Space Black','Silver','Gold','Deep Purple']::text[], '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 173500, 173500, 173500, 1, false, true from products where slug = 'apple-iphone-14-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-15', id, null, 'Apple iPhone 15', 'iPhone 15', 'Apple iPhone 15 — 5G, 6.1 OLED 60Hz Dynamic Island, A16 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00081', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 172000, 172000, 172000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00082', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 123000, 123000, 123000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00406', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 110500, 110500, 110500, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00083', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 189500, 189500, 189500, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00084', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 135500, 135500, 135500, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00407', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 122000, 122000, 122000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00085', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 210000, 210000, 210000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00086', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 150000, 150000, 150000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00408', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 135000, 135000, 135000, 1, false, true from products where slug = 'apple-iphone-15'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-15-plus', id, null, 'Apple iPhone 15 Plus', 'iPhone 15 Plus', 'Apple iPhone 15 Plus — 5G, 6.7 OLED 60Hz Dynamic Island, A16 Bionic. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00087', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 156000, 156000, 156000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00088', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 115500, 115500, 115500, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00409', '128GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 104000, 104000, 104000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00089', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 171500, 171500, 171500, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00090', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00410', '256GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 114500, 114500, 114500, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00091', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 190000, 190000, 190000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00092', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 141000, 141000, 141000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00411', '512GB', '6GB', ARRAY['Black','Blue','Green','Yellow','Pink']::text[], '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-15-plus'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-15-pro', id, null, 'Apple iPhone 15 Pro', 'iPhone 15 Pro', 'Apple iPhone 15 Pro — 5G, 6.1 OLED 120Hz, A17 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00093', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 200000, 200000, 200000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00094', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 148000, 148000, 148000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00412', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 133000, 133000, 133000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00095', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 220000, 220000, 220000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00096', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 163000, 163000, 163000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00413', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 146500, 146500, 146500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00097', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 244000, 244000, 244000, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00098', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 180500, 180500, 180500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00414', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 162500, 162500, 162500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00099', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 267500, 267500, 267500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00100', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 198500, 198500, 198500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00415', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 178500, 178500, 178500, 1, false, true from products where slug = 'apple-iphone-15-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-15-pro-max', id, null, 'Apple iPhone 15 Pro Max', 'iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max — 5G, 6.7 OLED 120Hz, A17 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00101', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 245500, 245500, 245500, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00102', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 175500, 175500, 175500, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00416', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 158000, 158000, 158000, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00103', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 275000, 275000, 275000, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00104', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 196500, 196500, 196500, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00417', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 177000, 177000, 177000, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00105', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 309500, 309500, 309500, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00106', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 221000, 221000, 221000, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00418', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Blue Titanium','Natural Titanium']::text[], '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 199000, 199000, 199000, 1, false, true from products where slug = 'apple-iphone-15-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-16e', id, null, 'Apple iPhone 16e', 'iPhone 16e', 'Apple iPhone 16e — 5G, 6.1 OLED 60Hz, A18. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00107', '128GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 150000, 150000, 150000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00108', '128GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 115500, 115500, 115500, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00419', '128GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 104000, 104000, 104000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00109', '256GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 165000, 165000, 165000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00110', '256GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00420', '256GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 114500, 114500, 114500, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00111', '512GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 183000, 183000, 183000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00112', '512GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 141000, 141000, 141000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00421', '512GB', '8GB', ARRAY['Black','White']::text[], '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 127000, 127000, 127000, 1, false, true from products where slug = 'apple-iphone-16e'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-16', id, null, 'Apple iPhone 16', 'iPhone 16', 'Apple iPhone 16 — 5G, 6.1 OLED 60Hz, A18. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00113', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 177000, 177000, 177000, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00114', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 136000, 136000, 136000, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00422', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 122500, 122500, 122500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00115', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 194500, 194500, 194500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00116', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 149500, 149500, 149500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00423', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 134500, 134500, 134500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00117', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 215500, 215500, 215500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00118', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 166000, 166000, 166000, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00424', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 149500, 149500, 149500, 1, false, true from products where slug = 'apple-iphone-16'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-16-plus', id, null, 'Apple iPhone 16 Plus', 'iPhone 16 Plus', 'Apple iPhone 16 Plus — 5G, 6.7 OLED 60Hz, A18. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00119', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 221000, 221000, 221000, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00120', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 170000, 170000, 170000, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00425', '128GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 153000, 153000, 153000, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00121', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 243000, 243000, 243000, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00122', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 187000, 187000, 187000, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00426', '256GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 168500, 168500, 168500, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00123', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 269500, 269500, 269500, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00124', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 207500, 207500, 207500, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00427', '512GB', '8GB', ARRAY['Black','White','Pink','Teal','Ultramarine']::text[], '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 186500, 186500, 186500, 1, false, true from products where slug = 'apple-iphone-16-plus'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-16-pro', id, null, 'Apple iPhone 16 Pro', 'iPhone 16 Pro', 'Apple iPhone 16 Pro — 5G, 6.3 OLED 120Hz, A18 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00125', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 227000, 227000, 227000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00126', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 174500, 174500, 174500, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00428', '128GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 157000, 157000, 157000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00127', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 249500, 249500, 249500, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00128', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 192000, 192000, 192000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00429', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 173000, 173000, 173000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00129', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 277000, 277000, 277000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00130', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 213000, 213000, 213000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00430', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 191500, 191500, 191500, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00131', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 304000, 304000, 304000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00132', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 234000, 234000, 234000, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00431', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 210500, 210500, 210500, 1, false, true from products where slug = 'apple-iphone-16-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-16-pro-max', id, null, 'Apple iPhone 16 Pro Max', 'iPhone 16 Pro Max', 'Apple iPhone 16 Pro Max — 5G, 6.9 OLED 120Hz, A18 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00133', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 358000, 358000, 358000, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00134', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 275500, 275500, 275500, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00432', '256GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 248000, 248000, 248000, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00135', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 401000, 401000, 401000, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00136', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 308500, 308500, 308500, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00433', '512GB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 277500, 277500, 277500, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00137', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'used', 451500, 451500, 451500, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00138', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'used', 347000, 347000, 347000, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00434', '1TB', '8GB', ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium']::text[], '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'used', 312500, 312500, 312500, 1, false, true from products where slug = 'apple-iphone-16-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-17e', id, null, 'Apple iPhone 17e', 'iPhone 17e', 'Apple iPhone 17e — 5G, Specs and colors require exact manufacturer SKU verification, A19 family (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00139', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Confirm official Pakistan colorways']::text[], 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'PTA Registered', 'used', 284999, 284999, 284999, 1, false, true from products where slug = 'apple-iphone-17e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00140', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Confirm official Pakistan colorways']::text[], 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 222000, 222000, 222000, 1, false, true from products where slug = 'apple-iphone-17e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00141', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Confirm official Pakistan colorways']::text[], 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'PTA Registered', 'used', 329999, 329999, 329999, 1, false, true from products where slug = 'apple-iphone-17e'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00142', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Confirm official Pakistan colorways']::text[], 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 257000, 257000, 257000, 1, false, true from products where slug = 'apple-iphone-17e'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-17', id, null, 'Apple iPhone 17', 'iPhone 17', 'Apple iPhone 17 — 5G, 6.3 OLED 120Hz (reported), A19. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00143', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 399000, 399000, 399000, 1, false, true from products where slug = 'apple-iphone-17'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00144', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 295000, 295000, 295000, 1, false, true from products where slug = 'apple-iphone-17'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00145', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 482500, 482500, 482500, 1, false, true from products where slug = 'apple-iphone-17'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00146', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Black','White','Mist Blue','Sage','Lavender (regional SKU verify)']::text[], '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 348000, 348000, 348000, 1, false, true from products where slug = 'apple-iphone-17'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-17-air', id, null, 'Apple iPhone 17 Air', 'iPhone 17 Air', 'Apple iPhone 17 Air — 5G, 6.5 OLED 120Hz (reported), A19 Pro family (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00147', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 428500, 428500, 428500, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00148', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 345000, 345000, 345000, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00149', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 508500, 508500, 508500, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00150', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 407000, 407000, 407000, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00151', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 588500, 588500, 588500, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00152', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Sky Blue','Light Gold','Cloud White','Space Black (verify)']::text[], '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 469000, 469000, 469000, 1, false, true from products where slug = 'apple-iphone-17-air'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-17-pro', id, null, 'Apple iPhone 17 Pro', 'iPhone 17 Pro', 'Apple iPhone 17 Pro — 5G, 6.3 OLED 120Hz, A19 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00153', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 491100, 491100, 491100, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00154', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 375000, 375000, 375000, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00155', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 574100, 574100, 574100, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00156', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 442000, 442000, 442000, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00157', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 657100, 657100, 657100, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00158', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 510000, 510000, 510000, 1, false, true from products where slug = 'apple-iphone-17-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-17-pro-max', id, null, 'Apple iPhone 17 Pro Max', 'iPhone 17 Pro Max', 'Apple iPhone 17 Pro Max — 5G, 6.9 OLED 120Hz, A19 Pro. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00159', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 535600, 535600, 535600, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00160', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 246000, 246000, 246000, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00161', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 619100, 619100, 619100, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00162', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 290000, 290000, 290000, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00163', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 702600, 702600, 702600, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00164', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 335000, 335000, 335000, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00165', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'used', 869100, 869100, 869100, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00166', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Cosmic Orange','Deep Blue','Silver (regional SKU verify)']::text[], '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 379000, 379000, 379000, 1, false, true from products where slug = 'apple-iphone-17-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-18', id, null, 'Apple iPhone 18', 'iPhone 18', 'Apple iPhone 18 — 5G, Official Pakistan specifications not independently verified, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00167', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'box_pack', 430000, 430000, 430000, 1, false, true from products where slug = 'apple-iphone-18'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00168', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 335000, 335000, 335000, 1, false, true from products where slug = 'apple-iphone-18'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00169', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'box_pack', 510000, 510000, 510000, 1, false, true from products where slug = 'apple-iphone-18'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00170', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 398000, 398000, 398000, 1, false, true from products where slug = 'apple-iphone-18'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-18-pro', id, null, 'Apple iPhone 18 Pro', 'iPhone 18 Pro', 'Apple iPhone 18 Pro — 5G, Retailer-reported OLED 120Hz; verify, A-series Pro chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00171', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 563999, 563999, 563999, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00172', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 470000, 470000, 470000, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00173', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 651667, 651667, 651667, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00174', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 555000, 555000, 555000, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00175', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 821667, 821667, 821667, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00176', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 639000, 639000, 639000, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00177', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 1075000, 1075000, 1075000, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00178', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 724000, 724000, 724000, 1, false, true from products where slug = 'apple-iphone-18-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'apple-iphone-18-pro-max', id, null, 'Apple iPhone 18 Pro Max', 'iPhone 18 Pro Max', 'Apple iPhone 18 Pro Max — 5G, Retailer-reported OLED 120Hz; verify, A-series Pro chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'apple'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00179', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 603999, 603999, 603999, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00180', '256GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 510000, 510000, 510000, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00181', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 688999, 688999, 688999, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00182', '512GB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 602000, 602000, 602000, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00183', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 858999, 858999, 858999, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00184', '1TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 694000, 694000, 694000, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00185', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'used', 1019000, 1019000, 1019000, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00186', '2TB', 'Model-dependent; verify exact RAM', ARRAY['Official Pakistan colorways not verified']::text[], 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'box_pack', 785000, 785000, 785000, 1, false, true from products where slug = 'apple-iphone-18-pro-max'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-6', id, null, 'Google Pixel 6', 'Pixel 6', 'Google Pixel 6 — 5G on supported models, 6.4 AMOLED 90Hz, Tensor G1. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00187', '128GB', '8GB', ARRAY['Obsidian','Sorta Seafoam','Kinda Coral']::text[], '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 75000, 75000, 75000, 1, false, true from products where slug = 'google-pixel-6'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00188', '128GB', '8GB', ARRAY['Obsidian','Sorta Seafoam','Kinda Coral']::text[], '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 50000, 50000, 50000, 1, false, true from products where slug = 'google-pixel-6'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00189', '256GB', '8GB', ARRAY['Obsidian','Sorta Seafoam','Kinda Coral']::text[], '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 87000, 87000, 87000, 1, false, true from products where slug = 'google-pixel-6'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00190', '256GB', '8GB', ARRAY['Obsidian','Sorta Seafoam','Kinda Coral']::text[], '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 58000, 58000, 58000, 1, false, true from products where slug = 'google-pixel-6'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-6-pro', id, null, 'Google Pixel 6 Pro', 'Pixel 6 Pro', 'Google Pixel 6 Pro — 5G on supported models, 6.7 LTPO OLED 120Hz, Tensor G1. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00191', '128GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 218000, 218000, 218000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00192', '128GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 144000, 144000, 144000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00193', '256GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 254000, 254000, 254000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00194', '256GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 168000, 168000, 168000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00195', '512GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 296000, 296000, 296000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00196', '512GB', '12GB', ARRAY['Stormy Black','Cloudy White','Sorta Sunny']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 196000, 196000, 196000, 1, false, true from products where slug = 'google-pixel-6-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-6a', id, null, 'Google Pixel 6a', 'Pixel 6a', 'Google Pixel 6a — 5G on supported models, 6.1 OLED 60Hz, Tensor G1. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00197', '128GB', '6GB', ARRAY['Charcoal','Chalk','Sage']::text[], '6.1 OLED 60Hz', 'Tensor G1', '12.2MP + 12MP', 'Model-dependent; verify', '4410mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 58000, 58000, 58000, 1, false, true from products where slug = 'google-pixel-6a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00198', '128GB', '6GB', ARRAY['Charcoal','Chalk','Sage']::text[], '6.1 OLED 60Hz', 'Tensor G1', '12.2MP + 12MP', 'Model-dependent; verify', '4410mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 39000, 39000, 39000, 1, false, true from products where slug = 'google-pixel-6a'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-7', id, null, 'Google Pixel 7', 'Pixel 7', 'Google Pixel 7 — 5G on supported models, 6.3 OLED 90Hz, Tensor G2. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00199', '128GB', '8GB', ARRAY['Obsidian','Snow','Lemongrass']::text[], '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 114000, 114000, 114000, 1, false, true from products where slug = 'google-pixel-7'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00200', '128GB', '8GB', ARRAY['Obsidian','Snow','Lemongrass']::text[], '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 76000, 76000, 76000, 1, false, true from products where slug = 'google-pixel-7'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00201', '256GB', '8GB', ARRAY['Obsidian','Snow','Lemongrass']::text[], '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 133000, 133000, 133000, 1, false, true from products where slug = 'google-pixel-7'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00202', '256GB', '8GB', ARRAY['Obsidian','Snow','Lemongrass']::text[], '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 88000, 88000, 88000, 1, false, true from products where slug = 'google-pixel-7'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-7-pro', id, null, 'Google Pixel 7 Pro', 'Pixel 7 Pro', 'Google Pixel 7 Pro — 5G on supported models, 6.7 LTPO OLED 120Hz, Tensor G2. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00203', '128GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 110000, 110000, 110000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00204', '128GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 73000, 73000, 73000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00205', '256GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 129000, 129000, 129000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00206', '256GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 85000, 85000, 85000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00207', '512GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 151000, 151000, 151000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00208', '512GB', '12GB', ARRAY['Obsidian','Snow','Hazel']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 100000, 100000, 100000, 1, false, true from products where slug = 'google-pixel-7-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-7a', id, null, 'Google Pixel 7a', 'Pixel 7a', 'Google Pixel 7a — 5G on supported models, 6.1 OLED 90Hz, Tensor G2. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00209', '128GB', '8GB', ARRAY['Charcoal','Snow','Sea','Coral']::text[], '6.1 OLED 90Hz', 'Tensor G2', '64MP + 13MP', 'Model-dependent; verify', '4385mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 98000, 98000, 98000, 1, false, true from products where slug = 'google-pixel-7a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00210', '128GB', '8GB', ARRAY['Charcoal','Snow','Sea','Coral']::text[], '6.1 OLED 90Hz', 'Tensor G2', '64MP + 13MP', 'Model-dependent; verify', '4385mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 64000, 64000, 64000, 1, false, true from products where slug = 'google-pixel-7a'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-8', id, null, 'Google Pixel 8', 'Pixel 8', 'Google Pixel 8 — 5G on supported models, 6.2 OLED 120Hz, Tensor G3. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00211', '128GB', '8GB', ARRAY['Obsidian','Hazel','Rose']::text[], '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 150000, 150000, 150000, 1, false, true from products where slug = 'google-pixel-8'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00212', '128GB', '8GB', ARRAY['Obsidian','Hazel','Rose']::text[], '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 99000, 99000, 99000, 1, false, true from products where slug = 'google-pixel-8'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00213', '256GB', '8GB', ARRAY['Obsidian','Hazel','Rose']::text[], '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 173000, 173000, 173000, 1, false, true from products where slug = 'google-pixel-8'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00214', '256GB', '8GB', ARRAY['Obsidian','Hazel','Rose']::text[], '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 114000, 114000, 114000, 1, false, true from products where slug = 'google-pixel-8'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-8-pro', id, null, 'Google Pixel 8 Pro', 'Pixel 8 Pro', 'Google Pixel 8 Pro — 5G on supported models, 6.7 LTPO OLED 120Hz, Tensor G3. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00215', '128GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 161000, 161000, 161000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00216', '128GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 107000, 107000, 107000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00217', '256GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 187000, 187000, 187000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00218', '256GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 124000, 124000, 124000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00219', '512GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 220000, 220000, 220000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00220', '512GB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 145000, 145000, 145000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00221', '1TB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 250000, 250000, 250000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00222', '1TB', '12GB', ARRAY['Obsidian','Porcelain','Bay','Mint']::text[], '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 165000, 165000, 165000, 1, false, true from products where slug = 'google-pixel-8-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-8a', id, null, 'Google Pixel 8a', 'Pixel 8a', 'Google Pixel 8a — 5G on supported models, 6.1 OLED 120Hz, Tensor G3. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00223', '128GB', '8GB', ARRAY['Obsidian','Porcelain','Bay','Aloe']::text[], '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 124000, 124000, 124000, 1, false, true from products where slug = 'google-pixel-8a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00224', '128GB', '8GB', ARRAY['Obsidian','Porcelain','Bay','Aloe']::text[], '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 82000, 82000, 82000, 1, false, true from products where slug = 'google-pixel-8a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00225', '256GB', '8GB', ARRAY['Obsidian','Porcelain','Bay','Aloe']::text[], '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 143000, 143000, 143000, 1, false, true from products where slug = 'google-pixel-8a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00226', '256GB', '8GB', ARRAY['Obsidian','Porcelain','Bay','Aloe']::text[], '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 95000, 95000, 95000, 1, false, true from products where slug = 'google-pixel-8a'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-9', id, null, 'Google Pixel 9', 'Pixel 9', 'Google Pixel 9 — 5G on supported models, 6.3 OLED 120Hz, Tensor G4. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00227', '128GB', '12GB', ARRAY['Obsidian','Porcelain','Wintergreen','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 188000, 188000, 188000, 1, false, true from products where slug = 'google-pixel-9'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00228', '128GB', '12GB', ARRAY['Obsidian','Porcelain','Wintergreen','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 125000, 125000, 125000, 1, false, true from products where slug = 'google-pixel-9'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00229', '256GB', '12GB', ARRAY['Obsidian','Porcelain','Wintergreen','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 218000, 218000, 218000, 1, false, true from products where slug = 'google-pixel-9'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00230', '256GB', '12GB', ARRAY['Obsidian','Porcelain','Wintergreen','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 144000, 144000, 144000, 1, false, true from products where slug = 'google-pixel-9'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-9-pro', id, null, 'Google Pixel 9 Pro', 'Pixel 9 Pro', 'Google Pixel 9 Pro — 5G on supported models, 6.3 LTPO OLED 120Hz, Tensor G4. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00231', '128GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 287000, 287000, 287000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00232', '128GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 190000, 190000, 190000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00233', '256GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 333000, 333000, 333000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00234', '256GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 220000, 220000, 220000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00235', '512GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 391000, 391000, 391000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00236', '512GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 259000, 259000, 259000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00237', '1TB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 446000, 446000, 446000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00238', '1TB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 295000, 295000, 295000, 1, false, true from products where slug = 'google-pixel-9-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-9-pro-xl', id, null, 'Google Pixel 9 Pro XL', 'Pixel 9 Pro XL', 'Google Pixel 9 Pro XL — 5G on supported models, 6.8 LTPO OLED 120Hz, Tensor G4. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00239', '128GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 348000, 348000, 348000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00240', '128GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 230000, 230000, 230000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00241', '256GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 404000, 404000, 404000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00242', '256GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 267000, 267000, 267000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00243', '512GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 473000, 473000, 473000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00244', '512GB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 313000, 313000, 313000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00245', '1TB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 540000, 540000, 540000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00246', '1TB', '16GB', ARRAY['Obsidian','Porcelain','Hazel','Rose Quartz']::text[], '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 357000, 357000, 357000, 1, false, true from products where slug = 'google-pixel-9-pro-xl'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-9a', id, null, 'Google Pixel 9a', 'Pixel 9a', 'Google Pixel 9a — 5G on supported models, 6.3 OLED 120Hz, Tensor G4. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00247', '128GB', '8GB', ARRAY['Obsidian','Porcelain','Iris','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 169000, 169000, 169000, 1, false, true from products where slug = 'google-pixel-9a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00248', '128GB', '8GB', ARRAY['Obsidian','Porcelain','Iris','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 112000, 112000, 112000, 1, false, true from products where slug = 'google-pixel-9a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00249', '256GB', '8GB', ARRAY['Obsidian','Porcelain','Iris','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 196000, 196000, 196000, 1, false, true from products where slug = 'google-pixel-9a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00250', '256GB', '8GB', ARRAY['Obsidian','Porcelain','Iris','Peony']::text[], '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 130000, 130000, 130000, 1, false, true from products where slug = 'google-pixel-9a'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-10', id, null, 'Google Pixel 10', 'Pixel 10', 'Google Pixel 10 — 5G on supported models, 6.3 OLED 120Hz (reported), Tensor G5 (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00251', '128GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 254000, 254000, 254000, 1, false, true from products where slug = 'google-pixel-10'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00252', '128GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 168000, 168000, 168000, 1, false, true from products where slug = 'google-pixel-10'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00253', '256GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 294000, 294000, 294000, 1, false, true from products where slug = 'google-pixel-10'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00254', '256GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 194000, 194000, 194000, 1, false, true from products where slug = 'google-pixel-10'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-10-pro', id, null, 'Google Pixel 10 Pro', 'Pixel 10 Pro', 'Google Pixel 10 Pro — 5G on supported models, 6.3 LTPO OLED 120Hz (reported), Tensor G5 (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00255', '128GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 228000, 228000, 228000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00256', '128GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 150000, 150000, 150000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00257', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 264000, 264000, 264000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00258', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 175000, 175000, 175000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00259', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 309000, 309000, 309000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00260', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 205000, 205000, 205000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00261', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 352000, 352000, 352000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00262', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 233000, 233000, 233000, 1, false, true from products where slug = 'google-pixel-10-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-10-pro-xl', id, null, 'Google Pixel 10 Pro XL', 'Pixel 10 Pro XL', 'Google Pixel 10 Pro XL — 5G on supported models, 6.8 LTPO OLED 120Hz (reported), Tensor G5 (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00263', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 339000, 339000, 339000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00264', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 224000, 224000, 224000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00265', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 398000, 398000, 398000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00266', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 263000, 263000, 263000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00267', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 454000, 454000, 454000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00268', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 300000, 300000, 300000, 1, false, true from products where slug = 'google-pixel-10-pro-xl'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-10-pro-fold', id, null, 'Google Pixel 10 Pro Fold', 'Pixel 10 Pro Fold', 'Google Pixel 10 Pro Fold — 5G on supported models, Foldable LTPO OLED 120Hz (reported), Tensor G5 (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00269', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 498000, 498000, 498000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00270', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 329000, 329000, 329000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00271', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 584000, 584000, 584000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00272', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 386000, 386000, 386000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00273', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 666000, 666000, 666000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00274', '1TB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 440000, 440000, 440000, 1, false, true from products where slug = 'google-pixel-10-pro-fold'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-10a', id, null, 'Google Pixel 10a', 'Pixel 10a', 'Google Pixel 10a — 5G on supported models, Manufacturer specs not independently verified, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00275', '128GB', '8GB', ARRAY['Colorways','specs require verification']::text[], 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 150000, 150000, 150000, 1, false, true from products where slug = 'google-pixel-10a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00276', '128GB', '8GB', ARRAY['Colorways','specs require verification']::text[], 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 99000, 99000, 99000, 1, false, true from products where slug = 'google-pixel-10a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00277', '256GB', '8GB', ARRAY['Colorways','specs require verification']::text[], 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 173000, 173000, 173000, 1, false, true from products where slug = 'google-pixel-10a'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00278', '256GB', '8GB', ARRAY['Colorways','specs require verification']::text[], 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 114000, 114000, 114000, 1, false, true from products where slug = 'google-pixel-10a'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-11', id, null, 'Google Pixel 11', 'Pixel 11', 'Google Pixel 11 — 5G on supported models, 6.3 OLED 120Hz (retailer-reported), Tensor G6 (retailer-reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00279', '128GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 286000, 286000, 286000, 1, false, true from products where slug = 'google-pixel-11'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00280', '128GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 189000, 189000, 189000, 1, false, true from products where slug = 'google-pixel-11'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00281', '256GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 332000, 332000, 332000, 1, false, true from products where slug = 'google-pixel-11'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00282', '256GB', '12GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 219000, 219000, 219000, 1, false, true from products where slug = 'google-pixel-11'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-11-pro', id, null, 'Google Pixel 11 Pro', 'Pixel 11 Pro', 'Google Pixel 11 Pro — 5G on supported models, 6.3 LTPO OLED 120Hz (retailer-reported), Tensor G6 (retailer-reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00283', '256GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 520000, 520000, 520000, 1, false, true from products where slug = 'google-pixel-11-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00284', '256GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 344000, 344000, 344000, 1, false, true from products where slug = 'google-pixel-11-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00285', '512GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 610000, 610000, 610000, 1, false, true from products where slug = 'google-pixel-11-pro'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00286', '512GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 403000, 403000, 403000, 1, false, true from products where slug = 'google-pixel-11-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-11-pro-xl', id, null, 'Google Pixel 11 Pro XL', 'Pixel 11 Pro XL', 'Google Pixel 11 Pro XL — 5G on supported models, 6.8 LTPO OLED 120Hz (retailer-reported), Tensor G6 (retailer-reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00287', '256GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 573000, 573000, 573000, 1, false, true from products where slug = 'google-pixel-11-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00288', '256GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 379000, 379000, 379000, 1, false, true from products where slug = 'google-pixel-11-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00289', '512GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 672000, 672000, 672000, 1, false, true from products where slug = 'google-pixel-11-pro-xl'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00290', '512GB', '12GB/16GB', ARRAY['Colorways require Pakistan SKU check']::text[], '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 445000, 445000, 445000, 1, false, true from products where slug = 'google-pixel-11-pro-xl'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'google-pixel-11-pro-fold', id, null, 'Google Pixel 11 Pro Fold', 'Pixel 11 Pro Fold', 'Google Pixel 11 Pro Fold — 5G on supported models, Foldable OLED 120Hz (reported), Tensor G6 (reported). Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'google'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00291', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 800000, 800000, 800000, 1, false, true from products where slug = 'google-pixel-11-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00292', '256GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 529000, 529000, 529000, 1, false, true from products where slug = 'google-pixel-11-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00293', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'box_pack', 937000, 937000, 937000, 1, false, true from products where slug = 'google-pixel-11-pro-fold'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00294', '512GB', '16GB', ARRAY['Colorways require Pakistan SKU check']::text[], 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'used', 620000, 620000, 620000, 1, false, true from products where slug = 'google-pixel-11-pro-fold'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s26-ultra', id, null, 'Samsung Galaxy S26 Ultra', 'Galaxy S26 Ultra', 'Samsung Galaxy S26 Ultra — Yes, 6.9 AMOLED 120Hz (reported), Regional chipset verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00295', '256GB', '12GB', ARRAY['Black','Violet','Blue','White (verify)']::text[], '6.9 AMOLED 120Hz (reported)', 'Regional chipset verify', '200MP-class multi-camera (reported)', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'used', 387495, 387495, 387495, 1, false, true from products where slug = 'samsung-galaxy-s26-ultra'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s26-plus', id, null, 'Samsung Galaxy S26 Plus', 'Galaxy S26 Plus', 'Samsung Galaxy S26 Plus — Yes, 6.7 AMOLED 120Hz (reported), Regional chipset verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00296', '256GB', '12GB', ARRAY['Colors verify']::text[], '6.7 AMOLED 120Hz (reported)', 'Regional chipset verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 330495, 330495, 330495, 1, false, true from products where slug = 'samsung-galaxy-s26-plus'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s26', id, null, 'Samsung Galaxy S26', 'Galaxy S26', 'Samsung Galaxy S26 — Yes, 6.3 AMOLED 120Hz (reported), Regional chipset verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00297', '256GB', '12GB', ARRAY['Colors verify']::text[], '6.3 AMOLED 120Hz (reported)', 'Regional chipset verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 284500, 284500, 284500, 1, false, true from products where slug = 'samsung-galaxy-s26'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s26-fe', id, null, 'Samsung Galaxy S26 FE', 'Galaxy S26 FE', 'Samsung Galaxy S26 FE — Yes, AMOLED 120Hz (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00298', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED 120Hz (reported)', 'Verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 231995, 231995, 231995, 1, false, true from products where slug = 'samsung-galaxy-s26-fe'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a57-5g', id, null, 'Samsung Galaxy A57 5G', 'Galaxy A57 5G', 'Samsung Galaxy A57 5G — Yes, 6.7 Super AMOLED 120Hz (reported), Exynos family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00299', '256GB', '8GB', ARRAY['Colors verify']::text[], '6.7 Super AMOLED 120Hz (reported)', 'Exynos family; verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'used', 165495, 165495, 165495, 1, false, true from products where slug = 'samsung-galaxy-a57-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a37-5g', id, null, 'Samsung Galaxy A37 5G', 'Galaxy A37 5G', 'Samsung Galaxy A37 5G — Yes, Super AMOLED 120Hz (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00300', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Super AMOLED 120Hz (reported)', 'Verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'used', 131495, 131495, 131495, 1, false, true from products where slug = 'samsung-galaxy-a37-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a27-5g', id, null, 'Samsung Galaxy A27 5G', 'Galaxy A27 5G', 'Samsung Galaxy A27 5G — Yes, AMOLED high refresh rate (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00301', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh rate (reported)', 'Verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'used', 109995, 109995, 109995, 1, false, true from products where slug = 'samsung-galaxy-a27-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a17-5g', id, null, 'Samsung Galaxy A17 5G', 'Galaxy A17 5G', 'Samsung Galaxy A17 5G — Yes, 6.7 Super AMOLED 90Hz (reported), Verify regional chipset. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00302', '256GB', '8GB', ARRAY['Black','Gray','Blue (verify)']::text[], '6.7 Super AMOLED 90Hz (reported)', 'Verify regional chipset', '50MP-class rear; verify', 'Verify', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'used', 89995, 89995, 89995, 1, false, true from products where slug = 'samsung-galaxy-a17-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a17-4g', id, null, 'Samsung Galaxy A17 4G', 'Galaxy A17 4G', 'Samsung Galaxy A17 4G — No, 6.7 Super AMOLED 90Hz (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00303', '128GB', '6GB', ARRAY['Black','Gray','Blue (verify)']::text[], '6.7 Super AMOLED 90Hz (reported)', 'Helio family; verify', '50MP-class rear; verify', 'Verify', '5000mAh', 'No', 'PTA Approved (verify IMEI)', 'used', 62995, 62995, 62995, 1, false, true from products where slug = 'samsung-galaxy-a17-4g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a07', id, null, 'Samsung Galaxy A07', 'Galaxy A07', 'Samsung Galaxy A07 — No, 6.7 LCD 90Hz (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00304', '128GB', '4GB', ARRAY['Black','Silver','Green (verify)']::text[], '6.7 LCD 90Hz (reported)', 'Helio family; verify', '50MP + depth (reported)', 'Verify', '5000mAh', 'No', 'PTA Approved (verify IMEI)', 'used', 36495, 36495, 36495, 1, false, true from products where slug = 'samsung-galaxy-a07'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a56-5g', id, null, 'Samsung Galaxy A56 5G', 'Galaxy A56 5G', 'Samsung Galaxy A56 5G — Yes, 6.7 Super AMOLED 120Hz, Exynos 1580. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00305', '256GB', '8GB', ARRAY['Awesome Lightgray','Graphite','Olive','Pink']::text[], '6.7 Super AMOLED 120Hz', 'Exynos 1580', '50MP + 12MP + 5MP', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'used', 145999, 145999, 145999, 1, false, true from products where slug = 'samsung-galaxy-a56-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-a36-5g', id, null, 'Samsung Galaxy A36 5G', 'Galaxy A36 5G', 'Samsung Galaxy A36 5G — Yes, 6.7 Super AMOLED 120Hz, Snapdragon 6 Gen 3. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00306', '256GB', '8GB', ARRAY['Black','White','Lavender','Lime']::text[], '6.7 Super AMOLED 120Hz', 'Snapdragon 6 Gen 3', '50MP + 8MP + 5MP', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'used', 129999, 129999, 129999, 1, false, true from products where slug = 'samsung-galaxy-a36-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s25-fe', id, null, 'Samsung Galaxy S25 FE', 'Galaxy S25 FE', 'Samsung Galaxy S25 FE — Yes, 6.7 Dynamic AMOLED 2X 120Hz, Verify regional chipset. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00307', '256GB', '8GB', ARRAY['Colors verify']::text[], '6.7 Dynamic AMOLED 2X 120Hz', 'Verify regional chipset', '50MP-class multi-camera; verify', 'Verify', '4900mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'used', 189999, 189999, 189999, 1, false, true from products where slug = 'samsung-galaxy-s25-fe'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-s25-ultra', id, null, 'Samsung Galaxy S25 Ultra', 'Galaxy S25 Ultra', 'Samsung Galaxy S25 Ultra — Yes, 6.9 Dynamic AMOLED 2X 120Hz, Snapdragon 8 Elite. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00308', '256GB', '12GB', ARRAY['Titanium colorways','confirm SKU']::text[], '6.9 Dynamic AMOLED 2X 120Hz', 'Snapdragon 8 Elite', '200MP + ultra-wide + telephoto system', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'used', 332999, 332999, 332999, 1, false, true from products where slug = 'samsung-galaxy-s25-ultra'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold8-ultra', id, null, 'Samsung Galaxy Z Fold8 Ultra', 'Galaxy Z Fold8 Ultra', 'Samsung Galaxy Z Fold8 Ultra — 5G, 8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5"), Snapdragon 8 Elite Gen 5. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00435', '256GB', '12GB', ARRAY['Graphite','Cream','Violet Shadow']::text[], '8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5")', 'Snapdragon 8 Elite Gen 5', '200MP + 50MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '5000mAh', '5G', 'Non-PTA (new import)', 'used', 494999, 494999, 494999, 1, false, true from products where slug = 'samsung-galaxy-z-fold8-ultra'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00436', '512GB', '12GB', ARRAY['Graphite','Cream','Violet Shadow']::text[], '8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5")', 'Snapdragon 8 Elite Gen 5', '200MP + 50MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '5000mAh', '5G', 'Non-PTA (new import)', 'used', 509999, 509999, 509999, 1, false, true from products where slug = 'samsung-galaxy-z-fold8-ultra'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold8', id, null, 'Samsung Galaxy Z Fold8', 'Galaxy Z Fold8', 'Samsung Galaxy Z Fold8 — 5G, 7.6" foldable 120Hz (cover 5.5"), Snapdragon 8 Elite Gen 5. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00437', '256GB', '12GB', ARRAY['Colours not stated on retailer','price sources used','confirm on carton']::text[], '7.6" foldable 120Hz (cover 5.5")', 'Snapdragon 8 Elite Gen 5', '50MP + 50MP ultrawide (no telephoto)', '10MP', '4800mAh', '5G', 'Non-PTA (new import)', 'used', 469999, 469999, 469999, 1, false, true from products where slug = 'samsung-galaxy-z-fold8'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00438', '512GB', '12GB', ARRAY['Colours not stated on retailer','price sources used','confirm on carton']::text[], '7.6" foldable 120Hz (cover 5.5")', 'Snapdragon 8 Elite Gen 5', '50MP + 50MP ultrawide (no telephoto)', '10MP', '4800mAh', '5G', 'Non-PTA (new import)', 'used', 519999, 519999, 519999, 1, false, true from products where slug = 'samsung-galaxy-z-fold8'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold7', id, null, 'Samsung Galaxy Z Fold7', 'Galaxy Z Fold7', 'Samsung Galaxy Z Fold7 — 5G, 8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5"), Snapdragon 8 Elite. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00439', '256GB', '12GB', ARRAY['Blue Shadow','Silver Shadow','Jet Black','Mint']::text[], '8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5")', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'used', 374999, 374999, 374999, 1, false, true from products where slug = 'samsung-galaxy-z-fold7'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00440', '512GB', '12GB', ARRAY['Blue Shadow','Silver Shadow','Jet Black','Mint']::text[], '8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5")', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'used', 434499, 434499, 434499, 1, false, true from products where slug = 'samsung-galaxy-z-fold7'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00441', '1TB', '16GB', ARRAY['Blue Shadow','Silver Shadow','Jet Black','Mint']::text[], '8.0" foldable LTPO AMOLED 2X 120Hz (cover 6.5")', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'used', 531999, 531999, 531999, 1, false, true from products where slug = 'samsung-galaxy-z-fold7'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold6', id, null, 'Samsung Galaxy Z Fold6', 'Galaxy Z Fold6', 'Samsung Galaxy Z Fold6 — 5G, 7.6" foldable LTPO AMOLED 2X 120Hz (cover 6.3"), Snapdragon 8 Gen 3. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00442', '256GB', '12GB', ARRAY['Silver Shadow','Pink','Navy']::text[], '7.6" foldable LTPO AMOLED 2X 120Hz (cover 6.3")', 'Snapdragon 8 Gen 3', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'Non-PTA (new import)', 'used', 339999, 339999, 339999, 1, false, true from products where slug = 'samsung-galaxy-z-fold6'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold5', id, null, 'Samsung Galaxy Z Fold5', 'Galaxy Z Fold5', 'Samsung Galaxy Z Fold5 — 5G, 7.6" foldable Dynamic AMOLED 2X 120Hz (cover 6.2"), Snapdragon 8 Gen 2. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00443', '256GB', '12GB', ARRAY['Icy Blue','Phantom Black','Cream']::text[], '7.6" foldable Dynamic AMOLED 2X 120Hz (cover 6.2")', 'Snapdragon 8 Gen 2', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'PTA Approved (used; verify IMEI)', 'used', 269999, 269999, 269999, 1, false, true from products where slug = 'samsung-galaxy-z-fold5'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00444', '256GB', '12GB', ARRAY['Icy Blue','Phantom Black','Cream']::text[], '7.6" foldable Dynamic AMOLED 2X 120Hz (cover 6.2")', 'Snapdragon 8 Gen 2', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'Non-PTA (used)', 'used', 169999, 169999, 169999, 1, false, true from products where slug = 'samsung-galaxy-z-fold5'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'samsung-galaxy-z-fold4', id, null, 'Samsung Galaxy Z Fold4', 'Galaxy Z Fold4', 'Samsung Galaxy Z Fold4 — 5G, 7.6" foldable Dynamic AMOLED 2X 120Hz (cover 6.2"), Snapdragon 8+ Gen 1. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'samsung'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00445', '256GB', '12GB', ARRAY['Graygreen','Phantom Black','Beige']::text[], '7.6" foldable Dynamic AMOLED 2X 120Hz (cover 6.2")', 'Snapdragon 8+ Gen 1', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'PTA Approved (used; verify IMEI)', 'used', 199999, 199999, 199999, 1, false, true from products where slug = 'samsung-galaxy-z-fold4'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-a6', id, null, 'OPPO A6', 'A6', 'OPPO A6 — 4G/5G SKU verify, 6.7 LCD high refresh (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00309', '128GB', '8GB', ARRAY['Colors verify']::text[], '6.7 LCD high refresh (reported)', 'Verify', '50MP-class main; verify', 'Verify', '7000mAh class reported', '4G/5G SKU verify', 'PTA Approved (verify IMEI)', 'used', 69995, 69995, 69995, 1, false, true from products where slug = 'oppo-a6'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-reno-16f-5g', id, null, 'OPPO Reno 16F 5G', 'Reno 16F 5G', 'OPPO Reno 16F 5G — Yes, AMOLED 120Hz (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00310', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 139495, 139495, 139495, 1, false, true from products where slug = 'oppo-reno-16f-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-reno-16-5g', id, null, 'OPPO Reno 16 5G', 'Reno 16 5G', 'OPPO Reno 16 5G — Yes, AMOLED 120Hz (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00311', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 183495, 183495, 183495, 1, false, true from products where slug = 'oppo-reno-16-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-a6c', id, null, 'OPPO A6C', 'A6C', 'OPPO A6C — No, LCD; verify, Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00312', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Helio family; verify', 'Camera specs verify', 'Verify', '5000mAh class', 'No', 'PTA Approved (verify IMEI)', 'used', 43495, 43495, 43495, 1, false, true from products where slug = 'oppo-a6c'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-a6s-pro', id, null, 'OPPO A6s Pro', 'A6s Pro', 'OPPO A6s Pro — Verify exact SKU, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00313', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify exact SKU', 'PTA Approved (verify IMEI)', 'used', 104995, 104995, 104995, 1, false, true from products where slug = 'oppo-a6s-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-a6k', id, null, 'OPPO A6K', 'A6K', 'OPPO A6K — No, LCD; verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00314', '128GB', '6GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Verify', '50MP-class main; verify', 'Verify', '5000mAh class', 'No', 'PTA Approved (verify IMEI)', 'used', 53995, 53995, 53995, 1, false, true from products where slug = 'oppo-a6k'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-a6s', id, null, 'OPPO A6s', 'A6s', 'OPPO A6s — Verify exact SKU, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00315', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify exact SKU', 'PTA Approved (verify IMEI)', 'used', 91995, 91995, 91995, 1, false, true from products where slug = 'oppo-a6s'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-reno-15-pro', id, null, 'OPPO Reno 15 Pro', 'Reno 15 Pro', 'OPPO Reno 15 Pro — Yes, AMOLED; exact refresh verify, Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00316', '512GB', '12GB', ARRAY['Dusk Brown','Aurora Blue']::text[], 'AMOLED; exact refresh verify', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', '6200mAh listing reference', 'Yes', 'PTA Approved (verify IMEI)', 'used', 234999, 234999, 234999, 1, false, true from products where slug = 'oppo-reno-15-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-reno-15', id, null, 'OPPO Reno 15', 'Reno 15', 'OPPO Reno 15 — Yes (listing), AMOLED; verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00317', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED; verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes (listing)', 'PTA Approved (verify IMEI)', 'used', 159995, 159995, 159995, 1, false, true from products where slug = 'oppo-reno-15'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'oppo-reno-15f', id, null, 'OPPO Reno 15F', 'Reno 15F', 'OPPO Reno 15F — Verify, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'oppo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00318', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 118999, 118999, 118999, 1, false, true from products where slug = 'oppo-reno-15f'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-c100i', id, null, 'realme C100i', 'C100i', 'realme C100i — No, 6.8 LCD (reported), Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00319', '64GB', '4GB', ARRAY['Dawn Purple','Dusk Gray']::text[], '6.8 LCD (reported)', 'Entry-level chipset; verify', '8MP main (listing reference)', 'Verify', '7000mAh (listing reference)', 'No', 'PTA Approved (verify IMEI)', 'used', 36999, 36999, 36999, 1, false, true from products where slug = 'realme-c100i'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00320', '128GB', '4GB', ARRAY['Dawn Purple','Dusk Gray']::text[], '6.8 LCD (reported)', 'Entry-level chipset; verify', '8MP main (listing reference)', 'Verify', '7000mAh (listing reference)', 'No', 'PTA Approved (verify IMEI)', 'used', 44999, 44999, 44999, 1, false, true from products where slug = 'realme-c100i'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-16-5g', id, null, 'realme 16 5G', '16 5G', 'realme 16 5G — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00321', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 114499, 114499, 114499, 1, false, true from products where slug = 'realme-16-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-15-pro', id, null, 'realme 15 Pro', '15 Pro', 'realme 15 Pro — Yes, AMOLED 120Hz (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00322', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED 120Hz (reported)', 'Verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 128999, 128999, 128999, 1, false, true from products where slug = 'realme-15-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-note-70', id, null, 'realme Note 70', 'Note 70', 'realme Note 70 — No, LCD; verify, Unisoc family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00323', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Unisoc family; verify', 'Camera specs verify', 'Verify', '6000mAh class; verify', 'No', 'PTA Approved (verify IMEI)', 'used', 41599, 41599, 41599, 1, false, true from products where slug = 'realme-note-70'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-c75x', id, null, 'realme C75x', 'C75x', 'realme C75x — No, LCD high refresh (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00324', '128GB', '8GB', ARRAY['Colors verify']::text[], 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 51999, 51999, 51999, 1, false, true from products where slug = 'realme-c75x'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-note-60x', id, null, 'realme Note 60x', 'Note 60x', 'realme Note 60x — No, LCD; verify, Unisoc family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00325', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Unisoc family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 32999, 32999, 32999, 1, false, true from products where slug = 'realme-note-60x'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-c100', id, null, 'realme C100', 'C100', 'realme C100 — Verify, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00326', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', '7000mAh class; verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 86500, 86500, 86500, 1, false, true from products where slug = 'realme-c100'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'realme-c100x', id, null, 'realme C100X', 'C100X', 'realme C100X — No, LCD; verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'realme'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00327', '128GB', '8GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 62500, 62500, 62500, 1, false, true from products where slug = 'realme-c100x'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-y05', id, null, 'vivo Y05', 'Y05', 'vivo Y05 — No, 6.74 LCD (listing reference), Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00328', '64GB', '4GB', ARRAY['Black','Blue','Platinum']::text[], '6.74 LCD (listing reference)', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 40999, 40999, 40999, 1, false, true from products where slug = 'vivo-y05'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00329', '128GB', '4GB', ARRAY['Black','Blue','Platinum']::text[], '6.74 LCD (listing reference)', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 48999, 48999, 48999, 1, false, true from products where slug = 'vivo-y05'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-y05e', id, null, 'vivo Y05e', 'Y05e', 'vivo Y05e — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00330', '64GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 36999, 36999, 36999, 1, false, true from products where slug = 'vivo-y05e'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-x300-fe', id, null, 'vivo X300 FE', 'X300 FE', 'vivo X300 FE — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00331', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 251999, 251999, 251999, 1, false, true from products where slug = 'vivo-x300-fe'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-y500', id, null, 'vivo Y500', 'Y500', 'vivo Y500 — Verify, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00332', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 82499, 82499, 82499, 1, false, true from products where slug = 'vivo-y500'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-v70-fe', id, null, 'vivo V70 FE', 'V70 FE', 'vivo V70 FE — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00333', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 121999, 121999, 121999, 1, false, true from products where slug = 'vivo-v70-fe'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-y31d', id, null, 'vivo Y31d', 'Y31d', 'vivo Y31d — Verify, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00334', '128GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 67499, 67499, 67499, 1, false, true from products where slug = 'vivo-y31d'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-y11d', id, null, 'vivo Y11d', 'Y11d', 'vivo Y11d — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00335', '128GB', '6GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 51499, 51499, 51499, 1, false, true from products where slug = 'vivo-y11d'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-x300-pro', id, null, 'vivo X300 Pro', 'X300 Pro', 'vivo X300 Pro — Yes, LTPO AMOLED 120Hz (reported), Dimensity flagship family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00336', '512GB', '16GB', ARRAY['Colors verify']::text[], 'LTPO AMOLED 120Hz (reported)', 'Dimensity flagship family; verify', 'Flagship multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 316999, 316999, 316999, 1, false, true from products where slug = 'vivo-x300-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'vivo-x200-fe', id, null, 'vivo X200 FE', 'X200 FE', 'vivo X200 FE — Yes, AMOLED 120Hz (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'vivo'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00337', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 215999, 215999, 215999, 1, false, true from products where slug = 'vivo-x200-fe'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-smart-20', id, null, 'Infinix Smart 20', 'Smart 20', 'Infinix Smart 20 — No, LCD high refresh; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00338', '64GB', '4GB', ARRAY['Shadow Black','Cloudline Blue','Polaris Titanium','Sunlike Orange']::text[], 'LCD high refresh; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', '5200mAh listing reference', 'No', 'PTA Approved (verify IMEI)', 'used', 38499, 38499, 38499, 1, false, true from products where slug = 'infinix-smart-20'
  on conflict (sku) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00339', '128GB', '4GB', ARRAY['Shadow Black','Cloudline Blue','Polaris Titanium','Sunlike Orange']::text[], 'LCD high refresh; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', '5200mAh listing reference', 'No', 'PTA Approved (verify IMEI)', 'used', 46499, 46499, 46499, 1, false, true from products where slug = 'infinix-smart-20'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-note-60-edge-5g', id, null, 'Infinix Note 60 Edge 5G', 'Note 60 Edge 5G', 'Infinix Note 60 Edge 5G — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00340', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 95399, 95399, 95399, 1, false, true from products where slug = 'infinix-note-60-edge-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-hot-70-pro-5g', id, null, 'Infinix Hot 70 Pro 5G', 'Hot 70 Pro 5G', 'Infinix Hot 70 Pro 5G — Yes, Display type verify, Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00341', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 82999, 82999, 82999, 1, false, true from products where slug = 'infinix-hot-70-pro-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-hot-70', id, null, 'Infinix Hot 70', 'Hot 70', 'Infinix Hot 70 — No, LCD high refresh (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00342', '128GB', '8GB', ARRAY['Colors verify']::text[], 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 57999, 57999, 57999, 1, false, true from products where slug = 'infinix-hot-70'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-gt-50-pro', id, null, 'Infinix GT 50 Pro', 'GT 50 Pro', 'Infinix GT 50 Pro — Yes, AMOLED high refresh (reported), Dimensity flagship family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00343', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity flagship family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 162999, 162999, 162999, 1, false, true from products where slug = 'infinix-gt-50-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-note-60', id, null, 'Infinix Note 60', 'Note 60', 'Infinix Note 60 — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00344', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 101999, 101999, 101999, 1, false, true from products where slug = 'infinix-note-60'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-hot-60-pro', id, null, 'Infinix Hot 60 Pro', 'Hot 60 Pro', 'Infinix Hot 60 Pro — 4G/5G SKU verify, AMOLED high refresh (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00345', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Verify', '50MP-class main; verify', 'Verify', 'Verify', '4G/5G SKU verify', 'PTA Approved (verify IMEI)', 'used', 69999, 69999, 69999, 1, false, true from products where slug = 'infinix-hot-60-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-hot-60i', id, null, 'Infinix Hot 60i', 'Hot 60i', 'Infinix Hot 60i — No, LCD high refresh (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00346', '128GB', '8GB', ARRAY['Colors verify']::text[], 'LCD high refresh (reported)', 'Helio family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 53999, 53999, 53999, 1, false, true from products where slug = 'infinix-hot-60i'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'infinix-note-60-pro', id, null, 'Infinix Note 60 Pro', 'Note 60 Pro', 'Infinix Note 60 Pro — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'infinix'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00347', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 117999, 117999, 117999, 1, false, true from products where slug = 'infinix-note-60-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-spark-50', id, null, 'Tecno Spark 50', 'Spark 50', 'Tecno Spark 50 — Verify SKU, LCD high refresh (reported), Entry/midrange chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00348', '128GB', '6GB', ARRAY['Ink Black','Titanium Grey','Aurora Purple','Halo Blue','Neo Titanium','Dynamic Orange']::text[], 'LCD high refresh (reported)', 'Entry/midrange chipset; verify', '50MP-class main; verify', 'Verify', '7000mAh listing reference', 'Verify SKU', 'PTA Approved (verify IMEI)', 'used', 58495, 58495, 58495, 1, false, true from products where slug = 'tecno-spark-50'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-pova-curve-2-5g', id, null, 'Tecno Pova Curve 2 5G', 'Pova Curve 2 5G', 'Tecno Pova Curve 2 5G — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00349', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 99999, 99999, 99999, 1, false, true from products where slug = 'tecno-pova-curve-2-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-spark-50-pro', id, null, 'Tecno Spark 50 Pro', 'Spark 50 Pro', 'Tecno Spark 50 Pro — Verify, Display type verify, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00350', '256GB', '8GB', ARRAY['Colors verify']::text[], 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 70495, 70495, 70495, 1, false, true from products where slug = 'tecno-spark-50-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-camon-50', id, null, 'Tecno Camon 50', 'Camon 50', 'Tecno Camon 50 — Verify, AMOLED high refresh (reported), Helio/Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00351', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Helio/Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 91995, 91995, 91995, 1, false, true from products where slug = 'tecno-camon-50'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-camon-50-pro', id, null, 'Tecno Camon 50 Pro', 'Camon 50 Pro', 'Tecno Camon 50 Pro — Verify, AMOLED high refresh (reported), Helio/Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00352', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Helio/Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 99995, 99995, 99995, 1, false, true from products where slug = 'tecno-camon-50-pro'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-spark-go-3', id, null, 'Tecno Spark Go 3', 'Spark Go 3', 'Tecno Spark Go 3 — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00353', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 37995, 37995, 37995, 1, false, true from products where slug = 'tecno-spark-go-3'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-spark-40-pro-plus', id, null, 'Tecno Spark 40 Pro Plus', 'Spark 40 Pro Plus', 'Tecno Spark 40 Pro Plus — No, AMOLED high refresh (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00354', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Helio family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 72999, 72999, 72999, 1, false, true from products where slug = 'tecno-spark-40-pro-plus'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'tecno-camon-50-ultra-5g', id, null, 'Tecno Camon 50 Ultra 5G', 'Camon 50 Ultra 5G', 'Tecno Camon 50 Ultra 5G — Yes, AMOLED high refresh (reported), Dimensity family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'tecno'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00355', '256GB', '12GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 119999, 119999, 119999, 1, false, true from products where slug = 'tecno-camon-50-ultra-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'xiaomi-17-ultra', id, null, 'Xiaomi 17 Ultra', '17 Ultra', 'Xiaomi 17 Ultra — Yes, 6.9 LTPO AMOLED 120Hz, Snapdragon flagship; verify exact regional SKU. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'xiaomi'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00356', '512GB', '16GB', ARRAY['Black','White','Starlit Green']::text[], '6.9 LTPO AMOLED 120Hz', 'Snapdragon flagship; verify exact regional SKU', '50MP-class multi-camera system; verify', 'Verify', '6000mAh listing reference', 'Yes', 'PTA Approved (verify IMEI)', 'used', 459999, 459999, 459999, 1, false, true from products where slug = 'xiaomi-17-ultra'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'xiaomi-redmi-15c', id, null, 'Xiaomi Redmi 15C', 'Redmi 15C', 'Xiaomi Redmi 15C — 4G, LCD high refresh (reported), Helio family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'xiaomi'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00357', '128GB', '6GB', ARRAY['Colors verify']::text[], 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', '6000mAh class; verify', '4G', 'PTA Approved (verify IMEI)', 'used', 44995, 44995, 44995, 1, false, true from products where slug = 'xiaomi-redmi-15c'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'honor-x8d', id, null, 'Honor X8d', 'X8d', 'Honor X8d — Verify, Display type needs exact SKU verification, Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'honor'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00358', '256GB', '8GB', ARRAY['Velvet Black','Velvet Grey','Light Blue']::text[], 'Display type needs exact SKU verification', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 76999, 76999, 76999, 1, false, true from products where slug = 'honor-x8d'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'honor-x9d', id, null, 'Honor X9d', 'X9d', 'Honor X9d — Verify, AMOLED high refresh (reported), Verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'honor'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00359', '256GB', '8GB', ARRAY['Colors verify']::text[], 'AMOLED high refresh (reported)', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'used', 138999, 138999, 138999, 1, false, true from products where slug = 'honor-x9d'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'honor-x6c', id, null, 'Honor X6c', 'X6c', 'Honor X6c — No, LCD; verify, Entry/midrange chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'honor'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00360', '128GB', '6GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry/midrange chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 44995, 44995, 44995, 1, false, true from products where slug = 'honor-x6c'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'itel-a200', id, null, 'itel A200', 'A200', 'itel A200 — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'itel'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00361', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 32995, 32995, 32995, 1, false, true from products where slug = 'itel-a200'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'itel-power-80', id, null, 'itel Power 80', 'Power 80', 'itel Power 80 — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'itel'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00362', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'High-capacity battery; verify', 'No', 'PTA Approved (verify IMEI)', 'used', 42995, 42995, 42995, 1, false, true from products where slug = 'itel-power-80'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'itel-a100c', id, null, 'itel A100C', 'A100C', 'itel A100C — No, LCD; verify, Entry-level chipset; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'itel'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00363', '128GB', '4GB', ARRAY['Colors verify']::text[], 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'used', 23499, 23499, 23499, 1, false, true from products where slug = 'itel-a100c'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'nothing-cmf-phone-1-5g', id, null, 'Nothing CMF Phone 1 5G', 'CMF Phone 1 5G', 'Nothing CMF Phone 1 5G — Yes, 6.67 AMOLED 120Hz, Dimensity 7300. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'nothing'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00364', '128GB', '8GB', ARRAY['Black','Orange','Light Green','Blue (verify)']::text[], '6.67 AMOLED 120Hz', 'Dimensity 7300', '50MP + depth', '16MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'used', 74995, 74995, 74995, 1, false, true from products where slug = 'nothing-cmf-phone-1-5g'
  on conflict (sku) do nothing;
insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller)
  select 'motorola-edge-70-fusion', id, null, 'Motorola Edge 70 Fusion', 'Edge 70 Fusion', 'Motorola Edge 70 Fusion — Yes, pOLED high refresh (reported), Snapdragon family; verify. Pricing shown includes PTA / SIM-lock variants where available.', 'active', false, false, false from brands where slug = 'motorola'
  on conflict (slug) do nothing;
insert into product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification, is_active)
  select id, 'RT-00365', '256GB', '8GB', ARRAY['Colors verify']::text[], 'pOLED high refresh (reported)', 'Snapdragon family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'used', 134999, 134999, 134999, 1, false, true from products where slug = 'motorola-edge-70-fusion'
  on conflict (sku) do nothing;
