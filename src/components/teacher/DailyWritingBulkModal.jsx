import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCopy,
  ClipboardPaste,
  Clock,
  Edit,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  History,
  Image as ImageIcon,
  Key,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap
} from 'lucide-react';
import {
  DAILY_WRITING_T1_SUBCATEGORIES,
  DAILY_WRITING_T2_QUESTION_TYPES,
  DAILY_WRITING_T2_TOPICS,
  getDailySubCategoryLabel
} from '../../constants/seedData';
import { readFileAsDataUrl } from '../../utils/pdfImageCropper';
import { unpackUploadedWritingFiles } from '../../utils/wordImportHelpers';
import {
  appendBulkWritingImportHistory,
  buildDailyTask1TestObjects,
  buildDailyTask2TestObjects,
  clearBulkWritingImportHistory,
  deleteBulkWritingImportHistoryEntry,
  detectTestImportIssue,
  loadBulkWritingImportHistory,
  runBulkTask1AiPipeline,
  runBulkTask2AiPipeline
} from '../../utils/dailyWritingBulkAi';
import ListPaginationBar, { paginateItems } from '../common/ListPaginationBar';

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DailyWritingBulkModal({
  isOpen = false,
  initialMode = 'task2', // 'task1' | 'task2'
  initialTask1SubCategory = 'w1_dynamic',
  initialShowHistory = false,
  aiApiKey = '',
  aiConfigured = false,
  tests = [],
  onClose,
  onBulkSaveTests,
  onOpenTestForEdit = null,
  setApiTestState,
  setShowApiKeyModal,
  showToast
}) {
  const [mode, setMode] = useState(initialMode === 'task1' ? 'task1' : 'task2');
  const [t1SubCategory, setT1SubCategory] = useState(initialTask1SubCategory || 'w1_dynamic');
  const [showHistoryPanel, setShowHistoryPanel] = useState(Boolean(initialShowHistory));
  const [importHistory, setImportHistory] = useState(() => loadBulkWritingImportHistory());
  const [t1OnlyWarnings, setT1OnlyWarnings] = useState(false);

  // Task 1 inputs & drafts
  const [t1DocxItems, setT1DocxItems] = useState([]); // extracted .docx objects (from direct .docx, .zip or folder)
  const [t1Images, setT1Images] = useState([]); // { id, name, size, dataUrl, inferredSubCategory? }
  const [t1PdfFiles, setT1PdfFiles] = useState([]); // File[]
  const [t1DetectedFolders, setT1DetectedFolders] = useState([]); // e.g. ['w1_dynamic', 'w1_map']
  const [t1UseAiForDocx, setT1UseAiForDocx] = useState(true);
  const [t1Unpacking, setT1Unpacking] = useState(false);
  const [t1Drafts, setT1Drafts] = useState([]);
  const [t1Page, setT1Page] = useState(1);
  const t1FolderInputRef = useRef(null);

  // Task 2 inputs & drafts
  const [t2DocxItems, setT2DocxItems] = useState([]); // extracted .docx objects
  const [t2PdfFiles, setT2PdfFiles] = useState([]); // File[]
  const [t2RawText, setT2RawText] = useState('');
  const [t2UseAi, setT2UseAi] = useState(true);
  const [t2Drafts, setT2Drafts] = useState([]);
  const [t2Search, setT2Search] = useState('');
  const [t2TopicFilter, setT2TopicFilter] = useState('all');
  const [t2TypeFilter, setT2TypeFilter] = useState('all');
  const [t2Page, setT2Page] = useState(1);

  // Shared execution state
  const [hashtagsInput, setHashtagsInput] = useState('#ThiThật, #DailyZone');
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ phase: '', done: 0, total: 0, message: '' });
  const [warnings, setWarnings] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [usedModelLabel, setUsedModelLabel] = useState('');
  const abortRef = useRef(null);

  const hasGeminiAccess = Boolean(String(aiApiKey || '').trim() || aiConfigured);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode === 'task1' ? 'task1' : 'task2');
    if (initialTask1SubCategory) {
      setT1SubCategory(initialTask1SubCategory);
    }
    setImportHistory(loadBulkWritingImportHistory());
    setShowHistoryPanel(Boolean(initialShowHistory));
    setT1OnlyWarnings(false);
    setErrorMsg('');
  }, [isOpen, initialMode, initialTask1SubCategory, initialShowHistory]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    if (running) {
      abortRef.current?.abort();
    }
    onClose?.();
  };

  // ==========================================
  // TASK 1 FILE HANDLERS (WORD .DOCX / GOOGLE DRIVE .ZIP / FOLDER / IMAGES / PDF)
  // ==========================================
  const appendTask1Images = async (fileList) => {
    const imgFiles = Array.from(fileList || []).filter(
      f => f.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name || '')
    );
    if (imgFiles.length === 0) return;
    setErrorMsg('');
    try {
      const loaded = await Promise.all(
        imgFiles.map(async (f, idx) => ({
          id: `img_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          name: f.name || `task1-chart-${idx + 1}.png`,
          size: f.size || 0,
          dataUrl: await readFileAsDataUrl(f),
          inferredSubCategory: f._inferredSubCategory || ''
        }))
      );
      setT1Images(prev => [...prev, ...loaded]);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đọc file hình ảnh Task 1.');
    }
  };

  const handleSelectTask1Files = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setErrorMsg('');
    setT1Unpacking(true);

    try {
      const unpacked = await unpackUploadedWritingFiles(files, {
        onProgress: msg => setProgress({ phase: 'unpack', done: 1, total: 2, message: msg })
      });

      if (unpacked.docxItems.length > 0) {
        setT1DocxItems(prev => [...prev, ...unpacked.docxItems]);
      }
      if (unpacked.pdfFiles.length > 0) {
        setT1PdfFiles(prev => [...prev, ...unpacked.pdfFiles]);
      }
      if (unpacked.imageFiles.length > 0) {
        await appendTask1Images(unpacked.imageFiles);
      }
      if (unpacked.skippedWarnings.length > 0) {
        setWarnings(prev => [...prev, ...unpacked.skippedWarnings]);
      }

      if (unpacked.detectedFolders.length > 0) {
        setT1DetectedFolders(prev => [...new Set([...prev, ...unpacked.detectedFolders])]);
        if (unpacked.detectedFolders.length >= 2) {
          setT1SubCategory('auto');
          showToast?.(
            `Đã nhận diện ${unpacked.docxItems.length + unpacked.imageFiles.length} đề từ ${unpacked.detectedFolders.length} thư mục (tự động chia đúng Map / Process / Dynamic / Static)!`,
            'info'
          );
        } else if (unpacked.detectedFolders.length === 1) {
          setT1SubCategory(unpacked.detectedFolders[0]);
        }
      } else if (unpacked.docxItems.length > 0) {
        showToast?.(`Đã nạp xong ${unpacked.docxItems.length} file Word (.docx) kèm chữ & biểu đồ!`, 'info');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể giải nén hoặc đọc danh sách file đã chọn.');
    } finally {
      setT1Unpacking(false);
    }
  };

  const handlePasteInModal = (e) => {
    if (mode !== 'task1') return;
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
      appendTask1Images(pastedImgs);
      showToast?.(`Đã dán ${pastedImgs.length} hình biểu đồ Task 1 từ Clipboard!`, 'info');
    }
  };

  // ==========================================
  // TASK 2 FILE HANDLERS (WORD .DOCX / .ZIP / 350+ PROMPTS PDF)
  // ==========================================
  const handleSelectTask2Pdfs = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setErrorMsg('');
    setT1Unpacking(true);
    try {
      const unpacked = await unpackUploadedWritingFiles(files, {
        onProgress: msg => setProgress({ phase: 'unpack', done: 1, total: 2, message: msg })
      });
      if (unpacked.docxItems.length > 0) {
        setT2DocxItems(prev => [...prev, ...unpacked.docxItems]);
        showToast?.(`Đã nạp ${unpacked.docxItems.length} file Word (.docx) đề Task 2!`, 'info');
      }
      if (unpacked.pdfFiles.length > 0) {
        setT2PdfFiles(prev => [...prev, ...unpacked.pdfFiles]);
      }
      if (unpacked.skippedWarnings.length > 0) {
        setWarnings(prev => [...prev, ...unpacked.skippedWarnings]);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể đọc file Word / PDF Task 2.');
    } finally {
      setT1Unpacking(false);
    }
  };

  // ==========================================
  // RUN AI PIPELINES
  // ==========================================
  const handleRunTask1Ai = async () => {
    if (running || t1Unpacking) return;
    setErrorMsg('');
    setWarnings([]);
    if (t1DocxItems.length === 0 && t1Images.length === 0 && t1PdfFiles.length === 0) {
      setErrorMsg('Hãy tải lên ít nhất 1 file Word (.docx), file .ZIP Google Drive, hình biểu đồ hoặc file PDF Task 1.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setProgress({
      phase: 'init',
      done: 0,
      total: t1DocxItems.length + t1Images.length + t1PdfFiles.length,
      message: 'Đang chuẩn bị dữ liệu Word / hình ảnh / PDF...'
    });

    try {
      const res = await runBulkTask1AiPipeline({
        docxItems: t1DocxItems,
        visualSources: t1Images,
        pdfFiles: t1PdfFiles,
        targetSubCategory: t1SubCategory,
        useAiForDocx: t1UseAiForDocx,
        apiKey: aiApiKey,
        aiConfigured,
        signal: controller.signal,
        onProgress: p => setProgress(p)
      });
      setT1Drafts(res.items);
      setT1Page(1);
      setWarnings(res.warnings || []);
      setUsedModelLabel(res.usedModel || '');
      showToast?.(`Đã soạn xong ${res.items.length} đề Writing Task 1!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể xử lý hàng loạt đề Task 1.');
    } finally {
      setRunning(false);
    }
  };

  const handleRunTask2Ai = async () => {
    if (running || t1Unpacking) return;
    setErrorMsg('');
    setWarnings([]);
    if (t2DocxItems.length === 0 && t2PdfFiles.length === 0 && !t2RawText.trim()) {
      setErrorMsg('Hãy chọn file Word (.docx), file .ZIP, file PDF bộ câu hỏi Task 2 hoặc dán danh sách đề vào ô văn bản.');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setProgress({ phase: 'init', done: 0, total: 1, message: 'Đang quét file Word / PDF & tách danh sách đề Task 2...' });

    try {
      const res = await runBulkTask2AiPipeline({
        docxItems: t2DocxItems,
        pdfFiles: t2PdfFiles,
        rawPastedText: t2RawText,
        apiKey: aiApiKey,
        aiConfigured,
        useAi: t2UseAi,
        signal: controller.signal,
        onProgress: p => setProgress(p)
      });
      setT2Drafts(res.items);
      setT2Page(1);
      setT2TopicFilter('all');
      setT2TypeFilter('all');
      setT2Search('');
      setWarnings(res.warnings || []);
      setUsedModelLabel(res.usedModel || '');
      showToast?.(`AI đã phân loại & đặt tên danh từ xong cho ${res.items.length} đề Task 2!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Không thể xử lý hàng loạt đề Task 2.');
    } finally {
      setRunning(false);
    }
  };

  // ==========================================
  // BULK SAVE TO DAILY ZONE
  // ==========================================
  const handleConfirmSaveTask1 = async () => {
    const selectedItems = t1Drafts.filter(d => d.selected !== false && String(d.prompt || '').trim());
    if (selectedItems.length === 0) {
      setErrorMsg('Chưa có đề Task 1 nào được chọn để đăng.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const builtTests = buildDailyTask1TestObjects(selectedItems, {
        hashtags: hashtagsInput
      });
      const folderLabel =
        t1SubCategory !== 'auto'
          ? `Daily Writing Task 1 (${getDailySubCategoryLabel(t1SubCategory) || t1SubCategory})`
          : 'Daily Writing Task 1 (W1)';
      await onBulkSaveTests?.(builtTests, { summaryLabel: folderLabel, notify: true });
      const warningItems = builtTests
        .filter(t => Boolean(t.importWarning))
        .map(t => ({
          testId: t.id,
          title: t.title,
          sourceLabel: t.importSourceFile || t.title,
          reason: t.importWarning,
          subCategory: t.dailySubCategory
        }));
      const nextHistory = appendBulkWritingImportHistory({
        mode: 'task1',
        summaryLabel: folderLabel,
        totalSaved: builtTests.length,
        warningItems,
        generalWarnings: warnings.filter(w => !warningItems.some(wi => w.includes(wi.sourceLabel)))
      });
      setImportHistory(nextHistory);
      showToast?.(
        warningItems.length > 0
          ? `Đã đăng ${builtTests.length} đề Task 1 (${warningItems.length} đề có cảnh báo đã được đánh dấu & lưu lịch sử để bạn sửa lại)!`
          : `Đã tạo & đăng công khai ${builtTests.length} đề Task 1 (20 phút • Làm lại nhiều lần)!`,
        warningItems.length > 0 ? 'info' : 'success'
      );
      setT1Drafts([]);
      setT1DocxItems([]);
      setT1Images([]);
      setT1PdfFiles([]);
      setT1DetectedFolders([]);
      setWarnings([]);
      onClose?.();
    } catch (err) {
      setErrorMsg(err?.message || 'Lỗi khi lưu hàng loạt đề Task 1.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSaveTask2 = async () => {
    const selectedItems = t2Drafts.filter(d => d.selected !== false && String(d.prompt || '').trim());
    if (selectedItems.length === 0) {
      setErrorMsg('Chưa có đề Task 2 nào được chọn để đăng.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const builtTests = buildDailyTask2TestObjects(selectedItems, {
        hashtags: hashtagsInput
      });
      await onBulkSaveTests?.(builtTests, {
        summaryLabel: 'Daily Writing Task 2 (W2)',
        notify: true
      });
      const nextHistory = appendBulkWritingImportHistory({
        mode: 'task2',
        summaryLabel: 'Daily Writing Task 2 (W2)',
        totalSaved: builtTests.length,
        warningItems: [],
        generalWarnings: warnings
      });
      setImportHistory(nextHistory);
      showToast?.(
        `Đã tạo & đăng công khai ${builtTests.length} đề Task 2 (40 phút • Làm lại nhiều lần)!`
      );
      setT2Drafts([]);
      setT2DocxItems([]);
      setT2PdfFiles([]);
      setT2RawText('');
      setWarnings([]);
      onClose?.();
    } catch (err) {
      setErrorMsg(err?.message || 'Lỗi khi lưu hàng loạt đề Task 2.');
    } finally {
      setSaving(false);
    }
  };

  // Change folder for all existing Task 1 drafts when teacher clicks a specific folder pill
  const handleSelectT1FolderPill = (nextFolderId) => {
    setT1SubCategory(nextFolderId);
    if (nextFolderId !== 'auto' && t1Drafts.length > 0) {
      setT1Drafts(prev => prev.map(d => ({ ...d, dailySubCategory: nextFolderId })));
    }
  };

  // Filtered & Paginated Task 2 Drafts (handles 350–1,000 items at 60 FPS)
  const filteredT2Drafts = t2Drafts.filter(item => {
    if (t2TopicFilter !== 'all' && item.writingTask2Topic !== t2TopicFilter) return false;
    if (t2TypeFilter !== 'all' && item.writingTask2QuestionType !== t2TypeFilter) return false;
    if (t2Search.trim()) {
      const q = t2Search.trim().toLowerCase();
      const hitTitle = String(item.title || '').toLowerCase().includes(q);
      const hitPrompt = String(item.prompt || '').toLowerCase().includes(q);
      const hitNum = String(item.sourceNumber || '') === q;
      if (!hitTitle && !hitPrompt && !hitNum) return false;
    }
    return true;
  });

  const t1WarningCount = t1Drafts.filter(d => Boolean(d.importWarning)).length;
  const visibleT1Drafts = t1OnlyWarnings ? t1Drafts.filter(d => Boolean(d.importWarning)) : t1Drafts;
  const paginatedT1 = paginateItems(visibleT1Drafts, t1Page, 8);
  const paginatedT2 = paginateItems(filteredT2Drafts, t2Page, 20);
  const selectedT1Count = t1Drafts.filter(d => d.selected !== false).length;
  const selectedT2Count = t2Drafts.filter(d => d.selected !== false).length;
  const totalHistoryWarnings = importHistory.reduce(
    (sum, h) => sum + (h.warningItems?.length || 0) + (h.generalWarnings?.length || 0),
    0
  );
  const liveTestById = new Map((tests || []).map(t => [t.id, t]));
  const liveBrokenWritingTests = (tests || [])
    .filter(t => t?.focusSkill === 'writing')
    .map(t => ({ test: t, issue: detectTestImportIssue(t) }))
    .filter(x => x.issue.hasIssue);
  const totalBadgeErrorCount = Math.max(liveBrokenWritingTests.length, totalHistoryWarnings);
  const progressPct = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  return (
    <div
      data-testid="daily-writing-bulk-modal"
      onPaste={handlePasteInModal}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={handleCloseModal}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-[#0F172B] dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#EDFFFD] via-white to-emerald-50/70 dark:from-slate-900 dark:via-[#0F172B] dark:to-emerald-950/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#007A7A] text-white text-[11px] font-black uppercase">
                <Bot className="w-3.5 h-3.5" /> Daily Zone • AI Tạo Đề Hàng Loạt Nhanh
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <Globe className="w-3 h-3" /> Công khai • Làm lại nhiều lần • P1: 20p / P2: 40p
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-[#0F172B] dark:text-white">
              {mode === 'task1'
                ? 'Con AI Phần 1: Ném Word (.docx) / ZIP Google Drive / Ảnh / PDF → Tạo Hàng Loạt Đề Task 1'
                : 'Con AI Phần 2: Ném Word (.docx) / ZIP / PDF 350+ Câu Hỏi → Tự Phân Loại Chủ Đề · Dạng Đề'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-bulk-import-history-btn"
              onClick={() => setShowHistoryPanel(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border transition ${
                showHistoryPanel
                  ? 'bg-amber-600 text-white border-amber-600'
                  : totalBadgeErrorCount > 0
                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600/50 hover:bg-amber-100'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
              }`}
              title="Xem lịch sử các lần nhập hàng loạt và danh sách những đề bị cảnh báo / lỗi để mở sửa lại"
            >
              <History className="w-3.5 h-3.5" />
              <span>
                Lịch sử &amp; Đề lỗi
                {totalBadgeErrorCount > 0 ? ` (${totalBadgeErrorCount})` : importHistory.length > 0 ? ` (${importHistory.length})` : ''}
              </span>
            </button>
            {!hasGeminiAccess && setShowApiKeyModal && (
              <button
                type="button"
                onClick={() => {
                  setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
                  setShowApiKeyModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
              >
                <Key className="w-3.5 h-3.5" /> Cấu hình Gemini Key
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Part AI Switcher Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
            <button
              type="button"
              data-testid="bulk-switch-task1-tab"
              disabled={running || saving}
              onClick={() => {
                setMode('task1');
                setErrorMsg('');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                mode === 'task1'
                  ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Phần 1: AI Task 1 — Word (.docx) / ZIP / Ảnh / PDF (20p)</span>
            </button>

            <button
              type="button"
              data-testid="bulk-switch-task2-tab"
              disabled={running || saving}
              onClick={() => {
                setMode('task2');
                setErrorMsg('');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                mode === 'task2'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-600'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Phần 2: AI Task 2 — Word (.docx) / PDF 350+ Đề (40p)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold text-[#475569] dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
            <span>Tên đề tự đặt theo Cụm Danh Từ (Noun Phrase) • Mở Công Khai • Làm nhiều lần</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Persistent Import History & Error Log Panel */}
          {showHistoryPanel && (
            <div
              data-testid="bulk-import-history-panel"
              className="rounded-2xl border border-amber-300 dark:border-amber-700/70 bg-amber-50/70 dark:bg-amber-950/25 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                    Lịch Sử Nhập Đề Hàng Loạt &amp; Danh Sách Đề Bị Lỗi / Cần Sửa ({importHistory.length} đợt)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {importHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const lines = [];
                        importHistory.forEach(entry => {
                          const dt = new Date(entry.createdAt).toLocaleString('vi-VN');
                          lines.push(`[${dt}] ${entry.summaryLabel || entry.mode.toUpperCase()} — Đã lưu ${entry.totalSaved} đề`);
                          (entry.warningItems || []).forEach(wi => {
                            lines.push(`  - [CẦN SỬA] ${wi.sourceLabel} -> "${wi.title}": ${wi.reason}`);
                          });
                          (entry.generalWarnings || []).forEach(gw => {
                            lines.push(`  - [LƯU Ý] ${gw}`);
                          });
                        });
                        navigator.clipboard?.writeText(lines.join('\n'));
                        showToast?.('Đã copy toàn bộ lịch sử lỗi nhập đề vào Clipboard!', 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1 hover:bg-amber-100/70"
                    >
                      <ClipboardCopy className="w-3 h-3" /> Copy log lỗi
                    </button>
                  )}
                  {importHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportHistory(clearBulkWritingImportHistory());
                        showToast?.('Đã xóa lịch sử nhập đề trên trình duyệt này.', 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                    >
                      Xóa lịch sử
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowHistoryPanel(false)}
                    className="p-1 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    aria-label="Đóng lịch sử"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {liveBrokenWritingTests.length > 0 && (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/70 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Đề Writing hiện có trên hệ thống đang bị lỗi / thiếu ảnh ({liveBrokenWritingTests.length} bài):
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {liveBrokenWritingTests.map(({ test, issue }) => (
                      <div
                        key={test.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="font-extrabold text-[#0F172B] dark:text-white truncate">
                            [{getDailySubCategoryLabel(test.dailySubCategory) || 'Writing'}] {test.title}
                          </p>
                          {issue.sourceFile && (
                            <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                              File gốc: {issue.sourceFile}
                            </p>
                          )}
                          <p className="text-[11px] text-amber-800 dark:text-amber-300">{issue.reason}</p>
                        </div>
                        {onOpenTestForEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose?.();
                              onOpenTestForEdit(test);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                          >
                            <Edit className="w-3 h-3" /> Mở sửa ngay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importHistory.length === 0 ? (
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                  Chưa có đợt nhập hàng loạt nào được lưu. Từ giờ, mỗi lần bạn bấm <b>Đăng Công Khai</b>, hệ thống sẽ tự ghi lại toàn bộ file nào bị lỗi AI / thiếu ảnh kèm nút bấm mở thẳng vào sửa đề đó.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {importHistory.map(entry => {
                    const warnCount = (entry.warningItems?.length || 0) + (entry.generalWarnings?.length || 0);
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#0F172B] dark:text-white">
                              {entry.summaryLabel || (entry.mode === 'task1' ? 'Writing Task 1' : 'Writing Task 2')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                              +{entry.totalSaved} đề
                            </span>
                            {warnCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                ⚠️ {warnCount} cảnh báo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                                ✓ Sạch lỗi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{new Date(entry.createdAt).toLocaleString('vi-VN')}</span>
                            <button
                              type="button"
                              onClick={() => setImportHistory(deleteBulkWritingImportHistoryEntry(entry.id))}
                              className="text-slate-400 hover:text-rose-500"
                              title="Xóa mục lịch sử này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {(entry.warningItems || []).length > 0 && (
                          <div className="space-y-1.5">
                            {entry.warningItems.map((wi, idx) => {
                              const liveTest = liveTestById.get(wi.testId);
                              const alreadyFixed = liveTest && !liveTest.importWarning && !liveTest.needsImportReview;
                              return (
                                <div
                                  key={`${wi.testId || idx}`}
                                  className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border text-xs ${
                                    alreadyFixed
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                                      : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="font-extrabold text-[#0F172B] dark:text-white truncate">
                                      {alreadyFixed ? '✓ Đã sửa: ' : '⚠️ '}
                                      {wi.sourceLabel}
                                      {wi.title && wi.title !== wi.sourceLabel ? ` → ${wi.title}` : ''}
                                    </p>
                                    <p className="text-[11px] text-amber-800 dark:text-amber-300">{wi.reason}</p>
                                  </div>
                                  {liveTest && onOpenTestForEdit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onClose?.();
                                        onOpenTestForEdit(liveTest);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                                    >
                                      <Edit className="w-3 h-3" /> {alreadyFixed ? 'Xem lại' : 'Mở sửa ngay'}
                                    </button>
                                  )}
                                  {!liveTest && (
                                    <span className="text-[11px] text-slate-400 italic">Đã xóa đề</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(entry.generalWarnings || []).length > 0 && (
                          <ul className="list-disc pl-5 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                            {entry.generalWarnings.map((gw, i) => (
                              <li key={i}>{gw}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* MODE 1: WRITING TASK 1 (BULK IMAGES / PDF PER FOLDER)      */}
          {/* ========================================================== */}
          {mode === 'task1' && (
            <div className="space-y-4">
              {/* Step 1: Target Folder Selection (Map / Process / Dynamic / Static) */}
              <div className="rounded-xl border border-teal-200 dark:border-teal-800/70 bg-[#EDFFFD]/60 dark:bg-teal-950/25 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] flex items-center gap-1.5">
                    <Folder className="w-4 h-4" />
                    1. Thư mục nhận đề Task 1 (Giáo viên bấm chọn sẵn — không cần chia từng bài):
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Đang vào thư mục:{' '}
                    <b className="text-[#007A7A] dark:text-[#1EE1D6]">
                      {t1SubCategory === 'auto'
                        ? 'AI Tự nhận diện (Map/Process/Dynamic/Static)'
                        : getDailySubCategoryLabel(t1SubCategory)}
                    </b>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DAILY_WRITING_T1_SUBCATEGORIES.map(sub => {
                    const active = t1SubCategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        data-testid={`bulk-w1-target-folder-${sub.id}`}
                        onClick={() => handleSelectT1FolderPill(sub.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition ${
                          active
                            ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-[#0F172B] dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>Thư mục {sub.label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    data-testid="bulk-w1-target-folder-auto"
                    onClick={() => handleSelectT1FolderPill('auto')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition ${
                      t1SubCategory === 'auto'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:border-indigo-500'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Để AI Tự Chia Thư Mục</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Drop Word (.docx), Google Drive .ZIP, Folder, Images or PDF */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                <div className="lg:col-span-8 flex flex-col gap-2.5">
                  <label className="flex-1 cursor-pointer rounded-2xl border-2 border-dashed border-[#007A7A]/60 dark:border-teal-500/50 bg-slate-50/90 dark:bg-slate-900/70 hover:border-[#007A7A] p-5 flex flex-col items-center justify-center text-center gap-2 transition">
                    <div className="w-11 h-11 rounded-2xl bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] flex items-center justify-center">
                      {t1Unpacking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white">
                      Chọn File Word (.docx), File .ZIP tải từ Google Drive, Hình Ảnh hoặc PDF Task 1
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-400 max-w-xl leading-relaxed">
                      <b>Mẹo nhanh nhất từ Google Drive:</b> Bấm chuột phải vào thư mục <b>KHO ĐỀ TASK 1</b> → <b>Tải xuống (.zip)</b> rồi ném nguyên file <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-bold">.zip</code> vào đây! Web tự giải nén mọi file Word, lấy chữ đề bài + ảnh biểu đồ sắc nét &amp; chia đúng 4 thư mục (Map / Process / Dynamic / Static) trong vài giây!
                    </p>
                    <input
                      type="file"
                      data-testid="bulk-w1-file-input"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,application/zip,application/x-zip-compressed,image/*,.pdf,application/pdf"
                      multiple
                      onChange={handleSelectTask1Files}
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={running || saving || t1Unpacking}
                      onClick={() => t1FolderInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#007A7A]/50 hover:border-[#007A7A] text-[#0F766E] dark:text-[#1EE1D6] text-xs font-extrabold inline-flex items-center gap-2 transition"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Hoặc chọn nguyên Thư Mục từ máy tính (đã giải nén)</span>
                    </button>
                    <input
                      ref={t1FolderInputRef}
                      type="file"
                      data-testid="bulk-w1-folder-input"
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleSelectTask1Files}
                      className="hidden"
                    />
                    {t1DetectedFolders.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        Tự nhận diện thư mục: {t1DetectedFolders.map(id => getDailySubCategoryLabel(id) || id).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5 text-xs">
                    <p className="font-extrabold text-[#0F172B] dark:text-white">
                      Đã nạp chờ xử lý:{' '}
                      <span className="text-[#007A7A] dark:text-[#1EE1D6]">
                        {t1DocxItems.length} Word (.docx)
                      </span>{' '}
                      + {t1Images.length} hình + {t1PdfFiles.length} PDF
                    </p>
                    <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-relaxed">
                      • Thời gian mặc định: <b>20 phút / bài</b>
                      <br />• Chế độ: <b>Công khai • Làm lại nhiều lần</b>
                      <br />• File Word (.docx) tự tách chuẩn <b>đề bài + ảnh biểu đồ gốc</b> siêu nhanh.
                    </p>
                    {t1DocxItems.length > 0 && (
                      <label className="flex items-start gap-2 pt-1 text-[11px] font-bold text-[#334155] dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={t1UseAiForDocx}
                          onChange={e => setT1UseAiForDocx(e.target.checked)}
                          className="w-3.5 h-3.5 mt-0.5 rounded accent-[#007A7A]"
                        />
                        <span>
                          Dùng AI chuẩn hóa Tên Cụm Danh Từ cho file Word (bỏ chọn để nhập tức thì 100% không cần đợi AI)
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(t1DocxItems.length > 0 || t1Images.length > 0 || t1PdfFiles.length > 0) && !running && (
                      <button
                        type="button"
                        onClick={() => {
                          setT1DocxItems([]);
                          setT1Images([]);
                          setT1PdfFiles([]);
                          setT1DetectedFolders([]);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        Xóa danh sách file đang chọn
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid="run-bulk-w1-ai-btn"
                      disabled={
                        running ||
                        saving ||
                        t1Unpacking ||
                        (t1DocxItems.length === 0 && t1Images.length === 0 && t1PdfFiles.length === 0)
                      }
                      onClick={handleRunTask1Ai}
                      className="w-full py-3 px-4 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition"
                    >
                      {running || t1Unpacking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t1Unpacking ? 'Đang giải nén file...' : 'Đang soạn hàng loạt đề Task 1...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Soạn Hàng Loạt Đề Task 1 Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Queued Files Strip */}
              {(t1DocxItems.length > 0 || t1Images.length > 0 || t1PdfFiles.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 max-h-32 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {t1DocxItems.map((doc, idx) => (
                    <span
                      key={doc.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-xs font-bold"
                    >
                      {doc.primaryImageUrl ? (
                        <img
                          src={doc.primaryImageUrl}
                          alt={doc.fileName}
                          className="w-6 h-6 rounded object-cover border border-slate-200"
                        />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      {doc.matchedFromFolder && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-[#0F766E] dark:text-[#1EE1D6] text-[10px] font-black">
                          {getDailySubCategoryLabel(doc.inferredSubCategory) || doc.inferredSubCategory}
                        </span>
                      )}
                      <span className="max-w-[150px] truncate">#{idx + 1} {doc.fileName}</span>
                      <button
                        type="button"
                        onClick={() => setT1DocxItems(prev => prev.filter(x => x.id !== doc.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {t1PdfFiles.map((pdf, idx) => (
                    <span
                      key={`${pdf.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-xs font-bold"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#007A7A]" />
                      <span className="max-w-[180px] truncate">{pdf.name}</span>
                      <span className="text-[10px] text-slate-400">({formatBytes(pdf.size)})</span>
                      <button
                        type="button"
                        onClick={() => setT1PdfFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {t1Images.map((img, idx) => (
                    <span
                      key={img.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <img src={img.dataUrl} alt={img.name} className="w-6 h-6 rounded object-cover border border-slate-200" />
                      <span className="max-w-[130px] truncate">#{idx + 1} {img.name}</span>
                      <button
                        type="button"
                        onClick={() => setT1Images(prev => prev.filter(x => x.id !== img.id))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Task 1 AI Draft Preview Cards */}
              {t1Drafts.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã soạn {t1Drafts.length} đề Task 1 (Đã chọn {selectedT1Count}/{t1Drafts.length})
                      </span>
                      {usedModelLabel && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          {usedModelLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {t1WarningCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setT1OnlyWarnings(prev => !prev);
                            setT1Page(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-extrabold border inline-flex items-center gap-1 transition ${
                            t1OnlyWarnings
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600/60 hover:bg-amber-100'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {t1OnlyWarnings ? `Đang lọc ${t1WarningCount} đề lỗi (Xem hết)` : `Chỉ xem ${t1WarningCount} đề có cảnh báo`}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setT1Drafts(prev => prev.map(d => ({ ...d, selected: true })))}
                        className="font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setT1Drafts(prev => prev.map(d => ({ ...d, selected: false })))}
                        className="font-bold text-slate-500 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {visibleT1Drafts.length > 8 && (
                    <ListPaginationBar
                      currentPage={paginatedT1.safePage}
                      totalItems={visibleT1Drafts.length}
                      pageSize={8}
                      onPageChange={setT1Page}
                      itemLabel="đề Task 1"
                    />
                  )}

                  <div className="space-y-3">
                    {paginatedT1.pageItems.map((draft, idxOnPage) => {
                      const globalIdx = paginatedT1.startIdx + idxOnPage;
                      return (
                        <div
                          key={draft.id}
                          data-testid={`bulk-w1-draft-card-${globalIdx}`}
                          className={`rounded-xl border p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3.5 transition ${
                            draft.selected === false
                              ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                              : draft.importWarning
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600/70'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {draft.importWarning && (
                            <div className="md:col-span-12 px-3 py-1.5 rounded-lg bg-amber-100/90 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Cần kiểm tra lại ({draft.sourceLabel}): {draft.importWarning}</span>
                            </div>
                          )}
                          <div className="md:col-span-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.selected !== false}
                                  onChange={e =>
                                    setT1Drafts(prev =>
                                      prev.map(x => (x.id === draft.id ? { ...x, selected: e.target.checked } : x))
                                    )
                                  }
                                  className="w-4 h-4 rounded accent-[#007A7A]"
                                />
                                <span>Đề #{globalIdx + 1}</span>
                              </label>
                              <span className="text-[11px] text-slate-500 truncate max-w-[160px]">{draft.sourceLabel}</span>
                            </div>

                            <div className="h-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 flex items-center justify-center p-1.5 overflow-hidden">
                              {draft.imageUrl ? (
                                <img
                                  src={draft.imageUrl}
                                  alt={draft.title}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-center px-3 space-y-1 text-slate-400">
                                  <ImageIcon className="w-6 h-6 mx-auto opacity-60" />
                                  <p className="text-[11px] font-semibold">Chưa có ảnh biểu đồ trong file Word</p>
                                </div>
                              )}
                            </div>

                            {draft.croppedImageUrl && draft.fullImageUrl && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setT1Drafts(prev =>
                                      prev.map(x =>
                                        x.id === draft.id
                                          ? { ...x, imageUrl: x.croppedImageUrl, usingCropped: true }
                                          : x
                                      )
                                    )
                                  }
                                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border ${
                                    draft.usingCropped
                                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  Ảnh cắt biểu đồ
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setT1Drafts(prev =>
                                      prev.map(x =>
                                        x.id === draft.id
                                          ? { ...x, imageUrl: x.fullImageUrl, usingCropped: false }
                                          : x
                                      )
                                    )
                                  }
                                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border ${
                                    !draft.usingCropped
                                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  Ảnh gốc
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-8 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <div className="sm:col-span-8">
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                  Tên bài (Đặt theo cụm danh từ của bài):
                                </label>
                                <input
                                  type="text"
                                  value={draft.title}
                                  onChange={e =>
                                    setT1Drafts(prev =>
                                      prev.map(x => (x.id === draft.id ? { ...x, title: e.target.value } : x))
                                    )
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#0F172B] dark:text-white"
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                  Thư mục Task 1:
                                </label>
                                <select
                                  value={draft.dailySubCategory}
                                  onChange={e =>
                                    setT1Drafts(prev =>
                                      prev.map(x =>
                                        x.id === draft.id ? { ...x, dailySubCategory: e.target.value } : x
                                      )
                                    )
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                                >
                                  {DAILY_WRITING_T1_SUBCATEGORIES.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                Câu hỏi đề bài Writing Task 1 (Tối thiểu 150 từ • 20 phút):
                              </label>
                              <textarea
                                rows={3}
                                value={draft.prompt}
                                onChange={e =>
                                  setT1Drafts(prev =>
                                    prev.map(x => (x.id === draft.id ? { ...x, prompt: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[#0F172B] dark:text-slate-100 leading-relaxed"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                              <span>🌐 Công khai • ⏱️ 20 phút • ♾️ Làm lại nhiều lần</span>
                              <button
                                type="button"
                                onClick={() => setT1Drafts(prev => prev.filter(x => x.id !== draft.id))}
                                className="text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1 hover:underline"
                              >
                                <Trash2 className="w-3 h-3" /> Xóa bài này
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* MODE 2: WRITING TASK 2 (BULK 350+ QUESTIONS PDF / TEXT)    */}
          {/* ========================================================== */}
          {mode === 'task2' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                {/* PDF Uploader */}
                <div className="lg:col-span-6 flex flex-col gap-2.5">
                  <label className="flex-1 cursor-pointer rounded-2xl border-2 border-dashed border-emerald-400/80 dark:border-emerald-600/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-600 p-5 flex flex-col items-center justify-center text-center gap-2 transition">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white">
                      Bấm chọn File Word (.docx), .ZIP hoặc .PDF Bộ Đề Task 2 (Hỗ trợ 350+ đề)
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-400 max-w-md">
                      Tự động đọc file Word / PDF, tách từng câu hỏi 1..350+, phân loại vào đúng <b>24 Chủ đề</b> &amp; <b>5 Dạng bài</b>, tự dán đề và đặt tên bài theo <b>Cụm Danh Từ</b>!
                    </p>
                    <input
                      type="file"
                      data-testid="bulk-w2-pdf-input"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,application/zip,application/x-zip-compressed,.pdf,application/pdf"
                      multiple
                      onChange={handleSelectTask2Pdfs}
                      className="hidden"
                    />
                  </label>

                  {(t2DocxItems.length > 0 || t2PdfFiles.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 max-h-28 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {t2DocxItems.map((doc, idx) => (
                        <span
                          key={doc.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="max-w-[200px] truncate">#{idx + 1} {doc.fileName}</span>
                          <button
                            type="button"
                            onClick={() => setT2DocxItems(prev => prev.filter(x => x.id !== doc.id))}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      {t2PdfFiles.map((pdf, idx) => (
                        <span
                          key={`${pdf.name}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="max-w-[200px] truncate">{pdf.name}</span>
                          <span className="text-[10px] text-slate-400">({formatBytes(pdf.size)})</span>
                          <button
                            type="button"
                            onClick={() => setT2PdfFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Paste Raw Text + AI Controls */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                        Hoặc dán nhanh danh sách câu hỏi Task 2 (tùy chọn):
                      </span>
                      {t2RawText.trim() && (
                        <button
                          type="button"
                          onClick={() => setT2RawText('')}
                          className="text-[11px] text-rose-500 hover:underline font-bold"
                        >
                          Xóa ô dán
                        </button>
                      )}
                    </label>
                    <textarea
                      rows={4}
                      data-testid="bulk-w2-raw-text-input"
                      value={t2RawText}
                      onChange={e => setT2RawText(e.target.value)}
                      placeholder={'1. Everyone should stay at school until the age of 18. Agree/disagree?\n2. In many countries, people are choosing other means of transport...'}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-[#0F172B] dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#334155] dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t2UseAi}
                        onChange={e => setT2UseAi(e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span>
                        Dùng Gemini AI đặt tên Cụm Danh Từ học thuật C1 &amp; phân loại sâu Chủ đề / Dạng bài
                      </span>
                    </label>

                    <button
                      type="button"
                      data-testid="run-bulk-w2-ai-btn"
                      disabled={running || saving || t1Unpacking || (t2DocxItems.length === 0 && t2PdfFiles.length === 0 && !t2RawText.trim())}
                      onClick={handleRunTask2Ai}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition"
                    >
                      {running ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI đang phân loại &amp; đặt tên danh từ...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>AI Đọc Đề, Phân Loại Chủ Đề · Dạng Bài &amp; Đặt Tên Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Task 2 Drafts Review Table (Supports 350+ items smoothly) */}
              {t2Drafts.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã trích xuất &amp; phân loại {t2Drafts.length} đề Task 2 (Đã chọn {selectedT2Count}/{t2Drafts.length})
                      </span>
                      {usedModelLabel && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          {usedModelLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setT2Drafts(prev => prev.map(d => ({ ...d, selected: true })))}
                        className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                      >
                        Chọn tất cả ({t2Drafts.length})
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setT2Drafts(prev => prev.map(d => ({ ...d, selected: false })))}
                        className="font-bold text-slate-500 hover:underline"
                      >
                        Bỏ chọn hết
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar inside Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="sm:col-span-5 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={t2Search}
                        onChange={e => {
                          setT2Search(e.target.value);
                          setT2Page(1);
                        }}
                        placeholder="Tìm theo số thứ tự, tên danh từ hoặc nội dung đề..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[#0F172B] dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <select
                        value={t2TopicFilter}
                        onChange={e => {
                          setT2TopicFilter(e.target.value);
                          setT2Page(1);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                      >
                        <option value="all">Tất cả Chủ đề ({t2Drafts.length})</option>
                        {DAILY_WRITING_T2_TOPICS.map(t => {
                          const cnt = t2Drafts.filter(d => d.writingTask2Topic === t.id).length;
                          if (cnt === 0) return null;
                          return (
                            <option key={t.id} value={t.id}>
                              {t.label} ({cnt})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={t2TypeFilter}
                        onChange={e => {
                          setT2TypeFilter(e.target.value);
                          setT2Page(1);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                      >
                        <option value="all">Tất cả Dạng bài ({t2Drafts.length})</option>
                        {DAILY_WRITING_T2_QUESTION_TYPES.map(qt => {
                          const cnt = t2Drafts.filter(d => d.writingTask2QuestionType === qt.id).length;
                          return (
                            <option key={qt.id} value={qt.id}>
                              {qt.label} ({cnt})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {filteredT2Drafts.length > 20 && (
                    <ListPaginationBar
                      currentPage={paginatedT2.safePage}
                      totalItems={filteredT2Drafts.length}
                      pageSize={20}
                      onPageChange={setT2Page}
                      itemLabel="đề Task 2"
                    />
                  )}

                  <div className="space-y-2.5">
                    {paginatedT2.pageItems.map((draft, idxOnPage) => {
                      const displayNum = draft.sourceNumber || paginatedT2.startIdx + idxOnPage + 1;
                      return (
                        <div
                          key={draft.id}
                          data-testid={`bulk-w2-draft-row-${paginatedT2.startIdx + idxOnPage}`}
                          className={`rounded-xl border p-3 space-y-2 transition ${
                            draft.selected !== false
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <div className="md:col-span-6 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={draft.selected !== false}
                                onChange={e =>
                                  setT2Drafts(prev =>
                                    prev.map(x => (x.id === draft.id ? { ...x, selected: e.target.checked } : x))
                                  )
                                }
                                className="w-4 h-4 rounded accent-emerald-600 shrink-0"
                              />
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-black shrink-0">
                                #{displayNum}
                              </span>
                              <input
                                type="text"
                                value={draft.title}
                                onChange={e =>
                                  setT2Drafts(prev =>
                                    prev.map(x => (x.id === draft.id ? { ...x, title: e.target.value } : x))
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-[#0F172B] dark:text-white"
                                title="Tên đề đặt dựa trên danh từ của bài"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <select
                                value={draft.writingTask2Topic}
                                onChange={e =>
                                  setT2Drafts(prev =>
                                    prev.map(x =>
                                      x.id === draft.id ? { ...x, writingTask2Topic: e.target.value } : x
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                              >
                                {DAILY_WRITING_T2_TOPICS.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-3 flex items-center gap-1.5">
                              <select
                                value={draft.writingTask2QuestionType}
                                onChange={e =>
                                  setT2Drafts(prev =>
                                    prev.map(x =>
                                      x.id === draft.id
                                        ? { ...x, writingTask2QuestionType: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                              >
                                {DAILY_WRITING_T2_QUESTION_TYPES.map(qt => (
                                  <option key={qt.id} value={qt.id}>
                                    {qt.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setT2Drafts(prev => prev.filter(x => x.id !== draft.id))}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 shrink-0"
                                title="Xóa đề này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={draft.prompt}
                            onChange={e =>
                              setT2Drafts(prev =>
                                prev.map(x => (x.id === draft.id ? { ...x, prompt: e.target.value } : x))
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-[#334155] dark:text-slate-200 leading-relaxed"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {filteredT2Drafts.length > 20 && (
                    <ListPaginationBar
                      currentPage={paginatedT2.safePage}
                      totalItems={filteredT2Drafts.length}
                      pageSize={20}
                      onPageChange={setT2Page}
                      itemLabel="đề Task 2"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live AI Progress Bar */}
          {running && (
            <div className="rounded-xl border border-teal-300 dark:border-teal-700 bg-[#EDFFFD] dark:bg-teal-950/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{progress.message || 'AI đang xử lý...'}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums">{progressPct}%</span>
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold"
                  >
                    Dừng
                  </button>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white dark:bg-slate-800 overflow-hidden border border-teal-200 dark:border-teal-800">
                <div
                  className="h-full bg-gradient-to-r from-[#007A7A] to-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.max(5, progressPct)}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700 text-xs font-bold text-rose-700 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/60 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-extrabold">Lưu ý xử lý tự động ({warnings.length}):</p>
              <ul className="list-disc pl-5 space-y-0.5 max-h-24 overflow-y-auto">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Bottom Publish Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[#334155] dark:text-slate-300">Hashtag gắn kèm:</span>
            <input
              type="text"
              value={hashtagsInput}
              onChange={e => setHashtagsInput(e.target.value)}
              placeholder="#ThiThật, #DailyZone"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white w-52"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              • Chế độ: <b>Công khai</b> • <b>{mode === 'task1' ? 'P1: 20 phút' : 'P2: 40 phút'}</b> • <b>Làm lại nhiều lần</b>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={saving}
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#334155] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Đóng
            </button>

            {mode === 'task1' ? (
              <button
                type="button"
                data-testid="confirm-save-bulk-w1-btn"
                disabled={running || saving || selectedT1Count === 0}
                onClick={handleConfirmSaveTask1}
                className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-md transition"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {saving
                    ? 'Đang đăng lên Daily Zone...'
                    : `Đăng Công Khai ${selectedT1Count} Đề Task 1 (20p • Nhiều Lần)`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="confirm-save-bulk-w2-btn"
                disabled={running || saving || selectedT2Count === 0}
                onClick={handleConfirmSaveTask2}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-md transition"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {saving
                    ? 'Đang đăng lên Daily Zone...'
                    : `Đăng Công Khai ${selectedT2Count} Đề Task 2 (40p • Nhiều Lần)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
