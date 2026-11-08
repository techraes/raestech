import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;
async function q(label, sql) {
  const res = await fetch(BASE, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const t = await res.text();
  if (!res.ok) { console.log(`[${label}] ERROR ${res.status}: ${t.slice(0,200)}`); return; }
  const j = JSON.parse(t);
  console.log(`[${label}] OK rows=${Array.isArray(j)?j.length:0}`);
}

// Replicate AdminOrders.load() column set (read-only, LIMIT 1) to prove every
// selected column exists and the query is valid against production.
await q("orders", `select id,order_number,email,phone,status,payment_status,total,subtotal,discount_amount,shipping_charge,placed_at,shipping_full_name,shipping_phone,shipping_address,shipping_area,shipping_city,shipping_province,shipping_postal,payment_method,customer_notes,rejection_reason,reviewed_at from public.orders order by placed_at desc limit 1;`);
await q("apps", `select id,application_number,full_name,mobile,email,cnic,status,advance_payment,advance_received,remaining_balance,monthly_payment,total_payable,tenure_months,created_at,reviewed_by,reviewed_at,rejection_reason,delivery_full_name,delivery_phone,delivery_address,delivery_area,delivery_city,delivery_province,delivery_postal_code from public.instalment_applications order by created_at desc limit 1;`);
await q("payments", `select id,order_id,instalment_application_id,status,method,amount,created_at,rejection_reason from public.payments limit 1;`);
await q("receipts", `select id,payment_id,file_path,file_name,mime_type from public.payment_receipts limit 1;`);
await q("docs", `select id,application_id,path,doc_type,original_name,mime_type from public.instalment_documents limit 1;`);

// RPC signatures (read-only catalog).
console.log("\nFunction signatures:");
await q("place_order_buynow", `select pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='place_order_buynow';`);
await q("submit_payment_proof", `select pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_payment_proof';`);
await q("review_order_payment", `select pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='review_order_payment';`);
