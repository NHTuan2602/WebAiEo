import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  loginViaUI,
  logoutViaUI
} from './fixtures.js';

test.describe('2. Authentication Flow (AuthScreen)', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Shows clear error on wrong password and succeeds for Student, Teacher, and Admin', async ({
    page,
    healthGuard
  }) => {
    await page.goto('/');
    await expect(page.locator('#login-username')).toBeVisible();

    // 1. Negative test: wrong password -> expect error notice (allow expected 401 console network entry)
    healthGuard.allowExpectedHttpErrors([401]);
    await page.locator('#login-username').fill(E2E_CREDENTIALS.student.username);
    await page.locator('#login-password').fill('WrongPassword_E2E_999!');
    await page.getByRole('button', { name: /Đăng Nhập Hệ Thống/i }).click();

    await expect(page.getByText(/Sai tên đăng nhập hoặc mật khẩu|không đúng|Kiểm tra lại Caps Lock/i).first()).toBeVisible();
    healthGuard.clearAllowedHttpErrors();

    // 2. Positive Student login
    await loginViaUI(page, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
    await expect(page.getByText(E2E_CREDENTIALS.student.name).first()).toBeVisible();
    await expect(page.locator('header').getByText('Học viên').first()).toBeVisible();
    await logoutViaUI(page);

    // 3. Positive Teacher login
    await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();
    await expect(page.locator('header').getByText('Quản Trị GV').first()).toBeVisible();
    await logoutViaUI(page);

    // 4. Positive Super Admin login
    await loginViaUI(page, E2E_CREDENTIALS.admin.username, E2E_CREDENTIALS.admin.password);
    await expect(page.locator('header').getByText('ADMIN').first()).toBeVisible();
    await logoutViaUI(page);

    healthGuard.assertHealthy('auth-flow');
  });
});
