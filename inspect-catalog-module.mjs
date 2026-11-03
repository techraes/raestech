import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const files = ['src/data/catalog.ts', 'src/data/catalog.tsx', 'src/data/catalog/index.ts', 'src/data/catalog.js', 'src/data/catalog.json'];
for (const f of files) {
  try {
    const st = statSync(f);
    console.log(f, st.size, 'bytes');
    const head = readFileSync(f, 'utf8').slice(0, 1200);
    console.log(head);
    console.log('----');
  } catch {}
}
