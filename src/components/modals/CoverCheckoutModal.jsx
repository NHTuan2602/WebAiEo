import { useEffect, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, QrCode, RefreshCw, Sparkles, X } from 'lucide-react';
import { formatVndCurrency, hasCustomCoverPermission, normalizePaymentConfig } from '../../constants/profileCustomization';
import CoverUnlockQrCard from '../common/CoverUnlockQrCard';

export default function CoverCheckoutModal({
  isOpen,
  currentUser = null,
  paymentConfig = null,
  onClose,
  onUnlockedReady = null,
  onRequestUnlock = null,
  onPullSync = null,
  showToast = null
}) {
  const [order, setOrder] = useState(null);
  const [livePayCfg, setLivePayCfg] = useState(null);
  const [requestingManual, setRequestingManual] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [error, setError] = useState('');

  const isUnlocked = hasCustomCoverPermission(currentUser);
  const activePayCfg = livePayCfg || paymentConfig;
  const effectiveCfg = normalizePaymentConfig(activePayCfg || {});
  const priceLabel = formatVndCurrency(effectiveCfg.coverUnlockPrice);
  const creating = isOpen && !isUnlocked && !order && !error;

  useEffect(() => {
    if (!isOpen || isUnlocked) return undefined;
    let cancelled = false;
    fetch('/api/sync/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (!data?.ok) {
          setError(data?.error || 'Không thể khởi tạo mã thanh toán QR.');
          return;
        }
        if (data.paymentConfig) setLivePayCfg(data.paymentConfig);
        if (data.order) setOrder(data.order);
        if (data.alreadyUnlocked) {
          onPullSync?.();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Lỗi kết nối khi tạo mã QR thanh toán.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isUnlocked, onPullSync]);

  // Poll order status every 3s while checkout modal stays open (backup alongside instant SSE)
  useEffect(() => {
    if (!isOpen || isUnlocked || !order?.orderCode) return undefined;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync/payment/order?code=${encodeURIComponent(order.orderCode)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.unlocked || data?.order?.status === 'paid') {
          await onPullSync?.();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, isUnlocked, order?.orderCode, onPullSync]);

  if (!isOpen) return null;

  const handleManualCheck = async () => {
    if (!order?.orderCode || checkingNow) return;
    setCheckingNow(true);
    try {
      const res = await fetch(`/api/sync/payment/order?code=${encodeURIComponent(order.orderCode)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.unlocked || data?.order?.status === 'paid') {
        await onPullSync?.();
        showToast?.('🎉 Đã xác nhận thanh toán & mở khóa Ảnh Nền Riêng!');
      } else {
        showToast?.('Hệ thống chưa nhận được giao dịch khớp mã đơn. Nếu vừa chuyển, đợi 3–5 giây nhé!', 'info');
      }
    } catch {
      showToast?.('Không thể kiểm tra trạng thái lúc này.', 'error');
    } finally {
      setCheckingNow(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-checkout-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#1EE1D6]" />
            <div>
              <h3 id="cover-checkout-title" className="text-sm sm:text-base font-extrabold flex items-center gap-2 flex-wrap">
                <span>Mở Khóa Ảnh Nền Riêng</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black tabular-nums">
                  {priceLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {order?.orderCode ? `Mã đơn thanh toán: #${order.orderCode}` : 'Quét mã VietQR để mở khóa tải & cắt ảnh bìa cá nhân'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {isUnlocked ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                Thanh toán thành công — Đã mở khóa Ảnh Nền Riêng!
              </h4>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300 leading-relaxed">
                Tài khoản <b>@{currentUser?.username}</b> đã được mở khóa quyền tải ảnh nền từ máy, cắt khung &amp; dán link ảnh riêng vĩnh viễn.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onUnlockedReady?.();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow inline-flex items-center gap-2"
              >
                <ImagePlus className="w-4 h-4" /> Tải &amp; Cắt Ảnh Nền Ngay
              </button>
            </div>
          ) : creating && !order ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#007A7A]" />
              <span>Đang tạo mã đơn &amp; mã VietQR {priceLabel}...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              {error}
            </div>
          ) : (
            <>
              <CoverUnlockQrCard
                username={currentUser?.username || ''}
                orderCode={order?.orderCode || ''}
                paymentConfig={activePayCfg}
                requestedAt={currentUser?.coverUnlockRequestedAt || 0}
                requesting={requestingManual}
                onRequestUnlock={onRequestUnlock ? async () => {
                  setRequestingManual(true);
                  await onRequestUnlock();
                  setRequestingManual(false);
                } : null}
                showToast={showToast}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tự động cập nhật ngay khi thanh toán thành công
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={checkingNow}
                    onClick={handleManualCheck}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingNow ? 'animate-spin' : ''}`} />
                    Kiểm tra giao dịch
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
