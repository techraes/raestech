import { readFileSync } from "node:fs";
const token = (process.env.VERCEL_TOKEN || readFileSync("scripts/.vercel-token", "utf8").trim());
const res = await fetch("https://api.vercel.com/v9/projects/raestech", { headers: { Authorization: `Bearer ${token}` } });
const j = await res.json();
if (!res.ok) { console.log("ERR", res.status, JSON.stringify(j)); process.exit(1); }
console.log("project name:", j.name);
console.log("framework:", j.framework);
console.log("id:", j.id);
console.log("gitRepository:", JSON.stringify(j.gitRepository || null));
console.log("links:", JSON.stringify(j.links || null));
console.log("linkedProjects:", JSON.stringify(j.linkedProjects || null));
console.log("latestDeployments (first 3):");
for (const d of (j.latestDeployments || []).slice(0, 3)) {
  console.log("  ", d.id, d.readyState, d.url, d.target);
}
