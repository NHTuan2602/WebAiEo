import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  mockExternalAndPaidApis,
  attachHealthGuards,
  loginViaUI,
  assertNoHorizontalOverflow
} from './fixtures.js';

test.describe('5. Game Arena Multiplayer Sync (2 Separate BrowserContexts)', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Teacher creates PIN room and Student in separate BrowserContext joins Lobby with realtime sync', async ({
    browser,
    baseURL
  }) => {
    const teacherContext = await browser.newContext({
      viewport: { width: 1366, height: 820 },
      permissions: ['microphone']
    });
    const studentContext = await browser.newContext({
      viewport: { width: 1366, height: 820 },
      permissions: ['microphone']
    });

    const teacherPage = await teacherContext.newPage();
    const studentPage = await studentContext.newPage();

    await mockExternalAndPaidApis(teacherPage);
    await mockExternalAndPaidApis(studentPage);
    const teacherGuard = attachHealthGuards(teacherPage);
    const studentGuard = attachHealthGuards(studentPage);

    const testPin = '778899';
    const testPass = 'e2epass';
    const testRoomName = 'Phòng Đấu E2E Live';

    try {
      // 1. Teacher logs in and opens Phòng Game PIN
      await loginViaUI(teacherPage, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
      await teacherPage.getByRole('button', { name: /Phòng Game PIN/i }).first().click();

      // Open Create Room modal and create deterministic PIN room
      await teacherPage.getByRole('button', { name: /Tạo Phòng Mới/i }).first().click();
      await expect(teacherPage.getByText(/Tạo Phòng Đấu Từ Vựng Mới/i)).toBeVisible();

      const modalForm = teacherPage.locator('form').filter({ hasText: /Tạo Phòng Đấu Từ Vựng Mới/i });
      await modalForm.locator('input[placeholder*="Phòng Ôn Từ Vựng"]').fill(testRoomName);
      await modalForm.locator('input[placeholder*="6 số ngẫu nhiên"]').fill(testPin);
      await modalForm.locator('input[placeholder="ielts"]').fill(testPass);
      await modalForm.getByRole('button', { name: /Tạo Phòng & Mở Lobby/i }).click();

      // Confirm Teacher is in Lobby with PIN displayed
      await expect(teacherPage.getByText(testRoomName).first()).toBeVisible({ timeout: 12_000 });
      await expect(teacherPage.getByText(testPin).first()).toBeVisible();
      await assertNoHorizontalOverflow(teacherPage, 'GameArena-TeacherLobby');

      // 2. Student logs in on the second BrowserContext and joins by PIN + Pass
      await loginViaUI(studentPage, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
      await studentPage.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();

      await expect(studentPage.getByRole('heading', { name: /Tham Gia Phòng Đấu Từ Vựng/i })).toBeVisible({
        timeout: 12_000
      });
      await studentPage.locator('input[placeholder*="686868"]').fill(testPin);
      await studentPage.locator('input[placeholder*="Nhập mật khẩu phòng"]').fill(testPass);
      await studentPage.getByRole('button', { name: /VÀO SẢNH CHỜ NGAY/i }).click();

      // 3. Confirm Student entered Lobby cleanly
      await expect(studentPage.getByText(testRoomName).first()).toBeVisible({ timeout: 12_000 });
      await expect(studentPage.getByRole('button', { name: /Rời Sảnh/i })).toBeVisible();
      await assertNoHorizontalOverflow(studentPage, 'GameArena-StudentLobby');

      // 4. Confirm Teacher's Lobby synced Student's presence in realtime!
      await expect(teacherPage.getByText(E2E_CREDENTIALS.student.name).first()).toBeVisible({
        timeout: 15_000
      });

      // Verify Student can send lobby chat and Teacher receives it
      const chatInput = studentPage.locator('input[placeholder*="Nhắn tin"], input[placeholder*="chat"]').first();
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const msg = 'Hello Teacher from E2E Student!';
        await chatInput.fill(msg);
        await chatInput.press('Enter');
        await expect(teacherPage.getByText(msg).first()).toBeVisible({ timeout: 12_000 });
      }

      // Clean health check on BOTH BrowserContexts
      teacherGuard.assertHealthy('game-arena-teacher-context');
      studentGuard.assertHealthy('game-arena-student-context');
    } finally {
      await teacherContext.close();
      await studentContext.close();
    }
  });
});
