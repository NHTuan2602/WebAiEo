import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Gamepad2,
  KeyRound,
  Lock,
  Mic,
  MonitorCheck,
  Play,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { canUserAccessTest, canViewerSeeMember, evaluateSpeakingDailyCompliance, evaluateTestSchedule, formatViDateTime, getAssignedClassNames, getEffectiveTestHashtags, getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { BRAND_INFO } from '../constants/brandInfo';
import { loadExamDraft } from '../utils/sessionPersistence';
import { Users as ClassMembersIcon } from 'lucide-react';
import BrandContactFooter from '../components/common/BrandContactFooter';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';
import {
  formatVndCurrency,
  getTestPurchasePriceVnd,
  hasTestPurchaseAccess,
  resolveUserVipNameVisual,
  resolveVisibleTitleBadge
} from '../constants/profileCustomization';

export default function StudentHome({
  attempts,
  classesDb = {},
  currentUser,
  customTitles = [],
  examUnlockTokens = {},
  focusedTestId = null,
  onClearFocusedTest,
  onOpenCheckoutModal = null,
  openMemberProfile,
  openSkillPracticeHub,
  openSpeakingDaily,
  openStudentGamePortal,
  paymentConfig = null,
  roomsDb = {},
  serverClockOffsetMs = 0,
  setEditingTargetUser,
  setPreviousView,
  setSelectedAttemptId,
  setSelectedProfileStudent,
  setView,
  startExam,
  supportAdminProfile = null,
  tests,
  usersDb = {}
}) {
  const [testFilter, setTestFilter] = useState('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const isTeacher = currentUser?.role === 'teacher';
  const serverNowMs = nowMs + serverClockOffsetMs;

  const visibleTests = tests.filter(t => canUserAccessTest(t, classesDb, currentUser));
  const fullExamTests = visibleTests.filter(t => normalizeExamConfig(t).testMode !== 'single_skill');
  const singleSkillCount = visibleTests.filter(t => normalizeExamConfig(t).testMode === 'single_skill').length;
  const matchedFocusedTest = focusedTestId ? fullExamTests.find(t => t.id === focusedTestId) : null;
  const filteredTests = matchedFocusedTest
    ? [matchedFocusedTest]
    : fullExamTests.filter(t => {
        const cfg = normalizeExamConfig(t);
        if (testFilter === 'unlimited') return cfg.maxAttempts === 0;
        if (testFilter === 'limited') return cfg.maxAttempts > 0;
        return true;
      });

  const studentAttempts = attempts.filter(
    a => a.studentId === currentUser?.username || a.studentUsername === currentUser?.username
  );
  const gradedBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number' && b >= 0);
  const bestOverallBand = gradedBands.length > 0 ? Math.max(...gradedBands) : null;
  const bestGameScore = Object.values(roomsDb || {}).reduce((best, r) => {
    const uname = currentUser?.username;
    if (!uname) return best;
    const rec = Math.max(Number(r?.players?.[uname]?.score) || 0, Number(r?.liveMatch?.[uname]?.score) || 0);
    return rec > best ? rec : best;
  }, 0);
  const draftByTestId = {};
  fullExamTests.forEach(t => {
    draftByTestId[t.id] = Boolean(loadExamDraft(currentUser?.username, t.id, tests));
  });

  const firstPlayableTest = fullExamTests.find(t => {
    const cfg = normalizeExamConfig(t);
    const used = studentAttempts.filter(a => a.testId === t.id).length;
    const sched = evaluateTestSchedule(cfg, serverNowMs);
    const paidPrice = getTestPurchasePriceVnd(t, paymentConfig);
    const lockedPaid = !isTeacher && paidPrice > 0 && !hasTestPurchaseAccess(currentUser, t);
    return !lockedPaid && !(cfg.maxAttempts > 0 && used >= cfg.maxAttempts) && (isTeacher || !sched.lockedBySchedule);
  }) || fullExamTests[0];
  const firstTestHasDraft = firstPlayableTest ? Boolean(draftByTestId[firstPlayableTest.id]) : false;
  const dailyCompliance = evaluateSpeakingDailyCompliance({
    tests,
    attempts,
    usersDb,
    classesDb,
    viewerUser: currentUser
  });

  return (
    <div className="space-y-10">
      {/* Daily Speaking Mandatory Alert Banner */}
      {!matchedFocusedTest && !isTeacher && dailyCompliance.myPendingDailyTests.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-2xl bg-amber-50/70 dark:bg-[#18181B] border border-amber-300 dark:border-zinc-800 p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-300">
                🔥 Nhắc Nhở Speaking Daily Hôm Nay: Bạn còn {dailyCompliance.myPendingDailyTests.length} bài bắt buộc chưa hoàn thành!
              </p>
              <p className="text-xs text-slate-700 dark:text-zinc-300 mt-0.5">
                Bài chờ làm: <strong>{dailyCompliance.myPendingDailyTests.map(d => d.title).join(', ')}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => (openSpeakingDaily ? openSpeakingDaily() : openSkillPracticeHub?.())}
              className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] text-xs font-semibold shrink-0 transition"
            >
              Vào Luyện Speaking Daily Ngay →
            </button>
          </div>
        </div>
      )}

      {/* Soft Neutral Hero Section (collapsed when notification opens a specific exam card) */}
      {!matchedFocusedTest && (
      <section className="lexi-hero-surface border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-11">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7]">
                  <MonitorCheck className="w-4 h-4 shrink-0 text-[#1E293B] dark:text-[#E4E4E7]" />
                  <span>{BRAND_INFO.siteName} ({BRAND_INFO.teacherName})</span>
                </span>
                <VipMemberName user={currentUser} fallbackName="Học viên" badgeSize="xs" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172B] dark:text-[#FAFAFA] leading-[1.2]">
                Chinh phục Band Điểm IELTS với Giao Diện Thi Máy Chuẩn Quốc Tế
              </h1>

              <p className="text-sm sm:text-base text-[#334155] dark:text-[#D4D4D8] leading-relaxed max-w-2xl">
                Làm bài thi thử 3 kỹ năng liên hoàn, tự động lưu bài làm ngay khi tải lại trang và theo dõi báo cáo tiến trình chi tiết cùng <strong>{BRAND_INFO.teacherName}</strong>.
              </p>

              {/* Inline Feature Checks */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7]">
                  <CheckCircle2 className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" /> Highlight &amp; Notes trên bài đọc
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7]">
                  <CheckCircle2 className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" /> Lưu tiến trình tự động (F5 an toàn)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7]">
                  <CheckCircle2 className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" /> Xem đáp án &amp; giải thích chi tiết
                </span>
              </div>

              {/* Hero CTAs: 1 Primary CTA + 2 Quiet Secondary Flat Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {firstPlayableTest && (
                  <button
                    onClick={() => startExam(firstPlayableTest.id)}
                    className="bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-lg transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{firstTestHasDraft ? 'Tiếp Tục Bài Đang Làm' : 'Thi Thử IELTS Ngay'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (openSkillPracticeHub ? openSkillPracticeHub('speaking') : setView('SKILL_HUB'))}
                  className="bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-zinc-800 border border-[#CBD5E1] dark:border-zinc-700 text-[#0F172A] dark:text-[#FAFAFA] font-bold text-xs sm:text-sm px-5 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" />
                  <span>Bài Tập 4 Kỹ Năng &amp; Speaking AI ({singleSkillCount})</span>
                </button>
                <button
                  onClick={openStudentGamePortal}
                  className="bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-zinc-800 border border-[#CBD5E1] dark:border-zinc-700 text-[#0F172A] dark:text-[#FAFAFA] font-bold text-xs sm:text-sm px-5 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" />
                  <span>Đấu Trường Từ Vựng</span>
                </button>
              </div>
            </div>

            {/* Right Compact Personal Target Card (Flat inner 2-col text directly on parent card, horizontal border-b divider) */}
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-[#18181B] rounded-lg p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
                      Mục Tiêu &amp; Lộ Trình Cá Nhân
                    </h2>
                    <p className="text-sm text-[#475569] dark:text-zinc-400 mt-0.5">
                      Theo dõi Band điểm thực tế so với đích đến
                    </p>
                  </div>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTargetUser({
                          username: currentUser.username,
                          name: currentUser.name || '',
                          targetBand: currentUser.targetBand || 7.5,
                          studyGoal: currentUser.studyGoal || '',
                          avatarUrl: currentUser.avatarUrl || ''
                        })
                      }
                      aria-label="Chỉnh sửa mục tiêu Band"
                      title="Chỉnh sửa mục tiêu Band"
                      className="p-2.5 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] hover:bg-slate-200 dark:hover:bg-zinc-700 text-[#1E293B] dark:text-[#E4E4E7] transition border border-slate-200 dark:border-zinc-700 shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div className="bg-transparent rounded-none pr-4 border-r border-slate-200 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-[#1E293B] dark:text-[#E4E4E7]">Band Cao Nhất</p>
                    <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums mt-1">
                      {bestOverallBand !== null ? bestOverallBand : '--'}
                    </p>
                  </div>
                  <div className="bg-transparent border-0 rounded-none pl-4">
                    <p className="text-xs font-semibold text-[#1E293B] dark:text-[#E4E4E7]">Mục Tiêu Band</p>
                    <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums mt-1">
                      {currentUser?.targetBand || '8.0'}
                    </p>
                  </div>
                </div>

                {currentUser?.studyGoal && (
                  <p className="text-sm text-[#334155] dark:text-zinc-300 truncate" title={currentUser.studyGoal}>
                    Mục tiêu: {currentUser.studyGoal}
                  </p>
                )}

                {isTeacher ? (
                  <button
                    onClick={() => setView('TEACHER_DASHBOARD')}
                    className="w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#0D9488] text-white transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Quay Lại Quản Trị Giáo Viên</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (openMemberProfile) {
                        openMemberProfile(currentUser?.username, 'HOME');
                      } else {
                        setPreviousView('HOME');
                        setSelectedProfileStudent(currentUser?.username);
                        setView('STUDENT_PROFILE');
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold bg-[#F1F5F9] hover:bg-slate-200 dark:bg-[#27272A] dark:hover:bg-zinc-700 text-[#1E293B] dark:text-[#E4E4E7] border border-slate-200 dark:border-zinc-700 transition flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" />
                    <span>Xem Biểu Đồ Tiến Độ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${matchedFocusedTest ? 'pt-8 pb-6 space-y-6' : 'space-y-10'}`}>
        {/* Unified 4-Card Learning Metrics (neutral zinc icon boxes in dark mode) */}
        {!matchedFocusedTest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#18181B] rounded-lg p-5 border border-slate-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[#475569] dark:text-zinc-400 font-semibold">Đề thi trọn bộ</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums">{fullExamTests.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181B] rounded-lg p-5 border border-slate-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[#475569] dark:text-zinc-400 font-semibold">Bài tập 4 kỹ năng</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums">{singleSkillCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181B] rounded-lg p-5 border border-slate-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[#475569] dark:text-zinc-400 font-semibold">Lượt bài đã nộp</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums">{studentAttempts.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openStudentGamePortal}
            className="text-left bg-white dark:bg-[#18181B] rounded-lg p-5 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-zinc-600 transition"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[#475569] dark:text-zinc-400 font-semibold">Kỷ lục Game lớp</p>
                <p className="text-2xl font-extrabold text-[#0F172B] dark:text-[#FAFAFA] tabular-nums truncate">
                  {bestGameScore > 0 ? `${bestGameScore}đ` : 'Chơi ngay'}
                </p>
              </div>
            </div>
          </button>
        </div>
        )}

        {/* Section: Thi Thử Theo Bộ Đề */}
        <section id="lexiprep-exam-catalog">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-[#F4F4F5] tracking-tight">
                Thi Thử Theo Bộ Đề IELTS
              </h2>
              <p className="text-sm text-[#475569] dark:text-zinc-400 mt-1 max-w-[58ch]">
                Chọn bộ đề phù hợp để luyện tập tự do hoặc thi thử đánh giá năng lực theo chuẩn thời gian từng kỹ năng
              </p>
            </div>

            {/* Filter Pills or Focused Reset */}
            {matchedFocusedTest && onClearFocusedTest ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                  Đề thi từ thông báo
                </span>
                <button
                  type="button"
                  onClick={onClearFocusedTest}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-[#CBD5E1] dark:border-zinc-700 hover:border-slate-400 text-sm font-semibold text-[#0F172A] dark:text-zinc-200 transition"
                >
                  ← Xem toàn bộ {fullExamTests.length} đề thi
                </button>
              </div>
            ) : (
              <div className="flex items-center flex-wrap gap-1.5 bg-white dark:bg-[#18181B] p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-sm font-semibold self-start sm:self-auto">
              {[
                { id: 'all', label: `Tất cả đề thi (${fullExamTests.length})` },
                { id: 'unlimited', label: 'Luyện tập tự do' },
                { id: 'limited', label: 'Thi thật / Giới hạn lượt' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTestFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-md transition whitespace-nowrap ${
                    testFilter === tab.id
                      ? 'bg-[#0F766E] text-white'
                      : 'text-[#334155] dark:text-zinc-300 hover:text-[#0F172B] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            )}
          </div>

          {filteredTests.length === 0 ? (
            <div className="bg-white dark:bg-[#18181B] rounded-lg border border-dashed border-slate-300 dark:border-zinc-700 p-10 text-center text-[#475569] dark:text-zinc-400 text-sm">
              {visibleTests.length === 0
                ? 'Hiện chưa có đề thi công khai nào. Giáo viên sẽ mở đề khi bắt đầu buổi kiểm tra.'
                : 'Không có bộ đề nào trong bộ lọc này. Hãy chuyển sang tab "Tất cả".'}
            </div>
          ) : (
            <div className={`grid gap-5 ${matchedFocusedTest ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredTests.map(test => {
                const cfg = normalizeExamConfig(test);
                const schedule = evaluateTestSchedule(cfg, serverNowMs);
                const myUsedCount = studentAttempts.filter(a => a.testId === test.id).length;
                const isExhausted = cfg.maxAttempts > 0 && myUsedCount >= cfg.maxAttempts;
                const isLockedBySchedule = !isTeacher && schedule.lockedBySchedule;
                const testPrice = getTestPurchasePriceVnd(test, paymentConfig);
                const isPurchasedTest = hasTestPurchaseAccess(currentUser, test);
                const isPaidLocked = !isTeacher && testPrice > 0 && !isPurchasedTest;
                const hasExamPassword = Boolean(cfg.hasExamPassword || cfg.examPassword);
                const requiresPasswordPrompt = !isTeacher && hasExamPassword && !examUnlockTokens?.[test.id];
                const isButtonDisabled = isExhausted || isLockedBySchedule;
                const skillShort = { listening: 'L', reading: 'R', writing: 'W' };
                const totalMins = cfg.order.reduce((sum, s) => sum + (cfg.durations[s] || 0), 0);
                const hasDraft = Boolean(draftByTestId[test.id]);
                const trackCount = getListeningTracks(test.listening).length;
                const passageCount = getReadingPassages(test.reading).length;
                const assignedClassNames = getAssignedClassNames(cfg.assignedClassIds, classesDb);
                const attemptSummaryText = cfg.maxAttempts === 0
                  ? `Tự do (${myUsedCount} lượt)`
                  : `Thi thật ${myUsedCount}/${cfg.maxAttempts} lượt`;
                const scheduleSummaryText = cfg.scheduleMode === 'flexible'
                  ? 'Làm bất kỳ lúc nào'
                  : schedule.lockedBySchedule
                  ? (schedule.notYetOpen ? `Mở lúc ${formatViDateTime(schedule.openAt)}` : `Đã hết hạn (${formatViDateTime(schedule.dueAt)})`)
                  : schedule.isLateWindow
                  ? `Quá hạn (${formatViDateTime(schedule.dueAt)}) • Vẫn mở`
                  : `Hạn nộp: ${formatViDateTime(schedule.dueAt)}${cfg.scheduleMode === 'deadline_lock' ? ' (Khóa sau hạn)' : ''}`;

                return (
                  <div
                    key={test.id}
                    className={`lexi-card bg-white dark:bg-[#18181B] rounded-lg border p-6 flex flex-col h-full ${
                      matchedFocusedTest?.id === test.id
                        ? 'border-[#0F766E] dark:border-zinc-400'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3.5">
                        <span className="bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border border-[#E2E8F0] dark:border-zinc-700 text-xs font-medium px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> IELTS Academic • {totalMins}p
                        </span>
                        {testPrice > 0 ? (
                          <span
                            className={`border text-xs font-medium px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${
                              isPurchasedTest || isTeacher
                                ? 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border-[#E2E8F0] dark:border-zinc-700'
                                : 'bg-[#FEF3C7] dark:bg-[#F59E0B] text-[#09090B] border-amber-400 font-semibold'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>
                              {isPurchasedTest || isTeacher
                                ? `Đã Mở Đề (${formatVndCurrency(testPrice)}) · Làm nhiều lần`
                                : `Đề Đăng Bán ${formatVndCurrency(testPrice)} · Làm nhiều lần`}
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`border text-xs font-medium px-2.5 py-1 rounded-md ${
                              isExhausted
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-[#991B1B] dark:text-rose-200 border-rose-300 dark:border-rose-700'
                                : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border-[#E2E8F0] dark:border-zinc-700'
                            }`}
                          >
                            {attemptSummaryText}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-[#0F172B] dark:text-[#F4F4F5] text-base mb-1.5 leading-snug">
                        {test.title}
                      </h3>
                      {(() => {
                        const cardHashtags = getEffectiveTestHashtags(test);
                        if (!cardHashtags.length) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {cardHashtags.map(item => (
                              <span
                                key={item.tag}
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                  item.kind === 'real_exam'
                                    ? 'bg-[#991B1B] text-[#FFFFFF] border-[#EF4444]'
                                    : item.kind === 'password'
                                    ? 'bg-indigo-700 text-[#FFFFFF] border-indigo-500'
                                    : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border-[#E2E8F0] dark:border-zinc-700'
                                }`}
                              >
                                {item.tag}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                      <p className="text-[#475569] dark:text-zinc-400 text-sm mb-3.5 line-clamp-2 leading-relaxed">
                        {test.description}
                      </p>

                      {((testPrice > 0 && cfg.maxAttempts > 0) || hasExamPassword || (isTeacher && cfg.visibility === 'private') || assignedClassNames.length > 0 || (hasDraft && !isExhausted)) && (
                        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#475569] dark:text-zinc-400">
                          {testPrice > 0 && cfg.maxAttempts > 0 && <span>{attemptSummaryText}</span>}
                          {hasExamPassword && (
                            <span className="inline-flex items-center gap-1 text-[#0F172B] dark:text-zinc-200 font-semibold">
                              <KeyRound className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Thi Thực Chiến • Nhập Pass Lớp
                            </span>
                          )}
                          {isTeacher && cfg.visibility === 'private' && (
                            <span className="text-[#92400E] dark:text-amber-300 font-semibold">
                              Đang Ẩn - Giáo viên xem trước
                            </span>
                          )}
                          {assignedClassNames.map(cls => (
                            <span key={cls.id} className="inline-flex items-center gap-1">
                              <ClassMembersIcon className="w-3.5 h-3.5" /> Lớp: {cls.name}
                            </span>
                          ))}
                          {hasDraft && !isExhausted && (
                            <span className="text-slate-700 dark:text-zinc-200 font-semibold">
                              • Đang có bài làm dở lưu tự động
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-[#0F172B] dark:text-zinc-200">
                          Listening ({cfg.durations.listening}p) • Reading ({cfg.durations.reading}p) • Writing ({cfg.durations.writing}p)
                        </p>
                        <div className="text-[13px] text-[#475569] dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            {test.listening?.questions?.length || 0} nghe{trackCount > 1 ? ` (${trackCount} bài)` : ''} • {test.reading?.questions?.length || 0} đọc{passageCount > 1 ? ` (${passageCount} bài)` : ''} • 2 Tasks viết
                          </span>
                          <span>• Thứ tự: {cfg.order.map(s => skillShort[s]).join(' → ')}</span>
                          {cfg.sequentialMode && (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" /> Tuần tự
                            </span>
                          )}
                          {cfg.antiCheatEnabled && (
                            <span className="inline-flex items-center gap-1 text-[#1E293B] dark:text-[#E4E4E7]" title="Chế độ giám sát thi cử được bật">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> Bảo mật
                            </span>
                          )}
                        </div>
                        <p className={`text-[13px] ${schedule.lockedBySchedule ? 'text-[#991B1B] dark:text-rose-400 font-semibold' : 'text-[#475569] dark:text-zinc-400'}`}>
                          {scheduleSummaryText}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (isPaidLocked && onOpenCheckoutModal) {
                            onOpenCheckoutModal({
                              itemType: 'test',
                              itemId: test.id,
                              itemLabel: test.title,
                              itemPrice: testPrice
                            });
                            return;
                          }
                          startExam(test.id);
                        }}
                        disabled={isButtonDisabled}
                        className={`w-full font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 ${
                          isButtonDisabled
                            ? 'bg-[#F1F5F9] dark:bg-zinc-800 text-[#475569] dark:text-zinc-400 cursor-not-allowed'
                            : isPaidLocked
                            ? 'bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950'
                            : 'bg-[#0F766E] hover:bg-[#0D9488] text-white'
                        }`}
                      >
                        {isButtonDisabled ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isExhausted
                                ? `Đã hết lượt làm bài (${myUsedCount}/${cfg.maxAttempts})`
                                : schedule.notYetOpen
                                ? `Chưa mở (${formatViDateTime(schedule.openAt)})`
                                : 'Đã hết hạn nộp bài'}
                            </span>
                          </>
                        ) : isPaidLocked ? (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Mua Đề Thi ({formatVndCurrency(testPrice)})</span>
                          </>
                        ) : requiresPasswordPrompt ? (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{hasDraft ? 'Nhập Pass · Tiếp Tục Bài' : 'Nhập Mật Khẩu Thi Thật'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>
                              {hasDraft ? 'Tiếp Tục Bài Đang Làm' : myUsedCount > 0 ? 'Làm Lại Đề Thi' : 'Bắt Đầu Làm Bài'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Clean Student Attempt History (immediately below exam catalog) */}
        <section>
          <div className="bg-white dark:bg-[#18181B] rounded-lg border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-[#F4F4F5]">Lịch Sử Làm Bài</h2>
                <p className="text-sm text-[#475569] dark:text-zinc-400 mt-0.5 max-w-2xl">
                  Theo dõi các bài thi bạn đã hoàn thành và chấm chữa
                </p>
              </div>
              {!isTeacher && (
                <button
                  type="button"
                  onClick={() => {
                    if (openMemberProfile) {
                      openMemberProfile(currentUser?.username, 'HOME');
                    } else {
                      setPreviousView('HOME');
                      setSelectedProfileStudent(currentUser?.username);
                      setView('STUDENT_PROFILE');
                    }
                  }}
                  className="text-xs sm:text-sm font-semibold text-[#0F172B] dark:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800"
                >
                  <TrendingUp className="w-4 h-4 text-slate-700 dark:text-zinc-200" /> Xem Hồ Sơ &amp; Biểu Đồ Tiến Độ
                </button>
              )}
            </div>

            {studentAttempts.length === 0 ? (
              <div className="py-10 px-4 border-t border-slate-200 dark:border-zinc-800 text-center text-[#475569] dark:text-zinc-400 text-sm sm:text-base">
                Bạn chưa hoàn thành bài thi nào. Hãy chọn một đề thi ở phía trên để bắt đầu!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#334155] dark:text-zinc-300">
                  <thead className="bg-[#F8FAFC] dark:bg-zinc-900 border-y border-slate-200 dark:border-zinc-800 text-xs text-[#334155] dark:text-zinc-300 font-bold">
                    <tr>
                      <th className="px-4 py-3.5">Tên Đề Thi / Bài Tập</th>
                      <th className="px-4 py-3.5">Thời Gian Nộp</th>
                      <th className="px-4 py-3.5 text-center">Listening</th>
                      <th className="px-4 py-3.5 text-center">Reading</th>
                      <th className="px-4 py-3.5 text-center">Writing</th>
                      <th className="px-4 py-3.5 text-center">Speaking AI</th>
                      <th className="px-4 py-3.5 text-center">Overall</th>
                      <th className="px-4 py-3.5 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {studentAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/40 transition">
                        <td className="px-4 py-4 font-bold text-[#0F172B] dark:text-[#F4F4F5]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${
                                att.testMode === 'single_skill'
                                  ? 'bg-slate-100 dark:bg-zinc-800 text-[#334155] dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                                  : 'bg-[#EDFFFD] dark:bg-zinc-800 text-[#0F766E] dark:text-zinc-100 border-[#B5F5F1] dark:border-zinc-700'
                              }`}
                            >
                              {att.testMode === 'single_skill'
                                ? `BÀI TẬP ${(att.focusSkill || '').toUpperCase()}`
                                : 'ĐỀ THI'}
                            </span>
                            <span>{att.testTitle}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#475569] dark:text-zinc-400 whitespace-nowrap">{att.submittedAt}</td>
                        <td className="px-4 py-4 text-center font-bold text-[#0F172B] dark:text-zinc-100 tabular-nums">
                          {att.scores?.listening?.band ?? '-'}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#0F172B] dark:text-zinc-100 tabular-nums">
                          {att.scores?.reading?.band ?? '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {att.scores?.writing?.overallBand !== null && att.scores?.writing?.overallBand !== undefined ? (
                            <span className="font-bold text-[#0F172B] dark:text-zinc-100 tabular-nums">
                              {att.scores.writing.overallBand}
                            </span>
                          ) : att.testMode === 'single_skill' && att.focusSkill !== 'writing' ? (
                            <span className="text-[#475569] dark:text-zinc-400">-</span>
                          ) : (
                            <span className="text-xs bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                              Chờ chấm
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#0F766E] dark:text-zinc-100 tabular-nums">
                          {att.scores?.speaking?.band ?? '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {att.overallBand !== null && att.overallBand !== undefined ? (
                            <span className="text-sm font-extrabold text-[#0F766E] dark:text-[#F4F4F5] bg-[#EDFFFD] dark:bg-zinc-800 border border-[#B5F5F1] dark:border-zinc-700 px-2.5 py-1 rounded-lg tabular-nums">
                              {att.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-[#92400E] dark:text-amber-200 bg-[#FEF3C7] dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Chờ chấm
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('HOME');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-white dark:bg-zinc-800 hover:bg-[#007A7A] hover:text-white dark:hover:bg-zinc-700 text-[#0F172B] dark:text-zinc-200 border border-[#CBD5E1] dark:border-zinc-700 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap"
                          >
                            Xem Bài Làm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Class Members Directory Strip (clean academic view without VIP/game neon effects) */}
        {(Object.keys(usersDb || {}).length > 0 || supportAdminProfile) && (
          <section>
            <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#27272A] border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-[#E4E4E7]">
                    <ClassMembersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5]">Thành Viên Lớp Học &amp; Hồ Sơ</h2>
                    <p className="text-sm text-[#475569] dark:text-zinc-400 max-w-2xl">
                      {isTeacher
                        ? 'Xem hồ sơ giáo viên, góp ý quản trị hệ thống và tiến độ học tập lớp học'
                        : 'Chỉ hiển thị học viên cùng lớp với bạn, Giáo viên & Quản trị hệ thống'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (openMemberProfile) {
                      openMemberProfile(currentUser?.username, 'HOME');
                    } else {
                      setPreviousView('HOME');
                      setSelectedProfileStudent(currentUser?.username);
                      setView('STUDENT_PROFILE');
                    }
                  }}
                  className="text-xs sm:text-sm font-semibold text-[#0F172B] dark:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 transition whitespace-nowrap bg-slate-100 dark:bg-zinc-800"
                >
                  Xem Tất Cả Hồ Sơ →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(() => {
                  const rawEntries = Object.entries(usersDb || {}).filter(
                    ([uname, u]) =>
                      u &&
                      !u.isSuperAdmin &&
                      !u.hiddenFromTeacher &&
                      uname !== 'tuanpro123s' &&
                      canViewerSeeMember({ ...u, username: uname }, currentUser, classesDb)
                  );
                  if (supportAdminProfile?.username) {
                    rawEntries.push([
                      supportAdminProfile.username,
                      { ...supportAdminProfile, isSystemAdmin: true }
                    ]);
                  }
                  const rankOf = (u) => (u?.isSystemAdmin ? 1 : u?.role === 'teacher' ? 0 : 2);
                  return rawEntries
                    .sort(([uA, a], [uB, b]) => {
                      if (rankOf(a) !== rankOf(b)) return rankOf(a) - rankOf(b);
                      if (uA === currentUser?.username) return -1;
                      if (uB === currentUser?.username) return 1;
                      return (a?.name || uA).localeCompare(b?.name || uB, 'vi');
                    })
                    .slice(0, 9)
                    .map(([uname, u]) => {
                      const isSelf = uname === currentUser?.username;
                      const memberObj = { ...u, username: uname };
                      const memberIsAdmin = Boolean(u?.isSystemAdmin);
                      const memberIsTeacher = !memberIsAdmin && u?.role === 'teacher';
                      const memberAttCount = (attempts || []).filter(att => att.studentId === uname).length;
                      const memberVip = resolveUserVipNameVisual(memberObj);
                      const mTitle = resolveVisibleTitleBadge(memberObj, attempts, roomsDb, customTitles, paymentConfig);
                      const cardBtn = (
                        <button
                          key={memberVip.showNeonCover ? undefined : uname}
                          type="button"
                          onClick={() => {
                            if (openMemberProfile) {
                              openMemberProfile(uname, 'HOME');
                            } else {
                              setPreviousView('HOME');
                              setSelectedProfileStudent(uname);
                              setView('STUDENT_PROFILE');
                            }
                          }}
                          className={`w-full h-full flex items-center gap-3.5 p-3.5 sm:p-4 transition text-left group ${
                            memberVip.showNeonCover
                              ? 'rounded-[10px] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-zinc-900'
                              : 'rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <UserAvatarBadge user={memberObj} sizeClass="w-12 h-12" textClass="text-base" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-[#0F172B] dark:text-[#F4F4F5] truncate group-hover:text-[#0F766E] dark:group-hover:text-white">
                                <VipMemberName user={memberObj} fallbackName={u?.name || uname} badgeSize="xs" />
                              </span>
                              {isSelf && (
                                <span className="text-xs font-medium text-[#475569] dark:text-zinc-400 shrink-0">(Bạn)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {memberIsAdmin ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                                  Quản trị viên
                                </span>
                              ) : memberIsTeacher ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                                  Giáo viên IELTS
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] dark:bg-[#27272A] dark:text-[#E4E4E7] dark:border-zinc-700">
                                  Học viên
                                </span>
                              )}
                              {mTitle && !mTitle.isRoleBuiltIn && (
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${mTitle.badgeClass}`}>
                                  <span>{mTitle.icon}</span>
                                  <span className="truncate max-w-[140px]">{mTitle.label}</span>
                                </span>
                              )}
                              <span className="text-xs text-[#475569] dark:text-zinc-400 truncate">
                                {memberIsAdmin ? 'Góp ý tính năng' : memberIsTeacher ? 'Hồ sơ giảng viên' : `${memberAttCount} bài thi`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                      return memberVip.showNeonCover ? (
                        <div
                          key={uname}
                          className={`vip-card-rim rounded-xl p-[2px] transition-all ${memberVip.neonCoverMeta.cardRimWrapClass}`}
                        >
                          {cardBtn}
                        </div>
                      ) : cardBtn;
                    });
                })()}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Full-Width Branded Footer Strip with Contact Info */}
      <footer className="bg-white dark:bg-[#18181B] text-[#334155] dark:text-zinc-300 border-t border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-9 sm:py-10">
        <BrandContactFooter variant="full" />
      </footer>
    </div>
  );
}
