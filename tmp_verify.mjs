import fs from 'fs';
const p = 'C:/Users/LAPTOP INSIDE/Desktop/RAES_TECH_Product_Images_Status.txt';
console.log('exists', fs.existsSync(p));
if (fs.existsSync(p)) {
  const s = fs.statSync(p);
  console.log('bytes', s.size);
  const head = fs.readFileSync(p, 'utf8').split('\n').slice(0, 12).join('\n');
  console.log('--- head ---\n' + head);
}
