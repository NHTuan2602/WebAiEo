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
  const periodicMockPrice = Number(cfg.periodicMockPrice) > 0 ? Number(cfg.periodicMockPrice) : PERIODIC_MOCK_PRICE_VND;
  const myCredits = getRealExamCredits(currentUser);

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="real-exam-pricing-title"
      onClick={() => onClose?.()}
    >
      <div
        className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 sticky top-0 bg-white dark:bg-[#18181B] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-zinc-700 text-[#0F766E] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="real-exam-pricing-title" className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA] leading-snug">
                Bảng Giá &amp; Combo Thực Chiến IELTS (Full 4 Kỹ Năng)
              </h2>
              <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                Đề lẻ {formatVndCurrency(singleExamPrice)}/đề • Mua Combo để nhận lượt mở bất kỳ đề Thực Chiến nào với giá ưu đãi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Đóng bảng giá và combo"
            className="p-2 rounded-lg text-[#475569] dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F172B] dark:hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Current Credits Balance */}
          <div className="rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-zinc-400">
                Lượt làm đề có phí hiện có:
              </span>
              <span className="text-2xl font-black text-[#0F172B] dark:text-[#FAFAFA] tabular-nums">
                {myCredits} lượt
              </span>
              <span className="text-xs font-medium text-[#475569] dark:text-zinc-400">
                (1 lượt = mở 1 đề Thực Chiến 4 kỹ năng bất kỳ)
              </span>
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
                Dùng Lượt Ngay →
              </button>
            )}
          </div>

          {/* 3 Combo Pricing Cards */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
                Chọn Gói Combo Thực Chiến Thi Thật (Quét Mã VietQR)
              </h3>
              <span className="text-xs font-semibold text-[#475569] dark:text-zinc-400">
                So với giá lẻ {formatVndCurrency(singleExamPrice)}/đề
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {REAL_EXAM_COMBOS.map((combo, idx) => {
                const comboPrice = Number(cfg[combo.priceKey]) > 0 ? Number(cfg[combo.priceKey]) : combo.defaultPriceVnd;
                const normalPrice = singleExamPrice * combo.credits;
                const savedAmount = Math.max(0, normalPrice - comboPrice);
                const perTestRounded = Math.round(comboPrice / combo.credits / 100) * 100;
                const badgeText = idx === 1 ? 'Phổ biến' : idx === 2 ? 'Tiết kiệm nhất' : 'Khởi động';
                const isPopular = idx === 1;

                return (
                  <div
                    key={combo.id}
                    className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                      isPopular
                        ? 'border-[#0F766E] dark:border-teal-500 bg-[#F8FAFC] dark:bg-zinc-900'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap ${
                            isPopular
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#334155] dark:text-zinc-300'
                          }`}
                        >
                          {badgeText}
                        </span>
                        <p className="text-base font-extrabold text-[#0F172B] dark:text-[#FAFAFA] whitespace-nowrap">
                          {combo.label}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-black text-[#0F766E] dark:text-teal-400 tabular-nums">
                            {formatVndCurrency(comboPrice)}
                          </span>
                          {savedAmount > 0 && (
                            <span className="text-xs font-semibold text-[#475569] dark:text-zinc-500 line-through tabular-nums">
                              {formatVndCurrency(normalPrice)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#475569] dark:text-zinc-400">
                          Cộng ngay <strong className="text-[#0F172B] dark:text-zinc-200">+{combo.credits} lượt</strong> • ~{formatVndCurrency(perTestRounded)}/đề
                        </p>
                      </div>

                      <ul className="space-y-1.5 text-xs text-[#334155] dark:text-zinc-300 pt-1 border-t border-slate-200/80 dark:border-zinc-800">
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>Full 4 kỹ năng L·R·W·S (1 lượt/đề)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>Ms. Như chấm &amp; duyệt điểm chi tiết</span>
                        </li>
                        {savedAmount > 0 && (
                          <li className="flex items-start gap-1.5 font-bold text-[#0F766E] dark:text-teal-300">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        isPopular
                          ? 'bg-[#0F766E] hover:bg-[#0D9488] text-white'
                          : 'bg-[#0F172B] hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span>Mua {combo.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2 Clear Purchase Modes Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900">
            <div className="p-4 space-y-1">
              <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                <span>Mua Đề Lẻ Trực Tiếp: {formatVndCurrency(singleExamPrice)}/đề</span>
              </p>
              <p className="text-xs text-[#475569] dark:text-zinc-400 leading-relaxed">
                Ấn <strong>Mua Đề Lẻ</strong> ngay trên đề muốn thi ở Trang Chủ → quét VietQR sẽ <strong>mở khóa thẳng đúng đề đó</strong> (không trừ lượt Combo).
              </p>
            </div>
            <div className="p-4 space-y-1">
              <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                <span>Cách Dùng Lượt Combo (3 / 5 / 10 Đề)</span>
              </p>
              <p className="text-xs text-[#475569] dark:text-zinc-400 leading-relaxed">
                Lượt hiển thị ngay cạnh tên bạn. Khi mở đề Thực Chiến nào, hệ thống sẽ <strong>thông báo xác nhận và trừ 1 lượt</strong>.
              </p>
            </div>
          </div>

          {/* Periodic Mock Note + Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-zinc-800">
            <p className="text-xs text-[#475569] dark:text-zinc-400 flex items-start gap-1.5">
              <Info className="w-4 h-4 text-[#0F766E] dark:text-teal-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0F172B] dark:text-zinc-200">Mock Test Định Kỳ (3 tháng/lần):</strong> {formatVndCurrency(periodicMockPrice)}/kỳ (mở riêng tại tab Mock Test Định Kỳ, không dùng chung lượt Combo).
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-bold text-[#334155] dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition whitespace-nowrap"
              >
                Để sau
              </button>
              {onGoToRealExams && (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onGoToRealExams();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition whitespace-nowrap"
                >
                  Chọn Đề Lẻ ({formatVndCurrency(singleExamPrice)}) →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
