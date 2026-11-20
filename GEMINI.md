# Workspace Rules - Luyện Thi IELTS Nha Trang — IELTS with Ms. Như (`webAIEo`)

## 1. Giới thiệu Dự án
Dự án **`webAIEo`** là nền tảng luyện thi IELTS toàn diện dành cho trung tâm **Luyện Thi IELTS Nha Trang — IELTS with Ms. Như**.
Hệ thống cung cấp trải nghiệm thi IELTS Computer-Delivered chuẩn quốc tế cùng hệ sinh thái học tập và giải trí kết hợp:
- **Thi thử 4 Kỹ năng IELTS (Computer-Delivered):**
  - **Reading & Listening:** Giao diện thi 2 cột Resizable Split Screen, thanh điều hướng Part/Passage, highlight văn bản, ghi chú, đánh dấu câu hỏi (Bookmark flag). Hỗ trợ chuẩn các dạng Cambridge: Matching Information (Matrix Grid Table), Summary Completion (có hộp từ A–I và không có hộp), True/False/Not Given, Multiple Choice, Diagram Labelling, Matching Headings.
  - **Speaking:** Luyện nói với AI (AI Speaking Room), chấm phát âm, ngữ pháp, từ vựng theo tiêu chuẩn Cambridge Band Descriptors, mô phỏng phòng thi thật.
  - **Writing:** Trình soạn thảo Task 1 & Task 2 với bộ đếm từ tự động, đồng hồ đếm ngược, chấm điểm và gợi ý sửa lỗi AI.
- **Đấu Trường Từ Vựng (Game Arena):** Trò chơi đối kháng từ vựng realtime, hiệu ứng AmongUs Crewmate / Animal Pilot Avatar, bảng xếp hạng, power-ups (Freeze, Hint, Multiplier), phòng thi đấu cá nhân và đồng đội.
- **Quản lý & Giảng dạy (Teacher & Admin Dashboard):** Trích xuất đề thi tự động từ file PDF bằng Gemini AI (Multimodal PDF Extractor), quản lý lớp học, phân quyền học viên, quản lý gói VIP / Member Titles / Thẻ lượt thi và đồng bộ dữ liệu.

---

## 2. Thông tin Hạ tầng & Triển khai (Infrastructure & Deployment)
- **Production URL:** [https://luyenthiieltsnhatrang.up.railway.app](https://luyenthiieltsnhatrang.up.railway.app)
- **Railway Project ID:** `webaieo` (`7732839e-d70f-4029-9a67-0a10b795744b`)
- **Railway Service ID:** `webaieo` (`71eeafa6-685e-49ce-8d98-0218b1be833a`)
- **Environment:** `production`
- **Git Remote:** `https://github.com/NHTuan2602/WebAiEo.git` (`main` branch)

---

## 3. Tech Stack & Cấu trúc Dự án
- **Frontend:**
  - React 19 (`react`, `react-dom`), Vite 8.
  - Tailwind CSS, Lucide React icons, Canvas Confetti.
  - Single-Page Application (SPA) với quản lý trạng thái mượt mà, tối ưu hiệu năng và không phụ thuộc nặng nề vào thư viện ngoài cồng kềnh.
- **Backend & Server:**
  - Node.js + Express (`server.js`).
  - Phục vụ Static Client (`dist/`), xử lý API AI Proxy, đồng bộ realtime phòng chơi Game Arena và cấu hình mail/thanh toán.
- **Thư mục quan trọng:**
  - `src/components/exam/`: Các component phòng thi (`ExamQuestionList`, `ClozeNoteSheet`, `SplitResizableWorkspace`...).
  - `src/components/teacher/`: Bộ công cụ tạo và trích xuất đề (`AiExamExtractorPanel`, `ClozeEditorBox`...).
  - `src/utils/`: Logic nghiệp vụ lõi (`clozeHelpers.js`, `examUiHelpers.js`, `geminiGrader.js`, `readingNumberRepair.js`...).
  - `src/pages/`: Các màn hình chính (`ExamMode`, `GameArena`, `TeacherDashboard`, `StudentHome`...).

---

## 4. Lệnh Phát triển & Kiểm tra (Commands)
```bash
# Cài đặt thư viện
npm install

# Chạy server phát triển (Vite Dev Server)
npm run dev

# Kiểm tra chất lượng mã nguồn (Linting với Oxlint)
npm run lint

# Biên dịch mã nguồn cho môi trường production
npm run build

# Chạy server ứng dụng production (Express)
npm start
```

---

## 5. Quy tắc Git Auto-Commit, Auto-Push & Auto-Deploy Railway
Sau khi hoàn thành bất kỳ tính năng, sửa lỗi hoặc điều chỉnh mã nguồn nào:
1. **Kiểm tra chất lượng trước khi commit:**
   - Chạy `npm run lint` và `npm run build` để đảm bảo 0 lỗi biên dịch.
2. **Stage chính xác:**
   - Chỉ `git add` các file thuộc phạm vi công việc đã chỉnh sửa (tuyệt đối tránh stage file tạm, file bí mật như `.env`, hoặc thư mục phát sinh ngoài phạm vi).
3. **Commit theo quy chuẩn Conventional Commits:**
   - Sử dụng commit message rõ ràng: `feat: ...`, `fix: ...`, `chore: ...`.
4. **Push lên Remote an toàn:**
   - Tự động `git push origin main` (tuyệt đối không sử dụng `--force`).
5. **Xác nhận Deploy Railway:**
   - Đảm bảo phiên bản mới đã được build và deploy thành công trên domain `https://luyenthiieltsnhatrang.up.railway.app` (trạng thái `SUCCESS`, mã HTTP `200`).
6. **Báo cáo kết quả:**
   - Nêu rõ mã commit hash, trạng thái push remote, trạng thái deploy Railway và danh sách file đã chỉnh sửa trong phản hồi.

---

## 6. Tiêu chuẩn Thiết kế & Trải nghiệm Người dùng (UI/UX Guidelines)
- **Chuẩn Computer-Delivered IELTS:** Giữ tính trung thực cao nhất với giao diện thi máy Cambridge / IDP / BC.
- **Typography & Layout:** Bố cục rõ ràng, font chữ sắc nét, độ tương phản cao ở cả Light Mode và Dark Mode.
- **Responsive:** Hoạt động hoàn hảo trên cả máy tính bàn, laptop lẫn iPad / máy tính bảng và điện thoại.
- **Độ ổn định:** Không để phát sinh lỗi ngắt dòng gãy chữ, xử lý mượt mà văn bản bài đọc và các ô đục lỗ.
