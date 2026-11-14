# Workspace Rules - LexiPrep Academy (`webAIEo`)

## Quy tắc Git Auto-Commit & Auto-Push
- Sau khi hoàn thành một tính năng, sửa lỗi hoặc một công việc chỉnh sửa mã nguồn trong dự án này:
  1. Chạy kiểm tra (`npm run lint` và `npm run build`, cùng kiểm thử liên quan nếu có thay đổi logic backend/sync) để đảm bảo không có lỗi trước khi commit.
  2. Chỉ stage (`git add`) các file thuộc phạm vi công việc đã chỉnh sửa (tránh stage file tạm, bí mật như `.env`, hoặc file dữ liệu phát sinh ngoài phạm vi).
  3. Tự động thực hiện `git commit` ngay với commit message rõ ràng theo quy ước sẵn có của repo (`feat: ...`, `fix: ...`, `chore: ...`).
  4. Tự động thực hiện `git push` lên remote (`origin/main`, tuyệt đối không `--force`) sau khi commit sạch sẽ và toàn bộ bước kiểm tra đã đạt. (Chỉ bỏ qua push nếu người dùng yêu cầu rõ không push ở lần đó.)
  5. Nêu rõ mã commit hash, trạng thái push lên remote (`origin/main`) và danh sách file đã commit trong phản hồi cuối cùng.
