-- ============================================================
-- RAES TECH — Row Level Security policies
-- Enable after tables exist (migration 00001). Apply idempotently.
-- ============================================================

alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table addresses enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table inventory_movements enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipping_updates enable row level security;
alter table payments enable row level security;
alter table payment_receipts enable row level security;
alter table refunds enable row level security;
alter table coupons enable row level security;
alter table instalment_applications enable row level security;
alter table instalment_documents enable row level security;
alter table instalment_agreements enable row level security;
alter table instalment_schedules enable row level security;
alter table instalment_collections enable row level security;
alter table ledger_entries enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table website_settings enable row level security;
alter table homepage_sections enable row level security;
alter table banners enable row level security;
alter table content_pages enable row level security;
alter table menus enable row level security;
alter table email_templates enable row level security;
alter table audit_logs enable row level security;

-- ------------------------------------------------------------
-- PUBLIC READ (catalogue & public content)
-- ------------------------------------------------------------
create policy "public_read_brands" on brands for select using (true);
create policy "public_read_categories" on categories for select using (true);
create policy "public_read_products" on products for select using (true);
create policy "public_read_variants" on product_variants for select using (true);
create policy "public_read_images" on product_images for select using (true);
create policy "public_read_banners" on banners for select using (is_visible);
create policy "public_read_home_sections" on homepage_sections for select using (is_visible);
create policy "public_read_content_pages" on content_pages for select using (true);
create policy "public_read_menus" on menus for select using (is_visible);

-- ------------------------------------------------------------
-- PROFILES — user can read/update own; admin reads/updates all
-- ------------------------------------------------------------
create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles_admin_insert" on profiles
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- USER ROLES — only admins view; customer role set by system
-- ------------------------------------------------------------
create policy "user_roles_admin_all" on user_roles
  for all using (public.is_admin());
create policy "user_roles_self_read" on user_roles
  for select using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ADDRESSES — owner manages; admins view
-- ------------------------------------------------------------
create policy "addresses_owner_select" on addresses
  for select using (auth.uid() = user_id or public.is_admin());
create policy "addresses_owner_insert" on addresses
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "addresses_owner_update" on addresses
  for update using (auth.uid() = user_id or public.is_admin());
create policy "addresses_owner_delete" on addresses
  for delete using (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------
-- CATALOGUE WRITES — admin only
-- ------------------------------------------------------------
create policy "brands_admin_write" on brands for all using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_write" on categories for all using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_write" on products for all using (public.is_admin()) with check (public.is_admin());
create policy "variants_admin_write" on product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "images_admin_write" on product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "inventory_admin_all" on inventory_movements for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- CARTS / WISHLISTS — owner or admin
-- ------------------------------------------------------------
create policy "carts_owner_all" on carts for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "cart_items_owner_all" on cart_items for all using (exists (select 1 from carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or public.is_admin())));
create policy "wishlists_owner_all" on wishlists for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "wishlist_items_owner_all" on wishlist_items for all using (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and (w.user_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and (w.user_id = auth.uid() or public.is_admin())));

-- ------------------------------------------------------------
-- ORDERS — owner reads own; admins all
-- ------------------------------------------------------------
create policy "orders_owner_select" on orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_owner_insert" on orders
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "orders_admin_update" on orders
  for update using (public.is_admin());
create policy "order_items_owner_select" on order_items
  for select using (exists (select 1 from orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order_items_owner_insert" on order_items
  for insert with check (exists (select 1 from orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order_items_admin_update" on order_items
  for update using (public.is_admin());
create policy "shipping_updates_admin_all" on shipping_updates for all using (public.is_admin()) with check (public.is_admin());
create policy "shipping_updates_customer_read" on shipping_updates for select using (exists (select 1 from orders o where o.id = shipping_updates.order_id and o.user_id = auth.uid()));

-- ------------------------------------------------------------
-- PAYMENTS — customer reads/creates own; only admins change status
-- ------------------------------------------------------------
create policy "payments_owner_select" on payments
  for select using (auth.uid() = user_id or public.is_admin());
create policy "payments_owner_insert" on payments
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "payments_admin_update" on payments
  for update using (public.is_admin());
-- customers can never update payment status themselves
create policy "payments_owner_update_denied" on payments
  for update using (auth.uid() = user_id and not public.is_admin());

create policy "receipts_owner_all" on payment_receipts
  for all using (exists (select 1 from payments p where p.id = payment_receipts.payment_id and (p.user_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from payments p where p.id = payment_receipts.payment_id and (p.user_id = auth.uid() or public.is_admin())));

create policy "refunds_owner_select" on refunds
  for select using (auth.uid() = user_id or public.is_admin());
create policy "refunds_owner_insert" on refunds
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "refunds_admin_update" on refunds
  for update using (public.is_admin());

-- ------------------------------------------------------------
-- COUPONS — admins write; public validate via function (no read)
-- ------------------------------------------------------------
create policy "coupons_admin_all" on coupons for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- INSTALMENTS — customers own their applications; admins review all
-- ------------------------------------------------------------
create policy "apps_owner_select" on instalment_applications
  for select using (auth.uid() = user_id or public.is_admin());
create policy "apps_owner_insert" on instalment_applications
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "apps_admin_update" on instalment_applications
  for update using (public.is_admin());

-- CNIC documents: only the applicant OR authorised staff.
create policy "docs_owner_select" on instalment_documents
  for select using (
    exists (select 1 from instalment_applications a
            where a.id = instalment_documents.application_id
            and (a.user_id = auth.uid() or public.is_admin()))
  );
create policy "docs_owner_insert" on instalment_documents
  for insert with check (
    exists (select 1 from instalment_applications a
            where a.id = instalment_documents.application_id
            and (a.user_id = auth.uid() or public.is_admin()))
  );
create policy "docs_admin_delete" on instalment_documents
  for delete using (public.is_admin());

create policy "agreements_owner_select" on instalment_agreements
  for select using (
    exists (select 1 from instalment_applications a
            where a.id = instalment_agreements.application_id
            and (a.user_id = auth.uid() or public.is_admin()))
  );
create policy "agreements_admin_all" on instalment_agreements
  for all using (public.is_admin()) with check (public.is_admin());
create policy "agreements_customer_accept" on instalment_agreements
  for update using (
    exists (select 1 from instalment_applications a
            where a.id = instalment_agreements.application_id
            and a.user_id = auth.uid())
  );

create policy "schedules_owner_select" on instalment_schedules
  for select using (
    exists (select 1 from instalment_agreements ag
            join instalment_applications a on a.id = ag.application_id
            where ag.id = instalment_schedules.agreement_id
            and (a.user_id = auth.uid() or public.is_admin()))
  );
create policy "schedules_admin_all" on instalment_schedules
  for all using (public.is_admin()) with check (public.is_admin());

create policy "collections_admin_all" on instalment_collections
  for all using (public.is_admin()) with check (public.is_admin());
create policy "collections_owner_select" on instalment_collections
  for select using (
    exists (select 1 from instalment_agreements ag
            join instalment_applications a on a.id = ag.application_id
            where ag.id = instalment_collections.agreement_id
            and (a.user_id = auth.uid() or public.is_admin()))
  );

-- ------------------------------------------------------------
-- LEDGER — append-only; admins write
-- ------------------------------------------------------------
create policy "ledger_admin_insert" on ledger_entries for insert with check (public.is_admin());
create policy "ledger_admin_select" on ledger_entries for select using (public.is_admin());

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
create policy "reviews_public_select" on reviews for select using (status = 'approved' or public.is_admin());
create policy "reviews_owner_insert" on reviews for insert with check (auth.uid() = user_id or public.is_admin());
create policy "reviews_admin_update" on reviews for update using (public.is_admin());

-- ------------------------------------------------------------
-- NOTIFICATIONS — owner only
-- ------------------------------------------------------------
create policy "notifications_owner_all" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- SETTINGS / CONTENT — admins manage; public reads a safe view
-- ------------------------------------------------------------
create policy "settings_admin_all" on website_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "home_sections_admin_write" on homepage_sections for all using (public.is_admin()) with check (public.is_admin());
create policy "banners_admin_write" on banners for all using (public.is_admin()) with check (public.is_admin());
create policy "content_pages_admin_write" on content_pages for all using (public.is_admin()) with check (public.is_admin());
create policy "menus_admin_write" on menus for all using (public.is_admin()) with check (public.is_admin());
create policy "email_templates_admin_all" on email_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "audit_logs_admin_all" on audit_logs for all using (public.is_admin()) with check (public.is_admin());

-- Public safe settings view (whitelisted, non-sensitive keys)
create or replace view public_settings as
  select key, value, value_kind
  from public.website_settings
  where key in (
    'store_name', 'store_tagline', 'currency', 'currency_symbol',
    'domain', 'support_email', 'support_phone', 'whatsapp_number',
    'instagram_url', 'facebook_url', 'tiktok_url',
    'announcement_text', 'primary_color', 'secondary_color',
    'free_shipping_threshold', 'shipping_charge', 'buy_now_discount_percent',
    'instalment_advance_percent', 'instalment_markup_percent',
    'instalment_tenures', 'cod_enabled', 'terms_url', 'privacy_url'
  );

-- Sanitise: never store active-value HTML/JS in content fields.
-- Admins should enter plain text / markdown only; render safely client-side.
