// Live backend verification harness (READ-ONLY unless explicitly running the
// double-submit test with --write).
//
// SECURITY: all credentials come from SUPABASE_ACCESS_TOKEN / .env.local /
// scripts/.management-token (see scripts/_token.mjs). This file contains NO
// secrets and is safe to commit. Delete scripts/.management-token after use.
//
// Usage (run from project root):
//   node scripts/_verify_live.mjs --test=isolation   # Test E (default)
//   node scripts/_verify_live.mjs --test=double      # Test B (writes a test
//                                                      # payment + receipt on a
//                                                      # pending order)
//
// Environment:
//   VITE_SUPABASE_URL      e.g. https://otvfosijrectvlwqqoll.supabase.co
//   VITE_SUPABASE_ANON_KEY manage anon/publishable key
//   SUPABASE_ACCESS_TOKEN  or scripts/.management-token (management token)
import { getManagementToken } from "./_token.mjs";

const URL = process.env.VITE_SUPABASE_URL || "https://otvfosijrectvlwqqoll.supabase.co";
// The anon/publishable key is public (embedded in the web client bundle).
const ANON = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Fkru0anAgcwRwIjwhKY8GQ_drPZmOWT";
const REF = "otvfosijrectvlwqqoll";
const MGMT = getManagementToken();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("="))
);
const TEST = args.test || "isolation";

// Test accounts (created by scripts/_make_users.mjs — E2E only).
const PW = "R4es!Test#2025";
const CUST = "raes-e2e-cust2@example.com";
const ADMIN = "raes-e2e-admin@example.com";
const BUYER = "raes-e2e-buynow@example.com";

// Test E fixtures.
const ORDER = "d3dad8fa-9d4e-4d72-811f-15ab85e4231e";            // owner b30c0ab3
const RECEIPT = "b30c0ab3-955b-4019-9fe9-2a889aa314af/receipts/e2e-synthetic.png";
const CNIC_DOC = "f475b3eb-c011-40cd-a93d-0bd3a885d6a4/instalments/1794134945987-WhatsApp_Image_2026-11-08_at_12.27.24_AM.jpeg";

// Test B fixture (pending/unpaid order owned by buyer).
const DBL_ORDER = "c04ef9b7-3e35-4779-a622-42febb7644f4";
const DBL_OWNER = "b30c0ab3-955b-4019-9fe9-2a889aa314af";

async function login(email) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("login failed: " + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

async function sign(token, bucket, path) {
  const r = await fetch(`${URL}/storage/v1/object/sign/${bucket}/${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  return { status: r.status, body: await r.text() };
}

async function rest(token, path, body) {
  const r = await fetch(URL + path, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Content-Profile": "public" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, text: await r.text() };
}

async function runIsolation() {
  const t2 = await login(CUST);
  const tA = await login(ADMIN);

  // E1: second customer tries to read first customer's order
  const orderRead = await fetch(`${URL}/rest/v1/orders?select=id,order_number&id=eq.${ORDER}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${t2}` },
  });
  const rows = await orderRead.json();

  // E2/E3: second customer tries to sign receipt + CNIC doc
  const r1 = await sign(t2, "receipts", RECEIPT);
  const r2 = await sign(t2, "identity-documents", CNIC_DOC);

  // E5/E6: admin (positive control) signs the same
  const a1 = await sign(tA, "receipts", RECEIPT);
  const a2 = await sign(tA, "identity-documents", CNIC_DOC);

  const pass =
    Array.isArray(rows) && rows.length === 0 &&
    r1.status >= 400 && r2.status >= 400 &&
    a1.status === 200 && a2.status === 200;

  console.log("E1 cust2 read order:", orderRead.status, JSON.stringify(rows).slice(0, 80));
  console.log("E2 cust2 sign receipt:", r1.status, r1.body.slice(0, 80));
  console.log("E3 cust2 sign cnic :", r2.status, r2.body.slice(0, 80));
  console.log("E5 admin sign receipt:", a1.status, a1.body.slice(0, 60));
  console.log("E6 admin sign cnic  :", a2.status, a2.body.slice(0, 60));
  console.log("TEST_E_ISOLATION:", pass ? "PASS" : "FAIL");
  process.exit(pass ? 0 : 1);
}

async function runDouble() {
  const t = await login(BUYER);
  const filePath = `${DBL_OWNER}/receipts/double-tap-test-${Date.now()}.png`;

  // upload test receipt (private, owner folder)
  const up = await fetch(`${URL}/storage/v1/object/receipts/${encodeURIComponent(filePath)}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${t}`, "Content-Type": "image/png" },
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"),
  });
  console.log("upload test receipt:", up.status);

  // replicate attachReceiptToOrder exactly (lookup -> insert payment -> lookup -> insert receipt)
  async function attachOnce(receiptPath) {
    const owned = await fetch(`${URL}/rest/v1/orders?select=id&id=eq.${DBL_ORDER}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${t}` },
    });
    if ((await owned.json()).length === 0) return { status: "not_owned" };

    const ex = await fetch(`${URL}/rest/v1/payments?select=id&order_id=eq.${DBL_ORDER}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${t}` },
    });
    let paymentId = (await ex.json())[0]?.id;

    if (!paymentId) {
      const ins = await rest(t, "/rest/v1/payments", {
        order_id: DBL_ORDER, user_id: DBL_OWNER, amount: 482500,
        status: "pending_verification", method: "manual_bank_transfer",
      });
      const b = ins.text === "" ? {} : JSON.parse(ins.text);
      paymentId = b[0]?.id;
      if (!paymentId) return { status: "pay_insert_failed:" + ins.status };
    }

    const rr = await fetch(`${URL}/rest/v1/payment_receipts?select=id&payment_id=eq.${paymentId}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${t}` },
    });
    if ((await rr.json()).length > 0) return { status: "already_linked", ref: paymentId };

    const rins = await rest(t, "/rest/v1/payment_receipts", {
      payment_id: paymentId, file_path: receiptPath, file_name: "double-tap-test.png",
      mime_type: "image/png", file_size: 70, uploaded_by: DBL_OWNER,
    });
    if (rins.status >= 400) return { status: "receipt_insert_failed:" + rins.status, ref: paymentId };
    return { status: "ok", ref: paymentId };
  }

  const first = await attachOnce(filePath);
  const second = await attachOnce(filePath);
  console.log("first attempt :", JSON.stringify(first));
  console.log("second attempt:", JSON.stringify(second));

  const check = await fetch(`${URL}/rest/v1/payments?select=id,status,amount&order_id=eq.${DBL_ORDER}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${t}` },
  });
  const payRows = await check.json();
  console.log("payments for order:", JSON.stringify(payRows));
  let receiptCount = 0;
  for (const p of payRows) {
    const c = await fetch(`${URL}/rest/v1/payment_receipts?select=id&payment_id=eq.${p.id}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${t}` },
    });
    receiptCount += (await c.json()).length;
  }

  const pass = payRows.length === 1 && receiptCount === 1 && second.ref === first.ref && first.ref;
  console.log("TEST_B_DOUBLE_TAP:", pass ? "PASS" : "FAIL");
  process.exit(pass ? 0 : 1);
}

if (TEST === "double" && !MGMT) {
  console.log("note: management token not present; running double-submit test only (does not need mgmt).");
}
if (TEST === "double") await runDouble();
else await runIsolation();
