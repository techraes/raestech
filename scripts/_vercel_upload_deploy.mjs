// Deploy the project SOURCE to Vercel (framework: vite), letting Vercel run
// the build — mirrors a git push. Excludes node_modules/dist/.git and secrets.
// Token: VERCEL_TOKEN env or scripts/.vercel-token (gitignored).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const token = (process.env.VERCEL_TOKEN || readFileSync("scripts/.vercel-token", "utf8").trim());
if (!token) { console.error("no vercel token"); process.exit(1); }
const API = "https://api.vercel.com";

const EXCLUDE = new Set([".git", "node_modules", "dist", ".vercel", ".env", ".env.local", ".env.staging", ".env.production"]);
const EXCLUDE_EXT = new Set([".vercel-token", ".management-token", ".token", ".service-role", ".resend-token"]);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!EXCLUDE.has(e)) out.push(...walk(p));
    } else {
      const dot = e.lastIndexOf(".");
      const ext = dot > 0 ? e.slice(dot) : "";
      if (!EXCLUDE_EXT.has(ext)) out.push(p);
    }
  }
  return out;
}

const files = walk(".").map((p) => {
  const buf = readFileSync(p);
  return {
    file: relative(".", p).replace(/\\/g, "/"),
    sha: createHash("sha1").update(buf).digest("hex"),
    size: buf.length,
  };
});
console.log("source files to deploy:", files.length);

async function uploadOne(f) {
  const buf = readFileSync(f.file);
  const r = await fetch(`${API}/v2/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(buf.byteLength),
      "x-now-digest": f.sha,
      "x-now-size": String(buf.byteLength),
    },
    body: buf,
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(`upload failed ${f.file}: HTTP ${r.status} ${(j.error && j.error.message) || ""}`);
  }
  return f;
}

const CONCURRENCY = 6;
let idx = 0;
let done = 0;
async function worker() {
  while (idx < files.length) {
    const f = files[idx++];
    await uploadOne(f);
    done++;
    if (done % 100 === 0) console.log("  uploaded", done, "/", files.length);
  }
}
console.log("Uploading", files.length, "files to /v2/files…");
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("All files uploaded.");

console.log("Creating deployment…");
const body = { name: "raestech", project: "raestech", target: "production", files };
const res = await fetch(`${API}/v13/deployments`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const j = await res.json();
if (!res.ok) {
  console.log("DEPLOY ERR", res.status);
  console.log(JSON.stringify(j.error || j, null, 2).slice(0, 1500));
  process.exit(1);
}
const id = j.id;
console.log("Deployment id:", id);
console.log("url: https://" + j.url);
console.log("initial state:", j.readyState);

for (let i = 0; i < 180; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const r = await fetch(`${API}/v13/deployments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  console.log("  state:", d.readyState);
  if (d.readyState === "READY") {
    console.log("\nPRODUCTION PUBLISHED: https://" + ((d.alias && d.alias[0]) || d.url));
    process.exit(0);
  }
  if (d.readyState === "ERROR" || d.readyState === "CANCELED") {
    console.log("Deployment failed:", JSON.stringify(d.error || d).slice(0, 1000));
    process.exit(1);
  }
}
console.log("Timed out waiting; check the Vercel dashboard.");
