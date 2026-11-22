import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  FileUp,
  FolderPlus,
  Keyboard,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { DEFAULT_VOCAB_TEXT, VOCAB_PRESETS } from '../../constants/seedData';
import {
  buildAutoV4BlankSentence,
  extractAcceptedRound4Answers,
  parseRawVocabText,
  serializeVocabItemsToRawText
} from '../../utils/examHelpers';
import { generateGameVocabQuestionsWithAI } from '../../utils/gameVocabAi';

const EMPTY_DRAFT = () => ({
  id: `gq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  word: '',
  prompt: '',
  ipa: '',
  example: '',
  syn: '',
  ant: '',
  v3CustomMode: 'syn_ant',
  v3CustomQuestion: '',
  v3CustomChoices: ['', '', '', ''],
  v3CustomAnswer: '',
  v4CustomSentence: '',
  v4AcceptedAnswers: [''],
  timeSec: 20
});

function toEditableDraft(item) {
  const answers = extractAcceptedRound4Answers(item);
  const rawChoices = Array.isArray(item?.v3CustomChoices) ? item.v3CustomChoices : [];
  const paddedChoices = [
    rawChoices[0] || '',
    rawChoices[1] || '',
    rawChoices[2] || '',
    rawChoices[3] || ''
  ];
  return {
    id: item?.id || `gq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    word: String(item?.word || ''),
    prompt: String(item?.prompt || ''),
    ipa: String(item?.ipa || ''),
    example: String(item?.example || '').startsWith('Ghi nhớ cách dùng từ') ? '' : String(item?.example || ''),
    syn: String(item?.syn || ''),
    ant: String(item?.ant || ''),
    v3CustomMode: item?.v3CustomMode === 'mcq' && rawChoices.length >= 2 ? 'mcq' : 'syn_ant',
    v3CustomQuestion: String(item?.v3CustomQuestion || ''),
    v3CustomChoices: paddedChoices,
    v3CustomAnswer: String(item?.v3CustomAnswer || rawChoices[0] || ''),
    v4CustomSentence: String(item?.v4CustomSentence || ''),
    v4AcceptedAnswers: answers.length > 0 ? answers : [''],
    timeSec: Math.max(0, Math.min(120, Math.round(Number(item?.timeSec) || 20)))
  };
}

function renderBlankSentencePreview(sentence) {
  const text = String(sentence || '');
  const parts = text.split(/(_{3,})/);
  return parts.map((part, idx) =>
    /^_{3,}$/.test(part) ? (
      <span
        key={idx}
        className="inline-block mx-1 px-3 py-0.5 rounded-md border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-extrabold align-baseline"
      >
        ____________
      </span>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export default function GameVocabBankModal({
  aiApiKey = '',
  currentRoomPin = '',
  currentUser = null,
  customVocabInput = '',
  customVocabTopics = [],
  onClose,
  onDeleteCustomVocabTopic,
  onSaveCustomVocabTopic,
  onSaveRoomVocab,
  setCustomVocabInput,
  showToast
}) {
  const [items, setItems] = useState(() => parseRawVocabText(customVocabInput || DEFAULT_VOCAB_TEXT));
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'bulk' | 'ai'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null); // null | -1 (new) | >=0 (existing idx)
  const [draft, setDraft] = useState(() => EMPTY_DRAFT());
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [lastDeleted, setLastDeleted] = useState(null); // { item, index }
  const [activeTopicId, setActiveTopicId] = useState(''); // tracks loaded custom topic for quick update
  const [showLibrarySidebar, setShowLibrarySidebar] = useState(true);

  // Save as custom topic form
  const [topicNameDraft, setTopicNameDraft] = useState('');
  const [showSaveTopicBox, setShowSaveTopicBox] = useState(false);

  // Bulk copy-paste tab
  const [bulkText, setBulkText] = useState('');

  // AI Import tab
  const [aiRawText, setAiRawText] = useState('');
  const [aiMode, setAiMode] = useState('auto_4_rounds'); // 'auto_4_rounds' | 'extract_exact'
  const [aiMediaFiles, setAiMediaFiles] = useState([]); // [{ name, type, dataUrl }]
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const aiFileInputRef = useRef(null);

  const isTeacher = currentUser?.role === 'teacher';

  const bulkParsedPreview = useMemo(() => parseRawVocabText(bulkText), [bulkText]);
  const bulkRawLinesCount = useMemo(
    () => bulkText.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')).length,
    [bulkText]
  );

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => {
        if (!q) return true;
        const blob = [
          item.word,
          item.prompt,
          item.syn,
          item.ant,
          item.v3CustomQuestion,
          item.v4CustomSentence,
          ...(item.v4AcceptedAnswers || [])
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
  }, [items, searchQuery]);

  const syncItems = (nextItems) => {
    setItems(nextItems);
    setConfirmClearAll(false);
    if (setCustomVocabInput) {
      setCustomVocabInput(serializeVocabItemsToRawText(nextItems));
    }
  };

  const openNewCardForm = () => {
    setActiveTab('cards');
    setEditingIndex(-1);
    setDraft(EMPTY_DRAFT());
  };

  const openEditCardForm = (idx) => {
    const target = items[idx];
    if (!target) return;
    setActiveTab('cards');
    setEditingIndex(idx);
    setDraft(toEditableDraft(target));
  };

  const handleSaveCardDraft = () => {
    const cleanAnswers = (draft.v4AcceptedAnswers || [])
      .map(a => String(a || '').trim())
      .filter(Boolean);
    const cleanChoices = (draft.v3CustomChoices || [])
      .map(c => String(c || '').trim())
      .filter(Boolean);
    const isMcq = draft.v3CustomMode === 'mcq';
    const cleanV3Ans = String(draft.v3CustomAnswer || '').trim();

    if (isMcq && (cleanChoices.length < 2 || !cleanV3Ans)) {
      showToast?.('Chế độ Trắc nghiệm Màn 3 cần ít nhất 2 lựa chọn và chọn 1 đáp án đúng (✓)!', 'error');
      return;
    }

    const inferredWord = String(draft.word || '').trim().toUpperCase()
      || (isMcq && cleanV3Ans ? cleanV3Ans.toUpperCase() : '')
      || (cleanAnswers[0] ? cleanAnswers[0].toUpperCase() : '');
    const inferredPrompt = String(draft.prompt || '').trim()
      || String(draft.v4CustomSentence || '').trim()
      || String(draft.v3CustomQuestion || '').trim();

    if (!inferredWord || !inferredPrompt) {
      showToast?.('Vui lòng nhập ít nhất Từ vựng/Đáp án và Nghĩa hoặc Câu hỏi!', 'error');
      return;
    }

    const finalAnswers = cleanAnswers.length > 0 ? cleanAnswers : [inferredWord.toLowerCase()];
    const rawNewItem = {
      id: draft.id || `gq_${Date.now()}`,
      word: inferredWord,
      prompt: inferredPrompt,
      ipa: String(draft.ipa || '').trim(),
      example: String(draft.example || '').trim(),
      syn: String(draft.syn || '').trim().toUpperCase(),
      ant: String(draft.ant || '').trim().toUpperCase(),
      collocation: finalAnswers[0],
      v3CustomMode: isMcq ? 'mcq' : 'syn_ant',
      v3CustomQuestion: isMcq ? String(draft.v3CustomQuestion || '').trim() : '',
      v3CustomChoices: isMcq ? cleanChoices : [],
      v3CustomAnswer: isMcq ? cleanV3Ans : '',
      v4CustomSentence: String(draft.v4CustomSentence || '').trim(),
      v4AcceptedAnswers: finalAnswers,
      timeSec: Math.max(0, Math.min(120, Math.round(Number(draft.timeSec) || 20)))
    };

    const nextList = [...items];
    if (editingIndex === -1) {
      nextList.unshift(rawNewItem);
    } else if (editingIndex !== null && editingIndex >= 0 && editingIndex < nextList.length) {
      nextList[editingIndex] = rawNewItem;
    } else {
      nextList.push(rawNewItem);
    }

    // Re-parse through canonical parser so distractors stay fresh
    const refreshed = parseRawVocabText(serializeVocabItemsToRawText(nextList));
    syncItems(refreshed);
    setEditingIndex(null);
    showToast?.(editingIndex === -1 ? `Đã thêm câu "${inferredWord}"!` : `Đã cập nhật câu "${inferredWord}"!`, 'success');
  };

  const handleDeleteCard = (idx) => {
    const removed = items[idx];
    if (!removed) return;
    const nextList = items.filter((_, i) => i !== idx);
    setLastDeleted({ item: removed, index: idx });
    if (editingIndex === idx) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > idx) setEditingIndex(editingIndex - 1);
    syncItems(nextList);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted?.item) return;
    const nextList = [...items];
    const insertAt = Math.min(Math.max(0, lastDeleted.index), nextList.length);
    nextList.splice(insertAt, 0, lastDeleted.item);
    syncItems(parseRawVocabText(serializeVocabItemsToRawText(nextList)));
    setLastDeleted(null);
    showToast?.('Đã hoàn tác câu hỏi vừa xóa!', 'info');
  };

  const handleDuplicateCard = (idx) => {
    const target = items[idx];
    if (!target) return;
    const copy = {
      ...target,
      id: `gq_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    };
    const nextList = [...items];
    nextList.splice(idx + 1, 0, copy);
    syncItems(parseRawVocabText(serializeVocabItemsToRawText(nextList)));
    showToast?.(`Đã nhân bản Câu #${idx + 1}!`, 'success');
  };

  const handleMoveCard = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const nextList = [...items];
    [nextList[idx], nextList[targetIdx]] = [nextList[targetIdx], nextList[idx]];
    syncItems(nextList);
  };

  const handleLoadSourceText = (rawText, label, mode = 'replace', topicId = '') => {
    const parsed = parseRawVocabText(rawText);
    if (parsed.length === 0) {
      showToast?.('Nguồn từ này chưa có câu hợp lệ!', 'error');
      return;
    }
    if (mode === 'append') {
      const merged = [...items, ...parsed];
      syncItems(parseRawVocabText(serializeVocabItemsToRawText(merged)));
      showToast?.(`Đã ghép thêm ${parsed.length} câu từ "${label}"!`, 'success');
    } else {
      syncItems(parsed);
      setActiveTopicId(topicId);
      setEditingIndex(null);
      showToast?.(`Đã nạp ${parsed.length} câu từ "${label}"! Bạn có thể Sửa / Xóa từng câu bên phải.`, 'success');
    }
    setActiveTab('cards');
  };

  const handleApplyBulk = (mode = 'append') => {
    if (bulkParsedPreview.length === 0) {
      showToast?.('Chưa nhận diện được dòng hợp lệ! Dùng dấu | hoặc - hoặc dán từ Excel (Tab).', 'error');
      return;
    }
    if (mode === 'replace') {
      syncItems(bulkParsedPreview);
      showToast?.(`Đã thay thế bằng ${bulkParsedPreview.length} câu mới!`, 'success');
    } else {
      const merged = [...items, ...bulkParsedPreview];
      syncItems(parseRawVocabText(serializeVocabItemsToRawText(merged)));
      showToast?.(`Đã thêm ${bulkParsedPreview.length} câu vào danh sách!`, 'success');
    }
    setBulkText('');
    setActiveTab('cards');
  };

  const handleAddAiFiles = async (fileList) => {
    const arr = Array.from(fileList || []);
    const added = [];
    for (const file of arr) {
      const mime = String(file.type || '').toLowerCase();
      if (!mime.startsWith('image/') && mime !== 'application/pdf') continue;
      if (file.size > 15 * 1024 * 1024) {
        showToast?.(`File "${file.name}" vượt quá 15MB!`, 'error');
        continue;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không đọc được file'));
        reader.readAsDataURL(file);
      }).catch(() => '');
      if (dataUrl) {
        added.push({ name: file.name || 'clipboard-image.png', type: mime, dataUrl });
      }
    }
    if (added.length > 0) {
      setAiMediaFiles(prev => [...prev, ...added].slice(0, 8));
    }
  };

  const handleAiPaste = (e) => {
    const clipItems = Array.from(e.clipboardData?.items || []);
    const imageFiles = clipItems
      .filter(it => it.type.startsWith('image/'))
      .map(it => it.getAsFile())
      .filter(Boolean);
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleAddAiFiles(imageFiles);
      showToast?.(`Đã dán ${imageFiles.length} ảnh chụp màn hình vào khung AI!`, 'info');
    }
  };

  const handleRunAiGenerate = async (applyMode = 'append') => {
    setAiError('');
    setAiLoading(true);
    try {
      const images = aiMediaFiles.filter(f => f.type.startsWith('image/')).map(f => f.dataUrl);
      const documents = aiMediaFiles.filter(f => f.type === 'application/pdf').map(f => f.dataUrl);
      const { items: aiItems } = await generateGameVocabQuestionsWithAI({
        apiKey: aiApiKey,
        rawInput: aiRawText,
        images,
        documents,
        mode: aiMode
      });
      if (applyMode === 'replace') {
        syncItems(parseRawVocabText(serializeVocabItemsToRawText(aiItems)));
        showToast?.(`AI đã tạo ${aiItems.length} câu hỏi chuẩn 4 Màn!`, 'success');
      } else {
        const merged = [...items, ...aiItems];
        syncItems(parseRawVocabText(serializeVocabItemsToRawText(merged)));
        showToast?.(`AI đã tạo và thêm ${aiItems.length} câu vào danh sách!`, 'success');
      }
      setAiRawText('');
      setAiMediaFiles([]);
      setActiveTab('cards');
    } catch (err) {
      setAiError(err?.message || 'Lỗi khi gọi AI tạo câu hỏi.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAsCustomTopic = () => {
    const cleanLabel = topicNameDraft.trim();
    if (!cleanLabel) {
      showToast?.('Vui lòng nhập tên Kho chủ đề!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast?.('Danh sách đang trống, hãy thêm ít nhất 1 câu hỏi trước!', 'error');
      return;
    }
    const serialized = serializeVocabItemsToRawText(items);
    const ok = onSaveCustomVocabTopic?.({ label: cleanLabel, text: serialized });
    if (ok !== false) {
      setTopicNameDraft('');
      setShowSaveTopicBox(false);
    }
  };

  const handleFinalSaveToRoom = () => {
    if (items.length === 0) {
      showToast?.('Vui lòng có ít nhất 1 câu hỏi trước khi lưu vào phòng!', 'error');
      return;
    }
    const serialized = serializeVocabItemsToRawText(items);
    setCustomVocabInput?.(serialized);
    onSaveRoomVocab?.(serialized, items.length);
  };

  const activeCustomTopicObj = customVocabTopics.find(t => t.id === activeTopicId) || null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      data-testid="game-vocab-bank-modal"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-6xl w-full h-[92vh] max-h-[860px] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#007A7A] text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Soạn &amp; Quản Lý Bộ Câu Hỏi Game 4 Màn {currentRoomPin ? `(Phòng #${currentRoomPin})` : ''}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Màn 1–2 Từ &amp; Nghĩa • <b>Màn 3 Đồng/Trái nghĩa (hoặc Trắc nghiệm 4 đáp án)</b> • <b>Màn 4 Hiện câu hỏi &amp; HS gõ đáp án</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLibrarySidebar(v => !v)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#007A7A] transition"
            >
              {showLibrarySidebar ? 'Ẩn Kho Chủ Đề' : 'Hiện 14 Kho Chủ Đề'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
              aria-label="Đóng cửa sổ soạn câu hỏi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'cards'
                  ? 'bg-[#007A7A] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Danh Sách Thẻ Câu Hỏi ({items.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập Nhanh (Copy-Paste / Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Tạo Đề Từ Văn Bản / PDF / Ảnh</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNewCardForm}
              data-testid="game-bank-add-btn"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Câu Mới
            </button>
          </div>
        </div>

        {/* Body: Left Topic Library Sidebar + Right Main Editor */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {showLibrarySidebar && (
            <aside className="w-64 sm:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Kho Chủ Đề Của Bạn ({customVocabTopics.length})
                  </span>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => setShowSaveTopicBox(v => !v)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition"
                      title="Lưu danh sách đang mở thành Kho chủ đề dùng lâu dài"
                    >
                      <FolderPlus className="w-3 h-3" /> Lưu Kho
                    </button>
                  )}
                </div>

                {showSaveTopicBox && isTeacher && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/60 space-y-2">
                    <input
                      type="text"
                      value={topicNameDraft}
                      onChange={e => setTopicNameDraft(e.target.value)}
                      placeholder="Tên kho mới (VD: Environment B2+)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowSaveTopicBox(false)}
                        className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsCustomTopic}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                      >
                        Lưu ({items.length} câu)
                      </button>
                    </div>
                  </div>
                )}

                {activeCustomTopicObj && isTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      const serialized = serializeVocabItemsToRawText(items);
                      onSaveCustomVocabTopic?.({ label: activeCustomTopicObj.label, text: serialized });
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-teal-50 dark:bg-teal-500/15 hover:bg-teal-100 dark:hover:bg-teal-500/25 border border-teal-300 dark:border-teal-500/40 text-[#007A7A] dark:text-[#1EE1D6] text-[11px] font-extrabold flex items-center justify-center gap-1 transition"
                  >
                    <Save className="w-3 h-3" /> Cập Nhật Lại Kho &ldquo;{activeCustomTopicObj.label}&rdquo;
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {/* Custom Topics */}
                {customVocabTopics.length > 0 && (
                  <div className="space-y-1">
                    {customVocabTopics.map(topic => {
                      const count = parseRawVocabText(topic.text).length;
                      const isActive = activeTopicId === topic.id;
                      return (
                        <div
                          key={topic.id}
                          className={`group rounded-xl border p-2 transition ${
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-500/15 border-[#007A7A]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleLoadSourceText(topic.text, topic.label, 'replace', topic.id)}
                              className="flex-1 text-left min-w-0"
                            >
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                ⭐ {topic.label}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{count} câu hỏi</p>
                            </button>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleLoadSourceText(topic.text, topic.label, 'append', activeTopicId)}
                                className="p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/20"
                                title="Ghép thêm vào danh sách hiện tại"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              {isTeacher && onDeleteCustomVocabTopic && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteCustomVocabTopic(topic);
                                    if (activeTopicId === topic.id) setActiveTopicId('');
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                                  title={`Xóa kho "${topic.label}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 14 Built-in IELTS Presets */}
                <div className="space-y-1">
                  <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    14 Kho Chuẩn IELTS
                  </p>
                  {Object.entries(VOCAB_PRESETS || {}).map(([key, preset]) => (
                    <div
                      key={key}
                      className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 p-2 flex items-center justify-between gap-1 transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSourceText(preset.text, preset.label, 'replace', '')}
                        className="flex-1 text-left min-w-0"
                        title="Bấm để nạp thay thế danh sách hiện tại"
                      >
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {preset.label}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSourceText(preset.text, preset.label, 'append', activeTopicId)}
                        className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold shrink-0"
                        title="Ghép thêm vào danh sách hiện tại"
                      >
                        + Ghép
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Right Main Workspace */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-100/70 dark:bg-slate-950/80">
            {/* TAB 1: VISUAL CARD LIST (Blooket/Quizizz-style) */}
            {activeTab === 'cards' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Search + Quick Controls Bar */}
                <div className="shrink-0 px-4 py-2.5 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm từ vựng, đồng nghĩa, câu hỏi Màn 4..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {lastDeleted && (
                      <button
                        type="button"
                        onClick={handleUndoDelete}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Hoàn tác xóa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleLoadSourceText(DEFAULT_VOCAB_TEXT, '12 từ mặc định', 'replace', '')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    >
                      Mặc định
                    </button>
                    {!confirmClearAll ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(true)}
                        disabled={items.length === 0}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/35 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 disabled:opacity-40 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa hết
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        <span>Xóa cả {items.length} câu?</span>
                        <button
                          type="button"
                          onClick={() => {
                            syncItems([]);
                            setEditingIndex(null);
                            showToast?.('Đã xóa trắng danh sách câu hỏi!', 'info');
                          }}
                          className="px-1.5 py-0.5 rounded bg-white text-rose-700 font-black"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          className="px-1.5 py-0.5 rounded bg-rose-800 text-white"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scrollable Cards + Inline Structured Editor */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {/* Inline Editor Drawer (shown when adding a new card or editing an existing card) */}
                  {editingIndex !== null && (
                    <div
                      className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#007A7A] shadow-xl p-4 sm:p-5 space-y-4"
                      data-testid="game-card-editor-form"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-extrabold text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-1.5">
                          <Edit className="w-4 h-4" />
                          {editingIndex === -1 ? 'Thêm Câu Hỏi / Từ Vựng Mới' : `Chỉnh Sửa Câu #${editingIndex + 1}`}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Đóng ×
                        </button>
                      </div>

                      {/* Block 1: Core Vocab (Round 1 & 2) */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Từ vựng / Cụm từ chính (Màn 1 &amp; 2) *
                          </label>
                          <input
                            type="text"
                            data-testid="card-input-word"
                            value={draft.word}
                            onChange={e => setDraft(prev => ({ ...prev, word: e.target.value }))}
                            placeholder="VD: ENFORCE hoặc SUSTAINABLE DEVELOPMENT"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Nghĩa tiếng Việt (Gợi ý) *
                          </label>
                          <input
                            type="text"
                            data-testid="card-input-prompt"
                            value={draft.prompt}
                            onChange={e => setDraft(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="VD: thực thi, áp dụng quy định"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                            Phiên âm
                          </label>
                          <input
                            type="text"
                            value={draft.ipa}
                            onChange={e => setDraft(prev => ({ ...prev, ipa: e.target.value }))}
                            placeholder="/ɪnˈfɔːs/"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Block 2: Round 3 (Synonym / Antonym OR 4-Option Context MCQ) */}
                      <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-800/60 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                            🎯 MÀN 3: ĐỒNG NGHĨA · TRÁI NGHĨA (hoặc Trắc nghiệm 4 đáp án)
                          </span>
                          <div className="inline-flex rounded-lg overflow-hidden border border-sky-300 dark:border-sky-700 text-[11px] font-extrabold">
                            <button
                              type="button"
                              onClick={() => setDraft(prev => ({ ...prev, v3CustomMode: 'syn_ant' }))}
                              className={`px-2.5 py-1 transition ${
                                draft.v3CustomMode !== 'mcq'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Đồng / Trái nghĩa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft(prev => ({ ...prev, v3CustomMode: 'mcq' }))}
                              className={`px-2.5 py-1 transition ${
                                draft.v3CustomMode === 'mcq'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Trắc nghiệm 4 lựa chọn
                            </button>
                          </div>
                        </div>

                        {draft.v3CustomMode !== 'mcq' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                                Từ ĐỒNG NGHĨA (Synonym)
                              </label>
                              <input
                                type="text"
                                data-testid="card-input-syn"
                                value={draft.syn}
                                onChange={e => setDraft(prev => ({ ...prev, syn: e.target.value }))}
                                placeholder="VD: IMPOSE / IMPLEMENT"
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-1">
                                Từ TRÁI NGHĨA (Antonym)
                              </label>
                              <input
                                type="text"
                                data-testid="card-input-ant"
                                value={draft.ant}
                                onChange={e => setDraft(prev => ({ ...prev, ant: e.target.value }))}
                                placeholder="VD: IGNORE / NEGLECT"
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Câu hỏi trắc nghiệm (VD: The government needs to _______ stricter environmental regulations...)
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraft(prev => ({
                                      ...prev,
                                      v3CustomQuestion: `${prev.v3CustomQuestion}${prev.v3CustomQuestion ? ' ' : ''}_______`
                                    }))
                                  }
                                  className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300 hover:underline"
                                >
                                  + Chèn _______
                                </button>
                              </div>
                              <input
                                type="text"
                                value={draft.v3CustomQuestion}
                                onChange={e => setDraft(prev => ({ ...prev, v3CustomQuestion: e.target.value }))}
                                placeholder="The government needs to _______ stricter environmental regulations on factories."
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[0, 1, 2, 3].map(cIdx => {
                                const val = draft.v3CustomChoices[cIdx] || '';
                                const isCorrect = Boolean(val.trim() && draft.v3CustomAnswer.trim().toLowerCase() === val.trim().toLowerCase());
                                return (
                                  <div
                                    key={cIdx}
                                    className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (val.trim()) setDraft(prev => ({ ...prev, v3CustomAnswer: val.trim() }));
                                      }}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black transition ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-600'
                                      }`}
                                      title="Đánh dấu đây là đáp án đúng"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={e => {
                                        const nextVal = e.target.value;
                                        setDraft(prev => {
                                          const nextChoices = [...prev.v3CustomChoices];
                                          const oldVal = nextChoices[cIdx] || '';
                                          nextChoices[cIdx] = nextVal;
                                          const keepCorrect =
                                            oldVal.trim() && prev.v3CustomAnswer.trim().toLowerCase() === oldVal.trim().toLowerCase();
                                          return {
                                            ...prev,
                                            v3CustomChoices: nextChoices,
                                            v3CustomAnswer: keepCorrect ? nextVal.trim() : prev.v3CustomAnswer
                                          };
                                        });
                                      }}
                                      placeholder={`Đáp án ${String.fromCharCode(65 + cIdx)}`}
                                      className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none px-1"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Block 3: Round 4 (Sentence Cloze + Multiple Accepted Typing Answers — Screenshot 3!) */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                            <Keyboard className="w-4 h-4" /> MÀN 4 (TYPING DIỆT BOSS): HIỆN CÂU HỎI &amp; HS GÕ ĐÁP ÁN
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft(prev => ({
                                ...prev,
                                v4CustomSentence: `${prev.v4CustomSentence}${prev.v4CustomSentence ? ' ' : ''}____________`
                              }))
                            }
                            className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                          >
                            + Chèn chỗ trống ____________
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Câu hỏi hiển thị cho học sinh (để trống sẽ tự ẩn từ trong câu ví dụ):
                          </label>
                          <textarea
                            rows={2}
                            data-testid="card-input-v4-sentence"
                            value={draft.v4CustomSentence}
                            onChange={e => setDraft(prev => ({ ...prev, v4CustomSentence: e.target.value }))}
                            placeholder="VD: Environmental issues like climate change are difficult to solve because they ____________, making it impossible for a single nation to tackle them alone."
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                              Các đáp án HS gõ đúng (có thể thêm nhiều đáp án đồng nghĩa như Blooket):
                            </label>
                            <button
                              type="button"
                              data-testid="card-add-v4-answer-btn"
                              onClick={() =>
                                setDraft(prev => ({
                                  ...prev,
                                  v4AcceptedAnswers: [...(prev.v4AcceptedAnswers || []), '']
                                }))
                              }
                              className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-0.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Thêm đáp án tương đương
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(draft.v4AcceptedAnswers || ['']).map((ans, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-1.5">
                                <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                                  <Keyboard className="w-3.5 h-3.5 shrink-0 opacity-85" />
                                  <input
                                    type="text"
                                    data-testid={`card-input-v4-answer-${aIdx}`}
                                    value={ans}
                                    onChange={e => {
                                      const nextVal = e.target.value;
                                      setDraft(prev => {
                                        const arr = [...(prev.v4AcceptedAnswers || [''])];
                                        arr[aIdx] = nextVal;
                                        return { ...prev, v4AcceptedAnswers: arr };
                                      });
                                    }}
                                    placeholder={aIdx === 0 ? 'VD: unified global framework' : 'Đáp án tương đương khác...'}
                                    className="w-full bg-transparent text-xs font-bold text-white placeholder:text-emerald-100/80 focus:outline-none"
                                  />
                                </div>
                                {(draft.v4AcceptedAnswers || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraft(prev => ({
                                        ...prev,
                                        v4AcceptedAnswers: prev.v4AcceptedAnswers.filter((_, i) => i !== aIdx)
                                      }))
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                                    title="Xóa đáp án này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          data-testid="card-save-btn"
                          onClick={handleSaveCardDraft}
                          className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> {editingIndex === -1 ? 'Thêm Vào Bộ Đề' : 'Lưu Thay Đổi Câu Này'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredEntries.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {items.length === 0
                          ? 'Chưa có câu hỏi nào trong bộ đề này.'
                          : `Không tìm thấy câu nào khớp "${searchQuery}".`}
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={openNewCardForm}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm Câu Mới
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('bulk')}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Dán Từ Excel / Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('ai')}
                          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Tạo Bằng AI
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredEntries.map(({ item, idx }) => {
                      const v4Sentence = buildAutoV4BlankSentence(item);
                      const v4Answers = extractAcceptedRound4Answers(item);
                      const isMcq = item.v3CustomMode === 'mcq' && Array.isArray(item.v3CustomChoices) && item.v3CustomChoices.length >= 2;
                      const isBeingEdited = editingIndex === idx;

                      return (
                        <div
                          key={`${item.id || item.word}-${idx}`}
                          data-testid={`game-question-card-${idx}`}
                          className={`rounded-2xl bg-white dark:bg-slate-900 border p-4 shadow-sm transition ${
                            isBeingEdited
                              ? 'border-[#007A7A] ring-2 ring-[#007A7A]/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex gap-3 sm:gap-4">
                            {/* Left Action Rail (Blooket/Quizizz style: Edit / Delete / Duplicate / Order) */}
                            <div className="shrink-0 flex flex-col items-center gap-1.5 w-16 sm:w-20">
                              <button
                                type="button"
                                onClick={() => openEditCardForm(idx)}
                                data-testid={`game-card-edit-${idx}`}
                                className="w-full py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#007A7A] hover:text-[#007A7A] dark:hover:text-[#1EE1D6] text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs transition"
                              >
                                <Edit className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <div className="flex items-center justify-center gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCard(idx)}
                                  data-testid={`game-card-delete-${idx}`}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition"
                                  title="Xóa câu này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateCard(idx)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition"
                                  title="Nhân bản câu này"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveCard(idx, -1)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-25"
                                  title="Đẩy lên"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === items.length - 1}
                                  onClick={() => handleMoveCard(idx, 1)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-25"
                                  title="Đẩy xuống"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Main Card Body */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Card Top Row: Question Number + Word/Meaning + Badges */}
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                                      Question {idx + 1}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white text-xs font-black tracking-wide">
                                      {item.word}
                                    </span>
                                    {item.ipa && (
                                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        {item.ipa}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                                    Nghĩa: {item.prompt}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 dark:bg-slate-700 text-white text-[11px] font-bold">
                                    {isMcq ? <Shuffle className="w-3 h-3" /> : <Keyboard className="w-3 h-3" />}
                                    {isMcq ? 'MCQ + Typing' : 'Syn/Ant + Typing'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 dark:bg-slate-800 text-white text-[11px] font-bold">
                                    <Clock className="w-3 h-3" /> {item.timeSec || 20}s
                                  </span>
                                </div>
                              </div>

                              {/* Round 3 Section Preview (Screenshot 4 style if MCQ, or Syn/Ant pills) */}
                              <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-2.5 space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                  Màn 3 • {isMcq ? 'Trắc nghiệm 4 đáp án' : 'Từ Đồng Nghĩa / Trái Nghĩa'}
                                </div>
                                {isMcq ? (
                                  <>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                      {renderBlankSentencePreview(item.v3CustomQuestion)}
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {item.v3CustomChoices.map((ch, cIdx) => {
                                        const isRight = ch.trim().toLowerCase() === String(item.v3CustomAnswer || '').trim().toLowerCase();
                                        return (
                                          <div
                                            key={cIdx}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                              isRight
                                                ? 'bg-emerald-500 text-white shadow-xs'
                                                : 'bg-slate-200/75 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                          >
                                            {isRight && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                                            <span className="truncate">{ch}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-emerald-800 dark:text-emerald-200 font-bold">
                                      Đồng nghĩa: {item.syn || <em className="opacity-60 font-normal">(chưa nhập)</em>}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-rose-800 dark:text-rose-200 font-bold">
                                      Trái nghĩa: {item.ant || <em className="opacity-60 font-normal">(chưa nhập)</em>}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Round 4 Section Preview (Screenshot 3 style: Sentence with blank + Vivid Green Typing Chips!) */}
                              <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-2.5 space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                  Màn 4 • Hiện câu hỏi &amp; HS gõ đáp án ({v4Answers.length} đáp án chấp nhận)
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                  {renderBlankSentencePreview(v4Sentence)}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {v4Answers.map((ans, aIdx) => (
                                    <span
                                      key={aIdx}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-extrabold shadow-xs"
                                    >
                                      <Keyboard className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                      <span>{ans}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: QUICK BULK COPY-PASTE / EXCEL */}
            {activeTab === 'bulk' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Dán Nhanh Từ Excel / Google Sheets / Word (Hỗ trợ nhiều kiểu định dạng!)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <b className="text-[#007A7A] dark:text-[#1EE1D6]">Kiểu 1 (Đơn giản):</b>
                        <div className="font-mono mt-0.5">ENFORCE - thực thi luật</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <b className="text-sky-600 dark:text-sky-400">Kiểu 2 (Đầy đủ Đồng/Trái nghĩa):</b>
                        <div className="font-mono mt-0.5">ENFORCE | thực thi | /.../ | Ví dụ | IMPOSE | IGNORE</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <b className="text-emerald-600 dark:text-emerald-400">Kiểu 3 (Câu Màn 4 nhiều đáp án):</b>
                        <div className="font-mono mt-0.5">The lack of a ____ hinders action. | unified global framework ;; cohesive global strategy</div>
                      </div>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    data-testid="game-bulk-textarea"
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={`Dán danh sách của bạn vào đây...\nVí dụ:\nMITIGATE | Giảm thiểu | /ˈmɪtɪɡeɪt/ | Policies help mitigate climate change. | ALLEVIATE | AGGRAVATE | mitigate climate change\nThe lack of a ____________ often hinders coordinated action. | unified global framework ;; cohesive global strategy ;; legally binding agreement`}
                    className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4" /> Nhận diện hợp lệ: {bulkParsedPreview.length} câu
                      </span>
                      {bulkRawLinesCount > bulkParsedPreview.length && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> {bulkRawLinesCount - bulkParsedPreview.length} dòng chưa đúng định dạng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyBulk('append')}
                        disabled={bulkParsedPreview.length === 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold transition"
                      >
                        + Thêm Vào Danh Sách Hiện Có ({items.length} → {items.length + bulkParsedPreview.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBulk('replace')}
                        disabled={bulkParsedPreview.length === 0}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold transition"
                      >
                        Thay Thế Toàn Bộ Danh Sách
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI AUTO-GENERATE / EXTRACT FROM TEXT, IMAGE OR PDF */}
            {activeTab === 'ai' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <div
                  onPaste={handleAiPaste}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        AI Tự Tạo Bộ Câu Hỏi 4 Màn Từ Tài Liệu / Ảnh Chụp / PDF
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ném danh sách từ thô, bài đọc, hoặc <b>Ctrl+V ảnh chụp đề Blooket / Quizizz / PDF</b> — AI tự tách câu hỏi Màn 3 &amp; câu gõ Màn 4 nhiều đáp án!
                      </p>
                    </div>

                    <div className="inline-flex rounded-xl overflow-hidden border border-violet-300 dark:border-violet-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setAiMode('auto_4_rounds')}
                        className={`px-3 py-1.5 transition ${
                          aiMode === 'auto_4_rounds'
                            ? 'bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Tự tạo đủ 4 Màn
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiMode('extract_exact')}
                        className={`px-3 py-1.5 transition ${
                          aiMode === 'extract_exact'
                            ? 'bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Trích y nguyên từ Ảnh / PDF
                      </button>
                    </div>
                  </div>

                  {/* Upload / Paste Image & PDF Dropzone */}
                  <div className="p-3.5 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                        <FileUp className="w-4 h-4" /> Ảnh chụp màn hình hoặc File PDF ({aiMediaFiles.length}/8)
                      </span>
                      <button
                        type="button"
                        onClick={() => aiFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold transition"
                      >
                        + Chọn Ảnh / PDF
                      </button>
                      <input
                        ref={aiFileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={e => {
                          handleAddAiFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mẹo: Chụp màn hình câu hỏi Blooket/Quizizz rồi bấm <b>Ctrl+V</b> trực tiếp vào khung này!
                    </p>
                    {aiMediaFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {aiMediaFiles.map((f, fIdx) => (
                          <div
                            key={`${f.name}-${fIdx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            <span className="truncate max-w-[160px]">{f.type === 'application/pdf' ? '📄' : '🖼️'} {f.name}</span>
                            <button
                              type="button"
                              onClick={() => setAiMediaFiles(prev => prev.filter((_, i) => i !== fIdx))}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    rows={6}
                    value={aiRawText}
                    onChange={e => setAiRawText(e.target.value)}
                    placeholder="Hoặc dán danh sách từ tiếng Anh, bài đọc IELTS, ghi chú từ vựng bất kỳ vào đây (không cần dấu |)..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />

                  {aiError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={aiLoading || (!aiRawText.trim() && aiMediaFiles.length === 0)}
                      onClick={() => handleRunAiGenerate('append')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>AI Tạo &amp; Thêm Vào Danh Sách</span>
                    </button>
                    <button
                      type="button"
                      disabled={aiLoading || (!aiRawText.trim() && aiMediaFiles.length === 0)}
                      onClick={() => handleRunAiGenerate('replace')}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>AI Tạo &amp; Thay Thế Toàn Bộ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/35">
              <CheckCircle className="w-3.5 h-3.5" /> Đang có {items.length} câu hỏi sẵn sàng
            </span>
            <span className="hidden md:inline text-slate-400">
              Áp dụng đồng bộ cho Màn 1, Màn 2, Màn 3 (Đồng/Trái nghĩa &amp; MCQ) và Màn 4 (Typing)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              data-testid="game-bank-save-room-btn"
              onClick={handleFinalSaveToRoom}
              disabled={items.length === 0}
              className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-40 text-white text-xs font-extrabold shadow-md inline-flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu &amp; Áp Dụng Vào Phòng {currentRoomPin ? `#${currentRoomPin}` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
