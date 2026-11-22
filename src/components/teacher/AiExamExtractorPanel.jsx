import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Key,
  Layers,
  Loader2,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X
} from 'lucide-react';
import {
  convertScreenshotsToIeltsHtml,
  extractAnswerKeyFromMedia,
  extractExamFromImages,
  extractListeningExamFromPdf,
  extractReadingExamFromPdf,
  extractReadingExamFromScreenshots
} from '../../utils/geminiGrader';

const MAX_READING_PDF_BYTES = 14 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file PDF.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Dữ liệu PDF không hợp lệ.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes = 0) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  onApplyListeningPdfExtraction = null,
  onApplyQuickAnswerText,
  onApplyReadingPdfExtraction = null,
  scopeLabel,
  setApiTestState,
  setShowApiKeyModal,
  showToast,
  skill = 'listening'
}) {
  const [questionImages, setQuestionImages] = useState([]);
  const [answerKeyImages, setAnswerKeyImages] = useState([]);
  const [readingPdfFile, setReadingPdfFile] = useState(null);
  const [replaceWholeReading, setReplaceWholeReading] = useState(true);
  const [listeningPdfFile, setListeningPdfFile] = useState(null);
  const [replaceWholeListening, setReplaceWholeListening] = useState(true);
  const [pdfAnswerKeyImages, setPdfAnswerKeyImages] = useState([]);
  const [pdfAnswerKeyPdfFile, setPdfAnswerKeyPdfFile] = useState(null);
  const [pdfAnswerKeyText, setPdfAnswerKeyText] = useState('');
  const [extractingAnswerKeyOnly, setExtractingAnswerKeyOnly] = useState(false);
  const [preferCloze, setPreferCloze] = useState(true);
  const [replaceScope, setReplaceScope] = useState(true);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [quickAnswerText, setQuickAnswerText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResultInfo, setLastResultInfo] = useState(null);
  const [readingSourceTab, setReadingSourceTab] = useState('pdf');
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [autoApplyScreenshots, setAutoApplyScreenshots] = useState(true);
  const [cambridgeHtmlResult, setCambridgeHtmlResult] = useState(null);
  const [showHtmlPreviewModal, setShowHtmlPreviewModal] = useState(false);

  const handlePrintCambridgeHtml = (html) => {
    if (!html) return;
    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      showToast?.('Vui lòng cho phép popup trình duyệt để mở hộp thoại in/lưu PDF.', 'error');
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  const handleDownloadCambridgeHtml = (html, fileName = 'cambridge_ielts_reading.html') => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast?.('Đã tải xuống file HTML đề thi!');
  };

  const handleRunScreenshotsConversion = async (autoApply = true) => {
    setErrorMsg('');
    setLastResultInfo(null);
    if (!hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước khi sử dụng AI.');
      return;
    }
    if (screenshotFiles.length === 0) {
      setErrorMsg('Hãy tải lên hoặc dán (Ctrl+V) ít nhất 1 ảnh chụp màn hình đề thi.');
      return;
    }

    setExtracting(true);
    try {
      const imagesData = screenshotFiles.map(i => i.dataUrl);
      if (autoApply && onApplyReadingPdfExtraction) {
        const extracted = await extractReadingExamFromScreenshots({
          apiKey: aiApiKey,
          images: imagesData,
          extraInstructions
        });
        const summary = onApplyReadingPdfExtraction(extracted, { replaceAll: replaceWholeReading });
        if (summary?.cancelled) {
          setCambridgeHtmlResult({
            fullHtml: extracted.fullHtml,
            rawBodyHtml: extracted.rawBodyHtml,
            usedModel: extracted.usedModel,
            title: extracted.title,
            questionCount: extracted.questionCount,
            passageCount: extracted.passages.length,
            extracted
          });
          return;
        }
        setCambridgeHtmlResult({
          fullHtml: extracted.fullHtml,
          rawBodyHtml: extracted.rawBodyHtml,
          usedModel: extracted.usedModel,
          title: extracted.title,
          questionCount: summary?.questionCount ?? extracted.questionCount,
          passageCount: summary?.passageCount ?? extracted.passages.length,
          extracted
        });
        setLastResultInfo({
          usedModel: extracted.usedModel,
          questionCount: summary?.questionCount ?? extracted.questionCount,
          passageCount: summary?.passageCount ?? extracted.passages.length,
          answerKeyFound: extracted.answerKeyFound,
          warnings: Array.isArray(extracted.warnings) ? extracted.warnings : []
        });
        showToast?.(`AI đã ghép ${screenshotFiles.length} ảnh và tạo ${summary?.passageCount ?? extracted.passages.length} passage với ${summary?.questionCount ?? extracted.questionCount} câu!`);
      } else {
        const result = await convertScreenshotsToIeltsHtml({
          apiKey: aiApiKey,
          images: imagesData,
          extraInstructions
        });
        setCambridgeHtmlResult({
          fullHtml: result.fullHtml,
          rawBodyHtml: result.rawBodyHtml,
          usedModel: result.usedModel,
          title: 'IELTS Reading Mock Test'
        });
        showToast?.('Đã chuyển đổi ảnh chụp sang bản in Cambridge A4 thành công!');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể xử lý ảnh chụp đề thi. Vui lòng kiểm tra lại ảnh.');
    } finally {
      setExtracting(false);
    }
  };

  const appendImageFiles = async (fileList, setter) => {
    const files = Array.from(fileList || [])
      .filter(f => f.type?.startsWith('image/'))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }));
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

  const moveQuestionImage = (idx, dir) => {
    setQuestionImages(prev => {
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
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

  const handleSelectReadingPdf = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name?.toLowerCase().endsWith('.pdf')) {
      setReadingPdfFile(null);
      setErrorMsg('Chỉ hỗ trợ file .pdf cho chức năng tạo toàn bộ đề Reading.');
      return;
    }
    if (file.size > MAX_READING_PDF_BYTES) {
      setReadingPdfFile(null);
      setErrorMsg(`PDF quá lớn (${formatFileSize(file.size)}). Hãy dùng file nhỏ hơn 14 MB.`);
      return;
    }
    setErrorMsg('');
    setLastResultInfo(null);
    setReadingPdfFile(file);
  };

  const handleSelectPdfAnswerKeyFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setErrorMsg('');

    const pdfCandidate = files.find(f => f.name?.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    if (pdfCandidate) {
      if (pdfCandidate.size > MAX_READING_PDF_BYTES) {
        setErrorMsg(`File PDF đáp án quá lớn (${formatFileSize(pdfCandidate.size)}). Hãy dùng file nhỏ hơn 14 MB.`);
      } else {
        setPdfAnswerKeyPdfFile(pdfCandidate);
        showToast?.(`Đã đính kèm PDF đáp án: ${pdfCandidate.name}`, 'info');
      }
    }

    const imageFiles = files.filter(f => f.type?.startsWith('image/'));
    if (imageFiles.length > 0) {
      await appendImageFiles(imageFiles, setPdfAnswerKeyImages);
    }

    const textFile = files.find(f => /\.(txt|csv|tsv)$/i.test(f.name || ''));
    if (textFile) {
      try {
        const txt = await textFile.text();
        if (txt.trim()) {
          setPdfAnswerKeyText(prev => (prev.trim() ? `${prev.trim()}\n${txt.trim()}` : txt.trim()));
          showToast?.(`Đã nạp nội dung đáp án từ ${textFile.name}!`, 'info');
        }
      } catch (_err) {}
    }
  };

  const handleApplyPdfAnswerKeyNow = async () => {
    setErrorMsg('');
    const hasText = Boolean(pdfAnswerKeyText.trim());
    const hasImages = pdfAnswerKeyImages.length > 0;
    const hasPdf = Boolean(pdfAnswerKeyPdfFile);

    if (!hasText && !hasImages && !hasPdf) {
      setErrorMsg('Hãy dán danh sách đáp án (từ Excel/Text), dán ảnh (Ctrl+V), hoặc tải file Ảnh/PDF bảng đáp án trước.');
      return;
    }

    if (hasText && !hasImages && !hasPdf) {
      onApplyQuickAnswerText?.(pdfAnswerKeyText, { allScopes: true });
      return;
    }

    if (!hasGeminiAccess) {
      if (hasText) {
        onApplyQuickAnswerText?.(pdfAnswerKeyText, { allScopes: true });
        return;
      }
      setErrorMsg('Chưa cấu hình Google Gemini API Key để AI đọc ảnh/PDF bảng đáp án. Bạn vẫn có thể copy–paste text trực tiếp từ Excel!');
      return;
    }

    setExtractingAnswerKeyOnly(true);
    try {
      const docs = [];
      if (pdfAnswerKeyPdfFile) {
        const sig = new TextDecoder().decode(await pdfAnswerKeyPdfFile.slice(0, 5).arrayBuffer());
        if (sig !== '%PDF-') throw new Error('File PDF đáp án không hợp lệ.');
        docs.push(await readFileAsDataUrl(pdfAnswerKeyPdfFile));
      }
      const parsedKey = await extractAnswerKeyFromMedia({
        apiKey: aiApiKey,
        images: pdfAnswerKeyImages.map(i => i.dataUrl),
        documents: docs,
        extraText: pdfAnswerKeyText
      });
      const combinedText = pdfAnswerKeyText.trim()
        ? `${parsedKey.keyText}\n${pdfAnswerKeyText.trim()}`
        : parsedKey.keyText;
      setPdfAnswerKeyText(parsedKey.keyText);
      onApplyQuickAnswerText?.(combinedText, { allScopes: true });
      showToast?.(`AI đã đọc ${parsedKey.count} đáp án từ ảnh/PDF và tự động điền vào đề!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đọc bảng đáp án từ ảnh/PDF. Hãy thử ảnh rõ nét hơn hoặc copy–paste từ Excel.');
    } finally {
      setExtractingAnswerKeyOnly(false);
    }
  };

  const handleRunReadingPdfExtract = async () => {
    setErrorMsg('');
    setLastResultInfo(null);
    if (!hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước để dùng AI đọc PDF.');
      return;
    }
    if (!readingPdfFile) {
      setErrorMsg('Hãy chọn một file PDF đề Reading trước khi chạy AI.');
      return;
    }

    setExtracting(true);
    try {
      const signature = new TextDecoder().decode(await readingPdfFile.slice(0, 5).arrayBuffer());
      if (signature !== '%PDF-') throw new Error('File đã chọn không phải PDF hợp lệ. Hãy chọn lại đề thi.');
      let answerKeyPdfDataUrl = '';
      if (pdfAnswerKeyPdfFile) {
        const keySig = new TextDecoder().decode(await pdfAnswerKeyPdfFile.slice(0, 5).arrayBuffer());
        if (keySig !== '%PDF-') throw new Error('File PDF bảng đáp án không hợp lệ.');
        answerKeyPdfDataUrl = await readFileAsDataUrl(pdfAnswerKeyPdfFile);
      }
      const extracted = await extractReadingExamFromPdf({
        apiKey: aiApiKey,
        pdfDataUrl: await readFileAsDataUrl(readingPdfFile),
        fileName: readingPdfFile.name,
        answerKeyImages: pdfAnswerKeyImages.map(i => i.dataUrl),
        answerKeyPdfDataUrl,
        answerKeyText: pdfAnswerKeyText,
        extraInstructions
      });
      const summary = onApplyReadingPdfExtraction?.(extracted, { replaceAll: replaceWholeReading });
      if (summary?.cancelled) return;
      setLastResultInfo({
        usedModel: extracted.usedModel,
        questionCount: summary?.questionCount ?? extracted.questionCount,
        passageCount: summary?.passageCount ?? extracted.passages.length,
        answerKeyFound: extracted.answerKeyFound,
        warnings: Array.isArray(extracted.warnings) ? extracted.warnings : []
      });
      showToast?.(`AI đã tạo ${summary?.passageCount ?? extracted.passages.length} passage với ${summary?.questionCount ?? extracted.questionCount} câu từ PDF!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể phân tích PDF. Hãy kiểm tra file rồi thử lại.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSelectListeningPdf = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name?.toLowerCase().endsWith('.pdf')) {
      setListeningPdfFile(null);
      setErrorMsg('Chỉ hỗ trợ file .pdf cho chức năng tạo đề Listening từ PDF.');
      return;
    }
    if (file.size > MAX_READING_PDF_BYTES) {
      setListeningPdfFile(null);
      setErrorMsg(`PDF quá lớn (${formatFileSize(file.size)}). Hãy dùng file nhỏ hơn 14 MB.`);
      return;
    }
    setErrorMsg('');
    setLastResultInfo(null);
    setListeningPdfFile(file);
  };

  const handleRunListeningPdfExtract = async () => {
    setErrorMsg('');
    setLastResultInfo(null);
    if (!hasGeminiAccess) {
      setErrorMsg('Chưa cấu hình Google Gemini API Key. Hãy nhập API Key trước để dùng AI đọc PDF.');
      return;
    }
    if (!listeningPdfFile) {
      setErrorMsg('Hãy chọn một file PDF đề Listening trước khi chạy AI.');
      return;
    }

    setExtracting(true);
    try {
      const signature = new TextDecoder().decode(await listeningPdfFile.slice(0, 5).arrayBuffer());
      if (signature !== '%PDF-') throw new Error('File đã chọn không phải PDF hợp lệ. Hãy chọn lại đề thi.');
      let answerKeyPdfDataUrl = '';
      if (pdfAnswerKeyPdfFile) {
        const keySig = new TextDecoder().decode(await pdfAnswerKeyPdfFile.slice(0, 5).arrayBuffer());
        if (keySig !== '%PDF-') throw new Error('File PDF bảng đáp án không hợp lệ.');
        answerKeyPdfDataUrl = await readFileAsDataUrl(pdfAnswerKeyPdfFile);
      }
      const extracted = await extractListeningExamFromPdf({
        apiKey: aiApiKey,
        pdfDataUrl: await readFileAsDataUrl(listeningPdfFile),
        fileName: listeningPdfFile.name,
        answerKeyImages: pdfAnswerKeyImages.map(i => i.dataUrl),
        answerKeyPdfDataUrl,
        answerKeyText: pdfAnswerKeyText,
        extraInstructions
      });
      const summary = onApplyListeningPdfExtraction?.(extracted, { replaceAll: replaceWholeListening });
      if (summary?.cancelled) return;
      setLastResultInfo({
        usedModel: extracted.usedModel,
        questionCount: summary?.questionCount ?? extracted.questionCount,
        partCount: summary?.partCount ?? extracted.parts.length,
        answerKeyFound: extracted.answerKeyFound,
        warnings: Array.isArray(extracted.warnings) ? extracted.warnings : []
      });
      showToast?.(`AI đã tạo ${summary?.partCount ?? extracted.parts.length} Part với ${summary?.questionCount ?? extracted.questionCount} câu Listening từ PDF!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể phân tích PDF Listening. Hãy kiểm tra file rồi thử lại.');
    } finally {
      setExtracting(false);
    }
  };

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
            <span>Tạo Đề Tự Động Từ Ảnh / PDF ({scopeLabel})</span>
          </h3>
          <p className="text-xs text-[#314158] dark:text-slate-300 mt-0.5">
            {skill === 'reading'
              ? <>Tải ảnh chụp, dán ảnh bằng <strong>Ctrl+V</strong>, hoặc đưa nguyên file PDF để AI đọc nhiều passage và answer key.</>
              : <>Tải nguyên file <strong>PDF đề Listening (1–4 Parts + Answer Key)</strong>, tải ảnh chụp, hoặc nhấn <strong>Ctrl+V</strong> dán ảnh đề Cambridge/IDP (Note/Table/Flow-chart, MCQ, Map...). AI tự tạo đục lỗ <code>{'{{1}}'}</code> &amp; danh sách câu hỏi ngay.</>}
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

      {skill === 'listening' && onApplyListeningPdfExtraction && (
        <section className="rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50/75 dark:bg-sky-500/10 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-200/60 dark:border-sky-500/20 pb-3">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-sky-950 dark:text-sky-100">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                <span>Tạo Đề Listening Tự Động Từ File PDF + Bảng Đáp Án (1–4 Parts · 10–40 Câu)</span>
              </h4>
              <p className="mt-0.5 text-xs text-sky-900/80 dark:text-sky-200/80">
                Bỏ file PDF đề thi bên trái và ảnh chụp / file PDF / bảng đáp án copy từ Excel ở ô bên phải — AI tự ghép đáp án chính xác vào đủ 40 câu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Left box: Exam PDF */}
            <div className="rounded-xl border border-sky-200/90 dark:border-sky-500/30 bg-white dark:bg-slate-900/90 p-3.5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    1. File PDF Đề Listening
                  </span>
                  {listeningPdfFile && (
                    <button
                      type="button"
                      onClick={() => setListeningPdfFile(null)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Gỡ file
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="cursor-pointer inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{listeningPdfFile ? 'Chọn PDF khác' : 'Chọn đề PDF Listening'}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleSelectListeningPdf}
                      className="sr-only"
                      aria-label="Chọn PDF đề IELTS Listening"
                    />
                  </label>
                  <div className="min-w-0 flex-1" aria-live="polite">
                    {listeningPdfFile ? (
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100" title={listeningPdfFile.name}>
                        {listeningPdfFile.name}{' '}
                        <span className="font-medium text-slate-500 dark:text-slate-400">· {formatFileSize(listeningPdfFile.size)}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300">PDF 1 Part lẻ hoặc Full 4 Parts (tối đa 14 MB).</p>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={replaceWholeListening}
                  onChange={e => setReplaceWholeListening(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-blue-600"
                />
                <span>Thay toàn bộ câu hỏi hiện có bằng đề trong PDF (vẫn giữ file MP3 đã tải lên của từng Part)</span>
              </label>
            </div>

            {/* Right box: Side-by-side Answer Key uploader (Image / PDF / Copy-Paste Excel) */}
            <div
              tabIndex={0}
              onPaste={e => handlePasteZone(e, setPdfAnswerKeyImages)}
              className="rounded-xl border border-emerald-200/90 dark:border-emerald-500/30 bg-white dark:bg-slate-900/90 p-3.5 space-y-2.5 focus:outline-none focus:ring-2 focus:ring-[#059271]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#059271] dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  2. Bảng Đáp Án (Ảnh / PDF / Copy từ Excel)
                </span>
                {(pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile || pdfAnswerKeyText.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfAnswerKeyImages([]);
                      setPdfAnswerKeyPdfFile(null);
                      setPdfAnswerKeyText('');
                    }}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#ECFDF5] dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-[#059271] dark:text-emerald-300 border border-[#9FF5E1] dark:border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    Tải Ảnh / PDF Đáp Án
                    {pdfAnswerKeyImages.length + (pdfAnswerKeyPdfFile ? 1 : 0) > 0
                      ? ` (${pdfAnswerKeyImages.length + (pdfAnswerKeyPdfFile ? 1 : 0)})`
                      : ''}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf,.txt,.csv,.tsv"
                    multiple
                    onChange={handleSelectPdfAnswerKeyFiles}
                    className="sr-only"
                    aria-label="Tải ảnh hoặc PDF bảng đáp án Listening"
                  />
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  hoặc bấm ô này rồi <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">Ctrl+V</kbd> dán ảnh Excel
                </span>
              </div>

              {(pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile) && (
                <div className="flex flex-wrap items-center gap-2">
                  {pdfAnswerKeyPdfFile && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="max-w-[150px] truncate">{pdfAnswerKeyPdfFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setPdfAnswerKeyPdfFile(null)}
                        className="text-rose-600 dark:text-rose-400 hover:opacity-80"
                        title="Gỡ PDF đáp án"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {pdfAnswerKeyImages.map((img, idx) => (
                    <div key={img.id} className="relative w-14 h-11 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-600">
                      <img src={img.dataUrl} alt={`Đáp án ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPdfAnswerKeyImages(prev => prev.filter(p => p.id !== img.id))}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                        title="Gỡ ảnh đáp án"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-start">
                <textarea
                  rows={2}
                  value={pdfAnswerKeyText}
                  onChange={e => setPdfAnswerKeyText(e.target.value)}
                  placeholder={'Copy thẳng cột đáp án từ Excel hoặc gõ:\n1. THREE HOURS\n11. B\n15. I'}
                  aria-label="Nhập hoặc dán bảng đáp án Listening"
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#059271] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={extractingAnswerKeyOnly || extracting || (!pdfAnswerKeyText.trim() && pdfAnswerKeyImages.length === 0 && !pdfAnswerKeyPdfFile)}
                  onClick={handleApplyPdfAnswerKeyNow}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition shrink-0 inline-flex items-center gap-1.5 ${
                    extractingAnswerKeyOnly || extracting || (!pdfAnswerKeyText.trim() && pdfAnswerKeyImages.length === 0 && !pdfAnswerKeyPdfFile)
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-[#059271] hover:bg-emerald-700 text-white'
                  }`}
                  title="Tự động điền đáp án vào toàn bộ 1–40 câu hỏi đã có sẵn trong đề"
                >
                  {extractingAnswerKeyOnly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{extractingAnswerKeyOnly ? 'Đang đọc...' : 'Điền Key (1–40)'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[11px] font-semibold text-sky-900/80 dark:text-sky-200/80">
              {pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile || pdfAnswerKeyText.trim()
                ? '✅ Đã có bảng đáp án đính kèm — AI sẽ tự động ghép đáp án vào đủ các câu MCQ / Map / Flow-chart / Điền từ.'
                : 'Mẹo: Nếu file PDF chưa có trang Answer Key, hãy dán ảnh Excel hoặc copy danh sách đáp án ở ô bên phải.'}
            </span>
            <button
              type="button"
              disabled={!listeningPdfFile || extracting}
              onClick={handleRunListeningPdfExtract}
              className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                !listeningPdfFile || extracting
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-[#007A7A] text-white hover:bg-[#065B5B]'
              }`}
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-amber-300" />}
              {extracting ? 'AI đang đọc PDF Listening & ghép đáp án…' : 'AI đọc PDF & tạo đề'}
            </button>
          </div>
        </section>
      )}

      {skill === 'reading' && onApplyReadingPdfExtraction && (
        <section className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-500/10 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-200/60 dark:border-indigo-500/20 pb-3">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-indigo-950 dark:text-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                <span>Tạo Toàn Bộ Đề Reading (3 Passages + 40 Câu) + Bảng Đáp Án</span>
              </h4>
              <p className="mt-0.5 text-xs text-indigo-900/80 dark:text-indigo-200/80">
                Hỗ trợ tải file PDF đề thi kèm ảnh/PDF/Excel bảng đáp án bên cạnh, hoặc ghép ảnh chụp web cuộn 2 cột thành PDF chuẩn Cambridge.
              </p>
            </div>

            <div className="flex items-center bg-white/80 dark:bg-slate-800 rounded-xl p-1 border border-indigo-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setReadingSourceTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  readingSourceTab === 'pdf'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>File PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setReadingSourceTab('screenshots')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  readingSourceTab === 'screenshots'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ghép Ảnh Web ➜ PDF / Đề</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-900 font-black">Mới</span>
              </button>
            </div>
          </div>

          {readingSourceTab === 'pdf' ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* Left box: Reading Exam PDF */}
                <div className="rounded-xl border border-indigo-200/90 dark:border-indigo-500/30 bg-white dark:bg-slate-900/90 p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        1. File PDF Đề Reading
                      </span>
                      {readingPdfFile && (
                        <button
                          type="button"
                          onClick={() => setReadingPdfFile(null)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          Gỡ file
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="cursor-pointer inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{readingPdfFile ? 'Chọn PDF khác' : 'Chọn đề PDF Reading'}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleSelectReadingPdf}
                          className="sr-only"
                          aria-label="Chọn PDF đề IELTS Reading"
                        />
                      </label>
                      <div className="min-w-0 flex-1" aria-live="polite">
                        {readingPdfFile ? (
                          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100" title={readingPdfFile.name}>
                            {readingPdfFile.name}{' '}
                            <span className="font-medium text-slate-500 dark:text-slate-400">· {formatFileSize(readingPdfFile.size)}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600 dark:text-slate-300">PDF 1–3 Passages + câu hỏi (tối đa 14 MB).</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={replaceWholeReading}
                      onChange={e => setReplaceWholeReading(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
                    />
                    <span>Thay toàn bộ Reading hiện có bằng đề trong PDF</span>
                  </label>
                </div>

                {/* Right box: Side-by-side Answer Key uploader */}
                <div
                  tabIndex={0}
                  onPaste={e => handlePasteZone(e, setPdfAnswerKeyImages)}
                  className="rounded-xl border border-emerald-200/90 dark:border-emerald-500/30 bg-white dark:bg-slate-900/90 p-3.5 space-y-2.5 focus:outline-none focus:ring-2 focus:ring-[#059271]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#059271] dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      2. Bảng Đáp Án (Ảnh / PDF / Copy từ Excel)
                    </span>
                    {(pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile || pdfAnswerKeyText.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfAnswerKeyImages([]);
                          setPdfAnswerKeyPdfFile(null);
                          setPdfAnswerKeyText('');
                        }}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#ECFDF5] dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-[#059271] dark:text-emerald-300 border border-[#9FF5E1] dark:border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        Tải Ảnh / PDF Đáp Án
                        {pdfAnswerKeyImages.length + (pdfAnswerKeyPdfFile ? 1 : 0) > 0
                          ? ` (${pdfAnswerKeyImages.length + (pdfAnswerKeyPdfFile ? 1 : 0)})`
                          : ''}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf,.pdf,.txt,.csv,.tsv"
                        multiple
                        onChange={handleSelectPdfAnswerKeyFiles}
                        className="sr-only"
                        aria-label="Tải ảnh hoặc PDF bảng đáp án Reading"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      hoặc bấm ô này rồi <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[10px]">Ctrl+V</kbd> dán ảnh Excel
                    </span>
                  </div>

                  {(pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {pdfAnswerKeyPdfFile && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">{pdfAnswerKeyPdfFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setPdfAnswerKeyPdfFile(null)}
                            className="text-rose-600 dark:text-rose-400 hover:opacity-80"
                            title="Gỡ PDF đáp án"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {pdfAnswerKeyImages.map((img, idx) => (
                        <div key={img.id} className="relative w-14 h-11 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-600">
                          <img src={img.dataUrl} alt={`Đáp án ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPdfAnswerKeyImages(prev => prev.filter(p => p.id !== img.id))}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white"
                            title="Gỡ ảnh đáp án"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-start">
                    <textarea
                      rows={2}
                      value={pdfAnswerKeyText}
                      onChange={e => setPdfAnswerKeyText(e.target.value)}
                      placeholder={'Copy thẳng cột đáp án từ Excel hoặc gõ:\n1. TRUE\n2. FALSE\n3. NOT GIVEN'}
                      aria-label="Nhập hoặc dán bảng đáp án Reading"
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#059271] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={extractingAnswerKeyOnly || extracting || (!pdfAnswerKeyText.trim() && pdfAnswerKeyImages.length === 0 && !pdfAnswerKeyPdfFile)}
                      onClick={handleApplyPdfAnswerKeyNow}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition shrink-0 inline-flex items-center gap-1.5 ${
                        extractingAnswerKeyOnly || extracting || (!pdfAnswerKeyText.trim() && pdfAnswerKeyImages.length === 0 && !pdfAnswerKeyPdfFile)
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-[#059271] hover:bg-emerald-700 text-white'
                      }`}
                      title="Tự động điền đáp án vào toàn bộ 1–40 câu hỏi đã có sẵn trong đề"
                    >
                      {extractingAnswerKeyOnly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{extractingAnswerKeyOnly ? 'Đang đọc...' : 'Điền Key (1–40)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[11px] font-semibold text-indigo-900/80 dark:text-indigo-200/80">
                  {pdfAnswerKeyImages.length > 0 || pdfAnswerKeyPdfFile || pdfAnswerKeyText.trim()
                    ? '✅ Đã có bảng đáp án đính kèm — AI sẽ tự động ghép đáp án chuẩn xác vào đủ 1–40 câu.'
                    : 'Mẹo: Nếu PDF chưa kèm Answer Key, dán ảnh/PDF đáp án hoặc copy danh sách đáp án ở ô bên phải.'}
                </span>
                <button
                  type="button"
                  disabled={!readingPdfFile || extracting}
                  onClick={handleRunReadingPdfExtract}
                  className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold transition shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    !readingPdfFile || extracting
                      ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      : 'bg-[#007A7A] text-white hover:bg-[#065B5B]'
                  }`}
                >
                  {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-amber-300" />}
                  {extracting ? 'AI đang đọc toàn bộ PDF & ghép đáp án…' : 'AI đọc PDF & tạo đề'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div
                tabIndex={0}
                onPaste={e => handlePasteZone(e, setScreenshotFiles)}
                className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 p-4 space-y-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-100">
                      Tập ảnh chụp màn hình ({screenshotFiles.length} ảnh)
                    </span>
                  </div>
                  {screenshotFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setScreenshotFiles([])}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Xóa tất cả ảnh
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono text-[11px]">Ctrl+V</kbd> để dán ảnh chụp từ bộ nhớ đệm, hoặc tải lên toàn bộ ảnh chụp đề thi theo thứ tự từ trên xuống dưới. AI sẽ tự phát hiện đoạn cuộn trùng lặp để khử bỏ.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn nhiều ảnh chụp màn hình</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        appendImageFiles(e.target.files, setScreenshotFiles);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Hỗ trợ PNG, JPG, WebP. Tự động nén thông minh giữ độ sắc nét chữ.
                  </span>
                </div>

                {screenshotFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto">
                    {screenshotFiles.map((item, index) => (
                      <div
                        key={item.id}
                        className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-video flex items-center justify-center"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/75 text-white font-mono text-[10px] font-bold">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setScreenshotFiles(prev => prev.filter(f => f.id !== item.id))}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition shadow-xs"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApplyScreenshots}
                      onChange={e => setAutoApplyScreenshots(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span>Tự động nạp đề vào hệ thống (Tạo đủ 3 Passages &amp; câu hỏi)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceWholeReading}
                      onChange={e => setReplaceWholeReading(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span>Thay thế toàn bộ Reading hiện tại</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={screenshotFiles.length === 0 || extracting}
                    onClick={() => handleRunScreenshotsConversion(false)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 ${
                      screenshotFiles.length === 0 || extracting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Chỉ xuất bản in Cambridge</span>
                  </button>

                  <button
                    type="button"
                    disabled={screenshotFiles.length === 0 || extracting}
                    onClick={() => handleRunScreenshotsConversion(true)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white transition shadow-sm ${
                      screenshotFiles.length === 0 || extracting
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    <span>{extracting ? 'AI Đang Ghép Ảnh & Tạo Đề…' : 'AI Ghép Ảnh ➜ Xuất PDF & Tạo Đề'}</span>
                  </button>
                </div>
              </div>

              {cambridgeHtmlResult && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Đã tạo bản in Cambridge A4 hoàn chỉnh</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                          {cambridgeHtmlResult.usedModel}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cambridgeHtmlResult.passageCount
                          ? `${cambridgeHtmlResult.passageCount} Passages · ${cambridgeHtmlResult.questionCount} Câu hỏi`
                          : 'Bản in đã sẵn sàng để xuất PDF hoặc tải về'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintCambridgeHtml(cambridgeHtmlResult.fullHtml)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#007A7A] hover:bg-[#065B5B] text-white transition shadow-xs"
                      title="Mở hộp thoại in trình duyệt và chọn Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In / Xuất PDF (A4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadCambridgeHtml(cambridgeHtmlResult.fullHtml)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                      title="Tải file .html về máy"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải HTML</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHtmlPreviewModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition"
                      title="Xem trước định dạng bản in"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Trước</span>
                    </button>
                    {cambridgeHtmlResult.extracted && (
                      <button
                        type="button"
                        onClick={() => {
                          const summary = onApplyReadingPdfExtraction(cambridgeHtmlResult.extracted, { replaceAll: replaceWholeReading });
                          if (!summary?.cancelled) {
                            showToast?.(`Đã nạp lại ${summary?.passageCount ?? cambridgeHtmlResult.passageCount} passage vào đề thi!`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Nạp Vào Đề</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

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
                  <span className="absolute bottom-1 left-1 text-xs font-bold bg-black/75 text-white px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  {questionImages.length > 1 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveQuestionImage(idx, -1)}
                        className="px-1.5 py-0.5 rounded bg-black/75 hover:bg-black text-white text-[10px] font-black disabled:opacity-30"
                        title="Đưa ảnh này lên trước"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={idx === questionImages.length - 1}
                        onClick={() => moveQuestionImage(idx, 1)}
                        className="px-1.5 py-0.5 rounded bg-black/75 hover:bg-black text-white text-[10px] font-black disabled:opacity-30"
                        title="Đưa ảnh này ra sau"
                      >
                        →
                      </button>
                    </div>
                  )}
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
              {lastResultInfo.partCount
                ? <>Đã tạo <strong>{lastResultInfo.partCount} Part · {lastResultInfo.questionCount} câu hỏi Listening</strong> từ PDF{lastResultInfo.answerKeyFound ? ' và đã đọc answer key' : ''}</>
                : lastResultInfo.passageCount
                ? <>Đã tạo <strong>{lastResultInfo.passageCount} passage · {lastResultInfo.questionCount} câu hỏi</strong> từ PDF{lastResultInfo.answerKeyFound ? ' và đã đọc answer key' : ''}</>
                : <>Đã tự động tạo <strong>{lastResultInfo.questionCount} câu hỏi</strong></>}
              {lastResultInfo.hasCloze ? ' kèm bài Đục lỗ trực tiếp' : ''}
              {lastResultInfo.hasPassage ? ' kèm văn bản Bài đọc' : ''} (Model: <code>{lastResultInfo.usedModel}</code>). Kiểm tra lại danh sách bên dưới rồi bấm Lưu Đề Thi!
            </span>
          </div>
          {lastResultInfo.warnings?.length > 0 && (
            <div className="w-full mt-1 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 font-medium">
              <p className="font-bold mb-1">Đã tự sửa số thứ tự câu hỏi — hãy rà lại:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {lastResultInfo.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {showHtmlPreviewModal && cambridgeHtmlResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Bản In Chuẩn Cambridge A4 (IELTS Reading)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Định dạng trang chuẩn A4 in ấn, tự ngắt trang theo từng Passage, giữ nguyên highlight vàng và hộp từ.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintCambridgeHtml(cambridgeHtmlResult.fullHtml)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#007A7A] hover:bg-[#065B5B] text-white transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Lưu PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCambridgeHtml(cambridgeHtmlResult.fullHtml)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHtmlPreviewModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                  title="Đóng xem trước"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 min-h-[500px] bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-auto">
              <iframe
                title="Cambridge Exam A4 Preview"
                srcDoc={cambridgeHtmlResult.fullHtml}
                className="w-full h-full min-h-[550px] bg-white rounded-xl shadow-md border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
