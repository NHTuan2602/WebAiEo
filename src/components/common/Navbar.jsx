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
  Trash2,
  UserCheck,
  X
} from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';
import UserAvatarBadge from './UserAvatarBadge';
import VipMemberName from './VipMemberName';

export default function Navbar({
  currentUser,
  dailySpeakingPendingCount = 0,
  darkMode,
  handleLogout,
  notifications = [],
  onDismissNotifications = null,
  onMarkNotificationsRead,
  onOpenAccountSecurity,
  onOpenNotificationTarget,
  onOpenSpeakingDaily,
  openMemberProfile,
  openStudentGamePortal,
  setDarkMode,
  setSelectedProfileStudent,
  setShowAvatarModal,
  setView,
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
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin || currentUser?.username === 'tuanpro123s');
  const notifList = Array.isArray(notifications) ? notifications : [];
  const unreadNotifCount = notifList.filter(n => !n?.isRead).length;
  const readNotifCount = notifList.filter(n => Boolean(n?.isRead)).length;
  const goToOwnProfile = () => {
    if (openMemberProfile) {
      openMemberProfile(currentUser?.username);
    } else {
      setSelectedProfileStudent(currentUser?.username);
      setView('STUDENT_PROFILE');
    }
  };

  const navTabCls = isActive =>
    `px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 border ${
      isActive
        ? 'bg-white dark:bg-[#0F172B] text-[#007A7A] dark:text-[#1EE1D6] shadow-xs border-slate-200 dark:border-slate-700'
        : 'text-[#314158] dark:text-slate-300 hover:text-[#0F172B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50 border-transparent'
    }`;

  const mobileTabCls = isActive =>
    `px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition flex items-center gap-1.5 border ${
      isActive
        ? 'bg-[#007A7A] text-white border-[#007A7A]'
        : 'bg-white dark:bg-slate-800 text-[#314158] dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }`;

  return (
    <header className="bg-white/95 dark:bg-[#0F172B]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
        {/* Luyện Thi IELTS Nha Trang Brand Lockup */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          onClick={() => setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME')}
        >
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 bg-white"
          />
          <div className="min-w-0">
            <span className="block font-extrabold text-sm sm:text-base tracking-tight text-[#0F172B] dark:text-white whitespace-nowrap leading-tight">
              {BRAND_INFO.shortName}
            </span>
            <p className="text-xs text-[#475569] dark:text-slate-300 hidden sm:block leading-none mt-0.5 whitespace-nowrap">
              {BRAND_INFO.siteName}
            </p>
          </div>
        </div>

        {/* Center Editorial Navigation - unified single-accent tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setView('HOME')}
            className={navTabCls(view === 'HOME')}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Đề Thi</span>
          </button>
          <button
            type="button"
            onClick={() => setView('SKILL_HUB')}
            className={navTabCls(view === 'SKILL_HUB' || view === 'SPEAKING_MODE')}
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
                className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-300 text-xs font-bold"
                title={`Bạn còn ${dailySpeakingPendingCount} bài Speaking Daily chưa hoàn thành hôm nay`}
              >
                {dailySpeakingPendingCount} Daily
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openStudentGamePortal}
            className={navTabCls(view === 'GAME_ARENA')}
          >
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
            <span>Đấu Trường</span>
          </button>
          <button
            type="button"
            onClick={goToOwnProfile}
            className={navTabCls(view === 'STUDENT_PROFILE')}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Hồ Sơ Lớp</span>
          </button>
          {isTeacher && (
            <button
              type="button"
              onClick={() => setView('TEACHER_DASHBOARD')}
              className={navTabCls(view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER')}
              title="Trung tâm Quản trị Giáo viên & Tài khoản lớp"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Quản Trị GV</span>
            </button>
          )}
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={BRAND_INFO.phoneHref}
            title={`Liên hệ ${BRAND_INFO.teacherName}: ${BRAND_INFO.phoneDisplay} • ${BRAND_INFO.address}`}
            className="hidden sm:inline-flex items-center gap-1.5 p-2 2xl:px-2.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800/80 text-[#334155] dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A]/50 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] transition shrink-0"
          >
            <Phone className="w-4 h-4 shrink-0 text-[#007A7A] dark:text-[#1EE1D6]" />
            <span className="hidden 2xl:inline whitespace-nowrap">{BRAND_INFO.phoneDisplay}</span>
          </a>
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-[#334155] dark:text-slate-200 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] hover:border-[#007A7A]/50 transition border border-slate-200 dark:border-slate-700 shrink-0"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#007A7A]" />}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={goToOwnProfile}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left"
              title="Xem & chỉnh sửa hồ sơ cá nhân"
            >
              <UserAvatarBadge user={currentUser} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-lg" />
              <div className="text-left text-xs hidden sm:block min-w-0">
                <p className="font-bold text-[#0F172B] dark:text-slate-100 leading-tight truncate max-w-[140px] xl:max-w-[175px]">
                  <VipMemberName user={currentUser} badgeSize="xs" />
                </p>
                <p className={`text-xs leading-tight ${
                  isSuperAdmin
                    ? 'font-bold text-[#334155] dark:text-slate-300 tracking-wide'
                    : 'font-semibold text-[#475569] dark:text-slate-300'
                }`}>
                  {isSuperAdmin ? 'ADMIN' : isTeacher ? 'Giáo viên' : 'Học viên'}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="hidden sm:inline-flex p-2 rounded-lg text-[#475569] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] hover:border-[#007A7A]/50 transition border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
              title="Cài đặt ảnh đại diện & đầu nhân vật Game"
            >
              <Camera className="w-4 h-4" />
            </button>
            {onOpenAccountSecurity && (
              <button
                type="button"
                onClick={() => onOpenAccountSecurity('password')}
                className="inline-flex p-2 rounded-lg text-[#475569] dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] hover:border-[#007A7A]/50 transition border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
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
                className={`relative p-2 rounded-lg transition border shrink-0 ${
                  showNotifMenu || unreadNotifCount > 0
                    ? 'bg-[#F8FAFC] dark:bg-slate-800 text-[#0F766E] dark:text-[#1EE1D6] border-slate-200 dark:border-slate-700'
                    : 'text-[#475569] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                }`}
                title="Thông báo bài tập & đề thi"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                        Thông Báo Lớp Học ({notifList.length})
                      </h4>
                      <p className="text-xs text-[#475569] dark:text-slate-300">
                        {unreadNotifCount > 0 ? `${unreadNotifCount} thông báo chưa đọc` : 'Đã xem hết tất cả thông báo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unreadNotifCount > 0 && onMarkNotificationsRead && (
                        <button
                          type="button"
                          onClick={() => onMarkNotificationsRead('all')}
                          className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline flex items-center gap-1 shrink-0"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                        </button>
                      )}
                      {notifList.length > 0 && onDismissNotifications && (
                        <button
                          type="button"
                          onClick={() => onDismissNotifications(readNotifCount > 0 ? 'read' : 'all')}
                          title={readNotifCount > 0 ? 'Xóa toàn bộ thông báo cũ đã đọc' : 'Xóa tất cả thông báo'}
                          className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold inline-flex items-center gap-1 transition shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          {readNotifCount > 0 ? `Xóa tin cũ (${readNotifCount})` : 'Xóa hết'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                    {notifList.length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-1.5">
                        <Bell className="w-7 h-7 text-slate-400 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-bold text-[#334155] dark:text-slate-300">Chưa có thông báo mới.</p>
                        <p className="text-xs text-[#475569] dark:text-slate-400">Khi giáo viên đăng đề thi hoặc bài tập mới, thông báo sẽ hiển thị tại đây.</p>
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
                            ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F766E] dark:text-teal-300'
                            : notif.type === 'exercise'
                            ? 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6]'
                            : notif.type === 'game'
                            ? 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300'
                            : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300';
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
                                : 'bg-[#F0FDFA] dark:bg-teal-950/20'
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
                                  {onDismissNotifications && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        onDismissNotifications(notif.id);
                                      }}
                                      aria-label={`Xóa thông báo ${notif.title}`}
                                      title="Xóa thông báo này"
                                      className="p-1 -mt-0.5 -mr-1 rounded-lg text-[#475569] hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-[#334155] dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                  {notif.message}
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                  <span className="text-xs text-[#475569] dark:text-slate-400">
                                    {notif.createdByName || 'Giáo viên'} • {notif.createdAt}
                                  </span>
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    {!notif.isRead && onMarkNotificationsRead && (
                                      <button
                                        type="button"
                                        onClick={() => onMarkNotificationsRead(notif.id)}
                                        className="text-xs font-bold text-[#334155] hover:text-[#0F172A] dark:text-slate-300 dark:hover:text-white"
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
                                        className="px-2.5 py-1 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
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
            className="p-2 rounded-lg text-[#475569] dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-[#B91C1C] dark:hover:text-rose-400 transition border border-transparent hover:border-rose-200 dark:hover:border-rose-800 shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Quick Nav Strip */}
      <div className="lg:hidden bg-slate-50 dark:bg-[#0F172B] border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setView('HOME')}
          className={mobileTabCls(view === 'HOME')}
        >
          <BookOpen className="w-3.5 h-3.5" /> Đề Thi
        </button>
        <button
          type="button"
          onClick={() => setView('SKILL_HUB')}
          className={mobileTabCls(view === 'SKILL_HUB' || view === 'SPEAKING_MODE')}
        >
          <Mic className="w-3.5 h-3.5" /> Bài Tập 4 Kỹ Năng
        </button>
        <button
          type="button"
          onClick={openStudentGamePortal}
          className={mobileTabCls(view === 'GAME_ARENA')}
        >
          <Gamepad2 className="w-3.5 h-3.5" /> Đấu Trường
        </button>
        <button
          type="button"
          onClick={goToOwnProfile}
          className={mobileTabCls(view === 'STUDENT_PROFILE')}
        >
          <UserCheck className="w-3.5 h-3.5" /> Hồ Sơ Lớp
        </button>
        {isTeacher && (
          <button
            type="button"
            onClick={() => setView('TEACHER_DASHBOARD')}
            className={mobileTabCls(view === 'TEACHER_DASHBOARD' || view === 'EXAM_BUILDER')}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Quản Trị GV
          </button>
        )}
      </div>
    </header>
  );
}
