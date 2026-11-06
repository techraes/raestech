#!/usr/bin/env node
/**
 * RAES TECH — Image import dry-run engine.
 *
 * Reads the master pack manifests and matches the 125 model / 445 SKU image
 * assets against the existing catalogue seed WITHOUT writing anything to
 * Supabase. Produces a report of:
 *   - matched products / SKUs (no duplicate products created);
 *   - assets to stage (gallery originals vs preview-only concepts);
 *   - duplicates detected by SHA-256;
 *   - unmatched models / SKUs.
 *
 * The same script drives the real import: with `--commit` it writes the
 * staged asset manifest (JSON) that the admin import page consumes, and calls
 * the Supabase RPC / storage only when configured. By default it is a pure
 * dry run (safe).
 *
 * Usage:
 *   node scripts/image-import-dryrun.mjs [--commit] [--out data/reports/...]
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PACK = join(ROOT, "data", "image-import-pack");
const MANIFEST_MODEL = join(PACK, "manifest", "RAES_TECH_125_MODEL_ASSET_MANIFEST.csv");
const MANIFEST_SKU = join(PACK, "manifest", "RAES_TECH_445_SKU_IMAGE_MAPPING.csv");
const SEED = join(ROOT, "src", "data", "catalog_seed.json");

const COMMIT = process.argv.includes("--commit");
const OUT_INDEX = process.argv.indexOf("--out");
const OUT = OUT_INDEX >= 0 ? process.argv[OUT_INDEX + 1] : join(ROOT, "data", "reports", "image-import-dryrun.json");

/** Parse a UTF-8 (BOM-tolerant) CSV into objects. */
function parseCsv(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((l) => {
    // Minimal CSV field split: handles quoted fields containing commas.
    const fields = [];
    let cur = "";
    let inQ = false;
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { fields.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    fields.push(cur.trim());
    const row = {};
    header.forEach((h, i) => { row[h] = fields[i] ?? ""; });
    return row;
  });
}

function sha256(filePath) {
  if (!existsSync(filePath)) return null;
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

/** Stable mapped asset key (idempotency across re-imports). */
function assetKey(row, kind, subKind) {
  const p = row.product_slug || "";
  const b = row.brand || "";
  const m = row.model || "";
  const s = row.sku || "";
  return [b, m, p, s, kind, subKind].join("|").toLowerCase();
}

function main() {
  const modelRows = parseCsv(MANIFEST_MODEL);
  const skuRows = parseCsv(MANIFEST_SKU);
  const seed = JSON.parse(readFileSync(SEED, "utf8"));

  // Index catalogue seed by slug and SKU; detect duplicate slugs/SKUs.
  const productsBySlug = new Map();
  const skus = new Map();
  const seenSlugs = new Map();
  const seenSkus = new Map();
  for (const p of seed.products) {
    const slug = (p.slug || "").trim().toLowerCase();
    if (!productsBySlug.has(slug)) productsBySlug.set(slug, p);
    seenSlugs.set(slug, (seenSlugs.get(slug) || 0) + 1);
    for (const v of p.variants || []) {
      const sku = (v.sku || "").trim().toUpperCase();
      if (!skus.has(sku)) skus.set(sku, { product: p, variant: v });
      seenSkus.set(sku, (seenSkus.get(sku) || 0) + 1);
    }
  }

  // ---- Model-level matching ----
  const models = [];
  let modelMatched = 0;
  let modelUnmatched = 0;
  for (const r of modelRows) {
    const slug = (r.product_slug || "").trim().toLowerCase();
    const product = productsBySlug.get(slug);
    const kind = r.source_gallery_status && r.source_gallery_status.includes("EXISTING")
      ? "gallery_original" : "concept_preview";
    const galleryJpg = r.gallery_original_jpg_path_in_zip
      ? join(PACK, r.gallery_original_jpg_path_in_zip) : null;
    const white = r.preview_white_webp_path_in_zip
      ? join(PACK, r.preview_white_webp_path_in_zip) : null;
    const dark = r.preview_dark_webp_path_in_zip
      ? join(PACK, r.preview_dark_webp_path_in_zip) : null;

    const assets = [
      galleryJpg && { kind: "gallery_original", sub: "gallery", path: galleryJpg },
      white && { kind: "concept_preview", sub: "white", path: white },
      dark && { kind: "concept_preview", sub: "dark", path: dark },
    ].filter(Boolean).map((a) => ({
      ...a,
      sha: sha256(a.path),
      key: assetKey(r, a.kind, a.sub),
    }));

    if (product) modelMatched++; else modelUnmatched++;

    models.push({ slug, brand: r.brand, model: r.model, matched: Boolean(product),
      catalogueSkuRows: Number(r.catalogue_sku_rows || 0), kind, assets });
  }

  // ---- SKU-level matching ----
  const skuResults = [];
  let skuMatched = 0, skuUnmatched = 0, skuDup = 0;
  const seenAssetKeys = new Set();
  for (const r of skuRows) {
    const sku = (r.sku || "").trim().toUpperCase();
    const hit = skus.get(sku);
    const matched = Boolean(hit);
    if (matched) skuMatched++; else skuUnmatched++;

    // Collect the unique asset (gallery original if present, else concept as preview).
    const gallery = r.gallery_original_jpg_path_in_zip
      ? join(PACK, r.gallery_original_jpg_path_in_zip) : null;
    const white = r.concept_white_preview_path_in_zip
      ? join(PACK, r.concept_white_preview_path_in_zip) : null;
    const dark = r.concept_dark_preview_path_in_zip
      ? join(PACK, r.concept_dark_preview_path_in_zip) : null;

    const kinds = [
      gallery && { kind: "gallery_original", sub: "gallery", path: gallery },
      white && { kind: "concept_preview", sub: "white", path: white },
      dark && { kind: "concept_preview", sub: "dark", path: dark },
    ].filter(Boolean);

    let dup = false;
    const assets = kinds.map((a) => {
      const key = assetKey(r, a.kind, a.sub);
      if (seenAssetKeys.has(key)) dup = true;
      seenAssetKeys.add(key);
      return { ...a, sha: sha256(a.path), key };
    });
    if (dup) skuDup++;

    skuResults.push({ sku, brand: r.brand, model: r.model, slug: r.product_slug,
      storage: r.storage, colour: r.primary_colour_catalogue_summary,
      registration: r.registration_status, matched, assets });
  }

  // ---- Global asset tally (unique by sha) ----
  const shaToAsset = new Map();
  for (const m of models) for (const a of m.assets) {
    if (a.sha && !shaToAsset.has(a.sha)) shaToAsset.set(a.sha, a);
  }
  const allAssets = [...shaToAsset.values()];
  const galleryOriginalCount = allAssets.filter((a) => a.kind === "gallery_original").length;
  const conceptPreviewCount = allAssets.filter((a) => a.kind === "concept_preview").length;

  const report = {
    dryRun: !COMMIT,
    generatedAt: new Date().toISOString(),
    sources: {
      modelManifest: MANIFEST_MODEL,
      skuManifest: MANIFEST_SKU,
      seed: SEED,
    },
    totals: {
      modelsInManifest: modelRows.length,
      skusInManifest: skuRows.length,
      galleryOriginalsUnique: galleryOriginalCount,
      conceptPreviewUnique: conceptPreviewCount,
      assetsTotalUnique: allAssets.length,
    },
    matching: {
      modelsMatched: modelMatched,
      modelsUnmatched: modelUnmatched,
      skusMatched: skuMatched,
      skusUnmatched: skuUnmatched,
      skusWithDuplicateAssetRefs: skuDup,
      duplicateSeedSlugs: [...seenSlugs.values()].filter((n) => n > 1).length,
      duplicateSeedSkus: [...seenSkus.values()].filter((n) => n > 1).length,
    },
    unmatchedModels: models.filter((m) => !m.matched).map((m) => m.slug),
    unmatchedSkus: skuResults.filter((s) => !s.matched).map((s) => s.sku),
    summary:
      `${galleryOriginalCount} unique gallery originals + ${conceptPreviewCount} preview-only concepts ` +
      `matched against ${modelMatched}/${modelRows.length} models and ${skuMatched}/${skuRows.length} SKUs (no products created).`,
    models,
    skus: skuResults,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(report.summary);
  console.log(`Report written -> ${OUT}`);
  if (COMMIT) console.log("Note: --commit only writes the manifest locally; no Supabase writes occurred.");
}

main();
