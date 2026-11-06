import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const file = resolve(root, "docs/deployment.md");

let text = readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);

const curlTarget = "> curl -X POST https://<ref>.functions.supabase.co/create-admin \\";
const idx = lines.findIndex((l) => l === curlTarget);

if (idx === -1) {
  console.error("[edit-docs] curl anchor not found; no change.");
  process.exit(0);
}

const insertBefore = [
  "> supabase functions deploy create-admin",
  "> npm run provision:admin -- tech.raes@gmail.com 'STRONG_PASSWORD'",
  "> ```",
  "> Requires `SUPABASE_PROJECT_REF` and `ADMIN_SEED_SECRET` env vars (or call the",
  "> function directly with curl):",
  "> ```bash",
];

// Replace the password placeholder inside the curl -d payload.
const oldPayload = '-d \'{"email":"tech.raes@gmail.com","password":"***"}\'';
const newPayload = '-d \'{"email":"tech.raes@gmail.com","password":"STRONG_PASSWORD"}\'';

lines.forEach((l, i) => {
  if (l.includes(oldPayload)) lines[i] = l.replace(oldPayload, newPayload);
});

lines.splice(idx, 0, ...insertBefore);

writeFileSync(file, lines.join("\n") + "\n", "utf8");
console.log("[edit-docs] updated docs/deployment.md");
