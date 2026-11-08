-- ============================================================
-- 00028_payment_submission_fixes.sql  (REVISED — no destructive deletes)
-- Repair + harden payment submission for both Buy Now and instalment flows.
--
-- PROBLEMS FIXED
--   1. The `payment_status` enum did not contain 'pending', but the customer
--      receipt flow inserted payments with status='pending'. Every payment-row
--      insert failed with an enum error, which surfaced in the UI as
--      "Could not record payment. Please try again." for both flows.
--      The client is updated to insert status='pending_verification'
--      directly (a valid enum member), so no new enum value is required.
--   2. No DB constraint guaranteed one *active* payment per order/instalment
--      application. Repeated/double submits could create duplicate pending
--      payment rows. We add PARTIAL unique indexes that cover only the active
--      states (unpaid, pending_verification). This prevents duplicate retries
--      of the same advance while ALLOWING a legitimate later payment after a
--      decision (verified/rejected rows are not covered, so history is kept).
--   3. No constraint prevented the *same uploaded file* being linked twice to
--      one payment (duplicate retry). We add a partial unique on
--      (payment_id, file_path) so the identical retry is blocked but a
--      replacement receipt (a different file) is still allowed.
--
-- IMPORTANT — data safety:
--   This migration does NOT delete or modify any existing row. If your data
--   already contains duplicates, the new indexes will fail to build and the
--   migration will stop, telling you to reconcile first. Run the read-only
--   diagnostic first (scripts/inspect_payment_duplicates.sql) and decide how
--   to handle any conflicts *before* applying this migration. We intentionally
--   do not auto-delete anything.
--
-- RLS remains enabled. All statements are additive and idempotent.
-- ============================================================

-- 1. One ACTIVE payment per order. Partial unique covers only the pending/
--    unpaid states, so a rejected/verified historical payment (or a later
--    legitimate payment) does not collide and is never deleted.
create unique index if not exists payments_active_order_unique
  on public.payments(order_id)
  where order_id is not null and status in ('unpaid','pending_verification');

-- 2. One ACTIVE advance payment per instalment application. Replace the older
--    unconditional UNIQUE (00015) with this partial rule so that a later
--    legitimate payment for the same application is not permanently blocked.
--    Monthly instalment payments are separate rows keyed by
--    instalment_schedule_id, so they are unaffected.
--
--    CONSTRAINT-AUDIT: the dropped `payments_instalment_app_unique` constraint
--    (added in 00015) is referenced nowhere else in this repo — only 00015
--    defines it, plus one comment in src/lib/receipts.ts. App code reuses an
--    existing payment row by id (never relying on this uniqueness), so no code
--    path depends on the unconditional rule. The partial unique index below
--    preserves the original safety intent (no two pending payments for the
--    same application) while allowing a legitimate replacement/later payment
--    after a decision, which the unconditional rule would have blocked.
alter table public.payments drop constraint if exists payments_instalment_app_unique;

create unique index if not exists payments_active_app_unique
  on public.payments(instalment_application_id)
  where instalment_application_id is not null and status in ('unpaid','pending_verification');

-- 3. Receipts: block linking the SAME uploaded file twice to one payment
--    (the duplicate retry reuses one path), while allowing a replacement
--    receipt (a different uploaded file) for the same payment. No rows are
--    deleted; existing duplicate links are simply surfaced by the read-only
--    diagnostic for review.
create unique index if not exists receipts_payment_file_unique
  on public.payment_receipts(payment_id, file_path);
