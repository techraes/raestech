import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const srcPub = 'C:/Users/LAPTOP INSIDE/AppData/Roaming/codvian/workspaces/user_3LW3rjh0dQoNP35MS8SyAcpg48K/ses_4debf727-eee0-4f93-947e-071eec67c732/public';
const dests = [
  process.cwd(),
  'C:/Users/LAPTOP INSIDE/Desktop/RAES-TECH-website',
];
for (const dest of dests) {
  if (!existsSync(srcPub)) { console.log('SRC MISSING', srcPub); continue; }
  const d = path.join(dest, 'public');
  mkdirSync(d, { recursive: true });
  cpSync(srcPub, d, { recursive: true });
  console.log('PUBLIC_OK', dest);
}
