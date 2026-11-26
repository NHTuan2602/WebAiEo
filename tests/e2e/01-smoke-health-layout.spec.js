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

  test('Maintenance page & preview overlay rotate non-repeating memes on F5/retry without banned copy', async ({
    page,
    baseURL,
    healthGuard
  }) => {
    // Verify /sw-offline.js caches all /memes/* fallbacks
    const swText = await (await fetch(`${baseURL}/sw-offline.js`)).text();
    expect(swText).toContain('/memes/meme-1.png');
    expect(swText).toContain('/memes/meme-6.png');

    // Visit standalone /maintenance.html and simulate F5 reload
    await page.goto('/maintenance.html');
    await expect(
      page.getByRole('heading', { name: /Máy chủ đang được bảo trì hoặc gặp sự cố tạm thời/i })
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/đái nhầm/i);

    const memeImg = page.locator('#maintenanceMemeImg');
    await expect(memeImg).toBeVisible();
    await page.waitForFunction(() => {
      const el = document.getElementById('maintenanceMemeImg');
      return Boolean(el && el.complete && el.naturalWidth > 0);
    });
    const firstMemeIdx = await memeImg.getAttribute('data-meme-idx');

    // F5 reload must pick a different meme
    await page.reload();
    await expect(memeImg).toBeVisible();
    await page.waitForFunction(() => {
      const el = document.getElementById('maintenanceMemeImg');
      return Boolean(el && el.complete && el.naturalWidth > 0);
    });
    const secondMemeIdx = await memeImg.getAttribute('data-meme-idx');
    expect(secondMemeIdx).not.toBeNull();
    expect(secondMemeIdx).not.toBe(firstMemeIdx);

    // Check React ServerMaintenanceOverlay via ?maintenance=1
    await page.goto('/?maintenance=1');
    const overlay = page.locator('[data-server-maintenance-overlay="true"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(/Máy chủ đang được bảo trì hoặc gặp sự cố tạm thời/i);
    await expect(overlay).not.toContainText(/đái nhầm/i);
    const overlayImg = overlay.locator('img[data-meme-idx]');
    await expect(overlayImg).toBeVisible();
    const overlayIdx1 = await overlayImg.getAttribute('data-meme-idx');
    await overlay.getByTestId('outage-demo-mode-server_error').click();
    await expect(overlay).toContainText(/Lỗi máy chủ/i);
    const errorIdx = await overlayImg.getAttribute('data-meme-idx');
    expect(errorIdx).not.toBe(overlayIdx1);
    await page.reload();
    await expect(overlay).toBeVisible();
    await expect(overlayImg).toBeVisible();
    const overlayIdx2 = await overlayImg.getAttribute('data-meme-idx');
    expect(overlayIdx2).not.toBeNull();
    expect(overlayIdx2).not.toBe(errorIdx);

    healthGuard.assertHealthy('smoke-maintenance-meme-rotation');
  });
});
