/**
 * Live audio microphone level meter bar visualizer.
 * Accepts normalized `level` (0..100) and `active` boolean.
 */
export default function AudioLevelMeter({ level = 0, active = false, barCount = 16 }) {
  const safeLevel = Math.min(100, Math.max(0, Number(level) || 0));

  return (
    <div
      className="flex items-center justify-center gap-1 h-9 px-3 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
      aria-label="Mức âm lượng micro"
    >
      {Array.from({ length: barCount }).map((_, idx) => {
        const centerDist = Math.abs(idx - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const weight = 1 - centerDist * 0.55;
        const heightPct = active
          ? Math.max(18, Math.min(100, safeLevel * weight + ((idx % 3) * 8)))
          : 16;

        return (
          <span
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-100 ${
              active
                ? safeLevel > 12
                  ? 'bg-[#570DF8] dark:bg-[#8B5CF6]'
                  : 'bg-emerald-500/70'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}
