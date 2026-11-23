import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Headphones,
  Key,
  Loader2,
  Mic,
  PenTool,
  Sparkles,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import {
  extractListeningExamFromPdf,
  extractReadingExamFromPdf,
  extractWritingExamFromMedia
} from '../../utils/geminiGrader';
import { attachAutoCroppedWritingChart, readFileAsDataUrl } from '../../utils/pdfImageCropper';

const MAX_PDF_BYTES = 14 * 1024 * 1024;

function formatBytes(bytes = 0) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuickThreePdfImporter({
  aiApiKey,
  aiConfigured = false,
  defaultExpanded = true,
  onApplyListeningPdfExtraction,
  onApplyReadingPdfExtraction,
  onApplyWritingExtraction,
  onJumpToTab,
  onSuggestExamTitle,
  setApiTestState,
  setShowApiKeyModal,
  showToast
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [listeningPdf, setListeningPdf] = useState(null);
  const [listeningKeyFile, setListeningKeyFile] = useState(null);
  const [listeningKeyText, setListeningKeyText] = useState('');

  const [readingPdf, setReadingPdf] = useState(null);
  const [readingKeyFile, setReadingKeyFile] = useState(null);
  const [readingKeyText, setReadingKeyText] = useState('');

  const [writingFile, setWritingFile] = useState(null); // PDF or image

  const [running, setRunning] = useState(false);
  const [statusMap, setStatusMap] = useState({
    listening: { state: 'idle', message: '' },
    reading: { state: 'idle', message: '' },
    writing: { state: 'idle', message: '' }
  });

  const hasGeminiAccess = Boolean(aiApiKey?.trim() || aiConfigured);
  const selectedCount = [listeningPdf, readingPdf, writingFile].filter(Boolean).length;

  const pickPdf = (e, setter, skillName) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name?.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast?.(`Kỹ năng ${skillName} chỉ nhận file .PDF.`, 'error');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      showToast?.(`File PDF ${skillName} quá lớn (${formatBytes(file.size)} > 14MB).`, 'error');
      return;
    }
    setter(file);
  };

  const pickKeyFile = (e, setter) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PDF_BYTES) {
      showToast?.(`File đáp án quá lớn (${formatBytes(file.size)} > 14MB).`, 'error');
      return;
    }
    setter(file);
  };

  const pickWritingFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImg = file.type?.startsWith('image/');
    if (!isPdf && !isImg) {
      showToast?.('Writing hỗ trợ file .PDF hoặc ảnh (.PNG/.JPG/.WebP).', 'error');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      showToast?.(`File Writing quá lớn (${formatBytes(file.size)} > 14MB).`, 'error');
      return;
    }
    setWritingFile(file);
  };

  const prepareAnswerKeyPayload = async (keyFile, keyText) => {
    let answerKeyPdfDataUrl = '';
    let answerKeyImages = [];
    let mergedText = String(keyText || '').trim();
    if (keyFile) {
      const lower = String(keyFile.name || '').toLowerCase();
      if (lower.endsWith('.pdf') || keyFile.type === 'application/pdf') {
        answerKeyPdfDataUrl = await readFileAsDataUrl(keyFile);
      } else if (keyFile.type?.startsWith('image/')) {
        answerKeyImages = [await readFileAsDataUrl(keyFile)];
      } else if (/\.(txt|csv|tsv)$/i.test(lower)) {
        const txt = await keyFile.text();
        mergedText = [mergedText, txt.trim()].filter(Boolean).join('\n');
      }
    }
    return { answerKeyPdfDataUrl, answerKeyImages, answerKeyText: mergedText };
  };

  const handleRunBatchImport = async () => {
    if (!hasGeminiAccess) {
      showToast?.('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước khi chạy AI.', 'error');
      setShowApiKeyModal?.(true);
      return;
    }
    if (selectedCount === 0) {
      showToast?.('Hãy tải lên ít nhất 1 file PDF (Listening, Reading hoặc Writing) để bắt đầu.', 'error');
      return;
    }

    setRunning(true);
    setStatusMap({
      listening: listeningPdf ? { state: 'pending', message: 'Đang chờ xử lý...' } : { state: 'idle', message: '' },
      reading: readingPdf ? { state: 'pending', message: 'Đang chờ xử lý...' } : { state: 'idle', message: '' },
      writing: writingFile ? { state: 'pending', message: 'Đang chờ xử lý...' } : { state: 'idle', message: '' }
    });

    let okCount = 0;
    let firstDetectedTitle = '';

    // 1. Listening PDF
    if (listeningPdf) {
      setStatusMap(prev => ({
        ...prev,
        listening: { state: 'running', message: 'AI đang tách 4 Part & 40 câu Listening...' }
      }));
      try {
        const pdfDataUrl = await readFileAsDataUrl(listeningPdf);
        const keyPayload = await prepareAnswerKeyPayload(listeningKeyFile, listeningKeyText);
        const extracted = await extractListeningExamFromPdf({
          apiKey: aiApiKey,
          pdfDataUrl,
          fileName: listeningPdf.name,
          ...keyPayload
        });
        if (!firstDetectedTitle && extracted.title) firstDetectedTitle = extracted.title;
        const summary = onApplyListeningPdfExtraction?.(extracted, { replaceAll: true, skipConfirm: true });
        okCount += 1;
        setStatusMap(prev => ({
          ...prev,
          listening: {
            state: 'done',
            message: `✓ ${summary?.partCount ?? extracted.parts.length} bài · ${summary?.questionCount ?? extracted.questionCount} câu${extracted.answerKeyFound ? ' (có đáp án)' : ''}`
          }
        }));
      } catch (err) {
        setStatusMap(prev => ({
          ...prev,
          listening: { state: 'error', message: err?.message || 'Lỗi đọc PDF Listening' }
        }));
      }
    }

    // 2. Reading PDF
    if (readingPdf) {
      setStatusMap(prev => ({
        ...prev,
        reading: { state: 'running', message: 'AI đang tách 3 Passage & 40 câu Reading...' }
      }));
      try {
        const pdfDataUrl = await readFileAsDataUrl(readingPdf);
        const keyPayload = await prepareAnswerKeyPayload(readingKeyFile, readingKeyText);
        const extracted = await extractReadingExamFromPdf({
          apiKey: aiApiKey,
          pdfDataUrl,
          fileName: readingPdf.name,
          ...keyPayload
        });
        if (!firstDetectedTitle && extracted.title) firstDetectedTitle = extracted.title;
        const summary = onApplyReadingPdfExtraction?.(extracted, { replaceAll: true, skipConfirm: true });
        okCount += 1;
        setStatusMap(prev => ({
          ...prev,
          reading: {
            state: 'done',
            message: `✓ ${summary?.passageCount ?? extracted.passages.length} bài · ${summary?.questionCount ?? extracted.questionCount} câu${extracted.answerKeyFound ? ' (có đáp án)' : ''}`
          }
        }));
      } catch (err) {
        setStatusMap(prev => ({
          ...prev,
          reading: { state: 'error', message: err?.message || 'Lỗi đọc PDF Reading' }
        }));
      }
    }

    // 3. Writing PDF / Image
    if (writingFile) {
      setStatusMap(prev => ({
        ...prev,
        writing: { state: 'running', message: 'AI đang tách Task 1 + cắt ảnh biểu đồ + Task 2...' }
      }));
      try {
        const isPdf = writingFile.name?.toLowerCase().endsWith('.pdf') || writingFile.type === 'application/pdf';
        const fileDataUrl = await readFileAsDataUrl(writingFile);
        const rawExtracted = await extractWritingExamFromMedia({
          apiKey: aiApiKey,
          pdfDataUrl: isPdf ? fileDataUrl : '',
          images: isPdf ? [] : [fileDataUrl],
          fileName: writingFile.name,
          writingScope: 'both'
        });
        const enriched = await attachAutoCroppedWritingChart(rawExtracted, {
          pdfFile: isPdf ? writingFile : null,
          pdfDataUrl: isPdf ? fileDataUrl : '',
          images: isPdf ? [] : [fileDataUrl]
        });
        if (!firstDetectedTitle && enriched.title) firstDetectedTitle = enriched.title;
        onApplyWritingExtraction?.(enriched, { writingScope: 'both' });
        okCount += 1;
        setStatusMap(prev => ({
          ...prev,
          writing: {
            state: 'done',
            message: `✓ Task 1${enriched.task1?.imageUrl ? ' (+ ảnh biểu đồ)' : ''} & Task 2`
          }
        }));
      } catch (err) {
        setStatusMap(prev => ({
          ...prev,
          writing: { state: 'error', message: err?.message || 'Lỗi đọc đề Writing' }
        }));
      }
    }

    if (firstDetectedTitle && onSuggestExamTitle) {
      onSuggestExamTitle(firstDetectedTitle);
    }

    setRunning(false);
    if (okCount > 0) {
      showToast?.(`Hoàn tất tạo nhanh ${okCount}/${selectedCount} kỹ năng từ PDF! Chỉ còn kiểm tra audio MP3 và soạn Speaking ở Tab 5.`);
    }
  };

  const renderStatusPill = (st) => {
    if (!st || st.state === 'idle') return null;
    if (st.state === 'running') {
      return (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-700 text-[11px] font-bold text-[#0F766E] dark:text-teal-300 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{st.message}</span>
        </div>
      );
    }
    if (st.state === 'done') {
      return (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{st.message}</span>
        </div>
      );
    }
    if (st.state === 'error') {
      return (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-700 text-[11px] font-bold text-rose-700 dark:text-rose-200 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{st.message}</span>
        </div>
      );
    }
    return (
      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        {st.message}
      </div>
    );
  };

  return (
    <div
      data-testid="quick-three-pdf-importer"
      className="mb-6 rounded-3xl border-2 border-[#007A7A]/40 dark:border-teal-500/40 bg-gradient-to-br from-[#EDFFFD] via-white to-indigo-50/60 dark:from-[#042428] dark:via-slate-900 dark:to-indigo-950/35 p-5 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#007A7A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white">
                Tạo Đề Nhanh Từ 3 File PDF (Listening + Reading + Writing)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 text-[11px] font-extrabold">
                Trừ Speaking (Tab 5)
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-slate-300 mt-0.5 leading-relaxed">
              Thả sẵn cùng lúc <b>3 file PDF</b> (hoặc chỉ 1–2 file bạn có) → bấm 1 nút, AI tự tạo đồng loạt <b>Listening (4 bài/40 câu)</b>, <b>Reading (3 bài/40 câu)</b> và <b>Writing (Task 1 tự cắt ảnh biểu đồ + Task 2)</b>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasGeminiAccess && setShowApiKeyModal && (
            <button
              type="button"
              onClick={() => {
                setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
                setShowApiKeyModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> Nhập API Key
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 transition"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{expanded ? 'Thu gọn' : 'Mở Tạo Nhanh 3 PDF'}</span>
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {/* SLOT 1: LISTENING PDF */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4" /> 1. PDF Listening (4 bài · 40 câu)
                  </span>
                  {listeningPdf && (
                    <button
                      type="button"
                      onClick={() => setListeningPdf(null)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Gỡ PDF Listening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="cursor-pointer block rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/25 p-3 text-center transition">
                  {listeningPdf ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-blue-900 dark:text-blue-100 truncate">{listeningPdf.name}</p>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-300">{formatBytes(listeningPdf.size)} · Bấm để đổi file</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-4 h-4 mx-auto text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Chọn file PDF Listening</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    aria-label="Tạo nhanh: chọn PDF Listening"
                    onChange={e => pickPdf(e, setListeningPdf, 'Listening')}
                    className="hidden"
                  />
                </label>

                {/* Optional Answer Key */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Bảng đáp án Listening (tùy chọn):
                    </span>
                    <label className="cursor-pointer text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      {listeningKeyFile ? 'Đổi file key' : '+ Ảnh/PDF key'}
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*,.txt,.csv,.tsv"
                        onChange={e => pickKeyFile(e, setListeningKeyFile)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {listeningKeyFile && (
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-semibold">
                      <span className="truncate">{listeningKeyFile.name}</span>
                      <button type="button" onClick={() => setListeningKeyFile(null)} className="ml-1 text-rose-500">✕</button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={listeningKeyText}
                    onChange={e => setListeningKeyText(e.target.value)}
                    placeholder="Hoặc dán nhanh key: 1. garden, 2. B..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              {renderStatusPill(statusMap.listening)}
            </div>

            {/* SLOT 2: READING PDF */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> 2. PDF Reading (3 bài · 40 câu)
                  </span>
                  {readingPdf && (
                    <button
                      type="button"
                      onClick={() => setReadingPdf(null)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Gỡ PDF Reading"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="cursor-pointer block rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/25 p-3 text-center transition">
                  {readingPdf ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-100 truncate">{readingPdf.name}</p>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300">{formatBytes(readingPdf.size)} · Bấm để đổi file</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-4 h-4 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Chọn file PDF Reading</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    aria-label="Tạo nhanh: chọn PDF Reading"
                    onChange={e => pickPdf(e, setReadingPdf, 'Reading')}
                    className="hidden"
                  />
                </label>

                {/* Optional Answer Key */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Bảng đáp án Reading (tùy chọn):
                    </span>
                    <label className="cursor-pointer text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {readingKeyFile ? 'Đổi file key' : '+ Ảnh/PDF key'}
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*,.txt,.csv,.tsv"
                        onChange={e => pickKeyFile(e, setReadingKeyFile)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {readingKeyFile && (
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 font-semibold">
                      <span className="truncate">{readingKeyFile.name}</span>
                      <button type="button" onClick={() => setReadingKeyFile(null)} className="ml-1 text-rose-500">✕</button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={readingKeyText}
                    onChange={e => setReadingKeyText(e.target.value)}
                    placeholder="Hoặc dán nhanh key: 1. TRUE, 2. FALSE..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              {renderStatusPill(statusMap.reading)}
            </div>

            {/* SLOT 3: WRITING PDF / IMAGE */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4" /> 3. PDF / Ảnh Writing (Task 1–2)
                  </span>
                  {writingFile && (
                    <button
                      type="button"
                      onClick={() => setWritingFile(null)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Gỡ file Writing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="cursor-pointer block rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/25 p-3 text-center transition">
                  {writingFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100 truncate">{writingFile.name}</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300">{formatBytes(writingFile.size)} · Bấm để đổi file</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Chọn file PDF hoặc Ảnh Writing</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf,image/*"
                    aria-label="Tạo nhanh: chọn PDF hoặc ảnh Writing"
                    onChange={pickWritingFile}
                    className="hidden"
                  />
                </label>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                  Tự đọc chữ <b>Task 1 + Task 2</b> và <b>tự động cắt ảnh biểu đồ / bản đồ Task 1</b> từ trang PDF đưa thẳng vào đề!
                </div>
              </div>
              {renderStatusPill(statusMap.writing)}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4 text-[#007A7A] dark:text-teal-400 shrink-0" />
              <span>
                Đã chọn <b>{selectedCount}/3 file</b> · Phần{' '}
                <button
                  type="button"
                  onClick={() => onJumpToTab?.('speaking')}
                  className="font-extrabold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                >
                  <Mic className="w-3 h-3" /> Speaking (Tab 5)
                </button>{' '}
                giữ nguyên để bạn tạo riêng.
              </span>
            </div>

            <button
              type="button"
              disabled={running || selectedCount === 0}
              onClick={handleRunBatchImport}
              data-testid="run-quick-three-pdf-btn"
              className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs sm:text-sm font-black inline-flex items-center gap-2 shadow-md transition"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tự động trích xuất PDF...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {selectedCount === 3
                      ? 'Tự Động Tạo Cả 3 Phần (L + R + W) Ngay'
                      : selectedCount > 0
                      ? `Tự Động Tạo ${selectedCount} Phần Đã Chọn Ngay`
                      : 'Tải ít nhất 1 file PDF ở trên để tạo nhanh'}
                  </span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
