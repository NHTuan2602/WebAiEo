import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Crop, RotateCw, RotateCcw, ZoomIn, ZoomOut, Move, Check, X, Loader2 } from 'lucide-react';
import {
  clampCropPan,
  clampCropZoom,
  computeCropLayout,
  drawCroppedImageToContext,
  exportCroppedImageDataUrl,
  loadImageElement,
  normalizeCropRotation,
} from '../../utils/examHelpers';

const MODE_PRESETS = {
  avatar: {
    targetWidth: 240,
    targetHeight: 240,
    initialQuality: 0.85,
    defaultTitle: 'Cắt & Căn Chỉnh Ảnh Đại Diện',
    defaultSubtitle: 'Kéo ảnh để căn giữa khuôn mặt trong khung tròn và thu phóng theo ý muốn.',
  },
  banner: {
    targetWidth: 1200,
    targetHeight: 420,
    initialQuality: 0.82,
    defaultTitle: 'Cắt & Căn Chỉnh Ảnh Hình Nền',
    defaultSubtitle: 'Kéo ảnh để chọn vùng hiển thị đẹp nhất cho ảnh bìa hồ sơ (tỉ lệ 20:7).',
  },
};

function ImageCropperDialog({
  sourceUrl,
  mode,
  title,
  subtitle,
  confirmLabel,
  onCancel,
  onConfirm,
  onError,
}) {
  const preset = MODE_PRESETS[mode] || MODE_PRESETS.avatar;
  const maskId = useId();
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const onErrorRef = useRef(onError);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [imgState, setImgState] = useState({ img: null, error: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasBox, setCanvasBox] = useState({ width: 0, height: 0 });

  const loadedImg = imgState.img;
  const loadError = imgState.error;
  const isLoading = !loadedImg && !loadError;

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;
    loadImageElement(sourceUrl)
      .then(img => {
        if (cancelled) return;
        setImgState({ img, error: '' });
      })
      .catch(err => {
        if (cancelled) return;
        const msg = err?.message || 'Không thể tải ảnh để cắt.';
        setImgState({ img: null, error: msg });
        onErrorRef.current?.(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape' && !isExporting) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExporting, onCancel]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setCanvasBox({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };
    updateSize();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateSize);
      observer.observe(el);
    }

    const handleWheel = e => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom(prev => clampCropZoom(Number((prev + delta).toFixed(2))));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      observer?.disconnect();
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg || canvasBox.width < 2 || canvasBox.height < 2) return;
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const backingW = Math.round(canvasBox.width * dpr);
    const backingH = Math.round(canvasBox.height * dpr);
    if (canvas.width !== backingW) canvas.width = backingW;
    if (canvas.height !== backingH) canvas.height = backingH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCroppedImageToContext(ctx, loadedImg, backingW, backingH, {
      zoom,
      panX: pan.x,
      panY: pan.y,
      rotation,
    });
  }, [loadedImg, canvasBox, zoom, pan, rotation]);

  const handlePointerDown = useCallback(e => {
    if (!loadedImg || isExporting) return;
    const el = frameRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      rect: el.getBoundingClientRect(),
    };
    setIsDragging(true);
  }, [loadedImg, isExporting, pan.x, pan.y]);

  const handlePointerMove = useCallback(e => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !loadedImg) return;
    const imgW = loadedImg.naturalWidth || loadedImg.width || 1;
    const imgH = loadedImg.naturalHeight || loadedImg.height || 1;
    const layout = computeCropLayout(imgW, imgH, preset.targetWidth, preset.targetHeight, {
      zoom,
      panX: drag.startPanX,
      panY: drag.startPanY,
      rotation,
    });
    const slackCssX = (layout.maxOffsetX / preset.targetWidth) * drag.rect.width;
    const slackCssY = (layout.maxOffsetY / preset.targetHeight) * drag.rect.height;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setPan({
      x: slackCssX > 0.5 ? clampCropPan(drag.startPanX + dx / slackCssX) : 0,
      y: slackCssY > 0.5 ? clampCropPan(drag.startPanY + dy / slackCssY) : 0,
    });
  }, [loadedImg, preset.targetHeight, preset.targetWidth, rotation, zoom]);

  const handlePointerUp = useCallback(e => {
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }
  }, []);

  const handleFrameKeyDown = useCallback(e => {
    const step = 0.08;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPan(prev => ({ ...prev, x: clampCropPan(prev.x - step) }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPan(prev => ({ ...prev, x: clampCropPan(prev.x + step) }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPan(prev => ({ ...prev, y: clampCropPan(prev.y - step) }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPan(prev => ({ ...prev, y: clampCropPan(prev.y + step) }));
    }
  }, []);

  const handleConfirmCrop = async () => {
    if (!loadedImg || isExporting) return;
    setIsExporting(true);
    try {
      const croppedUrl = await exportCroppedImageDataUrl(sourceUrl, {
        targetWidth: preset.targetWidth,
        targetHeight: preset.targetHeight,
        zoom,
        panX: pan.x,
        panY: pan.y,
        rotation,
        initialQuality: preset.initialQuality,
      });
      onConfirm?.(croppedUrl);
    } catch (err) {
      onErrorRef.current?.(err?.message || 'Không thể xuất ảnh đã cắt.');
    } finally {
      setIsExporting(false);
    }
  };

  const isBanner = mode === 'banner';

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-cropper-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDFFFD] dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-[#007A7A] dark:text-[#1EE1D6] shrink-0">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 id="image-cropper-title" className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {title || preset.defaultTitle}
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                {subtitle || preset.defaultSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isExporting}
            aria-label="Đóng trình cắt ảnh"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Crop Viewport */}
        <div className="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4">
          <div
            ref={frameRef}
            tabIndex={0}
            aria-label="Vùng kéo để căn chỉnh ảnh"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleFrameKeyDown}
            style={{ touchAction: 'none' }}
            className={`relative select-none overflow-hidden rounded-2xl border-2 border-[#007A7A]/60 dark:border-[#1EE1D6]/50 bg-slate-200 dark:bg-slate-800 mx-auto outline-none focus-visible:ring-2 focus-visible:ring-[#007A7A] ${
              isBanner ? 'w-full aspect-[1200/420]' : 'w-full max-w-[290px] aspect-square'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {!isBanner && !isLoading && !loadError && (
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 w-full h-full"
                aria-hidden="true"
              >
                <defs>
                  <mask id={maskId}>
                    <rect width="100" height="100" fill="white" />
                    <circle cx="50" cy="50" r="46" fill="black" />
                  </mask>
                </defs>
                <rect width="100" height="100" fill="rgba(15, 23, 42, 0.45)" mask={`url(#${maskId})`} />
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.8" />
              </svg>
            )}

            {isBanner && !isLoading && !loadError && (
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="border border-white/25" />
                ))}
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/25 text-white text-xs font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang tải ảnh...</span>
              </div>
            )}

            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-rose-950/85 text-rose-100 text-xs font-semibold text-center">
                {loadError}
              </div>
            )}
          </div>

          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-[#475569] dark:text-slate-400">
            <Move className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
            Kéo trực tiếp để dịch vùng ảnh • Lăn chuột hoặc trượt thanh để thu phóng
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setZoom(prev => clampCropZoom(Number((prev - 0.15).toFixed(2))))}
              disabled={!loadedImg || isExporting || zoom <= 1}
              aria-label="Thu nhỏ ảnh"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3.5}
              step={0.02}
              value={zoom}
              disabled={!loadedImg || isExporting}
              aria-label="Mức thu phóng ảnh"
              onChange={e => setZoom(clampCropZoom(Number(e.target.value)))}
              className="flex-1 accent-[#007A7A] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom(prev => clampCropZoom(Number((prev + 0.15).toFixed(2))))}
              disabled={!loadedImg || isExporting || zoom >= 3.5}
              aria-label="Phóng to ảnh"
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="w-12 text-right text-xs font-extrabold text-slate-700 dark:text-slate-200 tabular-nums">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation(prev => normalizeCropRotation(prev + 90))}
                disabled={!loadedImg || isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-45"
              >
                <RotateCw className="w-3.5 h-3.5" /> Xoay 90°
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                }}
                disabled={!loadedImg || isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition disabled:opacity-45"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
              </button>
            </div>
            <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
              Xuất {preset.targetWidth} × {preset.targetHeight}px
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={!loadedImg || isLoading || Boolean(loadError) || isExporting}
            className="flex-[1.5] py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#006666] text-white font-extrabold text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isExporting ? 'Đang cắt ảnh...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImageCropperModal({
  isOpen,
  sourceUrl,
  mode = 'avatar',
  title,
  subtitle,
  confirmLabel = 'Áp Dụng Ảnh Đã Cắt',
  onCancel,
  onConfirm,
  onError,
}) {
  if (!isOpen || !sourceUrl) return null;

  return (
    <ImageCropperDialog
      key={`${mode}:${sourceUrl}`}
      sourceUrl={sourceUrl}
      mode={mode}
      title={title}
      subtitle={subtitle}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onError={onError}
    />
  );
}
