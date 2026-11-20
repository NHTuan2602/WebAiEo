import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Apple-style fluid Segmented Control with a spring-gliding active indicator pill.
 * Measures the active tab live via ResizeObserver so indicator position & width stay 1:1 accurate.
 */
export default function AppleSegmentedControl({
  items = [],
  activeId = '',
  onSelect = null,
  tone = 'neutral', // 'neutral' | 'teal'
  containerClassName = '',
  buttonClassName = '',
  ariaLabel = 'Điều hướng phân mục'
}) {
  const containerRef = useRef(null);
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const activeBtn = btnRefs.current[activeId];
      if (!container || !activeBtn) {
        setIndicator(prev => (prev.ready ? { ...prev, ready: false } : prev));
        return;
      }
      const nextLeft = activeBtn.offsetLeft;
      const nextWidth = activeBtn.offsetWidth;
      setIndicator(prev =>
        prev.left === nextLeft && prev.width === nextWidth && prev.ready
          ? prev
          : { left: nextLeft, width: nextWidth, ready: true }
      );
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    const activeBtn = btnRefs.current[activeId];
    if (activeBtn) ro.observe(activeBtn);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeId, items.length]);

  const indicatorToneClass =
    tone === 'teal'
      ? 'bg-[#0F766E] border border-[#0F766E]'
      : 'bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-zinc-700';

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      data-apple-segmented="true"
      className={`relative inline-flex items-center ${containerClassName}`}
    >
      {indicator.ready && (
        <span
          aria-hidden="true"
          className={`apple-seg-indicator pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg z-0 ${indicatorToneClass}`}
          style={{
            width: `${indicator.width}px`,
            transform: `translate3d(${indicator.left}px, 0, 0)`
          }}
        />
      )}
      {items.map(item => {
        const isActive = item.id === activeId;
        const activeFallbackBg =
          !indicator.ready && isActive
            ? tone === 'teal'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7]'
            : '';
        const textTone = isActive
          ? tone === 'teal'
            ? 'text-white font-bold'
            : 'text-[#0F172B] dark:text-[#FAFAFA] font-bold'
          : 'text-[#314158] dark:text-zinc-300 hover:text-[#0F172B] dark:hover:text-white';

        return (
          <button
            key={item.id}
            ref={el => {
              if (el) btnRefs.current[item.id] = el;
              else delete btnRefs.current[item.id];
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={item.title}
            onClick={() => {
              if (item.onClick) item.onClick();
              else onSelect?.(item.id);
            }}
            className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors duration-200 ${buttonClassName} ${textTone} ${activeFallbackBg}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
