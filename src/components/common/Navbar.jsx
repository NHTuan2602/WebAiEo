import {
  BookOpen,
  Camera,
  Gamepad2,
  GraduationCap,
  Key,
  LogOut,
  Moon,
  ShieldAlert,
  Sun,
  UserCheck
} from 'lucide-react';
import UserAvatarBadge from './UserAvatarBadge';

export default function Navbar({
  aiApiKey,
  currentUser,
  darkMode,
  handleLogout,
  openStudentGamePortal,
  setApiTestState,
  setDarkMode,
  setSelectedProfileStudent,
  setShowApiKeyModal,
  setShowAvatarModal,
  setView,
  view
}) {
  if (view === 'AUTH') return null;
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME')}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                LexiPrep
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30">
                IELTS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
              Nền tảng Luyện thi & Khảo thí Chuẩn Quốc tế
            </p>
          </div>
        </div>

        {/* Center Segmented Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold">
          <button
            onClick={() => setView('HOME')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              view === 'HOME'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Phòng Luyện Đề</span>
          </button>
          <button
            onClick={openStudentGamePortal}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              view === 'GAME_ARENA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game Từ Vựng</span>
          </button>
          <button
            onClick={() => {
              setSelectedProfileStudent(currentUser?.username);
              setView('STUDENT_PROFILE');
            }}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              view === 'STUDENT_PROFILE'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isTeacher ? 'Hồ Sơ Học Viên' : 'Tiến Trình Của Tôi'}</span>
          </button>
          {isTeacher && (
            <button
              onClick={() => setView('TEACHER_DASHBOARD')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Quản Trị Giáo Viên</span>
            </button>
          )}
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="hidden xl:inline">{darkMode ? 'Sáng' : 'Tối'}</span>
          </button>

          {/* AI Key config button strictly for Teacher */}
          {isTeacher && (
            <button
              onClick={() => {
                setApiTestState({ testing: false, ok: null, message: '', model: '' });
                setShowApiKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition border border-slate-200/80 dark:border-slate-700"
              title="Cấu hình Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">Gemini Key</span>
              <span className={`w-2 h-2 rounded-full ${aiApiKey?.trim() ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <div
              onClick={() => {
                setSelectedProfileStudent(currentUser?.username);
                setView('STUDENT_PROFILE');
              }}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Xem hồ sơ học tập"
            >
              <UserAvatarBadge user={currentUser} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-lg" />
              <div className="text-left text-xs hidden sm:block">
                <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">{currentUser?.name}</p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {isTeacher ? 'Giáo viên' : 'Học viên'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300 transition border border-slate-200/70 dark:border-slate-700/70"
              title="Cài đặt ảnh đại diện & đầu nhân vật Game"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Quick Nav Strip */}
      <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setView('HOME')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            view === 'HOME'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Luyện Đề
        </button>
        <button
          onClick={openStudentGamePortal}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            view === 'GAME_ARENA'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> Game Từ Vựng
        </button>
        <button
          onClick={() => {
            setSelectedProfileStudent(currentUser?.username);
            setView('STUDENT_PROFILE');
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            view === 'STUDENT_PROFILE'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Tiến Trình
        </button>
        {isTeacher && (
          <button
            onClick={() => setView('TEACHER_DASHBOARD')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Giáo Viên
          </button>
        )}
      </div>
    </header>
  );
}
