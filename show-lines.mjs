import { readFileSync } from 'node:fs';
const t = readFileSync('src/components/product-image.tsx', 'utf8').split('\n');
console.log(t.slice(21, 46).join('\n'));
