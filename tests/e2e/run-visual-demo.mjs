import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const PW_CLI = path.join(ROOT_DIR, 'node_modules', '@playwright', 'test', 'cli.js');
const DATA_DIR = path.join(ROOT_DIR, '.playwright-data');

const extraArgs = process.argv.slice(2);

const child = spawn(
  process.execPath,
  [PW_CLI, 'test', '--headed', '--workers=1', ...extraArgs],
  {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      PW_SLOWMO: process.env.PW_SLOWMO || '240'
    }
  }
);

child.on('exit', code => {
  // Ensure isolated test data directory is removed after webServer exits on Windows
  try {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  } catch {}
  process.exit(code ?? 0);
});
