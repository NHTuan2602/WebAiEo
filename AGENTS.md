# Workspace Rules - LexiPrep Academy (`webAIEo`)

## Quy tắc Git Auto-Commit, Auto-Push & Auto-Deploy Railway
- Sau khi hoàn thành một tính năng, sửa lỗi hoặc một công việc chỉnh sửa mã nguồn trong dự án này:
  1. Chạy kiểm tra (`npm run lint` và `npm run build`, cùng kiểm thử liên quan nếu có thay đổi logic backend/sync) để đảm bảo không có lỗi trước khi commit.
  2. Chỉ stage (`git add`) các file thuộc phạm vi công việc đã chỉnh sửa (tránh stage file tạm, bí mật như `.env`, hoặc file dữ liệu phát sinh ngoài phạm vi).
  3. Tự động thực hiện `git commit` ngay với commit message rõ ràng theo quy ước sẵn có của repo (`feat: ...`, `fix: ...`, `chore: ...`).
  4. Tự động thực hiện `git push` lên remote (`origin/main`, tuyệt đối không `--force`) sau khi commit sạch sẽ và toàn bộ bước kiểm tra đã đạt. (Chỉ bỏ qua push nếu người dùng yêu cầu rõ không push ở lần đó.)
  5. Tự động cập nhật & xác nhận deploy lên Railway (project `webaieo` — `7732839e-d70f-4029-9a67-0a10b795744b`, service `webaieo` — `71eeafa6-685e-49ce-8d98-0218b1be833a`, env `production`, domain `https://webaieo-production.up.railway.app`):
     - Theo dõi qua `railway_mcp` (`list-deployments` / `get-status`) cho đến khi deployment tương ứng với commit vừa push đạt trạng thái `SUCCESS` (không báo thành công khi mới `QUEUED`/`BUILDING`).
     - Nếu push xong mà Railway chưa tự tạo deployment hoặc deployment lỗi, chủ động kiểm tra logs (`get-logs`) và kích hoạt cập nhật lại (`redeploy` hoặc `railway up` nếu có CLI), sau đó xác nhận kết quả thực tế.
  6. Nêu rõ mã commit hash, trạng thái push lên remote (`origin/main`), trạng thái & URL deployment Railway, và danh sách file đã commit trong phản hồi cuối cùng.
