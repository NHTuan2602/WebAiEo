import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Globe,
  Headphones,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MonitorCheck,
  Moon,
  Phone,
  Send,
  ShieldCheck,
  Sun,
  UserCheck,
  X
} from 'lucide-react';
import BrandContactFooter from '../components/common/BrandContactFooter';
import { BRAND_INFO } from '../constants/brandInfo';

export default function AuthScreen({
  authError,
  authForm,
  darkMode,
  handleAuthSubmit,
  onPasswordRecovered,
  onRemoveRememberedLogin,
  onSelectRememberedLogin,
  rememberPassword = false,
  rememberedLogins = [],
  setAuthError,
  setAuthForm,
  setDarkMode,
  setRememberPassword,
  setShowAuthPass,
  showAuthPass,
  showToast
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'forgot'
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotStep, setForgotStep] = useState('username'); // 'username' | 'otp' | 'unlinked' | 'not_found'
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);

  useEffect(() => {
    if (forgotCooldown <= 0) return undefined;
    const t = setInterval(() => {
      setForgotCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [forgotCooldown]);

  const openForgotPasswordMode = () => {
    setAuthMode('forgot');
    setForgotUsername((authForm.username || '').trim());
    setForgotStep('username');
    setForgotMaskedEmail('');
    setForgotOtp('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotError('');
    setForgotNotice('');
    setAuthError?.('');
  };

  const handleRequestForgotOtp = async (e) => {
    e?.preventDefault();
    if (forgotLoading) return;
    const clean = String(forgotUsername || '').trim().replace(/^@+/, '');
    if (!clean) {
      setForgotError('Vui lòng nhập tên tài khoản (@username).');
      return;
    }
    setForgotError('');
    setForgotNotice('');
    setForgotLoading(true);
    try {
      const res = await fetch('/api/sync/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.mailError) {
          setForgotStep('unlinked');
          setForgotNotice(data.error || 'Chưa gửi được OTP qua email. Vui lòng liên hệ Giáo viên.');
          return;
        }
        setForgotError(data?.error || 'Không thể gửi yêu cầu khôi phục mật khẩu.');
        return;
      }
      if (!data.accountFound) {
        setForgotStep('not_found');
        setForgotNotice(data.message || 'Không tìm thấy tên tài khoản này.');
        return;
      }
      if (!data.hasVerifiedEmail) {
        setForgotStep('unlinked');
        setForgotNotice(data.message || 'Tài khoản này chưa liên kết email xác minh.');
        return;
      }
      setForgotStep('otp');
      setForgotMaskedEmail(data.maskedEmail || '');
      setForgotCooldown(Number(data.cooldownSeconds) || 60);
      setForgotNotice(data.message || `Mã OTP đã được gửi về email đã xác minh (${data.maskedEmail}).`);
    } catch {
      setForgotError('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmForgotReset = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotError('');
    const cleanUser = String(forgotUsername || '').trim().replace(/^@+/, '');
    const cleanOtp = String(forgotOtp || '').trim();
    const cleanPass = String(forgotNewPass || '').trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setForgotError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (cleanPass.length < 4) {
      setForgotError('Mật khẩu mới phải dài ít nhất 4 ký tự.');
      return;
    }
    if (cleanPass !== forgotConfirmPass.trim()) {
      setForgotError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/sync/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, otp: cleanOtp, newPassword: cleanPass })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setForgotError(data?.error || 'Không thể đặt lại mật khẩu.');
        return;
      }
      onPasswordRecovered?.(data.username || cleanUser, cleanPass);
      setAuthForm(prev => ({ ...prev, username: data.username || cleanUser, password: cleanPass }));
      setAuthError?.('');
      setAuthMode('login');
      showToast?.('Đặt lại mật khẩu thành công! Bạn có thể bấm Đăng Nhập ngay.');
    } catch {
      setForgotError('Lỗi kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setForgotLoading(false);
    }
  };
  const highlights = [
    'Giao diện thi máy chuẩn IDP/BC',
    'Listening & Reading đa chủ đề',
    'Highlight & Notes trực tiếp',
    'Có đáp án giải thích',
    'Nhận Band điểm tức thì'
  ];

  return (
    <div className="min-h-screen bg-[#FDECF2] dark:bg-[#020618] text-[#0F172B] dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Sticky Minimal Branded Public Header */}
      <header className="bg-[#FDF2F6]/95 dark:bg-[#0F172B]/95 backdrop-blur-md border-b border-pink-200/90 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_INFO.avatarUrl}
              alt={BRAND_INFO.shortName}
              className="w-10 h-10 rounded-full object-cover border-2 border-pink-300 shadow-sm bg-white shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#0F172B] dark:text-white">
                  {BRAND_INFO.siteName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 hidden sm:inline">
                  {BRAND_INFO.englishSubName}
                </span>
              </div>
              <p className="text-[11px] text-[#62748E] dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                {BRAND_INFO.established} • SĐT/Zalo: {BRAND_INFO.phoneDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={BRAND_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6] bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 px-3 py-1.5 rounded-full hover:bg-[#B5F5F1]/60 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Fanpage {BRAND_INFO.teacherName}
            </a>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#059271] dark:text-emerald-300 bg-[#ECFDF5] dark:bg-emerald-500/15 border border-[#9FF5E1] dark:border-emerald-500/30 px-3 py-1.5 rounded-full">
              <MonitorCheck className="w-3.5 h-3.5" /> Chuẩn Cambridge / IDP
            </span>
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-[#314158] dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-[#EDFFFD] hover:text-[#007A7A] dark:hover:bg-slate-700 transition"
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#007A7A]" />}
              <span>{darkMode ? 'Sáng' : 'Tối'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main LexiPrep Hero + Auth Section */}
      <main className="lexi-hero-surface flex-1 py-10 sm:py-14 px-4 sm:px-6 flex items-center">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Showcase Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
              <Award className="w-4 h-4" />
              <span>{BRAND_INFO.siteName} • Giáo viên {BRAND_INFO.teacherName}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172B] dark:text-white leading-[1.18]">
                Luyện &amp; Thi Thử{' '}
                <span className="lexi-underlined text-[#007A7A] dark:text-[#1EE1D6]">
                  IELTS Nha Trang
                </span>{' '}
                Cùng {BRAND_INFO.teacherName}
              </h1>

              <p className="text-sm sm:text-base text-[#314158] dark:text-slate-300 leading-relaxed max-w-2xl">
                Phòng thi <strong>Computer-Delivered IELTS</strong> dành riêng cho học viên lớp <strong>{BRAND_INFO.englishSubName}</strong> — chấm điểm tức thì, theo dõi tiến độ sát sao và &ldquo;{BRAND_INFO.slogan}&rdquo;.
              </p>
            </div>

            {/* LexiPrep Horizontal Checkmark Strip */}
            <div className="flex flex-wrap gap-2.5">
              {highlights.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF5F8] dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 text-[#0F172B] dark:text-slate-200 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059271] shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            {/* 3 Clean Capability Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="lexi-card bg-[#FFF5F8] dark:bg-slate-900/90 rounded-2xl p-4 border border-rose-200/80 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center mb-3 border border-[#B5F5F1] dark:border-teal-500/30">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">Full 3 Kỹ Năng</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Listening đa file audio, Reading chia đôi Passage và Writing đếm từ tự động.
                </p>
              </div>

              <div className="lexi-card bg-[#FFF5F8] dark:bg-slate-900/90 rounded-2xl p-4 border border-rose-200/80 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1447E6] dark:text-blue-300 flex items-center justify-center mb-3 border border-[#DBEAFE] dark:border-blue-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">Giáo Viên Chấm &amp; Chữa Bài</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Chấm Listening/Reading tự động, Giáo viên nhận xét chi tiết bài Writing &amp; lưu tiến trình F5.
                </p>
              </div>

              <div className="lexi-card bg-[#FFF5F8] dark:bg-slate-900/90 rounded-2xl p-4 border border-rose-200/80 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-[#F25220] dark:text-orange-300 flex items-center justify-center mb-3 border border-orange-200/80 dark:border-orange-500/30">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">Đấu Trường Từ Vựng</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Tham gia phòng thi đấu từ vựng theo mã PIN lớp học trực tiếp cùng bạn bè.
                </p>
              </div>
            </div>

            {/* Contact & Consultation Card for Students / Parents */}
            <div className="bg-[#FFF5F8]/95 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-rose-200/90 dark:border-teal-500/30 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] uppercase tracking-wider">
                  Thông Tin Liên Hệ &amp; Đăng Ký Lớp • {BRAND_INFO.teacherName}
                </span>
                <span className="text-[11px] font-semibold italic text-[#62748E] dark:text-slate-400">
                  &ldquo;{BRAND_INFO.motto}&rdquo;
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <a
                  href={BRAND_INFO.phoneHref}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EDFFFD]/70 dark:bg-teal-500/10 border border-[#B5F5F1]/70 dark:border-teal-500/25 text-[#0F172B] dark:text-slate-100 hover:border-[#007A7A] transition font-bold"
                >
                  <Phone className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                  <span>{BRAND_INFO.phoneDisplay} ({BRAND_INFO.teacherName})</span>
                </a>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[#314158] dark:text-slate-200 font-semibold">
                  <MapPin className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                  <span>{BRAND_INFO.address}</span>
                </div>
                <a
                  href={BRAND_INFO.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/10 border border-[#DBEAFE] dark:border-blue-500/25 text-[#1447E6] dark:text-blue-300 hover:border-blue-400 transition font-bold"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MessageCircle className="w-4 h-4 shrink-0" /> Facebook: {BRAND_INFO.facebookHandle}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
                <a
                  href={BRAND_INFO.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#ECFDF5] dark:bg-emerald-500/10 border border-[#9FF5E1] dark:border-emerald-500/25 text-[#059271] dark:text-emerald-300 hover:border-emerald-500 transition font-bold"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Globe className="w-4 h-4 shrink-0" /> Blogspot Tài Liệu IELTS
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Auth Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl shadow-[0_20px_50px_-15px_rgba(15,23,43,0.14)] dark:shadow-black/50 border border-rose-200/85 dark:border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#007A7A] via-[#00B2AD] to-[#059271]" />
              <div className="p-6 sm:p-8">
                {authMode === 'forgot' ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
                          Quên Mật Khẩu
                        </h2>
                        <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1">
                          Nhập tên tài khoản để nhận mã xác minh OTP gửi về email đã liên kết, hoặc liên hệ Giáo viên nếu chưa xác minh email.
                        </p>
                      </div>
                    </div>

                    {forgotError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-[#E7000B] dark:text-rose-300 font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    {forgotStep === 'username' && (
                      <form onSubmit={handleRequestForgotOtp} className="space-y-3.5">
                        <div>
                          <label htmlFor="forgot-username" className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">
                            Tên tài khoản (@username) *
                          </label>
                          <input
                            id="forgot-username"
                            type="text"
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={forgotUsername}
                            onChange={e => setForgotUsername(e.target.value)}
                            placeholder="Nhập tên tài khoản của bạn..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                        >
                          {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span>{forgotLoading ? 'Đang kiểm tra...' : 'Gửi Mã Xác Minh OTP'}</span>
                        </button>
                      </form>
                    )}

                    {forgotStep === 'otp' && (
                      <form onSubmit={handleConfirmForgotReset} className="space-y-3.5">
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                          <p className="font-extrabold flex items-center gap-1.5">
                            <Mail className="w-4 h-4 shrink-0" />
                            Đã gửi mã OTP tới email đã xác minh!
                          </p>
                          <p className="text-[11px]">
                            Vui lòng kiểm tra hộp thư <b>{forgotMaskedEmail}</b> (kể cả thư rác/Spam) và nhập mã OTP 6 số bên dưới (hiệu lực 10 phút).
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-[#314158] dark:text-slate-300">Mã xác minh OTP (6 chữ số) *</label>
                            <button
                              type="button"
                              disabled={forgotLoading || forgotCooldown > 0}
                              onClick={handleRequestForgotOtp}
                              className="text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline disabled:opacity-50"
                            >
                              {forgotCooldown > 0 ? `Gửi lại sau ${forgotCooldown}s` : 'Gửi lại mã OTP'}
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={forgotOtp}
                            onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Nhập 6 số OTP..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-black tracking-[0.35em] text-center text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1">Mật khẩu mới *</label>
                          <div className="relative">
                            <input
                              type={showForgotPass ? 'text' : 'password'}
                              value={forgotNewPass}
                              onChange={e => setForgotNewPass(e.target.value)}
                              placeholder="Tối thiểu 4 ký tự..."
                              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotPass(v => !v)}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A7A]"
                            >
                              {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1">Nhập lại mật khẩu mới *</label>
                          <input
                            type={showForgotPass ? 'text' : 'password'}
                            value={forgotConfirmPass}
                            onChange={e => setForgotConfirmPass(e.target.value)}
                            placeholder="Xác nhận mật khẩu mới..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                        >
                          {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>{forgotLoading ? 'Đang xử lý...' : 'Xác Minh OTP & Đổi Mật Khẩu'}</span>
                        </button>
                      </form>
                    )}

                    {(forgotStep === 'unlinked' || forgotStep === 'not_found') && (
                      <div className="space-y-3.5">
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                          <p className="font-extrabold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            {forgotStep === 'not_found'
                              ? 'Không tìm thấy tài khoản trên hệ thống'
                              : 'Chưa thể tự khôi phục qua Email OTP'}
                          </p>
                          <p className="leading-relaxed">
                            {forgotNotice || 'Tài khoản này chưa liên kết hoặc chưa xác minh email khôi phục.'}
                          </p>
                          <p className="font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                            👉 Hãy liên hệ Giáo viên ({BRAND_INFO.teacherName}) để được đặt lại về mật khẩu mặc định (<code className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900 font-mono">123456</code>).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <a
                            href={BRAND_INFO.phoneHref}
                            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 text-[#007A7A] dark:text-[#1EE1D6] font-extrabold hover:opacity-90 transition"
                          >
                            <Phone className="w-4 h-4" /> Gọi / Zalo: {BRAND_INFO.phoneDisplay}
                          </a>
                          <a
                            href={BRAND_INFO.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 border border-[#DBEAFE] dark:border-blue-500/30 text-[#1447E6] dark:text-blue-300 font-extrabold hover:opacity-90 transition"
                          >
                            <MessageCircle className="w-4 h-4" /> Nhắn Facebook Ms. Như
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep('username');
                            setForgotError('');
                            setForgotNotice('');
                          }}
                          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          Thử lại tên tài khoản khác
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setForgotError('');
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#314158] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Đăng nhập
                    </button>
                  </div>
                ) : (
                  <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">
                      Đăng nhập tài khoản
                    </h2>
                    <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1">
                      Truy cập hệ thống bằng tài khoản do Giáo viên tạo và cấp.
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#059271] dark:text-emerald-300 bg-[#ECFDF5] dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-[#9FF5E1] dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật
                  </span>
                </div>

                {/* Teacher-Managed Accounts Notice */}
                <div className="mb-5 p-3 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/10 border border-[#B5F5F1] dark:border-teal-500/30 flex items-start gap-2.5 text-xs text-[#065B5B] dark:text-teal-200">
                  <ShieldCheck className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Chỉ Giáo viên mới có quyền tạo tài khoản</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Đăng ký tự do đã được khóa. Học viên vui lòng nhận tên đăng nhập và mật khẩu từ Giáo viên, hoặc đăng nhập Giáo viên để quản lý tài khoản.
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-[#E7000B] dark:text-rose-300 mb-4 space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                    <p className="text-[11px] text-rose-700/90 dark:text-rose-200/80 pl-6 leading-relaxed">
                      Kiểm tra lại Caps Lock, tắt gõ dấu tiếng Việt ở ô username (không cần nhập dấu @) và đảm bảo dùng đúng mật khẩu hiện tại trên hệ thống.
                    </p>
                  </div>
                )}

                {rememberedLogins.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/65 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <p className="text-[11px] font-bold text-[#314158] dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
                      Tài khoản đã nhớ trên máy này (bấm để điền nhanh):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {rememberedLogins.map(item => {
                        const isSelected = authForm.username?.trim().toLowerCase() === item.username.toLowerCase();
                        return (
                          <div
                            key={item.username}
                            className={`inline-flex items-center gap-1 rounded-lg border text-[11px] font-bold transition ${
                              isSelected
                                ? 'bg-[#EDFFFD] dark:bg-teal-500/20 border-[#007A7A] dark:border-[#1EE1D6] text-[#007A7A] dark:text-[#1EE1D6]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onSelectRememberedLogin?.(item)}
                              className="px-2.5 py-1 flex items-center gap-1.5 hover:opacity-80"
                            >
                              <span className="truncate max-w-[120px]">{item.name || item.username}</span>
                              <span className="font-mono opacity-75">@{item.username}</span>
                            </button>
                            {onRemoveRememberedLogin && (
                              <button
                                type="button"
                                onClick={() => onRemoveRememberedLogin(item.username)}
                                className="pr-1.5 pl-0.5 py-1 text-slate-400 hover:text-rose-600 transition"
                                title={`Quên mật khẩu đã lưu của ${item.username}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} autoComplete="on" className="space-y-4">
                  <div>
                    <label htmlFor="login-username" className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">Tên đăng nhập</label>
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Nhập username..."
                      value={authForm.username}
                      onChange={e => {
                        if (authError) setAuthError?.('');
                        setAuthForm({ ...authForm, username: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#007A7A] focus:border-[#007A7A] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <input
                        id="login-password"
                        name="password"
                        type={showAuthPass ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Nhập mật khẩu..."
                        value={authForm.password}
                        onChange={e => {
                          if (authError) setAuthError?.('');
                          setAuthForm({ ...authForm, password: e.target.value });
                        }}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#007A7A] focus:border-[#007A7A] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A7A] dark:hover:text-[#1EE1D6]"
                        tabIndex={-1}
                        aria-label={showAuthPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showAuthPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {setRememberPassword && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#314158] dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(rememberPassword)}
                          onChange={e => setRememberPassword(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#007A7A]"
                        />
                        <span>Nhớ tài khoản &amp; mật khẩu</span>
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={openForgotPasswordMode}
                      className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] hover:underline ml-auto"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold py-3 rounded-xl transition shadow-md shadow-teal-900/15 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    <span>Đăng Nhập Hệ Thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                  <p className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-[#62748E] dark:text-slate-400 text-center">
                    Tài khoản Giáo viên và Học viên được tạo &amp; cấp nội bộ bởi trung tâm.
                  </p>
                </>
                )}
                </div>
              </div>
            </div>
          </div>
        </main>

      {/* Deep Navy Branded Footer Strip with Contact Info */}
      <footer className="bg-[#0F172B] text-slate-300 border-t border-slate-800 px-4 sm:px-6 py-8 sm:py-10">
        <BrandContactFooter variant="full" />
      </footer>
    </div>
  );
}
