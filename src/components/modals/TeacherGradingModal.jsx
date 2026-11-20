import {
  AlertTriangle,
  BookOpen,
  Bot,
  Headphones,
  Loader2,
  Mic,
  PenTool,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';
import {
  calculateAutoBand,
  calculateOverallIeltsBand,
  calculateWritingBand,
  countExtensionCheatSignals,
  getWordCount,
  roundIeltsBand,
  roundWholeBand
} from '../../utils/examHelpers';

function sanitizeBandInput(val) {
  const parsed = parseFloat(val);
  if (!Number.isFinite(parsed)) return 0;
  return roundIeltsBand(Math.max(0, Math.min(9.0, parsed)));
}

function sanitizeWholeBandInput(val) {
  const parsed = parseFloat(val);
  if (!Number.isFinite(parsed)) return 0;
  return roundWholeBand(Math.max(0, Math.min(9, parsed)));
}

function sanitizeRawCount(val, total) {
  const parsed = parseInt(val, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, total > 0 ? Math.min(total, parsed) : parsed);
}

export default function TeacherGradingModal({
  aiGradingStep,
  gradingAttempt,
  gradingScores,
  handleTeacherAIGrade,
  handleTeacherAIGradeSpeaking,
  isGradingAI,
  recalculateObjectiveScores,
  saveTeacherGrading,
  setGradingAttempt,
  setGradingScores
}) {
  if (!gradingAttempt) return null;

  const isSingleSkill = gradingAttempt.testMode === 'single_skill' && Boolean(gradingAttempt.focusSkill);
  const focusSkill = isSingleSkill ? gradingAttempt.focusSkill : null;
  const rawScope =
    gradingAttempt.writingTaskScope ||
    (String(gradingAttempt.dailySubCategory || '').startsWith('w1_')
      ? 'task1'
      : String(gradingAttempt.dailySubCategory || '') === 'w2_essay'
      ? 'task2'
      : 'both');
  const writingTaskScope =
    isSingleSkill && focusSkill === 'writing'
      ? (rawScope === 'task2' ? 'task2' : 'task1')
      : 'both';
  const isSingleSpeakingOnly = isSingleSkill && focusSkill === 'speaking';
  const isSpeakingAttempt =
    isSingleSpeakingOnly ||
    (!isSingleSkill &&
      (Boolean(gradingAttempt.scores?.speaking) ||
        (Array.isArray(gradingAttempt.speakingRecordings) && gradingAttempt.speakingRecordings.length > 0)));
  const showListeningBlock = !isSingleSkill || focusSkill === 'listening';
  const showReadingBlock = !isSingleSkill || focusSkill === 'reading';
  const showWritingBlock = !isSingleSkill || focusSkill === 'writing';

  const logsList = gradingAttempt.antiCheatLogs || [];
  const extSignalsCount = countExtensionCheatSignals(logsList);

  const lTotal = Number(gradingAttempt.scores?.listening?.total) || 0;
  const rTotal = Number(gradingAttempt.scores?.reading?.total) || 0;

  const lRawClean = sanitizeRawCount(gradingScores.listeningRaw, lTotal);
  const rRawClean = sanitizeRawCount(gradingScores.readingRaw, rTotal);

  const previewLBand = sanitizeBandInput(gradingScores.listeningBand);
  const previewRBand = sanitizeBandInput(gradingScores.readingBand);
  const expectedLBand = calculateAutoBand(lRawClean, lTotal, 'listening');
  const expectedRBand = calculateAutoBand(rRawClean, rTotal, 'reading');
  const hasObjectiveMismatch =
    (showListeningBlock && lTotal > 0 && previewLBand !== expectedLBand) ||
    (showReadingBlock && rTotal > 0 && previewRBand !== expectedRBand);

  const previewT1 = sanitizeBandInput(gradingScores.task1Band);
  const previewT2 = sanitizeBandInput(gradingScores.task2Band);
  const previewWriting =
    writingTaskScope === 'task1'
      ? previewT1
      : writingTaskScope === 'task2'
      ? previewT2
      : calculateWritingBand(previewT1, previewT2);
  const previewSpeaking = sanitizeWholeBandInput(gradingScores.speakingBand);

  const previewSkills = [];
  if (showListeningBlock && (lTotal > 0 || focusSkill === 'listening')) previewSkills.push(previewLBand);
  if (showReadingBlock && (rTotal > 0 || focusSkill === 'reading')) previewSkills.push(previewRBand);
  if (showWritingBlock) previewSkills.push(previewWriting);
  if (isSpeakingAttempt) previewSkills.push(previewSpeaking);
  const previewOverall = calculateOverallIeltsBand(previewSkills);

  const handleObjectiveRawChange = (skill, total, rawInput) => {
    if (rawInput === '') {
      setGradingScores(prev => ({ ...prev, [`${skill}Raw`]: '' }));
      return;
    }
    const clampedRaw = sanitizeRawCount(rawInput, total);
    const autoBand = calculateAutoBand(clampedRaw, total, skill);
    setGradingScores(prev => ({
      ...prev,
      [`${skill}Raw`]: clampedRaw,
      [`${skill}Band`]: autoBand
    }));
  };

  const handleBandBlur = (field, integerOnly = false) => {
    setGradingScores(prev => ({
      ...prev,
      [field]: integerOnly ? sanitizeWholeBandInput(prev[field]) : sanitizeBandInput(prev[field])
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Chấm & Sửa Điểm: {gradingAttempt.studentName}</span>
              {gradingAttempt.aiGraded && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30">
                  <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> AI Graded
                </span>
              )}
            </h3>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              {gradingAttempt.testTitle} - {gradingAttempt.submittedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGradingAttempt(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Cheat Log Detail */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-2xl mb-6 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Nhật Ký Vi Phạm Chống Gian Lận (Stealth Log)
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded font-mono">
                Lượt rời màn hình: {gradingAttempt.tabSwitchCount}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded font-mono border ${
                  extSignalsCount > 0
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Dấu hiệu Extension / Lách luật: {extSignalsCount}
              </span>
            </div>
          </div>
          {logsList.length === 0 ? (
            <p className="text-xs text-emerald-400">
              Không ghi nhận vi phạm rời màn hình, khóa tương tác hay dấu hiệu Extension/lách luật nào trong suốt quá trình làm bài.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 text-xs text-slate-300">
              {logsList.map((log, idx) => {
                const isExtOrHigh = log?.category === 'extension' || log?.severity === 'high';
                const isInteraction = log?.category === 'interaction';
                const skillColor = isExtOrHigh
                  ? 'text-rose-300'
                  : isInteraction
                    ? 'text-sky-300'
                    : 'text-amber-300';
                const rowClass = isExtOrHigh
                  ? 'border-rose-900/60 bg-rose-950/30 px-2 py-1 rounded text-rose-100'
                  : 'border-slate-800 pb-1';
                return (
                  <div key={idx} className={`flex justify-between border-b ${rowClass}`}>
                    <span>
                      [{log.timestamp}] Skill: <strong className={`${skillColor} uppercase`}>{log.skill}</strong> - {log.event}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Listening & Reading Score Editor */}
        {(showListeningBlock || showReadingBlock) && (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {showListeningBlock && showReadingBlock
                  ? 'Chỉnh Sửa Điểm Listening & Reading (Band 0.0 - 9.0)'
                  : showListeningBlock
                  ? 'Chỉnh Sửa Điểm Bài Tập Listening (Band 0.0 - 9.0)'
                  : 'Chỉnh Sửa Điểm Bài Tập Reading (Band 0.0 - 9.0)'}
              </h4>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Đổi số câu đúng sẽ tự quy đổi Band chuẩn IELTS, hoặc giáo viên có thể nhập Band trực tiếp (`0` = bỏ trống / 0 câu đúng).
              </p>
            </div>
            <button
              type="button"
              onClick={recalculateObjectiveScores}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/40 flex items-center gap-1.5 transition shadow-sm shrink-0"
              title="Chấm lại số câu đúng từ đáp án đã nộp và áp dụng bảng quy đổi IELTS 0.0-9.0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Quy Đổi Chuẩn IELTS ({showListeningBlock && showReadingBlock ? 'L/R' : showListeningBlock ? 'Listening' : 'Reading'})
            </button>
          </div>

          {hasObjectiveMismatch && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                {showListeningBlock && showReadingBlock ? (
                  <>
                    Điểm Band L/R đang nhập (<strong>{previewLBand}</strong> / <strong>{previewRBand}</strong>) đang khác mức quy đổi chuẩn từ số câu đúng (<strong>{expectedLBand}</strong> cho {lRawClean}/{lTotal} câu L · <strong>{expectedRBand}</strong> cho {rRawClean}/{rTotal} câu R).
                  </>
                ) : showListeningBlock ? (
                  <>
                    Điểm Band Listening đang nhập (<strong>{previewLBand}</strong>) đang khác mức quy đổi chuẩn từ số câu đúng (<strong>{expectedLBand}</strong> cho {lRawClean}/{lTotal} câu Listening).
                  </>
                ) : (
                  <>
                    Điểm Band Reading đang nhập (<strong>{previewRBand}</strong>) đang khác mức quy đổi chuẩn từ số câu đúng (<strong>{expectedRBand}</strong> cho {rRawClean}/{rTotal} câu Reading).
                  </>
                )}{' '}
                Bạn có thể bấm <b>Quy Đổi Chuẩn IELTS</b> để cập nhật ngay hoặc giữ nguyên điểm chỉnh tay.
              </span>
            </div>
          )}

          <div className={`grid grid-cols-1 ${showListeningBlock && showReadingBlock ? 'md:grid-cols-2' : 'max-w-lg'} gap-4`}>
            {/* Listening Card */}
            {showListeningBlock && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Listening
                </span>
                <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                  Thang chuẩn: {expectedLBand} ({lRawClean}/{lTotal} câu)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Số câu đúng (/ {lTotal})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={lTotal > 0 ? lTotal : undefined}
                    step="1"
                    value={gradingScores.listeningRaw}
                    onChange={e => handleObjectiveRawChange('listening', lTotal, e.target.value)}
                    onBlur={() => setGradingScores(prev => ({ ...prev, listeningRaw: sanitizeRawCount(prev.listeningRaw, lTotal) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Listening Band (0 - 9.0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={gradingScores.listeningBand}
                    onChange={e => setGradingScores(prev => ({ ...prev, listeningBand: e.target.value }))}
                    onBlur={() => handleBandBlur('listeningBand')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#007A7A]/50 dark:border-teal-500/40 rounded-lg text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Reading Card */}
            {showReadingBlock && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#1447E6] dark:text-blue-400" /> Reading
                </span>
                <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                  Thang chuẩn: {expectedRBand} ({rRawClean}/{rTotal} câu)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Số câu đúng (/ {rTotal})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={rTotal > 0 ? rTotal : undefined}
                    step="1"
                    value={gradingScores.readingRaw}
                    onChange={e => handleObjectiveRawChange('reading', rTotal, e.target.value)}
                    onBlur={() => setGradingScores(prev => ({ ...prev, readingRaw: sanitizeRawCount(prev.readingRaw, rTotal) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Reading Band (0 - 9.0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={gradingScores.readingBand}
                    onChange={e => setGradingScores(prev => ({ ...prev, readingBand: e.target.value }))}
                    onBlur={() => handleBandBlur('readingBand')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-500/40 rounded-lg text-xs font-extrabold text-[#1447E6] dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Speaking Audio Recordings & 4-Criteria Score Editor */}
        {isSpeakingAttempt && (
          <div className="bg-indigo-50/75 dark:bg-indigo-950/25 border border-[#007A7A]/30 rounded-2xl p-5 mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Bài Ghi Âm &amp; Điểm Speaking AI
              </h4>
              <button
                type="button"
                onClick={() => handleTeacherAIGradeSpeaking?.(gradingAttempt)}
                disabled={isGradingAI}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-55 text-white flex items-center gap-1.5 shadow-sm transition"
              >
                {isGradingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isGradingAI ? 'Đang nghe & chấm AI...' : '✨ AI Chấm Lại Từ Ghi Âm'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: 'speakingFc', label: 'Fluency (FC)' },
                { key: 'speakingLr', label: 'Lexical (LR)' },
                { key: 'speakingGra', label: 'Grammar (GRA)' },
                { key: 'speakingPr', label: 'Pronun (PR)' },
                { key: 'speakingBand', label: 'Speaking Overall' }
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="9"
                    value={gradingScores[f.key] ?? 0}
                    onChange={e => setGradingScores(prev => ({ ...prev, [f.key]: e.target.value }))}
                    onBlur={() => handleBandBlur(f.key, true)}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#007A7A] ${
                      f.key === 'speakingBand'
                        ? 'border-[#007A7A] text-[#0F766E] dark:text-[#1EE1D6]'
                        : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {(gradingAttempt.speakingRecordings || []).map((rec, idx) => (
                <div key={rec.questionId || idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Part {rec.part || 1} • Câu {idx + 1}: {rec.prompt}
                    </span>
                    <span className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] shrink-0">
                      {rec.durationSec || 0}s • Band {rec.band ?? '-'}
                    </span>
                  </div>
                  {rec.audioUrl ? (
                    <audio controls src={rec.audioUrl} className="w-full h-9" />
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">Chưa có file ghi âm cho câu này.</p>
                  )}
                  {rec.transcript && (
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      <strong>Transcript:</strong> {rec.transcript}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Writing Submissions */}
        {showWritingBlock && (
        <div className="space-y-4 mb-6">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Bài Viết Của Học Sinh</h4>

          {writingTaskScope !== 'task2' && (
          <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">
              Writing Task 1 ({getWordCount(gradingAttempt.answers?.w1)} từ)
            </p>
            <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {gradingAttempt.answers?.w1 || 'Không có bài làm'}
            </div>
          </div>
          )}

          {writingTaskScope !== 'task1' && (
          <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">
              Writing Task 2 ({getWordCount(gradingAttempt.answers?.w2)} từ)
            </p>
            <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {gradingAttempt.answers?.w2 || 'Không có bài làm'}
            </div>
          </div>
          )}
        </div>
        )}

        {/* Writing Grading input OR General Feedback */}
        <div className="bg-[#EDFFFD]/50 dark:bg-[#003538]/30 border border-[#B5F5F1] dark:border-teal-500/30 rounded-2xl p-5 mb-6 space-y-4">
          {showWritingBlock && (
          <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#059271] dark:text-emerald-400" />
              Nhập Điểm Chấm Kỹ Năng Writing (Band 0.0 – 9.0)
            </h4>

            <button
              type="button"
              onClick={() => handleTeacherAIGrade(gradingAttempt)}
              disabled={isGradingAI}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                isGradingAI
                  ? 'bg-slate-300 dark:bg-slate-700 text-[#475569] dark:text-slate-400 cursor-not-allowed'
                  : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
              }`}
            >
              {isGradingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Đang Chấm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>✨ AI Gợi Ý Chấm Điểm</span>
                </>
              )}
            </button>
          </div>

          {isGradingAI && (
            <div className="p-3 bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 rounded-lg flex items-center gap-3 text-xs text-[#003538] dark:text-[#1EE1D6]">
              <Loader2 className="w-4 h-4 animate-spin text-[#007A7A] dark:text-[#1EE1D6] flex-shrink-0" />
              <span>{aiGradingStep || 'AI đang phân tích bài thi và điền tự động điểm số & nhận xét...'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {writingTaskScope !== 'task2' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 1 Band Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={gradingScores.task1Band}
                onChange={e => setGradingScores(prev => ({ ...prev, task1Band: e.target.value }))}
                onBlur={() => handleBandBlur('task1Band')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            )}

            {writingTaskScope !== 'task1' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 2 Band Score</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={gradingScores.task2Band}
                onChange={e => setGradingScores(prev => ({ ...prev, task2Band: e.target.value }))}
                onBlur={() => handleBandBlur('task2Band')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            )}
          </div>
          </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhận Xét & Ghi Chú Của Giáo Viên</label>
            <textarea
              rows={4}
              placeholder="Viết nhận xét chi tiết cho học sinh..."
              value={gradingScores.feedback}
              onChange={e => setGradingScores(prev => ({ ...prev, feedback: e.target.value }))}
              className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
            />
          </div>
        </div>

        {/* Live Overall Summary Preview */}
        <div className="bg-slate-900 dark:bg-slate-800/90 text-white rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {showListeningBlock && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 font-semibold">
                Listening: <strong className="text-[#1EE1D6]">{previewLBand}</strong>
              </span>
            )}
            {showReadingBlock && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 font-semibold">
                Reading: <strong className="text-sky-400">{previewRBand}</strong>
              </span>
            )}
            {showWritingBlock && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 font-semibold">
                Writing: <strong className="text-emerald-400">{previewWriting}</strong>
              </span>
            )}
            {isSpeakingAttempt && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 font-semibold">
                Speaking: <strong className="text-[#1EE1D6]">{previewSpeaking}</strong>
              </span>
            )}
          </div>
          <div className="text-xs font-bold flex items-center gap-2">
            <span className="text-slate-400 uppercase tracking-wider">Band Overall Dự Kiến:</span>
            <span className="text-lg font-extrabold text-[#1EE1D6] bg-slate-800 dark:bg-slate-900 px-3 py-0.5 rounded-xl border border-teal-500/40">
              {previewOverall}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setGradingAttempt(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Hủy
          </button>
          {!gradingAttempt.teacherGraded && !isSingleSpeakingOnly && showListeningBlock && showReadingBlock && (
            <button
              type="button"
              onClick={() => saveTeacherGrading({ includeWriting: false })}
              className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl transition flex items-center gap-1.5"
              title="Lưu riêng điểm Listening & Reading đã sửa, giữ nguyên trạng thái Chờ Duyệt"
            >
              <Save className="w-3.5 h-3.5" /> Chỉ Lưu L &amp; R (Chưa Duyệt Trả Điểm)
            </button>
          )}
          <button
            type="button"
            onClick={() => saveTeacherGrading({ includeWriting: showWritingBlock })}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Duyệt &amp; Trả Điểm Cho Học Sinh
          </button>
        </div>
      </div>
    </div>
  );
}
