import { readFileSync, existsSync } from "node:fs";

const p = ".env.local";
if (!existsSync(p)) {
  console.log(".env.local MISSING");
  process.exit(0);
}

const s = readFileSync(p, "utf8");
const keys = {};
for (const line of s.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) keys[m[1]] = m[2].trim();
}

const want = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_DEV_ADMIN_EMAIL",
  "VITE_DEV_ADMIN_PASSWORD",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "SEND_EMAIL_SECRET",
];

for (const k of want) {
  if (k in keys) {
    console.log(`${k} = SET (len ${keys[k].length})`);
  } else {
    console.log(`${k} = NOT SET`);
  }
}
