import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join, basename, extname } from "node:path";

const ROOT = process.cwd();
const SEED_PATH = join(ROOT, "src/data/catalog_seed.json");
const PACK_ROOT = join(ROOT, "data/image-import-pack");
const CSV_PATH = join(
  PACK_ROOT,
  "manifest/RAES_TECH_125_MODEL_ASSET_MANIFEST.csv"
);
const PUBLIC_PRODUCTS = join(ROOT, "public/images/products");

// ---- minimal CSV parser (handles quoted fields) ----
function splitCSV(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else q = false;
      } else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const csvText = readFileSync(CSV_PATH, "utf8").replace(/\r/g, "");
const lines = csvText.split("\n").filter(Boolean);
const header = splitCSV(lines[0]);
const rows = lines.slice(1).map((ln) => {
  const c = splitCSV(ln);
  const o = {};
  header.forEach((h, i) => (o[h] = c[i] ?? ""));
  return o;
});

// Ordered candidate source columns (most-preferred first).
const SOURCE_COLUMNS = [
  "gallery_original_jpg_path_in_zip",
  "preview_white_webp_path_in_zip",
  "preview_dark_webp_path_in_zip",
];

function pickSource(slug) {
  const row = rows.find((r) => r.product_slug === slug);
  if (!row) return null;
  for (const col of SOURCE_COLUMNS) {
    const rel = row[col];
    if (!rel) continue;
    const full = join(PACK_ROOT, rel);
    if (existsSync(full)) return { src: full, rel };
  }
  return null;
}

const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const items = Array.isArray(seed) ? seed : seed.products || seed.catalog || [];
const missing = items.filter((p) => !p.image);

mkdirSync(PUBLIC_PRODUCTS, { recursive: true });

const applied = [];
const skipped = [];

for (const p of missing) {
  const src = pickSource(p.slug);
  if (!src) { skipped.push({ slug: p.slug, reason: "no source asset on disk" }); continue; }
  const ext = extname(src.src).toLowerCase() || ".jpg";
  const destName = `${p.slug}${ext}`;
  const dest = join(PUBLIC_PRODUCTS, destName);
  copyFileSync(src.src, dest);
  p.image = destName;
  applied.push({ slug: p.slug, from: src.rel, to: destName });
}

writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));
console.log(`applied images: ${applied.length}`);
console.log(`skipped (no source): ${skipped.length}`);
for (const s of skipped) console.log("  skipped:", s.slug, "-", s.reason);
console.log("seed updated -> src/data/catalog_seed.json");
