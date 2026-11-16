import { useState } from 'react';

/**
 * GitHub/Luyennoi-style Speaking & Skill Practice Activity Heatmap (last 18 weeks).
 */
export default function SpeakingHeatmapCard({ attempts = [] }) {
  const WEEKS = 18;
  const DAYS_PER_WEEK = 7;
  const [todayTs] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const today = new Date(todayTs);

  // Align grid ending cleanly at the end of current week (Sunday/Saturday)
  const dayCounts = new Map();
  (Array.isArray(attempts) ? attempts : []).forEach(att => {
    const raw = String(att?.submittedAt || '').trim();
    if (!raw) return;
    // Handle YYYY-MM-DD or dd/mm/yyyy formats safely
    let dateObj = null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      dateObj = new Date(raw.slice(0, 10) + 'T00:00:00');
    } else {
      const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) {
        dateObj = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      } else {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
      }
    }
    if (dateObj && !Number.isNaN(dateObj.getTime())) {
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
    }
  });

  const endDayOfWeek = today.getDay(); // 0 Sun..6 Sat
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - endDayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

  const columns = [];
  const monthLabels = [];
  let prevMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    const colDays = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * DAYS_PER_WEEK + d);
      const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
      const count = dayCounts.get(key) || 0;
      const isFuture = cellDate > today;
      colDays.push({
        key,
        count,
        isFuture,
        label: `${cellDate.getDate()}/${cellDate.getMonth() + 1}/${cellDate.getFullYear()}: ${count} bài luyện`
      });
    }
    const firstMonth = new Date(startDate.getTime() + w * DAYS_PER_WEEK * 86400000).getMonth();
    if (firstMonth !== prevMonth) {
      monthLabels.push({ weekIdx: w, label: `thg ${firstMonth + 1}` });
      prevMonth = firstMonth;
    }
    columns.push(colDays);
  }

  const getCellColorClass = (count, isFuture) => {
    if (isFuture) return 'bg-transparent border border-rose-200/40 dark:border-white/[0.04]';
    if (count === 0) return 'bg-rose-100/80 dark:bg-[#23222A]';
    if (count === 1) return 'bg-indigo-300 dark:bg-[#4338CA]';
    if (count === 2) return 'bg-indigo-500 dark:bg-[#570DF8]';
    return 'bg-indigo-700 dark:bg-[#7C3AED]';
  };

  return (
    <div className="bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200/90 dark:border-[#2C2A35] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[295px]">
          {/* Top Month Header Row */}
          <div className="flex items-center gap-[3px] pl-6 mb-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {columns.map((_col, wIdx) => {
              const found = monthLabels.find(m => m.weekIdx === wIdx);
              return (
                <div key={wIdx} className="w-[12px] shrink-0 overflow-visible whitespace-nowrap">
                  {found ? found.label : ''}
                </div>
              );
            })}
          </div>

          {/* 7-row Heatmap Body */}
          <div className="flex items-start gap-1.5">
            <div className="flex flex-col justify-between h-[96px] text-[10px] font-semibold text-slate-400 dark:text-slate-500 pr-1 py-0.5 select-none">
              <span className="invisible">T2</span>
              <span>T3</span>
              <span className="invisible">T4</span>
              <span>T5</span>
              <span className="invisible">T6</span>
              <span>T7</span>
              <span className="invisible">CN</span>
            </div>
            <div className="flex items-start gap-[3px]">
              {columns.map((col, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {col.map(cell => (
                    <div
                      key={cell.key}
                      title={cell.label}
                      className={`w-[12px] h-[12px] rounded-[2.5px] transition-transform hover:scale-110 ${getCellColorClass(cell.count, cell.isFuture)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Counter + Legend matching Luyennoi screenshot */}
      <div className="mt-3 pt-2 border-t border-pink-200/60 dark:border-[#2C2A35] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
        <span>Đã luyện {attempts.length} lần</span>
        <div className="flex items-center gap-1">
          <span className="mr-1">Ít</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-100 dark:bg-[#23222A]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-indigo-300 dark:bg-[#4338CA]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500 dark:bg-[#570DF8]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-indigo-700 dark:bg-[#7C3AED]" />
          <span className="ml-1">Nhiều</span>
        </div>
      </div>
    </div>
  );
}
