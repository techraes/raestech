import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync('data/catalog/catalog_clean.json', 'utf8'));
const catalog2 = JSON.parse(readFileSync('data/catalog/catalog_full.json', 'utf8'));
console.log('clean count:', Array.isArray(catalog) ? catalog.length : Object.keys(catalog).length);
console.log('full count:', Array.isArray(catalog2) ? catalog2.length : Object.keys(catalog2).length);
// distinct models
const models = new Set();
const arr = Array.isArray(catalog) ? catalog : catalog2;
for (const p of arr) {
  const m = p.model || p.name || p.title || '';
  if (m) models.add(String(m));
}
console.log('distinct models:', models.size);
console.log([...models].slice(0, 60).join(' | '));
