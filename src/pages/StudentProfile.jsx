import { useState } from 'react';
import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  Crown,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  History,
  Key,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  PenTool,
  Phone,
  Play,
  QrCode,
  Save,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Unlock,
  Upload,
  UserCheck,
  Users,
  X,
  Crop
} from 'lucide-react';
import { BRAND_INFO } from '../constants/brandInfo';
import { canViewerSeeMember, formatDurationVi, normalizeExamConfig } from '../constants/seedData';
import { countExtensionCheatSignals, getRiskAssessment, readImageFileAsDataUrl } from '../utils/examHelpers';
import ImageCropperModal from '../components/modals/ImageCropperModal';
import {
  AIEO_VIP_PRICE_VND,
  AVATAR_FRAMES,
  PROFILE_BANNERS,
  VIP_NAME_COLORS,
  VIP_NEON_COVER_THEMES,
  buildVietQrImageUrl,
  formatRemainingSubscriptionText,
  formatVndCurrency,
  getProfileBannerById,
  hasActiveAieoVip,
  hasCustomCoverPermission,
  hasUnlockedAvatarFrame,
  normalizePaymentConfig,
  resolveStudentTitleSummary,
  resolveUserVipNameVisual,
  resolveVisibleTitleBadge
} from '../constants/profileCustomization';
import CoverCheckoutModal from '../components/modals/CoverCheckoutModal';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';

export default function StudentProfile({
  adminFeedbacks = [],
  attempts = [],
  classesDb = {},
  currentRoomPin,
  currentUser,
  customTitles = [],
  dispatchSyncAction,
  handleTeacherOpenLobby,
  handleUpdateUserProfileFields,
  onGrantUserTitles,
  onNavigateAfterPurchase = null,
  onOpenAccountSecurity,
  onOpenAdminTitleManager,
  onPullSync = null,
  onRequestCoverUnlock = null,
  onToggleUserCoverUnlock = null,
  onToggleUserSubscription = null,
  openStudentGamePortal,
  paymentConfig = null,
  previousView,
  roomsDb = {},
  selectedProfileStudent,
  setEditingTargetUser,
  setPreviousView,
  setSelectedAttemptId,
  setSelectedProfileStudent,
  setShowAvatarModal,
  setTeacherNotes,
  setTempNoteText,
  setView,
  showToast,
  startExam,
  supportAdminProfile = null,
  teacherNotes = {},
  tempNoteText,
  tests = [],
  usersDb = {}
}) {
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [fbCategory, setFbCategory] = useState('feature');
  const [fbContent, setFbContent] = useState('');
  const [fbPrivate, setFbPrivate] = useState(false);
  const [fbStatusFilter, setFbStatusFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  const [titleFilter, setTitleFilter] = useState('all');
  const [donateAmount, setDonateAmount] = useState(0);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [checkoutModalState, setCheckoutModalState] = useState(null);
  const [isSavingProfileTheme, setIsSavingProfileTheme] = useState(false);
  const [isTogglingCoverUnlock, setIsTogglingCoverUnlock] = useState(false);
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false);
  const [coverCropSource, setCoverCropSource] = useState('');
  const [customDraft, setCustomDraft] = useState({
    profileBannerId: 'ocean',
    profileCoverUrl: '',
    avatarFrameId: 'none',
    studyGoal: '',
    equippedTitleId: 'newbie',
    showTitleBadge: true
  });

  const isTeacherViewer = currentUser?.role === 'teacher';
  const fallbackUsername = currentUser?.username || Object.keys(usersDb)[0] || supportAdminProfile?.username || 'teacher_ielts';
  const requestedUsername = selectedProfileStudent || fallbackUsername;
  const resolvedMember =
    usersDb[requestedUsername] ||
    (supportAdminProfile?.username === requestedUsername ? supportAdminProfile : null) ||
    Object.values(usersDb)[0] ||
    supportAdminProfile;
  const activeUsername = resolvedMember?.username || requestedUsername;
  const student = resolvedMember || {
    username: activeUsername,
    name: activeUsername,
    role: 'student',
    targetBand: 7.5,
    joinedDate: '2026-02-01'
  };

  const isTargetSystemAdmin = Boolean(
    student.isSystemAdmin || student.isSuperAdmin || student.username === 'tuanpro123s'
  );
  const isTargetTeacher = !isTargetSystemAdmin && student.role === 'teacher';
  const isSelf = student.username === currentUser?.username;
  const isViewerSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const isTargetSuperAdmin = Boolean(student.isSuperAdmin || student.username === 'tuanpro123s');
  const canEditTargetInfo = isTargetSuperAdmin
    ? isViewerSuperAdmin
    : (isSelf || isTeacherViewer);
  const canInspectAttemptDetails = isTeacherViewer || isSelf;
  const canSeeTeacherNotes = isTeacherViewer || isSelf;
  const titleSummary = resolveStudentTitleSummary(student, attempts, roomsDb, customTitles, paymentConfig);
  const visibleTitle = resolveVisibleTitleBadge(student, attempts, roomsDb, customTitles, paymentConfig);
  const heroBanner = getProfileBannerById(student.profileBannerId);
  const studentHasCoverPermission = hasCustomCoverPermission(student);
  const studentHasAieoVip = hasActiveAieoVip(student);
  const vipVisual = resolveUserVipNameVisual(student);
  const canUseCustomCover = canEditTargetInfo && (isTeacherViewer || studentHasCoverPermission);
  const normalizedPayCfg = normalizePaymentConfig(paymentConfig || {});
  const unlockPriceLabel = formatVndCurrency(normalizedPayCfg.coverUnlockPrice);
  const aieoVipPriceLabel = formatVndCurrency(normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND);
  const coverRemainingText = student.customCoverExpiresAt > Date.now()
    ? formatRemainingSubscriptionText(student.customCoverExpiresAt)
    : '';
  const aieoVipRemainingText = student.aieoVipExpiresAt > Date.now()
    ? formatRemainingSubscriptionText(student.aieoVipExpiresAt)
    : '';
  const hasCustomCover = Boolean(
    studentHasCoverPermission &&
    student.profileCoverUrl &&
    (student.profileCoverUrl.startsWith('data:image/') || student.profileCoverUrl.startsWith('https://'))
  );

  const openCustomizeModal = () => {
    setCustomDraft({
      profileBannerId: student.profileBannerId || 'ocean',
      profileCoverUrl: student.profileCoverUrl || '',
      avatarFrameId: student.avatarFrameId || 'none',
      studyGoal: student.studyGoal || '',
      equippedTitleId: student.equippedTitleId || titleSummary?.title?.id || 'newbie',
      showTitleBadge: student.showTitleBadge !== false
    });
    setShowCustomizeModal(true);
  };

  const baseMembers = Object.values(usersDb).filter(u => {
    if (!u) return false;
    if (isViewerSuperAdmin) return !u.isSuperAdmin && !u.hiddenFromTeacher && u.username !== 'tuanpro123s';
    return !u.isSuperAdmin && !u.hiddenFromTeacher && u.username !== 'tuanpro123s' && canViewerSeeMember(u, currentUser, classesDb);
  });
  const adminCardMember = supportAdminProfile
    ? {
        ...supportAdminProfile,
        role: 'admin',
        isSystemAdmin: true
      }
    : (usersDb.tuanpro123s
      ? {
          ...usersDb.tuanpro123s,
          role: 'admin',
          isSystemAdmin: true
        }
      : null);

  const allMembers = [...baseMembers, ...(adminCardMember ? [adminCardMember] : [])].sort((a, b) => {
    const rank = u => (u.isSystemAdmin ? 1 : u.role === 'teacher' ? 0 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.username === currentUser?.username) return -1;
    if (b.username === currentUser?.username) return 1;
    return (a.name || a.username || '').localeCompare(b.name || b.username || '');
  });

  const filteredMembers = allMembers.filter(m => {
    const effectiveRole = m.isSystemAdmin ? 'admin' : m.role;
    if (memberRoleFilter !== 'all' && effectiveRole !== memberRoleFilter) return false;
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.isSystemAdmin && 'quản trị góp ý admin'.includes(q))
    );
  });

  const studentAttempts = attempts.filter(a => a.studentId === activeUsername);

  // Sort chronologically ascending (oldest to newest) for progression calculations
  const chronologicalAttempts = [...studentAttempts].reverse();
  const totalAttempts = studentAttempts.length;
  const gradedOverallBands = studentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
  const highestBand = gradedOverallBands.length > 0 ? Math.max(...gradedOverallBands) : null;
  const latestAttempt = studentAttempts[0];
  const firstAttempt = chronologicalAttempts[0];
  const bandGrowth = (typeof latestAttempt?.overallBand === 'number' && typeof firstAttempt?.overallBand === 'number' && totalAttempts > 1)
    ? (latestAttempt.overallBand - firstAttempt.overallBand).toFixed(1)
    : null;

  const avgListening = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores?.listening?.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const avgReading = totalAttempts > 0
    ? (studentAttempts.reduce((acc, a) => acc + (a.scores?.reading?.band || 0), 0) / totalAttempts).toFixed(1)
    : null;
  const gradedWritingAttempts = studentAttempts.filter(a => typeof a.scores?.writing?.overallBand === 'number');
  const avgWriting = gradedWritingAttempts.length > 0
    ? (gradedWritingAttempts.reduce((acc, a) => acc + a.scores.writing.overallBand, 0) / gradedWritingAttempts.length).toFixed(1)
    : null;
  const overallAvg = gradedOverallBands.length > 0
    ? (gradedOverallBands.reduce((acc, b) => acc + b, 0) / gradedOverallBands.length).toFixed(1)
    : null;

  const totalTabSwitches = isTeacherViewer
    ? studentAttempts.reduce((acc, a) => acc + (a.tabSwitchCount || 0), 0)
    : 0;
  const avgTabSwitches = isTeacherViewer && totalAttempts > 0
    ? (totalTabSwitches / totalAttempts).toFixed(1)
    : 0;

  // Room score for this member
  const room = roomsDb[currentRoomPin] || { players: {} };
  const playerGameRecord = room.players?.[student.username] || room.players?.[student.name];

  // Teacher portfolio stats
  const publicTests = tests.filter(t => normalizeExamConfig(t).visibility !== 'private');
  const totalGradedByTeacher = attempts.filter(a => a.teacherGraded).length;
  const totalActiveRooms = Object.keys(roomsDb || {}).length;

  const handleBackNavigation = () => {
    if (previousView && !['AUTH', 'EXAM_MODE', 'STUDENT_PROFILE'].includes(previousView)) {
      if (!isTeacherViewer && ['TEACHER_DASHBOARD', 'EXAM_BUILDER'].includes(previousView)) {
        setView('HOME');
        return;
      }
      setView(previousView);
      return;
    }
    setView(isTeacherViewer ? 'TEACHER_DASHBOARD' : 'HOME');
  };

  const newFeedbacksCount = adminFeedbacks.filter(f => f.status === 'new').length;
  const filteredFeedbacks = adminFeedbacks.filter(fb =>
    fbStatusFilter === 'all' ? true : fb.status === fbStatusFilter
  );

  const handleSendAdminFeedback = async (e) => {
    e.preventDefault();
    const clean = (fbContent || '').trim();
    if (!clean) {
      showToast?.('Vui lòng nhập nội dung góp ý hoặc tính năng bạn mong muốn!', 'error');
      return;
    }
    const snap = await dispatchSyncAction?.('SUBMIT_ADMIN_FEEDBACK', {
      category: fbCategory,
      content: clean,
      isPrivate: fbPrivate
    });
    if (snap) {
      setFbContent('');
      setFbPrivate(false);
      showToast?.('Đã gửi góp ý thành công đến Quản Trị Hệ Thống!');
    }
  };

  const handleUpdateFeedbackByAdmin = async (fb) => {
    if (!isViewerSuperAdmin || !fb?.id) return;
    const nextStatus = statusDrafts[fb.id] || fb.status || 'new';
    const nextReply = replyDrafts[fb.id] !== undefined ? replyDrafts[fb.id] : (fb.adminReply || '');
    const snap = await dispatchSyncAction?.('UPDATE_ADMIN_FEEDBACK', {
      feedbackId: fb.id,
      status: nextStatus,
      adminReply: nextReply
    });
    if (snap) {
      showToast?.('Đã cập nhật trạng thái & phản hồi góp ý!');
    }
  };

  const handleDeleteFeedbackItem = async (fbId) => {
    if (!fbId) return;
    if (!window.confirm('Xóa mục góp ý này?')) return;
    const snap = await dispatchSyncAction?.('DELETE_ADMIN_FEEDBACK', { feedbackId: fbId });
    if (snap) {
      showToast?.('Đã xóa mục góp ý.', 'info');
    }
  };

  const bestBandByStudent = new Map();
  for (const att of attempts) {
    if (!att?.studentId || typeof att.overallBand !== 'number') continue;
    const prev = bestBandByStudent.get(att.studentId);
    if (prev === undefined || att.overallBand > prev) {
      bestBandByStudent.set(att.studentId, att.overallBand);
    }
  }

  const renderVipAppearanceSwitches = () => {
    if (!isSelf || (!studentHasAieoVip && !isTargetSystemAdmin) || !handleUpdateUserProfileFields) {
      return null;
    }
    const {
      showNameColor: colorOn,
      nameColorValue,
      nameColorMeta,
      showVipTag: tagOn,
      showNeonCover: neonOn,
      neonCoverColor,
      neonCoverMeta
    } = vipVisual;

    const saveVipPatch = (patch) => {
      handleUpdateUserProfileFields(student.username, {
        ...patch,
        vipEffectsCustomizedAt: Date.now()
      });
    };

    return (
      <div className="mt-4 pt-4 border-t border-rose-200/80 dark:border-rose-500/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            Tùy Chỉnh Hiển Thị Ai eo VIP (Màu Chữ Tên · Viền Bìa Neon · Nhãn AIEOVIP)
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {neonOn && (
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full text-slate-900 ${neonCoverMeta.swatchClass} shadow-xs`}>
                Viền Bìa: {neonCoverMeta.name}
              </span>
            )}
            <span className="text-xs bg-white/90 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-rose-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              Xem trước: <VipMemberName user={student} fallbackName={student.name} badgeSize="xs" />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          {/* 1. Custom VIP Name Text Color */}
          <div className={`p-3 rounded-2xl border space-y-2.5 transition ${
            colorOn
              ? 'bg-rose-50/75 dark:bg-slate-800/85 border-rose-300 dark:border-rose-500/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          }`}>
            <button
              type="button"
              role="switch"
              aria-checked={colorOn}
              onClick={() =>
                saveVipPatch({
                  vipRedNameEnabled: !colorOn,
                  customToast: !colorOn
                    ? `Đã BẬT màu chữ VIP (${nameColorMeta.label})!`
                    : 'Đã TẮT màu chữ nổi bật VIP.'
                })
              }
              className="w-full text-left flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-rose-500" />
                  <span>Đổi Màu Chữ Tên VIP</span>
                </p>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  Chọn màu chữ bất kỳ cho tên trên Navbar, Hồ sơ &amp; BXH
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black uppercase shrink-0 ${
                  colorOn ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {colorOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
              {VIP_NAME_COLORS.map(preset => {
                const selected = nameColorValue === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={`Màu chữ: ${preset.label}`}
                    aria-label={`Chọn màu chữ ${preset.label}`}
                    onClick={() =>
                      saveVipPatch({
                        vipRedNameEnabled: true,
                        vipNameColor: preset.id,
                        customToast: `Đã đổi màu chữ tên sang ${preset.label}!`
                      })
                    }
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      selected
                        ? 'border-slate-900 dark:border-white ring-2 ring-offset-1 ring-slate-400 scale-110'
                        : 'border-white dark:border-slate-800 shadow-xs'
                    }`}
                    style={{ backgroundColor: preset.swatch }}
                  />
                );
              })}
              <label
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-extrabold cursor-pointer transition ${
                  nameColorMeta.isCustomHex
                    ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-500'
                }`}
                title="Tự chọn mã màu bất kỳ (Hex)"
              >
                <input
                  type="color"
                  aria-label="Tự chọn màu chữ tùy ý"
                  value={nameColorMeta.isCustomHex ? nameColorMeta.hex : nameColorMeta.hex}
                  onChange={e =>
                    saveVipPatch({
                      vipRedNameEnabled: true,
                      vipNameColor: e.target.value,
                      customToast: `Đã đổi màu chữ tên sang mã ${e.target.value.toUpperCase()}!`
                    })
                  }
                  className="w-3.5 h-3.5 rounded-full border-0 p-0 bg-transparent cursor-pointer"
                />
                <span>{nameColorMeta.isCustomHex ? nameColorMeta.label : 'Tự chọn'}</span>
              </label>
            </div>
          </div>

          {/* 2. Neon Cover Border */}
          <div className={`p-3 rounded-2xl border space-y-2.5 transition ${
            neonOn
              ? 'bg-cyan-50/75 dark:bg-cyan-950/25 border-cyan-300 dark:border-cyan-500/45'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          }`}>
            <button
              type="button"
              role="switch"
              aria-checked={neonOn}
              onClick={() =>
                saveVipPatch({
                  vipNeonCoverEnabled: !neonOn,
                  customToast: !neonOn
                    ? `Đã BẬT Viền Bìa Màu Neon (${neonCoverMeta.name})!`
                    : 'Đã TẮT Viền Bìa Neon.'
                })
              }
              className="w-full text-left flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Viền Bìa Màu Neon VIP</span>
                </p>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  Phát sáng viền Neon quanh ảnh bìa hồ sơ &amp; danh bạ lớp
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black uppercase shrink-0 ${
                  neonOn ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {neonOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
              {VIP_NEON_COVER_THEMES.map(theme => {
                const selected = neonCoverColor === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={`${theme.name} - ${theme.desc}`}
                    onClick={() =>
                      saveVipPatch({
                        vipNeonCoverEnabled: true,
                        vipNeonCoverColor: theme.id,
                        customToast: `Đã bật viền bìa ${theme.name}!`
                      })
                    }
                    className={`h-6 px-2 rounded-full text-xs font-black text-slate-950 transition flex items-center gap-1 ${theme.swatchClass} ${
                      selected
                        ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-1 scale-105'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {selected && <Check className="w-2.5 h-2.5" />}
                    <span>{theme.name.replace('Neon ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. AIEOVIP Badge Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={tagOn}
            onClick={() =>
              saveVipPatch({
                vipTagEnabled: !tagOn,
                customToast: !tagOn
                  ? 'Đã BẬT huy hiệu AIEOVIP bên cạnh tên!'
                  : 'Đã TẮT huy hiệu AIEOVIP.'
              })
            }
            className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition ${
              tagOn
                ? 'bg-amber-50/90 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Nhãn AIEOVIP Cạnh Tên</span>
              </p>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Hiện huy hiệu AIEOVIP ánh kim bên cạnh tên của bạn
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-black uppercase shrink-0 ${
                tagOn ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tagOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </span>
          </button>
        </div>
      </div>
    );
  };

  const profileCardCls =
    'bg-white dark:bg-[#0F172B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]';
  const profileActionBtnCls =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F8FAFC] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#CBD5E1] dark:border-[#334155] text-[#334155] dark:text-slate-200 text-xs font-semibold transition';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#020618] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation & Header Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-xs font-semibold text-[#334155] dark:text-slate-200 bg-white dark:bg-[#0F172B] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {isTeacherViewer ? 'Quay Lại Quản Trị Giáo Viên' : 'Quay Lại Phòng Luyện Đề'}
        </button>

        {!isSelf && currentUser?.username && (
          <button
            type="button"
            onClick={() => {
              setSelectedProfileStudent(currentUser.username);
              setTempNoteText('');
            }}
            className={profileActionBtnCls}
          >
            <UserCheck className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Quay về Hồ Sơ Của Tôi ({currentUser.name})
          </button>
        )}
      </div>

      {/* Clean SaaS Profile Header: Compact 160-180px Cover Banner + Flat 1px Border + Unified Action Buttons */}
      <div className={`${profileCardCls} overflow-hidden mb-7`}>
        {/* 1. Compact Cover Photo / Banner Stage */}
        <div
          className={`relative w-full h-[160px] sm:h-[180px] overflow-hidden border-b border-[#E2E8F0] dark:border-[#334155] ${
            hasCustomCover ? 'bg-slate-100 dark:bg-slate-800' : heroBanner.heroClass
          }`}
        >
          {hasCustomCover && (
            <img
              src={student.profileCoverUrl}
              alt={`Ảnh bìa của ${student.name || student.username}`}
              className="w-full h-full object-cover object-center select-none"
            />
          )}

          {canEditTargetInfo && (
            <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-4 z-10 flex flex-wrap items-center justify-end gap-2">
              {isSelf && !studentHasCoverPermission && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Ảnh Nền Riêng (1 Tháng)', itemPrice: normalizedPayCfg.coverUnlockPrice })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/95 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 border border-[#CBD5E1] dark:border-[#334155] text-[#334155] dark:text-slate-200 text-xs font-semibold shadow-xs transition"
                >
                  <Lock className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                  <span>Mở Ảnh Nền ({unlockPriceLabel}/1T)</span>
                </button>
              )}
              {isSelf && studentHasCoverPermission && !isTargetTeacher && !isTargetSystemAdmin && student.customCoverExpiresAt > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Gia Hạn Ảnh Nền Riêng (+1 Tháng)', itemPrice: normalizedPayCfg.coverUnlockPrice, renew: true })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/95 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 border border-[#CBD5E1] dark:border-[#334155] text-[#334155] dark:text-slate-200 text-xs font-semibold shadow-xs transition"
                  title="Gia hạn thêm 30 ngày quyền Ảnh Nền Riêng"
                >
                  <Clock className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                  <span>Gia hạn ({coverRemainingText || '30 ngày'})</span>
                </button>
              )}
              <button
                type="button"
                onClick={openCustomizeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/95 hover:bg-white text-[#334155] dark:bg-slate-900/90 dark:hover:bg-slate-900 dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] text-xs font-semibold shadow-xs backdrop-blur-xs transition"
              >
                <Camera className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                <span>Đổi Ảnh Bìa</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Separate Profile Info & Controls Section Below Cover */}
        <div className="px-5 sm:px-8 pb-6 pt-3 bg-white dark:bg-[#0F172B]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 min-w-0">
              {/* Proportional Overlapping Avatar */}
              <div className="-mt-12 sm:-mt-14 relative z-20 shrink-0 w-fit">
                <div className="p-1 rounded-full bg-white dark:bg-[#0F172B] border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center justify-center">
                  <UserAvatarBadge
                    user={student}
                    sizeClass="w-24 h-24 sm:w-28 sm:h-28"
                    textClass="text-3xl sm:text-4xl"
                    rounded="rounded-full"
                  />
                </div>
                {canEditTargetInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelf) {
                        setShowAvatarModal(true);
                      } else {
                        setEditingTargetUser({
                          username: student.username,
                          name: student.name || '',
                          role: student.role || 'student',
                          targetBand: student.targetBand || 7.5,
                          studyGoal: student.studyGoal || '',
                          avatarUrl: student.avatarUrl || ''
                        });
                      }
                    }}
                    title="Đổi Avatar"
                    aria-label="Đổi Avatar"
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] shadow-xs flex items-center justify-center transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clean High-Contrast Profile Identity & Unified Action Buttons */}
              <div className="space-y-2 min-w-0 sm:pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172B] dark:text-white leading-tight">
                    <VipMemberName user={student} fallbackName={student.name} nameClassName="text-[#0F172B] dark:text-white" />
                  </h1>
                  {isTargetSystemAdmin ? (
                    <span className="text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-[#0F766E] dark:text-[#1EE1D6]" /> ADMIN &bull; Quản Trị Hệ Thống
                    </span>
                  ) : isTargetTeacher ? (
                    <span className="text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border border-[#CBD5E1] dark:border-[#334155] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#0F766E] dark:text-[#1EE1D6]" /> Giáo Viên IELTS
                    </span>
                  ) : (
                    <span className="text-xs bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#CCFBF1] dark:border-teal-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Học Viên Chính Thức
                    </span>
                  )}
                  {visibleTitle && !visibleTitle.isRoleBuiltIn && (
                    <button
                      type="button"
                      onClick={() => setShowTitlesModal(true)}
                      title="Bấm để xem bảng danh hiệu và cách đạt được"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border flex items-center gap-1 hover:scale-105 transition cursor-pointer ${visibleTitle.badgeClass}`}
                    >
                      <span>{visibleTitle.icon}</span>
                      <span>{visibleTitle.label}</span>
                    </button>
                  )}
                  {isSelf && student.showTitleBadge === false && (
                    <button
                      type="button"
                      onClick={() => setShowTitlesModal(true)}
                      className="text-xs bg-[#F8FAFC] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 border border-[#CBD5E1] dark:border-[#334155] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 transition"
                    >
                      <EyeOff className="w-3 h-3" /> Đang tắt danh hiệu
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Gia nhập: <b className="text-[#0F172B] dark:text-white tabular-nums">{student.joinedDate || '01/02/2026'}</b>
                  </span>
                  {!isTargetTeacher && !isTargetSystemAdmin && (
                    <span className="flex items-center gap-1.5 text-[#0F766E] dark:text-[#1EE1D6] font-semibold">
                      <Target className="w-3.5 h-3.5" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                    </span>
                  )}
                  {(student.studyGoal || isTargetTeacher || isTargetSystemAdmin) && (
                    <span className="text-xs text-[#334155] dark:text-slate-200 bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#334155]">
                      {isTargetSystemAdmin
                        ? `${student.studyGoal || 'Tiếp nhận góp ý & phát triển tính năng mới cho trung tâm'}`
                        : isTargetTeacher
                        ? `${student.studyGoal || BRAND_INFO.motto}`
                        : `${student.studyGoal}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {canEditTargetInfo && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTargetUser({
                            username: student.username,
                            name: student.name || '',
                            role: student.role || 'student',
                            targetBand: student.targetBand || 7.5,
                            studyGoal: student.studyGoal || '',
                            avatarUrl: student.avatarUrl || ''
                          })
                        }
                        className={profileActionBtnCls}
                      >
                        <Edit className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> {isTargetTeacher || isTargetSystemAdmin ? 'Chỉnh hồ sơ' : 'Chỉnh mục tiêu'}
                      </button>
                      <button
                        type="button"
                        onClick={openCustomizeModal}
                        className={profileActionBtnCls}
                      >
                        <Palette className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> Tùy Chỉnh Hình Nền &amp; Khung
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowTitlesModal(true)}
                    className={profileActionBtnCls}
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> Danh Hiệu ({titleSummary?.unlockedIds?.length || 1}/{titleSummary?.itemsWithProgress?.length || 18})
                  </button>
                  {isViewerSuperAdmin && !isTargetSystemAdmin && onOpenAdminTitleManager && (
                    <button
                      type="button"
                      onClick={() => onOpenAdminTitleManager(student.username)}
                      className={profileActionBtnCls}
                    >
                      <Crown className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> Tặng Danh Hiệu
                    </button>
                  )}
                  {isViewerSuperAdmin && !isTargetTeacher && !isTargetSystemAdmin && onToggleUserCoverUnlock && (
                    <button
                      type="button"
                      disabled={isTogglingCoverUnlock}
                      onClick={async () => {
                        if (studentHasCoverPermission && !window.confirm(`Khóa lại quyền tải Ảnh Nền Riêng của ${student.name || student.username}?`)) {
                          return;
                        }
                        setIsTogglingCoverUnlock(true);
                        await onToggleUserCoverUnlock(student.username, !studentHasCoverPermission);
                        setIsTogglingCoverUnlock(false);
                      }}
                      className={profileActionBtnCls}
                    >
                      {studentHasCoverPermission ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" /> Đã Mở Ảnh Nền
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" />{' '}
                          {student.coverUnlockRequestedAt > 0
                            ? `Duyệt Mở Ảnh Nền (${unlockPriceLabel})`
                            : `Mở Khóa Ảnh Nền (${unlockPriceLabel})`}
                        </>
                      )}
                    </button>
                  )}
                  {isViewerSuperAdmin && !isTargetTeacher && !isTargetSystemAdmin && onToggleUserSubscription && (
                    <button
                      type="button"
                      disabled={isTogglingSubscription}
                      onClick={async () => {
                        if (studentHasAieoVip && !window.confirm(`Thu hồi gói Ai eo VIP của ${student.name || student.username}?`)) {
                          return;
                        }
                        setIsTogglingSubscription(true);
                        await onToggleUserSubscription(student.username, 'aieo_vip', !studentHasAieoVip);
                        setIsTogglingSubscription(false);
                      }}
                      className={profileActionBtnCls}
                    >
                      <Crown className={`w-3.5 h-3.5 ${studentHasAieoVip ? 'text-[#0F766E] dark:text-[#1EE1D6]' : 'text-[#475569] dark:text-slate-400'}`} />
                      {studentHasAieoVip ? '✓ Đang mở Ai eo VIP (1T)' : '+ Cấp Ai eo VIP (1T)'}
                    </button>
                  )}
                  {isViewerSuperAdmin && student.role !== 'teacher' && onToggleUserSubscription && (
                    <button
                      type="button"
                      disabled={isTogglingSubscription}
                      onClick={async () => {
                        setIsTogglingSubscription(true);
                        await onToggleUserSubscription(student.username, 'room_ticket', true);
                        setIsTogglingSubscription(false);
                      }}
                      className={profileActionBtnCls}
                    >
                      +1 Vé Phòng (5k){(student.roomCreateCredits || 0) > 0 ? ` · Đang có ${student.roomCreateCredits}` : ''}
                    </button>
                  )}
                  {isSelf && onOpenAccountSecurity && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenAccountSecurity('password')}
                        className={profileActionBtnCls}
                      >
                        <Key className="w-3.5 h-3.5 text-[#475569] dark:text-slate-400" /> Đổi Mật Khẩu
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAccountSecurity('email')}
                        className={profileActionBtnCls}
                      >
                        <Mail className={`w-3.5 h-3.5 ${student.emailVerified ? 'text-[#0F766E] dark:text-[#1EE1D6]' : 'text-[#475569] dark:text-slate-400'}`} />
                        {student.emailVerified ? `Email OTP ✓ (${student.maskedEmail || student.email})` : 'Liên Kết Email OTP'}
                      </button>
                    </>
                  )}
                </div>

                {!isSelf && !isTeacherViewer && !isTargetSystemAdmin && (
                  <p className="text-xs text-[#475569] dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-3 h-3 text-[#0F766E] dark:text-[#1EE1D6]" /> Đang xem hồ sơ thành viên khác (chế độ chỉ xem; bài viết chi tiết &amp; nhận xét riêng được bảo mật).
                  </p>
                )}
              </div>
            </div>

            {/* Right Progress / Summary Card (on crisp neutral surface below cover) */}
            <div className="bg-[#F8FAFC] dark:bg-slate-800/80 rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] lg:text-right sm:min-w-[235px] shrink-0">
              {isTargetSystemAdmin ? (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6] font-bold mb-1">
                    Hòm Thư Góp Ý Web
                  </p>
                  <p className="text-base font-black text-[#0F172B] dark:text-white">{adminFeedbacks.length} góp ý đã tiếp nhận</p>
                  <p className="text-xs text-[#475569] dark:text-slate-300 font-semibold mt-1">
                    {adminFeedbacks.filter(f => f.status === 'done').length} đã thêm • {newFeedbacksCount} chờ đọc
                  </p>
                </div>
              ) : isTargetTeacher ? (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6] font-bold mb-1">
                    Hồ Sơ Giáo Viên
                  </p>
                  <p className="text-base font-black text-[#0F172B] dark:text-white">{BRAND_INFO.siteName}</p>
                  <p className="text-xs text-[#475569] dark:text-slate-300 font-semibold mt-1">
                    {tests.length} đề thi • {totalGradedByTeacher} bài đã chấm
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#475569] dark:text-slate-400 font-bold mb-1">Đánh Giá Tiến Độ</p>
                  {highestBand ? (
                    <div>
                      <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6] tabular-nums">
                        Band {highestBand} <span className="text-xs text-[#475569] dark:text-slate-400 font-semibold">/ {student.targetBand || 8.0}</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                        {highestBand >= (student.targetBand || 8.0)
                          ? 'Đã đạt mục tiêu đề ra!'
                          : `Còn ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band nữa để đạt mục tiêu`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chưa có kết quả bài thi</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Profile Content + Right Sticky Member Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6 min-w-0">

      {/* SYSTEM ADMIN PROFILE: DEDICATED DONATE QR + FEEDBACK & FEATURE REQUEST INBOX */}
      {isTargetSystemAdmin ? (() => {
        const donateBankCode = normalizedPayCfg.bankCode || 'MB';
        const donateAccountNumber = normalizedPayCfg.accountNumber || '0335613426';
        const donateAccountName = normalizedPayCfg.accountName || 'NGUYEN HOANG TUAN';
        const donateAddInfo = 'UNG HO ADMIN TUAN DUY TRI WEB IELTS';
        const dynamicDonateQr = buildVietQrImageUrl({
          bankCode: donateBankCode,
          accountNumber: donateAccountNumber,
          accountName: donateAccountName,
          amount: donateAmount,
          addInfo: donateAddInfo
        });
        const adminDonateQrSrc = normalizedPayCfg.donateQrUrl || dynamicDonateQr;

        return (
        <div className="space-y-6">
          {isSelf && (
            <div className={`${profileCardCls} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Đặc Quyền Hiển Thị ADMIN / Ai eo VIP
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                    Quản trị viên có thể bật/tắt nhanh chữ màu đỏ VIP và nhãn AIEOVIP cạnh tên hiển thị.
                  </p>
                </div>
              </div>
              {renderVipAppearanceSwitches()}
            </div>
          )}

          {/* Dedicated Admin Donate / Web Maintenance QR Card (Neutral & Teal Palette) */}
          <div className={`${profileCardCls} p-5 sm:p-6`}>
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="shrink-0 bg-[#F8FAFC] dark:bg-slate-900 p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col items-center gap-1.5">
                {adminDonateQrSrc ? (
                  <img
                    src={adminDonateQrSrc}
                    alt="Mã QR Ủng Hộ Admin Tuấn"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-500 text-center p-4">
                    Chưa cấu hình QR ủng hộ
                  </div>
                )}
                <span className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> VietQR Ủng Hộ Riêng Admin Tuấn
                </span>
              </div>

              <div className="flex-1 space-y-3 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#CCFBF1] dark:border-teal-500/30 text-xs font-bold">
                    <Heart className="w-3.5 h-3.5" /> Quỹ Duy Trì Website &amp; Server
                  </span>
                  {donateAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#334155] text-[#0F766E] dark:text-[#1EE1D6] text-xs font-bold">
                      Mức gợi ý: {formatVndCurrency(donateAmount)}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white">
                    Ủng Hộ Admin Tuấn Chi Phí Duy Trì Trang Web &amp; Server
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {normalizedPayCfg.donateMessage ||
                      'Mọi khoản đóng góp tùy tâm đều giúp Tuấn duy trì máy chủ, tên miền, API chấm AI và phát triển thêm nhiều tính năng mới miễn phí cho cộng đồng.'}
                  </p>
                </div>

                {!normalizedPayCfg.donateQrUrl && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { val: 0, label: 'Tùy tâm' },
                      { val: 10000, label: '10.000đ' },
                      { val: 20000, label: '20.000đ' },
                      { val: 50000, label: '50.000đ' },
                      { val: 100000, label: '100.000đ' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setDonateAmount(opt.val)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition ${
                          donateAmount === opt.val
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-[#CBD5E1] dark:border-[#334155] hover:border-[#0F766E]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-[6px] bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#334155] font-semibold text-[#0F172B] dark:text-slate-100">
                    <span className="text-[#475569] dark:text-slate-400">Ngân hàng:</span> <b>{normalizedPayCfg.bankName || donateBankCode}</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(donateAccountNumber);
                      showToast?.(`Đã sao chép STK ${donateAccountNumber}!`);
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#334155] hover:border-[#0F766E] font-bold text-[#0F172B] dark:text-slate-100 inline-flex items-center gap-1.5 transition"
                  >
                    <span className="text-[#475569] dark:text-slate-400 font-normal">STK:</span>
                    <span className="font-mono">{donateAccountNumber}</span>
                    <Copy className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#1EE1D6]" />
                  </button>
                  <div className="px-3 py-1.5 rounded-[6px] bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#334155] font-semibold text-[#0F172B] dark:text-slate-100">
                    <b>{donateAccountName}</b>
                  </div>
                </div>

                <p className="text-xs font-semibold text-[#0F766E] dark:text-[#1EE1D6]">
                  Cảm ơn bạn đã ủng hộ &amp; tin tưởng đồng hành cùng website Luyện Thi IELTS Nha Trang!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Submit New Feedback Card (Unified Primary Teal) */}
            <form
              onSubmit={handleSendAdminFeedback}
              className={`xl:col-span-5 ${profileCardCls} p-6 space-y-4 h-fit`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] dark:bg-teal-500/15 border border-[#CCFBF1] dark:border-teal-500/30 text-[#0F766E] dark:text-[#1EE1D6] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white">
                    Gửi Góp Ý &amp; Yêu Cầu Tính Năng
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    Đề xuất tính năng mới hoặc báo lỗi để Quản Trị Hệ Thống nâng cấp website theo nhu cầu của bạn.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-2">
                  Phân loại góp ý
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'feature', label: '✨ Tính năng mới' },
                    { id: 'ui', label: '🎨 Giao diện / UX' },
                    { id: 'bug', label: '🐞 Báo lỗi hệ thống' },
                    { id: 'other', label: '💬 Góp ý khác' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFbCategory(cat.id)}
                      className={`px-3 py-2 rounded-[6px] border text-xs font-semibold text-left transition ${
                        fbCategory === cat.id
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-[#334155] hover:border-[#0F766E]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={fbContent}
                  onChange={e => setFbContent(e.target.value)}
                  placeholder="Ví dụ: Em muốn có thêm phần luyện phát âm từng từ vựng, hoặc giáo viên muốn lọc điểm theo từng tuần..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:outline-none resize-y"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{fbContent.length}/2000 ký tự</p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fbPrivate}
                  onChange={e => setFbPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0F766E] accent-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>Gửi riêng tư (chỉ bạn và Quản trị hệ thống đọc được)</span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi Góp Ý Đến Quản Trị
              </button>
            </form>

            {/* Feedback List & Admin Triage Board */}
            <div className={`xl:col-span-7 ${profileCardCls} p-6 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
                    Bảng Góp Ý &amp; Tiến Độ Cập Nhật ({filteredFeedbacks.length})
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                    {isViewerSuperAdmin
                      ? 'Bạn đang xem với quyền Quản Trị Hệ Thống - hãy cập nhật trạng thái & phản hồi trực tiếp bên dưới.'
                      : 'Theo dõi các góp ý từ Học viên & Giáo viên và phản hồi trực tiếp từ Quản Trị Hệ Thống.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  {[
                    { id: 'all', label: `Tất cả (${adminFeedbacks.length})` },
                    { id: 'new', label: `Mới (${adminFeedbacks.filter(f => f.status === 'new').length})` },
                    { id: 'planned', label: `Đang làm (${adminFeedbacks.filter(f => f.status === 'planned').length})` },
                    { id: 'done', label: `Đã thêm (${adminFeedbacks.filter(f => f.status === 'done').length})` }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFbStatusFilter(st.id)}
                      className={`px-2.5 py-1.5 rounded-[6px] border transition ${
                        fbStatusFilter === st.id
                          ? 'bg-[#0F766E] text-white border-[#0F766E]'
                          : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-[#334155] hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFeedbacks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-[#475569] dark:text-slate-400">
                    Chưa có góp ý nào trong mục này.
                  </p>
                  <p className="text-xs text-slate-400">
                    Hãy gửi đề xuất đầu tiên ở khung bên trái để Quản Trị bổ sung tính năng bạn cần!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFeedbacks.map(fb => {
                    const catLabel =
                      fb.category === 'bug'
                        ? '🐞 Báo lỗi'
                        : fb.category === 'ui'
                        ? '🎨 Giao diện'
                        : fb.category === 'other'
                        ? '💬 Khác'
                        : '✨ Tính năng mới';
                    const statusBadge =
                      fb.status === 'done'
                        ? { text: 'Đã thêm tính năng', cls: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', Icon: CheckCircle2 }
                        : fb.status === 'planned'
                        ? { text: 'Đang triển khai', cls: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30', Icon: Clock }
                        : { text: 'Mới gửi', cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', Icon: Sparkles };
                    const StatusIcon = statusBadge.Icon;
                    const canDeleteFb = isViewerSuperAdmin || fb.authorUsername === currentUser?.username;
                    const draftStatus = statusDrafts[fb.id] || fb.status || 'new';
                    const draftReply = replyDrafts[fb.id] !== undefined ? replyDrafts[fb.id] : (fb.adminReply || '');

                    return (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-slate-800/40 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-[#0F172B] dark:text-white">
                              {fb.authorName || fb.authorUsername}
                            </span>
                            <span className="text-xs font-mono text-slate-400">@{fb.authorUsername}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              fb.authorRole === 'teacher'
                                ? 'bg-slate-100 dark:bg-slate-800 text-[#334155] dark:text-slate-200'
                                : fb.authorRole === 'superadmin'
                                ? 'bg-slate-200/80 dark:bg-slate-700 text-[#0F172B] dark:text-white'
                                : 'bg-[#F0FDFA] dark:bg-teal-500/20 text-[#0F766E] dark:text-[#1EE1D6]'
                            }`}>
                              {fb.authorRole === 'teacher' ? 'Giáo viên' : fb.authorRole === 'superadmin' ? 'Quản trị' : 'Học viên'}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-slate-300">
                              {catLabel}
                            </span>
                            {fb.isPrivate && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                                <Lock className="w-2.5 h-2.5" /> Riêng tư
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}>
                              <StatusIcon className="w-3 h-3" /> {statusBadge.text}
                            </span>
                            {canDeleteFb && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFeedbackItem(fb.id)}
                                title="Xóa góp ý"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-[#0F172B] dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {fb.content}
                        </p>

                        <div className="text-xs text-slate-400">
                          Gửi lúc: {fb.createdAt}
                        </div>

                        {fb.adminReply && !isViewerSuperAdmin && (
                          <div className="p-3 rounded-xl bg-[#F0FDFA] dark:bg-teal-950/30 border border-[#CCFBF1] dark:border-teal-500/30 space-y-1">
                            <p className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Phản hồi từ Quản Trị Hệ Thống {fb.repliedAt ? `(${fb.repliedAt})` : ''}
                            </p>
                            <p className="text-xs text-[#334155] dark:text-slate-200 whitespace-pre-wrap">
                              {fb.adminReply}
                            </p>
                          </div>
                        )}

                        {isViewerSuperAdmin && (
                          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-700/70 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#475569] dark:text-slate-400">Trạng thái xử lý:</span>
                              <select
                                value={draftStatus}
                                onChange={e => setStatusDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-slate-900 border border-[#CBD5E1] dark:border-[#334155] text-xs font-bold text-[#0F172B] dark:text-slate-100"
                              >
                                <option value="new">Mới gửi</option>
                                <option value="planned">Đang triển khai</option>
                                <option value="done">Đã thêm tính năng</option>
                              </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={draftReply}
                                onChange={e => setReplyDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                placeholder="Nhập phản hồi của Quản trị gửi học viên / giáo viên..."
                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 text-[#0F172B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateFeedbackByAdmin(fb)}
                                className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition"
                              >
                                <Save className="w-3.5 h-3.5" /> Lưu phản hồi
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })() : isTargetTeacher ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Kho Đề Thi</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-white">{tests.length}</p>
                <span className="text-xs text-[#475569] dark:text-slate-400">{publicTests.length} đề công khai</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Bài Đã Chấm</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-white">{totalGradedByTeacher}</p>
                <span className="text-xs text-[#475569] dark:text-slate-400">Writing &amp; Nhận xét</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Phòng Đấu Game</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-white">{totalActiveRooms}</p>
                <span className="text-xs text-[#475569] dark:text-slate-400">PIN hiện tại: {currentRoomPin}</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Thành Viên Lớp</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-white">
                  {allMembers.filter(m => m.role !== 'teacher').length}
                </p>
                <span className="text-xs text-[#475569] dark:text-slate-400">Học viên đang theo học</span>
              </div>
            </div>
          </div>

          {/* Contact & Support Info */}
          <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
              Thông Tin Liên Hệ &amp; Hỗ Trợ Học Viên
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <a
                href={BRAND_INFO.phoneHref}
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0F766E] transition flex items-start gap-3"
              >
                <Phone className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#475569] dark:text-slate-400 uppercase text-xs">Hotline / Zalo</p>
                  <p className="font-extrabold text-[#0F172B] dark:text-white text-sm mt-0.5">{BRAND_INFO.phoneDisplay}</p>
                </div>
              </a>
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155] flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#475569] dark:text-slate-400 uppercase text-xs">Cơ Sở Giảng Dạy</p>
                  <p className="font-bold text-[#0F172B] dark:text-slate-200 mt-0.5 leading-snug">{BRAND_INFO.address}</p>
                </div>
              </div>
              <a
                href={BRAND_INFO.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0F766E] transition flex items-start gap-3"
              >
                <Globe className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[#475569] dark:text-slate-400 uppercase text-xs">Facebook Fanpage</p>
                  <p className="font-bold text-[#0F766E] dark:text-[#1EE1D6] mt-0.5 truncate flex items-center gap-1">
                    {BRAND_INFO.facebookHandle} <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
              <a
                href={BRAND_INFO.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0F766E] transition flex items-start gap-3"
              >
                <BookOpen className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[#475569] dark:text-slate-400 uppercase text-xs">Blog Tài Liệu IELTS</p>
                  <p className="font-bold text-[#0F766E] dark:text-[#1EE1D6] mt-0.5 truncate flex items-center gap-1">
                    luyenthiieltsnhatrang <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Public Exams Showcase */}
          <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
                  Đề Thi Thử IELTS Đang Phát Hành ({publicTests.length})
                </h2>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                  Bộ đề luyện thi chuẩn máy tính do giáo viên biên soạn và cập nhật.
                </p>
              </div>
              {isTeacherViewer && (
                <button
                  type="button"
                  onClick={() => setView('TEACHER_DASHBOARD')}
                  className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
                >
                  Quản Lý Kho Đề →
                </button>
              )}
            </div>
            {publicTests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Hiện chưa có đề thi công khai nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTests.map(t => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-slate-800/50 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#0F172B] dark:text-white line-clamp-2">{t.title}</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 line-clamp-2">
                        {t.description || 'Đề thi thử IELTS 3 kỹ năng chuẩn quốc tế.'}
                      </p>
                    </div>
                    {startExam && (
                      <button
                        type="button"
                        onClick={() => startExam(t.id)}
                        className="w-full py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Làm Đề Này
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 4 Summary Metric Cards (Student Profile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Tổng Số Lần Thi</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-white">{totalAttempts} <span className="text-xs font-normal text-[#475569] dark:text-slate-400">lần</span></p>
              </div>
            </div>

            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Band Cao Nhất</p>
                <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6]">{highestBand ?? '-'}</p>
              </div>
            </div>

            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Điểm Overall Trung Bình</p>
                <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6]">{overallAvg ?? '-'}</p>
                {totalAttempts > 0 && (
                  <span className="text-xs block font-semibold text-[#475569] dark:text-slate-400 mt-0.5">
                    L: {avgListening ?? '-'} • R: {avgReading ?? '-'} • W: {avgWriting ?? 'Chờ'}
                  </span>
                )}
              </div>
            </div>

            {isTeacherViewer ? (
              <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
                <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Chống Gian Lận (Tab)</p>
                  <p className={`text-xl font-black ${avgTabSwitches <= 1 ? 'text-[#0F766E] dark:text-[#1EE1D6]' : 'text-amber-600 dark:text-amber-400'}`}>
                    {avgTabSwitches <= 1 ? 'An toàn' : 'Cần chú ý'}
                    <span className="text-xs block font-normal text-[#475569] dark:text-slate-400">TB {avgTabSwitches} lần/bài</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
                <div className="p-3 bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Mục Tiêu Band</p>
                  <p className="text-2xl font-black text-[#0F172B] dark:text-white">
                    Band {student.targetBand || '8.0'}
                  </p>
                  <span className="text-xs block font-normal text-[#475569] dark:text-slate-400 mt-0.5">
                    {highestBand && highestBand >= (student.targetBand || 8.0)
                      ? 'Đã chạm mốc mục tiêu'
                      : highestBand
                        ? `Cần thêm ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band`
                        : 'Luyện tập đều đặn mỗi ngày'}
                  </span>
                </div>
              </div>
            )}
          </div>

      {/* Gói Thành Viên 1 Tháng & Tùy Chỉnh Ai eo VIP */}
      {(isSelf || isViewerSuperAdmin) && (
        <div className={`${profileCardCls} p-5 sm:p-6 mb-8`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
                Gói Thành Viên 1 Tháng &amp; Đặc Quyền Ai eo VIP
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Mở khóa 30 ngày luyện Bài Tập 4 Kỹ Năng, Ảnh Bìa Riêng hoặc nâng cấp trọn bộ Ai eo VIP cùng bạn bè.
              </p>
            </div>
            {studentHasAieoVip && (
              <span className="vip-shimmer-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white text-xs font-black shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                AIEOVIP Active {aieoVipRemainingText ? `• ${aieoVipRemainingText}` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
            {/* Card 1: Bài Tập 4 Kỹ Năng (Miễn phí) & Đề 3 Kỹ Năng Đã Mua */}
            <div className="rounded-xl border p-4 flex flex-col justify-between gap-3 bg-[#F8FAFC] dark:bg-slate-800/50 border-[#E2E8F0] dark:border-[#334155]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Bài Tập 4 Kỹ Năng
                  </span>
                  <span className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] bg-[#F0FDFA] dark:bg-teal-500/20 border border-[#CCFBF1] dark:border-teal-500/30 px-2 py-0.5 rounded-full">
                    Miễn Phí
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Luyện Đọc, Nghe, Viết &amp; Speaking AI miễn phí 100%. Bộ Đề Thi 3 Kỹ Năng nâng cao có giá riêng theo từng đề ({(student.purchasedTestIds || []).length} đề đã mua).
                </p>
                <p className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6]">
                  ✓ Sẵn sàng mở không giới hạn
                </p>
              </div>
              {isSelf && (
                <button
                  type="button"
                  onClick={() => setView('HOME')}
                  className="w-full py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
                >
                  Xem Kho Đề Thi 3 Kỹ Năng
                </button>
              )}
            </div>

            {/* Card 2: Gói Ai eo VIP (80k / 1 tháng) */}
            <div className={`rounded-xl border p-4 flex flex-col justify-between gap-3 relative overflow-hidden ${
              studentHasAieoVip
                ? 'bg-[#F0FDFA] dark:bg-teal-950/20 border-[#0F766E]/40 dark:border-teal-500/50'
                : 'bg-[#F8FAFC] dark:bg-slate-800/50 border-[#E2E8F0] dark:border-[#334155]'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#0F172B] dark:text-white flex items-center gap-1">
                    <Crown className="w-4 h-4 text-amber-500" /> Gói Ai eo VIP
                  </span>
                  <span className="text-xs font-black text-white bg-gradient-to-r from-red-600 to-amber-500 px-2 py-0.5 rounded-full">
                    {aieoVipPriceLabel}/1T
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  • <b>Ảnh Avatar Động (.GIF/.WebP)</b> • Đổi <b>Màu Chữ Tên</b> &amp; Nhãn <b>AIEOVIP</b> • <b>Viền Bìa &amp; Thẻ LED Neon</b> + Miễn phí <b>Ảnh Nền Cá Nhân</b> • <b>3 Khung Avatar Neon VIP</b> • Tạo phòng Game bạn bè vô hạn • Danh hiệu <b>👑 Ai eo VIP</b>.
                </p>
                <p className={`text-xs font-bold ${studentHasAieoVip ? 'text-[#0F766E] dark:text-[#1EE1D6]' : 'text-slate-600 dark:text-slate-300'}`}>
                  {studentHasAieoVip
                    ? `✓ Đang mở VIP (${aieoVipRemainingText || '30 ngày'})`
                    : 'Gói đầy đủ đặc quyền tháng'}
                </p>
              </div>
              {isSelf && (
                <button
                  type="button"
                  onClick={() =>
                    setCheckoutModalState({
                      itemType: 'aieo_vip',
                      itemId: '',
                      itemLabel: 'Gói Ai eo VIP Full Quyền (1 Tháng)',
                      itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND,
                      renew: studentHasAieoVip
                    })
                  }
                  className="vip-shimmer-badge w-full py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold transition"
                >
                  {studentHasAieoVip
                    ? `Gia hạn VIP +30N (${aieoVipPriceLabel})`
                    : `Đăng Ký Ai eo VIP (${aieoVipPriceLabel})`}
                </button>
              )}
            </div>

            {/* Card 3: Ảnh Nền Riêng (5k / 1 tháng) */}
            <div className="rounded-xl border p-4 flex flex-col justify-between gap-3 bg-[#F8FAFC] dark:bg-slate-800/50 border-[#E2E8F0] dark:border-[#334155]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1">
                    <Camera className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Ảnh Nền Cá Nhân
                  </span>
                  <span className="text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] px-2 py-0.5 rounded-full">
                    {unlockPriceLabel}/1T
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tải &amp; cắt ảnh bìa cá nhân tùy thích cho hồ sơ (gói 1 tháng).
                </p>
                <p className={`text-xs font-bold ${studentHasCoverPermission ? 'text-[#0F766E] dark:text-[#1EE1D6]' : 'text-[#475569] dark:text-slate-400'}`}>
                  {studentHasCoverPermission
                    ? coverRemainingText
                      ? `✓ Đang mở (${coverRemainingText})`
                      : studentHasAieoVip
                      ? `✓ Đã gồm miễn phí trong Ai eo VIP (${aieoVipRemainingText || '30 ngày'})`
                      : '✓ Đang mở khóa'
                    : 'Chưa mở khóa'}
                </p>
              </div>
              {isSelf && !studentHasAieoVip && (
                <button
                  type="button"
                  onClick={() =>
                    setCheckoutModalState({
                      itemType: 'cover',
                      itemId: '',
                      itemLabel: studentHasCoverPermission ? 'Gia Hạn Ảnh Nền Riêng (+1 Tháng)' : 'Ảnh Nền Riêng (1 Tháng)',
                      itemPrice: normalizedPayCfg.coverUnlockPrice,
                      renew: studentHasCoverPermission && student.customCoverExpiresAt > 0
                    })
                  }
                  className="w-full py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
                >
                  {studentHasCoverPermission && student.customCoverExpiresAt > 0
                    ? `Gia hạn +30N (${unlockPriceLabel})`
                    : `Mở Ảnh Nền (${unlockPriceLabel})`}
                </button>
              )}
              {isSelf && studentHasAieoVip && (
                <button
                  type="button"
                  onClick={openCustomizeModal}
                  className="w-full py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
                >
                  Đổi Ảnh Bìa Ngay
                </button>
              )}
            </div>
          </div>

          {renderVipAppearanceSwitches()}
        </div>
      )}

      {/* SECTION 1: TIẾN TRÌNH & ĐỘT PHÁ ĐIỂM SỐ QUA CÁC LẦN THI (SCORE PROGRESSION TIMELINE) */}
      <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
              Tiến Trình & Đột Phá Điểm Số Qua Các Lần Thi
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
              Theo dõi sự thay đổi band điểm qua từng bài thi từ lần đầu tiên đến lần thi gần nhất.
            </p>
          </div>

          {bandGrowth && Number(bandGrowth) > 0 && (
            <span className="bg-[#F0FDFA] dark:bg-teal-500/15 text-[#0F766E] dark:text-[#1EE1D6] border border-[#CCFBF1] dark:border-teal-500/30 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Tăng trưởng: +{bandGrowth} Band Overall!
            </span>
          )}
        </div>

        {totalAttempts === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Học viên chưa có bài thi nào để phân tích tiến trình điểm.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chronological Trajectory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {chronologicalAttempts.map((att, idx) => (
                <div
                  key={att.id}
                  className={`rounded-xl p-5 border transition ${
                    idx === chronologicalAttempts.length - 1
                      ? 'bg-[#F0FDFA]/60 dark:bg-teal-950/20 border-[#0F766E]/40 dark:border-teal-500/40'
                      : 'bg-[#F8FAFC] dark:bg-slate-800/50 border-[#E2E8F0] dark:border-[#334155]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      idx === chronologicalAttempts.length - 1
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-white dark:bg-slate-700 text-[#334155] dark:text-slate-200 border border-[#E2E8F0] dark:border-[#334155]'
                    }`}>
                      Lần thi #{idx + 1} {idx === chronologicalAttempts.length - 1 ? '(Gần nhất)' : ''}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-[#475569] dark:text-slate-400 font-medium block">{att.submittedAt}</span>
                      {Number(att.durationSeconds) > 0 && (
                        <span className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] block">
                          {formatDurationVi(att.durationSeconds)}
                          {att.timelinessStatus === 'late' ? ` • Trễ ${att.lateByMinutes || 1}p` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-[#0F172B] dark:text-slate-100 text-sm mb-3 line-clamp-1">{att.testTitle}</p>

                  <div className="flex items-center justify-between py-2 border-y border-[#E2E8F0] dark:border-slate-700/70 mb-3">
                    <span className="text-xs text-[#475569] dark:text-slate-400 font-semibold">Band Overall:</span>
                    <span className="text-xl font-black text-[#0F766E] dark:text-[#1EE1D6] bg-[#F0FDFA] dark:bg-teal-500/15 px-2.5 py-0.5 rounded-lg border border-[#CCFBF1] dark:border-teal-500/30">
                      {att.overallBand ?? 'Chờ'}
                    </span>
                  </div>

                  {/* Skill breakdown mini bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Listening
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores?.listening?.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${((att.scores?.listening?.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Reading
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{att.scores?.reading?.band ?? '-'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${((att.scores?.reading?.band || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <PenTool className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {att.scores?.speaking ? 'Speaking AI' : 'Writing'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {att.scores?.speaking ? (att.scores.speaking.band ?? '-') : (att.scores?.writing?.overallBand ?? '-')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(((att.scores?.speaking ? att.scores.speaking.band : att.scores?.writing?.overallBand) || 0) / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {canInspectAttemptDetails && (
                    <button
                      onClick={() => {
                        setSelectedAttemptId(att.id);
                        setPreviousView('STUDENT_PROFILE');
                        setView('RESULT_VIEW');
                      }}
                      className="mt-4 w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold py-2 rounded-xl transition shadow-sm"
                    >
                      Xem Chi Tiết Bài Làm →
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Skill Growth Highlights */}
            {firstAttempt && latestAttempt && totalAttempts > 1 && (
              <div className="bg-[#F8FAFC] dark:bg-slate-800/60 rounded-lg p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    key: 'listening',
                    label: 'Tiến Độ Listening',
                    Icon: Headphones,
                    iconWrap: 'bg-[#EFF6FF] dark:bg-blue-500/20 text-[#1D4ED8] dark:text-blue-300',
                    latestCls: 'text-[#1D4ED8] dark:text-blue-400',
                    firstBand: firstAttempt.scores?.listening?.band,
                    latestBand: latestAttempt.scores?.listening?.band
                  },
                  {
                    key: 'reading',
                    label: 'Tiến Độ Reading',
                    Icon: BookOpen,
                    iconWrap: 'bg-[#EDFFFD] dark:bg-teal-500/20 text-[#0F766E] dark:text-[#1EE1D6]',
                    latestCls: 'text-[#0F766E] dark:text-[#1EE1D6]',
                    firstBand: firstAttempt.scores?.reading?.band,
                    latestBand: latestAttempt.scores?.reading?.band
                  },
                  {
                    key: 'writing',
                    label: 'Tiến Độ Writing',
                    Icon: PenTool,
                    iconWrap: 'bg-[#D1FAE5] dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-300',
                    latestCls: 'text-[#065F46] dark:text-emerald-400',
                    firstBand: firstAttempt.scores?.writing?.overallBand,
                    latestBand: latestAttempt.scores?.writing?.overallBand
                  }
                ].map(({ key, label, Icon, iconWrap, latestCls, firstBand, latestBand }) => {
                  const hasFirst = typeof firstBand === 'number';
                  const hasLatest = typeof latestBand === 'number';
                  const delta = hasFirst && hasLatest ? latestBand - firstBand : null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`p-2.5 ${iconWrap} rounded-xl font-bold text-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">{label}</p>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {hasFirst ? `Band ${firstBand}` : 'Chờ chấm'} →{' '}
                          <b className={latestCls}>{hasLatest ? `Band ${latestBand}` : 'Chờ chấm'}</b>
                          {delta !== null && (
                            <span
                              className={`text-xs font-bold ml-1.5 ${
                                delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : delta < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-[#475569] dark:text-slate-400'
                              }`}
                            >
                              ({delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: BẢNG LỊCH SỬ CHI TIẾT TẤT CẢ CÁC LẦN THI */}
      <div className={`${profileCardCls} p-6 mb-8 space-y-5`}>
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
              Lịch Sử Chi Tiết Từng Lần Thi
            </h2>
            <p className="text-sm text-[#475569] dark:text-slate-400 mt-0.5 max-w-2xl">Danh sách các bài thi đã hoàn thành của học viên {student.name}.</p>
          </div>
          <span className="text-xs font-bold text-[#475569] dark:text-slate-400">Tổng cộng: {studentAttempts.length} bài thi</span>
        </div>

        {studentAttempts.length === 0 ? (
          <div className="py-10 border-t border-[#E2E8F0] dark:border-slate-800 text-center text-[#475569] dark:text-slate-400 text-sm">
            Chưa có dữ liệu bài thi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#334155] dark:text-slate-300">
              <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 border-y border-[#E2E8F0] dark:border-slate-700 text-xs text-[#334155] dark:text-slate-300 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Đề Thi</th>
                  <th className="px-6 py-3.5">Thời Gian Nộp</th>
                  <th className="px-6 py-3.5 text-center">Listening</th>
                  <th className="px-6 py-3.5 text-center">Reading</th>
                  <th className="px-6 py-3.5 text-center">Writing</th>
                  <th className="px-6 py-3.5 text-center">Overall Band</th>
                  {isTeacherViewer && (
                    <th className="px-6 py-3.5 text-center">Gian Lận (Tab)</th>
                  )}
                  {canInspectAttemptDetails && (
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Chi Tiết</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-slate-800">
                {studentAttempts.map((att, idx) => {
                  const risk = isTeacherViewer ? getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs) : null;
                  const extSignals = isTeacherViewer ? countExtensionCheatSignals(att.antiCheatLogs) : 0;
                  const RiskIcon = risk?.icon;

                  return (
                    <tr key={att.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F172B] dark:text-white">{att.testTitle}</p>
                        <span className="text-xs font-medium text-[#475569] dark:text-slate-400">Lần thi #{studentAttempts.length - idx}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#475569] dark:text-slate-400">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#0F172B] dark:text-slate-200 block">{att.submittedAt}</span>
                          {Number(att.durationSeconds) > 0 && (
                            <span className="text-xs text-slate-400 block">
                              Làm trong {formatDurationVi(att.durationSeconds)}
                            </span>
                          )}
                          {att.timelinessStatus === 'late' ? (
                            <span className="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                              Nộp muộn{att.lateByMinutes ? ` ${att.lateByMinutes}p` : ''}
                            </span>
                          ) : att.timelinessStatus === 'on_time' ? (
                            <span className="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              Đúng hạn
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-[#0F172B] dark:text-slate-100">{att.scores?.listening?.band ?? '-'}</span>
                        <span className="text-xs text-slate-400 block font-normal">({att.scores?.listening?.raw || 0}/{att.scores?.listening?.total || 0} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-[#0F172B] dark:text-slate-100">{att.scores?.reading?.band ?? '-'}</span>
                        <span className="text-xs text-slate-400 block font-normal">({att.scores?.reading?.raw || 0}/{att.scores?.reading?.total || 0} câu)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {att.scores?.speaking ? (
                          <>
                            <span className="font-bold text-[#0F766E] dark:text-[#1EE1D6]">Spk {att.scores.speaking.band ?? '-'}</span>
                            <span className="text-xs text-slate-400 block font-normal">Speaking AI</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-[#0F172B] dark:text-slate-100">{att.scores?.writing?.overallBand ?? (att.testMode === 'single_skill' ? '-' : 'Chờ chấm')}</span>
                            <span className="text-xs text-slate-400 block font-normal">T1: {att.scores?.writing?.task1Band ?? '-'} | T2: {att.scores?.writing?.task2Band ?? '-'}</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-black text-[#0F766E] dark:text-[#1EE1D6] bg-[#F0FDFA] dark:bg-teal-500/15 px-3 py-1 rounded-lg border border-[#CCFBF1] dark:border-teal-500/30">
                          {att.overallBand ?? 'Chờ'}
                        </span>
                      </td>
                      {isTeacherViewer && risk && (
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${risk.color}`}>
                              <RiskIcon className="w-3 h-3" />
                              {risk.label} ({att.tabSwitchCount})
                            </span>
                            {extSignals > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Extension / Bypass: {extSignals}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {canInspectAttemptDetails && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedAttemptId(att.id);
                              setPreviousView('STUDENT_PROFILE');
                              setView('RESULT_VIEW');
                            }}
                            className="whitespace-nowrap inline-flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#0F766E] text-[#0F766E] dark:text-[#1EE1D6] hover:text-white dark:hover:bg-[#0D9488] dark:hover:text-white border border-[#CBD5E1] dark:border-[#334155] hover:border-[#0F766E] text-xs px-3.5 py-1.5 rounded-[6px] font-semibold transition"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN (Bảo mật riêng giữa GV & HS) */}
      {canSeeTeacherNotes && (
      <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
        <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] dark:border-slate-800 mb-4 gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
              Đánh Giá & Nhận Xét Của Giáo Viên Quản Nhiệm
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">Lời khuyên, phân tích điểm yếu và lộ trình rèn luyện cá nhân hóa.</p>
          </div>
          <span className="text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border border-[#E2E8F0] dark:border-[#334155] px-3 py-1 rounded-full font-semibold">
            Ms. Như (Giáo Viên Phụ Trách)
          </span>
        </div>

        {isTeacherViewer ? (
          <div className="space-y-4">
            <textarea
              rows={4}
              value={tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '')}
              onChange={e => setTempNoteText(e.target.value)}
              placeholder="Nhập nhận xét chi tiết về quá trình học tập, các điểm cần khắc phục và định hướng cho học viên này..."
              className="w-full p-4 text-xs leading-relaxed bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:outline-none font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const textToSave = tempNoteText !== '' ? tempNoteText : (teacherNotes[activeUsername] || '');
                  setTeacherNotes(prev => ({ ...prev, [activeUsername]: textToSave }));
                  dispatchSyncAction('UPSERT_NOTE', { username: activeUsername, text: textToSave });
                  showToast('Đã lưu nhận xét hồ sơ học viên thành công!');
                }}
                className="bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu Nhận Xét Hồ Sơ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#F8FAFC] dark:bg-slate-800/60 rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs text-[#334155] dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
              {teacherNotes[activeUsername] || 'Chưa có ghi chú nhận xét nào từ giáo viên. Hãy làm thêm các bài thi thử để giáo viên đánh giá năng lực.'}
            </p>
          </div>
        )}
      </div>
      )}
        </>
      )}

      {/* SECTION 4: THÀNH TÍCH ĐẤU TRƯỜNG TỪ VỰNG CHICKEN INVADERS (Clean Light/Dark Unified Surface) */}
      <div className={`${profileCardCls} p-6 sm:p-8`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[#0F766E] dark:text-[#1EE1D6]" />
              Thành Tích Đấu Trường Game Từ Vựng (IELTS Chicken Invaders)
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">Kết quả rèn luyện phản xạ từ vựng, ngữ nghĩa và chính tả qua game 4 vòng.</p>
          </div>
          <button
            onClick={() => {
              if (isTeacherViewer) {
                handleTeacherOpenLobby(currentRoomPin);
              } else {
                openStudentGamePortal();
              }
            }}
            className="bg-[#0F766E] hover:bg-[#0D9488] text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Vào Sảnh Chờ Đấu Trường
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Điểm Kỷ Lục Phòng Game</p>
            <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6] font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.score} pts` : '0 pts'}
            </p>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Cấp Độ Cao Nhất Đạt Được</p>
            <p className="text-sm font-extrabold text-[#0F172B] dark:text-white mt-1">
              {playerGameRecord?.status || 'Chưa tham gia trận đấu nào'}
            </p>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-slate-800/70 rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase">Chuỗi Combo Từ Đúng</p>
            <p className="text-2xl font-black text-[#0F766E] dark:text-[#1EE1D6] font-mono mt-1">
              {playerGameRecord ? `${playerGameRecord.streak}x Combo` : '0x Combo'}
            </p>
          </div>
        </div>
      </div>
        </div>

        {/* Right Sticky Sidebar: Member Directory */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className={`${profileCardCls} p-4 sm:p-5 space-y-3.5`}>
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" />
                Danh Bạ Hồ Sơ Thành Viên ({filteredMembers.length}/{allMembers.length})
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Chọn thành viên để xem nhanh hồ sơ, tiến trình &amp; góp ý.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Tìm tên hoặc @username..."
                aria-label="Tìm thành viên theo tên hoặc username"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-100 border border-[#CBD5E1] dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {[
                { id: 'all', label: `Tất cả (${allMembers.length})` },
                ...(adminCardMember ? [{ id: 'admin', label: 'Quản trị (1)' }] : []),
                { id: 'teacher', label: `Giáo viên (${allMembers.filter(m => !m.isSystemAdmin && m.role === 'teacher').length})` },
                { id: 'student', label: `Học viên (${allMembers.filter(m => !m.isSystemAdmin && m.role !== 'teacher').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMemberRoleFilter(f.id)}
                  className={`px-2.5 py-1 rounded-[6px] border transition ${
                    memberRoleFilter === f.id
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-300 border-[#CBD5E1] dark:border-[#334155] hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Không tìm thấy thành viên nào khớp "{memberSearch}".
                </p>
              ) : (
                filteredMembers.map(member => {
                  const isSelected = activeUsername === member.username;
                  const isMemberAdmin = Boolean(member.isSystemAdmin);
                  const isMemberTeacher = !isMemberAdmin && member.role === 'teacher';
                  const isMeChip = member.username === currentUser?.username;
                  const mBest = bestBandByStudent.get(member.username) ?? null;

                  return (
                    <button
                      key={member.username}
                      type="button"
                      onClick={() => {
                        setSelectedProfileStudent(member.username);
                        setTempNoteText('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl border transition ${
                        isSelected
                          ? 'bg-[#F0FDFA] dark:bg-teal-950/30 border-[#0F766E] dark:border-[#1EE1D6]'
                          : 'bg-[#F8FAFC] dark:bg-slate-800/60 border-[#E2E8F0] dark:border-[#334155] hover:border-[#0F766E]/60 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <UserAvatarBadge user={member} sizeClass="w-10 h-10" textClass="text-xs" rounded="rounded-xl" showFrame={false} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <VipMemberName
                            user={member}
                            fallbackName={member.name || member.username}
                            className="text-xs font-bold text-[#0F172B] dark:text-white truncate"
                            badgeSize="xs"
                          />
                          {isMeChip && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[#334155] dark:text-slate-200 shrink-0">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 flex items-center gap-1 flex-wrap mt-0.5">
                          {(() => {
                            const mTitle = resolveVisibleTitleBadge(member, attempts, roomsDb, customTitles, paymentConfig);
                            if (isMemberAdmin) {
                              return (
                                <>
                                  <span className="text-[#0F766E] dark:text-[#1EE1D6] font-bold inline-flex items-center gap-1">
                                    ADMIN &bull; Góp ý
                                    {newFeedbacksCount > 0 && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-xs font-bold">
                                        {newFeedbacksCount} mới
                                      </span>
                                    )}
                                  </span>
                                  {mTitle && !mTitle.isRoleBuiltIn && (
                                    <span className={`px-1.5 py-0.2 rounded-full border font-extrabold text-xs ${mTitle.badgeClass}`}>
                                      {mTitle.icon} {mTitle.label}
                                    </span>
                                  )}
                                </>
                              );
                            }
                            if (isMemberTeacher) {
                              return (
                                <>
                                  <span className="text-[#334155] dark:text-slate-200 font-bold">Giáo viên</span>
                                  {mTitle && !mTitle.isRoleBuiltIn && (
                                    <span className={`px-1.5 py-0.2 rounded-full border font-extrabold text-xs ${mTitle.badgeClass}`}>
                                      {mTitle.icon} {mTitle.label}
                                    </span>
                                  )}
                                </>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 flex-wrap">
                                {mTitle && !mTitle.isRoleBuiltIn && (
                                  <span className={`px-1.5 py-0.2 rounded-full border font-extrabold text-xs ${mTitle.badgeClass}`}>
                                    {mTitle.icon} {mTitle.label}
                                  </span>
                                )}
                                <span>
                                  Target {member.targetBand || '7.5'}
                                  {mBest !== null ? ` • Best ${mBest}` : ''}
                                </span>
                              </span>
                            );
                          })()}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal: Bảng Danh Hiệu & Cách Đạt Được (Học viên, Giáo viên & Quản trị) */}
      {showTitlesModal && titleSummary && (() => {
        const allTitleItems = titleSummary.itemsWithProgress || [];
        const easyCount = allTitleItems.filter(i => i.difficulty === 'Dễ' || i.difficulty === 'Khởi Đầu' || i.difficulty === 'Cơ Bản').length;
        const normalCount = allTitleItems.filter(i => i.difficulty === 'Bình Thường' || i.difficulty === 'Thử Thách').length;
        const hardTitleCount = allTitleItems.filter(i => i.difficulty === 'Khó' || i.difficulty === 'Cực Khó').length;
        const checkinTitleCount = allTitleItems.filter(i => i.difficulty === 'Điểm Danh').length;
        const secretTitleCount = allTitleItems.filter(i => i.isSecretTitle || i.difficulty === 'Bí Ẩn').length;
        const holidayTitleCount = allTitleItems.filter(i => i.isHolidayTitle).length;
        const vipTitleCount = allTitleItems.filter(i => i.isPaidTitle || i.isVipBundleTitle).length;
        const filteredTitles = allTitleItems.filter(item => {
          if (titleFilter === 'unlocked') return item.unlocked;
          if (titleFilter === 'locked') return !item.unlocked;
          if (titleFilter === 'easy') return item.difficulty === 'Dễ' || item.difficulty === 'Khởi Đầu' || item.difficulty === 'Cơ Bản';
          if (titleFilter === 'normal') return item.difficulty === 'Bình Thường' || item.difficulty === 'Thử Thách';
          if (titleFilter === 'hard') return item.difficulty === 'Khó' || item.difficulty === 'Cực Khó';
          if (titleFilter === 'checkin') return item.difficulty === 'Điểm Danh';
          if (titleFilter === 'secret') return item.isSecretTitle || item.difficulty === 'Bí Ẩn';
          if (titleFilter === 'holiday') return item.isHolidayTitle;
          if (titleFilter === 'vip') return item.isPaidTitle || item.isVipBundleTitle;
          return true;
        });
        const diffBadgeCls = (diff) => {
          if (diff === 'VIP Độc Quyền') return 'vip-shimmer-badge bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white border-amber-300 shadow-xs';
          if (diff === 'Độc Quyền') return 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/50';
          if (diff === 'Phú Quý') return 'vip-shimmer-badge bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs';
          if (diff === 'Bí Ẩn') return 'bg-slate-900 text-amber-200 border-amber-400/70 dark:bg-slate-800 dark:text-amber-200 dark:border-amber-400/70';
          if (diff === 'Lễ Hội') return 'bg-gradient-to-r from-pink-100 to-rose-100 text-rose-800 border-rose-300 dark:from-pink-500/25 dark:to-rose-500/25 dark:text-rose-200 dark:border-rose-400/50';
          if (diff === 'Điểm Danh') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50';
          if (diff === 'Cực Khó') return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40';
          if (diff === 'Khó') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40';
          if (diff === 'Bình Thường' || diff === 'Thử Thách') return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/40';
          if (diff === 'Dễ' || diff === 'Cơ Bản' || diff === 'Khởi Đầu') return 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-500/40';
          return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        };

        return (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTitlesModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0F172B] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-[#334155] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-[#0F172B] via-[#003538] to-[#065B5B] text-white flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-300" /> Bảng Danh Hiệu - {student.name}
                </h2>
                <p className="text-xs text-teal-100/90 mt-0.5">
                  {titleSummary.autoUnlockedAll
                    ? 'Đặc quyền Quản trị Hệ thống: Tự động mở khóa 100% tất cả danh hiệu hiện tại và mọi danh hiệu mới trong tương lai!'
                    : isTargetTeacher
                    ? 'Giảng viên & Học viên đều có thể cày mở khóa, trang bị hoặc bật/tắt Danh Hiệu trên hồ sơ và Đấu Trường.'
                    : 'Hoàn thành bài thi, chơi Game & đăng nhập đều đặn (kể cả các ngày Lễ đặc biệt trong năm) để mở khóa toàn bộ!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTitlesModal(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Metrics Summary + Visibility Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-[#334155]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  <span>📝 Số bài làm: <b className="text-slate-900 dark:text-white">{titleSummary.stats?.examCount || 0} bài</b></span>
                  <span>🎯 Band cao nhất: <b className="text-[#007A7A] dark:text-[#1EE1D6]">{titleSummary.stats?.highestBand ? titleSummary.stats.highestBand.toFixed(1) : '0.0'}</b></span>
                  <span>🎮 Game kỷ lục: <b className="text-amber-700 dark:text-amber-300">{titleSummary.stats?.bestGameScore || 0}đ</b></span>
                  <span>📅 Đăng nhập: <b className="text-slate-900 dark:text-white">{titleSummary.stats?.totalLoginDays || 0} ngày</b> (Chuỗi {titleSummary.stats?.bestLoginStreak || 0}N)</span>
                  <span>🌟 Kỹ năng: <b className="text-slate-900 dark:text-white">{titleSummary.stats?.coveredSkillsCount || 0}/4</b></span>
                </div>

                {isSelf && handleUpdateUserProfileFields && (
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateUserProfileFields(student.username, {
                        showTitleBadge: !(student.showTitleBadge !== false),
                        customToast: student.showTitleBadge === false
                          ? 'Đã BẬT hiển thị danh hiệu trên Profile & Game!'
                          : 'Đã TẮT hiển thị danh hiệu trên Profile & Game.'
                      })
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition ${
                      student.showTitleBadge !== false
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {student.showTitleBadge !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {student.showTitleBadge !== false ? 'Đang HIỆN danh hiệu (Bấm để tắt)' : 'Đang ẨN danh hiệu (Bấm để bật)'}
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Tất cả (${allTitleItems.length})` },
                  { id: 'easy', label: `🌱 Dễ (${easyCount})` },
                  { id: 'normal', label: `⚡ Bình Thường (${normalCount})` },
                  { id: 'hard', label: `🔥 Khó & Cực Khó (${hardTitleCount})` },
                  { id: 'checkin', label: `📅 Điểm Danh (${checkinTitleCount})` },
                  { id: 'secret', label: `❓ Bí Ẩn (${secretTitleCount})` },
                  { id: 'holiday', label: `🎉 Ngày Lễ (${holidayTitleCount})` },
                  { id: 'vip', label: `💎 Cửa Hàng VIP (${vipTitleCount})` },
                  { id: 'unlocked', label: `Đã mở (${titleSummary.unlockedIds?.length || 0})` },
                  { id: 'locked', label: `Chưa mở (${Math.max(0, allTitleItems.length - (titleSummary.unlockedIds?.length || 0))})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTitleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                      titleFilter === tab.id
                        ? 'bg-[#007A7A] text-white border-[#007A7A]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredTitles.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#475569] dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  Không có danh hiệu nào trong nhóm lọc này.
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredTitles.map(item => {
                  const isEquipped = titleSummary.title?.id === item.id;
                  const maskSecret = Boolean(item.isSecretTitle && !item.unlocked && !isViewerSuperAdmin);
                  const isLuxuryVipCard = Boolean(item.isPaidTitle || item.isVipBundleTitle);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                        isLuxuryVipCard
                          ? isEquipped
                            ? 'bg-gradient-to-br from-amber-50 via-rose-50 to-white dark:from-amber-950/40 dark:via-rose-950/30 dark:to-slate-900 border-amber-400 ring-2 ring-amber-400/35 shadow-md'
                            : 'bg-gradient-to-br from-amber-50/75 via-white to-rose-50/60 dark:from-amber-950/25 dark:via-slate-900 dark:to-rose-950/20 border-amber-300/80 dark:border-amber-500/40 shadow-sm'
                          : item.unlocked
                          ? isEquipped
                            ? 'bg-[#EDFFFD]/90 dark:bg-teal-950/35 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/15'
                            : 'bg-white dark:bg-slate-800/80 border-emerald-200 dark:border-emerald-500/30 shadow-xs'
                          : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-90'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                              {maskSecret ? '❓' : item.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                  {maskSecret ? 'Bí Ẩn' : item.tier}
                                </span>
                                <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full border ${diffBadgeCls(item.difficulty)}`}>
                                  {item.difficulty}
                                </span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                {maskSecret ? 'Danh Hiệu Bí Ẩn (???)' : item.label}
                              </h3>
                            </div>
                          </div>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                            item.unlocked
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {item.unlocked ? 'Đã đạt' : maskSecret ? 'Bí ẩn' : 'Chưa mở'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <b>Cách đạt được:</b>{' '}
                          {maskSecret
                            ? 'Thử thách ẩn - Hãy luyện tập chăm chỉ ở nhiều khung giờ và bứt phá kỷ lục bất ngờ để tự động khai mở!'
                            : item.conditionText}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-[#475569] dark:text-slate-400 mb-1">
                            <span>Tiến độ</span>
                            <span className={item.unlocked ? 'text-emerald-600 dark:text-emerald-400' : ''}>{item.progressText}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.unlocked ? 'bg-emerald-500' : 'bg-[#007A7A] dark:bg-cyan-400'
                              }`}
                              style={{ width: `${item.progressPct}%` }}
                            />
                          </div>
                        </div>

                        {isSelf && item.unlocked && handleUpdateUserProfileFields && (
                          <button
                            type="button"
                            disabled={isEquipped && student.showTitleBadge !== false}
                            onClick={() =>
                              handleUpdateUserProfileFields(student.username, {
                                equippedTitleId: item.id,
                                showTitleBadge: true,
                                customToast: `Đã trang bị danh hiệu ${item.icon} ${item.label}!`
                              })
                            }
                            className={`w-full py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                              isEquipped && student.showTitleBadge !== false
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 cursor-default'
                                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white shadow-xs'
                            }`}
                          >
                            {isEquipped && student.showTitleBadge !== false ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Đang Trang Bị
                              </>
                            ) : (
                              'Trang Bị Danh Hiệu Này'
                            )}
                          </button>
                        )}
                        {isSelf && item.unlocked && item.isPaidTitle && item.unlockedByPurchase && item.expiresAt > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowTitlesModal(false);
                              setCheckoutModalState({
                                itemType: 'title',
                                itemId: item.id,
                                itemLabel: `${item.icon} ${item.label} (+1 Tháng)`,
                                itemPrice: item.priceVnd,
                                renew: true
                              });
                            }}
                            className="w-full py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40"
                          >
                            <Clock className="w-3 h-3" /> Gia hạn +30N ({formatVndCurrency(item.priceVnd)})
                          </button>
                        )}
                        {isSelf && !item.unlocked && item.isPaidTitle && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowTitlesModal(false);
                              setCheckoutModalState({
                                itemType: 'title',
                                itemId: item.id,
                                itemLabel: `${item.icon} ${item.label} (1 Tháng)`,
                                itemPrice: item.priceVnd
                              });
                            }}
                            className="vip-shimmer-badge w-full py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Mua 1 Tháng ({formatVndCurrency(item.priceVnd)})
                          </button>
                        )}
                        {isSelf && !item.unlocked && item.isVipBundleTitle && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowTitlesModal(false);
                              setCheckoutModalState({
                                itemType: 'aieo_vip',
                                itemId: '',
                                itemLabel: 'Gói Ai eo VIP Full Quyền (1 Tháng)',
                                itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                              });
                            }}
                            className="vip-shimmer-badge w-full py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:opacity-95 text-white shadow-xs"
                          >
                            <Crown className="w-3.5 h-3.5" /> Đăng Ký Gói Ai eo VIP ({aieoVipPriceLabel}/1T)
                          </button>
                        )}
                        {isViewerSuperAdmin && !isTargetSystemAdmin && onGrantUserTitles && !item.isRoleBuiltIn && item.id !== 'newbie' && (() => {
                          const isGrantedToTarget = Array.isArray(student.grantedTitleIds) && student.grantedTitleIds.includes(item.id);
                          return (
                            <button
                              type="button"
                              onClick={() => onGrantUserTitles(student.username, [item.id], isGrantedToTarget ? 'remove' : 'add')}
                              className={`mt-2 w-full py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 border ${
                                isGrantedToTarget
                                  ? 'bg-amber-50 hover:bg-rose-50 dark:bg-amber-500/15 dark:hover:bg-rose-500/20 text-amber-800 hover:text-rose-700 dark:text-amber-200 border-amber-300 dark:border-amber-500/40'
                                  : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-500/20 text-slate-700 hover:text-amber-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <Crown className="w-3 h-3" />
                              {isGrantedToTarget ? '✓ Admin Đã Tặng (Bấm Gỡ)' : '+ Admin Tặng Danh Hiệu'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal: Tùy Chỉnh Giao Diện Profile (Hình nền + Khung Avatar + Khẩu hiệu) */}
      {showCustomizeModal && canEditTargetInfo && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCustomizeModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0F172B] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-[#334155] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" /> Tùy Chỉnh Hồ Sơ Cá Nhân
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-400 max-w-2xl">
                  Cá nhân hóa hình nền Profile, khung viền Avatar và danh hiệu để mọi người trong lớp nhìn thấy phong cách riêng của bạn!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-[#0F172B] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Live Mini Preview */}
              {(() => {
                const previewBanner = getProfileBannerById(customDraft.profileBannerId);
                const previewCoverOk = Boolean(
                  canUseCustomCover &&
                  customDraft.profileCoverUrl &&
                  (customDraft.profileCoverUrl.startsWith('data:image/') || customDraft.profileCoverUrl.startsWith('https://'))
                );
                const previewUser = {
                  ...student,
                  avatarFrameId: customDraft.avatarFrameId
                };
                return (
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172B]">
                    <div
                      className={`relative h-24 w-full overflow-hidden border-b border-[#E2E8F0] dark:border-[#334155] ${
                        previewCoverOk ? 'bg-slate-100 dark:bg-slate-800' : previewBanner.heroClass
                      }`}
                    >
                      {previewCoverOk && (
                        <img
                          src={customDraft.profileCoverUrl}
                          alt="Xem trước ảnh bìa"
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                    </div>
                    <div className="px-4 pb-3.5 pt-2 flex items-end gap-3 bg-white dark:bg-[#0F172B]">
                      <div className="-mt-8 relative z-20 p-1 rounded-full bg-white dark:bg-[#0F172B] border border-[#E2E8F0] dark:border-[#334155] shadow-xs flex items-center justify-center shrink-0">
                        <UserAvatarBadge user={previewUser} sizeClass="w-14 h-14" textClass="text-xl" rounded="rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6] font-bold">Xem trước trực tiếp</p>
                        <p className="text-sm font-extrabold text-[#0F172B] dark:text-white truncate">
                          <VipMemberName user={previewUser} fallbackName={student.name} badgeSize="xs" />
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{customDraft.studyGoal || 'Mục tiêu chinh phục IELTS!'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Preset Wallpaper Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  1. Chọn Hình Nền Gradient Có Sẵn
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PROFILE_BANNERS.map(b => {
                    const active = customDraft.profileBannerId === b.id && !customDraft.profileCoverUrl;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setCustomDraft(prev => ({ ...prev, profileBannerId: b.id, profileCoverUrl: '' }))}
                        className={`p-2.5 rounded-2xl border text-left transition ${
                          active
                            ? 'border-[#007A7A] ring-2 ring-[#007A7A]/30 bg-[#EDFFFD]/50 dark:bg-teal-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <div className={`h-9 rounded-xl ${b.previewClass} mb-2`} />
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{b.name}</p>
                        <p className="text-xs text-[#475569] dark:text-slate-400 truncate">{b.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Wallpaper Image Upload or 5k Paywall */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hoặc Tải Ảnh Hình Nền Riêng Từ Máy
                  </label>
                  {canUseCustomCover ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />{' '}
                      {isTargetTeacher || isTargetSystemAdmin ? 'Miễn phí Giáo viên / Admin' : 'Đã mở khóa Ảnh Nền Riêng'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold text-amber-800 dark:text-amber-200">
                      <Lock className="w-3 h-3" /> Giá mở khóa {unlockPriceLabel}
                    </span>
                  )}
                </div>

                {canUseCustomCover ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90 transition">
                        <Upload className="w-3.5 h-3.5" /> Chọn Ảnh Hình Nền
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            try {
                              const rawDataUrl = await readImageFileAsDataUrl(file);
                              setCoverCropSource(rawDataUrl);
                            } catch (err) {
                              showToast?.(err?.message || 'Không thể tải ảnh hình nền.', 'error');
                            }
                          }}
                        />
                      </label>
                      {customDraft.profileCoverUrl?.startsWith('data:image/') && (
                        <button
                          type="button"
                          onClick={() => setCoverCropSource(customDraft.profileCoverUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EDFFFD] dark:bg-teal-950/50 text-[#007A7A] dark:text-[#1EE1D6] border border-teal-200 dark:border-teal-800 text-xs font-bold hover:bg-teal-100/70 transition"
                        >
                          <Crop className="w-3.5 h-3.5" /> Cắt lại ảnh nền
                        </button>
                      )}
                      {customDraft.profileCoverUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomDraft(prev => ({ ...prev, profileCoverUrl: '' }))}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/30"
                        >
                          Xóa ảnh nền riêng
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={customDraft.profileCoverUrl?.startsWith('https://') ? customDraft.profileCoverUrl : ''}
                      onChange={e => setCustomDraft(prev => ({ ...prev, profileCoverUrl: e.target.value.trim() }))}
                      placeholder="Hoặc dán URL ảnh https://... (tùy chọn)"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                  </>
                ) : (
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50/90 via-white to-teal-50/70 dark:from-amber-950/25 dark:via-slate-900 dark:to-teal-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Mở khóa tải &amp; cắt ảnh nền riêng ({unlockPriceLabel})</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {paymentConfig?.autoVerifyEnabled
                          ? 'Bấm nút bên cạnh để hiện mã VietQR - chuyển khoản xong hệ thống tự động mở khóa sau vài giây.'
                          : 'Bấm nút bên cạnh để mở mã VietQR chuyển khoản nhanh (6 nền Gradient phía trên vẫn miễn phí).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Ảnh Nền Riêng', itemPrice: normalizedPayCfg.coverUnlockPrice })}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow-sm inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Mở QR Thanh Toán ({unlockPriceLabel})
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar Frame Picker */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Khung Viền Avatar Nổi Bật
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_FRAMES.map(frame => {
                    const active = (customDraft.avatarFrameId || 'none') === frame.id;
                    const frameAllowed = hasUnlockedAvatarFrame(student, frame.id);
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => {
                          if (!frameAllowed) {
                            showToast?.('Khung Avatar Neon thuộc đặc quyền Gói Ai eo VIP (80k/1T)!', 'info');
                            return;
                          }
                          setCustomDraft(prev => ({ ...prev, avatarFrameId: frame.id }));
                        }}
                        className={`relative p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                          !frameAllowed
                            ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 opacity-75'
                            : active
                            ? 'border-[#007A7A] bg-[#EDFFFD] dark:bg-teal-950/35 ring-2 ring-[#007A7A]/25'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {frame.vipOnly && (
                          <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-xs font-black text-white shadow-2xs">
                            VIP
                          </span>
                        )}
                        <span className={`w-7 h-7 rounded-full ${frame.previewBg} ${frame.id !== 'none' ? frame.ringClass : ''}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">{frame.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Study Goal / Bio + Student Title Toggle */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    3. Khẩu Hiệu / Giới Thiệu Bản Thân
                  </label>
                  <input
                    type="text"
                    value={customDraft.studyGoal}
                    onChange={e => setCustomDraft(prev => ({ ...prev, studyGoal: e.target.value }))}
                    placeholder="VD: Quyết tâm Band 7.5 trước tháng 12!"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {!isTargetTeacher && !isTargetSystemAdmin && (
                  <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">Hiển thị Danh Hiệu trước tên</p>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        Bật để bạn bè thấy Danh Hiệu ({titleSummary?.title?.icon} {titleSummary?.title?.label}) trong Game &amp; Hồ sơ.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(customDraft.showTitleBadge)}
                      onChange={e => setCustomDraft(prev => ({ ...prev, showTitleBadge: e.target.checked }))}
                      className="w-4 h-4 accent-[#007A7A]"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingProfileTheme}
                onClick={async () => {
                  if (!handleUpdateUserProfileFields || isSavingProfileTheme) return;
                  setIsSavingProfileTheme(true);
                  const safeDraft = canUseCustomCover
                    ? customDraft
                    : { ...customDraft, profileCoverUrl: '' };
                  await handleUpdateUserProfileFields(student.username, safeDraft);
                  setIsSavingProfileTheme(false);
                  setShowCustomizeModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition shadow flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> {isSavingProfileTheme ? 'Đang lưu...' : 'Lưu Tùy Chỉnh Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageCropperModal
        isOpen={Boolean(coverCropSource)}
        sourceUrl={coverCropSource}
        mode="banner"
        confirmLabel="Dùng Ảnh Nền Đã Cắt"
        onCancel={() => setCoverCropSource('')}
        onError={msg => showToast?.(msg || 'Không thể cắt ảnh hình nền.', 'error')}
        onConfirm={croppedUrl => {
          setCustomDraft(prev => ({ ...prev, profileCoverUrl: croppedUrl }));
          setCoverCropSource('');
        }}
      />

      {Boolean(checkoutModalState) && isSelf && (
        <CoverCheckoutModal
          key={`${checkoutModalState.itemType || 'cover'}:${checkoutModalState.itemId || ''}:${checkoutModalState.renew ? 1 : 0}`}
          isOpen={true}
          itemType={checkoutModalState.itemType || 'cover'}
          itemId={checkoutModalState.itemId || ''}
          itemLabel={checkoutModalState.itemLabel || ''}
          itemPrice={checkoutModalState.itemPrice}
          renew={Boolean(checkoutModalState.renew)}
          currentUser={student}
          paymentConfig={paymentConfig}
          onClose={() => setCheckoutModalState(null)}
          onUnlockedReady={() => openCustomizeModal()}
          onNavigateAfterPurchase={onNavigateAfterPurchase}
          onEquipPurchasedTitle={tid => {
            if (!tid || !handleUpdateUserProfileFields) return;
            handleUpdateUserProfileFields(student.username, {
              equippedTitleId: tid,
              showTitleBadge: true,
              customToast: `Đã đeo danh hiệu mới!`
            });
          }}
          onRequestUnlock={onRequestCoverUnlock}
          onPullSync={onPullSync}
          showToast={showToast}
        />
      )}
      </div>
    </div>
  );
}
