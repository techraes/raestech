import { readFileSync, writeFileSync } from 'node:fs';
const report = JSON.parse(readFileSync('data/catalog/image_fetch_report.json', 'utf8'));
const lines = [];
lines.push('# Photo Credits & Licensing');
lines.push('');
lines.push('Real product photos were fetched from **Wikimedia Commons** (free-licensed media)');
lines.push('for the catalog products listed below. Images are used under the license');
lines.push('attached to each Wikimedia Commons file (typically CC BY, CC BY-SA, or');
lines.push('public domain). **Retain this file and display attribution for any image');
lines.push('you publish commercially, as required by the respective license.**');
lines.push('');
lines.push('| Product slug | Wikimedia Commons source file |');
lines.push('|---|---|');
for (const r of report) {
  if (r.status === 'saved' && r.src && r.src !== 'existing') {
    lines.push(`| ${r.slug} | ${r.src} |`);
  }
}
lines.push('');
lines.push('Products not listed above have no free-licensed photo available; they use the');
lines.push('branded placeholder graphic. Source files can be reviewed at:');
lines.push('https://commons.wikimedia.org/');
writeFileSync('docs/PHOTO_CREDITS.md', lines.join('\n'));
console.log('WROTE docs/PHOTO_CREDITS.md with', lines.length, 'lines');
