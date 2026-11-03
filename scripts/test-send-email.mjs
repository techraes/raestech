// RAES TECH — unit tests for the transactional-email render/send path.
// Exercises the same render() consumed by the send-email Edge Function.
import { render, escapeHtml } from "../supabase/functions/send-email/render.mjs";

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`ok: ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL: ${name}`);
  }
}

// 1) Basic substitution
assert(
  "substitutes simple field",
  render("Hi {{first_name}}, your order {{order_number}} is ready.", {
    first_name: "Ayesha",
    order_number: "ORD-123",
  }) === "Hi Ayesha, your order ORD-123 is ready."
);

// 2) Nested path access
assert(
  "substitutes dotted path",
  render("Total: {{totals.grand_total}}", { totals: { grand_total: "Rs. 150,000" } }) ===
    "Total: Rs. 150,000"
);

// 3) HTML escaping (safe for email bodies)
assert(
  "escapes html values",
  render("Hello {{name}}", { name: "<b>Bob</b>" }) === "Hello &lt;b&gt;Bob&lt;/b&gt;"
);

// 4) Unresolved placeholders stay literal (visible template bug)
assert(
  "keeps unresolved placeholder literal",
  render("Hi {{missing}}", {}) === "Hi {{missing}}"
);

// 5) escapeHtml primitive
assert("escapeHtml escapes & < > \" '", escapeHtml(`&<>"'`) === "&amp;&lt;&gt;&quot;&#39;");

// 6) Empty value renders as empty (not undefined)
assert("empty value -> empty string", render("[{{x}}]", { x: "" }) === "[{{x}}]");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
