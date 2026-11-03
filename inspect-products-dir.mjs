import { readdirSync, statSync } from 'node:fs';

const dir = 'public/images/products';
const files = readdirSync(dir);
const byExt = {};
let totalBytes = 0;
for (const f of files) {
  const ext = f.split('.').pop().toLowerCase();
  byExt[ext] = (byExt[ext] || 0) + 1;
  totalBytes += statSync(`${dir}/${f}`).size;
}
console.log('TOTAL FILES:', files.length);
console.log('BY EXTENSION:', byExt);
console.log('TOTAL BYTES:', totalBytes);
