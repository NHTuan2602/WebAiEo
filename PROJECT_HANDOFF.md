# PROJECT HANDOFF — Luyện Thi IELTS Nha Trang (IELTS with Ms. Như)

Tài liệu chuyển giao kỹ thuật giúp AI Coding Agent / Developer tiếp quản dự án **`webAIEo`** ngay lập tức.

---

## 1. TỔNG QUAN & TECH STACK

### Mục đích & Vai trò người dùng
Hệ thống luyện & thi thử IELTS trực tuyến chuẩn phòng thi máy tính (Full 4 kỹ năng **Listening · Reading · Writing · Speaking**), kết hợp **Daily Zone** (bài tập lẻ miễn phí theo Team/Pass), **Đấu Trường Từ Vựng** nhiều người chơi thời gian thực, chấm chữa bài theo quy trình **Giáo viên duyệt điểm**, hồ sơ tiến độ và thanh toán tự động **VietQR / SePay / PayOS**.

- **Super Admin (Quản Trị Hệ Thống):** Quyền cao nhất (ẩn khỏi danh sách của Giáo viên thường), quản trị cấu hình thanh toán/QR/Webhook, giá gói, danh hiệu tùy chỉnh, duyệt gói VIP/Combo/Đề lẻ, reset mật khẩu mọi tài khoản, hộp thư góp ý.
- **Teacher (Giáo viên — Ms. Như):** Tạo/sửa đề **Thực Chiến (20k)**, **Mock Định Kỳ (300k)** và bài tập **Daily Zone**, quản lý lớp học, tài khoản học viên, chấm bài & duyệt điểm (Writing/Speaking/Full Exam), dùng AI chấm nháp, mở phòng Game PIN, gửi thông báo lớp.
- **Student (Học viên):** Thi Thực Chiến 4 kỹ năng (1 lượt/đề), mua đề lẻ hoặc dùng lượt Combo (có xác nhận trừ lượt), làm bài Daily Zone không giới hạn, chơi Đấu Trường Từ Vựng, đặt mục tiêu band 4 kỹ năng (`L·R·W·S + Overall`), tùy chỉnh hồ sơ & nâng cấp IELTS VIP (`20.000đ/1 tháng`).

### Công nghệ cốt lõi (`package.json`)
- **Frontend:** `react` `^19.3.1`, `react-dom` `^19.3.1`, `vite` `^8.3.6`, `@vitejs/plugin-react` `^6.1.2`.
- **Styling & Icons:** Tailwind CSS (tải qua Tailwind Play CDN trong `index.html`, cấu hình `darkMode: 'class'`), CSS tùy chỉnh tại `src/index.css` & `src/anti-ai-reset.css`, `lucide-react` `^1.72.0`.
- **Tiện ích & Lint:** `qrcode` `^1.5.4`, `oxlint` `^1.90.0`. *(Lưu ý: `firebase` `^13.2.0` có trong `package.json` nhưng không được dùng trong runtime hiện tại.)*
- **Backend / Realtime / Mail:** Thuần Node.js ESM không phụ thuộc framework ngoài (`server.js` + `syncPlugin.js` + `mailService.js`), đồng bộ thời gian thực qua **Server-Sent Events (SSE)** + REST API `/api/sync/*`, lưu trữ bền vững bằng file JSON + bản sao `.bak` và thư mục audio trên ổ đĩa / Railway Volume.
- **Deployment (Railway):** Project `webaieo`, Service `webaieo`, env `production`, domain `https://luyenthiieltsnhatrang.up.railway.app`, lệnh chạy `npm start` (`node server.js`), healthcheck `GET /health`.

### Lệnh chạy & Biến môi trường (`.env`)
- **Chạy local dev:** `npm run dev` (Vite tích hợp sẵn `lexiprepSyncPlugin` từ `vite.config.js`).
- **Build production:** `npm run build` (xuất ra `dist/`).
- **Chạy production server:** `npm start` (`node server.js`, phục vụ `dist/` + `/api/sync/*`).
- **Kiểm tra lint & audit UI:** `npm run lint -- --quiet` và `.\.agents\skills\impeccable\scripts\impeccable.cmd detect --json src`.

**Các biến môi trường (chỉ liệt kê tên biến, tuyệt đối không ghi giá trị thật):**
- *Server & Storage:* `PORT`, `HOST`, `RAILWAY_VOLUME_MOUNT_PATH`, `SYNC_STATE_FILE`, `MAINTENANCE_MODE` *(tùy chọn `1` để bật trang bảo trì 503 toàn hệ thống)*
- *Auth & Protected Accounts:* `SESSION_SECRET`, `SUPER_ADMIN_PASS`, `TEACHER_DEFAULT_PASS`
- *AI Grading / Extraction:* `GEMINI_API_KEY`, `VITE_GEMINI_API_KEY` *(hoặc lưu qua giao diện Admin vào `store.aiConfig`)*
- *Thanh toán tự động:* `SEPAY_API_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` *(hoặc cấu hình trong `PaymentConfigModal`)*
- *Email OTP (khôi phục mật khẩu & xác minh email):* `RESEND_API_KEY`, `BREVO_API_KEY`, `APPS_SCRIPT_MAIL_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_FROM_NAME`

---

## 2. BẢN ĐỒ CẤU TRÚC THƯ MỤC (ARCHITECTURE MAP)

### Root & Backend
- `server.js` — HTTP production server phục vụ static `dist/`, security headers, `GET /health`, graceful shutdown và gắn middleware từ `syncPlugin.js`.
- `syncPlugin.js` — Toàn bộ backend API (`/api/sync/*`), RBAC, xác thực session HMAC HttpOnly cookie, SSE realtime, lưu trữ JSON/audio, AI proxy, chấm điểm khách quan & webhook thanh toán.
- `mailService.js` — Dịch vụ gửi email OTP không phụ thuộc thư viện ngoài (hỗ trợ Resend, Brevo, Google Apps Script và pure-Node SMTP TLS/STARTTLS).
- `vite.config.js` — Cấu hình Vite + gắn `lexiprepSyncPlugin` để chạy chung API sync ngay trong `npm run dev`.
- `index.html` — Entry HTML cấu hình font (`Be Vietnam Pro`, `IBM Plex Sans`, `JetBrains Mono`), Tailwind CDN, `notranslate` meta và khôi phục theme sáng/tối.
- `AGENTS.md` — Quy tắc workspace bắt buộc (lint, build, git commit/push, xác nhận deploy Railway `SUCCESS`).

### `src/` (Entry & Styles)
- `src/main.jsx` — Mount `<App />` và nạp CSS theo thứ tự bắt buộc `index.css` → `anti-ai-reset.css`.
- `src/App.jsx` — Root orchestrator (~7.7k dòng): quản lý toàn bộ state ứng dụng, đồng bộ SSE/BroadcastChannel, điều hướng view, canvas loop Game Arena và gắn tất cả modal.
- `src/index.css` — CSS gốc: bảng màu biến `--lexi-*`, animation VIP (`vipAuraPulse`, `vipNeonShift`, `vipLedAuroraPulse`, `.vip-paid-badge` cho 5 danh hiệu trả phí) và hiệu ứng thu nhỏ VIP dock.
- `src/anti-ai-reset.css` — Lớp ghi đè chuẩn hóa Impeccable UI & WCAG AA (nền sáng/tối Neutral Zinc, tắt gradient rác, khóa cỡ chữ >= 12px, diệt thẻ lồng thẻ trừ VIP/Avatar).

### `src/pages/`
- `AuthScreen.jsx` — Màn đăng nhập, nhớ tài khoản, quên mật khẩu OTP và giới thiệu Full 4 Kỹ Năng.
- `StudentHome.jsx` — Trang chủ học viên: mục tiêu 4 kỹ năng, 3 tab storefront (`Thực Chiến Thi Thật`, `Mock Test Định Kỳ`, `Daily Zone`), thanh Combo, hộp thoại xác nhận trừ lượt Combo và lịch sử thi.
- `SkillPracticeHub.jsx` — Trung tâm **Daily Zone (Miễn phí)** gồm 6 phân mục (`Daily Speaking`, `Cày Forecast`, `Reading SHW 1-14`, `Listening 3 mảng`, `Writing W1 Map/Process/Dynamic/Static`, `Writing W2 Essay`) kèm lọc hashtag & Pass Team.
- `ExamMode.jsx` — Phòng thi máy tính chuẩn IELTS (Listening/Reading/Writing/Speaking tích hợp tuần tự hoặc bài lẻ Daily), đếm giờ, highlight/ghi chú, auto-save draft và chống gian lận.
- `SpeakingExamRoom.jsx` — Phòng thi Speaking độc lập cho Daily Speaking & Cày Forecast (ghi âm, đo mức âm thanh, phát prompt audio, upload file audio).
- `ResultView.jsx` — Màn xem kết quả & chữa bài chi tiết; khóa toàn bộ điểm/lỗi Writing & Speaking với học viên cho tới khi `teacherGraded === true`, hiển thị thanh duyệt 1 chạm cho Giáo viên.
- `StudentProfile.jsx` — Hồ sơ cá nhân & Danh bạ lớp dạng popup kiểu Messenger; thống kê điểm trung bình theo từng kỹ năng không bị pha loãng, mục tiêu 4 kỹ năng + Overall, danh hiệu, tùy chỉnh VIP/ảnh bìa và khung góp ý Admin.
- `TeacherDashboard.jsx` — Trung tâm quản trị Giáo viên: quản lý kho `Thực Chiến & Mock` (lọc 20k/300k), `Daily Zone` (6 nút tạo nhanh), tab chấm bài & giám sát gian lận, quản lý lớp, tài khoản (duyệt VIP/lượt/đề) và phòng Game PIN.
- `ExamBuilder.jsx` — Trình soạn & chỉnh sửa đề Full 4 Kỹ Năng (`L·R·W·S`) và bài tập Daily Zone (tách riêng W1/W2, Pass Team, Hashtags, giá test, lịch mở/đóng).
- `GameArena.jsx` — Đấu Trường Từ Vựng nhiều người chơi (Sảnh chờ PIN/Pass, chia Team, 4 vòng thi gồm Vòng 4 gõ chữ Collocation đánh Boss, BXH lớp & chế độ luyện đơn).

### `src/components/`
- `common/Navbar.jsx` — Thanh điều hướng chính, badge số lượt làm đề có phí + nút `+` mở bảng giá cạnh tên học viên, chuông thông báo, chuyển sáng/tối.
- `common/ServerMaintenanceOverlay.jsx` & `AppErrorBoundary.jsx` — Trang thông báo bảo trì/mất kết nối/crash React kèm ảnh meme nhúng inline offline-safe, tự động ping `/health` khôi phục (kết hợp `public/maintenance.html` + `public/sw-offline.js` cho lỗi 5xx/offline lúc F5).
- `common/UserAvatarBadge.jsx` — Hiển thị avatar người dùng kèm khung avatar (`AVATAR_FRAMES`) và hào quang VIP (`data-avatar-badge="true"`).
- `common/VipMemberName.jsx` — Hiển thị tên màu tùy chỉnh (preset/hex) + huy hiệu động `IELTS VIP`.
- `common/BrandContactFooter.jsx` — Footer thương hiệu IELTS Nha Trang (Ms. Như) dạng đầy đủ hoặc thẻ gọn.
- `common/CoverUnlockQrCard.jsx` — Thẻ hiển thị mã VietQR động/ảnh QR tùy chỉnh và nút sao chép thông tin chuyển khoản.
- `common/AnimalPilotAvatar.jsx` & `AmongUsCrewmate.jsx` — Render nhân vật phi công thú cưng/phi hành gia cho Game Arena.
- `exam/SplitResizableWorkspace.jsx` — Khung chia đôi kéo giãn tỷ lệ trái/phải cho Reading & Writing.
- `exam/ExamQuestionList.jsx` — Render danh sách câu hỏi IELTS (MCQ, Fill-in, True/False/NG, Matching, Cloze).
- `exam/ClozeNoteSheet.jsx` — Giao diện điền từ trực tiếp vào chỗ trống dạng Note/Summary Completion (`[1]`).
- `exam/IntegratedSpeakingSection.jsx` — Phần thi Speaking tích hợp ở chặng 4 trong đề Thực Chiến / Mock Định Kỳ Full 4 Kỹ Năng.
- `modals/RealExamPricingModal.jsx` — Bảng giá & Combo Thực Chiến (Đề lẻ 20k, Combo 3/5/10 đề, Mock 300k), tự động mở khi học viên đăng nhập.
- `modals/CoverCheckoutModal.jsx` — Cổng thanh toán QR hợp nhất (Đề lẻ, Combo 3/5/10, IELTS VIP, Ảnh nền, Danh hiệu, Vé tạo phòng), tự poll trạng thái & nghe SSE.
- `modals/VipPromoPopupModal.jsx` — Popup ưu đãi IELTS VIP (`20.000đ/1 tháng`) kèm nút thu gọn nổi cố định ở góc phải trên.
- `modals/TeacherGradingModal.jsx` — Modal chấm/sửa điểm L·R·W·S, kích hoạt AI chấm nháp và duyệt trả điểm cho Giáo viên.
- `modals/GlobalModals.jsx` — Tập hợp modal dùng chung (chỉnh mục tiêu 4 kỹ năng + Overall, tạo/đổi MK tài khoản, chọn bộ từ vựng Game, tạo phòng Game, upload/crop avatar, toast).
- `modals/AccountSecurityModal.jsx` — Đổi mật khẩu và liên kết/xác minh email OTP.
- `modals/PaymentConfigModal.jsx` — Cấu hình ngân hàng VietQR, bảng giá, SePay/PayOS secrets (chỉ Super Admin).
- `modals/MailConfigModal.jsx` — Cấu hình Resend/Brevo/Apps Script/SMTP gửi OTP (Giáo viên/Admin).
- `modals/AdminTitleManagerModal.jsx` — Tạo, sửa, xóa và trao danh hiệu tùy chỉnh (chỉ Super Admin).
- `modals/TitleUnlockedCelebrationModal.jsx` — Modal chúc mừng khi học viên mở khóa danh hiệu mới.
- `modals/ImageCropperModal.jsx` — Cắt ảnh vuông/bìa trên canvas trước khi lưu.
- `speaking/AudioLevelMeter.jsx`, `FrogMascot.jsx`, `SpeakingHeatmapCard.jsx`, `SpeakingQuestionLuyennoiCard.jsx`, `SpeakingResultCelebrationModal.jsx` — Các thành phần đo micro, chuỗi luyện nói, thẻ chấm chữa lỗi câu kiểu Luyennoi và popup hoàn thành Speaking.
- `teacher/AiExamExtractorPanel.jsx`, `BuilderGuideAssistant.jsx`, `ClassManagerTab.jsx`, `ClozeEditorBox.jsx`, `SkillQuestionWorkspace.jsx`, `SpeakingBuilderPanel.jsx` — Bộ công cụ biên soạn câu hỏi, trích xuất đề bằng AI Gemini, soạn Cloze/Speaking và quản lý lớp học.

### `src/hooks/`, `src/constants/`, `src/utils/`
- `hooks/useExamAntiCheat.js` — Hook phát hiện chuyển tab, mất focus, chặn copy/paste nguồn ngoài (cho phép copy nội bộ từ `[data-exam-copy-source="true"]`), phát hiện mở Side-Panel/DevTools và extension mở khóa chuột phải.
- `constants/seedData.js` — Dữ liệu mẫu mặc định, `normalizeExamConfig`, `normalizeSpeakingSection`, `evaluateTestSchedule`, `canUserAccessTest`, `evaluateSpeakingDailyCompliance`, helper đọc tracks/passages/hashtags.
- `constants/profileCustomization.js` — Bảng giá chuẩn (`DEFAULT_EXAM_PRICE_VND = 20000`, `AIEO_VIP_PRICE_VND = 20000`, `PERIODIC_MOCK_PRICE_VND = 300000`, `REAL_EXAM_COMBOS`), `normalizePaymentConfig` (kèm migration v2), danh sách `STUDENT_TITLES`, `AVATAR_FRAMES`, `VIP_NEON_COVER_THEMES`, helper phân quyền gói.
- `constants/brandInfo.js` — Thông tin thương hiệu cố định (Ms. Như, SĐT, địa chỉ Nha Trang, Zalo hỗ trợ thanh toán).
- `utils/sessionPersistence.js` — Lưu/khôi phục `ielts_nav_session_v1`, `ielts_exam_draft_*`, `ielts_builder_draft_*` trên `localStorage`.
- `utils/examHelpers.js` & `examUiHelpers.js` — Quy đổi điểm IELTS band, chuẩn hóa đáp án khách quan, đánh giá rủi ro gian lận, xuất CSV, dựng hàng đợi 4 vòng Game, phân tách highlight & số câu hỏi.
- `utils/geminiGrader.js`, `speakingAiEngine.js`, `speakingApi.js` — Gọi proxy AI server (`/api/sync/grade-writing`, `/api/sync/grade-speaking`, `/api/sync/ai/generate`), upload audio và xác thực mật khẩu phòng thi.
- `utils/clozeHelpers.js`, `mediaHelpers.js`, `animalRenderer.js` — Xử lý chỗ trống Cloze `[1]`, phát âm Web Speech/SFX, và vẽ phi thuyền thú cưng trên Canvas.

---

## 3. LUỒNG DỮ LIỆU & LƯU TRỮ (DATA FLOW & STORAGE)

### Kiến trúc lưu trữ & đồng bộ
1. **Nguồn dữ liệu chính (Single Source of Truth):** File JSON trên đĩa được quản lý bởi `createPersistentSyncStore` (`syncPlugin.js`):
   - Production (Railway): `${RAILWAY_VOLUME_MOUNT_PATH}/lexiprep-sync-state.json` (hoặc `SYNC_STATE_FILE`).
   - Local dev: `.data/dev-sync-state.json`.
   - Ghi nguyên tử (atomic write qua file `.tmp` + tự động duy trì bản dự phòng `.bak`, tự phục hồi khi file chính lỗi) và hỗ trợ `syncFromDiskIfNewer` khi Railway rolling deploy chồng container.
2. **Lưu trữ Audio & Ảnh:**
   - File ghi âm Speaking & audio Listening upload được lưu thành file nhị phân trong thư mục `audio/` cùng cấp với file JSON (`_audioDir`), tải qua `POST /api/sync/audio` và stream hỗ trợ HTTP `Range 206` tại `GET /api/sync/audio/:audioId`.
   - Ảnh đại diện, ảnh bìa, ảnh biểu đồ lưu dạng `data:image/*` (nén/cắt, giới hạn dung lượng, cấm tuyệt đối SVG data URI chống XSS) hoặc URL `https://` đã lọc bởi `sanitizeMediaUrl`.
3. **Đồng bộ Realtime Client ↔ Server:**
   - Đăng nhập cấp cookie `ielts_session` (`HttpOnly`, `SameSite=Lax`, ký HMAC-SHA256 bằng `_authSecret`, có `tokenVersion` để thu hồi phiên đa thiết bị).
   - Client đọc snapshot đã lọc theo quyền qua `GET /api/sync/state`, mở luồng `EventSource('/api/sync/stream')` nhận tín hiệu phiên bản mới, gửi đột biến qua `POST /api/sync/action` (`{ type, payload }`), đồng thời đồng bộ nhiều tab cùng trình duyệt qua `BroadcastChannel`.
4. **Lưu tạm trình duyệt (`localStorage` / `sessionStorage`):**
   - `localStorage`: bài làm dở (`ielts_exam_draft_<user>_<testId>`), bản nháp soạn đề (`ielts_builder_draft_*`), phiên điều hướng (`ielts_nav_session_v1`), theme sáng/tối (`ielts_theme`), danh hiệu đã thấy (`ielts_seen_titles_v1_*`).
   - `sessionStorage`: token mở khóa mật khẩu phòng thi (`ielts_exam_unlock_tokens_v1`, `ielts_speaking_unlock_tokens_v1`), cờ đã hiển thị bảng giá khi đăng nhập (`ielts_real_exam_pricing_shown_<user>`).

### Cấu trúc dữ liệu cốt lõi (Core Shapes)

**1. Đề thi (`Test / Exam` — `store.tests[]`):**
- Metadata: `id`, `title`, `description`, `visibility` (`'public' | 'private'`), `createdAt`, `assignedClassIds[]`, `hashtags[]`.
- Phân loại & Quy tắc: `testMode` (`'full_exam' | 'single_skill'`), `focusSkill` (`null | 'listening' | 'reading' | 'writing' | 'speaking'`), `examCategory` (`'real_exam' | 'periodic_mock' | 'daily_zone'`), `dailySubCategory` (`shw_1..14`, `listening_shw`, `w1_map`, `w1_process`, `w1_dynamic`, `w1_static`, `w2_essay`, `speaking_daily`, `speaking_forecast`), `writingTaskScope` (`'both' | 'task1' | 'task2'`), `priceVnd`, `maxAttempts`, `sequentialMode`, `antiCheatEnabled`, `allowInternalCopyPaste`, `allowViewAnswers`, `examPassword`, `hasExamPassword`, `scheduleMode`, `openAt`, `dueAt`.
- Cấu trúc kỹ năng: `sectionOrder[]`, `sectionDurations: { listening, reading, writing, speaking }`, `listening: { tracks[], questions[] }`, `reading: { passages[], questions[] }`, `writing: { task1: { prompt, minWords, imageUrl, modelAnswer }, task2: { ... } }`, `speaking: { speakingTrack, dailyDate, roomPassword, parts / questions[] }`.

**2. Bài nộp (`Attempt / Submission` — `store.attempts[]`):**
- Định danh & thời gian: `id`, `testId`, `testTitle`, `testMode`, `focusSkill`, `writingTaskScope`, `studentId`, `studentName`, `startedAt`, `startedAtMs`, `submittedAt`, `submittedAtMs`, `durationSeconds`, `isLate`, `lateMinutes`.
- Trạng thái duyệt & điểm: `teacherGraded` (boolean — cổng khóa hiển thị với học viên), `aiGraded`, `overallBand` (`number | null`), `scores`: chỉ chứa các kỹ năng thuộc phạm vi bài thi (`listening?: { raw, total, band }`, `reading?: { raw, total, band }`, `writing?: { task1Band, task2Band, overallBand }`, `speaking?: { band, criteria: { fc, lr, gra, pr } }`).
- Dữ liệu bài làm & chữa bài: `answers` (map `questionId -> answer`, `w1`, `w2`), `speakingRecordings[]` (`{ questionId, part, prompt, audioId, audioUrl, durationSec, transcript, band, grammarVocabularyFixes[], upgradedSample }`), `aiDetails` (chữa lỗi câu Writing), `teacherFeedback`, `tabSwitchCount`, `antiCheatLogs[]`.

**3. Người dùng (`User` — `store.users[username]`):**
- Định danh & bảo mật: `username`, `name`, `role` (`'student' | 'teacher'`), `passwordHash` (`scrypt$...`, không bao giờ gửi xuống client), `tokenVersion`, `isSuperAdmin`, `hiddenFromTeacher`, `email`, `emailVerified`, `joinedDate`, `loginDays[]`.
- Mục tiêu học tập: `targetBand`, `targetListening`, `targetReading`, `targetWriting`, `targetSpeaking`, `studyGoal`.
- Cá nhân hóa & VIP: `avatarUrl`, `avatarFrameId`, `profileBannerId`, `profileCoverUrl`, `equippedTitleId`, `showTitleBadge`, `grantedTitleIds[]`, `purchasedTitleIds[]`, `purchasedTitleExpiries`, `acknowledgedTitleIds[]`, `aieoVipExpiresAt`, `customCoverUnlocked`, `customCoverExpiresAt`, `vipRedNameEnabled`, `vipNameColor`, `vipTagEnabled`, `vipNeonCoverEnabled`, `vipNeonCoverColor`, `vipEffectsCustomizedAt`.
- Lượt thi & thanh toán: `purchasedTestIds[]` (các đề đã mở khóa), `realExamCredits` (số lượt Combo Thực Chiến còn lại), `roomCreateCredits`, `subscriptionRequested`, `paidTitleRequested`, `coverUnlockRequestedAt`.

---

## 4. CÁC TÍNH NĂNG CỐT LÕI & FILE XỬ LÝ TƯƠNG ỨNG

1. **Phòng thi IELTS Full 4 Kỹ Năng & Daily Zone:**
   - `src/pages/ExamMode.jsx`, `src/pages/SpeakingExamRoom.jsx`, `src/pages/SkillPracticeHub.jsx`, `src/pages/StudentHome.jsx`, `src/components/exam/*`, `src/constants/seedData.js`, `src/utils/sessionPersistence.js`.
2. **Hệ thống Chống Gian Lận:**
   - `src/hooks/useExamAntiCheat.js` (`evaluateInternalClipboardAction`, `detectSidePanelResize`, DOM signature check cho extension mở copy/chuột phải), tích hợp tại `src/pages/ExamMode.jsx`, chấm mức rủi ro tại `src/utils/examHelpers.js` (`getRiskAssessment`, `countExtensionCheatSignals`) và hiển thị giám sát tại `src/pages/TeacherDashboard.jsx`.
3. **Chấm bài Giáo viên & AI Nháp (Teacher Approval Gate):**
   - `syncPlugin.js` (`UPSERT_ATTEMPT`, `POST /grade-writing`, `POST /grade-speaking`, `POST /ai/generate`, `evaluateObjectiveScoresForAttempt`), `src/pages/ResultView.jsx`, `src/components/modals/TeacherGradingModal.jsx`, `src/components/speaking/SpeakingQuestionLuyennoiCard.jsx`, `src/utils/geminiGrader.js`, `src/utils/speakingAiEngine.js`.
4. **Quản trị Giáo viên, Phân Lớp & Soạn Đề:**
   - `src/pages/TeacherDashboard.jsx`, `src/pages/ExamBuilder.jsx`, `src/components/teacher/*` (`AiExamExtractorPanel`, `SkillQuestionWorkspace`, `SpeakingBuilderPanel`, `ClassManagerTab`, `ClozeEditorBox`).
5. **Đấu Trường Từ Vựng 4 Vòng (Live Room + Boss Collocation Typing):**
   - `src/pages/GameArena.jsx`, canvas game loop & realtime handlers trong `src/App.jsx`, `src/utils/animalRenderer.js`, `src/utils/examHelpers.js` (`buildSeededRoundQueues`, `buildPracticeRoundQueues`), `syncPlugin.js` (`POST /game/join`, `START_GAME`, `UPDATE_LIVE_SCORE`, `FINISH_ROOM_MATCH`).
6. **Hồ Sơ, Danh Hiệu, Lượt Đề Có Phí & Thanh Toán Tự Động:**
   - `src/pages/StudentProfile.jsx`, `src/components/common/Navbar.jsx`, `src/components/modals/RealExamPricingModal.jsx`, `CoverCheckoutModal.jsx`, `VipPromoPopupModal.jsx`, `PaymentConfigModal.jsx`, `AdminTitleManagerModal.jsx`, `src/constants/profileCustomization.js`, `syncPlugin.js` (`POST /payment/create-order`, `GET /payment/order`, `POST /payment/webhook`, `REDEEM_REAL_EXAM_CREDIT`, `TOGGLE_USER_SUBSCRIPTION`).
7. **Xác Thực, Bảo Mật Lớp & Email OTP:**
   - `src/pages/AuthScreen.jsx`, `src/components/modals/AccountSecurityModal.jsx`, `src/components/modals/MailConfigModal.jsx`, `mailService.js`, `syncPlugin.js` (`/auth/*`, `/mail/*`, cô lập bạn cùng lớp tại `getSnapshotForViewer`).

---

## 5. QUY CHUẨN GIAO DIỆN (UI/UX & DESIGN SYSTEM RULES)

Được thực thi đồng thời qua `src/index.css`, `src/anti-ai-reset.css`, skill `.agents/skills/impeccable` (`impeccable detect --json src` phải trả về `[]`) và skill tương tác mượt `.agents/skills/apple-design/SKILL.md`:

- **Bảng màu bắt buộc:**
  - **Light Mode:** Nền trang phẳng `#F8FAFC` (cấm tuyệt đối nền hồng `#fff0f6`/`#fff5f8` hoặc `radial-gradient` blob), bề mặt card `#FFFFFF`, nền phụ `#F1F5F9`, viền `#E2E8F0`, chữ chính `#0F172A`, chữ phụ `#334155` / `#475569` (đạt chuẩn WCAG AA >= 4.5:1; cấm dùng `#62748e`, `#94a3b8` cho chữ chức năng trên nền sáng).
  - **Dark Mode (Neutral Zinc — không pha xanh Slate):** Nền trang `#09090B`, bề mặt card `#18181B`, nền phụ `#27272A`, viền `#27272A`, chữ chính `#FAFAFA`, chữ phụ `#D4D4D8` / `#A1A1AA`. (Cấm kết hợp nền `#0f172a` với cyan/teal gây lỗi `AI COLOR PALETTE`.)
  - **Màu nhấn chính:** Teal đậm `#0F766E` / `#007A7A` cho CTA chính; kiểm soát hạn chế không rải màu teal/cyan lên icon trang trí.
- **Typography & Copy:**
  - Cỡ chữ tối thiểu `12px` (`text-xs`), **cấm** `text-[9px]` / `text-[10px]` / `text-[11px]`.
  - Độ dài dòng đoạn văn giới hạn `max-width: 65ch` (`max-w-2xl` / `max-w-[58ch]`).
  - **0 ký tự em-dash (`—`, `\u2014`)** trong toàn bộ văn bản hiển thị UI (dùng `-` hoặc `•`).
  - Không nhảy cấp tiêu đề (`h1 → h2 → h3` tuần tự trên mỗi màn hình).
- **Bố cục & Hiệu ứng:**
  - **Cấm thẻ lồng thẻ (Nested Cards):** Các ô con bên trong một Card phải phẳng (`bg-transparent border-0 rounded-none`) ngăn cách bằng `divide-x` / `divide-y` (áp dụng tự động bởi rule #7 trong `src/anti-ai-reset.css`).
  - **Cấm** hiệu ứng `hover:scale-*` / `transform` trực tiếp trên thẻ `<img>`.
  - **Cấm** bóng đổ neon phát sáng và `text-shadow` trên UI thường; **cấm** animation chạy ngang kiểu marquee (`.vip-shimmer-badge::after` đã vô hiệu hóa).
  - **Ngoại lệ VIP có chủ đích:** Giữ nguyên hiệu ứng cho các phần tử mang `data-avatar-badge` hoặc class `vip-*` (viền bìa/thẻ LED Neon VIP, khung Avatar VIP, `.vip-avatar-aura`, và nền ánh kim chuyển động `.vip-paid-badge` cho 5 danh hiệu trả phí kèm độ tương phản chữ `#FFFFFF` hoặc `#09090B`).

---

## 6. TRẠNG THÁI HIỆN TẠI (STATUS & KNOWN ISSUES)

### Đã hoàn thiện & đang chạy ổn định trên Production
- Toàn bộ hệ thống đề **Thực Chiến Thi Thật Full 4 Kỹ Năng (L·R·W·S · 20k hoặc Combo 3/5/10 đề · 1 lượt)**, **Mock Test Định Kỳ (300k · 3 tháng/lần)** và **Daily Zone (Miễn phí · 6 phân mục, tách lẻ W1/W2, Pass Team, Hashtags)**.
- Cơ chế **khóa điểm & chữa lỗi Writing/Speaking/Full Exam** đến khi Giáo viên duyệt (`teacherGraded`); tách sạch điểm kỹ năng lẻ (không còn hiện Speaking trên Daily Writing, không tụt trung bình `L/R` về `0.0`).
- Cài đặt & theo dõi **Mục tiêu 4 kỹ năng (`L·R·W·S`) + `Band Overall`** trên Trang chủ và Hồ sơ.
- Thanh **số lượt làm đề có phí + dấu `+`** cạnh tên học viên trên `Navbar`, modal **Bảng Giá & Combo Thực Chiến** tự bật khi học viên đăng nhập (thay cho popup VIP), hộp thoại xác nhận trừ `-1 lượt` chống trừ đúp, và gói **IELTS VIP giảm còn `20.000đ/1 tháng`** (tự động migrate cấu hình cũ `pricingSchemaVersion: 2`).
- Khôi phục nền màu chuyển động cho 5 danh hiệu mua bằng tiền + nhãn `IELTS VIP`.
- Đấu trường Từ vựng 4 vòng (gồm Vòng 4 gõ chữ Collocation hạ Boss), Email OTP khôi phục mật khẩu, bảo mật session/RBAC/cô lập lớp, và lưu trữ bền vững chống mất dữ liệu khi Railway redeploy.

### Nợ kỹ thuật & Hạn chế hiện tại (Known Issues)
1. **File nguyên khối kích thước lớn:** `src/App.jsx` (~7.700 dòng) và `syncPlugin.js` (~6.400 dòng) đang gánh quá nhiều state/route trong một file, khó bảo trì và gây bundle đơn `dist/assets/index-*.js` ~1.77 MB.
2. **Tailwind Play CDN:** Đang nạp Tailwind qua `<script src="https://cdn.tailwindcss.com">` trong `index.html` thay vì PostCSS build-time, tạo 3 cảnh báo `[lightningcss minify] Unknown at rule: @tailwind` lúc `vite build` và phụ thuộc CDN ngoài lúc tải trang.
3. **Cảnh báo lint tồn đọng:** `npm run lint -- --quiet` đạt `0 errors`, nhưng `npm run lint` đầy đủ vẫn còn ~235 warnings (chủ yếu biến/hook dependency cũ).
4. **Dependency thừa:** `firebase` trong `package.json` chưa được gỡ bỏ dù toàn bộ hệ thống đã chuyển sang `syncPlugin.js`.
5. **Giới hạn mở rộng ngang (Horizontal Scaling):** Lưu trữ JSON trên đĩa cục bộ/Volume chỉ phù hợp mô hình 1 container Railway; nếu sau này chạy nhiều replica đồng thời sẽ cần chuyển sang PostgreSQL/SQLite WAL + Object Storage cho audio.

---

## 7. LUẬT CẤM & VÙNG NHẠY CẢM (DO NOT BREAK / CONSTRAINTS)

### Vùng nhạy cảm tuyệt đối không được phá vỡ
1. **Bảo mật & Chống lộ đề (`syncPlugin.js`):**
   - Không được gỡ bỏ `stripAnswerKeysFromTest`, `sanitizeUserForViewer`, kiểm tra `hasTestPurchaseAccess`, hoặc cơ chế ẩn `SUPER_ADMIN_USERNAME` khỏi Giáo viên thường & Học viên.
   - Không bao giờ đưa mật khẩu/API key/secret vào `src/constants/seedData.js` hay bất kỳ file client nào.
   - Giữ nguyên việc server tự chấm lại câu trắc nghiệm/điền từ trong `UPSERT_ATTEMPT` và chỉ ghi `scores[focusSkill]` cho bài `single_skill`.
2. **Cô lập Writing Daily & Cổng duyệt Giáo viên:**
   - `normalizeExamConfig` (`seedData.js`) bắt buộc ép `writingTaskScope` là `'task1'` hoặc `'task2'` (không bao giờ `'both'`) khi `testMode === 'single_skill' && focusSkill === 'writing'`.
   - Tuyệt đối không tự hiển thị điểm Writing/Speaking/Full Exam hay gợi ý sửa lỗi AI cho học viên khi `attempt.teacherGraded !== true`.
3. **Lượt Combo & Thanh toán:**
   - Không bỏ bước kiểm tra chống trừ đúp (`prevTests.includes(tid)`) và chặn dùng lượt Combo 20k cho đề `periodic_mock` (300k) trong `REDEEM_REAL_EXAM_CREDIT`.
   - Giữ trường `pricingSchemaVersion: 2` trong `normalizePaymentConfig` để không làm ghi đè giá cũ hoặc phá mất giá tùy chỉnh của Admin.
4. **Phòng thi & Anti-Cheat:**
   - Giữ attribute `data-exam-copy-source="true"` trên vùng đề đọc/nghe trong `ExamMode.jsx` để `useExamAntiCheat.js` phân biệt copy nội bộ hợp lệ và paste từ ngoài.
   - Giữ `<meta name="google" content="notranslate" />` trong `index.html` để ngăn trình duyệt tự dịch đề tiếng Anh.
   - Giữ cơ chế persist `_authSecret` + `_bootId` + ghi atomic `.bak` trong `syncPlugin.js` để không đá văng session hay mất dữ liệu khi container restart.
5. **Thứ tự CSS & Ngoại lệ VIP:**
   - `src/main.jsx` phải import `index.css` trước `anti-ai-reset.css`.
   - Không xóa bộ chọn loại trừ `:not([data-avatar-badge]):not([class*="vip-"])` trong `src/anti-ai-reset.css` (nếu xóa sẽ làm vỡ toàn bộ viền Neon VIP, khung Avatar và danh hiệu động).

### Quy tắc làm việc bắt buộc cho AI Agent
- **Giữ nguyên logic khi chỉ sửa UI:** Nếu người dùng chỉ yêu cầu chỉnh giao diện/màu/bố cục, tuyệt đối không tự ý sửa state, API, phân quyền hay luồng nghiệp vụ đang chạy.
- **Trả lời code đầy đủ khi chỉnh sửa:** Khi đề xuất/chỉnh sửa file theo yêu cầu người dùng, đảm bảo thay đổi hoàn chỉnh, kiểm tra chạy sạch (`npm run lint -- --quiet`, `npm run build`, `impeccable detect --json src` và test liên quan).
- **Quy tắc Git & Railway (`AGENTS.md`):** Sau khi kiểm chứng đạt, chỉ stage các file thuộc phạm vi (cấm commit `.env`, `.data/`, file tạm), commit theo Conventional Commits, push lên `origin/main` (cấm `--force`), theo dõi Railway deployment đến khi đạt `SUCCESS` và báo rõ commit hash + URL + danh sách file.

---

## 8. VIỆC CẦN LÀM TIẾP THEO (NEXT STEPS)

1. **Tách nhỏ `src/App.jsx` & Code-Splitting bằng `React.lazy`:** Tách Game Arena canvas loop, Exam state handlers và Auth/Sync context ra các custom hook/module riêng, kết hợp lazy-load theo view (`TeacherDashboard`, `ExamBuilder`, `GameArena`, `StudentProfile`) để giảm bundle ban đầu từ ~1.77 MB xuống dưới ~400 KB.
2. **Chuyển Tailwind CSS sang Build-Time (PostCSS / `@tailwindcss/vite`):** Loại bỏ Play CDN trong `index.html` để tăng tốc tải trang, hết hoàn toàn cảnh báo `@tailwind` lúc build và ổn định offline/mạng yếu.
3. **Mô-đun hóa `syncPlugin.js` & dọn dependency thừa:** Tách `syncPlugin.js` theo miền nghiệp vụ (`authRoutes`, `paymentRoutes`, `examRoutes`, `gameRoutes`, `storePersistence`), gỡ `firebase` không dùng khỏi `package.json` và dọn dần ~235 `oxlint` warnings.
4. **Đưa bộ test tự động vào repo (`tests/`) & CI:** Di chuyển và chuẩn hóa các kịch bản kiểm thử hồi quy (RBAC/Security pentest, SSR Impeccable audit, SSE session lifecycle, restart `.bak` recovery, luồng thanh toán Combo/Đề lẻ) thành `npm test` chạy tự động trước mỗi lần push.
5. **Chính sách dọn file audio & lộ trình nâng cấp DB:** Thêm cơ chế thống kê dung lượng / dọn dẹp file ghi âm cũ quá hạn trên Railway Volume, và chuẩn bị lớp adapter nếu cần nâng cấp từ JSON file lên SQLite/PostgreSQL khi lượng học viên tăng cao.
