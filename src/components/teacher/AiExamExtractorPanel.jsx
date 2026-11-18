import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  Image as ImageIcon,
  Key,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from 'lucide-react';
import { extractExamFromImages } from '../../utils/geminiGrader';

function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Dữ liệu ảnh không hợp lệ.'));
        return;
      }
      // Keep already compact images untouched for razor-sharp OCR text
      if (dataUrl.length < 1_400_000) {
        resolve(dataUrl);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 1800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function AiExamExtractorPanel({
  aiApiKey,
  aiConfigured = false,
  existingMediaImageUrl,
  onApplyExtraction,
  onApplyQuickAnswerText,
  scopeLabel,
  setApiTestState,
  setShowApiKeyModal,
  showToast,
  skill = 'listening'
}) {
  const [questionImages, setQuestionImages] = useState([]);
  const [answerKeyImages, setAnswerKeyImages] = useState([]);
  const [preferCloze, setPreferCloze] = useState(true);
  const [replaceScope, setReplaceScope] = useState(true);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [quickAnswerText, setQuickAnswerText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResultInfo, setLastResultInfo] = useState(null);

  const appendImageFiles = async (fileList, setter) => {
    const files = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
    if (files.length === 0) return;
    setErrorMsg('');
    try {
      const converted = await Promise.all(
        files.map(async (f) => ({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: f.name || 'pasted-image.png',
          dataUrl: await compressImageToDataUrl(f)
        }))
      );
      setter(prev => [...prev, ...converted]);
    } catch (err) {
      setErrorMsg(err?.message || 'Lỗi xử lý ảnh tải lên.');
    }
  };

  const handlePasteZone = (e, setter) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type?.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      appendImageFiles(files, setter);
      showToast?.(`Đã dán ${files.length} ảnh từ Clipboard!`, 'info');
    }
  };

  const hasGeminiAccess = Boolean(aiApiKey?.trim() || aiConfigured);

  const handleRunAiExtract = async () => {
    setErrorMsg('');
    setLastResultInfo(null);

    if (!hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước để dùng AI đọc ảnh.');
      return;
    }

    if (questionImages.length === 0) {
      setErrorMsg('Hãy tải lên hoặc dán (Ctrl+V) ít nhất 1 ảnh trang đề thi ở khung bên trái.');
      return;
    }

    setExtracting(true);
    try {
      const extracted = await extractExamFromImages({
        apiKey: aiApiKey,
        skill,
        questionImages: questionImages.map(i => i.dataUrl),
        answerKeyImages: answerKeyImages.map(i => i.dataUrl),
        preferCloze,
        extraInstructions
      });

      const summary = onApplyExtraction(extracted, { replaceScope });
      setLastResultInfo({
        usedModel: extracted.usedModel,
        questionCount: extracted.questions.length,
        hasCloze: Boolean(extracted.clozeText),
        hasPassage: Boolean(extracted.passageText),
        addedOrUpdated: summary?.totalInScope ?? extracted.questions.length
      });
      showToast?.(`AI đã trích xuất ${extracted.questions.length} câu hỏi thành công!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể phân tích ảnh đề thi. Vui lòng thử ảnh rõ nét hơn.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#EDFFFD]/90 via-white to-[#EFF6FF]/70 dark:from-[#003538]/40 dark:via-[#0F172B] dark:to-slate-900 rounded-3xl border border-[#B5F5F1] dark:border-teal-500/35 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B5F5F1]/70 dark:border-teal-500/20 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#007A7A] text-white mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-300" /> AI Exam Vision • Không Cần Gõ Tay
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
            <span>Tạo Đề Tự Động Từ Ảnh Đề Thi ({scopeLabel})</span>
          </h3>
          <p className="text-xs text-[#314158] dark:text-slate-300 mt-0.5">
            Tải ảnh chụp hoặc nhấn <strong>Ctrl+V</strong> dán ảnh đề Cambridge/IDP (đục lỗ Note Completion, MCQ, TFNG, bài đọc...). AI sẽ tự tạo mẫu đục lỗ <code>{'{{1}}'}</code> &amp; danh sách câu hỏi chạy được ngay.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
            setShowApiKeyModal?.(true);
          }}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-[#314158] dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A] transition shadow-xs"
        >
          <Key className="w-3.5 h-3.5 text-[#E17100]" />
          <span>{aiApiKey?.trim() ? 'Gemini Key: Đã lưu' : aiConfigured ? 'Gemini Key: Đồng bộ Server' : 'Cấu hình Gemini Key'}</span>
          <span className={`w-2 h-2 rounded-full ${hasGeminiAccess ? 'bg-[#059271]' : 'bg-rose-500'}`} />
        </button>
      </div>

      {/* Dual Upload / Paste Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Question Sheets Drop/Paste Zone */}
        <div
          tabIndex={0}
          onPaste={e => handlePasteZone(e, setQuestionImages)}
          className="bg-white dark:bg-slate-900/90 rounded-2xl border-2 border-dashed border-[#007A7A]/45 dark:border-teal-500/40 p-4 space-y-3 focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> 1. Ảnh Đề Thi / Câu Hỏi ({questionImages.length} ảnh)
            </span>
            {questionImages.length > 0 && (
              <button
                type="button"
                onClick={() => setQuestionImages([])}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn 1 / Nhiều Ảnh Đề</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => {
                  appendImageFiles(e.target.files, setQuestionImages);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>

            {existingMediaImageUrl && (
              <button
                type="button"
                onClick={() => {
                  setQuestionImages(prev => [
                    ...prev,
                    { id: `media_${Date.now()}`, name: 'Ảnh đang tải bên dưới', dataUrl: existingMediaImageUrl }
                  ]);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 hover:bg-[#B5F5F1]/60 transition"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Lấy ảnh bên dưới
              </button>
            )}
          </div>

          <p className="text-xs text-[#475569] dark:text-slate-400">
            Mẹo: Bấm vào khung này rồi nhấn <strong>Ctrl + V</strong> để dán trực tiếp ảnh vừa chụp màn hình.
          </p>

          {questionImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {questionImages.map((img, idx) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-[4/3]">
                  <img src={img.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-xs font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestionImages(prev => prev.filter(p => p.id !== img.id))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100"
                    title="Gỡ ảnh này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional Answer Key Image + Quick Paste */}
        <div
          tabIndex={0}
          onPaste={e => handlePasteZone(e, setAnswerKeyImages)}
          className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 focus:outline-none focus:ring-2 focus:ring-[#059271]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[#059271] dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 2. Bảng Đáp Án (Tùy chọn • Để tự chấm điểm)
            </span>
            {answerKeyImages.length > 0 && (
              <button
                type="button"
                onClick={() => setAnswerKeyImages([])}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Xóa ảnh key
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#ECFDF5] dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-[#059271] dark:text-emerald-300 border border-[#9FF5E1] dark:border-emerald-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải Ảnh Answer Key ({answerKeyImages.length})</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => {
                  appendImageFiles(e.target.files, setAnswerKeyImages);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>

          {answerKeyImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {answerKeyImages.map((img, idx) => (
                <div key={img.id} className="relative w-16 h-12 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-600">
                  <img src={img.dataUrl} alt={`Key ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAnswerKeyImages(prev => prev.filter(p => p.id !== img.id))}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-[#475569] dark:text-slate-400">
              Hoặc dán nhanh danh sách đáp án dạng text (không cần AI):
            </label>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={quickAnswerText}
                onChange={e => setQuickAnswerText(e.target.value)}
                placeholder={'1. Hills\n2. 175\n3. full'}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#059271] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!quickAnswerText.trim()) return;
                  onApplyQuickAnswerText?.(quickAnswerText);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-[#059271] text-white text-xs font-bold transition shrink-0"
              >
                Điền Key
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Options & Trigger Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#314158] dark:text-slate-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferCloze}
              onChange={e => setPreferCloze(e.target.checked)}
              className="w-4 h-4 rounded text-[#007A7A]"
            />
            <span>Ưu tiên tạo dạng Đục lỗ (<code>{'{{1}}'}</code>) khi gặp bài Note/Summary</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceScope}
              onChange={e => setReplaceScope(e.target.checked)}
              className="w-4 h-4 rounded text-[#007A7A]"
            />
            <span>Thay thế câu hỏi của {scopeLabel}</span>
          </label>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="text"
            value={extraInstructions}
            onChange={e => setExtraInstructions(e.target.value)}
            placeholder="Ghi chú thêm cho AI (VD: chỉ lấy câu 1-10)..."
            className="w-full sm:w-56 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
          />

          <button
            type="button"
            disabled={extracting}
            onClick={handleRunAiExtract}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md ${
              extracting
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-wait'
                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
            }`}
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Đang Đọc Ảnh...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>AI Đọc Ảnh &amp; Tạo Đề Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {!hasGeminiAccess && (
            <button
              type="button"
              onClick={() => {
                setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
                setShowApiKeyModal?.(true);
              }}
              className="shrink-0 px-3 py-1 rounded-lg bg-[#007A7A] text-white font-bold text-xs"
            >
              Nhập Key Ngay
            </button>
          )}
        </div>
      )}

      {lastResultInfo && (
        <div className="p-3.5 bg-[#ECFDF5] dark:bg-emerald-500/15 border border-[#9FF5E1] dark:border-emerald-500/30 rounded-xl text-xs text-[#059271] dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Đã tự động tạo <strong>{lastResultInfo.questionCount} câu hỏi</strong>
              {lastResultInfo.hasCloze ? ' kèm bài Đục lỗ trực tiếp' : ''}
              {lastResultInfo.hasPassage ? ' kèm văn bản Bài đọc' : ''} (Model: <code>{lastResultInfo.usedModel}</code>). Kiểm tra lại danh sách bên dưới rồi bấm Lưu Đề Thi!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
