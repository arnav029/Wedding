const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html' : 'text/html',
  '.css'  : 'text/css',
  '.js'   : 'application/javascript',
  '.json' : 'application/json',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.gif'  : 'image/gif',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
  '.mp4'  : 'video/mp4',
  '.webm' : 'video/webm',
};

/* Folders to scan, in display order */
const PHOTO_DIRS = [
  { dir: 'Day 1 - Laughter, Light & Music/Haldi',   cat: 'haldi'   },
  { dir: 'Day 1 - Laughter, Light & Music/Sangeet',  cat: 'sangeet' },
  { dir: 'Day 2 - A Journey to Forever/Vaidik',      cat: 'vaidik'  },
  { dir: 'Day 2 - A Journey to Forever/Varmala',     cat: 'varmala' },
];

const IMAGE_RE = /\.(jpe?g|png|gif|webp)$/i;

function buildPhotoList() {
  const photos = [];
  for (const { dir, cat } of PHOTO_DIRS) {
    const abs = path.join(__dirname, dir);
    let files;
    try { files = fs.readdirSync(abs).sort(); }
    catch { continue; }
    for (const f of files) {
      if (!IMAGE_RE.test(f)) continue;
      /* URL-encode each path segment so browsers request correctly */
      const src = dir.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(f);
      photos.push({ src, cat });
    }
  }
  return photos;
}

http.createServer((req, res) => {
  /* ── API: photo list ── */
  if (req.url === '/api/photos') {
    const body = JSON.stringify(buildPhotoList());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }

  /* ── Static files ── */
  let urlPath = req.url.split('?')[0];           // strip query string
  if (urlPath === '/') urlPath = '/template_noir.html';

  /* Strip the leading slash, then decode, then join — avoids any
     platform ambiguity about what path.join does with a leading /  */
  let decoded;
  try { decoded = decodeURIComponent(urlPath.replace(/^\//, '')); }
  catch { res.writeHead(400); res.end('Bad request'); return; }

  const filePath = path.join(__dirname, decoded);

  /* Prevent directory traversal */
  if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });

}).listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
