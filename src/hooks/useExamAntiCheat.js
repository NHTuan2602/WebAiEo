import { useEffect, useRef } from 'react';

// Chỉ nhận diện nhóm tiện ích hỗ trợ Copy/Paste hoặc mở khóa chuột phải
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
  }
];

const isNativeFn = (fn) =>
  typeof fn === 'function' && Function.prototype.toString.call(fn).includes('[native code]');

export function useExamAntiCheat({ enabled, setExamState, showToast }) {
  const antiCheatToastRef = useRef(null);
  const setExamStateRef = useRef(null);

  useEffect(() => {
    antiCheatToastRef.current = showToast;
    setExamStateRef.current = setExamState;
  });

  useEffect(() => {
    if (!enabled) return;

    const seenSignatures = new Map();
    const pendingTimers = new Set();
    let lastTabCountedAt = 0;
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
        if (awayAlreadyRecorded) return;
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          awayAlreadyRecorded = true;
          recordViolation('Rời khỏi màn hình làm bài (Mất focus cửa sổ)', {
            countTabSwitch: true,
            category: 'focus',
            severity: 'medium'
          });
        }
      }, 180);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
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
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const actionMap = { paste: 'dán (Paste)', cut: 'cắt (Cut)', copy: 'sao chép (Copy)' };
      notifyRestricted('Sao chép / dán đã bị khóa khi bật chống gian lận!');
      recordViolation(`Thử ${actionMap[e.type] || e.type} nội dung (Đã chặn)`, {
        category: 'interaction',
        severity: 'medium',
        dedupKey: `clip-${e.type}`,
        cooldownMs: 3000
      });
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
      const isClipboardShortcut = hasMod && ['c', 'v', 'x'].includes(keyLower);
      const isDevToolsOrSource =
        e.key === 'F12' ||
        (hasMod && e.shiftKey && ['i', 'j', 'c'].includes(keyLower)) ||
        (hasMod && keyLower === 'u');
      if (!isClipboardShortcut && !isDevToolsOrSource) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const label = isDevToolsOrSource ? 'mở DevTools / Kiểm tra mã nguồn' : `phím tắt (${e.key.toUpperCase()})`;
      notifyRestricted('Phím tắt này đã bị khóa trong khi làm bài thi!');
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
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      notifyRestricted('Chức năng dán văn bản (Paste) đã bị khóa trong khi thi!');
      recordViolation('Cảnh báo: Phát hiện thao tác dán văn bản vượt khóa clipboard (Extension hỗ trợ Paste)', {
        category: 'extension',
        severity: 'high',
        dedupKey: 'bypass-beforeinput-paste',
        cooldownMs: 4000
      });
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
    window.addEventListener('contextmenu', handleContextMenuCapture, true);
    document.addEventListener('contextmenu', handleContextMenuCapture, true);
    window.addEventListener('copy', handleClipboardCapture, true);
    window.addEventListener('cut', handleClipboardCapture, true);
    window.addEventListener('paste', handleClipboardCapture, true);
    window.addEventListener('beforeinput', handleBeforeInputCapture, true);
    window.addEventListener('keydown', handleKeyDownCapture, true);

    return () => {
      clearInterval(heartbeatTimer);
      pendingTimers.forEach(id => clearTimeout(id));
      pendingTimers.clear();
      observer.disconnect();
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', markReturnedToExam);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('contextmenu', handleContextMenuCapture, true);
      document.removeEventListener('contextmenu', handleContextMenuCapture, true);
      window.removeEventListener('copy', handleClipboardCapture, true);
      window.removeEventListener('cut', handleClipboardCapture, true);
      window.removeEventListener('paste', handleClipboardCapture, true);
      window.removeEventListener('beforeinput', handleBeforeInputCapture, true);
      window.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [enabled]);
}
