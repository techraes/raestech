-- ============================================================
-- 00032_fix_variant_price_constraint.sql
-- Repair the product_variants price CHECK constraint for databases where
-- migration 00001 has already run.
--
-- 00001 originally enforced:
--     check (listed_price <= buy_now_price or buy_now_price = 0)
-- which is inverted relative to the intended discount invariant:
--     buy_now_price <= listed_price
-- (the Buy-Now price is a discounted price, at or below the listed price).
-- Fresh installs already receive the corrected rule from 00001 (edited); this
-- migration aligns existing databases to the same rule.
-- ============================================================

-- Drop the old (auto-named) constraint.
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_check;

-- Normalize the small set of rows that contradict the intended invariant so the
-- corrected constraint can be enforced. Only rows where buy_now_price exceeds
-- listed_price (and is non-zero) are clamped down to listed_price.
UPDATE public.product_variants
SET buy_now_price = listed_price
WHERE buy_now_price > listed_price AND buy_now_price <> 0;

-- Re-add the corrected rule with an explicit, stable name.
ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_price_check
  CHECK (buy_now_price <= listed_price OR buy_now_price = 0);
