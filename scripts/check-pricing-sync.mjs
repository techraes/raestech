#!/usr/bin/env node
/**
 * Build-time check that client-side sale pricing matches the server-side
 * (Supabase) canonical definitions.
 *
 * The storefront renders prices using the shared rule in `src/lib/pricing.ts`.
 * The authoritative order pricing lives in Supabase `website_settings`
 * (seeded by migration 00019). This script asserts they stay in lockstep and
 * fails the build otherwise.
 *
 * Source of truth (highest to lowest priority):
 *   1. The LIVE Supabase database, read through the `public_settings` view
 *      (exposes `buy_now_discount_percent` and `instalment_discount_percent`),
 *      when Supabase is configured (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY,
 *      picked up from the environment or `.env.local` for local dev). This
 *      catches drift that the sealed migration cannot: e.g. a discount edited
 *      at runtime via Discount Management (which writes to the DB), so the
 *      client stays in lockstep with what the deployed server actually uses.
 *   2. The seeding migration `00019` as a fallback, used when Supabase is not
 *      configured (pure static/dev build). This is a best-effort proxy for the
 *      server defaults.
 *
 * Instead of regex-extracting constants from the TypeScript source (which
 * silently breaks if the file is refactored), this imports the real
 * `pricing.ts` module — Node's type-stripping removes the `import type`
 * statements, so the `@/types` alias is never resolved at runtime.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const MIGRATION_SQL = resolve(root, "supabase/migrations/00019_sale_pricing_accuracy.sql");

function fail(msg) {
  console.error(`[check-pricing-sync] FAIL: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Environment: prefer real process env, fall back to .env.local (local dev).
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const env = {};
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — fine */
  }
  return env;
}

const dot = loadDotEnv();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || dot.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || dot.VITE_SUPABASE_ANON_KEY || "";

// ---- Import the actual client pricing module (source of truth, side A) ----
let pricing;
try {
  pricing = await import(new URL("../src/lib/pricing.ts", import.meta.url));
} catch (e) {
  fail(`could not import src/lib/pricing.ts: ${e.message}`);
}

const tsPrepaid = pricing.saleDiscountPercent("prepaid");
const tsInstalment = pricing.saleDiscountPercent("instalments");

// ---------------------------------------------------------------------------
// Side B: authoritative server discount percents.
// ---------------------------------------------------------------------------
/**
 * Read the discount percents from the LIVE database via the `public_settings`
 * view. Returns null when Supabase is not configured or the read fails (we
 * then fall back to the migration).
 */
async function readLiveDiscounts() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from("public_settings")
      .select("key,value")
      .in("key", ["buy_now_discount_percent", "instalment_discount_percent"]);
    if (error) {
      console.warn(`[check-pricing-sync] live read failed (${error.message}); falling back to migration`);
      return null;
    }
    const map = {};
    for (const row of data || []) map[row.key] = row.value;
    const prepaid = Number(map.buy_now_discount_percent);
    const instalment = Number(map.instalment_discount_percent);
    if (!Number.isInteger(prepaid) || !Number.isInteger(instalment)) {
      console.warn("[check-pricing-sync] live read returned non-integer values; falling back to migration");
      return null;
    }
    return { prepaid, instalment, label: "live Supabase (public_settings)" };
  } catch (e) {
    console.warn(`[check-pricing-sync] live read threw (${e.message}); falling back to migration`);
    return null;
  }
}

/** Parse a `('key', 'NN', ...)` settings row out of the migration. */
function readSettingIntFromMigration(sql, key) {
  // Settings rows are inserted as ('key', 'value', 'type', 'group').
  const re = new RegExp(`\\('${key}',\\s*'(\\d+)'`);
  const m = sql.match(re);
  if (!m) fail(`could not find settings.${key} in migration 00019`);
  const v = Number(m[1]);
  if (!Number.isInteger(v)) fail(`settings.${key} is not an integer (got "${m[1]}")`);
  return v;
}

function readMigrationDiscounts() {
  let sql;
  try {
    sql = readFileSync(MIGRATION_SQL, "utf8");
  } catch (e) {
    fail(`could not read ${MIGRATION_SQL}: ${e.message}`);
  }
  return {
    prepaid: readSettingIntFromMigration(sql, "buy_now_discount_percent"),
    instalment: readSettingIntFromMigration(sql, "instalment_discount_percent"),
    label: "migration 00019 (fallback)",
  };
}

const live = await readLiveDiscounts();
const source = live || readMigrationDiscounts();

const srcPrepaid = source.prepaid;
const srcInstalment = source.instalment;

// ---- Compare ----
let ok = true;
const pairs = [
  ["prepaid", tsPrepaid, srcPrepaid],
  ["instalment", tsInstalment, srcInstalment],
];
for (const [key, ts, srcV] of pairs) {
  if (ts !== srcV) {
    ok = false;
    console.error(`[check-pricing-sync] MISMATCH ${key}: pricing.ts=${ts} vs ${source.label}=${srcV}`);
  } else {
    console.log(`[check-pricing-sync] ok: ${key} discount = ${ts}% (client == ${source.label})`);
  }
}

if (!ok) {
  fail(`client pricing constants must match the Supabase settings (source: ${source.label})`);
}

// ---- Semantic check: verify the discount is applied to the full list base ----
// Contract (11.11 launch): PKR 100,000 → 22% off = 78,000; 11% off = 89,000.
// If the discount percentages are intentionally changed, update the contract
// here AND in migration 00019 — the build fails on drift by design.
const BASE = 100000;
const expectPrepaid = pricing.discountedPrice(BASE, srcPrepaid);
const expectInstalment = pricing.discountedPrice(BASE, srcInstalment);
if (expectPrepaid !== 78000) {
  fail(`prepaid semantics drifted: 100k @ ${srcPrepaid}% -> ${expectPrepaid} (expected 78000)`);
}
if (expectInstalment !== 89000) {
  fail(`instalment semantics drifted: 100k @ ${srcInstalment}% -> ${expectInstalment} (expected 89000)`);
}
console.log(`[check-pricing-sync] ok: semantic spot-check passes (100k -> ${expectPrepaid} / ${expectInstalment})`);

console.log("[check-pricing-sync] PASS");
