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
    await expect(page.getByText(/Hoàn Thành Bài Thi/i).first()).toBeVisible({ timeout: 15_000 });
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
    await expect(page.getByText(/Hoàn Thành Bài Thi/i).first()).toBeVisible({ timeout: 15_000 });
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
    await expect(page.getByText(/Hoàn Thành Bài Thi/i).first()).toBeVisible({ timeout: 15_000 });
    await dismissOptionalPopups(page);

    // --- 4D. Daily Speaking Room (SpeakingExamRoom.jsx with fake mic) ---
    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await page.locator('aside').getByRole('button', { name: /Cày Forecast/i }).first().click();

    // Start from Speaking Drive folder or Daily Speaking test card
    let expectedDriveQuestionSnippet = '';
    const openFirstSpeakingFolder = page.getByRole('button', { name: /Mở thư mục/i }).first();
    if (await openFirstSpeakingFolder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await openFirstSpeakingFolder.click();
      // Grab the first real question displayed inside this Speaking Drive topic folder
      const firstQCard = page.locator('div.grid > div').filter({ hasText: /\?/ }).first();
      if (await firstQCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const rawTxt = (await firstQCard.innerText()).replace(/^\d+\s*/, '').trim();
        expectedDriveQuestionSnippet = rawTxt.slice(0, 32);
      }
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

    // Regression guard: Speaking Drive MUST render the selected folder's actual questions, NEVER fallback Hometown!
    if (expectedDriveQuestionSnippet) {
      await expect(page.getByText(expectedDriveQuestionSnippet, { exact: false }).first()).toBeVisible({
        timeout: 8_000
      });
      await expect(page.getByText(/Where is your hometown and what do you like most/i)).toHaveCount(0);
    }

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

  test('Daily Reading immediately shows server-graded score on submit and auto-recalculates when teacher adds answer keys later', async ({
    page,
    request,
    baseURL,
    healthGuard
  }) => {
    const testId = `test-e2e-reading-rescore-${Date.now()}`;
    const q1Id = `rq_rescore_1_${Date.now()}`;
    const q2Id = `rq_rescore_2_${Date.now()}`;

    // 1. Teacher creates a Daily Reading exercise where Q1 initially has NO answer key yet
    const loginRes = await request.post(`${baseURL}/api/sync/auth/login`, {
      data: {
        username: E2E_CREDENTIALS.teacher.username,
        password: E2E_CREDENTIALS.teacher.password
      }
    });
    expect(loginRes.ok()).toBeTruthy();

    const baseReadingTest = {
      id: testId,
      title: 'E2E Daily Reading Rescore Check',
      description: 'Verify immediate grading and automatic rescore when keys are updated.',
      createdAt: '2026-11-23',
      testMode: 'single_skill',
      focusSkill: 'reading',
      examCategory: 'daily_zone',
      dailySubCategory: 'shw_1',
      visibility: 'public',
      maxAttempts: 0,
      sequentialMode: false,
      allowEarlyNextSection: true,
      antiCheatEnabled: false,
      allowViewAnswers: true,
      sectionOrder: ['reading'],
      sectionDurations: { listening: 15, reading: 20, writing: 30, speaking: 12 },
      reading: {
        passageTitle: 'Giraffe Research Passage',
        passageText: 'The amount of research on giraffes in their natural environment has increased significantly in recent years.',
        passages: [
          {
            id: `p_${Date.now()}`,
            title: 'Giraffe Research Passage',
            passageText: 'The amount of research on giraffes in their natural environment has increased significantly in recent years.',
            clozeText: ''
          }
        ],
        questions: [
          {
            id: q1Id,
            type: 'tfng',
            passageIdx: 0,
            questionNumber: 1,
            question: '1. The amount of research on giraffes in their natural environment has increased lately.',
            options: ['TRUE', 'FALSE', 'NOT GIVEN'],
            correctAnswer: ''
          },
          {
            id: q2Id,
            type: 'tfng',
            passageIdx: 0,
            questionNumber: 2,
            question: '2. Giraffes live exclusively in polar climates.',
            options: ['TRUE', 'FALSE', 'NOT GIVEN'],
            correctAnswer: 'FALSE'
          }
        ]
      }
    };

    const createRes = await request.post(`${baseURL}/api/sync/action`, {
      data: { type: 'UPSERT_TEST', payload: { test: baseReadingTest } }
    });
    expect(createRes.ok()).toBeTruthy();

    try {
      // 2. Student logs in, opens the new Daily Reading test, answers Q1 = TRUE, submits
      await loginViaUI(page, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
      await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
      await page.locator('aside').getByRole('button', { name: /Đọc \(SHW/i }).first().click();

      const targetCard = page.locator('div', { hasText: 'E2E Daily Reading Rescore Check' }).filter({
        has: page.getByRole('button', { name: /Làm Bài|Bắt Đầu|Tiếp Tục/i })
      }).last();
      await expect(targetCard).toBeVisible({ timeout: 10_000 });
      await targetCard.getByRole('button', { name: /Làm Bài|Bắt Đầu|Tiếp Tục/i }).first().click();

      await expect(page.getByText(/The amount of research on giraffes/i).first()).toBeVisible({ timeout: 10_000 });
      await page.locator(`input[name$="_q_${q1Id}"][value="TRUE"]`).check();
      await page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first().click();
      await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();

      await expect(page.getByText('0/2 câu')).toBeVisible({ timeout: 15_000 });
      await dismissOptionalPopups(page);

      // 3. Teacher adds the missing Answer Key for Q1 ("T" shorthand -> normalized / matched to TRUE)
      const updatedReadingTest = {
        ...baseReadingTest,
        reading: {
          ...baseReadingTest.reading,
          questions: baseReadingTest.reading.questions.map(q =>
            q.id === q1Id ? { ...q, correctAnswer: 'TRUE' } : q
          )
        }
      };
      const updateRes = await request.post(`${baseURL}/api/sync/action`, {
        data: { type: 'UPSERT_TEST', payload: { test: updatedReadingTest } }
      });
      expect(updateRes.ok()).toBeTruthy();

      // 4. Existing attempt must automatically recalculate to 1/2 câu and Band 5.5 (NOT 0!)
      await expect(page.getByText('1/2 câu')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/BAND READING/i).locator('..').getByText('5.5')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Chính xác').first()).toBeVisible();
      await dismissOptionalPopups(page);

      // 5. Retry attempt #2 (answer keys already exist on server, stripped on student client before submit):
      //    Must immediately display 1/2 câu & Band 5.5 right after submit (never stuck at 0/2!)
      await page.getByRole('button', { name: /Làm Lại Bài Này/i }).click();
      await expect(page.getByText(/The amount of research on giraffes/i).first()).toBeVisible({ timeout: 10_000 });
      await page.locator(`input[name$="_q_${q1Id}"][value="TRUE"]`).check();
      await page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first().click();
      await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();

      await expect(page.getByText('1/2 câu')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/BAND READING/i).locator('..').getByText('5.5')).toBeVisible({ timeout: 10_000 });
      healthGuard.assertHealthy('daily-reading-rescore');
    } finally {
      // Clean up temporary test and its attempts from E2E store
      const stateRes = await request.get(`${baseURL}/api/sync/state`);
      if (stateRes.ok()) {
        const snap = await stateRes.json();
        const createdAttempts = (snap?.attempts || []).filter(a => a?.testId === testId);
        for (const att of createdAttempts) {
          await request.post(`${baseURL}/api/sync/action`, {
            data: { type: 'DELETE_ATTEMPT', payload: { attemptId: att.id } }
          });
        }
      }
      await request.post(`${baseURL}/api/sync/action`, {
        data: { type: 'DELETE_TEST', payload: { testId } }
      });
    }
  });

  test('Teacher bulk-creates Daily Writing Task 1 (per-folder images) and Task 2 (multi-prompt PDF) with AI noun-phrase titles, 20p/40p, public & unlimited retries', async ({
    page,
    browser,
    request,
    baseURL,
    healthGuard
  }) => {
    // Helper to build a minimal valid multi-line PDF buffer containing numbered Task 2 prompts
    function buildMinimalPdfBuffer(lines = []) {
      const escapedLines = lines.map(l =>
        String(l).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      );
      let streamBody = 'BT\n/F1 11 Tf\n50 760 Td\n';
      escapedLines.forEach((txt, idx) => {
        if (idx > 0) streamBody += '0 -18 Td\n';
        streamBody += `(${txt}) Tj\n`;
      });
      streamBody += 'ET\n';

      const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(streamBody, 'utf8')} >>\nstream\n${streamBody}endstream\nendobj\n`
      ];

      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
      }
      const xrefOffset = Buffer.byteLength(pdf, 'utf8');
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i < offsets.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
      }
      pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
      return Buffer.from(pdf, 'utf8');
    }

    // 1x1 valid PNG buffer for Task 1 chart upload
    const tinyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const createdBulkTestIds = [];

    // Mock server AI generate endpoint so E2E exercises full AI JSON response path deterministically
    await page.route('**/api/sync/ai/generate', async route => {
      const postData = route.request().postDataJSON?.() || {};
      const pText = String(postData.promptText || '');
      if (pText.includes('Writing Task 1 image/page')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            usedModel: 'mock-gemini-vision',
            parsed: {
              nounTitle: 'Spatial transformation of Bankside Cultural Complex',
              prompt:
                'The map below shows the layout of Bankside Cultural Complex. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
              subCategory: 'w1_map',
              isPureChartImage: true,
              chartBox: null
            }
          })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          usedModel: 'mock-gemini-classifier',
          parsed: {
            items: [
              {
                i: 0,
                title: 'The enforcement of compulsory education until the age of eighteen',
                topic: 'education',
                type: 'agree_disagree'
              },
              {
                i: 1,
                title: 'The decline in bicycle usage and promotion of urban cycling',
                topic: 'transport',
                type: 'reason_problem_solution'
              },
              {
                i: 2,
                title: 'Government financial assistance for painters, musicians and poets',
                topic: 'art_music',
                type: 'both_views'
              }
            ]
          }
        })
      });
    });

    try {
      const setupLogin = await request.post(`${baseURL}/api/sync/auth/login`, {
        data: {
          username: E2E_CREDENTIALS.teacher.username,
          password: E2E_CREDENTIALS.teacher.password
        }
      });
      expect(setupLogin.ok()).toBeTruthy();
      await request.post(`${baseURL}/api/sync/action`, {
        data: { type: 'SET_AI_CONFIG', payload: { geminiApiKey: 'mock-e2e-server-key' } }
      });

      await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
      await page.evaluate(() => {
        localStorage.removeItem('ielts_gemini_api_key');
      });

      // Navigate to Daily Zone -> Viết Task 1 (W1)
      await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
      await expect(page.getByTestId('daily-zone-set-all-private-btn')).toBeVisible();
      await page.locator('aside').getByRole('button', { name: /Viết Task 1/i }).first().click();

      // Verify each Task 1 folder card has its own "+ AI Hàng Loạt" button
      await expect(page.getByTestId('w1-folder-bulk-ai-w1_map')).toBeVisible();
      await expect(page.getByTestId('w1-folder-bulk-ai-w1_process')).toBeVisible();
      await expect(page.getByTestId('w1-folder-bulk-ai-w1_dynamic')).toBeVisible();
      await expect(page.getByTestId('w1-folder-bulk-ai-w1_static')).toBeVisible();

      // Click "+ AI Hàng Loạt" directly on Map folder -> opens modal pre-locked to w1_map
      await page.getByTestId('w1-folder-bulk-ai-w1_map').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toBeVisible();
      await page.getByTestId('daily-writing-bulk-modal').getByRole('button', { name: 'Đóng' }).first().click();

      // Also verify the header button right beside "+ Tạo Bài W1" after selecting Map folder
      await expect(page.getByTestId('open-bulk-w1-ai-btn')).toContainText(/Map/i);
      await page.getByTestId('open-bulk-w1-ai-btn').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toBeVisible();

      // Upload 2 Task 1 chart images at once
      await page.getByTestId('bulk-w1-file-input').setInputFiles([
        { name: 'map-chart-1.png', mimeType: 'image/png', buffer: tinyPngBuffer },
        { name: 'map-chart-2.png', mimeType: 'image/png', buffer: tinyPngBuffer }
      ]);
      await page.getByTestId('run-bulk-w1-ai-btn').click();

      await expect(page.getByTestId('bulk-w1-draft-card-0')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('bulk-w1-draft-card-1')).toBeVisible();

      await page.getByTestId('confirm-save-bulk-w1-btn').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toHaveCount(0);

      // Verify new Task 1 cards appear inside Map folder with 20p and Làm lại nhiều lần
      await expect(page.getByText('Spatial transformation of Bankside Cultural Complex').first()).toBeVisible({
        timeout: 10_000
      });
      await expect(page.getByText(/Map • 20p/i).first()).toBeVisible();

      // Switch to Viết Task 2 (W2) and click "Tạo Đề Task 2 Nhanh (AI PDF)" beside "+ Tạo Bài W2"
      await page.locator('aside').getByRole('button', { name: /Viết Task 2/i }).first().click();
      const bulkW2Btn = page.getByTestId('open-bulk-w2-ai-btn');
      await expect(bulkW2Btn).toBeVisible();
      await bulkW2Btn.click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toBeVisible();

      // Upload a PDF containing numbered Task 2 prompts (including wrapped lines & stray vocab note)
      const sampleTask2Pdf = buildMinimalPdfBuffer([
        'pass a tipping point => render any remedial action futile',
        '1. Everyone should stay at school until the age of 18. Agree/disagree?',
        '2. In many countries, people are choosing other means of transport',
        'rather than bicycles. Why is this happening? What can be done to encourage cycling?',
        '3. Some people think that the government should provide assistance to artists.',
        'However, other people think this is a waste of money. Discuss both views and give your own opinion.'
      ]);

      await page.getByTestId('bulk-w2-pdf-input').setInputFiles([
        { name: '350-task2-forecast.pdf', mimeType: 'application/pdf', buffer: sampleTask2Pdf }
      ]);
      await page.getByTestId('run-bulk-w2-ai-btn').click();

      await expect(page.getByTestId('bulk-w2-draft-row-0')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('bulk-w2-draft-row-1')).toBeVisible();
      await expect(page.getByTestId('bulk-w2-draft-row-2')).toBeVisible();

      await page.getByTestId('confirm-save-bulk-w2-btn').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toHaveCount(0);

      // Verify Task 2 noun-phrase title, Education topic, Agree / Disagree type, 40p, and Làm lại nhiều lần
      await expect(
        page.getByText('The enforcement of compulsory education until the age of eighteen').first()
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/Writing Task 2 \(Essay\) • 40p/i).first()).toBeVisible();

      // Collect created bulk test IDs from server state & verify Student can access them publicly
      const teacherLogin = await request.post(`${baseURL}/api/sync/auth/login`, {
        data: {
          username: E2E_CREDENTIALS.teacher.username,
          password: E2E_CREDENTIALS.teacher.password
        }
      });
      expect(teacherLogin.ok()).toBeTruthy();
      const snapRes = await request.get(`${baseURL}/api/sync/state`);
      const snap = await snapRes.json();
      (snap?.tests || []).forEach(t => {
        if (String(t?.id || '').startsWith('test-w1-bulk-') || String(t?.id || '').startsWith('test-w2-bulk-')) {
          createdBulkTestIds.push(t.id);
        }
      });
      expect(createdBulkTestIds.length).toBe(5);

      // Student context verifies public visibility, 40p duration, Education filter, and unlimited retries
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      try {
        await loginViaUI(studentPage, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);
        await studentPage.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
        await studentPage.locator('aside').getByRole('button', { name: /Viết Task 2/i }).first().click();
        await studentPage.getByRole('button', { name: /^Education \(\d+\)$/i }).click();
        await studentPage.getByRole('button', { name: /^Agree \/ Disagree \(\d+\)$/i }).click();
        await expect(
          studentPage.getByText('The enforcement of compulsory education until the age of eighteen').first()
        ).toBeVisible({ timeout: 10_000 });
        await expect(studentPage.getByText(/Làm lại nhiều lần/i).first()).toBeVisible();
      } finally {
        await studentContext.close();
      }

      healthGuard.assertHealthy('daily-writing-bulk-ai');
    } finally {
      await request.post(`${baseURL}/api/sync/auth/login`, {
        data: {
          username: E2E_CREDENTIALS.teacher.username,
          password: E2E_CREDENTIALS.teacher.password
        }
      });
      await request.post(`${baseURL}/api/sync/action`, {
        data: { type: 'SET_AI_CONFIG', payload: { geminiApiKey: '' } }
      });
      const snapRes = await request.get(`${baseURL}/api/sync/state`);
      if (snapRes.ok()) {
        const snap = await snapRes.json();
        const toDelete = (snap?.tests || [])
          .map(t => t?.id)
          .filter(id => String(id || '').startsWith('test-w1-bulk-') || String(id || '').startsWith('test-w2-bulk-'));
        for (const id of toDelete) {
          await request.post(`${baseURL}/api/sync/action`, {
            data: { type: 'DELETE_TEST', payload: { testId: id } }
          });
        }
      }
    }
  });

  test('Teacher bulk-uploads a Google Drive .zip containing Word (.docx) files across DYNAMIC CHART & MAP subfolders with embedded chart PNGs', async ({
    page,
    request,
    baseURL,
    healthGuard
  }) => {
    // Pure JS ZIP builder (Stored method 0) so we can construct real .docx and nested Google Drive .zip archives in E2E
    function buildStoredZip(entries = []) {
      const localParts = [];
      const cdParts = [];
      let offset = 0;

      for (const entry of entries) {
        const nameBuf = Buffer.from(entry.name, 'utf8');
        const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data || ''), 'utf8');

        // Minimal CRC32 table computation
        let crc = 0xffffffff;
        for (let i = 0; i < dataBuf.length; i += 1) {
          crc ^= dataBuf[i];
          for (let b = 0; b < 8; b += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
          }
        }
        crc = (crc ^ 0xffffffff) >>> 0;

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0x0800, 6); // UTF-8
        localHeader.writeUInt16LE(0, 8); // Stored
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(dataBuf.length, 18);
        localHeader.writeUInt32LE(dataBuf.length, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28);

        localParts.push(localHeader, nameBuf, dataBuf);

        const cdHeader = Buffer.alloc(46);
        cdHeader.writeUInt32LE(0x02014b50, 0);
        cdHeader.writeUInt16LE(20, 4);
        cdHeader.writeUInt16LE(20, 6);
        cdHeader.writeUInt16LE(0x0800, 8);
        cdHeader.writeUInt16LE(0, 10);
        cdHeader.writeUInt32LE(crc, 16);
        cdHeader.writeUInt32LE(dataBuf.length, 20);
        cdHeader.writeUInt32LE(dataBuf.length, 24);
        cdHeader.writeUInt16LE(nameBuf.length, 28);
        cdHeader.writeUInt32LE(offset, 42);

        cdParts.push(cdHeader, nameBuf);
        offset += localHeader.length + nameBuf.length + dataBuf.length;
      }

      const cdBuf = Buffer.concat(cdParts);
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0);
      eocd.writeUInt16LE(entries.length, 8);
      eocd.writeUInt16LE(entries.length, 10);
      eocd.writeUInt32LE(cdBuf.length, 12);
      eocd.writeUInt32LE(offset, 16);

      return Buffer.concat([...localParts, cdBuf, eocd]);
    }

    function buildMinimalDocx(paragraphs = [], pngBuffer = null) {
      const xmlParas = paragraphs
        .map(p => `<w:p><w:r><w:t>${String(p).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p>`)
        .join('');
      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${xmlParas}</w:body></w:document>`;
      const files = [{ name: 'word/document.xml', data: docXml }];
      if (pngBuffer) {
        files.push({ name: 'word/media/image1.png', data: pngBuffer });
      }
      return buildStoredZip(files);
    }

    // Valid 1x1 teal PNG (padded slightly >64 bytes via PNG tEXt chunk? Actually raw 1x1 PNG is 67 bytes!)
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const dynamicDocx = buildMinimalDocx(
      [
        'The bar chart below shows a drug company\'s total sales across three regions between 2002 and 2006. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
      ],
      tinyPng
    );
    const mapDocx = buildMinimalDocx(
      [
        'The two maps below show the changes in Riverside Park between 1995 and the present day. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        'Sample answer: Overall, Riverside Park underwent significant modernization...'
      ],
      tinyPng
    );
    const missingImgStaticDocx = buildMinimalDocx([
      'The table below shows opinions of full-time students regarding campus services in 2024. Summarise the information by selecting and reporting the main features.'
    ]);

    const driveZip = buildStoredZip([
      { name: "KHO DE TASK 1/DYNAMIC CHART/a drug company's total sales.docx", data: dynamicDocx },
      { name: 'KHO DE TASK 1/MAP/4 AREAS CUOI.docx', data: mapDocx },
      { name: 'KHO DE TASK 1/STATIC CHART/OPINIONS OF FULL TIME AND ITS SERVICES.docx', data: missingImgStaticDocx }
    ]);

    try {
      await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
      await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
      await page.locator('aside').getByRole('button', { name: /Viết Task 1/i }).first().click();

      await page.getByTestId('open-bulk-w1-ai-btn').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toBeVisible();

      // Upload the single Google Drive .zip directly
      await page.getByTestId('bulk-w1-file-input').setInputFiles([
        { name: 'KHO DE TASK 1.zip', mimeType: 'application/zip', buffer: driveZip }
      ]);

      // Confirm all 3 .docx items unpacked and auto-detected folders (Dynamic + Map + Static)
      await expect(page.getByText(/3 Word \(\.docx\)/i)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/Tự nhận diện thư mục:/i)).toBeVisible();

      // Run pipeline (instant direct Word extraction without needing external Gemini!)
      await page.getByTestId('run-bulk-w1-ai-btn').click();

      await expect(page.getByTestId('bulk-w1-draft-card-0')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('bulk-w1-draft-card-1')).toBeVisible();
      await expect(page.getByTestId('bulk-w1-draft-card-2')).toBeVisible();

      // Verify clean noun-phrase title extracted from English prompt (not "4 AREAS CUOI") and correct folder routing
      await expect(page.getByTestId('bulk-w1-draft-card-0').locator('select')).toHaveValue('w1_dynamic');
      await expect(page.getByTestId('bulk-w1-draft-card-1').locator('select')).toHaveValue('w1_map');
      await expect(page.getByTestId('bulk-w1-draft-card-2').locator('select')).toHaveValue('w1_static');
      await expect(page.getByTestId('bulk-w1-draft-card-1').locator('input[type="text"]')).toHaveValue(
        /Changes in Riverside Park/i
      );
      // Sample answer paragraph should be cleanly separated out of student prompt
      await expect(page.getByTestId('bulk-w1-draft-card-1').locator('textarea')).not.toHaveValue(/Sample answer/i);

      await page.getByTestId('confirm-save-bulk-w1-btn').click();
      await expect(page.getByTestId('daily-writing-bulk-modal')).toHaveCount(0);

      // Verify Daily Zone shows persistent import warning banner & filter for the errored/warning test
      await expect(page.getByTestId('daily-import-warnings-banner')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('daily-filter-import-warnings-btn').click();
      await expect(page.getByText(/OPINIONS OF FULL TIME AND ITS SERVICES\.docx/i).first()).toBeVisible();

      // Click "Lịch sử & Đề lỗi" directly on the Daily Zone toolbar and verify history + live broken test panel opens immediately
      await page.getByTestId('daily-open-import-history-btn').click();
      await expect(page.getByTestId('bulk-import-history-panel')).toBeVisible();
      await expect(
        page.getByTestId('bulk-import-history-panel').getByText(/OPINIONS OF FULL TIME AND ITS SERVICES\.docx/i).first()
      ).toBeVisible();
      await page.getByRole('button', { name: 'Đóng', exact: true }).first().click();

      // Clear warning filter so all 3 imported tests are visible, then bulk-toggle #ThiThật ON then OFF in 1 click
      await page.getByTestId('daily-filter-import-warnings-btn').click();
      await page.getByTestId('toggle-bulk-hashtag-bar-btn').click();
      await expect(page.getByTestId('daily-bulk-hashtag-panel')).toBeVisible();
      await page.getByTestId('bulk-tag-on-ThiThật').click();
      await expect(page.getByTestId('bulk-tag-off-ThiThật')).toBeVisible({ timeout: 8_000 });
      await page.getByTestId('bulk-tag-off-ThiThật').click();
      await expect(page.getByTestId('bulk-tag-off-ThiThật')).toHaveCount(0, { timeout: 8_000 });

      // Verify saved tests in server state have embedded images & exact folder routing
      const loginRes = await request.post(`${baseURL}/api/sync/auth/login`, {
        data: {
          username: E2E_CREDENTIALS.teacher.username,
          password: E2E_CREDENTIALS.teacher.password
        }
      });
      expect(loginRes.ok()).toBeTruthy();
      const snapRes = await request.get(`${baseURL}/api/sync/state`);
      const snap = await snapRes.json();
      const created = (snap?.tests || []).filter(t => String(t?.id || '').startsWith('test-w1-bulk-'));
      expect(created.length).toBe(3);
      const dynTest = created.find(t => t.dailySubCategory === 'w1_dynamic');
      const mapTest = created.find(t => t.dailySubCategory === 'w1_map');
      const staticWarnTest = created.find(t => t.dailySubCategory === 'w1_static');
      expect(dynTest?.writing?.task1?.imageUrl).toMatch(/^(data:image\/|\/api\/sync\/media\/)/);
      expect(mapTest?.writing?.task1?.imageUrl).toMatch(/^(data:image\/|\/api\/sync\/media\/)/);
      expect(mapTest?.writing?.task1?.modelAnswer).toMatch(/Sample answer/i);
      expect(staticWarnTest?.needsImportReview).toBe(true);
      expect(staticWarnTest?.importSourceFile).toContain('OPINIONS OF FULL TIME AND ITS SERVICES.docx');

      healthGuard.assertHealthy('daily-writing-word-zip-import');
    } finally {
      await request.post(`${baseURL}/api/sync/auth/login`, {
        data: {
          username: E2E_CREDENTIALS.teacher.username,
          password: E2E_CREDENTIALS.teacher.password
        }
      });
      const snapRes = await request.get(`${baseURL}/api/sync/state`);
      if (snapRes.ok()) {
        const snap = await snapRes.json();
        const toDelete = (snap?.tests || [])
          .map(t => t?.id)
          .filter(id => String(id || '').startsWith('test-w1-bulk-'));
        for (const id of toDelete) {
          await request.post(`${baseURL}/api/sync/action`, {
            data: { type: 'DELETE_TEST', payload: { testId: id } }
          });
        }
      }
    }
  });
});
