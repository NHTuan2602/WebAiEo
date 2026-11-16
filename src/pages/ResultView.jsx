import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileAudio,
  Headphones,
  Key,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  PenTool,
  Sparkles,
  Unlock,
  XCircle
} from 'lucide-react';
import { getWordCount, isObjectiveAnswerCorrect } from '../utils/examHelpers';

export default function ResultView({
  aiApiKey,
  aiGradingStep,
  attempts,
  currentUser,
  handleGradeSpeakingWithAI,
  handleGradeWritingWithAI,
  isGradingAI,
  openTeacherGradingModal,
  previousView,
  resultReviewTab,
  selectedAttemptId,
  setApiTestState,
  setResultReviewTab,
  setShowApiKeyModal,
  setView,
  tests,
  toggleTestAllowViewAnswers
}) {
  const attempt = attempts.find(a => a.id === selectedAttemptId);
  if (!attempt) {
    const fallbackView = currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME';
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
            Không tìm thấy dữ liệu bài thi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
            Bài thi này có thể đang được đồng bộ từ máy chủ hoặc đã bị xóa.
          </p>
          <button
            type="button"
            onClick={() => setView(previousView && previousView !== 'RESULT_VIEW' ? previousView : fallbackView)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-bold transition"
          >
            Quay Lại
          </button>
        </div>
      </div>
    );
  }

  const targetTest = tests.find(t => t.id === attempt.testId) || tests[0];
  const isTeacher = currentUser?.role === 'teacher';
  const isAllowedByTeacher = Boolean(targetTest?.allowViewAnswers);
  const canShowCorrectAnswers = isTeacher || isAllowedByTeacher;

  const isSingleSkill = attempt.testMode === 'single_skill' && Boolean(attempt.focusSkill);
  const focusSkill = isSingleSkill ? attempt.focusSkill : null;
  const isSpeakingAttempt =
    focusSkill === 'speaking' ||
    Boolean(attempt.scores?.speaking) ||
    (Array.isArray(attempt.speakingRecordings) && attempt.speakingRecordings.length > 0);

  const showListeningCard = !isSingleSkill || focusSkill === 'listening';
  const showReadingCard = !isSingleSkill || focusSkill === 'reading';
  const showWritingCard = !isSingleSkill || focusSkill === 'writing';
  const showSpeakingCard = isSpeakingAttempt;

  const availableReviewTabs = [
    ...(showListeningCard ? ['listening'] : []),
    ...(showReadingCard ? ['reading'] : []),
    ...(showWritingCard ? ['writing'] : []),
    ...(showSpeakingCard ? ['speaking'] : [])
  ];
  const activeReviewTab = availableReviewTabs.includes(resultReviewTab)
    ? resultReviewTab
    : (availableReviewTabs[0] || 'listening');

  const renderWritingCriteriaBox = (label, band, criteria, colorClass, firstCriterionKey, firstCriterionLabel) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className={`font-bold text-xs flex items-center gap-1.5 ${colorClass}`}>
          <PenTool className="w-3.5 h-3.5" /> {label}: Band {band}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">4 Tiêu chí IELTS</span>
      </div>
      {criteria && (
        <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-50 dark:bg-slate-800 rounded text-[11px] mb-2 font-mono text-slate-900 dark:text-slate-100">
          <div><span className="text-[9px] text-slate-400 block font-sans">{firstCriterionLabel}</span><strong>{criteria[firstCriterionKey]}</strong></div>
          <div><span className="text-[9px] text-slate-400 block font-sans">CC</span><strong>{criteria.cc}</strong></div>
          <div><span className="text-[9px] text-slate-400 block font-sans">LR</span><strong>{criteria.lr}</strong></div>
          <div><span className="text-[9px] text-slate-400 block font-sans">GRA</span><strong>{criteria.gra}</strong></div>
        </div>
      )}
      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">{criteria?.comment}</p>
    </div>
  );

  const writingCriteriaGrid = attempt.aiDetails ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderWritingCriteriaBox('Task 1', attempt.scores.writing.task1Band, attempt.aiDetails.task1Criteria, 'text-blue-700 dark:text-blue-400', 'ta', 'TA')}
      {renderWritingCriteriaBox('Task 2', attempt.scores.writing.task2Band, attempt.aiDetails.task2Criteria, 'text-indigo-700 dark:text-indigo-400', 'tr', 'TR')}
    </div>
  ) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={() => {
            if (previousView === 'STUDENT_PROFILE') {
              setView('STUDENT_PROFILE');
            } else if (previousView === 'TEACHER_DASHBOARD') {
              setView('TEACHER_DASHBOARD');
            } else {
              setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Quay Lại {previousView === 'STUDENT_PROFILE' ? 'Hồ Sơ Thành Viên' : previousView === 'TEACHER_DASHBOARD' ? 'Bảng Quản Lý Giáo Viên' : 'Trang Chủ'}
        </button>

        {/* Teacher Quick Toggle for Answer Visibility */}
        {isTeacher && targetTest && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Quyền xem đáp án của học sinh:</span>
            <button
              onClick={() => toggleTestAllowViewAnswers(targetTest.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm ${
                isAllowedByTeacher
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-amber-300'
              }`}
            >
              {isAllowedByTeacher ? (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Đang Cho Phép (Bấm để Khóa)
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Đang Khóa Đáp Án (Bấm để Mở)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1 rounded-full">
                Hoàn Thành Bài Thi
              </span>
              {isTeacher && attempt.aiGraded && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> AI Graded
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{attempt.testTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thí sinh: <b>{attempt.studentName}</b> • Nộp ngày: {attempt.submittedAt}</p>
          </div>

          <div className="bg-[#0F172B] dark:bg-slate-800 text-white rounded-2xl p-4 text-center min-w-[150px] shadow border border-slate-800 dark:border-slate-700">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">BAND TỔNG OVERALL</p>
            <p className="text-4xl font-extrabold text-[#1EE1D6] mt-1">
              {attempt.overallBand !== null && attempt.overallBand !== undefined ? attempt.overallBand : 'Chờ Chấm'}
            </p>
          </div>
        </div>

        {/* Breakdown cards */}
        <div className={`grid grid-cols-1 ${
          [showListeningCard, showReadingCard, showWritingCard, showSpeakingCard].filter(Boolean).length === 1
            ? 'md:grid-cols-1 max-w-md'
            : [showListeningCard, showReadingCard, showWritingCard, showSpeakingCard].filter(Boolean).length === 2
            ? 'md:grid-cols-2'
            : 'md:grid-cols-3'
        } gap-6 my-8`}>
          {showListeningCard && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Listening
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#007A7A] dark:text-[#1EE1D6]">{attempt.scores?.listening?.band ?? 0}</span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] hover:border-[#007A7A] transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Listening"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.listening?.raw || 0}</span> / {attempt.scores?.listening?.total || 0} câu
              </p>
            </div>
          )}

          {showReadingCard && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1447E6] dark:text-blue-400" /> Reading
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#1447E6] dark:text-blue-400">{attempt.scores?.reading?.band ?? 0}</span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Reading"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.reading?.raw || 0}</span> / {attempt.scores?.reading?.total || 0} câu
              </p>
            </div>
          )}

          {showWritingCard && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#059271] dark:text-emerald-400" /> Writing
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#059271] dark:text-emerald-400">
                    {attempt.scores?.writing?.overallBand ?? 'Chờ Chấm'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 transition flex items-center gap-1"
                      title="Chấm hoặc chỉnh sửa điểm Writing"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Task 1: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task1Band ?? '-'}</span> | Task 2: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task2Band ?? '-'}</span>
              </p>
            </div>
          )}

          {showSpeakingCard && (
            <div className="bg-indigo-50/75 dark:bg-[#201D2E] rounded-2xl p-5 border border-[#570DF8]/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#570DF8] dark:text-[#C4B5FD]" /> Speaking AI
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#570DF8] dark:text-[#C4B5FD]">
                    {attempt.scores?.speaking?.band ?? attempt.overallBand ?? '0'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#570DF8] transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Speaking"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-mono">
                <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                  <span className="block text-[9px] text-slate-400 font-sans">FC</span>
                  <strong>{attempt.scores?.speaking?.criteria?.fc ?? '-'}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                  <span className="block text-[9px] text-slate-400 font-sans">LR</span>
                  <strong>{attempt.scores?.speaking?.criteria?.lr ?? '-'}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                  <span className="block text-[9px] text-slate-400 font-sans">GRA</span>
                  <strong>{attempt.scores?.speaking?.criteria?.gra ?? '-'}</strong>
                </div>
                <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                  <span className="block text-[9px] text-slate-400 font-sans">PR</span>
                  <strong>{attempt.scores?.speaking?.criteria?.pr ?? '-'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SPEAKING 4 CRITERIA & TEACHER RE-GRADE PANEL */}
        {showSpeakingCard && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-white to-pink-50/60 dark:from-[#201D2E] dark:via-[#191820] dark:to-slate-900 rounded-2xl border border-[#570DF8]/30 p-5 sm:p-6 mb-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-[#570DF8] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" /> AI Speaking Examiner
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {attempt.speakingAiDetails?._gradedMode === 'gemini_audio'
                      ? `Đã phân tích trực tiếp từ file ghi âm (${attempt.speakingAiDetails?._usedModel || 'Gemini Audio'})`
                      : 'Đánh giá tự động & Lưu file ghi âm trên hệ thống'}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Bảng Điểm Chi Tiết 4 Tiêu Chí IELTS Speaking
                </h3>
              </div>

              {isTeacher && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openTeacherGradingModal?.(attempt)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh Sửa Điểm Speaking
                  </button>
                  <button
                    type="button"
                    disabled={isGradingAI}
                    onClick={() => handleGradeSpeakingWithAI?.(attempt)}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-[#570DF8] hover:bg-[#490AD2] disabled:opacity-55 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isGradingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{isGradingAI ? 'Đang nghe & chấm lại...' : 'AI Chấm Lại Từ File Ghi Âm'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'fc', title: 'Fluency & Coherence', sub: 'Độ trôi chảy & mạch lạc' },
                { key: 'lr', title: 'Lexical Resource', sub: 'Vốn từ vựng & Collocation' },
                { key: 'gra', title: 'Grammatical Range', sub: 'Ngữ pháp & Cấu trúc câu' },
                { key: 'pr', title: 'Pronunciation', sub: 'Phát âm & Ngữ điệu' }
              ].map(item => (
                <div key={item.key} className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-indigo-200/70 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.title}</p>
                  <p className="text-2xl font-black text-[#570DF8] dark:text-[#C4B5FD] mt-0.5 tabular-nums">
                    {attempt.scores?.speaking?.criteria?.[item.key] ?? '-'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {(attempt.speakingAiDetails?.strengths?.length > 0 || attempt.speakingAiDetails?.improvements?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {attempt.speakingAiDetails?.strengths?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
                    <p className="font-extrabold text-emerald-800 dark:text-emerald-300">Điểm Mạnh Ghi Nhận:</p>
                    <ul className="list-disc pl-4 space-y-1 text-emerald-900 dark:text-emerald-100">
                      {attempt.speakingAiDetails.strengths.map((st, idx) => <li key={idx}>{st}</li>)}
                    </ul>
                  </div>
                )}
                {attempt.speakingAiDetails?.improvements?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-1">
                    <p className="font-extrabold text-amber-800 dark:text-amber-300">Gợi Ý Cải Thiện Band:</p>
                    <ul className="list-disc pl-4 space-y-1 text-amber-900 dark:text-amber-100">
                      {attempt.speakingAiDetails.improvements.map((im, idx) => <li key={idx}>{im}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* WRITING EVALUATION CARD (Shown only when Writing was part of this test) */}
        {showWritingCard && (isTeacher ? (
          <div className="bg-gradient-to-r from-[#EDFFFD] via-white to-[#EFF6FF] dark:from-[#003538]/60 dark:via-[#0F172B] dark:to-slate-900 rounded-2xl border border-[#B5F5F1] dark:border-teal-500/30 p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#007A7A] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-300" /> AI Examiner (GV)
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Công Cụ Chấm & Chỉnh Sửa Điểm (L · R · W)</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  Dành riêng cho Giáo viên: Chấm nhanh Writing qua Gemini API hoặc chỉnh sửa trực tiếp điểm Listening, Reading và Writing theo thang chuẩn IELTS 0.0 – 9.0.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openTeacherGradingModal?.(attempt)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Điểm L / R / W</span>
                </button>

                <button
                  onClick={() => { setApiTestState({ testing: false, ok: null, message: '', model: '' }); setShowApiKeyModal(true); }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm"
                  title="Cài đặt API Key (Gemini)"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>{aiApiKey ? 'API Key (Đã lưu)' : 'Cấu hình API Key'}</span>
                </button>

                <button
                  onClick={() => handleGradeWritingWithAI(attempt)}
                  disabled={isGradingAI}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md ${
                    isGradingAI
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-[#007A7A] hover:bg-[#065B5B] text-white active:scale-95'
                  }`}
                >
                  {isGradingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Chấm Điểm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {attempt.teacherGraded || (attempt.scores.writing.overallBand !== null && attempt.scores.writing.overallBand !== undefined)
                          ? 'Chấm Lại Bằng AI'
                          : 'Chấm Điểm Bằng AI Ngay'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Grading Loading Spinner View */}
            {isGradingAI && (
              <div className="mt-6 pt-6 border-t border-indigo-200/60 dark:border-indigo-500/30 flex flex-col items-center justify-center py-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl shadow-inner">
                <div className="relative mb-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 animate-pulse">{aiGradingStep || 'AI Examiner đang tiến hành chấm bài...'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đang phân tích cấu trúc ngữ pháp, từ vựng và tiêu chí chấm điểm IELTS...</p>
              </div>
            )}

            {/* Detailed Criteria Breakdown */}
            {writingCriteriaGrid && !isGradingAI && (
              <div className="mt-6 pt-6 border-t border-indigo-200/60 dark:border-indigo-500/30 space-y-4">
                {writingCriteriaGrid}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-8">
            {!(attempt.teacherGraded || (attempt.scores.writing.overallBand !== null && attempt.scores.writing.overallBand !== undefined)) ? (
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Phần thi Writing đang chờ Giáo viên chấm điểm</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bài viết Task 1 & Task 2 của bạn đã được lưu lại an toàn. Điểm và nhận xét sẽ hiển thị sau khi Giáo viên hoàn tất chấm bài.
                  </p>
                </div>
              </div>
            ) : writingCriteriaGrid ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bảng Điểm Chi Tiết Phần Thi Writing
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                    Đã công bố điểm
                  </span>
                </div>
                {writingCriteriaGrid}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Phần thi Writing đã được chấm: Overall Writing Band <strong>{attempt.scores.writing.overallBand}</strong>.
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Feedback */}
        {attempt.teacherFeedback && (
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-500/30 mb-8">
            <h3 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" /> {isTeacher && attempt.aiGraded ? 'Nhận Xét Từ AI Examiner' : 'Nhận Xét Từ Giáo Viên'}
            </h3>
            <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-line font-medium">
              {attempt.teacherFeedback}
            </p>
          </div>
        )}

        {/* QUESTION-BY-QUESTION REVIEW & CORRECT ANSWERS SECTION */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" /> Xem Lại Bài Làm & Đáp Án Chi Tiết
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Đối chiếu câu trả lời đã nộp của thí sinh với đáp án chuẩn của đề thi.
              </p>
            </div>

            {/* Permission status badge */}
            {!isTeacher ? (
              <div className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                isAllowedByTeacher
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}>
                {isAllowedByTeacher ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Giáo viên đã cho phép xem đáp án đúng</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Đáp án đúng & kết quả đúng/sai từng câu đang khóa (Chờ Giáo viên bật cho phép)</span>
                  </>
                )}
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 text-[#007A7A] dark:text-[#1EE1D6] text-xs font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                <span>Chế độ Giáo viên: Luôn hiển thị toàn bộ đáp án đúng</span>
              </div>
            )}
          </div>

          {/* Skill Tabs for Review */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
            {showListeningCard && (
              <button
                onClick={() => setResultReviewTab('listening')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  activeReviewTab === 'listening'
                    ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" /> Listening ({targetTest?.listening?.questions?.length || 0} câu)
              </button>
            )}
            {showReadingCard && (
              <button
                onClick={() => setResultReviewTab('reading')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  activeReviewTab === 'reading'
                    ? 'bg-white dark:bg-slate-900 text-[#1447E6] dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Reading ({targetTest?.reading?.questions?.length || 0} câu)
              </button>
            )}
            {showWritingCard && (
              <button
                onClick={() => setResultReviewTab('writing')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  activeReviewTab === 'writing'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Writing &amp; Bài Mẫu
              </button>
            )}
            {showSpeakingCard && (
              <button
                onClick={() => setResultReviewTab('speaking')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  activeReviewTab === 'speaking'
                    ? 'bg-white dark:bg-slate-900 text-[#570DF8] dark:text-[#C4B5FD] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> Speaking &amp; File Ghi Âm ({(attempt.speakingRecordings || []).length} câu)
              </button>
            )}
          </div>

          {/* Listening & Reading Questions Review */}
          {(activeReviewTab === 'listening' || activeReviewTab === 'reading') && (
            <div className="space-y-4">
              {((activeReviewTab === 'listening' ? targetTest?.listening?.questions : targetTest?.reading?.questions) || []).map((q, idx) => {
                const userAns = (attempt.answers?.[q.id] || '').trim();
                const correctAns = (q.correctAnswer || '').trim();
                const isCorrect = isObjectiveAnswerCorrect(q, userAns);

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition ${
                      !canShowCorrectAnswers
                        ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : isCorrect
                        ? 'bg-emerald-50/40 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-rose-50/40 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        Câu {idx + 1}: {q.question}
                      </span>
                      {canShowCorrectAnswers ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold w-fit ${
                          isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                        }`}>
                          {isCorrect ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Chính xác
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Chưa chính xác
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Đã ghi nhận câu trả lời
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Student's Answer */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Câu trả lời của thí sinh:
                        </span>
                        <span className={`font-bold ${
                          !canShowCorrectAnswers
                            ? 'text-slate-800 dark:text-slate-100'
                            : isCorrect
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {userAns || '(Bỏ trống - Không trả lời)'}
                        </span>
                      </div>

                      {/* Correct Answer (Gated by Teacher Permission) */}
                      {canShowCorrectAnswers ? (
                        <div className="bg-emerald-50/90 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                            <Unlock className="w-3 h-3" /> Đáp án đúng chuẩn:
                          </span>
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                            {q.correctAnswer}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <span className="font-semibold italic">
                            Giáo viên chưa bật hiển thị đáp án & kết quả đúng/sai
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Writing Review & Model Answers */}
          {activeReviewTab === 'writing' && (
            <div className="space-y-6">
              {/* Task 1 */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400">Writing Task 1</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">{targetTest?.writing?.task1?.prompt}</p>
                  {targetTest?.writing?.task1?.imageUrl && (
                    <img
                      src={targetTest.writing.task1.imageUrl}
                      alt="Task 1 Chart"
                      className="mt-3 max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-white dark:bg-slate-900 p-2"
                    />
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    Bài làm của thí sinh ({getWordCount(attempt.answers?.w1)} từ):
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                    {attempt.answers?.w1 || '(Chưa nộp bài viết Task 1)'}
                  </p>
                </div>

                {canShowCorrectAnswers ? (
                  targetTest?.writing?.task1?.modelAnswer ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 1):
                      </p>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                        {targetTest.writing.task1.modelAnswer}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold italic">Bài mẫu tham khảo Task 1 đang được khóa bởi Giáo viên.</span>
                  </div>
                )}
              </div>

              {/* Task 2 */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Writing Task 2</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">{targetTest?.writing?.task2?.prompt}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    Bài làm của thí sinh ({getWordCount(attempt.answers?.w2)} từ):
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                    {attempt.answers?.w2 || '(Chưa nộp bài viết Task 2)'}
                  </p>
                </div>

                {canShowCorrectAnswers ? (
                  targetTest?.writing?.task2?.modelAnswer ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 2):
                      </p>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                        {targetTest.writing.task2.modelAnswer}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold italic">Bài mẫu tham khảo Task 2 đang được khóa bởi Giáo viên.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Speaking Recordings, Transcript & AI Fixes Review */}
          {activeReviewTab === 'speaking' && (
            <div className="space-y-4">
              {(attempt.speakingRecordings || []).length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
                  Không có bản ghi âm nào được lưu cho lượt thi này.
                </div>
              ) : (attempt.speakingRecordings || []).map((rec, idx) => (
                <div
                  key={rec.questionId || idx}
                  className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#570DF8]/15 text-[#570DF8] dark:text-[#C4B5FD] text-[10px] font-black uppercase">
                        Part {rec.part || 1} • Câu {idx + 1}
                      </span>
                      {rec.topic && (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {rec.topic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {rec.durationSec || 0}s
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 text-xs font-extrabold text-[#570DF8] dark:text-[#C4B5FD]">
                        Band {rec.band ?? '-'}
                      </span>
                    </div>
                  </div>

                  <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                    {rec.prompt}
                  </p>

                  {rec.audioUrl ? (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
                      <audio controls src={rec.audioUrl} className="w-full h-10" />
                      <a
                        href={rec.audioUrl}
                        download={`speaking-part${rec.part || 1}-q${idx + 1}.webm`}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải Ghi Âm
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <FileAudio className="w-4 h-4 shrink-0" />
                      <span>{rec.durationSec > 0 ? 'File âm thanh chưa đồng bộ lên server.' : 'Thí sinh bỏ trống chưa thu âm câu này.'}</span>
                    </div>
                  )}

                  {rec.transcript && (
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Transcript Bài Nói Của Thí Sinh:
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                        {rec.transcript}
                      </p>
                    </div>
                  )}

                  {rec.feedback && (
                    <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-indigo-50/70 dark:bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-500/25">
                      <strong className="text-[#570DF8] dark:text-[#C4B5FD]">Nhận xét AI: </strong>
                      {rec.feedback}
                    </div>
                  )}

                  {Array.isArray(rec.grammarVocabularyFixes) && rec.grammarVocabularyFixes.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">
                        Sửa Lỗi Ngữ Pháp &amp; Nâng Cấp Từ Vựng:
                      </span>
                      {rec.grammarVocabularyFixes.map((fix, fIdx) => (
                        <div key={fIdx} className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-500/25">
                          <span className="line-through text-rose-600 dark:text-rose-400">{fix.original}</span>
                          {' → '}
                          <strong className="text-emerald-700 dark:text-emerald-400">{fix.corrected}</strong>
                          {fix.reason && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{fix.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {rec.upgradedSample && (
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                        Câu Trả Lời Mẫu Gợi Ý Nâng Band:
                      </span>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed italic">
                        {rec.upgradedSample}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
