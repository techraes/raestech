// ============================================================
// bootstrap_staging.mjs
// Prepare an ISOLATED staging Supabase project for the payment-fix E2E.
//
// SAFETY GUARDS (hard requirements, enforced before any action):
//   * The target URL MUST be exactly `https://<ref>.supabase.co`. Anything else
//     (forged hostnames, non-supabase hosts, proxies) is rejected.
//   * The ref MUST NOT be the production project (`otvfosijrectvlwqqoll`).
//   * The anon key MUST authenticate against the URL's project (read-only check
//     on `public_settings`). If it belongs to another project, we refuse.
//   * If a service-role key is provided, it MUST authenticate against the SAME
//     project URL (read-only `listUsers` check). Because a production service
//     key fails against a staging URL, this prevents cross-project misuse.
//   * Credentials are read ONLY from the environment / .env.staging. Nothing is
//     hard-coded, and no key material is ever printed.
//
// USAGE
//   node scripts/bootstrap_staging.mjs
//   # .env.staging provides:
//   #   VITE_SUPABASE_URL=https://<ref>.supabase.co
//   #   VITE_SUPABASE_ANON_KEY=…            (public anon key)
//   #   SUPABASE_SERVICE_ROLE_KEY=…         (optional: to auto-create users)
//   #   STAGING_CUSTOMER1_EMAIL / _PASSWORD
//   #   STAGING_CUSTOMER2_EMAIL / _PASSWORD
//   #   STAGING_ADMIN_EMAIL / _PASSWORD
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "otvfosijrectvlwqqoll";
const SUPABASE_URL_RE = /^https:\/\/([\w-]+)\.supabase\.co$/;

function loadEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function fatal(msg) {
  console.error("REFUSED:", msg);
  process.exit(1);
}

const env = loadEnvFile(".env.staging");
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

// ---- 1. Strict URL + ref validation ----
if (!url) fatal("VITE_SUPABASE_URL is missing in .env.staging.");
const m = SUPABASE_URL_RE.exec(url);
if (!m) fatal("VITE_SUPABASE_URL must be exactly https://<ref>.supabase.co (no paths/ports/forged hosts).");
const ref = m[1];
if (ref === PRODUCTION_REF) fatal("refused: the production project ref was supplied as the target.");

console.log("Target staging ref:", ref);
console.log("Service-role provisioning:", serviceRole ? "enabled" : "disabled (create users via dashboard/signup)");

// ---- 2. Verify the anon key belongs to THIS project (read-only) ----
const anonClient = createClient(url, anon);
const probe = await anonClient.from("public_settings").select("key").limit(1);
if (probe.error) {
  fatal("the anon key does not authenticate against this project URL (check it belongs to ref '" + ref + "').");
}

// ---- 3. If a service-role key is present, verify it belongs to THIS same
//         project (read-only). A production service key fails here, so it can
//         never be used against a staging URL. ----
let adminClient = null;
if (serviceRole) {
  adminClient = createClient(url, serviceRole);
  const check = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (check.error) {
    fatal("SUPABASE_SERVICE_ROLE_KEY is not valid for this project (it does not authenticate against ref '" + ref + "'). Refusing to continue.");
  }
}

// ---- 4. Test-account credentials come only from the environment ----
function requirePair(prefix) {
  const email = process.env[prefix + "_EMAIL"] || env[prefix + "_EMAIL"];
  const password = process.env[prefix + "_PASSWORD"] || env[prefix + "_PASSWORD"];
  return { email, password };
}

const customer1 = requirePair("STAGING_CUSTOMER1");
const customer2 = requirePair("STAGING_CUSTOMER2");
const admin = requirePair("STAGING_ADMIN");

async function createUser(client, { email, password, fullName, role }) {
  if (!email || !password) return "skipped (set STAGING_*_EMAIL/_PASSWORD)";
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
    app_metadata: role ? { role } : undefined,
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) return "already exists";
    return "ERR: " + error.message;
  }
  const userId = data?.user?.id;
  if (userId && role) {
    const { error: up } = await client.from("profiles").upsert({ id: userId, full_name: fullName || null, role });
    if (up) return "created but role upsert ERR: " + up.message;
  }
  return "created (id " + (userId || "?") + ")";
}

if (!adminClient) {
  console.log("SKIP user creation: no SUPABASE_SERVICE_ROLE_KEY. Create users in the Supabase dashboard (Authentication > Users) or via signup.");
} else {
  console.log("\n[1] Create test accounts");
  console.log("  customer1:", await createUser(adminClient, { ...customer1, fullName: "Test Customer One" }));
  console.log("  customer2:", await createUser(adminClient, { ...customer2, fullName: "Test Customer Two" }));
  console.log("  admin:", await createUser(adminClient, { ...admin, fullName: "Test Admin", role: "super_admin" }));
}

console.log("\n[2] QR config — manual step");
console.log("  In Admin > Payments, enable Faysal Bank and upload a TEST QR image (stored as a data URL in payment_methods settings).");

console.log("\n[3] Next steps to finish the E2E:");
console.log("  - Point the app's VITE env at this staging URL and run migrations (`supabase db push`).");
console.log("  - Run scripts/inspect_payment_duplicates.sql (read-only) first during rollout review.");
console.log("  - Then execute: Buy Now receipt -> My Orders -> Admin > Orders; instalment UUID flow + QR + advance; approval/rejection; second-customer denial.");

console.log("\nDone (bootstrap). No production data was read or written, and no secret was printed.");
