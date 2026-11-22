import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const E2E_PORT = Number(process.env.E2E_PORT || 4179);
const E2E_HOST = '127.0.0.1';
const E2E_BASE_URL = `http://${E2E_HOST}:${E2E_PORT}`;
const E2E_DATA_DIR = path.join(__dirname, '.playwright-data');
const E2E_STATE_FILE = path.join(E2E_DATA_DIR, 'e2e-sync-state.json');

// Safety guard: strictly forbid pointing Playwright at production Railway URL
if (/railway\.app/i.test(E2E_BASE_URL)) {
  throw new Error('Playwright E2E tests must NEVER run against Railway production!');
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.js$/,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 75_000,
  expect: {
    timeout: 12_000
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  outputDir: 'test-results',
  globalTeardown: './tests/e2e/global-teardown.mjs',
  use: {
    baseURL: E2E_BASE_URL,
    viewport: { width: 1366, height: 820 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    permissions: ['microphone'],
    actionTimeout: 15_000,
    navigationTimeout: 25_000,
    launchOptions: {
      slowMo: Number(process.env.PW_SLOWMO || 0),
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'node tests/e2e/start-e2e-server.mjs',
    url: `${E2E_BASE_URL}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(E2E_PORT),
      HOST: E2E_HOST,
      SYNC_STATE_FILE: E2E_STATE_FILE,
      E2E_DATA_DIR,
      SESSION_SECRET: 'e2e-local-playwright-session-secret-only',
      SUPER_ADMIN_PASS: 'E2eAdminPass123!',
      TEACHER_DEFAULT_PASS: 'E2eTeacherPass123!',
      MAINTENANCE_MODE: '0'
    }
  }
});
