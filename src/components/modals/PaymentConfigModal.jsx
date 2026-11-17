import { useState } from 'react';
import { QrCode, Save, Trash2, Upload, X } from 'lucide-react';
import {
  CUSTOM_COVER_UNLOCK_PRICE_VND,
  VIETQR_BANK_OPTIONS,
  formatVndCurrency,
  normalizePaymentConfig
} from '../../constants/profileCustomization';
import { loadImageElement, readImageFileAsDataUrl } from '../../utils/examHelpers';
import CoverUnlockQrCard from '../common/CoverUnlockQrCard';

async function compressQrImagePreserveFullFrame(rawDataUrl) {
  const img = await loadImageElement(rawDataUrl);
  const maxDim = 720;
  const srcW = Math.max(1, img.naturalWidth || img.width || 720);
  const srcH = Math.max(1, img.naturalHeight || img.height || 720);
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const targetW = Math.max(120, Math.round(srcW * scale));
  const targetH = Math.max(120, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);
  for (const q of [0.88, 0.78, 0.65, 0.5]) {
    const out = canvas.toDataURL('image/jpeg', q);
    if (out.length <= 420_000) return out;
  }
  return canvas.toDataURL('image/jpeg', 0.45);
}

export default function PaymentConfigModal({
  isOpen,
  paymentConfig = null,
  onClose,
  onSave,
  showToast
}) {
  const [draft, setDraft] = useState(() => normalizePaymentConfig(paymentConfig || {}));
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleBankChange = nextCode => {
    const found = VIETQR_BANK_OPTIONS.find(b => b.code === nextCode);
    setDraft(prev => ({
      ...prev,
      bankCode: nextCode,
      bankName: found ? found.name : prev.bankName
    }));
  };

  const handleUploadQrFile = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rawUrl = await readImageFileAsDataUrl(file);
      const compactUrl = await compressQrImagePreserveFullFrame(rawUrl);
      setDraft(prev => ({ ...prev, customQrUrl: compactUrl }));
      showToast?.('Đã nạp ảnh QR thành công! Nhớ bấm Lưu Cấu Hình QR.');
    } catch (err) {
      showToast?.(err?.message || 'Không thể đọc ảnh QR.', 'error');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving || !onSave) return;
    setSaving(true);
    try {
      const normalized = normalizePaymentConfig(draft);
      const ok = await onSave(normalized);
      if (ok !== false) {
        onClose?.();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-config-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#1EE1D6]" />
            <div>
              <h3 id="payment-config-title" className="text-sm sm:text-base font-extrabold">
                Cài Đặt Tài Khoản Nhận 5.000đ Mở Khóa Ảnh Nền
              </h3>
              <p className="text-[11px] text-slate-300">
                Thiết lập VietQR hoặc tải sẵn ảnh QR để học viên chuyển khoản mở khóa Ảnh Nền Riêng ({formatVndCurrency(draft.coverUnlockPrice)}).
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phí mở khóa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000000}
                    step={1000}
                    value={draft.coverUnlockPrice}
                    onChange={e => setDraft(prev => ({
                      ...prev,
                      coverUnlockPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                    }))}
                    placeholder={String(CUSTOM_COVER_UNLOCK_PRICE_VND)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ngân hàng (VietQR tự động)
                  </label>
                  <select
                    value={draft.bankCode}
                    onChange={e => handleBankChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {VIETQR_BANK_OPTIONS.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name} ({bank.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số tài khoản nhận tiền
                  </label>
                  <input
                    type="text"
                    value={draft.accountNumber}
                    onChange={e => setDraft(prev => ({ ...prev, accountNumber: e.target.value.replace(/\s+/g, '') }))}
                    placeholder="vd: 0123456789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={draft.accountName}
                    onChange={e => setDraft(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="vd: PHAM THI QUYNH NHU"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Hoặc tải sẵn ảnh QR Ngân hàng / MoMo (tùy chọn)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold cursor-pointer hover:opacity-90 transition">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh QR
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadQrFile} />
                  </label>
                  {draft.customQrUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft(prev => ({ ...prev, customQrUrl: '' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Dùng VietQR tự động
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú thêm cho học viên (tùy chọn)
                </label>
                <input
                  type="text"
                  value={draft.paymentNoteHint}
                  onChange={e => setDraft(prev => ({ ...prev, paymentNoteHint: e.target.value }))}
                  placeholder="vd: Chụp bill gửi Zalo Ms. Như để được duyệt trong 5 phút!"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Xem trước khung thanh toán học viên thấy
              </p>
              <CoverUnlockQrCard
                username="hocsinh_01"
                paymentConfig={draft}
                isPreview={true}
                showToast={showToast}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu Cấu Hình QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
