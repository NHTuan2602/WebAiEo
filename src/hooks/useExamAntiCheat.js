import { useEffect, useRef } from 'react';

const EXTENSION_SIGNATURES = [
  { key: 'ext-grammarly', selector: 'grammarly-desktop-integration, grammarly-extension, [data-grammarly-shadow-root]', label: 'Grammarly (Hỗ trợ viết)' },
  { key: 'ext-quillbot', selector: '[id*="quillbot" i], [class*="quillbot" i], quillbot-extension', label: 'QuillBot (Paraphrase / Viết lại)' },
  { key: 'ext-ai-sidebar', selector: 'monica-root, [id*="monica-" i], sider-app, [id*="sider-" i], chatgpt-sidebar, [id*="chatgpt-extension" i], merlin-root, harpa-container, [id*="liner-extension" i]', label: 'Tiện ích AI Sidebar / ChatGPT' },
  { key: 'ext-translate', selector: '#gtx-trans, .goog-te-banner-frame, .goog-te-gadget, deepl-inline-translate, [id*="deepl-" i]', label: 'Tiện ích Dịch thuật (Google Translate / DeepL)' },
  { key: 'ext-rightclick', selector: '[id*="enable-right-click" i], [id*="allow-copy" i], [class*="enable-copy" i], [data-allow-copy]', label: 'Tiện ích Bỏ Khóa Chuột Phải / Copy' }
];

const isNativeFn = (fn) => typeof fn === 'function' && Function.prototype.toString.call(fn).includes('[native code]');

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
    let lastTabCountedAt = 0;
    let lastToastAt = 0;
    let wasWindowFocused = document.hasFocus();
    let lastBeatTime = performance.now();

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

    const handleBlur = () => {
      recordViolation('Rời khỏi màn hình làm bài (Mất focus)', {
        countTabSwitch: true,
        category: 'focus',
        severity: 'medium'
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation('Rời khỏi màn hình làm bài (Ẩn tab)', {
          countTabSwitch: true,
          category: 'focus',
          severity: 'medium'
        });
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
      setTimeout(() => {
        if (!e.defaultPrevented) {
          recordViolation('Cảnh báo: Thao tác chuột phải đã vượt qua khóa bảo vệ (Extension bypass)', {
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
    };

    const handleKeyDownCapture = (e) => {
      const keyLower = (e.key || '').toLowerCase();
      const hasMod = e.ctrlKey || e.metaKey;
      const isDevTools =
        e.key === 'F12' || (hasMod && e.shiftKey && ['i', 'j', 'c'].includes(keyLower));
      const isBlockedShortcut = isDevTools || (hasMod && ['u', 'c', 'v', 'x'].includes(keyLower));
      if (!isBlockedShortcut) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const label = isDevTools ? 'mở DevTools / Kiểm tra trang' : `phím tắt (${e.key.toUpperCase()})`;
      notifyRestricted('Phím tắt này đã bị khóa trong khi làm bài thi!');
      recordViolation(`Thử dùng ${label} (Đã chặn)`, {
        category: isDevTools ? 'extension' : 'interaction',
        severity: isDevTools ? 'high' : 'medium',
        dedupKey: `key-${label}`,
        cooldownMs: 3000
      });
    };

    const inspectExtensionAndApiIntegrity = () => {
      try {
        EXTENSION_SIGNATURES.forEach(sig => {
          if (document.querySelector(sig.selector)) {
            recordViolation(`Phát hiện tiện ích hỗ trợ đang hoạt động: ${sig.label}`, {
              category: 'extension',
              severity: 'high',
              dedupKey: sig.key
            });
          }
        });

        const extAssets = document.querySelectorAll('script[src], link[href], iframe[src]');
        for (let i = 0; i < extAssets.length; i++) {
          const url = extAssets[i].src || extAssets[i].href || '';
          if (/^(chrome|moz|safari|edge)-extension:\/\//i.test(url)) {
            recordViolation('Phát hiện tài nguyên/mã tiêm từ Extension trình duyệt (extension://)', {
              category: 'extension',
              severity: 'high',
              dedupKey: `ext-url-${url.slice(0, 48)}`
            });
            break;
          }
        }

        const rootEl = document.getElementById('root');
        const checkForeignChildren = (container) => {
          if (!container) return;
          Array.from(container.children).forEach(child => {
            if (child === rootEl) return;
            const tag = (child.tagName || '').toLowerCase();
            if (child.shadowRoot || (tag.includes('-') && tag !== 'vite-error-overlay')) {
              recordViolation(`Phát hiện thành phần giao diện ngoài do Extension chèn vào (<${tag}>)`, {
                category: 'extension',
                severity: 'high',
                dedupKey: `ext-tag-${tag}`
              });
            }
          });
        };
        checkForeignChildren(document.documentElement);
        checkForeignChildren(document.body);

        if (
          Object.getOwnPropertyDescriptor(document, 'hidden') ||
          Object.getOwnPropertyDescriptor(document, 'visibilityState') ||
          Object.getOwnPropertyDescriptor(document, 'hasFocus')
        ) {
          recordViolation('Cảnh báo: Phát hiện mã/Extension ghi đè API trạng thái tab (hidden / visibilityState / hasFocus)', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'tamper-doc-ownprop'
          });
        }

        const hiddenGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')?.get;
        const visGetter = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')?.get;
        if (
          (hiddenGetter && !isNativeFn(hiddenGetter)) ||
          (visGetter && !isNativeFn(visGetter)) ||
          !isNativeFn(Document.prototype.hasFocus) ||
          !isNativeFn(Event.prototype.preventDefault) ||
          !isNativeFn(Event.prototype.stopImmediatePropagation)
        ) {
          recordViolation('Cảnh báo: Prototype trình duyệt bị sửa đổi (Nghi vấn Extension lách chống gian lận)', {
            category: 'extension',
            severity: 'high',
            dedupKey: 'tamper-proto-native'
          });
        }
      } catch (_err) {
        // Ignore restricted browser descriptor read errors
      }
    };

    const observer = new MutationObserver(() => {
      inspectExtensionAndApiIntegrity();
    });
    try {
      observer.observe(document.documentElement, { childList: true, subtree: false });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: false });
      }
    } catch (_err) {}

    let tickCounter = 0;
    const heartbeatTimer = setInterval(() => {
      const nowFocused = document.hasFocus();
      if (wasWindowFocused && !nowFocused) {
        recordViolation('Mất focus cửa sổ làm bài (Kiểm tra định kỳ / có thể bị Extension chặn blur)', {
          countTabSwitch: true,
          category: 'focus',
          severity: 'medium'
        });
      }
      wasWindowFocused = nowFocused;

      const nowPerf = performance.now();
      const delta = nowPerf - lastBeatTime;
      lastBeatTime = nowPerf;
      if (delta > 2800 && document.hidden === false) {
        recordViolation('Nghi vấn tab bị treo/ẩn nền dù trạng thái hiển thị bị giữ visible (Extension/Throttling)', {
          countTabSwitch: true,
          category: 'extension',
          severity: 'high',
          dedupKey: 'timer-drift',
          cooldownMs: 8000
        });
      }

      tickCounter += 1;
      if (tickCounter % 4 === 0) {
        inspectExtensionAndApiIntegrity();
      }
    }, 900);

    inspectExtensionAndApiIntegrity();

    window.addEventListener('blur', handleBlur, true);
    document.addEventListener('visibilitychange', handleVisibility, true);
    window.addEventListener('contextmenu', handleContextMenuCapture, true);
    document.addEventListener('contextmenu', handleContextMenuCapture, true);
    window.addEventListener('copy', handleClipboardCapture, true);
    window.addEventListener('cut', handleClipboardCapture, true);
    window.addEventListener('paste', handleClipboardCapture, true);
    window.addEventListener('keydown', handleKeyDownCapture, true);

    return () => {
      clearInterval(heartbeatTimer);
      observer.disconnect();
      window.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('visibilitychange', handleVisibility, true);
      window.removeEventListener('contextmenu', handleContextMenuCapture, true);
      document.removeEventListener('contextmenu', handleContextMenuCapture, true);
      window.removeEventListener('copy', handleClipboardCapture, true);
      window.removeEventListener('cut', handleClipboardCapture, true);
      window.removeEventListener('paste', handleClipboardCapture, true);
      window.removeEventListener('keydown', handleKeyDownCapture, true);
    };
  }, [enabled]);
}
