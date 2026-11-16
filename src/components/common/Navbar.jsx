import {
  BookOpen,
  Camera,
  Gamepad2,
  GraduationCap,
  Key,
  LogOut,
  Mic,
  Moon,
  Phone,
  ShieldAlert,
  Sun,
  UserCheck,
  Users
} from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';
import UserAvatarBadge from './UserAvatarBadge';

export default function Navbar({
  aiApiKey,
  currentUser,
  darkMode,
  handleLogout,
  openMemberProfile,
  openStudentGamePortal,
  setApiTestState,
  setDarkMode,
  setSelectedProfileStudent,
  setShowApiKeyModal,
  setShowAvatarModal,
  setTeacherHubTab,
  setView,
  teacherHubTab,
  view
}) {
  if (view === 'AUTH') return null;
  const isTeacher = currentUser?.role === 'teacher';
  const goToOwnProfile = () => {
    if (openMemberProfile) {
      openMemberProfile(currentUser?.username);
    } else {
      setSelectedProfileStudent(currentUser?.username);
      setView('STUDENT_PROFILE');
    }
  };

  return (
    <header className="bg-[#FDF2F6]/95 dark:bg-[#0F172B]/95 backdrop-blur-xl border-b border-pink-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
        {/* Luyện Thi IELTS Nha Trang Brand Lockup */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          onClick={() => setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME')}
        >
          <div className="w-9 h-9 rounded-xl bg-[#007A7A] group-hover:bg-[#065B5B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-all shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block font-extrabold text-sm sm:text-base tracking-tight text-[#0F172B] dark:text-white whitespace-nowrap leading-tight">
              {BRAND_INFO.shortName}
            </span>
            <p className="text-[11px] text-[#62748E] dark:text-slate-400 hidden sm:block leading-none mt-0.5 whitespace-nowrap">
              {BRAND_INFO.siteName}
            </p>
          </div>
        </div>

        {/* Center Editorial Navigation — strictly single-line pills */}
        <nav className="hidden lg:flex items-center gap-1 bg-pink-100/75 dark:bg-slate-800/85 p-1 rounded-xl border border-pink-200/90 dark:border-slate-700/70 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setView('HOME')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
              view === 'HOME'
                ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-sm border border-[#B5F5F1] dark:border-teal-500/30'
                : 'text-[#314158] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Luyện Đề</span>
          </button>
          <button
            type="button"
            onClick={() => setView('SKILL_HUB')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
              view === 'SKILL_HUB' || view === 'SPEAKING_MODE'
                ? 'bg-[#570DF8] text-white shadow-sm'
                : 'text-[#570DF8] dark:text-[#C4B5FD] hover:bg-[#570DF8]/10'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span>Speaking AI <span className="hidden xl:inline">&amp; 4 Kỹ Năng</span></span>
          </button>
          <button
            type="button"
            onClick={openStudentGamePortal}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
              view === 'GAME_ARENA'
                ? 'bg-[#007A7A] text-white shadow-sm'
                : 'text-[#314158] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
            <span>Đấu Trường</span>
          </button>
          <button
            type="button"
            onClick={goToOwnProfile}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
              view === 'STUDENT_PROFILE'
                ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-sm border border-[#B5F5F1] dark:border-teal-500/30'
                : 'text-[#314158] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Hồ Sơ Lớp</span>
          </button>
          {isTeacher && (
            <>
              <button
                type="button"
                onClick={() => {
                  setTeacherHubTab(prev => (prev === 'accounts' ? 'tests' : prev));
                  setView('TEACHER_DASHBOARD');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                  (view === 'TEACHER_DASHBOARD' && teacherHubTab !== 'accounts') || view === 'EXAM_BUILDER'
                    ? 'bg-[#F25220] text-white shadow-sm'
                    : 'text-[#E17100] dark:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Quản Trị GV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherHubTab('accounts');
                  setView('TEACHER_DASHBOARD');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                  view === 'TEACHER_DASHBOARD' && teacherHubTab === 'accounts'
                    ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-sm border border-[#B5F5F1] dark:border-teal-500/30'
                    : 'text-[#314158] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Tài Khoản</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={BRAND_INFO.phoneHref}
            title={`Liên hệ ${BRAND_INFO.teacherName}: ${BRAND_INFO.phoneDisplay} • ${BRAND_INFO.address}`}
            className="hidden sm:inline-flex items-center gap-1.5 p-2 2xl:px-2.5 rounded-xl text-xs font-bold bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 hover:bg-[#B5F5F1]/60 transition shrink-0"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span className="hidden 2xl:inline whitespace-nowrap">{BRAND_INFO.phoneDisplay}</span>
          </a>
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-xl text-xs font-semibold bg-rose-50/80 dark:bg-slate-800 text-[#314158] dark:text-slate-200 hover:bg-[#EDFFFD] hover:text-[#007A7A] dark:hover:bg-slate-700 transition border border-rose-200/80 dark:border-slate-700 shrink-0"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#007A7A]" />}
          </button>

          {/* AI Key config button strictly for Teacher */}
          {isTeacher && (
            <button
              type="button"
              onClick={() => {
                setApiTestState({ testing: false, ok: null, message: '', model: '' });
                setShowApiKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-rose-50/80 dark:bg-slate-800 text-[#314158] dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 transition border border-rose-200/80 dark:border-slate-700 shrink-0 whitespace-nowrap"
              title="Cấu hình Google Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-[#E17100] shrink-0" />
              <span className="hidden xl:inline">Gemini Key</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${aiApiKey?.trim() ? 'bg-[#059271]' : 'bg-slate-400'}`} />
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={goToOwnProfile}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-[#EDFFFD] dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-[#B5F5F1] dark:hover:border-slate-700 text-left"
              title="Xem & chỉnh sửa hồ sơ cá nhân"
            >
              <UserAvatarBadge user={currentUser} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-lg" />
              <div className="text-left text-xs hidden sm:block min-w-0">
                <p className="font-bold text-[#0F172B] dark:text-slate-100 leading-tight truncate max-w-[115px] xl:max-w-[140px]">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] font-semibold text-[#007A7A] dark:text-[#1EE1D6] leading-tight">
                  {isTeacher ? 'Giáo viên' : 'Học viên'}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="hidden sm:inline-flex p-2 rounded-xl text-[#62748E] dark:text-slate-400 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] transition border border-rose-200/80 dark:border-slate-700"
              title="Cài đặt ảnh đại diện & đầu nhân vật Game"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#62748E] dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-[#E7000B] dark:hover:text-rose-400 transition border border-transparent hover:border-rose-200 dark:hover:border-rose-800 shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Quick Nav Strip */}
      <div className="lg:hidden bg-[#FCECF2] dark:bg-[#0F172B] border-t border-pink-200/85 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setView('HOME')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
            view === 'HOME'
              ? 'bg-[#007A7A] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-[#314158] dark:text-slate-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Luyện Đề
        </button>
        <button
          type="button"
          onClick={() => setView('SKILL_HUB')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
            view === 'SKILL_HUB' || view === 'SPEAKING_MODE'
              ? 'bg-[#570DF8] text-white'
              : 'bg-indigo-50 dark:bg-[#23222E] text-[#570DF8] dark:text-[#C4B5FD]'
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> Speaking AI &amp; 4 Kỹ Năng
        </button>
        <button
          type="button"
          onClick={openStudentGamePortal}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
            view === 'GAME_ARENA'
              ? 'bg-[#007A7A] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-[#314158] dark:text-slate-300'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> Đấu Trường
        </button>
        <button
          type="button"
          onClick={goToOwnProfile}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
            view === 'STUDENT_PROFILE'
              ? 'bg-[#007A7A] text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-[#314158] dark:text-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Hồ Sơ Lớp
        </button>
        {isTeacher && (
          <>
            <button
              type="button"
              onClick={() => {
                setTeacherHubTab(prev => (prev === 'accounts' ? 'tests' : prev));
                setView('TEACHER_DASHBOARD');
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                (view === 'TEACHER_DASHBOARD' && teacherHubTab !== 'accounts') || view === 'EXAM_BUILDER'
                  ? 'bg-[#F25220] text-white'
                  : 'bg-amber-50 dark:bg-amber-500/15 text-[#E17100] dark:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Quản Trị GV
            </button>
            <button
              type="button"
              onClick={() => {
                setTeacherHubTab('accounts');
                setView('TEACHER_DASHBOARD');
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                view === 'TEACHER_DASHBOARD' && teacherHubTab === 'accounts'
                  ? 'bg-[#007A7A] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#314158] dark:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Tài Khoản
            </button>
          </>
        )}
      </div>
    </header>
  );
}
