import { useCallback, useEffect, useRef, useState } from 'react';

// Nhận diện tiện ích mở khóa Copy/Paste, chuột phải và tiện ích Dịch / Từ điển (Google Dịch, Cốc Cốc, DeepL...)
const COPY_PASTE_EXTENSION_SIGNATURES = [
  {
    key: 'ext-rightclick-copy',
    selector: [
      '[id*="enable-right-click" i]',
      '[id*="allow-copy" i]',
      '[id*="supercopy" i]',
      '[id*="simple-allow-copy" i]',
      '[id*="absolute-enable-right-click" i]',
      '[class*="enable-copy" i]',
      '[class*="allow-copy" i]',
      '[class*="supercopy" i]',
      '[data-allow-copy]',
      '[data-supercopy]'
    ].join(', '),
    label: 'Tiện ích Mở Khóa Chuột Phải / Hỗ trợ Copy-Paste'
  },
  {
    key: 'ext-translate-dict',
    selector: [
      '#gtx-trans',
      '.gtx-bubble',
      '.goog-te-banner-frame',
      '.goog-te-menu-frame',
      '.skiptranslate',
      'html.translated-ltr',
      'html.translated-rtl',
      '[id*="coccoc" i][id*="dict" i]',
      '[class*="coccoc" i][class*="dict" i]',
      '[id*="deepl" i]',
      '[class*="deepl-popover" i]',
      '[id*="laban" i]',
      '[id*="translate-tooltip" i]',
      '[class*="translate-popup" i]'
    ].join(', '),
    label: 'Tiện ích Google Dịch / Từ điển Cốc Cốc / DeepL'
  }
];

export const isDocumentInFullscreen = () => {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
  );
};

export const isFullscreenApiSupported = () => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement;
  return Boolean(
    el &&
      (typeof el.requestFullscreen === 'function' ||
        typeof el.webkitRequestFullscreen === 'function' ||
        typeof el.mozRequestFullScreen === 'function' ||
        typeof el.msRequestFullscreen === 'function')
  );
};

export const requestExamFullscreen = async () => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement;
  if (!el) return false;
  try {
    if (!isDocumentInFullscreen()) {
      const fn =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
      if (typeof fn === 'function') {
        await fn.call(el);
      }
    }
    if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
      try {
        await navigator.keyboard.lock(['Escape', 'F11']);
      } catch (_lockErr) {
        // Keyboard Lock API optional on non-Chromium browsers
      }
    }
    return isDocumentInFullscreen();
  } catch (_err) {
    return isDocumentInFullscreen();
  }
};

export const exitExamFullscreen = async () => {
  if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.unlock === 'function') {
    try {
      navigator.keyboard.unlock();
    } catch (_err) {}
  }
  if (typeof document === 'undefined' || !isDocumentInFullscreen()) return;
  try {
    const fn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (typeof fn === 'function') {
      await fn.call(document);
    }
  } catch (_err) {}
};

const isNativeFn = (fn) =>
  typeof fn === 'function' && Function.prototype.toString.call(fn).includes('[native code]');

export const normalizeInternalClipboardText = (text = '') =>
  String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();

export const evaluateInternalClipboardAction = ({
  actionType,
  allowInternalCopyPaste = true,
  selectedText = '',
  clipboardText = '',
  isInternalSource = false,
  isAnswerTarget = false,
  lastInternalText = ''
} = {}) => {
  if (!allowInternalCopyPaste) {
    return { allowed: false, reason: 'strict-locked', nextInternalText: '' };
  }
  if (actionType === 'copy') {
    const cleanSelected = normalizeInternalClipboardText(selectedText);
    if (isInternalSource && cleanSelected.length > 0) {
      return { allowed: true, reason: 'internal-copy', nextInternalText: cleanSelected };
    }
    return { allowed: false, reason: 'outside-exam-source', nextInternalText: lastInternalText };
  }
  if (actionType === 'cut') {
    const cleanSelected = normalizeInternalClipboardText(selectedText);
    if (isAnswerTarget && cleanSelected.length > 0) {
      return { allowed: true, reason: 'internal-cut', nextInternalText: cleanSelected };
    }
    return { allowed: false, reason: 'cut-non-answer', nextInternalText: lastInternalText };
  }
  if (actionType === 'paste') {
    const cleanClip = normalizeInternalClipboardText(clipboardText);
    const cleanStored = normalizeInternalClipboardText(lastInternalText);
    if (isAnswerTarget && cleanStored.length > 0 && cleanClip === cleanStored) {
      return { allowed: true, reason: 'internal-paste', nextInternalText: cleanStored };
    }
    return { allowed: false, reason: 'external-paste-blocked', nextInternalText: cleanStored };
  }
  return { allowed: false, reason: 'unknown', nextInternalText: lastInternalText };
};

export const detectSidePanelResize = ({
  prevInnerWidth = 0,
  prevOuterWidth = 0,
  prevDpr = 1,
  nextInnerWidth = 0,
  nextOuterWidth = 0,
  nextDpr = 1
} = {}) => {
  if (prevInnerWidth <= 0 || prevOuterWidth <= 0 || nextInnerWidth <= 0 || nextOuterWidth <= 0) {
    return { detected: false, deltaInner: 0 };
  }
  const deltaInner = prevInnerWidth - nextInnerWidth;
  const deltaOuter = Math.abs(nextOuterWidth - prevOuterWidth);
  const deltaDpr = Math.abs((Number(nextDpr) || 1) - (Number(prevDpr) || 1));
  return {
    detected: deltaInner >= 180 && deltaOuter < 40 && deltaDpr < 0.02,
    deltaInner
  };
};

const resolveDomElement = (node) => {
  if (!node) return null;
  if (node.nodeType === 1) return node;
  if (node.nodeType === 3) return node.parentElement || null;
  return null;
};

const isElementInsideExamSource = (node) => {
  const el = resolveDomElement(node);
  return Boolean(el && typeof el.closest === 'function' && el.closest('[data-exam-copy-source="true"]'));
};

const isElementEditableExamInput = (node) => {
  const el = resolveDomElement(node);
  if (!el) return false;
  const tag = String(el.tagName || '').toUpperCase();
  if (tag === 'TEXTAREA') return !el.readOnly && !el.disabled;
  if (tag === 'INPUT') {
    const type = String(el.type || 'text').toLowerCase();
    return ['text', 'search', ''].includes(type) && !el.readOnly && !el.disabled;
  }
  return Boolean(el.isContentEditable);
};

const extractSelectedTextForClipboard = () => {
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    const start = typeof active.selectionStart === 'number' ? active.selectionStart : 0;
    const end = typeof active.selectionEnd === 'number' ? active.selectionEnd : 0;
    if (end > start && typeof active.value === 'string') {
      return {
        text: active.value.slice(start, end),
        anchorNode: active,
        focusNode: active
      };
    }
  }
  const sel = window.getSelection?.();
  return {
    text: sel ? sel.toString() : '',
    anchorNode: sel?.anchorNode || null,
    focusNode: sel?.focusNode || null
  };
};

export function useExamAntiCheat({
  enabled,
  enforceFullscreen = false,
  allowInternalCopyPaste = true,
  setExamState,
  showToast
}) {
  const antiCheatToastRef = useRef(null);
  const setExamStateRef = useRef(null);
  const internalClipboardRef = useRef('');
  const lastValidInternalPasteAtRef = useRef(0);
  const hadEnteredFullscreenRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(() => isDocumentInFullscreen());
  const [fullscreenGracePending, setFullscreenGracePending] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  useEffect(() => {
    antiCheatToastRef.current = showToast;
    setExamStateRef.current = setExamState;
  });

  const enterFullscreen = useCallback(async () => {
    const ok = await requestExamFullscreen();
    if (ok) {
      hadEnteredFullscreenRef.current = true;
      setIsFullscreen(true);
      setIsWindowBlurred(false);
    }
    return ok;
  }, []);

  const recordInternalCopy = useCallback(async (rawText) => {
    const clean = normalizeInternalClipboardText(rawText);
    if (!clean) return false;
    internalClipboardRef.current = clean;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(String(rawText || ''));
      }
    } catch (_err) {
      // Ignore browser clipboard write permission denial; internal buffer still tracks it.
    }
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) {
      hadEnteredFullscreenRef.current = false;
      setFullscreenGracePending(false);
      setIsWindowBlurred(false);
      return;
    }

    const fsSupported = isFullscreenApiSupported();
    const initialFs = isDocumentInFullscreen();
    if (initialFs) {
      hadEnteredFullscreenRef.current = true;
      setFullscreenGracePending(false);
      if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
        navigator.keyboard.lock(['Escape', 'F11']).catch(() => {});
      }
    } else if (enforceFullscreen && fsSupported) {
      // Brief grace window while startExam's requestFullscreen() promise settles (zero flicker)
      setFullscreenGracePending(true);
    }
    setIsFullscreen(initialFs);
    setFullscreenExitCount(0);
    setIsWindowBlurred(false);

    const fsGraceTimer =
      !initialFs && enforceFullscreen && fsSupported
        ? setTimeout(() => {
            setFullscreenGracePending(false);
          }, 450)
        : null;

    const seenSignatures = new Map();
    const pendingTimers = new Set();
    let lastTabCountedAt = 0;
    const viewportSnapshot = {
      innerWidth: window.innerWidth || 0,
      outerWidth: window.outerWidth || 0,
      dpr: window.devicePixelRatio || 1
    };
    let lastToastAt = 0;
    let blurConfirmTimer = null;
    let awayAlreadyRecorded = document.visibilityState === 'hidden' || !document.hasFocus();
    let unfocusedStreak = 0;

    const trackTimer = (fn, delayMs) => {
      const id = setTimeout(() => {
        pendingTimers.delete(id);
        fn();
      }, delayMs);
      pendingTimers.add(id);
      return id;
    };

    const notifyRestricted = (msg) => {
      const now = Date.now();
      if (now - lastToastAt < 2500) return;
      lastToastAt = now;
      antiCheatToastRef.current?.(msg, 'info');
    };

    const recordViolation = (
      event,
      { countTabSwitch = false, category = 'focus', severity = 'medium', dedupKey = null, cooldownMs = 0 } = {}
    ) => {
      const nowMs = Date.now();
      if (countTabSwitch && nowMs - lastTabCountedAt < 1200) return;
      if (dedupKey) {
        const lastSeen = seenSignatures.get(dedupKey);
        if (lastSeen && (cooldownMs === 0 || nowMs - lastSeen < cooldownMs)) return;
        seenSignatures.set(dedupKey, nowMs);
      }
      if (countTabSwitch) lastTabCountedAt = nowMs;

      const timeStr = new Date(nowMs).toTimeString().split(' ')[0];
      setExamStateRef.current?.(prev => ({
        ...prev,
        tabSwitchCount: countTabSwitch ? prev.tabSwitchCount + 1 : prev.tabSwitchCount,
        antiCheatLogs: [
          ...prev.antiCheatLogs,
          { timestamp: timeStr, skill: prev.skill, event, category, severity }
        ]
      }));
    };

    const markReturnedToExam = () => {
      if (blurConfirmTimer) {
        clearTimeout(blurConfirmTimer);
        pendingTimers.delete(blurConfirmTimer);
        blurConfirmTimer = null;
      }
      if (!document.hidden && document.hasFocus()) {
        awayAlreadyRecorded = false;
        unfocusedStreak = 0;
        setIsWindowBlurred(false);
      }
    };

    const handleFullscreenChange = () => {
      const nowFs = isDocumentInFullscreen();
      setIsFullscreen(nowFs);
      setFullscreenGracePending(false);
      if (nowFs) {
        hadEnteredFullscreenRef.current = true;
        setIsWindowBlurred(false);
        if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
          navigator.keyboard.lock(['Escape', 'F11']).catch(() => {});
        }
      } else if (enforceFullscreen && hadEnteredFullscreenRef.current) {
        setFullscreenExitCount(c => c + 1);
        notifyRestricted('⚠️ Bạn vừa thoát chế độ Toàn Màn Hình! Hệ thống đã khóa đề và ghi nhận vi phạm.');
        recordViolation('Thoát chế độ Toàn Màn Hình trong lúc thi (Đã che mờ đề & yêu cầu vào lại)', {
          countTabSwitch: true,
          category: 'fullscreen',
          severity: 'high',
          dedupKey: 'exit-fullscreen',
          cooldownMs: 1500
        });
      }
    };

    // Chỉ đếm khi cửa sổ trình duyệt thực sự mất focus (không dùng capture=true để tránh bắt nhầm click nút/input bên trong bài thi)
    const handleWindowBlur = (e) => {
      if (e?.target && e.target !== window) return;
      if (blurConfirmTimer) {
        clearTimeout(blurConfirmTimer);
        pendingTimers.delete(blurConfirmTimer);
      }
      blurConfirmTimer = trackTimer(() => {
        blurConfirmTimer = null;
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          if (enforceFullscreen) setIsWindowBlurred(true);
          if (awayAlreadyRecorded) return;
          awayAlreadyRecorded = true;
          recordViolation('Rời khỏi màn hình làm bài (Mất focus cửa sổ / Mở ứng dụng khác)', {
            countTabSwitch: true,
            category: 'focus',
            severity: 'medium'
          });
        }
      }, 180);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (enforceFullscreen) setIsWindowBlurred(true);
        if (awayAlreadyRecorded) return;
        awayAlreadyRecorded = true;
        recordViolation('Rời khỏi màn hình làm bài (Chuyển tab / Ẩn trình duyệt)', {
          countTabSwitch: true,
          category: 'focus',
          severity: 'medium'
        });
      } else {
        markReturnedToExam();
      }
    };

    // Capture-phase blockers defeat bubble-phase extension overrides
    const handleContextMenuCapture = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      notifyRestricted('Chức năng chuột phải đã bị khóa trong khi thi!');
      recordViolation('Thử mở menu chuột phải (Đã chặn)', {
        category: 'interaction',
        severity: 'medium',
        dedupKey: 'ctxmenu-blocked',
        cooldownMs: 3000
      });
      trackTimer(() => {
        if (!e.defaultPrevented) {
          recordViolation('Cảnh báo: Thao tác chuột phải đã vượt qua khóa bảo vệ (Extension hỗ trợ Copy/Chuột phải)', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'bypass-ctxmenu',
            cooldownMs: 5000
          });
        }
      }, 0);
    };

    const handleClipboardCapture = (e) => {
      const selInfo = extractSelectedTextForClipboard();
      const isInternalSource =
        isElementInsideExamSource(e.target) ||
        isElementInsideExamSource(document.activeElement) ||
        isElementInsideExamSource(selInfo.anchorNode) ||
        isElementInsideExamSource(selInfo.focusNode);
      const isAnswerTarget =
        isElementEditableExamInput(e.target) || isElementEditableExamInput(document.activeElement);
      const pastedRaw = e.type === 'paste' ? (e.clipboardData?.getData('text/plain') ?? '') : '';

      const decision = evaluateInternalClipboardAction({
        actionType: e.type,
        allowInternalCopyPaste,
        selectedText: selInfo.text,
        clipboardText: pastedRaw,
        isInternalSource,
        isAnswerTarget,
        lastInternalText: internalClipboardRef.current
      });

      if (decision.allowed) {
        if (e.type === 'copy' || e.type === 'cut') {
          internalClipboardRef.current = decision.nextInternalText;
        } else if (e.type === 'paste') {
          lastValidInternalPasteAtRef.current = Date.now();
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const actionMap = { paste: 'dán (Paste)', cut: 'cắt (Cut)', copy: 'sao chép (Copy)' };
      if (decision.reason === 'external-paste-blocked') {
        recordViolation('Chặn dán văn bản từ bên ngoài bài thi (External Paste Blocked)', {
          category: 'interaction',
          severity: 'high',
          dedupKey: 'external-paste-blocked',
          cooldownMs: 3000
        });
      } else {
        recordViolation(`Thử ${actionMap[e.type] || e.type} nội dung (Đã chặn)`, {
          category: 'interaction',
          severity: 'medium',
          dedupKey: `clip-${e.type}`,
          cooldownMs: 3000
        });
      }
      trackTimer(() => {
        if (!e.defaultPrevented) {
          recordViolation(`Cảnh báo: Thao tác ${actionMap[e.type] || e.type} đã vượt khóa bảo vệ (Extension hỗ trợ Copy/Paste)`, {
            category: 'extension',
            severity: 'high',
            dedupKey: `bypass-clip-${e.type}`,
            cooldownMs: 5000
          });
        }
      }, 0);
    };

    const handleKeyDownCapture = (e) => {
      const keyLower = (e.key || '').toLowerCase();
      const hasMod = e.ctrlKey || e.metaKey;
      const isCopyCutPasteKey = hasMod && ['c', 'v', 'x'].includes(keyLower);
      const isFullscreenExitOrNavKey =
        e.key === 'F11' ||
        (enforceFullscreen && e.key === 'Escape' && isDocumentInFullscreen()) ||
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
        (hasMod && ['t', 'n', 'w', 'l', 'k', 'tab'].includes(keyLower));
      const isDevToolsOrSource =
        e.key === 'F12' ||
        (hasMod && e.shiftKey && ['i', 'j', 'c'].includes(keyLower)) ||
        (hasMod && keyLower === 'u');

      if (!isCopyCutPasteKey && !isDevToolsOrSource && !isFullscreenExitOrNavKey) return;

      if (isFullscreenExitOrNavKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        notifyRestricted('Phím thoát Toàn Màn Hình / chuyển tab đã bị khóa trong khi thi!');
        recordViolation(`Thử bấm phím ${e.key} để thoát toàn màn hình / chuyển cửa sổ (Đã chặn)`, {
          category: 'fullscreen',
          severity: 'high',
          dedupKey: `key-fs-${e.key}`,
          cooldownMs: 2500
        });
        return;
      }

      if (allowInternalCopyPaste && isCopyCutPasteKey && !e.shiftKey) {
        if (keyLower === 'v') {
          // Let paste event fire so we can synchronously inspect clipboardData against internalClipboardRef.current
          return;
        }
        const selInfo = extractSelectedTextForClipboard();
        const canInternalCopyCut =
          keyLower === 'c'
            ? isElementInsideExamSource(e.target) ||
              isElementInsideExamSource(document.activeElement) ||
              isElementInsideExamSource(selInfo.anchorNode)
            : isElementEditableExamInput(e.target) || isElementEditableExamInput(document.activeElement);
        if (canInternalCopyCut) {
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const label = isDevToolsOrSource ? 'mở DevTools / Kiểm tra mã nguồn' : `phím tắt (${e.key.toUpperCase()})`;
      if (isDevToolsOrSource) {
        notifyRestricted('Phím tắt này đã bị khóa trong khi làm bài thi!');
      }
      recordViolation(`Thử dùng ${label} (Đã chặn)`, {
        category: isDevToolsOrSource ? 'extension' : 'interaction',
        severity: isDevToolsOrSource ? 'high' : 'medium',
        dedupKey: `key-${label}`,
        cooldownMs: 3000
      });
    };

    // Chặn dự phòng nếu extension lách sự kiện paste để chèn thẳng dữ liệu vào ô nhập (giữ nguyên bộ gõ tiếng Việt)
    const handleBeforeInputCapture = (e) => {
      if (e.inputType !== 'insertFromPaste') return;
      if (allowInternalCopyPaste && Date.now() - lastValidInternalPasteAtRef.current <= 400) {
        return;
      }
      const incoming = normalizeInternalClipboardText(
        e.data ?? e.dataTransfer?.getData('text/plain') ?? ''
      );
      if (
        allowInternalCopyPaste &&
        incoming.length > 0 &&
        incoming === internalClipboardRef.current &&
        isElementEditableExamInput(e.target)
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      recordViolation('Cảnh báo: Phát hiện thao tác dán văn bản từ bên ngoài / vượt khóa clipboard', {
        category: 'extension',
        severity: 'high',
        dedupKey: 'bypass-beforeinput-paste',
        cooldownMs: 4000
      });
    };

    const handleWindowResizeDetectSidePanel = () => {
      const nextInnerWidth = window.innerWidth || 0;
      const nextOuterWidth = window.outerWidth || 0;
      const nextDpr = window.devicePixelRatio || 1;
      const check = detectSidePanelResize({
        prevInnerWidth: viewportSnapshot.innerWidth,
        prevOuterWidth: viewportSnapshot.outerWidth,
        prevDpr: viewportSnapshot.dpr,
        nextInnerWidth,
        nextOuterWidth,
        nextDpr
      });
      viewportSnapshot.innerWidth = nextInnerWidth;
      viewportSnapshot.outerWidth = nextOuterWidth;
      viewportSnapshot.dpr = nextDpr;

      if (check.detected) {
        notifyRestricted(
          `Cảnh báo: Khung màn hình bị thu hẹp đột ngột (-${check.deltaInner}px). Hệ thống đã ghi nhận nghi vấn mở Panel Từ điển / Dịch bên hông!`
        );
        recordViolation(
          `Phát hiện nghi vấn mở Panel bên hông trình duyệt / Từ điển & Dịch (Chiều rộng vùng thi giảm -${check.deltaInner}px)`,
          {
            category: 'extension',
            severity: 'high',
            dedupKey: 'side-panel-resize',
            cooldownMs: 8000
          }
        );
      }
    };

    // Chỉ kiểm tra 2 nhóm: (1) Extension mở khóa Copy/Paste/Chuột phải, (2) Extension giả mạo/chặn đếm out-tab
    const inspectAntiCheatTampering = () => {
      try {
        COPY_PASTE_EXTENSION_SIGNATURES.forEach(sig => {
          if (document.querySelector(sig.selector)) {
            recordViolation(`Phát hiện tiện ích lách luật: ${sig.label}`, {
              category: 'extension',
              severity: 'high',
              dedupKey: sig.key
            });
          }
        });

        // Kiểm tra ghi đè trực tiếp API theo dõi out-tab trên document (Extension chặn đọc số lần out tab)
        if (
          Object.getOwnPropertyDescriptor(document, 'hidden') ||
          Object.getOwnPropertyDescriptor(document, 'visibilityState') ||
          Object.getOwnPropertyDescriptor(document, 'hasFocus')
        ) {
          recordViolation('Cảnh báo: Phát hiện Extension/mã can thiệp API đếm out-tab (hidden / visibilityState / hasFocus)', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'tamper-doc-ownprop'
          });
        }

        // Kiểm tra sửa Prototype trình duyệt nhằm chặn đếm out-tab hoặc mở khóa Copy/Paste/Chuột phải
        const hiddenGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')?.get;
        const visGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')?.get;
        if (
          (hiddenGetter && !isNativeFn(hiddenGetter)) ||
          (visGetter && !isNativeFn(visGetter)) ||
          !isNativeFn(Document.prototype.hasFocus)
        ) {
          recordViolation('Cảnh báo: API đếm rời tab (Document.prototype) bị sửa đổi (Nghi vấn Extension chống đếm out-tab)', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'tamper-focus-proto'
          });
        }

        if (
          !isNativeFn(Event.prototype.preventDefault) ||
          !isNativeFn(Event.prototype.stopPropagation) ||
          !isNativeFn(Event.prototype.stopImmediatePropagation)
        ) {
          recordViolation('Cảnh báo: Prototype chặn Copy/Paste/Chuột phải (Event.prototype) bị sửa đổi bởi Extension', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'tamper-copy-proto'
          });
        }
      } catch (_err) {
        // Ignore restricted browser descriptor read errors
      }
    };

    const observer = new MutationObserver(() => {
      inspectAntiCheatTampering();
    });
    try {
      observer.observe(document.documentElement, { childList: true, subtree: false });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: false });
      }
    } catch (_err) {}

    // Fallback phát hiện mất focus liên tục nếu Extension chặn sự kiện blur/visibilitychange
    let tickCounter = 0;
    const heartbeatTimer = setInterval(() => {
      if (!document.hidden && document.hasFocus()) {
        awayAlreadyRecorded = false;
        unfocusedStreak = 0;
      } else if (!awayAlreadyRecorded) {
        unfocusedStreak += 1;
        if (unfocusedStreak >= 2) {
          awayAlreadyRecorded = true;
          recordViolation('Rời khỏi màn hình làm bài (Phát hiện mất focus định kỳ)', {
            countTabSwitch: true,
            category: 'focus',
            severity: 'medium'
          });
        }
      }

      tickCounter += 1;
      if (tickCounter % 4 === 0) {
        inspectAntiCheatTampering();
      }
    }, 1000);

    inspectAntiCheatTampering();

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', markReturnedToExam);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenuCapture, true);
    document.addEventListener('contextmenu', handleContextMenuCapture, true);
    window.addEventListener('copy', handleClipboardCapture, true);
    window.addEventListener('cut', handleClipboardCapture, true);
    window.addEventListener('paste', handleClipboardCapture, true);
    window.addEventListener('beforeinput', handleBeforeInputCapture, true);
    window.addEventListener('keydown', handleKeyDownCapture, true);
    window.addEventListener('resize', handleWindowResizeDetectSidePanel);

    return () => {
      if (fsGraceTimer) clearTimeout(fsGraceTimer);
      clearInterval(heartbeatTimer);
      pendingTimers.forEach(id => clearTimeout(id));
      pendingTimers.clear();
      observer.disconnect();
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', markReturnedToExam);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenuCapture, true);
      document.removeEventListener('contextmenu', handleContextMenuCapture, true);
      window.removeEventListener('copy', handleClipboardCapture, true);
      window.removeEventListener('cut', handleClipboardCapture, true);
      window.removeEventListener('paste', handleClipboardCapture, true);
      window.removeEventListener('beforeinput', handleBeforeInputCapture, true);
      window.removeEventListener('keydown', handleKeyDownCapture, true);
      window.removeEventListener('resize', handleWindowResizeDetectSidePanel);
      if (fsSupported && enforceFullscreen) {
        exitExamFullscreen();
      }
    };
  }, [enabled, enforceFullscreen, allowInternalCopyPaste]);

  const fullscreenRequiredLock = Boolean(
    enabled && enforceFullscreen && isFullscreenApiSupported() && !isFullscreen && !fullscreenGracePending
  );

  return {
    recordInternalCopy,
    isFullscreen,
    fullscreenRequiredLock,
    fullscreenExitCount,
    isWindowBlurred: Boolean(enabled && enforceFullscreen && isWindowBlurred),
    enterFullscreen,
    exitFullscreen: exitExamFullscreen
  };
}
