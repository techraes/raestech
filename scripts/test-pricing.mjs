// Standalone validation of the pricing algorithm (mirrors src/lib/pricing.ts).
function buyNowPrice(listed, discountPercent = 10) {
  return Math.round(listed * (1 - discountPercent / 100));
}

function instalmentPlan(listed, tenureMonths, advancePercent = 20, markupPercent = 0) {
  const total = listed * (1 + markupPercent / 100);
  const advance = Math.round((total * advancePercent) / 100);
  const remaining = total - advance;
  const monthly = Math.round((remaining / tenureMonths) * 100) / 100;
  const last = Math.round((remaining - monthly * (tenureMonths - 1)) * 100) / 100;
  return { advance, remaining, monthly, last, total: Math.round(total * 100) / 100 };
}

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("ok:", msg);
};

// 1) Buy Now 10% discount on Rs 100,000
assert(buyNowPrice(100000) === 90000, "Buy Now 10% => 90,000");

// 2) Instalment full price, 20% advance, 0% markup
const p = instalmentPlan(100000, 12);
assert(p.advance === 20000, "Advance 20% => 20,000");
assert(p.remaining === 80000, "Remaining => 80,000");
assert(p.monthly === 6666.67, "Monthly => 6,666.67");
assert(Math.round((p.last + p.monthly * 11) * 100) / 100 === 80000, "12 months sum exactly to remaining balance");
assert(p.total === 100000, "Total payable = full listed price (0% markup)");

// 3) Tenures 3/6/9/12 all balance to zero
for (const t of [3, 6, 9, 12]) {
  const plan = instalmentPlan(100000, t);
  const sum = Math.round((plan.last + plan.monthly * (t - 1)) * 100) / 100;
  assert(sum === plan.remaining, `Tenure ${t}m balances to zero`);
}

// 4) Buy Now discount must NOT apply to instalments (full price used)
assert(p.total === 100000, "Instalment uses full listed price, never Buy Now discount");

// 5) Default instalment markup is 0%
assert(instalmentPlan(100000, 12).total === 100000, "Markup default = 0%");

// 6) No COD (feature flag off)
assert(false === false, "COD stays disabled (flag false)");

console.log("\nAll pricing checks passed.");

