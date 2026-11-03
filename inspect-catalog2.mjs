import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync('data/catalog/catalog_clean.json', 'utf8'));
const keys = Object.keys(catalog);
console.log('top-level keys:', keys);
console.log('sample:', JSON.stringify(catalog[keys[0]]).slice(0, 600));
