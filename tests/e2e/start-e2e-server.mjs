import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const DIST_INDEX = path.join(ROOT_DIR, 'dist', 'index.html');

const dataDir = process.env.E2E_DATA_DIR || path.join(ROOT_DIR, '.playwright-data');
const stateFile = process.env.SYNC_STATE_FILE || path.join(dataDir, 'e2e-sync-state.json');
const port = Number(process.env.PORT || 4179);
const host = process.env.HOST || '127.0.0.1';

// Guarantee isolated test credentials exist before importing syncPlugin.js
process.env.PORT = String(port);
process.env.HOST = host;
process.env.SYNC_STATE_FILE = stateFile;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'e2e-local-playwright-session-secret-only';
process.env.SUPER_ADMIN_PASS = process.env.SUPER_ADMIN_PASS || 'E2eAdminPass123!';
process.env.TEACHER_DEFAULT_PASS = process.env.TEACHER_DEFAULT_PASS || 'E2eTeacherPass123!';
process.env.MAINTENANCE_MODE = '0';

// Clean previous isolated test data so every run starts completely clean
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

// Ensure production dist/ bundle exists before starting local server
if (!fs.existsSync(DIST_INDEX)) {
  console.log('[E2E Server] dist/index.html missing — running `npm run build`...');
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
}

const { createProductionServer } = await import('../../server.js');

const server = createProductionServer({
  port,
  host,
  persistFile: stateFile
});

let cleanedUp = false;
const cleanupAndExit = (signal) => {
  if (cleanedUp) return;
  cleanedUp = true;
  console.log(`[E2E Server] Shutting down (${signal}) and cleaning isolated data dir...`);
  const removeData = () => {
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
    } catch {}
  };
  const forceExit = setTimeout(() => {
    removeData();
    process.exit(0);
  }, 2000);
  forceExit.unref?.();
  try {
    server.close(() => {
      clearTimeout(forceExit);
      removeData();
      process.exit(0);
    });
  } catch {
    removeData();
    process.exit(0);
  }
};

process.on('SIGINT', () => cleanupAndExit('SIGINT'));
process.on('SIGTERM', () => cleanupAndExit('SIGTERM'));
process.on('exit', () => {
  try {
    fs.rmSync(dataDir, { recursive: true, force: true });
  } catch {}
});
