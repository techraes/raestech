import XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const XLSX_PATH = "data/catalog/RaesTech_Pakistan_Mobile_Market_Catalog_2026-11-02_KIT.xlsx";
const OUT = "src/data/catalog_seed.json";
const IMAGES_DIR = "public/images/products";

const wb = XLSX.readFile(XLSX_PATH);
if (!wb.Sheets["Product Catalog"]) throw new Error("Missing 'Product Catalog' sheet");
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Product Catalog"], { defval: null });

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function toNum(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

function str(v) {
  return v == null ? "" : String(v).trim();
}

const JV_NOTE = "Carrier-locked; works with interposer/SIM-time. PTA registration does not remove the lock.";

function conditionLabel(boxPackRaw) {
  const b = boxPackRaw.toLowerCase();
  if ((b.includes("box pack") || b.includes("box-pack") || b.includes("sealed")) && !b.includes("kit")) return "New Box Packed";
  if (b.includes("kit")) return "Kit - phone only, no box";
  if (b.includes("used")) return "Used";
  return str(boxPackRaw).slice(0, 40) || "Condition — verify";
}

function statusToken(ptaRaw, notes) {
  const c = `${ptaRaw} ${notes}`.toLowerCase();
  if (/jv|sim-locked|carrier-locked|sim locked/.test(c)) return "jv";
  if (/(non-pta|non pta|not pta|unregistered)/.test(c)) return "nonpta";
  if (/pta approved|pta tax paid|pta registered|official pta/.test(c)) return "pta";
  return "unknown";
}

const seenSku = new Set();
const seenKey = new Set();
const from = new Map(); // brand -> model -> product buffer

for (const r of rows) {
  const sku = str(r["SKU"]);
  if (!sku) continue;
  if (seenSku.has(sku)) throw new Error("Duplicate SKU in source: " + sku);
  seenSku.add(sku);

  const brand = str(r["Brand"]);
  const model = str(r["Model"]);
  if (!brand || !model) throw new Error("Missing brand/model for " + sku);

  const listed = toNum(r["Market Reference Price (PKR)"]);
  const buyNow = toNum(r["RaesTech Buy Now Price (10% OFF) PKR"]);
  const instTotal = toNum(r["12-Month Installment Total (No Discount / 0% Markup) PKR"]);
  const monthly = toNum(r["Illustrative Monthly Amount (Total ÷ 12) PKR"]);

  const storage = str(r["Storage"]);
  const ptaRaw = str(r["PTA / Registration Status"]);
  const boxRaw = str(r["Box-Pack Availability"]);
  const notesBuyer = str(r["Notes"]);
  const stockVerified = str(r["Supplier Stock / IMEI Verification Required"]).toUpperCase() === "YES";
  const isJV = statusToken(ptaRaw, "") === "jv";
  const notes = isJV ? (notesBuyer ? notesBuyer + " " + JV_NOTE : JV_NOTE) : notesBuyer;

  const key = `${storage}::${ptaRaw}`;
  const groupKey = `${brand}::${model}`;
  if (seenKey.has(key + "::" + groupKey)) console.warn("WARN duplicate variant key", groupKey, key, sku);
  seenKey.add(key + "::" + groupKey);

  const variant = {
    sku,
    storage,
    ram: str(r["RAM"]),
    colors: str(r["Official Colour Options (verify regional SKU)"]).split(/[;/]/).map((s) => s.trim()).filter(Boolean),
    display: str(r["Display"]),
    chipset: str(r["Chipset"]),
    rear_camera: str(r["Rear Camera"]),
    front_camera: str(r["Front Camera"]),
    battery: str(r["Battery"]),
    network: str(r["Network"]),
    pta_status: ptaRaw,
    condition: conditionLabel(boxRaw),
    box_pack: boxRaw,
    listedPrice: listed,
    buyNowPrice: buyNow,
    instalmentTotal: instTotal,
    monthly,
    priceEvidence: str(r["Price Evidence"]),
    confidence: str(r["Confidence"]),
    sourceUrl: str(r["Source URL"]),
    priceCheckedDate: str(r["Price Checked Date"]),
    requiresVerification: !stockVerified,
    notes,
    stock: stockVerified ? 1 : 0,
  };
  if (listed == null && buyNow == null) throw new Error("Empty price on " + sku);

  if (!from.has(groupKey)) from.set(groupKey, { brand, model, variants: [] });
  from.get(groupKey).variants.push(variant);
}

// Existing on-disk product images: /images/products/<slug>.jpg
const diskImages = new Set(fs.readdirSync(IMAGES_DIR));

// Optional Image Manifest sheet -> map model -> filename (used when present).
const manifestByModel = {};
if (wb.Sheets["Image Manifest"]) {
  for (const mr of XLSX.utils.sheet_to_json(wb.Sheets["Image Manifest"], { defval: null })) {
    const file = mr.file || mr.Filename || mr.filename;
    const model = mr.model || mr.Model;
    if (file && model) manifestByModel[String(model).toLowerCase()] = String(file);
  }
}

function resolveImage(slug, model) {
  const fromManifest = manifestByModel[model.toLowerCase()];
  for (const f of [fromManifest, `${slug}.jpg`]) {
    if (f && diskImages.has(f)) return f;
  }
  return undefined; // missing -> frontend shows neutral placeholder
}

const products = [];
const brandSet = new Map();
for (const [groupKey, buf] of from) {
  const slug = `${slugify(buf.brand)}-${slugify(buf.model)}`;
  const buyNowPrices = buf.variants.map((v) => v.buyNowPrice).filter((n) => n != null && Number.isFinite(n));
  const listedPricesOnly = buf.variants.map((v) => v.listedPrice).filter((n) => n != null && Number.isFinite(n));
  const minBuyNow = buyNowPrices.length ? Math.min(...buyNowPrices)
    : listedPricesOnly.length ? Math.min(...listedPricesOnly) : 0;
  const hasPta = buf.variants.some((v) => v.pta_status.toLowerCase().includes("pta approved"));
  const p = {
    id: products.length + 1,
    slug,
    brand: buf.brand,
    model: buf.model,
    name: `${buf.brand} ${buf.model}`,
    description: `${buf.brand} ${buf.model} — ${buf.variants[0].network}, ${buf.variants[0].display}, ${buf.variants[0].chipset}. Pricing shown includes PTA / SIM-lock variants where available.`,
    category: "smartphone",
    seo_title: `${buf.brand} ${buf.model} Price in Pakistan | RAES TECH`,
    seo_description: `${buf.brand} ${buf.model} from Rs ${minBuyNow.toLocaleString("en-PK")}. Buy Now or interest-free instalments, nationwide delivery.`,
    featured: false,
    new_arrival: false,
    bestseller: false,
    image: resolveImage(slug, buf.model),
    variants: buf.variants,
  };
  products.push(p);
  if (!brandSet.has(buf.brand)) brandSet.set(buf.brand, slugify(buf.brand));
}

const brands = [...brandSet].map(([name, slug]) => ({ name, slug }));

const out = { brands, products };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

// ---- Validation report ----
const files = new Set(fs.readdirSync(IMAGES_DIR));
const missingImages = [];
for (const p of products) if (!files.has(p.image)) missingImages.push({ slug: p.slug, image: p.image });

let dupSku = 0;
const skuSet = new Set();
for (const p of products) for (const v of p.variants) {
  if (skuSet.has(v.sku)) dupSku++;
  skuSet.add(v.sku);
}
let emptyPrice = 0;
for (const p of products) for (const v of p.variants) {
  if (v.listedPrice == null && v.buyNowPrice == null) emptyPrice++;
}

console.log("==== REPORT ====");
console.log("Total source SKUs (rows):", seenSku.size);
console.log("Total product cards (Brand+Model):", products.length);
console.log("Total variants:", skuSet.size);
console.log("Duplicate SKUs:", dupSku);
console.log("Variants with empty price:", emptyPrice);
console.log("Brands:", brands.length);
console.log("Missing image files:", missingImages.length);
for (const m of missingImages.slice(0, 200)) console.log("  MISSING IMG", m.slug, m.image);
