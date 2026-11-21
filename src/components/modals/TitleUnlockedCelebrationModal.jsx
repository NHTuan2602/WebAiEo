import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Sparkles, Trophy, UserCheck, X } from 'lucide-react';

const DIFFICULTY_ACCENT = {
  'VIP Độc Quyền': {
    halo: 'from-red-500 via-amber-400 to-rose-600',
    pill: 'bg-[#991B1B] text-white border-amber-400',
    topBar: 'from-red-600 via-amber-500 to-rose-600'
  },
  'Độc Quyền': {
    halo: 'from-purple-500 via-amber-400 to-rose-500',
    pill: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/25 dark:text-purple-100 dark:border-purple-400/50',
    topBar: 'from-purple-600 via-amber-500 to-rose-500'
  },
  'Phú Quý': {
    halo: 'from-amber-400 via-yellow-300 to-amber-500',
    pill: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/60',
    topBar: 'from-amber-400 via-yellow-400 to-amber-600'
  },
  'Theo Ngày': {
    halo: 'from-amber-400 via-yellow-400 to-orange-500',
    pill: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/65',
    topBar: 'from-amber-500 via-yellow-400 to-orange-500'
  },
  'Bí Ẩn': {
    halo: 'from-violet-500 via-fuchsia-500 to-amber-400',
    pill: 'bg-zinc-900 text-amber-200 border-amber-400/70',
    topBar: 'from-violet-600 via-fuchsia-600 to-amber-500'
  },
  'Cực Khó': {
    halo: 'from-amber-400 via-rose-500 to-fuchsia-500',
    pill: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/25 dark:text-rose-100 dark:border-rose-400/50',
    topBar: 'from-amber-500 via-rose-500 to-fuchsia-600'
  },
  'Khó': {
    halo: 'from-amber-400 via-orange-400 to-rose-500',
    pill: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/50',
    topBar: 'from-amber-500 via-orange-500 to-rose-500'
  },
  'Lễ Hội': {
    halo: 'from-pink-400 via-rose-400 to-amber-400',
    pill: 'bg-pink-100 text-rose-900 border-rose-300 dark:bg-pink-500/25 dark:text-rose-100 dark:border-rose-400/50',
    topBar: 'from-pink-500 via-rose-500 to-amber-500'
  },
  'Điểm Danh': {
    halo: 'from-emerald-400 via-teal-400 to-cyan-400',
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/50',
    topBar: 'from-emerald-500 via-teal-500 to-cyan-500'
  },
  'Bình Thường': {
    halo: 'from-cyan-400 via-teal-400 to-indigo-500',
    pill: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/25 dark:text-sky-100 dark:border-sky-400/50',
    topBar: 'from-[#007A7A] via-sky-500 to-indigo-500'
  },
  'Thử Thách': {
    halo: 'from-cyan-400 via-teal-400 to-indigo-500',
    pill: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/25 dark:text-cyan-100 dark:border-cyan-400/50',
    topBar: 'from-[#007A7A] via-cyan-500 to-indigo-500'
  },
  'Dễ': {
    halo: 'from-lime-400 via-emerald-400 to-teal-400',
    pill: 'bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-500/25 dark:text-lime-100 dark:border-lime-400/50',
    topBar: 'from-lime-500 via-emerald-500 to-[#007A7A]'
  },
  'Cơ Bản': {
    halo: 'from-emerald-400 via-teal-400 to-sky-400',
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/50',
    topBar: 'from-emerald-500 via-[#007A7A] to-sky-500'
  }
};

export default function TitleUnlockedCelebrationModal({
  titles = [],
  onEquipTitle,
  onOpenProfile,
  onDismiss
}) {
  const [pickedId, setPickedId] = useState('');
  const safeTitles = Array.isArray(titles) ? titles.filter(Boolean) : [];
  const activeTitle = safeTitles.find(t => t.id === pickedId) || safeTitles[0] || null;

  useEffect(() => {
    if (safeTitles.length === 0) return undefined;
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeTitles.length, onDismiss]);

  if (!activeTitle) return null;

  const accent = DIFFICULTY_ACCENT[activeTitle.difficulty] || DIFFICULTY_ACCENT['Cơ Bản'];
  const multiCount = safeTitles.length;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="title-unlock-celebration-heading"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#161722] border border-slate-200 dark:border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl relative animate-[fadeIn_0.25s_ease-out]">
        <div className={`h-2 w-full bg-gradient-to-r ${accent.topBar}`} />

        <button
          type="button"
          onClick={() => onDismiss?.()}
          aria-label="Đóng thông báo danh hiệu mới"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-[#007A7A]/20 border border-teal-200 dark:border-[#1EE1D6]/40 text-[#007A7A] dark:text-[#1EE1D6] text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {multiCount > 1
                ? `Mở Khóa Cùng Lúc ${multiCount} Danh Hiệu Mới!`
                : 'Chúc Mừng Đạt Danh Hiệu Mới!'}
            </span>
          </div>

          <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
            <div className={`absolute inset-1 rounded-full bg-gradient-to-tr ${accent.halo} opacity-25 blur-md animate-pulse`} />
            <div className={`relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr ${accent.halo} shadow-xl`}>
              <div className="w-full h-full rounded-full bg-[#FFF7F9] dark:bg-[#1E2030] flex items-center justify-center text-5xl select-none">
                {activeTitle.icon}
              </div>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#007A7A] text-white border-2 border-white dark:border-[#161722] flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              <Trophy className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${accent.pill}`}>
                {activeTitle.difficulty} · {activeTitle.tier}
              </span>
            </div>
            <h2
              id="title-unlock-celebration-heading"
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {activeTitle.label}
            </h2>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-left flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-0.5">
                Điều kiện bạn vừa chinh phục:
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                {activeTitle.conditionText}
              </p>
              {activeTitle.isDailyRankTitle && activeTitle.dailyRankMeta?.remainingText && (
                <p className="text-amber-700 dark:text-amber-300 font-bold mt-1">
                  ⏳ Danh hiệu BXH độc quyền hôm nay · {activeTitle.dailyRankMeta.remainingText}
                </p>
              )}
            </div>
          </div>

          {multiCount > 1 && (
            <div className="space-y-2 text-left">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
                <span>Chọn danh hiệu bạn muốn trang bị ngay ({multiCount}):</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {safeTitles.map(item => {
                  const selected = item.id === activeTitle.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPickedId(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selected
                          ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]/50'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onEquipTitle?.(activeTitle)}
              className="w-full py-3 px-4 rounded-2xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-extrabold shadow-lg shadow-teal-900/20 inline-flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Trang Bị Danh Hiệu Này Ngay</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDismiss?.()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Tuyệt Vời! Để Sau
              </button>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => onOpenProfile?.()}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                >
                  Xem Kho Danh Hiệu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
