import { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  Headphones,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  PenTool,
  Play,
  Send,
  Sun,
  Type,
  Volume2,
  X
} from 'lucide-react';
import {
  formatViDateTime,
  getListeningAudioKey,
  getListeningTracks,
  getReadingPassages,
  normalizeExamConfig
} from '../constants/seedData';
import { extractBlankNumbers } from '../utils/clozeHelpers';
import { getWordCount } from '../utils/examHelpers';
import {
  buildScopedNavParts,
  getQuestionDisplayNumber,
  getQuestionRangeText,
  parseReadingPassageBlocks,
  segmentTextWithHighlights
} from '../utils/examUiHelpers';
import ClozeNoteSheet from '../components/exam/ClozeNoteSheet';
import ExamQuestionList from '../components/exam/ExamQuestionList';
import IntegratedSpeakingSection from '../components/exam/IntegratedSpeakingSection';
import SplitResizableWorkspace from '../components/exam/SplitResizableWorkspace';

const FONT_SIZE_CLASSES = {
  regular: 'text-[16px] leading-[1.6]',
  large: 'text-[17.5px] leading-[1.65]',
  xl: 'text-[19px] leading-[1.7]'
};

const FONT_SIZE_LABELS = {
  regular: 'Regular',
  large: 'Large',
  xl: 'XL'
};

export default function ExamMode({
  addHighlight,
  addNote,
  advanceToNextExamSection,
  audioProgress = { currentTime: 0, duration: 0 },
  currentUser,
  darkMode,
  examState,
  handleFinalExamSubmit,
  handlePassageTextSelect,
  handlePlayListeningAudio,
  isPlayingAudio,
  onCopyInternalText,
  onDismissSelectionToolbar,
  onExitExam,
  onExitMissingTest,
  playingAudioKey,
  removeHighlight,
  selectedPassageText,
  selectionCoords = null,
  selectedTestId,
  setDarkMode,
  setExamState,
  setShowSubmitConfirmModal,
  setZoomedReadingImg,
  showSubmitConfirmModal,
  showToast,
  stopExamAudio,
  tests
}) {
  const [activeBlankNum, setActiveBlankNum] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const [fontSizeMode, setFontSizeMode] = useState('regular');
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showInlineNoteForm, setShowInlineNoteForm] = useState(false);
  const [inlineNoteDraft, setInlineNoteDraft] = useState('');
  const [showSubmitLockedModal, setShowSubmitLockedModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [earlyNextConfirmOpen, setEarlyNextConfirmOpen] = useState(false);
  const [speakingRecordingsMap, setSpeakingRecordingsMap] = useState({});
  const [speakingNotes, setSpeakingNotes] = useState({});
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const blankInputRefs = useRef({});
  const questionCardRefs = useRef({});

  const activeTest = tests.find(t => t.id === selectedTestId);
  if (!activeTest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] flex items-center justify-center p-6 font-exam">
        <div className="max-w-md w-full bg-white dark:bg-[#1B1B1B] border border-[#D5D9E0] dark:border-[#333333] rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#111827] dark:text-white mb-2">
            Đang khôi phục phiên làm bài...
          </h2>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-5">
            Dữ liệu đáp án của bạn đã được lưu tạm an toàn trên trình duyệt. Nếu đề thi chưa tự hiển thị sau vài giây đồng bộ, hãy quay về trang chính để chọn lại đề và tiếp tục từ vị trí cũ.
          </p>
          <button
            type="button"
            onClick={onExitMissingTest}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition shadow-md"
          >
            Quay về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const cfg = normalizeExamConfig(activeTest);
  const isTeacherUser = currentUser?.role === 'teacher';
  const isRealExamLocked = cfg.maxAttempts > 0;
  const canTemporaryExit = isTeacherUser || !isRealExamLocked;

  const currentSectionIdx =
    typeof examState.sectionIdx === 'number'
      ? Math.min(Math.max(0, examState.sectionIdx), cfg.order.length - 1)
      : Math.max(0, cfg.order.indexOf(examState.skill));

  const skillMeta = {
    listening: { label: 'Listening', icon: Headphones },
    reading: { label: 'Reading', icon: BookOpen },
    writing: { label: 'Writing', icon: PenTool },
    speaking: { label: 'Speaking', icon: Mic }
  };

  const fontSizeClass = FONT_SIZE_CLASSES[fontSizeMode] || FONT_SIZE_CLASSES.regular;
  const bookmarkedQuestions = examState.bookmarkedQuestions || {};
  const writingTaskScope = cfg.writingTaskScope || 'both';
  const activeWritingTask =
    writingTaskScope === 'task2'
      ? 1
      : writingTaskScope === 'task1'
      ? 0
      : Number(examState.writingTaskIdx) === 1
      ? 1
      : 0;
  const speakingRecordedCount = Object.values(speakingRecordingsMap).filter(
    r => Boolean(r?.blob || r?.audioUrl)
  ).length;
  const hasSpeakingSection = cfg.order.includes('speaking');

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

  const openEarlyNextConfirmModal = () => {
    if (!cfg.sequentialMode || currentSectionIdx >= cfg.order.length - 1) return;
    const safeRem = Math.max(0, Math.floor(examState.timeRemaining || 0));
    const remMin = Math.floor(safeRem / 60);
    const remSec = safeRem % 60;
    const currLabel = skillMeta[examState.skill]?.label || examState.skill;
    showToast?.(
      `Lưu ý: Phần ${currLabel} vẫn còn ${remMin} phút ${remSec.toString().padStart(2, '0')} giây - nếu chuyển sang kỹ năng mới sẽ KHÔNG thể quay lại kỹ năng cũ!`,
      'warning'
    );
    setEarlyNextConfirmOpen(true);
  };

  const remainingMinutesLabel = `${Math.max(1, Math.ceil((examState.timeRemaining || 0) / 60))} minutes remaining`;

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
  const task1MinWords = activeTest.writing?.task1?.minWords || 150;
  const task2MinWords = activeTest.writing?.task2?.minWords || 250;

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

  const toggleBookmarkQuestion = (qId) => {
    if (!qId) return;
    setExamState(prev => {
      const nextBookmarks = { ...(prev.bookmarkedQuestions || {}) };
      if (nextBookmarks[qId]) {
        delete nextBookmarks[qId];
      } else {
        nextBookmarks[qId] = true;
      }
      return { ...prev, bookmarkedQuestions: nextBookmarks };
    });
  };

  const scrollToQuestionOrBlank = (q, fallbackIdx) => {
    setActiveQuestionId(q.id);
    const derivedNum = getQuestionDisplayNumber(q, fallbackIdx + 1);
    const blankTarget = typeof q.blankNum === 'number' ? q.blankNum : (q.type === 'fill' ? derivedNum : null);
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

  // Bottom navigator dataset across Parts / Passages / Writing Tasks / Speaking
  const navParts =
    examState.skill === 'listening'
      ? buildScopedNavParts({
          items: listeningTracks,
          allQuestions: allListeningQs,
          hasScopedQs: hasScopedListeningQs,
          scopeField: 'trackIdx',
          multiLabelPrefix: 'PART',
          singleLabel: 'LISTENING'
        })
      : examState.skill === 'reading'
      ? buildScopedNavParts({
          items: readingPassages,
          allQuestions: allReadingQs,
          hasScopedQs: hasScopedReadingQs,
          scopeField: 'passageIdx',
          multiLabelPrefix: 'PASSAGE',
          singleLabel: 'READING'
        })
      : examState.skill === 'speaking'
      ? [
          {
            idx: 0,
            offset: 0,
            label: 'SPEAKING',
            questions: [{ id: 'sp_all', num: 'SP', answered: speakingRecordedCount > 0 }]
          }
        ]
      : writingTaskScope === 'task1'
      ? [{ idx: 0, offset: 0, label: 'TASK 1', questions: [{ id: 'w1', num: 1, answered: w1Words > 0 }] }]
      : writingTaskScope === 'task2'
      ? [{ idx: 1, offset: 0, label: 'TASK 2', questions: [{ id: 'w2', num: 2, answered: w2Words > 0 }] }]
      : [
          { idx: 0, offset: 0, label: 'TASK 1', questions: [{ id: 'w1', num: 1, answered: w1Words > 0 }] },
          { idx: 1, offset: 1, label: 'TASK 2', questions: [{ id: 'w2', num: 2, answered: w2Words > 0 }] }
        ];

  const activePartIdx =
    examState.skill === 'listening'
      ? safeTrackIdx
      : examState.skill === 'reading'
      ? safePassageIdx
      : examState.skill === 'speaking'
      ? 0
      : activeWritingTask;

  const activePartObj = navParts.find(p => p.idx === activePartIdx) || navParts[0];
  const activePartQs = activePartObj?.questions || [];
  const activePartRange =
    examState.skill === 'writing'
      ? `${activeWritingTask + 1}–${activeWritingTask + 1}`
      : examState.skill === 'speaking'
      ? 'Part 1–3'
      : getQuestionRangeText(activePartQs, activePartObj?.offset || 0);

  const readingBaseOffset = examState.showAllReadingQs ? 0 : activePartObj?.offset || 0;
  const listeningBaseOffset = examState.showAllListeningQs ? 0 : activePartObj?.offset || 0;

  const switchPartIndex = (targetIdx, skillType = examState.skill) => {
    setActiveBlankNum(null);
    setActiveQuestionId(null);
    if (skillType === 'listening') {
      setExamState(prev => ({ ...prev, listeningTrackIdx: targetIdx }));
    } else if (skillType === 'reading') {
      setExamState(prev => ({ ...prev, readingPassageIdx: targetIdx }));
    } else {
      setExamState(prev => ({ ...prev, writingTaskIdx: targetIdx }));
    }
  };

  const handleStepQuestion = (delta) => {
    if (examState.skill === 'writing') {
      const nextTask = Math.max(0, Math.min(1, activeWritingTask + delta));
      switchPartIndex(nextTask, 'writing');
      return;
    }
    if (activePartQs.length === 0) return;

    const currentIdx = activePartQs.findIndex(q => q.id === activeQuestionId);
    if (currentIdx === -1) {
      const startIdx = delta > 0 ? 0 : activePartQs.length - 1;
      if (activePartQs[startIdx]) scrollToQuestionOrBlank(activePartQs[startIdx], startIdx);
      return;
    }

    const nextIdx = currentIdx + delta;
    if (nextIdx >= 0 && nextIdx < activePartQs.length) {
      scrollToQuestionOrBlank(activePartQs[nextIdx], nextIdx);
      return;
    }

    // Move across Passage / Listening Part boundaries seamlessly
    const targetPartIdx = activePartIdx + (delta > 0 ? 1 : -1);
    if (targetPartIdx >= 0 && targetPartIdx < navParts.length) {
      switchPartIndex(targetPartIdx, examState.skill);
      const nextPartQs = navParts[targetPartIdx]?.questions || [];
      const edgeQ = delta > 0 ? nextPartQs[0] : nextPartQs[nextPartQs.length - 1];
      if (edgeQ) {
        setTimeout(() => scrollToQuestionOrBlank(edgeQ, delta > 0 ? 0 : nextPartQs.length - 1), 80);
      }
    }
  };

  const handleRequestSubmit = () => {
    if (!allSkillsVisited) {
      setShowSubmitLockedModal(true);
      showToast?.(`Còn kỹ năng chưa hoàn tất: ${unvisitedLabels.join(', ')}.`, 'info');
      return;
    }
    setShowSubmitConfirmModal(true);
  };

  const handleSubmitInlineNote = (e) => {
    e?.preventDefault();
    const cleaned = inlineNoteDraft.trim();
    if (!cleaned) return;
    addNote?.(cleaned);
    setInlineNoteDraft('');
    setShowInlineNoteForm(false);
  };

  const handleCancelInlineNote = () => {
    setInlineNoteDraft('');
    setShowInlineNoteForm(false);
    if (onDismissSelectionToolbar) {
      onDismissSelectionToolbar();
    } else {
      addNote?.('');
    }
  };

  const renderHighlightRuns = (text) => {
    const runs = segmentTextWithHighlights(text, examState.highlights);
    return runs.map((run, idx) =>
      run.color ? (
        <mark
          key={idx}
          onClick={
            run.highlightId && typeof removeHighlight === 'function'
              ? e => {
                  e.stopPropagation();
                  removeHighlight(run.highlightId);
                }
              : undefined
          }
          title={run.highlightId && typeof removeHighlight === 'function' ? 'Bấm để bỏ Highlight' : undefined}
          style={{ backgroundColor: run.color }}
          className={`text-[#111827] rounded-[3px] px-0.5 py-0.5 font-medium ${
            run.highlightId && typeof removeHighlight === 'function'
              ? 'cursor-pointer hover:opacity-80 transition-opacity'
              : ''
          }`}
        >
          {run.text}
        </mark>
      ) : (
        <span key={idx}>{run.text}</span>
      )
    );
  };

  const audioPercent =
    audioProgress.duration > 0
      ? Math.min(100, Math.round((audioProgress.currentTime / audioProgress.duration) * 100))
      : isPlayingAudio
      ? 42
      : 0;

  const bookmarkedList = [
    ...allListeningQs.map((q, idx) => ({ skill: 'listening', q, num: getQuestionDisplayNumber(q, idx + 1) })),
    ...allReadingQs.map((q, idx) => ({ skill: 'reading', q, num: getQuestionDisplayNumber(q, idx + 1) }))
  ].filter(item => Boolean(bookmarkedQuestions[item.q.id]));

  const currentWritingKey = activeWritingTask === 0 ? 'w1' : 'w2';
  const currentWritingCfg = activeWritingTask === 0 ? activeTest.writing?.task1 : activeTest.writing?.task2;
  const currentWritingWords = activeWritingTask === 0 ? w1Words : w2Words;
  const currentWritingMinWords = activeWritingTask === 0 ? task1MinWords : task2MinWords;

  return (
    <div
      translate="no"
      onContextMenu={cfg.antiCheatEnabled ? (e) => e.preventDefault() : undefined}
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-[#111827] dark:text-[#F3F4F6] flex flex-col justify-between select-none transition-colors font-exam notranslate"
    >
      {/* Top Computer-Delivered Header (matches Real IELTS bar) */}
      <header className="bg-white dark:bg-[#161616] text-[#111827] dark:text-white px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 dark:border-[#2C2C2C] sticky top-0 z-50">
        {/* Left: Golden IELTS emblem + Test Title + Minutes Remaining */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-amber-400/30"
            title="Luyện Thi IELTS Nha Trang - IELTS with Ms. Như"
          >
            IELTS
          </div>
          <div className="min-w-0">
            <h2
              className="font-bold text-sm sm:text-[15px] text-[#111827] dark:text-white truncate max-w-[200px] sm:max-w-[360px] md:max-w-[460px]"
              title={activeTest.title}
            >
              {activeTest.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 font-medium">
              <span>{remainingMinutesLabel}</span>
              <span className="opacity-40">•</span>
              <span
                className={`inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded ${
                  examState.timeRemaining <= 60
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'bg-[#F1F5F9] dark:bg-[#242424] text-[#111827] dark:text-[#E5E7EB]'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-500" />
                {formatTime(examState.timeRemaining)}
              </span>
              {cfg.scheduleMode !== 'flexible' && cfg.dueAt && (
                <span className="hidden lg:inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                  Hạn: {formatViDateTime(cfg.dueAt)}
                </span>
              )}
              {examState.skill === 'listening' && isPlayingAudio && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#111827] dark:text-amber-300 ml-1">
                  <Volume2 className="w-3.5 h-3.5" /> Audio is playing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Compact Skill Tabs */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-[#222222] p-1 rounded-lg text-xs gap-1 border border-[#D5D9E0] dark:border-[#343434] shrink-0">
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
                    : `Kỹ năng ${meta.label} (${cfg.durations[sId]} phút)`
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
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-85'
                    : isLocked
                    ? 'text-slate-400 dark:text-neutral-500 cursor-not-allowed'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#2E2E2E]'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                {isLocked && !isDone && <Lock className="w-3 h-3 opacity-70" />}
                {(isDone || (!isLocked && !isCurrent && isVisited)) && (
                  <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Actions + Contrast + Drawer Menu + Submit */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {cfg.sequentialMode && cfg.allowEarlyNextSection && currentSectionIdx < cfg.order.length - 1 && (
            <button
              type="button"
              onClick={openEarlyNextConfirmModal}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Chuyển Kỹ Năng Tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-lg bg-rose-100/75 dark:bg-[#242424] hover:bg-slate-200 dark:hover:bg-[#323232] text-slate-700 dark:text-neutral-200 border border-[#D5D9E0] dark:border-[#383838] transition"
            title={darkMode ? 'Chế độ Sáng (Black on White)' : 'Chế độ Tối (White on Black)'}
            aria-label={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
          </button>

          <button
            type="button"
            onClick={() => setShowMenuDrawer(true)}
            className="relative p-2 rounded-lg bg-rose-100/75 dark:bg-[#242424] hover:bg-slate-200 dark:hover:bg-[#323232] text-slate-700 dark:text-neutral-100 border border-[#D5D9E0] dark:border-[#383838] transition"
            title="Cài đặt màn hình, Highlight, Đánh dấu & Thoát"
            aria-label="Mở menu tùy chọn phòng thi"
          >
            <Menu className="w-4 h-4" />
            {(examState.highlights.length + examState.notes.length + bookmarkedList.length > 0) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                {examState.highlights.length + examState.notes.length + bookmarkedList.length}
              </span>
            )}
          </button>

          {canTemporaryExit ? (
            <button
              type="button"
              onClick={() => {
                if (isTeacherUser) {
                  onExitExam?.();
                } else {
                  setShowExitConfirmModal(true);
                }
              }}
              className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-100/75 dark:bg-[#242424] hover:bg-slate-200 dark:hover:bg-[#323232] text-slate-700 dark:text-neutral-200 border border-[#D5D9E0] dark:border-[#383838] transition items-center gap-1 whitespace-nowrap"
              title={isTeacherUser ? 'Thoát xem trước' : 'Lưu nháp & Tạm Thoát (Chỉ áp dụng khi Thi thử)'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isTeacherUser ? 'Thoát' : 'Tạm Thoát'}</span>
            </button>
          ) : (
            <span
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 items-center gap-1 whitespace-nowrap"
              title="Bài thi thật: thí sinh không được phép tạm thoát khi chưa nộp bài"
            >
              <Lock className="w-3 h-3" />
              <span>Thi Thật</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleRequestSubmit}
            title={
              allSkillsVisited
                ? 'Xác nhận nộp bài thi'
                : `Cần đi qua cả ${cfg.order.length} kỹ năng (${unvisitedLabels.join(', ')}) để nộp bài.`
            }
            className={`font-bold text-xs px-3 sm:px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
              allSkillsVisited
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40'
            }`}
          >
            {!allSkillsVisited ? <Lock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>{allSkillsVisited ? 'Nộp Bài' : `Nộp (${visitedInOrderCount}/${cfg.order.length})`}</span>
          </button>
        </div>
      </header>

      {/* Mobile Skill Switcher Row */}
      <div className="md:hidden bg-white dark:bg-[#161616] border-b border-[#D5D9E0] dark:border-[#2C2C2C] px-3 py-1.5 flex items-center justify-center gap-1 overflow-x-auto">
        {cfg.order.map((sId, idx) => {
          const meta = skillMeta[sId] || { label: sId, icon: BookOpen };
          const IconComp = meta.icon;
          const isCurrent = examState.skill === sId && idx === currentSectionIdx;
          const isDone = cfg.sequentialMode && idx < currentSectionIdx;
          const isLocked = cfg.sequentialMode && idx !== currentSectionIdx;
          return (
            <button
              key={sId}
              type="button"
              disabled={isLocked}
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
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                isCurrent
                  ? 'bg-[#2563EB] text-white'
                  : isDone
                  ? 'text-emerald-500'
                  : isLocked
                  ? 'text-slate-400 dark:text-neutral-600'
                  : 'text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-[#242424]'
              }`}
            >
              <IconComp className="w-3 h-3" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Text-Selection Floating Highlight, Copy & Inline Note Toolbar */}
      {selectedPassageText && (
        <div
          style={
            selectionCoords
              ? { left: `${selectionCoords.x}px`, top: `${selectionCoords.y}px` }
              : undefined
          }
          className={
            selectionCoords
              ? 'fixed z-[70] -translate-x-1/2 rounded-2xl bg-[#1F2937]/95 dark:bg-[#222222]/95 backdrop-blur-md border border-[#4B5563] dark:border-[#404040] px-3.5 py-2.5 text-white shadow-2xl max-w-[94vw]'
              : 'fixed z-[70] top-[72px] left-1/2 -translate-x-1/2 rounded-2xl bg-[#1F2937]/95 dark:bg-[#222222]/95 backdrop-blur-md border border-[#4B5563] dark:border-[#404040] px-4 py-2 text-white shadow-2xl max-w-[94vw]'
          }
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="truncate max-w-[180px] sm:max-w-[260px] italic text-amber-300 font-medium">
              “{selectedPassageText}”
            </span>

            {!showInlineNoteForm ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-neutral-300 font-semibold">Highlight:</span>
                <button
                  type="button"
                  onClick={() => addHighlight('#fef08a')}
                  className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition ring-1 ring-white/50"
                  title="Highlight Vàng"
                />
                <button
                  type="button"
                  onClick={() => addHighlight('#bbf7d0')}
                  className="w-4 h-4 rounded-full bg-emerald-300 hover:scale-110 transition ring-1 ring-white/50"
                  title="Highlight Xanh lá"
                />
                <button
                  type="button"
                  onClick={() => addHighlight('#bae6fd')}
                  className="w-4 h-4 rounded-full bg-sky-300 hover:scale-110 transition ring-1 ring-white/50"
                  title="Highlight Xanh dương"
                />
                <button
                  type="button"
                  onClick={() => setShowInlineNoteForm(true)}
                  className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition"
                >
                  <MessageSquare className="w-3 h-3" /> Ghi Chú
                </button>
                {(!cfg.antiCheatEnabled || cfg.allowInternalCopyPaste) && typeof onCopyInternalText === 'function' && (
                  <button
                    type="button"
                    onClick={() => {
                      onCopyInternalText(selectedPassageText);
                      handleCancelInlineNote();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    title="Sao chép đoạn nội dung trong bài thi (chỉ dán được trong bài thi)"
                  >
                    <Copy className="w-3 h-3" /> Sao chép
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelInlineNote}
                  className="p-1 text-neutral-400 hover:text-white"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInlineNote} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
                <input
                  type="text"
                  autoFocus
                  value={inlineNoteDraft}
                  onChange={e => setInlineNoteDraft(e.target.value)}
                  placeholder="Nhập ghi chú nhanh tại đây..."
                  className="flex-1 h-7 px-2.5 rounded-lg bg-[#111827] border border-neutral-600 text-xs text-white focus:border-amber-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={handleCancelInlineNote}
                  className="px-2 h-7 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-xs font-semibold"
                >
                  Hủy
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Computer-Delivered Workspace (Full width left-aligned matching Real IELTS) */}
      <main className="flex-1 w-full px-4 sm:px-6 pt-3 pb-16 flex flex-col relative">
        {/* Part / Passage / Task Banner Strip */}
        <div className="rounded-[4px] border border-slate-200 dark:border-[#363636] bg-[#F1F5F9] dark:bg-[#242424] px-4 sm:px-5 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-[#111827] dark:text-white">
              {activePartObj?.label || (examState.skill === 'writing' ? `TASK ${activeWritingTask + 1}` : 'PART 1')}
            </h1>
            <p className="text-[14px] text-[#1F2937] dark:text-[#D1D5DB] mt-0.5">
              {examState.skill === 'reading' &&
                `Read the text and answer questions ${activePartRange || `1–${displayedReadingQs.length || 1}`}`}
              {examState.skill === 'listening' &&
                `Listen and answer questions ${activePartRange || `1–${displayedListeningQs.length || 1}`}`}
              {examState.skill === 'writing' &&
                `Read the prompt and answer questions ${activePartRange}`}
              {examState.skill === 'speaking' &&
                `Ghi âm trả lời Speaking Part 1–3 trực tiếp (nộp cùng bài thi 4 kỹ năng cho Ms. Như duyệt điểm)`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Inline Listening Audio Controller inside Banner */}
            {examState.skill === 'listening' && (
              <div className="flex items-center gap-2.5 bg-white dark:bg-[#171717] border border-[#CBD5E1] dark:border-[#383838] rounded-lg px-3 py-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePlayListeningAudio(
                      activeTrackPlayKey,
                      activeTrack?.transcript || '',
                      activeTrack?.audioUrl || ''
                    )
                  }
                  disabled={
                    (examState.audioPlays?.[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays || isPlayingAudio
                  }
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    (examState.audioPlays?.[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays
                      ? 'bg-slate-200 dark:bg-[#2A2A2A] text-slate-400 cursor-not-allowed'
                      : isPlayingAudio
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse cursor-wait'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                  }`}
                >
                  {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>
                    {isPlayingAudio && playingAudioKey === activeTrackPlayKey
                      ? 'Đang Phát'
                      : (examState.audioPlays?.[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays
                      ? 'Đã Nghe Hết'
                      : 'Phát Audio'}
                  </span>
                </button>
                <div className="w-24 sm:w-36 h-1.5 bg-slate-200 dark:bg-[#303030] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] dark:bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${audioPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-600 dark:text-neutral-300 tabular-nums">
                  {audioProgress.duration > 0
                    ? `${formatTime(audioProgress.currentTime)} / ${formatTime(audioProgress.duration)}`
                    : `${examState.audioPlays?.[activeTrackPlayKey] || 0}/${activeTest.maxAudioPlays}`}
                </span>
              </div>
            )}

            {/* Toggle All Questions in Multi-Part */}
            {examState.skill === 'reading' && readingPassages.length > 1 && hasScopedReadingQs && (
              <button
                type="button"
                onClick={() => setExamState(prev => ({ ...prev, showAllReadingQs: !prev.showAllReadingQs }))}
                className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-white dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#2E2E2E] text-slate-700 dark:text-neutral-200 border border-[#CBD5E1] dark:border-[#383838] transition"
              >
                {examState.showAllReadingQs ? `Chỉ xem Passage ${safePassageIdx + 1}` : `Xem tất cả (${allReadingQs.length})`}
              </button>
            )}
            {examState.skill === 'listening' && listeningTracks.length > 1 && hasScopedListeningQs && (
              <button
                type="button"
                onClick={() => setExamState(prev => ({ ...prev, showAllListeningQs: !prev.showAllListeningQs }))}
                className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-white dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#2E2E2E] text-slate-700 dark:text-neutral-200 border border-[#CBD5E1] dark:border-[#383838] transition"
              >
                {examState.showAllListeningQs ? `Chỉ xem Part ${safeTrackIdx + 1}` : `Xem tất cả (${allListeningQs.length})`}
              </button>
            )}

            {/* Quick Text Size Toggle */}
            <button
              type="button"
              onClick={() =>
                setFontSizeMode(prev => (prev === 'regular' ? 'large' : prev === 'large' ? 'xl' : 'regular'))
              }
              className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-white dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#2E2E2E] text-slate-700 dark:text-neutral-200 border border-[#CBD5E1] dark:border-[#383838] flex items-center gap-1 transition"
              title="Đổi cỡ chữ đề thi"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{FONT_SIZE_LABELS[fontSizeMode]}</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            1. READING WORKSPACE (Resizable 2-Pane Split)
           ============================================================ */}
        {examState.skill === 'reading' && (
          <SplitResizableWorkspace
            splitPercent={splitPercent}
            onChangeSplit={setSplitPercent}
            left={
              <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-[#E5E7EB] dark:border-[#292929] shrink-0">
                  <h3 className="font-extrabold text-[#111827] dark:text-white text-base sm:text-[17px] leading-snug">
                    {activePassage?.title || `Passage ${safePassageIdx + 1}`}
                  </h3>
                </div>

                <div
                  onMouseUp={handlePassageTextSelect}
                  data-exam-copy-source="true"
                  className={`flex-1 overflow-y-auto cd-exam-scroll px-5 py-4 space-y-4 select-text font-exam text-[#1F2937] dark:text-[#EDEDED] ${fontSizeClass}`}
                >
                  {activePassage?.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-[#CBD5E1] dark:border-[#3A3A3A] bg-white p-2.5 relative">
                      <img
                        src={activePassage.imageUrl}
                        alt={`Reading Passage ${safePassageIdx + 1}`}
                        onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                        className="w-full max-h-[48vh] object-contain rounded mx-auto cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                        className="mt-2 mx-auto flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Phóng to ảnh minh họa
                      </button>
                    </div>
                  )}

                  {parseReadingPassageBlocks(activePassage?.passageText).map(block => {
                    if (block.kind === 'numberBox') {
                      return (
                        <div key={block.id} className="pt-2">
                          <div className="w-36 sm:w-44 mx-auto text-center py-0.5 border border-[#9CA3AF] dark:border-[#555555] rounded-[4px] text-xs font-extrabold text-[#111827] dark:text-white bg-[#F3F4F6] dark:bg-[#222222]">
                            {block.label}
                          </div>
                        </div>
                      );
                    }
                    if (block.kind === 'lead') {
                      return (
                        <p key={block.id} className="italic font-medium text-slate-600 dark:text-[#D4D4D4]">
                          {renderHighlightRuns(block.text)}
                        </p>
                      );
                    }
                    if (block.kind === 'numberedParagraph') {
                      return (
                        <div key={block.id} className="space-y-2">
                          <div className="w-36 sm:w-44 mx-auto text-center py-0.5 border border-[#9CA3AF] dark:border-[#555555] rounded-[4px] text-xs font-extrabold text-[#111827] dark:text-white bg-[#F3F4F6] dark:bg-[#222222]">
                            {block.label}
                          </div>
                          <p>{renderHighlightRuns(block.text)}</p>
                        </div>
                      );
                    }
                    if (block.kind === 'letterParagraph') {
                      return (
                        <p key={block.id}>
                          <strong className="font-extrabold text-[#111827] dark:text-white mr-2">{block.label}</strong>
                          {renderHighlightRuns(block.text)}
                        </p>
                      );
                    }
                    return <p key={block.id}>{renderHighlightRuns(block.text)}</p>;
                  })}
                </div>
              </div>
            }
            right={
              <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto cd-exam-scroll px-5 py-4 space-y-5">
                  {activeReadingCloze.trim() && (
                    <ClozeNoteSheet
                      activeBlankNum={activeBlankNum}
                      answers={examState.answers}
                      bookmarkedQuestions={bookmarkedQuestions}
                      clozeText={activeReadingCloze}
                      fontSizeClass={fontSizeClass}
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
                      onToggleBookmark={toggleBookmarkQuestion}
                      questions={allReadingQs}
                      renderText={renderHighlightRuns}
                      scopeField="passageIdx"
                      scopeIdx={safePassageIdx}
                    />
                  )}

                  {standaloneReadingQs.length > 0 ? (
                    <ExamQuestionList
                      activeQuestionId={activeQuestionId}
                      answers={examState.answers}
                      baseOffset={readingBaseOffset}
                      bookmarkedQuestions={bookmarkedQuestions}
                      fontSizeClass={fontSizeClass}
                      onAnswerChange={(qId, val) =>
                        setExamState(prev => ({
                          ...prev,
                          answers: { ...prev.answers, [qId]: val }
                        }))
                      }
                      onSelectQuestion={q => {
                        setActiveQuestionId(q.id);
                        setActiveBlankNum(typeof q.blankNum === 'number' ? q.blankNum : null);
                      }}
                      onSwitchScope={pIdx => switchPartIndex(pIdx, 'reading')}
                      onTextSelect={handlePassageTextSelect}
                      onToggleBookmark={toggleBookmarkQuestion}
                      questionCardRefs={questionCardRefs}
                      questions={standaloneReadingQs}
                      renderText={renderHighlightRuns}
                      scopeLabelPrefix="Passage"
                      scopeType="reading"
                      showScopeBadge={examState.showAllReadingQs && readingPassages.length > 1}
                    />
                  ) : !activeReadingCloze.trim() ? (
                    <p className="text-xs text-slate-500 dark:text-neutral-400 italic py-8 text-center">
                      Chưa có câu hỏi gắn riêng cho Passage {safePassageIdx + 1}.
                    </p>
                  ) : null}
                </div>
              </div>
            }
          />
        )}

        {/* ============================================================
            2. LISTENING WORKSPACE (Resizable Split if diagram/context exists)
           ============================================================ */}
        {examState.skill === 'listening' &&
          (listeningNeedsLeftPane ? (
            <SplitResizableWorkspace
              splitPercent={splitPercent}
              onChangeSplit={setSplitPercent}
              left={
                <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E5E7EB] dark:border-[#292929] shrink-0">
                    <h3 className="font-extrabold text-[#111827] dark:text-white text-base">
                      {activeTrack?.title || `Part ${safeTrackIdx + 1}`}
                    </h3>
                  </div>
                  <div
                    onMouseUp={handlePassageTextSelect}
                    data-exam-copy-source="true"
                    className={`flex-1 overflow-y-auto cd-exam-scroll px-5 py-4 space-y-4 select-text text-[#1F2937] dark:text-[#EDEDED] whitespace-pre-line ${fontSizeClass}`}
                  >
                    {activeTrack?.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-[#CBD5E1] dark:border-[#3A3A3A] bg-white p-2.5">
                        <img
                          src={activeTrack.imageUrl}
                          alt={`Listening Map ${safeTrackIdx + 1}`}
                          onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                          className="w-full max-h-[48vh] object-contain rounded mx-auto cursor-zoom-in"
                        />
                        <button
                          type="button"
                          onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                          className="mt-2 mx-auto flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> Phóng to bản đồ / sơ đồ
                        </button>
                      </div>
                    )}
                    {renderHighlightRuns(activeTrack?.contextText || '')}
                  </div>
                </div>
              }
              right={
                <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto cd-exam-scroll px-5 py-4 space-y-5">
                    {activeListeningCloze.trim() && (
                      <ClozeNoteSheet
                        activeBlankNum={activeBlankNum}
                        answers={examState.answers}
                        bookmarkedQuestions={bookmarkedQuestions}
                        clozeText={activeListeningCloze}
                        fontSizeClass={fontSizeClass}
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
                        onToggleBookmark={toggleBookmarkQuestion}
                        questions={allListeningQs}
                        renderText={renderHighlightRuns}
                        scopeField="trackIdx"
                        scopeIdx={safeTrackIdx}
                      />
                    )}
                    {standaloneListeningQs.length > 0 && (
                      <ExamQuestionList
                        activeQuestionId={activeQuestionId}
                        answers={examState.answers}
                        baseOffset={listeningBaseOffset}
                        bookmarkedQuestions={bookmarkedQuestions}
                        fontSizeClass={fontSizeClass}
                        onAnswerChange={(qId, val) =>
                          setExamState(prev => ({
                            ...prev,
                            answers: { ...prev.answers, [qId]: val }
                          }))
                        }
                        onSelectQuestion={q => {
                          setActiveQuestionId(q.id);
                          setActiveBlankNum(typeof q.blankNum === 'number' ? q.blankNum : null);
                        }}
                        onSwitchScope={tIdx => switchPartIndex(tIdx, 'listening')}
                        onTextSelect={handlePassageTextSelect}
                        onToggleBookmark={toggleBookmarkQuestion}
                        questionCardRefs={questionCardRefs}
                        questions={standaloneListeningQs}
                        renderText={renderHighlightRuns}
                        scopeLabelPrefix="Part"
                        scopeType="listening"
                        showScopeBadge={examState.showAllListeningQs && listeningTracks.length > 1}
                      />
                    )}
                  </div>
                </div>
              }
            />
          ) : (
            <div className="w-full px-1 sm:px-2 py-1 space-y-6 flex-1 overflow-y-auto cd-exam-scroll text-left">
              {activeListeningCloze.trim() && (
                <ClozeNoteSheet
                  activeBlankNum={activeBlankNum}
                  answers={examState.answers}
                  bookmarkedQuestions={bookmarkedQuestions}
                  clozeText={activeListeningCloze}
                  fontSizeClass={fontSizeClass}
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
                  onToggleBookmark={toggleBookmarkQuestion}
                  questions={allListeningQs}
                  renderText={renderHighlightRuns}
                  scopeField="trackIdx"
                  scopeIdx={safeTrackIdx}
                />
              )}
              {standaloneListeningQs.length > 0 ? (
                <ExamQuestionList
                  activeQuestionId={activeQuestionId}
                  answers={examState.answers}
                  baseOffset={listeningBaseOffset}
                  bookmarkedQuestions={bookmarkedQuestions}
                  fontSizeClass={fontSizeClass}
                  onAnswerChange={(qId, val) =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [qId]: val }
                    }))
                  }
                  onSelectQuestion={q => {
                    setActiveQuestionId(q.id);
                    setActiveBlankNum(typeof q.blankNum === 'number' ? q.blankNum : null);
                  }}
                  onSwitchScope={tIdx => switchPartIndex(tIdx, 'listening')}
                  onTextSelect={handlePassageTextSelect}
                  onToggleBookmark={toggleBookmarkQuestion}
                  questionCardRefs={questionCardRefs}
                  questions={standaloneListeningQs}
                  renderText={renderHighlightRuns}
                  scopeLabelPrefix="Part"
                  scopeType="listening"
                  showScopeBadge={examState.showAllListeningQs && listeningTracks.length > 1}
                />
              ) : !activeListeningCloze.trim() ? (
                <p className="text-xs text-slate-500 dark:text-neutral-400 text-center py-8">
                  Chưa có câu hỏi gắn cho Part {safeTrackIdx + 1}.
                </p>
              ) : null}
            </div>
          ))}

        {/* ============================================================
            3. WRITING WORKSPACE (Single-Task Split Pane matching Screenshots 4 & 5)
           ============================================================ */}
        {examState.skill === 'writing' && (
          <SplitResizableWorkspace
            splitPercent={splitPercent}
            onChangeSplit={setSplitPercent}
            left={
              <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden">
                <div
                  onMouseUp={handlePassageTextSelect}
                  data-exam-copy-source="true"
                  className="flex-1 overflow-y-auto cd-exam-scroll px-5 py-4 space-y-3.5 select-text"
                >
                  <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                    Questions {activeWritingTask + 1}
                  </h3>
                  <div className="text-xs sm:text-sm text-[#1F2937] dark:text-[#E5E7EB] space-y-1">
                    <p>You should spend about {activeWritingTask === 0 ? 20 : 40} minutes on this task.</p>
                    <p>
                      Write at least <strong>{currentWritingMinWords} words</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 text-[#111827] dark:text-[#F3F4F6]">
                    <span className="shrink-0 min-w-[26px] h-6 px-1.5 rounded bg-slate-100 dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#404040] text-xs font-extrabold inline-flex items-center justify-center mt-0.5">
                      {activeWritingTask + 1}
                    </span>
                    <p className={`${fontSizeClass} font-semibold leading-relaxed whitespace-pre-line`}>
                      {renderHighlightRuns(currentWritingCfg?.prompt || 'Chưa có đề bài cho phần Writing này.')}
                    </p>
                  </div>

                  {currentWritingCfg?.imageUrl && (
                    <div className="rounded-lg border border-[#CBD5E1] dark:border-[#3A3A3A] bg-white p-3 mt-2">
                      <img
                        src={currentWritingCfg.imageUrl}
                        alt={`Writing Task ${activeWritingTask + 1} Visual`}
                        onClick={() => setZoomedReadingImg(currentWritingCfg.imageUrl)}
                        className="w-full max-h-[46vh] object-contain mx-auto cursor-zoom-in rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomedReadingImg(currentWritingCfg.imageUrl)}
                        className="mt-2 mx-auto flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Phóng to biểu đồ / hình minh họa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            }
            right={
              <div className="h-full rounded-lg border border-slate-200 dark:border-[#323232] bg-white dark:bg-[#141414] flex flex-col overflow-hidden p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#111827] dark:text-white">
                    Your answer
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      currentWritingWords >= currentWritingMinWords
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {currentWritingWords >= currentWritingMinWords
                      ? `✓ Đạt tối thiểu ${currentWritingMinWords} từ`
                      : `Còn thiếu ${currentWritingMinWords - currentWritingWords} từ`}
                  </span>
                </div>

                {/* High-contrast crisp white paper essay box matching Screenshots 4 & 5 */}
                <textarea
                  data-exam-copy-source="true"
                  data-exam-answer-input="true"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                  data-lt-active="false"
                  value={examState.answers[currentWritingKey] || ''}
                  onChange={e =>
                    setExamState(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [currentWritingKey]: e.target.value }
                    }))
                  }
                  placeholder="Type your answer here..."
                  className={`flex-1 w-full min-h-[300px] sm:min-h-[380px] p-4 rounded-md bg-white text-[#111827] border border-[#CBD5E1] dark:border-[#404040] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none font-exam ${fontSizeClass} select-text`}
                />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded bg-[#EFEFEF] dark:bg-[#262626] border border-[#D1D5DB] dark:border-[#3F3F46] px-2.5 py-1 text-xs font-bold text-[#111827] dark:text-white">
                    <span className="text-slate-500 dark:text-neutral-400 font-semibold">Words Count:</span>
                    <span className="font-mono font-extrabold text-sm">{currentWritingWords}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500">
                    Tự động lưu nháp liên tục
                  </span>
                </div>
              </div>
            }
          />
        )}

        {/* ============================================================
            4. SPEAKING WORKSPACE (Integrated Section 4 after Writing)
           ============================================================ */}
        {examState.skill === 'speaking' && (
          <IntegratedSpeakingSection
            test={activeTest}
            recordingsMap={speakingRecordingsMap}
            speakingNotes={speakingNotes}
            onUpdateRecording={(qId, recData) =>
              setSpeakingRecordingsMap(prev => ({
                ...prev,
                [qId]: recData
              }))
            }
            onSpeakingNotesChange={(qId, text) =>
              setSpeakingNotes(prev => ({
                ...prev,
                [qId]: text
              }))
            }
          />
        )}

        {/* Floating Bottom-Right Question / Task Stepper Arrows (matching Screenshots 1–5) */}
        <div className="fixed bottom-16 right-4 sm:right-6 z-40 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStepQuestion(-1)}
            className="w-9 h-9 rounded-md border border-[#CBD5E1] dark:border-[#404040] bg-white dark:bg-[#262626] hover:bg-slate-100 dark:hover:bg-[#333333] text-[#111827] dark:text-white shadow-md flex items-center justify-center transition"
            title={examState.skill === 'writing' ? 'Task trước' : 'Câu trước'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleStepQuestion(1)}
            className="w-9 h-9 rounded-md border border-[#CBD5E1] dark:border-[#404040] bg-white dark:bg-[#262626] hover:bg-slate-100 dark:hover:bg-[#333333] text-[#111827] dark:text-white shadow-md flex items-center justify-center transition"
            title={examState.skill === 'writing' ? 'Task tiếp theo' : 'Câu tiếp theo'}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Bottom Sticky Part & Question Palette Bar (matches Screenshots 1–5) */}
      <footer className="bg-white dark:bg-[#141414] border-t border-slate-200 dark:border-[#2C2C2C] px-4 sm:px-6 py-2 sticky bottom-0 z-40">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center justify-start sm:justify-center gap-4 overflow-x-auto cd-exam-scroll flex-1 py-0.5">
            {navParts.map(part => {
              const isActive = part.idx === activePartIdx;
              const answeredInPart =
                examState.skill === 'writing'
                  ? part.questions[0]?.answered
                    ? 1
                    : 0
                  : part.questions.filter(q => String(examState.answers[q.id] || '').trim().length > 0).length;

              if (!isActive) {
                return (
                  <button
                    key={part.idx}
                    type="button"
                    onClick={() => switchPartIndex(part.idx, examState.skill)}
                    className="shrink-0 px-3 py-1.5 rounded-md border border-transparent hover:border-[#CBD5E1] dark:hover:border-[#3A3A3A] text-xs font-extrabold text-[#111827] dark:text-[#E5E7EB] hover:bg-slate-100 dark:hover:bg-[#222222] transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>{part.label}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                      {answeredInPart} of {part.questions.length}
                    </span>
                  </button>
                );
              }

              return (
                <div key={part.idx} className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#111827] dark:text-white pr-1 whitespace-nowrap">
                    {part.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {part.questions.map((q, qIdx) => {
                      const displayNum =
                        examState.skill === 'writing'
                          ? q.num
                          : getQuestionDisplayNumber(q, (part.offset || 0) + qIdx + 1);
                      const isAnswered =
                        examState.skill === 'writing'
                          ? Boolean(q.answered)
                          : String(examState.answers[q.id] || '').trim().length > 0;
                      const isFlagged = Boolean(bookmarkedQuestions[q.id]);
                      const isFocused =
                        examState.skill === 'writing' ||
                        activeQuestionId === q.id ||
                        (typeof q.blankNum === 'number' && Number(activeBlankNum) === Number(q.blankNum));

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            if (examState.skill !== 'writing') scrollToQuestionOrBlank(q, qIdx);
                          }}
                          title={`Câu ${displayNum}${isAnswered ? ' • Đã trả lời' : ''}${isFlagged ? ' • Đã đánh dấu' : ''}`}
                          className={`relative min-w-[27px] h-7 px-1.5 rounded-[4px] text-xs font-extrabold transition flex items-center justify-center border ${
                            isFocused
                              ? 'bg-white dark:bg-[#2A2A2A] text-[#111827] dark:text-white border-[#2563EB] dark:border-white ring-1 ring-[#2563EB] dark:ring-white/80'
                              : isAnswered
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-transparent text-slate-600 dark:text-[#D1D5DB] border-[#CBD5E1] dark:border-[#404040] hover:border-[#2563EB] dark:hover:border-neutral-300'
                          }`}
                        >
                          {displayNum}
                          {isFlagged && (
                            <span
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#141414]"
                              aria-label="Đã đánh dấu"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rightmost Submit Checkmark Button matching Screenshots 1–5 */}
          <button
            type="button"
            onClick={handleRequestSubmit}
            title={allSkillsVisited ? 'Hoàn thành & Nộp Bài' : `Cần qua đủ ${cfg.order.length} kỹ năng để nộp bài`}
            className={`shrink-0 w-9 h-9 rounded-md border flex items-center justify-center transition ${
              allSkillsVisited
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-100 dark:bg-[#242424] hover:bg-slate-200 dark:hover:bg-[#323232] text-slate-500 dark:text-neutral-300 border-[#CBD5E1] dark:border-[#3A3A3A]'
            }`}
          >
            {allSkillsVisited ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Lock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </footer>

      {/* ============================================================
          SLIDE-OVER EXAM MENU DRAWER (Instructions, Settings, Notes, Bookmarks)
         ============================================================ */}
      {showMenuDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex justify-end"
          onClick={() => setShowMenuDrawer(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#181818] border-l border-[#D5D9E0] dark:border-[#333333] h-full flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#2C2C2C] flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                Tùy Chỉnh &amp; Ghi Chú Phòng Thi
              </h3>
              <button
                type="button"
                onClick={() => setShowMenuDrawer(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282828]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto cd-exam-scroll p-5 space-y-5 text-xs">
              {/* Display Settings (Contrast + Font Size) */}
              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Hiển Thị Màn Hình
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDarkMode(false)}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${
                      !darkMode
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-neutral-200 border-[#CBD5E1] dark:border-[#383838]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Black on White
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${
                      darkMode
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-neutral-200 border-[#CBD5E1] dark:border-[#383838]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> White on Black
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FONT_SIZE_LABELS).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFontSizeMode(mode)}
                      className={`py-2 px-2 rounded-lg border font-bold transition ${
                        fontSizeMode === mode
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-neutral-200 border-[#CBD5E1] dark:border-[#383838]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookmarked Questions */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-400 flex items-center justify-between">
                  <span>Câu Đánh Dấu Xem Lại ({bookmarkedList.length})</span>
                </p>
                {bookmarkedList.length === 0 ? (
                  <p className="text-slate-500 dark:text-neutral-500 italic">
                    Chưa có câu hỏi nào được đánh dấu. Nhấn biểu tượng Bookmark trên mỗi câu để xem lại nhanh.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarkedList.map(item => (
                      <button
                        key={item.q.id}
                        type="button"
                        onClick={() => {
                          setShowMenuDrawer(false);
                          if (item.skill !== examState.skill) {
                            const sIdx = cfg.order.indexOf(item.skill);
                            if (!cfg.sequentialMode && sIdx >= 0) {
                              setExamState(prev => ({
                                ...prev,
                                skill: item.skill,
                                sectionIdx: sIdx,
                                readingPassageIdx: typeof item.q.passageIdx === 'number' ? item.q.passageIdx : prev.readingPassageIdx,
                                listeningTrackIdx: typeof item.q.trackIdx === 'number' ? item.q.trackIdx : prev.listeningTrackIdx
                              }));
                            }
                          } else {
                            if (typeof item.q.passageIdx === 'number') {
                              setExamState(prev => ({ ...prev, readingPassageIdx: item.q.passageIdx }));
                            }
                            if (typeof item.q.trackIdx === 'number') {
                              setExamState(prev => ({ ...prev, listeningTrackIdx: item.q.trackIdx }));
                            }
                          }
                          setTimeout(() => scrollToQuestionOrBlank(item.q, item.num - 1), 100);
                        }}
                        className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold inline-flex items-center gap-1 hover:bg-amber-500/25"
                      >
                        <Bookmark className="w-3 h-3 fill-current" />
                        <span>
                          {item.skill === 'reading' ? 'R' : 'L'}#{item.num}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Highlights & Notes */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                  Highlight &amp; Ghi Chú ({examState.highlights.length + examState.notes.length})
                </p>
                {examState.highlights.length === 0 && examState.notes.length === 0 ? (
                  <p className="text-slate-500 dark:text-neutral-500 italic">
                    Bôi đen văn bản trong bài đọc hoặc câu hỏi để tô màu Highlight hoặc tạo ghi chú.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {examState.highlights.map(h => (
                      <div
                        key={h.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#222222]"
                      >
                        <span
                          style={{ backgroundColor: h.color }}
                          className="text-[#111827] px-1.5 py-0.5 rounded font-medium leading-snug"
                        >
                          {h.text}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExamState(prev => ({
                              ...prev,
                              highlights: prev.highlights.filter(item => item.id !== h.id)
                            }))
                          }
                          className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                          title="Xóa highlight"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {examState.notes.map(n => (
                      <div
                        key={n.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/30"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-[#1E3A8A] dark:text-blue-200">📝 {n.note}</p>
                          {n.text && (
                            <p className="text-xs italic text-slate-500 dark:text-neutral-400 truncate">
                              “{n.text}”
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExamState(prev => ({
                              ...prev,
                              notes: prev.notes.filter(item => item.id !== n.id)
                            }))
                          }
                          className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                          title="Xóa ghi chú"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official CD Exam Tips */}
              <div className="p-3.5 rounded-lg border border-[#E5E7EB] dark:border-[#2E2E2E] bg-slate-50 dark:bg-[#222222] space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-neutral-300">
                <p className="font-extrabold text-[#111827] dark:text-white">Lưu Ý Giao Diện Thi IELTS:</p>
                <p>• Kéo thanh ↔ ở giữa màn hình để mở rộng khung Bài đọc / Biểu đồ hoặc khung Câu hỏi.</p>
                <p>• Bôi đen từ/câu trong Passage để Highlight vàng/xanh hoặc lưu ghi chú.</p>
                <p>• Đáp án và bài viết được tự động lưu nháp liên tục.</p>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] dark:border-[#2C2C2C] flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#141414]">
              {canTemporaryExit ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDrawer(false);
                    if (isTeacherUser) {
                      onExitExam?.();
                    } else {
                      setShowExitConfirmModal(true);
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] dark:border-[#3A3A3A] text-xs font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-200/70 dark:hover:bg-[#282828] flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isTeacherUser ? 'Thoát Xem Trước' : 'Lưu Nháp & Thoát'}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-300">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Thi thật: không cho phép tạm thoát</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowMenuDrawer(false);
                  handleRequestSubmit();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Nộp Bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hướng dẫn khi bấm Nộp bài nhưng chưa đi qua đủ các kỹ năng */}
      {showSubmitLockedModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSubmitLockedModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border border-[#D5D9E0] dark:border-[#333333] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#E5E7EB] dark:border-[#2C2C2C] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                    Chưa thể nộp toàn bài ({visitedInOrderCount}/{cfg.order.length} kỹ năng)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                    Để hoàn tất bài thi chuẩn {cfg.order.length} kỹ năng, bạn cần đi qua hết tất cả các phần theo thứ tự:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitLockedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-2 text-xs">
              {cfg.order.map((sId, idx) => {
                const visited = visitedSkillsList.includes(sId);
                const isCurrent = examState.skill === sId && idx === currentSectionIdx;
                const meta = skillMeta[sId] || { label: sId };
                return (
                  <div
                    key={sId}
                    className={`px-3.5 py-2.5 rounded-lg border flex items-center justify-between ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                        : visited
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-[#222222] border-slate-200 dark:border-[#343434] text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    <span className="font-bold">
                      {idx + 1}. {meta.label} ({cfg.durations[sId] || 15} phút)
                    </span>
                    <span className="font-extrabold">
                      {isCurrent ? 'Đang làm' : visited ? 'Đã qua ✓' : 'Chưa làm'}
                    </span>
                  </div>
                );
              })}

              {cfg.sequentialMode && !cfg.allowEarlyNextSection && currentSectionIdx < cfg.order.length - 1 && (
                <p className="p-3 rounded-lg bg-slate-50 dark:bg-[#222222] border border-slate-200 dark:border-[#343434] text-slate-600 dark:text-neutral-300 leading-relaxed mt-2">
                  Đề thi đang bật chế độ <b>Thi nối tiếp chuẩn IELTS</b>. Khi hết đồng hồ kỹ năng hiện tại, hệ thống sẽ tự động chuyển sang <b>{skillMeta[cfg.order[currentSectionIdx + 1]]?.label}</b>.
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#141414] border-t border-[#E5E7EB] dark:border-[#2C2C2C] flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitLockedModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70 dark:hover:bg-[#262626] transition"
              >
                Tiếp tục làm phần hiện tại
              </button>
              {(!cfg.sequentialMode || cfg.allowEarlyNextSection) && currentSectionIdx < cfg.order.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitLockedModal(false);
                    if (cfg.sequentialMode) {
                      openEarlyNextConfirmModal();
                    } else {
                      const nextSkill = cfg.order[currentSectionIdx + 1];
                      setExamState(prev => ({
                        ...prev,
                        sectionIdx: currentSectionIdx + 1,
                        skill: nextSkill,
                        timeRemaining: (cfg.durations[nextSkill] || 15) * 60,
                        visitedSkills: Array.from(new Set([...(prev.visitedSkills || [prev.skill]), nextSkill])),
                        listeningTrackIdx: 0,
                        readingPassageIdx: 0
                      }));
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition flex items-center gap-1.5"
                >
                  <span>Chuyển sang {skillMeta[cfg.order[currentSectionIdx + 1]]?.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Tạm Thoát (Chỉ mở khi Thi thử hoặc Giáo viên xem trước) */}
      {showExitConfirmModal && canTemporaryExit && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border border-[#D5D9E0] dark:border-[#333333] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#E5E7EB] dark:border-[#2C2C2C] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#262626] text-slate-700 dark:text-neutral-200 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111827] dark:text-white">
                    Lưu nháp và quay về Trang Chủ?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                    Các câu trả lời và bài viết của bạn được tự động lưu trên trình duyệt để bạn bấm &quot;Tiếp Tục Bài Đang Làm&quot; sau.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cfg.maxAttempts > 0 && (
              <div className="px-6 pt-4">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Đây là bài <b>Thi thật giới hạn lượt</b>. Bạn vẫn chưa nộp bài (chưa mất lượt), nhưng hãy quay lại hoàn thành và bấm Nộp Bài theo quy định của giáo viên.
                  </span>
                </div>
              </div>
            )}

            <div className="px-6 py-4 mt-2 bg-slate-50 dark:bg-[#141414] border-t border-[#E5E7EB] dark:border-[#2C2C2C] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#3A3A3A] hover:bg-slate-100 dark:hover:bg-[#323232] transition"
              >
                Ở lại làm bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  onExitExam?.();
                }}
                className="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition"
              >
                Lưu nháp &amp; Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Nộp Bài Thi */}
      {showSubmitConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSubmitConfirmModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border border-[#D5D9E0] dark:border-[#333333] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#E5E7EB] dark:border-[#2C2C2C] flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827] dark:text-white">
                    Bạn có chắc chắn muốn nộp bài không?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                    Sau khi xác nhận nộp bài, hệ thống sẽ lưu kết quả ngay và bạn sẽ không thể chỉnh sửa lại bài làm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Đóng hộp thoại xác nhận nộp bài"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {cfg.order.includes('listening') && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#333333]">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Listening</p>
                    <p className="text-base font-extrabold text-[#111827] dark:text-white mt-0.5">
                      {answeredListeningCount}/{allListeningQs.length} câu
                    </p>
                  </div>
                )}
                {cfg.order.includes('reading') && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#333333]">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Reading</p>
                    <p className="text-base font-extrabold text-[#111827] dark:text-white mt-0.5">
                      {answeredReadingCount}/{allReadingQs.length} câu
                    </p>
                  </div>
                )}
                {cfg.order.includes('writing') && writingTaskScope !== 'task2' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#333333]">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Writing Task 1</p>
                    <p className="text-base font-extrabold text-[#111827] dark:text-white mt-0.5">{w1Words} từ</p>
                  </div>
                )}
                {cfg.order.includes('writing') && writingTaskScope !== 'task1' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#333333]">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Writing Task 2</p>
                    <p className="text-base font-extrabold text-[#111827] dark:text-white mt-0.5">{w2Words} từ</p>
                  </div>
                )}
                {hasSpeakingSection && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#333333] col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Speaking (Ghi âm)</p>
                    <p className="text-base font-extrabold text-[#111827] dark:text-white mt-0.5">
                      {speakingRecordedCount} câu đã ghi âm
                    </p>
                  </div>
                )}
              </div>

              {(cfg.testMode !== 'single_skill' || cfg.focusSkill === 'writing') && (
                <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs leading-relaxed">
                  <strong>Quy trình duyệt bài:</strong> Sau khi nộp, bài làm sẽ chuyển sang trạng thái <strong>Ms. Như đang check</strong>. Điểm chính thức &amp; nhận xét sẽ hiển thị ngay sau khi Ms. Như duyệt và trả bài!
                </div>
              )}

              {((cfg.order.includes('listening') && answeredListeningCount < allListeningQs.length) ||
                (cfg.order.includes('reading') && answeredReadingCount < allReadingQs.length) ||
                (cfg.order.includes('writing') && writingTaskScope !== 'task2' && w1Words === 0) ||
                (cfg.order.includes('writing') && writingTaskScope !== 'task1' && w2Words === 0) ||
                (hasSpeakingSection && speakingRecordedCount === 0)) && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Một số câu hỏi, bài Writing hoặc phần ghi âm Speaking hiện vẫn còn trống. Bạn có thể bấm <strong>Quay lại làm tiếp</strong> để rà soát trước khi nộp bài.
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#141414] border-t border-[#E5E7EB] dark:border-[#2C2C2C] flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmittingExam}
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#3A3A3A] hover:bg-slate-100 dark:hover:bg-[#323232] disabled:opacity-50 transition"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmittingExam}
                onClick={async () => {
                  setIsSubmittingExam(true);
                  try {
                    await handleFinalExamSubmit(speakingRecordingsMap);
                  } finally {
                    setIsSubmittingExam(false);
                  }
                }}
                className="px-5 py-2 rounded-lg text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingExam ? 'Đang gửi bài cho Ms. Như...' : 'Xác nhận Nộp Bài'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Chuyển Sớm Kỹ Năng (Khóa Vĩnh Viễn Kỹ Năng Cũ) */}
      {earlyNextConfirmOpen && cfg.sequentialMode && currentSectionIdx < cfg.order.length - 1 && (() => {
        const currMeta = skillMeta[examState.skill] || { label: examState.skill };
        const nextSkill = cfg.order[currentSectionIdx + 1];
        const nextMeta = skillMeta[nextSkill] || { label: nextSkill };
        const safeRem = Math.max(0, Math.floor(examState.timeRemaining || 0));
        const remMin = Math.floor(safeRem / 60);
        const remSec = safeRem % 60;
        const currProgressText =
          examState.skill === 'listening'
            ? `${answeredListeningCount}/${allListeningQs.length} câu Listening`
            : examState.skill === 'reading'
            ? `${answeredReadingCount}/${allReadingQs.length} câu Reading`
            : `${w1Words} từ Task 1 · ${w2Words} từ Task 2`;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEarlyNextConfirmOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border border-amber-400/50 dark:border-amber-500/40 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#2C2C2C] flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#111827] dark:text-white">
                      Chuyển sang kỹ năng {nextMeta.label}?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                      Bạn đang yêu cầu chuyển sớm từ <strong>{currMeta.label}</strong> sang <strong>{nextMeta.label}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEarlyNextConfirmOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Đóng thông báo chuyển kỹ năng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-3.5">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Thời gian còn lại phần {currMeta.label}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-200 mt-0.5">
                      Tiến độ hiện tại: <strong>{currProgressText}</strong>
                    </p>
                  </div>
                  <div className="text-xl font-black font-mono text-blue-700 dark:text-blue-300 tabular-nums shrink-0">
                    {formatTime(safeRem)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-extrabold">Cảnh báo: Không thể quay lại kỹ năng cũ!</p>
                    <p>
                      Bạn vẫn còn <strong>{remMin} phút {remSec.toString().padStart(2, '0')} giây</strong>. Sau khi xác nhận chuyển sang <strong>{nextMeta.label}</strong>, phần <strong>{currMeta.label}</strong> sẽ bị khóa vĩnh viễn và thời gian còn lại sẽ không cộng dồn sang phần sau.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-[#141414] border-t border-[#E5E7EB] dark:border-[#2C2C2C] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEarlyNextConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-[#262626] border border-[#CBD5E1] dark:border-[#3A3A3A] hover:bg-slate-100 dark:hover:bg-[#323232] transition"
                >
                  Ở lại làm tiếp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEarlyNextConfirmOpen(false);
                    advanceToNextExamSection(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md flex items-center gap-1.5 transition"
                >
                  <span>Chuyển sang {nextMeta.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
