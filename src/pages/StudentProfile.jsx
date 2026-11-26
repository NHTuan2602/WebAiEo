import { useEffect, useRef, useState } from 'react';
import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
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
  MessageCircle,
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
  DEFAULT_EXAM_PRICE_VND,
  EXAM_PURCHASE_TIERS,
  MIN_DONATE_AMOUNT_VND,
  PROFILE_BANNERS,
  REAL_EXAM_COMBOS,
  VIP_NAME_COLORS,
  VIP_NEON_COVER_THEMES,
  buildVietQrImageUrl,
  formatRemainingSubscriptionText,
  formatVndCurrency,
  getNextExamPurchaseTier,
  getProfileBannerById,
  getPurchasedExamCount,
  getRealExamCredits,
  hasActiveAieoVip,
  hasCustomCoverPermission,
  hasUnlockedAvatarFrame,
  isStaffOrAdminUser,
  isSyncMediaUrl,
  normalizePaymentConfig,
  resolveExamPurchaseTier,
  resolveStudentTitleSummary,
  resolveUserVipNameVisual,
  resolveVisibleTitleBadge
} from '../constants/profileCustomization';
import CoverCheckoutModal from '../components/modals/CoverCheckoutModal';
import ExamTierGuideModal from '../components/common/ExamTierGuideModal';
import ListPaginationBar, { paginateItems } from '../components/common/ListPaginationBar';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';

export default function StudentProfile({
  adminFeedbacks = [],
  adminPaymentHistory = [],
  myPaymentTransactions = [],
  attempts = [],
  classesDb = {},
  currentRoomPin,
  currentUser,
  customTitles = [],
  dailyRankTitles = null,
  dispatchSyncAction,
  gamePracticeLeaderboard = [],
  handleTeacherOpenLobby,
  handleUpdateUserProfileFields,
  onGrantUserTitles,
  onNavigateAfterPurchase = null,
  onOpenAccountSecurity,
  onOpenAdminTitleManager,
  onOpenRealExamPricing = null,
  onPullSync = null,
  onRequestCoverUnlock = null,
  onToggleUserCoverUnlock = null,
  onToggleUserSubscription = null,
  openStudentGamePortal,
  paymentConfig = null,
  previousView,
  roomsDb = {},
  selectedProfileStudent,
  serverClockOffsetMs = 0,
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
  const [showMemberDirectoryPopup, setShowMemberDirectoryPopup] = useState(false);
  const memberDirectoryRef = useRef(null);

  useEffect(() => {
    if (!showMemberDirectoryPopup) return undefined;
    const handleOutside = (e) => {
      if (memberDirectoryRef.current && !memberDirectoryRef.current.contains(e.target)) {
        setShowMemberDirectoryPopup(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowMemberDirectoryPopup(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMemberDirectoryPopup]);
  const [fbCategory, setFbCategory] = useState('feature');
  const [fbContent, setFbContent] = useState('');
  const [fbPrivate, setFbPrivate] = useState(false);
  const [fbStatusFilter, setFbStatusFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  const [titleFilter, setTitleFilter] = useState('all');
  const [profileHistoryPage, setProfileHistoryPage] = useState(1);
  const [attemptModeFilter, setAttemptModeFilter] = useState('all');
  const [showAllTimelineCards, setShowAllTimelineCards] = useState(false);
  const [myTxPage, setMyTxPage] = useState(1);
  const [donateAmount, setDonateAmount] = useState(MIN_DONATE_AMOUNT_VND);
  const [isCustomDonateMode, setIsCustomDonateMode] = useState(true);
  const [customDonateInput, setCustomDonateInput] = useState(MIN_DONATE_AMOUNT_VND.toLocaleString('vi-VN'));
  const [qrDonateAmount, setQrDonateAmount] = useState(MIN_DONATE_AMOUNT_VND);
  const [donateNote, setDonateNote] = useState('');
  const [reportingDonate, setReportingDonate] = useState(false);
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState('all');
  const [busyTxId, setBusyTxId] = useState('');
  useEffect(() => {
    const safeForQr = Math.max(MIN_DONATE_AMOUNT_VND, Number(donateAmount) || 0);
    const timer = setTimeout(() => {
      setQrDonateAmount(safeForQr);
    }, isCustomDonateMode ? 350 : 0);
    return () => clearTimeout(timer);
  }, [donateAmount, isCustomDonateMode]);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showExamTierGuideModal, setShowExamTierGuideModal] = useState(false);
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
    showTitleBadge: true,
    showExamTierBadge: true,
    vipRedNameEnabled: true,
    vipNameColor: 'crimson'
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
  const titleExtraOpts = {
    gamePracticeLeaderboard,
    dailyRankTitles,
    usersDb,
    nowMs: Date.now() + serverClockOffsetMs,
    hideAdminPrivilegeText: !isViewerSuperAdmin
  };
  const titleSummary = resolveStudentTitleSummary(student, attempts, roomsDb, customTitles, paymentConfig, titleExtraOpts);
  const visibleTitle = resolveVisibleTitleBadge(student, attempts, roomsDb, customTitles, paymentConfig, titleExtraOpts);
  const viewerUnlockedTitleIdSet = (() => {
    if (isViewerSuperAdmin) return null;
    if (isSelf) return new Set(titleSummary?.unlockedIds || []);
    if (!currentUser?.username) return new Set();
    const viewerSummary = resolveStudentTitleSummary(
      currentUser,
      attempts,
      roomsDb,
      customTitles,
      paymentConfig,
      titleExtraOpts
    );
    return new Set(viewerSummary?.unlockedIds || []);
  })();
  const heroBanner = getProfileBannerById(student.profileBannerId);
  const studentHasCoverPermission = hasCustomCoverPermission(student);
  const studentHasAieoVip = hasActiveAieoVip(student);
  const studentRealExamCredits = getRealExamCredits(student);
  const vipVisual = resolveUserVipNameVisual(student);
  const canUseCustomCover = canEditTargetInfo && (isTeacherViewer || studentHasCoverPermission);
  const normalizedPayCfg = normalizePaymentConfig(paymentConfig || {});
  const unlockPriceLabel = formatVndCurrency(normalizedPayCfg.coverUnlockPrice);
  const aieoVipPriceLabel = formatVndCurrency(normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND);
  const singleExamPriceLabel = formatVndCurrency(normalizedPayCfg.defaultExamPriceVnd ?? DEFAULT_EXAM_PRICE_VND);
  const combo3PriceLabel = formatVndCurrency(normalizedPayCfg.realExamCombo3Price ?? REAL_EXAM_COMBOS[0]?.defaultPriceVnd ?? 249000);
  const combo5PriceLabel = formatVndCurrency(normalizedPayCfg.realExamCombo5Price ?? REAL_EXAM_COMBOS[1]?.defaultPriceVnd ?? 399000);
  const combo8PriceLabel = formatVndCurrency(
    normalizedPayCfg.realExamCombo8Price ?? REAL_EXAM_COMBOS.find(c => c.credits === 8)?.defaultPriceVnd ?? 599000
  );
  const combo10PriceLabel = formatVndCurrency(
    normalizedPayCfg.realExamCombo10Price ?? REAL_EXAM_COMBOS.find(c => c.credits === 10)?.defaultPriceVnd ?? 699000
  );
  const studentIsStaff = isStaffOrAdminUser(student);
  const canUseVipNameAndFrame = studentHasAieoVip || studentIsStaff;
  const studentPurchasedCount = getPurchasedExamCount(student);
  const studentPurchaseTier = resolveExamPurchaseTier(student);
  const studentNextTier = getNextExamPurchaseTier(student);
  const coverRemainingText = student.customCoverExpiresAt > Date.now()
    ? formatRemainingSubscriptionText(student.customCoverExpiresAt)
    : '';
  const aieoVipRemainingText = student.aieoVipExpiresAt > Date.now()
    ? formatRemainingSubscriptionText(student.aieoVipExpiresAt)
    : '';
  const hasCustomCover = Boolean(
    studentHasCoverPermission &&
    student.profileCoverUrl &&
    (student.profileCoverUrl.startsWith('data:image/') || student.profileCoverUrl.startsWith('https://') || isSyncMediaUrl(student.profileCoverUrl))
  );

  const openCustomizeModal = () => {
    setCustomDraft({
      profileBannerId: student.profileBannerId || 'ocean',
      profileCoverUrl: student.profileCoverUrl || '',
      avatarFrameId: student.avatarFrameId || 'none',
      studyGoal: student.studyGoal || '',
      equippedTitleId: student.equippedTitleId || titleSummary?.title?.id || 'newbie',
      showTitleBadge: student.showTitleBadge !== false,
      showExamTierBadge: student.showExamTierBadge !== false,
      vipRedNameEnabled: vipVisual.showNameColor,
      vipNameColor: vipVisual.nameColorValue || 'crimson'
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
    const effectiveRole = m.isSystemAdmin ? 'admin' : m.role === 'teacher' ? 'teacher' : m.isGuest ? 'guest' : 'student';
    if (memberRoleFilter !== 'all' && effectiveRole !== memberRoleFilter) return false;
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.isSystemAdmin && 'quản trị góp ý admin'.includes(q))
    );
  });

  const isAttemptApprovedForViewer = (att) => {
    if (!att) return false;
    if (isTeacherViewer) return true;
    if (att.teacherGraded) return true;
    return att.testMode === 'single_skill' && (att.focusSkill === 'listening' || att.focusSkill === 'reading');
  };

  const studentAttempts = attempts.filter(a => a.studentId === activeUsername);

  // Sort chronologically ascending (oldest to newest) for progression calculations
  const chronologicalAttempts = [...studentAttempts].reverse();
  const totalAttempts = studentAttempts.length;
  const approvedStudentAttempts = studentAttempts.filter(isAttemptApprovedForViewer);
  const gradedOverallBands = approvedStudentAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
  const highestBand = gradedOverallBands.length > 0 ? Math.max(...gradedOverallBands) : null;
  const latestAttempt = approvedStudentAttempts[0] || studentAttempts[0];
  const firstAttempt = [...approvedStudentAttempts].reverse()[0] || chronologicalAttempts[0];
  const bandGrowth = (typeof latestAttempt?.overallBand === 'number' && typeof firstAttempt?.overallBand === 'number' && approvedStudentAttempts.length > 1)
    ? (latestAttempt.overallBand - firstAttempt.overallBand).toFixed(1)
    : null;

  // Calculate each skill average ONLY across approved attempts that actually include that skill
  // (single-skill Writing/Speaking exercises must NEVER dilute Listening/Reading averages to 0.0!)
  const gradedListeningAttempts = studentAttempts.filter(
    a => (a.testMode !== 'single_skill' || a.focusSkill === 'listening') && typeof a.scores?.listening?.band === 'number'
  );
  const avgListening = gradedListeningAttempts.length > 0
    ? (gradedListeningAttempts.reduce((acc, a) => acc + a.scores.listening.band, 0) / gradedListeningAttempts.length).toFixed(1)
    : null;
  const gradedReadingAttempts = studentAttempts.filter(
    a => (a.testMode !== 'single_skill' || a.focusSkill === 'reading') && typeof a.scores?.reading?.band === 'number'
  );
  const avgReading = gradedReadingAttempts.length > 0
    ? (gradedReadingAttempts.reduce((acc, a) => acc + a.scores.reading.band, 0) / gradedReadingAttempts.length).toFixed(1)
    : null;
  const gradedWritingAttempts = approvedStudentAttempts.filter(
    a => (a.testMode !== 'single_skill' || a.focusSkill === 'writing') && typeof a.scores?.writing?.overallBand === 'number'
  );
  const avgWriting = gradedWritingAttempts.length > 0
    ? (gradedWritingAttempts.reduce((acc, a) => acc + a.scores.writing.overallBand, 0) / gradedWritingAttempts.length).toFixed(1)
    : null;
  const gradedSpeakingAttempts = approvedStudentAttempts.filter(
    a => (a.testMode !== 'single_skill' || a.focusSkill === 'speaking') && typeof a.scores?.speaking?.band === 'number'
  );
  const avgSpeaking = gradedSpeakingAttempts.length > 0
    ? (gradedSpeakingAttempts.reduce((acc, a) => acc + a.scores.speaking.band, 0) / gradedSpeakingAttempts.length).toFixed(1)
    : null;

  const approvedFullExamBands = approvedStudentAttempts
    .filter(a => a.testMode !== 'single_skill' && typeof a.overallBand === 'number')
    .map(a => a.overallBand);
  const availableSkillAvgNumbers = [avgListening, avgReading, avgWriting, avgSpeaking]
    .filter(v => v !== null)
    .map(Number);
  const overallAvg = approvedFullExamBands.length > 0
    ? (approvedFullExamBands.reduce((acc, b) => acc + b, 0) / approvedFullExamBands.length).toFixed(1)
    : availableSkillAvgNumbers.length > 0
      ? (availableSkillAvgNumbers.reduce((acc, b) => acc + b, 0) / availableSkillAvgNumbers.length).toFixed(1)
      : gradedOverallBands.length > 0
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

  const [originHubView, setOriginHubView] = useState(() =>
    ['TEACHER_DASHBOARD', 'SKILL_HUB', 'HOME'].includes(previousView)
      ? previousView
      : (isTeacherViewer ? 'TEACHER_DASHBOARD' : 'HOME')
  );
  useEffect(() => {
    if (['TEACHER_DASHBOARD', 'SKILL_HUB', 'HOME'].includes(previousView)) {
      if (!isTeacherViewer && previousView === 'TEACHER_DASHBOARD') {
        setOriginHubView('HOME');
      } else {
        setOriginHubView(previousView);
      }
    }
  }, [previousView, isTeacherViewer]);

  const effectiveBackView =
    !isTeacherViewer && originHubView === 'TEACHER_DASHBOARD'
      ? 'HOME'
      : originHubView || (isTeacherViewer ? 'TEACHER_DASHBOARD' : 'HOME');
  const effectiveBackLabel =
    effectiveBackView === 'TEACHER_DASHBOARD'
      ? 'Quay Lại Quản Trị Giáo Viên'
      : effectiveBackView === 'SKILL_HUB'
      ? 'Quay Lại Daily Zone'
      : 'Quay Lại Phòng Luyện Đề';

  const handleBackNavigation = () => {
    setView(effectiveBackView);
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
    if (!isSelf || (!studentHasAieoVip && !studentIsStaff) || !handleUpdateUserProfileFields) {
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
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-slate-700 dark:text-zinc-200" />
            {vipVisual.canUseNeonCover
              ? 'Tùy Chỉnh Hiển Thị Quản Trị / GV (Màu Chữ Tên · Viền Bìa LED · Nhãn)'
              : 'Tùy Chỉnh Hiển Thị VIP (Màu Chữ Tên · Khung Viền Avatar)'}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {vipVisual.canUseNeonCover && neonOn && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${neonCoverMeta.swatchClass}`} />
                <span>Viền Bìa: {neonCoverMeta.name}</span>
              </span>
            )}
            <span className="text-xs font-semibold text-[#475569] dark:text-zinc-300 flex items-center gap-1.5">
              Xem trước: <VipMemberName user={student} fallbackName={student.name} badgeSize="xs" />
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${vipVisual.canUseNeonCover ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-zinc-800 pt-1`}>
          {/* 1. Custom VIP Name Text Color */}
          <div className="bg-transparent border-0 rounded-none py-3 lg:py-1 lg:pr-5 space-y-2.5">
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
                <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  <span>Đổi Màu Chữ Tên VIP</span>
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400">
                  Chọn màu chữ bất kỳ cho tên trên Navbar, Hồ sơ &amp; BXH
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${
                  colorOn ? 'bg-[#F59E0B] text-[#09090B]' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200'
                }`}
              >
                {colorOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
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
                    className={`w-6 h-6 rounded-full transition flex items-center justify-center ${
                      selected
                        ? 'border-2 border-slate-900 dark:border-white'
                        : 'border border-white/80 dark:border-zinc-700 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.swatch }}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
              <label
                className={`inline-flex items-center gap-1.5 py-0.5 px-1.5 text-xs font-semibold cursor-pointer transition ${
                  nameColorMeta.isCustomHex
                    ? 'text-[#0F172B] dark:text-[#F4F4F5] underline underline-offset-4'
                    : 'text-[#475569] dark:text-zinc-400 hover:text-[#0F172B] dark:hover:text-zinc-200'
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

          {/* 2. Neon Cover Border (Staff / Admin ONLY) */}
          {vipVisual.canUseNeonCover && (
          <div className="bg-transparent border-0 rounded-none py-3 lg:py-1 lg:px-5 space-y-2.5">
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
                <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  <span>Viền Bìa Màu Neon VIP</span>
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400">
                  Hiển thị viền màu sắc nét quanh ảnh bìa hồ sơ &amp; danh bạ lớp
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${
                  neonOn ? 'bg-[#F59E0B] text-[#09090B]' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200'
                }`}
              >
                {neonOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
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
                    className={`py-0.5 text-xs transition inline-flex items-center gap-1.5 ${
                      selected
                        ? 'font-bold text-[#0F172B] dark:text-[#F4F4F5] underline underline-offset-4'
                        : 'font-medium text-[#475569] dark:text-zinc-400 hover:text-[#0F172B] dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.swatchClass}`} />
                    <span>{theme.name.replace('Neon ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* 3. Staff Badge Toggle OR VIP Avatar Frame Quick Picker */}
          {vipVisual.canUseNeonCover ? (
            <button
              type="button"
              role="switch"
              aria-checked={tagOn}
              onClick={() =>
                saveVipPatch({
                  vipTagEnabled: !tagOn,
                  customToast: !tagOn
                    ? 'Đã BẬT huy hiệu Quản Trị / GV bên cạnh tên!'
                    : 'Đã TẮT huy hiệu bên cạnh tên.'
                })
              }
              className="bg-transparent border-0 rounded-none py-3 lg:py-1 lg:pl-5 text-left flex items-center justify-between gap-3 w-full"
            >
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  <span>Nhãn Quản Trị / GV Cạnh Tên</span>
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400">
                  Hiện huy hiệu ánh kim bên cạnh tên của bạn
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${
                  tagOn ? 'bg-[#F59E0B] text-[#09090B]' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200'
                }`}
              >
                {tagOn ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </span>
            </button>
          ) : (
            <div className="bg-transparent border-0 rounded-none py-3 lg:py-1 lg:pl-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chọn Khung Viền Avatar VIP</span>
                  </p>
                  <p className="text-xs text-[#475569] dark:text-zinc-400">
                    Đổi nhanh khung viền Avatar nổi bật trên Hồ sơ, Navbar &amp; BXH
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                {AVATAR_FRAMES.map(frame => {
                  const selected = (student.avatarFrameId || 'none') === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      title={`Khung viền: ${frame.name}`}
                      onClick={() =>
                        handleUpdateUserProfileFields(student.username, {
                          avatarFrameId: frame.id,
                          customToast:
                            frame.id === 'none'
                              ? 'Đã chuyển về viền Avatar mặc định.'
                              : `Đã trang bị khung viền Avatar "${frame.name}"!`
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold transition ${
                        selected
                          ? 'border-[#007A7A] bg-[#EDFFFD] dark:bg-zinc-800 dark:border-amber-400 text-[#0F172B] dark:text-white'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-slate-400'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${frame.previewBg}`} />
                      <span>{frame.name.replace(' VIP', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const profileCardCls =
    'bg-white dark:bg-[#18181B] rounded-2xl border border-[#E2E8F0] dark:border-zinc-800';
  const profileActionBtnCls =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#09090B] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation & Header Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-zinc-800 px-3.5 py-2 rounded-[6px] border border-slate-200 dark:border-zinc-700 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {effectiveBackLabel}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!isSelf && currentUser?.username && (
            <button
              type="button"
              onClick={() => {
                setSelectedProfileStudent(currentUser.username);
                setTempNoteText('');
              }}
              className={profileActionBtnCls}
            >
              <UserCheck className="w-4 h-4 text-slate-600 dark:text-zinc-300" /> Quay về Hồ Sơ Của Tôi ({currentUser.name})
            </button>
          )}

          {/* Messenger-Style Dropdown Directory Popup Trigger (hidden for Guest accounts) */}
          {!currentUser?.isGuest && (
          <div className="relative" ref={memberDirectoryRef}>
            <button
              type="button"
              onClick={() => setShowMemberDirectoryPopup(v => !v)}
              aria-expanded={showMemberDirectoryPopup}
              aria-label="Mở danh bạ hồ sơ thành viên"
              className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
                showMemberDirectoryPopup
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white hover:bg-slate-50 dark:bg-[#18181B] dark:hover:bg-zinc-800 border-[#E2E8F0] dark:border-zinc-700 text-[#0F172B] dark:text-zinc-100 shadow-sm'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  showMemberDirectoryPopup
                    ? 'bg-white/20 text-white'
                    : 'bg-[#0F766E] text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
              <span>Danh Bạ</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold tabular-nums ${
                  showMemberDirectoryPopup
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200'
                }`}
              >
                {allMembers.length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showMemberDirectoryPopup ? 'rotate-180' : ''
                }`}
              />
              {newFeedbacksCount > 0 && isViewerSuperAdmin && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center"
                  title={`${newFeedbacksCount} góp ý chờ đọc`}
                >
                  {newFeedbacksCount > 9 ? '9+' : newFeedbacksCount}
                </span>
              )}
            </button>

            {showMemberDirectoryPopup && (
              <div className="apple-popover-origin fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-[410px] max-h-[75vh] flex flex-col bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-zinc-700 z-[35] overflow-hidden">
                <div className="px-4 py-3 bg-[#F8FAFC] dark:bg-zinc-900 border-b border-[#E2E8F0] dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-700 dark:text-zinc-200" />
                      Danh Bạ Hồ Sơ Thành Viên ({filteredMembers.length}/{allMembers.length})
                    </h2>
                    <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                      Chọn thành viên để xem nhanh hồ sơ, tiến trình &amp; góp ý.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMemberDirectoryPopup(false)}
                    aria-label="Đóng danh bạ thành viên"
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 border-b border-[#E2E8F0] dark:border-zinc-800 space-y-2.5 shrink-0 bg-white dark:bg-[#18181B]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Tìm tên hoặc @username..."
                      aria-label="Tìm thành viên theo tên hoặc username"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] dark:bg-zinc-900 text-[#0F172B] dark:text-zinc-100 border border-[#CBD5E1] dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'all', label: `Tất cả (${allMembers.length})` },
                      ...(adminCardMember ? [{ id: 'admin', label: 'Quản trị (1)' }] : []),
                      { id: 'teacher', label: `Giáo viên (${allMembers.filter(m => !m.isSystemAdmin && m.role === 'teacher').length})` },
                      { id: 'student', label: `Học viên (${allMembers.filter(m => !m.isSystemAdmin && m.role !== 'teacher' && !m.isGuest).length})` },
                      ...(allMembers.some(m => !m.isSystemAdmin && m.role !== 'teacher' && m.isGuest)
                        ? [{ id: 'guest', label: `Tài khoản khách (${allMembers.filter(m => !m.isSystemAdmin && m.role !== 'teacher' && m.isGuest).length})` }]
                        : [])
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMemberRoleFilter(f.id)}
                        className={`px-2.5 py-1 rounded-[6px] border transition ${
                          memberRoleFilter === f.id
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-200/70 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-[#475569] dark:text-zinc-400 py-6 text-center">
                      Không tìm thấy thành viên nào khớp &quot;{memberSearch}&quot;.
                    </p>
                  ) : (
                    filteredMembers.map(member => {
                      const isSelected = activeUsername === member.username;
                      const isMemberAdmin = Boolean(member.isSystemAdmin);
                      const isMemberTeacher = !isMemberAdmin && member.role === 'teacher';
                      const isMeChip = member.username === currentUser?.username;
                      const mBest = bestBandByStudent.get(member.username) ?? null;
                      const memberVipVisual = resolveUserVipNameVisual(member);

                      const memberCardBtn = (
                        <button
                          key={memberVipVisual.showNeonCover ? undefined : member.username}
                          type="button"
                          onClick={() => {
                            setSelectedProfileStudent(member.username);
                            setTempNoteText('');
                            setShowMemberDirectoryPopup(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                            memberVipVisual.showNeonCover
                              ? isSelected
                                ? 'rounded-[10px] bg-slate-50 dark:bg-zinc-800/95'
                                : 'rounded-[10px] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-zinc-900'
                              : isSelected
                              ? 'rounded-xl border bg-slate-100 dark:bg-zinc-800 border-slate-400 dark:border-zinc-500'
                              : 'rounded-xl border bg-[#F8FAFC] dark:bg-zinc-900 border-[#E2E8F0] dark:border-zinc-800 hover:border-slate-300 hover:bg-white dark:hover:bg-zinc-800'
                          }`}
                        >
                          <UserAvatarBadge user={member} sizeClass="w-10 h-10" textClass="text-xs" rounded="rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <VipMemberName
                                user={member}
                                fallbackName={member.name || member.username}
                                className="text-xs font-bold text-[#0F172B] dark:text-[#F4F4F5] truncate"
                                badgeSize="xs"
                              />
                              {isMeChip && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-700 text-[#334155] dark:text-zinc-200 shrink-0">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#475569] dark:text-zinc-400 flex items-center gap-1 flex-wrap mt-0.5">
                              {(() => {
                                const mTitle = resolveVisibleTitleBadge(member, attempts, roomsDb, customTitles, paymentConfig, titleExtraOpts);
                                if (isMemberAdmin) {
                                  return (
                                    <>
                                      <span className="text-slate-700 dark:text-zinc-200 font-bold inline-flex items-center gap-1">
                                        ADMIN &bull; Góp ý
                                        {newFeedbacksCount > 0 && (
                                          <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-xs font-bold">
                                            {newFeedbacksCount} mới
                                          </span>
                                        )}
                                      </span>
                                      {mTitle && !mTitle.isRoleBuiltIn && (
                                        <span className={`px-1.5 py-0.2 rounded-full border font-semibold text-xs ${mTitle.badgeClass}`}>
                                          {mTitle.icon} {mTitle.label}
                                        </span>
                                      )}
                                    </>
                                  );
                                }
                                if (isMemberTeacher) {
                                  return (
                                    <>
                                      <span className="text-[#334155] dark:text-zinc-200 font-bold">Giáo viên</span>
                                      {mTitle && !mTitle.isRoleBuiltIn && (
                                        <span className={`px-1.5 py-0.2 rounded-full border font-semibold text-xs ${mTitle.badgeClass}`}>
                                          {mTitle.icon} {mTitle.label}
                                        </span>
                                      )}
                                    </>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center gap-1 flex-wrap">
                                    {member.isGuest && (
                                      <span className="px-1.5 py-0.2 rounded-full border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                                        Tài khoản khách
                                      </span>
                                    )}
                                    {!member.isGuest && mTitle && !mTitle.isRoleBuiltIn && (
                                      <span className={`px-1.5 py-0.2 rounded-full border font-semibold text-xs ${mTitle.badgeClass}`}>
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
                            </div>
                          </div>
                        </button>
                      );

                      return memberVipVisual.showNeonCover ? (
                        <div
                          key={member.username}
                          className={`vip-card-rim rounded-xl p-[2px] transition-all ${memberVipVisual.neonCoverMeta.cardRimWrapClass}`}
                        >
                          {memberCardBtn}
                        </div>
                      ) : memberCardBtn;
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Clean SaaS Profile Header + VIP Neon LED Frame when enabled */}
      <div
        className={
          vipVisual.showNeonCover
            ? `vip-neon-frame rounded-2xl p-[3px] mb-7 transition-all ${vipVisual.neonCoverMeta.frameWrapClass}`
            : 'bg-white dark:bg-[#18181B] rounded-2xl border border-[#E2E8F0] dark:border-zinc-800 overflow-hidden mb-7'
        }
        style={vipVisual.showNeonCover ? undefined : { boxShadow: 'none' }}
      >
        {/* 1. Compact Cover Photo / Banner Stage */}
        <div
          className={`relative w-full h-[160px] sm:h-[180px] overflow-hidden ${
            vipVisual.showNeonCover
              ? 'rounded-t-[13px]'
              : 'border-b border-[#E2E8F0] dark:border-zinc-800'
          } ${
            hasCustomCover ? 'bg-slate-100 dark:bg-zinc-900' : heroBanner.heroClass
          }`}
        >
          {hasCustomCover && (
            <img
              src={student.profileCoverUrl}
              alt={`Ảnh bìa của ${student.name || student.username}`}
              className="w-full h-full object-cover object-center select-none"
            />
          )}

          {vipVisual.showNeonCover && (
            <div
              aria-hidden="true"
              className={`vip-cover-led absolute inset-0 rounded-t-[13px] pointer-events-none ${vipVisual.neonCoverMeta.coverLedInnerClass}`}
            />
          )}

          {canEditTargetInfo && !currentUser?.isGuest && (
            <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-4 z-10 flex flex-wrap items-center justify-end gap-2">
              {isSelf && !studentHasCoverPermission && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Ảnh Nền Riêng (1 Tháng)', itemPrice: normalizedPayCfg.coverUnlockPrice })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-100/95 hover:bg-white dark:bg-zinc-800/95 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  <span>Mở Ảnh Nền ({unlockPriceLabel}/1 tháng)</span>
                </button>
              )}
              {isSelf && studentHasCoverPermission && !isTargetTeacher && !isTargetSystemAdmin && student.customCoverExpiresAt > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Gia Hạn Ảnh Nền Riêng (+1 Tháng)', itemPrice: normalizedPayCfg.coverUnlockPrice, renew: true })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-100/95 hover:bg-white dark:bg-zinc-800/95 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition"
                  title="Gia hạn thêm 30 ngày quyền Ảnh Nền Riêng"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                  <span>Gia hạn ({coverRemainingText || '30 ngày'})</span>
                </button>
              )}
              <button
                type="button"
                onClick={openCustomizeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-100/95 hover:bg-white text-slate-700 dark:bg-zinc-800/95 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold transition"
              >
                <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                <span>Đổi Ảnh Bìa</span>
              </button>
            </div>
          )}
          {vipVisual.showNeonCover && (
            <div className={`vip-neon-seam absolute bottom-0 inset-x-0 h-[3px] z-10 pointer-events-none ${vipVisual.neonCoverMeta.seamBarClass}`} />
          )}
        </div>

        {/* 2. Profile Info & Controls Section Below Cover */}
        <div className={`vip-profile-inner px-5 sm:px-8 pb-6 pt-3 bg-white dark:bg-[#18181B] ${vipVisual.showNeonCover ? 'rounded-b-[13px]' : ''}`}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 min-w-0">
              {/* Proportional Overlapping Avatar inside clean collar so VIP frame ring & glow sit symmetrically */}
              <div className="-mt-12 sm:-mt-14 relative z-20 shrink-0 w-fit">
                <div className="vip-avatar-collar p-1 rounded-full bg-white dark:bg-[#18181B] flex items-center justify-center">
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
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clean High-Contrast Profile Identity & Unified Action Buttons */}
              <div className="space-y-2 min-w-0 sm:pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172B] dark:text-[#F4F4F5] leading-tight">
                    <VipMemberName user={student} fallbackName={student.name} nameClassName="text-[#0F172B] dark:text-[#F4F4F5]" />
                  </h1>
                  {isTargetSystemAdmin ? (
                    <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-slate-600 dark:text-zinc-300" /> ADMIN &bull; Quản Trị Hệ Thống
                    </span>
                  ) : isTargetTeacher ? (
                    <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-600 dark:text-zinc-300" /> Giáo Viên IELTS
                    </span>
                  ) : student.isGuest ? (
                    <span className="text-xs bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-amber-600 dark:text-amber-300" /> Tài Khoản Khách
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-slate-600 dark:text-zinc-300" /> Học Viên Chính Thức
                    </span>
                  )}
                  {!student.isGuest && !currentUser?.isGuest && visibleTitle && !visibleTitle.isRoleBuiltIn && (
                    <button
                      type="button"
                      onClick={() => setShowTitlesModal(true)}
                      title="Bấm để xem bảng danh hiệu và cách đạt được"
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition cursor-pointer ${visibleTitle.badgeClass}`}
                    >
                      <span>{visibleTitle.icon}</span>
                      <span>{visibleTitle.label}</span>
                    </button>
                  )}
                  {isSelf && student.showTitleBadge === false && (
                    <button
                      type="button"
                      onClick={() => setShowTitlesModal(true)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 transition"
                    >
                      <EyeOff className="w-3 h-3" /> Đang tắt danh hiệu
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-zinc-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" /> Gia nhập: <b className="text-[#0F172B] dark:text-[#F4F4F5] tabular-nums">{student.joinedDate || '01/02/2026'}</b>
                  </span>
                  {!isTargetTeacher && !isTargetSystemAdmin && (
                    <span className="flex items-center gap-1.5 text-[#0F172B] dark:text-zinc-200 font-semibold">
                      <Target className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Mục tiêu Target: <b>Band {student.targetBand || '8.0'}</b>
                    </span>
                  )}
                  {(student.studyGoal || isTargetTeacher || isTargetSystemAdmin) && (
                    <span className="text-xs text-[#475569] dark:text-zinc-300">
                      • {isTargetSystemAdmin
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
                            targetListening: student.targetListening ?? '',
                            targetReading: student.targetReading ?? '',
                            targetWriting: student.targetWriting ?? '',
                            targetSpeaking: student.targetSpeaking ?? '',
                            studyGoal: student.studyGoal || '',
                            avatarUrl: student.avatarUrl || ''
                          })
                        }
                        className={profileActionBtnCls}
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> {isTargetTeacher || isTargetSystemAdmin ? 'Chỉnh hồ sơ' : 'Chỉnh mục tiêu'}
                      </button>
                      {!currentUser?.isGuest && (
                        <button
                          type="button"
                          onClick={openCustomizeModal}
                          className={profileActionBtnCls}
                        >
                          <Palette className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Tùy Chỉnh Hình Nền &amp; Khung
                        </button>
                      )}
                    </>
                  )}
                  {!currentUser?.isGuest && !student.isGuest && (
                    <button
                      type="button"
                      onClick={() => setShowTitlesModal(true)}
                      className={profileActionBtnCls}
                    >
                      <Trophy className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Danh Hiệu ({titleSummary?.unlockedIds?.length || 1}/{titleSummary?.itemsWithProgress?.length || 18})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowExamTierGuideModal(true)}
                    className={profileActionBtnCls}
                    title="Xem bảng 10 hạng chữ cạnh tên & cách mở khóa"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Hạng Cạnh Tên ({studentPurchaseTier ? studentPurchaseTier.label : `${studentPurchasedCount} đề`} · Cách mở)
                  </button>
                  {isViewerSuperAdmin && !isTargetSystemAdmin && onOpenAdminTitleManager && (
                    <button
                      type="button"
                      onClick={() => onOpenAdminTitleManager(student.username)}
                      className={profileActionBtnCls}
                    >
                      <Crown className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Tặng Danh Hiệu
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Đã Mở Ảnh Nền
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />{' '}
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
                        if (studentHasAieoVip && !window.confirm(`Thu hồi gói IELTS VIP của ${student.name || student.username}?`)) {
                          return;
                        }
                        setIsTogglingSubscription(true);
                        await onToggleUserSubscription(student.username, 'aieo_vip', !studentHasAieoVip);
                        setIsTogglingSubscription(false);
                      }}
                      className={profileActionBtnCls}
                    >
                      <Crown className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                      {studentHasAieoVip ? '✓ Đang mở IELTS VIP (1T)' : '+ Cấp IELTS VIP (1T)'}
                    </button>
                  )}
                  {isViewerSuperAdmin && student.role !== 'teacher' && onToggleUserSubscription && (
                    <>
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
                      {(student.roomCreateCredits || 0) > 0 && (
                        <button
                          type="button"
                          disabled={isTogglingSubscription}
                          onClick={async () => {
                            setIsTogglingSubscription(true);
                            await onToggleUserSubscription(student.username, 'room_ticket', false);
                            setIsTogglingSubscription(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-[#B91C1C] dark:text-rose-300 text-xs font-semibold transition"
                          title="Trừ bớt -1 Vé Phòng nếu cộng nhầm"
                        >
                          -1 Vé Phòng
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isTogglingSubscription}
                        onClick={async () => {
                          setIsTogglingSubscription(true);
                          await onToggleUserSubscription(student.username, 'real_exam_credit', true);
                          setIsTogglingSubscription(false);
                        }}
                        className={profileActionBtnCls}
                      >
                        +1 Lượt Thực Chiến{studentRealExamCredits > 0 ? ` · Đang có ${studentRealExamCredits}` : ''}
                      </button>
                      {studentRealExamCredits > 0 && (
                        <button
                          type="button"
                          disabled={isTogglingSubscription}
                          onClick={async () => {
                            setIsTogglingSubscription(true);
                            await onToggleUserSubscription(student.username, 'real_exam_credit', false);
                            setIsTogglingSubscription(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-[#B91C1C] dark:text-rose-300 text-xs font-semibold transition"
                          title="Trừ bớt -1 Lượt Thực Chiến nếu cộng nhầm"
                        >
                          -1 Lượt Thực Chiến
                        </button>
                      )}
                    </>
                  )}
                  {isSelf && onOpenAccountSecurity && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenAccountSecurity('password')}
                        className={profileActionBtnCls}
                      >
                        <Key className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Đổi Mật Khẩu
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAccountSecurity('email')}
                        className={profileActionBtnCls}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                        {student.emailVerified ? `Email OTP ✓ (${student.maskedEmail || student.email})` : 'Liên Kết Email OTP'}
                      </button>
                    </>
                  )}
                </div>

                {!isSelf && !isTeacherViewer && !isTargetSystemAdmin && (
                  <p className="text-xs text-[#475569] dark:text-zinc-400 flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-3 h-3 text-slate-600 dark:text-zinc-300" /> Đang xem hồ sơ thành viên khác (chế độ chỉ xem; bài viết chi tiết &amp; nhận xét riêng được bảo mật).
                  </p>
                )}
              </div>
            </div>

            {/* Right Flat Summary Column (Zero nested border/rounded/bg box) */}
            <div className="pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 lg:pl-6 lg:text-right sm:min-w-[235px] shrink-0">
              {isTargetSystemAdmin ? (
                <div className="bg-transparent border-0 rounded-none">
                  <p className="text-xs uppercase tracking-wider text-[#1E293B] dark:text-[#E4E4E7] font-bold mb-1">
                    Hòm Thư Góp Ý Web
                  </p>
                  <p className="text-base font-black text-[#0F172B] dark:text-[#FAFAFA]">{adminFeedbacks.length} góp ý đã tiếp nhận</p>
                  <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-semibold mt-1">
                    {adminFeedbacks.filter(f => f.status === 'done').length} đã thêm • {newFeedbacksCount} chờ đọc
                  </p>
                </div>
              ) : isTargetTeacher ? (
                <div className="bg-transparent border-0 rounded-none">
                  <p className="text-xs uppercase tracking-wider text-[#1E293B] dark:text-[#E4E4E7] font-bold mb-1">
                    Hồ Sơ Giáo Viên
                  </p>
                  <p className="text-base font-black text-[#0F172B] dark:text-[#FAFAFA]">{BRAND_INFO.siteName}</p>
                  <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-semibold mt-1">
                    {tests.length} đề thi • {totalGradedByTeacher} bài đã chấm
                  </p>
                </div>
              ) : (
                <div className="bg-transparent border-0 rounded-none">
                  <p className="text-xs uppercase tracking-wider text-[#1E293B] dark:text-[#E4E4E7] font-bold mb-1">Đánh Giá Tiến Độ</p>
                  {highestBand ? (
                    <div>
                      <p className="text-2xl font-black text-[#0F172B] dark:text-[#FAFAFA] tabular-nums">
                        Band {highestBand} <span className="text-xs text-[#475569] dark:text-[#A1A1AA] font-semibold">/ {student.targetBand || 8.0}</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold mt-1">
                        {highestBand >= (student.targetBand || 8.0)
                          ? 'Đã đạt mục tiêu đề ra!'
                          : `Còn ${((student.targetBand || 8.0) - highestBand).toFixed(1)} Band nữa để đạt mục tiêu`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Chưa có kết quả bài thi</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Profile Content Workspace */}
      <div className="space-y-6 min-w-0">

      {/* SYSTEM ADMIN PROFILE: DEDICATED DONATE QR + ADMIN PAYMENT HISTORY + FEEDBACK INBOX */}
      {isTargetSystemAdmin ? (() => {
        const donateBankCode = normalizedPayCfg.bankCode || 'MB';
        const donateAccountNumber = normalizedPayCfg.accountNumber || '0335613426';
        const donateAccountName = normalizedPayCfg.accountName || 'NGUYEN HOANG TUAN';
        const cleanViewerDonateTag = String(currentUser?.username || '')
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 24);
        const donateAddInfo =
          cleanViewerDonateTag && !isSelf
            ? `UNGHO ${cleanViewerDonateTag} DUY TRI WEB`
            : 'UNG HO ADMIN TUAN DUY TRI WEB IELTS';
        const effectiveDonateQrAmount = Math.max(MIN_DONATE_AMOUNT_VND, Number(qrDonateAmount) || MIN_DONATE_AMOUNT_VND);
        const isDonateAmountValid = Number(donateAmount) >= MIN_DONATE_AMOUNT_VND;
        const dynamicDonateQr = buildVietQrImageUrl({
          bankCode: donateBankCode,
          accountNumber: donateAccountNumber,
          accountName: donateAccountName,
          amount: effectiveDonateQrAmount,
          addInfo: donateAddInfo
        });
        const adminDonateQrSrc = normalizedPayCfg.donateQrUrl || dynamicDonateQr;

        const handleReportDonateTransfer = async () => {
          if (reportingDonate || !currentUser?.username) return;
          const cleanAmt = Math.round(Number(donateAmount) || 0);
          if (cleanAmt < MIN_DONATE_AMOUNT_VND) {
            showToast?.(`Mức ủng hộ tùy tâm tối thiểu là ${formatVndCurrency(MIN_DONATE_AMOUNT_VND)}!`, 'error');
            return;
          }
          setReportingDonate(true);
          try {
            const snap = await dispatchSyncAction?.('REPORT_DONATE_PAYMENT', {
              amount: cleanAmt,
              note: donateNote.trim()
            });
            if (snap) {
              setDonateNote('');
              showToast?.(
                `Đã ghi nhận & gửi thông báo ủng hộ ${formatVndCurrency(cleanAmt)} tới Admin Tuấn! Cảm ơn bạn rất nhiều 💜`
              );
            }
          } finally {
            setReportingDonate(false);
          }
        };

        const safePaymentList = Array.isArray(adminPaymentHistory) ? adminPaymentHistory : [];
        const paidTxList = safePaymentList.filter(tx => tx?.status === 'paid');
        const reportedTxList = safePaymentList.filter(tx => tx?.status !== 'paid');
        const totalPaidRevenue = paidTxList.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
        const uniquePayerCount = new Set(safePaymentList.map(tx => tx?.username).filter(Boolean)).size;
        const filteredPaymentTx = safePaymentList.filter(tx => {
          if (!tx) return false;
          if (paymentHistoryFilter === 'paid') return tx.status === 'paid';
          if (paymentHistoryFilter === 'reported') return tx.status !== 'paid';
          if (paymentHistoryFilter === 'donate') return tx.itemType === 'donate';
          return true;
        });

        return (
        <div className="space-y-6">
          {isSelf && (
            <div className={`${profileCardCls} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-slate-700 dark:text-zinc-200" /> Đặc Quyền Hiển Thị ADMIN / IELTS VIP
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                    Quản trị viên có thể bật/tắt nhanh chữ màu đỏ VIP và nhãn IELTS VIP cạnh tên hiển thị.
                  </p>
                </div>
              </div>
              {renderVipAppearanceSwitches()}
            </div>
          )}

          {/* Dedicated Admin Donate / Web Maintenance QR Card (Neutral Zinc & Flat Bank Rows) */}
          <div className={`${profileCardCls} p-5 sm:p-6`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0 bg-transparent border-0 rounded-none flex flex-col items-center gap-2">
                {adminDonateQrSrc ? (
                  <img
                    src={adminDonateQrSrc}
                    alt="Mã QR Ủng Hộ Admin Tuấn"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain p-2 bg-white rounded"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-[#F1F5F9] dark:bg-[#27272A] rounded text-xs text-[#1E293B] dark:text-[#E4E4E7] text-center p-4">
                    Chưa cấu hình QR ủng hộ
                  </div>
                )}
                <span className="text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> VietQR Ủng Hộ Riêng Admin Tuấn
                </span>
              </div>

              <div className="flex-1 space-y-3 text-left w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border border-[#E2E8F0] dark:border-zinc-700 text-xs font-bold">
                    <Heart className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> Quỹ Duy Trì Website &amp; Server
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#EDFFFD] dark:bg-teal-950/60 border border-[#B5F5F1] dark:border-teal-700 text-[#0F766E] dark:text-[#1EE1D6] text-xs font-bold tabular-nums">
                    Số tiền trên QR: {formatVndCurrency(effectiveDonateQrAmount)}
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA]">
                    Ủng Hộ Admin Tuấn Chi Phí Duy Trì Trang Web &amp; Server
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {normalizedPayCfg.donateMessage ||
                      'Mọi khoản đóng góp tùy tâm (tối thiểu 5.000đ) đều giúp Tuấn duy trì máy chủ, tên miền, API chấm AI và phát triển thêm nhiều tính năng mới miễn phí cho cộng đồng.'}
                  </p>
                </div>

                {!normalizedPayCfg.donateQrUrl && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDonateMode(true);
                          const parsed = Number(String(customDonateInput || '').replace(/\D/g, '')) || MIN_DONATE_AMOUNT_VND;
                          const safeVal = Math.min(50_000_000, Math.max(MIN_DONATE_AMOUNT_VND, parsed));
                          setCustomDonateInput(safeVal.toLocaleString('vi-VN'));
                          setDonateAmount(safeVal);
                        }}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition ${
                          isCustomDonateMode
                            ? 'bg-[#0F766E] text-white border-[#0F766E]'
                            : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border-[#E2E8F0] dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500'
                        }`}
                      >
                        Tùy tâm (≥ 5k)
                      </button>
                      {[
                        { val: 10000, label: '10.000đ' },
                        { val: 20000, label: '20.000đ' },
                        { val: 50000, label: '50.000đ' },
                        { val: 100000, label: '100.000đ' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setIsCustomDonateMode(false);
                            setDonateAmount(opt.val);
                            setQrDonateAmount(opt.val);
                          }}
                          className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition ${
                            !isCustomDonateMode && donateAmount === opt.val
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'bg-[#F1F5F9] dark:bg-[#27272A] text-[#1E293B] dark:text-[#E4E4E7] border-[#E2E8F0] dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {isCustomDonateMode && (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={customDonateInput}
                              onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                                if (!digits) {
                                  setCustomDonateInput('');
                                  setDonateAmount(0);
                                  return;
                                }
                                const num = Math.min(50_000_000, Number(digits));
                                setCustomDonateInput(num.toLocaleString('vi-VN'));
                                setDonateAmount(num);
                              }}
                              onBlur={() => {
                                const clamped = Math.max(MIN_DONATE_AMOUNT_VND, Number(donateAmount) || 0);
                                setDonateAmount(clamped);
                                setCustomDonateInput(clamped.toLocaleString('vi-VN'));
                                setQrDonateAmount(clamped);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const clamped = Math.max(MIN_DONATE_AMOUNT_VND, Number(donateAmount) || 0);
                                  setDonateAmount(clamped);
                                  setCustomDonateInput(clamped.toLocaleString('vi-VN'));
                                  setQrDonateAmount(clamped);
                                }
                              }}
                              placeholder="Tối thiểu 5.000 VNĐ (VD: 15.000)..."
                              aria-label="Nhập số tiền ủng hộ tùy tâm tối thiểu 5.000 VNĐ"
                              className={`w-full pl-3 pr-14 py-2 rounded-lg text-xs font-bold tabular-nums bg-[#F8FAFC] dark:bg-zinc-900 text-[#0F172B] dark:text-[#FAFAFA] border focus:outline-none focus:ring-2 ${
                                isDonateAmountValid
                                  ? 'border-[#CBD5E1] dark:border-zinc-700 focus:ring-[#0F766E]'
                                  : 'border-rose-400 dark:border-rose-500 focus:ring-rose-500'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569] dark:text-zinc-400 pointer-events-none">
                              VNĐ
                            </span>
                          </div>
                          <span className="text-xs text-[#475569] dark:text-zinc-400">
                            {isDonateAmountValid
                              ? 'Mã QR tự động điền đúng số tiền bạn nhập.'
                              : 'Tối thiểu 5.000đ (mã QR giữ mức 5.000đ).'}
                          </span>
                        </div>
                        {!isDonateAmountValid && (
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            ⚠️ Số tiền ủng hộ tùy tâm tối thiểu là 5.000đ.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs border-t border-slate-200 dark:border-zinc-800 divide-y divide-slate-200 dark:divide-zinc-800 border-b">
                  <div className="bg-transparent border-0 rounded-none py-2 flex items-center justify-between gap-3">
                    <span className="text-[#475569] dark:text-[#A1A1AA]">Ngân hàng</span>
                    <span className="font-bold text-[#0F172B] dark:text-[#FAFAFA]">{normalizedPayCfg.bankName || donateBankCode}</span>
                  </div>
                  <div className="bg-transparent border-0 rounded-none py-2 flex items-center justify-between gap-3">
                    <span className="text-[#475569] dark:text-[#A1A1AA]">STK</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(donateAccountNumber);
                        showToast?.(`Đã sao chép STK ${donateAccountNumber}!`);
                      }}
                      className="font-bold font-mono text-[#0F172B] dark:text-[#FAFAFA] hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>{donateAccountNumber}</span>
                      <Copy className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" />
                    </button>
                  </div>
                  <div className="bg-transparent border-0 rounded-none py-2 flex items-center justify-between gap-3">
                    <span className="text-[#475569] dark:text-[#A1A1AA]">Chủ tài khoản</span>
                    <span className="font-bold text-[#0F172B] dark:text-[#FAFAFA]">{donateAccountName}</span>
                  </div>
                  <div className="bg-transparent border-0 rounded-none py-2 flex items-center justify-between gap-3">
                    <span className="text-[#475569] dark:text-[#A1A1AA]">Nội dung CK</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(donateAddInfo);
                        showToast?.(`Đã sao chép nội dung CK: ${donateAddInfo}`);
                      }}
                      className="font-bold font-mono text-[#0F766E] dark:text-[#1EE1D6] hover:underline inline-flex items-center gap-1.5 text-right"
                    >
                      <span>{donateAddInfo}</span>
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>

                {!isSelf && currentUser?.username && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={donateNote}
                      onChange={e => setDonateNote(e.target.value)}
                      maxLength={140}
                      placeholder="Lời nhắn gửi Admin Tuấn (không bắt buộc)..."
                      className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#F8FAFC] dark:bg-zinc-900 text-[#0F172B] dark:text-[#FAFAFA] border border-[#CBD5E1] dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                    <button
                      type="button"
                      disabled={reportingDonate || !isDonateAmountValid}
                      onClick={handleReportDonateTransfer}
                      className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D5F59] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {reportingDonate
                        ? 'Đang gửi báo Admin...'
                        : `Tôi Đã Chuyển Khoản (${formatVndCurrency(Math.max(MIN_DONATE_AMOUNT_VND, Number(donateAmount) || 0))})`}
                    </button>
                  </div>
                )}

                <p className="text-xs italic text-[#475569] dark:text-[#A1A1AA]">
                  Cảm ơn bạn đã ủng hộ &amp; tin tưởng đồng hành cùng website Luyện Thi IELTS Nha Trang! (Hệ thống tự ghi nhận tài khoản &amp; thông báo ngay cho Admin.)
                </p>
              </div>
            </div>
          </div>

          {/* SUPERADMIN-ONLY PAYMENT & DONATION HISTORY LOG */}
          {isViewerSuperAdmin && (
            <div className={`${profileCardCls} p-5 sm:p-6 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Lịch Sử Tài Khoản Đã Nạp Tiền &amp; Ủng Hộ ({safePaymentList.length})
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                    Tự động lưu mọi tài khoản thanh toán qua PayOS / SePay và các lượt báo chuyển khoản ủng hộ tùy tâm.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 font-extrabold tabular-nums">
                    Tổng đã nhận: {formatVndCurrency(totalPaidRevenue)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold tabular-nums">
                    {uniquePayerCount} tài khoản
                  </span>
                  {reportedTxList.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-extrabold tabular-nums">
                      {reportedTxList.length} chờ xác nhận
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Tất cả (${safePaymentList.length})` },
                  { id: 'paid', label: `Đã nhận (${paidTxList.length})` },
                  { id: 'reported', label: `Chờ xác nhận (${reportedTxList.length})` },
                  { id: 'donate', label: `Ủng hộ tùy tâm (${safePaymentList.filter(t => t?.itemType === 'donate').length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentHistoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      paymentHistoryFilter === tab.id
                        ? 'bg-[#0F766E] text-white border-[#0F766E]'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredPaymentTx.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#475569] dark:text-zinc-400 bg-[#F8FAFC] dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                  Chưa có giao dịch nạp tiền hoặc ủng hộ nào trong mục này.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredPaymentTx.map(tx => {
                    const isPaid = tx.status === 'paid';
                    const gwLabel =
                      tx.gateway === 'payos'
                        ? 'PayOS'
                        : tx.gateway === 'sepay'
                        ? 'SePay'
                        : tx.gateway === 'manual_donate'
                        ? 'Ủng hộ tùy tâm'
                        : tx.gateway === 'manual_request'
                        ? 'Chuyển khoản tay'
                        : 'Tự động';
                    const timeStr = new Date(Number(tx.paidAt || tx.createdAt) || Date.now()).toLocaleString('vi-VN');
                    return (
                      <div
                        key={tx.id}
                        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                          isPaid
                            ? 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/70'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProfileStudent(tx.username);
                                setTempNoteText('');
                              }}
                              className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] hover:underline"
                            >
                              {tx.userName || tx.username} (@{tx.username})
                            </button>
                            <span
                              className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                                isPaid
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
                                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              }`}
                            >
                              {isPaid ? '✓ Đã nhận' : '⏳ Chờ xác nhận'}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                              {gwLabel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                            {tx.itemLabel}
                            {tx.orderCode ? ` · Mã ${tx.orderCode}` : ''}
                          </p>
                          {tx.note && (
                            <p className="text-xs italic text-slate-600 dark:text-zinc-400">
                              &ldquo;{tx.note}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-[#475569] dark:text-zinc-400 tabular-nums">{timeStr}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                            +{formatVndCurrency(tx.amount)}
                          </span>
                          {!isPaid && (
                            <button
                              type="button"
                              disabled={busyTxId === tx.id}
                              onClick={async () => {
                                setBusyTxId(tx.id);
                                try {
                                  const snap = await dispatchSyncAction?.('CONFIRM_PAYMENT_TRANSACTION', { transactionId: tx.id });
                                  if (snap) showToast?.(`Đã xác nhận nhận ${formatVndCurrency(tx.amount)} từ @${tx.username}!`);
                                } finally {
                                  setBusyTxId('');
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Xác nhận
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyTxId === tx.id}
                            onClick={async () => {
                              if (!window.confirm(`Xóa bản ghi giao dịch của @${tx.username}?`)) return;
                              setBusyTxId(tx.id);
                              try {
                                await dispatchSyncAction?.('DELETE_PAYMENT_TRANSACTION', { transactionId: tx.id });
                              } finally {
                                setBusyTxId('');
                              }
                            }}
                            title="Xóa bản ghi này"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Submit New Feedback Card (Unified Primary Teal & Neutral Chrome) */}
            <form
              onSubmit={handleSendAdminFeedback}
              className={`xl:col-span-5 ${profileCardCls} p-6 space-y-4 h-fit`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#27272A] border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-[#E4E4E7] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-[#F4F4F5]">
                    Gửi Góp Ý &amp; Yêu Cầu Tính Năng
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-zinc-400">
                    Đề xuất tính năng mới hoặc báo lỗi để Quản Trị Hệ Thống nâng cấp website theo nhu cầu của bạn.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-zinc-300 mb-2">
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
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-zinc-300 mb-1.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={fbContent}
                  onChange={e => setFbContent(e.target.value)}
                  placeholder="Ví dụ: Em muốn có thêm phần luyện phát âm từng từ vựng, hoặc giáo viên muốn lọc điểm theo từng tuần..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] dark:bg-zinc-900 text-[#0F172B] dark:text-zinc-100 border border-[#CBD5E1] dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-500 focus:outline-none resize-y"
                />
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-1 text-right">{fbContent.length}/2000 ký tự</p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fbPrivate}
                  onChange={e => setFbPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-[#0F766E] accent-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>Gửi riêng tư (chỉ bạn và Quản trị hệ thống đọc được)</span>
              </label>

              <button
                type="submit"
                className="!mt-4 w-full py-3 px-5 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi Góp Ý Đến Quản Trị
              </button>
            </form>

            {/* Feedback List & Admin Triage Board */}
            <div className={`xl:col-span-7 ${profileCardCls} p-6 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                    Bảng Góp Ý &amp; Tiến Độ Cập Nhật ({filteredFeedbacks.length})
                  </h2>
                  <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
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
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-200/70 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFeedbacks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-[#475569] dark:text-zinc-300">
                    Chưa có góp ý nào trong mục này.
                  </p>
                  <p className="text-xs text-[#475569] dark:text-zinc-400">
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
                        ? { text: 'Đã thêm tính năng', cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700', Icon: CheckCircle2 }
                        : fb.status === 'planned'
                        ? { text: 'Đang triển khai', cls: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700', Icon: Clock }
                        : { text: 'Mới gửi', cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700', Icon: Sparkles };
                    const StatusIcon = statusBadge.Icon;
                    const canDeleteFb = isViewerSuperAdmin || fb.authorUsername === currentUser?.username;
                    const draftStatus = statusDrafts[fb.id] || fb.status || 'new';
                    const draftReply = replyDrafts[fb.id] !== undefined ? replyDrafts[fb.id] : (fb.adminReply || '');

                    return (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-[#E2E8F0] dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold text-[#0F172B] dark:text-[#F4F4F5]">
                              {fb.authorName || fb.authorUsername}
                            </span>
                            <span className="text-xs font-mono text-[#475569] dark:text-zinc-400">@{fb.authorUsername}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                              {fb.authorRole === 'teacher' ? 'Giáo viên' : fb.authorRole === 'superadmin' ? 'Quản trị' : 'Học viên'}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 text-[#334155] dark:text-zinc-200">
                              {catLabel}
                            </span>
                            {fb.isPrivate && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-700">
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
                                className="p-1.5 rounded-lg text-[#475569] dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-[#0F172B] dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                          {fb.content}
                        </p>

                        <div className="text-xs text-[#475569] dark:text-zinc-400">
                          Gửi lúc: {fb.createdAt}
                        </div>

                        {fb.adminReply && !isViewerSuperAdmin && (
                          <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-1">
                            <p className="text-xs font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Phản hồi từ Quản Trị Hệ Thống {fb.repliedAt ? `(${fb.repliedAt})` : ''}
                            </p>
                            <p className="text-xs text-[#334155] dark:text-zinc-200 whitespace-pre-wrap">
                              {fb.adminReply}
                            </p>
                          </div>
                        )}

                        {isViewerSuperAdmin && (
                          <div className="pt-3 border-t border-[#E2E8F0] dark:border-zinc-800 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#475569] dark:text-zinc-400">Trạng thái xử lý:</span>
                              <select
                                value={draftStatus}
                                onChange={e => setStatusDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-zinc-800 border border-[#CBD5E1] dark:border-zinc-700 text-xs font-bold text-[#0F172B] dark:text-zinc-100"
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
                                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-[#0F172B] dark:text-zinc-100 border border-[#CBD5E1] dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
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
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Kho Đề Thi</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{tests.length}</p>
                <span className="text-xs text-[#475569] dark:text-zinc-400">{publicTests.length} đề công khai</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Bài Đã Chấm</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{totalGradedByTeacher}</p>
                <span className="text-xs text-[#475569] dark:text-zinc-400">Writing &amp; Nhận xét</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Phòng Đấu Game</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{totalActiveRooms}</p>
                <span className="text-xs text-[#475569] dark:text-zinc-400">PIN hiện tại: {currentRoomPin}</span>
              </div>
            </div>
            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Thành Viên Lớp</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">
                  {allMembers.filter(m => m.role !== 'teacher').length}
                </p>
                <span className="text-xs text-[#475569] dark:text-zinc-400">Học viên đang theo học</span>
              </div>
            </div>
          </div>

          {/* Contact & Support Info */}
          <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
              Thông Tin Liên Hệ &amp; Hỗ Trợ Học Viên
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <a
                href={BRAND_INFO.phoneHref}
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 transition flex items-start gap-3"
              >
                <Phone className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#475569] dark:text-zinc-400 uppercase text-xs">Hotline / Zalo</p>
                  <p className="font-extrabold text-[#0F172B] dark:text-[#F4F4F5] text-sm mt-0.5">{BRAND_INFO.phoneDisplay}</p>
                </div>
              </a>
              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#475569] dark:text-zinc-400 uppercase text-xs">Cơ Sở Giảng Dạy</p>
                  <p className="font-bold text-[#0F172B] dark:text-zinc-200 mt-0.5 leading-snug">{BRAND_INFO.address}</p>
                </div>
              </div>
              <a
                href={BRAND_INFO.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 transition flex items-start gap-3"
              >
                <Globe className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[#475569] dark:text-zinc-400 uppercase text-xs">Facebook Fanpage</p>
                  <p className="font-bold text-[#0F766E] dark:text-zinc-100 mt-0.5 truncate flex items-center gap-1">
                    {BRAND_INFO.facebookHandle} <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
              <a
                href={BRAND_INFO.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 transition flex items-start gap-3"
              >
                <BookOpen className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-[#475569] dark:text-zinc-400 uppercase text-xs">Blog Tài Liệu IELTS</p>
                  <p className="font-bold text-[#0F766E] dark:text-zinc-100 mt-0.5 truncate flex items-center gap-1">
                    luyenthiieltsnhatrang <ExternalLink className="w-3 h-3 shrink-0" />
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Public Exams Showcase */}
          <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800 mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                  Đề Thi Thử IELTS Đang Phát Hành ({publicTests.length})
                </h2>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
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
              <p className="text-xs text-[#475569] dark:text-zinc-400 text-center py-6">Hiện chưa có đề thi công khai nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTests.map(t => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-[#E2E8F0] dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-900 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-[#0F172B] dark:text-[#F4F4F5] line-clamp-2">{t.title}</p>
                      <p className="text-xs text-[#475569] dark:text-zinc-400 mt-1 line-clamp-2">
                        {t.description || 'Đề thi thử IELTS Full 4 kỹ năng chuẩn quốc tế.'}
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
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Tổng Số Lần Thi</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{totalAttempts} <span className="text-xs font-normal text-[#475569] dark:text-zinc-400">lần</span></p>
              </div>
            </div>

            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Band Cao Nhất</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{highestBand ?? '-'}</p>
              </div>
            </div>

            <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
              <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Điểm Overall Trung Bình</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">{overallAvg ?? '-'}</p>
                {approvedStudentAttempts.length > 0 && (
                  <span className="text-xs block font-semibold text-[#475569] dark:text-zinc-400 mt-0.5">
                    L: {avgListening ?? '-'} • R: {avgReading ?? '-'} • W: {avgWriting ?? '-'} • S: {avgSpeaking ?? '-'}
                  </span>
                )}
              </div>
            </div>

            {isTeacherViewer ? (
              <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
                <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Chống Gian Lận (Tab)</p>
                  <p className={`text-xl font-black ${avgTabSwitches <= 1 ? 'text-[#0F172B] dark:text-[#F4F4F5]' : 'text-amber-600 dark:text-amber-400'}`}>
                    {avgTabSwitches <= 1 ? 'An toàn' : 'Cần chú ý'}
                    <span className="text-xs block font-normal text-[#475569] dark:text-zinc-400">TB {avgTabSwitches} lần/bài</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${profileCardCls} p-5 flex items-center gap-3.5`}>
                <div className="p-3 bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7] rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">Mục Tiêu Band</p>
                  <p className="text-2xl font-black text-[#0F172B] dark:text-[#F4F4F5]">
                    Band {student.targetBand || '8.0'}
                  </p>
                  <span className="text-xs block font-normal text-[#475569] dark:text-zinc-400 mt-0.5">
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

          {/* Mục Tiêu & Tiến Độ Từng Kỹ Năng (L · R · W · S + Band Overall) */}
          <div className={`${profileCardCls} p-5 sm:p-6 mb-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                  <Target className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                  Mục Tiêu &amp; Tiến Độ Từng Kỹ Năng (4 Kỹ Năng + Overall)
                </h2>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5 max-w-2xl">
                  Theo dõi điểm trung bình thực tế của từng kỹ năng riêng biệt so với mục tiêu cá nhân đã cài đặt.
                </p>
              </div>
              {canEditTargetInfo && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingTargetUser({
                      username: student.username,
                      name: student.name || '',
                      role: student.role || 'student',
                      targetBand: student.targetBand || 7.5,
                      targetListening: student.targetListening ?? '',
                      targetReading: student.targetReading ?? '',
                      targetWriting: student.targetWriting ?? '',
                      targetSpeaking: student.targetSpeaking ?? '',
                      studyGoal: student.studyGoal || '',
                      avatarUrl: student.avatarUrl || ''
                    })
                  }
                  className={profileActionBtnCls}
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" /> Cài Mục Tiêu 4 Kỹ Năng
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800 bg-transparent border-0 rounded-none pt-4">
              {[
                {
                  key: 'listening',
                  label: 'Listening',
                  actual: avgListening,
                  count: gradedListeningAttempts.length,
                  target: student.targetListening ?? student.targetBand ?? 7.5
                },
                {
                  key: 'reading',
                  label: 'Reading',
                  actual: avgReading,
                  count: gradedReadingAttempts.length,
                  target: student.targetReading ?? student.targetBand ?? 7.5
                },
                {
                  key: 'writing',
                  label: 'Writing',
                  actual: avgWriting,
                  count: gradedWritingAttempts.length,
                  target: student.targetWriting ?? student.targetBand ?? 7.5
                },
                {
                  key: 'speaking',
                  label: 'Speaking',
                  actual: avgSpeaking,
                  count: gradedSpeakingAttempts.length,
                  target: student.targetSpeaking ?? student.targetBand ?? 7.5
                },
                {
                  key: 'overall',
                  label: 'Band Overall',
                  actual: overallAvg,
                  count: approvedStudentAttempts.length,
                  target: student.targetBand ?? 7.5
                }
              ].map((sk) => {
                const actualNum = sk.actual !== null ? Number(sk.actual) : null;
                const targetNum = Number(sk.target) || 7.5;
                const reached = actualNum !== null && actualNum >= targetNum;
                return (
                  <div key={sk.key} className="py-2 sm:py-1 sm:px-4 first:sm:pl-0 last:sm:pr-0 bg-transparent border-0 rounded-none">
                    <p className="text-xs font-bold uppercase text-[#475569] dark:text-zinc-400">
                      {sk.label}
                    </p>
                    <p className="text-xl font-black text-[#0F172B] dark:text-[#F4F4F5] mt-1 tabular-nums">
                      {sk.actual ?? '-'}
                      <span className="text-xs font-semibold text-[#475569] dark:text-zinc-400 ml-1">
                        / {targetNum}
                      </span>
                    </p>
                    <p className={`text-xs font-semibold mt-0.5 ${
                      reached
                        ? 'text-[#0F766E] dark:text-teal-400'
                        : 'text-[#475569] dark:text-zinc-400'
                    }`}>
                      {actualNum === null
                        ? 'Chưa có điểm duyệt'
                        : reached
                          ? `Đạt mục tiêu (${sk.count} bài)`
                          : `Còn thiếu ${(targetNum - actualNum).toFixed(1)} (${sk.count} bài)`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

      {/* Gói Thành Viên 1 Tháng & Tùy Chỉnh IELTS VIP */}
      {(isSelf || isViewerSuperAdmin) && (
        <div className={`${profileCardCls} p-5 sm:p-6 mb-8`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                <Crown className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                Gói Thành Viên 1 Tháng &amp; Đặc Quyền IELTS VIP
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                Mua đề lẻ hoặc gói Combo Lượt Thi Thực Chiến 4 Kỹ Năng (3 · 5 · 10 đề), mở Ảnh Nền Cá Nhân hoặc nâng cấp trọn bộ IELTS VIP cùng bạn bè.
              </p>
            </div>
            {studentHasAieoVip && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#991B1B] text-[#FFFFFF] border border-[#EF4444] text-xs font-semibold">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                IELTS VIP Active {aieoVipRemainingText ? `• ${aieoVipRemainingText}` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-800 mt-4">
            {/* Card 1: Đề Lẻ & Combo Thực Chiến 4 Kỹ Năng */}
            <div className="bg-transparent border-0 rounded-none py-3 md:py-1 md:pr-5 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" /> Đề Lẻ &amp; Combo Thực Chiến
                  </span>
                  <span className="text-xs font-bold text-[#0F766E] dark:text-teal-300 bg-[#F0FDFA] dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {studentRealExamCredits > 0 ? `Đang có ${studentRealExamCredits} lượt` : `Đề lẻ ${singleExamPriceLabel}`}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  • <b>Đề lẻ:</b> {singleExamPriceLabel}/đề • <b>3 Đề:</b> {combo3PriceLabel} • <b>5 Đề:</b> {combo5PriceLabel} • <b>8 Đề:</b> {combo8PriceLabel} • <b>10 Đề:</b> {combo10PriceLabel}.
                </p>
                <p className="text-xs font-bold text-[#1E293B] dark:text-[#E4E4E7]">
                  ✓ Đang có {studentRealExamCredits} lượt · Tổng đã nạp {studentPurchasedCount} đề
                  {studentPurchaseTier
                    ? ` · Hạng ${studentPurchaseTier.label}`
                    : studentNextTier
                    ? ` · Còn ${studentNextTier.minExams - studentPurchasedCount} đề lên ${studentNextTier.label}`
                    : ''}
                </p>
                {studentNextTier && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Mốc tiếp theo: <b>{studentNextTier.label}</b> ({studentNextTier.minExams} đề) · Cao nhất: <b>{EXAM_PURCHASE_TIERS[EXAM_PURCHASE_TIERS.length - 1].label}</b> ({EXAM_PURCHASE_TIERS[EXAM_PURCHASE_TIERS.length - 1].minExams} đề) ·{' '}
                    <button
                      type="button"
                      onClick={() => setShowExamTierGuideModal(true)}
                      className="font-bold text-[#0F766E] dark:text-teal-400 hover:underline"
                    >
                      Xem cách mở &amp; cài đặt
                    </button>
                  </p>
                )}
              </div>
              {isSelf && (
                <button
                  type="button"
                  onClick={() => (onOpenRealExamPricing ? onOpenRealExamPricing() : setView('HOME'))}
                  className="w-full py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition"
                >
                  Mua Lượt &amp; Xem Bảng Giá Combo
                </button>
              )}
            </div>

            {/* Card 2: Gói Tháng 20k (hidden for Guest accounts) */}
            {!currentUser?.isGuest && (
            <div className="bg-transparent border-0 rounded-none py-3 md:py-1 md:px-5 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1">
                    <Crown className="w-4 h-4 text-amber-500" /> Gói Tháng Game &amp; Hồ Sơ
                  </span>
                  <span className="text-xs font-semibold text-[#09090B] bg-[#F59E0B] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {aieoVipPriceLabel}/1 tháng
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  • Truy cập <b>Luyện Tập Game Từ Vựng</b> (14 kho từ &amp; Collocation) • Quyền <b>Tạo Phòng Luyện Tập Từ Vựng theo Chủ Đề</b> • <b>Chỉnh Màu Chữ Tên</b> • <b>Chọn Khung Viền Avatar</b> • <b>Thêm &amp; Đổi Ảnh Bìa Hồ Sơ</b>.
                </p>
                <p className={`text-xs font-bold ${studentHasAieoVip ? 'text-[#0F172B] dark:text-[#FAFAFA]' : 'text-slate-600 dark:text-zinc-300'}`}>
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
                      itemLabel: 'Gói IELTS VIP Full Quyền (1 Tháng)',
                      itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND,
                      renew: studentHasAieoVip
                    })
                  }
                  className="w-full py-2 rounded-lg bg-[#991B1B] hover:bg-[#B91C1C] text-[#FFFFFF] text-xs font-semibold transition"
                >
                  {studentHasAieoVip
                    ? `Gia hạn VIP +30N (${aieoVipPriceLabel})`
                    : `Đăng Ký IELTS VIP (${aieoVipPriceLabel})`}
                </button>
              )}
            </div>
            )}

            {/* Card 3: Ảnh Nền Riêng (5k / 1 tháng - hidden for Guest accounts) */}
            {!currentUser?.isGuest && (
            <div className="bg-transparent border-0 rounded-none py-3 md:py-1 md:pl-5 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F172B] dark:text-[#FAFAFA] flex items-center gap-1">
                    <Camera className="w-4 h-4 text-[#1E293B] dark:text-[#E4E4E7]" /> Ảnh Nền Cá Nhân
                  </span>
                  <span className="text-xs font-bold text-[#1E293B] dark:text-[#E4E4E7] bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-zinc-700 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {unlockPriceLabel}/1 tháng
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Tải &amp; cắt ảnh bìa cá nhân tùy thích cho hồ sơ (gói 1 tháng).
                </p>
                <p className={`text-xs font-bold ${studentHasCoverPermission ? 'text-[#0F172B] dark:text-[#FAFAFA]' : 'text-[#475569] dark:text-zinc-400'}`}>
                  {studentHasCoverPermission
                    ? coverRemainingText
                      ? `✓ Đang mở (${coverRemainingText})`
                      : studentHasAieoVip
                      ? `✓ Đã gồm miễn phí trong IELTS VIP (${aieoVipRemainingText || '30 ngày'})`
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
            )}
          </div>

          {!currentUser?.isGuest && renderVipAppearanceSwitches()}
        </div>
      )}

      {/* SECTION 1: TIẾN TRÌNH & ĐỘT PHÁ ĐIỂM SỐ QUA CÁC LẦN THI (SCORE PROGRESSION TIMELINE) */}
      <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
              Tiến Trình & Đột Phá Điểm Số Qua Các Lần Thi
            </h2>
            <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
              Theo dõi sự thay đổi band điểm qua từng bài thi từ lần đầu tiên đến lần thi gần nhất.
            </p>
          </div>

          {bandGrowth && Number(bandGrowth) > 0 && (
            <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Tăng trưởng: +{bandGrowth} Band Overall!
            </span>
          )}
        </div>

        {totalAttempts === 0 ? (
          <div className="p-8 text-center text-[#475569] dark:text-zinc-400 text-xs">
            Học viên chưa có bài thi nào để phân tích tiến trình điểm.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chronological Trajectory Cards (capped at latest 12 by default to prevent DOM lag) */}
            {(() => {
              const visibleTimeline = showAllTimelineCards
                ? chronologicalAttempts
                : chronologicalAttempts.slice(-12);
              const idxOffset = Math.max(0, chronologicalAttempts.length - visibleTimeline.length);
              return (
                <>
                  {chronologicalAttempts.length > 12 && (
                    <div className="flex items-center justify-between gap-2 text-xs text-[#475569] dark:text-zinc-400">
                      <span>
                        Đang hiển thị <b>{visibleTimeline.length}</b> / <b>{chronologicalAttempts.length}</b> lần thi gần nhất
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllTimelineCards(prev => !prev)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold transition"
                      >
                        {showAllTimelineCards
                          ? 'Thu gọn 12 lần gần nhất'
                          : `Xem tất cả ${chronologicalAttempts.length} lần thi`}
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibleTimeline.map((att, localIdx) => {
                      const idx = idxOffset + localIdx;
                      const showScores = isAttemptApprovedForViewer(att);
                      return (
                      <div
                        key={att.id}
                        className={`rounded-xl p-5 border transition ${
                          idx === chronologicalAttempts.length - 1
                            ? 'bg-[#F8FAFC] dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-600'
                            : 'bg-[#F8FAFC] dark:bg-zinc-900 border-[#E2E8F0] dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            idx === chronologicalAttempts.length - 1
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-white dark:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-[#E2E8F0] dark:border-zinc-700'
                          }`}>
                            Lần thi #{idx + 1} {idx === chronologicalAttempts.length - 1 ? '(Gần nhất)' : ''}
                          </span>
                          <div className="text-right">
                            <span className="text-xs text-[#475569] dark:text-zinc-400 font-medium block">{att.submittedAt}</span>
                            {Number(att.durationSeconds) > 0 && (
                              <span className="text-xs font-bold text-[#0F766E] dark:text-zinc-200 block">
                                {formatDurationVi(att.durationSeconds)}
                                {att.timelinessStatus === 'late' ? ` • Trễ ${att.lateByMinutes || 1}p` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="font-bold text-[#0F172B] dark:text-zinc-100 text-sm mb-3 line-clamp-1">{att.testTitle}</p>

                        <div className="flex items-center justify-between py-2 border-y border-[#E2E8F0] dark:border-zinc-800 mb-3">
                          <span className="text-xs text-[#475569] dark:text-zinc-400 font-semibold">Band Overall:</span>
                          <span className={`font-black bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 ${showScores && typeof att.overallBand === 'number' ? 'text-xl text-[#0F172B] dark:text-[#F4F4F5]' : 'text-xs text-amber-700 dark:text-amber-300'}`}>
                            {showScores ? (att.overallBand ?? 'Ms. Như đang check') : 'Ms. Như đang check'}
                          </span>
                        </div>

                        {/* Skill breakdown mini bars */}
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between text-slate-600 dark:text-zinc-300 font-semibold mb-1">
                              <span className="flex items-center gap-1">
                                <Headphones className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> Listening
                              </span>
                              <span className="font-bold text-slate-900 dark:text-zinc-100">
                                {typeof att.scores?.listening?.band === 'number'
                                  ? att.scores.listening.band
                                  : showScores
                                  ? '-'
                                  : 'Đang check'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-700 dark:bg-zinc-300 rounded-full transition-all"
                                style={{
                                  width: `${
                                    typeof att.scores?.listening?.band === 'number'
                                      ? (att.scores.listening.band / 9) * 100
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-600 dark:text-zinc-300 font-semibold mb-1">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> Reading
                              </span>
                              <span className="font-bold text-slate-900 dark:text-zinc-100">
                                {typeof att.scores?.reading?.band === 'number'
                                  ? att.scores.reading.band
                                  : showScores
                                  ? '-'
                                  : 'Đang check'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-700 dark:bg-zinc-300 rounded-full transition-all"
                                style={{
                                  width: `${
                                    typeof att.scores?.reading?.band === 'number'
                                      ? (att.scores.reading.band / 9) * 100
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-slate-600 dark:text-zinc-300 font-semibold mb-1">
                              <span className="flex items-center gap-1">
                                <PenTool className="w-3.5 h-3.5 text-[#1E293B] dark:text-[#E4E4E7]" /> {att.singleSkill === 'speaking' ? 'Speaking' : (att.scores?.speaking ? 'Writing · Speaking' : 'Writing')}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-zinc-100">
                                {!showScores
                                  ? 'Ms. Như đang check'
                                  : att.singleSkill === 'speaking'
                                    ? (att.scores?.speaking?.band ?? '-')
                                    : att.scores?.speaking
                                      ? `${att.scores?.writing?.overallBand ?? '-'} · ${att.scores?.speaking?.band ?? '-'}`
                                      : (att.scores?.writing?.overallBand ?? '-')}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-700 dark:bg-zinc-300 rounded-full transition-all"
                                style={{ width: `${showScores ? (((att.singleSkill === 'speaking' ? att.scores?.speaking?.band : att.scores?.writing?.overallBand) || 0) / 9) * 100 : 0}%` }}
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
                            className="mt-4 w-full bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-bold py-2 rounded-xl transition"
                          >
                            Xem Chi Tiết Bài Làm →
                          </button>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Skill Growth Highlights */}
            {firstAttempt && latestAttempt && totalAttempts > 1 && (
              <div className="bg-[#F8FAFC] dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    key: 'listening',
                    label: 'Tiến Độ Listening',
                    Icon: Headphones,
                    iconWrap: 'bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7]',
                    latestCls: 'text-[#0F172B] dark:text-[#F4F4F5]',
                    firstBand: firstAttempt.scores?.listening?.band,
                    latestBand: latestAttempt.scores?.listening?.band
                  },
                  {
                    key: 'reading',
                    label: 'Tiến Độ Reading',
                    Icon: BookOpen,
                    iconWrap: 'bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7]',
                    latestCls: 'text-[#0F172B] dark:text-[#F4F4F5]',
                    firstBand: firstAttempt.scores?.reading?.band,
                    latestBand: latestAttempt.scores?.reading?.band
                  },
                  {
                    key: 'writing',
                    label: 'Tiến Độ Writing',
                    Icon: PenTool,
                    iconWrap: 'bg-slate-100 dark:bg-[#27272A] text-slate-700 dark:text-[#E4E4E7]',
                    latestCls: 'text-[#0F172B] dark:text-[#F4F4F5]',
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
                        <p className="text-xs text-[#475569] dark:text-zinc-400 font-bold uppercase">{label}</p>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-[#F4F4F5]">
                          {hasFirst ? `Band ${firstBand}` : 'Chờ chấm'} →{' '}
                          <b className={latestCls}>{hasLatest ? `Band ${latestBand}` : 'Chờ chấm'}</b>
                          {delta !== null && (
                            <span
                              className={`text-xs font-bold ml-1.5 ${
                                delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : delta < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-[#475569] dark:text-zinc-400'
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
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
              Lịch Sử Chi Tiết Từng Lần Thi
            </h2>
            <p className="text-sm text-[#475569] dark:text-zinc-400 mt-0.5 max-w-2xl">Danh sách các bài thi đã hoàn thành của học viên {student.name}.</p>
          </div>
          <span className="text-xs font-bold text-[#475569] dark:text-zinc-400">Tổng cộng: {studentAttempts.length} bài thi</span>
        </div>

        {studentAttempts.length === 0 ? (
          <div className="py-10 border-t border-[#E2E8F0] dark:border-zinc-800 text-center text-[#475569] dark:text-zinc-400 text-sm">
            Chưa có dữ liệu bài thi.
          </div>
        ) : (() => {
          const fullExamAttemptsCount = studentAttempts.filter(a => a?.testMode !== 'single_skill').length;
          const singleSkillAttemptsCount = studentAttempts.filter(a => a?.testMode === 'single_skill').length;
          const filteredAttemptsList = studentAttempts.filter(a => {
            if (attemptModeFilter === 'full_exam') return a?.testMode !== 'single_skill';
            if (attemptModeFilter === 'single_skill') return a?.testMode === 'single_skill';
            return true;
          });
          const profHistorySlice = paginateItems(filteredAttemptsList, profileHistoryPage, 5);
          return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `Tất cả (${studentAttempts.length})` },
                { id: 'full_exam', label: `Đề Full 4KN (${fullExamAttemptsCount})` },
                { id: 'single_skill', label: `Đề Lẻ Daily (${singleSkillAttemptsCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAttemptModeFilter(tab.id);
                    setProfileHistoryPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    attemptModeFilter === tab.id
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="px-6 pt-3">
              <ListPaginationBar
                currentPage={profHistorySlice.safePage}
                totalItems={profHistorySlice.totalItems}
                pageSize={5}
                onPageChange={setProfileHistoryPage}
                itemLabel="lượt thi"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#334155] dark:text-zinc-300">
                <thead className="bg-[#F8FAFC] dark:bg-zinc-900 border-y border-[#E2E8F0] dark:border-zinc-800 text-xs text-[#334155] dark:text-zinc-300 uppercase">
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
                <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-zinc-800">
                  {profHistorySlice.pageItems.map((att, idx) => {
                    const risk = isTeacherViewer ? getRiskAssessment(att.tabSwitchCount, att.antiCheatLogs) : null;
                    const extSignals = isTeacherViewer ? countExtensionCheatSignals(att.antiCheatLogs) : 0;
                    const RiskIcon = risk?.icon;
                    const showRowScores = isAttemptApprovedForViewer(att);

                    return (
                      <tr key={att.id} className="hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#0F172B] dark:text-[#F4F4F5]">{att.testTitle}</p>
                          <span className="text-xs font-medium text-[#475569] dark:text-zinc-400">Lần thi #{studentAttempts.length - (profHistorySlice.startIdx + idx)}</span>
                        </td>
                      <td className="px-6 py-4 text-xs text-[#475569] dark:text-zinc-400">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#0F172B] dark:text-zinc-200 block">{att.submittedAt}</span>
                          {Number(att.durationSeconds) > 0 && (
                            <span className="text-xs text-[#475569] dark:text-zinc-400 block">
                              Làm trong {formatDurationVi(att.durationSeconds)}
                            </span>
                          )}
                          {att.timelinessStatus === 'late' ? (
                            <span className="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200">
                              Nộp muộn{att.lateByMinutes ? ` ${att.lateByMinutes}p` : ''}
                            </span>
                          ) : att.timelinessStatus === 'on_time' ? (
                            <span className="inline-block text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200">
                              Đúng hạn
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {showRowScores ? (
                          <>
                            <span className="font-bold text-[#0F172B] dark:text-zinc-100">{att.scores?.listening?.band ?? '-'}</span>
                            <span className="text-xs text-[#475569] dark:text-zinc-400 block font-normal">({att.scores?.listening?.raw || 0}/{att.scores?.listening?.total || 0} câu)</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Đang check</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {showRowScores ? (
                          <>
                            <span className="font-bold text-[#0F172B] dark:text-zinc-100">{att.scores?.reading?.band ?? '-'}</span>
                            <span className="text-xs text-[#475569] dark:text-zinc-400 block font-normal">({att.scores?.reading?.raw || 0}/{att.scores?.reading?.total || 0} câu)</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Đang check</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!showRowScores ? (
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Ms. Như đang check</span>
                        ) : att.singleSkill === 'speaking' ? (
                          <>
                            <span className="font-bold text-[#0F172B] dark:text-zinc-100">Spk {att.scores?.speaking?.band ?? '-'}</span>
                            <span className="text-xs text-[#475569] dark:text-zinc-400 block font-normal">Speaking</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-[#0F172B] dark:text-zinc-100">{att.scores?.writing?.overallBand ?? (att.testMode === 'single_skill' ? '-' : 'Chờ duyệt')}</span>
                            <span className="text-xs text-[#475569] dark:text-zinc-400 block font-normal">
                              T1: {att.scores?.writing?.task1Band ?? '-'} | T2: {att.scores?.writing?.task2Band ?? '-'}
                              {att.scores?.speaking?.band != null ? ` | S: ${att.scores.speaking.band}` : ''}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-black bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 ${showRowScores && typeof att.overallBand === 'number' ? 'text-base text-[#0F172B] dark:text-[#F4F4F5]' : 'text-xs text-amber-700 dark:text-amber-300'}`}>
                          {showRowScores ? (att.overallBand ?? 'Ms. Như đang check') : 'Ms. Như đang check'}
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
                            className="whitespace-nowrap inline-flex items-center justify-center bg-slate-100 dark:bg-zinc-800 hover:bg-[#0F766E] text-slate-700 dark:text-zinc-200 hover:text-white dark:hover:bg-[#0D9488] dark:hover:text-white border border-slate-200 dark:border-zinc-700 hover:border-[#0F766E] text-xs px-3.5 py-1.5 rounded-[6px] font-semibold transition"
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
            <div className="px-6 pb-3">
              <ListPaginationBar
                currentPage={profHistorySlice.safePage}
                totalItems={profHistorySlice.totalItems}
                pageSize={5}
                onPageChange={setProfileHistoryPage}
                itemLabel="lượt thi"
              />
            </div>
          </div>
          );
        })()}
      </div>

      {/* SECTION 3: NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN (Bảo mật riêng giữa GV & HS) */}
      {canSeeTeacherNotes && (
      <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
        <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0] dark:border-zinc-800 mb-4 gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
              Đánh Giá & Nhận Xét Của Giáo Viên Quản Nhiệm
            </h2>
            <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">Lời khuyên, phân tích điểm yếu và lộ trình rèn luyện cá nhân hóa.</p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-full font-semibold">
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
              className="w-full p-4 text-xs leading-relaxed bg-[#F8FAFC] dark:bg-zinc-900 text-[#0F172B] dark:text-zinc-100 border border-[#CBD5E1] dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-500 focus:outline-none font-sans"
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
          <div className="bg-[#F8FAFC] dark:bg-zinc-900 rounded-xl p-6 border border-[#E2E8F0] dark:border-zinc-800">
            <p className="text-xs text-[#334155] dark:text-zinc-200 leading-relaxed font-medium whitespace-pre-line">
              {teacherNotes[activeUsername] || 'Chưa có ghi chú nhận xét nào từ giáo viên. Hãy làm thêm các bài thi thử để giáo viên đánh giá năng lực.'}
            </p>
          </div>
        )}
      </div>
      )}
        </>
      )}

      {/* SECTION 4: THÀNH TÍCH CẢ 2 TỰA GAME ĐẤU TRƯỜNG (hidden for Guest accounts) */}
      {!currentUser?.isGuest && (() => {
        const stuKeyLower = String(student.username || '').toLowerCase();
        const practiceRows = (Array.isArray(gamePracticeLeaderboard) ? gamePracticeLeaderboard : []).filter(
          e => String(e?.username || '').toLowerCase() === stuKeyLower
        );
        const spacePracticeBest = practiceRows
          .filter(e => (e.gameType || 'space_shooter') === 'space_shooter')
          .reduce((mx, e) => Math.max(mx, Number(e.score) || 0), 0);
        const spaceBestTotal = Math.max(Number(playerGameRecord?.score) || 0, spacePracticeBest);
        const knightPracticeBest = practiceRows
          .filter(e => e.gameType === 'knight_rpg')
          .reduce((mx, e) => Math.max(mx, Number(e.score) || 0), 0);
        const rpgInfo = student.knightRpgProfile && typeof student.knightRpgProfile === 'object'
          ? student.knightRpgProfile
          : null;
        const knightBestTotal = Math.max(knightPracticeBest, Number(rpgInfo?.bestScore) || 0);
        const unlockedHeroCount = Array.isArray(rpgInfo?.unlockedSkins) ? rpgInfo.unlockedSkins.length : 1;
        const monstersSlainCount = Number(rpgInfo?.monstersSlain) || 0;
        const dragonsSlainCount = Number(rpgInfo?.dragonsSlain) || 0;

        return (
          <div className={`${profileCardCls} p-6 sm:p-8 mb-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                  Thành Tích Đấu Trường Game Từ Vựng (Phi Thuyền &amp; Hiệp Sĩ Diệt Rồng)
                </h2>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  Tổng hợp kỷ lục tuần ở cả 2 tựa game phản xạ từ vựng IELTS (reset điểm BXH 00:00 Thứ 2 hàng tuần).
                </p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-zinc-800">
              <div className="bg-transparent border-0 rounded-none py-3 sm:py-1 sm:pr-5">
                <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-bold uppercase">🚀 Phi Thuyền Từ Vựng</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#FAFAFA] font-mono mt-1">
                  {spaceBestTotal.toLocaleString('vi-VN')} pts
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  {playerGameRecord ? `${playerGameRecord.streak || 0}x Combo · ${playerGameRecord.status || '4 Vòng'}` : 'Luyện tập & Phòng đấu'}
                </p>
              </div>

              <div className="bg-transparent border-0 rounded-none py-3 sm:py-1 sm:px-5">
                <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-bold uppercase">⚔️ Hiệp Sĩ Diệt Rồng</p>
                <p className="text-2xl font-black text-[#0F172B] dark:text-[#FAFAFA] font-mono mt-1">
                  {knightBestTotal.toLocaleString('vi-VN')} pts
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  {rpgInfo ? `Hạ ${monstersSlainCount} quái · ${dragonsSlainCount} rồng` : 'Đấu Boss 4 Cửa Ải'}
                </p>
              </div>

              <div className="bg-transparent border-0 rounded-none py-3 sm:py-1 sm:px-5">
                <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-bold uppercase">🌠 Lượt Quay &amp; Tướng</p>
                <p className="text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA] mt-1">
                  {isSelf && rpgInfo ? `${rpgInfo.wishes || 0} Lượt Quay · ${unlockedHeroCount} Nhân Vật` : `Đã sở hữu ≥ ${unlockedHeroCount} Nhân Vật`}
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  {student.starterFirstGameGiftClaimed ? 'Đã nhận Quà Tân Thủ (+10 lượt)' : 'Chơi trận đầu nhận ngay +10 lượt quay'}
                </p>
              </div>

              <div className="bg-transparent border-0 rounded-none py-3 sm:py-1 sm:pl-5">
                <p className="text-xs text-[#475569] dark:text-[#A1A1AA] font-bold uppercase">🎫 Số Dư Lượt Học &amp; Phòng</p>
                <p className="text-lg font-extrabold text-[#0F172B] dark:text-[#FAFAFA] mt-1">
                  {studentRealExamCredits} Lượt Đề · {Number(student.roomCreateCredits) || 0} Vé Phòng
                </p>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  Đã tích lũy {studentPurchasedCount} đề Thực Chiến
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 5: NHẬT KÝ NẠP TIỀN & ĐỔI LƯỢT CÁ NHÂN (chỉ chính chủ hoặc SuperAdmin được xem) */}
      {(isSelf || isViewerSuperAdmin) && !isTargetSystemAdmin && (() => {
        const rawTxSource = isViewerSuperAdmin && !isSelf
          ? (Array.isArray(adminPaymentHistory) ? adminPaymentHistory : []).filter(
              tx => tx && String(tx.username || '').toLowerCase() === String(student.username || '').toLowerCase()
            )
          : (Array.isArray(myPaymentTransactions) ? myPaymentTransactions : []);
        const txSlice = paginateItems(rawTxSource, myTxPage, 5);

        return (
          <div className={`${profileCardCls} p-6 sm:p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E2E8F0] dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
                  Nhật Ký Giao Dịch, Nạp Gói &amp; Đổi Lượt Cá Nhân
                </h2>
                <p className="text-xs text-[#475569] dark:text-zinc-400 mt-0.5">
                  Bảo mật riêng tư: Chỉ {isSelf ? 'bạn' : 'Quản trị hệ thống'} mới nhìn thấy lịch sử nạp gói và biến động lượt của tài khoản này.
                </p>
              </div>
              <span className="text-xs font-bold text-[#475569] dark:text-zinc-400">
                Tổng cộng: {rawTxSource.length} giao dịch
              </span>
            </div>

            {rawTxSource.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#475569] dark:text-zinc-400">
                Chưa phát sinh giao dịch nạp gói hoặc đổi lượt Combo nào.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#334155] dark:text-zinc-300">
                    <thead className="bg-[#F8FAFC] dark:bg-zinc-900 border-y border-[#E2E8F0] dark:border-zinc-800 uppercase">
                      <tr>
                        <th className="px-4 py-3">Thời Gian</th>
                        <th className="px-4 py-3">Nội Dung / Mã Tham Chiếu</th>
                        <th className="px-4 py-3 text-right">Số Tiền</th>
                        <th className="px-4 py-3 text-center">Biến Động Số Dư</th>
                        <th className="px-4 py-3 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-zinc-800">
                      {txSlice.pageItems.map(tx => {
                        const tsMs = Number(tx.paidAt || tx.createdAt) || 0;
                        const timeStr = tsMs ? new Date(tsMs).toLocaleString('vi-VN') : '-';
                        const isPaid = tx.status === 'paid';
                        const bBefore = tx.balanceBefore;
                        const bAfter = tx.balanceAfter;
                        let balanceDeltaLabel = '—';
                        if (bBefore && bAfter) {
                          if (bBefore.realExamCredits !== bAfter.realExamCredits) {
                            balanceDeltaLabel = `Lượt Đề: ${bBefore.realExamCredits} → ${bAfter.realExamCredits}`;
                          } else if (bBefore.gachaWishCredits !== bAfter.gachaWishCredits) {
                            balanceDeltaLabel = `Gacha: ${bBefore.gachaWishCredits} → ${bAfter.gachaWishCredits}`;
                          } else if (bBefore.roomCreateCredits !== bAfter.roomCreateCredits) {
                            balanceDeltaLabel = `Vé Phòng: ${bBefore.roomCreateCredits} → ${bAfter.roomCreateCredits}`;
                          } else if (!bBefore.aieoVipActive && bAfter.aieoVipActive) {
                            balanceDeltaLabel = 'Mở Gói IELTS VIP';
                          } else if (!bBefore.customCoverActive && bAfter.customCoverActive) {
                            balanceDeltaLabel = 'Mở Ảnh Bìa Riêng';
                          }
                        }
                        return (
                          <tr key={tx.id} className="hover:bg-[#F8FAFC] dark:hover:bg-zinc-800/40">
                            <td className="px-4 py-3 whitespace-nowrap font-medium">{timeStr}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-[#0F172B] dark:text-[#F4F4F5]">{tx.itemLabel || tx.itemType}</p>
                              {tx.orderCode && (
                                <span className="text-[11px] font-mono text-[#475569] dark:text-zinc-400">
                                  Mã: {tx.orderCode}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                              {Number(tx.amount) > 0 ? formatVndCurrency(tx.amount) : '0đ (Đổi lượt)'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[#0F766E] dark:text-teal-400">
                              {balanceDeltaLabel}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {isPaid ? 'Thành công' : 'Chờ đối soát'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <ListPaginationBar
                  currentPage={txSlice.safePage}
                  totalItems={txSlice.totalItems}
                  pageSize={5}
                  onPageChange={setMyTxPage}
                  itemLabel="giao dịch"
                />
              </div>
            )}
          </div>
        );
      })()}
      </div>

      {/* Modal: Bảng Danh Hiệu & Cách Đạt Được (Học viên, Giáo viên & Quản trị) */}
      {showTitlesModal && titleSummary && (() => {
        const allTitleItems = titleSummary.itemsWithProgress || [];
        const easyCount = allTitleItems.filter(i => i.difficulty === 'Dễ' || i.difficulty === 'Khởi Đầu' || i.difficulty === 'Cơ Bản').length;
        const normalCount = allTitleItems.filter(i => i.difficulty === 'Bình Thường' || i.difficulty === 'Thử Thách').length;
        const hardTitleCount = allTitleItems.filter(i => i.difficulty === 'Khó').length;
        const extremeTitleCount = allTitleItems.filter(i => i.difficulty === 'Cực Khó').length;
        const dailyRankCount = allTitleItems.filter(i => i.isDailyRankTitle || i.difficulty === 'Theo Ngày').length;
        const checkinTitleCount = allTitleItems.filter(i => i.difficulty === 'Điểm Danh').length;
        const secretTitleCount = allTitleItems.filter(i => i.isSecretTitle || i.difficulty === 'Bí Ẩn').length;
        const holidayTitleCount = allTitleItems.filter(i => i.isHolidayTitle).length;
        const vipTitleCount = allTitleItems.filter(i => i.isPaidTitle || i.isVipBundleTitle).length;
        const gameAndRpgTitleCount = allTitleItems.filter(i => i.tier === 'Game' || i.tier === 'Hiệp Sĩ RPG').length;
        const pvpTitleCount = allTitleItems.filter(i => i.tier === 'Đối Kháng 1v1').length;
        const filteredTitles = allTitleItems.filter(item => {
          if (titleFilter === 'unlocked') return item.unlocked;
          if (titleFilter === 'locked') return !item.unlocked;
          if (titleFilter === 'game_rpg') return item.tier === 'Game' || item.tier === 'Hiệp Sĩ RPG';
          if (titleFilter === 'pvp_1v1') return item.tier === 'Đối Kháng 1v1';
          if (titleFilter === 'easy') return item.difficulty === 'Dễ' || item.difficulty === 'Khởi Đầu' || item.difficulty === 'Cơ Bản';
          if (titleFilter === 'normal') return item.difficulty === 'Bình Thường' || item.difficulty === 'Thử Thách';
          if (titleFilter === 'hard') return item.difficulty === 'Khó';
          if (titleFilter === 'extreme') return item.difficulty === 'Cực Khó';
          if (titleFilter === 'daily_rank') return item.isDailyRankTitle || item.difficulty === 'Theo Ngày';
          if (titleFilter === 'checkin') return item.difficulty === 'Điểm Danh';
          if (titleFilter === 'secret') return item.isSecretTitle || item.difficulty === 'Bí Ẩn';
          if (titleFilter === 'holiday') return item.isHolidayTitle;
          if (titleFilter === 'vip') return item.isPaidTitle || item.isVipBundleTitle;
          return true;
        });
        const diffBadgeCls = (diff) => {
          if (diff === 'VIP Độc Quyền') return 'bg-[#991B1B] text-[#F4F4F5] border-[#EF4444] font-semibold';
          if (diff === 'Độc Quyền') return 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700';
          if (diff === 'Phú Quý') return 'bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold';
          if (diff === 'Theo Ngày') return 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/70 font-bold';
          if (diff === 'Bí Ẩn') return 'bg-zinc-900 text-amber-200 border-amber-500/70 dark:bg-zinc-800 dark:text-amber-200 dark:border-amber-500/70';
          if (diff === 'Lễ Hội') return 'bg-pink-100 text-rose-800 border-rose-300 dark:bg-pink-950/60 dark:text-rose-200 dark:border-rose-700';
          if (diff === 'Điểm Danh') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700';
          if (diff === 'Cực Khó') return 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-600 font-bold';
          if (diff === 'Khó') return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700';
          if (diff === 'Bình Thường' || diff === 'Thử Thách') return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700';
          if (diff === 'Dễ' || diff === 'Cơ Bản' || diff === 'Khởi Đầu') return 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/60 dark:text-lime-200 dark:border-lime-700';
          return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';
        };

        return (
        <div
          className="apple-backdrop-enter fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          onClick={() => setShowTitlesModal(false)}
        >
          <div
            className="apple-modal-sheet bg-white dark:bg-[#18181B] rounded-2xl max-w-3xl w-full max-h-[90dvh] flex flex-col border border-[#E2E8F0] dark:border-zinc-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 px-6 py-4 bg-zinc-900 text-white border-b border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Bảng Danh Hiệu - {student.name}
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {titleSummary.autoUnlockedAll && isViewerSuperAdmin
                    ? 'Đặc quyền Quản trị Hệ thống: Tự động mở khóa 100% tất cả danh hiệu hiện tại và mọi danh hiệu mới trong tương lai!'
                    : isTargetSystemAdmin
                    ? 'Bộ sưu tập danh hiệu & cột mốc thành tựu trên hệ thống.'
                    : isTargetTeacher
                    ? 'Giảng viên & Học viên đều có thể cày mở khóa, trang bị hoặc bật/tắt Danh Hiệu trên hồ sơ và Đấu Trường.'
                    : 'Chinh phục cột mốc điểm IELTS, Daily Zone, Top BXH Theo Ngày, Game & thử thách bí ẩn để mở khóa toàn bộ!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTitlesModal(false)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Metrics Summary + Visibility Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800">
                {isTargetSystemAdmin && !isViewerSuperAdmin ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
                    <ShieldAlert className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0" />
                    <span>Hồ sơ Quản Trị Hệ Thống · Đang trưng bày bộ sưu tập danh hiệu.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                    <span>📝 Tổng bài: <b className="text-slate-900 dark:text-[#F4F4F5]">{titleSummary.stats?.examCount || 0}</b></span>
                    <span>☀️ Daily Zone: <b className="text-teal-700 dark:text-teal-300">{titleSummary.stats?.dailyZoneCount || 0} bài</b></span>
                    <span>🎯 Band cao nhất: <b className="text-[#0F172B] dark:text-[#F4F4F5]">{titleSummary.stats?.highestBand ? titleSummary.stats.highestBand.toFixed(1) : '0.0'}</b></span>
                    <span>✨ Lượt 7.0+: <b className="text-amber-700 dark:text-amber-300">{titleSummary.stats?.band70Count || 0} lần</b></span>
                    <span>🎮 Game kỷ lục: <b className="text-amber-700 dark:text-amber-300">{titleSummary.stats?.bestGameScore || 0}đ</b></span>
                    <span>⚔️ Đối kháng 1v1: <b className="text-rose-700 dark:text-rose-300">{titleSummary.stats?.pvpPeakRp || 0} Điểm</b> ({titleSummary.stats?.pvpWins || 0} thắng)</span>
                    <span>📅 Đăng nhập: <b className="text-slate-900 dark:text-[#F4F4F5]">{titleSummary.stats?.totalLoginDays || 0}N</b> (Chuỗi {titleSummary.stats?.bestLoginStreak || 0}N)</span>
                    <span>🌟 Kỹ năng: <b className="text-slate-900 dark:text-[#F4F4F5]">{titleSummary.stats?.coveredSkillsCount || 0}/4</b></span>
                  </div>
                )}

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
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700'
                    }`}
                  >
                    {student.showTitleBadge !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {student.showTitleBadge !== false ? 'Đang HIỆN danh hiệu (Bấm để tắt)' : 'Đang ẨN danh hiệu (Bấm để bật)'}
                  </button>
                )}
              </div>

              {/* Filter Tabs — Tách riêng rõ Game & RPG, Đối Kháng 1v1, Dễ, Bình Thường, Khó, Cực Khó, BXH Theo Ngày... */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Tất cả (${allTitleItems.length})` },
                  { id: 'pvp_1v1', label: `⚔️ Đối Kháng 1v1 (${pvpTitleCount})` },
                  { id: 'game_rpg', label: `🎮 Game & Meme RPG (${gameAndRpgTitleCount})` },
                  { id: 'easy', label: `🌱 Dễ (${easyCount})` },
                  { id: 'normal', label: `⚡ Bình Thường (${normalCount})` },
                  { id: 'hard', label: `🔥 Khó (${hardTitleCount})` },
                  { id: 'extreme', label: `👑 Cực Khó (${extremeTitleCount})` },
                  { id: 'daily_rank', label: `🏅 BXH Theo Ngày (${dailyRankCount})` },
                  { id: 'checkin', label: `📅 Điểm Danh (${checkinTitleCount})` },
                  { id: 'secret', label: `❓ Bí Ẩn (${secretTitleCount})` },
                  { id: 'holiday', label: `🎉 Ngày Lễ (${holidayTitleCount})` },
                  { id: 'vip', label: `💎 Donate & VIP (${vipTitleCount})` },
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
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {titleFilter === 'daily_rank' && (
                <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-600/50 text-xs text-amber-950 dark:text-amber-100 leading-relaxed space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0" />
                    <span>Luật Danh Hiệu BXH Theo Ngày (Hiệu lực 1 ngày · Độc quyền không trùng lặp)</span>
                  </p>
                  <p className="text-amber-900/90 dark:text-amber-200/90">
                    Top 1 · Top 2 · Top 3 từng phần (<b>Tổng 4 KN, Reading, Listening, Writing, Speaking, Game</b>) được chốt trực tiếp theo thành tích <b>trong ngày hôm nay</b> (hết hiệu lực lúc <b>23:59</b> giờ VN). Mỗi hạng chỉ cấp cho <b>duy nhất 1 học viên</b> và mỗi học viên chỉ nhận <b>tối đa 1 danh hiệu BXH cao nhất/ngày</b> — tuyệt đối không trùng lặp.
                  </p>
                </div>
              )}

              {filteredTitles.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#475569] dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  Không có danh hiệu nào trong nhóm lọc này.
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredTitles.map(item => {
                  const isEquipped = titleSummary.title?.id === item.id;
                  const viewerCanSeeSecret = Boolean(
                    isViewerSuperAdmin ||
                    (viewerUnlockedTitleIdSet && viewerUnlockedTitleIdSet.has(item.id))
                  );
                  const maskSecret = Boolean(item.isSecretTitle && !viewerCanSeeSecret);
                  const isLuxuryVipCard = Boolean(item.isPaidTitle || item.isVipBundleTitle);
                  const isDailyCard = Boolean(item.isDailyRankTitle);
                  const safeProgressText = maskSecret
                    ? (item.unlocked ? 'Đã khai mở (Ẩn bí mật)' : '??? (Thử thách ẩn)')
                    : item.progressText;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                        isLuxuryVipCard
                          ? isEquipped
                            ? 'bg-amber-50/70 dark:bg-zinc-800 border-amber-500'
                            : 'bg-[#F8FAFC] dark:bg-zinc-900 border-amber-400/70 dark:border-amber-600/60'
                          : isDailyCard
                          ? item.unlocked
                            ? 'bg-amber-50/85 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500/70'
                            : 'bg-slate-50/85 dark:bg-zinc-900/80 border-amber-200/70 dark:border-zinc-800 opacity-95'
                          : item.unlocked
                          ? isEquipped
                            ? 'bg-[#EDFFFD]/90 dark:bg-zinc-800 border-[#007A7A] dark:border-zinc-500'
                            : 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-zinc-700'
                          : 'bg-slate-50/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 opacity-90'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-xl shrink-0">
                              {maskSecret ? '❓' : item.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-[#475569] dark:text-zinc-400">
                                  {maskSecret ? 'Bí Ẩn' : item.tier}
                                </span>
                                <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full border ${diffBadgeCls(item.difficulty)}`}>
                                  {item.difficulty}
                                </span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F4F4F5] truncate">
                                {maskSecret ? 'Danh Hiệu Bí Ẩn (???)' : item.label}
                              </h3>
                            </div>
                          </div>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                            item.unlocked
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
                              : 'bg-slate-100 dark:bg-zinc-800 text-[#475569] dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}>
                            {item.unlocked ? (maskSecret ? 'Bí ẩn' : 'Đã đạt') : maskSecret ? 'Bí ẩn' : 'Chưa mở'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                          <b>Cách đạt được:</b>{' '}
                          {maskSecret
                            ? 'Thử thách ẩn — Hãy luyện tập chăm chỉ và bứt phá kỷ lục bất ngờ để tự mình khai mở bí mật này!'
                            : item.conditionText}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-[#475569] dark:text-zinc-400 mb-1 gap-2">
                            <span className="shrink-0">Tiến độ</span>
                            <span className={`text-right truncate ${item.unlocked ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                              {safeProgressText}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.unlocked ? 'bg-emerald-500' : 'bg-[#007A7A] dark:bg-zinc-400'
                              }`}
                              style={{ width: `${maskSecret && !item.unlocked ? 0 : item.progressPct}%` }}
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
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-200 cursor-default'
                                : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
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
                        {isSelf && item.unlocked && item.isPaidTitle && !item.isPermanentDonateTitle && item.unlockedByPurchase && item.expiresAt > 0 && (
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
                            className="w-full py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
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
                                itemLabel: item.isPermanentDonateTitle
                                  ? `${item.icon} ${item.label} (Donate Vĩnh Viễn)`
                                  : `${item.icon} ${item.label} (1 Tháng)`,
                                itemPrice: item.priceVnd
                              });
                            }}
                            className="w-full py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {item.isPermanentDonateTitle
                              ? `Donate Mở Vĩnh Viễn (${formatVndCurrency(item.priceVnd)})`
                              : `Mua 1 Tháng (${formatVndCurrency(item.priceVnd)})`}
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
                                itemLabel: 'Gói IELTS VIP Full Quyền (1 Tháng)',
                                itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                              });
                            }}
                            className="w-full py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 bg-[#991B1B] hover:bg-[#B91C1C] text-[#F4F4F5]"
                          >
                            <Crown className="w-3.5 h-3.5" /> Đăng Ký Gói IELTS VIP ({aieoVipPriceLabel}/1 tháng)
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
                                  ? 'bg-amber-50 hover:bg-rose-50 dark:bg-amber-950/60 dark:hover:bg-rose-950/60 text-amber-800 hover:text-rose-700 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                  : 'bg-slate-100 hover:bg-amber-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 hover:text-amber-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
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
          className="apple-backdrop-enter fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          onClick={() => setShowCustomizeModal(false)}
        >
          <div
            className="apple-modal-sheet bg-white dark:bg-[#18181B] rounded-2xl max-w-2xl w-full max-h-[90dvh] flex flex-col border border-[#E2E8F0] dark:border-zinc-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 px-6 py-4 bg-[#F8FAFC] dark:bg-zinc-900 border-b border-[#E2E8F0] dark:border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172B] dark:text-[#F4F4F5] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-700 dark:text-zinc-200" /> Tùy Chỉnh Hồ Sơ Cá Nhân
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 max-w-2xl">
                  Cá nhân hóa hình nền Profile, khung viền Avatar và danh hiệu để mọi người trong lớp nhìn thấy phong cách riêng của bạn!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="p-2 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-[#0F172B] dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
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
                  (customDraft.profileCoverUrl.startsWith('data:image/') || customDraft.profileCoverUrl.startsWith('https://') || isSyncMediaUrl(customDraft.profileCoverUrl))
                );
                const previewUser = {
                  ...student,
                  avatarFrameId: canUseVipNameAndFrame ? customDraft.avatarFrameId : 'none',
                  ...(canUseVipNameAndFrame
                    ? {
                        vipRedNameEnabled: Boolean(customDraft.vipRedNameEnabled),
                        vipNameColor: customDraft.vipNameColor || 'crimson'
                      }
                    : {})
                };
                return (
                  <div
                    className={
                      vipVisual.showNeonCover
                        ? `vip-neon-frame rounded-2xl p-[3px] ${vipVisual.neonCoverMeta.frameWrapClass}`
                        : 'rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-zinc-800 bg-white dark:bg-[#18181B]'
                    }
                  >
                    <div
                      className={`relative h-24 w-full overflow-hidden ${
                        vipVisual.showNeonCover
                          ? 'rounded-t-[13px]'
                          : 'border-b border-[#E2E8F0] dark:border-zinc-800'
                      } ${
                        previewCoverOk ? 'bg-slate-100 dark:bg-zinc-900' : previewBanner.heroClass
                      }`}
                    >
                      {previewCoverOk && (
                        <img
                          src={customDraft.profileCoverUrl}
                          alt="Xem trước ảnh bìa"
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                      {vipVisual.showNeonCover && (
                        <>
                          <div
                            aria-hidden="true"
                            className={`vip-cover-led absolute inset-0 rounded-t-[13px] pointer-events-none ${vipVisual.neonCoverMeta.coverLedInnerClass}`}
                          />
                          <div className={`vip-neon-seam absolute bottom-0 inset-x-0 h-[3px] z-10 pointer-events-none ${vipVisual.neonCoverMeta.seamBarClass}`} />
                        </>
                      )}
                    </div>
                    <div className={`vip-profile-inner px-4 pb-3.5 pt-2 flex items-end gap-3 bg-white dark:bg-[#18181B] ${vipVisual.showNeonCover ? 'rounded-b-[13px]' : ''}`}>
                      <div className="-mt-8 relative z-20 shrink-0">
                        <div className="vip-avatar-collar p-1 rounded-full bg-white dark:bg-[#18181B] flex items-center justify-center">
                          <UserAvatarBadge user={previewUser} sizeClass="w-14 h-14" textClass="text-xl" rounded="rounded-full" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-[#475569] dark:text-zinc-400 font-bold">Xem trước trực tiếp</p>
                        <p className="text-sm font-extrabold text-[#0F172B] dark:text-[#F4F4F5] truncate">
                          <VipMemberName user={previewUser} fallbackName={student.name} badgeSize="xs" />
                        </p>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 truncate">{customDraft.studyGoal || 'Mục tiêu chinh phục IELTS!'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Preset Wallpaper Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
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
                            ? 'border-[#007A7A] bg-[#EDFFFD]/50 dark:bg-zinc-800 dark:border-zinc-400'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className={`h-9 rounded-xl ${b.previewClass} mb-2`} />
                        <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] truncate">{b.name}</p>
                        <p className="text-xs text-[#475569] dark:text-zinc-400 truncate">{b.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Wallpaper Image Upload or 5k Paywall */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Hoặc Tải Ảnh Hình Nền Riêng Từ Máy
                  </label>
                  {canUseCustomCover ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />{' '}
                      {isTargetTeacher || isTargetSystemAdmin ? 'Miễn phí Giáo viên / Admin' : 'Đã mở khóa Ảnh Nền Riêng'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-xs font-extrabold text-amber-800 dark:text-amber-200">
                      <Lock className="w-3 h-3" /> Giá mở khóa {unlockPriceLabel}
                    </span>
                  )}
                </div>

                {canUseCustomCover ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold cursor-pointer hover:opacity-90 transition">
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
                      {(customDraft.profileCoverUrl?.startsWith('data:image/') || isSyncMediaUrl(customDraft.profileCoverUrl)) && (
                        <button
                          type="button"
                          onClick={() => setCoverCropSource(customDraft.profileCoverUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-200/70 dark:hover:bg-zinc-700 transition"
                        >
                          <Crop className="w-3.5 h-3.5" /> Cắt lại ảnh nền
                        </button>
                      )}
                      {customDraft.profileCoverUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomDraft(prev => ({ ...prev, profileCoverUrl: '' }))}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-200 text-xs font-bold border border-rose-200 dark:border-rose-700"
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
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-100"
                    />
                  </>
                ) : (
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Mở khóa tải &amp; cắt ảnh nền riêng ({unlockPriceLabel})</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                        {paymentConfig?.autoVerifyEnabled
                          ? 'Bấm nút bên cạnh để hiện mã VietQR - chuyển khoản xong hệ thống tự động mở khóa sau vài giây.'
                          : 'Bấm nút bên cạnh để mở mã VietQR chuyển khoản nhanh (6 nền Gradient phía trên vẫn miễn phí).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalState({ itemType: 'cover', itemId: '', itemLabel: 'Ảnh Nền Riêng', itemPrice: normalizedPayCfg.coverUnlockPrice })}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Mở QR Thanh Toán ({unlockPriceLabel})
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar Frame Picker (VIP / Giáo viên / Admin) */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    2. Chọn Khung Viền Avatar ({canUseVipNameAndFrame ? 'Đã Mở Khóa VIP' : `Gói Tháng ${aieoVipPriceLabel}`})
                  </label>
                  {!canUseVipNameAndFrame && isSelf && (
                    <button
                      type="button"
                      onClick={() =>
                        setCheckoutModalState({
                          itemType: 'aieo_vip',
                          itemId: '',
                          itemLabel: 'Gói Tháng VIP (1 Tháng)',
                          itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold text-amber-800 dark:text-amber-200 hover:opacity-90"
                    >
                      <Crown className="w-3 h-3" /> Mở Khóa VIP ({aieoVipPriceLabel})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {AVATAR_FRAMES.map(frame => {
                    const active = (customDraft.avatarFrameId || 'none') === frame.id;
                    const frameAllowed = hasUnlockedAvatarFrame(student, frame.id);
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => {
                          if (!frameAllowed) {
                            if (isSelf) {
                              setCheckoutModalState({
                                itemType: 'aieo_vip',
                                itemId: '',
                                itemLabel: 'Gói Tháng VIP (1 Tháng)',
                                itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                              });
                            } else {
                              showToast?.('Khung viền Avatar yêu cầu Gói Tháng VIP.', 'info');
                            }
                            return;
                          }
                          setCustomDraft(prev => ({ ...prev, avatarFrameId: frame.id }));
                        }}
                        className={`relative p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                          !frameAllowed
                            ? 'border-amber-200 dark:border-amber-700/60 bg-amber-50/40 dark:bg-zinc-900 opacity-75'
                            : active
                            ? 'border-[#007A7A] bg-[#EDFFFD] dark:bg-zinc-800 dark:border-zinc-400'
                            : 'border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                        }`}
                      >
                        {!frameAllowed && frame.id !== 'none' && (
                          <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-[#991B1B] text-[10px] font-semibold text-[#F4F4F5]">
                            VIP
                          </span>
                        )}
                        <span className={`w-7 h-7 rounded-full ${frame.previewBg} ${frame.id !== 'none' ? frame.ringClass : ''}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate max-w-full">{frame.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VIP Name Color Picker inside Customize Modal */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    3. Chọn Màu Chữ Tên VIP ({canUseVipNameAndFrame ? 'Đã Mở Khóa' : `Gói Tháng ${aieoVipPriceLabel}`})
                  </label>
                  {canUseVipNameAndFrame ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCustomDraft(prev => ({ ...prev, vipRedNameEnabled: !prev.vipRedNameEnabled }))
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                        customDraft.vipRedNameEnabled
                          ? 'bg-[#F59E0B] text-[#09090B]'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {customDraft.vipRedNameEnabled ? 'ĐANG BẬT MÀU TÊN' : 'ĐANG TẮT MÀU TÊN'}
                    </button>
                  ) : isSelf ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCheckoutModalState({
                          itemType: 'aieo_vip',
                          itemId: '',
                          itemLabel: 'Gói Tháng VIP (1 Tháng)',
                          itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold text-amber-800 dark:text-amber-200"
                    >
                      <Lock className="w-3 h-3" /> Mở Khóa VIP ({aieoVipPriceLabel})
                    </button>
                  ) : null}
                </div>

                {canUseVipNameAndFrame ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex flex-wrap items-center gap-2.5">
                    {VIP_NAME_COLORS.map(preset => {
                      const selected =
                        Boolean(customDraft.vipRedNameEnabled) &&
                        (customDraft.vipNameColor || 'crimson') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          title={`Màu chữ: ${preset.label}`}
                          onClick={() =>
                            setCustomDraft(prev => ({
                              ...prev,
                              vipRedNameEnabled: true,
                              vipNameColor: preset.id
                            }))
                          }
                          className={`w-7 h-7 rounded-full transition flex items-center justify-center ${
                            selected
                              ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-zinc-900 scale-110'
                              : 'border border-white/80 dark:border-zinc-700 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: preset.swatch }}
                        >
                          {selected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer">
                      <input
                        type="color"
                        aria-label="Tự chọn màu chữ tên tùy ý"
                        value={
                          String(customDraft.vipNameColor || '').startsWith('#')
                            ? customDraft.vipNameColor
                            : (VIP_NAME_COLORS.find(c => c.id === customDraft.vipNameColor)?.swatch || '#E11D48')
                        }
                        onChange={e =>
                          setCustomDraft(prev => ({
                            ...prev,
                            vipRedNameEnabled: true,
                            vipNameColor: e.target.value
                          }))
                        }
                        className="w-4 h-4 rounded border-0 p-0 bg-transparent cursor-pointer"
                      />
                      <span>Tự chọn màu</span>
                    </label>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Đăng ký Gói Tháng ({aieoVipPriceLabel}/tháng) để tùy chọn màu chữ tên, khung viền Avatar, ảnh bìa và vào luyện tập Game 14 kho từ.
                  </p>
                )}
              </div>

              {/* Study Goal / Bio + Student Title Toggle */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    4. Khẩu Hiệu / Giới Thiệu Bản Thân
                  </label>
                  <input
                    type="text"
                    value={customDraft.studyGoal}
                    onChange={e => setCustomDraft(prev => ({ ...prev, studyGoal: e.target.value }))}
                    placeholder="VD: Quyết tâm Band 7.5 trước tháng 12!"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-[#F4F4F5]"
                  />
                </div>

                {!isTargetTeacher && !isTargetSystemAdmin && (
                  <>
                    <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 cursor-pointer">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5]">Hiển thị Danh Hiệu trước tên</p>
                        <p className="text-xs text-[#475569] dark:text-zinc-400">
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

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 space-y-2">
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-[#F4F4F5]">
                            Hiển thị chữ Hạng cạnh tên (Basic / Standard / Plus...)
                          </p>
                          <p className="text-xs text-[#475569] dark:text-zinc-400">
                            Hiện huy hiệu hạng theo số đề Thực Chiến đã nạp ngay cạnh tên bạn. Người khác bấm vào chữ hạng sẽ thấy bảng 10 mốc cách mở khóa.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(customDraft.showExamTierBadge)}
                          onChange={e => setCustomDraft(prev => ({ ...prev, showExamTierBadge: e.target.checked }))}
                          className="w-4 h-4 accent-[#007A7A]"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowExamTierGuideModal(true)}
                        className="text-xs font-bold text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Crown className="w-3.5 h-3.5" /> Xem bảng 10 hạng &amp; cách mở khóa →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingProfileTheme}
                onClick={async () => {
                  if (!handleUpdateUserProfileFields || isSavingProfileTheme) return;
                  setIsSavingProfileTheme(true);
                  const safeDraft = {
                    ...customDraft,
                    profileCoverUrl: canUseCustomCover ? customDraft.profileCoverUrl : '',
                    ...(canUseVipNameAndFrame
                      ? {
                          vipRedNameEnabled: Boolean(customDraft.vipRedNameEnabled),
                          vipNameColor: customDraft.vipNameColor || 'crimson',
                          vipEffectsCustomizedAt: Date.now()
                        }
                      : {
                          avatarFrameId: 'none'
                        })
                  };
                  if (!canUseVipNameAndFrame) {
                    delete safeDraft.vipRedNameEnabled;
                    delete safeDraft.vipNameColor;
                  }
                  await handleUpdateUserProfileFields(student.username, safeDraft);
                  setIsSavingProfileTheme(false);
                  setShowCustomizeModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition flex items-center gap-1.5"
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

      <ExamTierGuideModal
        isOpen={showExamTierGuideModal}
        user={student}
        isSelf={isSelf}
        onToggleVisibility={
          isSelf && handleUpdateUserProfileFields
            ? nextVisible => {
                handleUpdateUserProfileFields(student.username, {
                  showExamTierBadge: Boolean(nextVisible),
                  customToast: nextVisible
                    ? 'Đã BẬT hiển thị chữ Hạng cạnh tên!'
                    : 'Đã ẨN chữ Hạng cạnh tên.'
                });
              }
            : null
        }
        onClose={() => setShowExamTierGuideModal(false)}
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
