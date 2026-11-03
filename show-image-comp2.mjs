import { readFileSync } from 'node:fs';
const t = readFileSync('src/components/product-image.tsx', 'utf8').split('\n');
for (const range of [[5, 45], [45, 80]]) {
  console.log('===== lines ' + (range[0] + 1) + '-' + range[1] + ' =====');
  console.log(t.slice(range[0], range[1]).join('\n'));
}
