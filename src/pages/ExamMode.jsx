import { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  GraduationCap,
  Headphones,
  Lock,
  MessageSquare,
  Moon,
  PenTool,
  Play,
  Send,
  Sun,
  Volume2,
  X
} from 'lucide-react';
import {
  getListeningAudioKey,
  getListeningTracks,
  getReadingPassages,
  normalizeExamConfig
} from '../constants/seedData';
import { extractBlankNumbers } from '../utils/clozeHelpers';
import { getWordCount } from '../utils/examHelpers';
import ClozeNoteSheet from '../components/exam/ClozeNoteSheet';

export default function ExamMode({
  addHighlight,
  addNote,
  advanceToNextExamSection,
  audioProgress = { currentTime: 0, duration: 0 },
  darkMode,
  examState,
  handleFinalExamSubmit,
  handlePassageTextSelect,
  handlePlayListeningAudio,
  isPlayingAudio,
  onExitMissingTest,
  playingAudioKey,
  selectedPassageText,
  selectedTestId,
  setDarkMode,
  setExamState,
  setShowSubmitConfirmModal,
  setZoomedReadingImg,
  showSubmitConfirmModal,
  stopExamAudio,
  tests
}) {
  const [activeBlankNum, setActiveBlankNum] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  const blankInputRefs = useRef({});
  const questionCardRefs = useRef({});

  const activeTest = tests.find(t => t.id === selectedTestId);
  if (!activeTest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020618] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/60 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white mb-2">
            Đang khôi phục phiên làm bài...
          </h2>
          <p className="text-xs text-[#62748E] dark:text-slate-400 leading-relaxed mb-5">
            Dữ liệu đáp án của bạn đã được lưu tạm an toàn trên trình duyệt. Nếu đề thi chưa tự hiển thị sau vài giây đồng bộ, hãy quay về trang chính để chọn lại đề và tiếp tục từ vị trí cũ.
          </p>
          <button
            type="button"
            onClick={onExitMissingTest}
            className="w-full py-2.5 px-4 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-bold transition shadow-md"
          >
            Quay về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const cfg = normalizeExamConfig(activeTest);
  const currentSectionIdx =
    typeof examState.sectionIdx === 'number'
      ? Math.min(Math.max(0, examState.sectionIdx), cfg.order.length - 1)
      : Math.max(0, cfg.order.indexOf(examState.skill));
  const skillMeta = {
    listening: { label: 'Listening', icon: Headphones },
    reading: { label: 'Reading', icon: BookOpen },
    writing: { label: 'Writing', icon: PenTool }
  };

  const readingPassages = getReadingPassages(activeTest.reading);
  const safePassageIdx = Math.min(Math.max(0, examState.readingPassageIdx || 0), readingPassages.length - 1);
  const activePassage = readingPassages[safePassageIdx];
  const allReadingQs = activeTest.reading?.questions || [];
  const hasScopedReadingQs = allReadingQs.some(q => typeof q.passageIdx === 'number');
  const displayedReadingQs =
    readingPassages.length > 1 && hasScopedReadingQs && !examState.showAllReadingQs
      ? allReadingQs.filter(q => typeof q.passageIdx !== 'number' || q.passageIdx === safePassageIdx)
      : allReadingQs;

  const listeningTracks = getListeningTracks(activeTest.listening);
  const safeTrackIdx = Math.min(Math.max(0, examState.listeningTrackIdx || 0), listeningTracks.length - 1);
  const activeTrack = listeningTracks[safeTrackIdx];
  const activeTrackPlayKey = getListeningAudioKey(activeTrack, safeTrackIdx);
  const allListeningQs = activeTest.listening?.questions || [];
  const hasScopedListeningQs = allListeningQs.some(q => typeof q.trackIdx === 'number');
  const displayedListeningQs =
    listeningTracks.length > 1 && hasScopedListeningQs && !examState.showAllListeningQs
      ? allListeningQs.filter(q => typeof q.trackIdx !== 'number' || q.trackIdx === safeTrackIdx)
      : allListeningQs;

  const formatTime = (seconds) => {
    const safeSec = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(safeSec / 60);
    const s = safeSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const visitedSkillsList = Array.from(new Set([...(examState.visitedSkills || []), examState.skill]));
  const visitedInOrderCount = cfg.order.filter(sId => visitedSkillsList.includes(sId)).length;
  const allSkillsVisited = cfg.order.every(sId => visitedSkillsList.includes(sId));
  const unvisitedLabels = cfg.order
    .filter(sId => !visitedSkillsList.includes(sId))
    .map(sId => skillMeta[sId]?.label || sId);

  const answeredListeningCount = allListeningQs.filter(q => String(examState.answers[q.id] || '').trim().length > 0).length;
  const answeredReadingCount = allReadingQs.filter(q => String(examState.answers[q.id] || '').trim().length > 0).length;
  const w1Words = getWordCount(examState.answers.w1);
  const w2Words = getWordCount(examState.answers.w2);

  // Filter standalone question cards so fill blanks already present in ClozeNoteSheet are never rendered twice
  const activeListeningCloze = activeTrack?.clozeText || '';
  const listeningClozeSet = new Set(extractBlankNumbers(activeListeningCloze));
  const standaloneListeningQs = displayedListeningQs.filter(
    q => !(q.type === 'fill' && typeof q.blankNum === 'number' && listeningClozeSet.has(q.blankNum))
  );

  const activeReadingCloze = activePassage?.clozeText || '';
  const readingClozeSet = new Set(extractBlankNumbers(activeReadingCloze));
  const standaloneReadingQs = displayedReadingQs.filter(
    q => !(q.type === 'fill' && typeof q.blankNum === 'number' && readingClozeSet.has(q.blankNum))
  );

  const listeningNeedsLeftPane = Boolean(activeTrack?.imageUrl || activeTrack?.contextText);

  const scrollToQuestionOrBlank = (q, fallbackIdx) => {
    setActiveQuestionId(q.id);
    const blankTarget = typeof q.blankNum === 'number' ? q.blankNum : null;
    if (blankTarget && blankInputRefs.current[blankTarget]) {
      setActiveBlankNum(blankTarget);
      const inputEl = blankInputRefs.current[blankTarget];
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputEl.focus({ preventScroll: true });
      return;
    }
    const cardEl = questionCardRefs.current[q.id];
    if (cardEl) {
      setActiveBlankNum(null);
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const innerInput = cardEl.querySelector('input[type="text"]');
      if (innerInput) innerInput.focus({ preventScroll: true });
    } else {
      setActiveBlankNum(blankTarget || fallbackIdx + 1);
    }
  };

  // Bottom navigator dataset (Listening Parts or Reading Passages)
  const navParts =
    examState.skill === 'listening'
      ? listeningTracks.map((tr, idx) => {
          const partQs = hasScopedListeningQs
            ? allListeningQs.filter(q => typeof q.trackIdx !== 'number' || q.trackIdx === idx)
            : allListeningQs;
          return { idx, label: listeningTracks.length > 1 ? `Part ${idx + 1}` : 'Listening', questions: partQs };
        })
      : examState.skill === 'reading'
      ? readingPassages.map((p, idx) => {
          const partQs = hasScopedReadingQs
            ? allReadingQs.filter(q => typeof q.passageIdx !== 'number' || q.passageIdx === idx)
            : allReadingQs;
          return { idx, label: readingPassages.length > 1 ? `Passage ${idx + 1}` : 'Reading', questions: partQs };
        })
      : [];

  const activePartIdx = examState.skill === 'listening' ? safeTrackIdx : safePassageIdx;
  const activePartQs = navParts[activePartIdx]?.questions || [];

  const handleStepQuestion = (delta) => {
    if (activePartQs.length === 0) return;
    const currentIdx = activePartQs.findIndex(q => q.id === activeQuestionId);
    const nextIdx =
      currentIdx === -1
        ? delta > 0
          ? 0
          : activePartQs.length - 1
        : Math.max(0, Math.min(activePartQs.length - 1, currentIdx + delta));
    const targetQ = activePartQs[nextIdx];
    if (targetQ) scrollToQuestionOrBlank(targetQ, nextIdx);
  };

  const renderQuestionCard = (q, displayNum, scopeSetterField) => (
    <div
      key={q.id}
      ref={el => {
        if (el) questionCardRefs.current[q.id] = el;
      }}
      onClick={() => {
        setActiveQuestionId(q.id);
        setActiveBlankNum(typeof q.blankNum === 'number' ? q.blankNum : null);
      }}
      className={`p-4 sm:p-5 rounded-2xl border transition ${
        activeQuestionId === q.id
          ? 'bg-[#EDFFFD]/60 dark:bg-[#003538]/30 border-[#007A7A] dark:border-[#1EE1D6] shadow-xs'
          : 'bg-slate-50 dark:bg-slate-800/55 border-slate-200 dark:border-slate-700/90'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-bold text-[#0F172B] dark:text-slate-100 text-xs sm:text-sm leading-relaxed">
          {q.question}
        </p>
        {scopeSetterField === 'listening' && typeof q.trackIdx === 'number' && listeningTracks.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setExamState(prev => ({
                ...prev,
                listeningTrackIdx: Math.min(q.trackIdx, listeningTracks.length - 1)
              }));
            }}
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30"
          >
            Part {q.trackIdx + 1}
          </button>
        )}
        {scopeSetterField === 'reading' && typeof q.passageIdx === 'number' && readingPassages.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setExamState(prev => ({ ...prev, readingPassageIdx: q.passageIdx }));
            }}
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30"
          >
            Bài {q.passageIdx + 1}
          </button>
        )}
      </div>

      {(q.type === 'mcq' || q.type === 'tfng') && (
        <div className="space-y-1.5">
          {(q.options || []).map((opt, optIdx) => {
            const isSelected = examState.answers[q.id] === opt;
            return (
              <label
                key={optIdx}
                className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-[#EDFFFD] dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6]'
                    : 'hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name={`${scopeSetterField}_q_${q.id}`}
                  value={opt}
                  checked={isSelected}
                  onChange={e =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [q.id]: e.target.value }
                    }))
                  }
                  className="mt-0.5 text-[#007A7A] focus:ring-[#007A7A]"
                />
                <span className="text-xs sm:text-[13px] text-[#0F172B] dark:text-slate-200 font-medium">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {q.type === 'fill' && (
        <input
          type="text"
          placeholder={`Câu ${Number(String(q.question || '').trim().match(/^(?:Câu\s*)?(\d+)[.)]/i)?.[1]) || displayNum}: Nhập đáp án...`}
          value={examState.answers[q.id] || ''}
          onChange={e =>
            setExamState(prev => ({
              ...prev,
              answers: { ...prev.answers, [q.id]: e.target.value }
            }))
          }
          className="w-full max-w-md px-4 py-2 bg-white dark:bg-[#0B1117] text-[#0F172B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-full text-xs sm:text-sm font-semibold focus:border-[#007A7A] dark:focus:border-[#1EE1D6] focus:ring-2 focus:ring-[#00B2AD]/30 focus:outline-none"
        />
      )}
    </div>
  );

  const audioPercent =
    audioProgress.duration > 0
      ? Math.min(100, Math.round((audioProgress.currentTime / audioProgress.duration) * 100))
      : isPlayingAudio
      ? 42
      : 0;

  return (
    <div
      onContextMenu={cfg.antiCheatEnabled ? (e) => e.preventDefault() : undefined}
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1117] text-[#0F172B] dark:text-slate-100 flex flex-col justify-between select-none transition-colors"
    >
      {/* LexiPrep Computer-Delivered Exam Header */}
      <header className="bg-white dark:bg-[#111820] text-[#0F172B] dark:text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/90 shadow-xs sticky top-0 z-50">
        {/* Left: Monogram + Title + Skill Tabs */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-[#007A7A] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-sm tracking-tight hidden sm:inline">LexiPrep</span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          </div>
          <h2 className="font-bold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[260px]" title={activeTest.title}>
            {activeTest.title}
          </h2>

          {/* Skill Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-[11px] gap-1 border border-slate-200/80 dark:border-slate-700">
            {cfg.order.map((sId, idx) => {
              const meta = skillMeta[sId] || { label: sId, icon: BookOpen };
              const IconComp = meta.icon;
              const isCurrent = examState.skill === sId && idx === currentSectionIdx;
              const isDone = cfg.sequentialMode && idx < currentSectionIdx;
              const isLocked = cfg.sequentialMode && idx !== currentSectionIdx;
              const isVisited = visitedSkillsList.includes(sId);

              return (
                <button
                  key={sId}
                  type="button"
                  disabled={isLocked}
                  title={
                    isLocked
                      ? `Chế độ tuần tự: Hết giờ ${skillMeta[examState.skill]?.label || ''} hệ thống tự chuyển phần.`
                      : `Kỹ năng ${meta.label} (${cfg.durations[sId]} phút)${isVisited ? ' • Đã xem' : ''}`
                  }
                  onClick={() => {
                    if (isLocked || isCurrent) return;
                    stopExamAudio();
                    setActiveBlankNum(null);
                    setActiveQuestionId(null);
                    setExamState(prev => ({
                      ...prev,
                      skill: sId,
                      sectionIdx: idx,
                      visitedSkills: Array.from(new Set([...(prev.visitedSkills || [prev.skill]), sId]))
                    }));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    isCurrent
                      ? 'bg-[#007A7A] text-white shadow-xs'
                      : isDone
                      ? 'text-[#059271] dark:text-emerald-400 cursor-not-allowed opacity-85'
                      : isLocked
                      ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  <span>{meta.label}</span>
                  {isLocked && !isDone && <Lock className="w-2.5 h-2.5 opacity-70" />}
                  {(isDone || (!isLocked && !isCurrent && isVisited)) && <Check className="w-3 h-3 text-[#059271] dark:text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Countdown */}
        <div
          className={`flex items-center gap-2 font-mono font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border ${
            examState.timeRemaining <= 60
              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/50 animate-pulse'
              : 'bg-slate-50 dark:bg-slate-900 text-[#0F172B] dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
          title={cfg.sequentialMode ? 'Hết giờ kỹ năng sẽ tự chuyển sang phần tiếp theo' : 'Thời gian còn lại'}
        >
          <Clock className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
          <span>{formatTime(examState.timeRemaining)}</span>
          <span className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 hidden xl:inline">
            remaining
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {cfg.sequentialMode && cfg.allowEarlyNextSection && currentSectionIdx < cfg.order.length - 1 && (
            <button
              type="button"
              onClick={() => advanceToNextExamSection(false)}
              className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
            >
              <span>Phần Tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {(examState.highlights.length > 0 || examState.notes.length > 0) && (
            <button
              type="button"
              onClick={() => setShowNotesDrawer(v => !v)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 flex items-center gap-1.5 transition"
              title="Xem ghi chú & highlight đã lưu"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{examState.highlights.length + examState.notes.length}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            title={darkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}
            aria-label={darkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#007A7A]" />}
          </button>

          <button
            type="button"
            disabled={!allSkillsVisited}
            onClick={() => {
              if (!allSkillsVisited) return;
              setShowSubmitConfirmModal(true);
            }}
            title={
              allSkillsVisited
                ? 'Bấm để xác nhận nộp bài thi'
                : `Bạn cần xem hết cả ${cfg.order.length} kỹ năng (${unvisitedLabels.join(', ')}) mới có thể nộp bài.`
            }
            className={`font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 border ${
              allSkillsVisited
                ? 'bg-[#059271] hover:bg-emerald-700 text-white border-[#059271] cursor-pointer shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            {!allSkillsVisited ? <Lock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>
              {allSkillsVisited ? 'Submit' : `Nộp (${visitedInOrderCount}/${cfg.order.length})`}
            </span>
          </button>
        </div>
      </header>

      {/* Collapsible Highlights & Notes Drawer */}
      {showNotesDrawer && (examState.highlights.length > 0 || examState.notes.length > 0) && (
        <div className="bg-white dark:bg-[#111820] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Highlight &amp; Notes:</span>
          {examState.highlights.map(h => (
            <span key={h.id} style={{ backgroundColor: h.color }} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium truncate max-w-[160px] text-slate-900 shrink-0">
              {h.text}
            </span>
          ))}
          {examState.notes.map(n => (
            <span key={n.id} className="bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[180px] border border-[#B5F5F1] dark:border-teal-500/30 shrink-0">
              📝 {n.note}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setShowNotesDrawer(false)}
            className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Horizontal Listening Audio Bar (Sleek LexiPrep Computer-Delivered Bar) */}
      {examState.skill === 'listening' && (
        <div className="bg-slate-50/90 dark:bg-[#0D1319] border-b border-slate-200/90 dark:border-slate-800/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Multi-Part Pills if >1 track */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {listeningTracks.length > 1 ? (
                listeningTracks.map((tr, trIdx) => {
                  const trKey = getListeningAudioKey(tr, trIdx);
                  const trPlays = examState.audioPlays[trKey] || 0;
                  const maxPlays = activeTest.maxAudioPlays || 1;
                  const isPlayingThis = isPlayingAudio && playingAudioKey === trKey;
                  const isSelected = trIdx === safeTrackIdx;

                  return (
                    <button
                      key={tr.id || trIdx}
                      type="button"
                      onClick={() => {
                        setActiveBlankNum(null);
                        setActiveQuestionId(null);
                        setExamState(prev => ({ ...prev, listeningTrackIdx: trIdx }));
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#007A7A] text-white border-[#007A7A]'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                      }`}
                    >
                      <span>{tr.title || `Part ${trIdx + 1}`}</span>
                      <span className="text-[10px] font-mono opacity-85">
                        {isPlayingThis ? '▶' : `${trPlays}/${maxPlays}`}
                      </span>
                    </button>
                  );
                })
              ) : (
                <span className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-1.5">
                  <Headphones className="w-4 h-4" />
                  <span>{activeTrack?.title || 'Listening Section'}</span>
                </span>
              )}
            </div>

            {/* Signature Centered Progress Strip & No-Rewind Play Control */}
            <div className="flex items-center gap-3 flex-1 justify-center min-w-[240px]">
              <button
                type="button"
                onClick={() => handlePlayListeningAudio(activeTrackPlayKey, activeTrack?.transcript || '', activeTrack?.audioUrl || '')}
                disabled={(examState.audioPlays[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays || isPlayingAudio}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                  (examState.audioPlays[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : isPlayingAudio
                    ? 'bg-[#007A7A]/20 text-[#007A7A] dark:text-[#1EE1D6] border border-[#00B2AD]/40 animate-pulse cursor-wait'
                    : 'bg-[#007A7A] hover:bg-[#065B5B] text-white shadow-xs'
                }`}
              >
                {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>
                  {isPlayingAudio && playingAudioKey === activeTrackPlayKey
                    ? 'Đang Phát'
                    : (examState.audioPlays[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays
                    ? 'Đã Nghe Hết'
                    : 'Phát Audio'}
                </span>
              </button>

              <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-[#00B2AD] rounded-full transition-all duration-300 ${
                      isPlayingAudio && audioProgress.duration === 0 ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${audioPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                  {audioProgress.duration > 0
                    ? `${formatTime(audioProgress.currentTime)} / ${formatTime(audioProgress.duration)}`
                    : `${examState.audioPlays[activeTrackPlayKey] || 0}/${activeTest.maxAudioPlays}`}
                </span>
              </div>
            </div>

            {selectedPassageText && (
              <div className="flex items-center gap-1.5 bg-[#0F172B] text-white px-3 py-1 rounded-full text-xs shadow-md">
                <span className="text-[10px] text-slate-300">Highlight:</span>
                <button onClick={() => addHighlight('#fef08a')} className="w-3.5 h-3.5 rounded-full bg-yellow-300 hover:scale-110 transition" title="Vàng" />
                <button onClick={() => addHighlight('#bbf7d0')} className="w-3.5 h-3.5 rounded-full bg-emerald-300 hover:scale-110 transition" title="Xanh lá" />
                <button onClick={addNote} className="ml-1 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-[10px] text-[#1EE1D6]">
                  <MessageSquare className="w-3 h-3" /> Ghi chú
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Computer-Delivered Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 overflow-y-auto">
        {/* LISTENING WORKSPACE */}
        {examState.skill === 'listening' && (
          <div className={listeningNeedsLeftPane ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[71vh]' : 'max-w-5xl mx-auto space-y-6'}>
            {/* Optional Diagram / Map / Context Left Pane (only if track has image/context) */}
            {listeningNeedsLeftPane && (
              <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col overflow-hidden shadow-xs">
                <h3 className="font-extrabold text-[#0F172B] dark:text-white text-sm sm:text-base mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  {activeTrack?.title || `Chủ đề ${safeTrackIdx + 1}`}
                </h3>
                <div
                  onMouseUp={handlePassageTextSelect}
                  className="flex-1 overflow-y-auto pr-2 text-[#314158] dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
                >
                  {activeTrack?.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
                      <img
                        src={activeTrack.imageUrl}
                        alt={`Listening Diagram ${safeTrackIdx + 1}`}
                        onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                        className="w-full max-h-[48vh] object-contain rounded-lg mx-auto cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                        className="mt-2 mx-auto flex items-center gap-1.5 text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline font-sans"
                      >
                        <Eye className="w-3.5 h-3.5" /> Phóng to ảnh / sơ đồ
                      </button>
                    </div>
                  )}
                  {activeTrack?.contextText}
                </div>
              </div>
            )}

            {/* Right / Centered Question Sheet (Cloze Note Completion + Standalone Questions) */}
            <div className={`${listeningNeedsLeftPane ? 'bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col overflow-y-auto shadow-xs' : ''} space-y-5`}>
              {listeningTracks.length > 1 && hasScopedListeningQs && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6]">
                    {activeTrack?.title || `Part ${safeTrackIdx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExamState(prev => ({ ...prev, showAllListeningQs: !prev.showAllListeningQs }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    {examState.showAllListeningQs ? `Chỉ xem Part ${safeTrackIdx + 1}` : `Xem tất cả (${allListeningQs.length})`}
                  </button>
                </div>
              )}

              {/* Inline Cloze / Note Completion Box */}
              {activeListeningCloze.trim() && (
                <ClozeNoteSheet
                  activeBlankNum={activeBlankNum}
                  answers={examState.answers}
                  clozeText={activeListeningCloze}
                  inputRefs={blankInputRefs}
                  onAnswerChange={(qId, val) =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [qId]: val }
                    }))
                  }
                  onBlankFocus={(num, qId) => {
                    setActiveBlankNum(num);
                    if (qId) setActiveQuestionId(qId);
                  }}
                  onPassageTextSelect={handlePassageTextSelect}
                  questions={allListeningQs}
                  scopeField="trackIdx"
                  scopeIdx={safeTrackIdx}
                />
              )}

              {/* Remaining / Non-cloze Questions */}
              {standaloneListeningQs.length > 0 ? (
                <div className="space-y-4">
                  {standaloneListeningQs.map((q, idx) => renderQuestionCard(q, idx + 1, 'listening'))}
                </div>
              ) : !activeListeningCloze.trim() ? (
                <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Chưa có câu hỏi gắn cho Part {safeTrackIdx + 1}.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* READING WORKSPACE */}
        {examState.skill === 'reading' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[75vh]">
            {/* Left Split: Passage Viewer + Highlight Toolbar */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col overflow-hidden shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {readingPassages.map((p, pIdx) => (
                    <button
                      key={p.id || pIdx}
                      type="button"
                      onClick={() => {
                        setActiveBlankNum(null);
                        setActiveQuestionId(null);
                        setExamState(prev => ({ ...prev, readingPassageIdx: pIdx }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border ${
                        pIdx === safePassageIdx
                          ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                          pIdx === safePassageIdx
                            ? 'bg-white text-[#007A7A]'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {pIdx + 1}
                      </span>
                      <span className="max-w-[140px] truncate">{p.title || `Bài ${pIdx + 1}`}</span>
                    </button>
                  ))}
                </div>

                {selectedPassageText && (
                  <div className="flex items-center gap-1.5 bg-[#0F172B] text-white px-3 py-1 rounded-full text-xs shadow-lg">
                    <span className="text-[10px] text-slate-300 mr-1">Highlight:</span>
                    <button onClick={() => addHighlight('#fef08a')} className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition" title="Vàng" />
                    <button onClick={() => addHighlight('#bbf7d0')} className="w-4 h-4 rounded-full bg-emerald-300 hover:scale-110 transition" title="Xanh lá" />
                    <button onClick={addNote} className="ml-2 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] text-[#1EE1D6]">
                      <MessageSquare className="w-3 h-3" /> Ghi chú
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-extrabold text-[#0F172B] dark:text-white text-base mb-3">
                {readingPassages.length > 1 ? `Bài ${safePassageIdx + 1}: ` : ''}
                {activePassage?.title}
              </h3>

              <div
                onMouseUp={handlePassageTextSelect}
                className="flex-1 overflow-y-auto pr-3 text-[#314158] dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
              >
                {activePassage?.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 relative group">
                    <img
                      src={activePassage.imageUrl}
                      alt={`Reading Passage ${safePassageIdx + 1}`}
                      onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                      className="w-full max-h-[52vh] object-contain rounded-lg mx-auto cursor-zoom-in"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                      className="mt-2 mx-auto flex items-center gap-1.5 text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline font-sans"
                    >
                      <Eye className="w-3.5 h-3.5" /> Phóng to ảnh bài đọc #{safePassageIdx + 1}
                    </button>
                  </div>
                )}
                {activePassage?.passageText}
              </div>
            </div>

            {/* Right Split: Reading Cloze Summary + Questions */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col overflow-y-auto shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-[#0F172B] dark:text-white text-base">
                  Câu Hỏi Phần Reading {readingPassages.length > 1 && hasScopedReadingQs && !examState.showAllReadingQs ? `(Bài ${safePassageIdx + 1})` : ''}
                </h3>
                {readingPassages.length > 1 && hasScopedReadingQs && (
                  <button
                    type="button"
                    onClick={() => setExamState(prev => ({ ...prev, showAllReadingQs: !prev.showAllReadingQs }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    {examState.showAllReadingQs ? `Chỉ xem Bài ${safePassageIdx + 1}` : `Xem tất cả (${allReadingQs.length})`}
                  </button>
                )}
              </div>

              {activeReadingCloze.trim() && (
                <ClozeNoteSheet
                  activeBlankNum={activeBlankNum}
                  answers={examState.answers}
                  clozeText={activeReadingCloze}
                  inputRefs={blankInputRefs}
                  onAnswerChange={(qId, val) =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [qId]: val }
                    }))
                  }
                  onBlankFocus={(num, qId) => {
                    setActiveBlankNum(num);
                    if (qId) setActiveQuestionId(qId);
                  }}
                  onPassageTextSelect={handlePassageTextSelect}
                  questions={allReadingQs}
                  scopeField="passageIdx"
                  scopeIdx={safePassageIdx}
                />
              )}

              {standaloneReadingQs.length > 0 ? (
                <div className="space-y-4">
                  {standaloneReadingQs.map((q, idx) => renderQuestionCard(q, idx + 1, 'reading'))}
                </div>
              ) : !activeReadingCloze.trim() ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-6 text-center">
                  Chưa có câu hỏi gắn riêng cho Bài {safePassageIdx + 1}. Hãy chuyển bài đọc hoặc bấm &quot;Xem tất cả&quot;.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* WRITING WORKSPACE */}
        {examState.skill === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[78vh]">
            {/* Task 1 */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="font-extrabold text-[#0F172B] dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Writing Task 1
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      w1Words >= (activeTest.writing?.task1?.minWords || 150)
                        ? 'bg-[#ECFDF5] dark:bg-emerald-500/20 text-[#059271] dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {w1Words} / {activeTest.writing?.task1?.minWords || 150} từ
                  </span>
                </div>

                <p className="text-xs text-[#314158] dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                  {activeTest.writing?.task1?.prompt}
                </p>

                {activeTest.writing?.task1?.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
                    <img
                      src={activeTest.writing.task1.imageUrl}
                      alt="Writing Task 1 Chart"
                      className="w-full max-h-52 object-contain rounded-lg mx-auto"
                    />
                  </div>
                )}

                <textarea
                  rows={12}
                  placeholder="Viết bài Task 1 của bạn ở đây..."
                  value={examState.answers.w1 || ''}
                  onChange={e =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, w1: e.target.value }
                    }))
                  }
                  className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-[#0B1117] text-[#0F172B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#007A7A] focus:outline-none font-sans"
                />
              </div>
            </div>

            {/* Task 2 */}
            <div className="bg-white dark:bg-[#0F172B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="font-extrabold text-[#0F172B] dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Writing Task 2
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      w2Words >= (activeTest.writing?.task2?.minWords || 250)
                        ? 'bg-[#ECFDF5] dark:bg-emerald-500/20 text-[#059271] dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {w2Words} / {activeTest.writing?.task2?.minWords || 250} từ
                  </span>
                </div>

                <p className="text-xs text-[#314158] dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                  {activeTest.writing?.task2?.prompt}
                </p>

                <textarea
                  rows={12}
                  placeholder="Viết bài Task 2 của bạn ở đây..."
                  value={examState.answers.w2 || ''}
                  onChange={e =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, w2: e.target.value }
                    }))
                  }
                  className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-[#0B1117] text-[#0F172B] dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#007A7A] focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom LexiPrep Computer-Delivered Question Navigator Bar (for Listening & Reading) */}
      {(examState.skill === 'listening' || examState.skill === 'reading') && (
        <footer className="bg-white dark:bg-[#0B1117] border-t border-slate-200 dark:border-slate-800/90 px-4 sm:px-6 py-2.5 sticky bottom-0 z-40">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 flex-1">
              {navParts.map(part => {
                const isActive = part.idx === activePartIdx;
                const answeredInPart = part.questions.filter(
                  q => String(examState.answers[q.id] || '').trim().length > 0
                ).length;

                if (!isActive) {
                  return (
                    <button
                      key={part.idx}
                      type="button"
                      onClick={() => {
                        setActiveBlankNum(null);
                        setActiveQuestionId(null);
                        setExamState(prev => ({
                          ...prev,
                          ...(examState.skill === 'listening'
                            ? { listeningTrackIdx: part.idx }
                            : { readingPassageIdx: part.idx })
                        }));
                      }}
                      className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111820] hover:border-[#007A7A] text-xs font-bold text-[#314158] dark:text-slate-300 transition flex items-center gap-2"
                    >
                      <span>{part.label} :</span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {answeredInPart} of {part.questions.length} questions
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={part.idx}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl border border-[#007A7A]/50 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#111820] flex items-center gap-2 flex-wrap"
                  >
                    <span className="text-xs font-extrabold text-[#0F172B] dark:text-white pr-1">
                      {part.label}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {part.questions.map((q, qIdx) => {
                        const leadingNum = Number(String(q.question || '').trim().match(/^(?:Câu\s*)?(\d+)[.)]/i)?.[1]);
                        const displayNum = typeof q.blankNum === 'number' ? q.blankNum : (leadingNum || qIdx + 1);
                        const isAnswered = String(examState.answers[q.id] || '').trim().length > 0;
                        const isFocused =
                          activeQuestionId === q.id ||
                          (typeof q.blankNum === 'number' && Number(activeBlankNum) === Number(q.blankNum));

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => scrollToQuestionOrBlank(q, qIdx)}
                            title={`Câu ${displayNum}${isAnswered ? ' (Đã trả lời)' : ''}`}
                            className={`w-6 h-6 rounded-full text-[11px] font-extrabold transition flex items-center justify-center border ${
                              isFocused
                                ? 'bg-white dark:bg-slate-200 text-[#0F172B] border-[#00B2AD] ring-2 ring-[#00B2AD]/60'
                                : isAnswered
                                ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-[#007A7A]'
                            }`}
                          >
                            {displayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prev / Next Floating Circular Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleStepQuestion(-1)}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-[#007A7A] hover:text-[#007A7A] dark:hover:text-[#1EE1D6] flex items-center justify-center transition"
                title="Câu trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStepQuestion(1)}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-[#007A7A] hover:text-[#007A7A] dark:hover:text-[#1EE1D6] flex items-center justify-center transition"
                title="Câu tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Modal Xác Nhận Nộp Bài Thi (In-app modal để không kích hoạt window blur chống gian lận) */}
      {showSubmitConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSubmitConfirmModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/70 text-[#059271] dark:text-emerald-300 flex items-center justify-center flex-shrink-0 border border-[#9FF5E1] dark:border-emerald-800">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0F172B] dark:text-white">
                    Bạn có chắc chắn muốn nộp bài không?
                  </h3>
                  <p className="text-xs text-[#62748E] dark:text-slate-400 mt-1">
                    Sau khi xác nhận nộp bài, hệ thống sẽ lưu kết quả ngay và bạn sẽ không thể chỉnh sửa lại bài làm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Đóng hộp thoại xác nhận nộp bài"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Listening</p>
                  <p className="text-base font-extrabold text-[#0F172B] dark:text-white mt-0.5">
                    {answeredListeningCount}/{allListeningQs.length} câu
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reading</p>
                  <p className="text-base font-extrabold text-[#0F172B] dark:text-white mt-0.5">
                    {answeredReadingCount}/{allReadingQs.length} câu
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Writing Task 1</p>
                  <p className="text-base font-extrabold text-[#0F172B] dark:text-white mt-0.5">
                    {w1Words} từ
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Writing Task 2</p>
                  <p className="text-base font-extrabold text-[#0F172B] dark:text-white mt-0.5">
                    {w2Words} từ
                  </p>
                </div>
              </div>

              {(answeredListeningCount < allListeningQs.length ||
                answeredReadingCount < allReadingQs.length ||
                w1Words === 0 ||
                w2Words === 0) && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Một số câu hỏi hoặc phần Writing hiện vẫn còn trống. Bạn có thể bấm <strong>Quay lại làm tiếp</strong> để rà soát trước khi nộp bài.
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={handleFinalExamSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-[#059271] hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
              >
                <Check className="w-4 h-4" /> Xác nhận Nộp Bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
