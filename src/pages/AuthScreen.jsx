import {
  AlertTriangle,
  ArrowRight,
  Award,
  Eye,
  EyeOff,
  Gamepad2,
  GraduationCap,
  Headphones,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp
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
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 select-none transition-colors">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">LexiPrep Academy</span>
        </div>
        <button
          type="button"
          onClick={() => setDarkMode(d => !d)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          <span>{darkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
        </button>
      </div>

      {/* Main Centered Split Card */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Educational Intro */}
          <div className="lg:col-span-6 bg-slate-900 dark:bg-slate-950 text-white p-8 sm:p-11 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-6">
                <Award className="w-3.5 h-3.5" /> Hệ thống Khảo thí IELTS trên Máy tính
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-4">
                Luyện thi chuẩn quốc tế, theo dõi lộ trình tăng Band mỗi ngày.
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Môi trường làm bài thi thử tách đôi màn hình mượt mà như phòng thi thật, kèm kho từ vựng tương tác theo lớp học.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Thi thử Listening, Reading & Writing</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Highlight trực tiếp trên đoạn văn, giới hạn lượt nghe và bộ đếm từ tự động.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Biểu đồ tiến trình & nhận xét chi tiết</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Lưu lịch sử làm bài theo từng kỹ năng và phản hồi sát sao từ giáo viên.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Đấu trường Từ Vựng theo phòng lớp</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Vào sảnh chờ trực tiếp cùng giáo viên và bạn học qua mã PIN phòng đấu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Chế độ thi bảo mật
              </span>
              <span>Cambridge / IDP Format</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-6 p-8 sm:p-11 flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {authMode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản học viên'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                {authMode === 'login'
                  ? 'Sử dụng tài khoản học viên hoặc giáo viên để tiếp tục.'
                  : 'Đăng ký nhanh để bắt đầu làm bài thi thử và tham gia lớp học.'}
              </p>

              {/* Auth Mode Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Đăng Ký Mới
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Họ và tên</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Minh Anh"
                      value={authForm.fullName}
                      onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập username..."
                    value={authForm.username}
                    onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showAuthPass ? 'text' : 'password'}
                      required
                      placeholder="Nhập mật khẩu..."
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showAuthPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm mt-2"
                >
                  <span>{authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-7 pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2.5">Tài khoản dùng thử nhanh:</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'hocsinh_01', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border border-slate-200 dark:border-slate-700 rounded-xl transition text-left"
                >
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">Học viên mẫu</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">hocsinh_01 / 123456</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ username: 'teacher_ielts', password: '123456', fullName: '' });
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 rounded-xl transition text-left"
                >
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">Giáo viên</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">teacher_ielts / 123456</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        LexiPrep Academy • Hệ thống Luyện thi IELTS • 2026
      </p>
    </div>
  );
}
