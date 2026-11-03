import fs from "node:fs";
const seed = JSON.parse(fs.readFileSync("src/data/catalog_seed.json", "utf8"));

let skus = 0, variants = 0;
const seenSku = new Set();
let dup = 0, emptyPrice = 0, nullBn = 0, nullInst = 0, nullMonthly = 0, nullListed = 0;

for (const p of seed.products) {
  for (const v of p.variants) {
    variants++;
    skus++;
    if (seenSku.has(v.sku)) dup++;
    seenSku.add(v.sku);
    if (v.listedPrice == null) nullListed++;
    if (v.buyNowPrice == null) nullBn++;
    if (v.instalmentTotal == null) nullInst++;
    if (v.monthly == null) nullMonthly++;
    if (v.listedPrice == null && v.buyNowPrice == null) emptyPrice++;
  }
}
const fromMins = seed.products.map((p) => {
  const nums = p.variants.map((v) => v.buyNowPrice).filter((n) => Number.isFinite(n));
  return nums.length ? Math.min(...nums) : null;
});

console.log("Products:", seed.products.length);
console.log("Variants:", variants, "unique SKUs:", seenSku.size, "dup:", dup);
console.log("Empty (both) prices:", emptyPrice);
console.log("Null listedPrice:", nullListed, "null buyNowPrice:", nullBn, "null instalmentTotal:", nullInst, "null monthly:", nullMonthly);
console.log("Products with no buy-now min:", fromMins.filter((n) => n == null).length);
console.log("From-mins sample:", fromMins.slice(0, 8));
console.log("Brands:", seed.brands.length);
