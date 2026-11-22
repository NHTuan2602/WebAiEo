import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../.playwright-data');

export default async function globalTeardown() {
  // Best-effort cleanup of isolated E2E test state directory after tests complete
  try {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  } catch {
    // On Windows, webServer teardown happens right after globalTeardown; start-e2e-server.mjs also cleans on startup/exit.
  }
}
