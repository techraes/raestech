-- ============================================================
-- 00037_delivery_address.sql
-- Persist the delivery address used for a specific purchase so a later
-- profile edit cannot change the original delivery destination.
--
-- Buy Now orders get structured delivery columns; instalment applications get
-- a full delivery block captured at application time.
-- ============================================================

alter table public.orders
  add column if not exists shipping_full_name text,
  add column if not exists shipping_phone text,
  add column if not exists shipping_city text,
  add column if not exists shipping_province text,
  add column if not exists shipping_postal text,
  add column if not exists shipping_address text,
  add column if not exists shipping_area text;

alter table public.instalment_applications
  add column if not exists delivery_full_name text,
  add column if not exists delivery_phone text,
  add column if not exists delivery_address text,
  add column if not exists delivery_area text,
  add column if not exists delivery_city text,
  add column if not exists delivery_province text,
  add column if not exists delivery_postal_code text;
