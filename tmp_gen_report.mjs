import fs from 'fs';

const report = JSON.parse(fs.readFileSync('data/catalog/image_fetch_report.json', 'utf8'));
const imgDir = 'public/images/products';

const rows = [['slug', 'model', 'status', 'image_status', 'suggested_filename']];
for (const e of report) {
  const f = `${imgDir}/${e.slug}.jpg`;
  const exists = fs.existsSync(f);
  const imageStatus = exists ? 'REAL_PHOTO' : 'GRAPHIC_REFERENCE';
  rows.push([e.slug, e.model, e.status, imageStatus, `${e.slug}.jpg`]);
}

// Counts
const total = rows.length - 1;
const photos = rows.slice(1).filter(r => r[3] === 'REAL_PHOTO').length;
const ref = rows.slice(1).filter(r => r[3] === 'GRAPHIC_REFERENCE').length;

let out = '';
out += 'RAES TECH — Product Image Status (generated ' + new Date().toISOString().slice(0, 10) + ')\n';
out += 'Total products: ' + total + '\n';
out += 'Showing real photo: ' + photos + '\n';
out += 'Showing graphic reference (needs real photo): ' + ref + '\n';
out += '\n';
out += rows.map(r => r.join('\t')).join('\n');
out += '\n';

fs.writeFileSync('C:/Users/LAPTOP INSIDE/Desktop/RAES_TECH_Product_Images_Status.txt', out, 'utf8');
console.log('WROTE desktop report. total=' + total + ' photos=' + photos + ' ref=' + ref);
