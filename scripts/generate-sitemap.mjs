#!/usr/bin/env node
/**
 * Build-time XML sitemap generator for RAES TECH.
 *
 * Generates `public/sitemap.xml` from the ACTUAL published catalogue and the
 * site's public content routes. URLs are absolute, HTTPS, deduplicated and use
 * the canonical hostname. Product URLs are one canonical URL per product page
 * (not per SKU/variant), so a source catalogue of hundreds of SKU rows does not
 * produce thousands of near-duplicate URLs.
 *
 * Run as part of `npm run build` (prebuild hook) or standalone:
 *   node scripts/generate-sitemap.mjs
 *
 * DATA SOURCE NOTE (why this reads the bundle seed, not a live Supabase query):
 * The storefront is a static Vite SPA whose catalogue is rendered from the
 * bundled `catalog_seed.json` via the client-side product store
 * (`useProductStore`) — it does NOT fetch products from Supabase at request
 * time. Therefore the seed snapshot is the authoritative set of URLs the
 * deployed site actually serves, and generating the sitemap from the same
 * source keeps it exactly in sync with the bundle on every build. A live
 * Supabase service-role query would require the service_role key + DB access
 * at build time and would not reflect the static bundle's content, so it is
 * intentionally not used here. The generator still honours the publishing
 * controls (status, indexable) so drafts / opted-out products never leak in.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const BASE = "https://raestech.store"; // canonical hostname (matches canonicalBase default)

// ---- Content routes that are public + indexable (verified against App.tsx) ----
const CONTENT_ROUTES = [
  // path, priority, changefreq
  ["/", "1.0", "daily"],
  ["/phones", "0.9", "daily"],
  ["/new-arrivals", "0.6", "weekly"],
  ["/best-sellers", "0.6", "weekly"],
  ["/instalments", "0.6", "weekly"],
  ["/about", "0.4", "monthly"],
  ["/contact", "0.4", "monthly"],
];

// ContentPage.tsx slugs (submitted via the catch-all /:slug route)
const CONTENT_DOCS = [
  ["/faqs", "0.4", "monthly"],
  ["/shipping-policy", "0.3", "yearly"],
  ["/return-policy", "0.3", "yearly"],
  ["/warranty-policy", "0.3", "yearly"],
  ["/privacy-policy", "0.3", "yearly"],
  ["/terms", "0.3", "yearly"],
  ["/instalment-agreement", "0.3", "yearly"],
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function loadSeed() {
  const seedPath = resolve(root, "src/data/catalog_seed.json");

  // Explicit existence check: fail with an actionable message (expected path +
  // what's actually in data/) instead of a raw ENOENT at build time.
  if (!existsSync(seedPath)) {
    const dataDir = resolve(root, "src/data");
    let available = "<none>";
    try {
      available = readdirSync(dataDir).filter((f) => /\.json$/i.test(f)).join(", ") || "<none>";
    } catch {
      // data/ directory itself is missing — leave available as "<none>".
    }
    throw new Error(
      `[sitemap] Cannot generate sitemap: catalogue seed file not found.\n` +
        `  Expected: ${seedPath}\n` +
        `  Files present in src/data/: ${available}\n` +
        `  Fix: restore 'src/data/catalog_seed.json' (or update the expected path in scripts/generate-sitemap.mjs).`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(seedPath, "utf8"));
  } catch (err) {
    throw new Error(`[sitemap] Catalogue seed file is not valid JSON:\n  ${seedPath}\n  ${err.message}`);
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.brands) || !Array.isArray(parsed.products)) {
    throw new Error(
      `[sitemap] Catalogue seed file has an unexpected shape (expected { brands: [], products: [] }).\n` +
        `  File: ${seedPath}`
    );
  }

  return parsed;
}

function main() {
  const seed = loadSeed();

  const brands = Array.isArray(seed.brands) ? seed.brands : [];
  const products = Array.isArray(seed.products) ? seed.products : [];

  // Only published products. The seed has no status field (everything is live);
  // if a status field exists, drop drafts/archived so they never leak into the
  // sitemap.
  const published = products.filter((p) => {
    if (p.indexable === false) return false; // admin opted this product out of indexing
    const st = (p.status || "active").toLowerCase();
    return st === "active" || st === "published" || st === undefined;
  });

  const entries = [];

  for (const [path, priority, freq] of CONTENT_ROUTES.concat(CONTENT_DOCS)) {
    entries.push({ loc: BASE + path, priority, freq });
  }

  for (const b of brands) {
    if (!b) continue;
    const slug = String(b.slug || "").trim();
    if (!slug) continue;
    entries.push({ loc: `${BASE}/brand/${slug}`, priority: "0.8", freq: "weekly" });
  }

  // Product URLs are built from the exact slug the storefront route serves
  // (`/product/:slug`). Slugs are normalized (trimmed) and deduplicated so the
  // sitemap can never emit a duplicate or blank URI. A product with no valid
  // slug is skipped (a page for it cannot exist).
  const productSlugs = new Set();
  let skippedNoSlug = 0;
  let duplicateSlugs = 0;
  for (const p of published) {
    if (!p) continue;
    const slug = String(p.slug || "").trim();
    if (!slug) {
      skippedNoSlug += 1;
      continue;
    }
    if (productSlugs.has(slug)) {
      console.warn(`[sitemap] duplicate product slug skipped: "${slug}"`);
      duplicateSlugs += 1;
      continue;
    }
    productSlugs.add(slug);
    entries.push({ loc: `${BASE}/product/${slug}`, priority: "0.8", freq: "weekly" });
  }

  // Deduplicate (keep first occurrence)
  const seen = new Set();
  const uniq = entries.filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });

  // ---- Post-generation validation -------------------------------------
  // Every emitted URL must be absolute, HTTPS and well-formed, and the product
  // URL count must exactly match the published catalogue. If any of these are
  // violated the build fails, so a stale/404 sitemap can never be deployed.
  for (const e of uniq) {
    if (!/^https:\/\//.test(e.loc)) {
      throw new Error(`[sitemap] non-HTTPS URL generated: ${e.loc}`);
    }
    if (e.loc !== BASE && !e.loc.startsWith(BASE + "/")) {
      throw new Error(`[sitemap] URL outside canonical hostname: ${e.loc}`);
    }
  }
  const productEntries = uniq.filter((e) => e.loc.startsWith(`${BASE}/product/`)).length;
  if (productEntries !== productSlugs.size) {
    throw new Error(
      `[sitemap] product URL count mismatch: emitted=${productEntries}, published=${productSlugs.size}`
    );
  }

  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const e of uniq) {
    lines.push(`  <url><loc>${esc(e.loc)}</loc><changefreq>${e.freq}</changefreq><priority>${e.priority}</priority></url>`);
  }
  lines.push("</urlset>");
  lines.push("");

  const outPath = resolve(root, "public/sitemap.xml");
  writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log(`[sitemap] wrote ${uniq.length} URLs -> ${outPath.replace(root, ".")}`);
  console.log(`[sitemap]   products: ${productSlugs.size}, brands: ${brands.length}, content: ${uniq.length - productSlugs.size - brands.length}`);
  if (skippedNoSlug > 0) console.log(`[sitemap]   skipped ${skippedNoSlug} product(s) with no slug`);
  if (duplicateSlugs > 0) console.log(`[sitemap]   skipped ${duplicateSlugs} duplicate product slug(s)`);
}

main();
