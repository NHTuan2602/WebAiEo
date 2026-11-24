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

      // Confirm Teacher is in Lobby with PIN & Space Shooter Score Leaderboard displayed
      await expect(teacherPage.getByText(testRoomName).first()).toBeVisible({ timeout: 12_000 });
      await expect(teacherPage.getByText(testPin).first()).toBeVisible();
      await expect(teacherPage.getByTestId('space-dropship-leaderboard')).toBeVisible();
      await assertNoHorizontalOverflow(teacherPage, 'GameArena-TeacherLobby');

      // 2. Student logs in on the second BrowserContext, verifies Knight RPG locks per-stage practice for students, then joins Space Shooter Lobby by PIN + Pass
      await loginViaUI(studentPage, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
      await studentPage.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();

      await expect(studentPage.getByTestId('arena-game-selection-hub')).toBeVisible({
        timeout: 12_000
      });

      // Verify Student cannot click individual maps, sees ZERO secret boss spoilers, sees Knight Score Leaderboard, and has NO Admin Demon King button
      await studentPage.getByTestId('switch-to-knight-game-btn').click();
      await expect(studentPage.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 8_000 });
      await expect(studentPage.getByTestId('knight-lobby-leaderboard')).toBeVisible();
      await expect(studentPage.getByTestId('locked-knight-stage-4')).toBeVisible();
      await expect(studentPage.getByTestId('start-knight-stage-4')).toHaveCount(0);
      await expect(studentPage.getByTestId('admin-test-demon-king-btn')).toHaveCount(0);
      const studentHubText = await studentPage.getByTestId('knight-dragon-game-root').textContent();
      expect(studentHubText).not.toMatch(/Ma Vương|Diệt Ma Vương|1\.000 Vàng|5% triệu hồi/i);
      await studentPage.getByTestId('knight-back-to-hub-btn').click();
      await expect(studentPage.getByTestId('arena-game-selection-hub')).toBeVisible({ timeout: 8_000 });

      await studentPage.getByTestId('select-space-shooter-game-btn').click();

      await expect(studentPage.getByRole('heading', { name: /Tham Gia Phòng Đấu Từ Vựng/i })).toBeVisible({
        timeout: 12_000
      });
      await expect(studentPage.getByTestId('space-lobby-leaderboard')).toBeVisible();
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

  test('Teacher uses visual Game Question Bank editor (Add/Delete/Syn-Ant/Multi-Answer R4) and plays Round 4 typing', async ({
    page,
    healthGuard
  }) => {
    const soloPin = '554433';
    const soloPass = 'e2egame';
    const soloRoomName = 'Phòng Test Visual Bank E2E';

    await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
    await page.getByRole('button', { name: /Phòng Game PIN/i }).first().click();

    // Create a clean solo teacher room (no students -> Sandbox allowed)
    await page.getByRole('button', { name: /Tạo Phòng Mới/i }).first().click();
    const modalForm = page.locator('form').filter({ hasText: /Tạo Phòng Đấu Từ Vựng Mới/i });
    await modalForm.locator('input[placeholder*="Phòng Ôn Từ Vựng"]').fill(soloRoomName);
    await modalForm.locator('input[placeholder*="6 số ngẫu nhiên"]').fill(soloPin);
    await modalForm.locator('input[placeholder="ielts"]').fill(soloPass);
    await modalForm.getByRole('button', { name: /Tạo Phòng & Mở Lobby/i }).click();

    await expect(page.getByText(soloRoomName).first()).toBeVisible({ timeout: 12_000 });

    // Open the new Blooket/Quizizz-style visual Question Bank Editor
    await page.getByTestId('lobby-edit-vocab-btn').click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toBeVisible({ timeout: 8_000 });

    // Clear all existing items safely (2-click confirm) so Round 4 deterministically serves our exact test question
    await page.getByRole('button', { name: /Xóa hết/i }).click();
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();

    // Add 1 visual question card with Round 3 Syn/Ant + Round 4 sentence-blank + 2 accepted typing answers
    await page.getByTestId('game-bank-add-btn').click();
    await expect(page.getByTestId('game-card-editor-form')).toBeVisible();
    await page.getByTestId('card-input-word').fill('FRAMEWORK');
    await page.getByTestId('card-input-prompt').fill('khuôn khổ toàn cầu thống nhất');
    await page.getByTestId('card-input-syn').fill('STRUCTURE');
    await page.getByTestId('card-input-ant').fill('CHAOS');
    await page
      .getByTestId('card-input-v4-sentence')
      .fill('The lack of a ____________ often hinders coordinated international action.');
    await page.getByTestId('card-input-v4-answer-0').fill('unified global framework');
    await page.getByTestId('card-add-v4-answer-btn').click();
    await page.getByTestId('card-input-v4-answer-1').fill('cohesive global strategy');
    await page.getByTestId('card-save-btn').click();

    // Verify visual card renders both accepted green typing pills & Syn/Ant badges
    await expect(page.getByTestId('game-question-card-0')).toBeVisible();
    await expect(page.getByText('unified global framework').first()).toBeVisible();
    await expect(page.getByText('cohesive global strategy').first()).toBeVisible();
    await expect(page.getByText(/Đồng nghĩa: STRUCTURE/i).first()).toBeVisible();

    // Save question bank to room
    await page.getByTestId('game-bank-save-room-btn').click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toHaveCount(0);

    // Switch to the new Knight & Dragon RPG Game inside Zone Đấu Trường
    await page.getByTestId('lobby-switch-to-knight-game-btn').first().click();
    await expect(page.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 8_000 });

    // Regular Teacher (teacher_ielts) can test Stages 1-4 & toggle BGM, but CANNOT see Admin-only Secret Boss button or spoilers!
    await expect(page.getByTestId('admin-test-demon-king-btn')).toHaveCount(0);
    const teacherHubText = await page.getByTestId('knight-dragon-game-root').textContent();
    expect(teacherHubText).not.toMatch(/Ma Vương|Diệt Ma Vương|1\.000 Vàng|5% triệu hồi/i);
    const bgmBtn = page.getByTestId('knight-bgm-toggle-btn');
    await expect(bgmBtn).toBeVisible();
    await bgmBtn.click();
    await expect(bgmBtn).toContainText(/Tắt/i);
    await bgmBtn.click();
    await expect(bgmBtn).toContainText(/Nhạc:/i);

    // Teacher can open the Question Bank Manager directly from Knight & Dragon RPG
    await expect(page.getByTestId('knight-open-vocab-manager-btn')).toBeVisible();
    await page.getByTestId('knight-open-vocab-manager-btn').click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('game-vocab-bank-modal').getByRole('button', { name: /Đóng/i }).first().click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toHaveCount(0);

    // Open Character Skin Shop (10 distinct illustrated Male & Female skins + Revive Keys)
    await page.getByTestId('open-knight-shop-btn').click();
    await expect(page.getByTestId('knight-skin-shop-modal')).toBeVisible();
    await expect(page.getByText(/Nữ Chiến Binh Valkyrie Freya/i)).toBeVisible();
    await expect(page.getByText(/Thánh Kỵ Sĩ Thái Dương Leon/i)).toBeVisible();
    await expect(page.getByText(/Kiếm Sĩ Lôi Kiếm Kenji/i)).toBeVisible();
    await expect(page.getByText(/Chiến Thần Cuồng Chiến Drake/i)).toBeVisible();
    await expect
      .poll(async () =>
        page
          .getByTestId('knight-skin-shop-modal')
          .locator('img')
          .evaluateAll(imgs => imgs.filter(img => img.complete && img.naturalWidth > 0).length)
      )
      .toBeGreaterThanOrEqual(10);
    await page.getByTestId('buy-revive-key-with-gold-btn').click();
    await page.getByTestId('knight-skin-shop-modal').getByRole('button').first().click();

    // Launch Stage 3 (Golem & Dark Mage) briefly to confirm zero NaN/undefined and monster-kill key drop percentage
    await page.getByTestId('start-knight-stage-3').click();
    const lootPillS3 = page.getByTestId('knight-loot-info-pill');
    await expect(lootPillS3).toBeVisible({ timeout: 8_000 });
    const lootTextS3 = await lootPillS3.textContent();
    expect(lootTextS3).not.toMatch(/NaN|undefined|trên đường/i);
    expect(lootTextS3).toMatch(/Rớt \+\d+ Vàng/i);
    expect(lootTextS3).toMatch(/Tỉ lệ rớt Chìa Khóa: \d+%/i);

    // Return to Knight Hub and launch Stage 4 Final Dragon Boss (disable random 5% for deterministic normal Dragon check)
    await page.getByTestId('knight-back-to-hub-btn').click();
    await page.getByTestId('switch-to-knight-game-btn').click();
    await expect(page.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 8_000 });

    await page.evaluate(() => {
      window.__DISABLE_RANDOM_DEMON_KING__ = true;
      window.__FORCE_DEMON_KING__ = false;
    });

    await page.getByTestId('start-knight-stage-4').click();
    await expect(page.getByTestId('knight-dragon-boss-input')).toBeVisible({ timeout: 8_000 });

    // Confirm Hint button costs 300 points and CANNOT be clicked at 0 points
    const hintBtn = page.getByTestId('knight-hint-btn');
    await expect(hintBtn).toBeVisible();
    await expect(hintBtn).toContainText('-300đ');
    await expect(hintBtn).toBeDisabled();

    const lootTextS4 = await page.getByTestId('knight-loot-info-pill').textContent();
    expect(lootTextS4).not.toMatch(/NaN|undefined|trên đường/i);
    expect(lootTextS4).toMatch(/Rớt \+\d+ Vàng/i);

    // Trigger 3 wrong submissions to lose all 3 hearts -> verify Tombstone death animation -> 5s delay -> Revive Modal -> Holy Resurrection animation!
    for (let miss = 0; miss < 3; miss += 1) {
      await page.getByTestId('knight-dragon-boss-input').fill('wrong answer miss');
      await page.getByTestId('knight-dragon-boss-submit').click();
    }
    await expect(page.getByTestId('knight-death-countdown-overlay')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId('knight-tombstone-graphic')).toBeVisible();
    await expect(page.getByTestId('knight-revive-modal')).toHaveCount(0);

    // Wait for 5-second tombstone countdown to open Revive Modal, then revive by Key and verify Resurrection flash overlay!
    await expect(page.getByTestId('knight-revive-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('knight-revive-by-key-btn').click();
    await expect(page.getByTestId('knight-revive-animation-overlay')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId('knight-lives-display')).toContainText('❤️❤️❤️');

    await page.getByTestId('knight-dragon-boss-input').fill('cohesive global strategy');
    await page.getByTestId('knight-dragon-boss-submit').click();

    // Confirm Dragon Boss defeated -> Knight Summary Overlay appears -> return to Knight Hub
    await expect(page.getByText(/TỔNG KẾT HÀNH TRÌNH HIỆP SĨ/i)).toBeVisible({ timeout: 8_000 });
    const celebrationDialog = page.locator('[aria-labelledby="title-unlock-celebration-heading"]');
    if (await celebrationDialog.isVisible({ timeout: 1200 }).catch(() => false)) {
      await celebrationDialog.getByRole('button').first().click();
    }
    await page.getByRole('button', { name: /Về Sảnh Hiệp Sĩ/i }).click();
    await expect(page.getByTestId('knight-lobby-leaderboard')).toBeVisible();

    // Switch back to Space Shooter Arena to verify Màn 3 & Màn 4 Sandbox
    await page.getByTestId('switch-to-space-game-btn').click();

    // Launch Sandbox -> Jump to Màn 3 (verify strictly Synonym/Antonym) -> Jump to Màn 4 (verify Sentence + Typing input!)
    await page.getByRole('button', { name: /Chơi Thử GV/i }).first().click();
    await page.getByRole('button', { name: 'Màn 3', exact: true }).click();
    await expect(page.getByText(/ĐỒNG NGHĨA|TRÁI NGHĨA/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/ĐỊNH NGHĨA ANH/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'Màn 4', exact: true }).click();
    await expect(page.getByText(/The lack of a/i).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/Chấp nhận 2 đáp án tương đương/i)).toBeVisible();

    // Type the 2nd accepted answer into Round 4 typing box and submit -> Boss defeated -> VICTORY screen!
    const r4Input = page.getByTestId('game-round4-input');
    await expect(r4Input).toBeVisible();
    await r4Input.fill('cohesive global strategy');
    await page.getByTestId('game-round4-submit-btn').click();

    await expect(page.getByText(/HẠ GỤC BOSS|HOÀN THÀNH|CHIẾN THẮNG|VICTORY|TỔNG ĐIỂM/i).first()).toBeVisible({
      timeout: 10_000
    });
    healthGuard.assertHealthy('game-visual-bank-and-round4');
  });

  test('Only Super Admin (not Teacher or Student) can trigger Secret Demon King test & unlock Diệt Ma Vương', async ({
    page,
    healthGuard
  }) => {
    await loginViaUI(page, E2E_CREDENTIALS.admin.username, E2E_CREDENTIALS.admin.password);
    await page.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();
    await expect(page.getByTestId('arena-game-selection-hub')).toBeVisible({ timeout: 12_000 });
    await page.getByTestId('switch-to-knight-game-btn').click();
    await expect(page.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 8_000 });

    // Admin sees Admin-only secret test button & per-stage buttons
    await expect(page.getByTestId('admin-test-demon-king-btn')).toBeVisible();
    await expect(page.getByTestId('start-knight-stage-4')).toBeVisible();

    // Force wheel to Round 1 (4-choice meaning shields) and verify Pac-Man Warning -> 5 Hearts -> Wheel -> Stage 5 BGM & Curse Timer
    await page.evaluate(() => {
      window.__FORCE_DEMON_WHEEL_ROUND__ = 1;
    });
    await page.getByTestId('admin-test-demon-king-btn').click();
    await expect(page.getByTestId('demon-king-warning-overlay')).toBeVisible({ timeout: 4_000 });
    await expect(page.getByTestId('demon-king-wheel-overlay')).toBeVisible({ timeout: 6_000 });
    await expect(page.getByTestId('demon-curse-timer-badge')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('knight-lives-display')).toContainText('❤️❤️❤️❤️❤️');
    await expect(page.getByTestId('knight-bgm-toggle-btn')).toContainText(/Trận Chiến Ẩn/i);

    healthGuard.assertHealthy('admin-secret-demon-king-access');
  });
});
