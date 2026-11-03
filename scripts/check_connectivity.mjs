import { readFileSync, existsSync } from "node:fs";

const targets = [
  { name: "local-supabase-rest", url: "http://127.0.0.1:54321/rest/v1/" },
];

// Report whether env vars are present (without printing values)
const p = ".env.local";
if (existsSync(p)) {
  const s = readFileSync(p, "utf8");
  const has = (k) => new RegExp(`^\\s*${k}\\s*=`).test(s);
  console.log("ENV: VITE_SUPABASE_URL set:", has("VITE_SUPABASE_URL"));
  console.log("ENV: VITE_SUPABASE_ANON_KEY set:", has("VITE_SUPABASE_ANON_KEY"));
}

const timer = setTimeout(() => {
  console.log("RESULT: global timeout after 5s");
  process.exit(1);
}, 5000);

for (const t of targets) {
  try {
    const res = await fetch(t.url, { signal: AbortSignal.timeout(4000) });
    console.log(`${t.name}: HTTP ${res.status}`);
  } catch (e) {
    console.log(
      `${t.name}: FAILED -> ${e.cause ? e.cause.code : e.name}: ${e.message}`
    );
  }
}
clearTimeout(timer);
