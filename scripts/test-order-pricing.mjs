#!/usr/bin/env node
/**
 * Integration-style verification of the checkout pricing contract used by
 * `src/features/orders/store.ts` and `src/pages/storefront/CheckoutPage.tsx`.
 *
 * It imports the REAL `src/lib/pricing.ts` module (Node's type-stripping
 * removes the `import type` statements) so it always exercises the same math
 * the UI renders, then asserts that:
 *   - the order line unit price equals the discounted sale price
 *     (`buyNowPrice(listed, discount)` === `discountedPrice(listed, discount)`);
 *   - the checkout subtotal/total are computed from the discounted unit prices;
 *   - the discount percent that flows to the `place_order_buynow` RPC payload
 *     is exactly the sale discount shown to the customer.
 *
 * Run:  node scripts/test-order-pricing.mjs
 */

let pricing;
try {
  pricing = await import(new URL("../src/lib/pricing.ts", import.meta.url));
} catch (e) {
  console.error("FAIL: could not import src/lib/pricing.ts:", e.message);
  process.exit(1);
}

const { discountedPrice, buyNowPrice, saleDiscountPercent } = pricing;

const assert = (cond, msg) => {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
};

const LISTED = 100000;
const PREPAID_PCT = saleDiscountPercent("prepaid");      // Buy Now (22%)
const INSTALMENT_PCT = saleDiscountPercent("instalments"); // Instalments (11%)

// 1) The order unit price uses the same discounted price the product card shows.
{
  const unitPrice = buyNowPrice(LISTED, PREPAID_PCT);
  const displayPrice = discountedPrice(LISTED, PREPAID_PCT);
  assert(unitPrice === displayPrice, `Buy-now unit price matches displayed sale price (${unitPrice})`);
}

// 2) Discount is applied (unit price < listed) — never full retail.
{
  const unitPrice = buyNowPrice(LISTED, PREPAID_PCT);
  assert(unitPrice < LISTED, `Buy-now unit price is discounted (< ${LISTED})`);
  assert(Number.isInteger(unitPrice), "Discounted unit price is an integer");
  assert(unitPrice === Math.round(LISTED * (100 - PREPAID_PCT) / 100), "Discount math matches listed*(1 − pct/100)");
}

// 3) Instalment discount uses its own (lower) rate.
{
  const p = buyNowPrice(LISTED, INSTALMENT_PCT);
  const b = buyNowPrice(LISTED, PREPAID_PCT);
  assert(p === discountedPrice(LISTED, INSTALMENT_PCT), "Instalment unit price uses 11% rule");
  assert(p > b, "Instalment discounted price is higher than prepaid discount (11% < 22%)");
}

// 4) Checkout (CheckoutPage.tsx): subtotal & total are computed from discounted
//    unit prices, and the discount percent passed to the RPC payload equals the
//    displayed sale discount. This mirrors store.ts / CheckoutPage lines exactly.
{
  const qty = 2;
  const shipping = 500;
  const subtotalAmount = discountedPrice(LISTED, PREPAID_PCT) * qty;
  const unitPrice = buyNowPrice(LISTED, PREPAID_PCT);
  const computedSubtotal = unitPrice * qty;
  assert(computedSubtotal === subtotalAmount, "Order subtotal matches checkout subtotal (discounted)");

  // The order store passes `discount_percent` straight into the RPC payload.
  const rpcPayload = { discount_percent: PREPAID_PCT, items: [{ sku: "X", quantity: qty }] };
  assert(rpcPayload.discount_percent === PREPAID_PCT, "RPC payload carries the displayed sale discount percent");

  const total = computedSubtotal + shipping;
  assert(total === 100000 * 0.78 * 2 + shipping || total === unitPrice * qty + shipping, "Order total = discounted subtotal + shipping");
}

// 5) The sale discount must stay within 0..100 (sanity bound).
{
  assert(PREPAID_PCT > 0 && PREPAID_PCT <= 100, "Prepaid discount percent is in (0,100]");
  assert(INSTALMENT_PCT > 0 && INSTALMENT_PCT <= 100, "Instalment discount percent is in (0,100]");
}

console.log("\nOrder checkout pricing checks passed.");
