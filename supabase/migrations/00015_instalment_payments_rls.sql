-- ============================================================
-- 00015_instalment_payments_rls.sql
-- Harden advance payments (order + instalment) at the DB level.
--
-- RULES:
--   1. A customer may only INSERT a payment whose referenced order AND/OR
--      instalment application belongs to them (admins bypass).
--   2. A customer may only UPDATE payment rows tied to their own order or
--      instalment application (both USING and WITH CHECK enforced).
--   3. UNIQUE on payments(instalment_application_id): at most one payment
--      per instalment application.
--
-- NOTE: `payments_admin_update` (from 00002) is intentionally left untouched
-- so admins keep full update rights.
-- ============================================================

-- ---- 1. Insert policy: require ownership of any referenced order / app ----
drop policy if exists "payments_owner_insert" on public.payments;
create policy "payments_owner_insert" on public.payments
  for insert with check (
    auth.uid() = user_id
    and (
      public.is_admin()
      or (
        (order_id is null
         or exists (
           select 1 from public.orders o
           where o.id = order_id and o.user_id = auth.uid()
         ))
        and
        (instalment_application_id is null
         or exists (
           select 1 from public.instalment_applications ia
           where ia.id = instalment_application_id and ia.user_id = auth.uid()
         ))
      )
    )
  );

-- ---- 2. Customer update policy (order payments) ----
drop policy if exists "payments_owner_update_denied" on public.payments;
create policy "payments_owner_update_denied" on public.payments
  for update
  using (
    auth.uid() = user_id
    and not public.is_admin()
    and (
      (order_id is null or exists (
        select 1 from public.orders o
        where o.id = order_id and o.user_id = auth.uid()
      ))
      and
      (instalment_application_id is null or exists (
        select 1 from public.instalment_applications ia
        where ia.id = instalment_application_id and ia.user_id = auth.uid()
      ))
    )
  )
  with check (
    auth.uid() = user_id
    and not public.is_admin()
    and (
      (order_id is null or exists (
        select 1 from public.orders o
        where o.id = order_id and o.user_id = auth.uid()
      ))
      and
      (instalment_application_id is null or exists (
        select 1 from public.instalment_applications ia
        where ia.id = instalment_application_id and ia.user_id = auth.uid()
      ))
    )
  );

-- ---- 3. Unique constraint: one payment per instalment application ----
-- Deduplicate any pre-existing rows first (keep the earliest) so the
-- constraint can be applied cleanly.
delete from public.payments a
using public.payments b
where a.instalment_application_id is not null
  and a.instalment_application_id = b.instalment_application_id
  and a.created_at > b.created_at;

alter table public.payments
  add constraint payments_instalment_app_unique
  unique (instalment_application_id);
