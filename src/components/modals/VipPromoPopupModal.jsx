import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Crown, Minimize2, Sparkles, X } from 'lucide-react';
import {
  AIEO_VIP_PRICE_VND,
  formatVndCurrency,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

export default function VipPromoPopupModal({
  isOpen = false,
  showFloatingTrigger = true,
  hasNavbar = true,
  currentUser = null,
  paymentConfig = null,
  onOpen = null,
  onClose = null,
  onOpenVipCheckout = null
}) {
  const [isMinimizing, setIsMinimizing] = useState(false);
  const [isCompactIcon, setIsCompactIcon] = useState(false);
  const minimizeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (minimizeTimerRef.current) {
        clearTimeout(minimizeTimerRef.current);
        minimizeTimerRef.current = null;
      }
    };
  }, []);

  if (!currentUser || currentUser.role === 'teacher' || currentUser.isGuest) return null;

  const cfg = normalizePaymentConfig(paymentConfig || {});
  const vipPriceLabel = formatVndCurrency(cfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND);
  const coverPriceLabel = formatVndCurrency(cfg.coverUnlockPrice ?? 5000);

  const vipPerks = [
    {
      title: 'Truy Cập Luyện Tập Game Từ Vựng (14 Kho Từ + Collocation)',
      desc: 'Luyện tập Game từ vựng cá nhân theo 14 chủ đề IELTS & Collocation, chọn số lượng từ tùy ý không giới hạn.'
    },
    {
      title: 'Quyền Tạo Phòng Luyện Tập Từ Vựng Theo Chủ Đề',
      desc: 'Tự tạo phòng đấu trường riêng cùng bạn bè (2–30 người, chia Team), tùy chọn kho từ và số từ mỗi vòng trong suốt 30 ngày.'
    },
    {
      title: 'Chỉnh Màu Chữ Tên, Khung Viền Avatar & Ảnh Bìa Hồ Sơ',
      desc: `Tự do chọn màu chữ tên (kèm mã màu tự chọn), chọn Khung Viền Avatar nổi bật và miễn phí tải, cắt Ảnh Bìa riêng (trị giá ${coverPriceLabel}/tháng).`
    }
  ];

  const handleMinimizeToCorner = () => {
    if (isMinimizing) return;
    setIsMinimizing(true);
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
    minimizeTimerRef.current = setTimeout(() => {
      minimizeTimerRef.current = null;
      setIsMinimizing(false);
      onClose?.();
    }, 220);
  };

  const handleDirectCheckout = () => {
    if (minimizeTimerRef.current) {
      clearTimeout(minimizeTimerRef.current);
      minimizeTimerRef.current = null;
    }
    setIsMinimizing(false);
    onClose?.();
    onOpenVipCheckout?.();
  };

  const handleReopenFromDock = () => {
    setIsMinimizing(false);
    setIsCompactIcon(false);
    onOpen?.();
  };

  // Minimized Top-Right Floating VIP Launcher (available across Trang chủ & all browsing pages)
  if (!isOpen) {
    if (!showFloatingTrigger) return null;
    return (
      <div
        data-vip-floating-dock="true"
        className={`fixed ${hasNavbar ? 'top-[74px]' : 'top-16'} right-3 sm:right-5 z-30`}
      >
        {isCompactIcon ? (
          <button
            type="button"
            onClick={handleReopenFromDock}
            className="vip-promo-dock vip-dock-pop-in inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#991B1B] hover:bg-[#B91C1C] text-[#FFFFFF] border-2 border-[#F59E0B] text-xs font-black shadow-lg transition"
            title={`Mở ưu đãi Gói IELTS VIP (${vipPriceLabel}/1 tháng)`}
            aria-label={`Mở ưu đãi Gói IELTS VIP (${vipPriceLabel}/1 tháng)`}
          >
            <Crown className="w-4 h-4 text-[#FCD34D] shrink-0" />
            <span>VIP</span>
          </button>
        ) : (
          <div className="vip-promo-dock vip-dock-pop-in flex items-center gap-1 rounded-full p-1 bg-white/95 dark:bg-[#18181B]/95 border border-amber-400/90 dark:border-amber-500/60 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={handleReopenFromDock}
              className="inline-flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-full bg-[#991B1B] hover:bg-[#B91C1C] text-[#FFFFFF] text-xs font-extrabold transition"
              title={`Bấm để xem ưu đãi Gói IELTS VIP (${vipPriceLabel}/1 tháng)`}
            >
              <Crown className="w-3.5 h-3.5 text-[#FCD34D] shrink-0" />
              <span>IELTS VIP</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#09090B] text-xs font-black">
                {vipPriceLabel}/1 tháng
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsCompactIcon(true)}
              className="w-6 h-6 rounded-full hover:bg-slate-200/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition"
              title="Thu gọn thành biểu tượng nhỏ góc phải"
              aria-label="Thu gọn nút IELTS VIP"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-200 ${
        isMinimizing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-promo-popup-title"
      onClick={handleMinimizeToCorner}
    >
      <div
        className={`vip-promo-modal w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:bg-[#18181B] border border-amber-300 dark:border-amber-500/45 shadow-2xl ${
          isMinimizing ? 'vip-modal-minimize-top-right' : 'vip-modal-expand-from-top-right'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 py-5 bg-gradient-to-br from-rose-600 via-red-600 to-amber-500 text-white">
          <button
            type="button"
            onClick={handleMinimizeToCorner}
            title="Thu nhỏ sang góc phải trên"
            aria-label="Thu nhỏ quảng cáo IELTS VIP về góc phải trên"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Đặc Quyền Thành Viên 1 Tháng
          </div>
          <h2 id="vip-promo-popup-title" className="text-lg sm:text-xl font-black leading-snug pr-8 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-200 shrink-0" />
            <span>Nâng Cấp Gói IELTS VIP - Chỉ {vipPriceLabel}/1 tháng</span>
          </h2>
          <p className="text-xs text-rose-50/95 mt-1 leading-relaxed">
            Mở khóa toàn bộ đặc quyền nổi bật suốt 1 tháng cho tài khoản <strong>{currentUser.name || currentUser.username}</strong> ngay hôm nay!
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2.5">
            {vipPerks.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
              >
                <CheckCircle2 className="w-4 h-4 text-[#B91C1C] dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-[#FAFAFA]">{perk.title}</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleDirectCheckout}
              className="vip-promo-cta w-full py-3 px-4 rounded-2xl bg-[#991B1B] hover:bg-[#B91C1C] text-[#FFFFFF] text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Crown className="w-4 h-4 text-[#FCD34D]" />
              <span>Đăng Ký IELTS VIP Ngay ({vipPriceLabel}/1 tháng)</span>
            </button>
            <button
              type="button"
              onClick={handleMinimizeToCorner}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thu nhỏ về góc phải (Để sau)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
