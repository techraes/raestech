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
