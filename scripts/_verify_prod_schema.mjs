// READ-ONLY production schema verification via Management API.
import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
if (!token) { console.error("token missing"); process.exit(1); }
const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function q(label, sql) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) { console.log(`\n[${label}] ERROR ${res.status}: ${text.slice(0,200)}`); return null; }
  let rows; try { rows = JSON.parse(text); } catch { rows = text; }
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(rows, null, 2));
  return rows;
}

await q("orders cols", `select column_name from information_schema.columns where table_schema='public' and table_name='orders' and column_name in ('shipping_address','shipping_area','shipping_city','shipping_province','shipping_postal');`);
await q("instalment cols", `select column_name from information_schema.columns where table_schema='public' and table_name='instalment_applications' and column_name like 'delivery_%';`);
await q("order_status enum", `select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='order_status' order by e.enumsortorder;`);
await q("payment_status enum", `select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='payment_status' order by e.enumsortorder;`);
await q("review functions", `select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('review_order_payment','review_instalment_advance','review_instalment_application','submit_payment_proof');`);
await q("unique indexes", `select indexname from pg_indexes where schemaname='public' and indexname in ('payments_order_unique','receipts_payment_unique','payments_instalment_app_unique');`);
