#!/usr/bin/env node
// RAES TECH — provision / elevate the primary admin (Super Admin).
//
// Thin client for the `create-admin` Supabase Edge Function. It is an
// out-of-band, SERVER-SIDE operation: the app client can never create an Auth
// user (that would require the service-role key, which must never ship to the
// browser). Run this from a trusted machine after deploying the function:
//
//   npm run provision:admin -- <email> <password>
//
// Env required:
//   SUPABASE_PROJECT_REF  e.g. otvfosijrectvlwqqoll   (or SUPABASE_ADMIN_FUNCTION_URL)
//   ADMIN_SEED_SECRET     the same secret configured on the create-admin function
//
// Example:
//   set ADMIN_SEED_SECRET=... 
//   npm run provision:admin -- tech.raes@gmail.com 'STRONG_PASSWORD'

const projectRef = process.env.SUPABASE_PROJECT_REF || "";
const functionUrl = process.env.SUPABASE_ADMIN_FUNCTION_URL || (projectRef ? `https://${projectRef}.functions.supabase.co/create-admin` : "");
const secret = process.env.ADMIN_SEED_SECRET || "";

const [email = "", password = ""] = process.argv.slice(2);

function fail(msg) {
  console.error(`[provision-admin] ${msg}`);
  console.error(
    "\nUsage: npm run provision:admin -- <email> <password>\n" +
    "Env: SUPABASE_PROJECT_REF (or SUPABASE_ADMIN_FUNCTION_URL) and ADMIN_SEED_SECRET."
  );
  process.exit(1);
}

if (!functionUrl) fail("SUPABASE_PROJECT_REF (or SUPABASE_ADMIN_FUNCTION_URL) is not set.");
if (!secret) fail("ADMIN_SEED_SECRET is not set.");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("A valid admin email is required.");
if (password.length < 8) fail("Password must be at least 8 characters.");

const res = await fetch(functionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${secret}`,
  },
  body: JSON.stringify({ email: email.toLowerCase(), password }),
});

const text = await res.text();
let data = {};
try {
  data = JSON.parse(text);
} catch {
  /* non-JSON response */
}

if (!res.ok) {
  console.error(`[provision-admin] Failed (HTTP ${res.status}): ${data.error || text}`);
  process.exit(1);
}

console.log(`[provision-admin] OK — ${data.email} is now ${data.role}. Sign in at /login and visit /admin.`);
