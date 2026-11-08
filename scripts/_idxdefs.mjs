import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";
const token = getManagementToken();
const BASE = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function q(sql) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const t = await res.text();
  if (!res.ok) return "ERR " + res.status + ": " + t.slice(0, 120);
  try { const j = JSON.parse(t); return Array.isArray(j) ? j.map((r) => Object.values(r).join("  ")).join("\n") : t.slice(0, 300); } catch { return t.slice(0, 300); }
}

console.log("PAYMENTS index definitions:\n" + await q(`select indexname, indexdef from pg_indexes where schemaname='public' and tablename='payments' order by indexname`));
console.log("\nRECEIPTS index definitions:\n" + await q(`select indexname, indexdef from pg_indexes where schemaname='public' and tablename='payment_receipts' order by indexname`));
