// Offline verification of the "Ordered Mobile" recovery logic used in
// AdminOrders.tsx. Mirrors normalizeOrderedItem / jvDetected / getVariantBySku
// against the real catalog seed to prove:
//   1) snapshot fields win over catalogue-current values,
//   2) a stored SKU recovers missing storage/ram/model/pta/jv,
//   3) truly-missing fields are labeled "Not recorded" (never inferred).
import fs from "node:fs";

const seed = JSON.parse(fs.readFileSync(new URL("../src/data/catalog_seed.json", import.meta.url), "utf8"));

// ---- mirrors src/data/catalog.ts getVariantBySku ----
function getVariantBySku(sku) {
  for (const product of seed.products) {
    const variant = product.variants && product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

// ---- mirrors AdminOrders.tsx ----
function jvDetected(v) {
  return /jv|sim-locked|carrier-locked/i.test(`${v.pta_status ?? ""} ${v.notes ?? ""}`);
}
function nullOrUndef(v) {
  return v && String(v).trim() ? String(v) : null;
}
function normalizeOrderedItem(raw) {
  const base = {
    productName: nullOrUndef(raw.product_name),
    model: nullOrUndef(raw.model),
    storage: nullOrUndef(raw.storage),
    ram: nullOrUndef(raw.ram),
    color: nullOrUndef(raw.color),
    ptaStatus: nullOrUndef(raw.pta_status),
    jvStatus: nullOrUndef(raw.jv_status),
    sku: nullOrUndef(raw.sku),
    variantId: nullOrUndef(raw.variant_id),
  };
  if (raw.sku) {
    const found = getVariantBySku(raw.sku);
    if (found) {
      const { product, variant } = found;
      return {
        ...base,
        productName: base.productName || product.name,
        model: base.model || product.model || null,
        storage: base.storage || variant.storage || null,
        ram: base.ram || variant.ram || null,
        ptaStatus: base.ptaStatus || variant.pta_status || null,
        jvStatus: base.jvStatus || (jvDetected(variant) ? "JV / SIM-Locked" : null),
      };
    }
  }
  return base;
}

let failures = 0;
function assert(cond, label) {
  if (!cond) { failures++; console.log("  FAIL:", label); }
  else console.log("  ok:", label);
}

// Pick a real catalog variant for scenario B (recovery).
const sample = seed.products.flatMap((p) => (p.variants || []).map((v) => ({ product: p, variant: v })))
  .find((x) => x.variant.storage && x.variant.ram);
const realSku = sample.variant.sku;

console.log("\n[Scenario A] historical/older order — only model stored, no SKU, no other snapshot");
const a = normalizeOrderedItem({ model: sample.product.model, sku: null, storage: null, ram: null, color: null, pta_status: null, jv_status: null, product_name: null });
console.log("   ->", JSON.stringify(a));
assert(a.model === sample.product.model, "model shown from stored value");
assert(a.storage === null && a.ram === null && a.color === null, "missing colour/storage/ram are null (rendered 'Not recorded')");
assert(a.productName === null, "no product name invented");

console.log("\n[Scenario B] historical order with a stored SKU, no snapshot fields (recovery)");
const b = normalizeOrderedItem({ sku: realSku, model: null, storage: null, ram: null, color: null, pta_status: null, jv_status: null, product_name: null });
console.log("   ->", JSON.stringify(b));
assert(b.model === sample.product.model, "model recovered from stored variant reference");
assert(b.storage === sample.variant.storage, "storage recovered from stored variant reference");
assert(b.ram === sample.variant.ram, "ram recovered from stored variant reference");
assert(b.ptaStatus === sample.variant.pta_status, "PTA status recovered");
assert(b.productName === sample.product.name, "product name recovered");

console.log("\n[Scenario C] new order with full snapshot — snapshot must win over catalogue-current values");
const diverged = normalizeOrderedItem({
  sku: realSku,
  model: "iPhone 12 mini",       // snapshot (order-time)
  storage: "128GB",              // order-time value that now differs from catalog
  ram: "4GB",
  color: "Blue",
  pta_status: "PTA Approved (verify IMEI on PTA DIRBS)",
  jv_status: null,
  product_name: "Apple iPhone 12 mini",
});
console.log("   ->", JSON.stringify(diverged));
assert(diverged.storage === "128GB", "order-time storage preserved even though catalog now differs");
assert(diverged.color === "Blue", "colour preserved");

console.log("\n[Scenario D] recovery must NOT invent fields when SKU is unknown");
const d = normalizeOrderedItem({ sku: "SKU-NOT-EXIST", model: null, storage: null, ram: null, color: null, pta_status: null, jv_status: null, product_name: null });
console.log("   ->", JSON.stringify(d));
assert(d.storage === null && d.ram === null && d.color === null && d.ptaStatus === null, "unknown SKU -> all optional fields stay null");

console.log("\n" + (failures ? `${failures} FAILURE(S)` : "ALL RECOVERY CHECKS PASSED"));
process.exit(failures ? 1 : 0);
