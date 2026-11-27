import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  fetchAdminSnapshot,
  loginViaUI,
  dismissOptionalPopups,
  assertNoHorizontalOverflow
} from './fixtures.js';

test.describe('3. Student IELTS Exam Flow (StudentHome -> ExamMode -> ResultView)', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Full exam: SplitWorkspace resize, ClozeNoteSheet + MCQ answers, Anti-Cheat trigger, Submit -> ResultView -> History', async ({
    page,
    baseURL,
    healthGuard
  }) => {
    await loginViaUI(page, E2E_CREDENTIALS.student.username, E2E_CREDENTIALS.student.password);

    // Locate the Cambridge 18 Full 4-Skill Mock Test card and launch it
    const examCard = page
      .locator('.lexi-card')
      .filter({ hasText: /IELTS Academic Mock Test 02 - Cambridge Standard/i })
      .first();
    await expect(examCard).toBeVisible();

    await examCard
      .getByRole('button', { name: /Bắt Đầu Thi 4 Kỹ Năng|Tiếp Tục Bài Đang Làm/i })
      .click();

    // Confirm ExamMode auto-entered fullscreen cleanly on startExam click
    await expect(page.getByTestId('exam-fullscreen-lock-overlay')).toHaveCount(0, { timeout: 6_000 });
    await expect(page.getByRole('button', { name: /Nộp/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'ExamMode-Listening');

    // 1. Fill Listening Part 1 ClozeNoteSheet blanks (Q1..Q3)
    const listenBlank1 = page.locator('input[aria-label="Câu 1"]').first();
    await expect(listenBlank1).toBeVisible();
    await listenBlank1.fill('Garden');
    await page.locator('input[aria-label="Câu 2"]').first().fill('115');
    await page.locator('input[aria-label="Câu 3"]').first().fill('cash');

    // 2. Switch to Listening PART 2 and answer MCQ questions
    await page.getByRole('button', { name: /PART 2/i }).first().click();
    await page.getByText('A. Storing timber and hemp rope', { exact: false }).first().click();
    await page.getByText('B. Boarding capacity on deck is strictly limited', { exact: false }).first().click();

    // 3. Switch to Reading skill
    await page.locator('header').getByRole('button', { name: /^Reading$/i }).first().click();

    // Test SplitResizableWorkspace divider
    const splitter = page.locator('[role="separator"][aria-label*="điều chỉnh độ rộng"]').first();
    await expect(splitter).toBeVisible();
    const initialSplit = Number(await splitter.getAttribute('aria-valuenow'));
    expect(initialSplit).toBe(50);

    // Drag splitter handle cleanly + keyboard verify
    const box = await splitter.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();

    const afterDragSplit = Number(await splitter.getAttribute('aria-valuenow'));
    expect(afterDragSplit).toBeGreaterThan(initialSplit);

    // Fill Reading Passage 1 ClozeNoteSheet blanks
    const readBlank1 = page.locator('input[aria-label="Câu 1"]').first();
    await expect(readBlank1).toBeVisible();
    await readBlank1.fill('preservative');
    await page.locator('input[aria-label="Câu 2"]').first().fill('camel');

    // 4. Test Anti-Cheat (useExamAntiCheat.js):
    // 4a. Right-click blocked toast & F11 blocked
    await page.locator('[data-exam-copy-source="true"]').first().click({ button: 'right' });
    await expect(page.getByText(/Chức năng chuột phải đã bị khóa trong khi thi/i)).toBeVisible();
    await page.keyboard.press('F11');

    // 4a-2. Exiting fullscreen must immediately trigger the Fullscreen Lock Privacy Shield & re-entering unlocks it
    await page.evaluate(async () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    });
    await expect(page.getByTestId('exam-fullscreen-lock-overlay')).toBeVisible({ timeout: 6_000 });
    await page.getByTestId('enter-exam-fullscreen-btn').click();
    await expect(page.getByTestId('exam-fullscreen-lock-overlay')).toHaveCount(0, { timeout: 6_000 });

    // 4b. Simulate tab switch / visibilitychange -> hidden -> visible
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden'
      });
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible'
      });
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // 5. Visit Writing skill and type sample response
    await page.locator('header').getByRole('button', { name: /^Writing$/i }).first().click();
    const writingBox = page.locator('textarea').first();
    await expect(writingBox).toBeVisible();
    await writingBox.fill(
      'The provided chart compares urban energy transitions across four regions over a twenty-year span. Overall, renewable electricity expanded markedly while coal reliance declined steadily.'
    );

    // 6. Visit Speaking skill so all 4 skills are visited
    await page.locator('header').getByRole('button', { name: /^Speaking$/i }).first().click();
    await page.waitForTimeout(200);

    // 7. Submit Exam -> confirm modal -> ResultView
    const submitBtn = page.locator('header').getByRole('button', { name: /^Nộp Bài$/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.getByText(/Bạn có chắc chắn muốn nộp bài không/i)).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận Nộp Bài', exact: true }).click();

    // 8. Verify ResultView opens and displays immediate Listening/Reading scores
    await expect(page.getByText(/IELTS Academic Mock Test 02 - Cambridge Standard/i).first()).toBeVisible({
      timeout: 15_000
    });
    await expect(page.getByText(/Listening/i).first()).toBeVisible();
    await expect(page.getByText(/Reading/i).first()).toBeVisible();
    await expect(page.getByText(/Band/i).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'ResultView');

    // 9. Dismiss unlocked-title celebration modal (triggered after first exam) & return to StudentHome
    await dismissOptionalPopups(page);
    const backBtn = page.getByRole('button', { name: /Quay Lại/i }).first();
    await backBtn.click();
    await expect(page.getByText(/Lịch Sử Làm Bài|Bài Thi Đã Nộp/i).first()).toBeVisible();
    await expect(page.getByText(/IELTS Academic Mock Test 02 - Cambridge Standard/i).first()).toBeVisible();

    // 10. Confirm via isolated local server state that Anti-Cheat logs & tabSwitchCount >= 1 persisted
    const snap = await fetchAdminSnapshot(baseURL);
    const myAttempt = (snap.attempts || []).find(
      a => a.studentId === E2E_CREDENTIALS.student.username && a.testId === E2E_CREDENTIALS.fullExamId
    );
    expect(myAttempt, 'Submitted attempt must be persisted in isolated store').toBeTruthy();
    expect(myAttempt.tabSwitchCount, 'Anti-cheat must record tab switch').toBeGreaterThanOrEqual(1);
    expect((myAttempt.antiCheatLogs || []).length, 'Anti-cheat logs must be recorded').toBeGreaterThanOrEqual(1);
    expect(myAttempt.scores?.listening?.raw).toBeGreaterThanOrEqual(5);
    expect(myAttempt.scores?.reading?.raw).toBeGreaterThanOrEqual(2);

    healthGuard.assertHealthy('student-exam-flow');
  });
});
