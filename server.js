const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css',
  '.js'   : 'application/javascript',
  '.json' : 'application/json',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.webp' : 'image/webp',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  let decoded;
  try { decoded = decodeURIComponent(urlPath.replace(/^\//, '')); }
  catch { res.writeHead(400); res.end('Bad request'); return; }

  const filePath = path.join(__dirname, decoded);

  /* Prevent directory traversal */
  if (!filePath.startsWith(__dirname + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    /* Photos never change once published, so let browsers keep them */
    if (ext === '.jpg') headers['Cache-Control'] = 'public, max-age=2592000, immutable';
    res.writeHead(200, headers);
    res.end(data);
  });

}).listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
