import { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, CreditCard, Lock, QrCode, Send, Settings, Sparkles } from 'lucide-react';
import {
  buildCoverUnlockTransferNote,
  buildVietQrImageUrl,
  formatVndCurrency,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

export default function CoverUnlockQrCard({
  username = '',
  orderCode = '',
  paymentConfig = null,
  requestedAt = 0,
  isPreview = false,
  requesting = false,
  onRequestUnlock = null,
  showToast = null
}) {
  const [copiedField, setCopiedField] = useState('');
  const [qrLoadError, setQrLoadError] = useState(false);

  const cfg = normalizePaymentConfig(paymentConfig || {});
  const autoVerifyEnabled = Boolean(paymentConfig?.autoVerifyEnabled);
  const priceLabel = formatVndCurrency(cfg.coverUnlockPrice);
  const transferNote = buildCoverUnlockTransferNote(username, orderCode);
  const vietQrUrl = buildVietQrImageUrl({
    bankCode: cfg.bankCode,
    accountNumber: cfg.accountNumber,
    accountName: cfg.accountName,
    amount: cfg.coverUnlockPrice,
    addInfo: transferNote
  });
  const activeQrUrl = cfg.customQrUrl || vietQrUrl;
  const hasBankDetails = Boolean(cfg.accountNumber && (cfg.bankCode || cfg.bankName));

  const copyText = async (value, fieldKey, label) => {
    if (!value) return;
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedField(fieldKey);
      showToast?.(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedField(prev => (prev === fieldKey ? '' : prev)), 1800);
    } catch {
      showToast?.(`Nội dung: ${value}`);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/90 dark:border-amber-500/40 bg-gradient-to-br from-amber-50/90 via-white to-teal-50/70 dark:from-amber-950/25 dark:via-slate-900 dark:to-teal-950/20 p-4 space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Mở Khóa Tải Ảnh Nền Riêng</span>
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {autoVerifyEnabled
              ? 'Quét mã QR bằng app Ngân hàng bất kỳ — hệ thống sẽ tự động mở khóa ngay sau khi nhận đủ tiền!'
              : 'Quét mã QR chuyển khoản 1 lần để sử dụng tính năng tải & cắt ảnh nền riêng vĩnh viễn.'}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs tabular-nums">
          <Sparkles className="w-3 h-3" /> {priceLabel}
        </span>
      </div>

      {activeQrUrl && !qrLoadError ? (
        <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-start">
          <div className="shrink-0 mx-auto sm:mx-0 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1">
            <img
              src={activeQrUrl}
              alt={`Mã QR chuyển khoản ${priceLabel}`}
              onError={() => setQrLoadError(true)}
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
            />
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-[#007A7A]" /> VietQR • Quét bằng app Ngân hàng
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-xs">
            {hasBankDetails && (
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Ngân hàng
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-right truncate">
                    {cfg.bankName || cfg.bankCode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Số TK</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {cfg.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(cfg.accountNumber, 'stk', 'số tài khoản')}
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-0.5"
                    >
                      {copiedField === 'stk' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                      {copiedField === 'stk' ? 'Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>
                {cfg.accountName && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Chủ TK</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 uppercase truncate">
                      {cfg.accountName}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/35 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Số tiền chính xác</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{priceLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Nội dung CK</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <code className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono font-extrabold text-[11px] truncate">
                    {transferNote}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(transferNote, 'note', 'nội dung chuyển khoản')}
                    className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-200 inline-flex items-center gap-0.5"
                  >
                    {copiedField === 'note' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedField === 'note' ? 'Đã chép' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Giữ nguyên nội dung <b>{transferNote}</b> khi chuyển để hệ thống khớp đúng tài khoản của bạn.
              </p>
            </div>

            {cfg.paymentNoteHint && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic px-0.5">
                {cfg.paymentNoteHint}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 flex items-start gap-3">
          <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-slate-900 dark:text-white">
              Chưa cài đặt Số Tài Khoản Ngân Hàng nhận mã QR
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Giáo viên / Quản trị viên hãy vào <b>Quản Lý &amp; Giảng Dạy → Tài Khoản Lớp → QR Ảnh Nền ({priceLabel})</b> để điền Ngân hàng &amp; Số tài khoản. Sau khi lưu, mã VietQR sẽ hiện tự động ở đây để học viên quét ngay!
            </p>
          </div>
        </div>
      )}

      {!isPreview && (
        <div className="pt-1 space-y-2">
          {autoVerifyEnabled && activeQrUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35">
              <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Đang chờ giao dịch tự động (SePay / PayOS)... Tự mở khóa sau 2–5 giây khi nhận đủ {priceLabel}!</span>
              </span>
              {onRequestUnlock && (
                <button
                  type="button"
                  disabled={requesting}
                  onClick={onRequestUnlock}
                  className="shrink-0 text-[10px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline whitespace-nowrap"
                >
                  {requestedAt > 0 ? '✓ Đã báo giáo viên' : 'Báo kiểm tra thủ công'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {requestedAt > 0 ? (
                <div className="flex-1 px-3 py-2 rounded-xl bg-amber-100/90 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Đã gửi yêu cầu mở khóa — đang chờ Giáo viên xác nhận giao dịch!</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Quét QR {priceLabel} xong, bấm nút bên cạnh để xác nhận:</span>
                </p>
              )}
              {onRequestUnlock && (
                <button
                  type="button"
                  disabled={requesting}
                  onClick={onRequestUnlock}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-60 text-white text-xs font-extrabold transition inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {requesting
                    ? 'Đang gửi...'
                    : requestedAt > 0
                    ? 'Nhắc lại yêu cầu'
                    : `Tôi đã chuyển ${priceLabel}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
