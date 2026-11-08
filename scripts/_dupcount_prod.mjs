// READ-ONLY duplicate count against production via the Supabase Management API.
// Runs only SELECT queries — no inserts/updates/deletes, no schema changes.
import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN not set");
  process.exit(1);
}

const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;

const queries = {
  "payments per order (>1)": `select order_id, count(*) as n from public.payments where order_id is not null group by order_id having count(*) > 1;`,
  "payments per instalment app (>1)": `select instalment_application_id, count(*) as n from public.payments where instalment_application_id is not null group by instalment_application_id having count(*) > 1;`,
  "receipts per payment (>1)": `select payment_id, count(*) as n from public.payment_receipts group by payment_id having count(*) > 1;`,
  "rows per table": `select 'payments' as t, count(*) from public.payments union all select 'payment_receipts', count(*) from public.payment_receipts union all select 'payment_proofs', count(*) from public.payment_proofs union all select 'orders', count(*) from public.orders union all select 'instalment_applications', count(*) from public.instalment_applications;`,
};

for (const [label, query] of Object.entries(queries)) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.log(`\n[${label}] ERROR ${res.status}: ${body.slice(0, 200)}`);
    continue;
  }
  let rows;
  try { rows = JSON.parse(body); } catch { rows = body; }
  console.log(`\n[${label}]`);
  console.log(Array.isArray(rows) ? JSON.stringify(rows, null, 2) : rows);
}
