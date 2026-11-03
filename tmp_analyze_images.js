const fs = require('fs');
const r = JSON.parse(fs.readFileSync('data/catalog/image_fetch_report.json', 'utf8'));
console.log('TOTAL', r.length);
for (const e of r) {
  console.log(e.slug + ' | ' + e.status + ' | ' + (e.src || ''));
}
