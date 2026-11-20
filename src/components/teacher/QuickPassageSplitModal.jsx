import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

function getQuestionNumber(q, fallbackIdx = 0) {
  if (typeof q?.questionNumber === 'number' && q.questionNumber > 0) return q.questionNumber;
  if (typeof q?.blankNum === 'number' && q.blankNum > 0) return q.blankNum;
  const match = String(q?.question || '').trim().match(/^(?:(?:questions?|q|câu)\s*)?(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?(?=\b|\s|[.):])/i);
  if (match) {
    const num = Number(match[1]);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return fallbackIdx + 1;
}

export default function QuickPassageSplitModal({
  isOpen,
  onClose,
  questions = [],
  passages = [],
  onApply
}) {
  const [p1End, setP1End] = useState(14);
  const [p2End, setP2End] = useState(27);

  if (!isOpen) return null;

  const totalQuestions = questions.length;
  const p1Val = Math.max(1, Number(p1End) || 14);
  const p2Val = Math.max(p1Val + 1, Number(p2End) || 27);

  const p1List = questions.filter((q, i) => getQuestionNumber(q, i) <= p1Val);
  const p2List = questions.filter((q, i) => {
    const n = getQuestionNumber(q, i);
    return n > p1Val && n <= p2Val;
  });
  const p3List = questions.filter((q, i) => getQuestionNumber(q, i) > p2Val);

  const presets = [
    { label: 'Mẫu 1: 1-14 | 15-27 | 28-40', p1: 14, p2: 27 },
    { label: 'Mẫu 2: 1-13 | 14-26 | 27-40', p1: 13, p2: 26 },
    { label: 'Mẫu 3: 1-13 | 14-27 | 28-40', p1: 13, p2: 27 }
  ];

  const handleApply = () => {
    onApply?.({ p1End: p1Val, p2End: p2Val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/80 to-teal-50/80 dark:from-indigo-950/40 dark:to-teal-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Chia Nhanh Câu Hỏi Vào 3 Passage</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {totalQuestions} câu tổng
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Tự động gom câu hỏi theo số thứ tự vào từng Passage. Hệ thống sẽ tự tạo thêm Passage nếu đề chưa đủ 3 bài.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              ⚡ Chọn mẫu phân bổ nhanh:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((preset, idx) => {
                const isActive = p1Val === preset.p1 && p2Val === preset.p2;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setP1End(preset.p1);
                      setP2End(preset.p2);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Ranges Input */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hoặc tùy chỉnh khoảng số thứ tự câu:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Passage 1 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Passage 1
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Từ câu 1</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="38"
                    value={p1End}
                    onChange={e => setP1End(Number(e.target.value) || 1)}
                    className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Passage 2 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                  Passage 2
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Từ câu {p1Val + 1}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <input
                    type="number"
                    min={p1Val + 1}
                    max="39"
                    value={p2End}
                    onChange={e => setP2End(Number(e.target.value) || (p1Val + 1))}
                    className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Passage 3 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Passage 3
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Từ câu {p2Val + 1}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-slate-500 dark:text-slate-400">Đến hết</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Summary Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              📊 Kết quả phân bổ dự kiến:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">Passage 1</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white">
                    {p1List.length} câu
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                  Bao gồm các câu từ 1 đến {p1Val}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-950 dark:text-teal-200">Passage 2</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#007A7A] text-white">
                    {p2List.length} câu
                  </span>
                </div>
                <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-1">
                  Bao gồm các câu từ {p1Val + 1} đến {p2Val}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">Passage 3</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-600 text-white">
                    {p3List.length} câu
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                  Bao gồm các câu từ {p2Val + 1} đến {totalQuestions > 0 ? totalQuestions : 'hết'}
                </p>
              </div>
            </div>
          </div>

          {passages.length < 3 && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                Hiện tại đề thi có <strong>{passages.length} bài đọc</strong>. Hệ thống sẽ tự động tạo đủ <strong>3 Passage</strong> để chứa các câu hỏi tương ứng. Bạn chỉ cần dán đoạn văn bài đọc vào từng bài!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#007A7A] hover:bg-[#065B5B] text-white transition shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Xác Nhận Phân Chia ({totalQuestions} câu)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
