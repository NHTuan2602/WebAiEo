import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Crown,
  Download,
  Edit,
  EyeOff,
  Filter,
  Gamepad2,
  Globe,
  GraduationCap,
  Key,
  Loader2,
  Lock,
  PenTool,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
  Wifi,
  X
} from 'lucide-react';
import { DEFAULT_VOCAB_TEXT, getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { countExtensionCheatSignals, exportAttemptsToCsv, getRiskAssessment, getWordCount, normalizeRoomObject } from '../utils/examHelpers';
import AmongUsCrewmate from '../components/common/AmongUsCrewmate';

export default function TeacherDashboard({
  aiGradingStep,
  attempts,
  copiedRoomPin,
  currentRoomPin,
  currentUser,
  expandedTeacherTestId,
  gradingAttempt,
  gradingFilters,
  gradingScores,
  handleCopyInviteLink,
  handleDeleteAccount,
  handleDeleteAttempt,
  handleDeleteRoom,
  handleDeleteTest,
  handleDuplicateTest,
  handleKickLobbyPlayer,
  handleTeacherAIGrade,
  handleTeacherOpenLobby,
  handleTeacherResetLobby,
  initGameCampaign,
  isGradingAI,
  openExamBuilder,
  roomsDb,
  saveTeacherGrading,
  setAddStudentMode,
  setCopiedRoomPin,
  setCurrentRoomPin,
  setCustomVocabInput,
  setEditingStudentAccount,
  setEditingTargetUser,
  setExpandedTeacherTestId,
  setGradingAttempt,
  setGradingFilters,
  setGradingScores,
  setShowAddStudentModal,
  setShowCreateRoomModal,
  setShowVocabModal,
  setStudentPasswordDraft,
  setStudentSearchQuery,
  setTeacherHubTab,
  setView,
  showToast,
  studentSearchQuery,
  teacherHubTab,
  tests,
  toggleTestAllowViewAnswers,
  toggleTestAntiCheat,
  toggleTestExamMode,
  toggleTestVisibility,
  updateTestQuickDuration,
  usersDb
}) {
  const [accountRoleFilter, setAccountRoleFilter] = useState('all');

  const room = normalizeRoomObject(roomsDb[currentRoomPin] || { pin: currentRoomPin, pass: 'ielts', players: {} }, currentRoomPin);
  const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin));
  const lobbyPlayersList = Object.values(room.lobbyPlayers || {});
  const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
  const allAccounts = Object.values(usersDb || {}).filter(Boolean).sort((a, b) => {
    if (a.role !== b.role) return a.role === 'teacher' ? -1 : 1;
    return (a.name || a.username || '').localeCompare(b.name || b.username || '');
  });
  const teacherAccountsCount = allAccounts.filter(u => u.role === 'teacher').length;
  const studentAccountsCount = allAccounts.filter(u => u.role === 'student').length;
  const filteredAccounts = allAccounts.filter(u => {
    if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) return false;
    const q = studentSearchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Trung Tâm Điều Hành Giáo Viên
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Bảng Điều Khiển Giáo Viên (Teacher Hub)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quản lý kho đề thi, chấm điểm bài làm với AI, giám sát chống gian lận, điều phối Game PIN và cấp tài khoản.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openExamBuilder()}
            className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo Đề Thi Mới
          </button>
          <button
            type="button"
            onClick={() => {
              setTeacherHubTab('accounts');
              setAddStudentMode('single');
              setShowAddStudentModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Tạo Tài Khoản
          </button>
          <button
            onClick={() => handleTeacherOpenLobby(currentRoomPin)}
            className="bg-[#059271] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <Rocket className="w-4 h-4" /> Sảnh Chờ Game PIN ({currentRoomPin})
          </button>
          <button
            onClick={() => {
              setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
              setShowVocabModal(true);
            }}
            className="bg-[#F25220] hover:bg-[#d94417] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Sửa Bộ Từ Game
          </button>
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 flex-wrap">
        <button
          onClick={() => setTeacherHubTab('tests')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            teacherHubTab === 'tests' ? 'border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 1. Kho Đề Thi ({tests.length})
        </button>
        <button
          onClick={() => setTeacherHubTab('grading')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            teacherHubTab === 'grading' ? 'border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PenTool className="w-4 h-4" /> 2. Chấm Bài & Giám Sát Chống Gian Lận ({attempts.length})
        </button>
        <button
          onClick={() => setTeacherHubTab('game_room')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            teacherHubTab === 'game_room' ? 'border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" /> 3. Phòng Đấu Game PIN & Bảng Xếp Hạng ({leaderboardPlayers.length})
        </button>
        <button
          onClick={() => setTeacherHubTab('accounts')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            (teacherHubTab === 'accounts' || teacherHubTab === 'students') ? 'border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> 4. Tạo &amp; Quản Lý Tài Khoản ({allAccounts.length})
        </button>
      </div>

      {/* Tab 1: Kho Đề Thi */}
      {teacherHubTab === 'tests' && (
        <div className="space-y-3">
          {tests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có đề thi nào. Bấm <strong>Tạo Đề Thi Mới</strong> để bắt đầu.
            </div>
          ) : tests.map(t => {
            const cfg = normalizeExamConfig(t);
            const isPrivate = cfg.visibility === 'private';
            const isExpanded = expandedTeacherTestId === t.id;

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition ${
                  isExpanded
                    ? 'border-blue-500/60 dark:border-blue-500/40 shadow-md p-5 sm:p-6'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Minimal Header Row: Title + Công khai / Chỉ mình tôi */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedTeacherTestId(prev => (prev === t.id ? null : t.id))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedTeacherTestId(prev => (prev === t.id ? null : t.id));
                    }
                  }}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center justify-between gap-3 text-left cursor-pointer select-none ${
                    isExpanded ? '' : 'px-5 py-4'
                  }`}
                >
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                    {t.title}
                  </h3>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleTestVisibility(t.id);
                      }}
                      title="Bấm để chuyển Công khai / Chỉ mình tôi thấy"
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition border ${
                        isPrivate
                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
                      }`}
                    >
                      {isPrivate ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {isPrivate ? 'Chỉ mình tôi' : 'Công khai'}
                    </button>

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details Panel (Visible only when clicked) */}
                {isExpanded && (() => {
                  const listeningTracks = getListeningTracks(t.listening);
                  const listeningTracksCount = listeningTracks.length;
                  const hasListeningAudio = listeningTracks.some(tr => !!tr.audioUrl);
                  const hasListeningImg = listeningTracks.some(tr => !!tr.imageUrl);
                  const passagesCount = getReadingPassages(t.reading).length;
                  const hasReadingImg = getReadingPassages(t.reading).some(p => !!p.imageUrl);

                  return (
                    <div className="mt-4 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                            Listening: {t.listening?.questions?.length || 0} • Reading: {t.reading?.questions?.length || 0}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-2 py-0.5 rounded-md">
                            ⏱ {cfg.durations.listening}p L • {cfg.durations.reading}p R • {cfg.durations.writing}p W
                          </span>
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                            {cfg.maxAttempts === 0 ? '∞ Làm tự do' : `🔒 Tối đa ${cfg.maxAttempts} lần`}
                          </span>
                          {cfg.sequentialMode && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md">
                              Tuần tự: {cfg.order.map(s => s[0].toUpperCase()).join('→')}
                            </span>
                          )}
                          {hasListeningAudio ? (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                              🎵 {listeningTracksCount > 1 ? `${listeningTracksCount} chủ đề nghe` : 'Đã đính kèm Audio'}
                            </span>
                          ) : listeningTracksCount > 1 || hasListeningImg ? (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                              🎧 {listeningTracksCount} chủ đề nghe {hasListeningImg ? '(có ảnh)' : '(AI Voice)'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-md">
                              🔊 Dùng AI Voice (TTS)
                            </span>
                          )}
                          {(hasReadingImg || passagesCount > 1) && (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                              🖼️ {passagesCount} bài Reading
                            </span>
                          )}
                          {t.writing?.task1?.imageUrl && (
                            <span className="text-[10px] bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/30">
                              📊 Có biểu đồ Task 1
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                        {/* Inline Quick Controls: Per-Skill Durations */}
                        <div className="p-3.5 rounded-2xl bg-[#EDFFFD]/65 dark:bg-teal-500/10 border border-[#B5F5F1] dark:border-teal-500/30 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-[#003538] dark:text-[#1EE1D6] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Thời gian từng phần (phút)
                            </span>
                            <button
                              type="button"
                              onClick={() => openExamBuilder(t, 'general')}
                              className="text-[10px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
                            >
                              Thứ tự &amp; Tuần tự →
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {cfg.order.map((sId, sIdx) => (
                              <div key={sId} className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-[#B5F5F1]/80 dark:border-slate-700 text-center">
                                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                  {sIdx + 1}. {sId === 'listening' ? 'Nghe' : sId === 'reading' ? 'Đọc' : 'Viết'}
                                </span>
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  <input
                                    key={`${t.id}-${sId}-${cfg.durations[sId]}`}
                                    type="number"
                                    min={1}
                                    max={180}
                                    defaultValue={cfg.durations[sId]}
                                    onBlur={e => {
                                      const parsed = Math.max(1, Math.min(180, Number(e.target.value) || cfg.durations[sId]));
                                      e.target.value = String(parsed);
                                      if (parsed !== cfg.durations[sId]) {
                                        updateTestQuickDuration(t.id, sId, parsed);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    title="Nhập số phút rồi bấm ra ngoài hoặc nhấn Enter để lưu"
                                    className="w-12 px-1 py-0.5 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">p</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                            {cfg.sequentialMode
                              ? 'Hết giờ từng phần sẽ tự động chuyển sang phần tiếp theo.'
                              : 'Đang cho phép chuyển tự do giữa các phần.'}
                          </p>
                        </div>

                        {/* Right column: 4 Quick Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Quick Toggle Visibility (Ẩn / Công khai) */}
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Hiển thị đề cho học sinh</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isPrivate ? 'Đang ẩn — HS chưa thấy' : 'Công khai — HS làm được'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTestVisibility(t.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                                isPrivate
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                              {isPrivate ? 'Đang Ẩn' : 'Công Khai'}
                            </button>
                          </div>

                          {/* Quick Toggle Practice vs Real Exam (Thi thử nhiều lần / Thi thật 1 lần) */}
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Chế độ Thi thử / Thi thật</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {cfg.maxAttempts === 1
                                  ? 'Thi thật: Chỉ làm 1 lần'
                                  : cfg.maxAttempts === 0
                                  ? 'Thi thử: Làm nhiều lần'
                                  : `Giới hạn ${cfg.maxAttempts} lần`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTestExamMode(t.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                                cfg.maxAttempts === 1
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              {cfg.maxAttempts === 1 ? 'Thi Thật' : cfg.maxAttempts === 0 ? 'Thi Thử' : `Tối đa ${cfg.maxAttempts}`}
                            </button>
                          </div>

                          {/* Quick Toggle Allow View Correct Answers */}
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Xem đáp án đúng</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {t.allowViewAnswers ? 'HS xem được sau khi nộp' : 'Đang ẩn đáp án đúng'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTestAllowViewAnswers(t.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                                t.allowViewAnswers
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {t.allowViewAnswers ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" /> Đã Mở
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" /> Đang Khóa
                                </>
                              )}
                            </button>
                          </div>

                          {/* Quick Toggle Stealth Anti-Cheat (Hidden from Students) */}
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Chống gian lận (Ẩn với HS)</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {cfg.antiCheatEnabled ? 'Đếm tab, khóa chuột phải & Extension' : 'Đang tắt — làm tự do'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTestAntiCheat(t.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm flex-shrink-0 ${
                                cfg.antiCheatEnabled
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {cfg.antiCheatEnabled ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" /> Đang Bật
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" /> Đang Tắt
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openExamBuilder(t, 'general')}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" /> Cài Giờ &amp; Thứ Tự
                          </button>
                          <button
                            type="button"
                            onClick={() => openExamBuilder(t, 'reading')}
                            className="bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30"
                          >
                            <Edit className="w-3.5 h-3.5" /> Soạn Câu Hỏi &amp; Ảnh
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateTest(t)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/15 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 transition"
                            title="Nhân bản đề thi (Bản sao tự động ở chế độ Riêng tư)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTest(t)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                            title="Xóa đề thi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedTeacherTestId(null)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
                          >
                            Thu gọn
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Giám Sát Gian Lận & Chấm Điểm */}
      {teacherHubTab === 'grading' && (() => {
        const pendingCount = attempts.filter(a => !a.teacherGraded).length;
        const highRiskCount = attempts.filter(a => (a.tabSwitchCount || 0) >= 3 || countExtensionCheatSignals(a.antiCheatLogs) > 0).length;
        const gradedBands = attempts.filter(a => typeof a.overallBand === 'number').map(a => a.overallBand);
        const avgBandDisplay = gradedBands.length > 0
          ? (gradedBands.reduce((acc, b) => acc + b, 0) / gradedBands.length).toFixed(1)
          : '-';

        const filteredAttempts = attempts.filter(att => {
          if (gradingFilters.testId !== 'all' && att.testId !== gradingFilters.testId) return false;
          if (gradingFilters.status === 'pending' && att.teacherGraded) return false;
          if (gradingFilters.status === 'graded' && !att.teacherGraded) return false;
          if (gradingFilters.risk === 'risk' && (att.tabSwitchCount || 0) < 3 && countExtensionCheatSignals(att.antiCheatLogs) === 0) return false;
          if (gradingFilters.search.trim()) {
            const q = gradingFilters.search.trim().toLowerCase();
            const hay = `${att.studentName || ''} ${att.studentId || ''} ${att.testTitle || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        const uniqueAttemptTests = Array.from(
          new Map(attempts.map(a => [a.testId, a.testTitle || a.testId])).entries()
        );

        return (
        <div className="space-y-4">
          {/* 4 Analytics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng bài đã nộp</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{attempts.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Chờ chấm Writing</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1 tabular-nums">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Band TB toàn lớp</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1 tabular-nums">{avgBandDisplay}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-500/30 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cảnh báo tab (≥3)</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{highRiskCount}</p>
            </div>
          </div>

          {/* Filter & CSV Export Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                <Filter className="w-3.5 h-3.5" /> Lọc:
              </span>
              <select
                value={gradingFilters.testId}
                onChange={e => setGradingFilters(prev => ({ ...prev, testId: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[200px]"
              >
                <option value="all">Tất cả đề thi</option>
                {uniqueAttemptTests.map(([tid, title]) => (
                  <option key={tid} value={tid}>{title}</option>
                ))}
              </select>
              <select
                value={gradingFilters.status}
                onChange={e => setGradingFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ chấm Writing</option>
                <option value="graded">Đã chấm xong</option>
              </select>
              <select
                value={gradingFilters.risk}
                onChange={e => setGradingFilters(prev => ({ ...prev, risk: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="all">Mọi mức độ tab</option>
                <option value="risk">Nghi gian lận (≥3 tab)</option>
              </select>
              <input
                type="text"
                placeholder="🔍 Tên học viên..."
                value={gradingFilters.search}
                onChange={e => setGradingFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                exportAttemptsToCsv(filteredAttempts);
                showToast(`Đã xuất file CSV bảng điểm (${filteredAttempts.length} dòng)!`);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Xuất CSV Excel ({filteredAttempts.length})
            </button>
          </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Học Sinh</th>
                  <th className="px-6 py-3.5">Đề Thi</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                  <th className="px-6 py-3.5 text-center">Chống Gian Lận (Tab Switch)</th>
                  <th className="px-6 py-3.5 text-center">Trạng Thái Chấm</th>
                  <th className="px-6 py-3.5 text-center">Overall</th>
                  <th className="px-6 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-400">
                      Không có bài nộp nào khớp bộ lọc hiện tại.{' '}
                      <button
                        type="button"
                        onClick={() => setGradingFilters({ testId: 'all', status: 'all', risk: 'all', search: '' })}
                        className="text-blue-600 dark:text-blue-400 font-bold underline ml-1"
                      >
                        Đặt lại bộ lọc
                      </button>
                    </td>
                  </tr>
                ) : filteredAttempts.map(att => {
                  const risk = getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs);
                  const extSignals = countExtensionCheatSignals(att.antiCheatLogs);
                  const RiskIcon = risk.icon;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.studentName}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{att.testTitle}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${risk.color}`}>
                            <RiskIcon className="w-3.5 h-3.5" />
                            {risk.label} ({att.tabSwitchCount} lần)
                          </span>
                          {extSignals > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Extension / Bypass: {extSignals}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.teacherGraded ? (
                          <span className="text-xs bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                            {att.aiGraded && <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />}
                            {att.aiGraded ? 'AI Đã Chấm' : 'Đã Chấm'}
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md font-bold border border-amber-200 dark:border-amber-500/30">
                            Cần Chấm Writing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {att.overallBand ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setGradingAttempt(att);
                              const w1Empty = getWordCount(att.answers?.w1) === 0;
                              const w2Empty = getWordCount(att.answers?.w2) === 0;
                              setGradingScores({
                                task1Band: att.scores.writing.task1Band ?? (w1Empty ? 0 : 6.0),
                                task2Band: att.scores.writing.task2Band ?? (w2Empty ? 0 : 6.5),
                                feedback: att.teacherFeedback || ''
                              });
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                          >
                            Chấm Bài & Chi Tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(att)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                            title="Xóa lượt thi này để mở khóa cho học viên thi lại"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        );
      })()}

      {/* Tab 3: Phòng Đấu Game PIN & Leaderboard */}
      {teacherHubTab === 'game_room' && (
        <div className="space-y-6">
          {/* Room Switcher + Create Room */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Danh sách phòng:</span>
              {allRoomsList.map(r => {
                const isActiveRoom = r.pin === currentRoomPin;
                const rLobbyCount = Object.keys(r.lobbyPlayers || {}).length;
                return (
                  <div key={r.pin} className="inline-flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setCurrentRoomPin(r.pin);
                        setCustomVocabInput(r.rawVocab || DEFAULT_VOCAB_TEXT);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-2 ${
                        isActiveRoom
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-mono">#{r.pin}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'PLAYING' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {rLobbyCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActiveRoom ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'}`}>
                          {rLobbyCount} chờ
                        </span>
                      )}
                    </button>
                    {allRoomsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(r.pin)}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white border-l border-slate-200 dark:border-slate-700 transition"
                        title={`Xóa phòng #${r.pin}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tạo Phòng Mới
            </button>
          </div>

          {/* Dropship Room Hero */}
          <div className="bg-gradient-to-br from-[#0F172B] via-[#003538] to-[#065B5B] rounded-3xl p-6 sm:p-7 text-white border border-[#007A7A]/40 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  room.status === 'LOBBY'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : room.status === 'PLAYING'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                    : 'bg-slate-700/60 text-slate-300 border-slate-600'
                }`}>
                  <Wifi className="w-3 h-3" />
                  {room.status === 'LOBBY' ? 'Đang Mở Sảnh Chờ (Lobby)' : room.status === 'PLAYING' ? 'Trận Đấu Đang Diễn Ra' : 'Đã Kết Thúc'}
                </span>
                <span className="text-xs font-bold text-[#B5F5F1]">{room.name}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-[10px] text-[#1EE1D6] font-bold uppercase tracking-wider">Mã Phòng (PIN)</p>
                  <p className="text-3xl font-black text-amber-300 font-mono tracking-widest">{currentRoomPin}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(currentRoomPin);
                    setCopiedRoomPin(true);
                    setTimeout(() => setCopiedRoomPin(false), 1800);
                    showToast(`Đã sao chép mã phòng ${currentRoomPin}!`);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition"
                  title="Sao chép mã phòng"
                >
                  {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoomPin ? 'Đã chép' : 'Copy PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(currentRoomPin)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 flex items-center gap-1.5 transition"
                  title="Sao chép Link mời học viên tự điền mã PIN"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link Mời</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2.5">
                <span>Mật khẩu: <b className="text-cyan-300 font-mono">{room.pass}</b></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <b>{lobbyPlayersList.length}</b> học sinh trong Sảnh Chờ
                </span>
                <span>•</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-semibold text-[11px] text-amber-200">
                  {room.roundSize || 4} từ/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Mở Sảnh Chờ (Among Us)
              </button>
              {room.status !== 'LOBBY' && (
                <button
                  onClick={() => handleTeacherResetLobby(currentRoomPin)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh Mới
                </button>
              )}
              <button
                onClick={() => {
                  initGameCampaign(currentRoomPin, currentUser);
                  setView('GAME_ARENA');
                }}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" /> Chơi Thử GV
              </button>
              <button
                onClick={() => {
                  setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                  setShowVocabModal(true);
                }}
                className="bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition border border-purple-400/40 flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Sửa Bộ Từ Vựng
              </button>
            </div>
          </div>

          {/* Live Lobby Crewmates Preview */}
          {lobbyPlayersList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" /> Phi Hành Đoàn Đang Chờ Trong Sảnh ({lobbyPlayersList.length})
                </h3>
                <button
                  onClick={() => handleTeacherOpenLobby(currentRoomPin)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Vào Sảnh Điều Phối <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {lobbyPlayersList.map(lp => (
                  <div key={lp.username} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <AmongUsCrewmate colorId={lp.colorId} avatarUrl={lp.avatarUrl || usersDb[lp.username]?.avatarUrl || ''} size={28} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {lp.name}
                        {lp.role === 'teacher' && <Crown className="w-3 h-3 text-amber-500" />}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {lp.ready ? 'Đã sẵn sàng' : 'Đang chuẩn bị'}
                      </p>
                    </div>
                    {lp.role !== 'teacher' && (
                      <button
                        type="button"
                        onClick={() => handleKickLobbyPlayer(currentRoomPin, lp.username, lp.name)}
                        className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                        title={`Mời ${lp.name} rời sảnh`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Bảng Xếp Hạng Học Sinh Trong Phòng (Real-time)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tự động đồng bộ điểm số</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Hạng</th>
                    <th className="px-6 py-3">Tên Học Sinh</th>
                    <th className="px-6 py-3">Tiến Độ</th>
                    <th className="px-6 py-3 text-center">Điểm Số</th>
                    <th className="px-6 py-3 text-center">Streak</th>
                    <th className="px-6 py-3 text-right">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboardPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                        Chưa có học sinh nào nộp điểm vào phòng. Hãy chia sẻ mã PIN <b>{currentRoomPin}</b> cho học sinh!
                      </td>
                    </tr>
                  ) : (
                    leaderboardPlayers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-3.5 font-bold text-amber-500">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          <div>{p.status}</div>
                          {Array.isArray(p.missed) && p.missed.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.missed.slice(0, 4).map((mw, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-mono text-[10px] font-bold"
                                >
                                  {mw}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-center font-extrabold text-blue-600 dark:text-blue-400">{p.score}đ</td>
                        <td className="px-6 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400">🔥 {p.streak}</td>
                        <td className="px-6 py-3.5 text-right text-xs text-slate-400">{p.updatedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tạo & Quản Lý Tài Khoản */}
      {(teacherHubTab === 'accounts' || teacherHubTab === 'students') && (
        <div className="space-y-6">
          {/* Header, Role Filters & Creation Actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
                  Tạo &amp; Quản Lý Tài Khoản Hệ Thống ({allAccounts.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chỉ Giáo viên mới có thể tạo, cấp mật khẩu, phân quyền hoặc xóa tài khoản đăng nhập. Học viên không thể tự đăng ký bên ngoài.
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('single');
                    setShowAddStudentModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> + Tạo 1 Tài Khoản
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddStudentMode('bulk');
                    setShowAddStudentModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Nhập Hàng Loạt
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl border transition ${
                    accountRoleFilter === 'all'
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({allAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('student')}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'student'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Học viên ({studentAccountsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    accountRoleFilter === 'teacher'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên ({teacherAccountsCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="🔍 Tìm theo tên hoặc @username..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#007A7A] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Accounts Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Tài Khoản</th>
                    <th className="px-6 py-4 text-center">Vai Trò</th>
                    <th className="px-6 py-4 text-center">Mục Tiêu / Ghi Chú</th>
                    <th className="px-6 py-4 text-center">Hoạt Động</th>
                    <th className="px-6 py-4 text-center">Ngày Tạo</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400">
                        Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(account => {
                      const isTeacherAccount = account.role === 'teacher';
                      const isSelfAccount = account.username === currentUser?.username;
                      const studentAttempts = attempts.filter(a => a.studentId === account.username);
                      const gradedStudentBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
                      const bestBand = gradedStudentBands.length > 0
                        ? Math.max(...gradedStudentBands)
                        : null;

                      return (
                        <tr key={account.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-sm ${
                                  isTeacherAccount
                                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-tr from-[#007A7A] to-teal-500'
                                }`}
                              >
                                {account.name ? account.name[0] : (isTeacherAccount ? 'T' : 'S')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-white leading-tight">{account.name}</p>
                                  {isSelfAccount && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">@{account.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isTeacherAccount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                <GraduationCap className="w-3.5 h-3.5" /> Học viên
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isTeacherAccount ? (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Quản trị &amp; Ra đề
                              </span>
                            ) : (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingTargetUser({
                                      username: account.username,
                                      name: account.name || '',
                                      role: account.role || 'student',
                                      targetBand: account.targetBand || 7.5,
                                      studyGoal: account.studyGoal || ''
                                    })
                                  }
                                  title="Chỉnh sửa Target Band & thông tin tài khoản"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full transition"
                                >
                                  <Target className="w-3.5 h-3.5 text-amber-500" />
                                  Band {account.targetBand || '7.5'}
                                  <Edit className="w-3 h-3 opacity-70" />
                                </button>
                                {account.studyGoal && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[160px] mx-auto truncate" title={account.studyGoal}>
                                    {account.studyGoal}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isTeacherAccount ? (
                              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                Toàn quyền quản lý
                              </span>
                            ) : studentAttempts.length > 0 ? (
                              <div className="inline-flex items-center gap-1.5 text-xs">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md font-extrabold">
                                  {studentAttempts.length} bài
                                </span>
                                {bestBand !== null ? (
                                  <span className="font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-md">
                                    Best {bestBand}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Chưa làm bài</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                            {account.joinedDate || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingTargetUser({
                                    username: account.username,
                                    name: account.name || '',
                                    role: account.role || 'student',
                                    targetBand: account.targetBand || 7.5,
                                    studyGoal: account.studyGoal || ''
                                  })
                                }
                                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                                title="Sửa thông tin & phân quyền tài khoản"
                              >
                                <Edit className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudentAccount(account);
                                  setStudentPasswordDraft('');
                                }}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                                title="Đặt lại mật khẩu đăng nhập"
                              >
                                <Key className="w-3.5 h-3.5" /> Đổi MK
                              </button>
                              <button
                                type="button"
                                disabled={isSelfAccount}
                                onClick={() => handleDeleteAccount(account)}
                                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition inline-flex items-center gap-1 ${
                                  isSelfAccount
                                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                    : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                                }`}
                                title={isSelfAccount ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa tài khoản này'}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER GRADING MODAL WITH AI ASSIST */}
      {gradingAttempt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Chấm Bài: {gradingAttempt.studentName}</span>
                  {gradingAttempt.aiGraded && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-500/30">
                      <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> AI Graded
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{gradingAttempt.testTitle} - {gradingAttempt.submittedAt}</p>
              </div>
              <button onClick={() => setGradingAttempt(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Cheat Log Detail */}
            {(() => {
              const logsList = gradingAttempt.antiCheatLogs || [];
              const extSignalsCount = countExtensionCheatSignals(logsList);
              return (
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
                    <p className="text-xs text-emerald-400">Không ghi nhận vi phạm rời màn hình, khóa tương tác hay dấu hiệu Extension/lách luật nào trong suốt quá trình làm bài.</p>
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
              );
            })()}

            {/* Student Writing Submissions */}
            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Bài Viết Của Học Sinh</h4>

              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">Writing Task 1 ({getWordCount(gradingAttempt.answers.w1)} từ)</p>
                <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {gradingAttempt.answers.w1 || 'Không có bài làm'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2">Writing Task 2 ({getWordCount(gradingAttempt.answers.w2)} từ)</p>
                <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {gradingAttempt.answers.w2 || 'Không có bài làm'}
                </div>
              </div>
            </div>

            {/* Grading input and AI suggestion */}
            <div className="bg-[#EDFFFD]/50 dark:bg-[#003538]/30 border border-[#B5F5F1] dark:border-teal-500/30 rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Nhập Điểm Chấm Kỹ Năng Writing (Band 0 - 9.0)</h4>
                
                <button
                  type="button"
                  onClick={() => handleTeacherAIGrade(gradingAttempt)}
                  disabled={isGradingAI}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                    isGradingAI ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 1 Band Score</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={gradingScores.task1Band}
                    onChange={e => setGradingScores({ ...gradingScores, task1Band: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task 2 Band Score</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={gradingScores.task2Band}
                    onChange={e => setGradingScores({ ...gradingScores, task2Band: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhận Xét & Ghi Chú Của Giáo Viên</label>
                <textarea
                  rows={4}
                  placeholder="Viết nhận xét chi tiết cho học sinh..."
                  value={gradingScores.feedback}
                  onChange={e => setGradingScores({ ...gradingScores, feedback: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setGradingAttempt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={saveTeacherGrading}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu Kết Quả & Chấm Điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
