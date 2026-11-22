import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardPaste,
  Edit3,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  HardDrive,
  LayoutGrid,
  List,
  Loader2,
  Play,
  Plus,
  Search,
  Share2,
  Shuffle,
  Trash2,
  Upload,
  Users,
  X
} from 'lucide-react';
import {
  buildTransientSpeakingPracticeTest,
  extractSpeakingQuestionsFromPdf,
  normalizeSpeakingForecastBank,
  parsePastedSpeakingQuestions
} from '../../constants/speakingForecast';
import AssignFolderModal from '../modals/AssignFolderModal';

function readPdfAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file PDF.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function getAssignedClassLabels(assignedClassIds = [], classesDb = {}) {
  if (!Array.isArray(assignedClassIds) || assignedClassIds.length === 0) return [];
  return assignedClassIds
    .map(cid => classesDb?.[cid])
    .filter(Boolean)
    .map(cls => ({ id: cls.id, name: cls.name }));
}

export default function SpeakingForecastZone({
  aiApiKey = '',
  aiConfigured = false,
  bank: bankProp = null,
  classesDb = {},
  isTeacher = false,
  onSaveBank,
  onStartPracticeTest,
  showToast,
  speakingForecast = null,
  zoneKey = 'forecast' // 'daily' | 'forecast'
}) {
  const bank = useMemo(
    () => normalizeSpeakingForecastBank(speakingForecast || bankProp),
    [speakingForecast, bankProp]
  );
  const zoneData = bank[zoneKey] || bank.forecast;

  const [partTab, setPartTab] = useState('part1'); // 'part1' | 'part2' | 'part3' | 'part3_random'
  // null = Drive Folder Grid (all groups in Part); string = opened Group ID
  const [openedGroupIdByPart, setOpenedGroupIdByPart] = useState({
    part1: null,
    part2: null,
    part3: null
  });
  const [selectedFolderIdByGroup, setSelectedFolderIdByGroup] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // Teacher editing states
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState('append_folder'); // 'append_folder' | 'new_folder'
  const [newImportFolderName, setNewImportFolderName] = useState('');
  const [pdfExtracting, setPdfExtracting] = useState(false);

  // Bulk Assign Folder to Classes modal state
  // { scope: 'part' | 'group' | 'folder', groupId?: string, folderId?: string, label: string, count: number, unit: string, initialClassIds: string[] }
  const [assignModalTarget, setAssignModalTarget] = useState(null);

  // Part 3 Random Practice states
  const [randomScopeGroupIds, setRandomScopeGroupIds] = useState([]);
  const [randomCount, setRandomCount] = useState(6);
  const [randomSeed, setRandomSeed] = useState(1);

  const activePartKey = partTab === 'part3_random' ? 'part3' : partTab;
  const activePartNumber = activePartKey === 'part1' ? 1 : activePartKey === 'part2' ? 2 : 3;
  const groups = Array.isArray(zoneData?.[activePartKey]) ? zoneData[activePartKey] : [];
  const openedGroupId = openedGroupIdByPart[activePartKey] || null;

  const activeGroup = useMemo(
    () => (openedGroupId ? groups.find(g => g.id === openedGroupId) || null : null),
    [groups, openedGroupId]
  );

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g => {
      if (String(g.name || '').toLowerCase().includes(q)) return true;
      return (g.folders || []).some(
        f =>
          String(f.name || '').toLowerCase().includes(q) ||
          (f.questions || []).some(item => String(item.prompt || '').toLowerCase().includes(q))
      );
    });
  }, [groups, searchQuery]);

  const filteredFolders = useMemo(() => {
    const folders = Array.isArray(activeGroup?.folders) ? activeGroup.folders : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(
      f =>
        String(f.name || '').toLowerCase().includes(q) ||
        (f.questions || []).some(item => String(item.prompt || '').toLowerCase().includes(q))
    );
  }, [activeGroup, searchQuery]);

  const activeFolder = useMemo(() => {
    if (!activeGroup) return null;
    const pickedId = selectedFolderIdByGroup[activeGroup.id];
    return (
      filteredFolders.find(f => f.id === pickedId) ||
      filteredFolders[0] ||
      (activeGroup.folders || [])[0] ||
      null
    );
  }, [activeGroup, filteredFolders, selectedFolderIdByGroup]);

  const commitUpdatedGroups = async (partKeyToUpdate, nextGroups, toastMsg = '') => {
    const nextBank = {
      ...bank,
      [zoneKey]: {
        ...zoneData,
        [partKeyToUpdate]: nextGroups
      }
    };
    await onSaveBank?.(nextBank);
    if (toastMsg) showToast?.(toastMsg, 'success');
  };

  // Teacher CRUD: Groups
  const handleAddGroup = async () => {
    const nextNum = groups.length + 1;
    const newGroup = {
      id: `${activePartKey}_g_${Date.now()}`,
      name: `Nhóm ${nextNum}: Chủ đề mới`,
      assignedClassIds: [],
      folders: [
        {
          id: `${activePartKey}_f_${Date.now()}`,
          name: 'Thư mục mới',
          assignedClassIds: [],
          questions: []
        }
      ]
    };
    await commitUpdatedGroups(activePartKey, [...groups, newGroup], `Đã thêm ${newGroup.name}!`);
    setEditingGroupId(newGroup.id);
    setEditingGroupName(newGroup.name);
  };

  const handleRenameGroup = async (groupId) => {
    const clean = editingGroupName.trim();
    if (!clean) {
      setEditingGroupId(null);
      return;
    }
    const nextGroups = groups.map(g => (g.id === groupId ? { ...g, name: clean } : g));
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã đổi tên thư mục nhóm!');
    setEditingGroupId(null);
  };

  const handleDeleteGroup = async (groupId) => {
    if (groups.length <= 1) {
      showToast?.('Mỗi phần cần giữ lại ít nhất 1 nhóm.', 'info');
      return;
    }
    const nextGroups = groups.filter(g => g.id !== groupId);
    if (openedGroupId === groupId) {
      setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: null }));
    }
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã xóa nhóm!');
  };

  // Teacher CRUD: Subfolders / Topics
  const handleAddFolder = async () => {
    if (!activeGroup) return;
    const nextNum = (activeGroup.folders || []).length + 1;
    const newFolder = {
      id: `${activeGroup.id}_f_${Date.now()}`,
      name: `Topic mới #${nextNum}`,
      assignedClassIds: [],
      questions: []
    };
    const nextGroups = groups.map(g =>
      g.id === activeGroup.id ? { ...g, folders: [...(g.folders || []), newFolder] } : g
    );
    await commitUpdatedGroups(activePartKey, nextGroups, `Đã tạo thư mục con "${newFolder.name}"!`);
    setSelectedFolderIdByGroup(prev => ({ ...prev, [activeGroup.id]: newFolder.id }));
    setEditingFolderId(newFolder.id);
    setEditingFolderName(newFolder.name);
  };

  const handleRenameFolder = async (folderId) => {
    if (!activeGroup) return;
    const clean = editingFolderName.trim();
    if (!clean) {
      setEditingFolderId(null);
      return;
    }
    const nextGroups = groups.map(g =>
      g.id === activeGroup.id
        ? { ...g, folders: (g.folders || []).map(f => (f.id === folderId ? { ...f, name: clean } : f)) }
        : g
    );
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã đổi tên thư mục con!');
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (folderId) => {
    if (!activeGroup) return;
    const nextGroups = groups.map(g =>
      g.id === activeGroup.id
        ? { ...g, folders: (g.folders || []).filter(f => f.id !== folderId) }
        : g
    );
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã xóa thư mục con!');
  };

  // Bulk Class Assignment for Speaking Part / Group / Subfolder
  const handleConfirmSpeakingAssign = async ({ assignedClassIds, mode }) => {
    if (!assignModalTarget) return;
    const applyIds = (prevIds = []) => {
      const prev = Array.isArray(prevIds) ? prevIds : [];
      if (mode === 'add') {
        return assignedClassIds.length === 0 ? [] : Array.from(new Set([...prev, ...assignedClassIds]));
      }
      if (mode === 'remove') {
        const rem = new Set(assignedClassIds);
        return prev.filter(id => !rem.has(id));
      }
      return assignedClassIds;
    };

    let nextGroups = groups;
    if (assignModalTarget.scope === 'part') {
      nextGroups = groups.map(g => ({ ...g, assignedClassIds: applyIds(g.assignedClassIds) }));
    } else if (assignModalTarget.scope === 'group') {
      nextGroups = groups.map(g =>
        g.id === assignModalTarget.groupId ? { ...g, assignedClassIds: applyIds(g.assignedClassIds) } : g
      );
    } else if (assignModalTarget.scope === 'folder') {
      nextGroups = groups.map(g =>
        g.id === assignModalTarget.groupId
          ? {
              ...g,
              folders: (g.folders || []).map(f =>
                f.id === assignModalTarget.folderId
                  ? { ...f, assignedClassIds: applyIds(f.assignedClassIds) }
                  : f
              )
            }
          : g
      );
    }

    const scopeMsg =
      assignedClassIds.length > 0
        ? `Đã giao "${assignModalTarget.label}" cho ${assignedClassIds.length} lớp học!`
        : `Đã mở "${assignModalTarget.label}" cho tất cả học viên!`;
    await commitUpdatedGroups(activePartKey, nextGroups, scopeMsg);
  };

  // Teacher CRUD: Questions (Paste / PDF / Delete)
  const handleApplyPastedQuestions = async () => {
    if (!activeGroup) return;
    const parsed = parsePastedSpeakingQuestions(pasteText, activePartNumber);
    if (parsed.length === 0) {
      showToast?.('Không tìm thấy câu hỏi hợp lệ trong nội dung đã dán.', 'error');
      return;
    }

    let nextGroups;
    if (importMode === 'new_folder' || !activeFolder) {
      const folderName = newImportFolderName.trim() || `Topic ${new Date().toLocaleDateString('vi-VN')}`;
      const createdFolder = {
        id: `${activeGroup.id}_f_${Date.now()}`,
        name: folderName,
        assignedClassIds: [],
        questions: parsed
      };
      nextGroups = groups.map(g =>
        g.id === activeGroup.id ? { ...g, folders: [...(g.folders || []), createdFolder] } : g
      );
      setSelectedFolderIdByGroup(prev => ({ ...prev, [activeGroup.id]: createdFolder.id }));
    } else {
      nextGroups = groups.map(g =>
        g.id === activeGroup.id
          ? {
              ...g,
              folders: (g.folders || []).map(f =>
                f.id === activeFolder.id
                  ? { ...f, questions: [...(f.questions || []), ...parsed] }
                  : f
              )
            }
          : g
      );
    }

    await commitUpdatedGroups(activePartKey, nextGroups, `Đã thêm ${parsed.length} câu hỏi vào ${activeGroup.name}!`);
    setPasteText('');
    setNewImportFolderName('');
    setShowImportPanel(false);
  };

  const handleUploadSpeakingPdf = async (file) => {
    if (!file || !activeGroup) return;
    if (!file.name?.toLowerCase().endsWith('.pdf')) {
      showToast?.('Vui lòng chọn file định dạng .PDF', 'error');
      return;
    }
    if (!aiApiKey?.trim() && !aiConfigured) {
      showToast?.('Chưa cấu hình Gemini API Key để đọc file PDF tự động.', 'error');
      return;
    }
    setPdfExtracting(true);
    try {
      const pdfDataUrl = await readPdfAsDataUrl(file);
      const extractedFolders = await extractSpeakingQuestionsFromPdf({
        apiKey: aiApiKey,
        pdfDataUrl,
        partNumber: activePartNumber,
        groupName: activeGroup.name
      });
      if (!extractedFolders.length) {
        showToast?.('AI không trích xuất được câu hỏi từ file PDF này.', 'error');
        return;
      }
      const totalQs = extractedFolders.reduce((sum, f) => sum + (f.questions?.length || 0), 0);
      const nextGroups = groups.map(g =>
        g.id === activeGroup.id
          ? { ...g, folders: [...(g.folders || []), ...extractedFolders] }
          : g
      );
      await commitUpdatedGroups(
        activePartKey,
        nextGroups,
        `AI đã trích xuất ${extractedFolders.length} thư mục (${totalQs} câu hỏi) từ PDF!`
      );
      setSelectedFolderIdByGroup(prev => ({ ...prev, [activeGroup.id]: extractedFolders[0].id }));
      setShowImportPanel(false);
    } catch (err) {
      showToast?.(err?.message || 'Lỗi khi trích xuất câu hỏi từ PDF.', 'error');
    } finally {
      setPdfExtracting(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!activeGroup || !activeFolder) return;
    const nextGroups = groups.map(g =>
      g.id === activeGroup.id
        ? {
            ...g,
            folders: (g.folders || []).map(f =>
              f.id === activeFolder.id
                ? { ...f, questions: (f.questions || []).filter(q => q.id !== qId) }
                : f
            )
          }
        : g
    );
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã xóa câu hỏi.');
  };

  // Part 3 Random Pool Builder
  const part3Groups = Array.isArray(zoneData?.part3) ? zoneData.part3 : [];
  const randomPart3Pool = useMemo(() => {
    const scopeSet = new Set(randomScopeGroupIds);
    const items = [];
    part3Groups.forEach(g => {
      if (scopeSet.size > 0 && !scopeSet.has(g.id)) return;
      (g.folders || []).forEach(f => {
        (f.questions || []).forEach(q => {
          if (q?.prompt) {
            items.push({ ...q, topic: `${g.name} · ${f.name}` });
          }
        });
      });
    });
    return items;
  }, [part3Groups, randomScopeGroupIds]);

  const previewRandomPart3Questions = useMemo(() => {
    if (!randomPart3Pool.length) return [];
    const copy = [...randomPart3Pool];
    let s = randomSeed * 9301 + 49297;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(copy.length, Math.max(1, Number(randomCount) || 6)));
  }, [randomPart3Pool, randomCount, randomSeed]);

  const handleStartFolderPractice = (targetFolder = activeFolder) => {
    if (!targetFolder || !(targetFolder.questions || []).length) {
      showToast?.('Thư mục này chưa có câu hỏi nào để luyện tập.', 'info');
      return;
    }
    const testPayload = buildTransientSpeakingPracticeTest({
      title: `${zoneKey === 'daily' ? 'Daily' : 'Forecast'} Part ${activePartNumber}: ${targetFolder.name}`,
      partNumber: activePartNumber,
      topicName: targetFolder.name,
      questions: targetFolder.questions,
      zone: zoneKey
    });
    onStartPracticeTest?.(testPayload, `part${activePartNumber}`);
  };

  const handleStartGroupRandomPractice = (targetGroup = activeGroup) => {
    if (!targetGroup) return;
    const allQs = (targetGroup.folders || []).flatMap(f =>
      (f.questions || []).map(q => ({ ...q, topic: f.name }))
    );
    if (allQs.length === 0) {
      showToast?.('Nhóm này chưa có câu hỏi nào để random.', 'info');
      return;
    }
    const shuffled = [...allQs].sort(() => Math.random() - 0.5).slice(0, Math.min(allQs.length, 8));
    const testPayload = buildTransientSpeakingPracticeTest({
      title: `Random Part ${activePartNumber} · ${targetGroup.name}`,
      partNumber: activePartNumber,
      topicName: targetGroup.name,
      questions: shuffled,
      zone: zoneKey
    });
    onStartPracticeTest?.(testPayload, `part${activePartNumber}`);
  };

  const handleStartRandomPart3 = () => {
    if (!previewRandomPart3Questions.length) {
      showToast?.('Chưa có câu hỏi Part 3 nào trong nhóm đã chọn.', 'info');
      return;
    }
    const testPayload = buildTransientSpeakingPracticeTest({
      title: `Random Part 3 (${previewRandomPart3Questions.length} câu hỏi)`,
      partNumber: 3,
      topicName: 'Random Part 3',
      questions: previewRandomPart3Questions,
      zone: zoneKey
    });
    onStartPracticeTest?.(testPayload, 'part3');
  };

  const zoneTitle = zoneKey === 'daily' ? 'Daily Speaking Drive' : 'Kho Forecast Drive';
  const partTitleLabel = `Part ${activePartNumber}`;

  return (
    <section className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* GOOGLE DRIVE TOP BAR: Part Tabs + Mode Pill */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'part1', label: 'Part 1', count: `${(zoneData?.part1 || []).length} thư mục` },
            { id: 'part2', label: 'Part 2', count: `${(zoneData?.part2 || []).length} thư mục` },
            { id: 'part3', label: 'Part 3', count: `${(zoneData?.part3 || []).length} thư mục` },
            { id: 'part3_random', label: '🎲 Random Part 3', count: `${randomPart3Pool.length} câu` }
          ].map(tab => {
            const active = partTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPartTab(tab.id);
                  setSearchQuery('');
                  setShowImportPanel(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition inline-flex items-center gap-1.5 ${
                  active
                    ? tab.id === 'part3_random'
                      ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                      : 'bg-[#B91C1C] text-white border-[#B91C1C] shadow-sm'
                    : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
          Không đếm ngược · Xem câu hỏi · Thu âm lại thoải mái
        </span>
      </div>

      {/* DRIVE CONTENT BODY */}
      <div className="p-4 sm:p-6 space-y-5">
        {partTab === 'part3_random' ? (
          /* SPECIAL MODE: PART 3 RANDOM PRACTICE */
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                  Luyện Câu Hỏi Random — Speaking Part 3 ({part3Groups.length} Nhóm)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Chọn 1 hoặc nhiều thư mục bên dưới (hoặc để trống để trộn toàn bộ), hệ thống tự bốc câu hỏi ngẫu nhiên để luyện nói tự do.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={randomCount}
                  onChange={e => setRandomCount(Number(e.target.value) || 6)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {[3, 5, 6, 8, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n} câu ngẫu nhiên</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setRandomSeed(s => s + 1)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Trộn lại
                </button>
                <button
                  type="button"
                  onClick={handleStartRandomPart3}
                  disabled={previewRandomPart3Questions.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu Random
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRandomScopeGroupIds([])}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 transition ${
                  randomScopeGroupIds.length === 0
                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                }`}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="truncate">Tất cả {part3Groups.length} nhóm ({randomPart3Pool.length} câu)</span>
              </button>
              {part3Groups.map(g => {
                const selected = randomScopeGroupIds.includes(g.id);
                const qTotal = (g.folders || []).reduce((acc, f) => acc + (f.questions?.length || 0), 0);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setRandomScopeGroupIds(prev =>
                        prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]
                      )
                    }
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left flex items-center justify-between gap-2 transition ${
                      selected
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Folder className={`w-4 h-4 shrink-0 ${selected ? 'text-teal-100' : 'text-amber-500'}`} />
                      <span className="truncate">{g.name}</span>
                    </span>
                    <span className={`text-[11px] shrink-0 px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {qTotal}
                    </span>
                  </button>
                );
              })}
            </div>

            {previewRandomPart3Questions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                Chưa có câu hỏi Part 3 nào trong phạm vi đã chọn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previewRandomPart3Questions.map((q, idx) => (
                  <div
                    key={`${q.id}_${idx}`}
                    className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {q.topic}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                      {q.prompt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* GOOGLE DRIVE FILE EXPLORER */
          <>
            {/* Drive Breadcrumb + Search + View Toggle + Bulk Assign Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              {/* Breadcrumb */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-bold min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: null }));
                    setShowImportPanel(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                    !activeGroup
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                  <span>{zoneTitle}</span>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: null }));
                    setShowImportPanel(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    !activeGroup
                      ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {partTitleLabel} ({groups.length} thư mục)
                </button>
                {activeGroup && (
                  <>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] inline-flex items-center gap-1.5 truncate max-w-[260px]">
                      <FolderOpen className="w-4 h-4 shrink-0" />
                      <span className="truncate">{activeGroup.name}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Right Drive Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={activeGroup ? 'Tìm topic hoặc câu hỏi...' : 'Tìm thư mục trong Drive...'}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
                  />
                </div>

                {!activeGroup && (
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      title="Hiển thị dạng lưới thư mục"
                      className={`p-2 transition ${
                        viewMode === 'grid'
                          ? 'bg-[#007A7A] text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      title="Hiển thị dạng danh sách"
                      className={`p-2 transition ${
                        viewMode === 'list'
                          ? 'bg-[#007A7A] text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isTeacher && !activeGroup && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAssignModalTarget({
                          scope: 'part',
                          label: `${zoneTitle} • Toàn bộ ${partTitleLabel}`,
                          count: groups.length,
                          unit: 'nhóm',
                          initialClassIds: []
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                      title="Giao toàn bộ các nhóm trong Part này cho 1 hoặc nhiều lớp"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Giao Cả {partTitleLabel} Cho Lớp
                    </button>
                    <button
                      type="button"
                      onClick={handleAddGroup}
                      className="px-3 py-1.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> + Tạo Thư Mục
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* LEVEL 1: GOOGLE DRIVE FOLDER GRID / LIST (ALL GROUPS IN PART) */}
            {!activeGroup ? (
              filteredGroups.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <Folder className="w-9 h-9 mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Không tìm thấy thư mục nào phù hợp.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'Thử xóa từ khóa tìm kiếm để xem toàn bộ thư mục.' : 'Chưa có thư mục nào được giao cho lớp bạn trong mục này.'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGroups.map(g => {
                    const folderCount = (g.folders || []).length;
                    const qCount = (g.folders || []).reduce((sum, f) => sum + (f.questions?.length || 0), 0);
                    const assignedClasses = getAssignedClassLabels(g.assignedClassIds, classesDb);
                    const isEditing = editingGroupId === g.id;

                    return (
                      <div
                        key={g.id}
                        className="group rounded-2xl bg-slate-50/75 dark:bg-slate-900/75 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-[#007A7A] dark:hover:border-[#1EE1D6] p-4 flex flex-col justify-between gap-3 transition shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                            className="w-11 h-11 rounded-xl bg-amber-100/90 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition"
                          >
                            <Folder className="w-6 h-6 fill-current/25" />
                          </button>

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingGroupName}
                                  onChange={e => setEditingGroupName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleRenameGroup(g.id);
                                    if (e.key === 'Escape') setEditingGroupId(null);
                                  }}
                                  className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-[#007A7A] text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameGroup(g.id)}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                                className="text-left w-full"
                              >
                                <p className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-[#1EE1D6] line-clamp-2 leading-snug">
                                  {g.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {folderCount} thư mục con · <b>{qCount}</b> câu hỏi
                                </p>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Class assignment pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {assignedClasses.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <Globe className="w-3 h-3" /> Tất cả HS
                            </span>
                          ) : (
                            assignedClasses.map(cls => (
                              <span
                                key={cls.id}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40"
                              >
                                <Users className="w-3 h-3" /> Lớp {cls.name}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Drive Card Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                              className="px-2.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition"
                            >
                              Mở thư mục
                            </button>
                            {qCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleStartGroupRandomPractice(g)}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition"
                                title="Luyện random câu hỏi trong nhóm này"
                              >
                                <Shuffle className="w-3 h-3" /> Random
                              </button>
                            )}
                          </div>

                          {isTeacher && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setAssignModalTarget({
                                    scope: 'group',
                                    groupId: g.id,
                                    label: g.name,
                                    count: folderCount,
                                    unit: 'thư mục con',
                                    initialClassIds: g.assignedClassIds || []
                                  })
                                }
                                className="px-2 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold inline-flex items-center gap-1 transition"
                                title="Giao cả thư mục này cho lớp"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Giao lớp
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGroupId(g.id);
                                  setEditingGroupName(g.name);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700"
                                title="Đổi tên thư mục"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {groups.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGroup(g.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                                  title="Xóa thư mục"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* GOOGLE DRIVE LIST VIEW */
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="col-span-5">Tên thư mục</span>
                    <span className="col-span-2">Nội dung</span>
                    <span className="col-span-3">Lớp được giao</span>
                    <span className="col-span-2 text-right">Thao tác</span>
                  </div>
                  {filteredGroups.map(g => {
                    const folderCount = (g.folders || []).length;
                    const qCount = (g.folders || []).reduce((sum, f) => sum + (f.questions?.length || 0), 0);
                    const assignedClasses = getAssignedClassLabels(g.assignedClassIds, classesDb);
                    return (
                      <div
                        key={g.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 items-center bg-white dark:bg-[#0F172B] hover:bg-slate-50 dark:hover:bg-slate-900/70 transition"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                          className="sm:col-span-5 flex items-center gap-2.5 text-left min-w-0"
                        >
                          <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-[#0F766E] dark:hover:text-[#1EE1D6]">
                            {g.name}
                          </span>
                        </button>
                        <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
                          {folderCount} mục · {qCount} câu
                        </div>
                        <div className="sm:col-span-3 flex flex-wrap gap-1">
                          {assignedClasses.length === 0 ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">Tất cả HS</span>
                          ) : (
                            assignedClasses.map(c => (
                              <span
                                key={c.id}
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200"
                              >
                                Lớp {c.name}
                              </span>
                            ))
                          )}
                        </div>
                        <div className="sm:col-span-2 flex items-center sm:justify-end gap-1">
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={() =>
                                setAssignModalTarget({
                                  scope: 'group',
                                  groupId: g.id,
                                  label: g.name,
                                  count: folderCount,
                                  unit: 'thư mục con',
                                  initialClassIds: g.assignedClassIds || []
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                            >
                              Giao lớp
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                            className="px-2.5 py-1 rounded-lg bg-[#007A7A] text-white text-xs font-bold"
                          >
                            Mở
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* LEVEL 2: INSIDE AN OPENED GROUP FOLDER (SUBFOLDERS + SPACIOUS QUESTION VIEW) */
              <div className="space-y-5">
                {/* Group Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenedGroupIdByPart(prev => ({ ...prev, [activePartKey]: null }));
                        setShowImportPanel(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Tất cả thư mục
                    </button>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {activeGroup.name}
                    </h3>
                    {(() => {
                      const clsList = getAssignedClassLabels(activeGroup.assignedClassIds, classesDb);
                      return clsList.length === 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Tất cả HS
                        </span>
                      ) : (
                        clsList.map(cls => (
                          <span
                            key={cls.id}
                            className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40"
                          >
                            Lớp {cls.name}
                          </span>
                        ))
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isTeacher && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignModalTarget({
                              scope: 'group',
                              groupId: activeGroup.id,
                              label: activeGroup.name,
                              count: (activeGroup.folders || []).length,
                              unit: 'thư mục con',
                              initialClassIds: activeGroup.assignedClassIds || []
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Giao Nhóm Cho Lớp
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImportPanel(v => !v)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition ${
                            showImportPanel
                              ? 'bg-[#007A7A] text-white border-[#007A7A]'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#007A7A]'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" /> Ném PDF / Copy Câu Hỏi
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartGroupRandomPractice(activeGroup)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Random nhóm này
                    </button>
                  </div>
                </div>

                {/* Subfolder Drive Chips Row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Thư mục con / Topics ({filteredFolders.length})
                    </span>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={handleAddFolder}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-500/15 hover:bg-teal-100 dark:hover:bg-teal-500/25 border border-teal-200 dark:border-teal-500/40 text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] inline-flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tạo thư mục con
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredFolders.map(f => {
                      const isActive = activeFolder?.id === f.id;
                      const isEditing = editingFolderId === f.id;
                      const fClasses = getAssignedClassLabels(f.assignedClassIds, classesDb);
                      return (
                        <div
                          key={f.id}
                          className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 transition ${
                            isActive
                              ? 'bg-teal-50/90 dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6] shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingFolderName}
                                onChange={e => setEditingFolderName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameFolder(f.id);
                                  if (e.key === 'Escape') setEditingFolderId(null);
                                }}
                                className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-[#007A7A] text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameFolder(f.id)}
                                className="p-1 rounded-lg bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedFolderIdByGroup(prev => ({ ...prev, [activeGroup.id]: f.id }))}
                              className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                            >
                              {isActive ? (
                                <FolderOpen className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                              ) : (
                                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                  {f.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {(f.questions || []).length} câu hỏi
                                  {fClasses.length > 0 ? ` · ${fClasses.map(c => `Lớp ${c.name}`).join(', ')}` : ''}
                                </p>
                              </div>
                            </button>
                          )}

                          {isTeacher && !isEditing && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setAssignModalTarget({
                                    scope: 'folder',
                                    groupId: activeGroup.id,
                                    folderId: f.id,
                                    label: `${activeGroup.name} / ${f.name}`,
                                    count: (f.questions || []).length,
                                    unit: 'câu hỏi',
                                    initialClassIds: f.assignedClassIds || []
                                  })
                                }
                                className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20"
                                title="Giao riêng thư mục con này cho lớp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFolderId(f.id);
                                  setEditingFolderName(f.name);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                title="Đổi tên thư mục con"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(f.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                                title="Xóa thư mục con"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher PDF Drop & Copy-Paste Drawer */}
                {isTeacher && showImportPanel && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6] flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Nhập câu hỏi cho {activeGroup.name} (Part {activePartNumber})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowImportPanel(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* PDF Upload / Drop */}
                      <label className="cursor-pointer rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-600/60 bg-white dark:bg-slate-950/60 hover:border-teal-500 p-4 flex flex-col items-center justify-center text-center gap-2 transition">
                        {pdfExtracting ? (
                          <>
                            <Loader2 className="w-6 h-6 text-[#007A7A] animate-spin" />
                            <p className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">
                              AI đang đọc PDF &amp; tách thư mục câu hỏi...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[#007A7A] dark:text-[#1EE1D6]" />
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                              Ném / Chọn File PDF Đề Speaking Part {activePartNumber}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              AI tự nhận diện từng Topic thành thư mục con &amp; trích toàn bộ câu hỏi.
                            </p>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={pdfExtracting}
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) handleUploadSpeakingPdf(f);
                          }}
                        />
                      </label>

                      {/* Direct Copy-Paste */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                            <ClipboardPaste className="w-3.5 h-3.5 text-[#007A7A]" /> Hoặc Copy-Paste thẳng vào đây:
                          </span>
                          <select
                            value={importMode}
                            onChange={e => setImportMode(e.target.value)}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                          >
                            <option value="append_folder">Thêm vào "{activeFolder?.name || 'thư mục hiện tại'}"</option>
                            <option value="new_folder">Tạo thư mục con mới</option>
                          </select>
                        </div>

                        {importMode === 'new_folder' && (
                          <input
                            type="text"
                            value={newImportFolderName}
                            onChange={e => setNewImportFolderName(e.target.value)}
                            placeholder="Tên thư mục con mới (VD: Watches, Dreams...)..."
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        )}

                        <textarea
                          rows={4}
                          value={pasteText}
                          onChange={e => setPasteText(e.target.value)}
                          placeholder={
                            activePartNumber === 2
                              ? 'Dán Cue Card Part 2 (cách nhau bởi dòng trống):\nDescribe a quiet place you like...\n- Where it is\n- How often you go there'
                              : 'Dán mỗi câu hỏi 1 dòng:\n1. Do you like wearing watches?\n2. Have you ever received a watch as a gift?'
                          }
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleApplyPastedQuestions}
                            disabled={!pasteText.trim()}
                            className="px-4 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-40 text-white text-xs font-extrabold transition"
                          >
                            + Lưu Câu Hỏi Đã Dán
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Subfolder Question Cards (Spacious 1-2 col Drive Preview) */}
                {activeFolder && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <FolderOpen className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {activeFolder.name}
                        </h4>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {(activeFolder.questions || []).length} câu hỏi
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartFolderPractice(activeFolder)}
                        disabled={!(activeFolder.questions || []).length}
                        className="px-5 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu luyện Topic này
                      </button>
                    </div>

                    {(activeFolder.questions || []).length === 0 ? (
                      <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Thư mục "{activeFolder.name}" chưa có câu hỏi nào.
                        </p>
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => setShowImportPanel(true)}
                            className="px-3.5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Ném PDF hoặc Copy câu hỏi vào ngay
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(activeFolder.questions || []).map((q, qIdx) => (
                          <div
                            key={q.id || qIdx}
                            className="group relative p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#007A7A] transition space-y-2"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed flex-1 pr-5">
                                {q.prompt}
                              </p>
                            </div>
                            {Array.isArray(q.bullets) && q.bullets.length > 0 && (
                              <ul className="pl-9 space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc">
                                {q.bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            )}
                            {isTeacher && (
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Class Assignment Modal for Speaking Drive Folders */}
      <AssignFolderModal
        isOpen={Boolean(assignModalTarget)}
        folderLabel={assignModalTarget?.label || ''}
        itemCount={assignModalTarget?.count || 0}
        itemUnit={assignModalTarget?.unit || 'nhóm'}
        classesDb={classesDb}
        initialClassIds={assignModalTarget?.initialClassIds || []}
        showModeToggle={assignModalTarget?.scope === 'part'}
        showPublishOption={false}
        showNotifyOption={false}
        subtitle={
          assignModalTarget?.scope === 'part'
            ? `Giao một lượt toàn bộ ${assignModalTarget.count} thư mục nhóm trong Part ${activePartNumber} cho lớp học.`
            : 'Chỉ học viên trong lớp được chọn (hoặc Tất cả học viên) mới nhìn thấy thư mục Speaking này.'
        }
        onClose={() => setAssignModalTarget(null)}
        onConfirm={handleConfirmSpeakingAssign}
      />
    </section>
  );
}
