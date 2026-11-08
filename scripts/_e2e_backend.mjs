import { createClient } from "@supabase/supabase-js";

// Credentials come from the environment only (never literals).
const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error("missing required env " + k);
  return v;
};
const token = env("SUPABASE_ACCESS_TOKEN");
const ref = process.argv[2] || "xisvlnruafmfnjtbwjin";
const CUSTOMER = { email: env("E2E_CUSTOMER1_EMAIL"), password: env("E2E_CUSTOMER1_PASSWORD") };
const CUSTOMER2 = { email: env("E2E_CUSTOMER2_EMAIL"), password: env("E2E_CUSTOMER2_PASSWORD") };

function assert(cond, msg) {
  if (!cond) {
    const e = new Error("ASSERT FAILED: " + msg);
    console.error(e.message);
    process.exit(1);
  }
}

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
  headers: { Authorization: "Bearer " + token },
});
const j = await r.json();
const anon = (j || []).find((k) => k.name === "anon").api_key;
const url = `https://${ref}.supabase.co`;

const signIn = async (creds) => {
  const lr = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  const lj = await lr.json();
  assert(lj.access_token, "signin failed for " + creds.email);
  const c = createClient(url, anon, { auth: { persistSession: false } });
  await c.auth.setSession({ access_token: lj.access_token, refresh_token: lj.refresh_token });
  return c;
};

const customer = await signIn(CUSTOMER);
const { data: me } = await customer.auth.getUser();
const uid = me.user.id;

// ---- A. Buy Now order + receipt submission ----
const refNo = "E2E-BN-" + Date.now();
const { data: order, error: oErr } = await customer
  .from("orders")
  .insert({
    order_number: refNo,
    user_id: uid,
    email: CUSTOMER.email,
    payment_method: "manual_bank_transfer",
    total: 52510,
  })
  .select("id,order_number,total")
  .single();
assert(!oErr, "order insert failed: " + (oErr && oErr.message));
console.log("ORDER", refNo, "saved id", order.id, "total", order.total);

const filePath = `${uid}/receipts/${Date.now()}-test.pdf`;
const { error: upErr } = await customer.storage.from("receipts").upload(filePath, Buffer.from("%PDF-1.4 test receipt"), {
  contentType: "application/pdf",
});
assert(!upErr, "receipt upload failed: " + (upErr && upErr.message));

const { data: pay, error: pErr } = await customer
  .from("payments")
  .insert({ order_id: order.id, user_id: uid, amount: 52510, status: "pending_verification", method: "manual_bank_transfer" })
  .select("id")
  .single();
assert(!pErr, "payment insert failed: " + (pErr && pErr.message));
const paymentId = pay.id;

const { error: rcErr } = await customer.from("payment_receipts").insert({
  payment_id: paymentId,
  file_path: filePath,
  file_name: "test.pdf",
  mime_type: "application/pdf",
  file_size: 16,
  uploaded_by: uid,
});
assert(!rcErr, "receipt link failed: " + (rcErr && rcErr.message));

const { data: pays } = await customer.from("payments").select("id,status").eq("order_id", order.id);
const { data: receipts } = await customer.from("payment_receipts").select("id").in("payment_id", pays.map((p) => p.id));
assert(pays.length === 1, "expected exactly 1 payment, got " + pays.length);
assert(pays[0].status === "pending_verification", "payment status should be pending_verification, got " + pays[0].status);
assert(receipts.length === 1, "expected exactly 1 linked receipt, got " + receipts.length);
console.log("  [A] PASS: 1 payment (pending_verification) + 1 receipt");

// ---- B. idempotency: duplicate submission must be rejected ----
const dup = await customer
  .from("payments")
  .insert({ order_id: order.id, user_id: uid, amount: 52510, status: "pending_verification", method: "manual_bank_transfer" })
  .select("id")
  .single();
assert(dup.error !== null, "duplicate payment was accepted (should have been blocked by unique constraint)");

const { data: pays2 } = await customer.from("payments").select("id").eq("order_id", order.id);
const { data: rc2 } = await customer.from("payment_receipts").select("id").in("payment_id", pays2.map((p) => p.id));
assert(pays2.length === 1, "payments must stay 1 after duplicate, got " + pays2.length);
assert(rc2.length === 1, "receipts must stay 1 after duplicate, got " + rc2.length);
console.log("  [B] PASS: duplicate blocked, still 1 payment / 1 receipt");

// ---- E. second customer cannot read first customer's payments ----
const customer2 = await signIn(CUSTOMER2);
const { data: others, error: otherErr } = await customer2.from("payments").select("id").eq("order_id", order.id);
assert(otherErr === null || (others || []).length === 0, "customer2 could read customer1 payments (leak): rows=" + ((others || []).length));
assert((others || []).length === 0, "customer2 saw " + ((others || []).length) + " rows for customer1's order");
console.log("  [E] PASS: customer2 sees 0 rows (RLS isolation)");

console.log("\nALL_BACKEND_CHECKS_PASS");
