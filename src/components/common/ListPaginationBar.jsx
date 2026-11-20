import { ChevronLeft, ChevronRight } from 'lucide-react';

export function paginateItems(items = [], page = 1, pageSize = 5) {
  const list = Array.isArray(items) ? items : [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageItems = list.slice(startIdx, startIdx + pageSize);
  return {
    pageItems,
    safePage,
    totalPages,
    totalItems,
    startIdx,
    endIdx: Math.min(startIdx + pageSize, totalItems)
  };
}

export default function ListPaginationBar({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  itemLabel = 'bài'
}) {
  if (!totalItems || totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);
  const startNum = (safePage - 1) * pageSize + 1;
  const endNum = Math.min(safePage * pageSize, totalItems);

  const buildPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, totalPages, safePage, safePage - 1, safePage + 1]);
    return Array.from(pages)
      .filter(p => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const pageNums = buildPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 text-xs">
      <span className="font-semibold text-[#475569] dark:text-slate-400 tabular-nums">
        Hiển thị <b className="text-[#0F172B] dark:text-white">{startNum}–{endNum}</b> / <b className="text-[#0F172B] dark:text-white">{totalItems}</b> {itemLabel} · Trang <b className="text-[#007A7A] dark:text-[#1EE1D6]">{safePage}/{totalPages}</b>
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange?.(safePage - 1)}
          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0F172B] dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#007A7A] transition inline-flex items-center gap-1"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Trước
        </button>

        {pageNums.map((p, idx) => {
          const prevP = pageNums[idx - 1];
          const showEllipsis = prevP && p - prevP > 1;
          const isCurrent = p === safePage;
          return (
            <span key={p} className="inline-flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-[#475569] dark:text-slate-400 font-bold select-none">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange?.(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-[30px] h-[30px] px-2 rounded-lg font-extrabold tabular-nums border transition ${
                  isCurrent
                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                    : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700 hover:border-[#007A7A]'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange?.(safePage + 1)}
          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0F172B] dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#007A7A] transition inline-flex items-center gap-1"
          aria-label="Trang sau"
        >
          Sau <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
