import { readFileSync } from 'node:fs';
const t = readFileSync('src/components/product-image.tsx', 'utf8').split('\n');
t.forEach((line, i) => {
  if (/photoUrl|if \(|<img|return \(/.test(line)) {
    console.log((i + 1) + ': ' + line);
  }
});
