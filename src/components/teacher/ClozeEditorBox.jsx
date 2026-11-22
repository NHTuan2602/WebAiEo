import { useRef, useState } from 'react';
import { Eye, EyeOff, FileCode2, Image as ImageIcon, Plus, RefreshCw, Sparkles, Table, Trash2, Upload } from 'lucide-react';
import { extractBlankNumbers } from '../../utils/clozeHelpers';
import { readImageFileAsDataUrl } from '../../utils/examHelpers';
import ClozeNoteSheet from '../exam/ClozeNoteSheet';

const SAMPLE_CLOZE_TEMPLATE = `Questions 1-4
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

**HIRING A PUBLIC ROOM**
*Example: the Main Hall – seats 200*

### Room and cost
• the {{1}} Room – seats 100
• Cost of Main Hall for Saturday evening: £{{2}}
• + £250 deposit ({{3}} payment is required)
• Cost includes use of tables and chairs and also {{4}}`;

const SAMPLE_TABLE_TEMPLATE = `Questions 1-5
Complete the table below.
Write ONE WORD ONLY for each answer.

| Physical features | Study findings |
| --- | --- |
| Skin/Coat | Provides {{1}} when standing near trees |
| Eyes | Let them look out for lions |
| Mouth | Can be used like {{2}} to get leaves |
| {{3}} | Normal size for such a large animal |
| Nerves | Slower reaction time because {{4}} need to go farther |`;

const SAMPLE_FLOWCHART_TEMPLATE = `Questions 26-30
Complete the flowchart below.
Write ONE WORD ONLY for each answer.

Choose mice which are all the same {{26}}
↓
Divide the mice into two groups, each with a different {{27}}
↓
Put each group in a separate cage. Feed group B sugar contained in {{28}}
↓
Place them in a weighing chamber to prevent {{29}}
↓
Do all necessary {{30}}`;

export default function ClozeEditorBox({
  clozeText = '',
  groupImageUrl = '',
  onChangeClozeText,
  onChangeGroupImage = null,
  onSyncBlanks,
  questions = [],
  scopeField = 'trackIdx',
  scopeIdx = 0,
  scopeLabel = ''
}) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);

  const detectedBlanks = extractBlankNumbers(clozeText);
  const nextBlankNum = detectedBlanks.length > 0 ? Math.max(...detectedBlanks) + 1 : 1;

  const insertBlankTokenAtCursor = () => {
    const el = textareaRef.current;
    const token = `{{${nextBlankNum}}}`;
    if (!el) {
      onChangeClozeText(`${clozeText ? `${clozeText} ` : ''}${token}`);
      return;
    }
    const start = el.selectionStart ?? clozeText.length;
    const end = el.selectionEnd ?? clozeText.length;
    const before = clozeText.slice(0, start);
    const after = clozeText.slice(end);
    const updated = `${before}${token}${after}`;
    onChangeClozeText(updated);

    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = start + token.length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };

  return (
    <div className="bg-slate-50/90 dark:bg-slate-800/45 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
            <span>Mẫu Đề Đục Lỗ / Note Completion ({scopeLabel})</span>
            {detectedBlanks.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30">
                {detectedBlanks.length} ô trống
              </span>
            )}
          </h3>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
            Đặt <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> (hoặc <code>[1]</code>, <code>[2]</code>) ngay trong câu để tạo ô điền từ viên thuốc khi thi. Dùng <code>**TIÊU ĐỀ**</code> và <code>•</code> để định dạng chuẩn Cambridge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={insertBlankTokenAtCursor}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#007A7A] hover:bg-[#065B5B] text-white transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Chèn {`{{${nextBlankNum}}}`}
          </button>

          {!clozeText.trim() && (
            <>
              <button
                type="button"
                onClick={() => onChangeClozeText(SAMPLE_CLOZE_TEMPLATE)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-[#EDFFFD] text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Mẫu Note
              </button>
              <button
                type="button"
                onClick={() => onChangeClozeText(SAMPLE_TABLE_TEMPLATE)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition flex items-center gap-1"
              >
                <Table className="w-3.5 h-3.5" /> Mẫu Bảng
              </button>
              <button
                type="button"
                onClick={() => onChangeClozeText(SAMPLE_FLOWCHART_TEMPLATE)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-amber-50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 transition flex items-center gap-1"
              >
                ↓ Mẫu Flow-chart
              </button>
            </>
          )}

          {detectedBlanks.length > 0 && (
            <>
              <button
                type="button"
                onClick={onSyncBlanks}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#ECFDF5] dark:bg-emerald-500/15 hover:bg-emerald-100 text-[#059271] dark:text-emerald-300 border border-[#9FF5E1] dark:border-emerald-500/30 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Đồng Bộ Câu Hỏi ({detectedBlanks.length})
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(v => !v)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#314158] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPreview ? 'Ẩn xem trước' : 'Xem trước ô điền'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        rows={7}
        value={clozeText}
        onChange={e => onChangeClozeText(e.target.value)}
        placeholder={`Để trống nếu chỉ dùng câu hỏi riêng lẻ phía dưới.\n• Note: **TIÊU ĐỀ** + các dòng có {{1}}, {{2}}\n• Bảng (Table): | Cột 1 | Cột 2 | (mỗi hàng 1 dòng, tách ô bằng dấu |)\n• Flow-chart: ngăn cách từng bước bằng dòng ↓`}
        className="w-full p-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
      />

      {/* Optional Map / Flow-chart / Diagram Image directly on Cloze / Scope */}
      {onChangeGroupImage && (
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
              <span>Hình ảnh Bản đồ (Map) / Sơ đồ (Flow-chart) kèm {scopeLabel}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" /> Tải ảnh Map / Flow-chart
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      const dataUrl = await readImageFileAsDataUrl(file);
                      onChangeGroupImage(dataUrl);
                    } catch {}
                  }}
                />
              </label>
              <input
                type="text"
                value={groupImageUrl && !groupImageUrl.startsWith('data:') && !groupImageUrl.startsWith('/api/sync/') ? groupImageUrl : ''}
                onChange={e => onChangeGroupImage(e.target.value.trim())}
                placeholder="Hoặc dán link ảnh https://..."
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-56"
              />
              {groupImageUrl && (
                <button
                  type="button"
                  onClick={() => onChangeGroupImage('')}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-700 text-xs font-bold"
                >
                  <Trash2 className="w-3 h-3" /> Xóa ảnh
                </button>
              )}
            </div>
          </div>
          {groupImageUrl && (
            <img
              src={groupImageUrl}
              alt="Map / Flowchart preview"
              className="h-16 w-28 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0"
            />
          )}
        </div>
      )}

      {showPreview && clozeText.trim() && (
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#007A7A] dark:text-[#1EE1D6] mb-2">
            Xem trước giao diện học sinh làm bài (kèm đáp án đang nhập):
          </p>
          <ClozeNoteSheet
            clozeText={clozeText}
            questions={questions}
            scopeField={scopeField}
            scopeIdx={scopeIdx}
            readOnlyPreview
          />
        </div>
      )}
    </div>
  );
}
