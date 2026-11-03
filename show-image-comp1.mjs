import { readFileSync } from 'node:fs';
const t = readFileSync('src/components/product-image.tsx', 'utf8');
console.log('TOTAL LINES', t.split('\n').length);
console.log(t.split('\n').slice(0, 70).join('\n'));
