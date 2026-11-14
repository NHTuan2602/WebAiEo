import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  Eye,
  Headphones,
  Lock,
  MessageSquare,
  Moon,
  PenTool,
  Play,
  Sun,
  Volume2,
  X
} from 'lucide-react';
import { getListeningAudioKey, getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { getWordCount } from '../utils/examHelpers';

export default function ExamMode({
  addHighlight,
  addNote,
  advanceToNextExamSection,
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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

  return (
    <div
      onContextMenu={cfg.antiCheatEnabled ? (e) => e.preventDefault() : undefined}
      className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between select-none"
    >
      {/* Exam Header (LexiPrep Computer-Delivered Shell) */}
      <header className="bg-[#0F172B] dark:bg-[#020618] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow sticky top-0 z-50">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-sm md:text-base text-slate-100">{activeTest.title}</h2>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700 uppercase font-bold">
            Phần {currentSectionIdx + 1}/{cfg.order.length}: {examState.skill}
          </span>
        </div>

        {/* Skill Selector Tabs (Sequential order respected when enabled) */}
        <div className="flex bg-slate-800 p-1 rounded-xl text-xs gap-1 flex-wrap">
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
                    ? `Chế độ làm tuần tự: Hết giờ ${skillMeta[examState.skill]?.label || ''} hệ thống sẽ tự động chuyển phần.`
                    : `Kỹ năng ${meta.label} (${cfg.durations[sId]} phút)${isVisited ? ' • Đã xem' : ' • Chưa xem'}`
                }
                onClick={() => {
                  if (isLocked || isCurrent) return;
                  stopExamAudio();
                  setExamState(prev => ({
                    ...prev,
                    skill: sId,
                    sectionIdx: idx,
                    visitedSkills: Array.from(new Set([...(prev.visitedSkills || [prev.skill]), sId]))
                  }));
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  isCurrent
                    ? 'bg-[#007A7A] text-white shadow'
                    : isDone
                    ? 'text-emerald-400/80 bg-slate-900/50 cursor-not-allowed'
                    : isLocked
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className="text-[10px] font-mono opacity-80">{idx + 1}.</span>
                <IconComp className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-75">({cfg.durations[sId]}p)</span>
                {isLocked && !isDone && <Lock className="w-3 h-3 text-slate-500" />}
                {(isDone || (!isLocked && !isCurrent && isVisited)) && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {cfg.sequentialMode && cfg.allowEarlyNextSection && currentSectionIdx < cfg.order.length - 1 && (
            <button
              type="button"
              onClick={() => advanceToNextExamSection(false)}
              className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold text-xs px-3 py-2 rounded-lg transition shadow flex items-center gap-1"
            >
              <span>Sang Phần Tiếp Theo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
            aria-label={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <div
            className={`flex items-center gap-2 font-mono font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg border ${
              examState.timeRemaining <= 60
                ? 'text-rose-400 border-rose-500/60'
                : 'text-amber-400 border-slate-700'
            }`}
            title={cfg.sequentialMode ? 'Hết giờ kỹ năng sẽ tự động chuyển sang phần tiếp theo' : 'Thời gian còn lại'}
          >
            <Clock className="w-4 h-4 animate-pulse" />
            <span>{formatTime(examState.timeRemaining)}</span>
          </div>

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
            className={`font-bold text-xs px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5 ${
              allSkillsVisited
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-700/70 text-slate-400 border border-slate-600 cursor-not-allowed opacity-60'
            }`}
          >
            {!allSkillsVisited && <Lock className="w-3.5 h-3.5" />}
            <span>
              {allSkillsVisited
                ? 'Nộp Bài Thi (Finish)'
                : `Nộp Bài (${visitedInOrderCount}/${cfg.order.length} kỹ năng)`}
            </span>
          </button>
        </div>
      </header>

      {/* Exam Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 overflow-hidden">
        {/* Listening */}
        {examState.skill === 'listening' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[78vh]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden shadow-sm">
              {/* Multi-Topic Switcher Buttons (1, 2, 3...) matching Reading */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {listeningTracks.map((tr, trIdx) => {
                    const trKey = getListeningAudioKey(tr, trIdx);
                    const trPlays = examState.audioPlays[trKey] || 0;
                    const maxPlays = activeTest.maxAudioPlays || 1;
                    const isPlayingThis = isPlayingAudio && playingAudioKey === trKey;
                    const isSelected = trIdx === safeTrackIdx;

                    return (
                      <button
                        key={tr.id || trIdx}
                        type="button"
                        onClick={() => setExamState(prev => ({ ...prev, listeningTrackIdx: trIdx }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/15'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                          isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {trIdx + 1}
                        </span>
                        <span className="max-w-[140px] truncate">{tr.title || `Chủ đề ${trIdx + 1}`}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isPlayingThis
                            ? 'bg-amber-400 text-slate-900 animate-pulse'
                            : trPlays >= maxPlays
                            ? isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            : isSelected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isPlayingThis ? '▶' : `${trPlays}/${maxPlays}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedPassageText && (
                  <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-xs animate-bounce shadow-lg">
                    <span className="text-[10px] text-slate-300 mr-1">Highlight:</span>
                    <button onClick={() => addHighlight('#fef08a')} className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition" title="Vàng" />
                    <button onClick={() => addHighlight('#bbf7d0')} className="w-4 h-4 rounded-full bg-emerald-300 hover:scale-110 transition" title="Xanh lá" />
                    <button onClick={addNote} className="ml-2 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] text-cyan-300">
                      <MessageSquare className="w-3 h-3" /> Ghi chú
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
                {listeningTracks.length > 1 ? `Chủ đề ${safeTrackIdx + 1}: ` : ''}{activeTrack?.title}
              </h3>

              {/* Audio Player Box for Active Topic */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Listening Audio (Chuẩn No-Rewind IDP)
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Giới hạn: <span className="font-bold text-slate-700 dark:text-slate-200">{activeTest.maxAudioPlays} lần</span>
                    </p>
                    {activeTrack?.audioFileName ? (
                      <span className="text-[11px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                        🎵 {activeTrack.audioFileName}
                      </span>
                    ) : activeTrack?.transcript ? (
                      <span className="text-[11px] bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-0.5 rounded-full">
                        🔊 AI Voice (TTS)
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded font-mono font-bold">
                    {examState.audioPlays[activeTrackPlayKey] || 0} / {activeTest.maxAudioPlays}
                  </span>

                  <button
                    onClick={() => handlePlayListeningAudio(activeTrackPlayKey, activeTrack?.transcript || '', activeTrack?.audioUrl || '')}
                    disabled={(examState.audioPlays[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays || isPlayingAudio}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                      (examState.audioPlays[activeTrackPlayKey] || 0) >= activeTest.maxAudioPlays
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : isPlayingAudio
                        ? 'bg-amber-500 text-white animate-pulse cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                    }`}
                  >
                    {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    {isPlayingAudio && playingAudioKey === activeTrackPlayKey
                      ? 'Đang Phát Audio...'
                      : isPlayingAudio
                      ? 'Đang Phát Khác...'
                      : listeningTracks.length > 1
                      ? `Phát Chủ đề ${safeTrackIdx + 1}`
                      : 'Phát Bài Nghe'}
                  </button>
                </div>
              </div>

              {/* Optional Diagram / Sheet Image & Topic Context Text (mirroring Reading) */}
              <div
                onMouseUp={handlePassageTextSelect}
                className="flex-1 overflow-y-auto pr-2 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
              >
                {activeTrack?.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 relative group">
                    <img
                      src={activeTrack.imageUrl}
                      alt={`Listening Topic ${safeTrackIdx + 1}`}
                      onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                      className="w-full max-h-[48vh] object-contain rounded-lg mx-auto cursor-zoom-in"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                      className="mt-2 mx-auto flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline font-sans"
                    >
                      <Eye className="w-3.5 h-3.5" /> Phóng to ảnh / sơ đồ chủ đề #{safeTrackIdx + 1}
                    </button>
                  </div>
                )}

                {activeTrack?.contextText ? (
                  activeTrack.contextText
                ) : !activeTrack?.imageUrl ? (
                  <div className="font-sans text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-700">
                    🎧 Nhấn nút <strong className="text-slate-700 dark:text-slate-200">Phát</strong> ở trên để bắt đầu nghe âm thanh và chọn/điền đáp án ở khung câu hỏi bên phải.
                  </div>
                ) : null}
              </div>

              {(examState.highlights.length > 0 || examState.notes.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs overflow-x-auto">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Đã lưu:</span>
                  {examState.highlights.map(h => (
                    <span key={h.id} style={{ backgroundColor: h.color }} className="px-2 py-0.5 rounded text-[11px] truncate max-w-[120px] text-slate-900">
                      {h.text}
                    </span>
                  ))}
                  {examState.notes.map(n => (
                    <span key={n.id} className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 px-2 py-0.5 rounded text-[11px] truncate max-w-[140px] border border-cyan-200 dark:border-cyan-500/30">
                      📝 {n.note}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-y-auto shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  Câu Hỏi Phần Listening {listeningTracks.length > 1 && hasScopedListeningQs && !examState.showAllListeningQs ? `(Chủ đề ${safeTrackIdx + 1})` : ''}
                </h3>
                {listeningTracks.length > 1 && hasScopedListeningQs && (
                  <button
                    type="button"
                    onClick={() => setExamState(prev => ({ ...prev, showAllListeningQs: !prev.showAllListeningQs }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    {examState.showAllListeningQs ? `Chỉ xem Chủ đề ${safeTrackIdx + 1}` : `Xem tất cả (${allListeningQs.length})`}
                  </button>
                )}
              </div>

              {displayedListeningQs.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-6 text-center">
                  Chưa có câu hỏi gắn riêng cho Chủ đề {safeTrackIdx + 1}. Hãy chuyển chủ đề khác hoặc bấm &quot;Xem tất cả&quot;.
                </p>
              ) : (
                displayedListeningQs.map(q => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{q.question}</p>
                      {typeof q.trackIdx === 'number' && listeningTracks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExamState(prev => ({ ...prev, listeningTrackIdx: Math.min(q.trackIdx, listeningTracks.length - 1) }))}
                          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                        >
                          Chủ đề {q.trackIdx + 1}
                        </button>
                      )}
                    </div>

                    {(q.type === 'mcq' || q.type === 'tfng') && (
                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt}
                              checked={examState.answers[q.id] === opt}
                              onChange={e => setExamState(prev => ({
                                ...prev,
                                answers: { ...prev.answers, [q.id]: e.target.value }
                              }))}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'fill' && (
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời..."
                        value={examState.answers[q.id] || ''}
                        onChange={e => setExamState(prev => ({
                          ...prev,
                          answers: { ...prev.answers, [q.id]: e.target.value }
                        }))}
                        className="w-full max-w-md px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reading */}
        {examState.skill === 'reading' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[78vh]">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden shadow-sm">
              {/* Multi-Passage Switcher Buttons (1, 2, 3...) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {readingPassages.map((p, pIdx) => (
                    <button
                      key={p.id || pIdx}
                      type="button"
                      onClick={() => setExamState(prev => ({ ...prev, readingPassageIdx: pIdx }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border ${
                        pIdx === safePassageIdx
                          ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                        pIdx === safePassageIdx ? 'bg-white text-[#007A7A]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {pIdx + 1}
                      </span>
                      <span className="max-w-[140px] truncate">{p.title || `Bài ${pIdx + 1}`}</span>
                    </button>
                  ))}
                </div>

                {selectedPassageText && (
                  <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-xs animate-bounce shadow-lg">
                    <span className="text-[10px] text-slate-300 mr-1">Highlight:</span>
                    <button onClick={() => addHighlight('#fef08a')} className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition" title="Vàng" />
                    <button onClick={() => addHighlight('#bbf7d0')} className="w-4 h-4 rounded-full bg-emerald-300 hover:scale-110 transition" title="Xanh lá" />
                    <button onClick={addNote} className="ml-2 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] text-cyan-300">
                      <MessageSquare className="w-3 h-3" /> Ghi chú
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-3">
                {readingPassages.length > 1 ? `Bài ${safePassageIdx + 1}: ` : ''}{activePassage?.title}
              </h3>

              <div
                onMouseUp={handlePassageTextSelect}
                className="flex-1 overflow-y-auto pr-3 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line select-text font-serif"
              >
                {activePassage?.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 relative group">
                    <img
                      src={activePassage.imageUrl}
                      alt={`Reading Passage ${safePassageIdx + 1}`}
                      onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                      className="w-full max-h-[52vh] object-contain rounded-lg mx-auto cursor-zoom-in"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                      className="mt-2 mx-auto flex items-center gap-1.5 text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Phóng to ảnh bài đọc #{safePassageIdx + 1}
                    </button>
                  </div>
                )}
                {activePassage?.passageText}
              </div>

              {(examState.highlights.length > 0 || examState.notes.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs overflow-x-auto">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Đã lưu:</span>
                  {examState.highlights.map(h => (
                    <span key={h.id} style={{ backgroundColor: h.color }} className="px-2 py-0.5 rounded text-[11px] truncate max-w-[120px] text-slate-900">
                      {h.text}
                    </span>
                  ))}
                  {examState.notes.map(n => (
                    <span key={n.id} className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 px-2 py-0.5 rounded text-[11px] truncate max-w-[140px] border border-cyan-200 dark:border-cyan-500/30">
                      📝 {n.note}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-y-auto shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
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

              {displayedReadingQs.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-6 text-center">
                  Chưa có câu hỏi gắn riêng cho Bài {safePassageIdx + 1}. Hãy chuyển bài đọc hoặc bấm "Xem tất cả".
                </p>
              ) : (
                displayedReadingQs.map(q => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{q.question}</p>
                      {typeof q.passageIdx === 'number' && readingPassages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExamState(prev => ({ ...prev, readingPassageIdx: q.passageIdx }))}
                          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                        >
                          Bài {q.passageIdx + 1}
                        </button>
                      )}
                    </div>

                    {(q.type === 'mcq' || q.type === 'tfng') && (
                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input
                              type="radio"
                              name={`rq_${q.id}`}
                              value={opt}
                              checked={examState.answers[q.id] === opt}
                              onChange={e => setExamState(prev => ({
                                ...prev,
                                answers: { ...prev.answers, [q.id]: e.target.value }
                              }))}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'fill' && (
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời..."
                        value={examState.answers[q.id] || ''}
                        onChange={e => setExamState(prev => ({
                          ...prev,
                          answers: { ...prev.answers, [q.id]: e.target.value }
                        }))}
                        className="w-full max-w-md px-3.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Writing */}
        {examState.skill === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[78vh]">
            {/* Task 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Writing Task 1
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    getWordCount(examState.answers['w1']) >= (activeTest.writing?.task1?.minWords || 150)
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}>
                    {getWordCount(examState.answers['w1'])} / {activeTest.writing?.task1?.minWords || 150} từ
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                  {activeTest.writing?.task1?.prompt}
                </p>

                {activeTest.writing?.task1?.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2">
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
                  value={examState.answers['w1'] || ''}
                  onChange={e => setExamState(prev => ({
                    ...prev,
                    answers: { ...prev.answers, w1: e.target.value }
                  }))}
                  className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            {/* Task 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Writing Task 2
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    getWordCount(examState.answers['w2']) >= (activeTest.writing?.task2?.minWords || 250)
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  }`}>
                    {getWordCount(examState.answers['w2'])} / {activeTest.writing?.task2?.minWords || 250} từ
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed mb-3">
                  {activeTest.writing?.task2?.prompt}
                </p>

                <textarea
                  rows={12}
                  placeholder="Viết bài Task 2 của bạn ở đây..."
                  value={examState.answers['w2'] || ''}
                  onChange={e => setExamState(prev => ({
                    ...prev,
                    answers: { ...prev.answers, w2: e.target.value }
                  }))}
                  className="w-full p-3.5 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Xác Nhận Nộp Bài Thi (In-app modal để không kích hoạt window blur chống gian lận) */}
      {showSubmitConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSubmitConfirmModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Bạn có chắc chắn muốn nộp bài không?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                  <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {answeredListeningCount}/{allListeningQs.length} câu
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reading</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {answeredReadingCount}/{allReadingQs.length} câu
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Writing Task 1</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {w1Words} từ
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Writing Task 2</p>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
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
                className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
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
