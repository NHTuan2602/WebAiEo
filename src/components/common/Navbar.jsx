import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BookOpen,
  Camera,
  CheckCheck,
  Gamepad2,
  Key,
  LogOut,
  Megaphone,
  Mic,
  Moon,
  Phone,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  Users
} from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';
import UserAvatarBadge from './UserAvatarBadge';

export default function Navbar({
  aiApiKey,
  currentUser,
  dailySpeakingPendingCount = 0,
  darkMode,
  handleLogout,
  notifications = [],
  onMarkNotificationsRead,
  onOpenAccountSecurity,
  onOpenNotificationTarget,
  onOpenSpeakingDaily,
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
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifBoxRef = useRef(null);

  useEffect(() => {
    if (!showNotifMenu) return undefined;
    const handleClickOutside = (e) => {
      if (notifBoxRef.current && !notifBoxRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifMenu]);

  if (view === 'AUTH') return null;
  const isTeacher = currentUser?.role === 'teacher';
  const notifList = Array.isArray(notifications) ? notifications : [];
  const unreadNotifCount = notifList.filter(n => !n?.isRead).length;
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
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-10 h-10 rounded-full object-cover border-2 border-pink-300 shadow-sm group-hover:scale-105 transition-all shrink-0 bg-white"
          />
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
            <span>Đề Thi</span>
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
            <span>Bài Tập <span className="hidden xl:inline">4 Kỹ Năng</span></span>
            {!isTeacher && dailySpeakingPendingCount > 0 && (
              <span
                onClick={e => {
                  if (onOpenSpeakingDaily) {
                    e.stopPropagation();
                    onOpenSpeakingDaily();
                  }
                }}
                className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-black animate-pulse"
                title={`Bạn còn ${dailySpeakingPendingCount} bài Speaking Daily chưa hoàn thành hôm nay`}
              >
                {dailySpeakingPendingCount} Daily
              </span>
            )}
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
            {onOpenAccountSecurity && (
              <button
                type="button"
                onClick={() => onOpenAccountSecurity('password')}
                className="inline-flex p-2 rounded-xl text-[#62748E] dark:text-slate-400 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] transition border border-rose-200/80 dark:border-slate-700"
                title="Đổi mật khẩu & Email nhận mã OTP"
                aria-label="Đổi mật khẩu & Email OTP"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isTeacher && !currentUser?.isSuperAdmin && (
            <div className="relative shrink-0" ref={notifBoxRef}>
              <button
                type="button"
                onClick={() => setShowNotifMenu(v => !v)}
                className={`relative p-2 rounded-xl transition border shrink-0 ${
                  showNotifMenu || unreadNotifCount > 0
                    ? 'bg-pink-50 dark:bg-slate-800 text-[#007A7A] dark:text-[#1EE1D6] border-pink-200 dark:border-slate-700'
                    : 'text-[#62748E] dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 border-transparent'
                }`}
                title="Thông báo bài tập & đề thi"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-pink-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#FDF2F6] dark:bg-slate-800/80 border-b border-pink-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
                        Thông Báo Lớp Học ({notifList.length})
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {unreadNotifCount > 0 ? `${unreadNotifCount} thông báo chưa đọc` : 'Đã xem hết tất cả thông báo'}
                      </p>
                    </div>
                    {unreadNotifCount > 0 && onMarkNotificationsRead && (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationsRead('all')}
                        className="text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline flex items-center gap-1 shrink-0"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-pink-100/80 dark:divide-slate-800">
                    {notifList.length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-1.5">
                        <Bell className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Chưa có thông báo mới.</p>
                        <p className="text-[11px] text-slate-400">Khi giáo viên đăng đề thi hoặc bài tập mới, thông báo sẽ hiển thị tại đây.</p>
                      </div>
                    ) : (
                      notifList.map(notif => {
                        const NIcon =
                          notif.type === 'exam'
                            ? BookOpen
                            : notif.type === 'exercise'
                            ? Sparkles
                            : notif.type === 'game'
                            ? Gamepad2
                            : Megaphone;
                        const iconCls =
                          notif.type === 'exam'
                            ? 'bg-teal-50 dark:bg-teal-500/15 text-[#007A7A] dark:text-teal-300'
                            : notif.type === 'exercise'
                            ? 'bg-violet-50 dark:bg-violet-500/15 text-[#570DF8] dark:text-violet-300'
                            : notif.type === 'game'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300';
                        const hasTarget = Boolean((notif.testId || notif.roomPin) && onOpenNotificationTarget);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!hasTarget) return;
                              setShowNotifMenu(false);
                              onOpenNotificationTarget(notif);
                            }}
                            className={`p-3.5 transition ${hasTarget ? 'cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/60' : ''} ${
                              notif.isRead
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-[#EDFFFD]/55 dark:bg-teal-950/20'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
                                <NIcon className="w-4 h-4" />
                              </span>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                                    {!notif.isRead && (
                                      <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5 align-middle" />
                                    )}
                                    {notif.title}
                                  </p>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                  {notif.message}
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400">
                                    {notif.createdByName || 'Giáo viên'} • {notif.createdAt}
                                  </span>
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    {!notif.isRead && onMarkNotificationsRead && (
                                      <button
                                        type="button"
                                        onClick={() => onMarkNotificationsRead(notif.id)}
                                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                      >
                                        Đã đọc
                                      </button>
                                    )}
                                    {hasTarget && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowNotifMenu(false);
                                          onOpenNotificationTarget(notif);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-[10px] font-extrabold transition"
                                      >
                                        {notif.roomPin
                                          ? `Vào Phòng #${notif.roomPin} →`
                                          : notif.type === 'exercise'
                                          ? 'Xem bài tập →'
                                          : 'Xem đề thi →'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
          <BookOpen className="w-3.5 h-3.5" /> Đề Thi
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
          <Mic className="w-3.5 h-3.5" /> Bài Tập 4 Kỹ Năng
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
