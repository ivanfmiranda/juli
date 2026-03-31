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
        host: req.headers.host || targetUrl.host,
        'x-forwarded-host': req.headers.host || targetUrl.host,
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

function ssrPageBuilder(slug, tenantId, req, res) {
  const strapiTarget = process.env.STRAPI_API_TARGET || 'http://127.0.0.1:1337';
  let apiUrl = `${strapiTarget}/api/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`;
  if (tenantId) {
    apiUrl += `&filters[tenantKey][$eq]=${encodeURIComponent(tenantId)}`;
  }

  http.get(apiUrl, (strapiRes) => {
    let body = '';
    strapiRes.on('data', chunk => body += chunk);
    strapiRes.on('end', () => {
      try {
        const json = JSON.parse(body);
        const entry = json?.data?.[0];
        const attrs = entry?.attributes || entry || {};
        const layout = Array.isArray(attrs.layout) ? attrs.layout : [];
        const title = attrs.title || slug;

        const blocksHtml = layout.map(renderBlockToHtml).join('\n');

        const pageData = {
          slug,
          title,
          tenantKey: attrs.tenantKey || '',
          layout,
        };

        if (!fs.existsSync(indexFile)) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('index.html not found');
          return;
        }

        let html = fs.readFileSync(indexFile, 'utf-8');
        // Inject SSR content and transfer state
        const ssrContent = `
          <div id="ssr-page-content" style="max-width:1200px;margin:0 auto;padding:24px 16px;">
            ${blocksHtml}
          </div>
          <script>window.__PAGE_DATA__=window.__PAGE_DATA__||{};window.__PAGE_DATA__[${JSON.stringify(slug)}]=${JSON.stringify(pageData)};</script>
        `;
        html = html.replace('</body>', ssrContent + '</body>');
        // Update title
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)} | Ubris</title>`);

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end(html);
      } catch (err) {
        console.error('[SSR] Failed to render page', slug, err.message);
        // Fallback to SPA
        if (fs.existsSync(indexFile)) {
          sendFile(indexFile, res);
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('SSR error');
        }
      }
    });
  }).on('error', () => {
    // Fallback to SPA on Strapi error
    if (fs.existsSync(indexFile)) {
      sendFile(indexFile, res);
    } else {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    }
  });
}

function resolveTenantFromHost(host) {
  if (!host) return '';
  const hostname = host.split(':')[0].trim().toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return '';
  if (hostname === 'ubris.com.br' || hostname === 'www.ubris.com.br') return '';
  const reserved = new Set(['www', 'cms', 'backoffice', 'ucp']);
  if (hostname.endsWith('.ubris.com.br')) {
    const sub = hostname.slice(0, -'.ubris.com.br'.length);
    return reserved.has(sub) ? '' : sub;
  }
  if (hostname.endsWith('.localhost')) {
    return hostname.slice(0, -'.localhost'.length);
  }
  return '';
}

function parseVideoEmbedUrl(url, autoplay) {
  if (!url) return '';
  let videoId = '';
  let embedBase = '';

  // YouTube: youtube.com/watch?v=ID
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
  // YouTube: youtu.be/ID
  const ytShortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  // YouTube: youtube.com/embed/ID
  const ytEmbedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);

  if (ytWatchMatch) {
    videoId = ytWatchMatch[1];
    embedBase = 'https://www.youtube.com/embed/' + videoId;
  } else if (ytShortMatch) {
    videoId = ytShortMatch[1];
    embedBase = 'https://www.youtube.com/embed/' + videoId;
  } else if (ytEmbedMatch) {
    videoId = ytEmbedMatch[1];
    embedBase = 'https://www.youtube.com/embed/' + videoId;
  } else if (vimeoMatch) {
    videoId = vimeoMatch[1];
    embedBase = 'https://player.vimeo.com/video/' + videoId;
  } else {
    return '';
  }

  if (autoplay) {
    embedBase += '?autoplay=1';
  }

  return embedBase;
}

function renderBlockToHtml(block) {
  const p = block.props || {};
  switch (block.type) {
    case 'Banner':
      if (p.variant === 'hero') {
        const overlay = p.overlayColor || 'linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,41,59,0.45) 50%, rgba(0,0,0,0.2) 100%)';
        const align = p.align === 'center' ? 'center' : p.align === 'right' ? 'right' : 'left';
        const contentStyle = align === 'center' ? 'margin:0 auto;text-align:center;max-width:720px;' : align === 'right' ? 'margin-left:auto;text-align:right;max-width:640px;' : 'max-width:640px;';
        return `<section style="position:relative;display:flex;align-items:center;border-radius:16px;overflow:hidden;margin-bottom:16px;min-height:${parseInt(p.height,10)||420}px;">
          ${p.imageUrl ? `<div style="position:absolute;inset:0;background-image:url(${escapeAttr(p.imageUrl)});background-size:cover;background-position:center;"></div>` : ''}
          <div style="position:absolute;inset:0;background:${escapeAttr(overlay)};"></div>
          <div style="position:relative;z-index:1;padding:56px 48px;${contentStyle}">
            ${p.eyebrow ? `<span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);background:rgba(255,255,255,0.15);padding:5px 14px;border-radius:20px;margin-bottom:16px;">${escapeHtml(p.eyebrow)}</span>` : ''}
            ${p.title ? `<h1 style="font-size:40px;font-weight:800;color:#fff;line-height:1.15;margin:0 0 14px;text-shadow:0 2px 12px rgba(0,0,0,0.2);">${escapeHtml(p.title)}</h1>` : ''}
            ${p.subtitle ? `<p style="font-size:17px;color:rgba(255,255,255,0.9);line-height:1.6;margin:0 0 28px;">${escapeHtml(p.subtitle)}</p>` : ''}
            ${p.ctaLabel ? `<div style="display:flex;gap:12px;flex-wrap:wrap;${align === 'center' ? 'justify-content:center;' : ''}"><a href="${escapeAttr(p.ctaUrl || '#')}" style="display:inline-block;padding:14px 32px;background:#fff;color:#0f172a;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">${escapeHtml(p.ctaLabel)}</a>${p.ctaLabel2 ? `<a href="${escapeAttr(p.ctaUrl2 || '#')}" style="display:inline-block;padding:14px 32px;background:transparent;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;border:2px solid rgba(255,255,255,0.5);">${escapeHtml(p.ctaLabel2)}</a>` : ''}</div>` : ''}
          </div>
        </section>`;
      }
      return `<section style="display:flex;align-items:center;justify-content:space-between;padding:40px 32px;background:${escapeAttr(p.bgColor || '#f5f5f5')};border-radius:8px;margin-bottom:16px;flex-wrap:wrap;gap:24px;">
        <div style="flex:1;min-width:280px;">
          ${p.title ? `<h2 style="font-size:28px;font-weight:700;margin:0 0 8px;color:#1a1a2e;">${escapeHtml(p.title)}</h2>` : ''}
          ${p.subtitle ? `<p style="font-size:16px;color:#555;margin:0 0 16px;">${escapeHtml(p.subtitle)}</p>` : ''}
          ${p.ctaLabel && p.ctaUrl ? `<a href="${escapeAttr(p.ctaUrl)}" style="display:inline-block;padding:10px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${escapeHtml(p.ctaLabel)}</a>` : ''}
        </div>
        ${p.imageUrl ? `<img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.title || 'Banner')}" style="max-width:40%;max-height:250px;object-fit:cover;border-radius:8px;" loading="lazy" />` : ''}
      </section>`;
    case 'TextBlock':
      return `<div style="padding:16px 0;margin-bottom:16px;text-align:${escapeAttr(p.alignment || 'left')};line-height:1.7;font-size:16px;color:#333;">
        ${p.content || '<p style="color:#999;font-style:italic;">Bloco de texto vazio</p>'}
      </div>`;
    case 'ProductGrid': {
      const cols = parseInt(p.columns, 10) || 3;
      const max = parseInt(p.maxItems, 10) || 4;
      const placeholders = Array.from({ length: max }, () =>
        '<div style="background:#f5f5f5;border:1px dashed #ddd;border-radius:8px;padding:40px;text-align:center;color:#999;">Produto</div>'
      ).join('');
      return `<section style="padding:24px 0;margin-bottom:16px;">
        ${p.title ? `<h3 style="font-size:22px;font-weight:600;margin:0 0 16px;color:#1a1a2e;">${escapeHtml(p.title)}</h3>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;">${placeholders}</div>
      </section>`;
    }
    case 'CarouselBlock': {
      const items = Array.isArray(p.items) ? p.items : [];
      if (items.length === 0) return '<div style="background:#f5f5f5;padding:60px;text-align:center;color:#999;border:1px dashed #ddd;border-radius:8px;margin-bottom:16px;">Carrossel sem slides</div>';
      const firstSlide = items[0];
      const img = `<img src="${escapeAttr(firstSlide.imageUrl || '')}" alt="Slide 1" style="width:100%;height:auto;display:block;border-radius:8px;" loading="lazy" />`;
      return `<div style="margin-bottom:16px;border-radius:8px;overflow:hidden;">${firstSlide.link ? `<a href="${escapeAttr(firstSlide.link)}">${img}</a>` : img}</div>`;
    }
    case 'HtmlBlock':
      return `<div style="margin-bottom:16px;">${p.html || '<p style="color:#999;font-style:italic;padding:24px;background:#f9f9f9;border:1px dashed #ddd;border-radius:8px;text-align:center;">Bloco HTML vazio</p>'}</div>`;
    case 'SpacerBlock':
      return `<div style="height:${parseInt(p.height, 10) || 40}px;"></div>`;
    case 'VideoBlock': {
      const embedUrl = parseVideoEmbedUrl(p.videoUrl, p.autoplay);
      if (!embedUrl) return '';
      const aspectMap = { '4:3': '75%', '1:1': '100%', '16:9': '56.25%' };
      const padding = aspectMap[p.aspectRatio] || '56.25%';
      return `<div style="margin-bottom:16px;">
        <div style="position:relative;width:100%;padding-top:${padding};overflow:hidden;border-radius:8px;background:#000;">
          <iframe src="${escapeAttr(embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        ${p.caption ? `<p style="margin:8px 0 0;font-size:14px;color:#666;text-align:center;">${escapeHtml(p.caption)}</p>` : ''}
      </div>`;
    }
    case 'FormBlock': {
      const fields = Array.isArray(p.fields) ? p.fields : [];
      const fieldsHtml = fields.map(f => {
        const label = `<label style="font-size:14px;font-weight:500;color:#333;">${escapeHtml(f.label || '')}${f.required ? '<span style="color:#e53e3e;"> *</span>' : ''}</label>`;
        let input = '';
        if (f.type === 'textarea') {
          input = `<textarea style="padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:15px;font-family:inherit;width:100%;box-sizing:border-box;" placeholder="${escapeAttr(f.placeholder || '')}" rows="4"${f.required ? ' required' : ''}></textarea>`;
        } else if (f.type === 'select') {
          const opts = Array.isArray(f.options) ? f.options : [];
          const optionsHtml = opts.map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('');
          input = `<select style="padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:15px;font-family:inherit;width:100%;box-sizing:border-box;"${f.required ? ' required' : ''}><option value="" disabled selected>${escapeHtml(f.placeholder || 'Selecione...')}</option>${optionsHtml}</select>`;
        } else {
          input = `<input type="${escapeAttr(f.type || 'text')}" style="padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:15px;font-family:inherit;width:100%;box-sizing:border-box;" placeholder="${escapeAttr(f.placeholder || '')}"${f.required ? ' required' : ''} />`;
        }
        return `<div style="display:flex;flex-direction:column;gap:4px;">${label}${input}</div>`;
      }).join('');
      return `<section style="padding:24px 0;margin-bottom:16px;">
        ${p.title ? `<h3 style="font-size:22px;font-weight:600;margin:0 0 16px;color:#1a1a2e;">${escapeHtml(p.title)}</h3>` : ''}
        <form style="display:flex;flex-direction:column;gap:16px;" onsubmit="return false;">
          ${fieldsHtml}
          <button type="submit" style="align-self:flex-start;padding:10px 28px;background:#4f46e5;color:#fff;border:none;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer;">${escapeHtml(p.submitLabel || 'Enviar')}</button>
        </form>
      </section>`;
    }
    case 'MapBlock': {
      const lat = parseFloat(p.lat);
      const lng = parseFloat(p.lng);
      const zoom = parseInt(p.zoom, 10) || 15;
      const height = parseInt(p.height, 10) || 400;
      let mapSrc = '';
      if (!isNaN(lat) && !isNaN(lng)) {
        mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
      } else if (p.address) {
        mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&z=${zoom}&output=embed`;
      }
      if (mapSrc) {
        return `<div style="width:100%;height:${height}px;border-radius:8px;overflow:hidden;margin-bottom:16px;background:#e5e7eb;">
          <iframe src="${escapeAttr(mapSrc)}" style="width:100%;height:100%;border:none;" frameborder="0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>`;
      }
      if (p.address) {
        return `<div style="width:100%;height:${height}px;border-radius:8px;overflow:hidden;margin-bottom:16px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;color:#666;font-size:15px;">
          <p>${escapeHtml(p.address)}</p>
        </div>`;
      }
      return '';
    }
    case 'ProductCarousel': {
      const max = parseInt(p.maxItems, 10) || 6;
      const placeholders = Array.from({ length: max }, () =>
        '<div style="flex:0 0 220px;scroll-snap-align:start;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;height:300px;"><div style="height:200px;background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;"></div><div style="padding:14px 16px;"><div style="height:13px;width:70%;background:#f0f0f0;border-radius:4px;margin-bottom:8px;"></div><div style="height:13px;width:50%;background:#f0f0f0;border-radius:4px;"></div></div></div>'
      ).join('');
      return `<section style="padding:8px 0;margin-bottom:8px;">
        ${p.title ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;"><h3 style="font-size:22px;font-weight:700;margin:0;color:#0f172a;">${escapeHtml(p.title)}</h3></div>` : ''}
        <div style="display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;">${placeholders}</div>
      </section>`;
    }
    default:
      return `<div style="padding:16px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;margin-bottom:16px;color:#856404;">Bloco desconhecido: ${escapeHtml(block.type)}</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

  // /cms and /cms/ → redirect to admin entry point
  if (pathname === '/cms' || pathname === '/cms/') {
    res.writeHead(302, { Location: '/cms/admin' });
    res.end();
    return;
  }

  // /cms/login → redirect to Strapi login screen
  if (pathname === '/cms/login') {
    res.writeHead(302, { Location: '/cms/admin/auth/login' });
    res.end();
    return;
  }

  // /cms/* → Strapi (strip /cms prefix); covers /cms/admin, /cms/api/*, /cms/_health
  if (pathname.startsWith('/cms')) {
    proxyRequest(req, res, process.env.STRAPI_API_TARGET || 'http://127.0.0.1:1337', url =>
      url.replace(/^\/cms/, '') || '/'
    );
    return;
  }

  // /admin/* → Strapi; required because the admin build references assets at /admin/... (absolute paths)
  if (pathname.startsWith('/admin')) {
    proxyRequest(req, res, process.env.STRAPI_API_TARGET || 'http://127.0.0.1:1337', url => url);
    return;
  }

  if (pathname.startsWith('/img')) {
    proxyRequest(req, res, process.env.IMG_TARGET || 'http://127.0.0.1:8088', url => url);
    return;
  }

  // SSR for page-builder pages: /pages/:slug
  if (pathname.startsWith('/pages/') && (req.method === 'GET' || req.method === 'HEAD')) {
    const slug = decodeURIComponent(pathname.replace('/pages/', ''));
    if (slug && !slug.includes('/') && !slug.includes('.')) {
      const tenantId = resolveTenantFromHost(req.headers.host);
      ssrPageBuilder(slug, tenantId, req, res);
      return;
    }
  }

  // Static root files (robots.txt, sitemap.xml, etc.) – serve before SPA fallback
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    const staticPath = resolveAssetPath(pathname);
    if (staticPath.startsWith(distDir) && fs.existsSync(staticPath)) {
      sendFile(staticPath, res);
      return;
    }
  }

  // SSR for homepage
  if (pathname === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
    const tenantId = resolveTenantFromHost(req.headers.host);
    ssrPageBuilder('home', tenantId, req, res);
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
