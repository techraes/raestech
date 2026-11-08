import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnvFile(".env.local");
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log("URL host:", url ? new URL(url).host : "(none)");
console.log("anon key present:", Boolean(key), "len", key ? key.length : 0);

if (!url || !key) {
  console.log("SUPABASE_NOT_CONFIGURED");
  process.exit(0);
}

const sb = createClient(url, key);

const res = await sb.from("public_settings").select("key").limit(5);
if (res.error) {
  console.log("public_settings read: ERR", res.error.message);
} else {
  console.log("public_settings read: OK n=" + res.data.length);
}

// Also confirm auth endpoints respond (no secrets involved).
const health = await fetch(url + "/auth/v1/health");
console.log("auth /health:", health.status);
