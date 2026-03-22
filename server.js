const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 4200);
const distDir = path.join(__dirname, 'dist', 'juli');
const indexFile = path.join(distDir, 'index.html');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function proxyRequest(req, res, target, rewritePath) {
  const targetUrl = new URL(target);
  const upstreamPath = rewritePath(req.url);
  const proxyReq = http.request(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      method: req.method,
      path: upstreamPath,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        connection: 'close'
      }
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', err => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Bad Gateway: ${err.message}`);
  });

  req.pipe(proxyReq);
}

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const extension = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=300'
    });
    res.end(data);
  });
}

function resolveAssetPath(urlPath) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  return path.join(distDir, safePath);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname.startsWith('/ubris-api')) {
    proxyRequest(req, res, process.env.UBRIS_API_TARGET || 'http://127.0.0.1:8088', url =>
      url.replace(/^\/ubris-api/, '') || '/'
    );
    return;
  }

  if (pathname.startsWith('/strapi-api')) {
    proxyRequest(req, res, process.env.STRAPI_API_TARGET || 'http://127.0.0.1:1337', url =>
      url.replace(/^\/strapi-api/, '/api')
    );
    return;
  }

  if (pathname.startsWith('/img')) {
    proxyRequest(req, res, process.env.IMG_TARGET || 'http://127.0.0.1:8088', url => url);
    return;
  }

  const assetPath = resolveAssetPath(pathname === '/' ? '/index.html' : pathname);
  if (assetPath.startsWith(distDir) && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
    sendFile(assetPath, res);
    return;
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && fs.existsSync(indexFile)) {
    sendFile(indexFile, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`juli server listening on ${port}\n`);
});
