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
      await expect(page.getByText('Định Mệnh Ma Vương 2-2')).toBeVisible();
      await expect(page.getByText('Độc Cô Cầu Bại 1v1')).toBeVisible();

      const memeFilterBtn = page.getByRole('button', { name: /Game & Meme RPG/i }).first();
      await expect(memeFilterBtn).toBeVisible();
      await memeFilterBtn.click();
      await expect(page.getByText('Nhà Sưu Tập Meme')).toBeVisible();
      await assertNoHorizontalOverflow(page, 'StudentProfile-TitlesModal');

      // Close Titles modal cleanly by clicking backdrop corner
      await page.locator('.apple-backdrop-enter').first().click({ position: { x: 8, y: 8 } });
      await expect(page.getByText('Nhà Sưu Tập Meme')).toHaveCount(0);

      // 3. Navigate to Game Arena -> Hiệp Sĩ Diệt Rồng -> 1 vs 1 Arena
      await page.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();
      await expect(page.getByTestId('arena-game-selection-hub')).toBeVisible({ timeout: 12_000 });
      await page.getByTestId('switch-to-knight-game-btn').click();
      await expect(page.getByTestId('knight-dragon-game-root')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('open-knight-pvp-btn').click();
      await expect(page.getByTestId('knight-pvp-lobby')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByTestId('knight-pvp-leaderboard')).toBeVisible();
      await assertNoHorizontalOverflow(page, 'KnightPvp-Lobby');

      // Verify zero third-party MOBA copyright terms in 1v1 Lobby
      const lobbyText = await page.getByTestId('knight-pvp-lobby').textContent();
      expect(lobbyText).not.toMatch(/Liên Minh|Huyền Thoại|\bLoL\b|Hextech|Summoner|Riot/i);

      // 4. Verify Casual 1v1 Room ("Chỉ để giải trí") creates 6-digit code & does not spawn NPC or award RP
      await page.getByTestId('knight-pvp-create-room-btn').click();
      await expect(page.getByTestId('knight-pvp-casual-room-box')).toBeVisible({ timeout: 6_000 });
      const roomCode = (await page.getByTestId('knight-pvp-room-code').textContent())?.trim() || '';
      expect(roomCode).toMatch(/^\d{6}$/);
      await page.getByRole('button', { name: /Đóng Phòng Giao Hữu/i }).click();
      await expect(page.getByTestId('knight-pvp-create-room-btn')).toBeVisible();

      // 5. Verify normal Matchmaking Queue -> spawns Rank-Scaled NPC Ready-Check after ~3s -> verify Ready Modal copy
      await page.getByTestId('knight-pvp-find-match-btn').click();
      await expect(page.getByTestId('knight-pvp-queue-box')).toBeVisible();
      await expect(page.getByTestId('knight-pvp-ready-modal')).toBeVisible({ timeout: 9_000 });

      const readyModalText = await page.getByTestId('knight-pvp-ready-modal').textContent();
      expect(readyModalText).toContain('ĐÃ TÌM THẤY ĐỐI THỦ');
      expect(readyModalText).not.toMatch(/Liên Minh|Huyền Thoại|\bLoL\b|Hextech|Summoner|Riot/i);

      // Decline once to verify clean return to lobby
      await page.getByTestId('knight-pvp-decline-btn').click();
      await expect(page.getByTestId('knight-pvp-ready-modal')).toHaveCount(0);

      // 6. Launch 2-2 Tiebreaker Match -> Ready Check -> Demon King Wheel -> 5s Freeze -> 3 Hits Win -> BXH Update!
      await page.getByTestId('knight-pvp-admin-tie22-btn').click();
      await expect(page.getByTestId('knight-pvp-ready-modal')).toBeVisible({ timeout: 8_000 });
      await page.getByTestId('knight-pvp-accept-btn').click();

      // Demon King Malakor's Wheel of Fate must appear on 2 - 2 tie
      await expect(page.getByTestId('knight-pvp-demon-wheel')).toBeVisible({ timeout: 8_000 });

      // Wait for wheel spin to finish (~2.2s) so combat begins
      await expect(page.getByTestId('knight-pvp-demon-wheel')).toHaveCount(0, { timeout: 8_000 });
      await expect(page.getByTestId('knight-pvp-round-score')).toContainText('2 – 2');

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

      // Step 6A: Trigger 1 intentional wrong answer -> verify 5-second Freeze!
      if (styleRound === 1 || styleRound === 3) {
        const q0 = pool[0];
        const rightAns = String(styleRound === 3 ? q0.v3Target : q0.word).trim().toLowerCase();
        for (let i = 0; i < 4; i += 1) {
          const btn = page.getByTestId(`knight-pvp-choice-${i}`);
          const val = String((await btn.getAttribute('data-choice-value')) || '').trim().toLowerCase();
          if (val && val !== rightAns) {
            await btn.click();
            break;
          }
        }
      } else if (styleRound === 2) {
        const q0 = pool[0];
        const firstLetter = String(q0.word || 'A')[0].toUpperCase();
        const wrongLetter = firstLetter === 'Z' ? 'X' : 'Z';
        await page.getByTestId(`knight-pvp-key-${wrongLetter}`).click();
      } else {
        await page.getByTestId('knight-pvp-round4-input').fill('wrong_answer_freeze_test');
        await page.getByTestId('knight-pvp-round4-submit').click();
      }

      await expect(page.getByTestId('knight-pvp-freeze-banner')).toBeVisible({ timeout: 3_000 });
      // Wait for 5-second freeze to thaw
      await expect(page.getByTestId('knight-pvp-freeze-banner')).toHaveCount(0, { timeout: 7_500 });

      // Step 6B: Land 3 correct strikes to defeat opponent's 3 lives and win 3 - 2!
      for (let strike = 0; strike < 6; strike += 1) {
        if (await page.getByTestId('knight-pvp-result-panel').isVisible().catch(() => false)) {
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
            if (val === rightAns) {
              await btn.click();
              break;
            }
          }
        } else if (styleRound === 2) {
          const wordUpper = String(curQ.word || '').toUpperCase();
          for (const ch of wordUpper) {
            if (/^[A-Z]$/.test(ch)) {
              await page.getByTestId(`knight-pvp-key-${ch}`).click();
            }
          }
        } else {
          const ans =
            (Array.isArray(curQ.v4Answers) && curQ.v4Answers[0]) ||
            curQ.v4Display ||
            curQ.collocation ||
            curQ.word;
          await page.getByTestId('knight-pvp-round4-input').fill(ans);
          await page.getByTestId('knight-pvp-round4-submit').click();
        }
        await page.waitForTimeout(250);
      }

      await expect(page.getByTestId('knight-pvp-result-panel')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('knight-pvp-rp-delta')).toContainText('+');

      // Return to 1v1 Lobby & verify 1v1 Leaderboard updated with TOP 1 & RP > 0
      await page.getByTestId('knight-pvp-return-lobby-btn').click();
      await expect(page.getByTestId('knight-pvp-lobby')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByTestId('knight-pvp-leaderboard')).toContainText('TOP 1');

      // 7. Server Anti-Cheat check: student cannot forge KNIGHT_PVP_FINISH_NPC_MATCH without valid active match
      const stuLogin = await studentApi.post('/api/sync/auth/login', {
        data: {
          username: E2E_CREDENTIALS.student.username,
          password: E2E_CREDENTIALS.student.password
        }
      });
      expect(stuLogin.status()).toBe(200);
      await studentApi.post('/api/sync/action', {
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
