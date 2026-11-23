import { request as playwrightRequest } from '@playwright/test';
import {
  test,
  expect,
  E2E_CREDENTIALS,
  ensureE2EBootstrap,
  loginViaUI,
  assertNoHorizontalOverflow
} from './fixtures.js';

async function ensureGradingAttemptExists(baseURL) {
  const api = await playwrightRequest.newContext({ baseURL });
  try {
    await api.post('/api/sync/auth/login', {
      data: E2E_CREDENTIALS.admin
    });
    const stateRes = await api.get('/api/sync/state');
    const snap = await stateRes.json();
    const existing = (snap.attempts || []).find(
      a => a.studentId === E2E_CREDENTIALS.student.username && a.testId === E2E_CREDENTIALS.fullExamId
    );
    if (!existing) {
      const nowMs = Date.now();
      await api.post('/api/sync/action', {
        data: {
          type: 'UPSERT_ATTEMPT',
          payload: {
            attempt: {
              id: `att_e2e_seed_${nowMs}`,
              testId: E2E_CREDENTIALS.fullExamId,
              testTitle: 'IELTS Academic Mock Test 02 - Cambridge Standard (Đục Lỗ + Full 4 Skills)',
              testMode: 'full_exam',
              focusSkill: null,
              studentId: E2E_CREDENTIALS.student.username,
              studentName: E2E_CREDENTIALS.student.name,
              startedAt: '01:00:00 23/11/2026',
              startedAtMs: nowMs - 600_000,
              submittedAt: '01:10:00 23/11/2026',
              submittedAtMs: nowMs,
              durationSeconds: 600,
              answers: {
                cam18_l1: 'Garden',
                cam18_l2: '115',
                cam18_r1: 'preservative',
                w1: 'Sample Task 1 writing essay for E2E grading verification.',
                w2: 'Sample Task 2 writing essay discussing sustainable cities and education.'
              },
              speakingRecordings: [],
              tabSwitchCount: 1,
              antiCheatLogs: [
                {
                  timestamp: '01:05:00',
                  skill: 'reading',
                  event: 'Rời khỏi màn hình làm bài (Chuyển tab / Ẩn trình duyệt)',
                  category: 'focus',
                  severity: 'medium'
                }
              ],
              teacherGraded: false,
              aiGraded: false,
              scores: {
                listening: { raw: 2, total: 20, band: 3.0 },
                reading: { raw: 1, total: 10, band: 3.5 },
                writing: { task1Band: 0, task2Band: 0, overallBand: 0 },
                speaking: { band: 0, criteria: {} }
              },
              overallBand: null,
              teacherFeedback: ''
            }
          }
        }
      });
    }
    await api.post('/api/sync/auth/logout');
  } finally {
    await api.dispose();
  }
}

test.describe('6. Teacher Admin Dashboard, ExamBuilder, Grading Modal & Student Profile', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
    await ensureGradingAttemptExists(baseURL);
  });

  test('Teacher navigates all management tabs, opens ExamBuilder, grades attempt in TeacherGradingModal, and inspects StudentProfile', async ({
    page,
    healthGuard
  }) => {
    await loginViaUI(page, E2E_CREDENTIALS.teacher.username, E2E_CREDENTIALS.teacher.password);
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();

    // 1. Tab: Kho đề thi (Thực Chiến & Mock) + verify ExamBuilder opens & returns cleanly
    await page.locator('aside').getByRole('button', { name: /Thực Chiến & Mock/i }).click();
    await expect(page.getByText(/IELTS Academic Mock Test 02 - Cambridge Standard/i).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'Teacher-TestsTab');

    await page.getByRole('button', { name: /Thực Chiến \(100k\)/i }).first().click();
    await expect(page.getByText(/TÊN ĐỀ THI IELTS|Soạn & Chỉnh Sửa Đề/i).first()).toBeVisible({ timeout: 12_000 });
    // Verify standard IELTS 4-Skill format tabs: Listening 4 Parts (40 Qs), Reading 3 Passages (40 Qs), Writing 2 Tasks, Speaking 3 Parts
    await expect(page.getByRole('button', { name: /2\. Listening \(4\/4 bài/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /3\. Reading \(3\/3 bài/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /4\. Writing \(2 bài/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /5\. Speaking \(3 phần/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /5\. Speaking \(3 phần/i }).first().click();
    await expect(page.getByText(/Kịch Bản Lời Dẫn Giám Khảo AI/i).first()).toBeVisible();

    // Verify Listening Builder includes AI PDF extraction + side-by-side Answer Key panel & range image tool
    await page.getByRole('button', { name: /2\. Listening/i }).first().click();
    await page.getByRole('tab', { name: /Tạo Tự Động \(AI Ảnh \/ PDF\)/i }).first().click();
    await expect(page.getByText(/Tạo Đề Listening Tự Động Từ File PDF \+ Bảng Đáp Án/i)).toBeVisible();
    await expect(page.locator('input[aria-label="Chọn PDF đề IELTS Listening"]')).toBeAttached();
    await expect(page.locator('input[aria-label="Tải ảnh hoặc PDF bảng đáp án Listening"]')).toBeAttached();
    await expect(page.locator('textarea[aria-label="Nhập hoặc dán bảng đáp án Listening"]')).toBeVisible();

    // Add 1 MCQ question (starts clean with no dummy Q1), verify 5 Cambridge Listening Pattern templates & RangeImageAssignPanel appear, paste Excel-style TSV answer key
    await page.getByRole('tab', { name: /Tạo Bằng Tay/i }).first().click();
    await page.getByRole('button', { name: /Multiple Choice/i }).first().click();
    await expect(page.getByText(/Gắn Hình Bản Đồ \(Map\) \/ Lưu Đồ \(Flow-chart\) Cho Nhóm Câu/i)).toBeVisible();
    await expect(page.getByText(/Tạo Nhanh Theo 5 Mẫu Giao Diện Thi Máy Cambridge/i)).toBeVisible();
    await page.getByRole('tab', { name: /Tạo Tự Động \(AI Ảnh \/ PDF\)/i }).first().click();
    await page.locator('textarea[aria-label="Nhập hoặc dán bảng đáp án Listening"]').fill('1\tB\tMultiple Choice');
    await page.getByRole('button', { name: /Điền Key \(1–40\)/i }).first().click();
    await page.getByRole('tab', { name: /Tất Cả Câu Hỏi/i }).first().click();
    await expect(page.locator('label', { hasText: /B\. Đáp án B/i }).locator('input[type="checkbox"]')).toBeChecked();

    // Also confirm Reading Builder has side-by-side PDF + Answer Key panel
    await page.getByRole('button', { name: /3\. Reading/i }).first().click();
    await page.getByRole('tab', { name: /Tạo Tự Động \(AI Ảnh \/ PDF\)/i }).first().click();
    await expect(page.locator('input[aria-label="Tải ảnh hoặc PDF bảng đáp án Reading"]')).toBeAttached();
    await assertNoHorizontalOverflow(page, 'Teacher-ExamBuilder');

    // Return to Teacher Dashboard (accept unsaved-draft confirmation cleanly)
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: /Quay Lại Bảng Điều Khiển Giáo Viên|Quản Trị GV/i }).first().click();
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();

    // 2. Tab: Chấm Bài & Giám Sát + Open TeacherGradingModal & Save Grade/Feedback
    await page.locator('aside').getByRole('button', { name: /Chấm Bài & Giám Sát/i }).click();
    await assertNoHorizontalOverflow(page, 'Teacher-GradingTab');

    const studentRow = page
      .locator('tbody tr')
      .filter({ hasText: E2E_CREDENTIALS.student.name })
      .filter({ hasText: /IELTS Academic Mock Test 02/i })
      .first();
    await expect(studentRow).toBeVisible({ timeout: 12_000 });

    await studentRow.getByRole('button', { name: /Chấm Điểm|Chấm & Xem/i }).first().click();

    // Confirm TeacherGradingModal opened with Stealth Anti-Cheat Log
    await expect(page.getByText(new RegExp(`Chấm & Sửa Điểm:.*${E2E_CREDENTIALS.student.name.replace(/[()]/g, '\\$&')}`, 'i'))).toBeVisible();
    await expect(page.getByText(/Nhật Ký Vi Phạm Chống Gian Lận/i)).toBeVisible();

    // Fill Writing Task 1 & Task 2 band scores + feedback
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Chấm & Sửa Điểm:/i }).first();
    const t1Input = modal
      .locator('div')
      .filter({ hasText: /^Task 1 Band Score/i })
      .locator('input[type="number"]')
      .first();
    if (await t1Input.isVisible().catch(() => false)) {
      await t1Input.fill('7.0');
    }
    const t2Input = modal
      .locator('div')
      .filter({ hasText: /^Task 2 Band Score/i })
      .locator('input[type="number"]')
      .first();
    if (await t2Input.isVisible().catch(() => false)) {
      await t2Input.fill('7.5');
    }

    const feedbackBox = modal.locator('textarea[placeholder*="Viết nhận xét chi tiết"]').first();
    await expect(feedbackBox).toBeVisible();
    await feedbackBox.fill('Nhận xét E2E: Bài thi đầy đủ, điểm Reading & Writing đạt chuẩn mục tiêu 7.5!');

    await modal.getByRole('button', { name: /Duyệt & Trả Điểm Cho Học Sinh/i }).click();

    // Confirm modal closes and row updates to Đã Duyệt Trả Điểm
    await expect(modal).toBeHidden({ timeout: 10_000 });
    await expect(studentRow.getByText(/Đã Duyệt Trả Điểm/i)).toBeVisible({ timeout: 10_000 });

    // 3. Tab: Quản Lý Tài Khoản (Tài Khoản Lớp) — verify Guest filter pill
    await page.locator('aside').getByRole('button', { name: /Tài Khoản Lớp/i }).click();
    await expect(page.getByText(E2E_CREDENTIALS.student.name).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Tài khoản khách/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'Teacher-AccountsTab');

    // 4. Tab: Quản Lý Lớp Học
    await page.locator('aside').getByRole('button', { name: /Quản Lý Lớp Học/i }).click();
    await expect(page.getByText(E2E_CREDENTIALS.className).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'Teacher-ClassesTab');

    // 5. Hồ Sơ Lớp (StudentProfile.jsx) + verify Hạng Cạnh Tên unlock roadmap modal
    await page.locator('header').getByRole('tab', { name: /Hồ Sơ Lớp/i }).first().click();
    await expect(page.getByText(/Mục Tiêu & Tiến Độ Từng Kỹ Năng|Danh Bạ/i).first()).toBeVisible({
      timeout: 12_000
    });
    await page.getByRole('button', { name: /Hạng Cạnh Tên/i }).first().click();
    await expect(page.getByText(/Hệ Thống 10 Hạng Cạnh Tên & Cách Mở Khóa/i)).toBeVisible();
    await expect(page.getByText(/1 đề Thực Chiến/i).first()).toBeVisible();
    await expect(page.getByText(/3 đề Thực Chiến/i).first()).toBeVisible();
    await expect(page.getByText(/5 đề Thực Chiến/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Đóng bảng hạng cạnh tên/i }).click();
    await assertNoHorizontalOverflow(page, 'StudentProfile-Light');

    // Check Dark Mode on StudentProfile too
    const themeBtn = page.locator('header button[title*="Chuyển sang giao diện"]').first();
    await themeBtn.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await assertNoHorizontalOverflow(page, 'StudentProfile-Dark');
    await themeBtn.click();

    // 6. Verify Teacher Back buttons across StudentProfile -> TeacherDashboard -> Daily Zone -> ExamBuilder -> Daily Zone -> TeacherDashboard
    await page.getByRole('button', { name: /Quay Lại Quản Trị Giáo Viên/i }).first().click();
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();

    await page.locator('header').getByRole('tab', { name: /Daily Zone/i }).first().click();
    await expect(page.getByText(/DAILY ZONE/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Tạo Bài Daily Mới/i }).first().click();
    const backToDailyBtn = page.getByRole('button', { name: /Quay Lại Daily Zone/i }).first();
    await expect(backToDailyBtn).toBeVisible();
    await backToDailyBtn.click();
    await expect(page.getByText(/DAILY ZONE/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Quay Lại Quản Trị GV/i }).first().click();
    await expect(page.getByRole('heading', { name: /Quản Lý & Giảng Dạy/i })).toBeVisible();

    // 7. Verify Teacher/Admin clicking Đấu Trường in Navbar opens the 2-Game Selection Hub (not Space Shooter directly)
    await page.locator('header').getByRole('tab', { name: /Đấu Trường/i }).first().click();
    await expect(page.locator('[data-testid="arena-game-selection-hub"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="select-space-shooter-game-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-to-knight-game-btn"]')).toBeVisible();

    healthGuard.assertHealthy('teacher-admin-grading-profile');
  });
});
