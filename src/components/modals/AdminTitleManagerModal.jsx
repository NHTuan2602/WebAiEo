import { useState } from 'react';
import {
  Check,
  Crown,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X
} from 'lucide-react';
import {
  CUSTOM_TITLE_THEMES,
  getAllCatalogTitles,
  normalizeCustomTitle,
  resolveStudentTitleSummary
} from '../../constants/profileCustomization';
import UserAvatarBadge from '../common/UserAvatarBadge';

const PRESET_EMOJIS = ['🏅', '👑', '🏆', '💎', '🔥', '🌟', '⚡', '🎯', '🎓', '🦉', '🚀', '🌸'];

export default function AdminTitleManagerModal({
  attempts = [],
  customTitles = [],
  dailyRankTitles = null,
  gamePracticeLeaderboard = [],
  initialTargetUsername = null,
  isOpen = false,
  onClose,
  onDeleteCustomTitle,
  onGrantUserTitles,
  onUpsertCustomTitle,
  roomsDb = {},
  showToast,
  usersDb = {}
}) {
  const [selectedUsername, setSelectedUsername] = useState(initialTargetUsername || '');
  const [userSearch, setUserSearch] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('🏅');
  const [newColorKey, setNewColorKey] = useState('amber');
  const [newDifficulty, setNewDifficulty] = useState('Đặc Biệt');
  const [newCondition, setNewCondition] = useState('Danh hiệu đặc biệt do Quản Trị Hệ Thống trao tặng.');
  const [busyAction, setBusyAction] = useState(false);

  if (!isOpen) return null;

  const catalog = getAllCatalogTitles(customTitles);
  const customOnly = (Array.isArray(customTitles) ? customTitles : []).map(normalizeCustomTitle).filter(Boolean);

  const assignableUsers = Object.values(usersDb || {})
    .filter(u => u && !u.isSuperAdmin && !u.hiddenFromTeacher && u.username !== 'tuanpro123s')
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'teacher' ? -1 : 1;
      return (a.name || a.username || '').localeCompare(b.name || b.username || '', 'vi');
    });

  const filteredUsers = assignableUsers.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.username || '').toLowerCase().includes(q)
    );
  });

  const activeTargetUser =
    assignableUsers.find(u => u.username === (selectedUsername || initialTargetUsername)) ||
    assignableUsers[0] ||
    null;

  const targetSummary = activeTargetUser
    ? resolveStudentTitleSummary(activeTargetUser, attempts, roomsDb, customTitles, null, {
        gamePracticeLeaderboard,
        dailyRankTitles,
        usersDb
      })
    : null;
  const targetGrantedSet = new Set(Array.isArray(activeTargetUser?.grantedTitleIds) ? activeTargetUser.grantedTitleIds : []);

  const handleToggleTitleForUser = async (titleId) => {
    if (!activeTargetUser || !onGrantUserTitles || busyAction) return;
    setBusyAction(true);
    try {
      const mode = targetGrantedSet.has(titleId) ? 'remove' : 'add';
      await onGrantUserTitles(activeTargetUser.username, [titleId], mode);
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateCustomTitleSubmit = async (e) => {
    e.preventDefault();
    const cleanLabel = newLabel.trim();
    if (!cleanLabel) {
      showToast?.('Vui lòng nhập tên danh hiệu!', 'error');
      return;
    }
    if (busyAction) return;
    setBusyAction(true);
    try {
      const titleId = `ct_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const created = {
        id: titleId,
        label: cleanLabel,
        icon: newIcon.trim() || '🏅',
        colorKey: newColorKey,
        tier: 'Đặc Biệt',
        difficulty: newDifficulty.trim() || 'Đặc Biệt',
        conditionText: newCondition.trim() || 'Danh hiệu đặc biệt do Quản Trị Hệ Thống trao tặng.'
      };
      const ok = await onUpsertCustomTitle?.(created);
      if (ok !== false && activeTargetUser && onGrantUserTitles) {
        await onGrantUserTitles(activeTargetUser.username, [titleId], 'add');
      }
      setNewLabel('');
      showToast?.(
        activeTargetUser
          ? `Đã tạo "${created.icon} ${created.label}" và trao tặng cho ${activeTargetUser.name}!`
          : `Đã tạo danh hiệu mới "${created.icon} ${created.label}"!`
      );
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quản Trị Tạo & Tặng Danh Hiệu"
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/35 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-[#2E1065] via-[#4C1D95] to-[#0F766E] text-white flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-300" />
              Quản Trị: Tạo &amp; Tặng Danh Hiệu Cho Giáo Viên &amp; Học Sinh
            </h3>
            <p className="text-xs text-purple-100/90 mt-0.5">
              Chỉ Quản trị hệ thống mới có quyền tạo danh hiệu mới hoặc trao tặng/gỡ danh hiệu cho Giáo viên và Học viên.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Đóng hộp thoại quản trị danh hiệu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Target Teacher / Student Selector + Create Custom Title */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Chọn Giáo Viên / Học Viên Nhận Danh Hiệu
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Tìm tên hoặc @username..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredUsers.map(u => {
                  const selected = activeTargetUser?.username === u.username;
                  const countGranted = Array.isArray(u.grantedTitleIds) ? u.grantedTitleIds.length : 0;
                  return (
                    <button
                      key={u.username}
                      type="button"
                      onClick={() => setSelectedUsername(u.username)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
                        selected
                          ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatarBadge user={u} sizeClass="w-8 h-8" textClass="text-xs" rounded="rounded-xl" />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{u.name || u.username}</p>
                          <p className="text-xs font-mono text-[#475569] dark:text-slate-400 truncate">
                            @{u.username} · {u.role === 'teacher' ? '👩‍🏫 Giáo viên' : u.isGuest ? '👤 Tài khoản khách' : '🎓 Học viên'}
                          </p>
                        </div>
                      </div>
                      {countGranted > 0 && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                          +{countGranted}
                        </span>
                      )}
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">Không tìm thấy tài khoản phù hợp.</p>
                )}
              </div>
            </div>

            {/* Create New Custom Title Form */}
            <form
              onSubmit={handleCreateCustomTitleSubmit}
              className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172B] dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tạo Danh Hiệu Mới {activeTargetUser ? `& Tặng Cho ${activeTargetUser.name}` : ''}
              </h3>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Icon</label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={e => setNewIcon(e.target.value)}
                    maxLength={8}
                    className="w-full px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center text-base"
                  />
                </div>
                <div className="col-span-9">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên danh hiệu *</label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="VD: Cô Giáo Tâm Huyết / Thủ Khoa..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {PRESET_EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewIcon(em)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition ${
                      newIcon === em
                        ? 'bg-purple-600 text-white border-purple-600 scale-105'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Màu thẻ</label>
                  <select
                    value={newColorKey}
                    onChange={e => setNewColorKey(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {Object.entries(CUSTOM_TITLE_THEMES).map(([k, val]) => (
                      <option key={k} value={k}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Nhãn hạng</label>
                  <input
                    type="text"
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mô tả danh hiệu</label>
                <input
                  type="text"
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={busyAction}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                {activeTargetUser ? `Tạo & Tặng Ngay Cho ${activeTargetUser.name}` : 'Tạo Danh Hiệu Mới'}
              </button>
            </form>
          </div>

          {/* Right: Title Catalog to Grant/Revoke for Selected User + Delete Custom Titles */}
          <div className="lg:col-span-7 space-y-4">
            {activeTargetUser && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Kho Danh Hiệu Của: {activeTargetUser.name} ({activeTargetUser.role === 'teacher' ? 'Giáo viên' : activeTargetUser.isGuest ? 'Tài khoản khách' : 'Học viên'})
                  </p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    Bấm vào danh hiệu bên dưới để <strong>Trao Tặng</strong> hoặc <strong>Gỡ Bỏ</strong> danh hiệu do Quản trị cấp.
                  </p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#007A7A] dark:text-[#1EE1D6]">
                  Đã mở: {targetSummary?.unlockedIds?.length || 1}/{catalog.length}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {catalog.map(item => {
                const progressItem = targetSummary?.itemsWithProgress?.find(x => x.id === item.id);
                const isGranted = targetGrantedSet.has(item.id);
                const isAlreadyUnlocked = Boolean(progressItem?.unlocked);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition ${
                      isGranted
                        ? 'bg-purple-50/90 dark:bg-purple-950/35 border-purple-400 dark:border-purple-500/50'
                        : isAlreadyUnlocked
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0">
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {item.label}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          <span className={`text-xs font-bold px-1.5 py-0.2 rounded-full border ${item.badgeClass}`}>
                            {item.isCustomTitle ? 'Danh hiệu riêng' : item.difficulty}
                          </span>
                          {isGranted && (
                            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
                              ✓ Quản trị đã tặng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {activeTargetUser && (
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleToggleTitleForUser(item.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition inline-flex items-center gap-1 ${
                            isGranted
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950'
                          }`}
                        >
                          {isGranted ? (
                            <>
                              <Check className="w-3 h-3" /> Gỡ tặng
                            </>
                          ) : (
                            '+ Tặng'
                          )}
                        </button>
                      )}
                      {item.isCustomTitle && onDeleteCustomTitle && (
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => {
                            if (window.confirm(`Xóa vĩnh viễn danh hiệu riêng "${item.label}" khỏi hệ thống?`)) {
                              onDeleteCustomTitle(item.id);
                            }
                          }}
                          title="Xóa danh hiệu tùy chỉnh"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {customOnly.length > 0 && (
              <p className="text-xs text-[#475569] dark:text-slate-400 italic">
                Đang có {customOnly.length} danh hiệu tùy chỉnh do Quản trị hệ thống tạo thêm.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
