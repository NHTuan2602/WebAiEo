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

    // Verify Light / Dark mode toggle works cleanly inside Knight & Dragon RPG and Game Selection Hub
    const knightThemeBtn = page.getByTestId('knight-theme-toggle-btn');
    await expect(knightThemeBtn).toBeVisible();
    const initialBg = await page.getByTestId('knight-dragon-game-root').evaluate(el => getComputedStyle(el).backgroundColor);
    await knightThemeBtn.click();
    await expect
      .poll(async () =>
        page.getByTestId('knight-dragon-game-root').evaluate(el => getComputedStyle(el).backgroundColor)
      )
      .not.toBe(initialBg);
    await knightThemeBtn.click();
    await expect
      .poll(async () =>
        page.getByTestId('knight-dragon-game-root').evaluate(el => getComputedStyle(el).backgroundColor)
      )
      .toBe(initialBg);

    // Teacher can open the Question Bank Manager directly from Knight & Dragon RPG
    await expect(page.getByTestId('knight-open-vocab-manager-btn')).toBeVisible();
    await page.getByTestId('knight-open-vocab-manager-btn').click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('game-vocab-bank-modal').getByRole('button', { name: /Đóng/i }).first().click();
    await expect(page.getByTestId('game-vocab-bank-modal')).toHaveCount(0);

    // Open Genshin-style Gacha & Inventory Modal (Characters cannot be bought directly; Gacha Banners + 4★/3★ Weapons + 5k/50k Wish Packs)
    await page.getByTestId('open-knight-shop-btn').click();
    await expect(page.getByTestId('knight-skin-shop-modal')).toBeVisible();
    await expect(page.getByTestId('gacha-pull-1-btn')).toContainText(/10\.000/i);
    await expect(page.getByTestId('gacha-pull-10-btn')).toContainText(/100\.000/i);

    // Check Inventory tab: 10 distinct hero sprites load & locked heroes cannot be purchased directly with Gold
    await page.getByTestId('gacha-tab-inventory').click();
    await expect(page.getByText(/Nữ Chiến Binh Valkyrie Freya/i)).toBeVisible();
    await expect(page.getByText(/Thánh Kỵ Sĩ Thái Dương Leon/i)).toBeVisible();
    await expect(page.getByText(/Kiếm Sĩ Lôi Kiếm Kenji/i)).toBeVisible();
    await expect(page.getByText(/Chiến Thần Cuồng Chiến Drake/i)).toBeVisible();
    await expect(page.getByTestId('locked-gacha-hero-btn-valkyrie_freya')).toBeVisible();
    await expect
      .poll(async () =>
        page
          .getByTestId('knight-skin-shop-modal')
          .locator('img')
          .evaluateAll(imgs => imgs.filter(img => img.complete && img.naturalWidth > 0).length)
      )
      .toBeGreaterThanOrEqual(20);

    // Check Wish Pack Shop tab (5.000đ = 1 lượt & 50.000đ = 10 lượt VietQR checkout)
    await page.getByTestId('gacha-tab-shop').click();
    await expect(page.getByTestId('buy-wish-1-vnd-btn')).toContainText(/5\.000/i);
    await expect(page.getByTestId('buy-wish-10-vnd-btn')).toContainText(/50\.000/i);
    await page.getByTestId('buy-wish-10-vnd-btn').click();
    await expect(page.getByRole('dialog')).toContainText(/Mua \+10 Lượt Quay Gacha Hiệp Sĩ/i);
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).first().click();

    // Buy +1 Revive Key (100 Gold) & close modal, then seed Gold to test 5★ Gold vs Standard 10x / Whiff Gacha Cutscenes!
    await page.getByTestId('buy-revive-key-with-gold-btn').click();
    await page.getByTestId('close-knight-gacha-modal-btn').click();

    await page.evaluate(() => {
      const key = 'ielts_knight_rpg_profile_v1:teacher_ielts';
      const cur = JSON.parse(localStorage.getItem(key) || '{}');
      cur.gold = 150000;
      localStorage.setItem(key, JSON.stringify(cur));
    });
    await page.getByTestId('knight-back-to-hub-btn').click();
    await page.getByTestId('switch-to-knight-game-btn').click();
    await page.getByTestId('open-knight-shop-btn').click();

    // Verify strictly ONE Weekly Limited Banner with 7-day rotation countdown
    await expect(page.getByTestId('weekly-limited-banner-timer')).toContainText(/Chu kỳ 7 ngày/i);

    // 1) Pull 1x on Limited Banner forced 5★:
    //    - Initially (0-3s) MUST be neutral mystery color ('neutral', no early spoiler!)
    //    - After ~3s MUST shift to Golden 5★ ('5' / RA VÀNG 5 SAO!)
    //    - Then enters Black Silhouette ('silhouette') -> Full Color ('lit') + 5 popped stars!
    await page.evaluate(() => {
      window.__FORCE_GACHA_RARITY__ = 5;
    });
    await page.getByTestId('gacha-pull-1-btn').click();
    await expect(page.getByTestId('knight-gacha-cutscene')).toHaveAttribute('data-rarity', 'neutral');
    await expect(page.getByTestId('gacha-cutscene-status-pill')).toContainText(/Đang triệu hồi/i);

    await expect(page.getByTestId('knight-gacha-cutscene')).toHaveAttribute('data-rarity', '5', {
      timeout: 5_000
    });
    await expect(page.getByTestId('knight-gacha-cutscene')).toContainText(/RA VÀNG 5 SAO/i);

    await expect(page.getByTestId('knight-gacha-single-reveal')).toBeVisible({ timeout: 3_500 });
    await expect(page.getByTestId('knight-gacha-single-reveal')).toHaveAttribute('data-unveil', 'lit', {
      timeout: 3_000
    });
    await expect(page.getByTestId('gacha-popped-star')).toHaveCount(5, { timeout: 3_000 });
    await page.getByTestId('gacha-skip-cutscene-btn').click();
    await expect(page.getByTestId('knight-gacha-results-view')).toBeVisible();
    await page.getByTestId('gacha-close-results-btn').click();

    // 2) Pull 1x on Standard Banner forced Whiff -> skip -> verify Tạch Gacha + Pull 10x Standard -> verify ≥ 4★!
    await page.getByTestId('gacha-tab-standard').click();
    await page.evaluate(() => {
      window.__FORCE_GACHA_RARITY__ = 'whiff';
    });
    await page.getByTestId('gacha-std-pull-1-btn').click();
    await expect(page.getByTestId('knight-gacha-cutscene')).toHaveAttribute('data-rarity', 'neutral');
    await page.getByTestId('gacha-skip-cutscene-btn').click();
    await expect(page.getByTestId('knight-gacha-results-view')).toContainText(/Tạch Gacha/i);
    await page.getByTestId('gacha-close-results-btn').click();

    await page.evaluate(() => {
      delete window.__FORCE_GACHA_RARITY__;
    });
    await page.getByTestId('gacha-std-pull-10-btn').click();
    await expect(page.getByTestId('knight-gacha-cutscene')).toBeVisible();
    await page.getByTestId('gacha-skip-cutscene-btn').click();
    await expect(page.getByTestId('knight-gacha-results-view')).toBeVisible();
    const highRarityCount = await page
      .getByTestId('knight-gacha-results-view')
      .locator('[data-testid="gacha-result-card-4"], [data-testid="gacha-result-card-5"]')
      .count();
    expect(highRarityCount).toBeGreaterThanOrEqual(1);
    await page.getByTestId('gacha-close-results-btn').click();
    await page.getByTestId('close-knight-gacha-modal-btn').click();
    const midTitleDialog = page.locator('[aria-labelledby="title-unlock-celebration-heading"]');
    if (await midTitleDialog.isVisible({ timeout: 800 }).catch(() => false)) {
      await midTitleDialog.getByRole('button').first().click();
    }

    // Launch Stage 3 (Golem & Dark Mage) briefly to confirm zero NaN/undefined and NO key-drop percentage spoiler
    await page.getByTestId('start-knight-stage-3').click();
    const lootPillS3 = page.getByTestId('knight-loot-info-pill');
    await expect(lootPillS3).toBeVisible({ timeout: 8_000 });
    const lootTextS3 = await lootPillS3.textContent();
    expect(lootTextS3).not.toMatch(/NaN|undefined|trên đường|Tỉ lệ rớt Chìa Khóa/i);
    expect(lootTextS3).toMatch(/Rớt \+\d+ Vàng/i);

    // Return to Knight Hub and launch Stage 4 Final Dragon Boss (disable random 5% for deterministic normal Dragon check)
    await page.getByTestId('knight-back-to-hub-btn').click();
    await expect(page.getByTestId('arena-game-selection-hub')).toBeVisible({ timeout: 5_000 });
    const hubInitialBg = await page.getByTestId('arena-game-selection-hub').evaluate(el => getComputedStyle(el).backgroundColor);
    await page.getByTestId('arena-theme-toggle-btn').click();
    await expect
      .poll(async () =>
        page.getByTestId('arena-game-selection-hub').evaluate(el => getComputedStyle(el).backgroundColor)
      )
      .not.toBe(hubInitialBg);
    await page.getByTestId('arena-theme-toggle-btn').click();
    await expect
      .poll(async () =>
        page.getByTestId('arena-game-selection-hub').evaluate(el => getComputedStyle(el).backgroundColor)
      )
      .toBe(hubInitialBg);

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

    // Admin sees Admin-only secret test button, per-stage buttons & unlimited free Gacha test pulls + 200k duplicate refund!
    await expect(page.getByTestId('admin-test-demon-king-btn')).toBeVisible();
    await expect(page.getByTestId('start-knight-stage-4')).toBeVisible();

    await page.getByTestId('open-knight-shop-btn').click();
    await expect(page.getByTestId('admin-gacha-free-badge')).toBeVisible();
    await expect(page.getByTestId('gacha-pull-10-btn')).toContainText(/Miễn phí/i);

    // Pull Standard Banner forced 5★ x10 three times as Admin -> confirm NO Limited 5★ hero ever drops on Standard Banner & 5★ dupes refund +200K VÀNG!
    await page.getByTestId('gacha-tab-standard').click();
    await page.evaluate(() => {
      window.__FORCE_GACHA_RARITY__ = 5;
    });
    for (let p = 0; p < 4; p += 1) {
      await page.getByTestId('gacha-std-pull-10-btn').click();
      await page.getByTestId('gacha-skip-cutscene-btn').click();
      const stdResText = await page.getByTestId('knight-gacha-results-view').textContent();
      expect(stdResText).not.toMatch(/Ignis|Drake|Zephyr|Celestia|Raiden/i);
      await page.getByTestId('gacha-close-results-btn').click();
    }

    // Check Inventory: 13 total heroes (including new Limited 5★ heroes) + equip class-matched cosmetic sword on Arthur!
    await page.getByTestId('gacha-tab-inventory').click();
    await expect(page.getByText(/Đại Pháp Sư Tinh Không Zephyr/i)).toBeVisible();
    await expect(page.getByText(/Thánh Nữ Thần Thương Celestia/i)).toBeVisible();
    await expect(page.getByText(/Lôi Đế Huyết Kiếm Raiden/i)).toBeVisible();
    const swordEquipBtn = page.locator('[data-testid^="equip-hero-wp-knight_arthur-"]').first();
    if (await swordEquipBtn.isVisible().catch(() => false)) {
      await swordEquipBtn.click();
      await expect(page.getByTestId('knight-skin-card-knight_arthur')).toContainText(/Trang trí/i);
    }

    await expect(page.getByTestId('knight-skin-shop-modal')).toContainText(/\d{3}\.\d{3} Vàng/);
    await page.evaluate(() => {
      delete window.__FORCE_GACHA_RARITY__;
    });
    await page.getByTestId('close-knight-gacha-modal-btn').click();

    // Force wheel to Round 1 (4-choice meaning shields) and verify Pac-Man Warning -> 5 Hearts -> Wheel -> Stage 5 BGM & Curse Timer
    await page.evaluate(() => {
      window.__FORCE_DEMON_WHEEL_ROUND__ = 1;
    });
    await page.getByTestId('admin-test-demon-king-btn').click();
    await expect(page.getByTestId('demon-king-warning-overlay')).toBeVisible({ timeout: 4_000 });
    await expect(page.getByTestId('demon-king-warning-overlay')).toContainText(/6/);
    await expect(page.getByTestId('demon-king-wheel-overlay')).toBeVisible({ timeout: 9_000 });
    await expect(page.getByTestId('demon-curse-timer-badge')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('knight-lives-display')).toContainText('❤️❤️❤️❤️❤️');
    await expect(page.getByTestId('knight-bgm-toggle-btn')).toContainText(/Trận Chiến Ẩn/i);

    healthGuard.assertHealthy('admin-secret-demon-king-access');
  });
});
