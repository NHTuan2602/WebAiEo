# Workspace Rules - LexiPrep Academy (`webAIEo`)

## Quy tắc Git Auto-Commit
- Sau khi hoàn thành một tính năng, sửa lỗi hoặc một công việc chỉnh sửa mã nguồn trong dự án này:
  1. Chạy kiểm tra (`npm run lint` và `npm run build`, cùng kiểm thử liên quan nếu có thay đổi logic backend/sync) để đảm bảo không có lỗi trước khi commit.
  2. Chỉ stage (`git add`) các file thuộc phạm vi công việc đã chỉnh sửa (tránh stage file tạm, bí mật như `.env`, hoặc file dữ liệu phát sinh ngoài phạm vi).
  3. Tự động thực hiện `git commit` ngay với commit message rõ ràng theo quy ước sẵn có của repo (`feat: ...`, `fix: ...`, `chore: ...`).
  4. Không tự động `git push` lên remote trừ khi người dùng yêu cầu rõ ràng.
  5. Nêu rõ mã commit hash và danh sách file đã commit trong phản hồi cuối cùng.
