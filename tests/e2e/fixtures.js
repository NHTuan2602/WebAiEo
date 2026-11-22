import { test as base, expect, request as playwrightRequest } from '@playwright/test';

export const E2E_CREDENTIALS = {
  admin: { username: 'tuanpro123s', password: process.env.SUPER_ADMIN_PASS || 'E2eAdminPass123!' },
  teacher: { username: 'teacher_ielts', password: process.env.TEACHER_DEFAULT_PASS || 'E2eTeacherPass123!' },
  student: {
    username: 'e2e_student',
    password: 'E2eStudent123!',
    name: 'Nguyễn Minh Khoa (E2E)'
  },
  classId: 'e2e_class_ielts70',
  className: 'Lớp IELTS 7.0 E2E',
  fullExamId: 'test-ielts-cam-18-01'
};

/**
 * Intercept paid / external transactional APIs (Gemini AI grading/extraction & Mail/OTP)
 * so E2E tests NEVER spend real AI quota or send real emails.
 */
export async function mockExternalAndPaidApis(page) {
  await page.route('**/api/sync/grade-writing', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        source: 'mock-e2e',
        result: {
          task1Band: 7.0,
          task2Band: 7.5,
          overallBand: 7.5,
          feedback: '[MOCK AI E2E] Strong cohesion and accurate academic lexis.',
          task1Criteria: { ta: 7, cc: 7, lr: 7, gra: 7, comment: 'Clear overview and well-grouped trends.' },
          task2Criteria: { tr: 8, cc: 7, lr: 7, gra: 8, comment: 'Well-developed thesis and balanced arguments.' },
          spellingGrammarNotes: [],
          sentenceAnalysis: [],
          taskLogicCritiques: [],
          sentenceStructureUpgrades: [],
          vocabularyUpgrades: []
        }
      })
    });
  });

  await page.route('**/api/sync/grade-speaking', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        source: 'mock-e2e',
        result: {
          band: 7,
          criteria: { fc: 7, lr: 7, gra: 7, pr: 7 },
          overallFeedback: '[MOCK AI E2E] Fluent delivery with natural pronunciation.',
          questionEvaluations: []
        }
      })
    });
  });

  await page.route('**/api/sync/ai/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        source: 'mock-e2e',
        text: 'Mock Gemini response for E2E'
      })
    });
  });

  await page.route('**/api/sync/auth/forgot-password/**', async route => {
    const url = route.request().url();
    if (url.includes('/request')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          accountFound: true,
          hasVerifiedEmail: true,
          maskedEmail: 'e2***@mock.local',
          cooldownSeconds: 60,
          message: '[MOCK OTP] Mã OTP giả lập đã gửi về e2***@mock.local'
        })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, username: E2E_CREDENTIALS.student.username })
    });
  });

  await page.route('**/api/sync/mail/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, mock: true, message: '[MOCK MAIL] Sent cleanly in E2E' })
    });
  });
}

/**
 * Attach strict health listeners to a Playwright page:
 * - Uncaught JS errors (`pageerror`)
 * - Console errors (`console.error`), except explicitly scoped negative-test HTTP statuses (e.g. 401 wrong password)
 * - Any HTTP >= 500 response from the server
 */
export function attachHealthGuards(page) {
  const tracker = {
    pageErrors: [],
    consoleErrors: [],
    server500s: [],
    allowedErrorStatuses: new Set()
  };

  page.on('pageerror', err => {
    tracker.pageErrors.push(err?.stack || err?.message || String(err));
  });

  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text() || '';
    // Allow intentional browser network log when a negative test explicitly expects 401/403
    if (tracker.allowedErrorStatuses.size > 0) {
      for (const code of tracker.allowedErrorStatuses) {
        if (text.includes(String(code))) return;
      }
    }
    // Ignore non-fatal third-party CDN/font transient hiccups if offline, never ignore app/localhost errors
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(text)) return;
    tracker.consoleErrors.push(text);
  });

  page.on('response', res => {
    const status = res.status();
    const url = res.url();
    if (status >= 500 && url.startsWith('http://127.0.0.1')) {
      tracker.server500s.push(`${status} ${res.request().method()} ${url}`);
    }
  });

  return {
    tracker,
    allowExpectedHttpErrors(codes = []) {
      codes.forEach(c => tracker.allowedErrorStatuses.add(c));
    },
    clearAllowedHttpErrors() {
      tracker.allowedErrorStatuses.clear();
    },
    assertHealthy(contextLabel = 'page') {
      expect(
        tracker.pageErrors,
        `[${contextLabel}] Uncaught JS pageerror detected:\n${tracker.pageErrors.join('\n')}`
      ).toEqual([]);
      expect(
        tracker.server500s,
        `[${contextLabel}] HTTP 5xx server error detected:\n${tracker.server500s.join('\n')}`
      ).toEqual([]);
      expect(
        tracker.consoleErrors,
        `[${contextLabel}] Console error detected:\n${tracker.consoleErrors.join('\n')}`
      ).toEqual([]);
    }
  };
}

/**
 * Verify page has no horizontal layout overflow (`scrollWidth <= clientWidth`).
 */
export async function assertNoHorizontalOverflow(page, label = '') {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    dark: document.documentElement.classList.contains('dark')
  }));
  expect(
    metrics.scrollWidth,
    `Horizontal overflow (${label}, dark=${metrics.dark}): scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

/**
 * Dismiss optional student onboarding/pricing popups that open automatically after login.
 */
export async function dismissOptionalPopups(page) {
  for (let round = 0; round < 4; round += 1) {
    let dismissedAny = false;
    const pricingDialog = page.locator('[role="dialog"][aria-labelledby="real-exam-pricing-title"]');
    if (await pricingDialog.isVisible({ timeout: round === 0 ? 1500 : 300 }).catch(() => false)) {
      await pricingDialog.getByRole('button', { name: /Đóng bảng giá và combo|Để sau/i }).first().click();
      await pricingDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      dismissedAny = true;
    }
    const titleDialog = page.locator('[role="dialog"][aria-labelledby="title-unlock-celebration-heading"]');
    if (await titleDialog.isVisible({ timeout: round === 0 ? 1100 : 350 }).catch(() => false)) {
      await titleDialog.getByRole('button', { name: /Đóng thông báo danh hiệu mới|Để Sau/i }).first().click();
      await titleDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      dismissedAny = true;
    }
    const closeVipBtn = page.getByRole('button', { name: /Đóng ưu đãi/i }).first();
    if (await closeVipBtn.isVisible({ timeout: 250 }).catch(() => false)) {
      await closeVipBtn.click().catch(() => {});
      dismissedAny = true;
    }
    if (!dismissedAny) break;
  }
}

/**
 * Login through the real AuthScreen UI form.
 */
export async function loginViaUI(page, username, password) {
  await page.goto('/');
  await page.locator('#login-username').waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /Đăng Nhập Hệ Thống/i }).click();
  await page.locator('header').filter({ hasText: /IELTS Ms\. Như/i }).waitFor({ state: 'visible', timeout: 15_000 });
  await dismissOptionalPopups(page);
}

/**
 * Logout through Navbar button and wait for AuthScreen.
 */
export async function logoutViaUI(page) {
  const logoutBtn = page.locator('button[title="Đăng xuất"]').first();
  await logoutBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await logoutBtn.click();
  await page.locator('#login-username').waitFor({ state: 'visible', timeout: 12_000 });
}

/**
 * Ensure isolated local E2E server has deterministic student, class, and unlocked anti-cheat full exam.
 * Runs idempotently against 127.0.0.1 only.
 */
export async function ensureE2EBootstrap(_unusedRequest, baseURL) {
  const api = await playwrightRequest.newContext({ baseURL });
  try {
    const loginRes = await api.post('/api/sync/auth/login', {
      data: {
        username: E2E_CREDENTIALS.admin.username,
        password: E2E_CREDENTIALS.admin.password
      }
    });
    expect(loginRes.ok(), `Admin bootstrap login failed (${loginRes.status()})`).toBeTruthy();

    const stateRes = await api.get('/api/sync/state');
    expect(stateRes.ok()).toBeTruthy();
    const stateJson = await stateRes.json();

    // 1. Ensure E2E student account exists
    const existingStudent = stateJson?.users?.[E2E_CREDENTIALS.student.username];
    if (!existingStudent) {
      const upsertStu = await api.post('/api/sync/action', {
        data: {
          type: 'UPSERT_USER',
          payload: {
            username: E2E_CREDENTIALS.student.username,
            user: {
              username: E2E_CREDENTIALS.student.username,
              name: E2E_CREDENTIALS.student.name,
              role: 'student',
              pass: E2E_CREDENTIALS.student.password,
              targetBand: 7.5,
              targetListening: 8.0,
              targetReading: 8.0,
              targetWriting: 7.0,
              targetSpeaking: 7.0,
              studyGoal: 'Đạt IELTS 7.5+ mục tiêu E2E'
            }
          }
        }
      });
      expect(upsertStu.ok()).toBeTruthy();
    }

    // 2. Ensure E2E class exists with student enrolled
    const upsertCls = await api.post('/api/sync/action', {
      data: {
        type: 'UPSERT_CLASS',
        payload: {
          classObj: {
            id: E2E_CREDENTIALS.classId,
            name: E2E_CREDENTIALS.className,
            description: 'Lớp kiểm thử tự động Playwright E2E',
            studentUsernames: [E2E_CREDENTIALS.student.username]
          }
        }
      }
    });
    expect(upsertCls.ok()).toBeTruthy();

    // 3. Enable antiCheatEnabled on Cambridge 18 full exam + unlock it for E2E student
    const camTest = (stateJson?.tests || []).find(t => t.id === E2E_CREDENTIALS.fullExamId);
    expect(camTest, 'Seed full exam test-ielts-cam-18-01 must exist').toBeTruthy();

    if (!camTest.antiCheatEnabled || camTest.maxAttempts !== 0) {
      const updateExam = await api.post('/api/sync/action', {
        data: {
          type: 'UPSERT_TEST',
          payload: {
            test: {
              ...camTest,
              visibility: 'public',
              antiCheatEnabled: true,
              allowViewAnswers: true,
              sequentialMode: false,
              maxAttempts: 0
            }
          }
        }
      });
      expect(updateExam.ok()).toBeTruthy();
    }

    // Unlock full exam for student so paid-gate modals don't block E2E exam flows
    const unlockTest = await api.post('/api/sync/action', {
      data: {
        type: 'TOGGLE_USER_SUBSCRIPTION',
        payload: {
          username: E2E_CREDENTIALS.student.username,
          kind: 'test',
          testId: E2E_CREDENTIALS.fullExamId,
          active: true
        }
      }
    });
    expect(unlockTest.ok()).toBeTruthy();

    await api.post('/api/sync/auth/logout');
  } finally {
    await api.dispose();
  }
}

export async function fetchAdminSnapshot(baseURL) {
  const api = await playwrightRequest.newContext({ baseURL });
  try {
    const loginRes = await api.post('/api/sync/auth/login', {
      data: E2E_CREDENTIALS.admin
    });
    expect(loginRes.ok()).toBeTruthy();
    const snapRes = await api.get('/api/sync/state');
    expect(snapRes.ok()).toBeTruthy();
    const snap = await snapRes.json();
    await api.post('/api/sync/auth/logout');
    return snap;
  } finally {
    await api.dispose();
  }
}

/**
 * Custom Playwright test fixture that automatically:
 * 1) Mocks paid AI & email OTP APIs
 * 2) Monitors pageerror, console.error, and HTTP >= 500 on EVERY test and fails if any occur
 */
export const test = base.extend({
  healthGuard: async ({ page }, provide) => {
    await mockExternalAndPaidApis(page);
    const guard = attachHealthGuards(page);
    await provide(guard);
    guard.assertHealthy('main-page');
  }
});

export { expect };
