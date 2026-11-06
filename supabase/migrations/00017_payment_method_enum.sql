-- ============================================================
-- 00017_payment_method_enum.sql
-- Extend the `payment_method` enum so the DB records the real method the
-- customer chose instead of collapsing every non-bank method (crypto, card,
-- mobile wallets) down to `manual_bank_transfer`.
--
-- Previously the enum only contained `manual_bank_transfer`; non-bank codes
-- were normalised to it client-side, corrupting financial reporting. After
-- this migration the app's customer-facing codes are stored faithfully.
--
-- The new values match the configurable payment methods in settings
-- (src/features/settings/store.tsx) and the CustomerOrderPaymentMethod union
-- (src/types/index.ts). `ADD VALUE IF NOT EXISTS` is idempotent.
-- ============================================================

alter type public.payment_method add value if not exists 'bank_transfer';
alter type public.payment_method add value if not exists 'instalments';
alter type public.payment_method add value if not exists 'jazzcash';
alter type public.payment_method add value if not exists 'easypaisa';
alter type public.payment_method add value if not exists 'faysal_bank';
alter type public.payment_method add value if not exists 'crypto_usdt';
alter type public.payment_method add value if not exists 'card';
