import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const report = 'data/catalog/image_fetch_report.json';
for (let i = 0; i < 120; i++) {
  if (existsSync(report)) {
    const r = JSON.parse(readFileSync(report, 'utf8'));
    const saved = r.filter((x) => x.status === 'saved').length;
    const missing = r.filter((x) => x.status !== 'saved');
    console.log('DONE. saved:', saved, 'of', r.length);
    console.log('missing/failed (' + missing.length + '):');
    for (const m of missing) console.log('  -', m.slug, '[' + m.status + ']');
    process.exit(0);
  }
  await sleep(2000);
}
console.log('TIMEOUT waiting for report');
