import { readdirSync } from 'node:fs';
import path from 'node:path';
const d = path.join(process.cwd(), 'dist');
console.log(readdirSync(d).join(' | '));
