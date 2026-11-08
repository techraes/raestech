// Run the Vercel CLI (node entry) injecting VERCEL_TOKEN from env or the
// gitignored scripts/.vercel-token file. Keeps the token out of argv/history.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let token = process.env.VERCEL_TOKEN || "";
if (!token) {
  try { token = readFileSync("scripts/.vercel-token", "utf8").trim(); } catch {}
}
if (!token) { console.error("no vercel token (VERCEL_TOKEN or scripts/.vercel-token)"); process.exit(1); }

const js = resolve("node_modules/vercel/dist/vc.js");
const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [js, ...args], {
  env: { ...process.env, VERCEL_TOKEN: token },
  stdio: "inherit",
});
process.exit(r.status ?? 1);
