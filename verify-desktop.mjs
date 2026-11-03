import { existsSync } from 'node:fs';
import path from 'node:path';
const p = 'C:/Users/LAPTOP INSIDE/Desktop/RAES-TECH-website';
for (const d of ['node_modules', 'dist', 'src', 'public', 'package.json']) {
  console.log(d, existsSync(path.join(p, d)) ? 'OK' : 'MISSING');
}
