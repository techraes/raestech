import { readdirSync } from 'node:fs';
import path from 'node:path';
const dataDir = path.join(process.cwd(), 'data', 'catalog');
console.log('catalog dir contents:', readdirSync(dataDir).join(' | '));
