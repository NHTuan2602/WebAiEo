import { useState } from 'react';
import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  Headphones,
  History,
  Lock,
  MapPin,
  MessageSquare,
  PenTool,
  Phone,
  Play,
  Save,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { BRAND_INFO } from '../constants/brandInfo';
import { normalizeExamConfig } from '../constants/seedData';
import { countExtensionCheatSignals, getRiskAssessment } from '../utils/examHelpers';
import UserAvatarBadge from '../components/common/UserAvatarBadge';

export default function StudentProfile({
  adminFeedbacks = [],
  attempts = [],
  currentRoomPin,
  currentUser,
  dispatchSyncAction,
  handleTeacherOpenLobby,
  openStudentGamePortal,
  previousView,
  roomsDb = {},
  selectedProfileStudent,
  setEditingTargetUser,
  setPreviousView,
  setSelectedAttemptId,
  setSelectedProfileStudent,
  setShowAvatarModal,
  setTeacherNotes,
  setTempNoteText,
  setView,
  showToast,
  startExam,
  supportAdminProfile = null,
  teacherNotes = {},
  tempNoteText,
  tests = [],
  usersDb = {}
}) {
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [fbCategory, setFbCategory] = useState('feature');
  const [fbContent, setFbContent] = useState('');
  const [fbPrivate, setFbPrivate] = useState(false);
  const [fbStatusFilter, setFbStatusFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});

  const isTeacherViewer = currentUser?.role === 'teacher';
  const fallbackUsername = currentUser?.username || Object.keys(usersDb)[0] || supportAdminProfile?.username || 'teacher_ielts';
  const requestedUsername = selectedProfileStudent || fallbackUsername;
  const resolvedMember =
    usersDb[requestedUsername] ||
    (supportAdminProfile?.username === requestedUsername ? supportAdminProfile : null) ||
    Object.values(usersDb)[0] ||
    supportAdminProfile;
  const activeUsername = resolvedMember?.username || requestedUsername;
  const student = resolvedMember || {
    username: activeUsername,
    name: activeUsername,
    role: 'student',
    targetBand: 7.5,
    joinedDate: '2026-02-01'
  };

  const isTargetSystemAdmin = Boolean(
    student.isSystemAdmin || student.isSuperAdmin || student.username === 'tuanpro123s'
  );
  const isTargetTeacher = !isTargetSystemAdmin && student.role === 'teacher';
  const isSelf = student.username === currentUser?.username;
  const isViewerSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const isTargetSuperAdmin = Boolean(student.isSuperAdmin || student.username === 'tuanpro123s');
  const canEditTargetInfo = isTargetSuperAdmin
    ? isViewerSuperAdmin
    : (isSelf || isTeacherViewer);
  const canInspectAttemptDetails = isTeacherViewer || isSelf;
  const canSeeTeacherNotes = isTeacherViewer || isSelf;

  const baseMembers = Object.values(usersDb).filter(u => {
    if (!u) return false;
    return !u.isSuperAdmin && !u.hiddenFromTeacher && u.username !== 'tuanpro123s';
  });
  const adminCardMember = supportAdminProfile
    ? {
        ...supportAdminProfile,
        role: 'admin',
        isSystemAdmin: true
      }
    : (usersDb.tuanpro123s
      ? {
          ...usersDb.tuanpro123s,
          role: 'admin',
          isSystemAdmin: true
        }
      : null);

  const allMembers = [...baseMembers, ...(adminCardMember ? [adminCardMember] : [])].sort((a, b) => {
    const rank = u => (u.isSystemAdmin ? 1 : u.role === 'teacher' ? 0 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.username === currentUser?.username) return -1;
    if (b.username === currentUser?.username) return 1;
    return (a.name || a.username || '').localeCompare(b.name || b.username || '');
  });

  const filteredMembers = allMembers.filter(m => {
    const effectiveRole = m.isSystemAdmin ? 'admin' : m.role;
    if (memberRoleFilter !== 'all' && effectiveRole !== memberRoleFilter) return false;
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.isSystemAdmin && 'quản trị góp ý admin'.includes(q))
    );
  });

  const studentAttempts = attempts.filter(a => a.studentId === activeUsername);

  // Sort chronologically ascending (oldest to newest) for progression calculations
  const chronologicalAttempts = [...studentAttempts].reverse();
  const totalAttempts = studentAttempts.length;
  const gradedOverallBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
  const highestBand = gradedOverallBands.length > 0 ? Math.max(...gradedOverallBands) : null;
  const latestAttempt = studentAttempts[0];
  const firstAttempt = chronologicalAttempts[0];
  const bandGrowth = (typeof latestAttempt?.overallBand === 'number' && typeof firstAttempt?.overallBand === 'number' && totalAttempts > 1)
    ? (latestAttempt.overallBand - firstAttempt.overallBand).toFixed(1)
    : null;

  const avgListening = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores?.listening?.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const avgReading = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores?.reading?.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const gradedWritingAttempts = studentAttempts.filter(a => typeof a.scores?.writing?.overallBand === 'number');
  const avgWriting = gradedWritingAttempts.length > 0
    ? (gradedWritingAttempts.reduce((acc, a) => acc + a.scores.writing.overallBand, 0) / gradedWritingAttempts.length).toFixed(1)
    : null;
  const overallAvg = gradedOverallBands.length > 0
    ? (gradedOverallBands.reduce((acc, b) => acc + b, 0) / gradedOverallBands.length).toFixed(1)
    : null;

  const totalTabSwitches = isTeacherViewer
    ? studentAttempts.reduce((acc, a) => acc + (a.tabSwitchCount || 0), 0)
    : 0;
  const avgTabSwitches = isTeacherViewer && totalAttempts > 0
    ? (totalTabSwitches / totalAttempts).toFixed(1)
    : 0;

  // Room score for this member
  const room = roomsDb[currentRoomPin] || { players: {} };
  const playerGameRecord = room.players?.[student.username] || room.players?.[student.name];

  // Teacher portfolio stats
  const publicTests = tests.filter(t => normalizeExamConfig(t).visibility !== 'private');
  const totalGradedByTeacher = attempts.filter(a => a.teacherGraded).length;
  const totalActiveRooms = Object.keys(roomsDb || {}).length;

  const handleBackNavigation = () => {
    if (previousView && !['AUTH', 'EXAM_MODE', 'STUDENT_PROFILE'].includes(previousView)) {
      if (!isTeacherViewer && ['TEACHER_DASHBOARD', 'EXAM_BUILDER'].includes(previousView)) {
        setView('HOME');
        return;
      }
      setView(previousView);
      return;
    }
    setView(isTeacherViewer ? 'TEACHER_DASHBOARD' : 'HOME');
  };

  const newFeedbacksCount = adminFeedbacks.filter(f => f.status === 'new').length;
  const filteredFeedbacks = adminFeedbacks.filter(fb =>
    fbStatusFilter === 'all' ? true : fb.status === fbStatusFilter
  );

  const handleSendAdminFeedback = async (e) => {
    e.preventDefault();
    const clean = (fbContent || '').trim();
    if (!clean) {
      showToast?.('Vui lòng nhập nội dung góp ý hoặc tính năng bạn mong muốn!', 'error');
      return;
    }
    const snap = await dispatchSyncAction?.('SUBMIT_ADMIN_FEEDBACK', {
      category: fbCategory,
      content: clean,
      isPrivate: fbPrivate
    });
    if (snap) {
      setFbContent('');
      setFbPrivate(false);
      showToast?.('Đã gửi góp ý thành công đến Quản Trị Hệ Thống!');
    }
  };

  const handleUpdateFeedbackByAdmin = async (fb) => {
    if (!isViewerSuperAdmin || !fb?.id) return;
    const nextStatus = statusDrafts[fb.id] || fb.status || 'new';
    const nextReply = replyDrafts[fb.id] !== undefined ? replyDrafts[fb.id] : (fb.adminReply || '');
    const snap = await dispatchSyncAction?.('UPDATE_ADMIN_FEEDBACK', {
      feedbackId: fb.id,
      status: nextStatus,
      adminReply: nextReply
    });
    if (snap) {
      showToast?.('Đã cập nhật trạng thái & phản hồi góp ý!');
    }
  };

  const handleDeleteFeedbackItem = async (fbId) => {
    if (!fbId) return;
    if (!window.confirm('Xóa mục góp ý này?')) return;
    const snap = await dispatchSyncAction?.('DELETE_ADMIN_FEEDBACK', { feedbackId: fbId });
    if (snap) {
      showToast?.('Đã xóa mục góp ý.', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation & Header Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {isTeacherViewer ? 'Quay Lại Quản Trị Giáo Viên' : 'Quay Lại Phòng Luyện Đề'}
        </button>

        {!isSelf && currentUser?.username && (
          <button
            type="button"
            onClick={() => {
              setSelectedProfileStudent(currentUser.username);
              setTempNoteText('');
            }}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 px-4 py-2.5 rounded-xl border border-[#B5F5F1] dark:border-teal-500/30 shadow-sm transition"
          >
            <UserCheck className="w-4 h-4" /> Quay về Hồ Sơ Của Tôi ({currentUser.name})
          </button>
        )}
      </div>

      {/* Interactive Member Directory (Teachers & Classmates can view each other's profiles) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
              Danh Bạ Hồ Sơ Thành Viên ({filteredMembers.length}/{allMembers.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Giáo viên và các học viên có thể chọn bất kỳ thành viên nào bên dưới để xem hồ sơ, tiến trình và thành tích học tập.
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
              {[
                { id: 'all', label: `Tất cả (${allMembers.length})` },
                ...(adminCardMember ? [{ id: 'admin', label: 'Quản trị (1)' }] : []),
                { id: 'teacher', label: `Giáo viên (${allMembers.filter(m => !m.isSystemAdmin && m.role === 'teacher').length})` },
                { id: 'student', label: `Học viên (${allMembers.filter(m => !m.isSystemAdmin && m.role !== 'teacher').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMemberRoleFilter(f.id)}
                  className={`px-2.5 py-1.5 rounded-xl border transition ${
                    memberRoleFilter === f.id
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Tìm tên hoặc @username..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Không tìm thấy thành viên nào khớp từ khóa "{memberSearch}".</p>
          ) : (
            filteredMembers.map(member => {
              const isSelected = activeUsername === member.username;
              const isMemberAdmin = Boolean(member.isSystemAdmin);
              const isMemberTeacher = !isMemberAdmin && member.role === 'teacher';
              const isMeChip = member.username === currentUser?.username;
              const mBands = attempts
                .filter(a => a.studentId === member.username)
                .map(a => a.overallBand)
                .filter(b => typeof b === 'number');
              const mBest = mBands.length > 0 ? Math.max(...mBands) : null;

              return (
                <button
                  key={member.username}
                  type="button"
                  onClick={() => {
                    setSelectedProfileStudent(member.username);
                    setTempNoteText('');
                  }}
                  className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition ${
                    isSelected
                      ? isMemberAdmin
                        ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-[#EDFFFD] dark:bg-teal-500/20 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                      : isMemberAdmin
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/30 hover:border-purple-500 hover:bg-white dark:hover:bg-slate-800'
                      : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]/50 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <UserAvatarBadge user={member} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {member.name || member.username}
                      </span>
                      {isMeChip && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      {isMemberAdmin ? (
                        <span className="text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1">
                          Quản trị &bull; Góp ý
                          {newFeedbacksCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-black">
                              {newFeedbacksCount} mới
                            </span>
                          )}
                        </span>
                      ) : isMemberTeacher ? (
                        <span className="text-amber-600 dark:text-amber-300 font-bold">Giáo viên</span>
                      ) : (
                        <span>
                          Target {member.targetBand || '7.5'}
                          {mBest !== null ? ` • Best ${mBest}` : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-gradient-to-r from-[#0F172B] via-[#003538] to-[#065B5B] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="shrink-0 flex flex-col items-center">
              <UserAvatarBadge user={student} sizeClass="w-20 h-20" textClass="text-3xl" rounded="rounded-2xl" />
              {canEditTargetInfo && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSelf) {
                      setShowAvatarModal(true);
                    } else {
                      setEditingTargetUser({
                        username: student.username,
                        name: student.name || '',
                        role: student.role || 'student',
                        targetBand: student.targetBand || 7.5,
                        studyGoal: student.studyGoal || '',
                        avatarUrl: student.avatarUrl || ''
                      });
                    }
                  }}
                  className="mt-2 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white flex items-center gap-1 transition"
                >
                  <Camera className="w-3 h-3" /> Đổi Avatar
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{student.name}</h1>
                <span className="text-xs font-mono bg-[#00B2AD]/25 text-[#1EE1D6] border border-[#00B2AD]/40 px-2.5 py-0.5 rounded-full font-bold">
                  @{student.username}
                </span>
                {isTargetSystemAdmin ? (
                  <span className="text-xs bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Quản Trị Hệ Thống &bull; Góp Ý Tính Năng
                  </span>
                ) : isTargetTeacher ? (
                  <span className="text-xs bg-amber-500/25 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Giáo Viên IELTS
                  </span>
                ) : (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Học Viên Chính Thức
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Gia nhập: <b>{student.joinedDate || '01/02/2026'}</b>
                </span>
                {!isTargetTeacher && !isTargetSystemAdmin && (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                  </span>
                )}
                {canEditTargetInfo && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTargetUser({
                        username: student.username,
                        name: student.name || '',
                        role: student.role || 'student',
                        targetBand: student.targetBand || 7.5,
                        studyGoal: student.studyGoal || '',
                        avatarUrl: student.avatarUrl || ''
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-200 text-[11px] font-bold transition"
                  >
                    <Edit className="w-3 h-3" /> {isTargetTeacher || isTargetSystemAdmin ? 'Chỉnh hồ sơ' : 'Chỉnh mục tiêu'}
                  </button>
                )}
                {(student.studyGoal || isTargetTeacher || isTargetSystemAdmin) && (
                  <span className="text-xs text-cyan-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                    {isTargetSystemAdmin
                      ? `🛠️ ${student.studyGoal || 'Tiếp nhận góp ý & phát triển tính năng mới cho trung tâm'}`
                      : isTargetTeacher
                      ? `✨ ${student.studyGoal || BRAND_INFO.motto}`
                      : `🎯 ${student.studyGoal}`}
                  </span>
                )}
              </div>
              {!isSelf && !isTeacherViewer && !isTargetSystemAdmin && (
                <p className="mt-2 text-[11px] text-slate-300/90 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-teal-300" /> Đang xem hồ sơ thành viên khác (chế độ chỉ xem; bài viết chi tiết &amp; nhận xét riêng được bảo mật).
                </p>
              )}
            </div>
          </div>

          {/* Right Hero Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[210px]">
            {isTargetSystemAdmin ? (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-purple-300 font-bold mb-1">
                  Hòm Thư Góp Ý Web
                </p>
                <p className="text-base font-black text-white">{adminFeedbacks.length} góp ý đã tiếp nhận</p>
                <p className="text-xs text-cyan-300 font-semibold mt-1">
                  {adminFeedbacks.filter(f => f.status === 'done').length} đã thêm • {newFeedbacksCount} chờ đọc
                </p>
              </div>
            ) : isTargetTeacher ? (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold mb-1">
                  Hồ Sơ Giáo Viên
                </p>
                <p className="text-base font-black text-white">{BRAND_INFO.siteName}</p>
                <p className="text-xs text-cyan-300 font-semibold mt-1">
                  {tests.length} đề thi • {totalGradedByTeacher} bài đã chấm
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mb-1">Đánh Giá Tiến Độ</p>
                {highestBand ? (
                  <div>
                    <p className="text-2xl font-black text-amber-300">
                      Band {highestBand} <span className="text-xs text-slate-300 font-normal">/ {student.targetBand || 8.0}</span>
                    </p>
                    <p className="text-xs text-cyan-300 font-semibold mt-1">
                      {highestBand >= (student.targetBand || 8.0)
                        ? '🎉 Đã đạt mục tiêu đề ra!'
                        : `⚡ Còn ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band nữa để đạt mục tiêu`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">Chưa có kết quả bài thi</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SYSTEM ADMIN PROFILE: FEEDBACK & FEATURE REQUEST INBOX */}
      {isTargetSystemAdmin ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Submit New Feedback Card (for Students & Teachers & Admin) */}
            <form
              onSubmit={handleSendAdminFeedback}
              className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/80 dark:border-purple-500/30 shadow-sm p-6 space-y-4 h-fit"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Gửi Góp Ý &amp; Yêu Cầu Tính Năng
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đề xuất tính năng mới hoặc báo lỗi để Quản Trị Hệ Thống nâng cấp website theo nhu cầu của bạn.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Phân loại góp ý
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'feature', label: '✨ Tính năng mới' },
                    { id: 'ui', label: '🎨 Giao diện / UX' },
                    { id: 'bug', label: '🐞 Báo lỗi hệ thống' },
                    { id: 'other', label: '💬 Góp ý khác' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFbCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold text-left transition ${
                        fbCategory === cat.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={fbContent}
                  onChange={e => setFbContent(e.target.value)}
                  placeholder="Ví dụ: Em muốn có thêm phần luyện phát âm từng từ vựng, hoặc giáo viên muốn lọc điểm theo từng tuần..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">{fbContent.length}/2000 ký tự</p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fbPrivate}
                  onChange={e => setFbPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Gửi riêng tư (chỉ bạn và Quản trị hệ thống đọc được)</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi Góp Ý Đến Quản Trị
              </button>
            </form>

            {/* Feedback List & Admin Triage Board */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Bảng Góp Ý &amp; Tiến Độ Cập Nhật ({filteredFeedbacks.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isViewerSuperAdmin
                      ? 'Bạn đang xem với quyền Quản Trị Hệ Thống — hãy cập nhật trạng thái & phản hồi trực tiếp bên dưới.'
                      : 'Theo dõi các góp ý từ Học viên & Giáo viên và phản hồi trực tiếp từ Quản Trị Hệ Thống.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {[
                    { id: 'all', label: `Tất cả (${adminFeedbacks.length})` },
                    { id: 'new', label: `Mới (${adminFeedbacks.filter(f => f.status === 'new').length})` },
                    { id: 'planned', label: `Đang làm (${adminFeedbacks.filter(f => f.status === 'planned').length})` },
                    { id: 'done', label: `Đã thêm (${adminFeedbacks.filter(f => f.status === 'done').length})` }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFbStatusFilter(st.id)}
                      className={`px-2.5 py-1.5 rounded-xl border transition ${
                        fbStatusFilter === st.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFeedbacks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Chưa có góp ý nào trong mục này.
                  </p>
                  <p className="text-xs text-slate-400">
                    Hãy gửi đề xuất đầu tiên ở khung bên trái để Quản Trị bổ sung tính năng bạn cần!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFeedbacks.map(fb => {
                    const catLabel =
                      fb.category === 'bug'
                        ? '🐞 Báo lỗi'
                        : fb.category === 'ui'
                        ? '🎨 Giao diện'
                        : fb.category === 'other'
                        ? '💬 Khác'
                        : '✨ Tính năng mới';
                    const statusBadge =
                      fb.status === 'done'
                        ? { text: 'Đã thêm tính năng', cls: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', Icon: CheckCircle2 }
                        : fb.status === 'planned'
                        ? { text: 'Đang triển khai', cls: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30', Icon: Clock }
                        : { text: 'Mới gửi', cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', Icon: Sparkles };
                    const StatusIcon = statusBadge.Icon;
                    const canDeleteFb = isViewerSuperAdmin || fb.authorUsername === currentUser?.username;
                    const draftStatus = statusDrafts[fb.id] || fb.status || 'new';
                    const draftReply = replyDrafts[fb.id] !== undefined ? replyDrafts[fb.id] : (fb.adminReply || '');

                    return (
                      <div
                        key={fb.id}
                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {fb.authorName || fb.authorUsername}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">@{fb.authorUsername}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              fb.authorRole === 'teacher'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                : fb.authorRole === 'superadmin'
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                                : 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                            }`}>
                              {fb.authorRole === 'teacher' ? 'Giáo viên' : fb.authorRole === 'superadmin' ? 'Quản trị' : 'Học viên'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {catLabel}
                            </span>
                            {fb.isPrivate && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                <Lock className="w-2.5 h-2.5" /> Riêng tư
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}>
                              <StatusIcon className="w-3 h-3" /> {statusBadge.text}
                            </span>
                            {canDeleteFb && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFeedbackItem(fb.id)}
                                title="Xóa góp ý"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {fb.content}
                        </p>

                        <div className="text-[11px] text-slate-400">
                          Gửi lúc: {fb.createdAt}
                        </div>

                        {fb.adminReply && !isViewerSuperAdmin && (
                          <div className="p-3 rounded-xl bg-purple-50/90 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 space-y-1">
                            <p className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Phản hồi từ Quản Trị Hệ Thống {fb.repliedAt ? `(${fb.repliedAt})` : ''}
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                              {fb.adminReply}
                            </p>
                          </div>
                        )}

                        {isViewerSuperAdmin && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/70 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Trạng thái xử lý:</span>
                              <select
                                value={draftStatus}
                                onChange={e => setStatusDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                              >
                                <option value="new">Mới gửi</option>
                                <option value="planned">Đang triển khai</option>
                                <option value="done">Đã thêm tính năng</option>
                              </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={draftReply}
                                onChange={e => setReplyDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                placeholder="Nhập phản hồi của Quản trị gửi học viên / giáo viên..."
                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateFeedbackByAdmin(fb)}
                                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition"
                              >
                                <Save className="w-3.5 h-3.5" /> Lưu phản hồi
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isTargetTeacher ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">Kho Đề Thi</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{tests.length}</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{publicTests.length} đề công khai</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">Bài Đã Chấm</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalGradedByTeacher}</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Writing &amp; Nhận xét</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">Phòng Đấu Game</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalActiveRooms}</p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">PIN hiện tại: {currentRoomPin}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">Thành Viên Lớp</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {allMembers.filter(m => m.role !== 'teacher').length}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Học viên đang theo học</span>
              </div>
            </div>
          </div>

          {/* Contact & Support Info */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
              Thông Tin Liên Hệ &amp; Hỗ Trợ Học Viên
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <a
                href={BRAND_INFO.phoneHref}
                className="p-4 rounded-2xl bg-[#EDFFFD] dark:bg-teal-500/10 border border-[#B5F5F1] dark:border-teal-500/30 hover:border-[#007A7A] transition flex items-start gap-3"
              >
                <Phone className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Hotline / Zalo</p>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{BRAND_INFO.phoneDisplay}</p>
                </div>
              </a>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#F25220] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Cơ Sở Giảng Dạy</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{BRAND_INFO.address}</p>
                </div>
              </div>
              <a
                href={BRAND_INFO.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 hover:border-blue-500 transition flex items-start gap-3"
              >
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Facebook Fanpage</p>
                  <p className="font-bold text-blue-700 dark:text-blue-300 mt-0.5 truncate flex items-center gap-1">
                    {BRAND_INFO.facebookHandle} <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
              <a
                href={BRAND_INFO.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:border-amber-500 transition flex items-start gap-3"
              >
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Blog Tài Liệu IELTS</p>
                  <p className="font-bold text-amber-700 dark:text-amber-300 mt-0.5 truncate flex items-center gap-1">
                    luyenthiieltsnhatrang <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Public Exams Showcase */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
                  Đề Thi Thử IELTS Đang Phát Hành ({publicTests.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bộ đề luyện thi chuẩn máy tính do giáo viên biên soạn và cập nhật.
                </p>
              </div>
              {isTeacherViewer && (
                <button
                  type="button"
                  onClick={() => setView('TEACHER_DASHBOARD')}
                  className="px-4 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition"
                >
                  Quản Lý Kho Đề →
                </button>
              )}
            </div>
            {publicTests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Hiện chưa có đề thi công khai nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTests.map(t => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {t.description || 'Đề thi thử IELTS 3 kỹ năng chuẩn quốc tế.'}
                      </p>
                    </div>
                    {startExam && (
                      <button
                        type="button"
                        onClick={() => startExam(t.id)}
                        className="w-full py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Làm Đề Này
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 4 Summary Metric Cards (Student Profile) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Tổng Số Lần Thi</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalAttempts} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">lần</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Band Cao Nhất</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{highestBand ?? '-'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="p-3 bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] rounded-xl">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Điểm Overall Trung Bình</p>
                <p className="text-2xl font-black text-[#007A7A] dark:text-[#1EE1D6]">{overallAvg ?? '-'}</p>
                {totalAttempts > 0 && (
                  <span className="text-[11px] block font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    L: {avgListening ?? '-'} • R: {avgReading ?? '-'} • W: {avgWriting ?? 'Chờ'}
                  </span>
                )}
              </div>
            </div>

            {isTeacherViewer ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Chống Gian Lận (Tab)</p>
                  <p className={`text-xl font-black ${avgTabSwitches <= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {avgTabSwitches <= 1 ? 'An toàn' : 'Cần chú ý'}
                    <span className="text-xs block font-normal text-slate-500 dark:text-slate-400">TB {avgTabSwitches} lần/bài</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Mục Tiêu Band</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    Band {student.targetBand || '8.0'}
                  </p>
                  <span className="text-[11px] block font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    {highestBand && highestBand >= (student.targetBand || 8.0)
                      ? 'Đã chạm mốc mục tiêu'
                      : highestBand
                        ? `Cần thêm ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band`
                        : 'Luyện tập đều đặn mỗi ngày'}
                  </span>
                </div>
              </div>
            )}
          </div>

      {/* SECTION 1: TIẾN TRÌNH & ĐỘT PHÁ ĐIỂM SỐ QUA CÁC LẦN THI (SCORE PROGRESSION TIMELINE) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
              Tiến Trình & Đột Phá Điểm Số Qua Các Lần Thi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theo dõi sự thay đổi band điểm qua từng bài thi từ lần đầu tiên đến lần thi gần nhất.
            </p>
          </div>

          {bandGrowth && Number(bandGrowth) > 0 && (
            <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Tăng trưởng: +{bandGrowth} Band Overall! 🚀
            </span>
          )}
        </div>

        {totalAttempts === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Học viên chưa có bài thi nào để phân tích tiến trình điểm.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chronological Trajectory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chronologicalAttempts.map((att, idx) => (
                <div
                  key={att.id}
                  className={`rounded-2xl p-5 border transition ${
                    idx === chronologicalAttempts.length - 1
                      ? 'bg-gradient-to-b from-[#EDFFFD]/70 to-white dark:from-[#003538]/40 dark:to-slate-900 border-[#B5F5F1] dark:border-teal-500/40 shadow-md ring-2 ring-[#007A7A]/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                      idx === chronologicalAttempts.length - 1
                        ? 'bg-[#007A7A] text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      Lần thi #{idx + 1} {idx === chronologicalAttempts.length - 1 ? '(Gần nhất)' : ''}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">{att.submittedAt}</span>
                  </div>

                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 line-clamp-1">{att.testTitle}</p>

                  <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-slate-700/70 mb-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Band Overall:</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                      {att.overallBand ?? 'Chờ'}
                    </span>
                  </div>

                  {/* Skill breakdown mini bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Listening
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores?.listening?.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${((att.scores?.listening?.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Reading
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores?.reading?.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${((att.scores?.reading?.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <PenTool className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {att.scores?.speaking ? 'Speaking AI' : 'Writing'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {att.scores?.speaking ? (att.scores.speaking.band ?? '-') : (att.scores?.writing?.overallBand ?? '-')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(((att.scores?.speaking ? att.scores.speaking.band : att.scores?.writing?.overallBand) || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {canInspectAttemptDetails && (
                    <button
                      onClick={() => {
                        setSelectedAttemptId(att.id);
                        setPreviousView('STUDENT_PROFILE');
                        setView('RESULT_VIEW');
                      }}
                      className="mt-4 w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2 rounded-xl transition shadow-sm"
                    >
                      Xem Chi Tiết Bài Làm →
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Skill Growth Highlights */}
            {firstAttempt && latestAttempt && totalAttempts > 1 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    key: 'listening',
                    label: 'Tiến Độ Listening',
                    Icon: Headphones,
                    iconWrap: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
                    latestCls: 'text-blue-600 dark:text-blue-400',
                    firstBand: firstAttempt.scores?.listening?.band,
                    latestBand: latestAttempt.scores?.listening?.band
                  },
                  {
                    key: 'reading',
                    label: 'Tiến Độ Reading',
                    Icon: BookOpen,
                    iconWrap: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                    latestCls: 'text-indigo-600 dark:text-indigo-400',
                    firstBand: firstAttempt.scores?.reading?.band,
                    latestBand: latestAttempt.scores?.reading?.band
                  },
                  {
                    key: 'writing',
                    label: 'Tiến Độ Writing',
                    Icon: PenTool,
                    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                    latestCls: 'text-emerald-600 dark:text-emerald-400',
                    firstBand: firstAttempt.scores?.writing?.overallBand,
                    latestBand: latestAttempt.scores?.writing?.overallBand
                  }
                ].map(({ key, label, Icon, iconWrap, latestCls, firstBand, latestBand }) => {
                  const hasFirst = typeof firstBand === 'number';
                  const hasLatest = typeof latestBand === 'number';
                  const delta = hasFirst && hasLatest ? latestBand - firstBand : null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`p-2.5 ${iconWrap} rounded-xl font-bold text-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">{label}</p>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {hasFirst ? `Band ${firstBand}` : 'Chờ chấm'} →{' '}
                          <b className={latestCls}>{hasLatest ? `Band ${latestBand}` : 'Chờ chấm'}</b>
                          {delta !== null && (
                            <span
                              className={`text-xs font-bold ml-1.5 ${
                                delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : delta < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              ({delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: BẢNG LỊCH SỬ CHI TIẾT TẤT CẢ CÁC LẦN THI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Lịch Sử Chi Tiết Từng Lần Thi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danh sách các bài thi đã hoàn thành của học viên {student.name}.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Tổng cộng: {studentAttempts.length} bài thi</span>
        </div>

        {studentAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Chưa có dữ liệu bài thi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Đề Thi</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                  <th className="px-6 py-3.5 text-center">Listening</th>
                  <th className="px-6 py-3.5 text-center">Reading</th>
                  <th className="px-6 py-3.5 text-center">Writing</th>
                  <th className="px-6 py-3.5 text-center">Overall Band</th>
                  {isTeacherViewer && (
                    <th className="px-6 py-3.5 text-center">Gian Lận (Tab)</th>
                  )}
                  {canInspectAttemptDetails && (
                    <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentAttempts.map((att, idx) => {
                  const risk = isTeacherViewer ? getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs) : null;
                  const extSignals = isTeacherViewer ? countExtensionCheatSignals(att.antiCheatLogs) : 0;
                  const RiskIcon = risk?.icon;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{att.testTitle}</p>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {att.id} • Lần thi #{studentAttempts.length - idx}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores?.listening?.band ?? '-'}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">({att.scores?.listening?.raw || 0}/{att.scores?.listening?.total || 0} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores?.reading?.band ?? '-'}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">({att.scores?.reading?.raw || 0}/{att.scores?.reading?.total || 0} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.scores?.speaking ? (
                          <>
                            <span className="font-bold text-[#570DF8] dark:text-[#C4B5FD]">Spk {att.scores.speaking.band ?? '-'}</span>
                            <span className="text-[11px] text-slate-400 block font-normal">Speaking AI</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores?.writing?.overallBand ?? (att.testMode === 'single_skill' ? '-' : 'Chờ chấm')}</span>
                            <span className="text-[11px] text-slate-400 block font-normal">T1: {att.scores?.writing?.task1Band ?? '-'} | T2: {att.scores?.writing?.task2Band ?? '-'}</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
                          {att.overallBand ?? 'Chờ'}
                        </span>
                      </td>
                      {isTeacherViewer && risk && (
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${risk.color}`}>
                              <RiskIcon className="w-3 h-3" />
                              {risk.label} ({att.tabSwitchCount})
                            </span>
                            {extSignals > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Extension / Bypass: {extSignals}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {canInspectAttemptDetails && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('STUDENT_PROFILE');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN (Bảo mật riêng giữa GV & HS) */}
      {canSeeTeacherNotes && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Đánh Giá & Nhận Xét Của Giáo Viên Quản Nhiệm
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lời khuyên, phân tích điểm yếu và lộ trình rèn luyện cá nhân hóa.</p>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full font-bold">
            Ms. Như (Giáo Viên Phụ Trách)
          </span>
        </div>

        {isTeacherViewer ? (
          <div className="space-y-4">
            <textarea
              rows={4}
              value={tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '')}
              onChange={e => setTempNoteText(e.target.value)}
              placeholder="Nhập nhận xét chi tiết về quá trình học tập, các điểm cần khắc phục và định hướng cho học viên này..."
              className="w-full p-4 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const textToSave = tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '');
                  setTeacherNotes(prev => ({ ...prev, [activeUsername]: textToSave }));
                  dispatchSyncAction('UPSERT_NOTE', { username: activeUsername, text: textToSave });
                  showToast('Đã lưu nhận xét hồ sơ học viên thành công!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu Nhận Xét Hồ Sơ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200/80 dark:border-amber-500/30">
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
              {teacherNotes[activeUsername] || 'Chưa có ghi chú nhận xét nào từ giáo viên. Hãy làm thêm các bài thi thử để giáo viên đánh giá năng lực.'}
            </p>
          </div>
        )}
      </div>
      )}
        </>
      )}

      {/* SECTION 4: THÀNH TÍCH ĐẤU TRƯỜNG TỪ VỰNG CHICKEN INVADERS */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-purple-800/80">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-pink-400" />
              Thành Tích Đấu Trường Game Từ Vựng (IELTS Chicken Invaders)
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">Kết quả rèn luyện phản xạ từ vựng, ngữ nghĩa và chính tả qua game 3 vòng.</p>
          </div>
          <button
            onClick={() => {
              if (isTeacherViewer) {
                handleTeacherOpenLobby(currentRoomPin);
              } else {
                openStudentGamePortal();
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Vào Sảnh Chờ Đấu Trường
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Điểm Kỷ Lục Phòng Game</p>
            <p className="text-2xl font-black text-amber-300 font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.score} pts` : '0 pts'}
            </p>
          </div>

          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Cấp Độ Cao Nhất Đạt Được</p>
            <p className="text-sm font-extrabold text-cyan-300 mt-1">
              {playerGameRecord?.status || 'Chưa tham gia trận đấu nào'}
            </p>
          </div>

          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Chuỗi Combo Từ Đúng</p>
            <p className="text-2xl font-black text-pink-400 font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.streak}x Combo` : '0x Combo'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
