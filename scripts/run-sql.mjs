import { readFileSync } from "node:fs";
const REF = "otvfosijrectvlwqqoll";

// The Supabase management (sbp) token is read from the environment, never
// passed on the command line, so it cannot leak into shell history, process
// listings, logs or error messages.
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const file = process.argv[2];

if (!TOKEN || !file) {
  console.error("Usage: SUPABASE_ACCESS_TOKEN=<sbp-token> node scripts/run-sql.mjs <sql-file>");
  process.exit(1);
}

const query = readFileSync(file, "utf8");
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const text = await res.text();
console.log("HTTP", res.status);
console.log(text.slice(0, 2500));
