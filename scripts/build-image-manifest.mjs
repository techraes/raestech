#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const report = JSON.parse(readFileSync(join(ROOT, "data/reports/image-import-dryrun.json"), "utf8"));

const models = report.models.map((m) => ({
  slug: m.slug,
  brand: m.brand,
  model: m.model,
  matched: m.matched,
  skuRows: m.catalogueSkuRows,
  gallery: m.assets.some((a) => a.kind === "gallery_original"),
  white: m.assets.some((a) => a.sub === "white"),
  dark: m.assets.some((a) => a.sub === "dark"),
}));

const out = {
  totals: report.totals,
  matching: report.matching,
  models,
};

writeFileSync(
  join(ROOT, "src/data/image-matching-manifest.json"),
  JSON.stringify(out, null, 2)
);

console.log("models", models.length,
  "gallery", models.filter((m) => m.gallery).length,
  "onlyConcept", models.filter((m) => !m.gallery).length,
  "unmatched", models.filter((m) => !m.matched).length);
