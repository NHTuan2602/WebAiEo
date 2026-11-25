import { useState } from 'react';
import { RefreshCw, WifiOff, Wrench } from 'lucide-react';
import meme0 from '../../assets/server-maintenance.jpg?inline';
import meme1 from '../../assets/memes/meme-1.png?inline';
import meme2 from '../../assets/memes/meme-2.png?inline';
import meme3 from '../../assets/memes/meme-3.jpg?inline';
import meme4 from '../../assets/memes/meme-4.jpg?inline';
import meme5 from '../../assets/memes/meme-5.jpg?inline';
import meme6 from '../../assets/memes/meme-6.png?inline';

const MAINTENANCE_MEMES = [meme1, meme2, meme3, meme4, meme5, meme6, meme0];
const MEME_STORAGE_KEY = 'ielts_last_maintenance_meme_idx';

function pickNonRepeatingMemeIdx(excludeIdx = -1) {
  const total = MAINTENANCE_MEMES.length;
  if (total <= 1) return 0;
  let lastIdx = excludeIdx;
  if (lastIdx < 0 && typeof window !== 'undefined') {
    try {
      const raw = Number.parseInt(window.sessionStorage.getItem(MEME_STORAGE_KEY) || '', 10);
      if (Number.isInteger(raw) && raw >= 0 && raw < total) lastIdx = raw;
    } catch {
      // Ignore storage access errors in restricted modes
    }
  }
  const candidates = [];
  for (let i = 0; i < total; i += 1) {
    if (i !== lastIdx) candidates.push(i);
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(MEME_STORAGE_KEY, String(chosen));
    } catch {
      // Ignore storage access errors
    }
  }
  return chosen;
}

export const SERVER_MAINTENANCE_MESSAGE =
  'Máy chủ đang được bảo trì hoặc gặp sự cố tạm thời, vui lòng đợi trong giây lát';

export default function ServerMaintenanceOverlay({
  checking = false,
  isOffline = false,
  isCrash = false,
  onRetry = null,
  canDismiss = false,
  dismissLabel = 'Đóng xem trước',
  onDismiss = null
}) {
  const [memeIdx, setMemeIdx] = useState(() => pickNonRepeatingMemeIdx());
  const activeMemeSrc = MAINTENANCE_MEMES[memeIdx] || meme0;

  return (
    <div
      data-server-maintenance-overlay="true"
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-maintenance-heading"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold uppercase tracking-wider">
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
          <span>
            {isOffline
              ? 'Mất kết nối mạng / Đang bảo trì'
              : isCrash
              ? 'Sự cố hiển thị / Đang bảo trì'
              : 'Đang bảo trì máy chủ'}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-900/5 dark:bg-zinc-900">
          <img
            src={activeMemeSrc}
            alt="Thông báo bảo trì máy chủ"
            data-meme-idx={memeIdx}
            className="w-full max-h-[280px] object-contain block mx-auto"
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
              setMemeIdx(prev => pickNonRepeatingMemeIdx(prev));
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
