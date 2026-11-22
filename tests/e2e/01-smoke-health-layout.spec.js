import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  loginViaUI,
  logoutViaUI,
  assertNoHorizontalOverflow
} from './fixtures.js';

test.describe('1. Smoke, Health & Light/Dark Layout Integrity', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Local server health, Auth screen Light/Dark layout, and mocked Forgot Password OTP', async ({
    page,
    baseURL,
    healthGuard
  }) => {
    // Verify strictly local target
    expect(baseURL).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const healthRes = await fetch(`${baseURL}/health`);
    expect(healthRes.status).toBe(200);
    const healthJson = await healthRes.json();
    expect(healthJson.ok).toBe(true);

    // Visit AuthScreen
    await page.goto('/');
    await expect(page.locator('#login-username')).toBeVisible();

    // Check Light Mode layout
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDarkInitially) {
      await page.locator('header button[title*="Chuyển sang giao diện"]').click();
    }
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await assertNoHorizontalOverflow(page, 'AuthScreen-Light');

    // Toggle to Dark Mode and check layout
    await page.locator('header button[title*="Chuyển sang giao diện"]').click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await assertNoHorizontalOverflow(page, 'AuthScreen-Dark');

    // Toggle back to Light Mode
    await page.locator('header button[title*="Chuyển sang giao diện"]').click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);

    // Verify Forgot Password OTP uses mocked route (0 real email sent)
    await page.getByRole('button', { name: /Quên mật khẩu\?/i }).click();
    await page.locator('#forgot-username').fill(E2E_CREDENTIALS.student.username);
    await page.getByRole('button', { name: /Gửi Mã Xác Minh OTP/i }).click();
    await expect(page.getByText(/e2\*\*\*@mock\.local/i)).toBeVisible();
    await page.getByRole('button', { name: /Quay lại Đăng nhập/i }).click();

    healthGuard.assertHealthy('smoke-auth');
  });

  test('Student Home & Teacher Dashboard have zero horizontal overflow in Light and Dark Mode', async ({
    page,
    healthGuard
  }) => {
    // Student Home check
    await loginViaUI(page, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertNoHorizontalOverflow(page, 'StudentHome-Light');

    const navThemeBtn = page.locator('header button[title*="Chuyển sang giao diện"]').first();
    await navThemeBtn.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await assertNoHorizontalOverflow(page, 'StudentHome-Dark');

    await navThemeBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await logoutViaUI(page);

    // Teacher Dashboard check
    await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();
    await assertNoHorizontalOverflow(page, 'TeacherDashboard-Light');

    await navThemeBtn.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await assertNoHorizontalOverflow(page, 'TeacherDashboard-Dark');

    await navThemeBtn.click();
    await logoutViaUI(page);

    healthGuard.assertHealthy('smoke-student-teacher-layout');
  });
});
