-- ============================================================
-- RAES TECH — CONSOLIDATED SETUP (run top-to-bottom)
-- Apply in the Supabase SQL Editor for project otvfosijrectvlwqqoll
-- ============================================================

-- >>> FILE: supabase/migrations/00001_init.sql
-- ============================================================
-- RAES TECH — Supabase schema (foundation)
-- Run this in a fresh Supabase project via SQL editor, or
-- via the CLI: supabase db push (place under supabase/migrations)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum (
  'customer', 'super_admin', 'product_manager', 'order_manager',
  'payment_verifier', 'instalment_reviewer', 'support_staff'
);

create type product_status as enum ('draft', 'active', 'archived');
create type product_condition as enum ('box_pack', 'used', 'refurbished');

create type order_status as enum (
  'pending', 'payment_pending', 'payment_verification', 'confirmed',
  'processing', 'packed', 'dispatched', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'refund_requested', 'refunded'
);

create type payment_method as enum ('manual_bank_transfer');
create type payment_status as enum (
  'unpaid', 'pending_verification', 'verified', 'rejected', 'refunded'
);

create type instalment_status as enum (
  'submitted', 'under_review', 'additional_information_required', 'approved',
  'rejected', 'advance_payment_pending', 'advance_payment_verified',
  'agreement_pending', 'active', 'completed', 'cancelled'
);

create type schedule_status as enum ('pending', 'paid', 'overdue', 'part_paid', 'late');

create type ledger_entry_type as enum ('credit', 'debit', 'reversal', 'adjustment');

-- ------------------------------------------------------------
-- PROFILES & ROLES
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  whatsapp text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid primary key references profiles(id) on delete cascade,
  role user_role not null default 'customer',
  assigned_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text,
  full_name text,
  phone text,
  street text,
  city text not null,
  province text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on addresses(user_id);

-- ------------------------------------------------------------
-- CATALOGUE
-- ------------------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  description text,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  parent_id uuid references categories(id),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  name text not null,
  model text,
  description text,
  seo_title text,
  seo_description text,
  keywords text,
  status product_status not null default 'draft',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  bestseller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_brand_idx on products(brand_id);
create index products_category_idx on products(category_id);
create index products_status_idx on products(status);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique not null,
  supplier_sku text,
  name text,
  storage text,
  ram text,
  colors text[] not null default '{}',
  display text,
  chipset text,
  rear_camera text,
  front_camera text,
  battery text,
  network text,
  regional_model text,
  pta_status text,
  sim_lock_status text,
  condition product_condition not null default 'used',
  warranty_type text,
  warranty_duration text,
  warranty_provider text,
  warranty_exclusions text,
  listed_price numeric(14,2) not null check (listed_price >= 0),
  buy_now_price numeric(14,2) not null check (buy_now_price >= 0),
  instalment_total numeric(14,2) check (instalment_total >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  requires_verification boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (listed_price <= buy_now_price or buy_now_price = 0)
);
create index variants_product_idx on product_variants(product_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_variant_idx on product_images(variant_id);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity_change integer not null,
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on inventory_movements(variant_id);

-- ------------------------------------------------------------
-- CARTS / WISHLISTS
-- ------------------------------------------------------------
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ------------------------------------------------------------
-- WHYERS
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references profiles(id),
  email text,
  phone text,
  status order_status not null default 'pending',
  payment_method payment_method,
  payment_status payment_status not null default 'unpaid',
  billing_address_id uuid references addresses(id),
  shipping_address_id uuid references addresses(id),
  shipping_city text,
  shipping_province text,
  shipping_postal text,
  shipping_full_name text,
  shipping_phone text,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  coupon_code text,
  shipping_charge numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  payment_reference text,
  customer_notes text,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders(user_id);
create index orders_status_idx on orders(status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id),
  product_name text not null,
  variant_name text,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null,
  buy_now numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on order_items(order_id);

create table shipping_updates (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text,
  courier_name text,
  tracking_number text,
  tracking_url text,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index shipping_updates_order_idx on shipping_updates(order_id);

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null,
  reference text,
  status payment_status not null default 'unpaid',
  transaction_date date,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on payments(order_id);

create table payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size integer,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index receipts_payment_idx on payment_receipts(payment_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payment_id uuid references payments(id),
  user_id uuid references profiles(id),
  amount numeric(14,2) not null check (amount >= 0),
  reason text,
  status text not null default 'requested',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- COUPONS
-- ------------------------------------------------------------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null default 'percent', -- percent | fixed
  value numeric(10,2) not null default 0,
  min_spend numeric(14,2),
  max_discount numeric(14,2),
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INSTALMENTS
-- ------------------------------------------------------------
create table instalment_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique not null,
  user_id uuid not null references profiles(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  full_name text not null,
  mobile text not null,
  email text,
  cnic text,
  current_address text,
  employment_status text,
  monthly_income text,
  tenure_months integer not null check (tenure_months in (3,6,9,12)),
  listed_price numeric(14,2) not null,
  advance_payment numeric(14,2) not null,
  remaining_balance numeric(14,2) not null,
  monthly_payment numeric(14,2) not null,
  total_payable numeric(14,2) not null,
  consent_given boolean not null default false,
  status instalment_status not null default 'submitted',
  rejection_reason text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index instalment_apps_user_idx on instalment_applications(user_id);

create table instalment_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references instalment_applications(id) on delete cascade,
  path text not null,          -- path inside private storage bucket
  doc_type text not null,      -- cnic_front | cnic_back | proof_of_income | other
  original_name text,
  mime_type text,
  file_size integer,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index instalment_docs_app_idx on instalment_documents(application_id);

create table instalment_agreements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique not null references instalment_applications(id) on delete cascade,
  agreement_number text unique not null,
  status text not null default 'pending_acceptance', -- pending_acceptance | accepted | signed | activated
  accepted_by_customer_at timestamptz,
  activated_by_admin_at timestamptz,
  activated_by uuid references profiles(id),
  content jsonb,               -- rendered agreement snapshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table instalment_schedules (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references instalment_agreements(id) on delete cascade,
  installment_no integer not null,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  amount_paid numeric(14,2) not null default 0,
  status schedule_status not null default 'pending',
  payment_reference text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agreement_id, installment_no)
);
create index schedules_agreement_idx on instalment_schedules(agreement_id);

create table instalment_collections (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references instalment_agreements(id) on delete cascade,
  schedule_id uuid references instalment_schedules(id),
  amount numeric(14,2) not null check (amount > 0),
  method text,
  reference text,
  status text not null default 'pending_verification',
  recorded_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index collections_agreement_idx on instalment_collections(agreement_id);

-- ------------------------------------------------------------
-- LEDGER (immutable)
-- ------------------------------------------------------------
create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type ledger_entry_type not null,
  account_type text not null,   -- order | instalment | refund
  account_id uuid not null,
  amount numeric(14,2) not null check (amount >= 0),
  balance_after numeric(14,2),
  reference_id uuid,
  reversal_of uuid references ledger_entries(id),
  created_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index ledger_account_idx on ledger_entries(account_type, account_id);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  order_id uuid references orders(id),
  user_id uuid references profiles(id),
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);
create index reviews_product_idx on reviews(product_id);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text,
  title text,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id);

-- ------------------------------------------------------------
-- CONTENT & SETTINGS (admin-modifiable)
-- ------------------------------------------------------------
create type setting_value_kind as enum ('string', 'number', 'boolean', 'json', 'color');

create table website_settings (
  key text primary key,
  value text,
  value_kind setting_value_kind not null default 'string',
  group_name text,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text,
  subtitle text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  data jsonb default '{}',
  updated_at timestamptz not null default now()
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  link_url text,
  badge text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

create table menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text not null,
  url text not null,
  parent_id uuid references menus(id),
  sort_order integer not null default 0,
  is_visible boolean not null default true
);

create table email_templates (
  key text primary key,
  subject text,
  body text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index audit_logs_user_idx on audit_logs(user_id);

-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------
-- Create a profile + default role whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure public.set_updated_at();
create trigger products_updated_at before update on products
  for each row execute procedure public.set_updated_at();
create trigger product_variants_updated_at before update on product_variants
  for each row execute procedure public.set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute procedure public.set_updated_at();
create trigger addresses_updated_at before update on addresses
  for each row execute procedure public.set_updated_at();
create trigger instalment_applications_updated_at before update on instalment_applications
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- ROLES / PERMISSION HELPERS
-- ------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select (select public.current_role()) in (
    'super_admin'::user_role, 'product_manager'::user_role,
    'order_manager'::user_role, 'payment_verifier'::user_role,
    'instalment_reviewer'::user_role, 'support_staff'::user_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select (select public.current_role()) = 'super_admin'::user_role;
$$;


-- >>> FILE: supabase/migrations/00002_rls.sql
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


-- >>> FILE: supabase/migrations/00003_functions.sql
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
  ('support_phone', '03499260342', 'string', 'contact'),
  ('whatsapp_number', '+923499260342', 'string', 'contact'),
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


-- >>> FILE: supabase/migrations/00004_product_import.sql
-- ============================================================
-- RAES TECH — Product catalogue import (server-side, secure)
-- Adds an import audit log and a single RPC that validates and
-- upserts products/variants by SKU. Only admins may execute it.
-- ============================================================

-- ------------------------------------------------------------
-- Import audit log
-- ------------------------------------------------------------
create table if not exists public.import_audit_log (
  id uuid primary key default gen_random_uuid(),
  catalog_type text not null,
  mode text not null,
  total integer not null default 0,
  imported integer not null default 0,
  updated integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table public.import_audit_log enable row level security;

drop policy if exists "import_audit_admin_select" on public.import_audit_log;
create policy "import_audit_admin_select" on public.import_audit_log
  for select using (public.is_admin());

drop policy if exists "import_audit_admin_insert" on public.import_audit_log;
create policy "import_audit_admin_insert" on public.import_audit_log
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- Server-side import for
-- ------------------------------------------------------------
create or replace function public.import_products(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_catalog text;
  v_mode text;
  v_records jsonb;
  v_rec jsonb;
  v_brand_id uuid;
  v_category_id uuid;
  v_product_id uuid;
  v_slug text;
  v_sku text;
  v_brand text;
  v_category text;
  v_cond text;
  v_pta text;
  v_simlock text;
  v_listed numeric;
  v_colors text[];

  -- parsed field locals (defensive against empty strings)
  v_buy numeric;
  v_instalment numeric;
  v_stock int;
  v_low int;
  v_req boolean;
  v_featured boolean;
  v_new boolean;
  v_best boolean;

  v_failed int := 0;
  v_imported int := 0;
  v_updated int := 0;
  v_skipped int := 0;
  v_total int := 0;
  v_idx int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_is_jv boolean;
begin
  if not public.is_admin() then
    raise exception 'Insufficient privileges: admin role required';
  end if;

  v_catalog := p_payload->>'catalog_type';
  v_mode := coalesce(p_payload->>'mode', 'upsert');
  v_records := coalesce(p_payload->'records', '[]'::jsonb);
  v_total := jsonb_array_length(v_records);
  v_is_jv := (v_catalog = 'apple-jv');

  for v_rec in select value from jsonb_array_elements(v_records)
  loop
    v_idx := v_idx + 1;

    v_sku := trim(coalesce(v_rec->>'sku', ''));
    v_brand := trim(coalesce(v_rec->>'brand', ''));
    v_category := trim(coalesce(v_rec->>'category', ''));
    v_listed := coalesce((v_rec->>'listed_price')::numeric, -1);

    -- ---- minimal server-side validation ----
    if v_sku = '' then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', null, 'message', 'SKU is required');
      continue;
    end if;
    if v_listed < 0 then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'Listed price must be a non-negative number');
      continue;
    end if;
    if v_brand = '' then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'Brand is required');
      continue;
    end if;

    v_cond := lower(coalesce(v_rec->>'condition', 'box_pack'));
    if v_cond not in ('box_pack', 'used', 'refurbished') then
      v_cond := 'box_pack';
    end if;

    v_pta := coalesce(v_rec->>'pta_status', '');
    v_simlock := coalesce(v_rec->>'sim_lock_status', '');

    -- ---- JV hardening ----
    if v_is_jv then
      v_simlock := 'SIM-Locked';
      if position('approved' in lower(v_pta)) > 0 then
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object('row', v_idx, 'sku', v_sku, 'message', 'JV iPhone cannot be PTA-approved');
        continue;
      end if;
    end if;

    -- ---- resolve / create brand ----
    insert into brands (name, slug)
      values (v_brand, lower(regexp_replace(v_brand, '[^a-z0-9]+', '-', 'g')))
      on conflict (slug) do update set name = excluded.name
      returning id into v_brand_id;

    -- ---- resolve / create category (optional) ----
    v_category_id := null;
    if v_category <> '' then
      insert into categories (name, slug)
        values (v_category, lower(regexp_replace(v_category, '[^a-z0-9]+', '-', 'g')))
        on conflict (slug) do nothing
        returning id into v_category_id;
      if v_category_id is null then
        select id into v_category_id
          from categories
          where slug = lower(regexp_replace(v_category, '[^a-z0-9]+', '-', 'g'));
      end if;
    end if;

    -- ---- upsert product (by slug) ----
    v_slug := lower(coalesce(v_rec->>'slug', ''));
    if v_slug = '' then
      v_slug := lower(regexp_replace(coalesce(v_rec->>'name', v_brand || '-' || v_sku), '[^a-z0-9]+', '-', 'g'));
    end if;

    v_featured := coalesce((v_rec->>'featured')::boolean, false);
    v_new := coalesce((v_rec->>'new_arrival')::boolean, false);
    v_best := coalesce((v_rec->>'bestseller')::boolean, false);

    insert into products (slug, brand_id, category_id, name, model, description, status, featured, new_arrival, bestseller, seo_title, seo_description, keywords)
      values (
        v_slug, v_brand_id, v_category_id,
        coalesce(v_rec->>'name', v_brand || ' ' || v_sku),
        nullif(v_rec->>'model', ''), nullif(v_rec->>'description', ''),
        coalesce(v_rec->>'status', 'active'), v_featured, v_new, v_best,
        nullif(v_rec->>'seo_title', ''), nullif(v_rec->>'seo_description', ''), nullif(v_rec->>'keywords', '')
      )
      on conflict (slug) do update set
        brand_id = excluded.brand_id,
        category_id = coalesce(excluded.category_id, products.category_id),
        name = excluded.name,
        model = excluded.model,
        description = excluded.description,
        status = excluded.status,
        featured = excluded.featured,
        new_arrival = excluded.new_arrival,
        bestseller = excluded.bestseller,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        keywords = excluded.keywords,
        updated_at = now()
      returning id into v_product_id;

    v_colors := array(select jsonb_array_elements_text(coalesce(v_rec->'colors', '[]'::jsonb)));

    v_buy := case when v_rec->>'buy_now_price' in ('', 'null') then 0 else (v_rec->>'buy_now_price')::numeric end;
    v_instalment := case when v_rec->>'instalment_total' in ('', 'null') then null else (v_rec->>'instalment_total')::numeric end;
    v_stock := case when v_rec->>'stock' in ('', 'null') then 0 else (v_rec->>'stock')::int end;
    v_low := case when v_rec->>'low_stock_threshold' in ('', 'null') then 5 else (v_rec->>'low_stock_threshold')::int end;
    v_req := case when v_rec->>'requires_verification' in ('', 'null') then v_is_jv else (v_rec->>'requires_verification')::boolean end;

    -- ---- variant handling by mode ----
    if v_mode = 'add' then
      if exists (select 1 from product_variants where sku = v_sku) then
        v_skipped := v_skipped + 1;
        continue;
      end if;
      insert into product_variants (
        product_id, sku, supplier_sku, storage, ram, colors, display, chipset,
        rear_camera, front_camera, battery, network, regional_model, pta_status,
        sim_lock_status, condition, warranty_type, warranty_duration, warranty_provider,
        warranty_exclusions, listed_price, buy_now_price, instalment_total, stock,
        low_stock_threshold, requires_verification
      ) values (
        v_product_id, v_sku, nullif(v_rec->>'supplier_sku', ''), nullif(v_rec->>'storage', ''),
        nullif(v_rec->>'ram', ''), v_colors, nullif(v_rec->>'display', ''), nullif(v_rec->>'chipset', ''),
        nullif(v_rec->>'rear_camera', ''), nullif(v_rec->>'front_camera', ''),
        nullif(v_rec->>'battery', ''), nullif(v_rec->>'network', ''), nullif(v_rec->>'regional_model', ''),
        nullif(v_pta, ''), nullif(v_simlock, ''), v_cond,
        nullif(v_rec->>'warranty_type', ''), nullif(v_rec->>'warranty_duration', ''),
        nullif(v_rec->>'warranty_provider', ''), nullif(v_rec->>'warranty_exclusions', ''),
        v_listed, v_buy, v_instalment, v_stock, v_low, v_req
      );
      v_imported := v_imported + 1;
    elsif v_mode = 'update' then
      update product_variants set
        product_id = v_product_id,
        supplier_sku = nullif(v_rec->>'supplier_sku', ''),
        storage = nullif(v_rec->>'storage', ''), ram = nullif(v_rec->>'ram', ''), colors = v_colors,
        display = nullif(v_rec->>'display', ''), chipset = nullif(v_rec->>'chipset', ''),
        rear_camera = nullif(v_rec->>'rear_camera', ''), front_camera = nullif(v_rec->>'front_camera', ''),
        battery = nullif(v_rec->>'battery', ''), network = nullif(v_rec->>'network', ''),
        regional_model = nullif(v_rec->>'regional_model', ''),
        pta_status = nullif(v_pta, ''), sim_lock_status = nullif(v_simlock, ''), condition = v_cond,
        warranty_type = nullif(v_rec->>'warranty_type', ''), warranty_duration = nullif(v_rec->>'warranty_duration', ''),
        warranty_provider = nullif(v_rec->>'warranty_provider', ''), warranty_exclusions = nullif(v_rec->>'warranty_exclusions', ''),
        listed_price = v_listed, buy_now_price = v_buy, instalment_total = v_instalment,
        stock = v_stock, low_stock_threshold = v_low, requires_verification = v_req,
        updated_at = now()
      where sku = v_sku;
      if found then
        v_updated := v_updated + 1;
      else
        v_skipped := v_skipped + 1;
      end if;
    else
      -- upsert (default)
      if exists (select 1 from product_variants where sku = v_sku) then
        update product_variants set
          product_id = v_product_id,
          supplier_sku = nullif(v_rec->>'supplier_sku', ''),
          storage = nullif(v_rec->>'storage', ''), ram = nullif(v_rec->>'ram', ''), colors = v_colors,
          display = nullif(v_rec->>'display', ''), chipset = nullif(v_rec->>'chipset', ''),
          rear_camera = nullif(v_rec->>'rear_camera', ''), front_camera = nullif(v_rec->>'front_camera', ''),
          battery = nullif(v_rec->>'battery', ''), network = nullif(v_rec->>'network', ''),
          regional_model = nullif(v_rec->>'regional_model', ''),
          pta_status = nullif(v_pta, ''), sim_lock_status = nullif(v_simlock, ''), condition = v_cond,
          warranty_type = nullif(v_rec->>'warranty_type', ''), warranty_duration = nullif(v_rec->>'warranty_duration', ''),
          warranty_provider = nullif(v_rec->>'warranty_provider', ''), warranty_exclusions = nullif(v_rec->>'warranty_exclusions', ''),
          listed_price = v_listed, buy_now_price = v_buy, instalment_total = v_instalment,
          stock = v_stock, low_stock_threshold = v_low, requires_verification = v_req,
          updated_at = now()
        where sku = v_sku;
        v_updated := v_updated + 1;
      else
        insert into product_variants (
          product_id, sku, supplier_sku, storage, ram, colors, display, chipset,
          rear_camera, front_camera, battery, network, regional_model, pta_status,
          sim_lock_status, condition, warranty_type, warranty_duration, warranty_provider,
          warranty_exclusions, listed_price, buy_now_price, instalment_total, stock,
          low_stock_threshold, requires_verification
        ) values (
          v_product_id, v_sku, nullif(v_rec->>'supplier_sku', ''), nullif(v_rec->>'storage', ''),
          nullif(v_rec->>'ram', ''), v_colors, nullif(v_rec->>'display', ''), nullif(v_rec->>'chipset', ''),
          nullif(v_rec->>'rear_camera', ''), nullif(v_rec->>'front_camera', ''),
          nullif(v_rec->>'battery', ''), nullif(v_rec->>'network', ''), nullif(v_rec->>'regional_model', ''),
          nullif(v_pta, ''), nullif(v_simlock, ''), v_cond,
          nullif(v_rec->>'warranty_type', ''), nullif(v_rec->>'warranty_duration', ''),
          nullif(v_rec->>'warranty_provider', ''), nullif(v_rec->>'warranty_exclusions', ''),
          v_listed, v_buy, v_instalment, v_stock, v_low, v_req
        );
        v_imported := v_imported + 1;
      end if;
    end if;
  end loop;

  insert into import_audit_log (catalog_type, mode, total, imported, updated, skipped, failed, summary, created_by)
    values (v_catalog, v_mode, v_total, v_imported, v_updated, v_skipped, v_failed,
            jsonb_build_object('errors', v_errors),
            auth.uid());

  return jsonb_build_object(
    'total', v_total,
    'imported', v_imported,
    'updated', v_updated,
    'skipped', v_skipped,
    'failed', v_failed,
    'errors', v_errors
  );
end;
$$;

-- Only admins should be able to invoke the import function.
revoke all on function public.import_products(jsonb) from public;
grant execute on function public.import_products(jsonb) to authenticated;


-- >>> FILE: supabase/migrations/00005_admin_control.sql
-- ============================================================
-- RAES TECH — Admin Control Centre (roles, permissions, audit)
-- Idempotent; safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Extend the user_role enum (idempotent)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'content_manager'
      and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type public.user_role add value 'content_manager';
  end if;

  if not exists (
    select 1 from pg_enum
    where enumlabel = 'finance_manager'
      and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    alter type public.user_role add value 'finance_manager';
  end if;
end $$;

-- ------------------------------------------------------------
-- Role -> permission map (used for server-side checks + admin UI)
-- ------------------------------------------------------------
create table if not exists public.admin_permissions (
  role text primary key,
  permissions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_permissions enable row level security;

drop policy if exists "admin_permissions_admin_select" on public.admin_permissions;
create policy "admin_permissions_admin_select" on public.admin_permissions
  for select using (public.is_admin());

drop policy if exists "admin_permissions_admin_write" on public.admin_permissions;
create policy "admin_permissions_admin_write" on public.admin_permissions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

insert into public.admin_permissions (role, permissions) values
  ('super_admin', '["dashboard","settings","appearance","homepage","payments","shipping","warranty","content","menus","coupons","social","seo","roles","system","audit","products","orders","customers","instalments","communications"]'),
  ('product_manager', '["dashboard","products","homepage","seo","settings"]'),
  ('order_manager', '["dashboard","orders","customers"]'),
  ('payment_verifier', '["dashboard","payments","orders","audit"]'),
  ('instalment_reviewer', '["dashboard","instalments","customers"]'),
  ('content_manager', '["dashboard","content","menus","social","seo","appearance","homepage"]'),
  ('finance_manager', '["dashboard","payments","orders","audit","settings"]'),
  ('support_staff', '["dashboard","customers","orders","content"]')
on conflict (role) do update set permissions = excluded.permissions, updated_at = now();

-- ------------------------------------------------------------
-- Admin audit log (append-only for non-admins)
-- ------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text,
  record_id text,
  prior_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

drop policy if exists "audit_insert_auth" on public.admin_audit_log;
create policy "audit_insert_auth" on public.admin_audit_log
  for insert with check (auth.uid() is not null);

drop policy if exists "audit_select_admin" on public.admin_audit_log;
create policy "audit_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

-- Only Super Admin may purge audit records.
drop policy if exists "audit_delete_super" on public.admin_audit_log;
create policy "audit_delete_super" on public.admin_audit_log
  for delete using (public.is_super_admin());

create index if not exists admin_audit_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_actor_idx on public.admin_audit_log(actor_id);
create index if not exists admin_audit_action_idx on public.admin_audit_log(action);


-- >>> FILE: supabase/migrations/00006_admin_seed.sql
-- RAES TECH — Seed the primary website administrator.
--
-- Assigns the `super_admin` role to tech.raes@gmail.com.
--
-- The Auth user itself is created through Supabase Auth (Dashboard / `supabase`
-- CLI `auth` flow or the app sign-up). This migration is idempotent: it runs
-- only when that user already exists, creates their profile if missing, and
-- ensures their role is `super_admin`.

do $$
begin
  if exists (select 1 from auth.users where lower(email) = 'tech.raes@gmail.com') then
    -- Ensure a profile row exists (with the email already on auth.users).
    insert into public.profiles (id, email, full_name)
    select id, email, coalesce(raw_user_meta_data->>'full_name', 'RAES TECH Admin')
    from auth.users
    where lower(email) = 'tech.raes@gmail.com'
    on conflict (id) do nothing;

    -- Grant the super-admin role (idempotent upsert).
    insert into public.user_roles (user_id, role)
    select id, 'super_admin'
    from auth.users
    where lower(email) = 'tech.raes@gmail.com'
    on conflict (user_id) do update set role = 'super_admin';
  end if;
end $$;


-- >>> FILE: supabase/migrations/00007_email_templates_seed.sql
-- RAES TECH — Default transactional email templates.
-- Used by the send-email Edge Function. Subject/body may use {{placeholder}}
-- tokens (see supabase/functions/send-email/render.mjs).
-- Idempotent: upserts by primary key `key`.

insert into public.email_templates (key, subject, body, enabled)
values
  (
    'order_confirmation',
    'Order {{order_number}} confirmed — RAES TECH',
    '<h1>Thank you for your order, {{first_name}}!</h1><p>Your order <strong>{{order_number}}</strong> has been received and is being processed.</p><p>Total: {{total}}</p><p>We will notify you when it ships.</p>',
    true
  ),
  (
    'password_reset',
    'Reset your RAES TECH password',
    '<p>Hi {{first_name}},</p><p>We received a request to reset your password. Click the link below to set a new one:</p><p><a href="{{reset_link}}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>',
    true
  ),
  (
    'instalment_reminder',
    'Instalment due — RAES TECH',
    '<p>Hi {{first_name}},</p><p>This is a reminder that your instalment of <strong>{{amount}}</strong> is due on <strong>{{due_date}}</strong>.</p><p>Thank you for choosing RAES TECH.</p>',
    true
  )
on conflict (key) do update set
  subject = excluded.subject,
  body = excluded.body,
  enabled = excluded.enabled,
  updated_at = now();


-- >>> FILE: supabase/seed_catalog.sql
-- Product catalogue seed generated from catalog XLSX
-- NOTE: product images are NOT attached; admin must upload real photos.

INSERT INTO brands (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Xiaomi', 'xiaomi') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Honor', 'honor') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('itel', 'itel') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Nothing', 'nothing') ON CONFLICT (slug) DO NOTHING;
INSERT INTO brands (name, slug) VALUES ('Motorola', 'motorola') ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Apple', 'apple') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Google', 'google') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Samsung', 'samsung') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('OPPO', 'oppo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('realme', 'realme') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('vivo', 'vivo') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Infinix', 'infinix') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Tecno', 'tecno') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Xiaomi', 'xiaomi') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Xiaomi', 'xiaomi') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Honor', 'honor') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Honor', 'honor') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Honor', 'honor') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('itel', 'itel') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('itel', 'itel') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('itel', 'itel') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Nothing', 'nothing') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (name, slug) VALUES ('Motorola', 'motorola') ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-12-mini', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 12 mini', 'iPhone 12 mini', 'Apple iPhone 12 mini — iPhone 12 mini smartphone at RAES TECH.', 'apple', 'Apple iPhone 12 mini Price in Pakistan | RAES TECH', 'Buy Apple iPhone 12 mini at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00001', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 81000, 72900, 81000, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00002', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 50500, 45450, 50500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00366', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 45500, 40950, 45500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00003', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 89000, 80100, 89000, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00004', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 55500, 49950, 55500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00367', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 50000, 45000, 50000, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00005', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 98500, 88650, 98500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00006', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 61500, 55350, 61500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00368', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '5.4 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2227mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 55500, 49950, 55500, 0, true FROM products WHERE slug='apple-iphone-12-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-12', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 12', 'iPhone 12', 'Apple iPhone 12 — iPhone 12 smartphone at RAES TECH.', 'apple', 'Apple iPhone 12 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 12 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00007', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 85000, 76500, 85000, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00008', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 51500, 46350, 51500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00369', '64GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 46500, 41850, 46500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00009', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 93500, 84150, 93500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00010', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 56500, 50850, 56500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00370', '128GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 51000, 45900, 51000, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00011', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 103500, 93150, 103500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00012', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 63000, 56700, 63000, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00371', '256GB', '4GB', 'Black, White, Red, Green, Blue, Purple', '6.1 OLED 60Hz', 'A14 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 56500, 50850, 56500, 0, true FROM products WHERE slug='apple-iphone-12' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-12-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 12 Pro', 'iPhone 12 Pro', 'Apple iPhone 12 Pro — iPhone 12 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 12 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 12 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00013', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 116000, 104400, 116000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00014', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 80000, 72000, 80000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00372', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 72000, 64800, 72000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00015', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 127500, 114750, 127500, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00016', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 88000, 79200, 88000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00373', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 79000, 71100, 79000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00017', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 141500, 127350, 141500, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00018', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 97500, 87750, 97500, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00374', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.1 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '2815mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 88000, 79200, 88000, 0, true FROM products WHERE slug='apple-iphone-12-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-12-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 12 Pro Max', 'iPhone 12 Pro Max', 'Apple iPhone 12 Pro Max — iPhone 12 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 12 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 12 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00019', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 114500, 103050, 114500, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00020', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 95500, 85950, 95500, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00375', '128GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 86000, 77400, 86000, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00021', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 126000, 113400, 126000, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00022', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 105000, 94500, 105000, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00376', '256GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 94500, 85050, 94500, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00023', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 140000, 126000, 140000, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00024', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 116500, 104850, 116500, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00377', '512GB', '6GB', 'Silver, Graphite, Gold, Pacific Blue', '6.7 OLED 60Hz', 'A14 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3687mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 105000, 94500, 105000, 0, true FROM products WHERE slug='apple-iphone-12-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-13-mini', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 13 mini', 'iPhone 13 mini', 'Apple iPhone 13 mini — iPhone 13 mini smartphone at RAES TECH.', 'apple', 'Apple iPhone 13 mini Price in Pakistan | RAES TECH', 'Buy Apple iPhone 13 mini at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00025', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 90000, 81000, 90000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00026', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 58000, 52200, 58000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00378', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 52000, 46800, 52000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00027', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 99000, 89100, 99000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00028', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 64000, 57600, 64000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00379', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 57500, 51750, 57500, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00029', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 109500, 98550, 109500, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00030', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 71000, 63900, 71000, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00380', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '5.4 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '2406mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 63500, 57150, 63500, 0, true FROM products WHERE slug='apple-iphone-13-mini' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-13', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 13', 'iPhone 13', 'Apple iPhone 13 — iPhone 13 smartphone at RAES TECH.', 'apple', 'Apple iPhone 13 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 13 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00031', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 112000, 100800, 112000, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00032', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 66000, 59400, 66000, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00381', '128GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 59500, 53550, 59500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00033', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 123500, 111150, 123500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00034', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 72500, 65250, 72500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00382', '256GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 65500, 58950, 65500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00035', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 137000, 123300, 137000, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00036', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 80500, 72450, 80500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00383', '512GB', '4GB', 'Pink, Blue, Midnight, Starlight, Red, Green', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3240mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 72500, 65250, 72500, 0, true FROM products WHERE slug='apple-iphone-13' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-13-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 13 Pro', 'iPhone 13 Pro', 'Apple iPhone 13 Pro — iPhone 13 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 13 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 13 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00037', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 137000, 123300, 137000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00038', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 105500, 94950, 105500, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00384', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 95000, 85500, 95000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00039', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 151000, 135900, 151000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00040', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 116000, 104400, 116000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00385', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 104500, 94050, 104500, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00041', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 167500, 150750, 167500, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00042', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 128500, 115650, 128500, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00386', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 116000, 104400, 116000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00043', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 184000, 165600, 184000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00044', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 141500, 127350, 141500, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00387', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.1 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '3095mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-13-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-13-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 13 Pro Max', 'iPhone 13 Pro Max', 'Apple iPhone 13 Pro Max — iPhone 13 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 13 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 13 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00045', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 171500, 154350, 171500, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00046', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 132000, 118800, 132000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00388', '128GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 119000, 107100, 119000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00047', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 189000, 170100, 189000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00048', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 145000, 130500, 145000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00389', '256GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 130500, 117450, 130500, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00049', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 209500, 188550, 209500, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00050', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 161000, 144900, 161000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00390', '512GB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 145000, 130500, 145000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00051', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 230000, 207000, 230000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00052', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 177000, 159300, 177000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00391', '1TB', '6GB', 'Graphite, Gold, Silver, Sierra Blue, Alpine Green', '6.7 OLED 120Hz', 'A15 Bionic', '12MP triple rear; 12MP selfie', '12MP TrueDepth (selfie)', '4352mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 159000, 143100, 159000, 0, true FROM products WHERE slug='apple-iphone-13-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-14', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 14', 'iPhone 14', 'Apple iPhone 14 — iPhone 14 smartphone at RAES TECH.', 'apple', 'Apple iPhone 14 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 14 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00053', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 124000, 111600, 124000, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00054', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 95500, 85950, 95500, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00392', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 86000, 77400, 86000, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00055', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 136500, 122850, 136500, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00056', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 105000, 94500, 105000, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00393', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 94500, 85050, 94500, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00057', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 151500, 136350, 151500, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00058', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 116500, 104850, 116500, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00394', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.1 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3279mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 105000, 94500, 105000, 0, true FROM products WHERE slug='apple-iphone-14' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-14-plus', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 14 Plus', 'iPhone 14 Plus', 'Apple iPhone 14 Plus — iPhone 14 Plus smartphone at RAES TECH.', 'apple', 'Apple iPhone 14 Plus Price in Pakistan | RAES TECH', 'Buy Apple iPhone 14 Plus at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00059', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 104000, 93600, 104000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00060', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 80000, 72000, 80000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00395', '128GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 72000, 64800, 72000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00061', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 114500, 103050, 114500, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00062', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 88000, 79200, 88000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00396', '256GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 79000, 71100, 79000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00063', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00064', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 97500, 87750, 97500, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00397', '512GB', '6GB', 'Midnight, Purple, Starlight, Blue, Yellow, Red', '6.7 OLED 60Hz', 'A15 Bionic', '12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4325mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 88000, 79200, 88000, 0, true FROM products WHERE slug='apple-iphone-14-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-14-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 14 Pro', 'iPhone 14 Pro', 'Apple iPhone 14 Pro — iPhone 14 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 14 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 14 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00065', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 154000, 138600, 154000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00066', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 110000, 99000, 110000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00398', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 99000, 89100, 99000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00067', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 169500, 152550, 169500, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00068', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 121000, 108900, 121000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00399', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 109000, 98100, 109000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00069', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 188000, 169200, 188000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00070', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 134000, 120600, 134000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00400', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 121000, 108900, 121000, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00071', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 206500, 185850, 206500, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00072', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 147500, 132750, 147500, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00401', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.1 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3200mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 132500, 119250, 132500, 0, true FROM products WHERE slug='apple-iphone-14-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-14-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 14 Pro Max', 'iPhone 14 Pro Max', 'Apple iPhone 14 Pro Max — iPhone 14 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 14 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 14 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00073', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 209000, 188100, 209000, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00074', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 144000, 129600, 144000, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00402', '128GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 129500, 116550, 129500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00075', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 229500, 206550, 229500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00076', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 158500, 142650, 158500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00403', '256GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 142500, 128250, 142500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00077', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 254500, 229050, 254500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00078', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 175500, 157950, 175500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00404', '512GB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 158000, 142200, 158000, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00079', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 280000, 252000, 280000, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00080', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 193000, 173700, 193000, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00405', '1TB', '6GB', 'Space Black, Silver, Gold, Deep Purple', '6.7 OLED 120Hz', 'A16 Bionic', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4323mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 173500, 156150, 173500, 0, true FROM products WHERE slug='apple-iphone-14-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-15', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 15', 'iPhone 15', 'Apple iPhone 15 — iPhone 15 smartphone at RAES TECH.', 'apple', 'Apple iPhone 15 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 15 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00081', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 172000, 154800, 172000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00082', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 123000, 110700, 123000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00406', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 110500, 99450, 110500, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00083', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 189500, 170550, 189500, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00084', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 135500, 121950, 135500, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00407', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 122000, 109800, 122000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00085', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 210000, 189000, 210000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00086', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 150000, 135000, 150000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00408', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.1 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3349mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 135000, 121500, 135000, 0, true FROM products WHERE slug='apple-iphone-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-15-plus', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 15 Plus', 'iPhone 15 Plus', 'Apple iPhone 15 Plus — iPhone 15 Plus smartphone at RAES TECH.', 'apple', 'Apple iPhone 15 Plus Price in Pakistan | RAES TECH', 'Buy Apple iPhone 15 Plus at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00087', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 156000, 140400, 156000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00088', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 115500, 103950, 115500, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00409', '128GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 104000, 93600, 104000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00089', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 171500, 154350, 171500, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00090', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00410', '256GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 114500, 103050, 114500, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00091', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 190000, 171000, 190000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00092', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 141000, 126900, 141000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00411', '512GB', '6GB', 'Black, Blue, Green, Yellow, Pink', '6.7 OLED 60Hz Dynamic Island', 'A16 Bionic', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4383mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-15-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-15-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 15 Pro', 'iPhone 15 Pro', 'Apple iPhone 15 Pro — iPhone 15 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 15 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 15 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00093', '128GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 200000, 180000, 200000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00094', '128GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 148000, 133200, 148000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00412', '128GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 133000, 119700, 133000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00095', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 220000, 198000, 220000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00096', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 163000, 146700, 163000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00413', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 146500, 131850, 146500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00097', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 244000, 219600, 244000, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00098', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 180500, 162450, 180500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00414', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 162500, 146250, 162500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00099', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 267500, 240750, 267500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00100', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 198500, 178650, 198500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00415', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.1 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3274mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 178500, 160650, 178500, 0, true FROM products WHERE slug='apple-iphone-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-15-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 15 Pro Max', 'iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max — iPhone 15 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 15 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 15 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00101', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 245500, 220950, 245500, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00102', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 175500, 157950, 175500, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00416', '256GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 158000, 142200, 158000, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00103', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 275000, 247500, 275000, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00104', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 196500, 176850, 196500, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00417', '512GB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 177000, 159300, 177000, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00105', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 309500, 278550, 309500, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00106', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 221000, 198900, 221000, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00418', '1TB', '8GB', 'Black Titanium, White Titanium, Blue Titanium, Natural Titanium', '6.7 OLED 120Hz', 'A17 Pro', '48MP + 12MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4441mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 199000, 179100, 199000, 0, true FROM products WHERE slug='apple-iphone-15-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-16e', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 16e', 'iPhone 16e', 'Apple iPhone 16e — iPhone 16e smartphone at RAES TECH.', 'apple', 'Apple iPhone 16e Price in Pakistan | RAES TECH', 'Buy Apple iPhone 16e at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00107', '128GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 150000, 135000, 150000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00108', '128GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 115500, 103950, 115500, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00419', '128GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 104000, 93600, 104000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00109', '256GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 165000, 148500, 165000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00110', '256GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00420', '256GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 114500, 103050, 114500, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00111', '512GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 183000, 164700, 183000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00112', '512GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 141000, 126900, 141000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00421', '512GB', '8GB', 'Black, White', '6.1 OLED 60Hz', 'A18', '48MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '~4005mAh reported', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 127000, 114300, 127000, 0, true FROM products WHERE slug='apple-iphone-16e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-16', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 16', 'iPhone 16', 'Apple iPhone 16 — iPhone 16 smartphone at RAES TECH.', 'apple', 'Apple iPhone 16 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 16 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00113', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 177000, 159300, 177000, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00114', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 136000, 122400, 136000, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00422', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 122500, 110250, 122500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00115', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 194500, 175050, 194500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00116', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 149500, 134550, 149500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00423', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 134500, 121050, 134500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00117', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 215500, 193950, 215500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00118', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 166000, 149400, 166000, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00424', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.1 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3561mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 149500, 134550, 149500, 0, true FROM products WHERE slug='apple-iphone-16' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-16-plus', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 16 Plus', 'iPhone 16 Plus', 'Apple iPhone 16 Plus — iPhone 16 Plus smartphone at RAES TECH.', 'apple', 'Apple iPhone 16 Plus Price in Pakistan | RAES TECH', 'Buy Apple iPhone 16 Plus at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00119', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 221000, 198900, 221000, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00120', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 170000, 153000, 170000, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00425', '128GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 153000, 137700, 153000, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00121', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 243000, 218700, 243000, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00122', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 187000, 168300, 187000, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00426', '256GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 168500, 151650, 168500, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00123', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 269500, 242550, 269500, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00124', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 207500, 186750, 207500, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00427', '512GB', '8GB', 'Black, White, Pink, Teal, Ultramarine', '6.7 OLED 60Hz', 'A18', '48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4674mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 186500, 167850, 186500, 0, true FROM products WHERE slug='apple-iphone-16-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-16-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 16 Pro', 'iPhone 16 Pro', 'Apple iPhone 16 Pro — iPhone 16 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 16 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 16 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00125', '128GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 227000, 204300, 227000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00126', '128GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 174500, 157050, 174500, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00428', '128GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 157000, 141300, 157000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00127', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 249500, 224550, 249500, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00128', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 192000, 172800, 192000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00429', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 173000, 155700, 173000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00129', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 277000, 249300, 277000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00130', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 213000, 191700, 213000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00430', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 191500, 172350, 191500, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00131', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 304000, 273600, 304000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00132', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 234000, 210600, 234000, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00431', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.3 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '3582mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 210500, 189450, 210500, 0, true FROM products WHERE slug='apple-iphone-16-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-16-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 16 Pro Max', 'iPhone 16 Pro Max', 'Apple iPhone 16 Pro Max — iPhone 16 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 16 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 16 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00133', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 358000, 322200, 358000, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00134', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 275500, 247950, 275500, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00432', '256GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 248000, 223200, 248000, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00135', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 401000, 360900, 401000, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00136', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 308500, 277650, 308500, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00433', '512GB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 277500, 249750, 277500, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00137', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'PTA Approved (verify IMEI on PTA DIRBS)', 'Used / Open-Box', 451500, 406350, 451500, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00138', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / factory unlocked (FU)', 'Used / Open-Box', 347000, 312300, 347000, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00434', '1TB', '8GB', 'Black Titanium, White Titanium, Natural Titanium, Desert Titanium', '6.9 OLED 120Hz', 'A18 Pro', '48MP + 48MP + 12MP rear; 12MP selfie', '12MP TrueDepth (selfie)', '4685mAh', '5G', 'Non-PTA / JV (carrier-locked; needs SIM interposer or SIM-time)', 'Used / Open-Box', 312500, 281250, 312500, 0, true FROM products WHERE slug='apple-iphone-16-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-17e', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 17e', 'iPhone 17e', 'Apple iPhone 17e — iPhone 17e smartphone at RAES TECH.', 'apple', 'Apple iPhone 17e Price in Pakistan | RAES TECH', 'Buy Apple iPhone 17e at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00139', '256GB', 'Model-dependent; verify exact RAM', 'Confirm official Pakistan colorways', 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'PTA Registered', 'Used', 284999, 256499, 284999, 0, true FROM products WHERE slug='apple-iphone-17e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00140', '256GB', 'Model-dependent; verify exact RAM', 'Confirm official Pakistan colorways', 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 222000, 199800, 222000, 0, true FROM products WHERE slug='apple-iphone-17e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00141', '512GB', 'Model-dependent; verify exact RAM', 'Confirm official Pakistan colorways', 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'PTA Registered', 'Used', 329999, 296999, 329999, 0, true FROM products WHERE slug='apple-iphone-17e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00142', '512GB', 'Model-dependent; verify exact RAM', 'Confirm official Pakistan colorways', 'Specs and colors require exact manufacturer SKU verification', 'A19 family (reported)', '48MP class rear (reported); selfie verify', '12MP/18MP depending generation; verify exact model', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 257000, 231300, 257000, 0, true FROM products WHERE slug='apple-iphone-17e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-17', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 17', 'iPhone 17', 'Apple iPhone 17 — iPhone 17 smartphone at RAES TECH.', 'apple', 'Apple iPhone 17 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 17 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00143', '256GB', 'Model-dependent; verify exact RAM', 'Black, White, Mist Blue, Sage, Lavender (regional SKU verify)', '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 399000, 359100, 399000, 0, true FROM products WHERE slug='apple-iphone-17' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00144', '256GB', 'Model-dependent; verify exact RAM', 'Black, White, Mist Blue, Sage, Lavender (regional SKU verify)', '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 295000, 265500, 295000, 0, true FROM products WHERE slug='apple-iphone-17' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00145', '512GB', 'Model-dependent; verify exact RAM', 'Black, White, Mist Blue, Sage, Lavender (regional SKU verify)', '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 482500, 434250, 482500, 0, true FROM products WHERE slug='apple-iphone-17' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00146', '512GB', 'Model-dependent; verify exact RAM', 'Black, White, Mist Blue, Sage, Lavender (regional SKU verify)', '6.3 OLED 120Hz (reported)', 'A19', '48MP-class rear system; verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 348000, 313200, 348000, 0, true FROM products WHERE slug='apple-iphone-17' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-17-air', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 17 Air', 'iPhone 17 Air', 'Apple iPhone 17 Air — iPhone 17 Air smartphone at RAES TECH.', 'apple', 'Apple iPhone 17 Air Price in Pakistan | RAES TECH', 'Buy Apple iPhone 17 Air at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00147', '256GB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 428500, 385650, 428500, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00148', '256GB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 345000, 310500, 345000, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00149', '512GB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 508500, 457650, 508500, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00150', '512GB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 407000, 366300, 407000, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00151', '1TB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 588500, 529650, 588500, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00152', '1TB', 'Model-dependent; verify exact RAM', 'Sky Blue, Light Gold, Cloud White, Space Black (verify)', '6.5 OLED 120Hz (reported)', 'A19 Pro family (reported)', '48MP Fusion (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 469000, 422100, 469000, 0, true FROM products WHERE slug='apple-iphone-17-air' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-17-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 17 Pro', 'iPhone 17 Pro', 'Apple iPhone 17 Pro — iPhone 17 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 17 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 17 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00153', '256GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 491100, 441990, 491100, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00154', '256GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 375000, 337500, 375000, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00155', '512GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 574100, 516690, 574100, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00156', '512GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 442000, 397800, 442000, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00157', '1TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 657100, 591390, 657100, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00158', '1TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.3 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 510000, 459000, 510000, 0, true FROM products WHERE slug='apple-iphone-17-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-17-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 17 Pro Max', 'iPhone 17 Pro Max', 'Apple iPhone 17 Pro Max — iPhone 17 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 17 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 17 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00159', '256GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 535600, 482040, 535600, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00160', '256GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 246000, 221400, 246000, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00161', '512GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 619100, 557190, 619100, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00162', '512GB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 290000, 261000, 290000, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00163', '1TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 702600, 632340, 702600, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00164', '1TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 335000, 301500, 335000, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00165', '2TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'PTA Registered', 'Used', 869100, 782190, 869100, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00166', '2TB', 'Model-dependent; verify exact RAM', 'Cosmic Orange, Deep Blue, Silver (regional SKU verify)', '6.9 OLED 120Hz', 'A19 Pro', '48MP triple rear (reported); verify', '18MP Center Stage (reported)', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 379000, 341100, 379000, 0, true FROM products WHERE slug='apple-iphone-17-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-18', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 18', 'iPhone 18', 'Apple iPhone 18 — iPhone 18 smartphone at RAES TECH.', 'apple', 'Apple iPhone 18 Price in Pakistan | RAES TECH', 'Buy Apple iPhone 18 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00167', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 430000, 387000, 430000, 0, true FROM products WHERE slug='apple-iphone-18' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00168', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 335000, 301500, 335000, 0, true FROM products WHERE slug='apple-iphone-18' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00169', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 510000, 459000, 510000, 0, true FROM products WHERE slug='apple-iphone-18' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00170', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Official Pakistan specifications not independently verified', 'Verify', 'Verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 398000, 358200, 398000, 0, true FROM products WHERE slug='apple-iphone-18' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-18-pro', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 18 Pro', 'iPhone 18 Pro', 'Apple iPhone 18 Pro — iPhone 18 Pro smartphone at RAES TECH.', 'apple', 'Apple iPhone 18 Pro Price in Pakistan | RAES TECH', 'Buy Apple iPhone 18 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00171', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 563999, 507599, 563999, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00172', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 470000, 423000, 470000, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00173', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 651667, 586500, 651667, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00174', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 555000, 499500, 555000, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00175', '1TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 821667, 739500, 821667, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00176', '1TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 639000, 575100, 639000, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00177', '2TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 1075000, 967500, 1075000, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00178', '2TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 724000, 651600, 724000, 0, true FROM products WHERE slug='apple-iphone-18-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('apple-iphone-18-pro-max', (SELECT id FROM brands WHERE slug='apple'), 'Apple iPhone 18 Pro Max', 'iPhone 18 Pro Max', 'Apple iPhone 18 Pro Max — iPhone 18 Pro Max smartphone at RAES TECH.', 'apple', 'Apple iPhone 18 Pro Max Price in Pakistan | RAES TECH', 'Buy Apple iPhone 18 Pro Max at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00179', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 603999, 543599, 603999, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00180', '256GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 510000, 459000, 510000, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00181', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 688999, 620099, 688999, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00182', '512GB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 602000, 541800, 602000, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00183', '1TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 858999, 773099, 858999, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00184', '1TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 694000, 624600, 694000, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00185', '2TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'PTA Registered', 'Used', 1019000, 917100, 1019000, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00186', '2TB', 'Model-dependent; verify exact RAM', 'Official Pakistan colorways not verified', 'Retailer-reported OLED 120Hz; verify', 'A-series Pro chipset; verify', 'Triple-camera system reported; verify', 'Verify', 'Verify', '5G', 'Non-PTA / unregistered', 'Used / Open-Box', 785000, 706500, 785000, 0, true FROM products WHERE slug='apple-iphone-18-pro-max' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-6', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 6', 'Pixel 6', 'Google Pixel 6 — Pixel 6 smartphone at RAES TECH.', 'google', 'Google Pixel 6 Price in Pakistan | RAES TECH', 'Buy Google Pixel 6 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00187', '128GB', '8GB', 'Obsidian, Sorta Seafoam, Kinda Coral', '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 75000, 67500, 75000, 0, true FROM products WHERE slug='google-pixel-6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00188', '128GB', '8GB', 'Obsidian, Sorta Seafoam, Kinda Coral', '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 50000, 45000, 50000, 0, true FROM products WHERE slug='google-pixel-6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00189', '256GB', '8GB', 'Obsidian, Sorta Seafoam, Kinda Coral', '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 87000, 78300, 87000, 0, true FROM products WHERE slug='google-pixel-6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00190', '256GB', '8GB', 'Obsidian, Sorta Seafoam, Kinda Coral', '6.4 AMOLED 90Hz', 'Tensor G1', '50MP + 12MP', 'Model-dependent; verify', '4614mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 58000, 52200, 58000, 0, true FROM products WHERE slug='google-pixel-6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-6-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 6 Pro', 'Pixel 6 Pro', 'Google Pixel 6 Pro — Pixel 6 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 6 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 6 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00191', '128GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 218000, 196200, 218000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00192', '128GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 144000, 129600, 144000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00193', '256GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 254000, 228600, 254000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00194', '256GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 168000, 151200, 168000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00195', '512GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 296000, 266400, 296000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00196', '512GB', '12GB', 'Stormy Black, Cloudy White, Sorta Sunny', '6.7 LTPO OLED 120Hz', 'Tensor G1', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5003mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 196000, 176400, 196000, 0, true FROM products WHERE slug='google-pixel-6-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-6a', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 6a', 'Pixel 6a', 'Google Pixel 6a — Pixel 6a smartphone at RAES TECH.', 'google', 'Google Pixel 6a Price in Pakistan | RAES TECH', 'Buy Google Pixel 6a at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00197', '128GB', '6GB', 'Charcoal, Chalk, Sage', '6.1 OLED 60Hz', 'Tensor G1', '12.2MP + 12MP', 'Model-dependent; verify', '4410mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 58000, 52200, 58000, 0, true FROM products WHERE slug='google-pixel-6a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00198', '128GB', '6GB', 'Charcoal, Chalk, Sage', '6.1 OLED 60Hz', 'Tensor G1', '12.2MP + 12MP', 'Model-dependent; verify', '4410mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 39000, 35100, 39000, 0, true FROM products WHERE slug='google-pixel-6a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-7', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 7', 'Pixel 7', 'Google Pixel 7 — Pixel 7 smartphone at RAES TECH.', 'google', 'Google Pixel 7 Price in Pakistan | RAES TECH', 'Buy Google Pixel 7 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00199', '128GB', '8GB', 'Obsidian, Snow, Lemongrass', '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 114000, 102600, 114000, 0, true FROM products WHERE slug='google-pixel-7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00200', '128GB', '8GB', 'Obsidian, Snow, Lemongrass', '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 76000, 68400, 76000, 0, true FROM products WHERE slug='google-pixel-7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00201', '256GB', '8GB', 'Obsidian, Snow, Lemongrass', '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 133000, 119700, 133000, 0, true FROM products WHERE slug='google-pixel-7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00202', '256GB', '8GB', 'Obsidian, Snow, Lemongrass', '6.3 OLED 90Hz', 'Tensor G2', '50MP + 12MP', 'Model-dependent; verify', '4355mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 88000, 79200, 88000, 0, true FROM products WHERE slug='google-pixel-7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-7-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 7 Pro', 'Pixel 7 Pro', 'Google Pixel 7 Pro — Pixel 7 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 7 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 7 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00203', '128GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 110000, 99000, 110000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00204', '128GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 73000, 65700, 73000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00205', '256GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 129000, 116100, 129000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00206', '256GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 85000, 76500, 85000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00207', '512GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 151000, 135900, 151000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00208', '512GB', '12GB', 'Obsidian, Snow, Hazel', '6.7 LTPO OLED 120Hz', 'Tensor G2', '50MP + 12MP + 48MP', 'Model-dependent; verify', '5000mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 100000, 90000, 100000, 0, true FROM products WHERE slug='google-pixel-7-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-7a', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 7a', 'Pixel 7a', 'Google Pixel 7a — Pixel 7a smartphone at RAES TECH.', 'google', 'Google Pixel 7a Price in Pakistan | RAES TECH', 'Buy Google Pixel 7a at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00209', '128GB', '8GB', 'Charcoal, Snow, Sea, Coral', '6.1 OLED 90Hz', 'Tensor G2', '64MP + 13MP', 'Model-dependent; verify', '4385mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 98000, 88200, 98000, 0, true FROM products WHERE slug='google-pixel-7a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00210', '128GB', '8GB', 'Charcoal, Snow, Sea, Coral', '6.1 OLED 90Hz', 'Tensor G2', '64MP + 13MP', 'Model-dependent; verify', '4385mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 64000, 57600, 64000, 0, true FROM products WHERE slug='google-pixel-7a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-8', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 8', 'Pixel 8', 'Google Pixel 8 — Pixel 8 smartphone at RAES TECH.', 'google', 'Google Pixel 8 Price in Pakistan | RAES TECH', 'Buy Google Pixel 8 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00211', '128GB', '8GB', 'Obsidian, Hazel, Rose', '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 150000, 135000, 150000, 0, true FROM products WHERE slug='google-pixel-8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00212', '128GB', '8GB', 'Obsidian, Hazel, Rose', '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 99000, 89100, 99000, 0, true FROM products WHERE slug='google-pixel-8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00213', '256GB', '8GB', 'Obsidian, Hazel, Rose', '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 173000, 155700, 173000, 0, true FROM products WHERE slug='google-pixel-8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00214', '256GB', '8GB', 'Obsidian, Hazel, Rose', '6.2 OLED 120Hz', 'Tensor G3', '50MP + 12MP', 'Model-dependent; verify', '4575mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 114000, 102600, 114000, 0, true FROM products WHERE slug='google-pixel-8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-8-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 8 Pro', 'Pixel 8 Pro', 'Google Pixel 8 Pro — Pixel 8 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 8 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 8 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00215', '128GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 161000, 144900, 161000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00216', '128GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 107000, 96300, 107000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00217', '256GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 187000, 168300, 187000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00218', '256GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 124000, 111600, 124000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00219', '512GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 220000, 198000, 220000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00220', '512GB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 145000, 130500, 145000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00221', '1TB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 250000, 225000, 250000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00222', '1TB', '12GB', 'Obsidian, Porcelain, Bay, Mint', '6.7 LTPO OLED 120Hz', 'Tensor G3', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5050mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 165000, 148500, 165000, 0, true FROM products WHERE slug='google-pixel-8-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-8a', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 8a', 'Pixel 8a', 'Google Pixel 8a — Pixel 8a smartphone at RAES TECH.', 'google', 'Google Pixel 8a Price in Pakistan | RAES TECH', 'Buy Google Pixel 8a at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00223', '128GB', '8GB', 'Obsidian, Porcelain, Bay, Aloe', '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 124000, 111600, 124000, 0, true FROM products WHERE slug='google-pixel-8a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00224', '128GB', '8GB', 'Obsidian, Porcelain, Bay, Aloe', '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 82000, 73800, 82000, 0, true FROM products WHERE slug='google-pixel-8a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00225', '256GB', '8GB', 'Obsidian, Porcelain, Bay, Aloe', '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 143000, 128700, 143000, 0, true FROM products WHERE slug='google-pixel-8a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00226', '256GB', '8GB', 'Obsidian, Porcelain, Bay, Aloe', '6.1 OLED 120Hz', 'Tensor G3', '64MP + 13MP', 'Model-dependent; verify', '4492mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 95000, 85500, 95000, 0, true FROM products WHERE slug='google-pixel-8a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-9', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 9', 'Pixel 9', 'Google Pixel 9 — Pixel 9 smartphone at RAES TECH.', 'google', 'Google Pixel 9 Price in Pakistan | RAES TECH', 'Buy Google Pixel 9 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00227', '128GB', '12GB', 'Obsidian, Porcelain, Wintergreen, Peony', '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 188000, 169200, 188000, 0, true FROM products WHERE slug='google-pixel-9' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00228', '128GB', '12GB', 'Obsidian, Porcelain, Wintergreen, Peony', '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 125000, 112500, 125000, 0, true FROM products WHERE slug='google-pixel-9' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00229', '256GB', '12GB', 'Obsidian, Porcelain, Wintergreen, Peony', '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 218000, 196200, 218000, 0, true FROM products WHERE slug='google-pixel-9' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00230', '256GB', '12GB', 'Obsidian, Porcelain, Wintergreen, Peony', '6.3 OLED 120Hz', 'Tensor G4', '50MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 144000, 129600, 144000, 0, true FROM products WHERE slug='google-pixel-9' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-9-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 9 Pro', 'Pixel 9 Pro', 'Google Pixel 9 Pro — Pixel 9 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 9 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 9 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00231', '128GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 287000, 258300, 287000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00232', '128GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 190000, 171000, 190000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00233', '256GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 333000, 299700, 333000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00234', '256GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 220000, 198000, 220000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00235', '512GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 391000, 351900, 391000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00236', '512GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 259000, 233100, 259000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00237', '1TB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 446000, 401400, 446000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00238', '1TB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.3 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '4700mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 295000, 265500, 295000, 0, true FROM products WHERE slug='google-pixel-9-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-9-pro-xl', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 9 Pro XL', 'Pixel 9 Pro XL', 'Google Pixel 9 Pro XL — Pixel 9 Pro XL smartphone at RAES TECH.', 'google', 'Google Pixel 9 Pro XL Price in Pakistan | RAES TECH', 'Buy Google Pixel 9 Pro XL at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00239', '128GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 348000, 313200, 348000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00240', '128GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 230000, 207000, 230000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00241', '256GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 404000, 363600, 404000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00242', '256GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 267000, 240300, 267000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00243', '512GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 473000, 425700, 473000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00244', '512GB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 313000, 281700, 313000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00245', '1TB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 540000, 486000, 540000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00246', '1TB', '16GB', 'Obsidian, Porcelain, Hazel, Rose Quartz', '6.8 LTPO OLED 120Hz', 'Tensor G4', '50MP + 48MP + 48MP', 'Model-dependent; verify', '5060mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 357000, 321300, 357000, 0, true FROM products WHERE slug='google-pixel-9-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-9a', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 9a', 'Pixel 9a', 'Google Pixel 9a — Pixel 9a smartphone at RAES TECH.', 'google', 'Google Pixel 9a Price in Pakistan | RAES TECH', 'Buy Google Pixel 9a at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00247', '128GB', '8GB', 'Obsidian, Porcelain, Iris, Peony', '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 169000, 152100, 169000, 0, true FROM products WHERE slug='google-pixel-9a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00248', '128GB', '8GB', 'Obsidian, Porcelain, Iris, Peony', '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 112000, 100800, 112000, 0, true FROM products WHERE slug='google-pixel-9a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00249', '256GB', '8GB', 'Obsidian, Porcelain, Iris, Peony', '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 196000, 176400, 196000, 0, true FROM products WHERE slug='google-pixel-9a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00250', '256GB', '8GB', 'Obsidian, Porcelain, Iris, Peony', '6.3 OLED 120Hz', 'Tensor G4', '48MP + 13MP', 'Model-dependent; verify', '5100mAh', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 130000, 117000, 130000, 0, true FROM products WHERE slug='google-pixel-9a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-10', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 10', 'Pixel 10', 'Google Pixel 10 — Pixel 10 smartphone at RAES TECH.', 'google', 'Google Pixel 10 Price in Pakistan | RAES TECH', 'Buy Google Pixel 10 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00251', '128GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 254000, 228600, 254000, 0, true FROM products WHERE slug='google-pixel-10' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00252', '128GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 168000, 151200, 168000, 0, true FROM products WHERE slug='google-pixel-10' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00253', '256GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 294000, 264600, 294000, 0, true FROM products WHERE slug='google-pixel-10' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00254', '256GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (reported)', 'Tensor G5 (reported)', '48MP-class system (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 194000, 174600, 194000, 0, true FROM products WHERE slug='google-pixel-10' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-10-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 10 Pro', 'Pixel 10 Pro', 'Google Pixel 10 Pro — Pixel 10 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 10 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 10 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00255', '128GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 228000, 205200, 228000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00256', '128GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 150000, 135000, 150000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00257', '256GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 264000, 237600, 264000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00258', '256GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 175000, 157500, 175000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00259', '512GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 309000, 278100, 309000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00260', '512GB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 205000, 184500, 205000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00261', '1TB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 352000, 316800, 352000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00262', '1TB', '16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4870mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 233000, 209700, 233000, 0, true FROM products WHERE slug='google-pixel-10-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-10-pro-xl', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 10 Pro XL', 'Pixel 10 Pro XL', 'Google Pixel 10 Pro XL — Pixel 10 Pro XL smartphone at RAES TECH.', 'google', 'Google Pixel 10 Pro XL Price in Pakistan | RAES TECH', 'Buy Google Pixel 10 Pro XL at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00263', '256GB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 339000, 305100, 339000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00264', '256GB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 224000, 201600, 224000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00265', '512GB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 398000, 358200, 398000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00266', '512GB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 263000, 236700, 263000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00267', '1TB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 454000, 408600, 454000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00268', '1TB', '16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 300000, 270000, 300000, 0, true FROM products WHERE slug='google-pixel-10-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-10-pro-fold', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 10 Pro Fold', 'Pixel 10 Pro Fold', 'Google Pixel 10 Pro Fold — Pixel 10 Pro Fold smartphone at RAES TECH.', 'google', 'Google Pixel 10 Pro Fold Price in Pakistan | RAES TECH', 'Buy Google Pixel 10 Pro Fold at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00269', '256GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 498000, 448200, 498000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00270', '256GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 329000, 296100, 329000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00271', '512GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 584000, 525600, 584000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00272', '512GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 386000, 347400, 386000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00273', '1TB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 666000, 599400, 666000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00274', '1TB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable LTPO OLED 120Hz (reported)', 'Tensor G5 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 440000, 396000, 440000, 0, true FROM products WHERE slug='google-pixel-10-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-10a', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 10a', 'Pixel 10a', 'Google Pixel 10a — Pixel 10a smartphone at RAES TECH.', 'google', 'Google Pixel 10a Price in Pakistan | RAES TECH', 'Buy Google Pixel 10a at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00275', '128GB', '8GB', 'Colorways, specs require verification', 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 150000, 135000, 150000, 0, true FROM products WHERE slug='google-pixel-10a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00276', '128GB', '8GB', 'Colorways, specs require verification', 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 99000, 89100, 99000, 0, true FROM products WHERE slug='google-pixel-10a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00277', '256GB', '8GB', 'Colorways, specs require verification', 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 173000, 155700, 173000, 0, true FROM products WHERE slug='google-pixel-10a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00278', '256GB', '8GB', 'Colorways, specs require verification', 'Manufacturer specs not independently verified', 'Verify', 'Verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 114000, 102600, 114000, 0, true FROM products WHERE slug='google-pixel-10a' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-11', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 11', 'Pixel 11', 'Google Pixel 11 — Pixel 11 smartphone at RAES TECH.', 'google', 'Google Pixel 11 Price in Pakistan | RAES TECH', 'Buy Google Pixel 11 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00279', '128GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 286000, 257400, 286000, 0, true FROM products WHERE slug='google-pixel-11' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00280', '128GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 189000, 170100, 189000, 0, true FROM products WHERE slug='google-pixel-11' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00281', '256GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 332000, 298800, 332000, 0, true FROM products WHERE slug='google-pixel-11' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00282', '256GB', '12GB', 'Colorways require Pakistan SKU check', '6.3 OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP-class system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 219000, 197100, 219000, 0, true FROM products WHERE slug='google-pixel-11' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-11-pro', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 11 Pro', 'Pixel 11 Pro', 'Google Pixel 11 Pro — Pixel 11 Pro smartphone at RAES TECH.', 'google', 'Google Pixel 11 Pro Price in Pakistan | RAES TECH', 'Buy Google Pixel 11 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00283', '256GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 520000, 468000, 520000, 0, true FROM products WHERE slug='google-pixel-11-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00284', '256GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 344000, 309600, 344000, 0, true FROM products WHERE slug='google-pixel-11-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00285', '512GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 610000, 549000, 610000, 0, true FROM products WHERE slug='google-pixel-11-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00286', '512GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.3 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '4850mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 403000, 362700, 403000, 0, true FROM products WHERE slug='google-pixel-11-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-11-pro-xl', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 11 Pro XL', 'Pixel 11 Pro XL', 'Google Pixel 11 Pro XL — Pixel 11 Pro XL smartphone at RAES TECH.', 'google', 'Google Pixel 11 Pro XL Price in Pakistan | RAES TECH', 'Buy Google Pixel 11 Pro XL at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00287', '256GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 573000, 515700, 573000, 0, true FROM products WHERE slug='google-pixel-11-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00288', '256GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 379000, 341100, 379000, 0, true FROM products WHERE slug='google-pixel-11-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00289', '512GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 672000, 604800, 672000, 0, true FROM products WHERE slug='google-pixel-11-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00290', '512GB', '12GB/16GB', 'Colorways require Pakistan SKU check', '6.8 LTPO OLED 120Hz (retailer-reported)', 'Tensor G6 (retailer-reported)', '50MP + 48MP + 48MP (reported)', 'Model-dependent; verify', '5115mAh reported', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 445000, 400500, 445000, 0, true FROM products WHERE slug='google-pixel-11-pro-xl' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('google-pixel-11-pro-fold', (SELECT id FROM brands WHERE slug='google'), 'Google Pixel 11 Pro Fold', 'Pixel 11 Pro Fold', 'Google Pixel 11 Pro Fold — Pixel 11 Pro Fold smartphone at RAES TECH.', 'google', 'Google Pixel 11 Pro Fold Price in Pakistan | RAES TECH', 'Buy Google Pixel 11 Pro Fold at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00291', '256GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 800000, 720000, 800000, 0, true FROM products WHERE slug='google-pixel-11-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00292', '256GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 529000, 476100, 529000, 0, true FROM products WHERE slug='google-pixel-11-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00293', '512GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'PTA Registered (IMEI verification required)', 'Used', 937000, 843300, 937000, 0, true FROM products WHERE slug='google-pixel-11-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00294', '512GB', '16GB', 'Colorways require Pakistan SKU check', 'Foldable OLED 120Hz (reported)', 'Tensor G6 (reported)', 'Multi-camera system; verify', 'Model-dependent; verify', 'Verify', '5G on supported models', 'CPID / Modified (NOT official PTA status)', 'Used', 620000, 558000, 620000, 0, true FROM products WHERE slug='google-pixel-11-pro-fold' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s26-ultra', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S26 Ultra', 'Galaxy S26 Ultra', 'Samsung Galaxy S26 Ultra — Galaxy S26 Ultra smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S26 Ultra Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S26 Ultra at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00295', '256GB', '12GB', 'Black, Violet, Blue, White (verify)', '6.9 AMOLED 120Hz (reported)', 'Regional chipset verify', '200MP-class multi-camera (reported)', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 387495, 348746, 387495, 0, true FROM products WHERE slug='samsung-galaxy-s26-ultra' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s26-plus', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S26 Plus', 'Galaxy S26 Plus', 'Samsung Galaxy S26 Plus — Galaxy S26 Plus smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S26 Plus Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S26 Plus at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00296', '256GB', '12GB', 'Colors verify', '6.7 AMOLED 120Hz (reported)', 'Regional chipset verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 330495, 297446, 330495, 0, true FROM products WHERE slug='samsung-galaxy-s26-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s26', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S26', 'Galaxy S26', 'Samsung Galaxy S26 — Galaxy S26 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S26 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S26 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00297', '256GB', '12GB', 'Colors verify', '6.3 AMOLED 120Hz (reported)', 'Regional chipset verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 284500, 256050, 284500, 0, true FROM products WHERE slug='samsung-galaxy-s26' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s26-fe', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S26 FE', 'Galaxy S26 FE', 'Samsung Galaxy S26 FE — Galaxy S26 FE smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S26 FE Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S26 FE at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00298', '256GB', '8GB', 'Colors verify', 'AMOLED 120Hz (reported)', 'Verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 231995, 208796, 231995, 0, true FROM products WHERE slug='samsung-galaxy-s26-fe' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a57-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A57 5G', 'Galaxy A57 5G', 'Samsung Galaxy A57 5G — Galaxy A57 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A57 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A57 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00299', '256GB', '8GB', 'Colors verify', '6.7 Super AMOLED 120Hz (reported)', 'Exynos family; verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 165495, 148946, 165495, 0, true FROM products WHERE slug='samsung-galaxy-a57-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a37-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A37 5G', 'Galaxy A37 5G', 'Samsung Galaxy A37 5G — Galaxy A37 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A37 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A37 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00300', '256GB', '8GB', 'Colors verify', 'Super AMOLED 120Hz (reported)', 'Verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 131495, 118346, 131495, 0, true FROM products WHERE slug='samsung-galaxy-a37-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a27-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A27 5G', 'Galaxy A27 5G', 'Samsung Galaxy A27 5G — Galaxy A27 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A27 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A27 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00301', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh rate (reported)', 'Verify', '50MP main class; verify', 'Verify', '5000mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 109995, 98996, 109995, 0, true FROM products WHERE slug='samsung-galaxy-a27-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a17-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A17 5G', 'Galaxy A17 5G', 'Samsung Galaxy A17 5G — Galaxy A17 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A17 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A17 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00302', '256GB', '8GB', 'Black, Gray, Blue (verify)', '6.7 Super AMOLED 90Hz (reported)', 'Verify regional chipset', '50MP-class rear; verify', 'Verify', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 89995, 80996, 89995, 0, true FROM products WHERE slug='samsung-galaxy-a17-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a17-4g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A17 4G', 'Galaxy A17 4G', 'Samsung Galaxy A17 4G — Galaxy A17 4G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A17 4G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A17 4G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00303', '128GB', '6GB', 'Black, Gray, Blue (verify)', '6.7 Super AMOLED 90Hz (reported)', 'Helio family; verify', '50MP-class rear; verify', 'Verify', '5000mAh', 'No', 'PTA Approved (verify IMEI)', 'Used', 62995, 56696, 62995, 0, true FROM products WHERE slug='samsung-galaxy-a17-4g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a07', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A07', 'Galaxy A07', 'Samsung Galaxy A07 — Galaxy A07 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A07 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A07 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00304', '128GB', '4GB', 'Black, Silver, Green (verify)', '6.7 LCD 90Hz (reported)', 'Helio family; verify', '50MP + depth (reported)', 'Verify', '5000mAh', 'No', 'PTA Approved (verify IMEI)', 'Used', 36495, 32846, 36495, 0, true FROM products WHERE slug='samsung-galaxy-a07' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a56-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A56 5G', 'Galaxy A56 5G', 'Samsung Galaxy A56 5G — Galaxy A56 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A56 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A56 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00305', '256GB', '8GB', 'Awesome Lightgray, Graphite, Olive, Pink', '6.7 Super AMOLED 120Hz', 'Exynos 1580', '50MP + 12MP + 5MP', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 145999, 131399, 145999, 0, true FROM products WHERE slug='samsung-galaxy-a56-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-a36-5g', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy A36 5G', 'Galaxy A36 5G', 'Samsung Galaxy A36 5G — Galaxy A36 5G smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy A36 5G Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy A36 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00306', '256GB', '8GB', 'Black, White, Lavender, Lime', '6.7 Super AMOLED 120Hz', 'Snapdragon 6 Gen 3', '50MP + 8MP + 5MP', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 129999, 116999, 129999, 0, true FROM products WHERE slug='samsung-galaxy-a36-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s25-fe', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S25 FE', 'Galaxy S25 FE', 'Samsung Galaxy S25 FE — Galaxy S25 FE smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S25 FE Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S25 FE at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00307', '256GB', '8GB', 'Colors verify', '6.7 Dynamic AMOLED 2X 120Hz', 'Verify regional chipset', '50MP-class multi-camera; verify', 'Verify', '4900mAh class', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 189999, 170999, 189999, 0, true FROM products WHERE slug='samsung-galaxy-s25-fe' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-s25-ultra', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy S25 Ultra', 'Galaxy S25 Ultra', 'Samsung Galaxy S25 Ultra — Galaxy S25 Ultra smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy S25 Ultra Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy S25 Ultra at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00308', '256GB', '12GB', 'Titanium colorways, confirm SKU', '6.9 Dynamic AMOLED 2X 120Hz', 'Snapdragon 8 Elite', '200MP + ultra-wide + telephoto system', '12MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 332999, 299699, 332999, 0, true FROM products WHERE slug='samsung-galaxy-s25-ultra' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold8-ultra', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold8 Ultra', 'Galaxy Z Fold8 Ultra', 'Samsung Galaxy Z Fold8 Ultra — Galaxy Z Fold8 Ultra smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold8 Ultra Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold8 Ultra at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00435', '256GB', '12GB', 'Graphite, Cream, Violet Shadow', '8.0&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.5&quot;)', 'Snapdragon 8 Elite Gen 5', '200MP + 50MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '5000mAh', '5G', 'Non-PTA (new import)', 'Used', 494999, 445499, 494999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold8-ultra' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00436', '512GB', '12GB', 'Graphite, Cream, Violet Shadow', '8.0&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.5&quot;)', 'Snapdragon 8 Elite Gen 5', '200MP + 50MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '5000mAh', '5G', 'Non-PTA (new import)', 'Used', 509999, 458999, 509999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold8-ultra' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold8', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold8', 'Galaxy Z Fold8', 'Samsung Galaxy Z Fold8 — Galaxy Z Fold8 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold8 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold8 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00437', '256GB', '12GB', 'Colours not stated on retailer, price sources used, confirm on carton', '7.6&quot; foldable 120Hz (cover 5.5&quot;)', 'Snapdragon 8 Elite Gen 5', '50MP + 50MP ultrawide (no telephoto)', '10MP', '4800mAh', '5G', 'Non-PTA (new import)', 'Used', 469999, 422999, 469999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00438', '512GB', '12GB', 'Colours not stated on retailer, price sources used, confirm on carton', '7.6&quot; foldable 120Hz (cover 5.5&quot;)', 'Snapdragon 8 Elite Gen 5', '50MP + 50MP ultrawide (no telephoto)', '10MP', '4800mAh', '5G', 'Non-PTA (new import)', 'Used', 519999, 467999, 519999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold8' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold7', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold7', 'Galaxy Z Fold7', 'Samsung Galaxy Z Fold7 — Galaxy Z Fold7 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold7 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold7 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00439', '256GB', '12GB', 'Blue Shadow, Silver Shadow, Jet Black, Mint', '8.0&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.5&quot;)', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'Used', 374999, 337499, 374999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00440', '512GB', '12GB', 'Blue Shadow, Silver Shadow, Jet Black, Mint', '8.0&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.5&quot;)', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'Used', 434499, 391049, 434499, 0, true FROM products WHERE slug='samsung-galaxy-z-fold7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00441', '1TB', '16GB', 'Blue Shadow, Silver Shadow, Jet Black, Mint', '8.0&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.5&quot;)', 'Snapdragon 8 Elite', '200MP + 12MP ultrawide + 10MP 3x tele', '10MP cover + 10MP inner', '4400mAh', '5G', 'Non-PTA (new import)', 'Used', 531999, 478799, 531999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold7' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold6', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold6', 'Galaxy Z Fold6', 'Samsung Galaxy Z Fold6 — Galaxy Z Fold6 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold6 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold6 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00442', '256GB', '12GB', 'Silver Shadow, Pink, Navy', '7.6&quot; foldable LTPO AMOLED 2X 120Hz (cover 6.3&quot;)', 'Snapdragon 8 Gen 3', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'Non-PTA (new import)', 'Used', 339999, 305999, 339999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold5', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold5', 'Galaxy Z Fold5', 'Samsung Galaxy Z Fold5 — Galaxy Z Fold5 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold5 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold5 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00443', '256GB', '12GB', 'Icy Blue, Phantom Black, Cream', '7.6&quot; foldable Dynamic AMOLED 2X 120Hz (cover 6.2&quot;)', 'Snapdragon 8 Gen 2', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'PTA Approved (used; verify IMEI)', 'Used / Open-Box', 269999, 242999, 269999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold5' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00444', '256GB', '12GB', 'Icy Blue, Phantom Black, Cream', '7.6&quot; foldable Dynamic AMOLED 2X 120Hz (cover 6.2&quot;)', 'Snapdragon 8 Gen 2', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'Non-PTA (used)', 'Used / Open-Box', 169999, 152999, 169999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold5' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('samsung-galaxy-z-fold4', (SELECT id FROM brands WHERE slug='samsung'), 'Samsung Galaxy Z Fold4', 'Galaxy Z Fold4', 'Samsung Galaxy Z Fold4 — Galaxy Z Fold4 smartphone at RAES TECH.', 'samsung', 'Samsung Galaxy Z Fold4 Price in Pakistan | RAES TECH', 'Buy Samsung Galaxy Z Fold4 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00445', '256GB', '12GB', 'Graygreen, Phantom Black, Beige', '7.6&quot; foldable Dynamic AMOLED 2X 120Hz (cover 6.2&quot;)', 'Snapdragon 8+ Gen 1', '50MP + 12MP ultrawide + 10MP 3x tele', '4MP under-display + 10MP cover', '4400mAh', '5G', 'PTA Approved (used; verify IMEI)', 'Used / Open-Box', 199999, 179999, 199999, 0, true FROM products WHERE slug='samsung-galaxy-z-fold4' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-a6', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO A6', 'A6', 'OPPO A6 — A6 smartphone at RAES TECH.', 'oppo', 'OPPO A6 Price in Pakistan | RAES TECH', 'Buy OPPO A6 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00309', '128GB', '8GB', 'Colors verify', '6.7 LCD high refresh (reported)', 'Verify', '50MP-class main; verify', 'Verify', '7000mAh class reported', '4G/5G SKU verify', 'PTA Approved (verify IMEI)', 'Used', 69995, 62996, 69995, 0, true FROM products WHERE slug='oppo-a6' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-reno-16f-5g', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO Reno 16F 5G', 'Reno 16F 5G', 'OPPO Reno 16F 5G — Reno 16F 5G smartphone at RAES TECH.', 'oppo', 'OPPO Reno 16F 5G Price in Pakistan | RAES TECH', 'Buy OPPO Reno 16F 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00310', '256GB', '8GB', 'Colors verify', 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 139495, 125546, 139495, 0, true FROM products WHERE slug='oppo-reno-16f-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-reno-16-5g', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO Reno 16 5G', 'Reno 16 5G', 'OPPO Reno 16 5G — Reno 16 5G smartphone at RAES TECH.', 'oppo', 'OPPO Reno 16 5G Price in Pakistan | RAES TECH', 'Buy OPPO Reno 16 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00311', '256GB', '12GB', 'Colors verify', 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 183495, 165146, 183495, 0, true FROM products WHERE slug='oppo-reno-16-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-a6c', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO A6C', 'A6C', 'OPPO A6C — A6C smartphone at RAES TECH.', 'oppo', 'OPPO A6C Price in Pakistan | RAES TECH', 'Buy OPPO A6C at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00312', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Helio family; verify', 'Camera specs verify', 'Verify', '5000mAh class', 'No', 'PTA Approved (verify IMEI)', 'Used', 43495, 39146, 43495, 0, true FROM products WHERE slug='oppo-a6c' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-a6s-pro', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO A6s Pro', 'A6s Pro', 'OPPO A6s Pro — A6s Pro smartphone at RAES TECH.', 'oppo', 'OPPO A6s Pro Price in Pakistan | RAES TECH', 'Buy OPPO A6s Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00313', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify exact SKU', 'PTA Approved (verify IMEI)', 'Used', 104995, 94496, 104995, 0, true FROM products WHERE slug='oppo-a6s-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-a6k', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO A6K', 'A6K', 'OPPO A6K — A6K smartphone at RAES TECH.', 'oppo', 'OPPO A6K Price in Pakistan | RAES TECH', 'Buy OPPO A6K at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00314', '128GB', '6GB', 'Colors verify', 'LCD; verify', 'Verify', '50MP-class main; verify', 'Verify', '5000mAh class', 'No', 'PTA Approved (verify IMEI)', 'Used', 53995, 48596, 53995, 0, true FROM products WHERE slug='oppo-a6k' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-a6s', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO A6s', 'A6s', 'OPPO A6s — A6s smartphone at RAES TECH.', 'oppo', 'OPPO A6s Price in Pakistan | RAES TECH', 'Buy OPPO A6s at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00315', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify exact SKU', 'PTA Approved (verify IMEI)', 'Used', 91995, 82796, 91995, 0, true FROM products WHERE slug='oppo-a6s' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-reno-15-pro', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO Reno 15 Pro', 'Reno 15 Pro', 'OPPO Reno 15 Pro — Reno 15 Pro smartphone at RAES TECH.', 'oppo', 'OPPO Reno 15 Pro Price in Pakistan | RAES TECH', 'Buy OPPO Reno 15 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00316', '512GB', '12GB', 'Dusk Brown, Aurora Blue', 'AMOLED; exact refresh verify', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', '6200mAh listing reference', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 234999, 211499, 234999, 0, true FROM products WHERE slug='oppo-reno-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-reno-15', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO Reno 15', 'Reno 15', 'OPPO Reno 15 — Reno 15 smartphone at RAES TECH.', 'oppo', 'OPPO Reno 15 Price in Pakistan | RAES TECH', 'Buy OPPO Reno 15 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00317', '256GB', '12GB', 'Colors verify', 'AMOLED; verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes (listing)', 'PTA Approved (verify IMEI)', 'Used', 159995, 143996, 159995, 0, true FROM products WHERE slug='oppo-reno-15' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('oppo-reno-15f', (SELECT id FROM brands WHERE slug='oppo'), 'OPPO Reno 15F', 'Reno 15F', 'OPPO Reno 15F — Reno 15F smartphone at RAES TECH.', 'oppo', 'OPPO Reno 15F Price in Pakistan | RAES TECH', 'Buy OPPO Reno 15F at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00318', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 118999, 107099, 118999, 0, true FROM products WHERE slug='oppo-reno-15f' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-c100i', (SELECT id FROM brands WHERE slug='realme'), 'realme C100i', 'C100i', 'realme C100i — C100i smartphone at RAES TECH.', 'realme', 'realme C100i Price in Pakistan | RAES TECH', 'Buy realme C100i at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00319', '64GB', '4GB', 'Dawn Purple, Dusk Gray', '6.8 LCD (reported)', 'Entry-level chipset; verify', '8MP main (listing reference)', 'Verify', '7000mAh (listing reference)', 'No', 'PTA Approved (verify IMEI)', 'Used', 36999, 33299, 36999, 0, true FROM products WHERE slug='realme-c100i' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00320', '128GB', '4GB', 'Dawn Purple, Dusk Gray', '6.8 LCD (reported)', 'Entry-level chipset; verify', '8MP main (listing reference)', 'Verify', '7000mAh (listing reference)', 'No', 'PTA Approved (verify IMEI)', 'Used', 44999, 40499, 44999, 0, true FROM products WHERE slug='realme-c100i' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-16-5g', (SELECT id FROM brands WHERE slug='realme'), 'realme 16 5G', '16 5G', 'realme 16 5G — 16 5G smartphone at RAES TECH.', 'realme', 'realme 16 5G Price in Pakistan | RAES TECH', 'Buy realme 16 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00321', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 114499, 103049, 114499, 0, true FROM products WHERE slug='realme-16-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-15-pro', (SELECT id FROM brands WHERE slug='realme'), 'realme 15 Pro', '15 Pro', 'realme 15 Pro — 15 Pro smartphone at RAES TECH.', 'realme', 'realme 15 Pro Price in Pakistan | RAES TECH', 'Buy realme 15 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00322', '256GB', '12GB', 'Colors verify', 'AMOLED 120Hz (reported)', 'Verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 128999, 116099, 128999, 0, true FROM products WHERE slug='realme-15-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-note-70', (SELECT id FROM brands WHERE slug='realme'), 'realme Note 70', 'Note 70', 'realme Note 70 — Note 70 smartphone at RAES TECH.', 'realme', 'realme Note 70 Price in Pakistan | RAES TECH', 'Buy realme Note 70 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00323', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Unisoc family; verify', 'Camera specs verify', 'Verify', '6000mAh class; verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 41599, 37439, 41599, 0, true FROM products WHERE slug='realme-note-70' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-c75x', (SELECT id FROM brands WHERE slug='realme'), 'realme C75x', 'C75x', 'realme C75x — C75x smartphone at RAES TECH.', 'realme', 'realme C75x Price in Pakistan | RAES TECH', 'Buy realme C75x at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00324', '128GB', '8GB', 'Colors verify', 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 51999, 46799, 51999, 0, true FROM products WHERE slug='realme-c75x' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-note-60x', (SELECT id FROM brands WHERE slug='realme'), 'realme Note 60x', 'Note 60x', 'realme Note 60x — Note 60x smartphone at RAES TECH.', 'realme', 'realme Note 60x Price in Pakistan | RAES TECH', 'Buy realme Note 60x at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00325', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Unisoc family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 32999, 29699, 32999, 0, true FROM products WHERE slug='realme-note-60x' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-c100', (SELECT id FROM brands WHERE slug='realme'), 'realme C100', 'C100', 'realme C100 — C100 smartphone at RAES TECH.', 'realme', 'realme C100 Price in Pakistan | RAES TECH', 'Buy realme C100 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00326', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', '7000mAh class; verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 86500, 77850, 86500, 0, true FROM products WHERE slug='realme-c100' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('realme-c100x', (SELECT id FROM brands WHERE slug='realme'), 'realme C100X', 'C100X', 'realme C100X — C100X smartphone at RAES TECH.', 'realme', 'realme C100X Price in Pakistan | RAES TECH', 'Buy realme C100X at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00327', '128GB', '8GB', 'Colors verify', 'LCD; verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 62500, 56250, 62500, 0, true FROM products WHERE slug='realme-c100x' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-y05', (SELECT id FROM brands WHERE slug='vivo'), 'vivo Y05', 'Y05', 'vivo Y05 — Y05 smartphone at RAES TECH.', 'vivo', 'vivo Y05 Price in Pakistan | RAES TECH', 'Buy vivo Y05 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00328', '64GB', '4GB', 'Black, Blue, Platinum', '6.74 LCD (listing reference)', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 40999, 36899, 40999, 0, true FROM products WHERE slug='vivo-y05' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00329', '128GB', '4GB', 'Black, Blue, Platinum', '6.74 LCD (listing reference)', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 48999, 44099, 48999, 0, true FROM products WHERE slug='vivo-y05' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-y05e', (SELECT id FROM brands WHERE slug='vivo'), 'vivo Y05e', 'Y05e', 'vivo Y05e — Y05e smartphone at RAES TECH.', 'vivo', 'vivo Y05e Price in Pakistan | RAES TECH', 'Buy vivo Y05e at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00330', '64GB', '4GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 36999, 33299, 36999, 0, true FROM products WHERE slug='vivo-y05e' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-x300-fe', (SELECT id FROM brands WHERE slug='vivo'), 'vivo X300 FE', 'X300 FE', 'vivo X300 FE — X300 FE smartphone at RAES TECH.', 'vivo', 'vivo X300 FE Price in Pakistan | RAES TECH', 'Buy vivo X300 FE at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00331', '256GB', '12GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 251999, 226799, 251999, 0, true FROM products WHERE slug='vivo-x300-fe' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-y500', (SELECT id FROM brands WHERE slug='vivo'), 'vivo Y500', 'Y500', 'vivo Y500 — Y500 smartphone at RAES TECH.', 'vivo', 'vivo Y500 Price in Pakistan | RAES TECH', 'Buy vivo Y500 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00332', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 82499, 74249, 82499, 0, true FROM products WHERE slug='vivo-y500' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-v70-fe', (SELECT id FROM brands WHERE slug='vivo'), 'vivo V70 FE', 'V70 FE', 'vivo V70 FE — V70 FE smartphone at RAES TECH.', 'vivo', 'vivo V70 FE Price in Pakistan | RAES TECH', 'Buy vivo V70 FE at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00333', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 121999, 109799, 121999, 0, true FROM products WHERE slug='vivo-v70-fe' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-y31d', (SELECT id FROM brands WHERE slug='vivo'), 'vivo Y31d', 'Y31d', 'vivo Y31d — Y31d smartphone at RAES TECH.', 'vivo', 'vivo Y31d Price in Pakistan | RAES TECH', 'Buy vivo Y31d at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00334', '128GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 67499, 60749, 67499, 0, true FROM products WHERE slug='vivo-y31d' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-y11d', (SELECT id FROM brands WHERE slug='vivo'), 'vivo Y11d', 'Y11d', 'vivo Y11d — Y11d smartphone at RAES TECH.', 'vivo', 'vivo Y11d Price in Pakistan | RAES TECH', 'Buy vivo Y11d at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00335', '128GB', '6GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 51499, 46349, 51499, 0, true FROM products WHERE slug='vivo-y11d' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-x300-pro', (SELECT id FROM brands WHERE slug='vivo'), 'vivo X300 Pro', 'X300 Pro', 'vivo X300 Pro — X300 Pro smartphone at RAES TECH.', 'vivo', 'vivo X300 Pro Price in Pakistan | RAES TECH', 'Buy vivo X300 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00336', '512GB', '16GB', 'Colors verify', 'LTPO AMOLED 120Hz (reported)', 'Dimensity flagship family; verify', 'Flagship multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 316999, 285299, 316999, 0, true FROM products WHERE slug='vivo-x300-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('vivo-x200-fe', (SELECT id FROM brands WHERE slug='vivo'), 'vivo X200 FE', 'X200 FE', 'vivo X200 FE — X200 FE smartphone at RAES TECH.', 'vivo', 'vivo X200 FE Price in Pakistan | RAES TECH', 'Buy vivo X200 FE at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00337', '256GB', '12GB', 'Colors verify', 'AMOLED 120Hz (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 215999, 194399, 215999, 0, true FROM products WHERE slug='vivo-x200-fe' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-smart-20', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Smart 20', 'Smart 20', 'Infinix Smart 20 — Smart 20 smartphone at RAES TECH.', 'infinix', 'Infinix Smart 20 Price in Pakistan | RAES TECH', 'Buy Infinix Smart 20 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00338', '64GB', '4GB', 'Shadow Black, Cloudline Blue, Polaris Titanium, Sunlike Orange', 'LCD high refresh; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', '5200mAh listing reference', 'No', 'PTA Approved (verify IMEI)', 'Used', 38499, 34649, 38499, 0, true FROM products WHERE slug='infinix-smart-20' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00339', '128GB', '4GB', 'Shadow Black, Cloudline Blue, Polaris Titanium, Sunlike Orange', 'LCD high refresh; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', '5200mAh listing reference', 'No', 'PTA Approved (verify IMEI)', 'Used', 46499, 41849, 46499, 0, true FROM products WHERE slug='infinix-smart-20' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-note-60-edge-5g', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Note 60 Edge 5G', 'Note 60 Edge 5G', 'Infinix Note 60 Edge 5G — Note 60 Edge 5G smartphone at RAES TECH.', 'infinix', 'Infinix Note 60 Edge 5G Price in Pakistan | RAES TECH', 'Buy Infinix Note 60 Edge 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00340', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 95399, 85859, 95399, 0, true FROM products WHERE slug='infinix-note-60-edge-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-hot-70-pro-5g', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Hot 70 Pro 5G', 'Hot 70 Pro 5G', 'Infinix Hot 70 Pro 5G — Hot 70 Pro 5G smartphone at RAES TECH.', 'infinix', 'Infinix Hot 70 Pro 5G Price in Pakistan | RAES TECH', 'Buy Infinix Hot 70 Pro 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00341', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 82999, 74699, 82999, 0, true FROM products WHERE slug='infinix-hot-70-pro-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-hot-70', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Hot 70', 'Hot 70', 'Infinix Hot 70 — Hot 70 smartphone at RAES TECH.', 'infinix', 'Infinix Hot 70 Price in Pakistan | RAES TECH', 'Buy Infinix Hot 70 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00342', '128GB', '8GB', 'Colors verify', 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 57999, 52199, 57999, 0, true FROM products WHERE slug='infinix-hot-70' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-gt-50-pro', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix GT 50 Pro', 'GT 50 Pro', 'Infinix GT 50 Pro — GT 50 Pro smartphone at RAES TECH.', 'infinix', 'Infinix GT 50 Pro Price in Pakistan | RAES TECH', 'Buy Infinix GT 50 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00343', '256GB', '12GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity flagship family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 162999, 146699, 162999, 0, true FROM products WHERE slug='infinix-gt-50-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-note-60', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Note 60', 'Note 60', 'Infinix Note 60 — Note 60 smartphone at RAES TECH.', 'infinix', 'Infinix Note 60 Price in Pakistan | RAES TECH', 'Buy Infinix Note 60 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00344', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 101999, 91799, 101999, 0, true FROM products WHERE slug='infinix-note-60' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-hot-60-pro', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Hot 60 Pro', 'Hot 60 Pro', 'Infinix Hot 60 Pro — Hot 60 Pro smartphone at RAES TECH.', 'infinix', 'Infinix Hot 60 Pro Price in Pakistan | RAES TECH', 'Buy Infinix Hot 60 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00345', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Verify', '50MP-class main; verify', 'Verify', 'Verify', '4G/5G SKU verify', 'PTA Approved (verify IMEI)', 'Used', 69999, 62999, 69999, 0, true FROM products WHERE slug='infinix-hot-60-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-hot-60i', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Hot 60i', 'Hot 60i', 'Infinix Hot 60i — Hot 60i smartphone at RAES TECH.', 'infinix', 'Infinix Hot 60i Price in Pakistan | RAES TECH', 'Buy Infinix Hot 60i at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00346', '128GB', '8GB', 'Colors verify', 'LCD high refresh (reported)', 'Helio family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 53999, 48599, 53999, 0, true FROM products WHERE slug='infinix-hot-60i' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('infinix-note-60-pro', (SELECT id FROM brands WHERE slug='infinix'), 'Infinix Note 60 Pro', 'Note 60 Pro', 'Infinix Note 60 Pro — Note 60 Pro smartphone at RAES TECH.', 'infinix', 'Infinix Note 60 Pro Price in Pakistan | RAES TECH', 'Buy Infinix Note 60 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00347', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 117999, 106199, 117999, 0, true FROM products WHERE slug='infinix-note-60-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-spark-50', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Spark 50', 'Spark 50', 'Tecno Spark 50 — Spark 50 smartphone at RAES TECH.', 'tecno', 'Tecno Spark 50 Price in Pakistan | RAES TECH', 'Buy Tecno Spark 50 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00348', '128GB', '6GB', 'Ink Black, Titanium Grey, Aurora Purple, Halo Blue, Neo Titanium, Dynamic Orange', 'LCD high refresh (reported)', 'Entry/midrange chipset; verify', '50MP-class main; verify', 'Verify', '7000mAh listing reference', 'Verify SKU', 'PTA Approved (verify IMEI)', 'Used', 58495, 52646, 58495, 0, true FROM products WHERE slug='tecno-spark-50' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-pova-curve-2-5g', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Pova Curve 2 5G', 'Pova Curve 2 5G', 'Tecno Pova Curve 2 5G — Pova Curve 2 5G smartphone at RAES TECH.', 'tecno', 'Tecno Pova Curve 2 5G Price in Pakistan | RAES TECH', 'Buy Tecno Pova Curve 2 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00349', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 99999, 89999, 99999, 0, true FROM products WHERE slug='tecno-pova-curve-2-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-spark-50-pro', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Spark 50 Pro', 'Spark 50 Pro', 'Tecno Spark 50 Pro — Spark 50 Pro smartphone at RAES TECH.', 'tecno', 'Tecno Spark 50 Pro Price in Pakistan | RAES TECH', 'Buy Tecno Spark 50 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00350', '256GB', '8GB', 'Colors verify', 'Display type verify', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 70495, 63446, 70495, 0, true FROM products WHERE slug='tecno-spark-50-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-camon-50', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Camon 50', 'Camon 50', 'Tecno Camon 50 — Camon 50 smartphone at RAES TECH.', 'tecno', 'Tecno Camon 50 Price in Pakistan | RAES TECH', 'Buy Tecno Camon 50 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00351', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Helio/Dimensity family; verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 91995, 82796, 91995, 0, true FROM products WHERE slug='tecno-camon-50' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-camon-50-pro', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Camon 50 Pro', 'Camon 50 Pro', 'Tecno Camon 50 Pro — Camon 50 Pro smartphone at RAES TECH.', 'tecno', 'Tecno Camon 50 Pro Price in Pakistan | RAES TECH', 'Buy Tecno Camon 50 Pro at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00352', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Helio/Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 99995, 89996, 99995, 0, true FROM products WHERE slug='tecno-camon-50-pro' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-spark-go-3', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Spark Go 3', 'Spark Go 3', 'Tecno Spark Go 3 — Spark Go 3 smartphone at RAES TECH.', 'tecno', 'Tecno Spark Go 3 Price in Pakistan | RAES TECH', 'Buy Tecno Spark Go 3 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00353', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 37995, 34196, 37995, 0, true FROM products WHERE slug='tecno-spark-go-3' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-spark-40-pro-plus', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Spark 40 Pro Plus', 'Spark 40 Pro Plus', 'Tecno Spark 40 Pro Plus — Spark 40 Pro Plus smartphone at RAES TECH.', 'tecno', 'Tecno Spark 40 Pro Plus Price in Pakistan | RAES TECH', 'Buy Tecno Spark 40 Pro Plus at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00354', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Helio family; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 72999, 65699, 72999, 0, true FROM products WHERE slug='tecno-spark-40-pro-plus' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('tecno-camon-50-ultra-5g', (SELECT id FROM brands WHERE slug='tecno'), 'Tecno Camon 50 Ultra 5G', 'Camon 50 Ultra 5G', 'Tecno Camon 50 Ultra 5G — Camon 50 Ultra 5G smartphone at RAES TECH.', 'tecno', 'Tecno Camon 50 Ultra 5G Price in Pakistan | RAES TECH', 'Buy Tecno Camon 50 Ultra 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00355', '256GB', '12GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Dimensity family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 119999, 107999, 119999, 0, true FROM products WHERE slug='tecno-camon-50-ultra-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('xiaomi-17-ultra', (SELECT id FROM brands WHERE slug='xiaomi'), 'Xiaomi 17 Ultra', '17 Ultra', 'Xiaomi 17 Ultra — 17 Ultra smartphone at RAES TECH.', 'xiaomi', 'Xiaomi 17 Ultra Price in Pakistan | RAES TECH', 'Buy Xiaomi 17 Ultra at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00356', '512GB', '16GB', 'Black, White, Starlit Green', '6.9 LTPO AMOLED 120Hz', 'Snapdragon flagship; verify exact regional SKU', '50MP-class multi-camera system; verify', 'Verify', '6000mAh listing reference', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 459999, 413999, 459999, 0, true FROM products WHERE slug='xiaomi-17-ultra' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('xiaomi-redmi-15c', (SELECT id FROM brands WHERE slug='xiaomi'), 'Xiaomi Redmi 15C', 'Redmi 15C', 'Xiaomi Redmi 15C — Redmi 15C smartphone at RAES TECH.', 'xiaomi', 'Xiaomi Redmi 15C Price in Pakistan | RAES TECH', 'Buy Xiaomi Redmi 15C at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00357', '128GB', '6GB', 'Colors verify', 'LCD high refresh (reported)', 'Helio family; verify', '50MP-class main; verify', 'Verify', '6000mAh class; verify', '4G', 'PTA Approved (verify IMEI)', 'Used', 44995, 40496, 44995, 0, true FROM products WHERE slug='xiaomi-redmi-15c' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('honor-x8d', (SELECT id FROM brands WHERE slug='honor'), 'Honor X8d', 'X8d', 'Honor X8d — X8d smartphone at RAES TECH.', 'honor', 'Honor X8d Price in Pakistan | RAES TECH', 'Buy Honor X8d at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00358', '256GB', '8GB', 'Velvet Black, Velvet Grey, Light Blue', 'Display type needs exact SKU verification', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 76999, 69299, 76999, 0, true FROM products WHERE slug='honor-x8d' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('honor-x9d', (SELECT id FROM brands WHERE slug='honor'), 'Honor X9d', 'X9d', 'Honor X9d — X9d smartphone at RAES TECH.', 'honor', 'Honor X9d Price in Pakistan | RAES TECH', 'Buy Honor X9d at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00359', '256GB', '8GB', 'Colors verify', 'AMOLED high refresh (reported)', 'Verify', 'Camera specs verify', 'Verify', 'Verify', 'Verify', 'PTA Approved (verify IMEI)', 'Used', 138999, 125099, 138999, 0, true FROM products WHERE slug='honor-x9d' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('honor-x6c', (SELECT id FROM brands WHERE slug='honor'), 'Honor X6c', 'X6c', 'Honor X6c — X6c smartphone at RAES TECH.', 'honor', 'Honor X6c Price in Pakistan | RAES TECH', 'Buy Honor X6c at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00360', '128GB', '6GB', 'Colors verify', 'LCD; verify', 'Entry/midrange chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 44995, 40496, 44995, 0, true FROM products WHERE slug='honor-x6c' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('itel-a200', (SELECT id FROM brands WHERE slug='itel'), 'itel A200', 'A200', 'itel A200 — A200 smartphone at RAES TECH.', 'itel', 'itel A200 Price in Pakistan | RAES TECH', 'Buy itel A200 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00361', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 32995, 29696, 32995, 0, true FROM products WHERE slug='itel-a200' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('itel-power-80', (SELECT id FROM brands WHERE slug='itel'), 'itel Power 80', 'Power 80', 'itel Power 80 — Power 80 smartphone at RAES TECH.', 'itel', 'itel Power 80 Price in Pakistan | RAES TECH', 'Buy itel Power 80 at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00362', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'High-capacity battery; verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 42995, 38696, 42995, 0, true FROM products WHERE slug='itel-power-80' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('itel-a100c', (SELECT id FROM brands WHERE slug='itel'), 'itel A100C', 'A100C', 'itel A100C — A100C smartphone at RAES TECH.', 'itel', 'itel A100C Price in Pakistan | RAES TECH', 'Buy itel A100C at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00363', '128GB', '4GB', 'Colors verify', 'LCD; verify', 'Entry-level chipset; verify', 'Camera specs verify', 'Verify', 'Verify', 'No', 'PTA Approved (verify IMEI)', 'Used', 23499, 21149, 23499, 0, true FROM products WHERE slug='itel-a100c' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('nothing-cmf-phone-1-5g', (SELECT id FROM brands WHERE slug='nothing'), 'Nothing CMF Phone 1 5G', 'CMF Phone 1 5G', 'Nothing CMF Phone 1 5G — CMF Phone 1 5G smartphone at RAES TECH.', 'nothing', 'Nothing CMF Phone 1 5G Price in Pakistan | RAES TECH', 'Buy Nothing CMF Phone 1 5G at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00364', '128GB', '8GB', 'Black, Orange, Light Green, Blue (verify)', '6.67 AMOLED 120Hz', 'Dimensity 7300', '50MP + depth', '16MP', '5000mAh', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 74995, 67496, 74995, 0, true FROM products WHERE slug='nothing-cmf-phone-1-5g' ON CONFLICT (sku) DO NOTHING;
INSERT INTO products (slug, brand_id, name, model, description, category, seo_title, seo_description) VALUES ('motorola-edge-70-fusion', (SELECT id FROM brands WHERE slug='motorola'), 'Motorola Edge 70 Fusion', 'Edge 70 Fusion', 'Motorola Edge 70 Fusion — Edge 70 Fusion smartphone at RAES TECH.', 'motorola', 'Motorola Edge 70 Fusion Price in Pakistan | RAES TECH', 'Buy Motorola Edge 70 Fusion at the best price in Pakistan with Buy Now discount or 0% markup instalments.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO product_variants (product_id, sku, storage, ram, colors, display, chipset, rear_camera, front_camera, battery, network, pta_status, condition, listed_price, buy_now_price, instalment_total, stock, requires_verification) SELECT id, 'RT-00365', '256GB', '8GB', 'Colors verify', 'pOLED high refresh (reported)', 'Snapdragon family; verify', 'Multi-camera system; verify', 'Verify', 'Verify', 'Yes', 'PTA Approved (verify IMEI)', 'Used', 134999, 121499, 134999, 0, true FROM products WHERE slug='motorola-edge-70-fusion' ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- >>> FILE: supabase/migrations/00008_email_send_log.sql
-- ============================================================
-- ============================================================
-- RAES TECH — Email send accounting & rate limiting.
-- Backs the send-email Edge Function's anti-abuse controls.
-- (See supabase/functions/send-email/index.ts)
-- ============================================================

-- Every outbound transactional email attempt is recorded here so the
-- send-email function can enforce per-IP, per-recipient and global daily
-- caps, and so arbitrary-recipient abuse is visible/auditable.
create table if not exists public.email_send_log (
  id bigint generated always as identity primary key,
  recipient text not null,
  sender_ip text,
  template_key text,
  created_at timestamptz not null default now()
);

-- Index expressions may only use IMMUTABLE functions; date_trunc on a
-- timestamptz is only STABLE, so a UTC-day helper is injected instead.
create or replace function public.email_log_day(ts timestamptz)
returns date
language sql immutable
set search_path = public
as $$
  select (ts at time zone 'utc')::date;
$$;

create index if not exists email_send_log_recipient_day_idx
  on public.email_send_log (recipient, public.email_log_day(created_at));
create index if not exists email_send_log_sender_ip_day_idx
  on public.email_send_log (sender_ip, public.email_log_day(created_at));
create index if not exists email_send_log_created_idx
  on public.email_send_log (created_at);

alter table public.email_send_log enable row level security;

-- No client-facing policies: the table is written/read only by server-side
-- code using the service-role key, which bypasses RLS. End users have no
-- direct access, so they cannot tamper with the quota counters.

-- Helper: is a given email a confirmed auth user?
create or replace function public.is_email_verified(p_email text)
returns boolean
language sql stable security definer
set search_path = auth, public
as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = lower(trim(p_email))
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_email_verified(text) from public;
grant execute on function public.is_email_verified(text) to service_role;
