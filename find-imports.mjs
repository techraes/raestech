import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const root = path.join(process.cwd(), 'src');
const hits = [];
function walk(d, depth) {
  if (depth > 6) return;
  let items;
  try { items = readdirSync(d); } catch { return; }
  for (const e of items) {
    const s = path.join(d, e);
    let isDir = false;
    try { isDir = statSync(s).isDirectory(); } catch {}
    if (isDir) { walk(s, depth + 1); continue; }
    if (!/\.(ts|tsx)$/.test(e)) continue;
    let txt;
    try { txt = readFileSync(s, 'utf8'); } catch { continue; }
    if (/catalog|products|seed|\.json/.test(txt)) {
      const lines = txt.split('\n').filter(l => /import|from ['"].*\.json|SEED|CATALOG|catalog_seed/i.test(l));
      hits.push(s + '\n   ' + lines.slice(0, 8).join('\n   '));
    }
  }
}
walk(root, 0);
console.log(hits.join('\n\n'));
