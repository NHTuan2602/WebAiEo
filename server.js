import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { attachSyncMiddleware, createPersistentSyncStore } from './syncPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const MAINTENANCE_HTML_PATH = path.join(DIST_DIR, 'maintenance.html');
const PUBLIC_MAINTENANCE_HTML_PATH = path.join(__dirname, 'public', 'maintenance.html');

function isMaintenanceModeEnabled() {
  const flag = String(process.env.MAINTENANCE_MODE || '').trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'on';
}

function sendMaintenancePage(res, statusCode = 503) {
  res.statusCode = statusCode;
  res.setHeader('Cache-Control', 'no-store');
  const htmlPath = fs.existsSync(MAINTENANCE_HTML_PATH)
    ? MAINTENANCE_HTML_PATH
    : fs.existsSync(PUBLIC_MAINTENANCE_HTML_PATH)
    ? PUBLIC_MAINTENANCE_HTML_PATH
    : '';
  if (htmlPath) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(htmlPath).pipe(res);
    return;
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Sever đang được bảo trì hoặc Admin lỡ đái nhầm vào sever vui lòng đợi trong giây lát');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm'
};

/** Resolve optional persistent sync state path (Railway Volume if mounted, else local .data). */
function resolvePersistPath() {
  if (process.env.SYNC_STATE_FILE) {
    return process.env.SYNC_STATE_FILE;
  }
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'lexiprep-sync-state.json');
  }
  const unifiedLocalPath = path.join(__dirname, '.data', 'dev-sync-state.json');
  const legacyLocalPath = path.join(__dirname, '.data', 'sync-state.json');
  if (!fs.existsSync(unifiedLocalPath) && fs.existsSync(legacyLocalPath)) {
    return legacyLocalPath;
  }
  return unifiedLocalPath;
}

/** Safely resolve a request URL inside DIST_DIR, blocking directory traversal. */
function resolveStaticAssetPath(urlPathname) {
  let cleanPathname = '/';
  try {
    cleanPathname = decodeURIComponent(urlPathname || '/');
  } catch {
    return null;
  }
  const relPath = cleanPathname.replace(/^\/+/, '');
  const candidate = path.resolve(DIST_DIR, relPath || 'index.html');
  if (candidate !== DIST_DIR && !candidate.startsWith(DIST_DIR + path.sep)) {
    return null;
  }
  return candidate;
}

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const CACHEABLE_MEDIA_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.mp3', '.wav', '.ogg', '.m4a', '.webm', '.webmanifest'
]);
const compressedAssetCache = new Map();
const MAX_COMPRESSED_CACHE_ENTRIES = 64;

function pickAcceptedEncoding(req) {
  const raw = String(req?.headers?.['accept-encoding'] || '').toLowerCase();
  if (!raw) return '';
  if (/\bbr\b/.test(raw)) return 'br';
  if (/\bgzip\b/.test(raw)) return 'gzip';
  return '';
}

function matchesIfNoneMatch(ifNoneMatchHeader, etag) {
  if (!ifNoneMatchHeader || !etag) return false;
  const target = String(etag).replace(/^W\//i, '').trim();
  return String(ifNoneMatchHeader)
    .split(',')
    .some(part => {
      const clean = part.trim();
      return clean === '*' || clean.replace(/^W\//i, '').trim() === target;
    });
}

function resolveStaticCacheControl(filePath, ext, isAsset) {
  if (isAsset) return 'public, max-age=31536000, immutable';
  const baseName = path.basename(filePath).toLowerCase();
  if (baseName === 'sw-offline.js') return 'no-cache, max-age=0';
  if (ext === '.html') return 'no-cache';
  if (CACHEABLE_MEDIA_EXTS.has(ext)) return 'public, max-age=86400, stale-while-revalidate=604800';
  if (ext === '.js' || ext === '.mjs' || ext === '.css') return 'public, max-age=3600';
  return 'no-cache';
}

function getCompressedStaticBuffer(filePath, enc, mtimeMs) {
  const cacheKey = `${filePath}:${Math.floor(mtimeMs || 0)}:${enc}`;
  if (compressedAssetCache.has(cacheKey)) {
    return compressedAssetCache.get(cacheKey);
  }
  const rawBuf = fs.readFileSync(filePath);
  if (rawBuf.length < 512) return { encoding: '', buffer: rawBuf };
  const compressed =
    enc === 'br'
      ? zlib.brotliCompressSync(rawBuf, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 }
        })
      : enc === 'gzip'
      ? zlib.gzipSync(rawBuf, { level: 6 })
      : rawBuf;
  const result = compressed.length < rawBuf.length ? { encoding: enc, buffer: compressed } : { encoding: '', buffer: rawBuf };
  if (compressedAssetCache.size >= MAX_COMPRESSED_CACHE_ENTRIES) {
    const oldestKey = compressedAssetCache.keys().next().value;
    if (oldestKey) compressedAssetCache.delete(oldestKey);
  }
  compressedAssetCache.set(cacheKey, result);
  return result;
}

/** Stream a static file response with Brotli/Gzip compression, ETag/304 revalidation, caching and MIME headers. */
function sendStaticFile(req, res, filePath, isAsset) {
  const ext = path.extname(filePath).toLowerCase();
  let stat = null;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
    return;
  }

  const cacheControl = resolveStaticCacheControl(filePath, ext, isAsset);
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('ETag', etag);
  if (COMPRESSIBLE_EXTS.has(ext)) {
    res.setHeader('Vary', 'Accept-Encoding');
  }

  if (matchesIfNoneMatch(req.headers?.['if-none-match'], etag)) {
    res.statusCode = 304;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');

  if (COMPRESSIBLE_EXTS.has(ext)) {
    const enc = pickAcceptedEncoding(req);
    try {
      const { encoding, buffer } = enc
        ? getCompressedStaticBuffer(filePath, enc, stat.mtimeMs)
        : { encoding: '', buffer: fs.readFileSync(filePath) };
      if (encoding) {
        res.setHeader('Content-Encoding', encoding);
      }
      res.setHeader('Content-Length', String(buffer.length));
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(buffer);
      return;
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      res.end('Internal asset read error');
      return;
    }
  }

  res.setHeader('Content-Length', String(stat.size));
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end('Internal asset read error');
  });
  stream.pipe(res);
}

/** Start the standalone production HTTP + SSE sync server. */
export function createProductionServer({ port = Number(process.env.PORT) || 4173, host = process.env.HOST || '0.0.0.0', persistFile = resolvePersistPath() } = {}) {
  const { store, schedulePersist, flushPersist, syncFromDiskIfNewer } = createPersistentSyncStore(persistFile);
  const sseClients = new Set();
  const middlewares = [];

  attachSyncMiddleware(
    { use: (route, fn) => middlewares.push({ route, fn }) },
    store,
    sseClients,
    schedulePersist,
    { syncFromDiskIfNewer, onFlush: flushPersist }
  );

  const server = http.createServer((req, res) => {
    // Harden HTTP responses with standard defensive security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    const rawUrl = req.url || '/';
    const pathname = rawUrl.split('?')[0];

    if (pathname === '/health') {
      const inMaintenance = isMaintenanceModeEnabled();
      res.statusCode = inMaintenance ? 503 : 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(
        JSON.stringify(
          inMaintenance
            ? { ok: false, maintenance: true, version: store.version, uptime: Math.round(process.uptime()) }
            : { ok: true, version: store.version, uptime: Math.round(process.uptime()) }
        )
      );
      return;
    }

    if (isMaintenanceModeEnabled()) {
      if (pathname === '/server-maintenance.jpg' || pathname === '/maintenance.html' || pathname === '/sw-offline.js') {
        const assetPath = resolveStaticAssetPath(pathname);
        if (assetPath && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
          sendStaticFile(req, res, assetPath, false);
          return;
        }
      }
      if (pathname.startsWith('/api/')) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ ok: false, maintenance: true, error: 'Sever đang được bảo trì hoặc Admin lỡ đái nhầm vào sever vui lòng đợi trong giây lát' }));
        return;
      }
      sendMaintenancePage(res, 503);
      return;
    }

    const syncHandler = middlewares.find(m => pathname === m.route || pathname.startsWith(m.route + '/'));
    if (syncHandler) {
      req.originalUrl = rawUrl;
      req.url = rawUrl.slice(syncHandler.route.length) || '/';
      try {
        syncHandler.fn(req, res, () => {
          res.statusCode = 404;
          res.end(JSON.stringify({ ok: false, error: 'Not found' }));
        });
      } catch (_err) {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Sever đang được bảo trì hoặc Admin lỡ đái nhầm vào sever vui lòng đợi trong giây lát' }));
        }
      }
      return;
    }

    const targetPath = resolveStaticAssetPath(pathname);
    if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      sendStaticFile(req, res, targetPath, pathname.startsWith('/assets/'));
      return;
    }

    if (!path.extname(pathname) && fs.existsSync(INDEX_HTML_PATH)) {
      sendStaticFile(req, res, INDEX_HTML_PATH, false);
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found — Run `npm run build` first.');
  });

  server.listen(port, host, () => {
    console.log(`[Luyện Thi IELTS Nha Trang] Production server listening at http://${host}:${port}`);
    console.log(`[Luyện Thi IELTS Nha Trang] Persistent storage: ${persistFile || 'in-memory'}`);
  });

  let shuttingDown = false;
  server.gracefulShutdown = (signal = 'SIGTERM') => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Luyện Thi IELTS Nha Trang] Graceful shutdown requested (${signal})...`);
    try {
      flushPersist?.();
    } catch {}
    for (const clientRes of sseClients) {
      try {
        clientRes.end();
      } catch {}
    }
    sseClients.clear();
    const forceTimer = setTimeout(() => process.exit(0), 2500);
    forceTimer.unref?.();
    server.close(() => {
      clearTimeout(forceTimer);
      process.exit(0);
    });
  };

  return server;
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMainModule) {
  const activeServer = createProductionServer();
  process.on('SIGTERM', () => activeServer.gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => activeServer.gracefulShutdown('SIGINT'));
  process.on('unhandledRejection', err => {
    console.error('[Luyện Thi IELTS Nha Trang] Unhandled rejection:', err);
  });
  process.on('uncaughtException', err => {
    console.error('[Luyện Thi IELTS Nha Trang] Uncaught exception:', err);
  });
}
