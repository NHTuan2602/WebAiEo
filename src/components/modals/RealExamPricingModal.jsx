import { CheckCircle2, Info, ShoppingBag, Sparkles, Ticket, X } from 'lucide-react';
import {
  DEFAULT_EXAM_PRICE_VND,
  PERIODIC_MOCK_PRICE_VND,
  REAL_EXAM_COMBOS,
  formatVndCurrency,
  getRealExamCredits,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

export default function RealExamPricingModal({
  isOpen = false,
  currentUser = null,
  paymentConfig = null,
  onClose = null,
  onSelectCombo = null,
  onGoToRealExams = null
}) {
  if (!isOpen || !currentUser) return null;

  const cfg = normalizePaymentConfig(paymentConfig || {});
  const singleExamPrice = Number(cfg.defaultExamPriceVnd) > 0 ? Number(cfg.defaultExamPriceVnd) : DEFAULT_EXAM_PRICE_VND;
  const periodicMockPrice = Number(cfg.periodicMockPriceVnd) > 0 ? Number(cfg.periodicMockPriceVnd) : PERIODIC_MOCK_PRICE_VND;
  const myCredits = getRealExamCredits(currentUser);

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="real-exam-pricing-title"
      onClick={() => onClose?.()}
    >
      <div
        className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 sticky top-0 bg-white dark:bg-[#18181B] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-zinc-700 text-[#0F766E] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 id="real-exam-pricing-title" className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
                Bảng Giá &amp; Combo Thực Chiến IELTS (Full 4 Kỹ Năng)
              </h2>
              <p className="text-xs text-[#475569] dark:text-zinc-400">
                Mua đề lẻ mở trực tiếp từng đề hoặc mua Combo lượt thi để tiết kiệm chi phí.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Đóng bảng giá và combo"
            className="p-2 rounded-lg text-[#475569] dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F172B] dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Current Credits Balance */}
          <div className="rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-zinc-400">
                Số lượt làm đề có phí hiện có của bạn
              </p>
              <p className="text-2xl font-black text-[#0F172B] dark:text-[#FAFAFA] tabular-nums flex items-baseline gap-2">
                <span>{myCredits} lượt</span>
                <span className="text-xs font-semibold text-[#475569] dark:text-zinc-400">
                  (dùng mở bất kỳ Đề Thực Chiến 4 kỹ năng nào)
                </span>
              </p>
            </div>
            {myCredits > 0 && onGoToRealExams && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onGoToRealExams();
                }}
                className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition shrink-0"
              >
                Chọn Đề Để Dùng Lượt →
              </button>
            )}
          </div>

          {/* 2 Clear Purchase Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#18181B]">
            <div className="p-4 space-y-1.5">
              <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400" />
                1. Mua Đề Lẻ Trực Tiếp ({formatVndCurrency(singleExamPrice)}/đề)
              </p>
              <p className="text-xs text-[#475569] dark:text-zinc-400 leading-relaxed">
                Ấn nút <strong>Mua Đề Lẻ</strong> ngay trên đề bạn muốn thi ở Trang Chủ, quét mã VietQR xong hệ thống sẽ <strong>mở khóa thẳng đúng đề đó</strong> (không trừ lượt Combo).
              </p>
            </div>
            <div className="p-4 space-y-1.5">
              <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400" />
                2. Mua Combo Lượt Thi (3 / 5 / 10 Đề)
              </p>
              <p className="text-xs text-[#475569] dark:text-zinc-400 leading-relaxed">
                Quét mã xong nhận ngay <strong>+3 / +5 / +10 lượt</strong> hiển thị cạnh tên. Khi mở đề nào, hệ thống sẽ <strong>hiện thông báo xác nhận và trừ 1 lượt</strong>.
              </p>
            </div>
          </div>

          {/* Combo Pricing Cards */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
              Chọn Gói Combo Thực Chiến Thi Thật (Quét Mã VietQR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {REAL_EXAM_COMBOS.map((combo, idx) => {
                const comboPrice = Number(cfg[combo.priceKey]) > 0 ? Number(cfg[combo.priceKey]) : combo.defaultPriceVnd;
                const normalPrice = singleExamPrice * combo.credits;
                const savedAmount = Math.max(0, normalPrice - comboPrice);
                const perTestPrice = Math.round(comboPrice / combo.credits);
                const badgeText = idx === 1 ? 'Phổ biến' : idx === 2 ? 'Tiết kiệm nhất' : 'Khởi động';

                return (
                  <div
                    key={combo.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-4 ${
                      idx === 1
                        ? 'border-[#0F766E] dark:border-teal-500 bg-[#F8FAFC] dark:bg-zinc-900'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
                          {combo.label}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          idx === 1
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#334155] dark:text-zinc-300'
                        }`}>
                          {badgeText}
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#0F766E] dark:text-teal-400 tabular-nums">
                          {formatVndCurrency(comboPrice)}
                        </p>
                        <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                          Cộng ngay <strong>+{combo.credits} lượt</strong> • ~{formatVndCurrency(perTestPrice)}/đề
                        </p>
                      </div>
                      <ul className="space-y-1 text-xs text-[#334155] dark:text-zinc-300 pt-1">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                          <span>Đủ 4 kỹ năng L·R·W·S (1 lượt/đề)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                          <span>Ms. Như chấm &amp; duyệt điểm chi tiết</span>
                        </li>
                        {savedAmount > 0 && (
                          <li className="flex items-center gap-1.5 font-semibold text-[#0F766E] dark:text-teal-300">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Tiết kiệm {formatVndCurrency(savedAmount)} so với mua lẻ</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        onSelectCombo?.({
                          itemType: combo.id,
                          itemId: combo.id,
                          itemLabel: `${combo.label} - Thực Chiến Thi Thật 4 Kỹ Năng`,
                          itemPrice: comboPrice
                        });
                      }}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                        idx === 1
                          ? 'bg-[#0F766E] hover:bg-[#0D9488] text-white'
                          : 'bg-[#0F172B] hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Mua {combo.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Single Test & Periodic Mock Reference */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900 p-4 space-y-2.5">
            <div className="flex items-start gap-2 text-xs text-[#334155] dark:text-zinc-300">
              <Info className="w-4 h-4 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p>
                  <strong>Đề Lẻ Thực Chiến:</strong> {formatVndCurrency(singleExamPrice)}/đề (mua lẻ từng đề trực tiếp ở mục Thực Chiến Thi Thật trên Trang Chủ).
                </p>
                <p>
                  <strong>Mock Test Định Kỳ (3 tháng/lần):</strong> {formatVndCurrency(periodicMockPrice)}/kỳ (đề đánh giá riêng, mở trực tiếp tại tab Mock Test Định Kỳ, không trừ lượt Combo).
                </p>
              </div>
            </div>
            {onGoToRealExams && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onGoToRealExams();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-[#0F172B] dark:text-[#FAFAFA] transition"
                >
                  Về Trang Chủ Chọn Đề Lẻ →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
