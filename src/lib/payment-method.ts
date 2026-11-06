/**
 * Payment-method codes are customer-facing and may be any of the configured
 * methods (e.g. `crypto_usdt`, `card`, `jazzcash`). The `orders.payment_method`
 * and `payments.method` columns are backed by the PostgreSQL `payment_method`
 * enum (see supabase/migrations/00017_payment_method_enum.sql), which accepts
 * every code the app can submit.
 *
 * When persisting an order/payment we must write a value the enum accepts.
 * Known codes pass through unchanged so financial reporting reflects the real
 * method; only codes that are genuinely unknown / not-yet-enum (e.g. a brand
 * new method before its migration has run) fall back to `manual_bank_transfer`
 * so inserts never throw a PostgreSQL enum violation.
 */

/** The set of values accepted by the DB `payment_method` enum. */
const DB_PAYMENT_METHOD_ENUM: ReadonlySet<string> = new Set([
  "manual_bank_transfer",
  "bank_transfer",
  "instalments",
  "jazzcash",
  "easypaisa",
  "faysal_bank",
  "crypto_usdt",
  "card",
]);

/**
 * Map a (possibly customer-facing) payment-method code to a value the DB
 * `payment_method` enum accepts. Real configured codes are preserved; only
 * unknown codes fall back to `manual_bank_transfer`.
 */
export function toDbPaymentMethod(code: string | null | undefined): string {
  const normalized = code ?? "";
  return DB_PAYMENT_METHOD_ENUM.has(normalized) ? normalized : "manual_bank_transfer";
}
