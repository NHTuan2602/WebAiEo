import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, Crown, Eye, EyeOff, QrCode, Save, ShieldCheck, Trash2, Upload, Webhook, X } from 'lucide-react';
import { ADMIN_PAYMENT_CONTACT } from '../../constants/brandInfo';
import {
  CUSTOM_COVER_UNLOCK_PRICE_VND,
  PAID_SHOP_TITLES,
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
  onSaved = null,
  showToast
}) {
  const [draft, setDraft] = useState(() => normalizePaymentConfig(paymentConfig || {}));
  const [secretsForm, setSecretsForm] = useState({ sepayApiKey: '', payosChecksumKey: '' });
  const [flags, setFlags] = useState({
    hasSepayApiKey: Boolean(paymentConfig?.hasSepayApiKey),
    hasPayosChecksumKey: Boolean(paymentConfig?.hasPayosChecksumKey),
    autoVerifyEnabled: Boolean(paymentConfig?.autoVerifyEnabled)
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    fetch('/api/sync/payment/config', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.ok || !data.config) return;
        const c = data.config;
        setDraft(normalizePaymentConfig(c));
        setFlags({
          hasSepayApiKey: Boolean(c.hasSepayApiKey),
          hasPayosChecksumKey: Boolean(c.hasPayosChecksumKey),
          autoVerifyEnabled: Boolean(c.autoVerifyEnabled)
        });
        setSecretsForm({ sepayApiKey: '', payosChecksumKey: '' });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/api/sync/payment/webhook`
      : 'https://luyenthiieltsnhatrang.up.railway.app/api/sync/payment/webhook';

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
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const normalized = normalizePaymentConfig(draft);
      const res = await fetch('/api/sync/payment/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentConfig: normalized,
          sepayApiKey: secretsForm.sepayApiKey.trim(),
          payosChecksumKey: secretsForm.payosChecksumKey.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Không thể lưu cấu hình thanh toán.');
        return;
      }
      onSaved?.(data.config);
      showToast?.('Đã lưu bảng giá, QR & cấu hình Webhook Quản Trị!');
      onClose?.();
    } catch {
      setError('Lỗi kết nối tới máy chủ.');
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#1EE1D6]" />
            <div>
              <h3 id="payment-config-title" className="text-sm sm:text-base font-extrabold">
                Quản Trị Giá Tiền, VietQR &amp; Tự Động Mở Khóa ({formatVndCurrency(draft.coverUnlockPrice)})
              </h3>
              <p className="text-[11px] text-slate-300">
                Chỉ Quản Trị Hệ Thống mới có quyền sửa bảng giá, tài khoản nhận tiền &amp; hỗ trợ giao dịch (SĐT/Zalo: {ADMIN_PAYMENT_CONTACT.phoneRaw}).
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Giá mở Ảnh Nền Riêng (VNĐ)
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
                    placeholder="vd: 0367073526"
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
                    placeholder="vd: NGUYEN HOANG TUAN"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              {/* Editable Prices for VIP Paid Titles */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/35 space-y-2.5">
                <p className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Bảng Giá Danh Hiệu VIP (VNĐ)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PAID_SHOP_TITLES.map(t => (
                    <div key={t.id}>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5 truncate">
                        {t.icon} {t.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10000000}
                        step={1000}
                        value={draft.paidTitlePrices?.[t.id] ?? t.defaultPriceVnd}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                          setDraft(prev => ({
                            ...prev,
                            paidTitlePrices: {
                              ...(prev.paidTitlePrices || {}),
                              [t.id]: val
                            }
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                      />
                    </div>
                  ))}
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

              {/* Automatic Webhook Verification Section */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/35 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Tự Động Duyệt Quét QR (SePay / PayOS)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    flags.autoVerifyEnabled || secretsForm.sepayApiKey.trim() || secretsForm.payosChecksumKey.trim()
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                  }`}>
                    {flags.autoVerifyEnabled ? 'Đang bật Tự Động' : 'Duyệt Tay'}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Webhook URL (dán vào my.sepay.vn hoặc my.payos.vn)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(webhookUrl);
                        setCopiedWebhook(true);
                        showToast?.('Đã sao chép Webhook URL!');
                        setTimeout(() => setCopiedWebhook(false), 1800);
                      }}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedWebhook ? 'Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        SePay API Key {flags.hasSepayApiKey ? '(Đã lưu — để trống nếu giữ nguyên)' : '(Khuyên dùng — Miễn phí 50 GD/tháng)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecrets(v => !v)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-0.5"
                      >
                        {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSecrets ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={secretsForm.sepayApiKey}
                      onChange={e => setSecretsForm(prev => ({ ...prev, sepayApiKey: e.target.value }))}
                      placeholder={flags.hasSepayApiKey ? '••••••••••••••••' : 'Dán API Key từ SePay (chọn chứng thực API Key)...'}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Hoặc PayOS Checksum Key {flags.hasPayosChecksumKey ? '(Đã lưu — để trống nếu giữ nguyên)' : '(tùy chọn)'}
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={secretsForm.payosChecksumKey}
                      onChange={e => setSecretsForm(prev => ({ ...prev, payosChecksumKey: e.target.value }))}
                      placeholder={flags.hasPayosChecksumKey ? '••••••••••••••••' : 'Dán Checksum Key từ kênh thanh toán PayOS...'}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed flex items-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Khi chưa nhập API Key, học viên vẫn quét được QR và liên hệ SĐT/Zalo Quản trị {ADMIN_PAYMENT_CONTACT.phoneRaw} để duyệt nhanh.</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Xem trước popup thanh toán học viên thấy
              </p>
              <CoverUnlockQrCard
                username="hocsinh_01"
                orderCode="MKN8F2A9C"
                paymentConfig={{
                  ...draft,
                  autoVerifyEnabled: flags.autoVerifyEnabled || Boolean(secretsForm.sepayApiKey.trim() || secretsForm.payosChecksumKey.trim())
                }}
                isPreview={true}
                showToast={showToast}
              />
              {flags.autoVerifyEnabled && (
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 px-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chế độ tự động 24/7 đang hoạt động!
                </p>
              )}
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
              <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu Bảng Giá & QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
