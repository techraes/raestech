// Publish the built `dist` folder to Vercel project "raestech" (production)
// via the REST API: (1) upload each file to /v2/files, (2) create a
// deployment referencing the uploaded URLs. Works with deploy tokens.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const token = (process.env.VERCEL_TOKEN || readFileSync("scripts/.vercel-token", "utf8").trim());
if (!token) { console.error("no vercel token"); process.exit(1); }
const API = "https://api.vercel.com";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk("dist").map((full) => ({
  file: relative("dist", full).split(sep).join("/"),
  path: full,
}));
files.push({ file: "vercel.json", path: "vercel.json" });

async function uploadOne(f, tries = 12) {
  const buf = readFileSync(f.path);
  const sha = createHash("sha1").update(buf).digest("hex");
  let lastErr = "";
  for (let t = 1; t <= tries; t++) {
    try {
      const r = await fetch(`${API}/v2/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "Content-Length": String(buf.byteLength),
          "x-now-digest": sha,
          "x-now-size": String(buf.byteLength),
        },
        body: buf,
      });
      const j = await r.json().catch(() => ({}));
      const up = (Array.isArray(j.urls) && j.urls[0]) || j.url;
      if (r.ok && up) {
        return { file: f.file, sha, size: buf.length, url: up };
      }
      lastErr = `HTTP ${r.status} ${j.error && j.error.code || ""} ${(j.error && j.error.message || "").slice(0,120)}`;
      if (r.status === 403 || r.status === 401) throw new Error("auth " + r.status);
    } catch (e) {
      if (e.message && e.message.startsWith("auth")) throw e;
      lastErr = e.message;
      if (t === tries) break;
      await new Promise((r) => setTimeout(r, 2000 * t));
    }
  }
  throw new Error("upload failed: " + f.file + " :: " + lastErr);
}

// Upload with small concurrency pool.
const CONCURRENCY = 3;
const results = [];
let idx = 0;
async function worker() {
  while (idx < files.length) {
    const f = files[idx++];
    const up = await uploadOne(f);
    results.push(up);
    if (results.length % 100 === 0) console.log("  uploaded", results.length, "/", files.length);
  }
}
console.log("Uploading", files.length, "files to /v2/files…");
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("All files uploaded.");

console.log("Creating deployment…");
const body = {
  name: "raestech",
  project: "raestech",
  target: "production",
  files: results,
};
const res = await fetch(`${API}/v13/deployments`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const j = await res.json();
if (!res.ok) {
  console.log("DEPLOY ERR", res.status);
  console.log(JSON.stringify(j, null, 2));
  process.exit(1);
}
const id = j.id;
console.log("Deployment id:", id);
console.log("url: https://" + j.url);
console.log("initial state:", j.readyState);

for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const r = await fetch(`${API}/v13/deployments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  console.log("  state:", d.readyState);
  if (d.readyState === "READY") {
    console.log("\nPRODUCTION PUBLISHED: https://" + ((d.alias && d.alias[0]) || d.url));
    process.exit(0);
  }
  if (d.readyState === "ERROR" || d.readyState === "CANCELED") {
    console.log("Deployment failed:", JSON.stringify(d.error || d));
    process.exit(1);
  }
}
console.log("Timed out waiting; check the Vercel dashboard.");
