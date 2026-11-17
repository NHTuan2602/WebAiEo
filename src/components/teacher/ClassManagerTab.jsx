import { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  EyeOff,
  FolderPlus,
  Globe,
  Headphones,
  Mic,
  PenTool,
  Plus,
  Search,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react';
import UserAvatarBadge from '../common/UserAvatarBadge';

const CLASS_COLORS = [
  { id: 'teal', label: 'Ngọc Lam', chip: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-500/40', dot: 'bg-teal-500' },
  { id: 'indigo', label: 'Chàm', chip: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/40', dot: 'bg-indigo-500' },
  { id: 'rose', label: 'Hồng', chip: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40', dot: 'bg-rose-500' },
  { id: 'amber', label: 'Hổ Phách', chip: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40', dot: 'bg-amber-500' },
  { id: 'emerald', label: 'Lục Bảo', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40', dot: 'bg-emerald-500' },
  { id: 'violet', label: 'Tím', chip: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40', dot: 'bg-violet-500' }
];

export default function ClassManagerTab({
  classesDb = {},
  usersDb = {},
  tests = [],
  onUpsertClass,
  onDeleteClass,
  onUpdateClassMembers,
  onAssignTestClasses,
  onCreateTestForClass,
  onCreateSkillForClass,
  openMemberProfile,
  openExamBuilder,
  showToast
}) {
  const classList = Object.values(classesDb || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const [selectedClassId, setSelectedClassId] = useState('');
  const activeClass = classList.find(c => c.id === selectedClassId) || classList[0] || null;

  // Create / Edit Class form
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', description: '', color: 'teal' });

  // Roster search & multi-add
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddMembersBox, setShowAddMembersBox] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [checkedCandidates, setCheckedCandidates] = useState([]);

  // Assign existing test picker
  const [selectedExistingTestId, setSelectedExistingTestId] = useState('');

  const studentAccounts = Object.values(usersDb || {}).filter(
    u => u && u.role !== 'teacher' && !u.isSuperAdmin && u.username !== 'tuanpro123s'
  );

  const handleOpenCreateForm = () => {
    setEditingClassId(null);
    setClassForm({ name: '', description: '', color: CLASS_COLORS[classList.length % CLASS_COLORS.length].id });
    setShowClassForm(true);
  };

  const handleOpenEditForm = (cls) => {
    if (!cls) return;
    setEditingClassId(cls.id);
    setClassForm({
      name: cls.name || '',
      description: cls.description || '',
      color: cls.color || 'teal'
    });
    setShowClassForm(true);
  };

  const handleSubmitClassForm = async (e) => {
    e.preventDefault();
    const cleanName = String(classForm.name || '').trim();
    if (!cleanName) {
      showToast?.('Vui lòng nhập tên lớp học!', 'error');
      return;
    }
    const existing = editingClassId ? classesDb?.[editingClassId] : null;
    const nextId = existing?.id || `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ok = await onUpsertClass?.({
      id: nextId,
      name: cleanName,
      description: String(classForm.description || '').trim(),
      color: classForm.color || 'teal',
      studentUsernames: existing?.studentUsernames || []
    });
    if (ok !== false) {
      setSelectedClassId(nextId);
      setShowClassForm(false);
      setEditingClassId(null);
    }
  };

  const activeMembers = activeClass
    ? (activeClass.studentUsernames || [])
        .map(uname => usersDb?.[uname])
        .filter(Boolean)
        .filter(u => {
          const q = memberSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            String(u.name || '').toLowerCase().includes(q) ||
            String(u.username || '').toLowerCase().includes(q)
          );
        })
    : [];

  const activeMemberSet = new Set(activeClass?.studentUsernames || []);
  const addableCandidates = studentAccounts.filter(u => {
    if (activeMemberSet.has(u.username)) return false;
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.username || '').toLowerCase().includes(q)
    );
  });

  const handleAddCheckedMembers = async () => {
    if (!activeClass || checkedCandidates.length === 0) return;
    await onUpdateClassMembers?.(activeClass.id, 'add', checkedCandidates);
    setCheckedCandidates([]);
    setShowAddMembersBox(false);
  };

  const classTests = activeClass
    ? tests.filter(t => Array.isArray(t?.assignedClassIds) && t.assignedClassIds.includes(activeClass.id))
    : [];

  const assignableTests = activeClass
    ? tests.filter(t => !Array.isArray(t?.assignedClassIds) || !t.assignedClassIds.includes(activeClass.id))
    : [];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" />
            <span>Quản Lý Lớp Học &amp; Giao Bài Theo Lớp ({classList.length} lớp)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tạo nhiều lớp riêng biệt, thêm/kích học viên nhanh chóng và giao đề/bài tập về nhà đúng cho từng lớp (học viên trong lớp nhận thông báo ngay).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateForm}
          className="px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm shrink-0 transition"
        >
          <FolderPlus className="w-4 h-4" /> + Tạo Lớp Mới
        </button>
      </div>

      {/* Create / Edit Class Inline Form */}
      {showClassForm && (
        <form
          onSubmit={handleSubmitClassForm}
          className="bg-white dark:bg-slate-900 border-2 border-[#007A7A]/40 rounded-3xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {editingClassId ? 'Chỉnh Sửa Thông Tin Lớp Học' : 'Tạo Lớp Học Mới'}
            </h3>
            <button
              type="button"
              onClick={() => setShowClassForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên lớp học *
              </label>
              <input
                type="text"
                value={classForm.name}
                onChange={e => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VD: IELTS Foundation A1, Lớp Target 6.5..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lịch học / Ghi chú ngắn (tùy chọn)
              </label>
              <input
                type="text"
                value={classForm.description}
                onChange={e => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="VD: Tối 2-4-6 (19h30) • Mục tiêu Band 6.5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Màu nhãn:</span>
              {CLASS_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClassForm(prev => ({ ...prev, color: c.id }))}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition ${
                    classForm.color === c.id
                      ? `${c.chip} ring-2 ring-[#007A7A]/30`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingClassId ? 'Lưu Thay Đổi' : 'Tạo Lớp Ngay'}
            </button>
          </div>
        </form>
      )}

      {classList.length === 0 ? (
        <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-[#007A7A] dark:text-[#1EE1D6] opacity-80" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Chưa có lớp học nào được tạo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Bạn có thể tạo 3 lớp hoặc nhiều hơn (vd: Foundation, Target 6.5, Intensive 7.5+) để gom học viên, giao bài tập riêng và chỉ gửi thông báo bài tập về nhà đúng cho học viên lớp đó.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tạo Lớp Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Class Selector */}
          <div className="lg:col-span-4 space-y-2.5">
            {classList.map(cls => {
              const isSelected = activeClass?.id === cls.id;
              const palette = CLASS_COLORS.find(c => c.id === cls.color) || CLASS_COLORS[0];
              const assignedCount = tests.filter(t => Array.isArray(t?.assignedClassIds) && t.assignedClassIds.includes(cls.id)).length;
              return (
                <div
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setShowAddMembersBox(false);
                    setCheckedCandidates([]);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedClassId(cls.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/15 shadow-sm'
                      : 'bg-white/85 dark:bg-slate-900/80 border-pink-200/80 dark:border-slate-800 hover:border-[#007A7A]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${palette.dot}`} />
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {cls.name}
                        </h3>
                      </div>
                      {cls.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {cls.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Sửa tên lớp"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa "${cls.name}"? Tài khoản học viên không bị xóa; đề thi chỉ giao riêng lớp này sẽ tự chuyển sang Ẩn.`)) {
                            onDeleteClass?.(cls.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                        title="Xóa lớp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {(cls.studentUsernames || []).length} học viên
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6]">
                      {assignedCount} bài giao lớp
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Class Members & Homework */}
          {activeClass && (
            <div className="lg:col-span-8 space-y-5">
              {/* Members Management Card */}
              <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Thành Viên: {activeClass.name} ({(activeClass.studentUsernames || []).length})
                    </h3>
                    {activeClass.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeClass.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddMembersBox(v => !v)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                  >
                    <UserPlus className="w-4 h-4" /> {showAddMembersBox ? 'Đóng Chọn Học Viên' : '+ Thêm Học Viên Vào Lớp'}
                  </button>
                </div>

                {/* Add Members Picker Box */}
                {showAddMembersBox && (
                  <div className="p-4 rounded-2xl bg-indigo-50/75 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                        Chọn học viên thêm vào {activeClass.name} ({addableCandidates.length} học viên chưa vào lớp):
                      </span>
                      {addableCandidates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (checkedCandidates.length === addableCandidates.length) {
                              setCheckedCandidates([]);
                            } else {
                              setCheckedCandidates(addableCandidates.map(u => u.username));
                            }
                          }}
                          className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 hover:underline"
                        >
                          {checkedCandidates.length === addableCandidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={e => setCandidateSearch(e.target.value)}
                        placeholder="Tìm tên hoặc @username học viên..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 text-xs"
                      />
                    </div>

                    {addableCandidates.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                        Không còn học viên nào ngoài lớp này (tạo thêm tài khoản học viên ở tab 5. Tài Khoản Lớp nếu cần).
                      </p>
                    ) : (
                      <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {addableCandidates.map(stu => {
                          const isChecked = checkedCandidates.includes(stu.username);
                          return (
                            <label
                              key={stu.username}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/25'
                                  : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  setCheckedCandidates(prev =>
                                    e.target.checked
                                      ? [...prev, stu.username]
                                      : prev.filter(u => u !== stu.username)
                                  );
                                }}
                                className="w-4 h-4 accent-indigo-600 shrink-0"
                              />
                              <UserAvatarBadge user={stu} sizeClass="w-7 h-7" textClass="text-[11px]" rounded="rounded-xl" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{stu.name}</p>
                                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">@{stu.username}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={checkedCandidates.length === 0}
                        onClick={handleAddCheckedMembers}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Thêm {checkedCandidates.length} Học Viên Vào Lớp
                      </button>
                    </div>
                  </div>
                )}

                {/* Member Search */}
                {(activeClass.studentUsernames || []).length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Lọc thành viên trong lớp..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                )}

                {activeMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
                    {(activeClass.studentUsernames || []).length === 0
                      ? 'Lớp chưa có học viên nào. Bấm "+ Thêm Học Viên Vào Lớp" ở trên để đưa học viên vào lớp.'
                      : 'Không tìm thấy học viên khớp với từ khóa.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {activeMembers.map(stu => (
                      <div
                        key={stu.username}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatarBadge user={stu} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-xl" />
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{stu.name}</p>
                            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                              @{stu.username} · Target Band {stu.targetBand || 7.0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openMemberProfile?.(stu.username)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] text-[11px] font-bold hover:opacity-90"
                          >
                            Hồ sơ
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateClassMembers?.(activeClass.id, 'remove', [stu.username])}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1 hover:bg-rose-100 dark:hover:bg-rose-500/25"
                            title="Kích học sinh khỏi lớp này"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Kích khỏi lớp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Homework & Tests Assigned to This Class */}
              <div className="bg-white/95 dark:bg-slate-900 border border-pink-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Bài Tập &amp; Đề Thi Của Lớp: {activeClass.name} ({classTests.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Khi giao đề ở chế độ Công khai cho lớp này, chỉ học viên trong <b>{activeClass.name}</b> mới nhìn thấy bài &amp; nhận thông báo bài tập về nhà.
                    </p>
                  </div>
                </div>

                {/* Quick Create Homework Directly for Class */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateTestForClass?.(activeClass.id)}
                    className="px-3 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> + Tạo Đề IELTS Full Cho Lớp
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateSkillForClass?.(activeClass.id, 'speaking')}
                    className="px-3 py-2 rounded-xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Mic className="w-3.5 h-3.5" /> + Bài Tập Speaking AI
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateSkillForClass?.(activeClass.id, 'reading')}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> + Bài Tập Reading
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateSkillForClass?.(activeClass.id, 'listening')}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Headphones className="w-3.5 h-3.5" /> + Bài Tập Listening
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateSkillForClass?.(activeClass.id, 'writing')}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <PenTool className="w-3.5 h-3.5" /> + Bài Tập Writing
                  </button>
                </div>

                {/* Assign Existing Test to Class + Trigger Notification */}
                {assignableTests.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <select
                      value={selectedExistingTestId}
                      onChange={e => setSelectedExistingTestId(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Chọn đề thi / bài tập có sẵn để giao cho lớp này --</option>
                      {assignableTests.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.testMode === 'single_skill' ? `Kỹ năng ${t.focusSkill || ''}` : 'Đề Full'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedExistingTestId}
                      onClick={() => {
                        const targetTest = tests.find(t => t.id === selectedExistingTestId);
                        if (!targetTest) return;
                        const nextIds = Array.from(new Set([...(Array.isArray(targetTest.assignedClassIds) ? targetTest.assignedClassIds : []), activeClass.id]));
                        onAssignTestClasses?.(targetTest.id, nextIds, { publish: true, notify: true });
                        setSelectedExistingTestId('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Giao Bài &amp; Báo Lớp
                    </button>
                  </div>
                )}

                {classTests.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-3">
                    Chưa có đề thi/bài tập nào được gán riêng cho {activeClass.name}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classTests.map(t => {
                      const isPrivate = (t.visibility || 'public') === 'private';
                      return (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {t.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  isPrivate
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                }`}
                              >
                                {isPrivate ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                {isPrivate ? 'Đang ẩn' : 'Công khai'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openExamBuilder?.(t)}
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-[#007A7A]"
                            >
                              Sửa bài
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = (t.assignedClassIds || []).filter(cid => cid !== activeClass.id);
                                onAssignTestClasses?.(t.id, remaining, { notify: false, makePrivateIfEmpty: true });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-100"
                            >
                              Gỡ khỏi lớp
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
