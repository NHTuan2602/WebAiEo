import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Headphones,
  Key,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  PenTool,
  Sparkles,
  Trophy,
  Unlock,
  XCircle
} from 'lucide-react';
import { formatDurationVi, normalizeExamConfig } from '../constants/seedData';
import { getWordCount, isObjectiveAnswerCorrect } from '../utils/examHelpers';
import SpeakingQuestionLuyennoiCard from '../components/speaking/SpeakingQuestionLuyennoiCard';
import VipMemberName from '../components/common/VipMemberName';

export default function ResultView({
  aiApiKey,
  aiConfigured = false,
  aiGradingStep,
  attempts,
  currentUser,
  usersDb = {},
  handleGradeSpeakingWithAI,
  handleGradeWritingWithAI,
  isGradingAI,
  onRetryTest = null,
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
          <p className="text-xs text-[#475569] dark:text-slate-400 leading-relaxed mb-5">
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
  const targetTestCfg = targetTest ? normalizeExamConfig(targetTest) : null;
  const isTeacher = currentUser?.role === 'teacher';
  const canShowApprovedScores = isTeacher || Boolean(attempt.teacherGraded);
  const isAllowedByTeacher = Boolean(targetTest?.allowViewAnswers);
  const canShowCorrectAnswers = isTeacher || isAllowedByTeacher;

  const isSingleSkill = attempt.testMode === 'single_skill' && Boolean(attempt.focusSkill);
  const focusSkill = isSingleSkill ? attempt.focusSkill : null;
  const writingTaskScope = attempt.writingTaskScope || targetTestCfg?.writingTaskScope || 'both';
  const isSpeakingAttempt =
    focusSkill === 'speaking' ||
    Boolean(attempt.scores?.speaking) ||
    (Array.isArray(attempt.speakingRecordings) && attempt.speakingRecordings.length > 0);

  const sameStudentSameTest = attempts
    .filter(
      a =>
        a &&
        a.testId === attempt.testId &&
        (a.studentId || a.studentUsername) === (attempt.studentId || attempt.studentUsername)
    )
    .sort((a, b) => (Number(a.submittedAtMs) || 0) - (Number(b.submittedAtMs) || 0));
  const totalAttemptsForThisTest = Math.max(1, sameStudentSameTest.length);
  const thisAttemptOrderNum = Math.max(1, sameStudentSameTest.findIndex(a => a.id === attempt.id) + 1);

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
          <PenTool className="w-3.5 h-3.5" /> {label}: Band {band ?? 0}
        </span>
        <span className="text-xs text-slate-400 font-semibold uppercase">4 Tiêu chí (Điểm chẵn 1–9)</span>
      </div>
      {criteria && (
        <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-50 dark:bg-slate-800 rounded text-xs mb-2 font-mono text-slate-900 dark:text-slate-100">
          <div><span className="text-xs text-slate-400 block font-sans">{firstCriterionLabel}</span><strong>{criteria[firstCriterionKey] ?? 0}</strong></div>
          <div><span className="text-xs text-slate-400 block font-sans">CC</span><strong>{criteria.cc ?? 0}</strong></div>
          <div><span className="text-xs text-slate-400 block font-sans">LR</span><strong>{criteria.lr ?? 0}</strong></div>
          <div><span className="text-xs text-slate-400 block font-sans">GRA</span><strong>{criteria.gra ?? 0}</strong></div>
        </div>
      )}
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">{criteria?.comment}</p>
    </div>
  );

  const aiD = canShowApprovedScores ? (attempt.aiDetails || null) : null;
  const writingCriteriaGrid = aiD ? (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
        <span>
          Quy chuẩn chấm điểm IELTS Examiner: 4 tiêu chí thành phần tính <strong>điểm chẵn (1–9)</strong> • Overall Writing = <strong>(Bài 2 × 2 + Bài 1) ÷ 3 → làm tròn xuống 0.5</strong>
        </span>
        <span className="font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">
          Writing Band: {attempt.scores?.writing?.overallBand ?? aiD.overallBand ?? '--'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderWritingCriteriaBox('Task 1', attempt.scores?.writing?.task1Band ?? aiD.task1Band, aiD.task1Criteria, 'text-blue-700 dark:text-blue-400', 'ta', 'TA')}
        {renderWritingCriteriaBox('Task 2', attempt.scores?.writing?.task2Band ?? aiD.task2Band, aiD.task2Criteria, 'text-indigo-700 dark:text-indigo-400', 'tr', 'TR')}
      </div>

      {/* Quick Spelling / Grammar / Vocab Error List */}
      {Array.isArray(aiD.spellingGrammarNotes) && aiD.spellingGrammarNotes.length > 0 && (
        <div className="bg-rose-50/75 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 space-y-2.5">
          <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
            <XCircle className="w-4 h-4 shrink-0" /> Lỗi Chính Tả, Ngữ Pháp &amp; Dùng Từ Cần Sửa Ngay ({aiD.spellingGrammarNotes.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {aiD.spellingGrammarNotes.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200/80 dark:border-rose-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                    {item.type || 'Lỗi'}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-100">
                  <span className="line-through text-rose-600 dark:text-rose-400 font-semibold">{item.wrong}</span>
                  {' → '}
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{item.fixed}</span>
                </p>
                {item.note && <p className="text-xs text-[#475569] dark:text-slate-400">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional IELTS Examiner Sentence-by-Sentence Table */}
      {Array.isArray(aiD.sentenceAnalysis) && aiD.sentenceAnalysis.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
              Bảng Phân Tích Từng Câu (Examiner Sentence Table)
            </h4>
            <span className="text-xs font-bold text-[#475569] dark:text-slate-400">
              {aiD.sentenceAnalysis.length} câu đã rà soát
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3 font-extrabold w-[32%]">Sentence</th>
                  <th className="py-2.5 px-3 font-extrabold w-[34%]">Grammatical or Vocabulary Error</th>
                  <th className="py-2.5 px-3 font-extrabold w-[34%]">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {aiD.sentenceAnalysis.map((row, idx) => (
                  <tr key={idx} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="inline-block text-xs font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 mr-1.5">
                        {row.task || 'Essay'}
                      </span>
                      {row.sentence}
                    </td>
                    <td className="py-2.5 px-3 text-rose-700 dark:text-rose-300 leading-relaxed">
                      {row.errorType && (
                        <span className="block text-xs font-bold uppercase text-rose-500 dark:text-rose-400 mb-0.5">
                          {row.errorType}
                        </span>
                      )}
                      {row.errorDescription}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                      {row.correction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task & Logic Flaws + Sentence Structure Upgrades */}
      {((Array.isArray(aiD.taskLogicCritiques) && aiD.taskLogicCritiques.length > 0) ||
        (Array.isArray(aiD.sentenceStructureUpgrades) && aiD.sentenceStructureUpgrades.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.isArray(aiD.taskLogicCritiques) && aiD.taskLogicCritiques.length > 0 && (
            <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                Lỗi Tư Duy Đề &amp; Lập Luận (TA / TR)
              </h4>
              <div className="space-y-2">
                {aiD.taskLogicCritiques.map((c, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/20 text-xs space-y-1">
                    <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">{c.task || 'Lập luận'}</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{c.issue}</p>
                    {c.suggestion && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">→ Hướng khắc phục: {c.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(aiD.sentenceStructureUpgrades) && aiD.sentenceStructureUpgrades.length > 0 && (
            <div className="bg-sky-50/80 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-sky-900 dark:text-sky-300 uppercase tracking-wide">
                Nâng Cấp Cấu Trúc Câu (Grammatical Range 8.0+)
              </h4>
              <div className="space-y-2">
                {aiD.sentenceStructureUpgrades.map((up, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-sky-200/80 dark:border-sky-500/20 text-xs space-y-1">
                    {up.technique && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300">
                        {up.technique}
                      </span>
                    )}
                    <p className="text-[#475569] dark:text-slate-400 line-through">{up.original}</p>
                    <p className="text-sky-800 dark:text-sky-200 font-bold">→ {up.upgraded}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary & Collocations Upgrades */}
      {Array.isArray(aiD.vocabularyUpgrades) && aiD.vocabularyUpgrades.length > 0 && (
        <div className="bg-emerald-50/75 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
          <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Kho Từ Vựng &amp; Collocation Nâng Band
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {aiD.vocabularyUpgrades.map((v, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-500/25 text-xs space-y-1">
                {v.basic && <p className="text-xs text-slate-400 line-through">{v.basic}</p>}
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300">{v.upgraded}</p>
                {v.collocation && (
                  <p className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                    Collocation: {v.collocation}
                  </p>
                )}
                {v.meaning && <p className="text-xs text-[#475569] dark:text-slate-400">{v.meaning}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revised Essays Improving TA/TR & CC */}
      {(aiD.revisedTask1 || aiD.revisedTask2) && (
        <div className="grid grid-cols-1 gap-4">
          {aiD.revisedTask1 && (
            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-extrabold text-blue-800 dark:text-blue-300 uppercase">
                Bài Sửa Nâng Cấp Task 1 (Tối ưu Task Achievement &amp; Coherence/Cohesion)
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">{aiD.revisedTask1}</p>
            </div>
          )}
          {aiD.revisedTask2 && (
            <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 space-y-1.5">
              <h4 className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300 uppercase">
                Bài Sửa Nâng Cấp Task 2 (Tối ưu Task Response, Coherence &amp; Lexical/Grammar)
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">{aiD.revisedTask2}</p>
            </div>
          )}
        </div>
      )}
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
            } else if (previousView === 'SKILL_HUB') {
              setView('SKILL_HUB');
            } else {
              setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Quay Lại {previousView === 'STUDENT_PROFILE' ? 'Hồ Sơ Thành Viên' : previousView === 'TEACHER_DASHBOARD' ? 'Bảng Quản Lý Giáo Viên' : previousView === 'SKILL_HUB' ? 'Daily Zone' : 'Trang Chủ'}
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
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Thí sinh: <b>{attempt.studentName}</b></span>
              {attempt.startedAt && (
                <>
                  <span>•</span>
                  <span>Bắt đầu: {attempt.startedAt}</span>
                </>
              )}
              <span>•</span>
              <span>Nộp lúc: <b>{attempt.submittedAt}</b></span>
              {Number(attempt.durationSeconds) > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-[#007A7A] dark:text-[#1EE1D6] font-bold">
                    <Clock className="w-3 h-3" /> Thời lượng: {formatDurationVi(attempt.durationSeconds)}
                  </span>
                </>
              )}
              {attempt.timelinessStatus === 'late' ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  Nộp muộn{attempt.lateByMinutes ? ` ${attempt.lateByMinutes}p` : ''}
                </span>
              ) : attempt.timelinessStatus === 'on_time' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  Đúng hạn
                </span>
              ) : null}
            </p>
          </div>

          <div className="bg-[#0F172B] dark:bg-slate-800 text-white rounded-2xl p-4 text-center min-w-[170px] shadow border border-slate-800 dark:border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">BAND TỔNG OVERALL</p>
            <p className={`font-extrabold mt-1 ${canShowApprovedScores && attempt.overallBand !== null && attempt.overallBand !== undefined ? 'text-4xl text-[#1EE1D6]' : 'text-base sm:text-lg text-amber-300'}`}>
              {canShowApprovedScores && attempt.overallBand !== null && attempt.overallBand !== undefined
                ? attempt.overallBand
                : 'Ms. Như đang check'}
            </p>
          </div>
        </div>

        {/* Daily Zone Post-Submission Summary Bar (Số câu đúng + Thời gian + Số lần làm + Làm Lại) */}
        {isSingleSkill && (
          <div className="mt-6 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/30 border border-[#B5F5F1] dark:border-teal-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {focusSkill === 'reading' || focusSkill === 'listening'
                    ? 'Số câu đúng'
                    : focusSkill === 'speaking'
                    ? 'Câu đã ghi âm'
                    : 'Độ dài bài viết'}
                </p>
                <p className="text-lg sm:text-xl font-black text-[#0F766E] dark:text-[#1EE1D6] tabular-nums mt-0.5">
                  {focusSkill === 'reading'
                    ? `${attempt.scores?.reading?.raw || 0}/${attempt.scores?.reading?.total || 0} câu`
                    : focusSkill === 'listening'
                    ? `${attempt.scores?.listening?.raw || 0}/${attempt.scores?.listening?.total || 0} câu`
                    : focusSkill === 'speaking'
                    ? `${(attempt.speakingRecordings || []).filter(r => Number(r?.durationSec) > 0 || r?.audioUrl).length} câu`
                    : `${getWordCount(attempt.answers?.w1) + getWordCount(attempt.answers?.w2)} từ`}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Thời gian làm bài
                </p>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatDurationVi(attempt.durationSeconds)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Số lần làm bài này
                </p>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                  Lần #{thisAttemptOrderNum}{totalAttemptsForThisTest > 1 ? ` / ${totalAttemptsForThisTest}` : ''}
                </p>
              </div>
            </div>
            {!isTeacher && onRetryTest && (
              <button
                type="button"
                onClick={() => onRetryTest(attempt.testId)}
                className="px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs sm:text-sm font-extrabold shrink-0 transition"
              >
                Làm Lại Bài Này (Lần #{totalAttemptsForThisTest + 1}) →
              </button>
            )}
          </div>
        )}

        {/* Breakdown cards */}
        <div className={`grid grid-cols-1 ${
          [showListeningCard, showReadingCard, showWritingCard, showSpeakingCard].filter(Boolean).length === 1
            ? 'md:grid-cols-1 max-w-md'
            : [showListeningCard, showReadingCard, showWritingCard, showSpeakingCard].filter(Boolean).length === 2
            ? 'md:grid-cols-2'
            : [showListeningCard, showReadingCard, showWritingCard, showSpeakingCard].filter(Boolean).length >= 4
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : 'md:grid-cols-3'
        } gap-6 my-8`}>
          {showListeningCard && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Listening
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                    {canShowApprovedScores ? (attempt.scores?.listening?.band ?? 0) : 'Chờ duyệt'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#007A7A] dark:hover:text-[#1EE1D6] hover:border-[#007A7A] transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Listening"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                {canShowApprovedScores
                  ? <>Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.listening?.raw || 0}</span> / {attempt.scores?.listening?.total || 0} câu</>
                  : 'Ms. Như đang check và sẽ trả kết quả'}
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
                  <span className="text-lg font-bold text-[#1447E6] dark:text-blue-400">
                    {canShowApprovedScores ? (attempt.scores?.reading?.band ?? 0) : 'Chờ duyệt'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Reading"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                {canShowApprovedScores
                  ? <>Đúng: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.reading?.raw || 0}</span> / {attempt.scores?.reading?.total || 0} câu</>
                  : 'Ms. Như đang check và sẽ trả kết quả'}
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
                  <span className="text-base font-bold text-[#059271] dark:text-emerald-400">
                    {canShowApprovedScores && attempt.scores?.writing?.overallBand !== null && attempt.scores?.writing?.overallBand !== undefined
                      ? attempt.scores.writing.overallBand
                      : 'Ms. Như đang check'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 transition flex items-center gap-1"
                      title="Chấm hoặc chỉnh sửa điểm Writing"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                {canShowApprovedScores
                  ? (
                    writingTaskScope === 'task1'
                      ? <>Task 1: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task1Band ?? '-'}</span></>
                      : writingTaskScope === 'task2'
                      ? <>Task 2: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task2Band ?? '-'}</span></>
                      : <>Task 1: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task1Band ?? '-'}</span> | Task 2: <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.scores?.writing?.task2Band ?? '-'}</span></>
                  )
                  : 'Bài viết đã gửi - Chờ Ms. Như duyệt điểm'}
              </p>
            </div>
          )}

          {showSpeakingCard && (
            <div className="bg-indigo-50/75 dark:bg-[#0F172B] rounded-2xl p-5 border border-[#007A7A]/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Speaking
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#0F766E] dark:text-[#1EE1D6]">
                    {canShowApprovedScores && typeof attempt.scores?.speaking?.band === 'number'
                      ? attempt.scores.speaking.band
                      : 'Ms. Như đang check'}
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => openTeacherGradingModal?.(attempt)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0F766E] transition flex items-center gap-1"
                      title="Chỉnh sửa điểm Speaking"
                    >
                      <Edit className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
              </div>
              {canShowApprovedScores ? (
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                  <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 font-sans">FC</span>
                    <strong>{attempt.scores?.speaking?.criteria?.fc ?? '-'}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 font-sans">LR</span>
                    <strong>{attempt.scores?.speaking?.criteria?.lr ?? '-'}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 font-sans">GRA</span>
                    <strong>{attempt.scores?.speaking?.criteria?.gra ?? '-'}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900/70 rounded-lg py-1 border border-indigo-200/70 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 font-sans">PR</span>
                    <strong>{attempt.scores?.speaking?.criteria?.pr ?? '-'}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  File ghi âm đã lưu an toàn - Ms. Như đang check &amp; chấm 4 tiêu chí.
                </p>
              )}
            </div>
          )}
        </div>

        {/* TEST RANKING LEADERBOARD (BXH ĐIỂM SAU KHI HOÀN THÀNH) */}
        {(() => {
          const sameTestAttempts = attempts.filter(
            a => a && a.testId === attempt.testId && (isTeacher || Boolean(a.teacherGraded))
          );
          const bestByStudent = new Map();
          sameTestAttempts.forEach(a => {
            const stuKey = a.studentId || a.studentUsername || a.studentName;
            if (!stuKey) return;
            const bandScore =
              typeof a.overallBand === 'number'
                ? a.overallBand
                : typeof a.scores?.reading?.band === 'number'
                ? a.scores.reading.band
                : typeof a.scores?.listening?.band === 'number'
                ? a.scores.listening.band
                : typeof a.scores?.writing?.overallBand === 'number'
                ? a.scores.writing.overallBand
                : typeof a.scores?.speaking?.band === 'number'
                ? a.scores.speaking.band
                : null;
            if (bandScore === null) return;
            const prev = bestByStudent.get(stuKey);
            const dur = Number(a.durationSeconds) || 999999;
            if (!prev || bandScore > prev.band || (bandScore === prev.band && dur < prev.durationSeconds)) {
              bestByStudent.set(stuKey, {
                studentId: stuKey,
                studentName: a.studentName || stuKey,
                band: bandScore,
                durationSeconds: Number(a.durationSeconds) || 0,
                submittedAt: a.submittedAt || '',
                isCurrentUser: stuKey === (attempt.studentId || currentUser?.username)
              });
            }
          });
          const rankedList = Array.from(bestByStudent.values()).sort(
            (a, b) => b.band - a.band || (a.durationSeconds || 999999) - (b.durationSeconds || 999999)
          );
          if (rankedList.length === 0) return null;
          const myRank = rankedList.findIndex(r => r.studentId === (attempt.studentId || currentUser?.username)) + 1;
          return (
            <div className="bg-amber-50/75 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 mb-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Bảng Xếp Hạng Điểm Bài Thi Này ({rankedList.length} thí sinh)
                </h2>
                {myRank > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black">
                    Hạng hiện tại: #{myRank} / {rankedList.length}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {rankedList.slice(0, 9).map((row, idx) => (
                  <div
                    key={row.studentId}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs ${
                      row.isCurrentUser
                        ? 'bg-[#EDFFFD] dark:bg-teal-950/40 border-[#007A7A] dark:border-[#1EE1D6] ring-1 ring-[#007A7A]/30'
                        : 'bg-white dark:bg-slate-900 border-amber-200/80 dark:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1 flex-wrap">
                        <span>#{idx + 1}</span>
                        <VipMemberName
                          user={usersDb?.[row.studentId] || (row.studentId === currentUser?.username ? currentUser : null)}
                          fallbackName={row.studentName}
                          badgeSize="xs"
                        />
                        {row.isCurrentUser && <span className="text-xs text-[#007A7A] dark:text-[#1EE1D6]">(Bạn)</span>}
                      </p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        {row.durationSeconds > 0 ? formatDurationVi(row.durationSeconds) : row.submittedAt}
                      </p>
                    </div>
                    <span className="font-mono font-black text-sm text-[#007A7A] dark:text-[#1EE1D6] shrink-0 ml-2">
                      {row.band}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* SPEAKING 4 CRITERIA & TEACHER RE-GRADE PANEL */}
        {showSpeakingCard && canShowApprovedScores && (
          <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-[#007A7A]/30 p-5 sm:p-6 mb-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-[#007A7A] text-white text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" /> {isTeacher ? 'Chấm Speaking (GV)' : 'Ms. Như Đã Duyệt Điểm'}
                  </span>
                </div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Bảng Điểm Chi Tiết 4 Tiêu Chí IELTS Speaking
                </h2>
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
                    className="px-4 py-2 text-xs font-extrabold text-white bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-55 rounded-xl transition flex items-center gap-1.5 shadow-sm"
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
                  <p className="text-xs font-bold text-[#475569] dark:text-slate-400">{item.title}</p>
                  <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6] mt-0.5 tabular-nums">
                    {attempt.scores?.speaking?.criteria?.[item.key] ?? '-'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
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
                  <span className="bg-[#007A7A] text-white text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-300" /> AI Examiner (GV)
                  </span>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">Công Cụ Chấm & Chỉnh Sửa Điểm (L · R · W)</h2>
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
                  <span>{aiApiKey ? 'API Key (Đã lưu)' : aiConfigured ? 'API Key (Đồng bộ Server)' : 'Cấu hình API Key'}</span>
                </button>

                <button
                  onClick={() => handleGradeWritingWithAI(attempt)}
                  disabled={isGradingAI}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md ${
                    isGradingAI
                      ? 'bg-slate-300 dark:bg-slate-700 text-[#475569] dark:text-slate-400 cursor-not-allowed'
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
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">Đang phân tích cấu trúc ngữ pháp, từ vựng và tiêu chí chấm điểm IELTS...</p>
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
            {!attempt.teacherGraded ? (
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                    Ms. Như đang check bài làm của bạn
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                    Bài viết và các phần làm bài đã được gửi an toàn tới Ms. Như. Điểm chính thức và nhận xét chi tiết sẽ hiển thị ngay sau khi Ms. Như duyệt và trả bài!
                  </p>
                </div>
              </div>
            ) : writingCriteriaGrid ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bảng Điểm &amp; Chữa Bài Writing Chi Tiết
                  </h2>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                    Ms. Như đã duyệt &amp; trả điểm
                  </span>
                </div>
                {writingCriteriaGrid}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Ms. Như đã duyệt phần Writing: Overall Writing Band <strong>{attempt.scores.writing.overallBand}</strong>.
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Feedback */}
        {attempt.teacherFeedback && canShowApprovedScores && (
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-500/30 mb-8">
            <h2 className="font-bold text-amber-900 dark:text-amber-300 text-sm mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Nhận Xét Từ Ms. Như
            </h2>
            <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-line font-medium">
              {attempt.teacherFeedback}
            </p>
          </div>
        )}

        {/* QUESTION-BY-QUESTION REVIEW & CORRECT ANSWERS SECTION */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" /> Xem Lại Bài Làm & Đáp Án Chi Tiết
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
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
                    ? 'bg-white dark:bg-slate-900 text-[#0F766E] dark:text-[#1EE1D6] shadow-sm'
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
                          <EyeOff className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> Đã ghi nhận câu trả lời
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Student's Answer */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
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
                          <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                            <Unlock className="w-3 h-3" /> Đáp án đúng chuẩn:
                          </span>
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-200">
                            {q.correctAnswer}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[#475569] dark:text-slate-400">
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
              {writingTaskScope !== 'task2' && (
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
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                    Bài làm của thí sinh ({getWordCount(attempt.answers?.w1)} từ):
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                    {attempt.answers?.w1 || '(Chưa nộp bài viết Task 1)'}
                  </p>
                </div>

                {canShowCorrectAnswers ? (
                  targetTest?.writing?.task1?.modelAnswer ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 1):
                      </p>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                        {targetTest.writing.task1.modelAnswer}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold italic">Bài mẫu tham khảo Task 1 đang được khóa bởi Giáo viên.</span>
                  </div>
                )}
              </div>
              )}

              {/* Task 2 */}
              {writingTaskScope !== 'task1' && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">Writing Task 2</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">{targetTest?.writing?.task2?.prompt}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                    Bài làm của thí sinh ({getWordCount(attempt.answers?.w2)} từ):
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                    {attempt.answers?.w2 || '(Chưa nộp bài viết Task 2)'}
                  </p>
                </div>

                {canShowCorrectAnswers ? (
                  targetTest?.writing?.task2?.modelAnswer ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1.5 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bài mẫu tham khảo (Model Answer Task 2):
                      </p>
                      <p className="text-xs text-emerald-950 dark:text-emerald-100 whitespace-pre-line leading-relaxed">
                        {targetTest.writing.task2.modelAnswer}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold italic">Bài mẫu tham khảo Task 2 đang được khóa bởi Giáo viên.</span>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* Speaking Recordings, Transcript & Luyennoi-style AI Fixes Review */}
          {activeReviewTab === 'speaking' && (
            <div className="space-y-4">
              {(attempt.speakingRecordings || []).length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
                  Không có bản ghi âm nào được lưu cho lượt thi này.
                </div>
              ) : (attempt.speakingRecordings || []).map((rec, idx, arr) => (
                <SpeakingQuestionLuyennoiCard
                  key={rec.questionId || idx}
                  rec={rec}
                  idx={idx}
                  totalCount={arr.length}
                  attemptCriteria={attempt.scores?.speaking?.criteria || attempt.speakingAiDetails?.criteria || {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
