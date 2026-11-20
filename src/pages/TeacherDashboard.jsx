import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Copy,
  Crown,
  Download,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  Infinity as InfinityIcon,
  Key,
  Layers,
  Lock,
  Mail,
  Megaphone,
  Mic,
  Music,
  PenTool,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
  Volume2,
  Wifi,
  X
} from 'lucide-react';
import {
  DEFAULT_VOCAB_TEXT,
  evaluateSpeakingDailyCompliance,
  evaluateTestSchedule,
  formatDurationVi,
  formatViDateTime,
  getAssignedClassNames,
  getEffectiveTestHashtags,
  getListeningTracks,
  getReadingPassages,
  getSpeakingQuestionItems,
  getUserClassIds,
  normalizeExamConfig,
  normalizeSpeakingSection
} from '../constants/seedData';
import {
  formatVndCurrency,
  getRealExamComboMeta,
  getRealExamCredits,
  getTestPurchasePriceVnd,
  hasActiveAieoVip,
  hasCustomCoverPermission,
  normalizePaymentConfig,
  resolveVisibleTitleBadge
} from '../constants/profileCustomization';
import { countExtensionCheatSignals, exportAttemptsToCsv, getRiskAssessment, normalizeRoomObject } from '../utils/examHelpers';
import AnimalPilotAvatar from '../components/common/AnimalPilotAvatar';
import ListPaginationBar, { paginateItems } from '../components/common/ListPaginationBar';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';
import ClassManagerTab from '../components/teacher/ClassManagerTab';

export default function TeacherDashboard({
  aiConfigured = false,
  attempts,
  classesDb = {},
  copiedRoomPin,
  currentRoomPin,
  currentUser,
  customTitles = [],
  expandedTeacherTestId,
  gradingFilters,
  handleBulkDeleteAccounts,
  handleCopyInviteLink,
  handleCreateNotification,
  handleDeleteAccount,
  handleDeleteAttempt,
  handleDeleteNotification,
  handleDeleteRoom,
  handleDeleteTest,
  handleDuplicateTest,
  handleKickLobbyPlayer,
  handlePurgeOrphanAttempts,
  handleTeacherOpenLobby,
  handleTeacherResetLobby,
  initGameCampaign,
  mailConfigured = false,
  notifications = [],
  onAssignTestClasses,
  onCreateSkillForClass,
  onCreateTestForClass,
  onDeleteClass,
  onNotifyMissingDaily,
  onOpenAdminTitleManager,
  onOpenApiKeyModal,
  onOpenMailConfig,
  onOpenPaymentConfig = null,
  onToggleUserCoverUnlock = null,
  onToggleUserSubscription = null,
  onUpdateClassMembers,
  onUpsertClass,
  openExamBuilder,
  openMemberProfile,
  openSingleSkillBuilder,
  openTeacherGradingModal,
  paymentConfig = null,
  roomsDb,
  serverClockOffsetMs = 0,
  setAddStudentMode,
  setCopiedRoomPin,
  setCurrentRoomPin,
  setCustomVocabInput,
  setEditingStudentAccount,
  setEditingTargetUser,
  setExpandedTeacherTestId,
  setGradingFilters,
  setPreviousView,
  setSelectedAttemptId,
  setShowAddStudentModal,
  setShowCreateRoomModal,
  setShowVocabModal,
  setStudentPasswordDraft,
  setStudentSearchQuery,
  setTeacherHubTab,
  setView,
  showToast,
  startExam,
  studentSearchQuery,
  teacherHubTab,
  tests,
  toggleTestAllowViewAnswers,
  toggleTestAntiCheat,
  toggleTestExamMode,
  toggleTestVisibility,
  updateTestQuickDuration,
  updateTestQuickTitle,
  usersDb
}) {
  const [accountRoleFilter, setAccountRoleFilter] = useState('all');
  const [fullExamCategoryFilter, setFullExamCategoryFilter] = useState('all');
  const [exerciseSkillFilter, setExerciseSkillFilter] = useState('all');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [onlyIncompleteFilter, setOnlyIncompleteFilter] = useState(false);
  const [completionModalTestId, setCompletionModalTestId] = useState(null);
  const [completionFilter, setCompletionFilter] = useState('missing');
  const [completionSearch, setCompletionSearch] = useState('');
  const [renamingTestId, setRenamingTestId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [testsPage, setTestsPage] = useState(1);
  const [exercisesPage, setExercisesPage] = useState(1);
  const [gradingPage, setGradingPage] = useState(1);
  const [accountsPage, setAccountsPage] = useState(1);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    testId: '',
    roomPin: '',
    targetClassIds: []
  });
  const [notifySending, setNotifySending] = useState(false);

  const validSelectedUsernames = selectedUsernames.filter(uname => {
    const acc = usersDb?.[uname];
    if (!acc) return false;
    if (acc.isSuperAdmin || uname === 'tuanpro123s' || uname === currentUser?.username) return false;
    return true;
  });

  const orphanAttemptsCount = (attempts || []).filter(
    att => att?.studentId && !usersDb?.[att.studentId]
  ).length;

  const handleCommitInlineRename = (testId) => {
    const ok = updateTestQuickTitle?.(testId, renameDraft);
    if (ok !== false) {
      setRenamingTestId(null);
      setRenameDraft('');
    }
  };

  const isViewerSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const allAccounts = Object.values(usersDb || {})
    .filter(u => {
      if (!u) return false;
      if (isViewerSuperAdmin) return true;
      return !u.isSuperAdmin && !u.hiddenFromTeacher && u.username !== 'tuanpro123s';
    })
    .sort((a, b) => {
      if (Boolean(a.isSuperAdmin) !== Boolean(b.isSuperAdmin)) return a.isSuperAdmin ? -1 : 1;
      if (a.role !== b.role) return a.role === 'teacher' ? -1 : 1;
      return (a.name || a.username || '').localeCompare(b.name || b.username || '');
    });
  const teacherAccountsCount = allAccounts.filter(u => u.role === 'teacher' && !u.isSuperAdmin).length;
  const studentAccounts = allAccounts.filter(u => u.role === 'student');
  const studentAccountsCount = studentAccounts.length;
  const normalizedPayCfg = normalizePaymentConfig(paymentConfig || {});
  const qrConfigured = Boolean(normalizedPayCfg.customQrUrl || (normalizedPayCfg.bankCode && normalizedPayCfg.accountNumber));
  const coverPriceLabel = formatVndCurrency(normalizedPayCfg.coverUnlockPrice);
  const pendingCoverRequestCount = studentAccounts.filter(
    u => !hasCustomCoverPermission(u) && Number(u.coverUnlockRequestedAt) > 0
  ).length;
  const filteredAccounts = allAccounts.filter(u => {
    if (accountRoleFilter === 'cover_pending') {
      if (u.role !== 'student' || hasCustomCoverPermission(u) || !(Number(u.coverUnlockRequestedAt) > 0)) {
        return false;
      }
    } else if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) {
      return false;
    }
    const q = studentSearchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const getTestCompletionStats = (testId) => {
    const targetTest = (tests || []).find(t => t.id === testId);
    const targetCfg = normalizeExamConfig(targetTest);
    const assignedClassSet = new Set(targetCfg.assignedClassIds || []);
    const eligibleStudents =
      assignedClassSet.size > 0
        ? studentAccounts.filter(stu =>
            getUserClassIds(classesDb, stu.username).some(cid => assignedClassSet.has(cid))
          )
        : studentAccounts;
    const testAttempts = (attempts || []).filter(a => a.testId === testId);
    const byStudent = new Map();
    for (const att of testAttempts) {
      const keys = [att.studentId, att.studentUsername].filter(Boolean);
      for (const k of keys) {
        if (!byStudent.has(k)) byStudent.set(k, []);
        byStudent.get(k).push(att);
      }
    }
    const doneList = [];
    const missingList = [];
    for (const stu of eligibleStudents) {
      const stuAttempts = byStudent.get(stu.username) || [];
      const uniqueMap = new Map();
      stuAttempts.forEach(a => uniqueMap.set(a.id, a));
      const list = Array.from(uniqueMap.values());
      if (list.length > 0) {
        const latestAttempt = list[0];
        const numericBands = list
          .map(a => a.overallBand ?? a.scores?.speaking?.band)
          .filter(b => typeof b === 'number' && !Number.isNaN(b));
        const bestBand = numericBands.length > 0 ? Math.max(...numericBands) : null;
        doneList.push({
          account: stu,
          attemptCount: list.length,
          latestAttempt,
          bestBand,
          hasPendingGrade: list.some(a => !a.teacherGraded)
        });
      } else {
        missingList.push({ account: stu });
      }
    }
    return {
      totalStudents: eligibleStudents.length,
      doneList,
      missingList,
      totalSubmissions: testAttempts.length
    };
  };

  const handleOpenCompletionModal = (testId) => {
    const stats = getTestCompletionStats(testId);
    setCompletionFilter(stats.missingList.length > 0 ? 'missing' : 'all');
    setCompletionSearch('');
    setCompletionModalTestId(testId);
  };

  const handleCopyMissingList = (item, missingList) => {
    if (!missingList.length) {
      showToast?.('Tất cả học sinh trong lớp đã hoàn thành bài này!', 'info');
      return;
    }
    const lines = missingList.map((m, idx) => `${idx + 1}. ${m.account.name || m.account.username} (@${m.account.username})`);
    const text = `Danh sách học sinh CHƯA LÀM "${item.title}" (${missingList.length} bạn):\n${lines.join('\n')}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast?.(`Đã sao chép danh sách ${missingList.length} học sinh chưa làm!`, 'success'),
        () => showToast?.('Không thể truy cập clipboard trình duyệt.', 'error')
      );
    }
  };

  const fullExamTests = (tests || []).filter(t => normalizeExamConfig(t).testMode !== 'single_skill');
  const skillExercises = (tests || []).filter(t => normalizeExamConfig(t).testMode === 'single_skill');
  const publicFullExamsCount = fullExamTests.filter(t => normalizeExamConfig(t).visibility !== 'private').length;
  const pendingGradingCount = (attempts || []).filter(a => !a.teacherGraded).length;
  const speakingDailyCompliance = evaluateSpeakingDailyCompliance({
    tests,
    attempts,
    usersDb,
    classesDb,
    viewerUser: currentUser,
    nowMs: Date.now() + (serverClockOffsetMs || 0)
  });
  const itemQuery = itemSearchQuery.trim().toLowerCase();

  const completionStatsById = {};
  (tests || []).forEach(t => {
    if (t?.id) completionStatsById[t.id] = getTestCompletionStats(t.id);
  });

  const matchesItemFilters = (item) => {
    if (itemQuery && !(item.title || '').toLowerCase().includes(itemQuery)) return false;
    if (onlyIncompleteFilter && (completionStatsById[item.id]?.missingList?.length || 0) === 0) return false;
    return true;
  };

  const realExamFullTests = fullExamTests.filter(t => normalizeExamConfig(t).examCategory !== 'periodic_mock');
  const periodicMockFullTests = fullExamTests.filter(t => normalizeExamConfig(t).examCategory === 'periodic_mock');
  const fullExamByCategory = fullExamCategoryFilter === 'periodic_mock'
    ? periodicMockFullTests
    : fullExamCategoryFilter === 'real_exam'
      ? realExamFullTests
      : fullExamTests;
  const filteredFullExamTests = fullExamByCategory.filter(matchesItemFilters);
  const skillFilteredList = exerciseSkillFilter === 'all'
    ? skillExercises
    : exerciseSkillFilter === 'writing_task1'
      ? skillExercises.filter(t => {
          const c = normalizeExamConfig(t);
          return c.focusSkill === 'writing' && c.writingTaskScope === 'task1';
        })
      : exerciseSkillFilter === 'writing_task2'
        ? skillExercises.filter(t => {
            const c = normalizeExamConfig(t);
            return c.focusSkill === 'writing' && c.writingTaskScope !== 'task1';
          })
        : skillExercises.filter(t => normalizeExamConfig(t).focusSkill === exerciseSkillFilter);
  const filteredSkillExercises = skillFilteredList.filter(matchesItemFilters);

  const SKILL_EXERCISE_BUTTONS = [
    { id: 'speaking_daily', skill: 'speaking', subOpts: { dailySubCategory: 'speaking_daily' }, label: '+ Daily Speaking', shortLabel: 'Daily Speaking', icon: Mic, cls: 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30 hover:bg-[#007A7A] hover:text-white' },
    { id: 'speaking_forecast', skill: 'speaking', subOpts: { dailySubCategory: 'speaking_forecast' }, label: '+ Cày Forecast', shortLabel: 'Cày Forecast', icon: Sparkles, cls: 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-600 hover:text-white' },
    { id: 'reading', skill: 'reading', subOpts: { dailySubCategory: 'shw_1' }, label: '+ Reading (SHW 1-14)', shortLabel: 'Reading', icon: BookOpen, cls: 'bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-700 hover:text-white' },
    { id: 'listening', skill: 'listening', subOpts: { dailySubCategory: 'listening_shw' }, label: '+ Listening', shortLabel: 'Listening', icon: Headphones, cls: 'bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 hover:text-white' },
    { id: 'writing_task1', skill: 'writing', subOpts: { writingTaskScope: 'task1', dailySubCategory: 'w1_map' }, label: '+ Writing Task 1 (W1)', shortLabel: 'Writing W1', icon: PenTool, cls: 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-[#047857] hover:text-white' },
    { id: 'writing_task2', skill: 'writing', subOpts: { writingTaskScope: 'task2', dailySubCategory: 'w2_essay' }, label: '+ Writing Task 2 (W2)', shortLabel: 'Writing W2', icon: PenTool, cls: 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-[#047857] hover:text-white' }
  ];

  const renderManagementItemCard = (t) => {
    const cfg = normalizeExamConfig(t);
    const isExercise = cfg.testMode === 'single_skill';
    const isPrivate = cfg.visibility === 'private';
    const isExpanded = expandedTeacherTestId === t.id;
    const entityLabel = isExercise ? 'bài tập' : 'đề thi';
    const stats = completionStatsById[t.id] || getTestCompletionStats(t.id);
    const completionPct = stats.totalStudents > 0
      ? Math.round((stats.doneList.length / stats.totalStudents) * 100)
      : 0;
    const toggleExpandCard = () => setExpandedTeacherTestId(prev => (prev === t.id ? null : t.id));

    return (
      <div
        key={t.id}
        className={`bg-white dark:bg-slate-900 rounded-lg border transition-colors ${
          isExpanded
            ? 'border-[#007A7A] dark:border-[#1EE1D6]/45 ring-2 ring-[#007A7A]/12 p-5 sm:p-6'
            : 'border-slate-200 dark:border-slate-800 hover:border-[#007A7A]/60 dark:hover:border-slate-700'
        }`}
      >
        {/* Clean Header Row with Non-Nested Sibling Interactive Controls (WCAG A11y safe) */}
        <div className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isExpanded ? '' : 'px-5 py-4'}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {renamingTestId === t.id ? (
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[220px]">
                <input
                  type="text"
                  autoFocus
                  aria-label={`Tên ${entityLabel} mới`}
                  value={renameDraft}
                  onChange={e => setRenameDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitInlineRename(t.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setRenamingTestId(null);
                      setRenameDraft('');
                    }
                  }}
                  placeholder={`Nhập tên ${entityLabel} mới...`}
                  className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-[#007A7A] dark:border-[#1EE1D6] text-xs sm:text-sm font-bold text-[#0F172B] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleCommitInlineRename(t.id)}
                  className="px-3 py-1.5 min-h-[34px] rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-1"
                  title="Lưu tên mới (Enter)"
                >
                  <Check className="w-3.5 h-3.5" /> Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingTestId(null);
                    setRenameDraft('');
                  }}
                  aria-label="Hủy đổi tên"
                  className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-[#F1F5F9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                  title="Hủy (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleExpandCard}
                  aria-expanded={isExpanded}
                  className="flex-1 min-w-0 flex flex-wrap items-center gap-2 text-left py-1 rounded-lg hover:opacity-90 transition"
                >
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      isExercise
                        ? 'bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30'
                        : cfg.examCategory === 'periodic_mock'
                          ? 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                          : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700'
                    }`}
                  >
                    {isExercise
                      ? `DAILY • ${
                          cfg.focusSkill === 'speaking'
                            ? (cfg.dailySubCategory === 'speaking_forecast' ? 'FORECAST SPEAKING' : 'DAILY SPEAKING')
                            : cfg.focusSkill === 'writing'
                              ? (cfg.writingTaskScope === 'task1' ? 'WRITING TASK 1 (W1)' : 'WRITING TASK 2 (W2)')
                              : (cfg.focusSkill || 'skill').toUpperCase()
                        }`
                      : `${cfg.examCategory === 'periodic_mock' ? 'MOCK ĐỊNH KỲ' : 'THỰC CHIẾN'} • ${formatVndCurrency(getTestPurchasePriceVnd(t))}`}
                  </span>
                  {isExercise && cfg.focusSkill === 'speaking' && (() => {
                    const spMeta = normalizeSpeakingSection(t.speaking);
                    if (spMeta.speakingTrack === 'daily') {
                      return (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md border bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/30 shrink-0">
                          DAILY {spMeta.dailyDate ? `• ${spMeta.dailyDate}` : ''}
                        </span>
                      );
                    }
                    if (spMeta.speakingTrack === 'exam_room' || cfg.examPurpose === 'real_exam') {
                      return (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md border bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border-rose-200 dark:border-rose-500/30 shrink-0">
                          THI THẬT {spMeta.hasRoomPassword || spMeta.roomPassword || cfg.hasExamPassword || cfg.examPassword ? '(Có Pass)' : ''}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const spMeta = cfg.focusSkill === 'speaking' ? normalizeSpeakingSection(t.speaking) : null;
                    const activePass = String(spMeta?.roomPassword || cfg.examPassword || '').trim();
                    const hasPassFlag = Boolean(activePass || spMeta?.hasRoomPassword || cfg.hasExamPassword);
                    if (!hasPassFlag) return null;
                    return (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 inline-flex items-center gap-1 shrink-0">
                        <Key className="w-3 h-3" />
                        Pass: {activePass || 'Đã bật'}
                      </span>
                    );
                  })()}
                  <h2 className="font-bold text-[#0F172B] dark:text-white text-sm sm:text-base leading-snug">
                    {t.title}
                  </h2>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenamingTestId(t.id);
                    setRenameDraft(t.title || '');
                  }}
                  title={`Đổi nhanh tên ${entityLabel} ngay tại đây`}
                  className="min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-teal-500/20 text-[#0F172B] dark:text-slate-300 hover:text-[#0F766E] dark:hover:text-[#1EE1D6] border border-[#CBD5E1] dark:border-slate-700 transition inline-flex items-center gap-1 shrink-0"
                >
                  <Edit className="w-3 h-3" /> Đổi tên
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
            {cfg.scheduleMode !== 'flexible' && cfg.dueAt && (() => {
              const sched = evaluateTestSchedule(cfg);
              return (
                <span
                  className={`min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${
                    sched.lockedBySchedule
                      ? 'bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {cfg.scheduleMode === 'deadline_lock' ? 'Khóa sau ' : 'Hạn '}
                  {formatViDateTime(cfg.dueAt)}
                </span>
              );
            })()}
            <button
              type="button"
              onClick={() => handleOpenCompletionModal(t.id)}
              title="Kiểm tra học sinh đã làm và chưa làm bài này"
              className={`min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                stats.totalStudents === 0
                  ? 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  : stats.missingList.length > 0
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                  : 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
              }`}
            >
              {stats.totalStudents === 0 ? (
                <>
                  <Users className="w-3 h-3" /> 0 HS
                </>
              ) : stats.missingList.length > 0 ? (
                <>
                  <AlertCircle className="w-3 h-3" /> Chưa làm: {stats.missingList.length}/{stats.totalStudents} HS
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Đủ {stats.doneList.length}/{stats.totalStudents} HS
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleTestVisibility(t.id)}
              title="Bấm để chuyển Công khai / Chỉ mình tôi thấy"
              className={`min-h-[32px] text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                isPrivate
                  ? 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                  : 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
              }`}
            >
              {isPrivate ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {isPrivate ? 'Chỉ mình tôi' : 'Công khai'}
            </button>

            <button
              type="button"
              onClick={toggleExpandCard}
              aria-label={isExpanded ? `Thu gọn ${t.title}` : `Mở rộng ${t.title}`}
              aria-expanded={isExpanded}
              className="p-1.5 min-h-[32px] min-w-[32px] rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center justify-center transition"
            >
              <ChevronDown
                className={`w-4 h-4 text-[#475569] dark:text-slate-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-[#0F766E] dark:text-[#1EE1D6]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (() => {
          const listeningTracks = getListeningTracks(t.listening);
          const listeningTracksCount = listeningTracks.length;
          const hasListeningAudio = listeningTracks.some(tr => !!tr.audioUrl);
          const hasListeningImg = listeningTracks.some(tr => !!tr.imageUrl);
          const passagesCount = getReadingPassages(t.reading).length;
          const hasReadingImg = getReadingPassages(t.reading).some(p => !!p.imageUrl);

          return (
            <div className="mt-4 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {isExercise ? (
                    <span className="text-xs bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] font-bold px-2.5 py-1 rounded-md border border-[#B5F5F1] dark:border-teal-500/30">
                      {cfg.focusSkill === 'speaking'
                        ? `Speaking: ${getSpeakingQuestionItems(t.speaking, 'all').length} câu (Part 1·2·3)`
                        : cfg.focusSkill === 'listening'
                        ? `Bài tập Listening: ${t.listening?.questions?.length || 0} câu (${cfg.durations.listening}p)`
                        : cfg.focusSkill === 'reading'
                        ? `Bài tập Reading: ${t.reading?.questions?.length || 0} câu (${cfg.durations.reading}p)`
                        : `${cfg.writingTaskScope === 'task1' ? 'Bài tập Writing Task 1 (W1)' : 'Bài tập Writing Task 2 (W2)'} (${cfg.durations.writing}p)`}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 font-bold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/30">
                        Listening: {t.listening?.questions?.length || 0} • Reading: {t.reading?.questions?.length || 0} • Speaking: {getSpeakingQuestionItems(t.speaking, 'all').length}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 font-bold px-2.5 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-[#475569]" /> {cfg.durations.listening}p L • {cfg.durations.reading}p R • {cfg.durations.writing}p W • {cfg.durations.speaking}p S
                      </span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 font-bold px-2.5 py-1 rounded-md">
                    {cfg.maxAttempts === 0 ? <InfinityIcon className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {cfg.maxAttempts === 0 ? 'Luyện tự do' : `Tối đa ${cfg.maxAttempts} lần`}
                  </span>
                  {!isExercise && cfg.sequentialMode && (
                    <span className="text-xs bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 font-bold px-2.5 py-1 rounded-md">
                      Tuần tự: {cfg.order.map(s => s[0].toUpperCase()).join('→')}
                    </span>
                  )}
                  {(!isExercise || cfg.focusSkill === 'listening') && (
                    hasListeningAudio ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 font-bold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/30">
                        <Music className="w-3 h-3" /> {listeningTracksCount > 1 ? `${listeningTracksCount} chủ đề nghe` : 'Đã đính kèm Audio'}
                      </span>
                    ) : listeningTracksCount > 1 || hasListeningImg ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 font-bold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/30">
                        <Headphones className="w-3 h-3" /> {listeningTracksCount} chủ đề nghe {hasListeningImg ? '(có ảnh)' : '(AI Voice)'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-400 font-medium px-2.5 py-1 rounded-md">
                        <Volume2 className="w-3 h-3" /> Dùng AI Voice (TTS)
                      </span>
                    )
                  )}
                  {(!isExercise || cfg.focusSkill === 'reading') && (hasReadingImg || passagesCount > 1) && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 font-bold px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                      <ImageIcon className="w-3 h-3" /> {passagesCount} bài Reading
                    </span>
                  )}
                  {(!isExercise || cfg.focusSkill === 'writing') && t.writing?.task1?.imageUrl && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 font-bold px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      <BarChart2 className="w-3 h-3" /> Có biểu đồ Task 1
                    </span>
                  )}
                  {getAssignedClassNames(cfg.assignedClassIds, classesDb).length > 0 ? (
                    getAssignedClassNames(cfg.assignedClassIds, classesDb).map(cls => (
                      <span
                        key={cls.id}
                        className="inline-flex items-center gap-1 text-xs bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 font-bold px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-500/30"
                      >
                        <Layers className="w-3 h-3" /> Lớp: {cls.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 font-bold px-2.5 py-1 rounded-md">
                      <Globe className="w-3 h-3" /> Tất cả lớp
                    </span>
                  )}
                </div>
                {(() => {
                  const tags = getEffectiveTestHashtags(t);
                  if (!tags.length) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tags.map(item => (
                        <span
                          key={item.tag}
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            item.kind === 'real_exam'
                              ? 'bg-[#991B1B] text-white border-[#EF4444]'
                              : item.kind === 'password'
                              ? 'bg-indigo-700 text-white border-indigo-500'
                              : item.kind === 'daily'
                              ? 'bg-[#C2410C] text-white border-orange-500'
                              : item.kind === 'forecast'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                              : 'bg-[#EDFFFD] text-[#0F766E] border-[#B5F5F1] dark:bg-teal-500/15 dark:text-[#1EE1D6] dark:border-teal-500/30'
                          }`}
                        >
                          {item.tag}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                {t.description && (
                  <p className="text-sm text-[#475569] dark:text-slate-400 leading-relaxed max-w-2xl">{t.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#0F172B] dark:text-[#1EE1D6] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" /> {isExercise ? 'Thời gian làm bài (phút)' : 'Thời gian từng phần (phút)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openExamBuilder(t, 'general')}
                      className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline"
                    >
                      Cài đặt chi tiết →
                    </button>
                  </div>
                  <div className={`grid gap-1.5 ${cfg.order.length === 1 ? 'grid-cols-1 max-w-[200px]' : 'grid-cols-3'}`}>
                    {cfg.order.map((sId, sIdx) => (
                      <div key={sId} className="bg-white dark:bg-slate-900 rounded-md p-2 text-center">
                        <span className="block text-xs font-bold text-[#475569] dark:text-slate-400 uppercase">
                          {cfg.order.length > 1 ? `${sIdx + 1}. ` : ''}{sId === 'listening' ? 'Nghe' : sId === 'reading' ? 'Đọc' : sId === 'speaking' ? 'Nói AI' : 'Viết'}
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <input
                            key={`${t.id}-${sId}-${cfg.durations[sId]}`}
                            type="number"
                            min={1}
                            max={180}
                            defaultValue={cfg.durations[sId]}
                            onBlur={e => {
                              const parsed = Math.max(1, Math.min(180, Number(e.target.value) || cfg.durations[sId]));
                              e.target.value = String(parsed);
                              if (parsed !== cfg.durations[sId]) {
                                updateTestQuickDuration(t.id, sId, parsed);
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            title="Nhập số phút rồi bấm ra ngoài hoặc nhấn Enter để lưu"
                            className="w-12 px-1 py-0.5 text-center bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-extrabold text-[#0F172B] dark:text-white"
                          />
                          <span className="text-xs text-[#475569] font-bold">p</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isExercise && (
                    <p className="text-xs text-[#475569] dark:text-slate-300 font-medium">
                      {cfg.sequentialMode
                        ? 'Hết giờ từng phần sẽ tự động chuyển sang phần tiếp theo.'
                        : 'Đang cho phép chuyển tự do giữa các phần.'}
                    </p>
                  )}
                </div>

                {/* 4 Quick Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0F172B] dark:text-slate-100">Hiển thị {entityLabel} cho HS</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        {isPrivate ? 'Đang ẩn - HS chưa thấy' : 'Công khai - HS làm được'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestVisibility(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition flex-shrink-0 ${
                        isPrivate
                          ? 'bg-[#B45309] hover:bg-[#92400E] text-white'
                          : 'bg-[#047857] hover:bg-[#065F46] text-white'
                      }`}
                    >
                      {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      {isPrivate ? 'Đang Ẩn' : 'Công Khai'}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0F172B] dark:text-slate-100">Chế độ Luyện / Thi thật</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        {cfg.maxAttempts === 1
                          ? 'Thi thật: Chỉ làm 1 lần'
                          : cfg.maxAttempts === 0
                          ? 'Luyện tự do: Nhiều lần'
                          : `Giới hạn ${cfg.maxAttempts} lần`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestExamMode(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition flex-shrink-0 ${
                        cfg.maxAttempts === 1
                          ? 'bg-[#B91C1C] hover:bg-[#991B1B] text-white'
                          : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                      }`}
                    >
                      {cfg.maxAttempts === 1 ? 'Thi Thật' : cfg.maxAttempts === 0 ? 'Thi Thử' : `Tối đa ${cfg.maxAttempts}`}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0F172B] dark:text-slate-100">Xem đáp án đúng</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        {t.allowViewAnswers ? 'HS xem được sau khi nộp' : 'Đang ẩn đáp án đúng'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestAllowViewAnswers(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition flex-shrink-0 ${
                        t.allowViewAnswers
                          ? 'bg-[#047857] hover:bg-[#065F46] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[#0F172B] dark:text-slate-200'
                      }`}
                    >
                      {t.allowViewAnswers ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Đã Mở
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Đang Khóa
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0F172B] dark:text-slate-100">Chống gian lận (Ẩn với HS)</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        {cfg.antiCheatEnabled ? 'Đếm tab, khóa chuột phải & Extension' : 'Đang tắt - làm tự do'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestAntiCheat(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition flex-shrink-0 ${
                        cfg.antiCheatEnabled
                          ? 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[#0F172B] dark:text-slate-200'
                      }`}
                    >
                      {cfg.antiCheatEnabled ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Đang Bật
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Đang Tắt
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Class Student Completion Tracker Box */}
              <div className="p-3.5 sm:p-4 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-[#0F172B] dark:text-slate-100 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" />
                      Theo Dõi Học Sinh Làm Bài:
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300">
                      Đã làm: {stats.doneList.length}/{stats.totalStudents} HS
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        stats.missingList.length > 0
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-[#B91C1C] dark:text-rose-300'
                          : 'bg-[#F1F5F9] dark:bg-slate-700 text-[#334155] dark:text-slate-300'
                      }`}
                    >
                      Chưa làm: {stats.missingList.length} HS
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {stats.missingList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyMissingList(t, stats.missingList)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border border-[#FECACA] dark:border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy DS Chưa Làm
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCompletionModal(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Kiểm Tra Chi Tiết ({stats.totalStudents} HS)
                    </button>
                  </div>
                </div>

                {stats.totalStudents > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        completionPct === 100 ? 'bg-[#047857]' : 'bg-[#007A7A]'
                      }`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                )}

                {stats.totalStudents === 0 ? (
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    Chưa có tài khoản học sinh nào trong danh sách tài khoản.
                  </p>
                ) : stats.missingList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-[#B91C1C] dark:text-rose-300">Còn thiếu:</span>
                    {stats.missingList.slice(0, 6).map(({ account }) => (
                      <span
                        key={account.username}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 text-[#0F172B] dark:text-slate-200 font-semibold"
                      >
                        {account.name || account.username}
                      </span>
                    ))}
                    {stats.missingList.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompletionModal(t.id)}
                        className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-[#B91C1C] dark:text-rose-300 font-bold hover:underline"
                      >
                        +{stats.missingList.length - 6} bạn nữa...
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-[#065F46] dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tuyệt vời! 100% học sinh trong lớp đã làm bài này.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openExamBuilder(t, 'general')}
                    className="bg-white dark:bg-slate-800 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" /> Sửa Tên &amp; Cài Đặt Chung
                  </button>
                  <button
                    type="button"
                    onClick={() => openExamBuilder(t, isExercise && cfg.focusSkill ? cfg.focusSkill : 'reading')}
                    className="bg-white dark:bg-slate-800 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Soạn Câu Hỏi &amp; Nội Dung
                  </button>
                  <button
                    type="button"
                    onClick={() => startExam?.(t.id)}
                    className="bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 dark:hover:bg-teal-500/25 text-[#0F766E] dark:text-[#1EE1D6] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-[#B5F5F1] dark:border-teal-500/30"
                    title={`Mở giao diện làm bài như học sinh để kiểm tra ${entityLabel} (kể cả khi Đang Ẩn)`}
                  >
                    <Play className="w-3.5 h-3.5" /> {isExercise ? 'Làm Thử Bài Tập' : 'Làm Thử Đề Thi'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateTest(t)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#EFF6FF] dark:hover:bg-blue-500/15 text-[#334155] dark:text-slate-300 hover:text-[#1D4ED8] dark:hover:text-blue-300 border border-[#CBD5E1] dark:border-slate-700 transition"
                    title={`Nhân bản ${entityLabel} (Bản sao tự động ở chế độ Riêng tư)`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTest(t)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-[#B91C1C] dark:text-rose-400 border border-[#FECACA] dark:border-slate-700 transition"
                    title={`Xóa ${entityLabel} này`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedTeacherTestId(null)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 font-semibold transition"
                  >
                    Thu gọn
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const room = normalizeRoomObject(roomsDb[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', players: {} }, currentRoomPin);
  const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin));
  const lobbyPlayersList = Object.values(room.lobbyPlayers || {});
  const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);

  const navSections = [
    {
      title: 'Giảng Dạy & Đề Thi',
      items: [
        { id: 'tests', label: 'Thực Chiến & Mock', count: fullExamTests.length, icon: BookOpen },
        { id: 'skill_exercises', label: 'Daily Zone (Miễn Phí)', count: skillExercises.length, icon: Sparkles },
        {
          id: 'grading',
          label: 'Chấm Bài & Giám Sát',
          count: pendingGradingCount > 0 ? `${pendingGradingCount} chờ` : attempts.length,
          highlightCount: pendingGradingCount > 0,
          icon: PenTool
        }
      ]
    },
    {
      title: 'Lớp Học & Thành Viên',
      items: [
        { id: 'classes', label: 'Quản Lý Lớp Học', count: Object.keys(classesDb || {}).length, icon: Layers },
        { id: 'accounts', label: 'Tài Khoản Lớp', count: allAccounts.length, icon: Users },
        { id: 'game_room', label: 'Phòng Game PIN', count: `#${currentRoomPin}`, icon: Trophy }
      ]
    }
  ];

  const allNavItems = navSections.flatMap(sec => sec.items);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Compact Workspace Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white tracking-tight">
              Quản Lý &amp; Giảng Dạy
            </h1>
            {isViewerSuperAdmin && (
              <span
                title="Super Admin"
                className="inline-flex items-center gap-1 bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> ADMIN
              </span>
            )}
          </div>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5 max-w-2xl">
            IELTS Nha Trang - {fullExamTests.length} đề thi · {skillExercises.length} bài tập kỹ năng · {studentAccountsCount} học viên
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openExamBuilder(null, 'general', [], 'real_exam')}
            className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> + Thực Chiến (20k)
          </button>
          <button
            type="button"
            onClick={() => openExamBuilder(null, 'general', [], 'periodic_mock')}
            className="bg-[#FEF3C7] hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-[#92400E] dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 text-xs font-bold px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> + Mock Định Kỳ (300k)
          </button>
          <button
            type="button"
            onClick={() => setShowNotifyModal(true)}
            className="bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-lg transition flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" /> Thông Báo
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 text-xs font-bold tabular-nums">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slim Speaking Daily Missing Compliance Bar */}
      {speakingDailyCompliance.missingStudentSummaries.length > 0 && (
        <div className="bg-[#FFFBEB] dark:bg-amber-950/25 border border-amber-300 dark:border-amber-500/35 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B91C1C] text-white text-xs font-bold uppercase">
              <Flame className="w-3 h-3" /> Cảnh Báo Speaking Daily ({speakingDailyCompliance.todayKey})
            </span>
            <span className="font-bold text-[#0F172B] dark:text-white">
              Còn {speakingDailyCompliance.missingStudentSummaries.length} HS chưa nộp:
            </span>
            <span className="text-[#991B1B] dark:text-rose-300 font-semibold truncate max-w-xl">
              {speakingDailyCompliance.missingStudentSummaries
                .slice(0, 6)
                .map(s => `${s.student.name || s.student.username} (${s.missingTests.length})`)
                .join(', ')}
              {speakingDailyCompliance.missingStudentSummaries.length > 6
                ? ` +${speakingDailyCompliance.missingStudentSummaries.length - 6}`
                : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNotifyMissingDaily && speakingDailyCompliance.mandatoryDailyTests.length > 0 && (() => {
              const primaryMissingReport =
                speakingDailyCompliance.perTest.find(r => r.missingStudents.length > 0) ||
                speakingDailyCompliance.perTest[0];
              if (!primaryMissingReport) return null;
              return (
                <button
                  type="button"
                  onClick={() =>
                    onNotifyMissingDaily(
                      primaryMissingReport.test,
                      speakingDailyCompliance.missingStudentSummaries.map(s => s.student)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition inline-flex items-center gap-1"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Báo &amp; Nhắc Ngay ({speakingDailyCompliance.missingStudentSummaries.length} HS)
                </button>
              );
            })()}
            <button
              type="button"
              onClick={() => {
                setExerciseSkillFilter('speaking');
                setTeacherHubTab('skill_exercises');
              }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold transition"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Mobile Horizontal Quick Nav + Settings */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {allNavItems.map(tab => {
            const IconComp = tab.icon;
            const isActive = teacherHubTab === tab.id || (tab.id === 'accounts' && teacherHubTab === 'students');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTeacherHubTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 border transition ${
                  isActive
                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                    : 'bg-white dark:bg-slate-900 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-xs font-bold tabular-nums ${isActive ? 'opacity-90' : 'text-[#334155] dark:text-slate-400'}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
        {(onOpenMailConfig || (isViewerSuperAdmin && onOpenPaymentConfig) || onOpenApiKeyModal || (isViewerSuperAdmin && onOpenAdminTitleManager)) && (
          <div className="flex flex-wrap items-center gap-2">
            {onOpenMailConfig && (
              <button
                type="button"
                onClick={onOpenMailConfig}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                  mailConfigured
                    ? 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35'
                    : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-200 border-amber-300 dark:border-amber-500/35'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email OTP: {mailConfigured ? 'Đang bật' : 'Chưa cài'}
              </button>
            )}
            {isViewerSuperAdmin && onOpenPaymentConfig && (
              <button
                type="button"
                onClick={onOpenPaymentConfig}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                  qrConfigured
                    ? 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35'
                    : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-200 border-amber-300 dark:border-amber-500/35'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> QR &amp; Giá Tiền ({coverPriceLabel})
              </button>
            )}
            {onOpenApiKeyModal && (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-800 text-[#0F172B] dark:text-slate-200 inline-flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" /> Gemini AI Key
              </button>
            )}
            {isViewerSuperAdmin && onOpenAdminTitleManager && (
              <button
                type="button"
                onClick={() => onOpenAdminTitleManager(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FEF3C7] dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/35 text-[#92400E] dark:text-amber-200 inline-flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" /> Danh Hiệu
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column Workspace (Desktop Sidebar + Content Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)] gap-5 xl:gap-6 items-start">
        <aside className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-5 sticky top-20">
          {navSections.map(section => (
            <div key={section.title} className="space-y-1">
              <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-slate-300">
                {section.title}
              </p>
              {section.items.map(tab => {
                const IconComp = tab.icon;
                const isActive =
                  teacherHubTab === tab.id || (tab.id === 'accounts' && teacherHubTab === 'students');
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTeacherHubTab(tab.id)}
                    className={`w-full px-2.5 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between gap-1.5 ${
                      isActive
                        ? 'bg-[#007A7A] text-white'
                        : 'text-[#334155] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 hover:text-[#0F172B] dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums shrink-0 ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : tab.highlightCount
                          ? 'bg-[#FEF3C7] dark:bg-amber-500/20 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                          : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {(onOpenMailConfig || (isViewerSuperAdmin && onOpenPaymentConfig) || onOpenApiKeyModal || (isViewerSuperAdmin && onOpenAdminTitleManager)) && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-slate-300">
                Cài Đặt &amp; Quản Trị
              </p>
              {onOpenMailConfig && (
                <button
                  type="button"
                  onClick={onOpenMailConfig}
                  className="w-full px-2.5 py-2.5 rounded-lg text-xs font-bold text-[#334155] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition flex items-center justify-between gap-1.5"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0" />
                    <span className="whitespace-nowrap">{mailConfigured ? 'Email OTP: Đang bật' : 'Cấu hình Email OTP'}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${mailConfigured ? 'bg-emerald-600' : 'bg-amber-600'}`}
                    title={mailConfigured ? 'Đã bật' : 'Chưa cài'}
                  />
                </button>
              )}
              {isViewerSuperAdmin && onOpenPaymentConfig && (
                <button
                  type="button"
                  onClick={onOpenPaymentConfig}
                  className="w-full px-2.5 py-2.5 rounded-lg text-xs font-bold text-[#334155] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition flex items-center justify-between gap-1.5"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <QrCode className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0" />
                    <span className="whitespace-nowrap">QR &amp; Giá Tiền ({coverPriceLabel})</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${qrConfigured ? 'bg-emerald-600' : 'bg-amber-600'}`}
                    title={qrConfigured ? 'Đã cài' : 'Chưa cài'}
                  />
                </button>
              )}
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="w-full px-2.5 py-2.5 rounded-lg text-xs font-bold text-[#334155] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition flex items-center justify-between gap-1.5"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="whitespace-nowrap">Gemini AI Key</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${aiConfigured ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-600'}`}
                  />
                </button>
              )}
              {isViewerSuperAdmin && onOpenAdminTitleManager && (
                <button
                  type="button"
                  onClick={() => onOpenAdminTitleManager(null)}
                  className="w-full px-2.5 py-2.5 rounded-lg text-xs font-bold text-[#92400E] dark:text-amber-200 bg-[#FEF3C7]/70 dark:bg-amber-500/10 hover:bg-[#FEF3C7] dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 transition flex items-center gap-2"
                >
                  <Crown className="w-4 h-4 text-[#92400E] dark:text-amber-300 shrink-0" />
                  <span className="truncate">Quản Lý &amp; Tạo Danh Hiệu</span>
                </button>
              )}
            </div>
          )}
        </aside>

        <div
          key={`teacher-workspace-${teacherHubTab}`}
          className="apple-view-enter min-w-0 space-y-5"
          onAnimationEnd={e => {
            if (e.currentTarget === e.target) {
              e.currentTarget.classList.remove('apple-view-enter');
            }
          }}
        >

      {/* Tab 2: Kho Bài Tập Daily Zone (Miễn Phí - Từng Kỹ Năng Riêng) */}
      {teacherHubTab === 'skill_exercises' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" />
                Tạo Bài Tập Daily Zone (Miễn Phí - Làm Lại Không Giới Hạn)
              </h2>
              <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5 max-w-2xl">
                Chọn đúng phân mục để soạn bài tập lẻ có thể cài Mật Khẩu Team: Daily Speaking, Cày Forecast, Reading SHW 1-14, Listening, Writing Task 1 (W1) hoặc Writing Task 2 (W2).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {SKILL_EXERCISE_BUTTONS.map(sk => {
                const IconComp = sk.icon;
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => openSingleSkillBuilder?.(sk.skill, null, [], sk.subOpts)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${sk.cls}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{sk.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold">
              {[
                { id: 'all', label: `Tất cả Daily (${skillExercises.length})` },
                { id: 'speaking', label: `Speaking (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'speaking').length})` },
                { id: 'reading', label: `Reading (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'reading').length})` },
                { id: 'listening', label: `Listening (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'listening').length})` },
                { id: 'writing_task1', label: `Writing W1 (${skillExercises.filter(t => { const c = normalizeExamConfig(t); return c.focusSkill === 'writing' && c.writingTaskScope === 'task1'; }).length})` },
                { id: 'writing_task2', label: `Writing W2 (${skillExercises.filter(t => { const c = normalizeExamConfig(t); return c.focusSkill === 'writing' && c.writingTaskScope !== 'task1'; }).length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExerciseSkillFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    exerciseSkillFilter === tab.id
                      ? 'bg-[#007A7A] text-white'
                      : 'text-[#334155] dark:text-slate-300 hover:text-[#0F172B] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={e => setItemSearchQuery(e.target.value)}
                  placeholder="Tìm bài tập..."
                  aria-label="Tìm kiếm bài tập theo tiêu đề"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-[#0F172B] dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyIncompleteFilter(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                  onlyIncompleteFilter
                    ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                    : 'bg-white dark:bg-slate-900 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{onlyIncompleteFilter ? 'Đang lọc: Còn HS chưa làm' : 'Lọc bài còn HS chưa làm'}</span>
              </button>
            </div>
          </div>

          {filteredSkillExercises.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-sm text-[#475569] dark:text-slate-400">
              {onlyIncompleteFilter
                ? 'Tất cả bài tập trong mục này đã được 100% học sinh hoàn thành!'
                : 'Chưa có bài tập nào cho bộ lọc này. Hãy bấm các nút kỹ năng phía trên để tạo ngay.'}
            </div>
          ) : (() => {
            const exSlice = paginateItems(filteredSkillExercises, exercisesPage, 5);
            return (
              <div className="space-y-3">
                <ListPaginationBar
                  currentPage={exSlice.safePage}
                  totalItems={exSlice.totalItems}
                  pageSize={5}
                  onPageChange={setExercisesPage}
                  itemLabel="bài tập"
                />
                {exSlice.pageItems.map(renderManagementItemCard)}
                <ListPaginationBar
                  currentPage={exSlice.safePage}
                  totalItems={exSlice.totalItems}
                  pageSize={5}
                  onPageChange={setExercisesPage}
                  itemLabel="bài tập"
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 1: Kho Đề Thi Full 4 Kỹ Năng (Thực Chiến & Mock Định Kỳ - Có Phí) */}
      {teacherHubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:px-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white">
                  Thực Chiến &amp; Mock Định Kỳ - Full 4 Kỹ Năng ({fullExamTests.length})
                </h2>
                <p className="text-sm text-[#475569] dark:text-slate-400 max-w-2xl">
                  Kho đề thi có phí chuẩn Full 4 kỹ năng Listening · Reading · Writing · Speaking (1 lượt thi thật · {publicFullExamsCount} đề công khai).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-44 sm:w-52">
                  <Search className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={e => setItemSearchQuery(e.target.value)}
                    placeholder="Tìm đề thi..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOnlyIncompleteFilter(prev => !prev)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                    onlyIncompleteFilter
                      ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                      : 'bg-white dark:bg-slate-900 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{onlyIncompleteFilter ? 'Đang lọc: Còn HS chưa làm' : 'Lọc đề còn HS chưa làm'}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1 bg-[#F8FAFC] dark:bg-slate-800/70 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                {[
                  { id: 'all', label: `Tất cả (${fullExamTests.length})` },
                  { id: 'real_exam', label: `Thực Chiến 20k (${realExamFullTests.length})` },
                  { id: 'periodic_mock', label: `Mock Định Kỳ 300k (${periodicMockFullTests.length})` }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFullExamCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-md transition ${
                      fullExamCategoryFilter === cat.id
                        ? 'bg-[#007A7A] text-white'
                        : 'text-[#334155] dark:text-slate-300 hover:text-[#0F172B] dark:hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                Thực Chiến áp dụng Combo 3/5/10 đề · Mock Định Kỳ là đề riêng 3 tháng/lần
              </span>
            </div>
          </div>

          {filteredFullExamTests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-[#475569] dark:text-slate-400">
                {onlyIncompleteFilter
                  ? 'Tất cả đề thi IELTS đã được 100% học sinh trong lớp hoàn thành!'
                  : fullExamCategoryFilter === 'periodic_mock'
                    ? 'Chưa có đề Mock Test Định Kỳ (300.000đ) nào. Tạo ngay đề 3 tháng/lần cho học viên!'
                    : 'Chưa có đề thi Full 4 Kỹ Năng nào trong mục này.'}
              </p>
              {!onlyIncompleteFilter && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openExamBuilder(null, 'general', [], 'real_exam')}
                    className="px-4 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition"
                  >
                    + Tạo Đề Thực Chiến (20.000đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => openExamBuilder(null, 'general', [], 'periodic_mock')}
                    className="px-4 py-2 rounded-lg bg-[#FEF3C7] hover:bg-amber-200 text-[#92400E] border border-amber-300 text-xs font-bold transition"
                  >
                    + Tạo Mock Định Kỳ (300.000đ)
                  </button>
                </div>
              )}
            </div>
          ) : (() => {
            const testSlice = paginateItems(filteredFullExamTests, testsPage, 5);
            return (
              <div className="space-y-3">
                <ListPaginationBar
                  currentPage={testSlice.safePage}
                  totalItems={testSlice.totalItems}
                  pageSize={5}
                  onPageChange={setTestsPage}
                  itemLabel="đề thi"
                />
                {testSlice.pageItems.map(renderManagementItemCard)}
                <ListPaginationBar
                  currentPage={testSlice.safePage}
                  totalItems={testSlice.totalItems}
                  pageSize={5}
                  onPageChange={setTestsPage}
                  itemLabel="đề thi"
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 2: Giám Sát Gian Lận & Chấm Điểm */}
      {teacherHubTab === 'grading' && (() => {
        const pendingCount = attempts.filter(a => !a.teacherGraded).length;
        const highRiskCount = attempts.filter(a => (a.tabSwitchCount || 0) >= 3 || countExtensionCheatSignals(a.antiCheatLogs) > 0).length;
        const gradedBands = attempts.filter(a => typeof a.overallBand === 'number').map(a => a.overallBand);
        const avgBandDisplay = gradedBands.length > 0
          ? (gradedBands.reduce((acc, b) => acc + b, 0) / gradedBands.length).toFixed(1)
          : '-';

        const filteredAttempts = attempts.filter(att => {
          if (gradingFilters.testId !== 'all' && att.testId !== gradingFilters.testId) return false;
          if (gradingFilters.status === 'pending' && att.teacherGraded) return false;
          if (gradingFilters.status === 'graded' && !att.teacherGraded) return false;
          if (gradingFilters.risk === 'risk' && (att.tabSwitchCount || 0) < 3 && countExtensionCheatSignals(att.antiCheatLogs) === 0) return false;
          if (gradingFilters.search.trim()) {
            const q = gradingFilters.search.trim().toLowerCase();
            const hay = `${att.studentName || ''} ${att.studentId || ''} ${att.testTitle || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        const uniqueAttemptTests = Array.from(
          new Map(attempts.map(a => [a.testId, a.testTitle || a.testId])).entries()
        );

        return (
        <div className="space-y-4">
          {/* 4 Analytics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-slate-400">Tổng bài đã nộp</p>
              <p className="text-2xl font-black text-[#0F172B] dark:text-white mt-1 tabular-nums">{attempts.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-500/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#92400E] dark:text-amber-400">Chờ chấm điểm</p>
              <p className="text-2xl font-black text-[#92400E] dark:text-amber-300 mt-1 tabular-nums">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-500/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8] dark:text-blue-400">Band TB toàn lớp</p>
              <p className="text-2xl font-black text-[#1D4ED8] dark:text-blue-300 mt-1 tabular-nums">{avgBandDisplay}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-500/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] dark:text-rose-400">Cảnh báo tab (≥3)</p>
              <p className="text-2xl font-black text-[#B91C1C] dark:text-rose-400 mt-1 tabular-nums">{highRiskCount}</p>
            </div>
          </div>

          {/* Unified Filter Bar + Submissions Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#334155] dark:text-slate-300 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Lọc:
                </span>
                <select
                  aria-label="Lọc theo đề thi hoặc bài tập"
                  value={gradingFilters.testId}
                  onChange={e => setGradingFilters(prev => ({ ...prev, testId: e.target.value }))}
                  className="px-2.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-100 min-w-0 max-w-[180px]"
                >
                  <option value="all">Tất cả đề thi &amp; bài tập</option>
                  {uniqueAttemptTests.map(([tid, title]) => (
                    <option key={tid} value={tid}>{title}</option>
                  ))}
                </select>
                <select
                  aria-label="Lọc theo trạng thái chấm"
                  value={gradingFilters.status}
                  onChange={e => setGradingFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-2.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-100 shrink-0"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt &amp; chấm (Viết / Nói / 4 Kỹ Năng)</option>
                  <option value="graded">Đã chấm xong</option>
                </select>
                <select
                  aria-label="Lọc theo mức cảnh báo chuyển tab"
                  value={gradingFilters.risk}
                  onChange={e => setGradingFilters(prev => ({ ...prev, risk: e.target.value }))}
                  className="px-2.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-100 shrink-0"
                >
                  <option value="all">Mọi mức độ tab</option>
                  <option value="risk">Nghi gian lận (≥3 tab)</option>
                </select>
                <div className="relative flex-1 min-w-[140px] max-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    aria-label="Tìm theo tên học viên"
                    placeholder="Tên học viên..."
                    value={gradingFilters.search}
                    onChange={e => setGradingFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#0F172B] dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {orphanAttemptsCount > 0 && handlePurgeOrphanAttempts && (
                  <button
                    type="button"
                    onClick={handlePurgeOrphanAttempts}
                    title="Dọn sạch các bài làm thuộc những tài khoản đã bị xóa"
                    className="px-3 py-2 rounded-lg bg-[#FEF3C7] dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Dọn {orphanAttemptsCount} bài TK đã xóa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    exportAttemptsToCsv(filteredAttempts);
                    showToast(`Đã xuất file CSV bảng điểm (${filteredAttempts.length} dòng)!`);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất CSV Excel ({filteredAttempts.length})
                </button>
              </div>
            </div>

            {(() => {
              const gradingSlice = paginateItems(filteredAttempts, gradingPage, 5);
              return (
                <>
                  <ListPaginationBar
                    currentPage={gradingSlice.safePage}
                    totalItems={gradingSlice.totalItems}
                    pageSize={5}
                    onPageChange={setGradingPage}
                    itemLabel="bài nộp"
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#334155] dark:text-slate-300">
                      <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 text-xs font-bold tracking-wider text-[#334155] dark:text-slate-300 uppercase whitespace-nowrap">
                        <tr>
                          <th className="px-3.5 py-3">Học Sinh &amp; Thời Gian</th>
                          <th className="px-3.5 py-3">Đề Thi / Bài Tập</th>
                          <th className="px-3 py-3 text-center">Trạng Thái &amp; Giám Sát</th>
                          <th className="px-3 py-3 text-center">Điểm Band</th>
                          <th className="px-3.5 py-3 text-right sticky right-0 bg-[#F8FAFC] dark:bg-slate-800 z-10">Chấm &amp; Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredAttempts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#475569] dark:text-slate-400">
                              Không có bài nộp nào khớp bộ lọc hiện tại.{' '}
                              <button
                                type="button"
                                onClick={() => setGradingFilters({ testId: 'all', status: 'all', risk: 'all', search: '' })}
                                className="text-[#0F766E] dark:text-[#1EE1D6] font-bold underline ml-1"
                              >
                                Đặt lại bộ lọc
                              </button>
                            </td>
                          </tr>
                        ) : gradingSlice.pageItems.map(att => {
                          const risk = getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs);
                          const extSignals = countExtensionCheatSignals(att.antiCheatLogs);
                          const RiskIcon = risk.icon;

                          return (
                            <tr key={att.id} className="group hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition">
                              <td className="px-3.5 py-3 font-bold text-[#0F172B] dark:text-white">
                                <div className="flex items-start gap-2.5">
                                  <UserAvatarBadge
                                    user={usersDb?.[att.studentId] || { username: att.studentId, name: att.studentName }}
                                    sizeClass="w-8 h-8"
                                    textClass="text-xs"
                                    rounded="rounded-lg"
                                  />
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {openMemberProfile && att.studentId ? (
                                        <button
                                          type="button"
                                          onClick={() => openMemberProfile(att.studentId, 'TEACHER_DASHBOARD')}
                                          title="Xem hồ sơ thành viên"
                                          className="inline-flex items-center gap-1 text-left hover:text-[#0F766E] dark:hover:text-teal-400 hover:underline transition whitespace-nowrap"
                                        >
                                          <span>{att.studentName}</span>
                                          <Eye className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                        </button>
                                      ) : (
                                        <span className="whitespace-nowrap">{att.studentName}</span>
                                      )}
                                      {att.timelinessStatus === 'late' ? (
                                        <span className="inline-block text-xs font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-500/20 text-[#991B1B] dark:text-rose-300 whitespace-nowrap">
                                          Muộn{att.lateByMinutes ? ` ${att.lateByMinutes}p` : ''}
                                        </span>
                                      ) : att.timelinessStatus === 'on_time' ? (
                                        <span className="inline-block text-xs font-bold px-1.5 py-0.2 rounded-full bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300 whitespace-nowrap">
                                          Đúng hạn
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="text-xs font-normal text-[#475569] dark:text-slate-400 tabular-nums whitespace-nowrap">
                                      {att.submittedAt}
                                      {Number(att.durationSeconds) > 0 ? ` · ${formatDurationVi(att.durationSeconds)}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3.5 py-3 text-sm text-[#334155] dark:text-slate-300 max-w-[230px]">
                                <div className="space-y-1">
                                  <span
                                    className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap ${
                                      att.testMode === 'single_skill'
                                        ? 'bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        : 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30'
                                    }`}
                                  >
                                    {att.testMode === 'single_skill'
                                      ? `BÀI TẬP • ${(att.focusSkill || 'SK').toUpperCase()}`
                                      : 'ĐỀ THI'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openTeacherGradingModal(att)}
                                    className="block text-left font-semibold text-[#0F172B] dark:text-slate-100 hover:text-[#0F766E] dark:hover:text-[#1EE1D6] leading-snug line-clamp-2 transition"
                                    title={`Bấm để chấm nhanh: ${att.testTitle}`}
                                  >
                                    {att.testTitle}
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center gap-1">
                                  {att.teacherGraded ? (
                                    <span className="text-xs bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1 whitespace-nowrap">
                                      {att.aiGraded && <Sparkles className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />}
                                      Đã Duyệt Trả Điểm
                                    </span>
                                  ) : att.aiGraded ? (
                                    <span className="text-xs bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 px-2.5 py-0.5 rounded-lg font-bold border border-indigo-200 dark:border-indigo-500/40 inline-flex items-center gap-1 whitespace-nowrap">
                                      <Sparkles className="w-3.5 h-3.5 shrink-0" /> AI Chấm Nháp · Chờ Duyệt
                                    </span>
                                  ) : (
                                    <span className="inline-block text-xs bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 px-2.5 py-0.5 rounded-lg font-bold border border-amber-300 dark:border-amber-500/30 whitespace-nowrap">
                                      Chờ Ms. Như Duyệt
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 ${risk.color}`}>
                                    <RiskIcon className="w-3 h-3 shrink-0" />
                                    <span>{risk.label} ({att.tabSwitchCount} lần)</span>
                                  </span>
                                  {extSignals > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-[#991B1B] dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
                                      Extension / Bypass: {extSignals}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center whitespace-nowrap">
                                <div className="text-base font-black text-[#0F766E] dark:text-[#1EE1D6] tabular-nums leading-tight">
                                  {att.overallBand ?? '-'}
                                </div>
                                <div className="text-xs font-medium text-[#475569] dark:text-slate-400 mt-0.5 tabular-nums whitespace-nowrap">
                                  {att.testMode === 'single_skill' && att.focusSkill === 'speaking'
                                    ? `Speaking ${att.scores?.speaking?.band ?? att.overallBand ?? '-'}`
                                    : att.testMode === 'single_skill'
                                    ? `${(att.focusSkill || '').toUpperCase()} ${att.overallBand ?? '-'}`
                                    : `L ${att.scores?.listening?.band ?? '-'} · R ${att.scores?.reading?.band ?? '-'} · W ${att.scores?.writing?.overallBand ?? '-'}${att.scores?.speaking ? ` · S ${att.scores?.speaking?.band ?? '-'}` : ''}`}
                                </div>
                              </td>
                              <td className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800 transition z-10">
                                <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => openTeacherGradingModal(att)}
                                    className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap shrink-0"
                                  >
                                    {att.testMode === 'single_skill' ? 'Chấm & Xem' : 'Chấm Điểm'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAttemptId(att.id);
                                      setPreviousView('TEACHER_DASHBOARD');
                                      setView('RESULT_VIEW');
                                    }}
                                    aria-label={`Xem chi tiết bài làm của ${att.studentName}`}
                                    className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-teal-500/15 text-[#0F172B] hover:text-[#0F766E] dark:text-slate-300 dark:hover:text-[#1EE1D6] border border-[#CBD5E1] dark:border-slate-700 transition"
                                    title="Xem chi tiết từng câu & bài làm"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttempt(att)}
                                    aria-label={`Xóa lượt thi của ${att.studentName}`}
                                    className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-[#B91C1C] dark:text-slate-400 dark:hover:text-rose-400 border border-[#FECACA] dark:border-slate-700 transition"
                                    title="Xóa lượt thi này để mở khóa cho học viên thi lại"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ListPaginationBar
                    currentPage={gradingSlice.safePage}
                    totalItems={gradingSlice.totalItems}
                    pageSize={5}
                    onPageChange={setGradingPage}
                    itemLabel="bài nộp"
                  />
                </>
              );
            })()}
          </div>
        </div>
        );
      })()}

      {/* Tab 3: Phòng Đấu Game PIN & Leaderboard */}
      {teacherHubTab === 'game_room' && (
        <div className="space-y-6">
          {/* Room Switcher + Create Room */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#334155] dark:text-slate-400 mr-1">Danh sách phòng:</span>
              {allRoomsList.map(r => {
                const isActiveRoom = r.pin === currentRoomPin;
                const rLobbyCount = Object.keys(r.lobbyPlayers || {}).length;
                return (
                  <div key={r.pin} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setCurrentRoomPin(r.pin);
                        setCustomVocabInput(r.rawVocab || DEFAULT_VOCAB_TEXT);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-2 ${
                        isActiveRoom
                          ? 'bg-[#007A7A] text-white'
                          : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-mono">#{r.pin}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'PLAYING' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {rLobbyCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActiveRoom ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] dark:bg-slate-700 text-[#334155] dark:text-slate-200'}`}>
                          {rLobbyCount} chờ
                        </span>
                      )}
                    </button>
                    {allRoomsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(r.pin)}
                        className="px-2 py-1.5 bg-[#F1F5F9] dark:bg-slate-900 hover:bg-rose-600 text-[#475569] hover:text-white border-l border-slate-200 dark:border-slate-700 transition"
                        title={`Xóa phòng #${r.pin}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tạo Phòng Mới
            </button>
          </div>

          {/* Dropship Room Hero */}
          <div className="bg-gradient-to-br from-[#0F172B] via-[#003538] to-[#065B5B] rounded-xl p-6 sm:p-7 text-white border border-[#007A7A]/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  room.status === 'LOBBY'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : room.status === 'PLAYING'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                    : 'bg-slate-700/60 text-slate-300 border-slate-600'
                }`}>
                  <Wifi className="w-3 h-3" />
                  {room.status === 'LOBBY' ? 'Đang Mở Sảnh Chờ (Lobby)' : room.status === 'PLAYING' ? 'Trận Đấu Đang Diễn Ra' : 'Đã Kết Thúc'}
                </span>
                <span className="text-xs font-bold text-[#B5F5F1]">{room.name}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs text-[#1EE1D6] font-bold uppercase tracking-wider">Mã Phòng (PIN)</p>
                  <p className="text-3xl font-black text-amber-300 font-mono tracking-widest">{currentRoomPin}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(currentRoomPin);
                    setCopiedRoomPin(true);
                    setTimeout(() => setCopiedRoomPin(false), 1800);
                    showToast(`Đã sao chép mã phòng ${currentRoomPin}!`);
                  }}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition"
                  title="Sao chép mã phòng"
                >
                  {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoomPin ? 'Đã chép' : 'Copy PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(currentRoomPin)}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 flex items-center gap-1.5 transition"
                  title="Sao chép Link mời học viên tự điền mã PIN"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link Mời</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2.5">
                <span>Mật khẩu: <b className="text-cyan-300 font-mono">{room.pass}</b></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <b>{lobbyPlayersList.length}</b> học sinh trong Sảnh Chờ
                </span>
                <span>•</span>
                <span className="bg-white/10 px-2.5 py-0.5 rounded-md font-semibold text-xs text-amber-200">
                  {room.roundSize || 4} từ/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                className="bg-[#10B981] hover:bg-[#059669] text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Mở Sảnh Chờ Phi Thuyền
              </button>
              {room.status !== 'LOBBY' && (
                <button
                  onClick={() => handleTeacherResetLobby(currentRoomPin)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh Mới
                </button>
              )}
              <button
                onClick={() => {
                  initGameCampaign(currentRoomPin, currentUser);
                  setView('GAME_ARENA');
                }}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" /> Chơi Thử GV
              </button>
              <button
                onClick={() => {
                  setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                  setShowVocabModal(true);
                }}
                className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition border border-teal-400/40 flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Sửa Bộ Từ Vựng
              </button>
            </div>
          </div>

          {/* Live Lobby Crewmates Preview */}
          {lobbyPlayersList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#334155] dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#047857]" /> Phi Hành Đoàn Đang Chờ Trong Sảnh ({lobbyPlayersList.length})
                </h2>
                <button
                  onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                  className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline flex items-center gap-1"
                >
                  Vào Sảnh Điều Phối <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {lobbyPlayersList.map(lp => (
                  <div
                    key={lp.username}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A] dark:hover:border-teal-500 transition"
                  >
                    <button
                      type="button"
                      onClick={() => openMemberProfile?.(lp.username, 'TEACHER_DASHBOARD')}
                      title="Xem hồ sơ thành viên"
                      className="flex items-center gap-2.5 text-left group"
                    >
                      <AnimalPilotAvatar
                        animalId={lp.animalId || 'cat'}
                        accessoryId={lp.accessoryId || 'none'}
                        colorId={lp.colorId}
                        avatarUrl={lp.avatarUrl || usersDb[lp.username]?.avatarUrl || ''}
                        size={32}
                        animate={false}
                        onShip={true}
                      />
                      <div>
                        <p className="text-xs font-bold text-[#0F172B] dark:text-white flex items-center gap-1 group-hover:text-[#0F766E] dark:group-hover:text-teal-400 group-hover:underline">
                          {lp.name}
                          {lp.role === 'teacher' && <Crown className="w-3 h-3 text-amber-500" />}
                        </p>
                        <p className="text-xs font-semibold text-[#065F46] dark:text-emerald-400">
                          {lp.ready ? 'Đã sẵn sàng' : 'Đang chuẩn bị'}
                        </p>
                      </div>
                    </button>
                    {lp.role !== 'teacher' && (
                      <button
                        type="button"
                        onClick={() => handleKickLobbyPlayer(currentRoomPin, lp.username, lp.name)}
                        className="ml-1 p-1 rounded-lg text-[#475569] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                        title={`Mời ${lp.name} rời sảnh`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <h2 className="font-extrabold text-sm text-[#0F172B] dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Bảng Xếp Hạng Học Sinh Trong Phòng (Real-time)
              </h2>
              <span className="text-xs text-[#475569] dark:text-slate-400 font-medium">Tự động đồng bộ điểm số</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#334155] dark:text-slate-300">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 text-xs text-[#334155] dark:text-slate-300 uppercase border-y border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Hạng</th>
                    <th className="px-4 py-3">Tên Học Sinh</th>
                    <th className="px-4 py-3">Tiến Độ</th>
                    <th className="px-4 py-3 text-center">Điểm Số</th>
                    <th className="px-4 py-3 text-center">Streak</th>
                    <th className="px-4 py-3 text-right">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {leaderboardPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-[#475569] dark:text-slate-400">
                        Chưa có học sinh nào nộp điểm vào phòng. Hãy chia sẻ mã PIN <b>{currentRoomPin}</b> cho học sinh!
                      </td>
                    </tr>
                  ) : (
                    leaderboardPlayers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3.5 font-bold">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black tabular-nums ${
                            idx === 0
                              ? 'bg-[#FEF3C7] dark:bg-amber-500/20 text-[#92400E] dark:text-amber-300'
                              : idx === 1
                              ? 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200'
                              : idx === 2
                              ? 'bg-orange-100 dark:bg-orange-500/20 text-[#9A3412] dark:text-orange-300'
                              : 'text-[#475569] dark:text-slate-400'
                          }`}>
                            {idx === 0 && <Crown className="w-3 h-3" />}
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0F172B] dark:text-white">{p.name}</td>
                        <td className="px-4 py-3.5 text-sm text-[#334155] dark:text-slate-300">
                          <div>{p.status}</div>
                          {Array.isArray(p.missed) && p.missed.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {p.missed.slice(0, 4).map((mw, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-mono text-xs font-bold"
                                >
                                  {mw}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-[#0F766E] dark:text-[#1EE1D6] tabular-nums">{p.score}đ</td>
                        <td className="px-4 py-3.5 text-center font-bold text-[#92400E] dark:text-amber-400 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> {p.streak}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-[#475569] dark:text-slate-400">{p.updatedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tạo & Quản Lý Tài Khoản */}
      {(teacherHubTab === 'accounts' || teacherHubTab === 'students') && (() => {
        const selectableFilteredNames = filteredAccounts
          .filter(acc => acc.username !== currentUser?.username && !acc.isSuperAdmin && acc.username !== 'tuanpro123s')
          .map(acc => acc.username);
        const allSelectableChecked =
          selectableFilteredNames.length > 0 &&
          selectableFilteredNames.every(uname => validSelectedUsernames.includes(uname));

        return (
        <div className="space-y-4">
          {/* Unified Header, Role Filters, Actions & Accounts Table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-extrabold text-base text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" />
                  Tạo &amp; Quản Lý Tài Khoản Hệ Thống ({allAccounts.length})
                </h2>
                <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5 max-w-2xl">
                  Tạo, cấp mật khẩu, phân quyền hoặc xem hồ sơ học viên.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isViewerSuperAdmin && onOpenPaymentConfig && (
                  <button
                    type="button"
                    onClick={onOpenPaymentConfig}
                    className="px-3.5 py-2 rounded-lg bg-[#FEF3C7] dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-[#92400E] dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR &amp; Giá Tiền ({coverPriceLabel})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('single');
                    setShowAddStudentModal(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Tạo 1 Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('bulk');
                    setShowAddStudentModal(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-100 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Nhập Hàng Loạt
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    accountRoleFilter === 'all'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#F1F5F9]'
                  }`}
                >
                  Tất cả ({allAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'student'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#F1F5F9]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Học viên ({studentAccountsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'teacher'
                      ? 'bg-[#B45309] text-white border-[#B45309]'
                      : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#F1F5F9]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên ({teacherAccountsCount})
                </button>
                {isViewerSuperAdmin && pendingCoverRequestCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAccountRoleFilter('cover_pending')}
                    className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                      accountRoleFilter === 'cover_pending'
                        ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                        : 'bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-200 border-amber-300 dark:border-amber-500/40 hover:bg-amber-200'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" /> Chờ duyệt ảnh nền {coverPriceLabel} ({pendingCoverRequestCount})
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Tìm theo tên hoặc tên đăng nhập"
                  placeholder="Tìm theo tên hoặc @username..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                />
              </div>
            </div>

            {validSelectedUsernames.length > 0 && handleBulkDeleteAccounts && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                <span className="text-xs font-bold text-[#991B1B] dark:text-rose-300">
                  Đã chọn {validSelectedUsernames.length} tài khoản (bao gồm xóa gọn bài nộp liên quan nếu có)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUsernames([])}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-300 hover:bg-[#F8FAFC] transition"
                  >
                    Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ok = handleBulkDeleteAccounts(validSelectedUsernames);
                      if (ok) setSelectedUsernames([]);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa {validSelectedUsernames.length} tài khoản đã chọn
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const accountsSlice = paginateItems(filteredAccounts, accountsPage, 5);
              return (
                <>
                  <ListPaginationBar
                    currentPage={accountsSlice.safePage}
                    totalItems={accountsSlice.totalItems}
                    pageSize={5}
                    onPageChange={setAccountsPage}
                    itemLabel="tài khoản"
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#334155] dark:text-slate-300">
                      <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 text-xs text-[#334155] dark:text-slate-300 uppercase whitespace-nowrap">
                        <tr>
                          <th className="pl-4 pr-2 py-4 w-10">
                            <input
                              type="checkbox"
                              aria-label="Chọn tất cả tài khoản đang hiển thị"
                              checked={allSelectableChecked}
                              disabled={selectableFilteredNames.length === 0}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedUsernames(prev => Array.from(new Set([...prev, ...selectableFilteredNames])));
                                } else {
                                  const dropSet = new Set(selectableFilteredNames);
                                  setSelectedUsernames(prev => prev.filter(u => !dropSet.has(u)));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                            />
                          </th>
                          <th className="px-4 py-4">Tài Khoản</th>
                          <th className="px-4 py-4 text-center">Vai Trò</th>
                          <th className="px-4 py-4 text-center">Mục Tiêu / Ghi Chú</th>
                          <th className="px-4 py-4 text-center">Hoạt Động</th>
                          <th className="px-4 py-4 text-center">Ngày Tạo</th>
                          <th className="px-4 py-4 text-right sticky right-0 bg-[#F8FAFC] dark:bg-slate-800 z-10">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#475569] dark:text-slate-400">
                              Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                            </td>
                          </tr>
                        ) : (
                          accountsSlice.pageItems.map(account => {
                      const isSuperAdminAccount = Boolean(account.isSuperAdmin || account.username === 'tuanpro123s');
                      const isTeacherAccount = account.role === 'teacher';
                      const isSelfAccount = account.username === currentUser?.username;
                      const canResetAccountPass = isViewerSuperAdmin || !isTeacherAccount || isSelfAccount;
                      const disableDelete = isSelfAccount || isSuperAdminAccount;
                      const isChecked = validSelectedUsernames.includes(account.username);
                      const studentAttempts = attempts.filter(a => a.studentId === account.username);
                      const gradedStudentBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
                      const bestBand = gradedStudentBands.length > 0
                        ? Math.max(...gradedStudentBands)
                        : null;

                      return (
                        <tr key={account.username} className="group hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition">
                          <td className="pl-4 pr-2 py-4 w-10">
                            <input
                              type="checkbox"
                              aria-label={`Chọn tài khoản ${account.username}`}
                              checked={isChecked}
                              disabled={disableDelete}
                              onChange={e => {
                                if (disableDelete) return;
                                const checked = e.target.checked;
                                setSelectedUsernames(prev =>
                                  checked
                                    ? Array.from(new Set([...prev, account.username]))
                                    : prev.filter(u => u !== account.username)
                                );
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatarBadge user={account} sizeClass="w-10 h-10" textClass="text-sm" rounded="rounded-lg" />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {openMemberProfile ? (
                                    <button
                                      type="button"
                                      onClick={() => openMemberProfile(account.username, 'TEACHER_DASHBOARD')}
                                      title="Mở trang hồ sơ chi tiết"
                                      className="font-bold text-[#0F172B] dark:text-white hover:text-[#0F766E] dark:hover:text-teal-400 hover:underline leading-tight text-left transition"
                                    >
                                      <VipMemberName user={account} fallbackName={account.name} badgeSize="xs" />
                                    </button>
                                  ) : (
                                    <p className="font-bold text-[#0F172B] dark:text-white leading-tight">
                                      <VipMemberName user={account} fallbackName={account.name} badgeSize="xs" />
                                    </p>
                                  )}
                                  {isSelfAccount && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-[13px] text-[#475569] dark:text-slate-400 font-mono mt-0.5">@{account.username}</p>
                                <p className={`text-xs font-semibold mt-0.5 ${account.emailVerified ? 'text-[#065F46] dark:text-emerald-400' : 'text-[#475569] dark:text-slate-400'}`}>
                                  {account.emailVerified
                                    ? `✓ Email OTP: ${account.email || account.maskedEmail}`
                                    : 'Chưa liên kết Email OTP'}
                                </p>
                                {isViewerSuperAdmin && account.role === 'student' && onToggleUserCoverUnlock && (() => {
                                  const isCoverUnlocked = hasCustomCoverPermission(account);
                                  const isPendingCover = !isCoverUnlocked && Number(account.coverUnlockRequestedAt) > 0;
                                  return (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isCoverUnlocked && !window.confirm(`Khóa lại quyền tải Ảnh Nền Riêng của ${account.name || account.username}?`)) {
                                            return;
                                          }
                                          onToggleUserCoverUnlock(account.username, !isCoverUnlocked);
                                        }}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                                          isCoverUnlocked
                                            ? 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35 hover:bg-emerald-200'
                                            : isPendingCover
                                            ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300 hover:bg-amber-200'
                                            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-slate-700 hover:border-amber-500'
                                        }`}
                                        title={isCoverUnlocked ? 'Bấm để khóa lại quyền tải ảnh nền' : `Bấm để mở khóa quyền Ảnh Nền Riêng (${coverPriceLabel})`}
                                      >
                                        {isCoverUnlocked ? (
                                          <>
                                            <CheckCircle2 className="w-3 h-3" /> Mở Ảnh Nền
                                          </>
                                        ) : isPendingCover ? (
                                          <>
                                            <Unlock className="w-3 h-3" /> Duyệt Mở Ảnh Nền ({coverPriceLabel})
                                          </>
                                        ) : (
                                          <>
                                            <Lock className="w-3 h-3" /> Khóa Ảnh Nền ({coverPriceLabel})
                                          </>
                                        )}
                                      </button>
                                      {onToggleUserSubscription && (() => {
                                        const hasVip = hasActiveAieoVip(account);
                                        const stuCredits = getRealExamCredits(account);
                                        const pendingSubReq = account.subscriptionRequested || null;
                                        const isPendingComboOrTest = Boolean(
                                          pendingSubReq &&
                                          (pendingSubReq.itemType === 'test' ||
                                            Boolean(getRealExamComboMeta(pendingSubReq.itemType, paymentConfig)))
                                        );
                                        return (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => onToggleUserSubscription(account.username, 'aieo_vip', !hasVip)}
                                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                                                hasVip
                                                  ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                                                  : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] border-[#CBD5E1] dark:border-slate-700 hover:border-rose-500'
                                              }`}
                                              title="Bật/Tắt gói IELTS VIP 1 tháng"
                                            >
                                              {hasVip ? 'IELTS VIP' : '+ IELTS VIP'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onToggleUserSubscription(account.username, 'real_exam_credit', true)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30 hover:bg-[#007A7A] hover:text-white transition"
                                              title="Cộng thêm +1 lượt làm đề có phí (Thực Chiến)"
                                            >
                                              {stuCredits} lượt (+1)
                                            </button>
                                            {stuCredits > 0 && (
                                              <button
                                                type="button"
                                                onClick={() => onToggleUserSubscription(account.username, 'real_exam_credit', false)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border-[#FECACA] dark:border-rose-500/30 hover:bg-[#B91C1C] hover:text-white transition"
                                                title="Trừ bớt -1 lượt làm đề có phí nếu cộng nhầm"
                                              >
                                                -1 lượt
                                              </button>
                                            )}
                                            {isPendingComboOrTest && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  onToggleUserSubscription(
                                                    account.username,
                                                    pendingSubReq.itemType,
                                                    true,
                                                    pendingSubReq.itemId || ''
                                                  )
                                                }
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#FEF3C7] dark:bg-amber-500/20 text-[#92400E] dark:text-amber-200 border-amber-400 hover:bg-amber-200 transition"
                                                title="Duyệt yêu cầu mua đề lẻ / Combo Thực Chiến"
                                              >
                                                Duyệt: {pendingSubReq.itemLabel || pendingSubReq.itemType}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  );
                                })()}
                                {account.role === 'student' && (() => {
                                  const clsIds = getUserClassIds(classesDb, account.username);
                                  const clsNames = getAssignedClassNames(clsIds, classesDb);
                                  if (clsNames.length === 0) return null;
                                  return (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {clsNames.map(c => (
                                        <span
                                          key={c.id}
                                          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EFF6FF] dark:bg-blue-500/20 text-[#1D4ED8] dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                                        >
                                          {c.name}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isSuperAdminAccount ? (
                              <span
                                title="Super Admin"
                                className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 whitespace-nowrap"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> ADMIN
                              </span>
                            ) : isTeacherAccount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 whitespace-nowrap">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Giáo viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 whitespace-nowrap">
                                <GraduationCap className="w-3.5 h-3.5 shrink-0" /> Học viên
                              </span>
                            )}
                            {(() => {
                              const accTitle = resolveVisibleTitleBadge(account, attempts, roomsDb, customTitles);
                              if (!accTitle || accTitle.isRoleBuiltIn) return null;
                              return (
                                <div className="mt-2">
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${accTitle.badgeClass}`}>
                                    <span>{accTitle.icon}</span>
                                    <span>{accTitle.label}</span>
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isTeacherAccount ? (
                              <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                                Quản trị &amp; Ra đề
                              </span>
                            ) : (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingTargetUser({
                                      username: account.username,
                                      name: account.name || '',
                                      role: account.role || 'student',
                                      targetBand: account.targetBand || 7.5,
                                      studyGoal: account.studyGoal || '',
                                      avatarUrl: account.avatarUrl || ''
                                    })
                                  }
                                  title="Chỉnh sửa Target Band & thông tin tài khoản"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#FEF3C7] dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2.5 py-1 rounded-full whitespace-nowrap transition"
                                >
                                  <Target className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                                  Band {account.targetBand || '7.5'}
                                  <Edit className="w-3 h-3 opacity-70 shrink-0" />
                                </button>
                                {account.studyGoal && (
                                  <p className="text-[13px] text-[#475569] dark:text-slate-400 mt-1.5 max-w-[160px] mx-auto truncate" title={account.studyGoal}>
                                    {account.studyGoal}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isTeacherAccount ? (
                              <span className="text-xs font-bold text-[#92400E] dark:text-amber-300">
                                Toàn quyền quản lý
                              </span>
                            ) : studentAttempts.length > 0 ? (
                              <div className="inline-flex items-center gap-2 text-xs whitespace-nowrap">
                                <span className="bg-[#F1F5F9] dark:bg-slate-800 text-[#0F172B] dark:text-slate-200 px-2.5 py-1 rounded-md font-bold tabular-nums">
                                  {studentAttempts.length} bài
                                </span>
                                {bestBand !== null ? (
                                  <span className="font-bold text-[#065F46] dark:text-emerald-300 bg-[#D1FAE5] dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-md tabular-nums">
                                    Best {bestBand}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-[#475569] dark:text-slate-400">Chưa làm bài</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] font-mono text-[#475569] dark:text-slate-400 whitespace-nowrap tabular-nums">
                            {account.joinedDate || '-'}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-[#F8FAFC] dark:group-hover:bg-slate-800 transition z-10">
                            <div className="inline-flex items-center gap-2 whitespace-nowrap">
                              {openMemberProfile && (
                                <button
                                  type="button"
                                  onClick={() => openMemberProfile(account.username, 'TEACHER_DASHBOARD')}
                                  className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 whitespace-nowrap transition"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0" /> Hồ sơ
                                </button>
                              )}
                              {isViewerSuperAdmin && !isSuperAdminAccount && onOpenAdminTitleManager && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAdminTitleManager(account.username)}
                                  className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 whitespace-nowrap transition"
                                  title="Tặng hoặc gỡ danh hiệu cho tài khoản này"
                                >
                                  <Crown className="w-3.5 h-3.5 shrink-0" /> Danh Hiệu
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingTargetUser({
                                    username: account.username,
                                    name: account.name || '',
                                    role: account.role || 'student',
                                    targetBand: account.targetBand || 7.5,
                                    studyGoal: account.studyGoal || '',
                                    avatarUrl: account.avatarUrl || ''
                                  })
                                }
                                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 text-xs font-semibold whitespace-nowrap transition inline-flex items-center gap-1"
                                title="Sửa thông tin & phân quyền tài khoản"
                              >
                                <Edit className="w-3.5 h-3.5 shrink-0" /> Sửa
                              </button>
                              <button
                                type="button"
                                disabled={!canResetAccountPass}
                                onClick={() => {
                                  if (!canResetAccountPass) return;
                                  setEditingStudentAccount(account);
                                  setStudentPasswordDraft('');
                                }}
                                className={`min-h-[34px] px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition inline-flex items-center gap-1 ${
                                  canResetAccountPass
                                    ? 'bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border-[#CBD5E1] dark:border-slate-700'
                                    : 'bg-[#F1F5F9] dark:bg-slate-800/50 text-[#64748B] dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                }`}
                                title={
                                  canResetAccountPass
                                    ? 'Đặt lại mật khẩu đăng nhập'
                                    : 'Chỉ Quản trị hệ thống mới có quyền đổi mật khẩu Giáo viên khác'
                                }
                              >
                                <Key className="w-3.5 h-3.5 shrink-0" /> Đổi MK
                              </button>
                              <button
                                type="button"
                                disabled={disableDelete}
                                onClick={() => !disableDelete && handleDeleteAccount(account)}
                                className={`min-h-[34px] px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition inline-flex items-center gap-1 ${
                                  disableDelete
                                    ? 'bg-[#F1F5F9] dark:bg-slate-800/50 text-[#64748B] dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                    : 'bg-white dark:bg-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-[#B91C1C] dark:text-rose-300 border-[#FECACA] dark:border-rose-500/30'
                                }`}
                                title={
                                  isSuperAdminAccount
                                    ? 'Tài khoản Quản trị hệ thống được bảo vệ'
                                    : isSelfAccount
                                    ? 'Không thể xóa tài khoản đang đăng nhập'
                                    : 'Xóa tài khoản này'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

                  <ListPaginationBar
                    currentPage={accountsSlice.safePage}
                    totalItems={accountsSlice.totalItems}
                    pageSize={5}
                    onPageChange={setAccountsPage}
                    itemLabel="tài khoản"
                  />
                </>
              );
            })()}
          </div>
        </div>
        );
      })()}

      {/* Tab 6: Quản Lý Lớp Học */}
      {teacherHubTab === 'classes' && (
        <ClassManagerTab
          classesDb={classesDb}
          usersDb={usersDb}
          tests={tests}
          onUpsertClass={onUpsertClass}
          onDeleteClass={onDeleteClass}
          onUpdateClassMembers={onUpdateClassMembers}
          onAssignTestClasses={onAssignTestClasses}
          onCreateTestForClass={onCreateTestForClass}
          onCreateSkillForClass={onCreateSkillForClass}
          openMemberProfile={openMemberProfile}
          openExamBuilder={openExamBuilder}
          showToast={showToast}
        />
      )}
        </div>
      </div>

      {/* Student Completion Status Modal for Any Test or Exercise */}
      {completionModalTestId && (() => {
        const targetItem = (tests || []).find(item => item.id === completionModalTestId);
        if (!targetItem) return null;
        const cfg = normalizeExamConfig(targetItem);
        const isExercise = cfg.testMode === 'single_skill';
        const stats = getTestCompletionStats(targetItem.id);
        const q = completionSearch.trim().toLowerCase();

        const matchesSearch = acc =>
          !q ||
          (acc.name || '').toLowerCase().includes(q) ||
          (acc.username || '').toLowerCase().includes(q);

        const doneFiltered = stats.doneList.filter(d => matchesSearch(d.account));
        const missingFiltered = stats.missingList.filter(m => matchesSearch(m.account));

        const rowsToRender =
          completionFilter === 'missing'
            ? missingFiltered.map(m => ({ ...m, status: 'missing' }))
            : completionFilter === 'done'
            ? doneFiltered.map(d => ({ ...d, status: 'done' }))
            : [
                ...missingFiltered.map(m => ({ ...m, status: 'missing' })),
                ...doneFiltered.map(d => ({ ...d, status: 'done' }))
              ];

        return (
          <div
            className="apple-backdrop-enter fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setCompletionModalTestId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Kiểm tra tiến độ: ${targetItem.title}`}
              className="apple-modal-sheet bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88dvh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-[#F8FAFC] dark:bg-slate-900">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isExercise
                          ? 'bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] border-[#B5F5F1]'
                          : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-[#1EE1D6] border-[#CBD5E1] dark:border-teal-500/30'
                      }`}
                    >
                      {isExercise
                        ? `BÀI TẬP • ${cfg.focusSkill === 'speaking' ? 'SPEAKING AI' : (cfg.focusSkill || 'SKILL').toUpperCase()}`
                        : 'ĐỀ THI IELTS'}
                    </span>
                    <span className="text-xs font-bold text-[#475569] dark:text-slate-400">
                      Kiểm tra tiến độ học sinh
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white truncate">
                    {targetItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletionModalTestId(null)}
                  aria-label="Đóng hộp thoại kiểm tra tiến độ"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#475569] hover:text-[#0F172B] dark:hover:text-white transition"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KPI Strip & Controls */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 text-center">
                    <div className="text-xs font-bold text-[#475569] dark:text-slate-400">Tổng học sinh</div>
                    <div className="text-xl font-black text-[#0F172B] dark:text-white tabular-nums">{stats.totalStudents}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#D1FAE5]/60 dark:bg-emerald-500/10 text-center">
                    <div className="text-xs font-bold text-[#065F46] dark:text-emerald-300">Đã làm bài</div>
                    <div className="text-xl font-black text-[#065F46] dark:text-emerald-300 tabular-nums">{stats.doneList.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-center">
                    <div className="text-xs font-bold text-[#B91C1C] dark:text-rose-300">Chưa làm bài</div>
                    <div className="text-xl font-black text-[#B91C1C] dark:text-rose-300 tabular-nums">{stats.missingList.length}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 bg-[#F1F5F9] dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
                    {[
                      { id: 'missing', label: `Chưa làm (${stats.missingList.length})` },
                      { id: 'done', label: `Đã làm (${stats.doneList.length})` },
                      { id: 'all', label: `Tất cả (${stats.totalStudents})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCompletionFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-md transition ${
                          completionFilter === tab.id
                            ? tab.id === 'missing'
                              ? 'bg-[#B91C1C] text-white'
                              : tab.id === 'done'
                              ? 'bg-[#047857] text-white'
                              : 'bg-[#007A7A] text-white'
                            : 'text-[#334155] dark:text-slate-300 hover:text-[#0F172B] dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={completionSearch}
                        onChange={e => setCompletionSearch(e.target.value)}
                        placeholder="Tìm tên học sinh..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                      />
                    </div>
                    {stats.missingList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyMissingList(targetItem, stats.missingList)}
                        className="px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                        title="Sao chép danh sách học sinh chưa làm để nhắc nhở"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy DS Chưa Làm
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Student List Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
                {stats.totalStudents === 0 ? (
                  <div className="text-center py-10 text-sm text-[#475569] dark:text-slate-400">
                    Chưa có tài khoản học sinh nào. Hãy tạo tài khoản học sinh ở mục <strong>Tài Khoản Lớp</strong>.
                  </div>
                ) : rowsToRender.length === 0 ? (
                  <div className="text-center py-10 text-sm text-[#475569] dark:text-slate-400">
                    {completionFilter === 'missing' && !q
                      ? 'Tất cả học sinh trong lớp đều đã làm bài này!'
                      : 'Không tìm thấy học sinh phù hợp với bộ lọc.'}
                  </div>
                ) : (
                  rowsToRender.map(row => {
                    const stu = row.account;
                    const isMissing = row.status === 'missing';
                    return (
                      <div
                        key={stu.username}
                        className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
                          isMissing
                            ? 'bg-rose-50/50 dark:bg-rose-950/15 border-rose-200 dark:border-rose-500/25'
                            : 'bg-[#D1FAE5]/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-500/25'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatarBadge user={stu} sizeClass="w-9 h-9" textClass="text-sm" rounded="rounded-lg" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[#0F172B] dark:text-white truncate">
                                {stu.name || stu.username}
                              </span>
                              <span className="text-xs font-mono text-[#475569] dark:text-slate-400">
                                @{stu.username}
                              </span>
                              {isMissing ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-[#991B1B] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                  Chưa làm bài
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                  Đã nộp {row.attemptCount} lần
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                              {isMissing ? (
                                <span>Mục tiêu: Band {stu.targetBand || 7.5}</span>
                              ) : (
                                <span>
                                  Nộp gần nhất: <strong>{row.latestAttempt?.submittedAt}</strong>
                                  {Number(row.latestAttempt?.durationSeconds) > 0 && (
                                    <> · Thời lượng: <strong>{formatDurationVi(row.latestAttempt.durationSeconds)}</strong></>
                                  )}
                                  {row.latestAttempt?.timelinessStatus === 'late' && (
                                    <> · <span className="text-[#B91C1C] dark:text-rose-400 font-bold">Nộp muộn{row.latestAttempt.lateByMinutes ? ` ${row.latestAttempt.lateByMinutes}p` : ''}</span></>
                                  )}
                                  {row.bestBand !== null ? (
                                    <> · Band cao nhất: <strong className="text-[#0F766E] dark:text-[#1EE1D6]">{row.bestBand}</strong></>
                                  ) : row.hasPendingGrade ? (
                                    <> · <span className="text-[#92400E] dark:text-amber-400 font-bold">Chờ chấm</span></>
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {openMemberProfile && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompletionModalTestId(null);
                                openMemberProfile(stu.username, 'TEACHER_DASHBOARD');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border border-[#CBD5E1] dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Hồ sơ
                            </button>
                          )}
                          {!isMissing && row.latestAttempt && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletionModalTestId(null);
                                  openTeacherGradingModal(row.latestAttempt);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition"
                              >
                                Chấm / Sửa Điểm
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletionModalTestId(null);
                                  setSelectedAttemptId(row.latestAttempt.id);
                                  setPreviousView('TEACHER_DASHBOARD');
                                  setView('RESULT_VIEW');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1] text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 text-xs font-bold transition"
                              >
                                Xem bài làm
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Teacher Notification Broadcast Modal */}
      {showNotifyModal && (
        <div
          className="apple-backdrop-enter fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          onClick={() => setShowNotifyModal(false)}
        >
          <div
            className="apple-modal-sheet bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90dvh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-600" /> Gửi Thông Báo Học Tập Tới Lớp
                </h2>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  Mọi thông báo được đồng bộ real-time lên thanh chuông của toàn bộ học viên. (Khi bạn tạo hoặc mở công khai đề thi mới, hệ thống cũng tự động thông báo!)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="p-2 rounded-lg text-[#475569] hover:text-[#0F172B] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!handleCreateNotification || notifySending) return;
                  setNotifySending(true);
                  const ok = await handleCreateNotification(notifyForm);
                  setNotifySending(false);
                  if (ok !== false) {
                    setNotifyForm({ title: '', message: '', type: 'announcement', testId: '', roomPin: '', targetClassIds: [] });
                  }
                }}
                className="space-y-3.5 bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Loại thông báo</label>
                    <select
                      value={notifyForm.type}
                      onChange={e => setNotifyForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-[#0F172B] dark:text-slate-100"
                    >
                      <option value="announcement">Thông báo chung</option>
                      <option value="exam">Giao Đề Thi IELTS</option>
                      <option value="exercise">Giao Bài Tập 4 Kỹ Năng</option>
                      <option value="game">Mời Đua Top Game Từ Vựng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">
                      Đính kèm Đề / Bài tập (tùy chọn)
                    </label>
                    <select
                      value={notifyForm.testId}
                      onChange={e => {
                        const tid = e.target.value;
                        const matched = tests.find(t => t.id === tid);
                        setNotifyForm(prev => ({
                          ...prev,
                          testId: tid,
                          roomPin: tid ? '' : prev.roomPin,
                          type: matched ? (matched.testMode === 'single_skill' ? 'exercise' : 'exam') : prev.type,
                          title: !prev.title && matched ? `Nhắc làm bài: ${matched.title}` : prev.title
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-[#0F172B] dark:text-slate-100"
                    >
                      <option value="">-- Không đính kèm đề thi --</option>
                      {tests
                        .filter(t => (t?.visibility || 'public') !== 'private')
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.testMode === 'single_skill' ? '[Bài Tập] ' : '[Đề Thi] '}
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Tiêu đề thông báo *</label>
                    <input
                      type="text"
                      required
                      value={notifyForm.title}
                      onChange={e => setNotifyForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="VD: Hoàn thành Mock Test 02 trước 21h tối nay!"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Hoặc PIN Game (nếu mời)</label>
                    <input
                      type="text"
                      value={notifyForm.roomPin}
                      onChange={e => setNotifyForm(prev => ({ ...prev, roomPin: e.target.value, testId: e.target.value ? '' : prev.testId }))}
                      placeholder={`VD: ${currentRoomPin}`}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-[#0F172B] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1">Nội dung chi tiết *</label>
                  <textarea
                    rows={3}
                    required
                    value={notifyForm.message}
                    onChange={e => setNotifyForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Nhập dặn dò, hạn nộp bài hoặc phần thưởng danh hiệu cho học viên..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  />
                </div>

                {Object.keys(classesDb || {}).length > 0 && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#334155] dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                        Đối tượng nhận thông báo
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifyForm(prev => ({ ...prev, targetClassIds: [] }))}
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md transition ${
                          !notifyForm.targetClassIds?.length
                            ? 'bg-[#007A7A] text-white'
                            : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Tất cả học viên
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(classesDb).map(cls => {
                        const selected = (notifyForm.targetClassIds || []).includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() =>
                              setNotifyForm(prev => {
                                const curr = Array.isArray(prev.targetClassIds) ? prev.targetClassIds : [];
                                const next = curr.includes(cls.id)
                                  ? curr.filter(id => id !== cls.id)
                                  : [...curr, cls.id];
                                return { ...prev, targetClassIds: next };
                              })
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                              selected
                                ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                            }`}
                          >
                            {selected ? '✓ ' : ''}{cls.name} ({cls.studentUsernames?.length || 0} HS)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={notifySending}
                    className="px-5 py-2.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {notifySending
                      ? 'Đang gửi...'
                      : notifyForm.targetClassIds?.length > 0
                      ? `Phát Thông Báo Tới ${notifyForm.targetClassIds.length} Lớp Đã Chọn`
                      : 'Phát Thông Báo Tới Toàn Lớp'}
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-slate-400">
                  Lịch Sử Thông Báo Đã Gửi ({notifications.length})
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-[#475569] py-4 text-center">Chưa có thông báo nào được gửi.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#0F172B] dark:text-white">{n.title}</p>
                          <p className="text-xs text-[#334155] dark:text-slate-300 mt-0.5">{n.message}</p>
                          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                            {n.createdAt} • {n.readCount || 0} học viên đã xem
                          </p>
                        </div>
                        {handleDeleteNotification && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(n.id)}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 shrink-0"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
