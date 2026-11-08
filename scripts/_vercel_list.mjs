// READ-ONLY: list Vercel projects for the token.
import { readFileSync } from "node:fs";

const token = (process.env.VERCEL_TOKEN || readFileSync("scripts/.vercel-token", "utf8").trim());
if (!token) { console.error("no vercel token"); process.exit(1); }

const res = await fetch("https://api.vercel.com/v9/projects", {
  headers: { Authorization: `Bearer ${token}` },
});
const j = await res.json();
if (!res.ok) { console.log("ERR", res.status, JSON.stringify(j)); process.exit(1); }
console.log("Projects:");
for (const p of (j.projects || [])) {
  console.log(`  ${p.name} | framework=${p.framework} | id=${p.id}`);
}
console.log("\npagination:", JSON.stringify(j.pagination || {}));
