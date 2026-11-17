import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Eye, EyeOff, Loader2, Mail, Save, Send, X } from 'lucide-react';

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    MailApp.sendEmail({
      to: d.to,
      subject: d.subject,
      htmlBody: d.html || d.text,
      name: d.fromName || 'IELTS Nha Trang'
    });
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function MailConfigModal({
  isOpen,
  initialProvider = null,
  onClose,
  onConfiguredChange,
  showToast
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [error, setError] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [form, setForm] = useState({
    provider: initialProvider || 'apps_script',
    fromEmail: '',
    fromName: 'IELTS Nha Trang — Ms. Như',
    resendApiKey: '',
    brevoApiKey: '',
    appsScriptUrl: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPass: ''
  });
  const [flags, setFlags] = useState({
    configured: false,
    hasResendKey: false,
    hasBrevoKey: false,
    hasAppsScriptUrl: false,
    hasSmtpPass: false
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    fetch('/api/sync/mail/config', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setLoading(false);
        if (!data?.ok || !data.config) return;
        const c = data.config;
        setError('');
        setFlags({
          configured: Boolean(c.configured),
          hasResendKey: Boolean(c.hasResendKey),
          hasBrevoKey: Boolean(c.hasBrevoKey),
          hasAppsScriptUrl: Boolean(c.hasAppsScriptUrl),
          hasSmtpPass: Boolean(c.hasSmtpPass)
        });
        setForm(prev => ({
          ...prev,
          provider: c.provider && c.provider !== 'none' ? c.provider : (initialProvider || 'apps_script'),
          fromEmail: c.fromEmail || '',
          fromName: c.fromName || 'IELTS Nha Trang — Ms. Như',
          smtpHost: c.smtpHost || 'smtp.gmail.com',
          smtpPort: Number(c.smtpPort) || 465,
          smtpSecure: c.smtpSecure !== false,
          smtpUser: c.smtpUser || '',
          resendApiKey: '',
          brevoApiKey: '',
          appsScriptUrl: '',
          smtpPass: ''
        }));
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialProvider]);

  if (!isOpen) return null;

  const handleSave = async e => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/sync/mail/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Không thể lưu cấu hình Email.');
        return;
      }
      const c = data.config || {};
      setFlags({
        configured: Boolean(c.configured),
        hasResendKey: Boolean(c.hasResendKey),
        hasBrevoKey: Boolean(c.hasBrevoKey),
        hasAppsScriptUrl: Boolean(c.hasAppsScriptUrl),
        hasSmtpPass: Boolean(c.hasSmtpPass)
      });
      onConfiguredChange?.(Boolean(c.configured));
      showToast?.(c.configured ? 'Đã lưu cấu hình Email gửi mã OTP thành công!' : 'Đã lưu cấu hình (hiện chưa đủ thông tin kích hoạt).');
    } catch {
      setError('Lỗi kết nối tới máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (testing || !testRecipient.trim()) return;
    setError('');
    setTesting(true);
    try {
      const res = await fetch('/api/sync/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testRecipient.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data?.error || 'Gửi mail thử thất bại.');
        return;
      }
      showToast?.(`Đã gửi email thử nghiệm tới ${testRecipient.trim()}!`);
    } catch {
      setError('Lỗi kết nối khi gửi email thử.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mail-config-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-[#1EE1D6]" />
            <div>
              <h3 id="mail-config-title" className="text-sm sm:text-base font-extrabold">
                Cấu Hình Dịch Vụ Gửi Email OTP
              </h3>
              <p className="text-[11px] text-slate-300">
                Dùng Gmail (HTTPS Apps Script), Brevo / Resend API hoặc Gmail SMTP để gửi mã xác minh cho học viên.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-8 flex justify-center text-slate-500 text-xs gap-2 items-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình...
            </div>
          ) : (
            <>
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                flags.configured
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
              }`}>
                {flags.configured ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{flags.configured ? 'Hệ thống gửi Email OTP đang sẵn sàng.' : 'Chưa kích hoạt gửi Email OTP — Hãy điền cấu hình bên dưới.'}</span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nhà cung cấp gửi Email</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'apps_script', label: 'Gmail (HTTPS)' },
                    { id: 'brevo', label: 'Brevo API' },
                    { id: 'resend', label: 'Resend API' },
                    { id: 'smtp', label: 'Gmail / SMTP' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, provider: opt.id }))}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition ${
                        form.provider === opt.id
                          ? 'bg-[#007A7A] text-white border-[#007A7A]'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị người gửi</label>
                  <input
                    type="text"
                    value={form.fromName}
                    onChange={e => setForm(prev => ({ ...prev, fromName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email gửi (From)</label>
                  <input
                    type="email"
                    value={form.fromEmail}
                    onChange={e => setForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="vd: center@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {form.provider === 'apps_script' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/35">
                  <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">
                    <p className="font-extrabold text-emerald-800 dark:text-emerald-300">
                      ✓ Chạy ổn định 100% trên Railway miễn phí &amp; gửi trực tiếp bằng wuyan2511@gmail.com
                    </p>
                    <p>
                      1. Đăng nhập Gmail <b>wuyan2511@gmail.com</b> và mở{' '}
                      <a
                        href="https://script.google.com/home/start"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#007A7A] dark:text-[#1EE1D6] underline"
                      >
                        script.google.com
                      </a>{' '}
                      → bấm <b>Dự án mới (New project)</b>.
                    </p>
                    <p>2. Xóa hết code mẫu, dán đoạn code bên dưới → bấm <b>Deploy → New deployment → Web app</b> (<b>Execute as: Me</b>, <b>Who has access: Anyone</b>).</p>
                    <p>3. Copy link <b>Web app URL</b> (dạng <code className="font-mono text-[10px]">https://script.google.com/macros/s/.../exec</code>) dán vào ô dưới đây:</p>
                  </div>

                  <div className="relative">
                    <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto leading-relaxed">
                      {APPS_SCRIPT_CODE}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(APPS_SCRIPT_CODE);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 1800);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold inline-flex items-center gap-1"
                    >
                      {copiedScript ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      {copiedScript ? 'Đã chép' : 'Copy Code'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Google Apps Script Web App URL {flags.hasAppsScriptUrl ? '(Đã lưu — để trống nếu giữ nguyên)' : '*'}
                    </label>
                    <input
                      type="url"
                      value={form.appsScriptUrl}
                      onChange={e => setForm(prev => ({ ...prev, appsScriptUrl: e.target.value }))}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {form.provider === 'resend' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resend API Key {flags.hasResendKey ? '(Đã lưu — để trống nếu giữ nguyên)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={form.resendApiKey}
                    onChange={e => setForm(prev => ({ ...prev, resendApiKey: e.target.value }))}
                    placeholder="re_..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              {form.provider === 'brevo' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brevo API Key {flags.hasBrevoKey ? '(Đã lưu — để trống nếu giữ nguyên)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={form.brevoApiKey}
                    onChange={e => setForm(prev => ({ ...prev, brevoApiKey: e.target.value }))}
                    placeholder="xkeysib-..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              {form.provider === 'smtp' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/35 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                    <b>Lưu ý Railway:</b> Gói Free/Trial/Hobby của Railway <b>chặn kết nối SMTP cổng 465 &amp; 587</b> nên bấm Gửi thử trên web sẽ báo lỗi. Hãy dùng tab <b>Gmail (HTTPS)</b> hoặc <b>Brevo API</b> ở trên để gửi qua cổng 443.
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Cài đặt Gmail gửi mã xác minh OTP
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          provider: 'smtp',
                          smtpHost: 'smtp.gmail.com',
                          smtpPort: 465,
                          smtpSecure: true,
                          smtpUser: 'wuyan2511@gmail.com',
                          fromEmail: prev.fromEmail || 'wuyan2511@gmail.com'
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/35 text-[11px] font-extrabold transition"
                    >
                      Điền nhanh wuyan2511@gmail.com
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={form.smtpHost}
                        onChange={e => setForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Port</label>
                      <input
                        type="number"
                        value={form.smtpPort}
                        onChange={e => {
                          const nextPort = Number(e.target.value) || 465;
                          setForm(prev => ({ ...prev, smtpPort: nextPort, smtpSecure: nextPort === 465 }));
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tài khoản Gmail / SMTP User</label>
                    <input
                      type="text"
                      value={form.smtpUser}
                      onChange={e => setForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                      placeholder="vd: emailcuaban@gmail.com"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mật khẩu ứng dụng (App Password) {flags.hasSmtpPass ? '(Đã lưu — để trống nếu giữ nguyên)' : ''}
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        value={form.smtpPass}
                        onChange={e => setForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                        placeholder="16 ký tự App Password..."
                        className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(s => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                        aria-label="Hiện hoặc ẩn App Password"
                      >
                        {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Dùng <b>App Password 16 ký tự</b> (không dùng mật khẩu Gmail thường) tại{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-[#007A7A] dark:text-[#1EE1D6] underline hover:opacity-80"
                      >
                        myaccount.google.com/apppasswords
                      </a>{' '}
                      (tự bỏ khoảng trắng; nếu Port 465 lỗi hãy thử Port 587).
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Gửi thư kiểm tra nhanh (sau khi Lưu)</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={e => setTestRecipient(e.target.value)}
                    placeholder="Email nhận thử nghiệm..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testing || !testRecipient.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Gửi thử
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[1.5] py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Email'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
