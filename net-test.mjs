import https from 'node:https';
import { writeFileSync } from 'node:fs';

const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/IPhone_13.svg/240px-IPhone_13.svg.png';
https.get(url, (res) => {
  console.log('status', res.statusCode, 'content-type', res.headers['content-type']);
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log('bytes', buf.length);
    if (buf.length > 500) {
      writeFileSync('net-test.png', buf);
      console.log('WRITTEN net-test.png');
    }
  });
}).on('error', (e) => console.log('ERR', e.message));
