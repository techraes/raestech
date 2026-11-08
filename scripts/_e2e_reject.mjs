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

const refNo = "E2E-RJ-" + Date.now();
const { data: order, error: oe } = await customer
  .from("orders")
  .insert({ order_number: refNo, user_id: uid, email: CUSTOMER.email, payment_method: "manual_bank_transfer", total: 10000 })
  .select("id")
  .single();
assert(!oe, "order insert failed: " + (oe && oe.message));

const { error: pe } = await customer.from("payments").insert({
  order_id: order.id, user_id: uid, amount: 10000, status: "pending_verification", method: "manual_bank_transfer",
});
assert(!pe, "payment insert failed: " + (pe && pe.message));

// reject without reason must be blocked
const noReason = await admin.rpc("review_order_payment", { p_order_id: order.id, p_decision: "reject" });
assert(noReason.error !== null, "reject without reason was accepted (must be blocked)");
console.log("  [reject] PASS: missing reason blocked");

// reject with reason must succeed and persist
const withReason = await admin.rpc("review_order_payment", { p_order_id: order.id, p_decision: "reject", p_reason: "Test rejection" });
assert(!withReason.error && withReason.data?.[0]?.ok === true, "reject with reason failed");
const { data: ov } = await admin.from("orders").select("payment_status,rejection_reason").eq("id", order.id).single();
assert(ov.payment_status === "rejected", "expected payment_status=rejected, got " + ov.payment_status);
assert(ov.rejection_reason === "Test rejection", "rejection_reason not stored on order");
const { data: pays } = await admin.from("payments").select("status,rejection_reason").eq("order_id", order.id);
assert(pays.length === 1 && pays[0].status === "rejected", "payment should be rejected and single");
assert(pays[0].rejection_reason === "Test rejection", "rejection_reason not stored on payment");
console.log("  [reject] PASS: rejected + reason stored on order and payment");

console.log("\nALL_REJECT_CHECKS_PASS");
