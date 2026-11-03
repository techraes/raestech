import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
const dir = 'public/images/products';
const files = readdirSync(dir);
const jpgs = files.filter((f) => f.endsWith('.jpg'));
console.log('total files in dir:', files.length);
console.log('jpg files:', jpgs.length);
// sizes of first 6
for (const f of jpgs.slice(0, 6)) console.log(' ', f, statSync(path.join(dir, f)).size, 'bytes');
