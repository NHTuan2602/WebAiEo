import {
  Award,
  BookOpen,
  Edit,
  FileText,
  Gamepad2,
  Lock,
  Play,
  Target,
  TrendingUp
} from 'lucide-react';
import { normalizeExamConfig } from '../constants/seedData';

export default function StudentHome({
  attempts,
  currentUser,
  openStudentGamePortal,
  setEditingTargetUser,
  setPreviousView,
  setSelectedAttemptId,
  setSelectedProfileStudent,
  setView,
  startExam,
  tests
}) {
  const visibleTests = tests.filter(t => normalizeExamConfig(t).visibility !== 'private');
  const studentAttempts = attempts.filter(a => a.studentId === currentUser?.username || a.studentUsername === currentUser?.username);
  const gradedBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number' && b > 0);
  const bestOverallBand = gradedBands.length > 0 ? Math.max(...gradedBands) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Clean Modern Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-9 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-200 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Không gian học tập cá nhân
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào {currentUser?.name || 'Học viên'}, sẵn sàng luyện đề hôm nay?
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              Trải nghiệm phòng thi Computer-Delivered IELTS chuẩn quốc tế với chia đôi màn hình đọc hiểu, ghi chú highlight và theo dõi kết quả từ giáo viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {visibleTests.length > 0 && (
              <button
                onClick={() => startExam(visibleTests[0].id)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Làm Đề Thi Thử
              </button>
            )}
            <button
              onClick={openStudentGamePortal}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 backdrop-blur"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-300" /> Vào Phòng Game Từ Vựng
            </button>
          </div>
        </div>
      </div>

      {/* Clean 4-Card Learning Metrics (No Room PIN / No Self-AI clutter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đề thi khả dụng</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{visibleTests.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bài thi đã nộp</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{studentAttempts.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Band cao nhất</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {bestOverallBand !== null ? bestOverallBand : '--'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mục tiêu Band</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{currentUser?.targetBand || '8.0'}</p>
              {currentUser?.studyGoal && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]" title={currentUser.studyGoal}>
                  {currentUser.studyGoal}
                </p>
              )}
            </div>
          </div>
          {currentUser && (
            <button
              onClick={() =>
                setEditingTargetUser({
                  username: currentUser.username,
                  name: currentUser.name || '',
                  targetBand: currentUser.targetBand || 7.5,
                  studyGoal: currentUser.studyGoal || ''
                })
              }
              title="Chỉnh sửa mục tiêu Band"
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 transition shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Available Mock Tests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Bộ Đề Thi Thử IELTS</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chọn một đề thi công khai để bắt đầu làm bài theo chuẩn thời gian từng kỹ năng</p>
          </div>
        </div>

        {visibleTests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
            Hiện chưa có đề thi công khai nào. Giáo viên sẽ mở đề khi bắt đầu buổi kiểm tra.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleTests.map(test => {
              const cfg = normalizeExamConfig(test);
              const myUsedCount = studentAttempts.filter(a => a.testId === test.id).length;
              const isExhausted = cfg.maxAttempts > 0 && myUsedCount >= cfg.maxAttempts;
              const skillShort = { listening: 'L', reading: 'R', writing: 'W' };
              const totalMins = cfg.order.reduce((sum, s) => sum + (cfg.durations[s] || 0), 0);

              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                >
                  <div>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                      <span className="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        IELTS Academic • {totalMins}p
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                          cfg.maxAttempts === 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : isExhausted
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {cfg.maxAttempts === 0
                          ? `Không giới hạn (${myUsedCount} lượt)`
                          : `Giới hạn ${myUsedCount}/${cfg.maxAttempts} lượt`}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5 leading-snug">{test.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{test.description}</p>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs mb-3 text-center">
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Listening ({cfg.durations.listening}p)</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{test.listening?.questions?.length || 0} câu</p>
                      </div>
                      <div className="border-x border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] text-slate-400 font-medium">Reading ({cfg.durations.reading}p)</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{test.reading?.questions?.length || 0} câu</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Writing ({cfg.durations.writing}p)</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">2 Tasks</p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-between gap-2">
                      <span>Thứ tự: {cfg.order.map(s => skillShort[s]).join(' → ')}</span>
                      {cfg.sequentialMode && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                          <Lock className="w-3 h-3" /> Tuần tự
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => startExam(test.id)}
                    disabled={isExhausted}
                    className={`w-full font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                      isExhausted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
                        <span>{myUsedCount > 0 ? 'Làm Lại Đề Thi' : 'Bắt Đầu Làm Bài'}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Student Attempt History */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Lịch Sử Làm Bài</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Theo dõi các bài thi bạn đã hoàn thành</p>
          </div>
          <button
            onClick={() => {
              setSelectedProfileStudent(currentUser?.username);
              setView('STUDENT_PROFILE');
            }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 flex items-center gap-1.5 transition px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <TrendingUp className="w-4 h-4" /> Xem Hồ Sơ & Biểu Đồ Tiến Độ
          </button>
        </div>

        {studentAttempts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
            Bạn chưa hoàn thành bài thi nào. Hãy chọn một đề thi ở phía trên để bắt đầu!
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Tên Đề Thi</th>
                    <th className="px-6 py-3.5">Thời Gian Nộp</th>
                    <th className="px-6 py-3.5 text-center">Listening</th>
                    <th className="px-6 py-3.5 text-center">Reading</th>
                    <th className="px-6 py-3.5 text-center">Writing</th>
                    <th className="px-6 py-3.5 text-center">Overall</th>
                    <th className="px-6 py-3.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAttempts.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.testTitle}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{att.submittedAt}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                        {att.scores.listening.band !== null ? att.scores.listening.band : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                        {att.scores.reading.band !== null ? att.scores.reading.band : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.teacherGraded ? (
                          <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                            {att.scores.writing.overallBand}
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold">Chờ chấm</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.overallBand ? (
                          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg tabular-nums">
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
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition"
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
      </div>
    </div>
  );
}
