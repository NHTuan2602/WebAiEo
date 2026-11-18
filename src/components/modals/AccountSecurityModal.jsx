import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  Unlink,
  X
} from 'lucide-react';

export default function AccountSecurityModal({
  isOpen,
  initialTab = 'password',
  currentUser,
  mailConfigured = true,
  onClose,
  onOpenMailConfig = null,
  onUserUpdated,
  onPasswordChanged,
  showToast
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'password');

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');

  // Email OTP Verification State
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError, setMailError] = useState('');
  const [unlinkMode, setUnlinkMode] = useState(false);
  const [unlinkPass, setUnlinkPass] = useState('');

  useEffect(() => {
    if (!isOpen || cooldownSec <= 0) return undefined;
    const t = setInterval(() => {
      setCooldownSec(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, cooldownSec]);

  if (!isOpen || !currentUser) return null;

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (passLoading) return;
    setPassError('');

    if (!oldPassword.trim() || !newPassword.trim()) {
      setPassError('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPassError('Mật khẩu mới phải dài ít nhất 4 ký tự.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPassError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (newPassword.trim() === oldPassword.trim()) {
      setPassError('Mật khẩu mới phải khác mật khẩu cũ.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/sync/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPassword.trim(), newPassword: newPassword.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setPassError(data?.error || 'Đổi mật khẩu thất bại.');
        return;
      }
      onPasswordChanged?.(currentUser.username, newPassword.trim(), data.snapshot, data.user);
      showToast?.('Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng ngay.');
      onClose?.();
    } catch {
      setPassError('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleSendEmailOtp = async e => {
    e?.preventDefault();
    if (mailLoading || cooldownSec > 0) return;
    setMailError('');
    const clean = String(emailInput || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setMailError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setMailLoading(true);
    try {
      const res = await fetch('/api/sync/auth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMailError(data?.error || 'Không thể gửi mã xác minh OTP.');
        return;
      }
      setOtpSentTo(clean);
      setOtpCode('');
      setCooldownSec(Number(data.cooldownSeconds) || 60);
      showToast?.(data.message || `Đã gửi mã OTP tới ${data.maskedEmail || clean}!`);
    } catch {
      setMailError('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setMailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async e => {
    e.preventDefault();
    if (mailLoading) return;
    setMailError('');
    const targetEmail = otpSentTo || String(emailInput || '').trim().toLowerCase();
    const cleanOtp = String(otpCode || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setMailError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }

    setMailLoading(true);
    try {
      const res = await fetch('/api/sync/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, otp: cleanOtp })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMailError(data?.error || 'Xác minh OTP thất bại.');
        return;
      }
      setOtpSentTo('');
      setOtpCode('');
      onUserUpdated?.(data.user, data.snapshot);
      showToast?.(data.message || 'Đã xác minh & liên kết email thành công!');
    } catch {
      setMailError('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setMailLoading(false);
    }
  };

  const handleUnlinkEmail = async e => {
    e.preventDefault();
    if (mailLoading) return;
    setMailError('');
    if (!unlinkPass.trim()) {
      setMailError('Vui lòng nhập mật khẩu hiện tại để gỡ liên kết email.');
      return;
    }

    setMailLoading(true);
    try {
      const res = await fetch('/api/sync/auth/email/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: unlinkPass.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMailError(data?.error || 'Không thể gỡ liên kết email.');
        return;
      }
      setUnlinkMode(false);
      setUnlinkPass('');
      setEmailInput('');
      onUserUpdated?.(data.user, data.snapshot);
      showToast?.('Đã gỡ liên kết email khỏi tài khoản.');
    } catch {
      setMailError('Lỗi kết nối tới máy chủ.');
    } finally {
      setMailLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-security-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#007A7A]/30 border border-[#1EE1D6]/40 flex items-center justify-center text-[#1EE1D6] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="account-security-modal-title" className="text-sm sm:text-base font-extrabold truncate">
                Bảo Mật Tài Khoản (@{currentUser.username})
              </h3>
              <p className="text-xs text-slate-300 truncate">
                Đổi mật khẩu &amp; xác minh Email nhận OTP khôi phục
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ bảo mật"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'password'
                  ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Đổi Mật Khẩu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email OTP {currentUser.emailVerified ? '✓' : ''}
            </button>
          </div>

          {activeTab === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {passError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu cũ *
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại..."
                    autoComplete="current-password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A7A]"
                    aria-label="Hiện hoặc ẩn mật khẩu cũ"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 4 ký tự..."
                    autoComplete="new-password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A7A]"
                    aria-label="Hiện hoặc ẩn mật khẩu mới"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhập lại mật khẩu mới *
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu mới..."
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex-[1.5] py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold shadow-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {passLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {currentUser.emailVerified ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Email khôi phục đã xác minh</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnlinkMode(v => !v)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" /> Gỡ email
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
                    {currentUser.email || currentUser.maskedEmail}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Nếu quên mật khẩu, hệ thống sẽ gửi mã OTP về địa chỉ email này.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-extrabold">Chưa liên kết Email khôi phục</p>
                  <p className="text-xs opacity-90">
                    Xác minh email ngay để tự nhận mã OTP lấy lại mật khẩu. Nếu quên mật khẩu khi chưa liên kết email, bạn cần liên hệ Giáo viên để đặt lại mật khẩu mặc định.
                  </p>
                </div>
              )}

              {mailError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{mailError}</span>
                  </div>
                  {(currentUser.role === 'teacher' || currentUser.isSuperAdmin) && onOpenMailConfig && (!mailConfigured || mailError.includes('chưa cấu hình')) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        onOpenMailConfig();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition"
                    >
                      Mở Bảng Cấu Hình Email OTP Ngay →
                    </button>
                  )}
                </div>
              )}
              {!mailError && (currentUser.role === 'teacher' || currentUser.isSuperAdmin) && onOpenMailConfig && !mailConfigured && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                  <span className="font-bold">Máy chủ chưa cấu hình Email OTP.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose?.();
                      onOpenMailConfig();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shrink-0"
                  >
                    Cài đặt ngay
                  </button>
                </div>
              )}

              {unlinkMode && currentUser.emailVerified ? (
                <form onSubmit={handleUnlinkEmail} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Xác nhận gỡ email khôi phục
                  </p>
                  <input
                    type="password"
                    value={unlinkPass}
                    onChange={e => setUnlinkPass(e.target.value)}
                    placeholder="Nhập mật khẩu tài khoản hiện tại..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUnlinkMode(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={mailLoading}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold disabled:opacity-60"
                    >
                      {mailLoading ? 'Đang gỡ...' : 'Xác Nhận Gỡ Email'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <form onSubmit={handleSendEmailOtp} className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {currentUser.emailVerified ? 'Đổi sang Email mới' : 'Nhập Email của bạn'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="vd: tenban@gmail.com"
                        className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={mailLoading || cooldownSec > 0}
                        className="px-3.5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold shrink-0 inline-flex items-center gap-1.5 disabled:opacity-55"
                      >
                        {mailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {cooldownSec > 0 ? `${cooldownSec}s` : otpSentTo ? 'Gửi lại' : 'Gửi OTP'}
                      </button>
                    </div>
                  </form>

                  {otpSentTo && (
                    <form onSubmit={handleVerifyEmailOtp} className="p-3.5 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/35 border border-[#007A7A]/35 space-y-2.5">
                      <p className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                        Mã OTP 6 chữ số đã được gửi tới <b>{otpSentTo}</b> (hiệu lực 10 phút).
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Nhập 6 số OTP..."
                          className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-black tracking-widest text-center text-slate-900 dark:text-white"
                          required
                        />
                        <button
                          type="submit"
                          disabled={mailLoading || otpCode.length !== 6}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
                        >
                          Xác Minh
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
