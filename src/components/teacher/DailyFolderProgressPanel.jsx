import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, Headphones, Megaphone, Plus, Search, Trophy, Users } from 'lucide-react';
import { formatDurationVi, getDailySubCategoryLabel } from '../../constants/seedData';
import { getDailyFolderGroups, getDailyFolderStudentProgress } from '../../utils/dailyFolderProgress';

const getProgressPercent = progress =>
  progress.expectedCount > 0 ? Math.round((progress.completedCount / progress.expectedCount) * 100) : 0;

const compareProgressRows = (a, b) => {
  const aComplete = a.expectedCount > 0 && a.completedCount === a.expectedCount;
  const bComplete = b.expectedCount > 0 && b.completedCount === b.expectedCount;
  if (aComplete !== bComplete) return aComplete ? -1 : 1;
  if (a.completedCount !== b.completedCount) return b.completedCount - a.completedCount;
  if (a.totalCorrect !== b.totalCorrect) return b.totalCorrect - a.totalCorrect;
  if (a.totalDurationSeconds !== b.totalDurationSeconds) {
    const aDuration = a.totalDurationSeconds > 0 ? a.totalDurationSeconds : Number.POSITIVE_INFINITY;
    const bDuration = b.totalDurationSeconds > 0 ? b.totalDurationSeconds : Number.POSITIVE_INFINITY;
    if (aDuration !== bDuration) return aDuration - bDuration;
  }
  return String(a.student?.name || a.student?.username || '').localeCompare(
    String(b.student?.name || b.student?.username || '')
  );
};

export default function DailyFolderProgressPanel({
  attempts = [],
  classesDb = {},
  handleCreateNotification,
  openSingleSkillBuilder,
  showToast,
  studentAccounts = [],
  tests = []
}) {
  const [selectedFolderKey, setSelectedFolderKey] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const folderGroups = useMemo(() => getDailyFolderGroups(tests), [tests]);
  const selectedFolder = folderGroups.find(group => group.key === selectedFolderKey) || folderGroups[0] || null;
  const progressRows = useMemo(() => {
    if (!selectedFolder) return [];
    return studentAccounts
      .map(student => getDailyFolderStudentProgress({ group: selectedFolder, student, attempts, classesDb }))
      .filter(progress => progress.expectedCount > 0)
      .sort(compareProgressRows);
  }, [selectedFolder, studentAccounts, attempts, classesDb]);

  const incompleteRows = progressRows.filter(
    progress => progress.completedCount < progress.expectedCount
  );
  const completeRows = progressRows.filter(
    progress => progress.expectedCount > 0 && progress.completedCount === progress.expectedCount
  );
  const searchQuery = searchValue.trim().toLocaleLowerCase();
  const visibleRows = progressRows.filter(progress => {
    if (incompleteOnly && progress.completedCount >= progress.expectedCount) return false;
    if (!searchQuery) return true;
    return `${progress.student?.name || ''} ${progress.student?.username || ''}`
      .toLocaleLowerCase()
      .includes(searchQuery);
  });

  const handleCopyIncompleteList = async () => {
    if (!selectedFolder || incompleteRows.length === 0) return;
    const lines = incompleteRows.map((progress, index) => {
      const missingNames = progress.testRows
        .filter(row => !row.attempt)
        .map(row => row.test.title || row.test.id)
        .join(', ');
      return `${index + 1}. ${progress.student?.name || progress.student?.username} (@${progress.student?.username}) - ${progress.completedCount}/${progress.expectedCount}: ${missingNames}`;
    });
    try {
      await navigator.clipboard.writeText(
        `Học viên chưa hoàn thành bộ "${selectedFolder.folderName}":\n${lines.join('\n')}`
      );
      showToast?.(`Đã sao chép danh sách ${incompleteRows.length} học viên còn thiếu bài.`, 'success');
    } catch {
      showToast?.('Không thể sao chép danh sách trong trình duyệt này.', 'error');
    }
  };

  const handleRemindIncomplete = async () => {
    if (!selectedFolder || incompleteRows.length === 0 || !handleCreateNotification) return;
    await handleCreateNotification({
      title: `Nhắc hoàn thành bộ ${selectedFolder.folderName}`,
      message: `Bạn còn bài chưa hoàn thành trong bộ ${selectedFolder.folderName} (${getDailySubCategoryLabel(selectedFolder.dailySubCategory)}). Hãy mở Daily Zone để xem các bài còn thiếu.`,
      type: 'exercise',
      targetUsernames: incompleteRows.map(progress => progress.student.username)
    });
  };

  const handleCreateMoreInFolder = () => {
    if (!selectedFolder) return;
    const sampleTest = selectedFolder.tests[0];
    const assignedClassIds = Array.isArray(sampleTest?.assignedClassIds) ? sampleTest.assignedClassIds : [];
    openSingleSkillBuilder?.(selectedFolder.focusSkill, null, assignedClassIds, {
      dailySubCategory: selectedFolder.dailySubCategory,
      dailyFolderName: selectedFolder.folderName
    });
  };

  if (folderGroups.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white">Tiến độ SuperHomework</h2>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-2xl">
            Tạo bài Reading hoặc Listening Daily, điền cùng tên bộ bài cho các bài lẻ cần theo dõi chung. Các bài đó sẽ xuất hiện thành thư mục tại đây.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openSingleSkillBuilder?.('reading', null, [], { dailySubCategory: 'shw_1' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo bộ Reading
          </button>
          <button
            type="button"
            onClick={() => openSingleSkillBuilder?.('listening', null, [], { dailySubCategory: 'listening_shw' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#334155] dark:text-slate-200 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo bộ Listening
          </button>
        </div>
      </section>
    );
  }

  const SkillIcon = selectedFolder?.focusSkill === 'reading' ? BookOpen : Headphones;
  const completedFolderCount = selectedFolder?.tests.length || 0;

  return (
    <section className="space-y-4">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white">Tiến độ SuperHomework Reading &amp; Listening</h2>
            <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-2xl">
              Theo dõi số bài đã nộp, câu đúng và thời gian từng học viên. Xếp hạng ưu tiên hoàn thành đủ bộ, tổng câu đúng rồi đến thời gian làm.
            </p>
          </div>
          <span className="text-xs font-bold text-[#334155] dark:text-slate-300 px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-slate-800">
            {folderGroups.length} thư mục
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Chọn bộ bài SuperHomework">
          {folderGroups.map(group => {
            const isSelected = group.key === (selectedFolder?.key || '');
            const GroupIcon = group.focusSkill === 'reading' ? BookOpen : Headphones;
            return (
              <button
                key={group.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedFolderKey(group.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition ${
                  isSelected
                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                }`}
              >
                <GroupIcon className="w-3.5 h-3.5" />
                {group.focusSkill === 'reading' ? 'Reading' : 'Listening'} · {getDailySubCategoryLabel(group.dailySubCategory)} · {group.folderName} ({group.tests.length})
              </button>
            );
          })}
        </div>
      </header>

      {selectedFolder && (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-9 h-9 shrink-0 rounded-lg bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 flex items-center justify-center">
                <SkillIcon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0F172B] dark:text-white truncate">{selectedFolder.folderName}</h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 truncate">
                  {getDailySubCategoryLabel(selectedFolder.dailySubCategory)} · {completedFolderCount} bài lẻ
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCreateMoreInFolder}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo bài trong bộ này
              </button>
              <button
                type="button"
                onClick={handleCopyIncompleteList}
                disabled={incompleteRows.length === 0}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#334155] dark:text-slate-200 text-xs font-bold disabled:opacity-50"
              >
                Sao chép danh sách còn thiếu
              </button>
              <button
                type="button"
                onClick={handleRemindIncomplete}
                disabled={incompleteRows.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold disabled:opacity-50"
              >
                <Megaphone className="w-3.5 h-3.5" /> Nhắc {incompleteRows.length} bạn còn thiếu
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="p-3.5">
              <dt className="text-xs font-bold text-[#475569] dark:text-slate-400">Bài trong bộ</dt>
              <dd className="text-xl font-extrabold text-[#0F172B] dark:text-white mt-1 tabular-nums">{completedFolderCount}</dd>
            </div>
            <div className="p-3.5">
              <dt className="text-xs font-bold text-[#475569] dark:text-slate-400">Học viên được giao</dt>
              <dd className="text-xl font-extrabold text-[#0F172B] dark:text-white mt-1 tabular-nums">{progressRows.length}</dd>
            </div>
            <div className="p-3.5">
              <dt className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Hoàn thành đủ bộ</dt>
              <dd className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 tabular-nums">{completeRows.length}</dd>
            </div>
            <div className="p-3.5">
              <dt className="text-xs font-bold text-amber-900 dark:text-amber-200">Còn thiếu bài</dt>
              <dd className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-1 tabular-nums">{incompleteRows.length}</dd>
            </div>
          </dl>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#334155] dark:text-slate-300">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Xếp hạng và tiến độ từng bài
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <Search className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchValue}
                    onChange={event => setSearchValue(event.target.value)}
                    aria-label="Tìm học viên trong bảng tiến độ"
                    placeholder="Tìm học viên"
                    className="w-44 pl-8 pr-2.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-[#0F172B] dark:text-slate-100"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={incompleteOnly}
                  onClick={() => setIncompleteOnly(value => !value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold ${
                    incompleteOnly
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {incompleteOnly ? 'Đang xem bạn còn thiếu' : 'Chỉ xem bạn còn thiếu'}
                </button>
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-[#475569] dark:text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-[#0F172B] dark:text-white mt-2">
                  {progressRows.length === 0 ? 'Chưa có học viên được giao các bài trong bộ này.' : 'Không tìm thấy học viên phù hợp.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 text-[#334155] dark:text-slate-300">
                    <tr>
                      <th className="px-3.5 py-3 font-extrabold">Hạng</th>
                      <th className="px-3.5 py-3 font-extrabold">Học viên</th>
                      <th className="px-3.5 py-3 font-extrabold">Tiến độ</th>
                      {selectedFolder.tests.map((test, index) => (
                        <th key={test.id} className="px-3.5 py-3 font-extrabold min-w-36 max-w-48">
                          <span title={test.title || test.id} className="block truncate">Bài {index + 1}: {test.title || test.id}</span>
                        </th>
                      ))}
                      <th className="px-3.5 py-3 font-extrabold">Tổng câu đúng</th>
                      <th className="px-3.5 py-3 font-extrabold">Tổng thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {visibleRows.map(progress => {
                      const rank = progressRows.indexOf(progress) + 1;
                      const percent = getProgressPercent(progress);
                      return (
                        <tr key={progress.student.username} className="align-top hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50">
                          <td className="px-3.5 py-3 font-extrabold text-[#0F172B] dark:text-white tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              {rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                              #{rank}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 min-w-40">
                            <span className="block font-bold text-[#0F172B] dark:text-white">{progress.student.name || progress.student.username}</span>
                            <span className="block text-[#475569] dark:text-slate-400">@{progress.student.username}</span>
                          </td>
                          <td className="px-3.5 py-3 min-w-32">
                            <span className={`font-extrabold tabular-nums ${percent === 100 ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-200'}`}>
                              {progress.completedCount}/{progress.expectedCount} bài
                            </span>
                            <span className="block mt-1 h-1.5 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <span className="block h-full bg-[#007A7A]" style={{ width: `${percent}%` }} />
                            </span>
                          </td>
                          {selectedFolder.tests.map(test => {
                            const row = progress.testRows.find(item => item.test.id === test.id);
                            if (!row) {
                              return <td key={test.id} className="px-3.5 py-3 text-[#475569] dark:text-slate-400">Không giao</td>;
                            }
                            if (!row.attempt) {
                              return <td key={test.id} className="px-3.5 py-3 font-bold text-rose-800 dark:text-rose-300">Chưa làm</td>;
                            }
                            return (
                              <td key={test.id} className="px-3.5 py-3 min-w-36">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {row.score.raw === null ? 'Đã nộp' : `${row.score.raw}/${row.score.total ?? '?'} câu`}
                                </span>
                                <span className="block mt-1 text-[#475569] dark:text-slate-400">
                                  <Clock3 className="w-3 h-3 inline mr-1" />
                                  {Number(row.attempt.durationSeconds) > 0 ? formatDurationVi(row.attempt.durationSeconds) : 'Chưa có thời gian'}
                                </span>
                                {row.attempt.submittedAt && (
                                  <span className="block mt-0.5 text-[#475569] dark:text-slate-400">{row.attempt.submittedAt}</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3.5 py-3 font-extrabold text-[#0F172B] dark:text-white tabular-nums">
                            {progress.totalQuestions > 0 ? `${progress.totalCorrect}/${progress.totalQuestions}` : 'Đang chấm'}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-[#334155] dark:text-slate-200 tabular-nums">
                            {progress.totalDurationSeconds > 0 ? formatDurationVi(progress.totalDurationSeconds) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
