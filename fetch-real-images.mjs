import https from 'node:https';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const UA = 'RAESTechCatalogBot/1.0 (website builder; contact: admin@raestech.store)';
const OUT = path.join(process.cwd(), 'public', 'images', 'products');
mkdirSync(OUT, { recursive: true });

const seed = JSON.parse(readFileSync('src/data/catalog_seed.json', 'utf8'));
const products = seed.products;

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function download(url, out) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { resolve({ status: res.statusCode }); res.resume(); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { writeFileSync(out, Buffer.concat(chunks)); resolve({ status: 200 }); }
        catch (e) { resolve({ status: 0, err: e.message }); }
      });
    }).on('error', (e) => resolve({ status: 0, err: e.message }));
  });
}

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function tokens(s) {
  return norm(s).split(' ').filter(Boolean);
}

async function findImage(product) {
  const brand = product.brand;
  const model = product.model;
  const searchText = encodeURIComponent(`${brand} ${model}`);
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${searchText}&gsrlimit=10&prop=imageinfo&iiprop=url|mime&iiurlwidth=600`;
  let r;
  try { r = await getJson(api); } catch { return { status: 'error' }; }
  if (r.status !== 200) return { status: 'error' };
  const pages = r.body?.query?.pages || {};
  const modelToks = tokens(model).filter((t) => !['pro','plus','max','ultra','lite','mini','se'].includes(t));
  let best = null, bestScore = -1;
  for (const pid of Object.keys(pages)) {
    const p = pages[pid];
    const ii = p.imageinfo?.[0];
    if (!ii || !ii.thumburl) continue;
    if (ii.mime && !/^image\/(jpeg|png)$/.test(ii.mime)) continue; // skip svg/gif
    const title = norm(p.title);
    let score = 0;
    for (const t of modelToks) if (title.includes(t)) score += 2;
    if (/^file:/.test(p.title) && title.includes(norm(brand).split(' ')[0])) score += 1;
    if (score > bestScore) { bestScore = score; best = { title: p.title, url: ii.thumburl, mime: ii.mime }; }
  }
  return best ? { status: 'ok', best } : { status: 'no_match' };
}

async function main() {
  const results = [];
  const concurrency = 6;
  let idx = 0;
  async function worker() {
    while (idx < products.length) {
      const p = products[idx++];
      const slug = p.slug;
      const outPath = path.join(OUT, slug + '.jpg');
      const existing = existsSync(outPath) && readFileSync(outPath).length > 4000;
      if (existing) { results.push({ slug, model: p.model, status: 'saved', src: 'existing' }); process.stdout.write('.'); continue; }
      const found = await findImage(p);
      if (found.status === 'ok') {
        const dl = await download(found.best.url, outPath);
        results.push({ slug, model: p.model, status: dl.status === 200 ? 'saved' : 'dl_fail', src: found.best.title, bytes: existsSync(outPath) ? (readFileSync(outPath).length) : 0 });
      } else {
        results.push({ slug, model: p.model, status: found.status });
      }
      process.stdout.write('.');
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const ok = results.filter((r) => r.status === 'saved').length;
  const missing = results.filter((r) => r.status !== 'saved').map((r) => r.slug);
  console.log('\n\nSAVED:', ok, 'of', results.length);
  console.log('MISSING/FAILED:', missing.length);
  writeFileSync('data/catalog/image_fetch_report.json', JSON.stringify(results, null, 2));
  console.log('report -> data/catalog/image_fetch_report.json');
}

await main();
