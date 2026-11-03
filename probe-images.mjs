import http from 'node:http';
function check(p) {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:4174' + p, (res) => {
      console.log(p, '->', res.statusCode, res.headers['content-type']);
      res.resume();
      resolve();
    }).on('error', () => { console.log(p, '-> ERR'); resolve(); });
  });
}
await check('/images/products/apple-iphone-12-mini.jpg');
await check('/images/products/apple-iphone-13.jpg');
await check('/images/products/apple-iphone-12-mini.svg'); // legacy fallback path (expect 404)
