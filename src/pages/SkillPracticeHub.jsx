import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Edit,
  EyeOff,
  FileAudio,
  Flame,
  Folder,
  FolderOpen,
  Globe,
  HardDrive,
  Hash,
  Headphones,
  KeyRound,
  Layers,
  Lock,
  Mic,
  PenTool,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Wand2,
  X
} from 'lucide-react';
import { BRAND_INFO } from '../constants/brandInfo';
import {
  DAILY_LISTENING_SUBCATEGORIES,
  DAILY_READING_SUBCATEGORIES,
  DAILY_WRITING_T1_SUBCATEGORIES,
  DAILY_WRITING_T2_TOPICS,
  DAILY_WRITING_T2_QUESTION_TYPES,
  canUserAccessTest,
  evaluateSpeakingDailyCompliance,
  evaluateTestSchedule,
  formatDurationVi,
  formatViDateTime,
  getAssignedClassNames,
  getDailySubCategoryLabel,
  getEffectiveTestHashtags,
  getListeningTracks,
  getReadingPassages,
  getSpeakingQuestionItems,
  getTask2QuestionType,
  getTask2Topic,
  getVietnamTodayDateKey,
  isKnownTask2QuestionType,
  isKnownTask2Topic,
  normalizeExamConfig,
  normalizeSpeakingSection
} from '../constants/seedData';
import { getQuestionTypeMeta } from '../utils/examHelpers';
import { getDailyFolderName } from '../utils/dailyFolderProgress';
import { verifySpeakingRoomPassword } from '../utils/speakingApi';
import {
  formatRemainingSubscriptionText,
  formatVndCurrency,
  hasActiveAieoVip,
  normalizePaymentConfig,
  resolveUserVipNameVisual
} from '../constants/profileCustomization';
import SpeakingHeatmapCard from '../components/speaking/SpeakingHeatmapCard';
import SpeakingForecastZone from '../components/speaking/SpeakingForecastZone';
import AssignFolderModal from '../components/modals/AssignFolderModal';
import DailyWritingBulkModal from '../components/teacher/DailyWritingBulkModal';
import ListPaginationBar, { paginateItems } from '../components/common/ListPaginationBar';
import VipMemberName from '../components/common/VipMemberName';
import WritingTask2FilterBar from '../components/common/WritingTask2FilterBar';

export default function SkillPracticeHub({
  activeTab = 'speaking',
  aiApiKey = '',
  aiConfigured = false,
  attempts = [],
  classesDb = {},
  currentUser,
  focusedTestId = null,
  onAssignFolderClasses = null,
  onBackToTeacherDashboard = null,
  onBulkCreateTests = null,
  onChangeTab,
  onClearFocusedTest,
  onDeleteTest = null,
  onNotifyMissingDaily,
  onOpenCheckoutModal = null,
  onOpenFullExamCatalog,
  onOpenResult,
  onOpenSkillBuilder,
  onSaveSpeakingForecast = null,
  onSpeakingRoomUnlocked,
  onStartSingleSkillExam,
  onStartSpeakingExam,
  onStartSpeakingPracticeTest = null,
  paymentConfig = null,
  serverClockOffsetMs = 0,
  setApiTestState = null,
  setShowApiKeyModal = null,
  showToast,
  speakingForecast = null,
  examUnlockTokens = {},
  speakingUnlockTokens = {},
  tests = [],
  usersDb = {}
}) {
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [singleHubSkill, setSingleHubSkill] = useState('all'); // 'all' | 'reading' | 'listening' | 'writing'
  const [subCatFilterState, setSubCatFilterState] = useState({ tab: activeTab, sub: 'all' });
  const activeSubCatFilter = subCatFilterState.tab === activeTab ? subCatFilterState.sub : 'all';
  const setActiveSubCatFilter = (nextSub) => setSubCatFilterState({ tab: activeTab, sub: nextSub || 'all' });
  const [dailyFolderFilterState, setDailyFolderFilterState] = useState({ tab: activeTab, sub: activeSubCatFilter, folder: 'all' });
  const activeDailyFolderFilter =
    dailyFolderFilterState.tab === activeTab && dailyFolderFilterState.sub === activeSubCatFilter
      ? dailyFolderFilterState.folder
      : 'all';
  const setActiveDailyFolderFilter = nextFolder =>
    setDailyFolderFilterState({ tab: activeTab, sub: activeSubCatFilter, folder: nextFolder || 'all' });
  const [writingTask2Filter, setWritingTask2Filter] = useState({ topic: 'all', questionType: 'all' });
  const hashtagScopeKey = `${activeTab}:${singleHubSkill}:${activeSubCatFilter}:${['reading', 'listening'].includes(activeTab) ? activeDailyFolderFilter : ''}:${activeTab === 'writing_task2' ? `${writingTask2Filter.topic}:${writingTask2Filter.questionType}` : ''}`;
  const [hashtagFilterState, setHashtagFilterState] = useState({ scopeKey: hashtagScopeKey, tag: 'all' });
  const selectedSpeakingHashtag = hashtagFilterState.scopeKey === hashtagScopeKey ? hashtagFilterState.tag : 'all';
  const setSelectedSpeakingHashtag = (nextOrUpdater) => {
    setHashtagFilterState(prev => {
      const currentTag = prev.scopeKey === hashtagScopeKey ? prev.tag : 'all';
      const nextTag = typeof nextOrUpdater === 'function' ? nextOrUpdater(currentTag) : nextOrUpdater;
      return { scopeKey: hashtagScopeKey, tag: nextTag || 'all' };
    });
  };
  const [passwordPromptTarget, setPasswordPromptTarget] = useState(null);
  const [bulkFolderAssignTarget, setBulkFolderAssignTarget] = useState(null);
  const [bulkWritingModalState, setBulkWritingModalState] = useState({
    open: false,
    mode: 'task2',
    task1SubCategory: 'w1_dynamic'
  });
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [skillListPageState, setSkillListPageState] = useState({ scopeKey: '', page: 1 });
  const [roomPassInput, setRoomPassInput] = useState('');
  const [roomPassError, setRoomPassError] = useState('');
  const [verifyingRoomPass, setVerifyingRoomPass] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const isTeacher = currentUser?.role === 'teacher';
  const payCfg = normalizePaymentConfig(paymentConfig || {});
  const serverNowMs = nowMs + serverClockOffsetMs;
  const studentHasVip = hasActiveAieoVip(currentUser, serverNowMs);
  const activeAccessExpiryText = formatRemainingSubscriptionText(currentUser?.aieoVipExpiresAt, serverNowMs);

  const openSkillPassCheckout = (type = 'aieo_vip') => {
    if (onOpenCheckoutModal) {
      onOpenCheckoutModal({
        itemType: type,
        itemId: '',
        itemLabel: 'Gói IELTS VIP (1 Tháng Full Quyền)',
        itemPrice: payCfg.aieoVipPrice
      });
    } else {
      showToast?.('Mở Trang Cá Nhân để kích hoạt Gói IELTS VIP.', 'info');
    }
  };

  const guardSingleSkillStart = (testId) => {
    onStartSingleSkillExam?.(testId);
  };
  const todayKey = getVietnamTodayDateKey(serverNowMs);

  const singleSkillTests = tests.filter(t => {
    const cfg = normalizeExamConfig(t);
    if (cfg.testMode !== 'single_skill') return false;
    return canUserAccessTest(t, classesDb, currentUser);
  });

  const speakingTests = singleSkillTests.filter(t => t.focusSkill === 'speaking');
  const dailySpeakingTests = speakingTests.filter(
    t => !normalizeSpeakingSection(t.speaking).isForecast && normalizeSpeakingSection(t.speaking).speakingTrack !== 'exam_room'
  );
  const listeningTests = singleSkillTests.filter(t => t.focusSkill === 'listening');
  const readingTests = singleSkillTests.filter(t => t.focusSkill === 'reading');
  const writingTests = singleSkillTests.filter(t => t.focusSkill === 'writing');
  const writingTask1Tests = writingTests.filter(t => normalizeExamConfig(t).writingTaskScope !== 'task2');
  const writingTask2Tests = writingTests.filter(t => {
    const sc = normalizeExamConfig(t).writingTaskScope;
    return sc === 'task2' || sc === 'both';
  });

  const forecastTests = [
    ...speakingTests.filter(t => normalizeSpeakingSection(t.speaking).isForecast),
    ...speakingTests.filter(t => !normalizeSpeakingSection(t.speaking).isForecast && normalizeSpeakingSection(t.speaking).speakingTrack === 'general')
  ];

  const myAttempts = attempts.filter(
    a => a.studentId === currentUser?.username || a.studentUsername === currentUser?.username
  );
  const mySpeakingAttempts = myAttempts.filter(
    a => a.focusSkill === 'speaking' || Boolean(a.scores?.speaking)
  );
  const gradedSpeakingBands = mySpeakingAttempts
    .map(a => a.scores?.speaking?.band ?? a.overallBand)
    .filter(b => typeof b === 'number' && b >= 0);
  const bestSpeakingBand = gradedSpeakingBands.length > 0 ? Math.max(...gradedSpeakingBands) : null;

  const dailyCompliance = evaluateSpeakingDailyCompliance({
    tests: speakingTests,
    attempts,
    usersDb,
    classesDb,
    viewerUser: currentUser,
    todayKey
  });

  const handleTriggerSpeakingStart = (test, partMode = 'full') => {
    if (!test) return;
    const cfg = normalizeExamConfig(test);
    const sp = normalizeSpeakingSection(test.speaking);
    const needsRoomPass =
      !isTeacher &&
      Boolean(sp.hasRoomPassword || sp.roomPassword || cfg.hasExamPassword || cfg.examPassword) &&
      !speakingUnlockTokens?.[test.id];
    if (needsRoomPass) {
      setPasswordPromptTarget({ test, partMode });
      setRoomPassInput('');
      setRoomPassError('');
      return;
    }
    onStartSpeakingExam?.(test.id, partMode);
  };

  const renderTestHashtagPills = (test, { onSelectTag = null } = {}) => {
    const tags = getEffectiveTestHashtags(test);
    if (!tags.length) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map(item => {
          const isActiveFilter =
            onSelectTag &&
            selectedSpeakingHashtag !== 'all' &&
            selectedSpeakingHashtag.toLowerCase() === item.tag.toLowerCase();
          const pillCls =
            item.kind === 'real_exam'
              ? 'bg-[#991B1B] text-white border-[#EF4444]'
              : item.kind === 'password'
              ? 'bg-indigo-700 text-white border-indigo-500'
              : item.kind === 'daily'
              ? 'bg-[#C2410C] text-white border-orange-500'
              : item.kind === 'forecast'
              ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
              : item.kind === 'practice'
              ? 'bg-[#EDFFFD] text-[#0F766E] border-[#B5F5F1] dark:bg-teal-500/15 dark:text-[#1EE1D6] dark:border-teal-500/30'
              : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#1E293B] dark:text-slate-200 border-slate-300 dark:border-slate-700';

          return onSelectTag ? (
            <button
              key={item.tag}
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSelectTag(item.tag);
              }}
              title={`Lọc theo ${item.tag}`}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition inline-flex items-center gap-1 ${pillCls} ${
                isActiveFilter ? 'ring-2 ring-offset-1 ring-[#007A7A]' : 'hover:opacity-90'
              }`}
            >
              <span>{item.tag}</span>
            </button>
          ) : (
            <span
              key={item.tag}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${pillCls}`}
            >
              <span>{item.tag}</span>
            </span>
          );
        })}
      </div>
    );
  };

  const handleSubmitRoomPassword = async (e) => {
    e?.preventDefault();
    if (!passwordPromptTarget?.test || verifyingRoomPass) return;
    setRoomPassError('');
    setVerifyingRoomPass(true);
    try {
      const res = await verifySpeakingRoomPassword({
        testId: passwordPromptTarget.test.id,
        password: roomPassInput
      });
      const tok = res?.unlockToken || 'unlocked';
      onSpeakingRoomUnlocked?.(passwordPromptTarget.test.id, tok);
      const { test, partMode } = passwordPromptTarget;
      setPasswordPromptTarget(null);
      setRoomPassInput('');
      showToast?.('Đã mở khóa Phòng Thi Thực Chiến!', 'success');
      onStartSpeakingExam?.(test.id, partMode);
    } catch (err) {
      setRoomPassError(err?.message || 'Mật khẩu Phòng Thi Thực Chiến chưa chính xác!');
    } finally {
      setVerifyingRoomPass(false);
    }
  };

  const navItems = [
    {
      id: 'speaking_daily',
      label: '1. Daily Speaking',
      icon: Flame,
      badge: !isTeacher && dailyCompliance.myPendingDailyTests.length > 0
        ? `${dailyCompliance.myPendingDailyTests.length} mới`
        : dailySpeakingTests.length
    },
    { id: 'forecast', label: '2. Cày Forecast Cùng Ms. Như', icon: Sparkles, badge: forecastTests.length },
    { id: 'reading', label: '3. Đọc (SHW 1–14)', icon: BookOpen, badge: readingTests.length },
    { id: 'listening', label: '4. Nghe (SHW · Sec1 · Map)', icon: Headphones, badge: listeningTests.length },
    { id: 'writing_task1', label: '5. Viết Task 1 (W1)', icon: PenTool, badge: writingTask1Tests.length },
    { id: 'writing_task2', label: '6. Viết Task 2 (W2)', icon: PenTool, badge: writingTask2Tests.length }
  ];

  const renderSingleSkillLeaderboard = (skillFilter = 'all') => {
    const relevantAttempts = attempts.filter(a => {
      if (!a || a.testMode !== 'single_skill') return false;
      const sk = a.focusSkill || '';
      if (!['reading', 'listening', 'writing'].includes(sk)) return false;
      if (sk === 'writing' && !a.teacherGraded) return false;
      if (skillFilter !== 'all' && sk !== skillFilter) return false;
      return typeof a.overallBand === 'number' && a.overallBand >= 0;
    });
    const playerBestMap = new Map();
    relevantAttempts.forEach(a => {
      const uname = a.studentId || a.studentUsername || a.studentName;
      if (!uname) return;
      const prev = playerBestMap.get(uname) || {
        username: uname,
        name: a.studentName || uname,
        bestBand: 0,
        totalBand: 0,
        count: 0,
        bestTestTitle: a.testTitle || '',
        latestDuration: Number(a.durationSeconds) || 0
      };
      const band = Number(a.overallBand) || 0;
      const isBetter = band > prev.bestBand || (band === prev.bestBand && (Number(a.durationSeconds) || 999999) < (prev.latestDuration || 999999));
      playerBestMap.set(uname, {
        ...prev,
        count: prev.count + 1,
        totalBand: prev.totalBand + band,
        bestBand: Math.max(prev.bestBand, band),
        bestTestTitle: isBetter ? (a.testTitle || prev.bestTestTitle) : prev.bestTestTitle,
        latestDuration: isBetter ? (Number(a.durationSeconds) || 0) : prev.latestDuration
      });
    });
    const ranked = Array.from(playerBestMap.values()).sort(
      (a, b) => b.bestBand - a.bestBand || (b.totalBand / b.count) - (a.totalBand / a.count)
    );

    return (
      <section className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              BXH Ranking Điểm - Zone Đề Thi Lẻ ({skillFilter === 'all' ? 'Đọc · Nghe · Viết' : skillFilter.toUpperCase()})
            </h2>
            <p className="text-sm text-[#475569] dark:text-slate-400 max-w-2xl">
              Xếp hạng thành tích cao nhất của học viên trong lớp sau khi hoàn thành đề thi lẻ.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FEF3C7] dark:bg-amber-500/20 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
            {ranked.length} thí sinh đã xếp hạng
          </span>
        </div>

        {ranked.length === 0 ? (
          <div className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-[#475569] dark:text-slate-400">
            Chưa có bài hoàn thành nào trong mục này - hãy làm ngay đề đầu tiên để giữ Top #1 BXH!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ranked.slice(0, 9).map((row, idx) => {
              const isMe = row.username === currentUser?.username;
              const avgBand = Math.round(((row.totalBand / row.count) + 1e-9) * 2) / 2;
              const rowUserObj = usersDb?.[row.username] || (row.username === currentUser?.username ? currentUser : null);
              const rowVipVisual = resolveUserVipNameVisual(rowUserObj);
              const rankCard = (
                <div
                  key={rowVipVisual.showNeonCover ? undefined : row.username}
                  className={`flex items-center justify-between gap-3 p-3.5 transition ${
                    rowVipVisual.showNeonCover
                      ? 'rounded-[10px] bg-[#F8FAFC] dark:bg-slate-900'
                      : isMe
                      ? 'rounded-lg border bg-[#EDFFFD] dark:bg-teal-950/35 border-[#007A7A] dark:border-[#1EE1D6]'
                      : 'rounded-lg border bg-[#F8FAFC] dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#0F172B] dark:text-white truncate flex items-center gap-1 flex-wrap">
                      <span>#{idx + 1}</span>
                      <VipMemberName
                        user={rowUserObj}
                        fallbackName={row.name}
                        badgeSize="xs"
                      />
                      {isMe && <span className="text-xs text-[#0F766E] dark:text-[#1EE1D6]">(Bạn)</span>}
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-400 truncate mt-0.5">
                      {row.count} bài • TB {avgBand.toFixed(1)} • {row.bestTestTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FEF3C7] dark:bg-amber-500/20 text-[#92400E] dark:text-amber-300 font-mono font-black text-sm border border-amber-300 dark:border-amber-500/35">
                      {row.bestBand}
                    </span>
                  </div>
                </div>
              );
              return rowVipVisual.showNeonCover ? (
                <div key={row.username} className={`rounded-lg p-[2px] transition-all ${rowVipVisual.neonCoverMeta.cardRimWrapClass}`}>
                  {rankCard}
                </div>
              ) : rankCard;
            })}
          </div>
        )}
      </section>
    );
  };

  const renderSingleHubZone = () => {
    const combinedList = [
      ...readingTests.map(t => ({ ...t, _resolvedSkill: 'reading' })),
      ...listeningTests.map(t => ({ ...t, _resolvedSkill: 'listening' })),
      ...writingTests.map(t => ({ ...t, _resolvedSkill: 'writing' }))
    ];
    const filteredList = singleHubSkill === 'all'
      ? combinedList
      : combinedList.filter(t => t._resolvedSkill === singleHubSkill);
    const skillMetaMap = {
      reading: { label: 'ĐỌC (READING)', cls: 'bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1D4ED8] dark:text-blue-300 border border-blue-200 dark:border-blue-500/30', icon: BookOpen },
      listening: { label: 'NGHE (LISTENING)', cls: 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30', icon: Headphones },
      writing: { label: 'VIẾT (WRITING)', cls: 'bg-[#D1FAE5] dark:bg-emerald-500/15 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30', icon: PenTool }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172B] dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </span>
              <span>Zone Tổng Đề Thi Lẻ (Đọc · Nghe · Viết)</span>
            </h1>
            <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-2xl">
              Luyện đề riêng từng kỹ năng chuẩn format IELTSMate &amp; Cambridge - xem ngay BXH Ranking điểm sau khi hoàn thành!
            </p>
          </div>
          {isTeacher && (
            <div className="flex flex-wrap gap-2">
              {['reading', 'listening', 'writing'].map(sk => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => onOpenSkillBuilder?.(sk)}
                  className="px-3.5 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> + {sk.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sub-Tabs Split: Reading / Listening / Writing */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 w-fit">
          {[
            { id: 'all', label: `Tất cả Đề Lẻ (${combinedList.length})` },
            { id: 'reading', label: `Đọc · Reading (${readingTests.length})` },
            { id: 'listening', label: `Nghe · Listening (${listeningTests.length})` },
            { id: 'writing', label: `Viết · Writing (${writingTests.length})` }
          ].map(sub => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSingleHubSkill(sub.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                singleHubSkill === sub.id
                  ? 'bg-[#007A7A] text-white'
                  : 'text-[#334155] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        {(() => {
          const tagCountsMap = new Map();
          filteredList.forEach(t => {
            getEffectiveTestHashtags(t).forEach(h => {
              const prev = tagCountsMap.get(h.tag.toLowerCase());
              tagCountsMap.set(h.tag.toLowerCase(), {
                tag: prev?.tag || h.tag,
                kind: prev?.kind || h.kind,
                count: (prev?.count || 0) + 1
              });
            });
          });
          const availableHashtagFilters = Array.from(tagCountsMap.values());
          const finalSingleList =
            selectedSpeakingHashtag === 'all'
              ? filteredList
              : filteredList.filter(t =>
                  getEffectiveTestHashtags(t).some(
                    h => h.tag.toLowerCase() === selectedSpeakingHashtag.toLowerCase()
                  )
                );

          return (
            <>
              {availableHashtagFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-[#334155] dark:text-slate-300 inline-flex items-center gap-1 px-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                    Lọc theo Hashtag:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpeakingHashtag('all')}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                      selectedSpeakingHashtag === 'all'
                        ? 'bg-[#007A7A] text-white border-[#007A7A]'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                    }`}
                  >
                    Tất cả ({filteredList.length})
                  </button>
                  {availableHashtagFilters.map(item => {
                    const isSelected = selectedSpeakingHashtag.toLowerCase() === item.tag.toLowerCase();
                    return (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() =>
                          setSelectedSpeakingHashtag(prev =>
                            prev.toLowerCase() === item.tag.toLowerCase() ? 'all' : item.tag
                          )
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                            : item.kind === 'real_exam'
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-[#991B1B] dark:text-rose-300 border-rose-300 dark:border-rose-500/40 hover:border-rose-500'
                            : item.kind === 'password'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-500'
                            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        {item.tag} ({item.count})
                      </button>
                    );
                  })}
                </div>
              )}

              {finalSingleList.length === 0 ? (
                <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-[#475569] dark:text-slate-400" />
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-slate-100">
                    {selectedSpeakingHashtag !== 'all'
                      ? `Chưa có đề nào gắn nhãn ${selectedSpeakingHashtag}`
                      : 'Chưa có đề thi lẻ nào trong mục này'}
                  </h2>
                  <p className="text-sm text-[#475569] dark:text-slate-400 max-w-md mx-auto">
                    {selectedSpeakingHashtag !== 'all'
                      ? 'Hãy bấm "Tất cả" để xem toàn bộ danh sách đề thi lẻ.'
                      : 'Giáo viên có thể tạo nhanh Đề Lẻ Đọc, Nghe hoặc Viết bằng nút phía trên.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {finalSingleList.map(test => {
                    const sk = test._resolvedSkill;
                    const sMeta = skillMetaMap[sk] || skillMetaMap.reading;
                    const cfg = normalizeExamConfig(test);
                    const schedule = evaluateTestSchedule(cfg, serverNowMs);
                    const myTestAttempts = myAttempts.filter(a => a.testId === test.id);
                    const usedCount = myTestAttempts.length;
                    const myBest = myTestAttempts
                      .map(a => a.overallBand)
                      .filter(b => typeof b === 'number')
                      .reduce((max, b) => Math.max(max, b), 0);
                    const isExhausted = cfg.maxAttempts > 0 && usedCount >= cfg.maxAttempts;
                    const isLocked = isExhausted || (!isTeacher && schedule.lockedBySchedule);
                    const hasExamPass = Boolean(cfg.hasExamPassword || cfg.examPassword);
                    const isRealExamCard = cfg.examPurpose === 'real_exam' || cfg.maxAttempts === 1 || hasExamPass;
                    const isPassUnlocked = isTeacher || !hasExamPass || Boolean(examUnlockTokens?.[test.id]);
                    const qList = sk === 'listening' ? (test.listening?.questions || []) : sk === 'reading' ? (test.reading?.questions || []) : [];
                    const typeTags = Array.from(new Set(qList.map(q => getQuestionTypeMeta(q.type, sk).shortLabel))).slice(0, 3);

                    return (
                      <div
                        key={test.id}
                        className={`bg-white dark:bg-[#0F172B] border rounded-lg p-5 flex flex-col justify-between gap-4 transition ${
                          isRealExamCard
                            ? 'border-rose-300 dark:border-rose-500/40 hover:border-rose-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sMeta.cls}`}>
                                {sMeta.label} • {cfg.durations[sk]} phút
                              </span>
                              {isRealExamCard && (
                                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#991B1B] text-white inline-flex items-center gap-1">
                                  🏛️ Đề Thi Thật
                                </span>
                              )}
                              {hasExamPass && (
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                                    isPassUnlocked
                                      ? 'bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                      : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                                  }`}
                                >
                                  <KeyRound className="w-3 h-3" />
                                  {isTeacher
                                    ? `Pass: ${cfg.examPassword || 'Đã bật'}`
                                    : isPassUnlocked
                                    ? 'Đã mở khóa'
                                    : 'Có Mật Khẩu'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {myBest > 0 && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                  Kỷ lục: Band {myBest}
                                </span>
                              )}
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                {cfg.maxAttempts === 0 ? `${usedCount} lượt` : `${usedCount}/${cfg.maxAttempts} lượt`}
                              </span>
                            </div>
                          </div>

                          <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white leading-snug">
                            {test.title}
                          </h2>
                          {renderTestHashtagPills(test, {
                            onSelectTag: nextTag =>
                              setSelectedSpeakingHashtag(prev =>
                                prev.toLowerCase() === nextTag.toLowerCase() ? 'all' : nextTag
                              )
                          })}
                          {test.description && (
                            <p className="text-sm text-[#475569] dark:text-slate-400 line-clamp-2">{test.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            {qList.length > 0 && (
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#334155] dark:text-slate-200">
                                {qList.length} câu
                              </span>
                            )}
                            {typeTags.map(tag => (
                              <span key={tag} className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => guardSingleSkillStart(test.id)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-[#475569] cursor-not-allowed'
                                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : !isPassUnlocked ? (
                              <KeyRound className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>
                              {isLocked
                                ? 'Đang khóa / Hết lượt'
                                : !isPassUnlocked
                                ? `Nhập Mật Khẩu · Làm Đề ${sk.toUpperCase()}`
                                : `Làm Đề ${sk.toUpperCase()}`}
                            </span>
                          </button>
                          {isTeacher && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenSkillBuilder?.(sk, test)}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                                title="Chỉnh sửa bài này"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {onDeleteTest && (
                                <button
                                  type="button"
                                  data-testid={`daily-delete-test-btn-${test.id}`}
                                  onClick={() => onDeleteTest(test)}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#FECACA] dark:border-slate-700 text-[#B91C1C] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                                  title="Xóa bài này"
                                  aria-label={`Xóa ${test.title}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {renderSingleSkillLeaderboard(singleHubSkill)}
      </div>
    );
  };

  const renderSkillTestCards = (tabKey, list) => {
    const actualSkill =
      tabKey === 'writing_task1' || tabKey === 'writing_task2' || tabKey === 'writing'
        ? 'writing'
        : tabKey === 'listening'
        ? 'listening'
        : 'reading';
    const writingScopeFilter = tabKey === 'writing_task1' ? 'task1' : tabKey === 'writing_task2' ? 'task2' : 'both';

    const metaMap = {
      listening: {
        name: 'Daily Listening',
        subtitle: 'Chia 3 phân mục: 1. SuperHomework Listening • 2. Section 1 Spelling Names & Numbers • 3. Map',
        color: 'text-[#0F766E] dark:text-[#1EE1D6]',
        bg: 'bg-[#EDFFFD] dark:bg-teal-500/15',
        icon: Headphones,
        subCategories: DAILY_LISTENING_SUBCATEGORIES
      },
      reading: {
        name: 'Daily Reading (SuperHomework 1–14)',
        subtitle: 'Luyện đọc chia theo từng SuperHomework từ 1 đến 14 · Làm lại nhiều lần · Hiện ngay số câu đúng & thời gian',
        color: 'text-[#1D4ED8] dark:text-blue-400',
        bg: 'bg-[#EFF6FF] dark:bg-blue-500/15',
        icon: BookOpen,
        subCategories: DAILY_READING_SUBCATEGORIES
      },
      writing_task1: {
        name: 'Daily Writing Task 1 (W1)',
        subtitle: 'Kho tách lẻ riêng cho Writing Task 1 gồm 4 dạng bài: Map • Process • Dynamic • Static',
        color: 'text-[#065F46] dark:text-emerald-400',
        bg: 'bg-[#D1FAE5] dark:bg-emerald-500/15',
        icon: PenTool,
        subCategories: DAILY_WRITING_T1_SUBCATEGORIES
      },
      writing_task2: {
        name: 'Daily Writing Task 2 (W2)',
        subtitle: 'Kho bài tập Writing Task 2 (Essay) tách lẻ · Nộp trực tiếp cho Ms. Như check & nhận xét chi tiết',
        color: 'text-[#065F46] dark:text-emerald-400',
        bg: 'bg-[#D1FAE5] dark:bg-emerald-500/15',
        icon: PenTool,
        subCategories: []
      }
    };
    const meta = metaMap[tabKey] || metaMap[actualSkill] || metaMap.reading;
    const IconComp = meta.icon;
    const isWritingTask2Tab = tabKey === 'writing_task2';
    const isSuperHomeworkTab = tabKey === 'reading' || tabKey === 'listening';
    const selectedWritingTask2Topic = writingTask2Filter.topic;
    const selectedWritingTask2QuestionType = writingTask2Filter.questionType;
    const selectedDailyFolder = isSuperHomeworkTab ? activeDailyFolderFilter : 'all';
    const focusedMatch = focusedTestId ? list.find(t => t.id === focusedTestId) : null;
    const subFilteredList = focusedMatch
      ? [focusedMatch]
      : activeSubCatFilter === 'all'
      ? list
      : list.filter(t => normalizeExamConfig(t).dailySubCategory === activeSubCatFilter);
    const folderGroups = new Map();
    if (isSuperHomeworkTab) {
      subFilteredList.forEach(test => {
        const folderName = getDailyFolderName(test);
        const subCategory = normalizeExamConfig(test).dailySubCategory;
        const folderNameKey = folderName ? folderName.normalize('NFKC').toLocaleLowerCase() : '__unfiled__';
        const folderKey = `${subCategory}:${folderNameKey}`;
        const existing = folderGroups.get(folderKey);
        folderGroups.set(folderKey, {
          folderKey,
          subCategory,
          folderName: existing?.folderName || folderName,
          count: (existing?.count || 0) + 1
        });
      });
    }
    const dailyFolderOptions = Array.from(folderGroups.values()).sort((a, b) =>
      a.folderName === '' ? 1 : b.folderName === '' ? -1 :
        a.subCategory.localeCompare(b.subCategory) || a.folderName.localeCompare(b.folderName)
    );
    const folderFilteredList = !isSuperHomeworkTab || selectedDailyFolder === 'all'
      ? subFilteredList
      : subFilteredList.filter(test => {
          const folderName = getDailyFolderName(test);
          const subCategory = normalizeExamConfig(test).dailySubCategory;
          const folderNameKey = folderName ? folderName.normalize('NFKC').toLocaleLowerCase() : '__unfiled__';
          const folderKey = `${subCategory}:${folderNameKey}`;
          return folderKey === selectedDailyFolder;
        });
    const topicFilteredList = !isWritingTask2Tab || selectedWritingTask2Topic === 'all'
      ? folderFilteredList
      : folderFilteredList.filter(test => selectedWritingTask2Topic === '__unclassified__'
        ? !isKnownTask2Topic(getTask2Topic(test))
        : getTask2Topic(test) === selectedWritingTask2Topic);
    const displayedList = !isWritingTask2Tab || selectedWritingTask2QuestionType === 'all'
      ? topicFilteredList
      : topicFilteredList.filter(test => selectedWritingTask2QuestionType === '__unclassified__'
        ? !isKnownTask2QuestionType(getTask2QuestionType(test))
        : getTask2QuestionType(test) === selectedWritingTask2QuestionType);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172B] dark:text-white tracking-tight flex items-center gap-2.5">
              <span className={`w-10 h-10 rounded-lg ${meta.bg} ${meta.color} border border-slate-200 dark:border-slate-700 flex items-center justify-center`}>
                <IconComp className="w-5 h-5" />
              </span>
              <span>{meta.name}</span>
            </h1>
            <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-2xl">
              {meta.subtitle}
            </p>
          </div>
          {isTeacher && (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {displayedList.length > 0 && onAssignFolderClasses && (
                <button
                  type="button"
                  onClick={() => {
                    const activeSubLabel =
                      activeSubCatFilter !== 'all'
                        ? meta.subCategories.find(s => s.id === activeSubCatFilter)?.label || activeSubCatFilter
                        : meta.name;
                    const activeFolderLabel =
                      isSuperHomeworkTab && selectedDailyFolder !== 'all'
                        ? dailyFolderOptions.find(o => o.folderKey === selectedDailyFolder)?.folderName || ''
                        : '';
                    const label = activeFolderLabel ? `${activeSubLabel} / ${activeFolderLabel}` : activeSubLabel;
                    setBulkFolderAssignTarget({
                      label,
                      testIds: displayedList.map(t => t.id),
                      initialClassIds: []
                    });
                  }}
                  className="px-3.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  title="Giao toàn bộ các bài đang hiển thị trong thư mục này cho lớp"
                >
                  <Share2 className="w-3.5 h-3.5" /> Giao Cả Thư Mục ({displayedList.length} bài)
                </button>
              )}
              {tabKey === 'writing_task1' && onBulkCreateTests && (
                <button
                  type="button"
                  data-testid="open-bulk-w1-ai-btn"
                  onClick={() =>
                    setBulkWritingModalState({
                      open: true,
                      mode: 'task1',
                      task1SubCategory: activeSubCatFilter !== 'all' ? activeSubCatFilter : 'auto'
                    })
                  }
                  className="px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  title="Ném nhiều hình biểu đồ hoặc file PDF để AI tự tạo hàng loạt đề Task 1 vào thư mục này"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    {activeSubCatFilter !== 'all'
                      ? `Tạo Hàng Loạt W1 • ${getDailySubCategoryLabel(activeSubCatFilter)} (AI)`
                      : 'Tạo Hàng Loạt W1 Nhanh (AI)'}
                  </span>
                </button>
              )}
              {tabKey === 'writing_task2' && onBulkCreateTests && (
                <button
                  type="button"
                  data-testid="open-bulk-w2-ai-btn"
                  onClick={() =>
                    setBulkWritingModalState({
                      open: true,
                      mode: 'task2',
                      task1SubCategory: 'w1_dynamic'
                    })
                  }
                  className="px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                  title="Tải file PDF bộ đề (VD: 350 câu Task 2) để AI tự phân loại Chủ đề, Dạng bài và đặt tên theo Danh từ"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Tạo Đề Task 2 Nhanh (AI PDF)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onOpenSkillBuilder?.(actualSkill, null, {
                    writingTaskScope: writingScopeFilter,
                    dailySubCategory:
                      activeSubCatFilter !== 'all'
                        ? activeSubCatFilter
                        : meta.subCategories[0]?.id || (tabKey === 'writing_task2' ? 'w2_essay' : ''),
                    dailyFolderName:
                      isSuperHomeworkTab && selectedDailyFolder !== 'all' && selectedDailyFolder !== '__unfiled__'
                        ? dailyFolderOptions.find(option => option.folderKey === selectedDailyFolder)?.folderName || ''
                        : '',
                    ...(isWritingTask2Tab
                      ? {
                          writingTask2Topic: isKnownTask2Topic(selectedWritingTask2Topic) ? selectedWritingTask2Topic : '',
                          writingTask2QuestionType: isKnownTask2QuestionType(selectedWritingTask2QuestionType)
                            ? selectedWritingTask2QuestionType
                            : ''
                        }
                      : {})
                  })
                }
                className="px-4 py-2.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Tạo Bài {tabKey === 'writing_task1' ? 'W1' : tabKey === 'writing_task2' ? 'W2' : actualSkill.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        {/* Google Drive-Style Folder Explorer for Daily Zone Categories (SHW 1-14 / Listening / W1) */}
        {meta.subCategories.length > 0 && !focusedMatch && (
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
            {/* Drive Breadcrumb Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center flex-wrap gap-1 text-xs sm:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubCatFilter('all');
                    setActiveDailyFolderFilter('all');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                    activeSubCatFilter === 'all'
                      ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>{meta.name}</span>
                  <span className="text-[11px] font-semibold opacity-75">({list.length} bài)</span>
                </button>
                {activeSubCatFilter !== 'all' && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setActiveDailyFolderFilter('all')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                        selectedDailyFolder === 'all'
                          ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6]'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>{meta.subCategories.find(s => s.id === activeSubCatFilter)?.label || activeSubCatFilter}</span>
                    </button>
                  </>
                )}
              </div>

              {activeSubCatFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubCatFilter('all');
                    setActiveDailyFolderFilter('all');
                  }}
                  className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline"
                >
                  ← Xem tất cả {meta.subCategories.length} thư mục lớn
                </button>
              )}
            </div>

            {/* Drive Folder Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {meta.subCategories.map(sub => {
                const subTests = list.filter(t => normalizeExamConfig(t).dailySubCategory === sub.id);
                const subCount = subTests.length;
                const isSelected = activeSubCatFilter === sub.id;
                const unionClassIds = Array.from(
                  new Set(subTests.flatMap(t => normalizeExamConfig(t).assignedClassIds || []))
                );
                const assignedClsObjs = getAssignedClassNames(unionClassIds, classesDb);
                const hasPublicToAll = subCount > 0 && subTests.some(t => (normalizeExamConfig(t).assignedClassIds || []).length === 0);

                return (
                  <div
                    key={sub.id}
                    className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-teal-50/90 dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6] ring-1 ring-[#007A7A]/30'
                        : 'bg-slate-50/75 dark:bg-slate-900/75 border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSubCatFilter(isSelected ? 'all' : sub.id)}
                      className="flex items-start gap-2.5 text-left w-full"
                    >
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#007A7A] text-white border-[#007A7A]'
                            : 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 fill-current/20" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {sub.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {subCount > 0 ? `${subCount} bài tập` : 'Chưa có bài'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1 min-w-0">
                        {subCount === 0 ? (
                          <span className="text-[10px] text-slate-400">Trống</span>
                        ) : assignedClsObjs.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <Globe className="w-2.5 h-2.5" /> Tất cả
                          </span>
                        ) : (
                          <>
                            {assignedClsObjs.slice(0, 2).map(cls => (
                              <span
                                key={cls.id}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 truncate max-w-[90px]"
                              >
                                {cls.name}
                              </span>
                            ))}
                            {assignedClsObjs.length > 2 && (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                                +{assignedClsObjs.length - 2}
                              </span>
                            )}
                            {hasPublicToAll && (
                              <span className="text-[10px] text-slate-400">+chung</span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isTeacher && tabKey === 'writing_task1' && onBulkCreateTests && (
                          <button
                            type="button"
                            data-testid={`w1-folder-bulk-ai-${sub.id}`}
                            onClick={e => {
                              e.stopPropagation();
                              setActiveSubCatFilter(sub.id);
                              setBulkWritingModalState({
                                open: true,
                                mode: 'task1',
                                task1SubCategory: sub.id
                              });
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/35 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/40 text-[11px] font-extrabold inline-flex items-center gap-1 transition"
                            title={`Ném nhiều hình / PDF để AI tạo hàng loạt đề vào thẳng thư mục ${sub.label}`}
                          >
                            <Wand2 className="w-3 h-3" /> + AI Hàng Loạt
                          </button>
                        )}
                        {isTeacher && subCount > 0 && onAssignFolderClasses && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setBulkFolderAssignTarget({
                                label: `${meta.name} / ${sub.label}`,
                                testIds: subTests.map(t => t.id),
                                initialClassIds: unionClassIds
                              });
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/35 text-indigo-700 dark:text-indigo-200 text-[11px] font-extrabold inline-flex items-center gap-1 shrink-0 transition"
                            title={`Giao toàn bộ ${subCount} bài trong ${sub.label} cho lớp`}
                          >
                            <Share2 className="w-3 h-3" /> Giao lớp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isSuperHomeworkTab && dailyFolderOptions.length > 0 && !focusedMatch && (
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-[#334155] dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500" />
                Thư mục con / Bộ bài ({dailyFolderOptions.length}):
              </p>
              {selectedDailyFolder !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveDailyFolderFilter('all')}
                  className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline"
                >
                  Xem tất cả ({subFilteredList.length} bài)
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dailyFolderOptions.map(option => {
                const isSelected = selectedDailyFolder === option.folderKey;
                const folderTests = subFilteredList.filter(test => {
                  const fn = getDailyFolderName(test);
                  const sc = normalizeExamConfig(test).dailySubCategory;
                  const fk = `${sc}:${fn ? fn.normalize('NFKC').toLocaleLowerCase() : '__unfiled__'}`;
                  return fk === option.folderKey;
                });
                const fLabel = option.folderName
                  ? `${activeSubCatFilter === 'all' ? `${getDailySubCategoryLabel(option.subCategory)} • ` : ''}${option.folderName}`
                  : `Chưa xếp thư mục${activeSubCatFilter === 'all' ? ` • ${getDailySubCategoryLabel(option.subCategory)}` : ''}`;
                const unionIds = Array.from(new Set(folderTests.flatMap(t => normalizeExamConfig(t).assignedClassIds || [])));

                return (
                  <div
                    key={option.folderKey}
                    className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6]'
                        : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setActiveDailyFolderFilter(isSelected ? 'all' : option.folderKey)}
                      className="flex items-center gap-2 text-left min-w-0 flex-1"
                    >
                      {isSelected ? (
                        <FolderOpen className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{fLabel}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{option.count} bài</p>
                      </div>
                    </button>

                    {isTeacher && folderTests.length > 0 && onAssignFolderClasses && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setBulkFolderAssignTarget({
                            label: fLabel,
                            testIds: folderTests.map(t => t.id),
                            initialClassIds: unionIds
                          });
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/35 text-indigo-700 dark:text-indigo-200 text-[11px] font-extrabold inline-flex items-center gap-1 shrink-0"
                        title={`Giao toàn bộ ${folderTests.length} bài trong thư mục này cho lớp`}
                      >
                        <Share2 className="w-3 h-3" /> Giao lớp
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isWritingTask2Tab && !focusedMatch && (
          <WritingTask2FilterBar
            list={list}
            selectedTopic={selectedWritingTask2Topic}
            selectedQuestionType={selectedWritingTask2QuestionType}
            onSelectTopic={topic => setWritingTask2Filter(prev => ({ ...prev, topic }))}
            onSelectQuestionType={questionType => setWritingTask2Filter(prev => ({ ...prev, questionType }))}
          />
        )}

        {focusedMatch && onClearFocusedTest && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#EDFFFD] dark:bg-teal-950/40 border border-[#007A7A]/40 dark:border-[#1EE1D6]/30">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6]">
              📌 Đang hiển thị bài tập từ thông báo
            </span>
            <button
              type="button"
              onClick={onClearFocusedTest}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-200 hover:border-[#007A7A] transition"
            >
              ← Xem tất cả bài {meta.name} ({list.length})
            </button>
          </div>
        )}

        {(() => {
          const tagCountsMap = new Map();
          list.forEach(t => {
            getEffectiveTestHashtags(t).forEach(h => {
              const prev = tagCountsMap.get(h.tag.toLowerCase());
              tagCountsMap.set(h.tag.toLowerCase(), {
                tag: prev?.tag || h.tag,
                kind: prev?.kind || h.kind,
                count: (prev?.count || 0) + 1
              });
            });
          });
          const availableHashtagFilters = Array.from(tagCountsMap.values());
          const hashtagFilteredList =
            selectedSpeakingHashtag === 'all' || Boolean(focusedMatch)
              ? displayedList
              : displayedList.filter(t =>
                  getEffectiveTestHashtags(t).some(
                    h => h.tag.toLowerCase() === selectedSpeakingHashtag.toLowerCase()
                  )
                );
          const trimmedSkillSearch = skillSearchQuery.trim().toLowerCase();
          const finalSkillList =
            !trimmedSkillSearch || Boolean(focusedMatch)
              ? hashtagFilteredList
              : hashtagFilteredList.filter(t => {
                  const inTitle = String(t.title || '').toLowerCase().includes(trimmedSkillSearch);
                  const inPrompt1 = String(t.writing?.task1?.prompt || '').toLowerCase().includes(trimmedSkillSearch);
                  const inPrompt2 = String(t.writing?.task2?.prompt || '').toLowerCase().includes(trimmedSkillSearch);
                  return inTitle || inPrompt1 || inPrompt2;
                });
          const pageScopeKey = `${hashtagScopeKey}:${selectedSpeakingHashtag}:${trimmedSkillSearch}`;
          const activeSkillPage = skillListPageState.scopeKey === pageScopeKey ? skillListPageState.page : 1;
          const setActiveSkillPage = nextPage =>
            setSkillListPageState({ scopeKey: pageScopeKey, page: nextPage });
          const paginatedSkillCards = paginateItems(finalSkillList, activeSkillPage, 24);

          return (
            <>
              {(availableHashtagFilters.length > 0 || list.length > 6) && !focusedMatch && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800">
                  {availableHashtagFilters.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#334155] dark:text-slate-300 inline-flex items-center gap-1 px-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                        Lọc theo Hashtag:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSpeakingHashtag('all')}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                          selectedSpeakingHashtag === 'all'
                            ? 'bg-[#007A7A] text-white border-[#007A7A]'
                            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        Tất cả ({list.length})
                      </button>
                      {availableHashtagFilters.map(item => {
                        const isSelected = selectedSpeakingHashtag.toLowerCase() === item.tag.toLowerCase();
                        return (
                          <button
                            key={item.tag}
                            type="button"
                            onClick={() =>
                              setSelectedSpeakingHashtag(prev =>
                                prev.toLowerCase() === item.tag.toLowerCase() ? 'all' : item.tag
                              )
                            }
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                              isSelected
                                ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                                : item.kind === 'real_exam'
                                ? 'bg-rose-50 dark:bg-rose-500/15 text-[#991B1B] dark:text-rose-300 border-rose-300 dark:border-rose-500/40 hover:border-rose-500'
                                : item.kind === 'password'
                                ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40 hover:border-indigo-500'
                                : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                            }`}
                          >
                            {item.tag} ({item.count})
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span />
                  )}

                  {list.length > 6 && (
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        data-testid="daily-skill-search-input"
                        value={skillSearchQuery}
                        onChange={e => setSkillSearchQuery(e.target.value)}
                        placeholder="Tìm nhanh theo tên đề / từ khóa..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0F172B] dark:text-white focus:outline-none focus:border-[#007A7A]"
                      />
                      {skillSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSkillSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {finalSkillList.length > 24 && (
                <ListPaginationBar
                  currentPage={paginatedSkillCards.safePage}
                  totalItems={finalSkillList.length}
                  pageSize={24}
                  onPageChange={setActiveSkillPage}
                  itemLabel="bài tập"
                />
              )}

              {finalSkillList.length === 0 ? (
                <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center space-y-3">
                  <IconComp className="w-10 h-10 mx-auto text-[#475569] dark:text-slate-400" />
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-slate-100">
                    {selectedSpeakingHashtag !== 'all'
                      ? `Chưa có bài ${actualSkill.toUpperCase()} nào gắn nhãn ${selectedSpeakingHashtag}`
                      : isWritingTask2Tab && selectedWritingTask2Topic !== 'all'
                      ? `Chưa có bài Writing Task 2 thuộc chủ đề ${DAILY_WRITING_T2_TOPICS.find(topic => topic.id === selectedWritingTask2Topic)?.label || 'chưa gắn chủ đề'}`
                      : isWritingTask2Tab && selectedWritingTask2QuestionType !== 'all'
                      ? `Chưa có bài Writing Task 2 thuộc dạng ${DAILY_WRITING_T2_QUESTION_TYPES.find(type => type.id === selectedWritingTask2QuestionType)?.label || 'chưa chọn dạng bài'}`
                      : isSuperHomeworkTab && selectedDailyFolder !== 'all'
                      ? `Chưa có bài nào trong thư mục ${dailyFolderOptions.find(option => option.folderKey === selectedDailyFolder)?.folderName || 'chưa xếp thư mục'}`
                      : activeSubCatFilter !== 'all'
                      ? `Chưa có bài tập nào trong mục ${getDailySubCategoryLabel(activeSubCatFilter)}`
                      : `Chưa có bài tập ${meta.name} nào`}
                  </h2>
                  <p className="text-sm text-[#475569] dark:text-slate-400 max-w-md mx-auto">
                    {selectedSpeakingHashtag !== 'all' || activeSubCatFilter !== 'all' || (isSuperHomeworkTab && selectedDailyFolder !== 'all') || (isWritingTask2Tab && (selectedWritingTask2Topic !== 'all' || selectedWritingTask2QuestionType !== 'all'))
                      ? 'Hãy bấm "Tất cả" để xem toàn bộ danh sách bài tập.'
                      : isTeacher
                      ? `Hãy bấm nút Tạo Bài ở góc trên phải để đăng tải bài tập mới vào phân mục này.`
                      : 'Ms. Như sẽ đăng tải các bài tập Daily Zone cho Team tại đây.'}
                  </p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedSkillCards.pageItems.map(test => {
                    const cfg = normalizeExamConfig(test);
                    const schedule = evaluateTestSchedule(cfg, serverNowMs);
                    const myTestAttempts = myAttempts.filter(a => a.testId === test.id);
                    const usedCount = myTestAttempts.length;
                    const latestMyAttempt = myTestAttempts[0] || null;
                    const isExhausted = cfg.maxAttempts > 0 && usedCount >= cfg.maxAttempts;
                    const isLocked = isExhausted || (!isTeacher && schedule.lockedBySchedule);
                    const hasExamPass = Boolean(cfg.hasExamPassword || cfg.examPassword);
                    const isPassUnlocked = isTeacher || !hasExamPass || Boolean(examUnlockTokens?.[test.id]);
                    const subCatLabel = getDailySubCategoryLabel(cfg.dailySubCategory);
                    const lockText = isExhausted
                      ? 'Đã hết lượt'
                      : schedule.notYetOpen
                      ? `Mở lúc ${formatViDateTime(schedule.openAt)}`
                      : 'Đã hết hạn nộp';
                    const qCount =
                      actualSkill === 'listening'
                        ? (test.listening?.questions?.length || 0)
                        : actualSkill === 'reading'
                        ? (test.reading?.questions?.length || 0)
                        : 1;
                    const subCountLabel =
                      actualSkill === 'listening'
                        ? `${getListeningTracks(test.listening).length} Part • ${qCount} câu`
                        : actualSkill === 'reading'
                        ? `${getReadingPassages(test.reading).length} Passage • ${qCount} câu`
                        : cfg.writingTaskScope === 'task1'
                        ? 'Writing Task 1 (Tối thiểu 150 từ)'
                        : cfg.writingTaskScope === 'task2'
                        ? 'Writing Task 2 (Tối thiểu 250 từ)'
                        : 'Writing Task 1 & Task 2';
                    const latestScoreObj =
                      actualSkill === 'listening'
                        ? latestMyAttempt?.scores?.listening
                        : actualSkill === 'reading'
                        ? latestMyAttempt?.scores?.reading
                        : null;

                    return (
                      <div
                        key={test.id}
                        className={`bg-white dark:bg-[#0F172B] border rounded-lg p-5 flex flex-col justify-between gap-4 transition ${
                          focusedMatch?.id === test.id
                            ? 'border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                                {subCatLabel || actualSkill.toUpperCase()} • {cfg.durations[actualSkill]}p
                              </span>
                              {isSuperHomeworkTab && getDailyFolderName(test) && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                  Thư mục: {getDailyFolderName(test)}
                                </span>
                              )}
                              {hasExamPass && (
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                                    isPassUnlocked
                                      ? 'bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                      : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                                  }`}
                                >
                                  <KeyRound className="w-3 h-3" />
                                  {isTeacher
                                    ? `Pass Team: ${cfg.examPassword || 'Đã bật'}`
                                    : isPassUnlocked
                                    ? 'Đã mở Team'
                                    : 'Có Pass Team'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isWritingTask2Tab && (() => {
                                const topicLabel = DAILY_WRITING_T2_TOPICS.find(topic => topic.id === getTask2Topic(test))?.label;
                                const questionTypeLabel = DAILY_WRITING_T2_QUESTION_TYPES.find(
                                  questionType => questionType.id === getTask2QuestionType(test)
                                )?.label;
                                return (
                                  <>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                      {topicLabel || 'Chưa gắn chủ đề'}
                                    </span>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                      {questionTypeLabel || 'Chưa chọn dạng bài'}
                                    </span>
                                  </>
                                );
                              })()}
                              {getAssignedClassNames(cfg.assignedClassIds, classesDb).map(cls => (
                                <span
                                  key={cls.id}
                                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  Team {cls.name}
                                </span>
                              ))}
                              {isTeacher && cfg.visibility === 'private' && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Đang ẩn
                                </span>
                              )}
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                Đã làm: {usedCount} lần
                              </span>
                            </div>
                          </div>

                          <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white leading-snug">
                            {test.title}
                          </h2>
                          {renderTestHashtagPills(test, {
                            onSelectTag: nextTag =>
                              setSelectedSpeakingHashtag(prev =>
                                prev.toLowerCase() === nextTag.toLowerCase() ? 'all' : nextTag
                              )
                          })}
                          {test.description && (
                            <p className="text-sm text-[#475569] dark:text-slate-400 line-clamp-2">{test.description}</p>
                          )}
                          <p className="text-xs font-semibold text-[#334155] dark:text-slate-300">
                            Nội dung: {subCountLabel}
                          </p>

                          {/* Student's latest Daily attempt stats (Số câu đúng + Thời gian + Số lần làm) */}
                          {latestMyAttempt && (
                            <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-[#0F766E] dark:text-teal-300">
                                {latestScoreObj && latestScoreObj.total > 0
                                  ? `Lần #${usedCount}: Band ${latestScoreObj.band ?? latestMyAttempt.overallBand ?? 0} (${latestScoreObj.raw}/${latestScoreObj.total} câu) • ${formatDurationVi(latestMyAttempt.durationSeconds)}`
                                  : latestMyAttempt.teacherGraded
                                  ? `Lần #${usedCount}: Ms. Như đã duyệt (Band ${latestMyAttempt.overallBand}) • ${formatDurationVi(latestMyAttempt.durationSeconds)}`
                                  : `Lần #${usedCount}: Ms. Như đang check • ${formatDurationVi(latestMyAttempt.durationSeconds)}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenResult?.(latestMyAttempt.id)}
                                className="font-bold text-[#0F172B] dark:text-white underline"
                              >
                                Xem bài
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                            {cfg.scheduleMode === 'flexible' ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Làm lại nhiều lần
                              </span>
                            ) : schedule.lockedBySchedule ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> {schedule.notYetOpen ? `Mở lúc ${formatViDateTime(schedule.openAt)}` : `Đã hết hạn (${formatViDateTime(schedule.dueAt)})`}
                              </span>
                            ) : schedule.isLateWindow ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Quá hạn ({formatViDateTime(schedule.dueAt)}) • Vẫn mở
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Hạn nộp: {formatViDateTime(schedule.dueAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => guardSingleSkillStart(test.id)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-[#475569] cursor-not-allowed'
                                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : !isPassUnlocked ? (
                              <KeyRound className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>
                              {isLocked
                                ? lockText
                                : !isPassUnlocked
                                ? `Nhập Pass Team · Vào Làm`
                                : usedCount > 0
                                ? `Làm Lại (Lần #${usedCount + 1})`
                                : `Bắt Đầu Làm Bài`}
                            </span>
                          </button>
                          {isTeacher && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenSkillBuilder?.(actualSkill, test)}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                                title="Chỉnh sửa bài tập này"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {onDeleteTest && (
                                <button
                                  type="button"
                                  data-testid={`daily-delete-test-btn-${test.id}`}
                                  onClick={() => onDeleteTest(test)}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#FECACA] dark:border-slate-700 text-[#B91C1C] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                                  title="Xóa bài tập này"
                                  aria-label={`Xóa ${test.title}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {finalSkillList.length > 24 && (
                  <ListPaginationBar
                    currentPage={paginatedSkillCards.safePage}
                    totalItems={finalSkillList.length}
                    pageSize={24}
                    onPageChange={setActiveSkillPage}
                    itemLabel="bài tập"
                  />
                )}
                </>
              )}
            </>
          );
        })()}
        {renderSingleSkillLeaderboard(actualSkill)}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#020618] text-[#0F172B] dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-5 lg:sticky lg:top-20">
            <div className="space-y-4">
              {/* Brand lockup with Ms. Như Brand Avatar */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2.5">
                  <img
                    src={BRAND_INFO.avatarUrl}
                    alt={BRAND_INFO.shortName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                  />
                  <div>
                    <span className="block font-extrabold text-sm text-[#0F172B] dark:text-white leading-tight">
                      DAILY ZONE
                    </span>
                    <span className="block text-xs font-medium text-[#475569] dark:text-slate-400">
                      Bài tập theo từng Team
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpenMobile(v => !v)}
                  className="lg:hidden px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200"
                >
                  Menu
                </button>
              </div>

              <div className={`${sidebarOpenMobile ? 'block' : 'hidden'} lg:block space-y-1.5`}>
                {isTeacher && onBackToTeacherDashboard && (
                  <button
                    type="button"
                    onClick={onBackToTeacherDashboard}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>Quay Lại Quản Trị GV</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenFullExamCatalog}
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-bold text-[#0F766E] dark:text-teal-300 bg-[#EDFFFD] dark:bg-teal-950/30 hover:opacity-90 border border-[#B5F5F1] dark:border-teal-800 flex items-center gap-2.5 transition"
                >
                  {isTeacher ? <BookOpen className="w-4 h-4 shrink-0" /> : <ArrowLeft className="w-4 h-4 shrink-0" />}
                  <span>Thực Chiến Thi Thật 4KN</span>
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                {navItems.map(item => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChangeTab?.(item.id);
                        setSidebarOpenMobile(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 transition ${
                        isActive
                          ? 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#007A7A]/30'
                          : 'text-[#334155] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#007A7A] text-white'
                          : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Progress Ring Widget (flat section divider) */}
            <div className={`${sidebarOpenMobile ? 'block' : 'hidden'} lg:block pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3`}>
              <div className="py-1 text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full border-4 border-[#007A7A] flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-900">
                  <span className="text-sm font-black text-[#0F172B] dark:text-white leading-none">
                    {mySpeakingAttempts.length}
                  </span>
                  <span className="text-xs text-[#475569] dark:text-slate-400 font-semibold leading-none mt-0.5">lần</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#0F172B] dark:text-white">
                    {bestSpeakingBand !== null ? `Band Cao Nhất: ${bestSpeakingBand}` : 'Chưa có điểm Speaking'}
                  </p>
                  <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                    <span>Ms. Như trực tiếp duyệt &amp; chấm</span>
                  </p>
                </div>
              </div>

              {isTeacher && (
                <div className="space-y-2">
                  {onBulkCreateTests && (
                    <button
                      type="button"
                      data-testid="sidebar-open-bulk-writing-ai-btn"
                      onClick={() =>
                        setBulkWritingModalState({
                          open: true,
                          mode: activeTab === 'writing_task1' ? 'task1' : 'task2',
                          task1SubCategory:
                            activeTab === 'writing_task1' && activeSubCatFilter !== 'all'
                              ? activeSubCatFilter
                              : 'w1_dynamic'
                        })
                      }
                      className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Wand2 className="w-4 h-4 shrink-0" /> Tạo Đề Hàng Loạt (PDF/AI)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'writing_task1') {
                        onOpenSkillBuilder?.('writing', null, { writingTaskScope: 'task1', dailySubCategory: 'w1_map' });
                      } else if (activeTab === 'writing_task2') {
                        onOpenSkillBuilder?.('writing', null, { writingTaskScope: 'task2', dailySubCategory: 'w2_essay' });
                      } else if (activeTab === 'listening' || activeTab === 'reading') {
                        onOpenSkillBuilder?.(activeTab);
                      } else {
                        onOpenSkillBuilder?.('speaking');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Tạo Bài Daily Mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main
          key={`skill-hub-tab-${activeTab}`}
          className="apple-view-enter flex-1 min-w-0 space-y-8"
          onAnimationEnd={e => {
            if (e.currentTarget === e.target) {
              e.currentTarget.classList.remove('apple-view-enter');
            }
          }}
        >
          {!isTeacher && (
            <div className="rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#065F46] dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                <span>
                  {studentHasVip
                    ? `DAILY ZONE MIỄN PHÍ 100% • Đang bật IELTS VIP (${activeAccessExpiryText})`
                    : 'DAILY ZONE đang mở MIỄN PHÍ 100% cho toàn bộ học viên làm lại nhiều lần!'}
                </span>
              </span>
              {!studentHasVip && (
                <button
                  type="button"
                  onClick={() => openSkillPassCheckout('aieo_vip')}
                  className="px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>Gói Tháng ({formatVndCurrency(payCfg.aieoVipPrice)}/tháng) - Game Từ Vựng, Tạo Phòng, Màu Chữ &amp; Ảnh Bìa</span>
                </button>
              )}
            </div>
          )}
          {['speaking', 'speaking_daily', 'speaking_exam_room', 'forecast'].includes(activeTab) ? (() => {
            const activeSpeakingList =
              activeTab === 'forecast'
                ? forecastTests
                : dailySpeakingTests.length > 0
                ? dailySpeakingTests
                : speakingTests;
            const featuredSpeakingTest = activeSpeakingList[0] || null;
            const featuredSpMeta = featuredSpeakingTest ? normalizeSpeakingSection(featuredSpeakingTest.speaking) : null;
            const focusedSpeakingMatch = focusedTestId ? activeSpeakingList.find(t => t.id === focusedTestId) : null;
            const displayedSpeakingList = focusedSpeakingMatch ? [focusedSpeakingMatch] : activeSpeakingList;
            const featuredSchedule = featuredSpeakingTest ? evaluateTestSchedule(featuredSpeakingTest, serverNowMs) : null;
            const featuredUsedCount = featuredSpeakingTest ? myAttempts.filter(a => a.testId === featuredSpeakingTest.id).length : 0;
            const featuredCfg = featuredSpeakingTest ? normalizeExamConfig(featuredSpeakingTest) : null;
            const featuredExhausted = Boolean(featuredCfg && featuredCfg.maxAttempts > 0 && featuredUsedCount >= featuredCfg.maxAttempts);
            const featuredLocked = featuredExhausted || Boolean(!isTeacher && featuredSchedule?.lockedBySchedule);

            return (
            <>
              {/* 2 Core Speaking Sections in Daily Zone: Daily Speaking + Cày Forecast Cùng Ms. Như */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onChangeTab?.('speaking_daily')}
                  className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                    activeTab !== 'forecast'
                      ? 'bg-[#C2410C] text-white border-[#C2410C]'
                      : 'bg-white dark:bg-[#0F172B] border-slate-200 dark:border-slate-800 hover:border-[#C2410C]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeTab !== 'forecast' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#C2410C] dark:bg-orange-500/20 dark:text-orange-300'}`}>
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>1. Daily Speaking ({dailySpeakingTests.length})</span>
                    </p>
                    <p className={`text-xs mt-0.5 leading-snug ${activeTab !== 'forecast' ? 'text-orange-50' : 'text-[#475569] dark:text-slate-400'}`}>
                      Bài luyện nói hàng ngày cho Team · Nhắc người chưa hoàn thành
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTab?.('forecast')}
                  className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                    activeTab === 'forecast'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-white dark:bg-[#0F172B] border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'forecast' ? 'bg-white/20 text-white' : 'bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6]'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">2. Cày Forecast Cùng Ms. Như ({forecastTests.length})</p>
                    <p className={`text-xs mt-0.5 leading-snug ${activeTab === 'forecast' ? 'text-teal-50' : 'text-[#475569] dark:text-slate-400'}`}>
                      Bộ đề Forecast Speaking cập nhật · Luyện ghi âm từng Part hoặc Full
                    </p>
                  </div>
                </button>
              </div>

              {/* Structured 3-Part Speaking Zone (Google Drive Folder Explorer + Bulk Class Assign) */}
              {!focusedSpeakingMatch && (
                <SpeakingForecastZone
                  zoneKey={activeTab === 'forecast' ? 'forecast' : 'daily'}
                  speakingForecast={speakingForecast}
                  bank={speakingForecast}
                  classesDb={classesDb}
                  isTeacher={isTeacher}
                  aiApiKey={aiApiKey}
                  aiConfigured={aiConfigured}
                  onSaveBank={onSaveSpeakingForecast}
                  onStartPracticeTest={onStartSpeakingPracticeTest}
                  showToast={showToast}
                />
              )}

              {/* Daily Compliance Alert Strip for Students OR Teacher Missing Tracker */}
              {!isTeacher && dailyCompliance.myPendingDailyTests.length > 0 && (
                <div className="rounded-lg bg-[#FFFBEB] dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C2410C] text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-extrabold text-[#9A3412] dark:text-amber-200">
                        Bắt Buộc Hôm Nay: Bạn còn {dailyCompliance.myPendingDailyTests.length} bài Speaking Daily chưa hoàn thành!
                      </p>
                      <p className="text-xs sm:text-sm text-[#334155] dark:text-slate-300 mt-0.5 max-w-2xl">
                        Đề chờ hoàn thành: <strong>{dailyCompliance.myPendingDailyTests.map(d => d.title).join(', ')}</strong>. Hãy hoàn thành sớm để hệ thống ghi nhận đạt Daily!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerSpeakingStart(dailyCompliance.myPendingDailyTests[0], 'full')}
                    className="px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold shrink-0 inline-flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Làm Bài Daily Ngay →
                  </button>
                </div>
              )}

              {!isTeacher && activeTab === 'speaking_daily' && dailyCompliance.myDailyTests.length > 0 && dailyCompliance.myPendingDailyTests.length === 0 && (
                <div className="rounded-lg bg-[#D1FAE5] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 px-4 py-3 flex items-center gap-2.5 text-xs font-bold text-[#065F46] dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Tuyệt vời! Bạn đã hoàn thành toàn bộ Speaking Daily bắt buộc hôm nay.
                </div>
              )}

              {isTeacher && activeTab === 'speaking_daily' && dailyCompliance.perTest.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#C2410C]" />
                        Báo Cáo Speaking Daily: Ai Chưa Hoàn Thành ({dailyCompliance.missingStudentSummaries.length} HS)
                      </h2>
                      <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5 max-w-2xl">
                        Tự động đối chiếu học viên trong lớp/hệ thống với bài nộp Speaking Daily. Học viên chưa nộp sẽ hiển thị bên dưới để báo nhắc ngay.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {dailyCompliance.perTest.map(row => (
                      <div
                        key={row.test.id}
                        className="py-3.5 first:pt-0 last:pb-0 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#0F172B] dark:text-white">{row.test.title}</span>
                            {row.dailyDate && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {row.dailyDate}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] dark:bg-emerald-500/20 dark:text-emerald-300">
                              ✓ Đã nộp: {row.doneStudents.length}/{row.targetStudents.length}
                            </span>
                            {row.missingStudents.length > 0 && onNotifyMissingDaily && (
                              <button
                                type="button"
                                onClick={() => onNotifyMissingDaily(row.test, row.missingStudents)}
                                className="px-3 py-1 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold inline-flex items-center gap-1 transition"
                              >
                                <Send className="w-3 h-3" /> Báo &amp; Nhắc {row.missingStudents.length} HS Chưa Làm
                              </button>
                            )}
                          </div>
                        </div>

                        {row.missingStudents.length === 0 ? (
                          <p className="text-xs font-bold text-[#065F46] dark:text-emerald-400">
                            ✓ 100% học viên mục tiêu đã hoàn thành bài Daily này!
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs font-bold text-[#B91C1C] dark:text-rose-400 mr-1">Chưa hoàn thành:</span>
                            {row.missingStudents.map(stu => (
                              <span
                                key={stu.username}
                                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/20 text-[#991B1B] dark:text-rose-200 border border-rose-200 dark:border-rose-500/40"
                              >
                                {stu.name || stu.username} (@{stu.username})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {focusedSpeakingMatch && onClearFocusedTest && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/40 border border-[#007A7A]/40 dark:border-[#1EE1D6]/30">
                  <span className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">
                    📌 Đang hiển thị bài tập từ thông báo
                  </span>
                  <button
                    type="button"
                    onClick={onClearFocusedTest}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#007A7A] transition"
                  >
                    ← Xem tất cả ({activeSpeakingList.length})
                  </button>
                </div>
              )}

              {/* Hero Row + Heatmap (hidden when focused from a notification so only that card renders) */}
              {!focusedSpeakingMatch && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                <div className="xl:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 text-[#0F766E] dark:text-[#1EE1D6] text-xs font-bold">
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {activeTab === 'forecast'
                        ? 'Mục 2: Cày Forecast Cùng Ms. Như • Bộ Đề Speaking Mới Nhất'
                        : 'Mục 1: Daily Speaking • Hoàn Thành Hàng Ngày Theo Team'}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172B] dark:text-white tracking-tight">
                    {activeTab === 'forecast' ? 'Cày Forecast Cùng Ms. Như' : 'Daily Speaking'}
                  </h1>
                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
                    {activeTab === 'forecast'
                      ? 'Luyện phản xạ từng Part 1, Cue Card Part 2 và Discussion Part 3 theo bộ câu hỏi Forecast do Ms. Như biên soạn. File ghi âm được gửi thẳng tới Ms. Như kiểm tra & nhận xét.'
                      : 'Bài luyện nói cập nhật hàng ngày cho các Team. Toàn bộ file ghi âm được lưu trữ và gửi về Ms. Như check & duyệt điểm.'}
                  </p>

                  {featuredSpeakingTest ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={featuredLocked}
                          onClick={() => handleTriggerSpeakingStart(featuredSpeakingTest, 'full')}
                          className={`px-7 py-3 rounded-lg text-sm font-bold tracking-wide flex items-center gap-2 transition ${
                            featuredLocked
                              ? 'bg-slate-200 dark:bg-slate-800 text-[#475569] cursor-not-allowed'
                              : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                          }`}
                        >
                          {featuredLocked || (!isTeacher && featuredSpMeta?.speakingTrack === 'exam_room' && featuredSpMeta?.hasRoomPassword && !speakingUnlockTokens?.[featuredSpeakingTest.id])
                            ? <Lock className="w-4 h-4" />
                            : <Mic className="w-4 h-4" />}
                          <span>
                            {featuredLocked
                              ? 'Đã Khóa / Hết Hạn'
                              : !isTeacher && featuredSpMeta?.speakingTrack === 'exam_room' && featuredSpMeta?.hasRoomPassword && !speakingUnlockTokens?.[featuredSpeakingTest.id]
                              ? 'Nhập Pass & Thi Full Test'
                              : 'Full Test'}
                          </span>
                        </button>
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => onOpenSkillBuilder?.('speaking')}
                            className="px-4 py-3 rounded-lg bg-white dark:bg-[#0F172B] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 text-[#0F172B] dark:text-white border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Plus className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Tạo Đề Speaking Mới
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                          Hoặc thi từng part đơn lẻ ({featuredSpeakingTest.title}):
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={featuredLocked || !featuredSpMeta?.part1?.enabled}
                            onClick={() => handleTriggerSpeakingStart(featuredSpeakingTest, 'part1')}
                            className="px-4 py-2 rounded-full bg-white dark:bg-[#0F172B] hover:border-[#007A7A] disabled:opacity-40 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-100 transition"
                          >
                            Thi Part 1
                          </button>
                          <button
                            type="button"
                            disabled={featuredLocked || !featuredSpMeta?.part2?.enabled}
                            onClick={() => handleTriggerSpeakingStart(featuredSpeakingTest, 'part2')}
                            className="px-4 py-2 rounded-full bg-white dark:bg-[#0F172B] hover:border-[#007A7A] disabled:opacity-40 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-100 transition"
                          >
                            Thi Part 2
                          </button>
                          <button
                            type="button"
                            disabled={featuredLocked || !featuredSpMeta?.part3?.enabled}
                            onClick={() => handleTriggerSpeakingStart(featuredSpeakingTest, 'part3')}
                            className="px-4 py-2 rounded-full bg-white dark:bg-[#0F172B] hover:border-[#007A7A] disabled:opacity-40 border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-100 transition"
                          >
                            Thi Part 3
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 text-sm text-[#475569] dark:text-slate-300">
                      Chưa có bài tập nào trong mục này. {isTeacher ? 'Bấm "Tạo Bài Tập Kỹ Năng Mới" và chọn phân loại tương ứng để đăng bài ngay.' : 'Vui lòng chờ giáo viên mở bài tập Speaking.'}
                    </div>
                  )}
                </div>

                {/* Activity Heatmap Top Right matching Luyennoi */}
                <div className="xl:col-span-5">
                  <SpeakingHeatmapCard attempts={myAttempts} />
                </div>
              </div>
              )}

              {/* Kho Bài Tập Speaking Của Lớp */}
              <section className="space-y-4">
                {(() => {
                  const tagCountsMap = new Map();
                  activeSpeakingList.forEach(t => {
                    getEffectiveTestHashtags(t).forEach(h => {
                      const prev = tagCountsMap.get(h.tag.toLowerCase());
                      tagCountsMap.set(h.tag.toLowerCase(), {
                        tag: prev?.tag || h.tag,
                        kind: prev?.kind || h.kind,
                        count: (prev?.count || 0) + 1
                      });
                    });
                  });
                  const availableHashtagFilters = Array.from(tagCountsMap.values());
                  const finalSpeakingList =
                    selectedSpeakingHashtag === 'all' || Boolean(focusedSpeakingMatch)
                      ? displayedSpeakingList
                      : displayedSpeakingList.filter(t =>
                          getEffectiveTestHashtags(t).some(
                            h => h.tag.toLowerCase() === selectedSpeakingHashtag.toLowerCase()
                          )
                        );

                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172B] dark:text-white">
                            {activeTab === 'forecast'
                              ? 'Kho Đề Cày Forecast Cùng Ms. Như'
                              : 'Danh Sách Bài Daily Speaking'}
                          </h2>
                          <p className="text-sm text-[#475569] dark:text-slate-400 max-w-2xl">
                            Làm lại không giới hạn số lượt · Cần thi Thực Chiến full 4 kỹ năng (L·R·W·S)? Quay về trang chủ mục <b>Thực Chiến Thi Thật</b>!
                          </p>
                        </div>
                      </div>

                      {/* 1-Click Hashtag Filter Bar for Students */}
                      {availableHashtagFilters.length > 0 && !focusedSpeakingMatch && (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-[#334155] dark:text-slate-300 flex items-center gap-1 mr-1">
                            <Hash className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                            Lọc theo Hashtag:
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSpeakingHashtag('all')}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                              selectedSpeakingHashtag === 'all'
                                ? 'bg-[#0F172B] text-white border-[#0F172B] dark:bg-white dark:text-slate-950'
                                : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            Tất cả ({activeSpeakingList.length})
                          </button>
                          {availableHashtagFilters.map(hf => {
                            const isSel = selectedSpeakingHashtag.toLowerCase() === hf.tag.toLowerCase();
                            return (
                              <button
                                key={hf.tag}
                                type="button"
                                onClick={() =>
                                  setSelectedSpeakingHashtag(prev =>
                                    prev.toLowerCase() === hf.tag.toLowerCase() ? 'all' : hf.tag
                                  )
                                }
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                                  isSel
                                    ? 'bg-[#007A7A] text-white border-[#007A7A] ring-2 ring-[#007A7A]/25'
                                    : hf.kind === 'real_exam'
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-[#991B1B] dark:text-rose-200 border-rose-300 dark:border-rose-700 hover:bg-rose-100'
                                    : hf.kind === 'password'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100'
                                    : hf.kind === 'daily'
                                    ? 'bg-orange-50 dark:bg-orange-950/50 text-[#C2410C] dark:text-orange-200 border-orange-300 dark:border-orange-700'
                                    : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                                }`}
                              >
                                {hf.tag} ({hf.count})
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {finalSpeakingList.map(test => {
                          const cfg = normalizeExamConfig(test);
                          const schedule = evaluateTestSchedule(cfg, serverNowMs);
                          const sp = normalizeSpeakingSection(test.speaking);
                          const hasPass = Boolean(sp.hasRoomPassword || sp.roomPassword || cfg.hasExamPassword || cfg.examPassword);
                          const isRealExamCard = sp.speakingTrack === 'exam_room' || cfg.examPurpose === 'real_exam' || hasPass || cfg.maxAttempts === 1;
                          const visibleTeacherPass = isTeacher ? String(sp.roomPassword || cfg.examPassword || '').trim() : '';
                          const totalItems = getSpeakingQuestionItems(sp, 'all').length;
                    const p1Count = sp.part1.enabled ? (sp.part1.questions?.length || 0) : 0;
                    const p2Count = sp.part2.enabled ? 1 : 0;
                    const p3Count = sp.part3.enabled ? (sp.part3.questions?.length || 0) : 0;
                    const usedCount = myAttempts.filter(a => a.testId === test.id).length;
                    const isExhausted = cfg.maxAttempts > 0 && usedCount >= cfg.maxAttempts;
                    const isLocked = isExhausted || (!isTeacher && schedule.lockedBySchedule);
                    const lockText = isExhausted
                      ? 'Đã hết lượt'
                      : schedule.notYetOpen
                      ? `Mở lúc ${formatViDateTime(schedule.openAt)}`
                      : 'Đã hết hạn nộp';

                    return (
                      <div
                        key={test.id}
                        className={`bg-white dark:bg-[#0F172B] border rounded-lg p-5 flex flex-col justify-between gap-4 transition ${
                          focusedSpeakingMatch?.id === test.id
                            ? 'border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                            : isRealExamCard
                            ? 'border-rose-300 dark:border-rose-700/70 hover:border-rose-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {renderTestHashtagPills(test, {
                            onSelectTag: tag =>
                              setSelectedSpeakingHashtag(prev =>
                                prev.toLowerCase() === tag.toLowerCase() ? 'all' : tag
                              )
                          })}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isTeacher && hasPass && (
                                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-500/40 inline-flex items-center gap-1">
                                  <KeyRound className="w-3 h-3" />
                                  <span>{visibleTeacherPass ? `Pass: ${visibleTeacherPass}` : 'Có mật khẩu'}</span>
                                </span>
                              )}
                              {sp.speakingTrack === 'daily' && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#C2410C] text-white">
                                  Daily {sp.dailyDate || ''}
                                </span>
                              )}
                              {sp.speakingTrack === 'exam_room' && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#B91C1C] text-white inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Phòng Thi Thực Chiến
                                </span>
                              )}
                              {sp.isForecast && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                  Forecast
                                </span>
                              )}
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30">
                                {totalItems} câu · Ms. Như duyệt &amp; chấm
                              </span>
                              {sp.speakingTrack === 'daily' && !isTeacher && (
                                usedCount > 0 ? (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] dark:bg-emerald-500/20 dark:text-emerald-300">
                                    ✓ Đã hoàn thành
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#991B1B] dark:bg-rose-500/20 dark:text-rose-300">
                                    Chưa làm
                                  </span>
                                )
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {getAssignedClassNames(cfg.assignedClassIds, classesDb).map(cls => (
                                <span
                                  key={cls.id}
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  Lớp {cls.name}
                                </span>
                              ))}
                              {isTeacher && cfg.visibility === 'private' && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] dark:bg-amber-500/20 dark:text-amber-300">
                                  Đang ẩn
                                </span>
                              )}
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {cfg.maxAttempts === 0 ? `Tự do (${usedCount})` : `Thi thật ${usedCount}/${cfg.maxAttempts}`}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-extrabold text-[#0F172B] dark:text-white leading-snug">
                            {test.title}
                          </h3>
                          <p className="text-sm text-[#475569] dark:text-slate-400 line-clamp-2">
                            {test.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-[#334155] dark:text-slate-300">
                            {p1Count > 0 && <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">P1: {p1Count} câu</span>}
                            {p2Count > 0 && <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">P2: Cue Card</span>}
                            {p3Count > 0 && <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">P3: {p3Count} câu</span>}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                            {cfg.scheduleMode === 'flexible' ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Làm bất kỳ lúc nào
                              </span>
                            ) : schedule.lockedBySchedule ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-[#B91C1C] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> {schedule.notYetOpen ? `Mở lúc ${formatViDateTime(schedule.openAt)}` : `Đã hết hạn (${formatViDateTime(schedule.dueAt)})`}
                              </span>
                            ) : schedule.isLateWindow ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Quá hạn ({formatViDateTime(schedule.dueAt)}) • Vẫn cho làm (báo trễ)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-amber-500/15 text-[#92400E] dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Hạn nộp: {formatViDateTime(schedule.dueAt)}{cfg.scheduleMode === 'deadline_lock' ? ' (Khóa sau hạn)' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleTriggerSpeakingStart(test, 'full')}
                            className={`flex-1 py-2.5 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-[#475569] cursor-not-allowed'
                                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                            }`}
                          >
                            {isLocked || (!isTeacher && hasPass && !speakingUnlockTokens?.[test.id])
                              ? <Lock className="w-3.5 h-3.5" />
                              : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>
                              {isLocked
                                ? lockText
                                : !isTeacher && hasPass && !speakingUnlockTokens?.[test.id]
                                ? 'Mật Khẩu · Vào Thi'
                                : 'Full Test'}
                            </span>
                          </button>

                          {!isLocked && p1Count > 0 && (
                            <button
                              type="button"
                              onClick={() => handleTriggerSpeakingStart(test, 'part1')}
                              className="px-3 py-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#007A7A] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#334155] dark:text-slate-200"
                            >
                              P1
                            </button>
                          )}
                          {!isLocked && p2Count > 0 && (
                            <button
                              type="button"
                              onClick={() => handleTriggerSpeakingStart(test, 'part2')}
                              className="px-3 py-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#007A7A] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#334155] dark:text-slate-200"
                            >
                              P2
                            </button>
                          )}
                          {!isLocked && p3Count > 0 && (
                            <button
                              type="button"
                              onClick={() => handleTriggerSpeakingStart(test, 'part3')}
                              className="px-3 py-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:border-[#007A7A] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#334155] dark:text-slate-200"
                            >
                              P3
                            </button>
                          )}
                          {isTeacher && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenSkillBuilder?.('speaking', test)}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                                title="Chỉnh sửa bài tập Speaking này"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteTest && (
                                <button
                                  type="button"
                                  data-testid={`daily-delete-test-btn-${test.id}`}
                                  onClick={() => onDeleteTest(test)}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#FECACA] dark:border-slate-700 text-[#B91C1C] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                                  title="Xóa bài tập Speaking này"
                                  aria-label={`Xóa ${test.title}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                    </>
                  );
                })()}
              </section>

              {/* LỊCH SỬ THI SPEAKING */}
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172B] dark:text-white">
                  Lịch sử thi Speaking
                </h2>

                {mySpeakingAttempts.length === 0 ? (
                  <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-sm text-[#475569] dark:text-slate-400">
                    Bạn chưa có bài thi Speaking nào. Bấm <strong>Full Test</strong> hoặc chọn một Part ở trên để bắt đầu!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySpeakingAttempts.map(att => {
                      const canShowApproved = isTeacher || Boolean(att.teacherGraded);
                      const band = canShowApproved ? (att.scores?.speaking?.band ?? att.overallBand) : null;
                      const formattedBand = typeof band === 'number' ? String(Math.round(band)) : '...';
                      const modeLabel =
                        att.speakingPartMode && att.speakingPartMode !== 'full'
                          ? `TEST ${att.speakingPartMode.toUpperCase()}`
                          : 'FULL TEST';
                      const recCount = Array.isArray(att.speakingRecordings) ? att.speakingRecordings.length : 0;

                      return (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => onOpenResult?.(att.id)}
                          className="w-full text-left bg-white dark:bg-[#0F172B] hover:border-[#007A7A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4 transition group"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6]">
                                {modeLabel}
                              </span>
                              <span className="text-sm font-bold text-[#0F172B] dark:text-slate-200 truncate">
                                • {att.testTitle}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569] dark:text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {att.submittedAt}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[#065F46] dark:text-emerald-400 font-semibold">
                                <FileAudio className="w-3.5 h-3.5" /> {recCount} file ghi âm
                              </span>
                              {att.teacherGraded ? (
                                <span className="inline-flex items-center gap-1 text-[#0F766E] dark:text-[#1EE1D6] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ms. Như đã duyệt điểm
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
                                  <Clock className="w-3.5 h-3.5" /> Ms. Như đang check
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 min-w-[60px] px-2 h-12 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#007A7A] flex flex-col items-center justify-center transition">
                            <span className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white tabular-nums leading-none">
                              {canShowApproved ? formattedBand : 'Check'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
            );
          })() : activeTab === 'single_hub' ? (
            renderSingleHubZone()
          ) : (
            renderSkillTestCards(
              activeTab,
              activeTab === 'listening'
                ? listeningTests
                : activeTab === 'reading'
                ? readingTests
                : activeTab === 'writing_task1'
                ? writingTask1Tests
                : activeTab === 'writing_task2'
                ? writingTask2Tests
                : writingTests
            )
          )}
        </main>
      </div>

      {/* Bulk AI Writing Task 1 (Images/PDF per folder) & Task 2 (350+ Prompts PDF) Creator Modal */}
      <DailyWritingBulkModal
        isOpen={bulkWritingModalState.open}
        initialMode={bulkWritingModalState.mode}
        initialTask1SubCategory={bulkWritingModalState.task1SubCategory}
        aiApiKey={aiApiKey}
        aiConfigured={aiConfigured}
        onClose={() => setBulkWritingModalState(prev => ({ ...prev, open: false }))}
        onBulkSaveTests={onBulkCreateTests}
        setApiTestState={setApiTestState}
        setShowApiKeyModal={setShowApiKeyModal}
        showToast={showToast}
      />

      {/* Bulk Assign Folder to Classes Modal (Daily Reading / Listening / Writing Folders) */}
      <AssignFolderModal
        isOpen={Boolean(bulkFolderAssignTarget)}
        folderLabel={bulkFolderAssignTarget?.label || ''}
        itemCount={bulkFolderAssignTarget?.testIds?.length || 0}
        itemUnit="bài tập"
        classesDb={classesDb}
        initialClassIds={bulkFolderAssignTarget?.initialClassIds || []}
        showModeToggle={true}
        showPublishOption={true}
        showNotifyOption={true}
        onClose={() => setBulkFolderAssignTarget(null)}
        onConfirm={async ({ assignedClassIds, mode, publish, notify }) => {
          if (!bulkFolderAssignTarget || !onAssignFolderClasses) return;
          await onAssignFolderClasses(bulkFolderAssignTarget.testIds, {
            assignedClassIds,
            mode,
            publish,
            notify,
            folderLabel: bulkFolderAssignTarget.label
          });
        }}
      />

      {/* Modal Nhập Mật Khẩu Phòng Thi Thực Chiến Speaking (Team Sắp Thi) */}
      {passwordPromptTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPasswordPromptTarget(null)}
        >
          <form
            onSubmit={handleSubmitRoomPassword}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] dark:text-rose-400">
                    Team Sắp Thi · Phòng Thi Thực Chiến
                  </span>
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white leading-snug">
                    {passwordPromptTarget.test?.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordPromptTarget(null)}
                className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172B] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
              Vui lòng nhập <strong>Mật khẩu Phòng Thi</strong> do giáo viên cung cấp để mở khóa vào làm bài.
            </p>

            <div className="space-y-1.5">
              <input
                type="password"
                autoFocus
                required
                value={roomPassInput}
                onChange={e => setRoomPassInput(e.target.value)}
                placeholder="Nhập mật khẩu phòng thi..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-[#0F172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
              />
              {roomPassError && (
                <p className="text-xs font-bold text-[#B91C1C] dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {roomPassError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPasswordPromptTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#334155] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={verifyingRoomPass}
                className="px-5 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifyingRoomPass ? 'Đang kiểm tra...' : 'Mở Khóa & Vào Thi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
