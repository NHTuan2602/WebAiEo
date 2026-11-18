import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Edit,
  EyeOff,
  FileAudio,
  Flame,
  Hash,
  Headphones,
  KeyRound,
  Layers,
  Lock,
  Mic,
  PenTool,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X
} from 'lucide-react';
import { BRAND_INFO } from '../constants/brandInfo';
import { getAssignedClassNames, getEffectiveTestHashtags, getListeningTracks, getReadingPassages, getSpeakingQuestionItems, getVietnamTodayDateKey, canUserAccessTest, evaluateSpeakingDailyCompliance, evaluateTestSchedule, formatViDateTime, normalizeExamConfig, normalizeSpeakingSection } from '../constants/seedData';
import { getQuestionTypeMeta } from '../utils/examHelpers';
import { verifySpeakingRoomPassword } from '../utils/speakingApi';
import {
  formatRemainingSubscriptionText,
  formatVndCurrency,
  hasActiveAieoVip,
  normalizePaymentConfig,
  resolveUserVipNameVisual
} from '../constants/profileCustomization';
import SpeakingHeatmapCard from '../components/speaking/SpeakingHeatmapCard';
import VipMemberName from '../components/common/VipMemberName';

export default function SkillPracticeHub({
  activeTab = 'speaking',
  aiConfigured = false,
  attempts = [],
  classesDb = {},
  currentUser,
  focusedTestId = null,
  onChangeTab,
  onClearFocusedTest,
  onNotifyMissingDaily,
  onOpenCheckoutModal = null,
  onOpenFullExamCatalog,
  onOpenResult,
  onOpenSkillBuilder,
  onSpeakingRoomUnlocked,
  onStartSingleSkillExam,
  onStartSpeakingExam,
  paymentConfig = null,
  serverClockOffsetMs = 0,
  showToast,
  examUnlockTokens = {},
  speakingUnlockTokens = {},
  tests = [],
  usersDb = {}
}) {
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [singleHubSkill, setSingleHubSkill] = useState('all'); // 'all' | 'reading' | 'listening' | 'writing'
  const hashtagScopeKey = `${activeTab}:${singleHubSkill}`;
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
        itemLabel: 'Gói Ai eo VIP (1 Tháng Full Quyền)',
        itemPrice: payCfg.aieoVipPrice
      });
    } else {
      showToast?.('Mở Trang Cá Nhân để kích hoạt Gói Ai eo VIP.', 'info');
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
    t => normalizeSpeakingSection(t.speaking).speakingTrack === 'daily'
  );
  const examRoomSpeakingTests = speakingTests.filter(t => {
    const sp = normalizeSpeakingSection(t.speaking);
    const cfg = normalizeExamConfig(t);
    return (
      sp.speakingTrack === 'exam_room' ||
      cfg.examPurpose === 'real_exam' ||
      Boolean(sp.hasRoomPassword || sp.roomPassword || cfg.hasExamPassword || cfg.examPassword)
    );
  });
  const listeningTests = singleSkillTests.filter(t => t.focusSkill === 'listening');
  const readingTests = singleSkillTests.filter(t => t.focusSkill === 'reading');
  const writingTests = singleSkillTests.filter(t => t.focusSkill === 'writing');

  const forecastTests = [
    ...speakingTests.filter(t => normalizeSpeakingSection(t.speaking).isForecast),
    ...speakingTests.filter(t => !normalizeSpeakingSection(t.speaking).isForecast)
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
      label: '1. Speaking Daily',
      icon: Flame,
      badge: !isTeacher && dailyCompliance.myPendingDailyTests.length > 0
        ? `${dailyCompliance.myPendingDailyTests.length} mới`
        : dailySpeakingTests.length
    },
    { id: 'speaking_exam_room', label: '2. Phòng Thi Thực Chiến', icon: Lock, badge: examRoomSpeakingTests.length },
    { id: 'speaking', label: 'Kho Speaking AI', icon: Mic, badge: speakingTests.length },
    { id: 'forecast', label: 'Bài Tập Forecast', icon: Sparkles, badge: forecastTests.length },
    {
      id: 'single_hub',
      label: 'Zone Tổng Đề Thi Lẻ (Đ·N·V)',
      icon: Layers,
      badge: readingTests.length + listeningTests.length + writingTests.length
    },
    ...(!isTeacher
      ? [
          { id: 'reading', label: 'Đọc (Reading Lẻ)', icon: BookOpen, badge: readingTests.length },
          { id: 'listening', label: 'Nghe (Listening Lẻ)', icon: Headphones, badge: listeningTests.length },
          { id: 'writing', label: 'Viết (Writing Lẻ)', icon: PenTool, badge: writingTests.length }
        ]
      : [])
  ];

  const renderSingleSkillLeaderboard = (skillFilter = 'all') => {
    const relevantAttempts = attempts.filter(a => {
      if (!a || a.testMode !== 'single_skill') return false;
      const sk = a.focusSkill || '';
      if (!['reading', 'listening', 'writing'].includes(sk)) return false;
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
                            <button
                              type="button"
                              onClick={() => onOpenSkillBuilder?.(sk, test)}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                              title="Chỉnh sửa bài này"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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

  const renderSkillTestCards = (skillId, list) => {
    const metaMap = {
      listening: { name: 'Listening', color: 'text-[#0F766E] dark:text-[#1EE1D6]', bg: 'bg-[#EDFFFD] dark:bg-teal-500/15', icon: Headphones },
      reading: { name: 'Reading', color: 'text-[#1D4ED8] dark:text-blue-400', bg: 'bg-[#EFF6FF] dark:bg-blue-500/15', icon: BookOpen },
      writing: { name: 'Writing', color: 'text-[#065F46] dark:text-emerald-400', bg: 'bg-[#D1FAE5] dark:bg-emerald-500/15', icon: PenTool }
    };
    const meta = metaMap[skillId] || metaMap.reading;
    const IconComp = meta.icon;
    const focusedMatch = focusedTestId ? list.find(t => t.id === focusedTestId) : null;
    const displayedList = focusedMatch ? [focusedMatch] : list;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172B] dark:text-white tracking-tight flex items-center gap-2.5">
              <span className={`w-10 h-10 rounded-lg ${meta.bg} ${meta.color} border border-slate-200 dark:border-slate-700 flex items-center justify-center`}>
                <IconComp className="w-5 h-5" />
              </span>
              <span>Bài Tập Kỹ Năng: {meta.name}</span>
            </h1>
            <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-2xl">
              Bài tập thực hành chuyên sâu theo từng kỹ năng, tách biệt hoàn toàn khỏi bộ Đề Thi IELTS (L·R·W).
            </p>
          </div>
          {isTeacher && (
            <button
              type="button"
              onClick={() => onOpenSkillBuilder?.(skillId)}
              className="px-4 py-2.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-2 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Tạo Bài Tập {skillId.toUpperCase()}
            </button>
          )}
        </div>

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
          const finalSkillList =
            selectedSpeakingHashtag === 'all' || Boolean(focusedMatch)
              ? displayedList
              : displayedList.filter(t =>
                  getEffectiveTestHashtags(t).some(
                    h => h.tag.toLowerCase() === selectedSpeakingHashtag.toLowerCase()
                  )
                );

          return (
            <>
              {availableHashtagFilters.length > 0 && !focusedMatch && (
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
              )}

              {finalSkillList.length === 0 ? (
                <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center space-y-3">
                  <IconComp className="w-10 h-10 mx-auto text-[#475569] dark:text-slate-400" />
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-slate-100">
                    {selectedSpeakingHashtag !== 'all'
                      ? `Chưa có bài ${skillId.toUpperCase()} nào gắn nhãn ${selectedSpeakingHashtag}`
                      : `Chưa có bài tập ${skillId.toUpperCase()} nào`}
                  </h2>
                  <p className="text-sm text-[#475569] dark:text-slate-400 max-w-md mx-auto">
                    {selectedSpeakingHashtag !== 'all'
                      ? 'Hãy bấm "Tất cả" để xem toàn bộ danh sách bài tập.'
                      : isTeacher
                      ? `Hãy bấm "Tạo Bài Tập ${skillId.toUpperCase()}" để tạo nhanh một bài tập luyện riêng kỹ năng ${skillId.toUpperCase()}.`
                      : 'Giáo viên sẽ đăng tải các bài tập luyện tập chuyên sâu theo từng kỹ năng tại đây.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {finalSkillList.map(test => {
                    const cfg = normalizeExamConfig(test);
                    const schedule = evaluateTestSchedule(cfg, serverNowMs);
                    const usedCount = myAttempts.filter(a => a.testId === test.id).length;
                    const isExhausted = cfg.maxAttempts > 0 && usedCount >= cfg.maxAttempts;
                    const isLocked = isExhausted || (!isTeacher && schedule.lockedBySchedule);
                    const hasExamPass = Boolean(cfg.hasExamPassword || cfg.examPassword);
                    const isRealExamCard = cfg.examPurpose === 'real_exam' || cfg.maxAttempts === 1 || hasExamPass;
                    const isPassUnlocked = isTeacher || !hasExamPass || Boolean(examUnlockTokens?.[test.id]);
                    const lockText = isExhausted
                      ? 'Đã hết lượt'
                      : schedule.notYetOpen
                      ? `Mở lúc ${formatViDateTime(schedule.openAt)}`
                      : 'Đã hết hạn nộp';
                    const qCount =
                      skillId === 'listening'
                        ? (test.listening?.questions?.length || 0)
                        : skillId === 'reading'
                        ? (test.reading?.questions?.length || 0)
                        : 2;
                    const subCountLabel =
                      skillId === 'listening'
                        ? `${getListeningTracks(test.listening).length} Part • ${qCount} câu`
                        : skillId === 'reading'
                        ? `${getReadingPassages(test.reading).length} Passage • ${qCount} câu`
                        : 'Task 1 & Task 2';

                    return (
                      <div
                        key={test.id}
                        className={`bg-white dark:bg-[#0F172B] border rounded-lg p-5 flex flex-col justify-between gap-4 transition ${
                          focusedMatch?.id === test.id
                            ? 'border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                            : isRealExamCard
                            ? 'border-rose-300 dark:border-rose-500/40 hover:border-rose-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                                {skillId.toUpperCase()} ONLY • {cfg.durations[skillId]} phút
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
                            <div className="flex flex-wrap items-center gap-1.5">
                              {getAssignedClassNames(cfg.assignedClassIds, classesDb).map(cls => (
                                <span
                                  key={cls.id}
                                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  Lớp {cls.name}
                                </span>
                              ))}
                              {isTeacher && cfg.visibility === 'private' && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Đang ẩn
                                </span>
                              )}
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300">
                                {cfg.maxAttempts === 0 ? `Tự do (${usedCount})` : `${usedCount}/${cfg.maxAttempts} lượt`}
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
                                ? `Nhập Mật Khẩu · Làm Đề ${skillId.toUpperCase()}`
                                : `Bắt đầu làm ${skillId.toUpperCase()}`}
                            </span>
                          </button>
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={() => onOpenSkillBuilder?.(skillId, test)}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                              title="Chỉnh sửa bài tập này"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
        {renderSingleSkillLeaderboard(skillId)}
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
                      Luyện Nói IELTS
                    </span>
                    <span className="block text-xs font-medium text-[#475569] dark:text-slate-400">
                      Speaking AI · 4 Kỹ Năng
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
                <button
                  type="button"
                  onClick={onOpenFullExamCatalog}
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-bold text-[#334155] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Kho Đề Thi IELTS (L·R·W)</span>
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
                    <span>{aiConfigured ? 'Gemini Audio AI Sẵn Sàng' : 'AI Chấm Tự Động Đang Bật'}</span>
                  </p>
                </div>
              </div>

              {isTeacher && (
                <button
                  type="button"
                  onClick={() => onOpenSkillBuilder?.(activeTab === 'listening' || activeTab === 'reading' || activeTab === 'writing' ? activeTab : 'speaking')}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Tạo Bài Tập Kỹ Năng Mới
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 min-w-0 space-y-8">
          {!isTeacher && (
            <div className="rounded-lg bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#065F46] dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0" />
                <span>
                  {studentHasVip
                    ? `Bài Tập 4 Kỹ Năng MIỄN PHÍ 100% • Đang bật Ai eo VIP (${activeAccessExpiryText})`
                    : 'Khu Bài Tập 4 Kỹ Năng & Đề Lẻ đang mở MIỄN PHÍ 100% cho toàn bộ học viên!'}
                </span>
              </span>
              {!studentHasVip && (
                <button
                  type="button"
                  onClick={() => openSkillPassCheckout('aieo_vip')}
                  className="px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>Ai eo VIP ({formatVndCurrency(payCfg.aieoVipPrice)}/1T) - Viền Neon, Màu Chữ &amp; Tạo Phòng</span>
                </button>
              )}
            </div>
          )}
          {['speaking', 'speaking_daily', 'speaking_exam_room', 'forecast'].includes(activeTab) ? (() => {
            const activeSpeakingList =
              activeTab === 'speaking_daily'
                ? dailySpeakingTests
                : activeTab === 'speaking_exam_room'
                ? examRoomSpeakingTests
                : activeTab === 'forecast'
                ? forecastTests
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
              {/* 2 Core Speaking Mode Switcher: Daily vs Exam Room (Team Sắp Thi) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onChangeTab?.('speaking_daily')}
                  className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                    activeTab === 'speaking_daily'
                      ? 'bg-[#C2410C] text-white border-[#C2410C]'
                      : 'bg-white dark:bg-[#0F172B] border-slate-200 dark:border-slate-800 hover:border-[#C2410C]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'speaking_daily' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#C2410C] dark:bg-orange-500/20 dark:text-orange-300'}`}>
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold flex items-center gap-1.5">
                      <span>1. Speaking Daily ({dailySpeakingTests.length})</span>
                    </p>
                    <p className={`text-xs mt-0.5 leading-snug ${activeTab === 'speaking_daily' ? 'text-orange-50' : 'text-[#475569] dark:text-slate-400'}`}>
                      Bài nói bắt buộc mỗi ngày · Ai chưa xong sẽ báo
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTab?.('speaking_exam_room')}
                  className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                    activeTab === 'speaking_exam_room'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-white dark:bg-[#0F172B] border-slate-200 dark:border-slate-800 hover:border-[#007A7A]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'speaking_exam_room' ? 'bg-white/20 text-white' : 'bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6]'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">2. Thực Chiến Phòng Thi ({examRoomSpeakingTests.length})</p>
                    <p className={`text-xs mt-0.5 leading-snug ${activeTab === 'speaking_exam_room' ? 'text-teal-50' : 'text-[#475569] dark:text-slate-400'}`}>
                      Team sắp thi thật · Yêu cầu nhập Password
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTab?.('speaking')}
                  className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                    activeTab === 'speaking' || activeTab === 'forecast'
                      ? 'bg-[#0F172B] text-white dark:bg-white dark:text-slate-950 border-[#0F172B]'
                      : 'bg-white dark:bg-[#0F172B] border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'speaking' || activeTab === 'forecast' ? 'bg-white/15 text-amber-300 dark:bg-slate-900/15 dark:text-amber-600' : 'bg-[#F1F5F9] text-[#334155] dark:bg-slate-800 dark:text-slate-300'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">Tất Cả &amp; Forecast ({speakingTests.length})</p>
                    <p className={`text-xs mt-0.5 leading-snug ${activeTab === 'speaking' || activeTab === 'forecast' ? 'opacity-85' : 'text-[#475569] dark:text-slate-400'}`}>
                      Kho bài luyện Speaking &amp; Đề Forecast
                    </p>
                  </div>
                </button>
              </div>

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
                      {activeTab === 'speaking_daily'
                        ? 'Mục 1: Speaking Daily - Hoàn Thành Mỗi Ngày · Nhắc Người Chưa Làm'
                        : activeTab === 'speaking_exam_room'
                        ? 'Mục 2: Phòng Thi Thực Chiến - Team Sắp Thi (Cần Password)'
                        : activeTab === 'forecast'
                        ? 'Kho Đề Dự Đoán Forecast IELTS Speaking Mới Nhất'
                        : 'Phòng Thi IELTS Speaking AI • Ghi Âm & Chấm 4 Tiêu Chí'}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172B] dark:text-white tracking-tight">
                    {activeTab === 'speaking_daily'
                      ? 'Speaking Daily'
                      : activeTab === 'speaking_exam_room'
                      ? 'Phòng Thi Thực Chiến'
                      : activeTab === 'forecast'
                      ? 'Luyện Forecast'
                      : 'Thi thử'}
                  </h1>
                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed max-w-2xl">
                    {activeTab === 'speaking_daily'
                      ? 'Bài luyện nói cập nhật hàng ngày cho cả lớp. Mọi học viên cần hoàn thành đúng ngày; hệ thống sẽ báo ngay những bạn chưa làm.'
                      : activeTab === 'speaking_exam_room'
                      ? 'Phòng luyện thực chiến mô phỏng áp lực phòng thi thật dành cho team sắp đi thi - yêu cầu mật khẩu giáo viên cấp mới vào thi được.'
                      : activeTab === 'forecast'
                      ? 'Luyện phản xạ từng Part 1, Cue Card Part 2 và Discussion Part 3 theo bộ câu hỏi Forecast giáo viên biên soạn.'
                      : 'Nhận điểm sát thi thật, tự động lưu file ghi âm lên hệ thống để AI phân tích 4 tiêu chí (Fluency, Lexical, Grammar, Pronunciation) và góp ý nâng Band.'}
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
                            {activeTab === 'speaking_daily'
                              ? 'Danh Sách Bài Speaking Daily'
                              : activeTab === 'speaking_exam_room'
                              ? 'Phòng Thi Thực Chiến (Team Sắp Thi)'
                              : activeTab === 'forecast'
                              ? 'Danh Sách Bài Tập Forecast Speaking'
                              : 'Danh Sách Bài Tập Speaking Do Giáo Viên Tạo'}
                          </h2>
                          <p className="text-sm text-[#475569] dark:text-slate-400 max-w-2xl">
                            Mỗi đề đều có nhãn <b>#Hashtag</b> rõ ràng (<b>#ThiThật #CóPass</b> cho đề thi chính thức có mật khẩu, <b>#SpeakingDaily</b> cho bài hàng ngày, <b>#LuyệnTậpTựDo</b> cho bài luyện miễn phí) để học viên không bấm nhầm.
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
                                {totalItems} câu · AI Chấm 4 Tiêu Chí
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
                            <button
                              type="button"
                              onClick={() => onOpenSkillBuilder?.('speaking', test)}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:border-[#007A7A] hover:text-[#0F766E]"
                              title="Chỉnh sửa bài tập Speaking này"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
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
                      const band = att.scores?.speaking?.band ?? att.overallBand;
                      const formattedBand = typeof band === 'number' ? String(Math.round(band)) : '--';
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
                              {att.aiGraded && (
                                <span className="inline-flex items-center gap-1 text-[#0F766E] dark:text-[#1EE1D6] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm AI
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 w-14 h-12 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#007A7A] flex flex-col items-center justify-center transition">
                            <span className="text-lg font-black text-[#0F172B] dark:text-white tabular-nums leading-none">
                              {formattedBand}
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
                : writingTests
            )
          )}
        </main>
      </div>

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
