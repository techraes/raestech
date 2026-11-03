import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
function walk(d, depth) {
  if (depth > 4) return;
  let list;
  try { list = readdirSync(d); } catch { return; }
  for (const e of list) {
    if (['node_modules', 'dist', '.git'].includes(e)) continue;
    const s = path.join(d, e);
    try {
      if (statSync(s).isDirectory()) walk(s, depth + 1);
    } catch {}
  }
}
walk(process.cwd(), 0);
console.log('done');
