import { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  EyeOff,
  FileText,
  Gamepad2,
  Headphones,
  Lock,
  Mic,
  MonitorCheck,
  PenTool,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { BRAND_INFO } from '../constants/brandInfo';
import { loadExamDraft } from '../utils/sessionPersistence';
import BrandContactFooter from '../components/common/BrandContactFooter';
import { Users as ClassMembersIcon } from 'lucide-react';
import UserAvatarBadge from '../components/common/UserAvatarBadge';

export default function StudentHome({
  attempts,
  currentUser,
  openMemberProfile,
  openSkillPracticeHub,
  openStudentGamePortal,
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
  const isTeacher = currentUser?.role === 'teacher';

  const visibleTests = tests.filter(t => isTeacher || normalizeExamConfig(t).visibility !== 'private');
  const fullExamTests = visibleTests.filter(t => normalizeExamConfig(t).testMode !== 'single_skill');
  const singleSkillCount = visibleTests.filter(t => normalizeExamConfig(t).testMode === 'single_skill').length;
  const filteredTests = fullExamTests.filter(t => {
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

  const firstPlayableTest = fullExamTests.find(t => {
    const cfg = normalizeExamConfig(t);
    const used = studentAttempts.filter(a => a.testId === t.id).length;
    return !(cfg.maxAttempts > 0 && used >= cfg.maxAttempts);
  }) || fullExamTests[0];
  const firstTestHasDraft = firstPlayableTest
    ? Boolean(loadExamDraft(currentUser?.username, firstPlayableTest.id, tests))
    : false;

  const skillGuides = [
    {
      title: 'IELTS Listening',
      badge: 'Audio chuẩn phòng thi',
      desc: 'Hỗ trợ nhiều chủ đề/Section ghi âm riêng, giới hạn lượt nghe và đồng bộ đáp án tức thì.',
      icon: Headphones,
      accentBg: 'bg-[#EDFFFD] dark:bg-teal-500/15',
      accentText: 'text-[#007A7A] dark:text-[#1EE1D6]',
      accentBorder: 'border-[#B5F5F1] dark:border-teal-500/30',
      action: () => {
        const el = document.getElementById('lexiprep-exam-catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: 'IELTS Reading',
      badge: 'Chia đôi màn hình',
      desc: 'Đoạn văn bên trái, câu hỏi bên phải giống thi máy tính thật kèm Highlight & Note ghi chú.',
      icon: BookOpen,
      accentBg: 'bg-[#EFF6FF] dark:bg-blue-500/15',
      accentText: 'text-[#1447E6] dark:text-blue-300',
      accentBorder: 'border-[#DBEAFE] dark:border-blue-500/30',
      action: () => {
        const el = document.getElementById('lexiprep-exam-catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: 'IELTS Writing',
      badge: 'Chấm 4 tiêu chí IELTS',
      desc: 'Đếm số từ trực tiếp (Task 1 & Task 2), đánh giá TA/TR, CC, LR, GRA bởi giáo viên & AI.',
      icon: PenTool,
      accentBg: 'bg-[#ECFDF5] dark:bg-emerald-500/15',
      accentText: 'text-[#059271] dark:text-emerald-300',
      accentBorder: 'border-[#9FF5E1] dark:border-emerald-500/30',
      action: () => {
        const el = document.getElementById('lexiprep-exam-catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: 'Đấu Trường Từ Vựng',
      badge: 'Interactive Arena',
      desc: 'Tham gia sảnh thi đấu từ vựng theo mã PIN lớp học trực tiếp và tích lũy xếp hạng.',
      icon: Gamepad2,
      accentBg: 'bg-orange-50 dark:bg-orange-500/15',
      accentText: 'text-[#F25220] dark:text-orange-300',
      accentBorder: 'border-orange-200/80 dark:border-orange-500/30',
      action: openStudentGamePortal
    }
  ];

  return (
    <div className="space-y-10">
      {/* Soft Pastel Hero Section */}
      <section className="lexi-hero-surface border-b border-pink-200/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-11">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                <MonitorCheck className="w-4 h-4" />
                <span>{BRAND_INFO.siteName} ({BRAND_INFO.teacherName}) • {currentUser?.name || 'Học viên'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172B] dark:text-white leading-[1.2]">
                Chinh phục{' '}
                <span className="lexi-underlined text-[#007A7A] dark:text-[#1EE1D6]">
                  Band Điểm IELTS
                </span>{' '}
                với Giao Diện Thi Máy Chuẩn Quốc Tế
              </h1>

              <p className="text-sm sm:text-base text-[#314158] dark:text-slate-300 leading-relaxed max-w-2xl">
                Làm bài thi thử 3 kỹ năng liên hoàn, tự động lưu bài làm ngay khi tải lại trang và theo dõi báo cáo tiến trình chi tiết cùng <strong>{BRAND_INFO.teacherName}</strong>.
              </p>

              {/* Inline LexiPrep Feature Checks */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#314158] dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059271]" /> Highlight &amp; Notes trên bài đọc
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059271]" /> Lưu tiến trình tự động (F5 an toàn)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059271]" /> Xem đáp án &amp; giải thích chi tiết
                </span>
              </div>

              {/* Dual Contrasting LexiPrep CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {firstPlayableTest && (
                  <button
                    onClick={() => startExam(firstPlayableTest.id)}
                    className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-teal-900/15 transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{firstTestHasDraft ? 'Tiếp Tục Bài Đang Làm' : 'Thi Thử IELTS Ngay'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (openSkillPracticeHub ? openSkillPracticeHub('speaking') : setView('SKILL_HUB'))}
                  className="bg-[#570DF8] hover:bg-[#490AD2] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-indigo-900/15 transition flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bài Tập 4 Kỹ Năng &amp; Speaking AI ({singleSkillCount})</span>
                </button>
                <button
                  onClick={openStudentGamePortal}
                  className="bg-[#F25220] hover:bg-[#d94417] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-900/15 transition flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Đấu Trường Từ Vựng</span>
                </button>
              </div>
            </div>

            {/* Right Compact Personal Target Card */}
            <div className="lg:col-span-4">
              <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 sm:p-6 border border-rose-200/85 dark:border-slate-800 shadow-[0_14px_34px_-12px_rgba(190,24,93,0.10)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#007A7A] dark:text-[#1EE1D6]">
                      Mục Tiêu Học Tập
                    </p>
                    <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white mt-0.5">
                      Lộ trình cá nhân
                    </h2>
                  </div>
                  {currentUser && (
                    <button
                      onClick={() =>
                        setEditingTargetUser({
                          username: currentUser.username,
                          name: currentUser.name || '',
                          targetBand: currentUser.targetBand || 7.5,
                          studyGoal: currentUser.studyGoal || '',
                          avatarUrl: currentUser.avatarUrl || ''
                        })
                      }
                      title="Chỉnh sửa mục tiêu Band"
                      className="p-2 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 hover:bg-[#B5F5F1]/60 dark:hover:bg-teal-500/25 text-[#007A7A] dark:text-[#1EE1D6] transition border border-[#B5F5F1] dark:border-teal-500/30"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Clean 4-Card Learning Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 border border-pink-200/90 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center shrink-0 border border-[#B5F5F1] dark:border-teal-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Đề thi khả dụng</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{visibleTests.length}</p>
            </div>
          </div>

          <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 border border-pink-200/90 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1447E6] dark:text-blue-400 flex items-center justify-center shrink-0 border border-[#DBEAFE] dark:border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Bài thi đã nộp</p>
              <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{studentAttempts.length}</p>
            </div>
          </div>

          <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 border border-pink-200/90 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] dark:bg-emerald-500/15 text-[#059271] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#9FF5E1] dark:border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Band cao nhất</p>
              <p className="text-2xl font-extrabold text-[#059271] dark:text-emerald-400 tabular-nums">
                {bestOverallBand !== null ? bestOverallBand : '--'}
              </p>
            </div>
          </div>

          <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 border border-pink-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-[#E17100] dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#62748E] dark:text-slate-400 font-semibold">Mục tiêu Band</p>
                <p className="text-2xl font-extrabold text-[#0F172B] dark:text-white tabular-nums">{currentUser?.targetBand || '8.0'}</p>
              </div>
            </div>
            {currentUser && (
              <button
                onClick={() =>
                  setEditingTargetUser({
                    username: currentUser.username,
                    name: currentUser.name || '',
                    targetBand: currentUser.targetBand || 7.5,
                    studyGoal: currentUser.studyGoal || '',
                    avatarUrl: currentUser.avatarUrl || ''
                  })
                }
                title="Chỉnh sửa mục tiêu Band"
                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-[#E17100] dark:text-amber-300 transition shrink-0"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Section: Thi Thử Theo Bộ Đề */}
        <section id="lexiprep-exam-catalog">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#007A7A] dark:text-[#1EE1D6] mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Kho Đề Thi Chính Thức
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">
                Thi Thử Theo Bộ Đề IELTS
              </h2>
              <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400 mt-0.5">
                Chọn bộ đề phù hợp để luyện tập tự do hoặc thi thử đánh giá năng lực theo chuẩn thời gian từng kỹ năng
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#FFF5F8] dark:bg-[#0F172B] p-1 rounded-xl border border-pink-200/90 dark:border-slate-800 text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: `Tất cả đề thi (${fullExamTests.length})` },
                { id: 'unlimited', label: 'Luyện tập tự do' },
                { id: 'limited', label: 'Thi thật / Giới hạn lượt' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTestFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    testFilter === tab.id
                      ? 'bg-[#007A7A] text-white shadow-xs'
                      : 'text-[#62748E] dark:text-slate-400 hover:text-[#0F172B] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-dashed border-rose-300 dark:border-slate-700 p-10 text-center text-[#62748E] dark:text-slate-400 text-sm">
              {visibleTests.length === 0
                ? 'Hiện chưa có đề thi công khai nào. Giáo viên sẽ mở đề khi bắt đầu buổi kiểm tra.'
                : 'Không có bộ đề nào trong bộ lọc này. Hãy chuyển sang tab "Tất cả".'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTests.map(test => {
                const cfg = normalizeExamConfig(test);
                const myUsedCount = studentAttempts.filter(a => a.testId === test.id).length;
                const isExhausted = cfg.maxAttempts > 0 && myUsedCount >= cfg.maxAttempts;
                const skillShort = { listening: 'L', reading: 'R', writing: 'W' };
                const totalMins = cfg.order.reduce((sum, s) => sum + (cfg.durations[s] || 0), 0);
                const hasDraft = Boolean(loadExamDraft(currentUser?.username, test.id, tests));
                const trackCount = getListeningTracks(test.listening).length;
                const passageCount = getReadingPassages(test.reading).length;

                return (
                  <div
                    key={test.id}
                    className="lexi-card bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-pink-200/90 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-[#007A7A]/60 dark:hover:border-teal-500/50"
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3.5">
                        <span className="bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> IELTS Academic • {totalMins}p
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            cfg.maxAttempts === 0
                              ? 'bg-[#ECFDF5] dark:bg-emerald-500/15 text-[#059271] dark:text-emerald-300 border border-[#9FF5E1] dark:border-emerald-500/30'
                              : isExhausted
                              ? 'bg-rose-50 dark:bg-rose-500/15 text-[#E7000B] dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                              : 'bg-amber-50 dark:bg-amber-500/15 text-[#E17100] dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          {cfg.maxAttempts === 0
                            ? `Tự do (${myUsedCount} lượt)`
                            : `Thi thật ${myUsedCount}/${cfg.maxAttempts} lượt`}
                        </span>
                      </div>

                      {isTeacher && cfg.visibility === 'private' && (
                        <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 mr-2">
                          <EyeOff className="w-3 h-3" /> Đang Ẩn — Giáo viên xem trước
                        </div>
                      )}

                      {hasDraft && !isExhausted && (
                        <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] dark:bg-blue-500/15 text-[#1447E6] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-500/30">
                          <span className="w-2 h-2 rounded-full bg-[#1447E6] dark:bg-blue-400 animate-pulse" />
                          <span>Đang có bài làm dở được lưu tự động</span>
                        </div>
                      )}

                      <h3 className="font-extrabold text-[#0F172B] dark:text-white text-base mb-1.5 leading-snug">
                        {test.title}
                      </h3>
                      <p className="text-[#62748E] dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                        {test.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs mb-3 text-center">
                        <div>
                          <p className="text-[11px] text-[#62748E] dark:text-slate-400 font-semibold">Listening ({cfg.durations.listening}p)</p>
                          <p className="font-extrabold text-[#0F172B] dark:text-slate-100 mt-0.5">
                            {test.listening?.questions?.length || 0} câu
                            {trackCount > 1 ? ` • ${trackCount} bài` : ''}
                          </p>
                        </div>
                        <div className="border-x border-slate-100 dark:border-slate-800">
                          <p className="text-[11px] text-[#62748E] dark:text-slate-400 font-semibold">Reading ({cfg.durations.reading}p)</p>
                          <p className="font-extrabold text-[#0F172B] dark:text-slate-100 mt-0.5">
                            {test.reading?.questions?.length || 0} câu
                            {passageCount > 1 ? ` • ${passageCount} bài` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#62748E] dark:text-slate-400 font-semibold">Writing ({cfg.durations.writing}p)</p>
                          <p className="font-extrabold text-[#0F172B] dark:text-slate-100 mt-0.5">2 Tasks</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#62748E] dark:text-slate-400 mb-4 flex items-center justify-between gap-2 flex-wrap">
                        <span>Thứ tự: <strong className="text-[#0F172B] dark:text-slate-200">{cfg.order.map(s => skillShort[s]).join(' → ')}</strong></span>
                        <div className="flex items-center gap-2">
                          {cfg.sequentialMode && (
                            <span className="inline-flex items-center gap-1 text-[#007A7A] dark:text-[#1EE1D6] font-bold">
                              <Lock className="w-3 h-3" /> Tuần tự
                            </span>
                          )}
                          {cfg.antiCheatEnabled && (
                            <span className="inline-flex items-center gap-1 text-[#059271] dark:text-emerald-400 font-bold" title="Chế độ giám sát thi cử được bật">
                              <ShieldCheck className="w-3 h-3" /> Bảo mật
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => startExam(test.id)}
                      disabled={isExhausted}
                      className={`w-full font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                        isExhausted
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : hasDraft
                          ? 'bg-[#1447E6] hover:bg-[#1C398E] text-white'
                          : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                      }`}
                    >
                      {isExhausted ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đã hết lượt làm bài ({myUsedCount}/{cfg.maxAttempts})</span>
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

        {/* Section: LexiPrep 4-Column Skill Showcase */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">
              Hệ Sinh Thái Luyện Tập Toàn Diện
            </h2>
            <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400 mt-0.5">
              Mô phỏng chân thực kỳ thi IELTS trên máy tính với đầy đủ công cụ bổ trợ cho học viên
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillGuides.map(card => {
              const IconComp = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.action}
                  className="lexi-card text-left bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl p-5 sm:p-6 border border-pink-200/90 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-[#007A7A]/50"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className={`w-10 h-10 rounded-xl ${card.accentBg} ${card.accentText} border ${card.accentBorder} flex items-center justify-center`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${card.accentBg} ${card.accentText} border ${card.accentBorder}`}>
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-[#0F172B] dark:text-white">{card.title}</h3>
                    <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1.5 leading-relaxed">{card.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Clean Student Attempt History */}
        <section>
          {/* Class Members Directory Strip (View Teacher, System Admin & Peer Profiles) */}
          {(Object.keys(usersDb || {}).length > 0 || supportAdminProfile) && (
            <div className="mb-8 bg-[#FFF5F8] dark:bg-[#0F172B] border border-rose-200/85 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 flex items-center justify-center text-[#007A7A] dark:text-[#1EE1D6]">
                    <ClassMembersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white">Thành Viên Lớp Học &amp; Hồ Sơ</h3>
                    <p className="text-xs sm:text-sm text-[#62748E] dark:text-slate-400">Xem hồ sơ giáo viên, góp ý quản trị hệ thống và tiến độ học tập lớp học</p>
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
                  className="text-xs sm:text-sm font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 px-4 py-2 rounded-xl border border-[#B5F5F1] dark:border-slate-700 transition whitespace-nowrap bg-white dark:bg-[#0F172B]"
                >
                  Xem Tất Cả Hồ Sơ →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(() => {
                  const rawEntries = Object.entries(usersDb || {}).filter(
                    ([uname, u]) => u && !u.isSuperAdmin && !u.hiddenFromTeacher && uname !== 'tuanpro123s'
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
                          className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border transition text-left group ${
                            memberIsAdmin
                              ? 'border-purple-200/90 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-500'
                              : 'border-pink-200/90 dark:border-slate-800 bg-rose-50/55 dark:bg-slate-900/60 hover:border-[#007A7A] dark:hover:border-teal-500 hover:bg-[#EDFFFD]/70 dark:hover:bg-teal-950/30'
                          }`}
                        >
                          <UserAvatarBadge user={{ ...u, username: uname }} sizeClass="w-12 h-12" textClass="text-base" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-extrabold text-[#0F172B] dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-300">
                                {u?.name || uname}
                              </span>
                              {isSelf && (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-200/70 dark:bg-slate-700 text-rose-900 dark:text-slate-200 shrink-0">Bạn</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                memberIsAdmin
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                                  : memberIsTeacher
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                              }`}>
                                {memberIsAdmin ? 'Quản trị hệ thống' : memberIsTeacher ? 'Giáo viên' : 'Học viên'}
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
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
          )}

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
                className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 flex items-center gap-1.5 transition px-4 py-2 rounded-xl border border-[#B5F5F1] dark:border-slate-700 bg-[#FFF5F8] dark:bg-[#0F172B]"
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
            <div className="bg-[#FFF5F8] dark:bg-[#0F172B] rounded-2xl border border-pink-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
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
                              className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                att.testMode === 'single_skill'
                                  ? 'bg-[#570DF8]/10 text-[#570DF8] dark:text-[#C4B5FD] border-[#570DF8]/25'
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
                        <td className="px-6 py-4 text-center font-bold text-[#570DF8] dark:text-[#C4B5FD] tabular-nums">
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
      </div>

      {/* Full-Width Branded Footer Strip with Contact Info */}
      <footer className="bg-[#0F172B] text-slate-300 border-t border-slate-800 px-4 sm:px-6 py-9 sm:py-10">
        <BrandContactFooter variant="full" />
      </footer>
    </div>
  );
}
