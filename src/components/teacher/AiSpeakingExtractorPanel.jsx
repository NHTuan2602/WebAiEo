import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Key,
  Loader2,
  Trash2,
  Upload,
  Wand2
} from 'lucide-react';
import { extractSpeakingExamFromMedia } from '../../utils/geminiGrader';
import { readFileAsDataUrl } from '../../utils/pdfImageCropper';
import { extractDocxContent } from '../../utils/wordImportHelpers';

const MAX_SPEAKING_PDF_BYTES = 14 * 1024 * 1024;

function formatFileSize(bytes = 0) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AiSpeakingExtractorPanel({
  aiApiKey = '',
  aiConfigured = false,
  onApplySpeakingExtraction,
  setApiTestState,
  setShowApiKeyModal,
  showToast
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [docxFile, setDocxFile] = useState(null);
  const [images, setImages] = useState([]);
  const [pastedText, setPastedText] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const hasGeminiAccess = Boolean((aiApiKey || '').trim() || aiConfigured);

  const appendImages = async (fileList) => {
    const imgFiles = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
    if (imgFiles.length === 0) return;
    setErrorMsg('');
    try {
      const loaded = await Promise.all(
        imgFiles.map(async f => ({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: f.name || 'speaking-page.png',
          dataUrl: await readFileAsDataUrl(f)
        }))
      );
      setImages(prev => [...prev, ...loaded]);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đọc file ảnh đề Speaking.');
    }
  };

  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setErrorMsg('');
    setLastResult(null);

    const docxCandidate = files.find(
      f =>
        f.name?.toLowerCase().endsWith('.docx') ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    if (docxCandidate) {
      setDocxFile(docxCandidate);
    } else if (files.some(f => f.name?.toLowerCase().endsWith('.doc'))) {
      setErrorMsg('File .doc đời cũ chưa được hỗ trợ — hãy mở bằng Word / Google Docs và lưu thành .docx.');
    }

    const pdfCandidate = files.find(f => f.name?.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    if (pdfCandidate) {
      if (pdfCandidate.size > MAX_SPEAKING_PDF_BYTES) {
        setErrorMsg(`File PDF quá lớn (${formatFileSize(pdfCandidate.size)}). Vui lòng chọn file nhỏ hơn 14 MB.`);
      } else {
        setPdfFile(pdfCandidate);
      }
    }

    const imageFiles = files.filter(f => f.type?.startsWith('image/'));
    if (imageFiles.length > 0) {
      await appendImages(imageFiles);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedImgs = [];
    for (const item of items) {
      if (item.type?.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) pastedImgs.push(f);
      }
    }
    if (pastedImgs.length > 0) {
      e.preventDefault();
      appendImages(pastedImgs);
      showToast?.(`Đã dán ${pastedImgs.length} ảnh đề Speaking từ Clipboard!`, 'info');
    }
  };

  const hasAnyInput = Boolean(pdfFile || docxFile || images.length > 0 || pastedText.trim());

  const handleRunExtract = async () => {
    setErrorMsg('');
    setLastResult(null);
    if (!hasAnyInput) {
      setErrorMsg('Hãy tải lên file PDF, Word (.docx), ảnh chụp đề Speaking hoặc dán nội dung câu hỏi.');
      return;
    }

    const needsVisionAi = Boolean(pdfFile || images.length > 0);
    if (needsVisionAi && !hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key để AI đọc file PDF / ảnh Speaking.');
      return;
    }

    setExtracting(true);
    try {
      let combinedText = pastedText.trim();
      let extraDocImages = [];
      if (docxFile) {
        const parsedDoc = await extractDocxContent(docxFile, docxFile.name);
        if (parsedDoc.rawText) {
          combinedText = [combinedText, parsedDoc.rawText].filter(Boolean).join('\n\n');
        }
        if (!parsedDoc.rawText && parsedDoc.primaryImageUrl) {
          extraDocImages = [parsedDoc.primaryImageUrl];
        }
      }

      const pdfDataUrl = pdfFile ? await readFileAsDataUrl(pdfFile) : '';
      const imageUrls = [...images.map(i => i.dataUrl), ...extraDocImages];

      const extracted = await extractSpeakingExamFromMedia({
        apiKey: aiApiKey,
        aiConfigured,
        pdfDataUrl,
        rawText: combinedText,
        images: imageUrls,
        fileName: pdfFile?.name || docxFile?.name || images[0]?.name || '',
        extraInstructions
      });

      onApplySpeakingExtraction?.(extracted);
      setLastResult(extracted);

      const p1Count = extracted.part1Questions?.length || 0;
      const p2Count = extracted.part2CueCardPrompt ? 1 : 0;
      const p3Count = extracted.part3Questions?.length || 0;
      showToast?.(
        `Đã trích xuất xong đề Speaking: Part 1 (${p1Count} câu) · Part 2 (${p2Count} Cue Card) · Part 3 (${p3Count} câu)!`
      );
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể trích xuất đề Speaking từ file này. Hãy thử lại.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div
      data-testid="ai-speaking-extractor-panel"
      onPaste={handlePaste}
      className="rounded-2xl border border-teal-300 dark:border-teal-700/60 bg-gradient-to-br from-[#EDFFFD] via-white to-indigo-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-indigo-950/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#007A7A] text-white text-[11px] font-black uppercase">
              <Bot className="w-3.5 h-3.5" /> AI Tạo Tự Động Speaking Từ File
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Tải PDF / Word (.docx) / Ảnh / Dán Đề → Tự Tách Chuẩn Part 1 (Nhiều Chủ Đề) · Part 2 Cue Card · Part 3
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Hỗ trợ file <b>.PDF</b>, <b>Word (.docx)</b>, chụp màn hình dán thẳng <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold">Ctrl+V</kbd> hoặc dán văn bản. Tự nhận diện đủ các chủ đề Part 1 (VD: <i>Accommodation, Social Media</i>), gạch đầu dòng Part 2 và toàn bộ câu hỏi Part 3 kèm lời dẫn Giám khảo!
          </p>
        </div>

        {!hasGeminiAccess && setShowApiKeyModal && (
          <button
            type="button"
            onClick={() => {
              setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
              setShowApiKeyModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0"
          >
            <Key className="w-3.5 h-3.5" /> Nhập Gemini API Key
          </button>
        )}
      </div>

      {/* Upload & Paste Zone */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        <label className="md:col-span-6 cursor-pointer rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 bg-white/90 dark:bg-slate-900/70 hover:border-[#007A7A] p-4 flex flex-col items-center justify-center text-center gap-2 transition">
          <div className="w-10 h-10 rounded-xl bg-[#EDFFFD] dark:bg-teal-900/50 text-[#0F766E] dark:text-[#1EE1D6] flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Chọn File PDF, Word (.docx) hoặc Ảnh Đề Speaking (hỗ trợ Ctrl+V)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhận .PDF (≤ 14MB), .DOCX (Word / Google Docs) hoặc ảnh .PNG / .JPG / .WebP
            </p>
          </div>
          <input
            type="file"
            data-testid="ai-speaking-file-input"
            accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
            multiple
            aria-label="Chọn PDF, Word hoặc ảnh đề IELTS Speaking"
            onChange={handleSelectFiles}
            className="hidden"
          />
        </label>

        <div className="md:col-span-6 flex flex-col justify-between gap-2.5">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Hoặc dán nhanh văn bản đề Speaking (tùy chọn):
            </label>
            <textarea
              rows={3}
              data-testid="ai-speaking-paste-textarea"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={'PART 1 Let\'s talk about ACCOMMODATION\nAre you living in an apartment or a flat?\n...\nPART 2: YOUR TOPIC IS: DESCRIBE ...'}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={extraInstructions}
              onChange={e => setExtraInstructions(e.target.value)}
              placeholder="Ghi chú thêm cho AI (tùy chọn)..."
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              data-testid="ai-speaking-extract-btn"
              disabled={extracting || !hasAnyInput}
              onClick={handleRunExtract}
              className="px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition whitespace-nowrap"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tách Part 1·2·3...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Tách Đề Speaking Tự Động</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Selected files chips */}
      {(docxFile || pdfFile || images.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {docxFile && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="max-w-[220px] truncate">{docxFile.name}</span>
              <span className="text-[11px] text-slate-500">({formatFileSize(docxFile.size)})</span>
              <button
                type="button"
                onClick={() => setDocxFile(null)}
                className="ml-1 text-slate-400 hover:text-rose-600"
                aria-label="Xóa file Word Speaking"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {pdfFile && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              <FileText className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
              <span className="max-w-[220px] truncate">{pdfFile.name}</span>
              <span className="text-[11px] text-slate-500">({formatFileSize(pdfFile.size)})</span>
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className="ml-1 text-slate-400 hover:text-rose-600"
                aria-label="Xóa file PDF Speaking"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {images.map((img, idx) => (
            <span
              key={img.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <img src={img.dataUrl} alt={img.name} className="w-6 h-6 rounded object-cover border border-slate-200" />
              <span className="max-w-[140px] truncate">Ảnh {idx + 1}: {img.name}</span>
              <button
                type="button"
                onClick={() => setImages(prev => prev.filter(x => x.id !== img.id))}
                className="text-slate-400 hover:text-rose-600"
                aria-label="Xóa ảnh Speaking"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700/60 text-xs font-semibold text-rose-700 dark:text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {lastResult && (
        <div
          data-testid="ai-speaking-extract-success"
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700/60 flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Đã nạp thành công: Part 1 ({lastResult.part1Questions?.length || 0} câu) · Part 2 ({lastResult.part2Bullets?.length || 0} ý Cue Card) · Part 3 ({lastResult.part3Questions?.length || 0} câu)
          </span>
          {lastResult.usedModel && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {lastResult.usedModel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <ClipboardPaste className="w-3.5 h-3.5 shrink-0 text-[#007A7A] dark:text-[#1EE1D6]" />
        <span>Hỗ trợ cả File Word (.docx) không cần AI Key, hoặc file PDF / Ảnh chụp đề giấy (dùng Gemini AI).</span>
      </div>
    </div>
  );
}
