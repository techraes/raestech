-- ============================================================
-- 00014_instalment_payments.sql
-- Instalment advance payments: a payment may now reference an instalment
-- application instead of an order. The customer-facing instalment flow
-- collects the advance-payment receipt after the application is submitted, so
-- a `payments` row must be creatable even though no order is placed.
-- ============================================================

alter table public.payments
  alter column order_id drop not null;

alter table public.payments
  add column instalment_application_id uuid
    references public.instalment_applications(id) on delete cascade;

create index payments_instalment_app_idx on public.payments(instalment_application_id);
