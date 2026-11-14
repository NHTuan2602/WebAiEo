import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  Gamepad2,
  GraduationCap,
  Headphones,
  MonitorCheck,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun
} from 'lucide-react';

export default function AuthScreen({
  authError,
  authForm,
  authMode,
  darkMode,
  handleAuthSubmit,
  setAuthError,
  setAuthForm,
  setAuthMode,
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020618] text-[#0F172B] dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Sticky Minimal LexiPrep Public Header */}
      <header className="bg-white/95 dark:bg-[#0F172B]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#007A7A] flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#0F172B] dark:text-white">
                  LexiPrep
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30">
                  IELTS Online
                </span>
              </div>
              <p className="text-[11px] text-[#62748E] dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                Nền tảng Thi Thử & Khảo Thí IELTS trên Máy Tính
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
              <span>Hệ thống Thi Thử IELTS Online & Quản lý Lớp học</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0F172B] dark:text-white leading-[1.18]">
                Luyện &amp; Thi Thử{' '}
                <span className="lexi-underlined text-[#007A7A] dark:text-[#1EE1D6]">
                  IELTS Online
                </span>{' '}
                Chuẩn Quốc Tế
              </h1>

              <p className="text-sm sm:text-base text-[#314158] dark:text-slate-300 leading-relaxed max-w-2xl">
                Trải nghiệm phòng thi <strong>Computer-Delivered IELTS</strong> thực tế với giao diện chia đôi màn hình, công cụ Highlight trực tiếp, chấm điểm tức thì và lộ trình theo dõi tiến độ từ giáo viên.
              </p>
            </div>

            {/* LexiPrep Horizontal Checkmark Strip */}
            <div className="flex flex-wrap gap-2.5">
              {highlights.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172B] dark:text-slate-200 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059271] shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            {/* 3 Clean Capability Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="lexi-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center mb-3 border border-[#B5F5F1] dark:border-teal-500/30">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">Full 3 Kỹ Năng</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Listening đa file audio, Reading chia đôi Passage và Writing đếm từ tự động.
                </p>
              </div>

              <div className="lexi-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1447E6] dark:text-blue-300 flex items-center justify-center mb-3 border border-[#DBEAFE] dark:border-blue-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">AI &amp; Giáo Viên Chấm</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Chấm Listening/Reading tự động, phân tích 4 tiêu chí Writing &amp; lưu tiến trình F5.
                </p>
              </div>

              <div className="lexi-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-[#F25220] dark:text-orange-300 flex items-center justify-center mb-3 border border-orange-200/80 dark:border-orange-500/30">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172B] dark:text-white">Đấu Trường Từ Vựng</h3>
                <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1 leading-relaxed">
                  Tham gia phòng thi đấu từ vựng theo mã PIN lớp học trực tiếp cùng bạn bè.
                </p>
              </div>
            </div>
          </div>

          {/* Right Auth Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl shadow-[0_20px_50px_-15px_rgba(15,23,43,0.14)] dark:shadow-black/50 border border-slate-200/90 dark:border-slate-800 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#007A7A] via-[#00B2AD] to-[#059271]" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">
                      {authMode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                    </h2>
                    <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1">
                      {authMode === 'login'
                        ? 'Truy cập kho đề thi IELTS và lịch sử học tập.'
                        : 'Đăng ký nhanh để bắt đầu làm bài thi thử.'}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#059271] dark:text-emerald-300 bg-[#ECFDF5] dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-[#9FF5E1] dark:border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật
                  </span>
                </div>

                {/* Auth Mode Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs font-bold mb-5 border border-slate-200/70 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className={`py-2.5 rounded-lg transition ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-sm'
                        : 'text-[#62748E] dark:text-slate-400 hover:text-[#0F172B] dark:hover:text-slate-200'
                    }`}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className={`py-2.5 rounded-lg transition ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-sm'
                        : 'text-[#62748E] dark:text-slate-400 hover:text-[#0F172B] dark:hover:text-slate-200'
                    }`}
                  >
                    Đăng Ký Mới
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-[#E7000B] dark:text-rose-300 mb-4 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-[#314158] dark:text-slate-300 mb-1.5">Họ và tên</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Minh Anh"
                        value={authForm.fullName}
                        onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-[#0F172B] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#007A7A] focus:border-[#007A7A] focus:outline-none transition"
                      />
                    </div>
                  )}

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
                    <span>{authMode === 'login' ? 'Bắt Đầu Vào Phòng Thi' : 'Tạo Tài Khoản Học Viên'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Demo Logins */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#62748E] dark:text-slate-400 mb-2.5">
                    Dùng thử nhanh
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthForm({ username: 'hocsinh_01', password: '123456', fullName: '' });
                      }}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 border border-slate-200 dark:border-slate-700 hover:border-[#B5F5F1] rounded-xl transition text-left"
                    >
                      <span className="block text-xs font-bold text-[#0F172B] dark:text-slate-100">Học viên mẫu</span>
                      <span className="font-mono text-[10px] text-[#62748E] dark:text-slate-400">hocsinh_01 / 123456</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthForm({ username: 'teacher_ielts', password: '123456', fullName: '' });
                      }}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-orange-500/15 border border-slate-200 dark:border-slate-700 hover:border-orange-200 rounded-xl transition text-left"
                    >
                      <span className="block text-xs font-bold text-[#0F172B] dark:text-slate-100">Giáo viên</span>
                      <span className="font-mono text-[10px] text-[#62748E] dark:text-slate-400">teacher_ielts / 123456</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Deep Navy LexiPrep Footer Strip */}
      <footer className="bg-[#0F172B] text-slate-300 border-t border-slate-800 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#007A7A] text-white flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-white">LexiPrep Academy</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Computer-Delivered IELTS Test Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Listening • Reading • Writing</span>
            <span>© 2026 LexiPrep Academy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
