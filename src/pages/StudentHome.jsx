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
import { canUserAccessTest, canViewerSeeMember, evaluateSpeakingDailyCompliance, evaluateTestSchedule, formatViDateTime, getAssignedClassNames, getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { BRAND_INFO } from '../constants/brandInfo';
import { loadExamDraft } from '../utils/sessionPersistence';
import { Users as ClassMembersIcon } from 'lucide-react';
import BrandContactFooter from '../components/common/BrandContactFooter';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';
import {
  formatVndCurrency,
  getTestPurchasePriceVnd,
  hasTestPurchaseAccess
} from '../constants/profileCustomization';

export default function StudentHome({
  attempts,
  classesDb = {},
  currentUser,
  customTitles: _customTitles = [],
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
          <div className="rounded-2xl bg-gradient-to-r from-rose-500/15 via-orange-500/15 to-amber-500/10 border-2 border-orange-400/70 dark:border-orange-500/50 p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-200">
                🔥 Nhắc Nhở Speaking Daily Hôm Nay: Bạn còn {dailyCompliance.myPendingDailyTests.length} bài bắt buộc chưa hoàn thành!
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                Bài chờ làm: <strong>{dailyCompliance.myPendingDailyTests.map(d => d.title).join(', ')}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => (openSpeakingDaily ? openSpeakingDaily() : openSkillPracticeHub?.())}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shrink-0 shadow-xs transition"
            >
              Vào Luyện Speaking Daily Ngay →
            </button>
          </div>
        </div>
      )}

      {/* Soft Pastel Hero Section (collapsed when notification opens a specific exam card) */}
      {!matchedFocusedTest && (
      <section className="lexi-hero-surface border-b border-pink-200/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-11">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                <MonitorCheck className="w-4 h-4 shrink-0" />
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <span>{BRAND_INFO.siteName} ({BRAND_INFO.teacherName}) •</span>
                  <VipMemberName user={currentUser} fallbackName="Học viên" badgeSize="xs" />
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172B] dark:text-white leading-[1.2]">
                Chinh phục Band Điểm IELTS với Giao Diện Thi Máy Chuẩn Quốc Tế
              </h1>

              <p className="text-sm sm:text-base text-[#314158] dark:text-slate-300 leading-relaxed max-w-2xl">
                Làm bài thi thử 3 kỹ năng liên hoàn, tự động lưu bài làm ngay khi tải lại trang và theo dõi báo cáo tiến trình chi tiết cùng <strong>{BRAND_INFO.teacherName}</strong>.
              </p>

              {/* Inline LexiPrep Feature Checks */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#314158] dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Highlight &amp; Notes trên bài đọc
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Lưu tiến trình tự động (F5 an toàn)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Xem đáp án &amp; giải thích chi tiết
                </span>
              </div>

              {/* Hero CTAs: 1 Primary CTA + 2 Quiet Secondary Flat Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {firstPlayableTest && (
                  <button
                    onClick={() => startExam(firstPlayableTest.id)}
                    className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-lg shadow-sm transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{firstTestHasDraft ? 'Tiếp Tục Bài Đang Làm' : 'Thi Thử IELTS Ngay'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (openSkillPracticeHub ? openSkillPracticeHub('speaking') : setView('SKILL_HUB'))}
                  className="bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-[#334155] text-[#0F172B] dark:text-slate-100 font-bold text-xs sm:text-sm px-5 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                  <span>Bài Tập 4 Kỹ Năng &amp; Speaking AI ({singleSkillCount})</span>
                </button>
                <button
                  onClick={openStudentGamePortal}
                  className="bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-[#334155] text-[#0F172B] dark:text-slate-100 font-bold text-xs sm:text-sm px-5 py-3 rounded-lg transition flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Đấu Trường Từ Vựng</span>
                </button>
              </div>
            </div>

            {/* Right Compact Personal Target Card */}
            <div className="lg:col-span-4">
              <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 sm:p-6 border border-rose-200/85 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white">
                      Mục Tiêu &amp; Lộ Trình Cá Nhân
                    </h2>
                    <p className="text-xs text-[#62748E] dark:text-slate-400 mt-0.5">
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
                      className="p-2.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 dark:hover:bg-teal-500/25 text-[#007A7A] dark:text-[#1EE1D6] transition border border-[#B5F5F1] dark:border-teal-500/30 shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-rose-50/75 dark:bg-slate-800/80 border border-rose-200/75 dark:border-slate-700">
                    <p className="text-[11px] font-semibold text-[#62748E] dark:text-slate-400">Band Cao Nhất</p>
                    <p className="text-2xl font-extrabold text-[#059271] dark:text-emerald-400 tabular-nums mt-1">
                      {bestOverallBand !== null ? bestOverallBand : '--'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/10 border border-[#B5F5F1] dark:border-teal-500/30">
                    <p className="text-[11px] font-semibold text-[#007A7A] dark:text-[#1EE1D6]">Mục Tiêu Band</p>
                    <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums mt-1">
                      {currentUser?.targetBand || '8.0'}
                    </p>
                  </div>
                </div>

                {currentUser?.studyGoal && (
                  <p className="text-xs text-[#314158] dark:text-slate-300 bg-rose-50/70 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-rose-200/70 dark:border-slate-700/70 truncate" title={currentUser.studyGoal}>
                    Mục tiêu: {currentUser.studyGoal}
                  </p>
                )}

                {isTeacher ? (
                  <button
                    onClick={() => setView('TEACHER_DASHBOARD')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#F25220] hover:bg-[#d94417] text-white transition flex items-center justify-center gap-2"
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
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0F172B] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4 text-[#1EE1D6]" />
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
        {/* Unified 4-Card Learning Metrics (single accent tone) */}
        {!matchedFocusedTest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shrink-0 border border-[#B5F5F1] dark:border-teal-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Đề thi trọn bộ</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{fullExamTests.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shrink-0 border border-[#B5F5F1] dark:border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Bài tập 4 kỹ năng</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{singleSkillCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shrink-0 border border-[#B5F5F1] dark:border-teal-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Lượt bài đã nộp</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{studentAttempts.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openStudentGamePortal}
            className="text-left bg-white dark:bg-[#0F172B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-[#007A7A]/60 dark:hover:border-teal-500/50 transition"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shrink-0 border border-[#B5F5F1] dark:border-teal-500/30">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Kỷ lục Game lớp</p>
                <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums truncate">
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
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white tracking-tight">
                Thi Thử Theo Bộ Đề IELTS
              </h2>
              <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400 mt-1">
                Chọn bộ đề phù hợp để luyện tập tự do hoặc thi thử đánh giá năng lực theo chuẩn thời gian từng kỹ năng
              </p>
            </div>

            {/* Filter Pills or Focused Reset */}
            {matchedFocusedTest && onClearFocusedTest ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-950/50 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/35">
                  📌 Đề thi từ thông báo
                </span>
                <button
                  type="button"
                  onClick={onClearFocusedTest}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A] text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                >
                  ← Xem toàn bộ {fullExamTests.length} đề thi
                </button>
              </div>
            ) : (
              <div className="flex items-center flex-wrap gap-1.5 bg-[#FFF5F8] dark:bg-[#0F172B] p-1.5 rounded-xl border border-pink-200/90 dark:border-slate-800 text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: `Tất cả đề thi (${fullExamTests.length})` },
                { id: 'unlimited', label: 'Luyện tập tự do' },
                { id: 'limited', label: 'Thi thật / Giới hạn lượt' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTestFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
                    testFilter === tab.id
                      ? 'bg-[#007A7A] text-white'
                      : 'text-[#62748E] dark:text-slate-400 hover:text-[#0F172B] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            )}
          </div>

          {filteredTests.length === 0 ? (
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-dashed border-rose-300 dark:border-slate-700 p-10 text-center text-[#62748E] dark:text-slate-400 text-sm">
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
                    className={`lexi-card bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border p-6 flex flex-col justify-between ${
                      matchedFocusedTest?.id === test.id
                        ? 'border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                        : 'border-pink-200/90 dark:border-slate-800 hover:border-[#007A7A]/60 dark:hover:border-teal-500/50'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3.5">
                        <span className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#007A7A] dark:text-[#1EE1D6]" /> IELTS Academic • {totalMins}p
                        </span>
                        {testPrice > 0 ? (
                          <span
                            className={`bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 ${
                              isPurchasedTest || isTeacher
                                ? 'text-[#007A7A] dark:text-[#1EE1D6]'
                                : 'text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>
                              {isPurchasedTest || isTeacher
                                ? `Đã Mở Đề (${formatVndCurrency(testPrice)}) · Làm nhiều lần`
                                : `Đề Đăng Bán ${formatVndCurrency(testPrice)} · Làm nhiều lần`}
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                              isExhausted
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {attemptSummaryText}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-[#0F172B] dark:text-white text-base mb-1.5 leading-snug">
                        {test.title}
                      </h3>
                      <p className="text-[#62748E] dark:text-slate-400 text-xs mb-3.5 line-clamp-2 leading-relaxed">
                        {test.description}
                      </p>

                      {(testPrice > 0 || hasExamPassword || (isTeacher && cfg.visibility === 'private') || assignedClassNames.length > 0 || (hasDraft && !isExhausted)) && (
                        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#62748E] dark:text-slate-400">
                          {testPrice > 0 && <span>{attemptSummaryText}</span>}
                          {hasExamPassword && (
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                              <KeyRound className="w-3 h-3 text-[#007A7A] dark:text-[#1EE1D6]" /> Thi Thực Chiến • Nhập Pass Lớp
                            </span>
                          )}
                          {isTeacher && cfg.visibility === 'private' && (
                            <span className="text-amber-700 dark:text-amber-300 font-semibold">
                              Đang Ẩn — Giáo viên xem trước
                            </span>
                          )}
                          {assignedClassNames.map(cls => (
                            <span key={cls.id} className="inline-flex items-center gap-1">
                              <ClassMembersIcon className="w-3 h-3" /> Lớp: {cls.name}
                            </span>
                          ))}
                          {hasDraft && !isExhausted && (
                            <span className="text-[#007A7A] dark:text-[#1EE1D6] font-semibold">
                              • Đang có bài làm dở lưu tự động
                            </span>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 mb-4 space-y-1.5">
                        <p className="text-xs font-semibold text-[#0F172B] dark:text-slate-200">
                          Listening ({cfg.durations.listening}p) • Reading ({cfg.durations.reading}p) • Writing ({cfg.durations.writing}p)
                        </p>
                        <div className="text-[11px] text-[#62748E] dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            {test.listening?.questions?.length || 0} nghe{trackCount > 1 ? ` (${trackCount} bài)` : ''} • {test.reading?.questions?.length || 0} đọc{passageCount > 1 ? ` (${passageCount} bài)` : ''} • 2 Tasks viết
                          </span>
                          <span>• Thứ tự: {cfg.order.map(s => skillShort[s]).join(' → ')}</span>
                          {cfg.sequentialMode && (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Tuần tự
                            </span>
                          )}
                          {cfg.antiCheatEnabled && (
                            <span className="inline-flex items-center gap-1" title="Chế độ giám sát thi cử được bật">
                              <ShieldCheck className="w-3 h-3 text-[#007A7A] dark:text-[#1EE1D6]" /> Bảo mật
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${schedule.lockedBySchedule ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[#62748E] dark:text-slate-400'}`}>
                          {scheduleSummaryText}
                        </p>
                      </div>
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
                      className={`w-full font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 ${
                        isButtonDisabled
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : isPaidLocked
                          ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                          : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
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
                );
              })}
            </div>
          )}
        </section>

        {/* Clean Student Attempt History (immediately below exam catalog) */}
        <section>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">Lịch Sử Làm Bài</h2>
              <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400 mt-0.5">Theo dõi các bài thi bạn đã hoàn thành và chấm chữa</p>
            </div>
            {!isTeacher && (
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
                className="text-xs font-semibold text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 flex items-center gap-1.5 transition px-4 py-2 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#1E293B]"
              >
                <TrendingUp className="w-4 h-4" /> Xem Hồ Sơ &amp; Biểu Đồ Tiến Độ
              </button>
            )}
          </div>

          {studentAttempts.length === 0 ? (
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-pink-200/90 dark:border-slate-800 py-12 px-6 text-center text-[#62748E] dark:text-slate-400 text-sm sm:text-base">
              Bạn chưa hoàn thành bài thi nào. Hãy chọn một đề thi ở phía trên để bắt đầu!
            </div>
          ) : (
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-pink-200/90 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#314158] dark:text-slate-300">
                  <thead className="bg-rose-50/85 dark:bg-slate-800/70 border-b border-pink-200/90 dark:border-slate-800 text-xs text-[#62748E] dark:text-slate-400 font-bold">
                    <tr>
                      <th className="px-6 py-3.5">Tên Đề Thi / Bài Tập</th>
                      <th className="px-6 py-3.5">Thời Gian Nộp</th>
                      <th className="px-6 py-3.5 text-center">Listening</th>
                      <th className="px-6 py-3.5 text-center">Reading</th>
                      <th className="px-6 py-3.5 text-center">Writing</th>
                      <th className="px-6 py-3.5 text-center">Speaking AI</th>
                      <th className="px-6 py-3.5 text-center">Overall</th>
                      <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-[#EDFFFD]/45 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-bold text-[#0F172B] dark:text-white">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                att.testMode === 'single_skill'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  : 'bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border-[#B5F5F1] dark:border-teal-500/30'
                              }`}
                            >
                              {att.testMode === 'single_skill'
                                ? `BÀI TẬP ${(att.focusSkill || '').toUpperCase()}`
                                : 'ĐỀ THI'}
                            </span>
                            <span>{att.testTitle}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#62748E] dark:text-slate-400">{att.submittedAt}</td>
                        <td className="px-6 py-4 text-center font-bold text-[#0F172B] dark:text-slate-100 tabular-nums">
                          {att.scores?.listening?.band ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#0F172B] dark:text-slate-100 tabular-nums">
                          {att.scores?.reading?.band ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.scores?.writing?.overallBand !== null && att.scores?.writing?.overallBand !== undefined ? (
                            <span className="font-bold text-[#0F172B] dark:text-slate-100 tabular-nums">
                              {att.scores.writing.overallBand}
                            </span>
                          ) : att.testMode === 'single_skill' && att.focusSkill !== 'writing' ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-[#E17100] dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                              Chờ chấm
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#007A7A] dark:text-[#1EE1D6] tabular-nums">
                          {att.scores?.speaking?.band ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {att.overallBand !== null && att.overallBand !== undefined ? (
                            <span className="text-sm font-extrabold text-[#007A7A] dark:text-[#1EE1D6] bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 px-2.5 py-1 rounded-lg tabular-nums">
                              {att.overallBand}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Chờ chấm</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('HOME');
                              setView('RESULT_VIEW');
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-[#007A7A] hover:text-white dark:hover:bg-[#007A7A] text-[#0F172B] dark:text-slate-200 text-xs px-3.5 py-1.5 rounded-lg font-bold transition"
                          >
                            Xem Bài Làm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Class Members Directory Strip (clean academic view without VIP/game neon effects) */}
        {(Object.keys(usersDb || {}).length > 0 || supportAdminProfile) && (
          <section>
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] border border-pink-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 flex items-center justify-center text-[#007A7A] dark:text-[#1EE1D6]">
                    <ClassMembersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white">Thành Viên Lớp Học &amp; Hồ Sơ</h3>
                    <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400">
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
                  className="text-xs sm:text-sm font-semibold text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 px-4 py-2 rounded-lg border border-slate-300 dark:border-[#334155] transition whitespace-nowrap bg-white dark:bg-[#1E293B]"
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
                      return (
                        <button
                          key={uname}
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
                          className="w-full h-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-[#007A7A]/70 dark:hover:border-teal-500/60 transition text-left group"
                        >
                          <UserAvatarBadge user={memberObj} sizeClass="w-12 h-12" textClass="text-base" rounded="rounded-xl" showVipEffects={false} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-[#0F172B] dark:text-white truncate group-hover:text-[#007A7A] dark:group-hover:text-[#1EE1D6]">
                                {u?.name || uname}
                              </span>
                              {isSelf && (
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">(Bạn)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {memberIsAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                  Quản trị viên
                                </span>
                              ) : memberIsTeacher ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                  Giáo viên IELTS
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#EDFFFD] text-[#007A7A] border border-[#B5F5F1] dark:bg-teal-950/40 dark:text-[#1EE1D6] dark:border-teal-500/30">
                                  Học viên
                                </span>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {memberIsAdmin ? 'Góp ý tính năng' : memberIsTeacher ? 'Hồ sơ giảng viên' : `${memberAttCount} bài thi`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    });
                })()}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Full-Width Branded Footer Strip with Contact Info */}
      <footer className="bg-[#0F172B] text-slate-300 border-t border-slate-800 px-4 sm:px-6 py-9 sm:py-10">
        <BrandContactFooter variant="full" />
      </footer>
    </div>
  );
}
