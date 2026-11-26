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
import { DEFAULT_VOCAB_TEXT } from '../../src/constants/seedData.js';
import { buildPracticeRoundQueues } from '../../src/utils/examHelpers.js';

test.describe('8. Admin/Teacher UI Polish, Titles System & Knight 1v1 PvP Arena', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Admin Accounts Table & Titles Modal render cleanly, and Knight 1v1 Matchmaking, 5s Freeze, 2-2 Demon Wheel & 1v1 BXH work end-to-end', async ({
    browser,
    playwright,
    baseURL
  }) => {
    test.setTimeout(120_000);

    const context = await browser.newContext({
      viewport: { width: 1366, height: 820 }
    });
    const page = await context.newPage();
    await mockExternalAndPaidApis(page);
    const guard = attachHealthGuards(page);

    const studentApi = await playwright.request.newContext({ baseURL });

    try {
      // 1. Login as SuperAdmin & verify Accounts Table UI fixes
      await loginViaUI(page, E2E_CREDENTIALS.admin.username, E2E_CREDENTIALS.admin.password);
      await page.getByRole('button', { name: /Tài Khoản Lớp/i }).first().click();

      await expect(page.getByText(/Tạo & Quản Lý Tài Khoản Hệ Thống/i)).toBeVisible({
        timeout: 12_000
      });
      await assertNoHorizontalOverflow(page, 'AdminDashboard-AccountsTable');

      // SuperAdmin's own row must NOT render "+ Cấp IELTS VIP (30 ngày)" button
      const adminRow = page.locator('tr').filter({ hasText: `@${E2E_CREDENTIALS.admin.username}` }).first();
      await expect(adminRow).toBeVisible();
      await expect(adminRow.getByRole('button', { name: /Cấp IELTS VIP/i })).toHaveCount(0);

      // 2. Open Profile & verify Bảng Danh Hiệu has 1v1 & Meme RPG tabs + updated Meme & 1v1 titles
      await adminRow.getByRole('button', { name: /Hồ sơ/i }).click();
      const openTitlesBtn = page.getByRole('button', { name: /Danh Hiệu\s*\(/i }).first();
      await expect(openTitlesBtn).toBeVisible({ timeout: 10_000 });
      await openTitlesBtn.click();

      const pvpFilterBtn = page.getByRole('button', { name: /Đối Kháng 1v1/i }).first();
      await expect(pvpFilterBtn).toBeVisible({ timeout: 8_000 });
      await pvpFilterBtn.click();

      await expect(page.getByText('Chiến Binh Khởi Đầu 1v1')).toBeVisible();
      await expect(page.getByText('Bậc Thầy Đóng Băng 1v1')).toBeVisible();
      await expect(page.getByText('Cao Thủ Song Đấu 1v1')).toBeVisible();
      await expect(page.getByText('Định Mệnh Sinh Tử 2-2')).toBeVisible();
      await expect(page.getByText('Độc Cô Cầu Bại 1v1')).toBeVisible();

      const memeFilterBtn = page.getByRole('button', { name: /Game & Meme RPG/i }).first();
      await expect(memeFilterBtn).toBeVisible();
      await memeFilterBtn.click();
      await expect(page.getByText('Nhà Sưu Tập Meme')).toBeVisible();
      await assertNoHorizontalOverflow(page, 'StudentProfile-TitlesModal');

      // Close Titles modal cleanly by clicking backdrop corner
      await page.locator('.apple-backdrop-enter').first().click({ position: { x: 8, y: 8 } });
      await expect(page.getByText('Nhà Sưu Tập Meme')).toHaveCount(0);

      // 3. Navigate to Game Arena -> Hiệp Sĩ Diệt Rồng -> Verify Redesigned HUD, Admin 41/41 Auto-Unlock, Dedicated Character Page & Full-Page Meme Gacha!
      await page.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();
      await expect(page.getByTestId('arena-game-selection-hub')).toBeVisible({ timeout: 12_000 });
      await page.getByTestId('switch-to-knight-game-btn').click();
      await expect(page.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 10_000 });

      // Admin MUST automatically have all 41/41 heroes unlocked forever
      await expect(page.getByTestId('open-knight-characters-btn')).toContainText('41/41');
      await page.getByTestId('open-knight-characters-btn').click();
      await expect(page.getByTestId('knight-characters-page')).toBeVisible();
      await expect(page.getByTestId('knight-bgm-toggle-btn')).toContainText(/Sảnh Nhân Vật/i);
      await expect(page.getByText('Bộ Trưởng Ngoại Giao Capybara Đội Quýt')).toBeVisible();
      await expect(page.getByText('Gấu Mèo Pedro Xoay Vòng Disco')).toBeVisible();
      await expect(page.getByText('Quý Ông Lạnh Lùng Nhíu Mày Sigma')).toBeVisible();

      // Switch to Full-Page Meme Gacha -> verify zero weapon/footer clutter & 3★ Tạch Gacha +500 Vàng with BGM stopped during cutscene
      await page.getByTestId('open-knight-shop-btn').click();
      await expect(page.getByTestId('knight-skin-shop-modal')).toBeVisible();
      const gachaPageTxt = (await page.getByTestId('knight-skin-shop-modal').textContent()) || '';
      expect(gachaPageTxt).not.toContain('Vũ khí dùng trang trí theo Hệ');

      await page.evaluate(() => {
        window.__FORCE_GACHA_RARITY__ = 3;
      });
      await page.getByTestId('gacha-pull-1-btn').click();
      await expect(page.getByTestId('knight-gacha-cutscene')).toBeVisible();
      await page.getByTestId('gacha-skip-cutscene-btn').click();
      await expect(page.getByTestId('knight-gacha-results-view')).toContainText(/Tạch Gacha/i);
      await expect(page.getByTestId('knight-gacha-results-view')).toContainText(/\+500/i);
      await page.getByTestId('gacha-close-results-btn').click();
      await page.evaluate(() => {
        delete window.__FORCE_GACHA_RARITY__;
      });
      await page.getByTestId('close-knight-gacha-modal-btn').click();

      // 4. Open 1 vs 1 Arena -> Verify distinct PvP BGM, ZERO "NPC" clue, ZERO "Ma Vương" spoiler, & ZERO MOBA branding
      await page.getByTestId('open-knight-pvp-btn').click();
      await expect(page.getByTestId('knight-pvp-lobby')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByTestId('knight-bgm-toggle-btn')).toContainText(/Đấu Trường 1 vs 1/i);
      await expect(page.getByTestId('knight-pvp-leaderboard')).toBeVisible();
      await assertNoHorizontalOverflow(page, 'KnightPvp-Lobby');

      const lobbyText = (await page.getByTestId('knight-pvp-lobby').textContent()) || '';
      expect(lobbyText).not.toMatch(/Liên Minh|Huyền Thoại|\bLoL\b|Hextech|Summoner|Riot|\bNPC\b|Ma Vương|Malakor/i);

      // 4. Verify Casual 1v1 Room ("Chỉ để giải trí") creates 6-digit code & does not spawn NPC or award RP
      await page.getByTestId('knight-pvp-create-room-btn').click();
      await expect(page.getByTestId('knight-pvp-casual-room-box')).toBeVisible({ timeout: 6_000 });
      const roomCode = (await page.getByTestId('knight-pvp-room-code').textContent())?.trim() || '';
      expect(roomCode).toMatch(/^\d{6}$/);
      await page.getByRole('button', { name: /Đóng Phòng Giao Hữu/i }).click();
      await expect(page.getByTestId('knight-pvp-create-room-btn')).toBeVisible();

      // 5. Verify normal Matchmaking Queue -> Ready Check -> 3-2-1 Ready Countdown -> 10s Thunder Timer -> Slow-Mo KO -> 3-2-1 Round 2!
      await page.getByTestId('knight-pvp-find-match-btn').click();
      await expect(page.getByTestId('knight-pvp-queue-box')).toBeVisible();
      await expect(page.getByTestId('knight-pvp-ready-modal')).toBeVisible({ timeout: 9_000 });

      const readyModalText = await page.getByTestId('knight-pvp-ready-modal').textContent();
      expect(readyModalText).toContain('ĐÃ TÌM THẤY ĐỐI THỦ');
      expect(readyModalText).not.toMatch(/Liên Minh|Huyền Thoại|\bLoL\b|Hextech|Summoner|Riot/i);

      // Accept Round 1 -> MUST show 3 - 2 - 1 Ready Countdown before combat starts!
      await page.getByTestId('knight-pvp-accept-btn').click();
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toContainText(/VÒNG 1/i);
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toHaveCount(0, { timeout: 6_000 });

      // Default Divine Punishment clock MUST start at 10s
      await expect(page.getByTestId('knight-pvp-thunder-timer')).toContainText(/Thiên Phạt Sấm Sét:\s*(9|10)s/i);

      // Fetch Round 1 seed & defeat opponent's 3 hearts -> verify Slow-Motion KO -> 3-2-1 into Round 2!
      const r1StateJson = await page.evaluate(async () => {
        const r = await fetch('/api/sync/state');
        return r.json();
      });
      const r1Match = r1StateJson?.knightPvpRealtime?.activeMatch;
      expect(r1Match).toBeTruthy();
      const r1Queues = buildPracticeRoundQueues({
        rawVocab: DEFAULT_VOCAB_TEXT,
        roundSize: 18,
        seedStr: r1Match.seed
      });
      const r1Pool = r1Queues[1];

      for (let hit = 0; hit < 4; hit += 1) {
        if (await page.getByTestId('knight-pvp-slowmo-ko').isVisible().catch(() => false)) {
          break;
        }
        const screenTxt = (await page.getByTestId('knight-pvp-combat-screen').textContent()) || '';
        const qMatch = screenTxt.match(/Câu #(\d+)/);
        const qIdx = qMatch ? Math.max(0, Number(qMatch[1]) - 1) : hit;
        const curQ = r1Pool[qIdx % r1Pool.length];
        const rightAns = String(curQ.word || '').trim().toLowerCase();
        for (let i = 0; i < 4; i += 1) {
          const btn = page.getByTestId(`knight-pvp-choice-${i}`);
          const val = String((await btn.getAttribute('data-choice-value')) || '').trim().toLowerCase();
          if (val === rightAns) {
            await btn.click();
            break;
          }
        }
        await page.waitForTimeout(120);
      }

      // Finishing blow of Round 1 MUST trigger Slow-Motion KO, then 3-2-1 Ready Countdown for Round 2!
      await expect(page.getByTestId('knight-pvp-slowmo-ko')).toBeVisible({ timeout: 4_000 });
      await expect(page.getByTestId('knight-pvp-slowmo-ko')).toContainText(/SLOW MOTION/i);
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toContainText(/VÒNG 2/i);
      await expect(page.getByTestId('knight-pvp-round-score')).toContainText('1 – 0');

      // Leave Round 2 match to test 2-2 Tiebreaker + Divine Lightning Smite + 5s Freeze + Match Finish
      await page.getByRole('button', { name: /Rời trận/i }).click();
      await expect(page.getByTestId('knight-pvp-lobby')).toBeVisible({ timeout: 8_000 });

      // 6. Launch 2-2 Tiebreaker Match -> Wheel -> 3-2-1 Countdown -> Thunder Smite (-1 ❤️ both) -> 5s Freeze -> Slow-Mo KO Win!
      await page.evaluate(() => {
        window.__PVP_THUNDER_TIMEOUT_MS__ = 1800;
      });
      await page.getByTestId('knight-pvp-admin-tie22-btn').click();
      await expect(page.getByTestId('knight-pvp-ready-modal')).toBeVisible({ timeout: 8_000 });
      await page.getByTestId('knight-pvp-accept-btn').click();

      // Mysterious Entity's Wheel of Fate must appear on 2 - 2 tie WITHOUT spoiling Ma Vương!
      await expect(page.getByTestId('knight-pvp-demon-wheel')).toBeVisible({ timeout: 8_000 });
      const wheelModalTxt = (await page.getByTestId('knight-pvp-demon-wheel').textContent()) || '';
      expect(wheelModalTxt).toContain('Thực Thể Bí Ẩn');
      expect(wheelModalTxt).not.toMatch(/Ma Vương|Malakor|\bNPC\b/i);

      // Wait for wheel spin to finish (~2.2s) -> MUST show 3-2-1 Countdown for Vòng Quyết Định!
      await expect(page.getByTestId('knight-pvp-demon-wheel')).toHaveCount(0, { timeout: 8_000 });
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('knight-pvp-countdown-overlay')).toHaveCount(0, { timeout: 6_000 });

      await expect(page.getByTestId('knight-pvp-round-score')).toContainText('2 – 2');
      await expect(page.getByTestId('knight-bgm-toggle-btn')).toContainText(/Quyết Đấu 1 vs 1/i);
      await expect(page.getByTestId('knight-pvp-battle-canvas')).toBeVisible();
      const combatTxt = (await page.getByTestId('knight-pvp-combat-screen').textContent()) || '';
      expect(combatTxt).not.toMatch(/\bNPC\b|Ma Vương|Malakor/i);

      // Do not answer Question #1 -> Divine Punishment Lightning strikes BOTH fighters (-1 ❤️ each) and advances to Câu #2!
      await expect(page.getByTestId('knight-pvp-combat-screen')).toContainText(/THIÊN PHẠT/i, {
        timeout: 4_500
      });
      await expect(page.getByTestId('knight-pvp-combat-screen')).toContainText(/Câu #2/);
      await page.evaluate(() => {
        delete window.__PVP_THUNDER_TIMEOUT_MS__;
      });

      // Fetch active match seed & demonRoundType from session state to verify deterministic shared queue
      const stateJson = await page.evaluate(async () => {
        const r = await fetch('/api/sync/state');
        return r.json();
      });
      const activeMatch = stateJson?.knightPvpRealtime?.activeMatch;
      expect(activeMatch).toBeTruthy();
      const styleRound = Number(activeMatch.demonRoundType) || 1;
      const sharedQueues = buildPracticeRoundQueues({
        rawVocab: DEFAULT_VOCAB_TEXT,
        roundSize: 18,
        seedStr: activeMatch.seed
      });
      const pool = sharedQueues[styleRound] || sharedQueues[1];

      // Step 6A: Trigger 1 intentional wrong answer on current question -> verify 5-second Freeze!
      const preFreezeTxt = (await page.getByTestId('knight-pvp-combat-screen').textContent()) || '';
      const preFreezeMatch = preFreezeTxt.match(/Câu #(\d+)/);
      const freezeQIdx = preFreezeMatch ? Math.max(0, Number(preFreezeMatch[1]) - 1) : 1;
      const freezeQ = pool[freezeQIdx % pool.length];
      if (styleRound === 1 || styleRound === 3) {
        const rightAns = String(styleRound === 3 ? freezeQ.v3Target : freezeQ.word).trim().toLowerCase();
        for (let i = 0; i < 4; i += 1) {
          const btn = page.getByTestId(`knight-pvp-choice-${i}`);
          const val = String((await btn.getAttribute('data-choice-value')) || '').trim().toLowerCase();
          if (val && val !== rightAns) {
            await btn.click();
            break;
          }
        }
      } else if (styleRound === 2) {
        const firstLetter = String(freezeQ.word || 'A')[0].toUpperCase();
        const wrongLetter = firstLetter === 'Z' ? 'X' : 'Z';
        await page.getByTestId(`knight-pvp-key-${wrongLetter}`).click();
      } else {
        await page.getByTestId('knight-pvp-round4-input').fill('wrong_answer_freeze_test');
        await page.getByTestId('knight-pvp-round4-submit').click();
      }

      await expect(page.getByTestId('knight-pvp-freeze-banner')).toBeVisible({ timeout: 3_000 });
      // Wait for 5-second freeze to thaw
      await expect(page.getByTestId('knight-pvp-freeze-banner')).toHaveCount(0, { timeout: 7_500 });

      // Step 6B: Land remaining correct strikes to defeat opponent -> Slow-Motion KO -> win 3 - 2!
      for (let strike = 0; strike < 6; strike += 1) {
        if (
          (await page.getByTestId('knight-pvp-slowmo-ko').isVisible().catch(() => false)) ||
          (await page.getByTestId('knight-pvp-result-panel').isVisible().catch(() => false))
        ) {
          break;
        }
        // Read current question index from UI header "Câu #X"
        const bodyTxt = (await page.getByTestId('knight-pvp-combat-screen').textContent()) || '';
        const m = bodyTxt.match(/Câu #(\d+)/);
        const curIdx = m ? Math.max(0, Number(m[1]) - 1) : strike;
        const curQ = pool[curIdx % pool.length];

        if (styleRound === 1 || styleRound === 3) {
          const rightAns = String(styleRound === 3 ? curQ.v3Target : curQ.word).trim().toLowerCase();
          for (let i = 0; i < 4; i += 1) {
            const btn = page.getByTestId(`knight-pvp-choice-${i}`);
            const val = String((await btn.getAttribute('data-choice-value')) || '').trim().toLowerCase();
            if (val === rightAns && (await btn.isEnabled().catch(() => false))) {
              await btn.click();
              break;
            }
          }
        } else if (styleRound === 2) {
          const wordAttr = (await page.getByTestId('knight-pvp-target-word').getAttribute('data-word').catch(() => '')) || curQ.word || '';
          const wordUpper = String(wordAttr).toUpperCase();
          for (const ch of wordUpper) {
            if (!/^[A-Z]$/.test(ch)) continue;
            const liveWord = (await page.getByTestId('knight-pvp-target-word').getAttribute('data-word').catch(() => '')) || '';
            if (liveWord.toUpperCase() !== wordUpper) break;
            const keyBtn = page.getByTestId(`knight-pvp-key-${ch}`);
            if (!(await keyBtn.isEnabled().catch(() => false))) break;
            await keyBtn.click();
          }
        } else {
          const ans =
            (Array.isArray(curQ.v4Answers) && curQ.v4Answers[0]) ||
            curQ.v4Display ||
            curQ.collocation ||
            curQ.word;
          const inp = page.getByTestId('knight-pvp-round4-input');
          if (await inp.isEnabled().catch(() => false)) {
            await inp.fill(ans);
            await page.getByTestId('knight-pvp-round4-submit').click();
          }
        }
        await page.waitForTimeout(220);
      }

      await expect(page.getByTestId('knight-pvp-result-panel')).toBeVisible({ timeout: 12_000 });
      await expect(page.getByTestId('knight-pvp-rp-delta')).toContainText('+');

      // Return to 1v1 Lobby & verify 1v1 Leaderboard updated with TOP 1 & RP > 0
      await page.getByTestId('knight-pvp-return-lobby-btn').click();
      await expect(page.getByTestId('knight-pvp-lobby')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByTestId('knight-pvp-leaderboard')).toContainText('TOP 1');

      // 7. Server 20.000đ Monthly Pass Gate & Anti-Cheat check: unpaid student gets HTTP 403 on Knight PvP & Knight RPG score sync!
      const stuLogin = await studentApi.post('/api/sync/auth/login', {
        data: {
          username: E2E_CREDENTIALS.student.username,
          password: E2E_CREDENTIALS.student.password
        }
      });
      expect(stuLogin.status()).toBe(200);
      const unpaidPvpRes = await studentApi.post('/api/sync/action', {
        data: {
          type: 'KNIGHT_PVP_FIND_MATCH',
          payload: { topicId: 'core', topicLabel: 'IELTS Core' }
        }
      });
      expect(unpaidPvpRes.status()).toBe(403);

      const unpaidFinishRes = await studentApi.post('/api/sync/action', {
        data: {
          type: 'KNIGHT_PVP_FINISH_NPC_MATCH',
          payload: {
            matchId: 'forged_match_999',
            p1RoundsWon: 4,
            p2RoundsWon: 0,
            totalCorrectHits: 12
          }
        }
      });
      expect(unpaidFinishRes.status()).toBe(403);
      const stuSnap = await (await studentApi.get('/api/sync/state')).json();
      const stuPvp = stuSnap?.users?.[E2E_CREDENTIALS.student.username]?.knightPvpProfile;
      expect(Number(stuPvp?.rp) || 0).toBe(0);

      guard.assertHealthy('Admin UI + Titles + Knight 1v1 PvP');
    } finally {
      await studentApi.dispose();
      await context.close();
    }
  });
});
