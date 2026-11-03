import https from 'node:https';
import { writeFileSync } from 'node:fs';

const UA = 'RAESTechCatalogBot/1.0 (website builder; contact: admin@raestech.store)';

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
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { resolve({ status: res.statusCode }); res.resume(); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        writeFileSync(out, buf);
        resolve({ status: res.statusCode, bytes: buf.length });
      });
    }).on('error', reject);
  });
}

const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=Apple%20iPhone%2013&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=600';
const r = await getJson(api);
console.log('api status', r.status);
const pages = r.body?.query?.pages || {};
for (const pid of Object.keys(pages)) {
  const p = pages[pid];
  const ii = p.imageinfo?.[0];
  console.log('-', p.title, '| mime:', ii?.mime, '| thumb:', ii?.thumburl || ii?.url);
  if (ii?.thumburl && ii.mime?.startsWith('image/')) {
    const dl = await download(ii.thumburl, 'net-test2.' + (ii.mime.split('/')[1] || 'jpg'));
    console.log('  downloaded:', JSON.stringify(dl));
    break;
  }
}
