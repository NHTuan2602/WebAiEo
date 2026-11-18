import { CheckCircle2, Crown, Gamepad2, Sparkles, Ticket, X } from 'lucide-react';
import {
  AIEO_VIP_PRICE_VND,
  FRIEND_ROOM_TICKET_PRICE_VND,
  formatVndCurrency,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

export default function VipPromoPopupModal({
  isOpen = false,
  currentUser = null,
  paymentConfig = null,
  onClose = null,
  onOpenVipCheckout = null,
  onOpenRoomTicketCheckout = null
}) {
  if (!isOpen || !currentUser || currentUser.role === 'teacher') return null;

  const cfg = normalizePaymentConfig(paymentConfig || {});
  const vipPriceLabel = formatVndCurrency(cfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND);
  const roomTicketLabel = formatVndCurrency(cfg.friendRoomTicketPrice ?? FRIEND_ROOM_TICKET_PRICE_VND);

  const vipPerks = [
    {
      title: 'Tự Do Đổi Màu Chữ Tên + Huy Hiệu AIEOVIP',
      desc: 'Chọn màu chữ bất kỳ từ bảng màu VIP & mã Hex riêng + huy hiệu AIEOVIP nổi bật trên Navbar, Hồ sơ & BXH.'
    },
    {
      title: 'Viền Bìa Màu Neon + Tặng Miễn Phí Ảnh Bìa Cá Nhân',
      desc: '6 hiệu ứng Viền Bìa Neon (kể cả Aurora 7 sắc), miễn phí tải Ảnh Bìa Riêng (5k/1T) & mở khóa 3 Khung Avatar Neon VIP.'
    },
    {
      title: 'Tạo Phòng Đấu Trường Riêng Cùng Bạn Bè + Danh Hiệu VIP',
      desc: 'Tùy chỉnh 2–30 người, chia 2–4 Team thi đấu không giới hạn suốt 30 ngày & đeo danh hiệu 👑 Ai Eo VIP.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-promo-popup-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/45 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 py-5 bg-gradient-to-br from-rose-600 via-red-600 to-amber-500 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng quảng cáo Ai eo VIP"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Đặc Quyền Thành Viên Tháng
          </div>
          <h3 id="vip-promo-popup-title" className="text-lg sm:text-xl font-black leading-snug pr-8 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-200 shrink-0" />
            <span>Nâng Cấp Gói Ai Eo VIP — Chỉ {vipPriceLabel}/Tháng</span>
          </h3>
          <p className="text-xs text-rose-50/95 mt-1 leading-relaxed">
            Mở khóa toàn bộ đặc quyền nổi bật cho tài khoản <strong>{currentUser.name || currentUser.username}</strong> ngay hôm nay!
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2.5">
            {vipPerks.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/75 dark:bg-slate-800/75 border border-rose-200/80 dark:border-slate-700"
              >
                <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{perk.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/35 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Mẹo nhỏ: Nếu chỉ muốn chơi nhanh với bạn bè, bạn có thể mua vé lẻ <strong>{roomTicketLabel}/lần tạo phòng</strong>! Kho Bài Tập 4 Kỹ Năng luôn miễn phí 100%.
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenVipCheckout?.();
              }}
              className="vip-shimmer-badge w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Đăng Ký Ai Eo VIP Ngay ({vipPriceLabel}/1 Tháng)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onOpenRoomTicketCheckout?.();
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
              >
                <Ticket className="w-3.5 h-3.5" /> Mua 1 Phòng ({roomTicketLabel})
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Để sau (Vào học ngay)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
