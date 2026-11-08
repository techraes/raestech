import { createClient } from "@supabase/supabase-js";

const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error("missing required env " + k);
  return v;
};
const token = env("SUPABASE_ACCESS_TOKEN");
const ref = process.argv[2] || "xisvlnruafmfnjtbwjin";
const CUSTOMER = { email: env("E2E_CUSTOMER1_EMAIL"), password: env("E2E_CUSTOMER1_PASSWORD") };
const ADMIN = { email: env("E2E_ADMIN_EMAIL"), password: env("E2E_ADMIN_PASSWORD") };

function assert(cond, msg) {
  if (!cond) {
    console.error("ASSERT FAILED: " + msg);
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
const admin = await signIn(ADMIN);
const { data: me } = await customer.auth.getUser();
const uid = me.user.id;

// ---- helper: create a fresh pending order for a decision test ----
const makeOrder = async (prefix) => {
  const refNo = prefix + Date.now();
  const { data: o, error: oe } = await customer
    .from("orders")
    .insert({ order_number: refNo, user_id: uid, email: CUSTOMER.email, payment_method: "manual_bank_transfer", total: 10000 })
    .select("id")
    .single();
  assert(!oe, "order insert failed: " + (oe && oe.message));
  const { error: pe } = await customer.from("payments").insert({
    order_id: o.id, user_id: uid, amount: 10000, status: "pending_verification", method: "manual_bank_transfer",
  });
  assert(!pe, "payment insert failed: " + (pe && pe.message));
  return o;
};

// ---- D1. approve a fresh order ----
const o1 = await makeOrder("E2E-OK-");
const res1 = await admin.rpc("review_order_payment", { p_order_id: o1.id, p_decision: "approve" });
assert(!res1.error, "approve RPC error: " + (res1.error && res1.error.message));
assert(res1.data && Array.isArray(res1.data) && res1.data[0] && res1.data[0].ok === true, "approve did not return ok=true");

const { data: ov } = await admin.from("orders").select("status,payment_status").eq("id", o1.id).single();
assert(ov.payment_status === "verified", "expected payment_status=verified, got " + ov.payment_status);
assert(ov.status === "confirmed", "expected order status=confirmed, got " + ov.status);
const { data: jobs1 } = await admin.from("order_email_jobs").select("id").eq("kind", "order").eq("subject_id", o1.id);
console.log("  [D1] PASS: approved -> payment verified, order confirmed (email jobs:", jobs1.length, ")");

// ---- D2. re-approve is idempotent ----
const res2 = await admin.rpc("review_order_payment", { p_order_id: o1.id, p_decision: "approve" });
assert(!res2.error, "re-approve RPC error");
const { data: jobs2 } = await admin.from("order_email_jobs").select("id").eq("kind", "order").eq("subject_id", o1.id);
const { data: pays } = await admin.from("payments").select("id,status").eq("order_id", o1.id);
assert(pays.length === 1, "payments must stay 1 after re-approve, got " + pays.length);
assert(jobs2.length === jobs1.length, "email jobs changed on re-approve: " + jobs1.length + " -> " + jobs2.length);
console.log("  [D2] PASS: re-approve idempotent (1 payment, email jobs unchanged: " + jobs2.length + ")");

// ---- D3. reject without reason must fail (fresh order) ----
const o3 = await makeOrder("E2E-RJ-");
const noReason = await admin.rpc("review_order_payment", { p_order_id: o3.id, p_decision: "reject" });
assert(noReason.error !== null, "reject without reason was accepted (must be blocked)");
const withReason = await admin.rpc("review_order_payment", { p_order_id: o3.id, p_decision: "reject", p_reason: "Test rejection" });
assert(!withReason.error && withReason.data?.[0]?.ok === true, "reject with reason failed");
const { data: rv } = await admin.from("orders").select("payment_status,rejection_reason").eq("id", o3.id).single();
assert(rv.payment_status === "rejected", "expected payment_status=rejected, got " + rv.payment_status);
assert(rv.rejection_reason === "Test rejection", "rejection_reason not stored");
console.log("  [D3] PASS: reject requires reason; with reason -> rejected + stored");

// ---- D4. instalment advance vs application separation ----
const { data: v } = await admin.from("product_variants").select("id").limit(1).single();
const appNo = "E2E-APP-" + Date.now();
const { data: app, error: appErr } = await customer.from("instalment_applications").insert({
  application_number: appNo,
  user_id: uid,
  variant_id: v.id,
  full_name: "Test Customer One",
  mobile: "03000000000",
  email: CUSTOMER.email,
  cnic: "42101-1234567-1",
  current_address: "Lahore",
  employment_status: "employed",
  monthly_income: "150000",
  tenure_months: 6,
  listed_price: 300000,
  advance_payment: 60000,
  remaining_balance: 240000,
  monthly_payment: 40000,
  total_payable: 300000,
  consent_given: true,
}).select("id,status").single();
assert(!appErr, "application insert failed: " + (appErr && appErr.message));

const { error: pErr } = await customer.from("payments").insert({
  instalment_application_id: app.id, user_id: uid, amount: 60000, status: "pending_verification", method: "manual_bank_transfer",
});
assert(!pErr, "application payment insert failed: " + (pErr && pErr.message));

const r4 = await admin.rpc("review_instalment_advance", { p_application_id: app.id, p_decision: "approve" });
assert(!r4.error && r4.data?.[0]?.ok === true, "verify advance RPC failed");
const { data: av } = await admin.from("instalment_applications").select("status,advance_received,remaining_balance").eq("id", app.id).single();
assert(av.status === "advance_payment_verified", "advance should set status=advance_payment_verified, got " + av.status);
assert(Number(av.advance_received) === 60000, "advance_received should be 60000, got " + av.advance_received);
assert(Number(av.remaining_balance) === 240000, "remaining_balance must stay 240000 (not marked paid), got " + av.remaining_balance);

const r5 = await admin.rpc("review_instalment_application", { p_application_id: app.id, p_decision: "approve" });
assert(!r5.error && r5.data?.[0]?.ok === true, "approve application RPC failed");
const { data: av2 } = await admin.from("instalment_applications").select("status").eq("id", app.id).single();
assert(av2.status === "approved", "application should be approved separately, got " + av2.status);
console.log("  [D4] PASS: advance verified (balance unchanged), application approved separately");

console.log("\nALL_ADMIN_CHECKS_PASS");
