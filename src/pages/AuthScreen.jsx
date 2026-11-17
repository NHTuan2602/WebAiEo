import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Globe,
  Headphones,
  MapPin,
  MessageCircle,
  MonitorCheck,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun
} from 'lucide-react';
import BrandContactFooter from '../components/common/BrandContactFooter';
import { BRAND_INFO } from '../constants/brandInfo';

export default function AuthScreen({
  authError,
  authForm,
  darkMode,
  handleAuthSubmit,
  setAuthError,
  setAuthForm,
  setDarkMode,
  setShowAuthPass,
  showAuthPass
}) {
  const highlights = [
    'Luyện với AI chấm Writing',
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
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">AI &amp; Giáo Viên Chấm</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Chấm Listening/Reading tự động, phân tích 4 tiêu chí Writing &amp; lưu tiến trình F5.
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
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-[#E7000B] dark:text-rose-300 mb-4 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">Tên đăng nhập</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập username..."
                      value={authForm.username}
                      onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#007A7A] focus:border-[#007A7A] focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showAuthPass ? 'text' : 'password'}
                        required
                        placeholder="Nhập mật khẩu..."
                        value={authForm.password}
                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#007A7A] focus:border-[#007A7A] focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007A7A] dark:hover:text-[#1EE1D6]"
                        tabIndex={-1}
                      >
                        {showAuthPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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
