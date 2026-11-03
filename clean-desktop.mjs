import { rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
const p = 'C:/Users/LAPTOP INSIDE/Desktop/RAES-TECH-website';
for (const f of readdirSync(p)) {
  if (f.endsWith('.mjs')) {
    rmSync(path.join(p, f), { force: true });
    console.log('removed', f);
  }
}
console.log('DESKTOP_CLEAN');
