import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Crown, Eye, EyeOff, Lock, Sparkles, X } from 'lucide-react';
import {
  EXAM_PURCHASE_TIERS,
  getNextExamPurchaseTier,
  getPurchasedExamCount,
  resolveExamPurchaseTier
} from '../../constants/profileCustomization';

export default function ExamTierGuideModal({
  isOpen = false,
  user = null,
  isSelf = false,
  onToggleVisibility = null,
  onClose = null
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  const purchasedCount = getPurchasedExamCount(user);
  const currentTier = resolveExamPurchaseTier(user);
  const nextTier = getNextExamPurchaseTier(user);
  const isBadgeVisible = user?.showExamTierBadge !== false;
  const maxTierExams = EXAM_PURCHASE_TIERS[EXAM_PURCHASE_TIERS.length - 1]?.minExams || 40;
  const memberLabel = user?.name || user?.username || 'Thành viên';

  const modalContent = (
    <div
      className="apple-backdrop-enter fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-tier-guide-title"
      onClick={e => {
        e.stopPropagation();
        onClose?.();
      }}
    >
      <div
        className="apple-modal-sheet bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700/60 text-[#0F766E] dark:text-teal-300 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="exam-tier-guide-title"
                className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA] leading-snug"
              >
                Hệ Thống 10 Hạng Cạnh Tên &amp; Cách Mở Khóa
              </h2>
              <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                Tích lũy số đề Thực Chiến đã nạp (đề lẻ hoặc Combo) để tự động thăng hạng vĩnh viễn bên cạnh tên hiển thị.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Đóng bảng hạng cạnh tên"
            className="p-2 rounded-lg text-[#475569] dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-[#0F172B] dark:hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Member current status */}
          <div className="rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#475569] dark:text-zinc-400">
                  Tiến độ của <strong className="text-[#0F172B] dark:text-white">{memberLabel}</strong>:
                </span>
                {currentTier ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentTier.badgeClass}`}
                  >
                    {currentTier.showCrown && <Crown className="w-3 h-3 text-amber-200" />}
                    <span>{currentTier.label}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    Chưa có hạng (0 đề)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#334155] dark:text-zinc-300">
                Tổng đã nạp: <strong className="tabular-nums">{purchasedCount} đề Thực Chiến</strong>
                {nextTier
                  ? ` · Cần thêm ${Math.max(1, nextTier.minExams - purchasedCount)} đề nữa để mở khóa hạng ${nextTier.label} (${nextTier.minExams} đề).`
                  : ` · Đã chạm mốc tối đa ${maxTierExams} đề!`}
              </p>
            </div>

            {isSelf && onToggleVisibility && (
              <button
                type="button"
                onClick={() => onToggleVisibility(!isBadgeVisible)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition shrink-0 ${
                  isBadgeVisible
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700'
                }`}
              >
                {isBadgeVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isBadgeVisible ? 'Đang HIỆN chữ cạnh tên' : 'Đang ẨN chữ cạnh tên'}</span>
              </button>
            )}
          </div>

          {/* How to unlock note */}
          <div className="rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70 px-4 py-3 text-xs text-teal-950 dark:text-teal-100 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-teal-300 shrink-0 mt-0.5" />
            <div>
              <b>Cách mở khóa siêu đơn giản:</b> Mỗi khi bạn mua <b>1 đề Thực Chiến lẻ</b> hoặc mua <b>Combo 3 / 5 / 8 / 10 đề</b>, tổng số đề tích lũy sẽ tự động tăng và mở khóa vĩnh viễn huy hiệu hạng ngay cạnh tên bạn trên toàn bộ website (Hồ sơ, Danh bạ lớp, Phòng Game &amp; BXH).
            </div>
          </div>

          {/* 10 Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXAM_PURCHASE_TIERS.map((tier, idx) => {
              const unlocked = purchasedCount >= tier.minExams;
              const isCurrent = currentTier?.id === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                    isCurrent
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-[#0F766E] dark:border-teal-500 ring-1 ring-teal-500/30'
                      : unlocked
                      ? 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 tabular-nums">
                        #{idx + 1}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}
                      >
                        {tier.showCrown && <Crown className="w-3 h-3 text-amber-200" />}
                        <span>{tier.label}</span>
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#0F766E] text-white">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#475569] dark:text-zinc-400">
                      Mở khóa khi đạt từ <strong className="text-[#0F172B] dark:text-zinc-100">{tier.minExams} đề Thực Chiến</strong>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
