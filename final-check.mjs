import { readdirSync } from 'node:fs';
import path from 'node:path';
const p = 'C:/Users/LAPTOP INSIDE/Desktop/RAES-TECH-website';
console.log(readdirSync(p).join('\n'));
