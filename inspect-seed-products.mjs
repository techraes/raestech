import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync('src/data/catalog_seed.json', 'utf8'));
console.log('keys:', Object.keys(c));
const prods = c.products;
console.log('products length:', prods.length);
if (prods.length) {
  console.log('product keys:', Object.keys(prods[0]));
  console.log('sample product:', JSON.stringify(prods[0]).slice(0, 1000));
  // distinct models
  const models = new Set();
  for (const p of prods) models.add(String(p.model || p.name));
  console.log('distinct models:', models.size);
}
