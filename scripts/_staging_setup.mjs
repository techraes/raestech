import crypto from "node:crypto";
import { execSync } from "node:child_process";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "xisvlnruafmfnjtbwjin";
if (!token) {
  console.error("No SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}
const H = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
// url-safe password charset (no shell-meta chars)
const pw = crypto.randomBytes(16).toString("base64url");

(async () => {
  const r = await fetch("https://api.supabase.com/v1/projects/" + ref, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ name: "raes-staging", db_pass: pw }),
  });
  const j = await r.json();
  console.log("PATCH status", r.status, "name=", (j && j.name) || "?");
  if (r.status !== 200) process.exit(1);

  const env = { ...process.env, SUPABASE_ACCESS_TOKEN: token };

  try {
    console.log("\n[link]");
    execSync(`supabase link --project-ref ${ref} --password "${pw}"`, { env, stdio: "inherit", shell: true });
    console.log("\n[db push]");
    execSync(`supabase db push --project-ref ${ref} --yes`, { env, stdio: "inherit", shell: true });
    console.log("\nMIGRATIONS_OK");
  } catch (e) {
    console.log("\nSTEP_ERR:", e.message);
    process.exit(2);
  }
})();
