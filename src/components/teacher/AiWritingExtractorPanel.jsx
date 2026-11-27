import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Image as ImageIcon,
  Key,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from 'lucide-react';
import { extractWritingExamFromMedia } from '../../utils/geminiGrader';
import { attachAutoCroppedWritingChart, readFileAsDataUrl } from '../../utils/pdfImageCropper';
import { cleanEnglishTitleFromDocxFilename, extractDocxContent } from '../../utils/wordImportHelpers';
import { compressVisualDataUrl } from '../../utils/dailyWritingBulkAi';

const MAX_WRITING_PDF_BYTES = 14 * 1024 * 1024;

function formatFileSize(bytes = 0) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AiWritingExtractorPanel({
  aiApiKey,
  aiConfigured = false,
  onApplyWritingExtraction,
  setApiTestState,
  setShowApiKeyModal,
  showToast,
  writingScope = 'both'
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [docxFile, setDocxFile] = useState(null);
  const [images, setImages] = useState([]);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const hasGeminiAccess = Boolean(aiApiKey?.trim() || aiConfigured);

  const appendImages = async (fileList) => {
    const imgFiles = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
    if (imgFiles.length === 0) return;
    setErrorMsg('');
    try {
      const loaded = await Promise.all(
        imgFiles.map(async f => ({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: f.name || 'writing-image.png',
          dataUrl: await readFileAsDataUrl(f)
        }))
      );
      setImages(prev => [...prev, ...loaded]);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đọc file ảnh đề Writing.');
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
      setErrorMsg('File .doc đời cũ chưa được hỗ trợ trực tiếp — hãy mở bằng Word / Google Docs và lưu lại dạng .docx.');
    }

    const pdfCandidate = files.find(f => f.name?.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    if (pdfCandidate) {
      if (pdfCandidate.size > MAX_WRITING_PDF_BYTES) {
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
    const pasted = [];
    for (const item of items) {
      if (item.type?.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length > 0) {
      e.preventDefault();
      appendImages(pasted);
      showToast?.(`Đã dán ${pasted.length} ảnh đề Writing từ Clipboard!`, 'info');
    }
  };

  const handleRunExtract = async () => {
    setErrorMsg('');
    setLastResult(null);
    if (!docxFile && !pdfFile && images.length === 0) {
      setErrorMsg('Hãy tải lên file Word (.docx), file PDF đề Writing hoặc dán (Ctrl+V) ít nhất 1 ảnh đề Writing.');
      return;
    }

    // Fast lossless path for Word (.docx) files when no PDF/extra images are combined
    if (docxFile && !pdfFile && images.length === 0) {
      setExtracting(true);
      try {
        const parsed = await extractDocxContent(docxFile, docxFile.name);
        const compressedImg = parsed.primaryImageUrl
          ? await compressVisualDataUrl(parsed.primaryImageUrl, { maxWidth: 1400, quality: 0.88 })
          : '';
        const hasText = Boolean((parsed.prompt || parsed.rawText || '').split(/\s+/).filter(Boolean).length >= 6);

        // If Word doc contains only a pasted screenshot image, fall back to Gemini Vision on that image
        if (!hasText && compressedImg) {
          if (!hasGeminiAccess) {
            setErrorMsg('File Word này chỉ chứa hình chụp (không có văn bản). Hãy cấu hình Gemini API Key để AI đọc chữ từ hình.');
            return;
          }
          const rawExtracted = await extractWritingExamFromMedia({
            apiKey: aiApiKey,
            pdfDataUrl: '',
            images: [compressedImg],
            fileName: docxFile.name,
            writingScope,
            extraInstructions
          });
          const enriched = await attachAutoCroppedWritingChart(rawExtracted, {
            pdfFile: null,
            pdfDataUrl: '',
            images: [compressedImg]
          });
          onApplyWritingExtraction?.(enriched, { writingScope });
          setLastResult(enriched);
          showToast?.('AI đã đọc ảnh chụp trong file Word & tự tạo đề Writing!');
          return;
        }

        // Check if document contains both Task 1 and Task 2 headers
        const fullText = parsed.rawText || '';
        const t2SplitMatch = fullText.match(/(?:^|\n)\s*(?:WRITING\s+)?TASK\s*2\b[:.\-\s]*([\s\S]+)$/i);
        const task2FromDoc = t2SplitMatch ? t2SplitMatch[1].trim() : '';
        const task1FromDoc = t2SplitMatch
          ? fullText.slice(0, t2SplitMatch.index).trim()
          : parsed.prompt || fullText;

        const directResult = {
          title: cleanEnglishTitleFromDocxFilename(docxFile.name) || '',
          usedModel: 'word-docx-direct',
          warnings: !compressedImg && writingScope !== 'task2'
            ? ['File Word chưa có hình biểu đồ nhúng — bạn có thể gắn ảnh thủ công hoặc bấm nút "Tạo AI Hình Ảnh" bên dưới.']
            : [],
          task1:
            writingScope === 'task2'
              ? { prompt: '', imageUrl: '', modelAnswer: '' }
              : {
                  prompt: task1FromDoc,
                  imageUrl: compressedImg,
                  modelAnswer: t2SplitMatch ? '' : parsed.modelAnswer || ''
                },
          task2:
            writingScope === 'task1'
              ? { prompt: '', modelAnswer: '' }
              : {
                  prompt: writingScope === 'task2' ? fullText : task2FromDoc,
                  modelAnswer: ''
                }
        };

        onApplyWritingExtraction?.(directResult, { writingScope });
        setLastResult(directResult);
        showToast?.(
          `Đã nhập trực tiếp từ file Word "${docxFile.name}"${compressedImg ? ' (kèm ảnh biểu đồ sắc nét)' : ''}!`
        );
        return;
      } catch (err) {
        setErrorMsg(err?.message || 'Không thể đọc file Word (.docx) này.');
        return;
      } finally {
        setExtracting(false);
      }
    }

    if (!hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước khi dùng AI đọc PDF / Ảnh.');
      return;
    }

    setExtracting(true);
    try {
      const pdfDataUrl = pdfFile ? await readFileAsDataUrl(pdfFile) : '';
      const imageUrls = images.map(i => i.dataUrl);
      const rawExtracted = await extractWritingExamFromMedia({
        apiKey: aiApiKey,
        pdfDataUrl,
        images: imageUrls,
        fileName: pdfFile?.name || images[0]?.name || '',
        writingScope,
        extraInstructions
      });
      const enriched = await attachAutoCroppedWritingChart(rawExtracted, {
        pdfFile,
        pdfDataUrl,
        images: imageUrls
      });
      onApplyWritingExtraction?.(enriched, { writingScope });
      setLastResult(enriched);
      const partsSummary = [
        enriched.task1?.prompt && writingScope !== 'task2'
          ? `Task 1${enriched.task1?.imageUrl ? ' (kèm ảnh biểu đồ tự cắt)' : ''}`
          : '',
        enriched.task2?.prompt && writingScope !== 'task1' ? 'Task 2' : ''
      ]
        .filter(Boolean)
        .join(' + ');
      showToast?.(`AI đã tự động tạo đề Writing: ${partsSummary || 'hoàn tất'}!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể trích xuất đề Writing từ file này. Hãy thử lại.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase">
              <Bot className="w-3.5 h-3.5" /> AI Tạo Tự Động Writing
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Tải File Word (.docx) / PDF / Ảnh Đề Writing → Tự Tách Task 1 + Biểu Đồ + Task 2
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Hỗ trợ file <b>Word (.docx)</b> (tự lấy nguyên chữ đề bài + ảnh biểu đồ gốc siêu nhanh), <b>.PDF</b> hoặc chụp màn hình dán thẳng <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold">Ctrl+V</kbd>.
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
        <label className="md:col-span-7 cursor-pointer rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-white/90 dark:bg-slate-900/70 hover:border-emerald-500 p-4 flex flex-col items-center justify-center text-center gap-2 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              Bấm chọn File Word (.docx), PDF hoặc Ảnh Đề Writing (hoặc bấm vào đây rồi nhấn Ctrl+V)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhận .DOCX (Word / Google Docs tải về), .PDF (≤ 14MB) hoặc .PNG / .JPG / .WebP
            </p>
          </div>
          <input
            type="file"
            data-testid="single-writing-file-input"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf,image/*"
            multiple
            aria-label="Chọn Word, PDF hoặc ảnh đề IELTS Writing"
            onChange={handleSelectFiles}
            className="hidden"
          />
        </label>

        <div className="md:col-span-5 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Ghi chú thêm cho AI (tùy chọn):
            </label>
            <input
              type="text"
              value={extraInstructions}
              onChange={e => setExtraInstructions(e.target.value)}
              placeholder="VD: Chỉ lấy Task 1, hoặc giữ nguyên lời dẫn..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            disabled={extracting || (!docxFile && !pdfFile && images.length === 0)}
            onClick={handleRunExtract}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang đọc file &amp; trích xuất đề Writing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{docxFile && !pdfFile && images.length === 0 ? 'Nhập Trực Tiếp Từ File Word (.docx)' : 'AI Đọc File & Tự Động Tạo Đề Writing'}</span>
              </>
            )}
          </button>
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
                aria-label="Xóa file Word Writing"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {pdfFile && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-slate-800 dark:text-slate-100">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="max-w-[220px] truncate">{pdfFile.name}</span>
              <span className="text-[11px] text-slate-500">({formatFileSize(pdfFile.size)})</span>
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className="ml-1 text-slate-400 hover:text-rose-600"
                aria-label="Xóa PDF Writing"
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
                aria-label="Xóa ảnh Writing"
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
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700/60 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Đã nạp thành công từ AI ({lastResult.usedModel})
            </span>
            {lastResult.task1?.fullPageImageUrl && lastResult.task1?.croppedImageUrl && writingScope !== 'task2' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onApplyWritingExtraction?.(
                      { ...lastResult, task1: { ...lastResult.task1, imageUrl: lastResult.task1.croppedImageUrl } },
                      { writingScope, imageOnly: true }
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 font-bold"
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />Ảnh biểu đồ tự cắt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyWritingExtraction?.(
                      { ...lastResult, task1: { ...lastResult.task1, imageUrl: lastResult.task1.fullPageImageUrl } },
                      { writingScope, imageOnly: true }
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <ImageIcon className="w-3 h-3 inline mr-1" />Dùng cả trang gốc
                </button>
              </div>
            )}
          </div>
          {Array.isArray(lastResult.warnings) && lastResult.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-amber-700 dark:text-amber-300 space-y-0.5">
              {lastResult.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <ClipboardPaste className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Mẹo: Nếu chỉ có ảnh chụp màn hình Google Docs / sách Cambridge, nhấn <kbd className="font-bold">Win+Shift+S</kbd> rồi dán <kbd className="font-bold">Ctrl+V</kbd> trực tiếp vào khung này.</span>
      </div>
    </div>
  );
}
