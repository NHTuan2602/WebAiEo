import { RefreshCw, WifiOff, Wrench } from 'lucide-react';
import maintenanceMemeImg from '../../assets/server-maintenance.jpg?inline';

export const SERVER_MAINTENANCE_MESSAGE =
  'Sever đang được bảo trì hoặc Admin lỡ đái nhầm vào sever vui lòng đợi trong giây lát';

export default function ServerMaintenanceOverlay({
  isOpen = true,
  mode = 'disconnected',
  checking = false,
  canDismiss = false,
  dismissLabel = 'Đóng xem trước',
  onRetry = null,
  onDismiss = null
}) {
  if (!isOpen) return null;

  const isCrash = mode === 'crash';
  const statusBadge = isCrash
    ? 'LỖI ỨNG DỤNG / BẢO TRÌ KHẨN CẤP'
    : 'MẤT KẾT NỐI MÁY CHỦ / ĐANG BẢO TRÌ';

  return (
    <div
      data-server-maintenance-overlay="true"
      className="apple-backdrop-enter fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#F8FAFC]/95 dark:bg-[#09090B]/95 backdrop-blur-md overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="server-maintenance-heading"
    >
      <div className="apple-modal-sheet w-full max-w-lg rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 text-center shadow-2xl space-y-5 my-auto">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold tracking-wide uppercase">
            {isCrash ? (
              <Wrench className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusBadge}</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900">
          <img
            src={maintenanceMemeImg}
            alt="Thông báo bảo trì máy chủ"
            className="w-full max-h-[280px] object-cover block mx-auto"
          />
        </div>

        <div className="space-y-2.5">
          <h1
            id="server-maintenance-heading"
            className="text-lg sm:text-xl font-extrabold text-[#0F172A] dark:text-[#FAFAFA] leading-snug"
          >
            {SERVER_MAINTENANCE_MESSAGE}
          </h1>
          <p className="text-sm text-[#475569] dark:text-zinc-400 leading-relaxed mx-auto">
            {isCrash
              ? 'Trang web vừa gặp sự cố bất ngờ. Dữ liệu bài làm dở vẫn được lưu tạm trên trình duyệt của bạn, hãy bấm tải lại trang ngay bên dưới.'
              : 'Hệ thống đang tự động kiểm tra lại máy chủ mỗi vài giây và sẽ tự kết nối lại ngay khi sẵn sàng. Bài làm của bạn vẫn được giữ an toàn.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={checking}
            onClick={() => {
              if (onRetry) {
                onRetry();
              } else if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-60 text-white text-sm font-bold transition inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${checking ? 'animate-spin' : ''}`} />
            <span>
              {checking
                ? 'Đang kiểm tra máy chủ...'
                : isCrash
                ? 'Tải Lại Trang Ngay'
                : 'Thử Kết Nối Lại Ngay'}
            </span>
          </button>

          {canDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-slate-200 dark:bg-[#27272A] dark:hover:bg-zinc-700 text-[#1E293B] dark:text-[#E4E4E7] border border-[#E2E8F0] dark:border-zinc-700 text-sm font-bold transition"
            >
              {dismissLabel}
            </button>
          )}
        </div>

        <p className="text-xs text-[#475569] dark:text-zinc-400 pt-2 border-t border-slate-200 dark:border-zinc-800 mx-auto">
          Luyện Thi IELTS Nha Trang (Ms. Như) • Hotline: 0969 917 460 • Zalo kỹ thuật: 0367 073 526
        </p>
      </div>
    </div>
  );
}
