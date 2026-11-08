-- ============================================================
-- inspect_payment_duplicates.sql  (READ-ONLY — runs no DML)
-- Run BEFORE applying migration 00028/00029. Every statement below only
-- SELECTs; nothing is modified. Use in the Supabase SQL editor or psql.
-- ============================================================

-- 1. Any order that has more than one payment row at all (history).
SELECT p.order_id, o.order_number, count(*) AS total_payments,
       string_agg(p.id::text || '|' || p.status || '|' || p.created_at::text, E'\n') AS rows
FROM public.payments p
LEFT JOIN public.orders o ON o.id = p.order_id
WHERE p.order_id IS NOT NULL
GROUP BY p.order_id, o.order_number
HAVING count(*) > 1
ORDER BY total_payments DESC;

-- 2. ACTIVE order-payment duplicates (these would violate the NEW index
--    payments_active_order_unique and block the migration).
SELECT order_id, status, count(*) AS n
FROM public.payments
WHERE order_id IS NOT NULL AND status IN ('unpaid','pending_verification')
GROUP BY order_id, status
HAVING count(*) > 1;

-- 3. Any instalment application with more than one payment row at all.
SELECT p.instalment_application_id, a.application_number, count(*) AS total_payments,
       string_agg(p.id::text || '|' || p.status || '|' || p.created_at::text, E'\n') AS rows
FROM public.payments p
LEFT JOIN public.instalment_applications a ON a.id = p.instalment_application_id
WHERE p.instalment_application_id IS NOT NULL
GROUP BY p.instalment_application_id, a.application_number
HAVING count(*) > 1
ORDER BY total_payments DESC;

-- 4. ACTIVE application-payment duplicates (would violate payments_active_app_unique).
SELECT instalment_application_id, status, count(*) AS n
FROM public.payments
WHERE instalment_application_id IS NOT NULL AND status IN ('unpaid','pending_verification')
GROUP BY instalment_application_id, status
HAVING count(*) > 1;

-- 5. Receipts: same file linked more than once to one payment (would violate
--    receipts_payment_file_unique). These are duplicate retries to review.
SELECT payment_id, file_path, count(*) AS n
FROM public.payment_receipts
GROUP BY payment_id, file_path
HAVING count(*) > 1;

-- 6. (Optional) receipts with multiple DIFFERENT files per payment — these are
--    legitimate replacement receipts and MUST be preserved (not flagged as bad).
SELECT payment_id, count(*) AS receipts_per_payment
FROM public.payment_receipts
GROUP BY payment_id
HAVING count(*) > 1;
