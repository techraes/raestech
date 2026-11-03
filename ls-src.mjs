import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
function list(d, depth, max = 4) {
  if (depth > max) return;
  let items;
  try { items = readdirSync(d); } catch { return; }
  for (const e of items) {
    if (['node_modules', 'dist', '.git'].includes(e)) continue;
    const s = path.join(d, e);
    let isDir = false;
    try { isDir = statSync(s).isDirectory(); } catch {}
    console.log('  '.repeat(depth) + e + (isDir ? '/' : ''));
    if (isDir) list(s, depth + 1, max);
  }
}
list(path.join(process.cwd(), 'src'), 0, 4);
