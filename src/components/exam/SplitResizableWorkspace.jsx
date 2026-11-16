import { useEffect, useRef } from 'react';
import { MoveHorizontal } from 'lucide-react';

/**
 * Desktop-resizable 2-column split workspace matching Computer-Delivered IELTS UI.
 * Stacks cleanly into 1 column on mobile/tablet (< lg) and allows dragging the '↔' divider on desktop.
 */
export default function SplitResizableWorkspace({
  left,
  right,
  splitPercent = 50,
  onChangeSplit,
  heightClass = 'lg:h-[calc(100vh-212px)] lg:min-h-[420px]'
}) {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const updateSplitFromClientX = (clientX) => {
      const container = containerRef.current;
      if (!container || !draggingRef.current) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPct = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(30, Math.min(70, Math.round(rawPct * 10) / 10));
      onChangeSplit?.(clamped);
    };

    const handleMouseMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      updateSplitFromClientX(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!draggingRef.current || !e.touches?.[0]) return;
      updateSplitFromClientX(e.touches[0].clientX);
    };

    const stopDragging = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
      document.body.style.cursor = '';
    };
  }, [onChangeSplit]);

  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div
      ref={containerRef}
      style={{ '--cd-split-left': `${splitPercent}%` }}
      className={`flex flex-col lg:flex-row gap-3 lg:gap-0 items-stretch ${heightClass}`}
    >
      {/* Left Pane (Passage / Chart / Prompt) */}
      <div className="w-full lg:w-[var(--cd-split-left)] min-w-0 flex flex-col lg:pr-1">
        {left}
      </div>

      {/* Draggable Center Divider with '↔' Handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để điều chỉnh độ rộng 2 khung"
        title="Kéo trái/phải để thay đổi tỷ lệ 2 khung • Nhấp đúp để chia đều 50/50"
        onMouseDown={startDrag}
        onTouchStart={() => {
          draggingRef.current = true;
        }}
        onDoubleClick={() => onChangeSplit?.(50)}
        className="hidden lg:flex w-3 shrink-0 cursor-col-resize items-center justify-center relative group select-none"
      >
        <div className="w-[1px] h-full bg-[#D5D9E0] dark:bg-[#323232] group-hover:bg-[#2563EB] dark:group-hover:bg-[#EAB308] transition-colors" />
        <div className="absolute z-10 w-6 h-6 rounded-md bg-white dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#4A4A4A] group-hover:border-[#2563EB] dark:group-hover:border-[#EAB308] shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-200 group-hover:text-[#2563EB] dark:group-hover:text-[#FACC15] transition">
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
