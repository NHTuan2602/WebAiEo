import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Lock,
  QrCode,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Webhook,
  X
} from 'lucide-react';
import { ADMIN_PAYMENT_CONTACT } from '../../constants/brandInfo';
import {
  AIEO_VIP_PRICE_VND,
  CUSTOM_COVER_UNLOCK_PRICE_VND,
  DEFAULT_EXAM_PRICE_VND,
  FRIEND_ROOM_TICKET_PRICE_VND,
  PAID_SHOP_TITLES,
  PERIODIC_MOCK_PRICE_VND,
  REAL_EXAM_COMBO_3_PRICE_VND,
  REAL_EXAM_COMBO_5_PRICE_VND,
  REAL_EXAM_COMBO_10_PRICE_VND,
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

/** Reusable field displaying either a saved locked secret badge or an editable paste input. */
function SecretKeySlot({
  label,
  subtitle = '',
  hasSaved = false,
  maskedHint = '',
  markedClear = false,
  isEditing = false,
  value = '',
  placeholder = '',
  showSecret = false,
  onToggleShow = null,
  onStartEdit,
  onCancelEdit,
  onMarkClear,
  onUndoClear,
  onChange
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
          <span>{label}</span>
          {subtitle && !hasSaved && (
            <span className="text-[#475569] dark:text-slate-400 font-normal">{subtitle}</span>
          )}
        </label>
        {(!hasSaved || isEditing) && onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-0.5 shrink-0"
          >
            {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSecret ? 'Ẩn' : 'Hiện'}
          </button>
        )}
      </div>

      {hasSaved && !markedClear && !isEditing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40">
          <div className="flex items-center gap-1.5 min-w-0">
            <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 whitespace-nowrap">
              Đã lưu:
            </span>
            <code className="text-xs font-mono font-bold text-emerald-950 dark:text-white truncate">
              {maskedHint || '••••••••'}
            </code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onStartEdit}
              className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-500/40 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50"
            >
              Đổi khóa
            </button>
            <button
              type="button"
              onClick={onMarkClear}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Xóa
            </button>
          </div>
        </div>
      ) : markedClear ? (
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-amber-100/80 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-xs font-bold text-amber-900 dark:text-amber-200">
          <span>Sẽ xóa khóa này khi bấm Lưu</span>
          <button type="button" onClick={onUndoClear} className="text-[#007A7A] dark:text-[#1EE1D6] hover:underline">
            Hoàn tác
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type={showSecret ? 'text' : 'password'}
            autoComplete="new-password"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono placeholder:font-sans placeholder:text-slate-400"
          />
          {hasSaved && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="shrink-0 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Hủy
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PaymentConfigModal({
  isOpen,
  paymentConfig = null,
  onClose,
  onSaved = null,
  showToast
}) {
  const [draft, setDraft] = useState(() => normalizePaymentConfig(paymentConfig || {}));
  const [payosClientId, setPayosClientId] = useState('');
  const [secretsForm, setSecretsForm] = useState({ sepayApiKey: '', payosApiKey: '', payosChecksumKey: '' });
  const [clearSecrets, setClearSecrets] = useState({ sepayApiKey: false, payosApiKey: false, payosChecksumKey: false });
  const [editingSecrets, setEditingSecrets] = useState({ sepayApiKey: false, payosApiKey: false, payosChecksumKey: false });
  const [flags, setFlags] = useState({
    hasSepayApiKey: Boolean(paymentConfig?.hasSepayApiKey),
    sepayApiKeyMasked: '',
    hasPayosClientId: Boolean(paymentConfig?.hasPayosClientId),
    hasPayosApiKey: Boolean(paymentConfig?.hasPayosApiKey),
    payosApiKeyMasked: '',
    hasPayosChecksumKey: Boolean(paymentConfig?.hasPayosChecksumKey),
    payosChecksumKeyMasked: '',
    hasPayosFull: Boolean(paymentConfig?.hasPayosFull),
    autoVerifyEnabled: Boolean(paymentConfig?.autoVerifyEnabled)
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingPayos, setTestingPayos] = useState(false);
  const [payosTestResult, setPayosTestResult] = useState(null);
  const [error, setError] = useState('');

  const applyServerConfigToState = c => {
    if (!c) return;
    setDraft(normalizePaymentConfig(c));
    setPayosClientId(String(c.payosClientId || ''));
    setFlags({
      hasSepayApiKey: Boolean(c.hasSepayApiKey),
      sepayApiKeyMasked: String(c.sepayApiKeyMasked || ''),
      hasPayosClientId: Boolean(c.hasPayosClientId),
      hasPayosApiKey: Boolean(c.hasPayosApiKey),
      payosApiKeyMasked: String(c.payosApiKeyMasked || ''),
      hasPayosChecksumKey: Boolean(c.hasPayosChecksumKey),
      payosChecksumKeyMasked: String(c.payosChecksumKeyMasked || ''),
      hasPayosFull: Boolean(c.hasPayosFull),
      autoVerifyEnabled: Boolean(c.autoVerifyEnabled)
    });
    setSecretsForm({ sepayApiKey: '', payosApiKey: '', payosChecksumKey: '' });
    setClearSecrets({ sepayApiKey: false, payosApiKey: false, payosChecksumKey: false });
    setEditingSecrets({ sepayApiKey: false, payosApiKey: false, payosChecksumKey: false });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setPayosTestResult(null);
    fetch('/api/sync/payment/config', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.ok || !data.config) return;
        applyServerConfigToState(data.config);
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

  const persistConfigToServer = async () => {
    const normalized = normalizePaymentConfig(draft);
    const res = await fetch('/api/sync/payment/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentConfig: normalized,
        sepayApiKey: secretsForm.sepayApiKey.trim(),
        payosClientId: payosClientId.trim(),
        payosApiKey: secretsForm.payosApiKey.trim(),
        payosChecksumKey: secretsForm.payosChecksumKey.trim(),
        clearSepayApiKey: clearSecrets.sepayApiKey && !secretsForm.sepayApiKey.trim(),
        clearPayosClientId: !payosClientId.trim() && flags.hasPayosClientId,
        clearPayosApiKey: clearSecrets.payosApiKey && !secretsForm.payosApiKey.trim(),
        clearPayosChecksumKey: clearSecrets.payosChecksumKey && !secretsForm.payosChecksumKey.trim()
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data?.error || 'Không thể lưu cấu hình thanh toán.');
    }
    applyServerConfigToState(data.config);
    onSaved?.(data.config);
    return data.config;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving || testingPayos) return;
    setError('');
    setSaving(true);
    try {
      await persistConfigToServer();
      showToast?.('Đã lưu bảng giá, QR & cấu hình Webhook Quản Trị!');
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Lỗi kết nối tới máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPayosConnection = async () => {
    if (saving || testingPayos) return;
    setError('');
    setPayosTestResult(null);
    setTestingPayos(true);
    try {
      await persistConfigToServer();
      const res = await fetch('/api/sync/payment/test-payos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setPayosTestResult({ ok: false, message: data?.error || 'Kiểm tra PayOS thất bại.' });
      } else {
        setPayosTestResult({ ok: true, message: data?.message || 'Kết nối PayOS & Webhook thành công!' });
        showToast?.('Đã lưu & kích hoạt Webhook PayOS thành công!');
      }
    } catch (err) {
      setPayosTestResult({ ok: false, message: err?.message || 'Không thể kiểm tra kết nối PayOS.' });
    } finally {
      setTestingPayos(false);
    }
  };

  const effectivePayosFull = Boolean(
    payosClientId.trim() &&
    (secretsForm.payosApiKey.trim() || (flags.hasPayosApiKey && !clearSecrets.payosApiKey)) &&
    (secretsForm.payosChecksumKey.trim() || (flags.hasPayosChecksumKey && !clearSecrets.payosChecksumKey))
  );
  const payosPartiallyFilled = Boolean(
    (payosClientId.trim() || secretsForm.payosApiKey.trim() || secretsForm.payosChecksumKey.trim() || flags.hasPayosChecksumKey || flags.hasPayosApiKey) &&
    !effectivePayosFull
  );
  const effectiveAutoVerify = Boolean(
    effectivePayosFull ||
    secretsForm.sepayApiKey.trim() ||
    (flags.hasSepayApiKey && !clearSecrets.sepayApiKey) ||
    (flags.hasPayosChecksumKey && !clearSecrets.payosChecksumKey)
  );

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
              <p className="text-xs text-slate-300">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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

              {/* Editable Prices for 1-Month Memberships & VIP Paid Titles */}
              <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-500/35 space-y-2.5">
                <p className="text-xs font-extrabold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  Bảng Chi Phí Test, Combo Thực Chiến &amp; Gói IELTS VIP
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      📝 Chi Phí 1 Đề Thực Chiến
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.defaultExamPriceVnd ?? DEFAULT_EXAM_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        defaultExamPriceVnd: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      🎓 Mock Test Định Kỳ (3T)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.periodicMockPrice ?? PERIODIC_MOCK_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        periodicMockPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      👑 Gói IELTS VIP (1 Tháng)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.aieoVipPrice ?? AIEO_VIP_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        aieoVipPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      📦 Combo 3 Đề Thực Chiến
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.realExamCombo3Price ?? REAL_EXAM_COMBO_3_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        realExamCombo3Price: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      📦 Combo 5 Đề Thực Chiến
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.realExamCombo5Price ?? REAL_EXAM_COMBO_5_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        realExamCombo5Price: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      📦 Combo 10 Đề Thực Chiến
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.realExamCombo10Price ?? REAL_EXAM_COMBO_10_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        realExamCombo10Price: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      🎫 Vé Tạo 1 Phòng Đấu Riêng
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step={1000}
                      value={draft.friendRoomTicketPrice ?? FRIEND_ROOM_TICKET_PRICE_VND}
                      onChange={e => setDraft(prev => ({
                        ...prev,
                        friendRoomTicketPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                      }))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/35 space-y-2.5">
                <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Bảng Giá Danh Hiệu VIP (VNĐ) - Gói 1 Tháng
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PAID_SHOP_TITLES.map(t => (
                    <div key={t.id}>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5 truncate">
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

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Hoặc tải sẵn ảnh QR Ngân hàng / MoMo (tùy chọn)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90 transition">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh QR Thanh Toán
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadQrFile} />
                  </label>
                  {draft.customQrUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft(prev => ({ ...prev, customQrUrl: '' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Dùng VietQR tự động
                    </button>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" /> Ảnh QR Ủng Hộ (Trang Cá Nhân Admin)
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const rawUrl = await readImageFileAsDataUrl(file);
                          const compactUrl = await compressQrImagePreserveFullFrame(rawUrl);
                          setDraft(prev => ({ ...prev, donateQrUrl: compactUrl }));
                          showToast?.('Đã nạp ảnh QR Ủng Hộ riêng cho trang cá nhân Admin!');
                        } catch (err) {
                          showToast?.(err?.message || 'Không thể đọc ảnh QR.', 'error');
                        }
                      }}
                    />
                  </label>
                  {draft.donateQrUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft(prev => ({ ...prev, donateQrUrl: '' }))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Gỡ QR Ủng Hộ riêng
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Lời nhắn Donate hiển thị trên mã QR (tùy chọn)
                  </label>
                  <input
                    type="text"
                    maxLength={240}
                    placeholder="Donate để ủng hộ Tuấn chi phí duy trì trang web & server..."
                    value={draft.donateMessage || ''}
                    onChange={e => setDraft(prev => ({ ...prev, donateMessage: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Automatic Webhook Verification Section */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/35 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Tự Động Duyệt Quét QR (PayOS / SePay)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    effectiveAutoVerify
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                  }`}>
                    {effectiveAutoVerify ? 'Đang bật Tự Động' : 'Duyệt Tay'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Webhook URL (dán vào my.payos.vn hoặc my.sepay.vn)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(webhookUrl);
                        setCopiedWebhook(true);
                        showToast?.('Đã sao chép Webhook URL!');
                        setTimeout(() => setCopiedWebhook(false), 1800);
                      }}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedWebhook ? 'Đã chép' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* PayOS Card (requires all 3: Client ID + API Key + Checksum Key) */}
                <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-900/70 border border-emerald-200/80 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                      1. Cổng PayOS (dán đủ 3 mã từ Thông tin tích hợp)
                    </span>
                    {effectivePayosFull && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                        ✓ Đủ 3 mã PayOS
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PayOS Client ID
                    </label>
                    <input
                      type="text"
                      value={payosClientId}
                      onChange={e => setPayosClientId(e.target.value)}
                      placeholder="vd: 0afb7d7c-2804-42ba-..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono placeholder:font-sans placeholder:text-slate-400"
                    />
                  </div>

                  <SecretKeySlot
                    label="PayOS Api Key"
                    hasSaved={flags.hasPayosApiKey}
                    maskedHint={flags.payosApiKeyMasked}
                    markedClear={clearSecrets.payosApiKey}
                    isEditing={editingSecrets.payosApiKey}
                    value={secretsForm.payosApiKey}
                    placeholder="Dán Api Key từ my.payos.vn..."
                    showSecret={showSecrets}
                    onToggleShow={() => setShowSecrets(v => !v)}
                    onStartEdit={() => setEditingSecrets(p => ({ ...p, payosApiKey: true }))}
                    onCancelEdit={() => {
                      setEditingSecrets(p => ({ ...p, payosApiKey: false }));
                      setSecretsForm(p => ({ ...p, payosApiKey: '' }));
                    }}
                    onMarkClear={() => setClearSecrets(p => ({ ...p, payosApiKey: true }))}
                    onUndoClear={() => setClearSecrets(p => ({ ...p, payosApiKey: false }))}
                    onChange={v => {
                      setSecretsForm(p => ({ ...p, payosApiKey: v }));
                      if (v.trim()) setClearSecrets(p => ({ ...p, payosApiKey: false }));
                    }}
                  />

                  <SecretKeySlot
                    label="PayOS Checksum Key"
                    hasSaved={flags.hasPayosChecksumKey}
                    maskedHint={flags.payosChecksumKeyMasked}
                    markedClear={clearSecrets.payosChecksumKey}
                    isEditing={editingSecrets.payosChecksumKey}
                    value={secretsForm.payosChecksumKey}
                    placeholder="Dán Checksum Key từ my.payos.vn..."
                    showSecret={showSecrets}
                    onToggleShow={() => setShowSecrets(v => !v)}
                    onStartEdit={() => setEditingSecrets(p => ({ ...p, payosChecksumKey: true }))}
                    onCancelEdit={() => {
                      setEditingSecrets(p => ({ ...p, payosChecksumKey: false }));
                      setSecretsForm(p => ({ ...p, payosChecksumKey: '' }));
                    }}
                    onMarkClear={() => setClearSecrets(p => ({ ...p, payosChecksumKey: true }))}
                    onUndoClear={() => setClearSecrets(p => ({ ...p, payosChecksumKey: false }))}
                    onChange={v => {
                      setSecretsForm(p => ({ ...p, payosChecksumKey: v }));
                      if (v.trim()) setClearSecrets(p => ({ ...p, payosChecksumKey: false }));
                    }}
                  />

                  {payosPartiallyFilled && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        PayOS cần <b>đủ cả 3 mã</b> (Client ID + Api Key + Checksum Key) để web tạo QR động &amp; PayOS tự bắn Webhook khi học viên quét!
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      disabled={saving || testingPayos || !effectivePayosFull}
                      onClick={handleTestPayosConnection}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingPayos ? 'animate-spin' : ''}`} />
                      {testingPayos ? 'Đang lưu & kiểm tra...' : 'Lưu & Kích hoạt Webhook PayOS'}
                    </button>
                    {payosTestResult && (
                      <span className={`text-xs font-bold ${payosTestResult.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                        {payosTestResult.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* SePay Card */}
                <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <SecretKeySlot
                    label="2. Hoặc SePay API Key"
                    subtitle="(tùy chọn • miễn phí 50 GD/tháng)"
                    hasSaved={flags.hasSepayApiKey}
                    maskedHint={flags.sepayApiKeyMasked}
                    markedClear={clearSecrets.sepayApiKey}
                    isEditing={editingSecrets.sepayApiKey}
                    value={secretsForm.sepayApiKey}
                    placeholder="Dán API Key từ SePay (chọn chứng thực API Key)..."
                    showSecret={showSecrets}
                    onToggleShow={() => setShowSecrets(v => !v)}
                    onStartEdit={() => setEditingSecrets(p => ({ ...p, sepayApiKey: true }))}
                    onCancelEdit={() => {
                      setEditingSecrets(p => ({ ...p, sepayApiKey: false }));
                      setSecretsForm(p => ({ ...p, sepayApiKey: '' }));
                    }}
                    onMarkClear={() => setClearSecrets(p => ({ ...p, sepayApiKey: true }))}
                    onUndoClear={() => setClearSecrets(p => ({ ...p, sepayApiKey: false }))}
                    onChange={v => {
                      setSecretsForm(p => ({ ...p, sepayApiKey: v }));
                      if (v.trim()) setClearSecrets(p => ({ ...p, sepayApiKey: false }));
                    }}
                  />
                </div>

                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed flex items-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Khi chưa nhập khóa, học viên vẫn quét được QR và liên hệ SĐT/Zalo Quản trị {ADMIN_PAYMENT_CONTACT.phoneRaw} để duyệt nhanh.</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                Xem trước popup thanh toán học viên thấy
              </p>
              <CoverUnlockQrCard
                username="hocsinh_01"
                orderCode="MKN8F2A9C"
                paymentConfig={{
                  ...draft,
                  autoVerifyEnabled: effectiveAutoVerify
                }}
                isPreview={true}
                showToast={showToast}
              />
              {effectiveAutoVerify && (
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 px-1">
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
