import { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Lock, Phone, QrCode, Send, Settings, Sparkles } from 'lucide-react';
import { ADMIN_PAYMENT_CONTACT } from '../../constants/brandInfo';
import {
  buildCoverUnlockTransferNote,
  buildVietQrImageUrl,
  formatVndCurrency,
  getTitlePriceVnd,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

export default function CoverUnlockQrCard({
  username = '',
  orderCode = '',
  order = null,
  itemType = 'cover',
  itemId = '',
  itemTitle = '',
  itemPrice = null,
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
  const resolvedAmount =
    itemPrice !== null && itemPrice !== undefined
      ? Math.max(0, Number(itemPrice) || 0)
      : itemType === 'title'
      ? getTitlePriceVnd(itemId, cfg)
      : itemType === 'test'
      ? cfg.defaultExamPriceVnd
      : itemType === 'room_ticket'
      ? cfg.friendRoomTicketPrice
      : itemType === 'aieo_vip'
      ? cfg.aieoVipPrice
      : cfg.coverUnlockPrice;
  const priceLabel = formatVndCurrency(resolvedAmount);
  const transferNote = buildCoverUnlockTransferNote(username, orderCode);
  const payosQrDataUrl = !isPreview ? String(order?.payosQrDataUrl || '') : '';
  const payosCheckoutUrl = !isPreview ? String(order?.payosCheckoutUrl || '') : '';
  const displayAccountNumber = (!cfg.customQrUrl && payosQrDataUrl && order?.payosAccountNumber)
    ? String(order.payosAccountNumber)
    : cfg.accountNumber;
  const displayAccountName = (!cfg.customQrUrl && payosQrDataUrl && order?.payosAccountName)
    ? String(order.payosAccountName)
    : cfg.accountName;
  const displayTransferNote = (!cfg.customQrUrl && payosQrDataUrl && order?.payosDescription)
    ? String(order.payosDescription)
    : transferNote;
  const vietQrUrl = buildVietQrImageUrl({
    bankCode: cfg.bankCode,
    accountNumber: displayAccountNumber,
    accountName: displayAccountName,
    amount: resolvedAmount,
    addInfo: displayTransferNote
  });
  const activeQrUrl = cfg.customQrUrl || payosQrDataUrl || vietQrUrl;
  const hasBankDetails = Boolean(displayAccountNumber && (cfg.bankCode || cfg.bankName || payosQrDataUrl));
  const headingText = itemType === 'title' && itemTitle
    ? `Mua Danh Hiệu VIP (1 Tháng): ${itemTitle}`
    : itemType === 'test'
    ? `Mua Đề Thi 3 Kỹ Năng: ${itemTitle || 'IELTS Practice Exam'}`
    : itemType === 'room_ticket'
    ? 'Mua 1 Lượt Tạo Phòng Đấu Riêng (5k/lần)'
    : itemType === 'aieo_vip'
    ? 'Đăng Ký Gói Ai eo VIP Full Quyền (1 Tháng)'
    : 'Mở Khóa Tải Ảnh Nền Riêng (1 Tháng)';
  const subText = itemType === 'title'
    ? 'Quét mã VietQR để sở hữu danh hiệu Phú Quý ánh kim + hào quang Avatar nổi bật suốt 30 ngày!'
    : itemType === 'test'
    ? 'Quét mã VietQR để mở khóa bộ Đề Thi 3 Kỹ Năng này và làm lại nhiều lần không giới hạn!'
    : itemType === 'room_ticket'
    ? 'Quét mã VietQR để nhận ngay +1 lượt Tạo Phòng Đấu Trường Bạn Bè (tùy chỉnh số người & chia Team)!'
    : itemType === 'aieo_vip'
    ? 'Đặc quyền 30 ngày: Danh Hiệu Ai eo VIP + Tạo Phòng Đấu Bạn Bè (tùy chỉnh số người & chia Team) + Chữ Tên Đỏ & Nhãn AIEOVIP!'
    : autoVerifyEnabled
    ? 'Quét mã QR bằng app Ngân hàng bất kỳ - hệ thống tự mở khóa quyền tải & cắt ảnh bìa trong 30 ngày ngay khi nhận đủ tiền!'
    : 'Quét mã QR chuyển khoản 1 lần để sử dụng tính năng tải & cắt ảnh nền riêng trong 1 tháng (30 ngày).';

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
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172B] p-4 space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6] shrink-0" />
            <span>{headingText}</span>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {subText}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F766E] text-white text-xs font-bold tabular-nums">
          <Sparkles className="w-3 h-3" /> {priceLabel}
        </span>
      </div>

      {/* Pre-payment Donate & Web Maintenance Support Message */}
      <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155] text-xs text-[#334155] dark:text-slate-200 font-semibold leading-relaxed">
        ☕ {cfg.donateMessage || 'Donate để ủng hộ Tuấn chi phí duy trì trang web, tên miền, máy chủ & hệ thống AI phục vụ học tập miễn phí cho lớp. Xin trân trọng cảm ơn!'}
      </div>

      {activeQrUrl && !qrLoadError ? (
        <div className={`flex flex-col ${isPreview ? '' : 'md:flex-row'} gap-4 ${isPreview ? '' : 'md:gap-5'} items-stretch ${isPreview ? '' : 'md:items-center'}`}>
          <div className={`shrink-0 mx-auto ${isPreview ? '' : 'md:mx-0'} bg-white ${isPreview ? 'p-2.5' : 'p-3.5'} rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 w-fit`}>
            <img
              src={activeQrUrl}
              alt={`Mã QR chuyển khoản ${priceLabel}`}
              onError={() => setQrLoadError(true)}
              className={`${isPreview ? 'w-44 h-44' : 'w-60 h-60 sm:w-64 sm:h-64'} object-contain rounded-xl`}
            />
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
              <QrCode className="w-3.5 h-3.5 text-[#007A7A]" /> {payosQrDataUrl ? 'VietQR PayOS • Tự động 24/7' : 'VietQR • Quét bằng app Ngân hàng'}
            </span>
            {payosCheckoutUrl && (
              <a
                href={payosCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full justify-center px-3 py-1.5 rounded-lg bg-[#007A7A]/10 hover:bg-[#007A7A]/20 text-[#007A7A] text-xs font-extrabold inline-flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Mở cổng PayOS
              </a>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-xs">
            {hasBankDetails && (
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#475569] dark:text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                    <CreditCard className="w-3 h-3" /> Ngân hàng
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-right">
                    {cfg.bankName || cfg.bankCode || 'Ngân hàng nhận VietQR'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#475569] dark:text-slate-400 whitespace-nowrap shrink-0">Số TK</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {displayAccountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(displayAccountNumber, 'stk', 'số tài khoản')}
                      className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-0.5"
                    >
                      {copiedField === 'stk' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                      {copiedField === 'stk' ? 'Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>
                {displayAccountName && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#475569] dark:text-slate-400 whitespace-nowrap shrink-0">Chủ TK</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-right">
                      {displayAccountName}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/35 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[#475569] dark:text-slate-400 whitespace-nowrap shrink-0">Số tiền chính xác</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{priceLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[#475569] dark:text-slate-400 whitespace-nowrap shrink-0">Nội dung CK</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <code className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono font-extrabold text-xs whitespace-nowrap">
                    {displayTransferNote}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(displayTransferNote, 'note', 'nội dung chuyển khoản')}
                    className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-200 inline-flex items-center gap-0.5"
                  >
                    {copiedField === 'note' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedField === 'note' ? 'Đã chép' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Giữ nguyên nội dung <b>{displayTransferNote}</b> khi chuyển để hệ thống khớp đúng đơn hàng.
              </p>
            </div>

            {cfg.paymentNoteHint && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic px-0.5">
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
              Quản Trị Hệ Thống chưa cấu hình Số Tài Khoản Ngân Hàng nhận mã QR
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Chỉ <b>Quản Trị Viên</b> mới có thể cài đặt tài khoản nhận tiền tại <b>Quản Lý &amp; Giảng Dạy → QR &amp; Giá Tiền</b>. Cần hỗ trợ ngay, liên hệ Quản Trị Viên: <b>{ADMIN_PAYMENT_CONTACT.phoneRaw}</b>.
            </p>
          </div>
        </div>
      )}

      {!isPreview && (
        <div className="pt-1 space-y-2">
          {autoVerifyEnabled && activeQrUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35">
              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Đang chờ giao dịch tự động (SePay / PayOS)... Tự mở khóa sau 2–5 giây khi nhận đủ {priceLabel}!</span>
              </span>
              {onRequestUnlock && (
                <button
                  type="button"
                  disabled={requesting}
                  onClick={onRequestUnlock}
                  className="shrink-0 text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline whitespace-nowrap"
                >
                  {requestedAt > 0 ? '✓ Đã báo Quản trị' : 'Báo Quản trị kiểm tra'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {requestedAt > 0 ? (
                <div className="flex-1 px-3 py-2 rounded-xl bg-amber-100/90 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Đã gửi yêu cầu mở khóa - đang chờ Quản Trị Viên xác nhận giao dịch!</span>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Quét QR {priceLabel} xong, bấm nút bên cạnh để báo Quản Trị Viên duyệt:</span>
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
                    ? 'Nhắc lại Quản trị'
                    : `Tôi đã chuyển ${priceLabel}`}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 text-xs">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
              <span>Hỗ trợ thanh toán / duyệt nhanh ({ADMIN_PAYMENT_CONTACT.label}):</span>
              <a
                href={ADMIN_PAYMENT_CONTACT.phoneHref}
                className="font-mono font-extrabold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
              >
                {ADMIN_PAYMENT_CONTACT.phoneRaw}
              </a>
            </span>
            <a
              href={ADMIN_PAYMENT_CONTACT.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-[#007A7A]/10 dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] font-extrabold text-xs hover:bg-[#007A7A]/20 transition"
            >
              Nhắn Zalo Admin
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
