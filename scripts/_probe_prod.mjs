// READ-ONLY probe of the production Supabase project (otvfosijrectvlwqqoll).
// Only SELECT / column-existence probes run — no inserts, updates or deletes.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function envVar(name) {
  let raw;
  for (const f of [".env.local", ".env", ".env.development"]) {
    try {
      const content = readFileSync(f, "utf8");
      const m = content.split("\n").find((l) => l.startsWith(`${name}=`));
      if (m) { raw = m.slice(name.length + 1).trim(); break; }
    } catch { /* not present */ }
  }
  return raw || "";
}

const url = envVar("VITE_SUPABASE_URL");
const anon = envVar("VITE_SUPABASE_ANON_KEY");
if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, anon);

async function probeColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return error ? `MISSING/denied (${error.code ?? error.message.slice(0, 60)})` : "present";
}

async function probeTable(table) {
  const { data, error } = await supabase.from(table).select("*").limit(1);
  if (error) return { table, readable: false, err: `${error.code ?? ""} ${error.message.slice(0, 80)}` };
  return { table, readable: true, sampleRows: Array.isArray(data) ? data.length : 0 };
}

const orderCols = ["shipping_full_name", "shipping_phone", "shipping_address", "shipping_area", "shipping_city", "shipping_province", "shipping_postal"];
const appCols = ["delivery_full_name", "delivery_phone", "delivery_address", "delivery_area", "delivery_city", "delivery_province", "delivery_postal_code"];

console.log("== connectivity ==");
console.log("url:", url);

console.log("\n== orders table columns (new) ==");
for (const c of orderCols) console.log(`  ${c}: ${await probeColumn("orders", c)}`);

console.log("\n== instalment_applications columns (new) ==");
for (const c of appCols) console.log(`  ${c}: ${await probeColumn("instalment_applications", c)}`);

console.log("\n== table readability (anon, read-only) ==");
for (const t of ["orders", "instalment_applications", "payments", "payment_receipts", "payment_proofs", "instalment_documents"]) {
  console.log(" ", await probeTable(t));
}

console.log("\n== payment_status values in use (sample) ==");
const { data: payRows } = await supabase.from("payments").select("status").limit(20);
if (payRows) {
  const set = new Set(payRows.map((r) => r.status));
  console.log("  distinct:", [...set].join(", ") || "(none)");
}

console.log("\n== order status values in use (sample) ==");
const { data: ordRows } = await supabase.from("orders").select("status").limit(50);
if (ordRows) {
  const set = new Set(ordRows.map((r) => r.status));
  console.log("  distinct:", [...set].join(", ") || "(none)");
}
