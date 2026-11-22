import { useEffect, useState } from 'react';
import { Check, Folder, Globe, Send, Users, X } from 'lucide-react';

export default function AssignFolderModal({
  classesDb = {},
  folderLabel = '',
  initialClassIds = [],
  isOpen = false,
  itemCount = 0,
  itemUnit = 'bài',
  onClose,
  onConfirm,
  showModeToggle = true,
  showNotifyOption = true,
  showPublishOption = true,
  subtitle = ''
}) {
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [mode, setMode] = useState('replace'); // 'replace' | 'add' | 'remove'
  const [publishDrafts, setPublishDrafts] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [saving, setSaving] = useState(false);

  const classList = Object.values(classesDb || {}).filter(c => c && c.id);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedClassIds(Array.isArray(initialClassIds) ? [...initialClassIds] : []);
    setMode('replace');
    setPublishDrafts(true);
    setNotifyStudents(true);
    setSaving(false);
  }, [isOpen, folderLabel, initialClassIds]);

  if (!isOpen) return null;

  const isAllStudents = selectedClassIds.length === 0;

  const toggleClassId = (cid) => {
    setSelectedClassIds(prev => (prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm?.({
        assignedClassIds: selectedClassIds,
        mode,
        publish: publishDrafts,
        notify: notifyStudents
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 text-[#0F766E] dark:text-[#1EE1D6] flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 fill-current/20" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6]">
                Giao Cả Thư Mục Lớn Cho Lớp (1 Chạm)
              </p>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {folderLabel || 'Thư mục bài tập'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || `Áp dụng cùng lúc cho toàn bộ ${itemCount} ${itemUnit} trong thư mục này.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Operation Mode (for multi-test folders) */}
          {showModeToggle && (
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Cách áp dụng cho {itemCount} {itemUnit}:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {[
                  { id: 'replace', label: 'Đặt đúng lớp chọn' },
                  { id: 'add', label: 'Thêm lớp (giữ cũ)' },
                  { id: 'remove', label: 'Gỡ lớp đã chọn' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`px-2.5 py-2 rounded-xl border transition ${
                      mode === opt.id
                        ? 'bg-[#007A7A] text-white border-[#007A7A]'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Class Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                Chọn lớp học nhận thư mục:
              </label>
              {mode !== 'remove' && (
                <button
                  type="button"
                  onClick={() => setSelectedClassIds([])}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 transition ${
                    isAllStudents
                      ? 'bg-[#0284C7] text-white border-[#0284C7]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  <Globe className="w-3 h-3" /> Tất cả học viên
                </button>
              )}
            </div>

            {classList.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Chưa có lớp học nào. Vào <b>Quản Trị GV → Quản lý Lớp Học</b> để tạo lớp, hoặc để mặc định <b>Tất cả học viên</b>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classList.map(cls => {
                  const active = selectedClassIds.includes(cls.id);
                  const count = Array.isArray(cls.studentUsernames) ? cls.studentUsernames.length : 0;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClassId(cls.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition ${
                        active
                          ? 'bg-teal-50 dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6] text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">Lớp {cls.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{count} học viên</p>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-[#007A7A] border-[#007A7A] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Publish & Notify Options */}
          {(showPublishOption || showNotifyOption) && mode !== 'remove' && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {showPublishOption && (
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishDrafts}
                    onChange={e => setPublishDrafts(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#007A7A]"
                  />
                  <span>Tự động mở Công khai (HS thấy) nếu có bài đang để Nháp/Ẩn</span>
                </label>
              )}
              {showNotifyOption && (
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={e => setNotifyStudents(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#007A7A]"
                  />
                  <span>Gửi 1 thông báo gọn cho lớp (không spam nhiều tin lẻ)</span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {mode === 'remove'
              ? `Gỡ ${selectedClassIds.length} lớp khỏi ${itemCount} ${itemUnit}`
              : isAllStudents
              ? `Mở cho Tất cả học viên (${itemCount} ${itemUnit})`
              : `Giao cho ${selectedClassIds.length} lớp (${itemCount} ${itemUnit})`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || (mode === 'remove' && selectedClassIds.length === 0)}
              className="px-4 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang áp dụng...' : `Giao Thư Mục (${itemCount} ${itemUnit})`}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
