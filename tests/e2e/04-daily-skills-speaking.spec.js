import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  loginViaUI,
  dismissOptionalPopups,
  assertNoHorizontalOverflow
} from './fixtures.js';

test.describe('4. Daily 4-Skill Practice & Speaking Room (Mocked Paid APIs)', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Student completes Daily Reading, Listening, Writing, and Speaking room with fake mic and mocked AI APIs', async ({
    page,
    healthGuard
  }) => {
    let realGeminiCalled = false;
    page.on('request', req => {
      if (/generativelanguage\.googleapis\.com/i.test(req.url())) {
        realGeminiCalled = true;
      }
    });

    await loginViaUI(page, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);

    // Go to Daily Zone via Navbar
    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await expect(page.getByText(/DAILY ZONE/i).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'SkillPracticeHub-Speaking');

    // --- 4A. Daily Reading ---
    await page.locator('aside').getByRole('button', { name: /Đọc \(SHW/i }).first().click();
    await assertNoHorizontalOverflow(page, 'SkillPracticeHub-Reading');

    const startReadingBtn = page
      .getByRole('button', { name: /Làm Bài|Bắt Đầu|Tiếp Tục/i })
      .first();
    await expect(startReadingBtn).toBeVisible();
    await startReadingBtn.click();

    await expect(page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first()).toBeVisible();
    // Fill first visible text input or radio in reading exercise
    const readingTextInput = page.locator('main input[type="text"]').first();
    if (await readingTextInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await readingTextInput.fill('sample');
    } else {
      const firstRadio = page.locator('main input[type="radio"], main label').first();
      if (await firstRadio.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstRadio.click();
      }
    }
    await page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first().click();
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();
    await expect(page.getByText(/Band|Reading/i).first()).toBeVisible({ timeout: 15_000 });
    await dismissOptionalPopups(page);

    // --- 4B. Daily Listening ---
    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await page.locator('aside').getByRole('button', { name: /Nghe \(SHW/i }).first().click();

    const startListeningBtn = page
      .getByRole('button', { name: /Làm Bài|Bắt Đầu|Tiếp Tục/i })
      .first();
    await expect(startListeningBtn).toBeVisible();
    await startListeningBtn.click();

    await expect(page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first()).toBeVisible();
    const listeningInput = page.locator('main input[type="text"]').first();
    if (await listeningInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listeningInput.fill('test');
    }
    await page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first().click();
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();
    await expect(page.getByText(/Band|Listening/i).first()).toBeVisible({ timeout: 15_000 });
    await dismissOptionalPopups(page);

    // --- 4C. Daily Writing Task 1 ---
    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await page.locator('aside').getByRole('button', { name: /Viết Task 1/i }).first().click();

    const startWritingBtn = page
      .getByRole('button', { name: /Làm Bài|Bắt Đầu|Tiếp Tục/i })
      .first();
    await expect(startWritingBtn).toBeVisible();
    await startWritingBtn.click();

    const essayTextarea = page.locator('textarea').first();
    await expect(essayTextarea).toBeVisible();
    await essayTextarea.fill(
      'The diagram demonstrates the key stages of solar desalination from seawater intake to purified drinking water distribution across coastal communities.'
    );
    await page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first().click();
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();
    await expect(page.getByText(/Writing|Ms\. Như đang check|Chờ/i).first()).toBeVisible({ timeout: 15_000 });
    await dismissOptionalPopups(page);

    // --- 4D. Daily Speaking Room (SpeakingExamRoom.jsx with fake mic) ---
    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await page.locator('aside').getByRole('button', { name: /1\. Daily Speaking/i }).first().click();

    // Start from Speaking Drive folder or Daily Speaking test card
    const openFirstSpeakingFolder = page.getByRole('button', { name: /Mở thư mục/i }).first();
    if (await openFirstSpeakingFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await openFirstSpeakingFolder.click();
      const startDriveSpeakingBtn = page.getByRole('button', { name: /Bắt đầu luyện Topic này/i }).first();
      await expect(startDriveSpeakingBtn).toBeVisible();
      await startDriveSpeakingBtn.click();
    } else {
      const speakingStartBtn = page
        .getByRole('button', { name: /Làm Full Test|Bắt Đầu|Luyện Nói|Part 1/i })
        .first();
      await expect(speakingStartBtn).toBeVisible();
      await speakingStartBtn.click();
    }

    // Mic check phase using Chromium fake audio device (zero permission prompt hang)
    await expect(page.getByRole('heading', { name: /Kiểm Tra Micro Trước Khi Nói/i })).toBeVisible({
      timeout: 12_000
    });
    await page.getByRole('button', { name: /Bấm Kiểm Tra Micro/i }).click();
    await expect(page.getByText(/Micro Đã Sẵn Sàng|Micro đang thu tín hiệu tốt/i).first()).toBeVisible({
      timeout: 10_000
    });

    // Enter Active Speaking Interview stage
    await page.getByRole('button', { name: /Bắt Đầu Thi Speaking Ngay/i }).click();
    await expect(page.getByRole('button', { name: /Bắt Đầu Trả Lời & Ghi Âm/i })).toBeVisible();

    // Record audio for ~1.3s using fake mic stream and stop
    await page.getByRole('button', { name: /Bắt Đầu Trả Lời & Ghi Âm/i }).click();
    const stopRecBtn = page.getByRole('button', { name: /Dừng Ghi Âm Câu Này/i });
    await expect(stopRecBtn).toBeVisible();
    await page.waitForTimeout(1300);
    await stopRecBtn.click();

    await expect(page.getByText(/Đã thu âm câu này/i)).toBeVisible({ timeout: 10_000 });

    // Submit Speaking recording
    await page.getByRole('button', { name: /Nộp Bài & Chấm AI/i }).first().click();
    await expect(page.getByText(/Xác nhận nộp bài Speaking/i)).toBeVisible();
    await page.getByRole('button', { name: /Nộp & Chấm Ngay/i }).click();

    // Confirm Speaking Celebration screen appears
    await expect(page.getByRole('button', { name: /Xem Kết Quả|Quay Về|Xem Điểm/i }).first()).toBeVisible({
      timeout: 20_000
    });

    expect(realGeminiCalled, 'Real external Gemini API must NEVER be called during E2E').toBe(false);
    healthGuard.assertHealthy('daily-skills-and-speaking');
  });
});
