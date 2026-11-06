-- ============================================================
-- 00016_instalment_stages_delivery.sql
-- Backend support for the multistep instalment checkout:
--   * `stage` records which wizard step the application reached.
--   * `color` records the selected variant colour.
--   * delivery columns (city/province/postal_code) capture structured delivery
--     info in addition to the free-text `current_address`.
-- All additions are guarded so the migration is safe to re-run.
-- ============================================================

alter table public.instalment_applications
  add column if not exists stage text not null default 'submitted';

alter table public.instalment_applications
  add column if not exists color text;

alter table public.instalment_applications
  add column if not exists city text;

alter table public.instalment_applications
  add column if not exists province text;

alter table public.instalment_applications
  add column if not exists postal_code text;

-- Keep `stage` honest.
alter table public.instalment_applications
  drop constraint if exists instalment_applications_stage_check;

alter table public.instalment_applications
  add constraint instalment_applications_stage_check
  check (stage in ('product_plan', 'personal', 'cnic_verification', 'delivery', 'review', 'payment_pending', 'submitted', 'under_review'));
