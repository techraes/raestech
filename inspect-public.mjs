import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
const src = 'C:/Users/LAPTOP INSIDE/AppData/Roaming/codvian/workspaces/user_3LW3rjh0dQoNP35MS8SyAcpg48K/ses_4debf727-eee0-4f93-947e-071eec67c732/public';
function walk(d, depth) {
  if (depth > 3) return;
  for (const e of readdirSync(d)) {
    const s = path.join(d, e);
    try {
      if (statSync(s).isDirectory()) { console.log('DIR ', s); walk(s, depth + 1); }
      else console.log('FILE', s);
    } catch {}
  }
}
if (statSync(src).isDirectory()) walk(src, 0);
