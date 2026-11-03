import fs from 'node:fs';
import path from 'node:path';

const src = 'C:/Users/LAPTOP INSIDE/AppData/Roaming/codvian/workspaces/user_3LW3rjh0dQoNP35MS8SyAcpg48K/ses_dfa28658-a857-4803-afda-c090923ea0a7';
const dst = process.cwd();

if (!fs.existsSync(src)) {
  console.log('SRC MISSING:', src);
  process.exit(0);
}

const skip = new Set(['node_modules', '.git', 'dist', 'coverage']);
let copied = 0, skipped = 0;

function copyDir(from, to) {
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(ent.name)) { skipped++; continue; }
    const s = path.join(from, ent.name);
    const d = path.join(to, ent.name);
    if (ent.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      copied++;
    }
  }
}

copyDir(src, dst);
console.log('Copied files:', copied, '| skipped entries:', skipped);
console.log('From:', src);
console.log('To:', dst);
