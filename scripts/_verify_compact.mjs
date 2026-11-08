import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
if (!token) process.exit(1);
const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function q(sql) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const t = await res.text();
  if (!res.ok) return "ERR " + res.status + ": " + t.slice(0, 120);
  try { const j = JSON.parse(t); return Array.isArray(j) ? j.map((r) => Object.values(r).join(",")).join(" | ") : t.slice(0, 200); } catch { return t.slice(0, 200); }
}

console.log("orders cols:", await q(`select string_agg(column_name,',' order by column_name) from information_schema.columns where table_schema='public' and table_name='orders' and column_name like 'shipping_%'`));
console.log("instalment delivery cols:", await q(`select string_agg(column_name,',' order by column_name) from information_schema.columns where table_schema='public' and table_name='instalment_applications' and column_name like 'delivery_%'`));
console.log("order_status enum:", await q(`select string_agg(enumlabel,',' order by enumsortorder) from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='order_status'`));
console.log("payment_status enum:", await q(`select string_agg(enumlabel,',' order by enumsortorder) from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='payment_status'`));
console.log("review functions:", await q(`select string_agg(proname,',' order by proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('review_order_payment','review_instalment_advance','review_instalment_application','submit_payment_proof')`));
console.log("payments indexes:", await q(`select string_agg(indexname,',' order by indexname) from pg_indexes where schemaname='public' and tablename='payments'`));
console.log("receipts indexes:", await q(`select string_agg(indexname,',' order by indexname) from pg_indexes where schemaname='public' and tablename='payment_receipts'`));
