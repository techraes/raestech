import { readFileSync } from 'node:fs';
const c = JSON.parse(readFileSync('src/data/catalog_seed.json', 'utf8'));
const arr = Array.isArray(c) ? c : Object.values(c)[0];
console.log('array length:', Array.isArray(arr) ? arr.length : 'n/a');
const model = new Set();
const brand = new Set();
for (const p of arr) {
  if (p.model || p.name) model.add(String(p.model || p.name));
  if (p.brand) brand.add(String(p.brand));
}
console.log('distinct models:', model.size);
console.log('brands:', [...brand].join(', '));
console.log('sample keys:', Object.keys(arr[0]).join(', '));
console.log('sample model:', JSON.stringify(arr[0]).slice(0, 800));
