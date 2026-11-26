import { useState } from 'react';
import { AlertTriangle, RefreshCw, ServerCrash, WifiOff, Wrench } from 'lucide-react';
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

const DEMO_SCENARIOS = [
  { id: 'maintenance', label: 'Bảo trì (503)' },
  { id: 'server_error', label: 'Sập / Lỗi Server (500)' },
  { id: 'disconnected', label: 'Mất kết nối mạng' },
  { id: 'crash', label: 'Lỗi giao diện (Crash)' }
];

export default function ServerMaintenanceOverlay({
  checking = false,
  mode = 'maintenance',
  statusCode = 0,
  isOffline = false,
  isCrash = false,
  onRetry = null,
  canDismiss = false,
  dismissLabel = 'Đóng xem trước',
  onDismiss = null,
  allowDemoSwitch = false
}) {
  const [memeIdx, setMemeIdx] = useState(() => pickNonRepeatingMemeIdx());
  const initialMode = isCrash
    ? 'crash'
    : isOffline
    ? 'disconnected'
    : mode === 'server_error' || mode === 'disconnected' || mode === 'crash'
    ? mode
    : 'maintenance';
  const [previewModeOverride, setPreviewModeOverride] = useState(null);
  const activeMode = allowDemoSwitch && previewModeOverride ? previewModeOverride : initialMode;
  const activeMemeSrc = MAINTENANCE_MEMES[memeIdx] || meme0;

  const isCrashMode = activeMode === 'crash';
  const isDisconnectedMode = activeMode === 'disconnected';
  const isServerErrorMode = activeMode === 'server_error';

  const effectiveStatusLabel =
    isServerErrorMode
      ? `Lỗi máy chủ / Quá tải (${statusCode >= 500 ? statusCode : '500/503'})`
      : isDisconnectedMode
      ? 'Mất kết nối mạng / Đang bảo trì'
      : isCrashMode
      ? 'Sự cố hiển thị / Lỗi ứng dụng'
      : 'Đang bảo trì máy chủ (503)';

  const badgeClass = isCrashMode || isServerErrorMode
    ? 'bg-rose-100 dark:bg-rose-500/15 text-[#9F1239] dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
    : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/40';

  const descriptionText = isCrashMode
    ? 'Trang web vừa gặp sự cố bất ngờ. Dữ liệu bài làm dở vẫn được lưu tạm trên trình duyệt của bạn, hãy bấm tải lại trang ngay bên dưới.'
    : isServerErrorMode
    ? 'Máy chủ đang quá tải hoặc vừa khởi động lại đột xuất (HTTP 500/502/503). Bài làm và phiên đăng nhập vẫn được bảo toàn, hệ thống sẽ tự đồng bộ lại ngay.'
    : isDisconnectedMode
    ? 'Kết nối tới máy chủ tạm thời bị gián đoạn. Hệ thống đang tự kiểm tra lại mỗi vài giây và giữ nguyên bài làm của bạn trên trình duyệt.'
    : 'Hệ thống đang tự động kiểm tra lại máy chủ mỗi vài giây và sẽ tự kết nối lại ngay khi sẵn sàng. Bài làm của bạn vẫn được giữ an toàn.';

  return (
    <div
      data-server-maintenance-overlay="true"
      data-server-outage-mode={activeMode}
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-maintenance-heading"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 text-center space-y-4 my-auto">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-extrabold uppercase tracking-wider ${badgeClass}`}
        >
          {isDisconnectedMode ? (
            <WifiOff className="w-3.5 h-3.5" />
          ) : isCrashMode ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : isServerErrorMode ? (
            <ServerCrash className="w-3.5 h-3.5" />
          ) : (
            <Wrench className="w-3.5 h-3.5" />
          )}
          <span>{effectiveStatusLabel}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-900/5 dark:bg-zinc-900">
          <img
            src={activeMemeSrc}
            alt="Thông báo bảo trì hoặc sự cố máy chủ"
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
            {descriptionText}
          </p>
        </div>

        {allowDemoSwitch && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-zinc-400">
              Xem thử các kịch bản sự cố / sập server:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {DEMO_SCENARIOS.map(sc => {
                const isSelected = activeMode === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    data-testid={`outage-demo-mode-${sc.id}`}
                    onClick={() => {
                      setPreviewModeOverride(sc.id);
                      setMemeIdx(prev => pickNonRepeatingMemeIdx(prev));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      isSelected
                        ? 'bg-[#0F766E] text-white border-[#0F766E]'
                        : 'bg-[#F1F5F9] hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#334155] dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                : isCrashMode
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
