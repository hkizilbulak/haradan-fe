#!/usr/bin/env node
/**
 * Production static host for `expo export --platform web`.
 * Listens on Railway $PORT (fallback 8080). SPA fallback for client routes.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd(), process.env.WEB_DIST_DIR || 'dist');
const PORT = Number.parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const API_BASE = publicApiBase(process.env.EXPO_PUBLIC_API_URL);
const CONFIG_SCRIPT = `<script>window.__HARADAN_API_URL__=${JSON.stringify(API_BASE || '')};</script>`;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent((urlPath.split('?')[0] || '/').replace(/\\/g, '/'));
  const rel = decoded.replace(/^\/+/, '');
  const abs = resolve(root, rel);
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (abs !== root && !abs.startsWith(prefix)) return null;
  return abs;
}

function publicApiBase(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme.replace(/\/\.+$/, ''));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (!parsed.hostname) return '';
    return `${parsed.origin}/api`;
  } catch {
    return '';
  }
}

function injectRuntimeConfig(html) {
  if (html.includes('window.__HARADAN_API_URL__')) return html;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${CONFIG_SCRIPT}`);
  }
  return `${CONFIG_SCRIPT}${html}`;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function sendFile(res, file, cache) {
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  if (type.startsWith('text/html')) {
    const html = injectRuntimeConfig(readFileSync(file, 'utf8'));
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(html);
    return;
  }
  const stream = createReadStream(file);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
  });
  stream.on('error', () => send(res, 500, 'Internal Server Error'));
  stream.pipe(res);
}

function tryFile(abs) {
  if (!abs || !existsSync(abs)) return null;
  const st = statSync(abs);
  if (st.isFile()) return abs;
  if (st.isDirectory()) {
    const index = join(abs, 'index.html');
    if (existsSync(index) && statSync(index).isFile()) return index;
  }
  return null;
}

function resolvePath(urlPath) {
  const abs = safeJoin(ROOT, urlPath);
  if (!abs) return null;
  return (
    tryFile(abs) ||
    tryFile(`${abs}.html`) ||
    tryFile(join(abs, 'index.html'))
  );
}

if (!existsSync(ROOT)) {
  console.error(`web dist missing: ${ROOT} (run npm run build:web)`);
  process.exit(1);
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed');
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/config.json') {
    send(
      res,
      200,
      JSON.stringify({ apiUrl: API_BASE || null }),
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      }
    );
    return;
  }

  let file = resolvePath(urlPath);
  let cache = urlPath.startsWith('/_expo/') || urlPath.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  if (!file) {
    file = tryFile(join(ROOT, 'index.html'));
    cache = 'no-cache';
  }
  if (!file) {
    send(res, 404, 'Not Found');
    return;
  }
  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': cache,
    });
    res.end();
    return;
  }
  sendFile(res, file, cache);
});

server.listen(PORT, HOST, () => {
  console.log(`haradan-fe web listening on http://${HOST}:${PORT}`);
  console.log(`api base ${API_BASE || '(unset — FE will use mocks)'}`);
});
