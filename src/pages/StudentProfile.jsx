import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle,
  ChevronLeft,
  Edit,
  FileText,
  Gamepad2,
  Headphones,
  History,
  MessageSquare,
  PenTool,
  Play,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { countExtensionCheatSignals, getRiskAssessment } from '../utils/examHelpers';
import UserAvatarBadge from '../components/common/UserAvatarBadge';

export default function StudentProfile({
  attempts,
  currentRoomPin,
  currentUser,
  dispatchSyncAction,
  handleTeacherOpenLobby,
  openStudentGamePortal,
  roomsDb,
  selectedProfileStudent,
  setEditingTargetUser,
  setPreviousView,
  setSelectedAttemptId,
  setSelectedProfileStudent,
  setShowAvatarModal,
  setTeacherNotes,
  setTempNoteText,
  setView,
  showToast,
  teacherNotes,
  tempNoteText,
  usersDb
}) {
  const isTeacherViewer = currentUser?.role === 'teacher';
  const activeUsername = selectedProfileStudent || currentUser?.username || 'hocsinh_01';
  const student = usersDb[activeUsername] || {
    username: activeUsername,
    name: activeUsername,
    role: 'student',
    targetBand: 7.5,
    joinedDate: '2026-02-01'
  };

  const studentList = Object.values(usersDb).filter(u => u.role === 'student');
  const studentAttempts = attempts.filter(a => a.studentId === activeUsername);

  // Sort chronologically ascending (oldest to newest) for progression calculations
  const chronologicalAttempts = [...studentAttempts].reverse();
  const totalAttempts = studentAttempts.length;
  const highestBand = totalAttempts > 0 ? Math.max(...studentAttempts.map(a => a.overallBand || 0)) : null;
  const latestAttempt = studentAttempts[0];
  const firstAttempt = chronologicalAttempts[0];
  const bandGrowth = (latestAttempt?.overallBand && firstAttempt?.overallBand && totalAttempts > 1)
    ? (latestAttempt.overallBand - firstAttempt.overallBand).toFixed(1)
    : null;

  const avgListening = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores.listening.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const avgReading = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores.reading.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const avgWriting = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores.writing.overallBand || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const overallAvg = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.overallBand || 0), 0) / totalAttempts).toFixed(1)
    : null;

  const totalTabSwitches = isTeacherViewer
    ? studentAttempts.reduce((acc, a) => acc + (a.tabSwitchCount || 0), 0)
    : 0;
  const avgTabSwitches = isTeacherViewer && totalAttempts > 0
    ? (totalTabSwitches / totalAttempts).toFixed(1)
    : 0;

  // Room score for this student
  const room = roomsDb[currentRoomPin] || { players: {} };
  const playerGameRecord = room.players?.[student.name] || room.players?.[student.username];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation & Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (isTeacherViewer) {
              setView('TEACHER_DASHBOARD');
            } else {
              setView('HOME');
            }
          }}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {isTeacherViewer ? 'Quay Lại Bảng Quản Lý Giáo Viên' : 'Quay Lại Bảng Điều Khiển Học Sinh'}
        </button>

        {/* If teacher, allow switching between students */}
        {isTeacherViewer && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Chọn Học Viên:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {studentList.map(s => (
                <button
                  key={s.username}
                  onClick={() => {
                    setSelectedProfileStudent(s.username);
                    setTempNoteText('');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    activeUsername === s.username
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="shrink-0 flex flex-col items-center">
              <UserAvatarBadge user={student} sizeClass="w-20 h-20" textClass="text-3xl" rounded="rounded-2xl" />
              {student.username === currentUser?.username && (
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="mt-2 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white flex items-center gap-1 transition"
                >
                  <Camera className="w-3 h-3" /> Đổi Avatar
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{student.name}</h1>
                <span className="text-xs font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  @{student.username}
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Học Viên Chính Thức
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày gia nhập: <b>{student.joinedDate || '01/02/2026'}</b>
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                  {(isTeacherViewer || student.username === currentUser?.username) && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTargetUser({
                          username: student.username,
                          name: student.name || '',
                          targetBand: student.targetBand || 7.5,
                          studyGoal: student.studyGoal || ''
                        })
                      }
                      className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-200 text-[11px] font-bold transition"
                    >
                      <Edit className="w-3 h-3" /> Chỉnh
                    </button>
                  )}
                </span>
                {student.studyGoal && (
                  <span className="text-xs text-cyan-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                    🎯 {student.studyGoal}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Target Status Pill */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right min-w-[200px]">
            <p className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mb-1">Đánh Giá Tiến Độ</p>
            {highestBand ? (
              <div>
                <p className="text-2xl font-black text-amber-300">
                  Band {highestBand} <span className="text-xs text-slate-300 font-normal">/ {student.targetBand || 8.0}</span>
                </p>
                <p className="text-xs text-cyan-300 font-semibold mt-1">
                  {highestBand >= (student.targetBand || 8.0)
                    ? '🎉 Đã đạt mục tiêu đề ra!'
                    : `⚡ Còn ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band nữa để đạt mục tiêu`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300">Chưa có kết quả bài thi</p>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Tổng Số Lần Thi</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalAttempts} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">lần</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Band Cao Nhất</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{highestBand || '-'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Điểm Overall Trung Bình</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallAvg || '-'}</p>
            {totalAttempts > 0 && (
              <span className="text-[11px] block font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                L: {avgListening} • R: {avgReading} • W: {avgWriting}
              </span>
            )}
          </div>
        </div>

        {isTeacherViewer ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Chống Gian Lận (Tab)</p>
              <p className={`text-xl font-black ${avgTabSwitches <= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {avgTabSwitches <= 1 ? 'An toàn' : 'Cần chú ý'}
                <span className="text-xs block font-normal text-slate-500 dark:text-slate-400">TB {avgTabSwitches} lần/bài</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase">Mục Tiêu Band</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                Band {student.targetBand || '8.0'}
              </p>
              <span className="text-[11px] block font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                {highestBand && highestBand >= (student.targetBand || 8.0)
                  ? 'Đã chạm mốc mục tiêu'
                  : highestBand
                    ? `Cần thêm ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band`
                    : 'Luyện tập đều đặn mỗi ngày'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: TIẾN TRÌNH & ĐỘT PHÁ ĐIỂM SỐ QUA CÁC LẦN THI (SCORE PROGRESSION TIMELINE) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tiến Trình & Đột Phá Điểm Số Qua Các Lần Thi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Theo dõi sự thay đổi band điểm qua từng bài thi từ lần đầu tiên đến lần thi gần nhất.
            </p>
          </div>

          {bandGrowth && Number(bandGrowth) > 0 && (
            <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Tăng trưởng: +{bandGrowth} Band Overall! 🚀
            </span>
          )}
        </div>

        {totalAttempts === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Học viên chưa có bài thi nào để phân tích tiến trình điểm.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chronological Trajectory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chronologicalAttempts.map((att, idx) => (
                <div
                  key={att.id}
                  className={`rounded-2xl p-5 border transition ${
                    idx === chronologicalAttempts.length - 1
                      ? 'bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/40 dark:to-slate-900 border-indigo-200 dark:border-indigo-500/40 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                      idx === chronologicalAttempts.length - 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      Lần thi #{idx + 1} {idx === chronologicalAttempts.length - 1 ? '(Gần nhất)' : ''}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">{att.submittedAt}</span>
                  </div>

                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 line-clamp-1">{att.testTitle}</p>

                  <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-slate-700/70 mb-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Band Overall:</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                      {att.overallBand || 'Chờ'}
                    </span>
                  </div>

                  {/* Skill breakdown mini bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Listening
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores.listening.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${((att.scores.listening.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Reading
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores.reading.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${((att.scores.reading.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <PenTool className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Writing
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores.writing.overallBand ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${((att.scores.writing.overallBand || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAttemptId(att.id);
                      setPreviousView('STUDENT_PROFILE');
                      setView('RESULT_VIEW');
                    }}
                    className="mt-4 w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2 rounded-xl transition shadow-sm"
                  >
                    Xem Chi Tiết Bài Làm →
                  </button>
                </div>
              ))}
            </div>

            {/* Skill Growth Highlights */}
            {firstAttempt && latestAttempt && totalAttempts > 1 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Listening</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Band {firstAttempt.scores.listening.band} → <b className="text-blue-600 dark:text-blue-400">Band {latestAttempt.scores.listening.band}</b>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                        (+{(latestAttempt.scores.listening.band - firstAttempt.scores.listening.band).toFixed(1)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Reading</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Band {firstAttempt.scores.reading.band} → <b className="text-indigo-600 dark:text-indigo-400">Band {latestAttempt.scores.reading.band}</b>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                        (+{(latestAttempt.scores.reading.band - firstAttempt.scores.reading.band).toFixed(1)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-xs">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tiến Độ Writing</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Band {firstAttempt.scores.writing.overallBand} → <b className="text-emerald-600 dark:text-emerald-400">Band {latestAttempt.scores.writing.overallBand}</b>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">
                        (+{(latestAttempt.scores.writing.overallBand - firstAttempt.scores.writing.overallBand).toFixed(1)})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: BẢNG LỊCH SỬ CHI TIẾT TẤT CẢ CÁC LẦN THI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Lịch Sử Chi Tiết Từng Lần Thi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danh sách các bài thi đã hoàn thành của học viên {student.name}.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Tổng cộng: {studentAttempts.length} bài thi</span>
        </div>

        {studentAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Chưa có dữ liệu bài thi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Đề Thi</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                  <th className="px-6 py-3.5 text-center">Listening</th>
                  <th className="px-6 py-3.5 text-center">Reading</th>
                  <th className="px-6 py-3.5 text-center">Writing</th>
                  <th className="px-6 py-3.5 text-center">Overall Band</th>
                  {isTeacherViewer && (
                    <th className="px-6 py-3.5 text-center">Gian Lận (Tab)</th>
                  )}
                  <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentAttempts.map((att, idx) => {
                  const risk = isTeacherViewer ? getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs) : null;
                  const extSignals = isTeacherViewer ? countExtensionCheatSignals(att.antiCheatLogs) : 0;
                  const RiskIcon = risk?.icon;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{att.testTitle}</p>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {att.id} • Lần thi #{studentAttempts.length - idx}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.listening.band ?? '-'}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">({att.scores.listening.raw}/{att.scores.listening.total} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.reading.band ?? '-'}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">({att.scores.reading.raw}/{att.scores.reading.total} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{att.scores.writing.overallBand ?? 'Chờ chấm'}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">T1: {att.scores.writing.task1Band ?? '-'} | T2: {att.scores.writing.task2Band ?? '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
                          {att.overallBand || 'Chờ'}
                        </span>
                      </td>
                      {isTeacherViewer && risk && (
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${risk.color}`}>
                              <RiskIcon className="w-3 h-3" />
                              {risk.label} ({att.tabSwitchCount})
                            </span>
                            {extSignals > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Extension / Bypass: {extSignals}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAttemptId(att.id);
                            setPreviousView('STUDENT_PROFILE');
                            setView('RESULT_VIEW');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm"
                        >
                          Xem Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Đánh Giá & Nhận Xét Của Giáo Viên Quản Nhiệm
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lời khuyên, phân tích điểm yếu và lộ trình rèn luyện cá nhân hóa.</p>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full font-bold">
            Thầy Minh IELTS Master
          </span>
        </div>

        {isTeacherViewer ? (
          <div className="space-y-4">
            <textarea
              rows={4}
              value={tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '')}
              onChange={e => setTempNoteText(e.target.value)}
              placeholder="Nhập nhận xét chi tiết về quá trình học tập, các điểm cần khắc phục và định hướng cho học viên này..."
              className="w-full p-4 text-xs leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const textToSave = tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '');
                  setTeacherNotes(prev => ({ ...prev, [activeUsername]: textToSave }));
                  dispatchSyncAction('UPSERT_NOTE', { username: activeUsername, text: textToSave });
                  showToast('Đã lưu nhận xét hồ sơ học viên thành công!');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu Nhận Xét Hồ Sơ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-200/80 dark:border-amber-500/30">
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
              {teacherNotes[activeUsername] || 'Chưa có ghi chú nhận xét nào từ giáo viên. Hãy làm thêm các bài thi thử để giáo viên đánh giá năng lực.'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4: THÀNH TÍCH ĐẤU TRƯỜNG TỪ VỰNG CHICKEN INVADERS */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-purple-800/80">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-pink-400" />
              Thành Tích Đấu Trường Game Từ Vựng (IELTS Chicken Invaders)
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">Kết quả rèn luyện phản xạ từ vựng, ngữ nghĩa và chính tả qua game 3 vòng.</p>
          </div>
          <button
            onClick={() => {
              if (isTeacherViewer) {
                handleTeacherOpenLobby(currentRoomPin);
              } else {
                openStudentGamePortal();
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Vào Sảnh Chờ Đấu Trường
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Điểm Kỷ Lục Phòng Game</p>
            <p className="text-2xl font-black text-amber-300 font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.score} pts` : '0 pts'}
            </p>
          </div>

          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Cấp Độ Cao Nhất Đạt Được</p>
            <p className="text-sm font-extrabold text-cyan-300 mt-1">
              {playerGameRecord?.status || 'Chưa tham gia trận đấu nào'}
            </p>
          </div>

          <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/50">
            <p className="text-[11px] text-purple-300 font-bold uppercase">Chuỗi Combo Từ Đúng</p>
            <p className="text-2xl font-black text-pink-400 font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.streak}x Combo` : '0x Combo'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
