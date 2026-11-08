import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;
async function q(label, sql) {
  const res = await fetch(BASE, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const t = await res.text();
  console.log(`\n[${label}]`);
  if (!res.ok) { console.log("ERR", res.status, t.slice(0,200)); return; }
  const j = JSON.parse(t);
  console.log(JSON.stringify(j, null, 2));
}

await q("place_order_buynow", `select p.proname, pg_get_function_identity_arguments(p.oid) as args, pg_get_function_result(p.oid) as result from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='place_order_buynow';`);
await q("submit_payment_proof", `select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_payment_proof';`);
await q("review_order_payment", `select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='review_order_payment';`);
await q("review_instalment_advance", `select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='review_instalment_advance';`);
await q("review_instalment_application", `select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='review_instalment_application';`);
