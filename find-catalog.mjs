import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const hits = [];
function walk(d, depth) {
  if (depth > 6) return;
  let items;
  try { items = readdirSync(d); } catch { return; }
  for (const e of items) {
    if (['node_modules', 'dist', '.git'].includes(e)) continue;
    const s = path.join(d, e);
    let isDir = false;
    try { isDir = statSync(s).isDirectory(); } catch {}
    if (isDir) { walk(s, depth + 1); continue; }
    if (!/\.(ts|tsx|js|jsx|json)$/.test(e)) continue;
    let txt;
    try { txt = readFileSync(s, 'utf8'); } catch { continue; }
    if (/RT-\d{5}/.test(txt) || (/const\s+\w*[Cc]atalog/.test(txt) && txt.length < 200000)) {
      hits.push(s);
    }
  }
}
walk(root, 0);
console.log(hits.join('\n'));
