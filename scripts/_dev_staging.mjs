import { spawn } from "node:child_process";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "xisvlnruafmfnjtbwjin";
if (!token) {
  console.error("No SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
  headers: { Authorization: "Bearer " + token },
});
const j = await r.json();
const anon = (j || []).find((k) => k.name === "anon")?.api_key;
if (!anon) {
  console.error("no anon key");
  process.exit(1);
}

process.env.VITE_SUPABASE_URL = `https://${ref}.supabase.co`;
process.env.VITE_SUPABASE_ANON_KEY = anon;

const child = spawn("npm", ["run", "dev", "--", "--port", "5173", "--strictPort"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 0));
