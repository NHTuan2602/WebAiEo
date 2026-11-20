import { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

const MIN_SPLIT = 30;
const MAX_SPLIT = 70;

function rubberband(overshoot, dimension = 35, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Desktop-resizable 2-column split workspace matching Computer-Delivered IELTS UI.
 * Uses Pointer Events with pointer capture, grab-offset tracking, and gentle edge rubber-banding.
 */
export default function SplitResizableWorkspace({
  left,
  right,
  splitPercent = 50,
  onChangeSplit,
  heightClass = 'lg:h-[calc(100vh-212px)] lg:min-h-[420px]'
}) {
  const containerRef = useRef(null);
  const pointerIdRef = useRef(null);
  const grabOffsetPxRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [liveSplit, setLiveSplit] = useState(null);

  const displayedSplit = liveSplit !== null ? liveSplit : splitPercent;

  const computeSplitPct = (clientX, allowRubberband = true) => {
    const container = containerRef.current;
    if (!container) return splitPercent;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return splitPercent;
    const adjustedX = clientX - grabOffsetPxRef.current;
    const rawPct = ((adjustedX - rect.left) / rect.width) * 100;
    if (rawPct < MIN_SPLIT) {
      return allowRubberband
        ? Math.max(24, MIN_SPLIT + rubberband(rawPct - MIN_SPLIT))
        : MIN_SPLIT;
    }
    if (rawPct > MAX_SPLIT) {
      return allowRubberband
        ? Math.min(76, MAX_SPLIT + rubberband(rawPct - MAX_SPLIT))
        : MAX_SPLIT;
    }
    return Math.round(rawPct * 10) / 10;
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const handleRect = e.currentTarget.getBoundingClientRect();
    grabOffsetPxRef.current = e.clientX - (handleRect.left + handleRect.width / 2);
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  };

  const handlePointerMove = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const nextPct = computeSplitPct(e.clientX, true);
    setLiveSplit(nextPct);
    const clamped = Math.max(MIN_SPLIT, Math.min(MAX_SPLIT, Math.round(nextPct * 10) / 10));
    onChangeSplit?.(clamped);
  };

  const finishDrag = (e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const settled = computeSplitPct(e.clientX, false);
    pointerIdRef.current = null;
    grabOffsetPxRef.current = 0;
    setIsDragging(false);
    setLiveSplit(null);
    document.body.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    onChangeSplit?.(Math.max(MIN_SPLIT, Math.min(MAX_SPLIT, Math.round(settled * 10) / 10)));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChangeSplit?.(Math.max(MIN_SPLIT, Math.round((splitPercent - 3) * 10) / 10));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChangeSplit?.(Math.min(MAX_SPLIT, Math.round((splitPercent + 3) * 10) / 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChangeSplit?.(50);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ '--cd-split-left': `${displayedSplit}%` }}
      className={`flex flex-col lg:flex-row gap-3 lg:gap-0 items-stretch ${heightClass}`}
    >
      {/* Left Pane (Passage / Chart / Prompt) */}
      <div
        className={`w-full lg:w-[var(--cd-split-left)] min-w-0 flex flex-col lg:pr-1 ${
          isDragging ? '' : 'lg:transition-[width] lg:duration-150 lg:ease-out'
        }`}
      >
        {left}
      </div>

      {/* Draggable Center Divider with '↔' Handle */}
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-valuemin={MIN_SPLIT}
        aria-valuemax={MAX_SPLIT}
        aria-valuenow={Math.round(splitPercent)}
        aria-label="Kéo để điều chỉnh độ rộng 2 khung"
        title="Kéo trái/phải để thay đổi tỷ lệ 2 khung • Nhấp đúp để chia đều 50/50"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => onChangeSplit?.(50)}
        className="hidden lg:flex w-3 shrink-0 cursor-col-resize items-center justify-center relative group select-none touch-none focus-visible:outline-none"
      >
        <div
          className={`w-[1px] h-full transition-colors ${
            isDragging
              ? 'bg-[#0F766E] dark:bg-[#FACC15]'
              : 'bg-[#D5D9E0] dark:bg-[#323232] group-hover:bg-[#0F766E] dark:group-hover:bg-[#EAB308]'
          }`}
        />
        <div
          className={`absolute z-10 w-6 h-6 rounded-md bg-white dark:bg-[#262626] border shadow-sm flex items-center justify-center transition ${
            isDragging
              ? 'scale-95 border-[#0F766E] dark:border-[#FACC15] text-[#0F766E] dark:text-[#FACC15]'
              : 'border-[#CBD5E1] dark:border-[#4A4A4A] text-slate-600 dark:text-slate-200 group-hover:border-[#0F766E] dark:group-hover:border-[#EAB308] group-hover:text-[#0F766E] dark:group-hover:text-[#FACC15]'
          }`}
        >
          <MoveHorizontal className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Right Pane (Questions / Summary Cloze / Answer Editor) */}
      <div className="w-full lg:flex-1 min-w-0 flex flex-col lg:pl-1">
        {right}
      </div>
    </div>
  );
}
