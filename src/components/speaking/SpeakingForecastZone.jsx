import { useMemo, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Edit3,
  FileText,
  FolderPlus,
  Loader2,
  Play,
  Plus,
  Search,
  Shuffle,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import {
  buildTransientSpeakingPracticeTest,
  extractSpeakingQuestionsFromPdf,
  normalizeSpeakingForecastBank,
  parsePastedSpeakingQuestions
} from '../../constants/speakingForecast';

function readPdfAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file PDF.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export default function SpeakingForecastZone({
  aiApiKey = '',
  aiConfigured = false,
  isTeacher = false,
  onSaveBank,
  onStartPracticeTest,
  showToast,
  speakingForecast = null,
  zoneKey = 'forecast' // 'daily' | 'forecast'
}) {
  const bank = useMemo(() => normalizeSpeakingForecastBank(speakingForecast), [speakingForecast]);
  const zoneData = bank[zoneKey] || bank.forecast;

  const [partTab, setPartTab] = useState('part1'); // 'part1' | 'part2' | 'part3' | 'part3_random'
  const [selectedGroupIdByPart, setSelectedGroupIdByPart] = useState({
    part1: '',
    part2: '',
    part3: ''
  });
  const [selectedFolderIdByGroup, setSelectedFolderIdByGroup] = useState({});
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

  // Part 3 Random Practice states
  const [randomScopeGroupIds, setRandomScopeGroupIds] = useState([]); // empty = all 14 groups
  const [randomCount, setRandomCount] = useState(6);
  const [randomSeed, setRandomSeed] = useState(1);

  const activePartKey = partTab === 'part3_random' ? 'part3' : partTab;
  const activePartNumber = activePartKey === 'part1' ? 1 : activePartKey === 'part2' ? 2 : 3;
  const groups = Array.isArray(zoneData?.[activePartKey]) ? zoneData[activePartKey] : [];

  const activeGroup = useMemo(() => {
    const pickedId = selectedGroupIdByPart[activePartKey];
    return groups.find(g => g.id === pickedId) || groups[0] || null;
  }, [groups, selectedGroupIdByPart, activePartKey]);

  const filteredFolders = useMemo(() => {
    const folders = Array.isArray(activeGroup?.folders) ? activeGroup.folders : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
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
      folders: [
        {
          id: `${activePartKey}_f_${Date.now()}`,
          name: 'Thư mục mới',
          questions: []
        }
      ]
    };
    await commitUpdatedGroups(activePartKey, [...groups, newGroup], `Đã thêm ${newGroup.name}!`);
    setSelectedGroupIdByPart(prev => ({ ...prev, [activePartKey]: newGroup.id }));
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
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã đổi tên nhóm!');
    setEditingGroupId(null);
  };

  const handleDeleteGroup = async (groupId) => {
    if (groups.length <= 1) {
      showToast?.('Mỗi phần cần giữ lại ít nhất 1 nhóm.', 'info');
      return;
    }
    const nextGroups = groups.filter(g => g.id !== groupId);
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã xóa nhóm!');
  };

  // Teacher CRUD: Subfolders / Topics
  const handleAddFolder = async () => {
    if (!activeGroup) return;
    const nextNum = (activeGroup.folders || []).length + 1;
    const newFolder = {
      id: `${activeGroup.id}_f_${Date.now()}`,
      name: `Topic mới #${nextNum}`,
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
    await commitUpdatedGroups(activePartKey, nextGroups, 'Đã đổi tên thư mục!');
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
    // Deterministic-ish shuffle seeded by randomSeed so clicking "Trộn lại" updates preview cleanly
    let s = randomSeed * 9301 + 49297;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(copy.length, Math.max(1, Number(randomCount) || 6)));
  }, [randomPart3Pool, randomCount, randomSeed]);

  const handleStartFolderPractice = () => {
    if (!activeFolder || !(activeFolder.questions || []).length) {
      showToast?.('Thư mục này chưa có câu hỏi nào để luyện tập.', 'info');
      return;
    }
    const testPayload = buildTransientSpeakingPracticeTest({
      title: `${zoneKey === 'daily' ? 'Daily' : 'Forecast'} Part ${activePartNumber}: ${activeFolder.name}`,
      partNumber: activePartNumber,
      topicName: activeFolder.name,
      questions: activeFolder.questions,
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

  return (
    <section className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
      {/* Top Bar: Part 1 (6) | Part 2 (4) | Part 3 (14) | Random Part 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'part1', label: 'Part 1', count: `${(zoneData?.part1 || []).length} nhóm` },
            { id: 'part2', label: 'Part 2', count: `${(zoneData?.part2 || []).length} nhóm` },
            { id: 'part3', label: 'Part 3', count: `${(zoneData?.part3 || []).length} nhóm` },
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
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
            Không đếm ngược · Xem câu hỏi · Thu âm lại thoải mái
          </span>
        </div>
      </div>

      {/* SPECIAL MODE: PART 3 RANDOM PRACTICE */}
      {partTab === 'part3_random' ? (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                Luyện Câu Hỏi Random — Speaking Part 3 (14 Nhóm)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Chọn 1 hoặc nhiều nhóm bên dưới (hoặc để trống để trộn toàn bộ 14 nhóm), hệ thống sẽ bốc ngẫu nhiên câu hỏi để bạn luyện nói tự do không đếm ngược.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={randomCount}
                onChange={e => setRandomCount(Number(e.target.value) || 6)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                {[3, 5, 6, 8, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} câu ngẫu nhiên</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setRandomSeed(s => s + 1)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 inline-flex items-center gap-1"
              >
                <Shuffle className="w-3.5 h-3.5" /> Trộn lại
              </button>
              <button
                type="button"
                onClick={handleStartRandomPart3}
                className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu luyện Random
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setRandomScopeGroupIds([])}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                randomScopeGroupIds.length === 0
                  ? 'bg-[#007A7A] text-white border-[#007A7A]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Tất cả ({part3Groups.length} nhóm)
            </button>
            {part3Groups.map(g => {
              const selected = randomScopeGroupIds.includes(g.id);
              const qCount = (g.folders || []).reduce((s, f) => s + (f.questions?.length || 0), 0);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    setRandomScopeGroupIds(prev =>
                      prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selected
                      ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {g.name} ({qCount})
                </button>
              );
            })}
          </div>

          {previewRandomPart3Questions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
              Chưa có câu hỏi Part 3 trong nhóm đã chọn. Giáo viên có thể vào tab Part 3 để dán hoặc ném PDF câu hỏi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {previewRandomPart3Questions.map((q, idx) => (
                <div
                  key={`${q.id}-${idx}`}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-start gap-2.5"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] truncate">{q.topic}</p>
                    <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                      {q.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD 3-PART ZONE (Groups Bar + Left Subfolders + Right Question Grid like Image 1) */
        <div className="space-y-4">
          {/* Group Selector Strip */}
          <div className="flex flex-wrap items-center gap-1.5">
            {groups.map(g => {
              const isSelected = activeGroup?.id === g.id;
              const qTotal = (g.folders || []).reduce((sum, f) => sum + (f.questions?.length || 0), 0);
              if (editingGroupId === g.id) {
                return (
                  <div key={g.id} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-teal-500">
                    <input
                      type="text"
                      autoFocus
                      value={editingGroupName}
                      onChange={e => setEditingGroupName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameGroup(g.id);
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                      className="text-xs font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 w-44"
                    />
                    <button type="button" onClick={() => handleRenameGroup(g.id)} className="text-emerald-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => setEditingGroupId(null)} className="text-slate-400 p-0.5"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              }
              return (
                <div
                  key={g.id}
                  className={`inline-flex items-center gap-1 rounded-lg border transition ${
                    isSelected
                      ? 'bg-[#0F172B] dark:bg-slate-100 text-white dark:text-slate-900 border-[#0F172B] dark:border-slate-100'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGroupIdByPart(prev => ({ ...prev, [activePartKey]: g.id }))}
                    className="px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>{g.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 dark:bg-black/10' : 'bg-slate-200/80 dark:bg-slate-800'}`}>
                      {qTotal}
                    </span>
                  </button>
                  {isTeacher && isSelected && (
                    <span className="inline-flex items-center pr-1.5 gap-0.5">
                      <button
                        type="button"
                        title="Đổi tên nhóm"
                        onClick={() => {
                          setEditingGroupId(g.id);
                          setEditingGroupName(g.name);
                        }}
                        className="p-0.5 opacity-80 hover:opacity-100"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {groups.length > 1 && (
                        <button
                          type="button"
                          title="Xóa nhóm"
                          onClick={() => handleDeleteGroup(g.id)}
                          className="p-0.5 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            {isTeacher && (
              <button
                type="button"
                onClick={handleAddGroup}
                className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-950/30 text-xs font-extrabold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm nhóm
              </button>
            )}
          </div>

          {/* 2-Column Topic Browser & Question Card Grid (Image 1 layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Sidebar: Search + Subfolder/Topic List + "+" Create Subfolder */}
            <div className="lg:col-span-3 space-y-2.5 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm topic hoặc câu hỏi..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#007A7A]"
                />
              </div>

              {isTeacher && (
                <button
                  type="button"
                  onClick={handleAddFolder}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#007A7A] bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] hover:bg-[#EDFFFD] dark:hover:bg-teal-950/30 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> + Tạo thư mục con
                </button>
              )}

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5">
                {filteredFolders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Chưa có thư mục con.</p>
                ) : (
                  filteredFolders.map(folder => {
                    const isSel = activeFolder?.id === folder.id;
                    if (editingFolderId === folder.id) {
                      return (
                        <div key={folder.id} className="flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#007A7A]">
                          <input
                            type="text"
                            autoFocus
                            value={editingFolderName}
                            onChange={e => setEditingFolderName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            className="flex-1 min-w-0 text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded"
                          />
                          <button type="button" onClick={() => handleRenameFolder(folder.id)} className="text-emerald-600 p-1"><Check className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setEditingFolderId(null)} className="text-slate-400 p-1"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={folder.id}
                        className={`group flex items-center justify-between gap-1 rounded-xl px-3 py-2 text-xs transition ${
                          isSel
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold shadow-sm border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-300 font-semibold hover:bg-white/70 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            activeGroup &&
                            setSelectedFolderIdByGroup(prev => ({ ...prev, [activeGroup.id]: folder.id }))
                          }
                          className="flex-1 min-w-0 text-left truncate flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{folder.name}</span>
                          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                            {(folder.questions || []).length}
                          </span>
                        </button>
                        {isTeacher && (
                          <span className="inline-flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                            <button
                              type="button"
                              title="Đổi tên thư mục"
                              onClick={() => {
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                              className="p-1 text-slate-400 hover:text-[#007A7A]"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Xóa thư mục"
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Main Panel: Selected Topic Header + Bắt đầu + Teacher PDF/Paste + Question Cards Grid */}
            <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                    {activeFolder?.name || activeGroup?.name || 'Chọn thư mục'}
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {(activeFolder?.questions || []).length} câu hỏi
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => setShowImportPanel(v => !v)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-extrabold inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-[#007A7A]" />
                      {showImportPanel ? 'Đóng khung nhập' : 'Ném PDF / Copy Câu Hỏi'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartGroupRandomPractice(activeGroup)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    title="Trộn ngẫu nhiên các câu trong nhóm hiện tại"
                  >
                    <Shuffle className="w-3.5 h-3.5" /> Random nhóm này
                  </button>
                  <button
                    type="button"
                    onClick={handleStartFolderPractice}
                    className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu
                  </button>
                </div>
              </div>

              {/* Teacher Import Drawer: Drop PDF OR Copy-Paste Questions straight into Part/Group */}
              {isTeacher && showImportPanel && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-teal-200 dark:border-teal-800 space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Option A: Drop/Upload PDF */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-600" /> Cách 1: Ném file PDF (AI tự tách Topic &amp; Câu hỏi)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Chọn file PDF đề Speaking Part {activePartNumber} → AI tự chia từng thư mục con và câu hỏi vào nhóm <strong>{activeGroup?.name}</strong>.
                      </p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold cursor-pointer transition">
                        {pdfExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{pdfExtracting ? 'AI đang đọc PDF...' : 'Chọn file PDF tải lên'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          disabled={pdfExtracting}
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) handleUploadSpeakingPdf(f);
                          }}
                        />
                      </label>
                    </div>

                    {/* Option B: Copy-Paste text straight in */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <ClipboardPaste className="w-4 h-4 text-[#007A7A]" /> Cách 2: Copy dán thẳng câu hỏi
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setImportMode('append_folder')}
                            className={`px-2 py-0.5 rounded ${importMode === 'append_folder' ? 'bg-[#007A7A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            Vào thư mục đang mở
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportMode('new_folder')}
                            className={`px-2 py-0.5 rounded ${importMode === 'new_folder' ? 'bg-[#007A7A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            + Thư mục mới
                          </button>
                        </div>
                      </div>
                      {importMode === 'new_folder' && (
                        <input
                          type="text"
                          value={newImportFolderName}
                          onChange={e => setNewImportFolderName(e.target.value)}
                          placeholder="Tên thư mục con mới (VD: Watches, Old buildings...)"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        />
                      )}
                      <textarea
                        rows={4}
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={
                          activePartNumber === 2
                            ? 'Dán Cue Card Part 2:\nDescribe a quiet place you like...\nYou should say:\n- Where it is\n- How often you go there'
                            : 'Dán mỗi câu hỏi 1 dòng (tự bỏ số thứ tự 1., 2. hoặc gạch đầu dòng):\n1. Do you like wearing watches?\n2. Have you ever received a watch as a gift?'
                        }
                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPastedQuestions}
                        className="px-3.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold"
                      >
                        Lưu câu hỏi vào {importMode === 'new_folder' ? 'thư mục mới' : `"${activeFolder?.name || 'nhóm'}"`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3-Column Question Cards Grid matching Image 1 */}
              {!activeFolder || (activeFolder.questions || []).length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  Thư mục này chưa có câu hỏi nào. {isTeacher ? 'Bấm "Ném PDF / Copy Câu Hỏi" ở góc trên để thêm nhanh!' : 'Đợi giáo viên cập nhật câu hỏi cho chủ đề này.'}
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${activePartNumber === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-3`}>
                  {(activeFolder.questions || []).map((q, idx) => (
                    <div
                      key={q.id}
                      className="relative group p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition flex items-start gap-2.5"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-extrabold inline-flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                          {q.prompt}
                        </p>
                        {Array.isArray(q.bullets) && q.bullets.length > 0 && (
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {q.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Xóa câu hỏi này"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
