import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
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
  Gamepad2,
  Globe,
  GraduationCap,
  Headphones,
  Key,
  Lock,
  Mic,
  PenTool,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
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
  Wifi,
  X
} from 'lucide-react';
import {
  DEFAULT_VOCAB_TEXT,
  getListeningTracks,
  getReadingPassages,
  getSpeakingQuestionItems,
  normalizeExamConfig
} from '../constants/seedData';
import { countExtensionCheatSignals, exportAttemptsToCsv, getRiskAssessment, normalizeRoomObject } from '../utils/examHelpers';
import AnimalPilotAvatar from '../components/common/AnimalPilotAvatar';
import UserAvatarBadge from '../components/common/UserAvatarBadge';

export default function TeacherDashboard({
  attempts,
  copiedRoomPin,
  currentRoomPin,
  currentUser,
  expandedTeacherTestId,
  gradingFilters,
  handleBulkDeleteAccounts,
  handleCopyInviteLink,
  handleDeleteAccount,
  handleDeleteAttempt,
  handleDeleteRoom,
  handleDeleteTest,
  handleDuplicateTest,
  handleKickLobbyPlayer,
  handlePurgeOrphanAttempts,
  handleTeacherOpenLobby,
  handleTeacherResetLobby,
  initGameCampaign,
  openExamBuilder,
  openMemberProfile,
  openSingleSkillBuilder,
  openTeacherGradingModal,
  roomsDb,
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
  const [exerciseSkillFilter, setExerciseSkillFilter] = useState('all');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [onlyIncompleteFilter, setOnlyIncompleteFilter] = useState(false);
  const [completionModalTestId, setCompletionModalTestId] = useState(null);
  const [completionFilter, setCompletionFilter] = useState('missing');
  const [completionSearch, setCompletionSearch] = useState('');
  const [renamingTestId, setRenamingTestId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [selectedUsernames, setSelectedUsernames] = useState([]);

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
  const filteredAccounts = allAccounts.filter(u => {
    if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) return false;
    const q = studentSearchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const getTestCompletionStats = (testId) => {
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
    for (const stu of studentAccounts) {
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
      totalStudents: studentAccounts.length,
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
  const itemQuery = itemSearchQuery.trim().toLowerCase();

  const matchesItemFilters = (item) => {
    if (itemQuery && !(item.title || '').toLowerCase().includes(itemQuery)) return false;
    if (onlyIncompleteFilter && getTestCompletionStats(item.id).missingList.length === 0) return false;
    return true;
  };

  const filteredFullExamTests = fullExamTests.filter(matchesItemFilters);
  const skillFilteredList = exerciseSkillFilter === 'all'
    ? skillExercises
    : skillExercises.filter(t => normalizeExamConfig(t).focusSkill === exerciseSkillFilter);
  const filteredSkillExercises = skillFilteredList.filter(matchesItemFilters);

  const SKILL_EXERCISE_BUTTONS = [
    { id: 'speaking', label: '+ Bài Tập Speaking AI', shortLabel: 'Speaking AI', icon: Mic, cls: 'bg-[#570DF8]/10 text-[#570DF8] dark:text-[#C4B5FD] border-[#570DF8]/30 hover:bg-[#570DF8] hover:text-white' },
    { id: 'listening', label: '+ Bài Tập Listening', shortLabel: 'Listening', icon: Headphones, cls: 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30 hover:bg-[#007A7A] hover:text-white' },
    { id: 'reading', label: '+ Bài Tập Reading', shortLabel: 'Reading', icon: BookOpen, cls: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 hover:bg-blue-600 hover:text-white' },
    { id: 'writing', label: '+ Bài Tập Writing', shortLabel: 'Writing', icon: PenTool, cls: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-600 hover:text-white' }
  ];

  const renderManagementItemCard = (t) => {
    const cfg = normalizeExamConfig(t);
    const isExercise = cfg.testMode === 'single_skill';
    const isPrivate = cfg.visibility === 'private';
    const isExpanded = expandedTeacherTestId === t.id;
    const entityLabel = isExercise ? 'bài tập' : 'đề thi';
    const stats = getTestCompletionStats(t.id);
    const completionPct = stats.totalStudents > 0
      ? Math.round((stats.doneList.length / stats.totalStudents) * 100)
      : 0;

    return (
      <div
        key={t.id}
        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
          isExpanded
            ? 'border-[#007A7A]/50 dark:border-[#1EE1D6]/40 ring-2 ring-[#007A7A]/12 shadow-lg p-5 sm:p-6'
            : 'border-pink-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-pink-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Minimal Header Row: Title + Công khai / Chỉ mình tôi */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpandedTeacherTestId(prev => (prev === t.id ? null : t.id))}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpandedTeacherTestId(prev => (prev === t.id ? null : t.id));
            }
          }}
          aria-expanded={isExpanded}
          className={`w-full flex items-center justify-between gap-3 text-left cursor-pointer select-none ${
            isExpanded ? '' : 'px-5 py-4'
          }`}
        >
          {renamingTestId === t.id ? (
            <div
              className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[220px]"
              onClick={e => e.stopPropagation()}
            >
              <input
                type="text"
                autoFocus
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
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-[#007A7A] dark:border-[#1EE1D6] text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCommitInlineRename(t.id)}
                className="px-2.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
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
                className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1"
                title="Hủy (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                  isExercise
                    ? cfg.focusSkill === 'speaking'
                      ? 'bg-[#570DF8]/12 text-[#570DF8] dark:text-[#C4B5FD] border-[#570DF8]/30'
                      : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30'
                    : 'bg-teal-50 dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border-teal-200 dark:border-teal-500/30'
                }`}
              >
                {isExercise
                  ? `BÀI TẬP • ${cfg.focusSkill === 'speaking' ? 'SPEAKING AI' : (cfg.focusSkill || 'skill').toUpperCase()}`
                  : 'ĐỀ THI IELTS'}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                {t.title}
              </h3>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setRenamingTestId(t.id);
                  setRenameDraft(t.title || '');
                }}
                title={`Đổi nhanh tên ${entityLabel} ngay tại đây`}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/20 text-slate-600 dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1 shrink-0"
              >
                <Edit className="w-3 h-3" /> Đổi tên
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleOpenCompletionModal(t.id);
              }}
              title="Kiểm tra học sinh đã làm và chưa làm bài này"
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                stats.totalStudents === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  : stats.missingList.length > 0
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                  : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
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
              onClick={e => {
                e.stopPropagation();
                toggleTestVisibility(t.id);
              }}
              title="Bấm để chuyển Công khai / Chỉ mình tôi thấy"
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                isPrivate
                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                  : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
              }`}
            >
              {isPrivate ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {isPrivate ? 'Chỉ mình tôi' : 'Công khai'}
            </button>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              }`}
            />
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
            <div className="mt-4 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {isExercise ? (
                    <span className="text-[11px] bg-[#570DF8]/10 text-[#570DF8] dark:text-[#C4B5FD] font-bold px-2.5 py-1 rounded-lg border border-[#570DF8]/25">
                      {cfg.focusSkill === 'speaking'
                        ? `Speaking AI: ${getSpeakingQuestionItems(t.speaking, 'all').length} câu (Part 1·2·3)`
                        : cfg.focusSkill === 'listening'
                        ? `Bài tập Listening: ${t.listening?.questions?.length || 0} câu (${cfg.durations.listening}p)`
                        : cfg.focusSkill === 'reading'
                        ? `Bài tập Reading: ${t.reading?.questions?.length || 0} câu (${cfg.durations.reading}p)`
                        : `Bài tập Writing: Task 1 & 2 (${cfg.durations.writing}p)`}
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                        Listening: {t.listening?.questions?.length || 0} • Reading: {t.reading?.questions?.length || 0}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-2 py-0.5 rounded-md">
                        ⏱ {cfg.durations.listening}p L • {cfg.durations.reading}p R • {cfg.durations.writing}p W
                      </span>
                    </>
                  )}
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                    {cfg.maxAttempts === 0 ? '∞ Luyện tự do' : `🔒 Tối đa ${cfg.maxAttempts} lần`}
                  </span>
                  {!isExercise && cfg.sequentialMode && (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                      Tuần tự: {cfg.order.map(s => s[0].toUpperCase()).join('→')}
                    </span>
                  )}
                  {(!isExercise || cfg.focusSkill === 'listening') && (
                    hasListeningAudio ? (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                        🎵 {listeningTracksCount > 1 ? `${listeningTracksCount} chủ đề nghe` : 'Đã đính kèm Audio'}
                      </span>
                    ) : listeningTracksCount > 1 || hasListeningImg ? (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                        🎧 {listeningTracksCount} chủ đề nghe {hasListeningImg ? '(có ảnh)' : '(AI Voice)'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-md">
                        🔊 Dùng AI Voice (TTS)
                      </span>
                    )
                  )}
                  {(!isExercise || cfg.focusSkill === 'reading') && (hasReadingImg || passagesCount > 1) && (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                      🖼️ {passagesCount} bài Reading
                    </span>
                  )}
                  {(!isExercise || cfg.focusSkill === 'writing') && t.writing?.task1?.imageUrl && (
                    <span className="text-[10px] bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/30">
                      📊 Có biểu đồ Task 1
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="p-3.5 rounded-2xl bg-[#EDFFFD]/65 dark:bg-teal-500/10 border border-[#B5F5F1] dark:border-teal-500/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[#003538] dark:text-[#1EE1D6] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> {isExercise ? 'Thời gian làm bài (phút)' : 'Thời gian từng phần (phút)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openExamBuilder(t, 'general')}
                      className="text-[10px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
                    >
                      Cài đặt chi tiết →
                    </button>
                  </div>
                  <div className={`grid gap-1.5 ${cfg.order.length === 1 ? 'grid-cols-1 max-w-[200px]' : 'grid-cols-3'}`}>
                    {cfg.order.map((sId, sIdx) => (
                      <div key={sId} className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-[#B5F5F1]/80 dark:border-slate-700 text-center">
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {cfg.order.length > 1 ? `${sIdx + 1}. ` : ''}{sId === 'listening' ? 'Nghe' : sId === 'reading' ? 'Đọc' : sId === 'speaking' ? 'Nói AI' : 'Viết'}
                        </span>
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
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
                            className="w-12 px-1 py-0.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">p</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isExercise && (
                    <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                      {cfg.sequentialMode
                        ? 'Hết giờ từng phần sẽ tự động chuyển sang phần tiếp theo.'
                        : 'Đang cho phép chuyển tự do giữa các phần.'}
                    </p>
                  )}
                </div>

                {/* 4 Quick Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Hiển thị {entityLabel} cho HS</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isPrivate ? 'Đang ẩn — HS chưa thấy' : 'Công khai — HS làm được'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestVisibility(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        isPrivate
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      {isPrivate ? 'Đang Ẩn' : 'Công Khai'}
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Chế độ Luyện / Thi thật</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
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
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        cfg.maxAttempts === 1
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {cfg.maxAttempts === 1 ? 'Thi Thật' : cfg.maxAttempts === 0 ? 'Thi Thử' : `Tối đa ${cfg.maxAttempts}`}
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Xem đáp án đúng</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t.allowViewAnswers ? 'HS xem được sau khi nộp' : 'Đang ẩn đáp án đúng'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestAllowViewAnswers(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        t.allowViewAnswers
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
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

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Chống gian lận (Ẩn với HS)</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {cfg.antiCheatEnabled ? 'Đếm tab, khóa chuột phải & Extension' : 'Đang tắt — làm tự do'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTestAntiCheat(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                        cfg.antiCheatEnabled
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
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
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                      Theo Dõi Học Sinh Làm Bài:
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Đã làm: {stats.doneList.length}/{stats.totalStudents} HS
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                        stats.missingList.length > 0
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Chưa làm: {stats.missingList.length} HS
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {stats.missingList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyMissingList(t, stats.missingList)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy DS Chưa Làm
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCompletionModal(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Users className="w-3 h-3" /> Kiểm Tra Chi Tiết ({stats.totalStudents} HS)
                    </button>
                  </div>
                </div>

                {stats.totalStudents > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        completionPct === 100 ? 'bg-emerald-500' : 'bg-[#007A7A]'
                      }`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                )}

                {stats.totalStudents === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chưa có tài khoản học sinh nào trong danh sách tài khoản.
                  </p>
                ) : stats.missingList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-rose-700 dark:text-rose-300">Còn thiếu:</span>
                    {stats.missingList.slice(0, 6).map(({ account }) => (
                      <span
                        key={account.username}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 text-slate-700 dark:text-slate-200 font-semibold"
                      >
                        {account.name || account.username}
                      </span>
                    ))}
                    {stats.missingList.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompletionModal(t.id)}
                        className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold hover:underline"
                      >
                        +{stats.missingList.length - 6} bạn nữa...
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tuyệt vời! 100% học sinh trong lớp đã làm bài này.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openExamBuilder(t, 'general')}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" /> Sửa Tên &amp; Cài Đặt Chung
                  </button>
                  <button
                    type="button"
                    onClick={() => openExamBuilder(t, isExercise && cfg.focusSkill ? cfg.focusSkill : 'reading')}
                    className="bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30"
                  >
                    <Edit className="w-3.5 h-3.5" /> Soạn Câu Hỏi &amp; Nội Dung
                  </button>
                  <button
                    type="button"
                    onClick={() => startExam?.(t.id)}
                    className="bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 dark:hover:bg-teal-500/25 text-[#007A7A] dark:text-[#1EE1D6] font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 border border-[#B5F5F1] dark:border-teal-500/30"
                    title={`Mở giao diện làm bài như học sinh để kiểm tra ${entityLabel} (kể cả khi Đang Ẩn)`}
                  >
                    <Play className="w-3.5 h-3.5" /> {isExercise ? 'Làm Thử Bài Tập' : 'Làm Thử Đề Thi'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicateTest(t)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/15 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
                    title={`Nhân bản ${entityLabel} (Bản sao tự động ở chế độ Riêng tư)`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTest(t)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                    title={`Xóa ${entityLabel} này`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedTeacherTestId(null)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">
      {/* Studio Hero Header Card (Clean & Hierarchy-Driven) */}
      <div className="bg-white/95 dark:bg-slate-900 rounded-3xl border border-pink-200/80 dark:border-slate-800 shadow-[0_14px_38px_-18px_rgba(15,23,42,0.12)] p-6 sm:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-[#FFF5F8] dark:bg-teal-950/50 text-[#007A7A] dark:text-[#1EE1D6] border border-pink-200 dark:border-teal-500/30 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Trung Tâm Điều Hành • Ms. Như IELTS Nha Trang</span>
            </div>
            {isViewerSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bảng Điều Khiển Giáo Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Quản lý đề thi thử IELTS, bài tập 4 kỹ năng, theo dõi học sinh chưa làm bài, chấm điểm AI và phòng Game PIN trực tuyến.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openExamBuilder()}
            className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-2xl shadow-md shadow-teal-900/15 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo Đề Thi Mới
          </button>
          <button
            type="button"
            onClick={() => setTeacherHubTab('skill_exercises')}
            className="bg-[#570DF8]/10 hover:bg-[#570DF8] text-[#570DF8] dark:text-[#C4B5FD] hover:text-white border border-[#570DF8]/25 text-xs sm:text-sm font-extrabold px-4 py-3 rounded-2xl transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Tạo Bài Tập 4 Kỹ Năng
          </button>
        </div>
      </div>

      {/* Interactive Overview KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setTeacherHubTab('tests')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
            teacherHubTab === 'tests'
              ? 'bg-white dark:bg-slate-900 border-[#007A7A]/50 ring-2 ring-[#007A7A]/12 shadow-md'
              : 'bg-white/90 dark:bg-slate-900/90 border-pink-200/80 dark:border-slate-800 hover:border-[#007A7A]/40 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kho Đề Thi</span>
            <span className="w-8 h-8 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{fullExamTests.length}</p>
          <p className="text-[11px] text-[#007A7A] dark:text-[#1EE1D6] font-semibold mt-0.5">
            {publicFullExamsCount} đề đang công khai
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTeacherHubTab('skill_exercises')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
            teacherHubTab === 'skill_exercises'
              ? 'bg-white dark:bg-slate-900 border-[#570DF8]/50 ring-2 ring-[#570DF8]/12 shadow-md'
              : 'bg-white/90 dark:bg-slate-900/90 border-pink-200/80 dark:border-slate-800 hover:border-[#570DF8]/40 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bài Tập 4 Kỹ Năng</span>
            <span className="w-8 h-8 rounded-xl bg-[#570DF8]/10 text-[#570DF8] dark:text-[#C4B5FD] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{skillExercises.length}</p>
          <p className="text-[11px] text-[#570DF8] dark:text-[#C4B5FD] font-semibold mt-0.5">
            Speaking AI · L · R · W
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTeacherHubTab('grading')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
            teacherHubTab === 'grading'
              ? 'bg-white dark:bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/12 shadow-md'
              : 'bg-white/90 dark:bg-slate-900/90 border-pink-200/80 dark:border-slate-800 hover:border-amber-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bài Nộp &amp; Chấm AI</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{attempts.length}</p>
          <p className={`text-[11px] font-semibold mt-0.5 ${pendingGradingCount > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {pendingGradingCount > 0 ? `${pendingGradingCount} bài đang chờ chấm` : 'Đã chấm toàn bộ bài nộp'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setTeacherHubTab('accounts')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
            (teacherHubTab === 'accounts' || teacherHubTab === 'students')
              ? 'bg-white dark:bg-slate-900 border-indigo-500/50 ring-2 ring-indigo-500/12 shadow-md'
              : 'bg-white/90 dark:bg-slate-900/90 border-pink-200/80 dark:border-slate-800 hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Học Viên &amp; Game</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{studentAccountsCount}</p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold mt-0.5">
            PIN #{currentRoomPin} · {lobbyPlayersList.length} chờ
          </p>
        </button>
      </div>

      {/* Segmented Pill Workspace Navigation */}
      <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'tests', label: '1. Kho Đề Thi', count: fullExamTests.length, icon: BookOpen, activeCls: 'bg-[#007A7A] text-white shadow-sm' },
          { id: 'skill_exercises', label: '2. Bài Tập 4 Kỹ Năng', count: skillExercises.length, icon: Sparkles, activeCls: 'bg-[#570DF8] text-white shadow-sm' },
          { id: 'grading', label: '3. Chấm Bài & Giám Sát', count: attempts.length, icon: PenTool, activeCls: 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' },
          { id: 'game_room', label: '4. Phòng Game PIN', count: `PIN #${currentRoomPin}`, icon: Trophy, activeCls: 'bg-emerald-600 text-white shadow-sm' },
          { id: 'accounts', label: '5. Tài Khoản Lớp', count: allAccounts.length, icon: Users, activeCls: 'bg-indigo-600 text-white shadow-sm' }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive =
            teacherHubTab === tab.id || (tab.id === 'accounts' && teacherHubTab === 'students');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTeacherHubTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                isActive
                  ? tab.activeCls
                  : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconComp className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-slate-900/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 2: Kho Bài Tập 4 Kỹ Năng Riêng Biệt */}
      {teacherHubTab === 'skill_exercises' && (
        <div className="space-y-4">
          <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#570DF8] dark:text-[#A78BFA]" />
                  Tạo Bài Tập Cho Từng Kỹ Năng Riêng Biệt
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chọn kỹ năng để soạn bài tập nhanh (Speaking AI, Listening, Reading, Writing) tách biệt khỏi bộ Đề Thi IELTS.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {SKILL_EXERCISE_BUTTONS.map(sk => {
                const IconComp = sk.icon;
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => openSingleSkillBuilder?.(sk.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 shadow-xs ${sk.cls}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{sk.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-pink-200/80 dark:border-slate-800 text-xs font-bold">
              {[
                { id: 'all', label: `Tất cả bài tập (${skillExercises.length})` },
                { id: 'speaking', label: `Speaking AI (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'speaking').length})` },
                { id: 'listening', label: `Listening (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'listening').length})` },
                { id: 'reading', label: `Reading (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'reading').length})` },
                { id: 'writing', label: `Writing (${skillExercises.filter(t => normalizeExamConfig(t).focusSkill === 'writing').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExerciseSkillFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    exerciseSkillFilter === tab.id
                      ? 'bg-[#570DF8] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={e => setItemSearchQuery(e.target.value)}
                  placeholder="Tìm bài tập..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#570DF8]"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyIncompleteFilter(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  onlyIncompleteFilter
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-pink-200/80 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{onlyIncompleteFilter ? 'Đang lọc: Còn HS chưa làm' : 'Lọc bài còn HS chưa làm'}</span>
              </button>
            </div>
          </div>

          {filteredSkillExercises.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-pink-200/80 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              {onlyIncompleteFilter
                ? 'Tất cả bài tập trong mục này đã được 100% học sinh hoàn thành!'
                : 'Chưa có bài tập nào cho bộ lọc này. Hãy bấm các nút + Bài Tập Speaking AI / Listening / Reading / Writing phía trên để tạo ngay.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSkillExercises.map(renderManagementItemCard)}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Kho Đề Thi */}
      {teacherHubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-2xl p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Danh Sách Đề Thi IELTS ({fullExamTests.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đề thi chuẩn 3 phần Listening · Reading · Writing. Bấm <strong>Chưa làm: ... HS</strong> để kiểm tra và nhắc học sinh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={e => setItemSearchQuery(e.target.value)}
                  placeholder="Tìm đề thi..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyIncompleteFilter(prev => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  onlyIncompleteFilter
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{onlyIncompleteFilter ? 'Đang lọc: Còn HS chưa làm' : 'Lọc đề còn HS chưa làm'}</span>
              </button>
              <button
                type="button"
                onClick={() => openExamBuilder()}
                className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> + Tạo Đề Thi Mới
              </button>
            </div>
          </div>

          {filteredFullExamTests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              {onlyIncompleteFilter
                ? 'Tất cả đề thi IELTS đã được 100% học sinh trong lớp hoàn thành!'
                : 'Chưa có đề thi IELTS nào. Bấm + Tạo Đề Thi Mới để bắt đầu.'}
            </div>
          ) : (
            filteredFullExamTests.map(renderManagementItemCard)
          )}
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng bài đã nộp</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{attempts.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Chờ chấm điểm</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1 tabular-nums">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Band TB toàn lớp</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1 tabular-nums">{avgBandDisplay}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cảnh báo tab (≥3)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{highRiskCount}</p>
            </div>
          </div>

          {/* Filter & CSV Export Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                <Filter className="w-3.5 h-3.5" /> Lọc:
              </span>
              <select
                value={gradingFilters.testId}
                onChange={e => setGradingFilters(prev => ({ ...prev, testId: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]"
              >
                <option value="all">Tất cả đề thi &amp; bài tập</option>
                {uniqueAttemptTests.map(([tid, title]) => (
                  <option key={tid} value={tid}>{title}</option>
                ))}
              </select>
              <select
                value={gradingFilters.status}
                onChange={e => setGradingFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ chấm Writing</option>
                <option value="graded">Đã chấm xong</option>
              </select>
              <select
                value={gradingFilters.risk}
                onChange={e => setGradingFilters(prev => ({ ...prev, risk: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="all">Mọi mức độ tab</option>
                <option value="risk">Nghi gian lận (≥3 tab)</option>
              </select>
              <input
                type="text"
                placeholder="🔍 Tên học viên..."
                value={gradingFilters.search}
                onChange={e => setGradingFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {orphanAttemptsCount > 0 && handlePurgeOrphanAttempts && (
                <button
                  type="button"
                  onClick={handlePurgeOrphanAttempts}
                  title="Dọn sạch các bài làm thuộc những tài khoản đã bị xóa"
                  className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
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
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Xuất CSV Excel ({filteredAttempts.length})
              </button>
            </div>
          </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Học Sinh</th>
                  <th className="px-6 py-3.5">Đề Thi</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                  <th className="px-6 py-3.5 text-center">Chống Gian Lận (Tab Switch)</th>
                  <th className="px-6 py-3.5 text-center">Trạng Thái Chấm</th>
                  <th className="px-6 py-3.5 text-center">Overall</th>
                  <th className="px-6 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                      Không có bài nộp nào khớp bộ lọc hiện tại.{' '}
                      <button
                        type="button"
                        onClick={() => setGradingFilters({ testId: 'all', status: 'all', risk: 'all', search: '' })}
                        className="text-blue-600 dark:text-blue-400 font-bold underline ml-1"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </td>
                  </tr>
                ) : filteredAttempts.map(att => {
                  const risk = getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs);
                  const extSignals = countExtensionCheatSignals(att.antiCheatLogs);
                  const RiskIcon = risk.icon;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <UserAvatarBadge
                            user={usersDb?.[att.studentId] || { username: att.studentId, name: att.studentName }}
                            sizeClass="w-8 h-8"
                            textClass="text-xs"
                            rounded="rounded-xl"
                          />
                          {openMemberProfile && att.studentId ? (
                            <button
                              type="button"
                              onClick={() => openMemberProfile(att.studentId, 'TEACHER_DASHBOARD')}
                              title="Xem hồ sơ thành viên"
                              className="inline-flex items-center gap-1.5 text-left hover:text-teal-600 dark:hover:text-teal-400 hover:underline transition"
                            >
                              <span>{att.studentName}</span>
                              <Eye className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            </button>
                          ) : (
                            <span>{att.studentName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              att.testMode === 'single_skill'
                                ? 'bg-[#570DF8]/10 text-[#570DF8] dark:text-[#C4B5FD] border-[#570DF8]/25'
                                : 'bg-teal-50 dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border-teal-200 dark:border-teal-500/30'
                            }`}
                          >
                            {att.testMode === 'single_skill'
                              ? `BÀI TẬP • ${(att.focusSkill || 'SK').toUpperCase()}`
                              : 'ĐỀ THI'}
                          </span>
                          <span>{att.testTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${risk.color}`}>
                            <RiskIcon className="w-3.5 h-3.5" />
                            {risk.label} ({att.tabSwitchCount} lần)
                          </span>
                          {extSignals > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Extension / Bypass: {extSignals}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.teacherGraded ? (
                          <span className="text-xs bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                            {att.aiGraded && <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
                            {att.aiGraded ? 'AI Đã Chấm' : 'Đã Chấm'}
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md font-bold border border-amber-200 dark:border-amber-500/30">
                            Cần Chấm Writing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-extrabold text-blue-600 dark:text-blue-400">
                          {att.overallBand ?? '-'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                          {att.focusSkill === 'speaking' || att.scores?.speaking
                            ? `Speaking ${att.scores?.speaking?.band ?? att.overallBand ?? '-'}`
                            : att.testMode === 'single_skill'
                            ? `${(att.focusSkill || '').toUpperCase()} ${att.overallBand ?? '-'}`
                            : `L ${att.scores?.listening?.band ?? '-'} · R ${att.scores?.reading?.band ?? '-'} · W ${att.scores?.writing?.overallBand ?? '-'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openTeacherGradingModal(att)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                          >
                            {att.testMode === 'single_skill' ? 'Chấm & Xem Chi Tiết' : 'Chấm & Sửa Điểm (L/R/W)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('TEACHER_DASHBOARD');
                              setView('RESULT_VIEW');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-500/15 text-slate-600 hover:text-[#007A7A] dark:text-slate-300 dark:hover:text-[#1EE1D6] border border-slate-200 dark:border-slate-700 transition"
                            title="Xem chi tiết từng câu & bài làm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(att)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
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
        </div>
        </div>
        );
      })()}

      {/* Tab 3: Phòng Đấu Game PIN & Leaderboard */}
      {teacherHubTab === 'game_room' && (
        <div className="space-y-6">
          {/* Room Switcher + Create Room */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Danh sách phòng:</span>
              {allRoomsList.map(r => {
                const isActiveRoom = r.pin === currentRoomPin;
                const rLobbyCount = Object.keys(r.lobbyPlayers || {}).length;
                return (
                  <div key={r.pin} className="inline-flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setCurrentRoomPin(r.pin);
                        setCustomVocabInput(r.rawVocab || DEFAULT_VOCAB_TEXT);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-2 ${
                        isActiveRoom
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-mono">#{r.pin}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'PLAYING' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {rLobbyCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActiveRoom ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'}`}>
                          {rLobbyCount} chờ
                        </span>
                      )}
                    </button>
                    {allRoomsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(r.pin)}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white border-l border-slate-200 dark:border-slate-700 transition"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tạo Phòng Mới
            </button>
          </div>

          {/* Dropship Room Hero */}
          <div className="bg-gradient-to-br from-[#0F172B] via-[#003538] to-[#065B5B] rounded-3xl p-6 sm:p-7 text-white border border-[#007A7A]/40 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
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
                  <p className="text-[10px] text-[#1EE1D6] font-bold uppercase tracking-wider">Mã Phòng (PIN)</p>
                  <p className="text-3xl font-black text-amber-300 font-mono tracking-widest">{currentRoomPin}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(currentRoomPin);
                    setCopiedRoomPin(true);
                    setTimeout(() => setCopiedRoomPin(false), 1800);
                    showToast(`Đã sao chép mã phòng ${currentRoomPin}!`);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition"
                  title="Sao chép mã phòng"
                >
                  {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoomPin ? 'Đã chép' : 'Copy PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(currentRoomPin)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 flex items-center gap-1.5 transition"
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
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-semibold text-[11px] text-amber-200">
                  {room.roundSize || 4} từ/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Mở Sảnh Chờ Phi Thuyền
              </button>
              {room.status !== 'LOBBY' && (
                <button
                  onClick={() => handleTeacherResetLobby(currentRoomPin)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh Mới
                </button>
              )}
              <button
                onClick={() => {
                  initGameCampaign(currentRoomPin, currentUser);
                  setView('GAME_ARENA');
                }}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" /> Chơi Thử GV
              </button>
              <button
                onClick={() => {
                  setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                  setShowVocabModal(true);
                }}
                className="bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition border border-purple-400/40 flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Sửa Bộ Từ Vựng
              </button>
            </div>
          </div>

          {/* Live Lobby Crewmates Preview */}
          {lobbyPlayersList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" /> Phi Hành Đoàn Đang Chờ Trong Sảnh ({lobbyPlayersList.length})
                </h3>
                <button
                  onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Vào Sảnh Điều Phối <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {lobbyPlayersList.map(lp => (
                  <div
                    key={lp.username}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition"
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
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:underline">
                          {lp.name}
                          {lp.role === 'teacher' && <Crown className="w-3 h-3 text-amber-500" />}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {lp.ready ? 'Đã sẵn sàng' : 'Đang chuẩn bị'}
                        </p>
                      </div>
                    </button>
                    {lp.role !== 'teacher' && (
                      <button
                        type="button"
                        onClick={() => handleKickLobbyPlayer(currentRoomPin, lp.username, lp.name)}
                        className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Bảng Xếp Hạng Học Sinh Trong Phòng (Real-time)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tự động đồng bộ điểm số</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Hạng</th>
                    <th className="px-6 py-3">Tên Học Sinh</th>
                    <th className="px-6 py-3">Tiến Độ</th>
                    <th className="px-6 py-3 text-center">Điểm Số</th>
                    <th className="px-6 py-3 text-center">Streak</th>
                    <th className="px-6 py-3 text-right">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboardPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                        Chưa có học sinh nào nộp điểm vào phòng. Hãy chia sẻ mã PIN <b>{currentRoomPin}</b> cho học sinh!
                      </td>
                    </tr>
                  ) : (
                    leaderboardPlayers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-3.5 font-bold text-amber-500">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          <div>{p.status}</div>
                          {Array.isArray(p.missed) && p.missed.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.missed.slice(0, 4).map((mw, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-mono text-[10px] font-bold"
                                >
                                  {mw}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center font-extrabold text-blue-600 dark:text-blue-400">{p.score}đ</td>
                        <td className="px-6 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400">🔥 {p.streak}</td>
                        <td className="px-6 py-3.5 text-right text-xs text-slate-400">{p.updatedAt}</td>
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
      {(teacherHubTab === 'accounts' || teacherHubTab === 'students') && (
        <div className="space-y-6">
          {/* Header, Role Filters & Creation Actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
                  Tạo &amp; Quản Lý Tài Khoản Hệ Thống ({allAccounts.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chỉ Giáo viên mới có thể tạo, cấp mật khẩu, phân quyền hoặc xóa tài khoản đăng nhập. Học viên không thể tự đăng ký bên ngoài.
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('single');
                    setShowAddStudentModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> + Tạo 1 Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('bulk');
                    setShowAddStudentModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Nhập Hàng Loạt
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl border transition ${
                    accountRoleFilter === 'all'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({allAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'student'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Học viên ({studentAccountsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'teacher'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên ({teacherAccountsCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="🔍 Tìm theo tên hoặc @username..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#007A7A] focus:outline-none font-medium"
              />
            </div>

            {validSelectedUsernames.length > 0 && handleBulkDeleteAccounts && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300">
                  Đã chọn {validSelectedUsernames.length} tài khoản (bao gồm xóa gọn bài nộp liên quan nếu có)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUsernames([])}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                  >
                    Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ok = handleBulkDeleteAccounts(validSelectedUsernames);
                      if (ok) setSelectedUsernames([]);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa {validSelectedUsernames.length} tài khoản đã chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Accounts Management Table */}
          {(() => {
            const selectableFilteredNames = filteredAccounts
              .filter(acc => acc.username !== currentUser?.username && !acc.isSuperAdmin && acc.username !== 'tuanpro123s')
              .map(acc => acc.username);
            const allSelectableChecked =
              selectableFilteredNames.length > 0 &&
              selectableFilteredNames.every(uname => validSelectedUsernames.includes(uname));

            return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="pl-5 pr-2 py-4 w-10">
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
                    <th className="px-6 py-4 text-center">Vai Trò</th>
                    <th className="px-6 py-4 text-center">Mục Tiêu / Ghi Chú</th>
                    <th className="px-6 py-4 text-center">Hoạt Động</th>
                    <th className="px-6 py-4 text-center">Ngày Tạo</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                        Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(account => {
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
                        <tr key={account.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="pl-5 pr-2 py-4 w-10">
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
                              <UserAvatarBadge user={account} sizeClass="w-10 h-10" textClass="text-sm" rounded="rounded-2xl" />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {openMemberProfile ? (
                                    <button
                                      type="button"
                                      onClick={() => openMemberProfile(account.username, 'TEACHER_DASHBOARD')}
                                      title="Mở trang hồ sơ chi tiết"
                                      className="font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 hover:underline leading-tight text-left transition"
                                    >
                                      {account.name}
                                    </button>
                                  ) : (
                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{account.name}</p>
                                  )}
                                  {isSelfAccount && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">@{account.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isSuperAdminAccount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                                <ShieldAlert className="w-3.5 h-3.5" /> Super Admin
                              </span>
                            ) : isTeacherAccount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                <GraduationCap className="w-3.5 h-3.5" /> Học viên
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isTeacherAccount ? (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full transition"
                                >
                                  <Target className="w-3.5 h-3.5 text-amber-500" />
                                  Band {account.targetBand || '7.5'}
                                  <Edit className="w-3 h-3 opacity-70" />
                                </button>
                                {account.studyGoal && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[160px] mx-auto truncate" title={account.studyGoal}>
                                    {account.studyGoal}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isTeacherAccount ? (
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                Toàn quyền quản lý
                              </span>
                            ) : studentAttempts.length > 0 ? (
                              <div className="inline-flex items-center gap-1.5 text-xs">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md font-extrabold">
                                  {studentAttempts.length} bài
                                </span>
                                {bestBand !== null ? (
                                  <span className="font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-md">
                                    Best {bestBand}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Chưa làm bài</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                            {account.joinedDate || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {openMemberProfile && (
                                <button
                                  type="button"
                                  onClick={() => openMemberProfile(account.username, 'TEACHER_DASHBOARD')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Hồ sơ
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
                                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                                title="Sửa thông tin & phân quyền tài khoản"
                              >
                                <Edit className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                type="button"
                                disabled={!canResetAccountPass}
                                onClick={() => {
                                  if (!canResetAccountPass) return;
                                  setEditingStudentAccount(account);
                                  setStudentPasswordDraft('');
                                }}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition inline-flex items-center gap-1 ${
                                  canResetAccountPass
                                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border-slate-200 dark:border-slate-700'
                                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                }`}
                                title={
                                  canResetAccountPass
                                    ? 'Đặt lại mật khẩu đăng nhập'
                                    : 'Chỉ Quản trị hệ thống mới có quyền đổi mật khẩu Giáo viên khác'
                                }
                              >
                                <Key className="w-3.5 h-3.5" /> Đổi MK
                              </button>
                              <button
                                type="button"
                                disabled={disableDelete}
                                onClick={() => !disableDelete && handleDeleteAccount(account)}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition inline-flex items-center gap-1 ${
                                  disableDelete
                                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                    : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                                }`}
                                title={
                                  isSuperAdminAccount
                                    ? 'Tài khoản Quản trị hệ thống được bảo vệ'
                                    : isSelfAccount
                                    ? 'Không thể xóa tài khoản đang đăng nhập'
                                    : 'Xóa tài khoản này'
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
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
          </div>
            );
          })()}
        </div>
      )}

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
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setCompletionModalTestId(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-[#FFF5F8] dark:bg-slate-900">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isExercise
                          ? 'bg-[#570DF8]/12 text-[#570DF8] dark:text-[#C4B5FD] border-[#570DF8]/30'
                          : 'bg-teal-50 dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border-teal-200 dark:border-teal-500/30'
                      }`}
                    >
                      {isExercise
                        ? `BÀI TẬP • ${cfg.focusSkill === 'speaking' ? 'SPEAKING AI' : (cfg.focusSkill || 'SKILL').toUpperCase()}`
                        : 'ĐỀ THI IELTS'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Kiểm tra tiến độ học sinh
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {targetItem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletionModalTestId(null)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KPI Strip & Controls */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-center">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tổng học sinh</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalStudents}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-center">
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Đã làm bài</div>
                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{stats.doneList.length}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-center">
                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Chưa làm bài</div>
                    <div className="text-xl font-black text-rose-700 dark:text-rose-300 tabular-nums">{stats.missingList.length}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                    {[
                      { id: 'missing', label: `Chưa làm (${stats.missingList.length})` },
                      { id: 'done', label: `Đã làm (${stats.doneList.length})` },
                      { id: 'all', label: `Tất cả (${stats.totalStudents})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCompletionFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg transition ${
                          completionFilter === tab.id
                            ? tab.id === 'missing'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : tab.id === 'done'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-[#007A7A] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={completionSearch}
                        onChange={e => setCompletionSearch(e.target.value)}
                        placeholder="Tìm tên học sinh..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                      />
                    </div>
                    {stats.missingList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCopyMissingList(targetItem, stats.missingList)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 transition"
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
                  <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                    Chưa có tài khoản học sinh nào. Hãy tạo tài khoản học sinh ở tab <strong>5. Tạo &amp; Quản Lý Tài Khoản</strong>.
                  </div>
                ) : rowsToRender.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
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
                        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                          isMissing
                            ? 'bg-rose-50/50 dark:bg-rose-950/15 border-rose-200/90 dark:border-rose-500/25'
                            : 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/80 dark:border-emerald-500/25'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatarBadge user={stu} sizeClass="w-9 h-9" textClass="text-sm" rounded="rounded-xl" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {stu.name || stu.username}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                @{stu.username}
                              </span>
                              {isMissing ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                  Chưa làm bài
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                  Đã nộp {row.attemptCount} lần
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {isMissing ? (
                                <span>Mục tiêu: Band {stu.targetBand || 7.5}</span>
                              ) : (
                                <span>
                                  Nộp gần nhất: <strong>{row.latestAttempt?.submittedAt}</strong>
                                  {row.bestBand !== null ? (
                                    <> · Band cao nhất: <strong className="text-[#007A7A] dark:text-[#1EE1D6]">{row.bestBand}</strong></>
                                  ) : row.hasPendingGrade ? (
                                    <> · <span className="text-amber-600 dark:text-amber-400 font-bold">Chờ chấm</span></>
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {openMemberProfile && (
                            <button
                              type="button"
                              onClick={() => {
                                setCompletionModalTestId(null);
                                openMemberProfile(stu.username, 'TEACHER_DASHBOARD');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition"
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
                                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
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
                                className="px-2.5 py-1.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1] text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 text-xs font-bold transition"
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
    </div>
  );
}
