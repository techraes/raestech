import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  applyVariantRecovery,
  normalizeOrderedItem,
  phoneSummary,
} = require("../src/lib/order-item-display.ts");

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.log("  ✗ FAIL:", msg); }
  else console.log("  ✓ pass:", msg);
}

// --- vmap built by the admin load() exactly as in AdminOrders.tsx ---
const vmap = new Map([
  ["var-iphone-15-pro", {
    sku: "IPH15PRO-NAT-256",
    storage: "256GB",
    ram: "8GB",
    ptaStatus: "PTA Approved",
    jvStatus: null,
    model: "iPhone 15 Pro",
    name: "Apple iPhone 15 Pro",
  }],
  ["var-galaxy-s24", {
    sku: "SMS24-PUR-256",
    storage: "256GB",
    ram: "8GB",
    ptaStatus: "PTA Approved",
    jvStatus: "JV / SIM-Locked",
    model: "Galaxy S24",
    name: "Samsung Galaxy S24",
  }],
]);

console.log("== 1. Reproduce the ORIGINAL bug (camelCase app item) ==");
// old code built the item with camelCase keys
const oldStyle = {
  productName: undefined, model: undefined, storage: undefined, ram: undefined,
  color: undefined, ptaStatus: undefined, jvStatus: undefined,
  sku: undefined, variantId: "var-iphone-15-pro", quantity: 1,
};
const recoveredOld = applyVariantRecovery(oldStyle, vmap);
const dispOld = normalizeOrderedItem(recoveredOld);
assert(dispOld.model === null, "old-style: model is null (bug) -> 'Not recorded'");
assert(dispOld.productName === null, "old-style: productName is null (bug)");
assert(dispOld.storage === null, "old-style: storage is null (bug)");
assert(phoneSummary([dispOld]) === "Phone", "old-style: summary falls back to 'Phone'");

console.log("\n== 2. Fixed app path (snake_case item + variant recovery) ==");
const appRow = {
  variant_id: "var-iphone-15-pro", sku: undefined, product_name: undefined,
  model: undefined, storage: undefined, ram: undefined,
  color: "Natural Titanium", pta_status: undefined, jv_status: undefined,
  quantity: 1,
};
const rec = applyVariantRecovery(appRow, vmap);
const disp = normalizeOrderedItem(rec, (sku) => undefined); // local catalog miss; rely on DB variant recovery
assert(disp.model === "iPhone 15 Pro", "recovered model = 'iPhone 15 Pro'");
assert(disp.productName === "Apple iPhone 15 Pro", "recovered productName");
assert(disp.storage === "256GB", "recovered storage = 256GB");
assert(disp.ram === "8GB", "recovered ram = 8GB");
assert(disp.ptaStatus === "PTA Approved", "recovered PTA status");
assert(disp.color === "Natural Titanium", "saved colour preserved");
assert(disp.sku === "IPH15PRO-NAT-256", "recovered SKU");
assert(disp.variantId === "var-iphone-15-pro", "variant id retained");

console.log("\n== 3. Partial history: colour missing -> 'Not recorded' only for colour ==");
const partialRow = { variant_id: "var-galaxy-s24", color: null, sku: undefined,
  product_name: undefined, model: undefined, storage: undefined,
  ram: undefined, pta_status: undefined, jv_status: undefined, quantity: 1 };
const dPartial = normalizeOrderedItem(applyVariantRecovery(partialRow, vmap));
assert(dPartial.model === "Galaxy S24", "model recovered");
assert(dPartial.storage === "256GB", "storage recovered");
assert(dPartial.jvStatus === "JV / SIM-Locked", "JV status recovered");
assert(dPartial.color === null, "colour stays null -> 'Not recorded'");
assert(phoneSummary([dPartial]) === "Samsung Galaxy S24 — Galaxy S24 · 256GB", "summary omits missing colour");

console.log("\n== 4. Genuinely unrecoverable: no variant ref / vmap miss ==");
const noVariant = { variant_id: undefined, color: undefined, sku: undefined,
  product_name: undefined, model: undefined, storage: undefined,
  ram: undefined, pta_status: undefined, jv_status: undefined, quantity: 1 };
const dNone = normalizeOrderedItem(applyVariantRecovery(noVariant, vmap));
assert(dNone.model === null, "no recovery -> 'Not recorded' (no invention)");
assert(dNone.storage === null, "storage 'Not recorded'");
assert(phoneSummary([dNone]) === "Phone", "summary 'Phone' when nothing recoverable");

console.log("\n== 5. SKU-led local-catalog recovery still works when variant_id missing ==");
const skuOnly = { variant_id: undefined, sku: "IPH15PRO-NAT-256", color: "Natural Titanium",
  product_name: undefined, model: undefined, storage: undefined,
  ram: undefined, pta_status: undefined, jv_status: undefined, quantity: 1 };
const dSku = normalizeOrderedItem(skuOnly, (sku) =>
  sku === "IPH15PRO-NAT-256"
    ? { product: { name: "Apple iPhone 15 Pro", model: "iPhone 15 Pro" },
        variant: { storage: "256GB", ram: "8GB", pta_status: "PTA Approved", notes: "" } }
    : undefined);
assert(dSku.model === "iPhone 15 Pro", "catalog SKU recovery model");
assert(dSku.storage === "256GB", "catalog SKU recovery storage");

console.log("\n" + (failures ? `RESULT: ${failures} FAILURE(S)` : "RESULT: ALL PASS"));
process.exit(failures ? 1 : 0);
