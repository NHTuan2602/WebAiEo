import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachSyncMiddleware, createPersistentSyncStore } from './syncPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
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

/** Stream a static file response with appropriate caching and MIME headers. */
function sendStaticFile(res, filePath, isAsset) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  res.setHeader(
    'Cache-Control',
    isAsset ? 'public, max-age=31536000, immutable' : 'no-store'
  );
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
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ ok: true, version: store.version, uptime: Math.round(process.uptime()) }));
      return;
    }

    const syncHandler = middlewares.find(m => pathname === m.route || pathname.startsWith(m.route + '/'));
    if (syncHandler) {
      req.originalUrl = rawUrl;
      req.url = rawUrl.slice(syncHandler.route.length) || '/';
      syncHandler.fn(req, res, () => {
        res.statusCode = 404;
        res.end(JSON.stringify({ ok: false, error: 'Not found' }));
      });
      return;
    }

    const targetPath = resolveStaticAssetPath(pathname);
    if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      sendStaticFile(res, targetPath, pathname.startsWith('/assets/'));
      return;
    }

    if (!path.extname(pathname) && fs.existsSync(INDEX_HTML_PATH)) {
      sendStaticFile(res, INDEX_HTML_PATH, false);
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
