import { useState, useEffect, useRef } from 'react';
import { normalizeBrandTeacherUser } from './constants/brandInfo';
import {
  AIEO_VIP_PRICE_VND,
  DEFAULT_EXAM_PRICE_VND,
  FRIEND_ROOM_TICKET_PRICE_VND,
  canCreateFriendRoomNow,
  evaluateTitleUnlockNotification,
  getFriendRoomTicketCredits,
  getRealExamCredits,
  getTestPurchasePriceVnd,
  hasActiveAieoVip,
  hasTestPurchaseAccess,
  hasVipFriendRoomAccess,
  isAnimatedDataUrl,
  normalizePaymentConfig,
  normalizeVipNameColor,
  normalizeVipNeonCoverColor,
  resolveStudentTitleSummary
} from './constants/profileCustomization';
import {
  DEFAULT_VOCAB_TEXT,
  VOCAB_PRESETS,
  GAME_ROUND_TIME_LIMITS,
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_DURATIONS,
  canUserAccessTest,
  canViewerSeeMember,
  evaluateSpeakingDailyCompliance,
  getVietnamTodayDateKey,
  normalizeExamConfig,
  evaluateTestSchedule,
  formatViDateTime,
  getReadingPassages,
  getListeningTracks,
  createEmptyTestForm,
  createEmptySingleSkillTestForm,
  createDefaultSpeakingSection,
  normalizeSpeakingSection,
  DEFAULT_TESTS,
  DEFAULT_ATTEMPTS,
  DEFAULT_USERS,
  DEFAULT_ROOMS,
  DEFAULT_TEACHER_NOTES
} from './constants/seedData';
import { drawAnimalSpaceshipCanvas } from './utils/animalRenderer';
import {
  calculateAutoBand,
  calculateOverallIeltsBand,
  calculateWritingBand,
  getWordCount,
  roundIeltsBand,
  roundDownIeltsHalfBand,
  roundWholeBand,
  createUniqueAttemptId,
  getSpeedAdjustedTimeLimit,
  isObjectiveAnswerCorrect,
  buildRoomInviteLink,
  parseBulkStudentsText,
  parseRawVocabText,
  normalizeRoomObject,
  pruneExpiredRoomChat,
  buildSeededRoundQueues,
  buildPracticeRoundQueues,
  buildDefaultQuestionFields,
  getActiveTeamIds,
  pickBalancedTeamId
} from './utils/examHelpers';
import {
  testGeminiApiConnection,
  callGeminiWritingGrader,
  simulateAIWritingGrading
} from './utils/geminiGrader';
import { requestAiSpeakingGrading, requestAiWritingGrading, uploadSpeakingRecording, verifyExamRoomPassword } from './utils/speakingApi';
import { KeyRound, Lock, X } from 'lucide-react';
import { roundSpeakingBand } from './utils/speakingAiEngine';
import { speakWord, playSound } from './utils/mediaHelpers';
import { syncClozeBlanksWithQuestions } from './utils/clozeHelpers';
import {
  buildInitialExamState,
  loadExamDraft,
  saveExamDraft,
  clearExamDraft,
  loadNavSession,
  saveNavSession,
  clearNavSession,
  loadBuilderDraft,
  saveBuilderDraft,
  clearBuilderDraft
} from './utils/sessionPersistence';
import { useExamAntiCheat } from './hooks/useExamAntiCheat';
import Navbar from './components/common/Navbar';
import GlobalModals from './components/modals/GlobalModals';
import AccountSecurityModal from './components/modals/AccountSecurityModal';
import MailConfigModal from './components/modals/MailConfigModal';
import PaymentConfigModal from './components/modals/PaymentConfigModal';
import AdminTitleManagerModal from './components/modals/AdminTitleManagerModal';
import TitleUnlockedCelebrationModal from './components/modals/TitleUnlockedCelebrationModal';
import CoverCheckoutModal from './components/modals/CoverCheckoutModal';
import VipPromoPopupModal from './components/modals/VipPromoPopupModal';
import AuthScreen from './pages/AuthScreen';
import StudentHome from './pages/StudentHome';
import SkillPracticeHub from './pages/SkillPracticeHub';
import SpeakingExamRoom from './pages/SpeakingExamRoom';
import ExamMode from './pages/ExamMode';
import ResultView from './pages/ResultView';
import StudentProfile from './pages/StudentProfile';
import TeacherDashboard from './pages/TeacherDashboard';
import GameArena from './pages/GameArena';
import ExamBuilder from './pages/ExamBuilder';

const REMEMBERED_LOGINS_KEY = 'ielts_remembered_logins_v1';
const REMEMBER_PREF_KEY = 'ielts_remember_password_pref_v1';

const loadRememberedLogins = () => {
  try {
    const raw = localStorage.getItem(REMEMBERED_LOGINS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && typeof item.username === 'string' && item.username.trim() && typeof item.password === 'string' && item.password)
      .slice(0, 5);
  } catch {
    return [];
  }
};

const persistRememberedLogins = (list) => {
  try {
    localStorage.setItem(REMEMBERED_LOGINS_KEY, JSON.stringify((Array.isArray(list) ? list : []).slice(0, 5)));
  } catch {}
};

const SEEN_TITLES_PREFIX = 'ielts_seen_titles_v1_';

const loadLocalSeenTitles = (username) => {
  const uname = String(username || '').trim().toLowerCase();
  if (!uname) return { hasBaseline: false, ids: [] };
  try {
    const raw = localStorage.getItem(`${SEEN_TITLES_PREFIX}${uname}`);
    if (!raw) return { hasBaseline: false, ids: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { hasBaseline: false, ids: [] };
    return { hasBaseline: true, ids: parsed.map(x => String(x || '').trim()).filter(Boolean) };
  } catch {
    return { hasBaseline: false, ids: [] };
  }
};

const persistLocalSeenTitles = (username, ids) => {
  const uname = String(username || '').trim().toLowerCase();
  if (!uname) return;
  try {
    const clean = Array.from(new Set((Array.isArray(ids) ? ids : []).map(x => String(x || '').trim()).filter(Boolean))).slice(0, 60);
    localStorage.setItem(`${SEEN_TITLES_PREFIX}${uname}`, JSON.stringify(clean));
  } catch {}
};

// ==========================================
// 2. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Accounts Database (LocalStorage initialized)
  const [usersDb, setUsersDb] = useState(() => {
    const saved = localStorage.getItem('ielts_users_db_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const normalized = Object.fromEntries(
            Object.entries(parsed).map(([k, v]) => [k, normalizeBrandTeacherUser(v)])
          );
          const hasTeacher = Object.values(normalized).some(u => u?.role === 'teacher');
          return hasTeacher ? normalized : { teacher_ielts: DEFAULT_USERS.teacher_ielts, ...normalized };
        }
      } catch (_e) {}
    }
    localStorage.setItem('ielts_users_db_v2', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  // Current Logged-in User (NULL = Must Login First)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ielts_current_user');
    if (saved) {
      try { return normalizeBrandTeacherUser(JSON.parse(saved)); } catch (_e) {}
    }
    return null; // Forces login screen
  });

  // Tests & Attempts states (loaded before navigation/exam draft restoration)
  const [tests, setTests] = useState(() => {
    const taggedDefaults = DEFAULT_TESTS.filter(d => Boolean(d.seedTag));
    let injectedTags = [];
    try {
      const rawTags = localStorage.getItem('ielts_seed_tags_v1');
      injectedTags = rawTags ? JSON.parse(rawTags) : [];
      if (!Array.isArray(injectedTags)) injectedTags = [];
    } catch (_e) {
      injectedTags = [];
    }

    const markAllTagged = () => {
      try {
        const nextTags = Array.from(new Set([...injectedTags, ...taggedDefaults.map(d => d.seedTag)]));
        localStorage.setItem('ielts_seed_tags_v1', JSON.stringify(nextTags));
      } catch (_e) {}
    };

    const saved = localStorage.getItem('ielts_tests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalizedSaved = parsed.map(t => {
            const def = DEFAULT_TESTS.find(d => d.id === t.id);
            return {
              ...t,
              allowViewAnswers: t.allowViewAnswers ?? false,
              writing: {
                task1: { ...t.writing?.task1, modelAnswer: t.writing?.task1?.modelAnswer || def?.writing?.task1?.modelAnswer || '' },
                task2: { ...t.writing?.task2, modelAnswer: t.writing?.task2?.modelAnswer || def?.writing?.task2?.modelAnswer || '' }
              }
            };
          });
          const existingIds = new Set(normalizedSaved.map(t => t.id));
          const pendingNewSeeds = taggedDefaults.filter(
            d => !injectedTags.includes(d.seedTag) && !existingIds.has(d.id)
          );
          markAllTagged();
          return pendingNewSeeds.length > 0 ? [...normalizedSaved, ...pendingNewSeeds] : normalizedSaved;
        }
      } catch (_e) {}
    }
    markAllTagged();
    return DEFAULT_TESTS;
  });

  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('ielts_attempts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(a => a.id));
          const missingDefaults = DEFAULT_ATTEMPTS.filter(a => !existingIds.has(a.id));
          return [...parsed, ...missingDefaults];
        }
      } catch (_e) {}
    }
    return DEFAULT_ATTEMPTS;
  });

  // Room PIN Database for Game Arena (Among Us Lobby + Leaderboard)
  const [roomsDb, setRoomsDb] = useState(() => {
    const saved = localStorage.getItem('ielts_rooms_db_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const normalized = {};
          Object.entries(parsed).forEach(([k, v]) => {
            normalized[k] = normalizeRoomObject(v, k);
          });
          if (Object.keys(normalized).length > 0) return normalized;
        }
      } catch (_e) {}
    }
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS;
  });

  // Restore exact active page & session state across F5 / tab reload / lag recovery
  const [initialSession] = useState(() => {
    const nav = loadNavSession(currentUser);
    const builderDraft = nav.view === 'EXAM_BUILDER' ? loadBuilderDraft(currentUser?.username) : null;
    return { nav, builderDraft };
  });
  const initialNav = initialSession.nav;
  const initialBuilderDraft = initialSession.builderDraft;

  const [currentRoomPin, setCurrentRoomPin] = useState(() => initialNav.currentRoomPin || '686868');
  const [joinedRoomPin, setJoinedRoomPin] = useState(() => initialNav.joinedRoomPin || null);
  const [roomJoinForm, setRoomJoinForm] = useState(() => {
    const pinFromUrl = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('pin') || '') : '';
    return { pin: pinFromUrl.trim(), pass: '' };
  });
  const [roomJoinError, setRoomJoinError] = useState('');
  const [myCrewColor, setMyCrewColor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ielts_game_pilot_prefs') || '{}').colorId || 'cyan';
    } catch {
      return 'cyan';
    }
  });
  const [myAnimalId, setMyAnimalId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ielts_game_pilot_prefs') || '{}').animalId || 'cat';
    } catch {
      return 'cat';
    }
  });
  const [myAccessoryId, setMyAccessoryId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ielts_game_pilot_prefs') || '{}').accessoryId || 'crown';
    } catch {
      return 'crown';
    }
  });
  const avatarImageRef = useRef(null);
  const [lobbyCountdown, setLobbyCountdown] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ pin: '', pass: 'ielts', name: 'Phòng Đấu Từ Vựng Mới', roundSize: 4, speedMode: 'normal', shufflePerPlayer: false, topicPreset: 'core', maxPlayers: 4, teamCount: 2 });
  const [hostRoomDraft, setHostRoomDraft] = useState({ pin: '686868', name: 'Phòng Từ Vựng Academic IELTS #1', pass: 'ielts', roundSize: 4, speedMode: 'normal', shufflePerPlayer: false, maxPlayers: 30, teamCount: 0 });
  const [globalCheckoutState, setGlobalCheckoutState] = useState(null);
  const [showVipPromoModal, setShowVipPromoModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [classesDb, setClassesDb] = useState({});
  const [customTitles, setCustomTitles] = useState([]);
  const [speakingUnlockTokens, setSpeakingUnlockTokens] = useState(() => {
    try {
      const raw = sessionStorage.getItem('ielts_speaking_unlock_tokens_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [examUnlockTokens, setExamUnlockTokens] = useState(() => {
    try {
      const raw = sessionStorage.getItem('ielts_exam_unlock_tokens_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem('ielts_speaking_unlock_tokens_v1', JSON.stringify(speakingUnlockTokens || {}));
    } catch {}
  }, [speakingUnlockTokens]);
  useEffect(() => {
    try {
      sessionStorage.setItem('ielts_exam_unlock_tokens_v1', JSON.stringify(examUnlockTokens || {}));
    } catch {}
  }, [examUnlockTokens]);
  const [examPasswordModal, setExamPasswordModal] = useState(null);
  const [adminTitleModalState, setAdminTitleModalState] = useState({ isOpen: false, targetUsername: null });
  const [focusedTestId, setFocusedTestId] = useState(null);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const serverClockOffsetMsRef = useRef(0);
  const seenNotifIdsRef = useRef(null);
  const serverBonusTotalRef = useRef(0);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const [lobbyNowTick, setLobbyNowTick] = useState(() => Date.now());
  const [serverSyncConnected, setServerSyncConnected] = useState(false);
  const [copiedRoomPin, setCopiedRoomPin] = useState(false);
  const [apiTestState, setApiTestState] = useState({ testing: false, ok: null, message: '', model: '' });
  const [showAuthPass, setShowAuthPass] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [accountSecurityTab, setAccountSecurityTab] = useState(null); // null | 'password' | 'email'
  const [showMailConfigModal, setShowMailConfigModal] = useState(false);
  const [mailConfigured, setMailConfigured] = useState(false);
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [gamePracticeLeaderboard, setGamePracticeLeaderboard] = useState([]);
  const [syncHydrated, setSyncHydrated] = useState(false);
  const [localSeenTitlesMap, setLocalSeenTitlesMap] = useState(() => {
    try {
      const rawUser = localStorage.getItem('ielts_current_user');
      const parsed = rawUser ? JSON.parse(rawUser) : null;
      if (!parsed?.username) return {};
      const local = loadLocalSeenTitles(parsed.username);
      return local.hasBaseline ? { [parsed.username.toLowerCase()]: local.ids } : {};
    } catch {
      return {};
    }
  });
  const titleBaselinePersistedRef = useRef('');
  const [liveRankDeltas, setLiveRankDeltas] = useState({});
  const prevLiveRanksRef = useRef({});

  // App Navigation: 'AUTH', 'HOME', 'EXAM_MODE', 'RESULT_VIEW', 'TEACHER_DASHBOARD', 'EXAM_BUILDER', 'GAME_ARENA', 'STUDENT_PROFILE'
  const [view, setView] = useState(() => {
    if (initialNav.view === 'EXAM_BUILDER' && !initialBuilderDraft) {
      return 'TEACHER_DASHBOARD';
    }
    return initialNav.view;
  });

  const [selectedTestId, setSelectedTestId] = useState(() => initialNav.selectedTestId || null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(() => initialNav.selectedAttemptId || null);

  // Student Profile States
  const [selectedProfileStudent, setSelectedProfileStudent] = useState(() => initialNav.selectedProfileStudent || null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [previousView, setPreviousView] = useState(
    () => initialNav.previousView || (currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME')
  );
  const [resultReviewTab, setResultReviewTab] = useState(() => initialNav.resultReviewTab || 'listening'); // 'listening', 'reading', 'writing', 'speaking'
  const [skillHubTab, setSkillHubTab] = useState(() => initialNav.skillHubTab || 'speaking');
  const [speakingPartMode, setSpeakingPartMode] = useState(() => initialNav.speakingPartMode || 'full');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [supportAdminProfile, setSupportAdminProfile] = useState(null);
  const [adminFeedbacks, setAdminFeedbacks] = useState([]);
  const [teacherNotes, setTeacherNotes] = useState(() => {
    const saved = localStorage.getItem('ielts_teacher_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) {}
    }
    return DEFAULT_TEACHER_NOTES;
  });
  const [tempNoteText, setTempNoteText] = useState('');
  const [globalToast, setGlobalToast] = useState({ text: '', visible: false, type: 'success' });

  const showToast = (text, type = 'success') => {
    setGlobalToast({ text, visible: true, type });
    setTimeout(() => setGlobalToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Toggle permission for students to view correct answers (Teacher-controlled)
  const toggleTestAllowViewAnswers = (testId) => {
    if (!testId) return;
    setTests(prev => {
      const updated = prev.map(t => {
        if (t.id === testId) {
          const nextState = !t.allowViewAnswers;
          showToast(
            nextState
              ? `Đã MỞ KHÓA cho học sinh xem đáp án đúng đề "${t.title}"!`
              : `Đã KHÓA đáp án đúng đề "${t.title}" đối với học sinh!`,
            nextState ? 'success' : 'info'
          );
          return { ...t, allowViewAnswers: nextState };
        }
        return t;
      });
      return updated;
    });
    dispatchSyncAction('TOGGLE_TEST_ANSWERS', { testId });
  };

  // Teacher Action: Toggle Exam Visibility (public <-> private)
  const toggleTestVisibility = (testId) => {
    let nextVisibility = 'public';
    setTests(prev =>
      prev.map(t => {
        if (t.id === testId) {
          nextVisibility = (t.visibility || 'public') === 'private' ? 'public' : 'private';
          return { ...t, visibility: nextVisibility };
        }
        return t;
      })
    );
    showToast(
      nextVisibility === 'private'
        ? 'Đã chuyển đề thi sang chế độ Ẩn (Chỉ mình giáo viên thấy).'
        : 'Đã công khai đề thi - Học viên có thể nhìn thấy & làm bài.'
    );
    dispatchSyncAction('TOGGLE_TEST_VISIBILITY', { testId });
  };

  // Shared helper to update quick exam settings on Teacher Dashboard and sync across browsers
  const updateTestQuickConfig = (testId, transformFn, toastMessage) => {
    let updatedTest = null;
    setTests(prev =>
      prev.map(t => {
        if (t.id !== testId) return t;
        updatedTest = transformFn(t);
        return updatedTest;
      })
    );
    if (updatedTest) {
      dispatchSyncAction('UPSERT_TEST', { test: updatedTest });
      if (toastMessage) showToast(toastMessage);
    }
  };

  // Teacher Action: Toggle Exam Mode (Thi thử nhiều lần <-> Thi thật 1 lần)
  const toggleTestExamMode = (testId) => {
    const target = tests.find(t => t.id === testId);
    if (!target) return;
    const cfg = normalizeExamConfig(target);
    const nextMaxAttempts = cfg.maxAttempts === 1 ? 0 : 1;
    const nextPurpose = nextMaxAttempts === 1 ? 'real_exam' : 'practice';
    updateTestQuickConfig(
      testId,
      t => {
        const prevTags = Array.isArray(t.hashtags) ? t.hashtags : [];
        const cleanedTags = prevTags.filter(
          tag => !['#thithật', '#luyệntậptựdo'].includes(String(tag || '').toLowerCase())
        );
        const nextTags =
          nextMaxAttempts === 1
            ? ['#ThiThật', ...cleanedTags]
            : ['#LuyệnTậpTựDo', ...cleanedTags];
        const isSpeaking = normalizeExamConfig(t).focusSkill === 'speaking';
        const spMeta = isSpeaking ? normalizeSpeakingSection(t.speaking) : null;
        return {
          ...t,
          maxAttempts: nextMaxAttempts,
          examPurpose: nextPurpose,
          hashtags: nextTags,
          ...(isSpeaking && spMeta
            ? {
                speaking: {
                  ...spMeta,
                  speakingTrack:
                    spMeta.speakingTrack === 'daily'
                      ? 'daily'
                      : nextMaxAttempts === 1
                      ? 'exam_room'
                      : 'standard',
                  hashtags: nextTags
                }
              }
            : {})
        };
      },
      nextMaxAttempts === 1
        ? `Đã bật THI THẬT cho "${target.title}" - Học sinh chỉ được làm 1 lần!`
        : `Đã bật THI THỬ cho "${target.title}" - Học sinh được làm nhiều lần để ôn thi!`
    );
  };

  // Teacher Action: Toggle Stealth Anti-Cheat (Đếm tab + Khóa chuột phải + Quét Extension)
  const toggleTestAntiCheat = (testId) => {
    const target = tests.find(t => t.id === testId);
    if (!target) return;
    const cfg = normalizeExamConfig(target);
    const nextEnabled = !cfg.antiCheatEnabled;
    updateTestQuickConfig(
      testId,
      t => ({ ...t, antiCheatEnabled: nextEnabled }),
      nextEnabled
        ? `Đã BẬT chống gian lận cho "${target.title}" (Đếm tab, khóa chuột phải & quét extension).`
        : `Đã TẮT chống gian lận cho "${target.title}" (Học sinh làm bài tự do).`
    );
  };

  // Teacher Action: Quick-update single skill duration (minutes) on Teacher Dashboard
  const updateTestQuickDuration = (testId, skill, minsValue) => {
    const cleanMins = Math.max(1, Math.min(180, Number(minsValue) || 1));
    const skillLabel = { listening: 'Listening', reading: 'Reading', writing: 'Writing' }[skill] || skill;
    updateTestQuickConfig(
      testId,
      t => {
        const cfg = normalizeExamConfig(t);
        return {
          ...t,
          sectionDurations: { ...cfg.durations, [skill]: cleanMins },
          sectionOrder: cfg.order,
          sequentialMode: cfg.sequentialMode
        };
      },
      `Đã lưu thời gian ${skillLabel}: ${cleanMins} phút!`
    );
  };

  // Teacher Action: Inline Quick-Rename test title on Teacher Dashboard
  const updateTestQuickTitle = (testId, nextTitle) => {
    const cleanTitle = String(nextTitle || '').trim();
    if (!cleanTitle) {
      showToast('Tên đề thi không được để trống!', 'error');
      return false;
    }
    updateTestQuickConfig(
      testId,
      t => ({ ...t, title: cleanTitle }),
      `Đã đổi tên đề thi thành "${cleanTitle}"!`
    );
    return true;
  };

  // Update User Target Band / Display Name / Goal / Role / Avatar (Teacher or Student)
  const handleUpdateUserProfileFields = async (username, patch) => {
    const targetUser =
      (username && usersDb[username]) ||
      (username && currentUser?.username === username ? currentUser : null) ||
      (username && supportAdminProfile?.username === username ? supportAdminProfile : null);
    if (!username || !targetUser) return;
    const nextRole =
      patch.role && currentUser?.role === 'teacher' && username !== currentUser?.username && !targetUser.isSuperAdmin
        ? (patch.role === 'teacher' ? 'teacher' : 'student')
        : targetUser.role;
    const cleanBand =
      nextRole === 'teacher'
        ? 9.0
        : patch.targetBand !== undefined
          ? Math.min(9.0, Math.max(4.0, Math.round((Number(patch.targetBand) || 7.0) * 2) / 2))
          : targetUser.targetBand;
    const nextAvatar = patch.avatarUrl !== undefined ? (patch.avatarUrl || '') : targetUser.avatarUrl;
    const mergedAckIds = Array.isArray(patch.acknowledgedTitleIds)
      ? Array.from(new Set([...(Array.isArray(targetUser.acknowledgedTitleIds) ? targetUser.acknowledgedTitleIds : []), ...patch.acknowledgedTitleIds]))
      : targetUser.acknowledgedTitleIds;
    const updatedUser = {
      ...targetUser,
      role: nextRole,
      ...(patch.name !== undefined ? { name: patch.name.trim() || targetUser.name } : {}),
      ...(nextRole === 'teacher' || patch.targetBand !== undefined ? { targetBand: cleanBand } : {}),
      ...(patch.studyGoal !== undefined ? { studyGoal: patch.studyGoal.trim() } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: nextAvatar } : {}),
      ...(patch.profileBannerId !== undefined ? { profileBannerId: patch.profileBannerId || 'ocean' } : {}),
      ...(patch.profileCoverUrl !== undefined ? { profileCoverUrl: patch.profileCoverUrl || '' } : {}),
      ...(patch.avatarFrameId !== undefined ? { avatarFrameId: patch.avatarFrameId || 'none' } : {}),
      ...(patch.equippedTitleId !== undefined ? { equippedTitleId: patch.equippedTitleId || 'newbie' } : {}),
      ...(patch.showTitleBadge !== undefined ? { showTitleBadge: Boolean(patch.showTitleBadge) } : {}),
      ...(patch.vipRedNameEnabled !== undefined ? { vipRedNameEnabled: Boolean(patch.vipRedNameEnabled) } : {}),
      ...(patch.vipNameColor !== undefined ? { vipNameColor: normalizeVipNameColor(patch.vipNameColor) } : {}),
      ...(patch.vipTagEnabled !== undefined ? { vipTagEnabled: Boolean(patch.vipTagEnabled) } : {}),
      ...(patch.vipNeonCoverEnabled !== undefined ? { vipNeonCoverEnabled: Boolean(patch.vipNeonCoverEnabled) } : {}),
      ...(patch.vipNeonCoverColor !== undefined ? { vipNeonCoverColor: normalizeVipNeonCoverColor(patch.vipNeonCoverColor) } : {}),
      ...(patch.vipEffectsCustomizedAt !== undefined ? { vipEffectsCustomizedAt: Number(patch.vipEffectsCustomizedAt) || Date.now() } : {}),
      ...(Array.isArray(mergedAckIds) ? { acknowledgedTitleIds: mergedAckIds } : {})
    };
    setUsersDb(prev => ({ ...prev, [username]: updatedUser }));
    if (supportAdminProfile?.username === username) {
      setSupportAdminProfile(prev => (prev ? { ...prev, ...updatedUser } : prev));
    }
    if (currentUser?.username === username) {
      currentUserRef.current = updatedUser;
      setCurrentUser(updatedUser);
      if (patch.avatarUrl !== undefined) {
        setMyCrewColor(nextAvatar ? 'avatar' : (myCrewColor === 'avatar' ? 'cyan' : myCrewColor));
      }
    }
    const snap = await dispatchSyncAction('UPSERT_USER', { username, user: updatedUser });
    if (!snap && lastSyncRejectionStatusRef.current > 0) {
      await pullServerSyncState(true);
      return false;
    }
    if (!patch.silentToast) {
      const isStylingOnly =
        patch.profileBannerId !== undefined ||
        patch.profileCoverUrl !== undefined ||
        patch.avatarFrameId !== undefined ||
        patch.equippedTitleId !== undefined ||
        patch.showTitleBadge !== undefined ||
        patch.vipRedNameEnabled !== undefined ||
        patch.vipNameColor !== undefined ||
        patch.vipTagEnabled !== undefined ||
        patch.vipNeonCoverEnabled !== undefined ||
        patch.vipNeonCoverColor !== undefined;
      showToast(
        patch.customToast
          ? patch.customToast
          : isStylingOnly
          ? `Đã cập nhật giao diện hồ sơ & danh hiệu cho ${updatedUser.name}!`
          : updatedUser.role === 'teacher'
          ? `Đã cập nhật tài khoản ${updatedUser.isSuperAdmin ? 'Quản trị' : 'Giáo viên'} ${updatedUser.name}!`
          : `Đã cập nhật tài khoản ${updatedUser.name} (Target Band ${updatedUser.targetBand})!`
      );
    }
  };

  // Super Admin Custom Titles & User Title Grants + Speaking Room Unlock
  const handleUpsertCustomTitle = async (customTitleObj) => {
    if (!currentUser?.isSuperAdmin || !customTitleObj?.label?.trim()) return false;
    const snap = await dispatchSyncAction('UPSERT_CUSTOM_TITLE', { customTitle: customTitleObj });
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    return true;
  };

  const handleDeleteCustomTitle = async (titleId) => {
    if (!currentUser?.isSuperAdmin || !titleId) return false;
    const snap = await dispatchSyncAction('DELETE_CUSTOM_TITLE', { titleId });
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    showToast('Đã xóa danh hiệu tùy chỉnh.', 'info');
    return true;
  };

  const handleGrantUserTitles = async (targetUsername, titleIds, mode = 'add') => {
    if (!currentUser?.isSuperAdmin || !targetUsername) return false;
    const cleanIds = (Array.isArray(titleIds) ? titleIds : [titleIds]).filter(Boolean);
    const snap = await dispatchSyncAction('GRANT_USER_TITLES', {
      username: targetUsername,
      titleIds: cleanIds,
      mode
    });
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    const targetName = usersDb[targetUsername]?.name || targetUsername;
    showToast(
      mode === 'remove'
        ? `Đã gỡ danh hiệu khỏi tài khoản ${targetName}.`
        : `Đã trao danh hiệu cho ${targetName}!`
    );
    return true;
  };

  const handleToggleUserCoverUnlock = async (targetUsername, unlocked = true) => {
    if (!currentUser?.isSuperAdmin || !targetUsername) return false;
    const snap = await dispatchSyncAction('TOGGLE_USER_COVER_UNLOCK', {
      username: targetUsername,
      unlocked: Boolean(unlocked)
    });
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    const targetName = usersDb[targetUsername]?.name || targetUsername;
    showToast(
      unlocked
        ? `Đã mở khóa quyền tải Ảnh Nền Riêng cho ${targetName}!`
        : `Đã khóa lại quyền tải Ảnh Nền Riêng của ${targetName}.`,
      unlocked ? 'success' : 'info'
    );
    return true;
  };

  const handleToggleUserSubscription = async (targetUsername, planType = 'aieo_vip', unlocked = true, testId = '') => {
    if (!currentUser?.isSuperAdmin || !targetUsername) return false;
    const snap = await dispatchSyncAction('TOGGLE_USER_SUBSCRIPTION', {
      username: targetUsername,
      kind: planType,
      testId: planType === 'test' ? String(testId || '') : undefined,
      active: Boolean(unlocked)
    });
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    const targetName = usersDb[targetUsername]?.name || targetUsername;
    const planLabel =
      planType === 'aieo_vip'
        ? 'Gói IELTS VIP (1 Tháng)'
        : planType === 'real_exam_credit'
        ? '+1 Lượt Thực Chiến Thi Thật'
        : planType === 'room_ticket'
        ? 'Vé Tạo 1 Phòng Đấu Riêng (5k)'
        : planType === 'test'
        ? 'quyền thi Đề Thực Chiến 4 Kỹ Năng'
        : 'quyền mở gói tháng';
    showToast(
      unlocked
        ? `Đã kích hoạt ${planLabel} cho ${targetName}!`
        : `Đã thu hồi ${planLabel} của ${targetName}.`,
      unlocked ? 'success' : 'info'
    );
    return true;
  };

  const openGlobalCheckoutModal = (opts = {}) => {
    const cfgPay = normalizePaymentConfig(paymentConfig || {});
    const itemType = opts.itemType || 'aieo_vip';
    const defaultLabel =
      itemType === 'aieo_vip'
        ? 'Gói IELTS VIP Full Quyền (1 Tháng)'
        : itemType === 'room_ticket'
        ? 'Vé Tạo 1 Phòng Đấu Riêng (5k/lần)'
        : itemType === 'test'
        ? 'Chi Phí Test Thực Chiến IELTS (4 Kỹ Năng)'
        : 'Ảnh Nền Riêng (1 Tháng)';
    const defaultPrice =
      itemType === 'aieo_vip'
        ? (cfgPay.aieoVipPrice ?? AIEO_VIP_PRICE_VND)
        : itemType === 'room_ticket'
        ? (cfgPay.friendRoomTicketPrice ?? FRIEND_ROOM_TICKET_PRICE_VND)
        : itemType === 'test'
        ? (cfgPay.defaultExamPriceVnd ?? DEFAULT_EXAM_PRICE_VND)
        : cfgPay.coverUnlockPrice;
    setGlobalCheckoutState({
      itemType,
      itemId: opts.itemId || '',
      itemLabel: opts.itemLabel || defaultLabel,
      itemPrice: opts.itemPrice !== undefined ? opts.itemPrice : defaultPrice,
      renew: Boolean(opts.renew)
    });
  };

  const handleRequestCoverUnlock = async (reqOpts = {}) => {
    if (!currentUser?.username) return false;
    const payload =
      reqOpts?.itemType === 'title' && reqOpts?.itemId
        ? { itemType: 'title', itemId: reqOpts.itemId, renew: Boolean(reqOpts.renew) }
        : reqOpts?.itemType === 'test' && reqOpts?.itemId
        ? { itemType: 'test', itemId: reqOpts.itemId, renew: Boolean(reqOpts.renew) }
        : reqOpts?.itemType === 'aieo_vip' || reqOpts?.itemType === 'room_ticket'
        ? { itemType: reqOpts.itemType, renew: Boolean(reqOpts.renew) }
        : { itemType: 'cover', renew: Boolean(reqOpts.renew) };
    const snap = await dispatchSyncAction('REQUEST_COVER_UNLOCK', payload);
    if (!snap && lastSyncRejectionStatusRef.current > 0) return false;
    showToast('Đã gửi yêu cầu xác nhận thanh toán tới Quản Trị Hệ Thống (SĐT/Zalo: 0367073526)!');
    return true;
  };

  const handleSpeakingRoomUnlocked = (testId, unlockToken) => {
    if (!testId || !unlockToken) return;
    setSpeakingUnlockTokens(prev => ({ ...prev, [testId]: unlockToken }));
  };

  // Teacher Action: Duplicate Test (defaults copy to private so students can't accidentally open it)
  const handleDuplicateTest = (testObj) => {
    if (!testObj) return;
    const copyId = `test-copy-${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(testObj)),
      id: copyId,
      title: `${testObj.title} (Bản sao)`,
      visibility: 'private',
      allowViewAnswers: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTests(prev => [duplicated, ...prev]);
    dispatchSyncAction('UPSERT_TEST', { test: duplicated });
    showToast(`Đã nhân bản đề "${testObj.title}" ở chế độ Riêng tư!`);
  };

  // Teacher Action: Delete Test
  const handleDeleteTest = (testObj) => {
    if (!testObj?.id) return;
    if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${testObj.title}"? Dữ liệu bài nộp cũ vẫn được giữ trong bảng điểm.`)) {
      return;
    }
    setTests(prev => prev.filter(t => t.id !== testObj.id));
    dispatchSyncAction('DELETE_TEST', { testId: testObj.id });
    showToast(`Đã xóa đề thi "${testObj.title}".`, 'info');
  };

  // Teacher Action: Delete Attempt (unlock student on 1-attempt exam / reset attempt)
  const handleDeleteAttempt = (attemptObj) => {
    if (!attemptObj?.id) return;
    if (!window.confirm(`Xóa lượt làm bài của "${attemptObj.studentName}" cho đề "${attemptObj.testTitle}" để học viên có thể thi lại?`)) {
      return;
    }
    setAttempts(prev => prev.filter(a => a.id !== attemptObj.id));
    dispatchSyncAction('DELETE_ATTEMPT', { attemptId: attemptObj.id });
    showToast(`Đã mở khóa lượt làm lại cho học viên ${attemptObj.studentName}.`);
  };

  // Teacher Action: Create Single or Bulk Accounts (Strictly Teacher Only)
  const handleSaveNewStudents = async (e) => {
    if (e) e.preventDefault();
    if (currentUser?.role !== 'teacher') {
      showToast('Chỉ Giáo viên mới có quyền tạo tài khoản mới!', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];

    if (addStudentMode === 'single') {
      const uname = (newStudentForm.username || '').trim().replace(/^@+/, '').replace(/\s+/g, '_');
      const pass = (newStudentForm.password || '').trim();
      const name = (newStudentForm.name || '').trim() || uname;
      const role = newStudentForm.role === 'teacher' ? 'teacher' : 'student';
      const band = role === 'teacher'
        ? 9.0
        : Math.min(9.0, Math.max(4.0, roundIeltsBand(Number(newStudentForm.targetBand) || 7.0)));
      if (!uname || !pass) {
        showToast('Vui lòng nhập tên đăng nhập và mật khẩu tài khoản!', 'error');
        return;
      }
      const hasDuplicate = Object.keys(usersDb || {}).some(
        k => k.replace(/^@+/, '').toLowerCase() === uname.toLowerCase()
      );
      if (hasDuplicate) {
        showToast(`Tài khoản "${uname}" đã tồn tại!`, 'error');
        return;
      }
      const userObj = { username: uname, pass, name, role, targetBand: band, joinedDate: today };
      const snap = await dispatchSyncAction('UPSERT_USER', { username: uname, user: userObj });
      if (!snap && lastSyncRejectionStatusRef.current > 0) {
        return;
      }
      if (!snap) {
        setUsersDb(prev => ({ ...prev, [uname]: userObj }));
      }
      setNewStudentForm({ username: '', name: '', password: '123', targetBand: 7.0, role: 'student' });
      setShowAddStudentModal(false);
      showToast(`Đã tạo tài khoản ${role === 'teacher' ? 'Giáo viên' : 'Học viên'} "${name}" (@${uname})!`);
      return;
    }

    const parsedList = parseBulkStudentsText(bulkStudentsText);
    if (parsedList.length === 0) {
      showToast('Không có dòng hợp lệ. Định dạng: username | Họ tên | mật khẩu | targetBand', 'error');
      return;
    }
    const existingKeysLower = new Set(
      Object.keys(usersDb || {}).map(k => k.replace(/^@+/, '').toLowerCase())
    );
    const createdUsers = {};
    let skipped = 0;
    parsedList.forEach(item => {
      if (existingKeysLower.has(item.username.toLowerCase()) || createdUsers[item.username]) {
        skipped++;
        return;
      }
      existingKeysLower.add(item.username.toLowerCase());
      createdUsers[item.username] = {
        username: item.username,
        pass: item.pass,
        name: item.name,
        role: 'student',
        targetBand: item.targetBand,
        joinedDate: today
      };
    });
    const addedEntries = Object.entries(createdUsers);
    if (addedEntries.length === 0) {
      showToast('Tất cả tên tài khoản trong danh sách đều đã tồn tại!', 'error');
      return;
    }
    const snap = await dispatchSyncAction('UPSERT_USERS_BULK', { users: addedEntries.map(([, user]) => user) });
    if (!snap && lastSyncRejectionStatusRef.current > 0) {
      return;
    }
    if (!snap) {
      setUsersDb(prev => ({ ...prev, ...createdUsers }));
    }
    setShowAddStudentModal(false);
    showToast(`Đã thêm ${addedEntries.length} học viên${skipped > 0 ? ` (bỏ qua ${skipped} tài khoản trùng)` : ''}!`);
  };

  // Teacher Action: Reset Account Password
  const handleResetStudentPassword = async (e) => {
    if (e) e.preventDefault();
    if (currentUser?.role !== 'teacher' || !editingStudentAccount) return;
    const rawUname = String(editingStudentAccount.username || '').trim();
    const matchedLocalKey = usersDb[rawUname]
      ? rawUname
      : (Object.keys(usersDb || {}).find(k => k.replace(/^@+/, '').toLowerCase() === rawUname.replace(/^@+/, '').toLowerCase()) || rawUname);
    const uname = matchedLocalKey;
    const baseUser = usersDb[uname] || editingStudentAccount;
    const isActorSuperAdmin = Boolean(currentUser?.isSuperAdmin);
    if ((baseUser.isSuperAdmin || uname.replace(/^@+/, '').toLowerCase() === 'tuanpro123s') && !isActorSuperAdmin) {
      showToast('Không có quyền thao tác trên tài khoản Quản trị hệ thống!', 'error');
      return;
    }
    if (baseUser.role === 'teacher' && uname !== currentUser.username && !isActorSuperAdmin) {
      showToast('Chỉ Quản trị hệ thống mới có quyền đổi mật khẩu tài khoản Giáo viên khác!', 'error');
      return;
    }
    const nextPass = (studentPasswordDraft || '').trim();
    if (!nextPass) {
      showToast('Mật khẩu mới không được để trống!', 'error');
      return;
    }
    const snap = await dispatchSyncAction('RESET_USER_PASSWORD', { username: uname, password: nextPass });
    if (!snap && lastSyncRejectionStatusRef.current > 0) {
      if (lastSyncRejectionStatusRef.current === 404) {
        setEditingStudentAccount(null);
        setStudentPasswordDraft('');
        await pullServerSyncState(true);
      }
      return;
    }
    if (!snap && !serverSyncConnectedRef.current) {
      const updatedOffline = { ...baseUser, pass: nextPass };
      setUsersDb(prev => ({ ...prev, [uname]: updatedOffline }));
    }
    setRememberedLogins(prev => {
      if (!prev.some(item => item.username.toLowerCase() === uname.replace(/^@+/, '').toLowerCase())) return prev;
      const updatedList = prev.map(item =>
        item.username.toLowerCase() === uname.replace(/^@+/, '').toLowerCase()
          ? { ...item, password: nextPass, savedAt: Date.now() }
          : item
      );
      persistRememberedLogins(updatedList);
      return updatedList;
    });
    setEditingStudentAccount(null);
    setStudentPasswordDraft('');
    showToast(`Đã đặt lại mật khẩu mới cho tài khoản ${baseUser.name || uname}!`);
  };

  // Teacher Action: Delete Managed Account (also cleans associated student attempts)
  const handleDeleteAccount = (userObj) => {
    if (currentUser?.role !== 'teacher' || !userObj?.username) return;
    const uname = userObj.username;
    if (userObj.isSuperAdmin || uname === 'tuanpro123s') {
      showToast('Không thể xóa tài khoản Quản trị hệ thống!', 'error');
      return;
    }
    if (uname === currentUser.username) {
      showToast('Không thể tự xóa tài khoản đang đăng nhập!', 'error');
      return;
    }
    const teacherCount = Object.values(usersDb).filter(
      u => u?.role === 'teacher' && !u?.isSuperAdmin && u?.username !== 'tuanpro123s'
    ).length;
    if (userObj.role === 'teacher' && teacherCount <= 1) {
      showToast('Cần giữ lại ít nhất 1 tài khoản Giáo viên trong hệ thống!', 'error');
      return;
    }
    const relatedAttemptCount = attempts.filter(a => a.studentId === uname || a.studentUsername === uname).length;
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa tài khoản "${userObj.name}" (@${uname})${
          relatedAttemptCount > 0 ? ` và ${relatedAttemptCount} bài làm liên quan` : ''
        }?`
      )
    ) {
      return;
    }
    setUsersDb(prev => {
      const next = { ...prev };
      delete next[uname];
      return next;
    });
    setTeacherNotes(prev => {
      if (!prev[uname]) return prev;
      const next = { ...prev };
      delete next[uname];
      return next;
    });
    if (relatedAttemptCount > 0) {
      setAttempts(prev => prev.filter(a => a.studentId !== uname && a.studentUsername !== uname));
    }
    dispatchSyncAction('DELETE_USER', { username: uname, purgeAttempts: true });
    showToast(`Đã xóa tài khoản "${userObj.name}" (@${uname}).`, 'info');
  };

  // Teacher Action: Bulk Delete Selected Accounts (atomic server batch + attempt cleanup)
  const handleBulkDeleteAccounts = (rawUsernames = []) => {
    if (currentUser?.role !== 'teacher') return false;
    const cleanSet = new Set(
      (Array.isArray(rawUsernames) ? rawUsernames : [])
        .map(u => String(u || '').trim())
        .filter(uname => {
          if (!uname || uname === 'tuanpro123s' || uname === currentUser.username) return false;
          const target = usersDb[uname];
          if (target?.isSuperAdmin) return false;
          return Boolean(target);
        })
    );
    const cleanNames = Array.from(cleanSet);
    if (cleanNames.length === 0) {
      showToast('Chưa chọn tài khoản hợp lệ nào để xóa.', 'error');
      return false;
    }
    const remainingTeachers = Object.values(usersDb).filter(
      u => u?.role === 'teacher' && !u?.isSuperAdmin && u?.username !== 'tuanpro123s' && !cleanSet.has(u.username)
    ).length;
    if (remainingTeachers < 1) {
      showToast('Cần giữ lại ít nhất 1 tài khoản Giáo viên trong hệ thống!', 'error');
      return false;
    }
    const relatedAttempts = attempts.filter(
      a => cleanSet.has(a.studentId) || cleanSet.has(a.studentUsername)
    ).length;
    if (
      !window.confirm(
        `Xác nhận xóa ${cleanNames.length} tài khoản đã chọn${
          relatedAttempts > 0 ? ` cùng ${relatedAttempts} bài nộp liên quan` : ''
        }? Thao tác này không thể hoàn tác.`
      )
    ) {
      return false;
    }
    setUsersDb(prev => {
      const next = { ...prev };
      cleanNames.forEach(uname => delete next[uname]);
      return next;
    });
    setTeacherNotes(prev => {
      const next = { ...prev };
      let removed = false;
      cleanNames.forEach(uname => {
        if (next[uname]) {
          delete next[uname];
          removed = true;
        }
      });
      return removed ? next : prev;
    });
    if (relatedAttempts > 0) {
      setAttempts(prev => prev.filter(a => !cleanSet.has(a.studentId) && !cleanSet.has(a.studentUsername)));
    }
    dispatchSyncAction('DELETE_USERS_BULK', { usernames: cleanNames, purgeAttempts: true });
    showToast(`Đã xóa gọn ${cleanNames.length} tài khoản${relatedAttempts > 0 ? ` & ${relatedAttempts} bài làm` : ''}!`, 'info');
    return true;
  };

  // Teacher Action: Purge Orphaned Attempts Whose Accounts Were Deleted
  const handlePurgeOrphanAttempts = () => {
    if (currentUser?.role !== 'teacher') return;
    const orphanCount = attempts.filter(a => a.studentId && !usersDb[a.studentId]).length;
    if (orphanCount === 0) {
      showToast('Không có bài nộp mồ côi nào cần dọn dẹp.', 'info');
      return;
    }
    if (!window.confirm(`Dọn sạch ${orphanCount} bài làm thuộc các tài khoản đã xóa khỏi bảng điểm?`)) {
      return;
    }
    setAttempts(prev => prev.filter(a => !a.studentId || Boolean(usersDb[a.studentId])));
    dispatchSyncAction('PURGE_ORPHAN_ATTEMPTS', {});
    showToast(`Đã dọn sạch ${orphanCount} bài làm của tài khoản đã xóa!`, 'info');
  };

  // Teacher Action: Copy Room Invite Link (?pin=...)
  const handleCopyInviteLink = (pin = currentRoomPin) => {
    const url = buildRoomInviteLink(pin);
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast(`Đã sao chép Link mời vào phòng PIN ${pin}!`);
  };

  // Teacher Action: Kick player out of lobby / live room
  const handleKickLobbyPlayer = (pin, username, displayName) => {
    if (!pin || !username) return;
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      const nextLobby = { ...r.lobbyPlayers };
      const nextLive = { ...r.liveMatch };
      delete nextLobby[username];
      delete nextLive[username];
      return {
        ...prev,
        [pin]: { ...r, lobbyPlayers: nextLobby, liveMatch: nextLive }
      };
    });
    dispatchSyncAction('KICK_LOBBY_PLAYER', { pin, username });
    showToast(`Đã mời "${displayName || username}" rời khỏi phòng ${pin}.`, 'info');
  };

  // Teacher Action: End active match & freeze standings
  const handleFinishRoomMatch = (pin = currentRoomPin) => {
    if (!pin) return;
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      return { ...prev, [pin]: { ...r, status: 'ENDED' } };
    });
    dispatchSyncAction('FINISH_ROOM_MATCH', { pin });
    showToast(`Đã chốt bảng xếp hạng & kết thúc trận đấu phòng ${pin}!`);
  };

  // Teacher Action: Delete extra game room
  const handleDeleteRoom = (pin) => {
    const allPins = Object.keys(roomsDb);
    if (allPins.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 phòng đấu mặc định!', 'info');
      return;
    }
    const target = roomsDb[pin];
    if (!window.confirm(`Xóa phòng "${target?.name || pin}" (PIN: ${pin})?`)) return;
    const fallbackPin = allPins.find(p => p !== pin) || '';
    setRoomsDb(prev => {
      const next = { ...prev };
      delete next[pin];
      return next;
    });
    if (currentRoomPin === pin && fallbackPin) setCurrentRoomPin(fallbackPin);
    if (joinedRoomPin === pin) {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
    }
    dispatchSyncAction('DELETE_ROOM', { pin });
    showToast(`Đã xóa phòng PIN ${pin}.`, 'info');
  };

  // Exam Mode State (restores active draft seamlessly on F5/reload)
  const [examState, setExamState] = useState(() => {
    const initTestId = initialNav.view === 'EXAM_MODE' ? initialNav.selectedTestId : null;
    const restored = initTestId ? loadExamDraft(currentUser?.username, initTestId, tests) : null;
    if (restored) return restored;
    const activeTest = initTestId ? tests.find(t => t.id === initTestId) : null;
    return buildInitialExamState(activeTest);
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingAudioKey, setPlayingAudioKey] = useState(null);
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0 });
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [selectedPassageText, setSelectedPassageText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState(null);
  const examAudioRef = useRef(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ielts_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ielts_theme', darkMode ? 'dark' : 'light');
    if (gameRuntimeRef.current) {
      gameRuntimeRef.current.darkMode = darkMode;
    }
  }, [darkMode]);

  // Exam Builder State (restores draft across accidental reload)
  const [editingTest, setEditingTest] = useState(() => initialBuilderDraft?.editingTest || null);
  const [builderTab, setBuilderTab] = useState(() => initialBuilderDraft?.builderTab || 'general'); // 'general', 'listening', 'reading', 'writing'
  const [builderListeningIdx, setBuilderListeningIdx] = useState(() => initialBuilderDraft?.builderListeningIdx || 0);
  const [builderReadingIdx, setBuilderReadingIdx] = useState(() => initialBuilderDraft?.builderReadingIdx || 0);
  const [zoomedReadingImg, setZoomedReadingImg] = useState('');
  const [editingTargetUser, setEditingTargetUser] = useState(null);
  const [testForm, setTestForm] = useState(() => initialBuilderDraft?.testForm || createEmptyTestForm());

  // Teacher Grading Modal
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradingScores, setGradingScores] = useState({
    listeningRaw: 0,
    listeningBand: 0,
    readingRaw: 0,
    readingBand: 0,
    task1Band: 6.0,
    task2Band: 6.5,
    speakingFc: 6.0,
    speakingLr: 6.0,
    speakingGra: 6.0,
    speakingPr: 6.0,
    speakingBand: 6.0,
    feedback: ''
  });

  // AI Grading states
  const [isGradingAI, setIsGradingAI] = useState(false);
  const [aiGradingStep, setAiGradingStep] = useState('');
  const [aiApiKey, setAiApiKey] = useState(() => {
    return localStorage.getItem('ielts_ai_key') || (import.meta.env?.VITE_GEMINI_API_KEY || '');
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Auth Form State (Login-only, accounts created strictly by Teachers)
  const [rememberPassword, setRememberPassword] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_PREF_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [rememberedLogins, setRememberedLogins] = useState(() => loadRememberedLogins());
  const [authForm, setAuthForm] = useState(() => {
    let shouldRemember = true;
    try {
      shouldRemember = localStorage.getItem(REMEMBER_PREF_KEY) !== 'false';
    } catch {}
    const list = loadRememberedLogins();
    if (shouldRemember && list[0]) {
      return { username: list[0].username, password: list[0].password, fullName: '' };
    }
    return { username: '', password: '', fullName: '' };
  });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(REMEMBER_PREF_KEY, rememberPassword ? 'true' : 'false');
    } catch {}
  }, [rememberPassword]);

  // Teacher Hub Sub-Tab ('tests', 'grading', 'game_room', 'accounts')
  const [teacherHubTab, setTeacherHubTab] = useState(() => (
    initialNav.teacherHubTab === 'students' ? 'accounts' : (initialNav.teacherHubTab || 'tests')
  ));
  const [expandedTeacherTestId, setExpandedTeacherTestId] = useState(() => initialNav.expandedTeacherTestId || null);
  const [gradingFilters, setGradingFilters] = useState({ testId: 'all', status: 'all', risk: 'all', search: '' });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState('single'); // 'single' | 'bulk'
  const [newStudentForm, setNewStudentForm] = useState({ username: '', name: '', password: '123', targetBand: 7.0, role: 'student' });
  const [bulkStudentsText, setBulkStudentsText] = useState('hocsinh_04 | Lê Minh Tuấn | 123 | 7.0\nhocsinh_05 | Phạm Thảo Vy | 123 | 7.5');
  const [editingStudentAccount, setEditingStudentAccount] = useState(null);
  const [studentPasswordDraft, setStudentPasswordDraft] = useState('');

  // Vocab Modal in Teacher View
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [customVocabInput, setCustomVocabInput] = useState(DEFAULT_VOCAB_TEXT);
  const [customVocabTopics, setCustomVocabTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('ielts_custom_vocab_topics_v1');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed.filter(t => t?.id && t?.label && typeof t?.text === 'string')
        : [];
    } catch (_e) {
      return [];
    }
  });

  // ==========================================
  // GAME ARENA STATE & REFS
  // ==========================================
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const autoNextTimerRef = useRef(null);
  const wordTimerRef = useRef(null);
  const gameToastTimerRef = useRef(null);
  const homingLasersRef = useRef([]);
  const wordStartedAtRef = useRef(0);
  const timeRemainingFloatRef = useRef(GAME_ROUND_TIME_LIMITS[1]);

  const [gameRound, setGameRound] = useState(1);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [gameCombo, setGameCombo] = useState(0);
  const [gameWordIdx, setGameWordIdx] = useState(0);
  const [gameTypedProgress, setGameTypedProgress] = useState(0);
  const [gameSubState, setGameSubState] = useState(() => initialNav.gameSubState || 'JOIN'); // 'JOIN' | 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'TRANSITION' | 'GAMEOVER'
  const [gameOutcome, setGameOutcome] = useState(null); // 'VICTORY' | 'LOST' | null
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [gameTimeLimit, setGameTimeLimit] = useState(GAME_ROUND_TIME_LIMITS[1]);
  const [transitionCountdown, setTransitionCountdown] = useState(3);
  const [isSandboxRound, setIsSandboxRound] = useState(false);
  const [isPracticeGameSession, setIsPracticeGameSession] = useState(false);
  const [practiceTopicMeta, setPracticeTopicMeta] = useState({ topicId: 'core', topicLabel: 'IELTS Core Academic' });
  const [showMobileKeyboard, setShowMobileKeyboard] = useState(false);
  const [gameMuted, setGameMuted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [freezeCharges, setFreezeCharges] = useState(2);
  const [isFrozenBoost, setIsFrozenBoost] = useState(false);
  const freezeUntilRef = useRef(0);
  const bonusTimeSecRef = useRef(0);
  const pausedStartedAtRef = useRef(0);
  const justJoinedLobbyAtRef = useRef(0);
  const particlesRef = useRef([]);
  const missedWordsMatchRef = useRef([]);
  const [gameToast, setGameToast] = useState({ text: '', isSuccess: true, visible: false });
  const [gameReviewLog, setGameReviewLog] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [gameQueues, setGameQueues] = useState({ 1: [], 2: [], 3: [], 4: [] });

  const lastLaunchedAtRef = useRef(null);
  const lobbyCountdownTimerRef = useRef(null);
  const syncChannelRef = useRef(null);
  const skipNextRoomBroadcastRef = useRef(false);
  const skipNextTestsBroadcastRef = useRef(false);
  const skipNextAttemptsBroadcastRef = useRef(false);
  const skipNextUsersBroadcastRef = useRef(false);
  const skipNextVocabTopicsBroadcastRef = useRef(false);
  const lastSyncVersionRef = useRef(-1);
  const lastBootIdRef = useRef('');
  const lastSyncRejectionStatusRef = useRef(0);
  const chatScrollRef = useRef(null);
  const roomsDbRef = useRef(roomsDb);
  const lastAutoClearKeyRef = useRef('');
  useEffect(() => {
    roomsDbRef.current = roomsDb;
  }, [roomsDb]);

  const serverSyncConnectedRef = useRef(false);
  const bootSessionCheckedRef = useRef(false);
  const authEpochRef = useRef(0);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const gameRuntimeRef = useRef({
    round: 1,
    score: 0,
    lives: 3,
    combo: 0,
    wordIdx: 0,
    typedProgress: 0,
    subState: 'JOIN',
    activeQuestion: null,
    queues: { 1: [], 2: [], 3: [], 4: [] },
    isSandbox: false,
    isPractice: false,
    practiceMeta: null,
    paused: false,
    darkMode: typeof localStorage !== 'undefined' && localStorage.getItem('ielts_theme') === 'dark',
    crewColorId: 'cyan',
    animalId: 'cat',
    accessoryId: 'crown',
    timeLimit: GAME_ROUND_TIME_LIMITS[1],
    questionResolved: false
  });

  // Sync state to local storage + cross-tab BroadcastChannel
  useEffect(() => {
    localStorage.setItem('ielts_tests', JSON.stringify(tests));
    if (skipNextTestsBroadcastRef.current) {
      skipNextTestsBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_tests', payload: tests });
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('ielts_attempts', JSON.stringify(attempts));
    if (skipNextAttemptsBroadcastRef.current) {
      skipNextAttemptsBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_attempts', payload: attempts });
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('ielts_users_db_v2', JSON.stringify(usersDb));
    if (skipNextUsersBroadcastRef.current) {
      skipNextUsersBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_users_db_v2', payload: usersDb });
  }, [usersDb]);

  useEffect(() => {
    localStorage.setItem('ielts_rooms_db_v2', JSON.stringify(roomsDb));
    if (skipNextRoomBroadcastRef.current) {
      skipNextRoomBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_rooms_db_v2', payload: roomsDb });
  }, [roomsDb]);

  useEffect(() => {
    localStorage.setItem('ielts_custom_vocab_topics_v1', JSON.stringify(customVocabTopics));
    if (skipNextVocabTopicsBroadcastRef.current) {
      skipNextVocabTopicsBroadcastRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ key: 'ielts_custom_vocab_topics_v1', payload: customVocabTopics });
  }, [customVocabTopics]);

  useEffect(() => {
    localStorage.setItem('ielts_teacher_notes', JSON.stringify(teacherNotes));
  }, [teacherNotes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ielts_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ielts_current_user');
    }
  }, [currentUser]);

  // Reset client-side game room state cleanly on logout, auth reset, or session expiry
  const resetActiveGameSession = (usernameToRemove = '') => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    setJoinedRoomPin(null);
    setGameSubState('JOIN');
    setIsPracticeGameSession(false);
    setRoomJoinForm({ pin: '', pass: '' });
    setRoomJoinError('');
    gameRuntimeRef.current = {
      ...gameRuntimeRef.current,
      subState: 'JOIN',
      isPractice: false,
      paused: false,
      activeQuestion: null,
      timeLimit: 18
    };
    const cleanUname = String(usernameToRemove || '').trim();
    if (cleanUname) {
      skipNextRoomBroadcastRef.current = true;
      setRoomsDb(prev => {
        let touched = false;
        const nextRooms = { ...prev };
        Object.entries(nextRooms).forEach(([pin, r]) => {
          if (!r || typeof r !== 'object') return;
          const nextLobby = r.lobbyPlayers && typeof r.lobbyPlayers === 'object' ? { ...r.lobbyPlayers } : {};
          const nextLive = r.liveMatch && typeof r.liveMatch === 'object' ? { ...r.liveMatch } : {};
          let roomTouched = false;
          if (Object.prototype.hasOwnProperty.call(nextLobby, cleanUname)) {
            delete nextLobby[cleanUname];
            roomTouched = true;
          }
          if (r.status === 'LOBBY' && Object.prototype.hasOwnProperty.call(nextLive, cleanUname)) {
            delete nextLive[cleanUname];
            roomTouched = true;
          }
          if (roomTouched) {
            nextRooms[pin] = { ...r, lobbyPlayers: nextLobby, liveMatch: nextLive };
            touched = true;
          }
        });
        return touched ? nextRooms : prev;
      });
    }
  };
  const resetActiveGameSessionRef = useRef(resetActiveGameSession);
  resetActiveGameSessionRef.current = resetActiveGameSession;

  // Shared Cross-Browser Sync Dispatch Helpers (/api/sync via Vite Middleware + BroadcastChannel fallback)
  const applyRemoteSnapshotData = useRef(null);
  applyRemoteSnapshotData.current = (snap) => {
    if (!snap || typeof snap !== 'object') return;
    if (typeof snap.serverTime === 'number' && Number.isFinite(snap.serverTime)) {
      const offset = snap.serverTime - Date.now();
      serverClockOffsetMsRef.current = offset;
      setServerClockOffsetMs(prev => (Math.abs(prev - offset) > 5000 ? offset : prev));
    }
    if (snap.authenticated === false) {
      lastSyncVersionRef.current = -1;
      if (snap.bootId) {
        lastBootIdRef.current = snap.bootId;
      }
      if (typeof snap.aiConfigured === 'boolean') {
        setAiConfigured(snap.aiConfigured);
      }
      if (typeof snap.mailConfigured === 'boolean') {
        setMailConfigured(snap.mailConfigured);
      }
      if (bootSessionCheckedRef.current && currentUserRef.current) {
        const expiredUsername = currentUserRef.current?.username || '';
        authEpochRef.current += 1;
        clearNavSession();
        currentUserRef.current = null;
        setCurrentUser(null);
        seenNotifIdsRef.current = null;
        setNotifications([]);
        setSentNotifications([]);
        setClassesDb({});
        setCustomTitles([]);
        setSpeakingUnlockTokens({});
        setAdminTitleModalState({ isOpen: false, targetUsername: null });
        setFocusedTestId(null);
        resetActiveGameSession(expiredUsername);
        setView('AUTH');
        showToast('Phiên đăng nhập đã hết hạn hoặc mật khẩu vừa được thay đổi. Vui lòng đăng nhập lại.', 'info');
      }
      return;
    }
    if (snap.bootId) {
      if (lastBootIdRef.current && snap.bootId !== lastBootIdRef.current) {
        lastSyncVersionRef.current = -1;
      }
      lastBootIdRef.current = snap.bootId;
    }
    if (typeof snap.version === 'number') {
      if (snap.version < lastSyncVersionRef.current) return;
      lastSyncVersionRef.current = snap.version;
    }
    if (typeof snap.aiConfigured === 'boolean') {
      setAiConfigured(snap.aiConfigured);
    }
    if (typeof snap.mailConfigured === 'boolean') {
      setMailConfigured(snap.mailConfigured);
    }
    if (snap.rooms && typeof snap.rooms === 'object' && (Object.keys(snap.rooms).length > 0 || snap.seeded)) {
      const normalized = {};
      Object.entries(snap.rooms).forEach(([k, v]) => {
        normalized[k] = normalizeRoomObject(v, k);
      });
      skipNextRoomBroadcastRef.current = true;
      setRoomsDb(prev => (JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized));
    }
    if (Array.isArray(snap.tests) && (snap.tests.length > 0 || snap.seeded)) {
      skipNextTestsBroadcastRef.current = true;
      setTests(prev => (JSON.stringify(prev) === JSON.stringify(snap.tests) ? prev : snap.tests));
    }
    if (Array.isArray(snap.attempts) && (snap.attempts.length > 0 || snap.seeded)) {
      skipNextAttemptsBroadcastRef.current = true;
      setAttempts(prev => (JSON.stringify(prev) === JSON.stringify(snap.attempts) ? prev : snap.attempts));
    }
    if (snap.teacherNotes && typeof snap.teacherNotes === 'object' && (Object.keys(snap.teacherNotes).length > 0 || snap.seeded)) {
      setTeacherNotes(prev => (JSON.stringify(prev) === JSON.stringify(snap.teacherNotes) ? prev : snap.teacherNotes));
    }
    if (snap.users && typeof snap.users === 'object' && (Object.keys(snap.users).length > 0 || snap.seeded)) {
      const deletedSet = new Set(Array.isArray(snap.deletedUserIds) ? snap.deletedUserIds : []);
      skipNextUsersBroadcastRef.current = true;
      setUsersDb(prev => {
        const cleanUsers = {};
        Object.entries(snap.users).forEach(([uname, u]) => {
          if (!deletedSet.has(uname) && u) {
            cleanUsers[uname] = normalizeBrandTeacherUser(u);
          }
        });
        return JSON.stringify(prev) === JSON.stringify(cleanUsers) ? prev : cleanUsers;
      });
      setCurrentUser(prev => {
        if (!prev || !snap.users[prev.username]) return prev;
        const remote = normalizeBrandTeacherUser(snap.users[prev.username]);
        const hasMergedAck = Array.isArray(prev.acknowledgedTitleIds) || Array.isArray(remote.acknowledgedTitleIds);
        const mergedAckIds = hasMergedAck
          ? Array.from(new Set([...(prev.acknowledgedTitleIds || []), ...(remote.acknowledgedTitleIds || [])]))
          : undefined;
        const nextUser = {
          ...prev,
          ...remote,
          ...(hasMergedAck ? { acknowledgedTitleIds: mergedAckIds } : {})
        };
        if (JSON.stringify(prev) === JSON.stringify(nextUser)) return prev;
        currentUserRef.current = nextUser;
        return nextUser;
      });
    }
    if (Array.isArray(snap.customVocabTopics)) {
      const validTopics = snap.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
      skipNextVocabTopicsBroadcastRef.current = true;
      setCustomVocabTopics(prev => (JSON.stringify(prev) === JSON.stringify(validTopics) ? prev : validTopics));
    }
    if ('supportAdminProfile' in snap) {
      setSupportAdminProfile(prev => (JSON.stringify(prev) === JSON.stringify(snap.supportAdminProfile) ? prev : snap.supportAdminProfile));
    }
    if (Array.isArray(snap.adminFeedbacks)) {
      setAdminFeedbacks(prev => (JSON.stringify(prev) === JSON.stringify(snap.adminFeedbacks) ? prev : snap.adminFeedbacks));
    }
    if (Array.isArray(snap.sentNotifications)) {
      setSentNotifications(prev => (JSON.stringify(prev) === JSON.stringify(snap.sentNotifications) ? prev : snap.sentNotifications));
    }
    if (snap.classes && typeof snap.classes === 'object') {
      setClassesDb(prev => (JSON.stringify(prev) === JSON.stringify(snap.classes) ? prev : snap.classes));
    }
    if (Array.isArray(snap.customTitles)) {
      setCustomTitles(prev => (JSON.stringify(prev) === JSON.stringify(snap.customTitles) ? prev : snap.customTitles));
    }
    if (Array.isArray(snap.gamePracticeLeaderboard)) {
      setGamePracticeLeaderboard(prev => (JSON.stringify(prev) === JSON.stringify(snap.gamePracticeLeaderboard) ? prev : snap.gamePracticeLeaderboard));
    }
    if (snap.paymentConfig && typeof snap.paymentConfig === 'object') {
      setPaymentConfig(prev => (JSON.stringify(prev) === JSON.stringify(snap.paymentConfig) ? prev : snap.paymentConfig));
    }
    if (Array.isArray(snap.notifications)) {
      const nextNotifs = snap.notifications;
      const viewerRole = currentUserRef.current?.role;
      const isViewerTeacherOrAdmin = viewerRole === 'teacher' || Boolean(currentUserRef.current?.isSuperAdmin);
      if (!isViewerTeacherOrAdmin && seenNotifIdsRef.current !== null && currentUserRef.current?.username) {
        const freshlyArrived = nextNotifs.find(
          n => n && !n.isRead && !seenNotifIdsRef.current.has(n.id) && n.createdBy !== currentUserRef.current?.username
        );
        if (freshlyArrived) {
          showToast(`🔔 ${freshlyArrived.title}: ${freshlyArrived.message}`, 'info');
        }
      }
      seenNotifIdsRef.current = new Set(nextNotifs.map(n => n?.id).filter(Boolean));
      setNotifications(prev => (JSON.stringify(prev) === JSON.stringify(nextNotifs) ? prev : nextNotifs));
    }
  };

  const pullServerSyncState = async (forceApply = false) => {
    const epochAtStart = authEpochRef.current;
    try {
      const res = await fetch('/api/sync/state', { cache: 'no-store' });
      if (!res.ok) return null;
      const snap = await res.json();
      if (epochAtStart !== authEpochRef.current) return null;
      serverSyncConnectedRef.current = true;
      setServerSyncConnected(true);
      if (snap?.authenticated === false && !currentUserRef.current && !forceApply) {
        if (snap.bootId) lastBootIdRef.current = snap.bootId;
        if (typeof snap.aiConfigured === 'boolean') {
          setAiConfigured(snap.aiConfigured);
        }
        return snap;
      }
      const isNewBoot = Boolean(snap?.bootId && lastBootIdRef.current && snap.bootId !== lastBootIdRef.current);
      if (forceApply || isNewBoot || (typeof snap?.version === 'number' && snap.version > lastSyncVersionRef.current) || snap?.authenticated === false) {
        applyRemoteSnapshotData.current?.(snap);
      }
      return snap;
    } catch (_err) {
      serverSyncConnectedRef.current = false;
      setServerSyncConnected(false);
      return null;
    }
  };

  const dispatchSyncAction = async (type, payload) => {
    lastSyncRejectionStatusRef.current = 0;
    try {
      const res = await fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
      serverSyncConnectedRef.current = true;
      setServerSyncConnected(true);
      if (!res.ok) {
        lastSyncRejectionStatusRef.current = res.status;
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error || `Thao tác bị từ chối (${res.status}).`;
        if (res.status === 401) {
          const expiredUsername = currentUserRef.current?.username || '';
          authEpochRef.current += 1;
          lastSyncVersionRef.current = -1;
          clearNavSession();
          currentUserRef.current = null;
          setCurrentUser(null);
          resetActiveGameSession(expiredUsername);
          setView('AUTH');
        }
        showToast(errMsg, 'error');
        return null;
      }
      const data = await res.json();
      if (data?.snapshot) {
        applyRemoteSnapshotData.current?.(data.snapshot);
      }
      return data?.snapshot || null;
    } catch (_err) {
      lastSyncRejectionStatusRef.current = 0;
      serverSyncConnectedRef.current = false;
      setServerSyncConnected(false);
      return null;
    }
  };

  // Listen for live multi-browser (SSE + Polling) & multi-tab (BroadcastChannel + storage) updates
  useEffect(() => {
    const applyRemoteUpdate = (key, payload) => {
      if (!payload) return;
      if (key === 'ielts_rooms_db_v2' && typeof payload === 'object') {
        const normalized = {};
        Object.entries(payload).forEach(([k, v]) => {
          normalized[k] = normalizeRoomObject(v, k);
        });
        skipNextRoomBroadcastRef.current = true;
        setRoomsDb(prev => (JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized));
      } else if (key === 'ielts_tests' && Array.isArray(payload)) {
        skipNextTestsBroadcastRef.current = true;
        setTests(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_attempts' && Array.isArray(payload)) {
        skipNextAttemptsBroadcastRef.current = true;
        setAttempts(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_teacher_notes' && typeof payload === 'object') {
        setTeacherNotes(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_users_db_v2' && typeof payload === 'object') {
        skipNextUsersBroadcastRef.current = true;
        setUsersDb(prev => (JSON.stringify(prev) === JSON.stringify(payload) ? prev : payload));
      } else if (key === 'ielts_custom_vocab_topics_v1' && Array.isArray(payload)) {
        const validTopics = payload.filter(t => t?.id && t?.label && typeof t?.text === 'string');
        skipNextVocabTopicsBroadcastRef.current = true;
        setCustomVocabTopics(prev => (JSON.stringify(prev) === JSON.stringify(validTopics) ? prev : validTopics));
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('lexiprep_sync_v1');
      syncChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'AUTH_LOGOUT') {
          authEpochRef.current += 1;
          lastSyncVersionRef.current = -1;
          clearNavSession();
          currentUserRef.current = null;
          setCurrentUser(null);
          resetActiveGameSessionRef.current?.(e.data.username || '');
          setView('AUTH');
          return;
        }
        if (e.data?.key) applyRemoteUpdate(e.data.key, e.data.payload);
      };
    }

    const handleStorageEvent = (e) => {
      if (!e.newValue) return;
      if (['ielts_rooms_db_v2', 'ielts_tests', 'ielts_attempts', 'ielts_teacher_notes', 'ielts_users_db_v2', 'ielts_custom_vocab_topics_v1'].includes(e.key)) {
        try {
          applyRemoteUpdate(e.key, JSON.parse(e.newValue));
        } catch (_err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Bootstrap cross-browser relay server state on mount
    let cancelled = false;

    const initServerSync = async () => {
      const bootEpoch = authEpochRef.current;
      let sessionData = null;
      try {
        const res = await fetch('/api/sync/auth/session', { cache: 'no-store' });
        if (res.ok) {
          sessionData = await res.json();
          serverSyncConnectedRef.current = true;
          setServerSyncConnected(true);
        }
      } catch (_err) {
        serverSyncConnectedRef.current = false;
        setServerSyncConnected(false);
      }
      if (cancelled || bootEpoch !== authEpochRef.current) return;

      if (sessionData) {
        if (!sessionData.snapshot?.seeded) {
          await dispatchSyncAction('SEED_DEFAULTS', {
            rooms: roomsDb,
            tests,
            attempts: DEFAULT_ATTEMPTS,
            teacherNotes: DEFAULT_TEACHER_NOTES,
            users: DEFAULT_USERS,
            customVocabTopics
          });
          if (cancelled || bootEpoch !== authEpochRef.current) return;
          try {
            const refreshed = await fetch('/api/sync/auth/session', { cache: 'no-store' });
            if (refreshed.ok) {
              sessionData = await refreshed.json();
            }
          } catch (_err) {}
          if (cancelled || bootEpoch !== authEpochRef.current) return;
        }

        if (sessionData.authenticated && sessionData.user) {
          const cleanUser = normalizeBrandTeacherUser(sessionData.user);
          const localSeen = loadLocalSeenTitles(cleanUser.username);
          if (localSeen.hasBaseline) {
            setLocalSeenTitlesMap(prev => ({ ...prev, [cleanUser.username.toLowerCase()]: localSeen.ids }));
          }
          setCurrentUser(cleanUser);
          currentUserRef.current = cleanUser;
          if (sessionData.snapshot) {
            applyRemoteSnapshotData.current?.(sessionData.snapshot);
          }
          if (cleanUser.role === 'teacher') {
            await dispatchSyncAction('SEED_DEFAULTS', {
              customVocabTopics,
              defaultTests: DEFAULT_TESTS.filter(d => Boolean(d.seedTag))
            });
            if ((aiApiKey || '').trim() && !sessionData.snapshot?.aiConfigured) {
              await dispatchSyncAction('SET_AI_CONFIG', { geminiApiKey: aiApiKey.trim() });
            }
          }
        } else {
          if (sessionData.snapshot) {
            applyRemoteSnapshotData.current?.(sessionData.snapshot);
          }
          if (currentUserRef.current) {
            setCurrentUser(null);
            currentUserRef.current = null;
            setJoinedRoomPin(null);
            setGameSubState('JOIN');
            setView('AUTH');
          }
        }
        bootSessionCheckedRef.current = true;
        setSyncHydrated(true);
      }
    };

    initServerSync();

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageEvent);
      syncChannelRef.current?.close();
      syncChannelRef.current = null;
    };
  }, []);

  // Reconnect SSE stream & poll fallback whenever authenticated user changes (prevents stale pre-login stream logout)
  useEffect(() => {
    const activeUsername = currentUser?.username;
    if (!activeUsername) return undefined;

    const streamEpoch = authEpochRef.current;
    let evtSource = null;

    if (typeof EventSource !== 'undefined') {
      evtSource = new EventSource('/api/sync/stream');
      evtSource.addEventListener('sync', (e) => {
        if (streamEpoch !== authEpochRef.current) return;
        try {
          const parsed = JSON.parse(e.data);
          serverSyncConnectedRef.current = true;
          setServerSyncConnected(true);
          applyRemoteSnapshotData.current?.(parsed);
        } catch (_err) {}
      });
      evtSource.onerror = () => {
        if (streamEpoch !== authEpochRef.current) return;
        serverSyncConnectedRef.current = false;
        setServerSyncConnected(false);
      };
    }

    const pollTimer = setInterval(() => {
      if (streamEpoch !== authEpochRef.current) return;
      pullServerSyncState(false);
    }, 1500);

    return () => {
      clearInterval(pollTimer);
      evtSource?.close();
    };
  }, [currentUser?.username]);

  // Tick timer for Crewmate speech bubbles + 10-minute chat cycle sweep + auto-scroll Lobby Chat while in Lobby
  useEffect(() => {
    if (view !== 'GAME_ARENA' || (gameSubState !== 'LOBBY' && gameSubState !== 'HOST_SPECTATE')) return;
    const runTick = () => {
      const now = Date.now();
      setLobbyNowTick(now);
      const activePin = joinedRoomPin || currentRoomPin;
      const room = activePin ? roomsDbRef.current?.[activePin] : null;
      const chats = Array.isArray(room?.chatMessages) ? room.chatMessages : [];
      if (room && chats.length > 0) {
        const refreshed = normalizeRoomObject(room, activePin, now);
        if (refreshed.chatMessages.length === 0) {
          const lastMsgTs = chats.reduce((maxTs, m) => Math.max(maxTs, Number(m?.createdAt || m?.id) || 0), 0) || now;
          const clearKey = `${activePin}:${lastMsgTs}`;
          setRoomsDb(prev => {
            const curr = prev[activePin];
            if (!curr) return prev;
            return { ...prev, [activePin]: normalizeRoomObject(curr, activePin, now) };
          });
          if (lastAutoClearKeyRef.current !== clearKey) {
            lastAutoClearKeyRef.current = clearKey;
            dispatchSyncAction('CLEAR_LOBBY_CHAT', { pin: activePin, beforeTs: lastMsgTs });
          }
        }
      }
    };
    runTick();
    const t = setInterval(runTick, 1000);
    return () => clearInterval(t);
  }, [view, gameSubState, joinedRoomPin, currentRoomPin]);

  const activeLobbyRoomChatCount = (roomsDb[joinedRoomPin || currentRoomPin]?.chatMessages || []).length;
  useEffect(() => {
    if (view === 'GAME_ARENA' && gameSubState === 'LOBBY' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [view, gameSubState, activeLobbyRoomChatCount]);

  // Keep Teacher inline room draft aligned when selected PIN switches
  useEffect(() => {
    const r = roomsDb[currentRoomPin];
    if (r) {
      setHostRoomDraft({
        pin: r.pin || currentRoomPin,
        name: r.name || `Phòng Từ Vựng #${currentRoomPin}`,
        pass: r.pass ?? 'ielts',
        roundSize: Math.max(2, Math.min(8, Number(r.roundSize) || 4)),
        speedMode: ['relaxed', 'normal', 'turbo'].includes(r.speedMode) ? r.speedMode : 'normal',
        shufflePerPlayer: Boolean(r.shufflePerPlayer),
        maxPlayers: Math.max(2, Math.min(30, Number(r.maxPlayers || 30))),
        teamCount: [2, 3, 4].includes(Math.round(Number(r.teamCount))) ? Math.round(Number(r.teamCount)) : 0
      });
    }
  }, [currentRoomPin]);

  // Persist active navigation view & context so F5 / browser lag restores the exact page
  useEffect(() => {
    if (!currentUser?.username || view === 'AUTH') return;
    saveNavSession(currentUser.username, {
      view,
      previousView,
      selectedTestId,
      selectedAttemptId,
      selectedProfileStudent,
      resultReviewTab,
      skillHubTab,
      speakingPartMode,
      teacherHubTab,
      expandedTeacherTestId,
      currentRoomPin,
      joinedRoomPin,
      gameSubState
    });
  }, [
    currentUser?.username,
    view,
    previousView,
    selectedTestId,
    selectedAttemptId,
    selectedProfileStudent,
    resultReviewTab,
    skillHubTab,
    speakingPartMode,
    teacherHubTab,
    expandedTeacherTestId,
    currentRoomPin,
    joinedRoomPin,
    gameSubState
  ]);

  // Keep latest active exam snapshot in a ref so beforeunload/pagehide always flush the latest tick
  const examDraftSnapshotRef = useRef({ username: null, testId: null, examState: null });
  useEffect(() => {
    examDraftSnapshotRef.current = {
      username: currentUser?.username,
      testId: selectedTestId,
      examState
    };
  });

  // Auto-save active exam progress so refreshing / closing tab won't lose answers
  useEffect(() => {
    if (view !== 'EXAM_MODE' || !selectedTestId) return;
    saveExamDraft(currentUser?.username, selectedTestId, examState);
  }, [view, selectedTestId, examState, currentUser?.username]);

  // Warn before accidental F5 / tab close during active exam & flush latest draft on unload/hide
  useEffect(() => {
    if (view !== 'EXAM_MODE') return;
    const handleBeforeUnload = (e) => {
      const snap = examDraftSnapshotRef.current;
      if (snap.testId && snap.examState) {
        saveExamDraft(snap.username, snap.testId, snap.examState);
      }
      e.preventDefault();
      e.returnValue = '';
    };
    const handlePageHide = () => {
      const snap = examDraftSnapshotRef.current;
      if (snap.testId && snap.examState) {
        saveExamDraft(snap.username, snap.testId, snap.examState);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [view]);

  // Auto-save unfinished Exam Builder draft so F5 doesn't wipe newly authored questions
  useEffect(() => {
    if (view !== 'EXAM_BUILDER' || !currentUser?.username) return;
    saveBuilderDraft(currentUser.username, {
      editingTest,
      builderTab,
      builderListeningIdx,
      builderReadingIdx,
      testForm
    });
  }, [
    view,
    currentUser?.username,
    editingTest,
    builderTab,
    builderListeningIdx,
    builderReadingIdx,
    testForm
  ]);

  // Track live ranking changes (Đua Top up/down indicator) for Teacher Spectate screen
  useEffect(() => {
    if (view !== 'GAME_ARENA' || gameSubState !== 'HOST_SPECTATE') {
      prevLiveRanksRef.current = {};
      return;
    }
    const activePin = joinedRoomPin || currentRoomPin;
    const room = activePin ? normalizeRoomObject(roomsDb[activePin], activePin) : null;
    if (!room) return;

    const entries = Object.values(room.liveMatch || {});
    const sorted = [...entries].sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
      return (a.username || '').localeCompare(b.username || '');
    });

    const nextRanks = {};
    const deltas = {};
    let hasChanges = false;
    sorted.forEach((item, idx) => {
      nextRanks[item.username] = idx;
      const oldRank = prevLiveRanksRef.current[item.username];
      if (typeof oldRank === 'number' && oldRank !== idx) {
        deltas[item.username] = oldRank - idx; // positive = climbed up, negative = dropped down
        hasChanges = true;
      }
    });
    prevLiveRanksRef.current = nextRanks;
    if (hasChanges) {
      setLiveRankDeltas(deltas);
      const clearTimer = setTimeout(() => setLiveRankDeltas({}), 2200);
      return () => clearTimeout(clearTimer);
    }
  }, [view, gameSubState, roomsDb, joinedRoomPin, currentRoomPin]);

  // Synchronized Among Us Lobby -> Countdown -> Start Game watcher
  useEffect(() => {
    const activePin = joinedRoomPin || currentRoomPin;
    const room = activePin ? roomsDb[activePin] : null;
    if (view !== 'GAME_ARENA') return;

    if (room?.status === 'LOBBY') {
      lastLaunchedAtRef.current = null;
    }
    if (gameSubState !== 'LOBBY') return;

    if (!room || room.status === 'ENDED') {
      if (currentUser?.role !== 'teacher' && joinedRoomPin) {
        setJoinedRoomPin(null);
        setGameSubState('JOIN');
        gameRuntimeRef.current.subState = 'JOIN';
        setRoomJoinError('Phòng chơi đã kết thúc hoặc bị đóng bởi giáo viên.');
      }
      return;
    }

    if (
      currentUser?.role !== 'teacher' &&
      joinedRoomPin === activePin &&
      room.status === 'LOBBY' &&
      !room.lobbyPlayers?.[currentUser?.username] &&
      Date.now() - justJoinedLobbyAtRef.current > 2500
    ) {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
      gameRuntimeRef.current.subState = 'JOIN';
      setRoomJoinError('Bạn đã được giáo viên mời ra khỏi sảnh chờ.');
      return;
    }

    const isParticipant =
      currentUser?.role === 'teacher' ||
      joinedRoomPin === activePin ||
      Boolean(room.lobbyPlayers?.[currentUser?.username]);

    if (
      room.status === 'PLAYING' &&
      room.startedAt &&
      lastLaunchedAtRef.current !== room.startedAt &&
      isParticipant
    ) {
      lastLaunchedAtRef.current = room.startedAt;
      clearInterval(lobbyCountdownTimerRef.current);
      setLobbyCountdown(3);
      setGameSubState('COUNTDOWN');
      gameRuntimeRef.current.subState = 'COUNTDOWN';

      let count = 3;
      lobbyCountdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(lobbyCountdownTimerRef.current);
          setLobbyCountdown(null);
          if (currentUser?.role === 'teacher') {
            prevLiveRanksRef.current = {};
            setLiveRankDeltas({});
            setGameSubState('HOST_SPECTATE');
            gameRuntimeRef.current.subState = 'HOST_SPECTATE';
          } else {
            initGameCampaign(activePin, currentUser);
          }
        } else {
          setLobbyCountdown(count);
        }
      }, 900);
    }
  }, [view, gameSubState, roomsDb, joinedRoomPin, currentRoomPin, currentUser]);

  // Handle Toast in Game
  const triggerGameToast = (text, isSuccess) => {
    clearTimeout(gameToastTimerRef.current);
    setGameToast({ text, isSuccess, visible: true });
    gameToastTimerRef.current = setTimeout(() => {
      setGameToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Notification Handlers (Announcements, Class Targets & Auto-Exam Alerts)
  const handleCreateNotification = async ({
    title,
    message,
    type = 'announcement',
    testId = '',
    roomPin = '',
    targetClassIds = [],
    targetUsernames = []
  }) => {
    if (currentUser?.role !== 'teacher') return;
    const cleanTitle = String(title || '').trim();
    const cleanMessage = String(message || '').trim();
    if (!cleanTitle || !cleanMessage) {
      showToast('Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo!', 'error');
      return false;
    }
    const cleanTargetClasses = Array.isArray(targetClassIds)
      ? Array.from(new Set(targetClassIds.map(id => String(id || '').trim()).filter(Boolean)))
      : [];
    const cleanTargetUsers = Array.isArray(targetUsernames)
      ? Array.from(new Set(targetUsernames.map(u => String(u || '').trim()).filter(Boolean)))
      : [];
    await dispatchSyncAction('CREATE_NOTIFICATION', {
      title: cleanTitle,
      message: cleanMessage,
      type,
      testId: testId || '',
      roomPin: roomPin || '',
      targetClassIds: cleanTargetClasses,
      ...(cleanTargetUsers.length > 0 ? { targetUsernames: cleanTargetUsers } : {})
    });
    showToast(
      cleanTargetUsers.length > 0
        ? `Đã gửi nhắc nhở tới ${cleanTargetUsers.length} học viên chưa hoàn thành!`
        : cleanTargetClasses.length > 0
        ? `Đã phát thông báo tới ${cleanTargetClasses.length} lớp học đã chọn!`
        : 'Đã phát thông báo tới toàn bộ học viên!'
    );
    return true;
  };

  const handleNotifyMissingDaily = async (targetTest, missingUsers = []) => {
    if (currentUser?.role !== 'teacher') return false;
    const usernames = Array.from(
      new Set(
        (Array.isArray(missingUsers) ? missingUsers : [])
          .map(u => (typeof u === 'string' ? u : u?.username))
          .filter(Boolean)
      )
    );
    if (usernames.length === 0) {
      showToast('Tất cả học viên trong phạm vi đã hoàn thành bài Speaking Daily!', 'info');
      return false;
    }
    const testTitle = targetTest?.title || 'Speaking Daily hôm nay';
    return handleCreateNotification({
      title: `Nhắc làm Speaking Daily: ${testTitle}`,
      message: `${currentUser.name || 'Giáo viên'} nhắc bạn hoàn thành ngay bài "${testTitle}" (${usernames.length} bạn chưa nộp).`,
      type: 'exercise',
      testId: targetTest?.id || '',
      targetClassIds: [],
      targetUsernames: usernames
    });
  };

  // Class Management Handlers (Create/Edit/Delete Classes & Roster Membership)
  const handleUpsertClass = async (classPayload) => {
    if (currentUser?.role !== 'teacher' || !classPayload?.name) return false;
    const cleanId = String(classPayload.id || `cls_${Date.now()}`).trim();
    const existing = classesDb[cleanId];
    const nextClass = {
      id: cleanId,
      name: String(classPayload.name || '').trim(),
      description: String(classPayload.description || '').trim(),
      color: classPayload.color || existing?.color || 'teal',
      studentUsernames: Array.isArray(classPayload.studentUsernames)
        ? Array.from(new Set(classPayload.studentUsernames.map(u => String(u || '').trim()).filter(Boolean)))
        : (existing?.studentUsernames || []),
      createdBy: existing?.createdBy || currentUser.username,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    setClassesDb(prev => ({ ...prev, [cleanId]: nextClass }));
    await dispatchSyncAction('UPSERT_CLASS', { classObj: nextClass });
    showToast(existing ? `Đã cập nhật lớp "${nextClass.name}"` : `Đã tạo lớp mới "${nextClass.name}"!`);
    return true;
  };

  const handleDeleteClass = async (classId) => {
    if (currentUser?.role !== 'teacher' || !classId || !classesDb[classId]) return false;
    const deletedName = classesDb[classId].name || classId;
    setClassesDb(prev => {
      const next = { ...prev };
      delete next[classId];
      return next;
    });
    setTests(prev =>
      prev.map(t => {
        if (!Array.isArray(t?.assignedClassIds) || !t.assignedClassIds.includes(classId)) return t;
        const remaining = t.assignedClassIds.filter(id => id !== classId);
        return {
          ...t,
          assignedClassIds: remaining,
          visibility: remaining.length === 0 ? 'private' : t.visibility
        };
      })
    );
    await dispatchSyncAction('DELETE_CLASS', { classId });
    showToast(`Đã xóa lớp "${deletedName}".`);
    return true;
  };

  const handleUpdateClassMembers = async (classId, modeOrOpts = 'set', usernamesArg = []) => {
    if (currentUser?.role !== 'teacher' || !classId || !classesDb[classId]) return false;
    const mode =
      typeof modeOrOpts === 'string' && ['add', 'remove', 'set'].includes(modeOrOpts)
        ? modeOrOpts
        : 'set';
    const rawUsernames = Array.isArray(usernamesArg)
      ? usernamesArg
      : Array.isArray(modeOrOpts?.usernames)
      ? modeOrOpts.usernames
      : [];
    const usernames = Array.from(new Set(rawUsernames.map(u => String(u || '').trim()).filter(Boolean)));
    if (usernames.length === 0 && mode !== 'set') return false;

    setClassesDb(prev => {
      const target = prev[classId];
      if (!target) return prev;
      const current = Array.isArray(target.studentUsernames) ? target.studentUsernames : [];
      let nextMembers = current;
      if (mode === 'set') {
        nextMembers = usernames;
      } else if (mode === 'add') {
        nextMembers = Array.from(new Set([...current, ...usernames]));
      } else if (mode === 'remove') {
        const removeLower = new Set(usernames.map(u => u.toLowerCase()));
        nextMembers = current.filter(u => !removeLower.has(String(u).toLowerCase()));
      }
      return {
        ...prev,
        [classId]: { ...target, studentUsernames: nextMembers, updatedAt: Date.now() }
      };
    });
    await dispatchSyncAction('UPDATE_CLASS_MEMBERS', { classId, mode, usernames });
    if (mode === 'add') {
      showToast(`Đã thêm ${usernames.length} học viên vào lớp "${classesDb[classId].name}".`);
    } else if (mode === 'remove') {
      showToast(`Đã kích ${usernames.length} học viên khỏi lớp "${classesDb[classId].name}".`, 'info');
    } else {
      showToast(`Đã cập nhật danh sách học viên lớp "${classesDb[classId].name}".`);
    }
    return true;
  };

  const handleAssignTestClasses = async (testId, assignedClassIds = [], options = {}) => {
    if (currentUser?.role !== 'teacher' || !testId) return false;
    const cleanIds = Array.from(new Set((Array.isArray(assignedClassIds) ? assignedClassIds : []).filter(Boolean)));
    const publish = Boolean(options?.publish);
    const notify = options?.notify !== false;
    const makePrivateIfEmpty = Boolean(options?.makePrivateIfEmpty);
    setTests(prev =>
      prev.map(t =>
        t.id === testId
          ? {
              ...t,
              assignedClassIds: cleanIds,
              ...(publish
                ? { visibility: 'public' }
                : makePrivateIfEmpty && cleanIds.length === 0
                ? { visibility: 'private' }
                : {})
            }
          : t
      )
    );
    await dispatchSyncAction('ASSIGN_TEST_CLASSES', {
      testId,
      assignedClassIds: cleanIds,
      publish,
      notify,
      makePrivateIfEmpty
    });
    if (notify) {
      showToast(
        cleanIds.length > 0
          ? `Đã giao bài tới ${cleanIds.length} lớp học và gửi thông báo tới học viên trong lớp!`
          : 'Đã cập nhật bài thi mở cho toàn bộ học viên!'
      );
    } else {
      showToast('Đã gỡ bài khỏi lớp học.');
    }
    return true;
  };

  const handleMarkNotificationsRead = (notificationId = 'all') => {
    setNotifications(prev =>
      prev.map(n => (notificationId === 'all' || n.id === notificationId ? { ...n, isRead: true } : n))
    );
    dispatchSyncAction('MARK_NOTIFICATIONS_READ', { notificationId });
  };

  const handleDismissNotifications = (modeOrId = 'read') => {
    const cleanMode = String(modeOrId || 'read').trim();
    if (!cleanMode) return;
    setNotifications(prev => {
      if (cleanMode === 'all') return [];
      if (cleanMode === 'read') return prev.filter(n => !n?.isRead);
      return prev.filter(n => n?.id !== cleanMode);
    });
    dispatchSyncAction('DISMISS_NOTIFICATIONS', { notificationId: cleanMode });
    showToast(
      cleanMode === 'read'
        ? 'Đã xóa các thông báo cũ.'
        : cleanMode === 'all'
        ? 'Đã xóa tất cả thông báo.'
        : 'Đã xóa thông báo.'
    );
  };

  const handleDeleteNotification = (notificationId) => {
    if (currentUser?.role !== 'teacher' || !notificationId) return;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    dispatchSyncAction('DELETE_NOTIFICATION', { notificationId });
    showToast('Đã xóa thông báo.');
  };

  const handleOpenNotificationTarget = (notif) => {
    if (!notif) return;
    if (!notif.isRead) {
      handleMarkNotificationsRead(notif.id);
    }
    if (notif.roomPin) {
      setJoinedRoomPin(notif.roomPin);
      setRoomJoinForm(prev => ({ ...prev, pin: notif.roomPin }));
      setGameSubState('JOIN');
      setView('GAME_ARENA');
      return;
    }
    if (notif.testId) {
      const targetTest = tests.find(t => t.id === notif.testId);
      if (targetTest) {
        if (currentUser?.role === 'teacher') {
          setPreviousView('TEACHER_DASHBOARD');
          setTeacherHubTab(targetTest.testMode === 'single_skill' ? 'skill_exercises' : 'tests');
          setExpandedTeacherTestId(targetTest.id);
          setView('TEACHER_DASHBOARD');
        } else {
          setFocusedTestId(targetTest.id);
          const targetCfg = normalizeExamConfig(targetTest);
          if (targetCfg.testMode === 'single_skill') {
            const spMeta = normalizeSpeakingSection(targetTest.speaking);
            const targetTab =
              targetCfg.focusSkill === 'speaking' && spMeta.speakingTrack === 'daily'
                ? 'speaking_daily'
                : targetCfg.focusSkill === 'speaking' && spMeta.speakingTrack === 'exam_room'
                  ? 'speaking_exam_room'
                  : targetCfg.focusSkill === 'speaking' && spMeta.isForecast
                    ? 'forecast'
                    : targetCfg.focusSkill || 'speaking';
            setSkillHubTab(targetTab);
            setView('SKILL_HUB');
          } else {
            setView('HOME');
          }
        }
      } else {
        showToast('Đề thi liên kết với thông báo này hiện không còn khả dụng hoặc đang ẩn.', 'info');
      }
    }
  };

  // Sync Student Game Score & Real-time Race Progress to Leaderboard
  const syncLiveMatchProgress = ({
    scoreVal = 0,
    streakVal = 0,
    livesVal = 3,
    roundNum = 1,
    progressText = 'Đang chơi',
    finished = false,
    outcome = null,
    missedWords = [],
    solveEvent = null
  }) => {
    if (!currentUser || currentUser.role === 'teacher' || gameRuntimeRef.current.isSandbox) return;
    const targetPin = joinedRoomPin || currentRoomPin;
    const roomObj = roomsDb[targetPin];
    const lobbyInfo = roomObj?.lobbyPlayers?.[currentUser.username];
    const clientBaseScore = Math.max(0, Number(scoreVal) - serverBonusTotalRef.current);
    const liveEntry = {
      username: currentUser.username,
      name: currentUser.name || currentUser.username,
      role: 'student',
      colorId: lobbyInfo?.colorId || myCrewColor,
      animalId: lobbyInfo?.animalId || myAnimalId,
      accessoryId: lobbyInfo?.accessoryId || myAccessoryId,
      avatarUrl: currentUser.avatarUrl || '',
      score: scoreVal,
      clientBaseScore,
      streak: streakVal,
      lives: livesVal,
      round: roundNum,
      progressText,
      finished,
      outcome,
      missed: missedWords,
      updatedAt: Date.now()
    };

    setRoomsDb(prev => {
      const room = normalizeRoomObject(prev[targetPin], targetPin);
      const nextLiveMatch = { ...(room.liveMatch || {}), [currentUser.username]: liveEntry };
      const currentPlayers = { ...(room.players || {}) };
      if (scoreVal > 0 || finished) {
        const prevRecord = currentPlayers[currentUser.username];
        const bestScore = prevRecord ? Math.max(prevRecord.score || 0, scoreVal) : scoreVal;
        currentPlayers[currentUser.username] = {
          name: currentUser.name || currentUser.username,
          score: bestScore,
          status: progressText,
          streak: streakVal,
          missed: missedWords,
          updatedAt: new Date().toLocaleTimeString('vi-VN')
        };
      }
      return {
        ...prev,
        [targetPin]: { ...room, liveMatch: nextLiveMatch, players: currentPlayers }
      };
    });

    dispatchSyncAction('UPDATE_LIVE_SCORE', {
      pin: targetPin,
      username: currentUser.username,
      entry: liveEntry,
      ...(solveEvent ? { solveEvent } : {})
    });
  };

  const syncScoreToLeaderboard = (scoreVal, statusStr, streakVal, missedWords) => {
    if (!currentUser) return;
    const targetPin = joinedRoomPin || currentRoomPin;
    const nextRecord = {
      name: currentUser.name || currentUser.username,
      score: scoreVal,
      status: statusStr,
      streak: streakVal,
      missed: missedWords,
      updatedAt: new Date().toLocaleTimeString('vi-VN')
    };

    setRoomsDb(prev => {
      const room = normalizeRoomObject(prev[targetPin], targetPin);
      const currentPlayers = { ...(room.players || {}) };
      const prevRecord = currentPlayers[currentUser.username];
      const bestScore = prevRecord ? Math.max(prevRecord.score || 0, scoreVal) : scoreVal;
      currentPlayers[currentUser.username] = { ...nextRecord, score: bestScore };
      return { ...prev, [targetPin]: { ...room, players: currentPlayers } };
    });

    dispatchSyncAction('UPDATE_SCORE', { pin: targetPin, username: currentUser.username, record: nextRecord });
  };

  // Update Account Avatar & propagate to Lobby Character
  const handleUpdateUserAvatar = async (newAvatarUrl) => {
    if (!currentUser) return false;
    const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl || '' };
    const nextColor = newAvatarUrl
      ? 'avatar'
      : (myCrewColor === 'avatar' ? 'cyan' : myCrewColor);
    const activePin = joinedRoomPin || currentRoomPin;

    const snap = await dispatchSyncAction('UPSERT_USER', { username: currentUser.username, user: updatedUser });
    if (!snap && lastSyncRejectionStatusRef.current > 0) {
      await pullServerSyncState(true);
      return false;
    }

    if (!snap) {
      currentUserRef.current = updatedUser;
      setCurrentUser(updatedUser);
      setUsersDb(prev => ({ ...prev, [currentUser.username]: updatedUser }));
    }
    setMyCrewColor(nextColor);

    setRoomsDb(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([pin, r]) => {
        const nr = normalizeRoomObject(r, pin);
        if (nr.lobbyPlayers?.[currentUser.username]) {
          nr.lobbyPlayers = {
            ...nr.lobbyPlayers,
            [currentUser.username]: {
              ...nr.lobbyPlayers[currentUser.username],
              avatarUrl: newAvatarUrl || '',
              colorId: pin === activePin ? nextColor : nr.lobbyPlayers[currentUser.username].colorId
            }
          };
          next[pin] = nr;
        }
      });
      return next;
    });

    if (activePin && roomsDb[activePin]?.lobbyPlayers?.[currentUser.username]) {
      await dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
        pin: activePin,
        username: currentUser.username,
        patch: { avatarUrl: newAvatarUrl || '', colorId: nextColor }
      });
    }
    if (!snap && !serverSyncConnectedRef.current) {
      showToast('Không kết nối được server - Avatar chỉ mới lưu tạm trên máy này.', 'error');
      return false;
    }
    showToast(
      newAvatarUrl
        ? (isAnimatedDataUrl(newAvatarUrl)
            ? '✨ Đã lưu Ảnh Avatar Động VIP & bật chế độ Mặt Avatar!'
            : 'Đã lưu Avatar lên hệ thống & bật chế độ Mặt Avatar!')
        : 'Đã gỡ ảnh Avatar tài khoản.'
    );
    return true;
  };

  // Lobby & Room Flow Actions
  const buildLobbyPlayerEntry = (user, overrides = {}) => ({
    username: user.username,
    name: user.name || user.username,
    role: user.role,
    colorId: overrides.colorId ?? (user.avatarUrl && myCrewColor === 'avatar' ? 'avatar' : myCrewColor),
    animalId: overrides.animalId ?? myAnimalId,
    accessoryId: overrides.accessoryId ?? myAccessoryId,
    avatarUrl: overrides.avatarUrl ?? user.avatarUrl ?? '',
    ready: overrides.ready ?? (user.role === 'teacher'),
    ...(overrides.approved !== undefined ? { approved: Boolean(overrides.approved) } : {}),
    ...(overrides.teamId ? { teamId: overrides.teamId } : {}),
    ...(Number(user.aieoVipExpiresAt) > 0 ? { aieoVipExpiresAt: Number(user.aieoVipExpiresAt) } : {}),
    ...(user.vipRedNameEnabled !== undefined ? { vipRedNameEnabled: Boolean(user.vipRedNameEnabled) } : {}),
    ...(user.vipNameColor ? { vipNameColor: normalizeVipNameColor(user.vipNameColor) } : {}),
    ...(user.vipTagEnabled !== undefined ? { vipTagEnabled: Boolean(user.vipTagEnabled) } : {}),
    ...(user.vipNeonCoverEnabled !== undefined ? { vipNeonCoverEnabled: Boolean(user.vipNeonCoverEnabled) } : {}),
    ...(user.vipNeonCoverColor ? { vipNeonCoverColor: normalizeVipNeonCoverColor(user.vipNeonCoverColor) } : {}),
    ...(user.isSuperAdmin ? { isSuperAdmin: true } : {}),
    chat: '',
    chatAt: 0,
    joinedAt: Date.now()
  });

  const openStudentGamePortal = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    setRoomJoinError('');

    if (currentUser?.role === 'teacher') {
      handleTeacherOpenLobby(currentRoomPin);
      return;
    }

    const activeRoom = joinedRoomPin ? roomsDb[joinedRoomPin] : null;
    const isAlreadyInLobby =
      activeRoom &&
      activeRoom.status === 'LOBBY' &&
      Boolean(activeRoom.lobbyPlayers?.[currentUser?.username]);

    if (isAlreadyInLobby) {
      setGameSubState('LOBBY');
      gameRuntimeRef.current.subState = 'LOBBY';
    } else {
      setJoinedRoomPin(null);
      setGameSubState('JOIN');
      gameRuntimeRef.current.subState = 'JOIN';
    }
    setView('GAME_ARENA');
    pullServerSyncState(true);
  };

  const handleStudentJoinRoom = async (e) => {
    if (e) e.preventDefault();
    const cleanPin = (roomJoinForm.pin || '').trim();
    const cleanPass = (roomJoinForm.pass || '').trim();

    if (!cleanPin) {
      setRoomJoinError('Vui lòng nhập Mã Phòng (PIN) do giáo viên cung cấp.');
      return;
    }

    const pilotPrefs = {
      colorId: myCrewColor,
      animalId: myAnimalId,
      accessoryId: myAccessoryId
    };

    try {
      const res = await fetch('/api/sync/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, pass: cleanPass, pilot: pilotPrefs })
      });
      serverSyncConnectedRef.current = true;
      setServerSyncConnected(true);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          authEpochRef.current += 1;
          currentUserRef.current = null;
          setCurrentUser(null);
          setView('AUTH');
        }
        setRoomJoinError(data?.error || 'Không thể tham gia phòng đấu lúc này.');
        return;
      }
      if (data?.snapshot) {
        applyRemoteSnapshotData.current?.(data.snapshot);
      }
      const joinedRoom = data?.room ? normalizeRoomObject(data.room, cleanPin) : null;
      setRoomJoinError('');
      setCurrentRoomPin(cleanPin);
      setJoinedRoomPin(cleanPin);
      lastLaunchedAtRef.current = joinedRoom?.startedAt || null;
      justJoinedLobbyAtRef.current = Date.now();
      setLobbyChatInput('');
      setGameSubState('LOBBY');
      gameRuntimeRef.current.subState = 'LOBBY';
      setView('GAME_ARENA');
      return;
    } catch (_offlineErr) {
      serverSyncConnectedRef.current = false;
      setServerSyncConnected(false);
    }

    // Offline fallback only when backend relay is unreachable
    const targetRoom = roomsDb[cleanPin] ? normalizeRoomObject(roomsDb[cleanPin], cleanPin) : null;
    if (!targetRoom) {
      setRoomJoinError(`Không tìm thấy phòng "${cleanPin}". Hãy kiểm tra lại mã phòng.`);
      return;
    }
    if (targetRoom.status === 'ENDED') {
      setRoomJoinError('Phòng đấu này đã kết thúc. Vui lòng xin mã phòng mới.');
      return;
    }
    if (targetRoom.pass && (targetRoom.pass || '').trim() !== cleanPass) {
      setRoomJoinError('Mật khẩu phòng không chính xác. Vui lòng thử lại.');
      return;
    }
    const alreadyJoined = Boolean(targetRoom.lobbyPlayers?.[currentUser?.username]);
    if (targetRoom.status === 'PLAYING' && !alreadyJoined) {
      setRoomJoinError('Trận đấu đang diễn ra! Hãy bảo Giáo viên bấm "Mở Sảnh Mới" hoặc "Bắt đầu ván mới" để bạn vào sảnh chờ.');
      return;
    }
    const maxCap = Math.max(2, Math.min(30, Number(targetRoom.maxPlayers || 30)));
    const participantCount = Object.values(targetRoom.lobbyPlayers || {}).filter(
      p => targetRoom.roomMode === 'friend_vip' || p.role !== 'teacher'
    ).length;
    if (!alreadyJoined && participantCount >= maxCap) {
      setRoomJoinError(`Phòng đã đủ tối đa ${maxCap}/${maxCap} người chơi!`);
      return;
    }

    setRoomJoinError('');
    setCurrentRoomPin(cleanPin);
    setJoinedRoomPin(cleanPin);
    lastLaunchedAtRef.current = targetRoom.startedAt || null;

    const existingTeamId = targetRoom.lobbyPlayers?.[currentUser?.username]?.teamId;
    const assignedTeamId = targetRoom.teamCount >= 2
      ? (getActiveTeamIds(targetRoom.teamCount).includes(existingTeamId)
        ? existingTeamId
        : pickBalancedTeamId(targetRoom.lobbyPlayers, targetRoom.teamCount, targetRoom.roomMode, currentUser?.username))
      : '';

    const studentEntry = buildLobbyPlayerEntry(currentUser, {
      ready: false,
      approved: targetRoom.roomMode === 'friend_vip',
      teamId: assignedTeamId
    });
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[cleanPin] || targetRoom, cleanPin);
      return {
        ...prev,
        [cleanPin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: studentEntry
          }
        }
      };
    });

    justJoinedLobbyAtRef.current = Date.now();
    setLobbyChatInput('');
    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    setView('GAME_ARENA');
  };

  const handleTeacherOpenLobby = (pin = currentRoomPin) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);

    const targetPin = pin || currentRoomPin;
    setCurrentRoomPin(targetPin);
    setJoinedRoomPin(targetPin);

    const baseRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const hasStudentsWaiting = Object.values(baseRoom.lobbyPlayers || {}).some(p => p.role !== 'teacher');
    // Auto-reopen room to LOBBY if an old match ended or nobody was waiting inside an old PLAYING session
    const nextStatus = baseRoom.status === 'ENDED' || (baseRoom.status === 'PLAYING' && !hasStudentsWaiting) ? 'LOBBY' : baseRoom.status;
    const nextStartedAt = nextStatus === 'LOBBY' ? null : baseRoom.startedAt;
    lastLaunchedAtRef.current = nextStartedAt;

    setHostRoomDraft({
      pin: baseRoom.pin,
      name: baseRoom.name,
      pass: baseRoom.pass,
      roundSize: baseRoom.roundSize || 4,
      speedMode: baseRoom.speedMode || 'normal',
      shufflePerPlayer: Boolean(baseRoom.shufflePerPlayer),
      maxPlayers: baseRoom.maxPlayers || 30,
      teamCount: baseRoom.teamCount || 0
    });

    const isTeacherHost = currentUser?.role === 'teacher';
    const existingHostTeam = baseRoom.lobbyPlayers?.[currentUser?.username]?.teamId;
    const hostTeamId = !isTeacherHost && baseRoom.teamCount >= 2
      ? (getActiveTeamIds(baseRoom.teamCount).includes(existingHostTeam)
        ? existingHostTeam
        : pickBalancedTeamId(baseRoom.lobbyPlayers, baseRoom.teamCount, baseRoom.roomMode, currentUser?.username))
      : '';
    const teacherEntry = buildLobbyPlayerEntry(currentUser, {
      name: currentUser?.name || (isTeacherHost ? 'Giáo viên' : currentUser?.username),
      role: isTeacherHost ? 'teacher' : 'student',
      ready: true,
      approved: true,
      teamId: hostTeamId
    });

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      return {
        ...prev,
        [targetPin]: {
          ...r,
          status: nextStatus,
          startedAt: nextStartedAt,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: teacherEntry
          }
        }
      };
    });

    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    setView('GAME_ARENA');

    if (nextStatus === 'LOBBY' && baseRoom.status !== 'LOBBY') {
      dispatchSyncAction('RESET_LOBBY', { pin: targetPin });
    }
    dispatchSyncAction('JOIN_LOBBY', { pin: targetPin, player: teacherEntry });
  };

  const handleSaveHostRoomSettings = (e) => {
    if (e) e.preventDefault();
    const oldPin = joinedRoomPin || currentRoomPin;
    const newPin = (hostRoomDraft.pin || '').trim() || oldPin;
    const newName = (hostRoomDraft.name || '').trim() || `Phòng Từ Vựng #${newPin}`;
    const newPass = (hostRoomDraft.pass || '').trim() || 'ielts';
    const cleanRoundSize = Math.max(2, Math.min(8, Number(hostRoomDraft.roundSize) || 4));
    const cleanSpeedMode = ['relaxed', 'normal', 'turbo'].includes(hostRoomDraft.speedMode) ? hostRoomDraft.speedMode : 'normal';
    const cleanShufflePerPlayer = Boolean(hostRoomDraft.shufflePerPlayer);
    const cleanMaxPlayers = Math.max(2, Math.min(30, Number(hostRoomDraft.maxPlayers || 30)));
    const rawTeamCount = Number(hostRoomDraft.teamCount || 0);
    const cleanTeamCount =
      [2, 3, 4].includes(rawTeamCount) && rawTeamCount <= cleanMaxPlayers
        ? rawTeamCount
        : rawTeamCount > cleanMaxPlayers && cleanMaxPlayers >= 2
        ? 2
        : 0;

    if (newPin !== oldPin && roomsDb[newPin]) {
      showToast(`Mã phòng "${newPin}" đã tồn tại - hãy chọn mã PIN khác hoặc bấm chọn phòng đó!`, 'error');
      return;
    }

    const teamIds = getActiveTeamIds(cleanTeamCount);
    setRoomsDb(prev => {
      const source = normalizeRoomObject(prev[oldPin], oldPin);
      const nextLobby = { ...(source.lobbyPlayers || {}) };
      let teamAssignCursor = 0;
      Object.keys(nextLobby).forEach(uname => {
        const entry = nextLobby[uname];
        if (!entry) return;
        const participates = source.roomMode === 'friend_vip' || entry.role !== 'teacher';
        if (teamIds.length >= 2 && participates) {
          const keepValid = teamIds.includes(entry.teamId);
          nextLobby[uname] = {
            ...entry,
            teamId: keepValid ? entry.teamId : teamIds[teamAssignCursor++ % teamIds.length]
          };
        } else {
          nextLobby[uname] = { ...entry, teamId: '' };
        }
      });
      const updatedRoom = normalizeRoomObject(
        {
          ...source,
          pin: newPin,
          name: newName,
          pass: newPass,
          roundSize: cleanRoundSize,
          speedMode: cleanSpeedMode,
          shufflePerPlayer: cleanShufflePerPlayer,
          maxPlayers: cleanMaxPlayers,
          teamCount: cleanTeamCount,
          lobbyPlayers: nextLobby
        },
        newPin
      );
      const next = { ...prev, [newPin]: updatedRoom };
      if (oldPin !== newPin) {
        delete next[oldPin];
      }
      return next;
    });

    setCurrentRoomPin(newPin);
    setJoinedRoomPin(newPin);
    setHostRoomDraft({
      pin: newPin,
      name: newName,
      pass: newPass,
      roundSize: cleanRoundSize,
      speedMode: cleanSpeedMode,
      shufflePerPlayer: cleanShufflePerPlayer,
      maxPlayers: cleanMaxPlayers,
      teamCount: cleanTeamCount
    });

    dispatchSyncAction('UPSERT_ROOM', {
      pin: newPin,
      oldPin: oldPin !== newPin ? oldPin : undefined,
      updates: {
        name: newName,
        pass: newPass,
        roundSize: cleanRoundSize,
        speedMode: cleanSpeedMode,
        shufflePerPlayer: cleanShufflePerPlayer,
        maxPlayers: cleanMaxPlayers,
        teamCount: cleanTeamCount
      }
    });
    showToast(
      `Đã cập nhật phòng "${newName}" (${cleanMaxPlayers} người · ${
        cleanTeamCount >= 2 ? `${cleanTeamCount} Team` : 'Đấu Đơn'
      } • ${cleanRoundSize} từ/vòng)!`
    );
  };

  const handleSetPlayerTeam = (pin = currentRoomPin, targetUsername = '', teamId = '') => {
    const targetPin = pin || joinedRoomPin || currentRoomPin;
    const uname = String(targetUsername || currentUser?.username || '').trim();
    if (!targetPin || !uname) return;
    const sourceRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const activeIds = getActiveTeamIds(sourceRoom.teamCount || 0);
    if (!activeIds.includes(teamId)) return;

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      if (!r.lobbyPlayers?.[uname]) return prev;
      return {
        ...prev,
        [targetPin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [uname]: { ...r.lobbyPlayers[uname], teamId }
          },
          ...(r.liveMatch?.[uname]
            ? {
                liveMatch: {
                  ...r.liveMatch,
                  [uname]: { ...r.liveMatch[uname], teamId }
                }
              }
            : {})
        }
      };
    });
    dispatchSyncAction('SET_PLAYER_TEAM', { pin: targetPin, username: uname, teamId });
  };

  const handleShuffleRoomTeams = (pin = currentRoomPin) => {
    const targetPin = pin || joinedRoomPin || currentRoomPin;
    if (!targetPin) return;
    const sourceRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const activeIds = getActiveTeamIds(sourceRoom.teamCount || 0);
    if (activeIds.length < 2) {
      showToast('Hãy bật Chế độ chia Team (2–4 Team) trước khi chia ngẫu nhiên!', 'info');
      return;
    }

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      const participants = Object.values(r.lobbyPlayers || {}).filter(
        lp => r.roomMode === 'friend_vip' || lp.role !== 'teacher'
      );
      const shuffled = [...participants];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const nextLobby = { ...(r.lobbyPlayers || {}) };
      shuffled.forEach((lp, idx) => {
        if (nextLobby[lp.username]) {
          nextLobby[lp.username] = { ...nextLobby[lp.username], teamId: activeIds[idx % activeIds.length] };
        }
      });
      return {
        ...prev,
        [targetPin]: { ...r, lobbyPlayers: nextLobby }
      };
    });
    dispatchSyncAction('SHUFFLE_ROOM_TEAMS', { pin: targetPin });
    showToast(`Đã chia ngẫu nhiên cân bằng vào ${activeIds.length} Team!`);
  };

  const handleTeacherResetLobby = (pin = currentRoomPin) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    lastLaunchedAtRef.current = null;
    prevLiveRanksRef.current = {};
    setLiveRankDeltas({});

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[pin], pin);
      return {
        ...prev,
        [pin]: {
          ...r,
          status: 'LOBBY',
          startedAt: null,
          liveMatch: {}
        }
      };
    });
    setGameSubState('LOBBY');
    gameRuntimeRef.current.subState = 'LOBBY';
    dispatchSyncAction('RESET_LOBBY', { pin });
    showToast(`Đã mở lại Sảnh Chờ cho phòng ${pin}! Học sinh có thể vào sảnh ngay.`);
  };

  const handleTeacherApproveLobbyPlayer = (pin = currentRoomPin, targetUsername = '', approveAll = false) => {
    if (currentUser?.role !== 'teacher') return;
    const targetPin = pin || currentRoomPin;
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      const nextLobby = { ...(r.lobbyPlayers || {}) };
      if (approveAll) {
        Object.keys(nextLobby).forEach(uname => {
          if (nextLobby[uname] && nextLobby[uname].role !== 'teacher') {
            nextLobby[uname] = { ...nextLobby[uname], approved: true, ready: true };
          }
        });
      } else if (targetUsername && nextLobby[targetUsername]) {
        const nextVal = !(nextLobby[targetUsername].approved ?? nextLobby[targetUsername].ready);
        nextLobby[targetUsername] = { ...nextLobby[targetUsername], approved: nextVal, ready: nextVal };
      }
      return {
        ...prev,
        [targetPin]: { ...r, lobbyPlayers: nextLobby }
      };
    });
    const currentRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const currentApproved = targetUsername
      ? !(currentRoom.lobbyPlayers?.[targetUsername]?.approved ?? currentRoom.lobbyPlayers?.[targetUsername]?.ready)
      : true;
    dispatchSyncAction('APPROVE_LOBBY_PLAYER', {
      pin: targetPin,
      username: targetUsername,
      approveAll,
      approved: approveAll ? true : currentApproved
    });
    showToast(approveAll ? 'Đã duyệt tất cả học viên vào trận Thực Chiến Live!' : `Đã cập nhật trạng thái duyệt cho @${targetUsername}.`);
  };

  const handleTeacherStartLobbyGame = (pin = currentRoomPin) => {
    const targetPin = pin || currentRoomPin;
    const targetRoom = normalizeRoomObject(roomsDb[targetPin], targetPin);
    const waitingStudents = Object.values(targetRoom.lobbyPlayers || {}).filter(p => p.role !== 'teacher');

    if (waitingStudents.length === 0) {
      showToast('Chưa có học sinh nào trong sảnh! Bạn chỉ có thể bấm "Chơi Thử GV" khi phòng trống.', 'info');
      return;
    }

    const launchTs = Date.now();
    const freshLive = {};
    waitingStudents.forEach(lp => {
      freshLive[lp.username] = {
        username: lp.username,
        name: lp.name || lp.username,
        role: 'student',
        teamId: lp.teamId || '',
        colorId: lp.colorId || 'cyan',
        avatarUrl: lp.avatarUrl || usersDb[lp.username]?.avatarUrl || '',
        score: 0,
        streak: 0,
        lives: 3,
        round: 1,
        progressText: 'Đang vào Vòng 1',
        finished: false,
        outcome: null,
        updatedAt: launchTs
      };
    });

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[targetPin], targetPin);
      return {
        ...prev,
        [targetPin]: {
          ...r,
          status: 'PLAYING',
          startedAt: launchTs,
          questionSolves: {},
          liveMatch: freshLive
        }
      };
    });
    dispatchSyncAction('START_GAME', {
      pin: targetPin,
      startedAt: launchTs,
      shufflePerPlayer: Boolean(targetRoom.shufflePerPlayer)
    });
  };

  const handleLeaveGameLobby = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    const activePin = joinedRoomPin || currentRoomPin;
    if (activePin && currentUser) {
      setRoomsDb(prev => {
        const r = prev[activePin];
        if (!r) return prev;
        const nextLobby = { ...(r.lobbyPlayers || {}) };
        delete nextLobby[currentUser.username];
        return {
          ...prev,
          [activePin]: { ...r, lobbyPlayers: nextLobby }
        };
      });
      dispatchSyncAction('LEAVE_LOBBY', { pin: activePin, username: currentUser.username });
    }
    setJoinedRoomPin(null);
    setGameSubState('JOIN');
    gameRuntimeRef.current.subState = 'JOIN';
    setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
  };

  const updateLobbyPilotCustomization = (patch) => {
    const activePin = joinedRoomPin || currentRoomPin;
    if (!activePin || !currentUser) return;
    const avatarUrl = currentUser.avatarUrl || '';
    const fullPatch = { ...patch, avatarUrl };
    const fallbackPlayer = buildLobbyPlayerEntry(currentUser, fullPatch);
    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[activePin], activePin);
      const currPlayer = r.lobbyPlayers?.[currentUser.username] || fallbackPlayer;
      return {
        ...prev,
        [activePin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: { ...currPlayer, ...fullPatch }
          }
        }
      };
    });
    dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
      pin: activePin,
      username: currentUser.username,
      patch: fullPatch,
      fallbackPlayer
    });
  };

  const handleChangeCrewColor = (colorId) => {
    if (colorId === 'avatar' && !currentUser?.avatarUrl) {
      setShowAvatarModal(true);
      showToast('Hãy tải lên ảnh Avatar trước để dùng làm mặt nhân vật!', 'info');
      return;
    }
    setMyCrewColor(colorId);
    updateLobbyPilotCustomization({ colorId });
  };

  const handleChangeAnimal = (animalId) => {
    setMyAnimalId(animalId);
    updateLobbyPilotCustomization({ animalId });
  };

  const handleChangeAccessory = (accessoryId) => {
    setMyAccessoryId(accessoryId);
    updateLobbyPilotCustomization({ accessoryId });
  };

  const handleToggleLobbyReady = () => {
    const activePin = joinedRoomPin || currentRoomPin;
    if (!activePin || !currentUser) return;
    const currentRoom = normalizeRoomObject(roomsDb[activePin], activePin);
    const me = currentRoom.lobbyPlayers?.[currentUser.username] || buildLobbyPlayerEntry(currentUser, { ready: false });
    const nextReady = !me.ready;

    setRoomsDb(prev => {
      const r = normalizeRoomObject(prev[activePin], activePin);
      const curr = r.lobbyPlayers?.[currentUser.username] || me;
      return {
        ...prev,
        [activePin]: {
          ...r,
          lobbyPlayers: {
            ...r.lobbyPlayers,
            [currentUser.username]: { ...curr, ready: nextReady }
          }
        }
      };
    });
    dispatchSyncAction('UPDATE_LOBBY_PLAYER', {
      pin: activePin,
      username: currentUser.username,
      patch: { ready: nextReady },
      fallbackPlayer: { ...me, ready: nextReady }
    });
  };

  const handleSendLobbyChat = (text) => {
    const activePin = joinedRoomPin || currentRoomPin;
    const cleanText = (text || '').trim();
    if (!activePin || !currentUser || !cleanText) return;

    const now = Date.now();
    const msgId = now + Math.floor(Math.random() * 1000);
    const currentRoom = normalizeRoomObject(roomsDb[activePin], activePin, now);
    const me = currentRoom.lobbyPlayers?.[currentUser.username] || buildLobbyPlayerEntry(currentUser);
    const chatMessage = {
      id: msgId,
      username: currentUser.username,
      name: currentUser.name || currentUser.username,
      role: currentUser.role,
      colorId: me.colorId || myCrewColor,
      animalId: me.animalId || myAnimalId,
      accessoryId: me.accessoryId || myAccessoryId,
      text: cleanText,
      createdAt: now,
      timeStr: new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setRoomsDb(prev => {
      const base = normalizeRoomObject(prev[activePin], activePin, now);
      const pruned = pruneExpiredRoomChat(base, now);
      const curr = pruned.lobbyPlayers?.[currentUser.username] || me;
      const prevChats = pruned.chatMessages;
      const cycleStart = prevChats.length === 0 || !pruned.chatCycleStartedAt ? now : pruned.chatCycleStartedAt;
      return {
        ...prev,
        [activePin]: {
          ...base,
          chatMessages: [...prevChats, chatMessage].slice(-50),
          chatCycleStartedAt: cycleStart,
          lobbyPlayers: {
            ...pruned.lobbyPlayers,
            [currentUser.username]: { ...curr, chat: cleanText, chatAt: msgId }
          }
        }
      };
    });

    dispatchSyncAction('SEND_LOBBY_CHAT', {
      pin: activePin,
      message: chatMessage,
      fallbackPlayer: me
    });
  };

  const handleClearLobbyChatNow = (pinOverride) => {
    const targetPin = String(pinOverride || joinedRoomPin || currentRoomPin || '').trim();
    if (!targetPin) return;
    setRoomsDb(prev => {
      const base = normalizeRoomObject(prev[targetPin], targetPin);
      const clearedPlayers = {};
      Object.entries(base.lobbyPlayers || {}).forEach(([uname, p]) => {
        clearedPlayers[uname] = p ? { ...p, chat: '', chatAt: null } : p;
      });
      return {
        ...prev,
        [targetPin]: {
          ...base,
          chatMessages: [],
          chatCycleStartedAt: null,
          lobbyPlayers: clearedPlayers
        }
      };
    });
    dispatchSyncAction('CLEAR_LOBBY_CHAT', { pin: targetPin });
    showToast('Đã xóa trắng toàn bộ khung chat phòng chờ!', 'success');
  };

  const handleSaveCustomVocabTopic = ({ label, text }) => {
    const cleanLabel = String(label || '').trim();
    const cleanText = String(text || '').trim();
    if (!cleanLabel) {
      showToast('Vui lòng nhập tên chủ đề từ vựng mới!', 'error');
      return false;
    }
    const parsedWords = parseRawVocabText(cleanText);
    if (parsedWords.length === 0) {
      showToast('Nội dung chủ đề cần ít nhất 1 dòng từ vựng hợp lệ (TỪ | Nghĩa tiếng Việt | /IPA/ | Ví dụ)!', 'error');
      return false;
    }
    const existing = customVocabTopics.find(
      t => t.label.trim().toLowerCase() === cleanLabel.toLowerCase()
    );
    const topic = {
      id: existing?.id || `topic_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      label: cleanLabel,
      text: cleanText,
      updatedAt: Date.now(),
      createdAt: existing?.createdAt || Date.now()
    };
    setCustomVocabTopics(prev => {
      const idx = prev.findIndex(t => t.id === topic.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = topic;
        return next;
      }
      return [...prev, topic];
    });
    dispatchSyncAction('UPSERT_VOCAB_TOPIC', { topic });
    showToast(`Đã lưu chủ đề "${cleanLabel}" (${parsedWords.length} từ) và nạp vào bộ từ!`, 'success');
    return true;
  };

  const handleDeleteCustomVocabTopic = (topic) => {
    if (!topic?.id) return;
    setCustomVocabTopics(prev => prev.filter(t => t.id !== topic.id));
    dispatchSyncAction('DELETE_VOCAB_TOPIC', { topicId: topic.id });
    showToast(`Đã xóa chủ đề "${topic.label}".`, 'info');
  };

  const openMemberProfile = (username, fromView = view) => {
    const isSupportAdminTarget = Boolean(username && supportAdminProfile?.username && username === supportAdminProfile.username);
    const candidateUser = usersDb[username];
    const canSeeTarget = isSupportAdminTarget || (candidateUser && canViewerSeeMember(candidateUser, currentUser, classesDb));
    const targetUsername = canSeeTarget
      ? username
      : (currentUser?.username || Object.keys(usersDb || {})[0] || '');
    if (!targetUsername) return;
    if (fromView && fromView !== 'STUDENT_PROFILE') {
      setPreviousView(fromView);
    }
    setSelectedProfileStudent(targetUsername);
    setView('STUDENT_PROFILE');
  };

  const handleCreateRoom = (e) => {
    if (e) e.preventDefault();
    const generatedPin = (newRoomForm.pin || '').trim() || String(Math.floor(100000 + Math.random() * 900000));
    const cleanPass = (newRoomForm.pass || '').trim() || 'ielts';
    const cleanName = (newRoomForm.name || '').trim() || `Phòng Từ Vựng #${generatedPin}`;

    if (roomsDb[generatedPin] && roomsDb[generatedPin].status !== 'ENDED') {
      showToast(`Mã phòng ${generatedPin} đang tồn tại. Vui lòng chọn mã phòng khác.`, 'error');
      return;
    }

    const isTeacherCreator = currentUser?.role === 'teacher';
    if (!isTeacherCreator && !canCreateFriendRoomNow(currentUser)) {
      setShowCreateRoomModal(false);
      openGlobalCheckoutModal({ itemType: 'room_ticket' });
      return;
    }
    const consumesRoomTicket = !isTeacherCreator && !hasVipFriendRoomAccess(currentUser) && getFriendRoomTicketCredits(currentUser) > 0;
    const cleanMaxPlayers = Math.max(2, Math.min(30, Number(newRoomForm.maxPlayers || (isTeacherCreator ? 30 : 4))));
    const rawTeamCount = Number(newRoomForm.teamCount || 0);
    const cleanTeamCount =
      [2, 3, 4].includes(rawTeamCount) && rawTeamCount <= cleanMaxPlayers
        ? rawTeamCount
        : rawTeamCount > cleanMaxPlayers && cleanMaxPlayers >= 2
        ? 2
        : 0;
    const selectedPresetVocab =
      newRoomForm.topicPreset && newRoomForm.topicPreset !== 'core' && VOCAB_PRESETS?.[newRoomForm.topicPreset]?.text
        ? VOCAB_PRESETS[newRoomForm.topicPreset].text
        : DEFAULT_VOCAB_TEXT;

    const teacherEntry = currentUser
      ? buildLobbyPlayerEntry(currentUser, {
          name: currentUser.name || (isTeacherCreator ? 'Giáo viên' : currentUser.username),
          role: isTeacherCreator ? 'teacher' : 'student',
          ready: true,
          approved: true,
          teamId: cleanTeamCount >= 2 && !isTeacherCreator ? 'A' : ''
        })
      : null;

    const newRoomObj = {
      pin: generatedPin,
      name: cleanName,
      pass: cleanPass,
      teacher: currentUser?.username || 'teacher_ielts',
      roomMode: isTeacherCreator ? 'teacher_live' : 'friend_vip',
      hostUsername: currentUser?.username || '',
      hostName: currentUser?.name || currentUser?.username || '',
      status: 'LOBBY',
      maxPlayers: cleanMaxPlayers,
      teamCount: cleanTeamCount,
      roundSize: Math.max(2, Math.min(8, Number(newRoomForm.roundSize) || 4)),
      speedMode: ['relaxed', 'normal', 'turbo'].includes(newRoomForm.speedMode) ? newRoomForm.speedMode : 'normal',
      shufflePerPlayer: Boolean(newRoomForm.shufflePerPlayer),
      startedAt: null,
      lobbyPlayers: teacherEntry ? { [currentUser.username]: teacherEntry } : {},
      questionSolves: {},
      chatMessages: [],
      rawVocab: selectedPresetVocab,
      players: {}
    };

    setRoomsDb(prev => ({
      ...prev,
      [generatedPin]: newRoomObj
    }));
    setCurrentRoomPin(generatedPin);
    setJoinedRoomPin(generatedPin);
    setHostRoomDraft({
      pin: generatedPin,
      name: cleanName,
      pass: cleanPass,
      roundSize: newRoomObj.roundSize,
      speedMode: newRoomObj.speedMode,
      shufflePerPlayer: newRoomObj.shufflePerPlayer,
      maxPlayers: cleanMaxPlayers,
      teamCount: cleanTeamCount
    });
    setShowCreateRoomModal(false);
    setNewRoomForm({ pin: '', pass: 'ielts', name: 'Phòng Đấu Từ Vựng Mới', roundSize: 4, speedMode: 'normal', shufflePerPlayer: false, topicPreset: 'core', maxPlayers: 4, teamCount: 2 });

    if (consumesRoomTicket && currentUser?.username) {
      const nextCredits = Math.max(0, getFriendRoomTicketCredits(currentUser) - 1);
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, roomCreateCredits: nextCredits };
        currentUserRef.current = updated;
        return updated;
      });
      setUsersDb(prev => {
        const u = prev[currentUser.username];
        if (!u) return prev;
        return { ...prev, [currentUser.username]: { ...u, roomCreateCredits: nextCredits } };
      });
    }

    dispatchSyncAction('UPSERT_ROOM', { pin: generatedPin, updates: newRoomObj });
    showToast(`Đã tạo phòng "${cleanName}" (PIN: ${generatedPin} · ${cleanMaxPlayers} người${cleanTeamCount >= 2 ? ` · ${cleanTeamCount} Team` : ''})!`);

    if (isTeacherCreator || newRoomObj.roomMode === 'friend_vip') {
      setGameSubState('LOBBY');
      gameRuntimeRef.current.subState = 'LOBBY';
      setView('GAME_ARENA');
    }
  };

  // ==========================================
  // STEALTH ANTI-CHEAT, RIGHT-CLICK LOCK & EXTENSION DETECTOR
  // ==========================================
  const activeExamTestForAntiCheat = tests.find(t => t.id === selectedTestId);
  const activeExamCfgForAntiCheat = normalizeExamConfig(activeExamTestForAntiCheat);
  const isExamAntiCheatEnabled =
    view === 'EXAM_MODE' && activeExamCfgForAntiCheat.antiCheatEnabled;

  const { recordInternalCopy } = useExamAntiCheat({
    enabled: isExamAntiCheatEnabled,
    allowInternalCopyPaste: activeExamCfgForAntiCheat.allowInternalCopyPaste,
    setExamState,
    showToast
  });

  const examAutoAdvanceHandledRef = useRef(null);
  const autoAdvanceFnRef = useRef(null);
  const examSubmitLockRef = useRef(false);

  // Exam Countdown Timer (only decrements safely; timeout triggers separate effect below)
  useEffect(() => {
    if (view !== 'EXAM_MODE') return;

    const timer = setInterval(() => {
      setExamState(prev => ({
        ...prev,
        timeRemaining: prev.timeRemaining > 0 ? prev.timeRemaining - 1 : 0
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'EXAM_MODE' || examState.timeRemaining > 0) return;
    const key = `${selectedTestId}:${examState.sectionIdx}`;
    if (examAutoAdvanceHandledRef.current === key) return;
    examAutoAdvanceHandledRef.current = key;
    autoAdvanceFnRef.current?.();
  }, [view, examState.timeRemaining, examState.sectionIdx, selectedTestId]);

  // ==========================================
  // AUTHENTICATION HANDLERS
  // ==========================================
  const handleSelectRememberedLogin = (entry) => {
    if (!entry) return;
    setAuthError('');
    setRememberPassword(true);
    setAuthForm({
      username: entry.username || '',
      password: entry.password || '',
      fullName: ''
    });
  };

  const handleRemoveRememberedLogin = (targetUsername) => {
    const cleanTarget = String(targetUsername || '').toLowerCase();
    setRememberedLogins(prev => {
      const filtered = prev.filter(item => item.username.toLowerCase() !== cleanTarget);
      persistRememberedLogins(filtered);
      return filtered;
    });
    if (authForm.username.trim().replace(/^@+/, '').toLowerCase() === cleanTarget) {
      setAuthForm(prev => ({ ...prev, password: '' }));
    }
  };

  const handleSyncAuthenticatedUser = (nextUser, nextSnap) => {
    if (nextUser && typeof nextUser === 'object') {
      const cleanUser = normalizeBrandTeacherUser(nextUser);
      const targetKey = String(cleanUser.username || '').toLowerCase();
      currentUserRef.current = cleanUser;
      setCurrentUser(prev => {
        const mergedAck =
          Array.isArray(prev?.acknowledgedTitleIds) || Array.isArray(cleanUser.acknowledgedTitleIds)
            ? Array.from(new Set([...(prev?.acknowledgedTitleIds || []), ...(cleanUser.acknowledgedTitleIds || [])]))
            : undefined;
        return {
          ...(prev || {}),
          ...cleanUser,
          ...(mergedAck ? { acknowledgedTitleIds: mergedAck } : {})
        };
      });
      setUsersDb(prev => {
        const prevMap = prev && typeof prev === 'object' ? prev : {};
        const matchedKey =
          Object.keys(prevMap).find(k => k.toLowerCase() === targetKey) || cleanUser.username;
        return {
          ...prevMap,
          [matchedKey]: {
            ...(prevMap[matchedKey] || {}),
            ...cleanUser
          }
        };
      });
    }
    if (nextSnap && typeof nextSnap === 'object') {
      applyRemoteSnapshotData.current?.(nextSnap);
    }
  };

  const handleSyncRememberedPassword = (targetUsername, nextPassword, nextSnap, nextUser) => {
    const cleanTarget = String(targetUsername || '').trim().replace(/^@+/, '').toLowerCase();
    const cleanPass = String(nextPassword || '');
    if (cleanTarget && cleanPass) {
      setRememberedLogins(prev => {
        const exists = prev.some(item => String(item.username || '').toLowerCase() === cleanTarget);
        if (!exists) return prev;
        const nextList = prev.map(item =>
          String(item.username || '').toLowerCase() === cleanTarget
            ? { ...item, password: cleanPass }
            : item
        );
        persistRememberedLogins(nextList);
        return nextList;
      });
      setUsersDb(prev => {
        const prevMap = prev && typeof prev === 'object' ? prev : {};
        const matchedKey = Object.keys(prevMap).find(k => k.toLowerCase() === cleanTarget);
        if (!matchedKey) return prevMap;
        return {
          ...prevMap,
          [matchedKey]: {
            ...prevMap[matchedKey],
            pass: cleanPass
          }
        };
      });
      setAuthForm(prev => {
        const formUname = String(prev.username || '').trim().replace(/^@+/, '').toLowerCase();
        if (formUname === cleanTarget) {
          return { ...prev, password: cleanPass };
        }
        return prev;
      });
    }
    if (nextUser || nextSnap) {
      handleSyncAuthenticatedUser(nextUser, nextSnap);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const uname = authForm.username.trim().replace(/^@+/, '');
    const pass = authForm.password.trim();

    if (!uname || !pass) {
      setAuthError('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }

    authEpochRef.current += 1;
    let serverResponded = false;
    let loggedInUser = null;
    try {
      const res = await fetch('/api/sync/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, password: pass })
      });
      serverResponded = true;
      serverSyncConnectedRef.current = true;
      setServerSyncConnected(true);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) {
        const usedStaleRemembered =
          res.status === 401 &&
          rememberedLogins.some(
            item => item.username.toLowerCase() === uname.toLowerCase() && item.password === pass
          );
        setAuthError(
          usedStaleRemembered
            ? 'Mật khẩu đã lưu trên máy không khớp với mật khẩu hiện tại trên server (mật khẩu có thể đã được đổi hoặc server vừa khởi tạo lại). Vui lòng nhập mật khẩu hiện tại.'
            : (data?.error || 'Sai tên đăng nhập hoặc mật khẩu! Lưu ý: tài khoản do Giáo viên tạo và cấp.')
        );
        return;
      }
      authEpochRef.current += 1;
      bootSessionCheckedRef.current = true;
      lastSyncVersionRef.current = -1;
      loggedInUser = normalizeBrandTeacherUser(data.user);
      if (data.snapshot) {
        applyRemoteSnapshotData.current?.(data.snapshot);
      }
    } catch (_offlineErr) {
      serverSyncConnectedRef.current = false;
      setServerSyncConnected(false);
    }

    if (!serverResponded) {
      const matchedOfflineKey = usersDb[uname]
        ? uname
        : Object.keys(usersDb || {}).find(k => k.toLowerCase() === uname.toLowerCase());
      const localUser = matchedOfflineKey ? usersDb[matchedOfflineKey] : null;
      if (!localUser || localUser.pass !== pass) {
        setAuthError('Sai tên đăng nhập hoặc mật khẩu! Lưu ý: tài khoản do Giáo viên tạo và cấp.');
        return;
      }
      authEpochRef.current += 1;
      loggedInUser = normalizeBrandTeacherUser(localUser);
    }

    setRememberedLogins(prev => {
      const withoutCurr = prev.filter(
        item => item.username.toLowerCase() !== loggedInUser.username.toLowerCase()
      );
      const nextList = rememberPassword
        ? [
            {
              username: loggedInUser.username,
              password: pass,
              name: loggedInUser.name || loggedInUser.username,
              role: loggedInUser.isSuperAdmin ? 'admin' : (loggedInUser.role || 'student'),
              savedAt: Date.now()
            },
            ...withoutCurr
          ].slice(0, 5)
        : withoutCurr;
      persistRememberedLogins(nextList);
      return nextList;
    });

    clearNavSession();
    setSelectedTestId(null);
    setSelectedAttemptId(null);
    setSelectedProfileStudent(null);
    resetActiveGameSession();
    currentUserRef.current = loggedInUser;
    const localSeen = loadLocalSeenTitles(loggedInUser.username);
    if (localSeen.hasBaseline) {
      setLocalSeenTitlesMap(prev => ({ ...prev, [loggedInUser.username.toLowerCase()]: localSeen.ids }));
    }
    setCurrentUser(loggedInUser);
    setSyncHydrated(true);
    if (loggedInUser.role === 'teacher') {
      setView('TEACHER_DASHBOARD');
      showToast(
        loggedInUser.isSuperAdmin
          ? `Xin chào Quản Trị Hệ Thống (${loggedInUser.name || loggedInUser.username})!`
          : `Xin chào Giáo viên ${loggedInUser.name}! Đã chuyển sang Trung tâm Quản trị.`
      );
    } else {
      setView('HOME');
      showToast(`Chào mừng trở lại, ${loggedInUser.name}!`);
      if (!hasActiveAieoVip(loggedInUser)) {
        try {
          sessionStorage.setItem(`ielts_vip_promo_shown_${loggedInUser.username.toLowerCase()}`, '1');
        } catch {}
        setShowVipPromoModal(true);
      }
    }
  };

  const handleLogout = () => {
    const prevUsername = currentUserRef.current?.username || currentUser?.username || '';
    if (prevUsername) {
      try {
        sessionStorage.removeItem(`ielts_vip_promo_shown_${prevUsername.toLowerCase()}`);
      } catch {}
    }
    setShowVipPromoModal(false);
    authEpochRef.current += 1;
    lastSyncVersionRef.current = -1;
    lastBootIdRef.current = '';
    fetch('/api/sync/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
    try {
      syncChannelRef.current?.postMessage({ type: 'AUTH_LOGOUT', username: prevUsername });
    } catch (_err) {}
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    clearBuilderDraft(currentUser?.username);
    clearNavSession();
    setSelectedTestId(null);
    setSelectedAttemptId(null);
    setSelectedProfileStudent(null);
    resetActiveGameSession(prevUsername);
    setSupportAdminProfile(null);
    setAdminFeedbacks([]);
    seenNotifIdsRef.current = null;
    setNotifications([]);
    setSentNotifications([]);
    setCustomTitles([]);
    setSpeakingUnlockTokens({});
    setExamUnlockTokens({});
    setExamPasswordModal(null);
    setAdminTitleModalState({ isOpen: false, targetUsername: null });
    setFocusedTestId(null);
    setAccountSecurityTab(null);
    setShowMailConfigModal(false);
    setShowPaymentConfigModal(false);
    setPaymentConfig(null);
    setGamePracticeLeaderboard([]);
    setIsPracticeGameSession(false);
    setSyncHydrated(false);
    titleBaselinePersistedRef.current = '';
    serverBonusTotalRef.current = 0;
    currentUserRef.current = null;
    setCurrentUser(null);
    setView('AUTH');
    const savedList = loadRememberedLogins();
    const matchedSaved = prevUsername
      ? savedList.find(item => item.username.toLowerCase() === prevUsername.toLowerCase()) || savedList[0]
      : savedList[0];
    if (rememberPassword && matchedSaved) {
      setAuthForm({ username: matchedSaved.username, password: matchedSaved.password, fullName: '' });
    } else {
      setAuthForm({ username: '', password: '', fullName: '' });
    }
    setAuthError('');
  };

  // ==========================================
  // EXAM HANDLERS
  // ==========================================
  const stopExamAudio = () => {
    if (examAudioRef.current) {
      examAudioRef.current.pause();
      examAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setPlayingAudioKey(null);
    setAudioProgress({ currentTime: 0, duration: 0 });
  };

  const startExam = (testId, partModeOverride = 'full', unlockTokenOverride = '') => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const cfg = normalizeExamConfig(test);
    if (cfg.visibility === 'private' && currentUser?.role !== 'teacher') {
      showToast('Đề thi này đang ở chế độ riêng tư (Giáo viên chưa công khai).');
      return;
    }
    if (!canUserAccessTest(test, classesDb, currentUser)) {
      showToast('Đề / bài tập này chỉ giao riêng cho các lớp học được chỉ định.', 'error');
      return;
    }

    const serverNowMs = Date.now() + serverClockOffsetMsRef.current;
    const schedule = evaluateTestSchedule(cfg, serverNowMs);
    if (currentUser?.role !== 'teacher' && schedule.lockedBySchedule) {
      if (schedule.notYetOpen) {
        showToast(`Bài làm này chưa đến giờ mở (Mở lúc ${formatViDateTime(schedule.openAt)}).`, 'error');
      } else {
        showToast(`Bài làm này đã hết hạn nộp lúc ${formatViDateTime(schedule.dueAt)}!`, 'error');
      }
      return;
    }

    if (currentUser?.role !== 'teacher' && cfg.testMode !== 'single_skill') {
      const testPrice = getTestPurchasePriceVnd(test, paymentConfig);
      if (testPrice > 0 && !hasTestPurchaseAccess(currentUser, test)) {
        const isPeriodicMock = cfg.examCategory === 'periodic_mock' || testPrice >= 300000;
        showToast(
          isPeriodicMock
            ? `Mock Test Định Kỳ "${test.title}" có chi phí test ${testPrice.toLocaleString('vi-VN')}đ (1 lượt thi thật).`
            : `Đề Thực Chiến "${test.title}" có chi phí test ${testPrice.toLocaleString('vi-VN')}đ (1 lượt thi thật 4 kỹ năng - hoặc mua Combo 3/5/10 đề tiết kiệm hơn!).`,
          'info'
        );
        openGlobalCheckoutModal({
          itemType: 'test',
          itemId: test.id,
          itemLabel: test.title,
          itemPrice: testPrice
        });
        return;
      }
    }

    const effectiveMaxAttempts = cfg.testMode !== 'single_skill' ? (cfg.maxAttempts > 0 ? cfg.maxAttempts : 1) : cfg.maxAttempts;
    if (currentUser?.role !== 'teacher' && effectiveMaxAttempts > 0) {
      const usedCount = attempts.filter(
        a => (a.studentId === currentUser?.username || a.studentUsername === currentUser?.username) && a.testId === testId
      ).length;
      if (usedCount >= effectiveMaxAttempts) {
        showToast(`Đề thi thật chỉ được làm tối đa ${effectiveMaxAttempts} lượt - bạn đã hoàn thành lượt thi này!`);
        return;
      }
    }

    const activeUnlockToken = unlockTokenOverride || examUnlockTokens[testId] || '';
    if (
      currentUser?.role !== 'teacher' &&
      cfg.focusSkill !== 'speaking' &&
      (cfg.hasExamPassword || cfg.examPassword) &&
      !activeUnlockToken
    ) {
      setExamPasswordModal({
        testId,
        testTitle: test.title,
        partMode: partModeOverride || 'full',
        password: '',
        error: '',
        verifying: false
      });
      return;
    }

    examAutoAdvanceHandledRef.current = null;
    examSubmitLockRef.current = false;
    stopExamAudio();
    setShowSubmitConfirmModal(false);
    setSelectedTestId(testId);

    if (cfg.testMode === 'single_skill' && cfg.focusSkill === 'speaking') {
      setSpeakingPartMode(partModeOverride || 'full');
      setView('SPEAKING_MODE');
      return;
    }

    const restoredDraft = loadExamDraft(currentUser?.username, testId, tests);
    if (restoredDraft) {
      setExamState({
        ...restoredDraft,
        startedAtMs: restoredDraft.startedAtMs || serverNowMs,
        startedAt: restoredDraft.startedAt || formatViDateTime(restoredDraft.startedAtMs || serverNowMs)
      });
      showToast('Đã tự động khôi phục bài làm dở trước đó của bạn!', 'info');
    } else {
      setExamState({
        ...buildInitialExamState(test),
        startedAtMs: serverNowMs,
        startedAt: formatViDateTime(serverNowMs),
        accumulatedSeconds: 0
      });
    }
    setView('EXAM_MODE');
  };

  const handleVerifyExamPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!examPasswordModal?.testId) return;
    const { testId, password, partMode } = examPasswordModal;
    const cleanPass = String(password || '').trim();
    if (!cleanPass) {
      setExamPasswordModal(prev => (prev ? { ...prev, error: 'Vui lòng nhập mật khẩu phòng thi do giáo viên cung cấp.' } : null));
      return;
    }
    setExamPasswordModal(prev => (prev ? { ...prev, verifying: true, error: '' } : null));
    try {
      const result = await verifyExamRoomPassword({ testId, password: cleanPass });
      const token = String(result?.examUnlockToken || result?.unlockToken || '');
      if (!token) {
        throw new Error('Không nhận được mã mở khóa phòng thi từ máy chủ.');
      }
      setExamUnlockTokens(prev => ({ ...prev, [testId]: token }));
      setExamPasswordModal(null);
      showToast('Mật khẩu chính xác! Bắt đầu phòng thi thực chiến...');
      startExam(testId, partMode || 'full', token);
    } catch (err) {
      setExamPasswordModal(prev =>
        prev ? { ...prev, verifying: false, error: err?.message || 'Mật khẩu phòng thi không chính xác.' } : null
      );
    }
  };

  const handleExitExamMode = () => {
    const exitingTest = tests.find(t => t.id === selectedTestId);
    const isTeacher = currentUser?.role === 'teacher';
    if (!isTeacher && exitingTest && normalizeExamConfig(exitingTest).maxAttempts > 0) {
      showToast('Bài thi thật không cho phép tạm thoát khi chưa nộp bài!', 'error');
      return;
    }
    stopExamAudio();
    setShowSubmitConfirmModal(false);
    const exitingTestId = selectedTestId;
    if (isTeacher && exitingTestId) {
      clearExamDraft(currentUser?.username, exitingTestId);
    }
    setSelectedTestId(null);
    setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME');
    if (!isTeacher) {
      showToast('Đã lưu nháp bài làm! Bấm "Tiếp Tục Bài Đang Làm" để làm tiếp bất kỳ lúc nào.', 'info');
    }
  };

  const handlePlayListeningAudio = (audioKey = 'mainAudio', transcript = '', customUrlOverride = undefined) => {
    const activeTest = tests.find(t => t.id === selectedTestId);
    const maxPlays = activeTest?.maxAudioPlays || 1;
    const currentPlays = examState.audioPlays[audioKey] || 0;

    if (currentPlays >= maxPlays) {
      alert(`Bạn đã dùng hết số lần nghe cho phép (${maxPlays} lần).`);
      return;
    }

    const customAudioUrl = customUrlOverride !== undefined ? customUrlOverride : activeTest?.listening?.audioUrl;
    if (!customAudioUrl && !('speechSynthesis' in window && transcript)) {
      alert('Phần nghe này chưa có file âm thanh hoặc transcript.');
      return;
    }

    stopExamAudio();

    setExamState(prev => ({
      ...prev,
      audioPlays: { ...prev.audioPlays, [audioKey]: currentPlays + 1 }
    }));
    if (customAudioUrl) {
      try {
        const audio = new Audio(customAudioUrl);
        examAudioRef.current = audio;
        setIsPlayingAudio(true);
        setPlayingAudioKey(audioKey);
        setAudioProgress({ currentTime: 0, duration: 0 });
        audio.onloadedmetadata = () => {
          setAudioProgress({
            currentTime: audio.currentTime || 0,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0
          });
        };
        audio.ontimeupdate = () => {
          setAudioProgress({
            currentTime: audio.currentTime || 0,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0
          });
        };
        audio.onended = () => {
          setIsPlayingAudio(false);
          setPlayingAudioKey(null);
          setAudioProgress({ currentTime: 0, duration: 0 });
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setPlayingAudioKey(null);
          setAudioProgress({ currentTime: 0, duration: 0 });
          alert('Không thể phát file âm thanh này. Vui lòng kiểm tra lại định dạng file.');
        };
        audio.play();
        return;
      } catch (_err) {
        setIsPlayingAudio(false);
        setPlayingAudioKey(null);
      }
    }

    if ('speechSynthesis' in window && transcript) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setPlayingAudioKey(audioKey);
      };
      utterance.onend = () => {
        setIsPlayingAudio(false);
        setPlayingAudioKey(null);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setPlayingAudioKey(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Phần nghe này chưa có file âm thanh hoặc transcript.');
    }
  };

  const handleFinalExamSubmit = async (speakingRecordingsMap = null) => {
    if (examSubmitLockRef.current) return;
    stopExamAudio();
    setShowSubmitConfirmModal(false);
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return;
    examSubmitLockRef.current = true;
    const cfg = normalizeExamConfig(activeTest);

    let listeningRaw = 0;
    const lQuestions = activeTest.listening?.questions || [];
    lQuestions.forEach(q => {
      if (isObjectiveAnswerCorrect(q, examState.answers[q.id])) listeningRaw++;
    });

    let readingRaw = 0;
    const rQuestions = activeTest.reading?.questions || [];
    rQuestions.forEach(q => {
      if (isObjectiveAnswerCorrect(q, examState.answers[q.id])) readingRaw++;
    });

    clearExamDraft(currentUser?.username, activeTest.id);

    const lBand = calculateAutoBand(listeningRaw, lQuestions.length, 'listening');
    const rBand = calculateAutoBand(readingRaw, rQuestions.length, 'reading');
    const isSingleObjective =
      cfg.testMode === 'single_skill' && (cfg.focusSkill === 'listening' || cfg.focusSkill === 'reading');
    const singleObjectiveBand =
      cfg.focusSkill === 'listening' ? lBand : cfg.focusSkill === 'reading' ? rBand : null;

    const activeSkillTotalSecs = (cfg.durations[examState.skill] || 15) * 60;
    const currentSectionElapsed = Math.max(0, activeSkillTotalSecs - (Number(examState.timeRemaining) || 0));
    const durationSeconds = Math.max(1, Math.round((Number(examState.accumulatedSeconds) || 0) + currentSectionElapsed));
    const submittedAtMs = Date.now() + serverClockOffsetMsRef.current;
    const startedAtMs = Number(examState.startedAtMs) || Math.max(1, submittedAtMs - durationSeconds * 1000);
    const startedAt = examState.startedAt || formatViDateTime(startedAtMs);
    const dueAtMs = cfg.dueAt ? Number(cfg.dueAt) : null;
    const timelinessStatus = cfg.scheduleMode === 'flexible' || !dueAtMs
      ? 'flexible'
      : submittedAtMs > dueAtMs
      ? 'late'
      : 'on_time';
    const lateByMinutes = timelinessStatus === 'late' && dueAtMs
      ? Math.max(1, Math.round((submittedAtMs - dueAtMs) / 60_000))
      : 0;

    const attemptId = createUniqueAttemptId('att', currentUser?.username);

    // Upload any integrated Section 4 Speaking recordings cleanly before persisting attempt
    const uploadedSpeakingRecordings = [];
    if (speakingRecordingsMap && typeof speakingRecordingsMap === 'object') {
      const entries = Object.values(speakingRecordingsMap).filter(Boolean);
      for (const rec of entries) {
        let finalAudioUrl = rec.audioUrl || '';
        if (!finalAudioUrl && rec.blob) {
          try {
            const up = await uploadSpeakingRecording({
              blob: rec.blob,
              audioId: `sp4_${attemptId}_${rec.questionId || 'q'}`,
              mimeType: rec.blob.type || 'audio/webm',
              username: currentUser?.username || 'student',
              attemptId,
              questionId: rec.questionId || ''
            });
            if (up?.audioUrl) finalAudioUrl = up.audioUrl;
          } catch (uploadErr) {
            console.warn('Upload integrated speaking audio skipped:', uploadErr?.message || uploadErr);
          }
        }
        uploadedSpeakingRecordings.push({
          questionId: String(rec.questionId || ''),
          part: Number(rec.part) || 1,
          prompt: String(rec.prompt || ''),
          audioUrl: finalAudioUrl,
          transcript: String(rec.transcript || ''),
          durationSec: Math.max(0, Math.round(Number(rec.durationSec) || 0))
        });
      }
    }

    const newAttempt = {
      id: attemptId,
      testId: activeTest.id,
      testTitle: activeTest.title,
      testMode: cfg.testMode,
      focusSkill: cfg.focusSkill,
      examCategory: cfg.examCategory,
      dailySubCategory: cfg.dailySubCategory,
      writingTaskScope: cfg.writingTaskScope,
      examUnlockToken: examUnlockTokens[activeTest.id] || undefined,
      studentId: currentUser?.username || 'std_guest',
      studentName: currentUser?.name || 'Học sinh',
      startedAtMs,
      startedAt,
      submittedAtMs,
      submittedAt: formatViDateTime(submittedAtMs),
      durationSeconds,
      timelinessStatus,
      lateByMinutes,
      answers: examState.answers,
      ...(uploadedSpeakingRecordings.length > 0 ? { speakingRecordings: uploadedSpeakingRecordings } : {}),
      antiCheatLogs: examState.antiCheatLogs,
      tabSwitchCount: examState.tabSwitchCount,
      teacherGraded: isSingleObjective,
      aiGraded: false,
      scores: {
        listening: {
          raw: listeningRaw,
          total: lQuestions.length,
          band: cfg.testMode === 'single_skill' && cfg.focusSkill !== 'listening' ? null : lBand
        },
        reading: {
          raw: readingRaw,
          total: rQuestions.length,
          band: cfg.testMode === 'single_skill' && cfg.focusSkill !== 'reading' ? null : rBand
        },
        writing: { task1Band: null, task2Band: null, overallBand: null },
        speaking: { band: null, criteria: {} }
      },
      overallBand: isSingleObjective ? singleObjectiveBand : null,
      teacherFeedback: ''
    };

    setAttempts(prev => [newAttempt, ...prev]);
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: newAttempt });
    setSelectedAttemptId(newAttempt.id);
    if (cfg.testMode === 'single_skill' && cfg.focusSkill) {
      setResultReviewTab(cfg.focusSkill);
      if (currentUser?.role !== 'teacher') {
        setPreviousView('SKILL_HUB');
      }
    } else {
      setResultReviewTab('listening');
      if (currentUser?.role !== 'teacher') {
        setPreviousView('HOME');
      }
    }
    setView('RESULT_VIEW');

    if (isSingleObjective) {
      showToast('Đã nộp bài Daily Zone! Xem ngay số câu đúng, thời gian và số lần làm bài.');
    } else {
      showToast('Đã nộp bài thành công! Ms. Như đang check và sẽ duyệt trả điểm chính thức.');
    }
  };

  const handleRedeemRealExamCredit = async (testId) => {
    const cleanId = String(testId || '').trim();
    if (!cleanId || !currentUser?.username) return false;
    const credits = getRealExamCredits(currentUser);
    if (credits < 1) {
      showToast('Bạn chưa còn lượt Combo Thực Chiến nào. Hãy chọn mua Combo 3/5/10 đề nhé!', 'info');
      return false;
    }
    const targetTest = tests.find(t => t.id === cleanId);
    if (!targetTest) return false;
    try {
      await dispatchSyncAction('REDEEM_REAL_EXAM_CREDIT', { testId: cleanId });
      setUsersDb(prev => {
        const u = prev[currentUser.username];
        if (!u) return prev;
        const prevPurchased = Array.isArray(u.purchasedTestIds) ? u.purchasedTestIds : [];
        return {
          ...prev,
          [currentUser.username]: {
            ...u,
            realExamCredits: Math.max(0, getRealExamCredits(u) - 1),
            purchasedTestIds: Array.from(new Set([...prevPurchased, cleanId]))
          }
        };
      });
      setCurrentUser(prev => {
        if (!prev) return prev;
        const prevPurchased = Array.isArray(prev.purchasedTestIds) ? prev.purchasedTestIds : [];
        return {
          ...prev,
          realExamCredits: Math.max(0, getRealExamCredits(prev) - 1),
          purchasedTestIds: Array.from(new Set([...prevPurchased, cleanId]))
        };
      });
      showToast(`Đã đổi 1 lượt Combo mở khóa "${targetTest.title}"! Sẵn sàng vào thi thật 4 kỹ năng.`);
      return true;
    } catch (err) {
      showToast(err?.message || 'Không thể đổi lượt Combo lúc này.', 'error');
      return false;
    }
  };

  const advanceToNextExamSection = (isAutoTimeout = false) => {
    const activeTest = tests.find(t => t.id === selectedTestId);
    if (!activeTest) return;
    const cfg = normalizeExamConfig(activeTest);
    const currentIdx =
      typeof examState.sectionIdx === 'number'
        ? examState.sectionIdx
        : Math.max(0, cfg.order.indexOf(examState.skill));
    const nextIdx = currentIdx + 1;

    stopExamAudio();

    if (nextIdx >= cfg.order.length) {
      if (isAutoTimeout) {
        showToast('Hết giờ kỹ năng cuối cùng! Hệ thống đã tự động nộp bài cho Ms. Như check.');
      }
      handleFinalExamSubmit();
      return;
    }

    const prevSkill = examState.skill || cfg.order[currentIdx];
    const nextSkill = cfg.order[nextIdx];
    const nextDurationSecs = (cfg.durations[nextSkill] || 15) * 60;
    const skillNames = { listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' };
    const safePrevRem = Math.max(0, Math.floor(Number(examState.timeRemaining) || 0));
    const remMin = Math.floor(safePrevRem / 60);
    const remSec = safePrevRem % 60;
    const remLabel = `${remMin}p${remSec.toString().padStart(2, '0')}s`;

    setExamState(prev => {
      const currentPrevSkill = prev.skill || cfg.order[currentIdx];
      const prevAllocatedSecs = (cfg.durations[currentPrevSkill] || 15) * 60;
      const prevSpentSecs = Math.max(0, prevAllocatedSecs - (Number(prev.timeRemaining) || 0));
      return {
        ...prev,
        sectionIdx: nextIdx,
        skill: nextSkill,
        timeRemaining: nextDurationSecs,
        accumulatedSeconds: (Number(prev.accumulatedSeconds) || 0) + prevSpentSecs,
        visitedSkills: Array.from(new Set([...(prev.visitedSkills || [prev.skill]), nextSkill])),
        listeningTrackIdx: 0,
        readingPassageIdx: 0
      };
    });
    showToast(
      isAutoTimeout
        ? `Hết giờ ${skillNames[prevSkill] || prevSkill} - Tự động chuyển sang ${skillNames[nextSkill]} (${cfg.durations[nextSkill]} phút)!`
        : cfg.sequentialMode
        ? `Đã khóa ${skillNames[prevSkill] || prevSkill} (còn ${remLabel} - không thể quay lại)! Bắt đầu ${skillNames[nextSkill]} (${cfg.durations[nextSkill]} phút).`
        : `Đã chuyển sang phần ${skillNames[nextSkill]} (${cfg.durations[nextSkill]} phút)!`
    );
  };

  autoAdvanceFnRef.current = () => advanceToNextExamSection(true);

  const handleTestGeminiKey = async (keyOverride = aiApiKey) => {
    const cleanKey = (keyOverride || '').trim();
    if (!cleanKey && !aiConfigured) {
      setApiTestState({ testing: false, ok: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.', model: '' });
      return;
    }
    setApiTestState({
      testing: true,
      ok: null,
      message: cleanKey ? 'Đang kết nối Google Gemini API...' : 'Đang kiểm tra Gemini API Key đang lưu trên máy chủ...',
      model: ''
    });
    try {
      const usedModel = await testGeminiApiConnection(cleanKey);
      if (cleanKey) {
        setAiApiKey(cleanKey);
        localStorage.setItem('ielts_ai_key', cleanKey);
        await dispatchSyncAction('SET_AI_CONFIG', { geminiApiKey: cleanKey });
      }
      setApiTestState({
        testing: false,
        ok: true,
        model: usedModel,
        message: cleanKey
          ? `Kết nối thành công! Hệ thống đang dùng model "${usedModel}" và đã đồng bộ API Key cho máy chủ (dùng trên mọi máy).`
          : `Kết nối thành công qua máy chủ! Server đang dùng model "${usedModel}".`
      });
    } catch (err) {
      setApiTestState({
        testing: false,
        ok: false,
        model: '',
        message: err?.message || 'Không thể kết nối với Google Gemini API.'
      });
    }
  };

  // Shared Writing AI Grading helper (Teacher & post-submit student analysis)
  const runWritingGradingEngine = async (targetAttempt) => {
    const test = tests.find(t => t.id === targetAttempt.testId);
    const cleanKey = currentUser?.role === 'teacher' ? (aiApiKey || '').trim() : '';

    if (cleanKey) {
      setAiGradingStep('Đang kết nối Google Gemini API (Strict IELTS Senior Examiner)...');
      try {
        const res = await callGeminiWritingGrader({
          apiKey: cleanKey,
          task1Prompt: test?.writing?.task1?.prompt,
          task1Text: targetAttempt.answers?.w1,
          task2Prompt: test?.writing?.task2?.prompt,
          task2Text: targetAttempt.answers?.w2
        });
        return { ...res, _engineLabel: `Google Gemini (${res._usedModel || 'Live API'})` };
      } catch (apiErr) {
        console.warn('Gemini API error:', apiErr);
        showToast(`Gemini API lỗi: ${apiErr.message}`, 'error');
        setAiGradingStep(`API lỗi (${apiErr.message}) - chuyển sang máy chủ / bộ phân tích tích hợp...`);
      }
    }

    setAiGradingStep('AI Examiner đang phân tích lỗi ngữ pháp, chính tả, bảng sửa câu & nâng band...');
    const { evaluation } = await requestAiWritingGrading({
      attemptId: targetAttempt.id,
      task1Prompt: test?.writing?.task1?.prompt || '',
      task1Text: targetAttempt.answers?.w1 || '',
      task2Prompt: test?.writing?.task2?.prompt || '',
      task2Text: targetAttempt.answers?.w2 || '',
      clientApiKey: cleanKey
    });
    const usedModel = evaluation?._usedModel || 'built-in-writing-examiner';
    const isGemini = usedModel.includes('gemini');
    return {
      ...evaluation,
      _engineLabel: isGemini ? `Google Gemini (${usedModel})` : 'AI Examiner Tích Hợp (Strict Mode)'
    };
  };

  const computeAttemptFinalOverall = (attemptScores, writingOverall, attemptRef = null) => {
    const isSingle = attemptRef?.testMode === 'single_skill' && attemptRef?.focusSkill;
    if (isSingle) {
      if (attemptRef.focusSkill === 'listening') return Number(attemptScores?.listening?.band) || 0;
      if (attemptRef.focusSkill === 'reading') return Number(attemptScores?.reading?.band) || 0;
      if (attemptRef.focusSkill === 'writing') return writingOverall;
      if (attemptRef.focusSkill === 'speaking') return Number(attemptScores?.speaking?.band) || 0;
    }
    const activeSkillBands = [];
    if ((attemptScores?.listening?.total || 0) > 0) {
      activeSkillBands.push(Number(attemptScores.listening.band) || 0);
    }
    if ((attemptScores?.reading?.total || 0) > 0) {
      activeSkillBands.push(Number(attemptScores.reading.band) || 0);
    }
    if (typeof writingOverall === 'number' && Number.isFinite(writingOverall)) {
      activeSkillBands.push(writingOverall);
    }
    if (typeof attemptScores?.speaking?.band === 'number' && Number.isFinite(attemptScores.speaking.band)) {
      activeSkillBands.push(Number(attemptScores.speaking.band));
    }
    return calculateOverallIeltsBand(activeSkillBands);
  };

  // AI Writing Draft Grading Trigger (Teacher only - stays private draft until Ms. Nhu clicks Approve)
  const handleGradeWritingWithAI = async (targetAttempt) => {
    const isTeacherUser = currentUser?.role === 'teacher';
    if (!targetAttempt || !isTeacherUser) return;
    setIsGradingAI(true);
    setAiGradingStep('Đang chấm nháp Writing: phân tích lỗi chính tả, ngữ pháp & gợi ý band...');

    try {
      const aiResult = await runWritingGradingEngine(targetAttempt);
      const linkedTest = tests.find(t => t.id === targetAttempt.testId);
      const linkedCfg = linkedTest ? normalizeExamConfig(linkedTest) : null;
      const writingScope = targetAttempt.writingTaskScope || linkedCfg?.writingTaskScope || 'both';
      const rawT1 = parseFloat(aiResult.task1Band);
      const rawT2 = parseFloat(aiResult.task2Band);
      const t1 = Number.isFinite(rawT1) ? roundDownIeltsHalfBand(Math.max(0, Math.min(9.0, rawT1))) : 0;
      const t2 = Number.isFinite(rawT2) ? roundDownIeltsHalfBand(Math.max(0, Math.min(9.0, rawT2))) : 0;
      const writingOverall =
        writingScope === 'task1'
          ? t1
          : writingScope === 'task2'
          ? t2
          : calculateWritingBand(t1, t2);

      const nextScores = {
        ...targetAttempt.scores,
        writing: {
          task1Band: writingScope === 'task2' ? null : t1,
          task2Band: writingScope === 'task1' ? null : t2,
          overallBand: writingOverall
        }
      };
      const finalOverall = computeAttemptFinalOverall(nextScores, writingOverall, targetAttempt);
      const wasAlreadyApproved = Boolean(targetAttempt.teacherGraded);

      const updatedAiAttempt = {
        ...targetAttempt,
        // Keep draft status (false) until Ms. Nhu explicitly clicks "Duyệt & Trả Điểm Cho Học Sinh"
        teacherGraded: wasAlreadyApproved,
        aiGraded: true,
        aiDetails: aiResult,
        aiWritingTicket: aiResult.aiWritingTicket || undefined,
        scores: nextScores,
        overallBand: finalOverall,
        teacherFeedback: aiResult.feedback
      };
      setAttempts(prev => prev.map(att => (att.id === targetAttempt.id ? updatedAiAttempt : att)));
      dispatchSyncAction('UPSERT_ATTEMPT', { attempt: updatedAiAttempt });
      showToast(
        wasAlreadyApproved
          ? `Đã cập nhật điểm & phân tích lỗi Writing (${aiResult._engineLabel})!`
          : `Đã chấm nháp Writing (${aiResult._engineLabel})! Học sinh CHƯA thấy - hãy kiểm tra & bấm "Duyệt & Trả Điểm Cho Học Sinh".`
      );
    } catch (err) {
      alert('Có lỗi xảy ra trong quá trình chấm điểm: ' + err.message);
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  const handleGradeSpeakingWithAI = async (targetAttempt, updateModalState = false) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    const recordings = Array.isArray(targetAttempt.speakingRecordings) ? targetAttempt.speakingRecordings : [];
    setIsGradingAI(true);
    setAiGradingStep('Đang nghe lại file ghi âm & chấm nháp 4 tiêu chí Speaking (chỉ GV thấy)...');

    try {
      const evaluation = await requestAiSpeakingGrading({
        testTitle: targetAttempt.testTitle,
        partMode: targetAttempt.speakingPartMode || 'full',
        recordings,
        clientApiKey: aiApiKey
      });

      const spBand = roundSpeakingBand(evaluation?.overallBand ?? 0);
      const criteria = evaluation?.criteria || { fc: spBand, lr: spBand, gra: spBand, pr: spBand };
      const evalByQid = new Map((evaluation?.questionEvaluations || []).map(ev => [String(ev.questionId), ev]));

      const refreshedRecordings = recordings.map(r => {
        const ev = evalByQid.get(String(r.questionId));
        return {
          ...r,
          transcript: ev?.transcript || r.transcript || r.clientTranscript || '',
          band: ev?.band ?? r.band ?? 0,
          criteria: ev?.criteria || r.criteria || null,
          fluencyMetrics: ev?.fluencyMetrics || r.fluencyMetrics || null,
          feedback: ev?.feedback || r.feedback || '',
          grammarVocabularyFixes: ev?.grammarVocabularyFixes || r.grammarVocabularyFixes || [],
          vocabularyUpgrades: ev?.vocabularyUpgrades || r.vocabularyUpgrades || [],
          upgradedSample: ev?.upgradedSample || r.upgradedSample || ''
        };
      });

      const nextScores = {
        ...targetAttempt.scores,
        speaking: { band: spBand, criteria }
      };
      const isSingleSpeaking = targetAttempt.testMode === 'single_skill' && targetAttempt.focusSkill === 'speaking';
      const nextOverall = isSingleSpeaking
        ? spBand
        : computeAttemptFinalOverall(nextScores, nextScores.writing?.overallBand ?? null, targetAttempt);
      const wasAlreadyApproved = Boolean(targetAttempt.teacherGraded);

      const updatedAttempt = {
        ...targetAttempt,
        // Keep draft status (false) until Ms. Nhu explicitly clicks "Duyệt & Trả Điểm Cho Học Sinh"
        teacherGraded: wasAlreadyApproved,
        aiGraded: true,
        speakingRecordings: refreshedRecordings,
        speakingAiDetails: {
          criteria,
          strengths: evaluation?.strengths || [],
          improvements: evaluation?.improvements || [],
          _usedModel: evaluation?._usedModel || 'speaking-ai',
          _gradedMode: evaluation?._gradedMode || 'fallback',
          _fallbackReason: evaluation?._fallbackReason || ''
        },
        scores: nextScores,
        overallBand: nextOverall,
        teacherFeedback: evaluation?.overallFeedback || targetAttempt.teacherFeedback || ''
      };

      setAttempts(prev => prev.map(att => (att.id === targetAttempt.id ? updatedAttempt : att)));
      dispatchSyncAction('UPSERT_ATTEMPT', { attempt: updatedAttempt });

      if (updateModalState) {
        setGradingAttempt(updatedAttempt);
        setGradingScores(prev => ({
          ...prev,
          speakingFc: criteria.fc ?? spBand,
          speakingLr: criteria.lr ?? spBand,
          speakingGra: criteria.gra ?? spBand,
          speakingPr: criteria.pr ?? spBand,
          speakingBand: spBand,
          feedback: updatedAttempt.teacherFeedback
        }));
      }

      showToast(
        wasAlreadyApproved
          ? `Đã cập nhật điểm Speaking (Band ${spBand})!`
          : `Đã chấm nháp Speaking (Band ${spBand})! Học sinh CHƯA thấy - hãy kiểm tra & bấm "Duyệt & Trả Điểm Cho Học Sinh".`
      );
    } catch (err) {
      showToast('Lỗi chấm AI Speaking: ' + (err?.message || err), 'error');
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  const handleApproveAndPublishAttempt = (targetAttempt) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    const isSingleSpeaking = targetAttempt.testMode === 'single_skill' && targetAttempt.focusSkill === 'speaking';
    const isSingleWriting = targetAttempt.testMode === 'single_skill' && targetAttempt.focusSkill === 'writing';
    const hasWritingBand = typeof targetAttempt.scores?.writing?.overallBand === 'number';
    const hasSpeakingBand = typeof targetAttempt.scores?.speaking?.band === 'number';
    if (isSingleSpeaking && !hasSpeakingBand) {
      openTeacherGradingModal(targetAttempt);
      showToast('Vui lòng chấm nháp AI hoặc nhập điểm 4 tiêu chí Speaking trước khi duyệt trả điểm!', 'info');
      return;
    }
    if (isSingleWriting && !hasWritingBand) {
      openTeacherGradingModal(targetAttempt);
      showToast('Vui lòng chấm nháp AI hoặc nhập điểm Writing trước khi duyệt trả điểm!', 'info');
      return;
    }
    if (targetAttempt.testMode !== 'single_skill' && !hasWritingBand && !hasSpeakingBand) {
      openTeacherGradingModal(targetAttempt);
      showToast('Vui lòng nhập hoặc chấm nháp điểm Writing / Speaking trước khi duyệt trả điểm!', 'info');
      return;
    }

    const finalOverall = isSingleSpeaking
      ? targetAttempt.scores.speaking.band
      : computeAttemptFinalOverall(targetAttempt.scores, targetAttempt.scores?.writing?.overallBand ?? null, targetAttempt);

    const publishedAttempt = {
      ...targetAttempt,
      teacherGraded: true,
      overallBand: finalOverall
    };
    setAttempts(prev => prev.map(att => (att.id === targetAttempt.id ? publishedAttempt : att)));
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: publishedAttempt });
    if (publishedAttempt.studentId && publishedAttempt.studentId !== currentUser?.username) {
      dispatchSyncAction('CREATE_NOTIFICATION', {
        title: `Ms. Như đã duyệt & trả điểm: ${publishedAttempt.testTitle}`,
        message: `Bài thi của bạn đã được Ms. Như duyệt xong (Overall Band ${finalOverall ?? '-'}). Bấm vào để xem điểm chi tiết, lỗi sai & nhận xét!`,
        type: 'announcement',
        testId: publishedAttempt.testId || '',
        targetUsernames: [publishedAttempt.studentId]
      });
    }
    showToast(`Đã duyệt & trả điểm (Band ${finalOverall ?? '-'}) cho học sinh ${publishedAttempt.studentName}!`);
  };

  const handleRevokeApprovalAttempt = (targetAttempt) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    const revertedAttempt = {
      ...targetAttempt,
      teacherGraded: false
    };
    setAttempts(prev => prev.map(att => (att.id === targetAttempt.id ? revertedAttempt : att)));
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: revertedAttempt });
    showToast('Đã chuyển bài thi về trạng thái Chờ duyệt (ẩn điểm & lỗi khỏi học sinh).', 'info');
  };

  const sanitizeBandScore = (val) => {
    const parsed = parseFloat(val);
    return Number.isFinite(parsed) ? roundIeltsBand(Math.max(0, Math.min(9.0, parsed))) : 0;
  };

  const openTeacherGradingModal = (att) => {
    if (!att || currentUser?.role !== 'teacher') return;
    const w1Empty = getWordCount(att.answers?.w1) === 0;
    const w2Empty = getWordCount(att.answers?.w2) === 0;
    const lRaw = Number.isFinite(Number(att.scores?.listening?.raw)) ? Number(att.scores.listening.raw) : 0;
    const lTotal = Number.isFinite(Number(att.scores?.listening?.total)) ? Number(att.scores.listening.total) : 0;
    const lBand = att.scores?.listening?.band ?? calculateAutoBand(lRaw, lTotal, 'listening');
    const rRaw = Number.isFinite(Number(att.scores?.reading?.raw)) ? Number(att.scores.reading.raw) : 0;
    const rTotal = Number.isFinite(Number(att.scores?.reading?.total)) ? Number(att.scores.reading.total) : 0;
    const rBand = att.scores?.reading?.band ?? calculateAutoBand(rRaw, rTotal, 'reading');
    const spBand = att.scores?.speaking?.band ?? (att.focusSkill === 'speaking' ? (att.overallBand ?? 0) : 0);
    const spCrit = att.scores?.speaking?.criteria || {};

    setGradingAttempt(att);
    setGradingScores({
      listeningRaw: lRaw,
      listeningBand: lBand,
      readingRaw: rRaw,
      readingBand: rBand,
      task1Band: att.scores?.writing?.task1Band ?? (w1Empty ? 0 : 6.0),
      task2Band: att.scores?.writing?.task2Band ?? (w2Empty ? 0 : 6.5),
      speakingFc: spCrit.fc ?? spBand,
      speakingLr: spCrit.lr ?? spBand,
      speakingGra: spCrit.gra ?? spBand,
      speakingPr: spCrit.pr ?? spBand,
      speakingBand: spBand,
      feedback: att.teacherFeedback || ''
    });
  };

  const recalculateObjectiveScores = () => {
    if (!gradingAttempt || currentUser?.role !== 'teacher') return;
    const linkedTest = tests.find(t => t.id === gradingAttempt.testId);
    let nextLRaw = Number(gradingScores.listeningRaw);
    let lTotal = Number(gradingAttempt.scores?.listening?.total) || 0;
    let nextRRaw = Number(gradingScores.readingRaw);
    let rTotal = Number(gradingAttempt.scores?.reading?.total) || 0;

    if (linkedTest) {
      const lQuestions = linkedTest.listening?.questions || [];
      const rQuestions = linkedTest.reading?.questions || [];
      if (lQuestions.length > 0) {
        let calcLRaw = 0;
        lQuestions.forEach(q => {
          if (isObjectiveAnswerCorrect(q, gradingAttempt.answers?.[q.id])) calcLRaw++;
        });
        nextLRaw = calcLRaw;
        lTotal = lQuestions.length;
      }
      if (rQuestions.length > 0) {
        let calcRRaw = 0;
        rQuestions.forEach(q => {
          if (isObjectiveAnswerCorrect(q, gradingAttempt.answers?.[q.id])) calcRRaw++;
        });
        nextRRaw = calcRRaw;
        rTotal = rQuestions.length;
      }
    }

    const cleanLRaw = Number.isFinite(nextLRaw)
      ? Math.max(0, lTotal > 0 ? Math.min(lTotal, Math.round(nextLRaw)) : Math.round(nextLRaw))
      : 0;
    const cleanRRaw = Number.isFinite(nextRRaw)
      ? Math.max(0, rTotal > 0 ? Math.min(rTotal, Math.round(nextRRaw)) : Math.round(nextRRaw))
      : 0;
    const nextLBand = calculateAutoBand(cleanLRaw, lTotal, 'listening');
    const nextRBand = calculateAutoBand(cleanRRaw, rTotal, 'reading');

    setGradingScores(prev => ({
      ...prev,
      listeningRaw: cleanLRaw,
      listeningBand: nextLBand,
      readingRaw: cleanRRaw,
      readingBand: nextRBand
    }));
    if (gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'listening') {
      showToast(`Đã quy đổi chuẩn IELTS: Listening ${nextLBand} (${cleanLRaw}/${lTotal})`);
    } else if (gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'reading') {
      showToast(`Đã quy đổi chuẩn IELTS: Reading ${nextRBand} (${cleanRRaw}/${rTotal})`);
    } else {
      showToast(`Đã quy đổi chuẩn IELTS: Listening ${nextLBand} (${cleanLRaw}/${lTotal}) • Reading ${nextRBand} (${cleanRRaw}/${rTotal})`);
    }
  };

  // Teacher AI grading assist in grading modal
  const handleTeacherAIGrade = async (targetAttempt) => {
    if (!targetAttempt || currentUser?.role !== 'teacher') return;
    setIsGradingAI(true);
    setAiGradingStep('AI đang phân tích bài thi và gợi ý band điểm...');

    try {
      const aiResult = await runWritingGradingEngine(targetAttempt);
      setGradingScores(prev => ({
        ...prev,
        task1Band: aiResult.task1Band,
        task2Band: aiResult.task2Band,
        feedback: aiResult.feedback
      }));
      showToast(`Đã điền gợi ý điểm từ ${aiResult._engineLabel}!`);
    } catch (err) {
      alert('Lỗi chấm AI: ' + err.message);
    } finally {
      setIsGradingAI(false);
      setAiGradingStep('');
    }
  };

  const saveTeacherGrading = ({ includeWriting = true } = {}) => {
    if (!gradingAttempt || currentUser?.role !== 'teacher') return;

    const lTotal = Number(gradingAttempt.scores?.listening?.total) || 0;
    const rawLRaw = parseInt(gradingScores.listeningRaw, 10);
    const cleanLRaw = Number.isFinite(rawLRaw)
      ? Math.max(0, lTotal > 0 ? Math.min(lTotal, rawLRaw) : rawLRaw)
      : (gradingAttempt.scores?.listening?.raw || 0);
    const lBand = sanitizeBandScore(gradingScores.listeningBand);

    const rTotal = Number(gradingAttempt.scores?.reading?.total) || 0;
    const rawRRaw = parseInt(gradingScores.readingRaw, 10);
    const cleanRRaw = Number.isFinite(rawRRaw)
      ? Math.max(0, rTotal > 0 ? Math.min(rTotal, rawRRaw) : rawRRaw)
      : (gradingAttempt.scores?.reading?.raw || 0);
    const rBand = sanitizeBandScore(gradingScores.readingBand);

    const baseScores = {
      ...gradingAttempt.scores,
      listening: {
        ...(gradingAttempt.scores?.listening || {}),
        raw: cleanLRaw,
        total: lTotal,
        band: gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill !== 'listening' ? null : lBand
      },
      reading: {
        ...(gradingAttempt.scores?.reading || {}),
        raw: cleanRRaw,
        total: rTotal,
        band: gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill !== 'reading' ? null : rBand
      }
    };

    const isSingleSpeakingAttempt = gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'speaking';
    const isFullExamAttempt = gradingAttempt.testMode !== 'single_skill';
    const linkedTest = tests.find(t => t.id === gradingAttempt.testId);
    const linkedCfg = linkedTest ? normalizeExamConfig(linkedTest) : null;
    const writingScope = gradingAttempt.writingTaskScope || linkedCfg?.writingTaskScope || 'both';
    const hasIntegratedSpeaking =
      isFullExamAttempt &&
      (Array.isArray(gradingAttempt.speakingRecordings) && gradingAttempt.speakingRecordings.length > 0 ||
        Boolean(linkedCfg?.order?.includes('speaking')) ||
        gradingAttempt.scores?.speaking !== undefined);

    let updatedAttemptObj;
    if (isSingleSpeakingAttempt) {
      const spFc = roundWholeBand(gradingScores.speakingFc);
      const spLr = roundWholeBand(gradingScores.speakingLr);
      const spGra = roundWholeBand(gradingScores.speakingGra);
      const spPr = roundWholeBand(gradingScores.speakingPr);
      const spBand = roundWholeBand(gradingScores.speakingBand || (spFc + spLr + spGra + spPr) / 4);
      const nextCrit = {
        fc: spFc,
        lr: spLr,
        gra: spGra,
        pr: spPr
      };
      updatedAttemptObj = {
        ...gradingAttempt,
        teacherGraded: true,
        scores: {
          ...baseScores,
          speaking: { band: spBand, criteria: nextCrit }
        },
        speakingAiDetails: {
          ...(gradingAttempt.speakingAiDetails || {}),
          criteria: nextCrit
        },
        overallBand: spBand,
        teacherFeedback: gradingScores.feedback
      };
    } else if (includeWriting && !(gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill !== 'writing')) {
      const t1 = sanitizeBandScore(gradingScores.task1Band);
      const t2 = sanitizeBandScore(gradingScores.task2Band);
      const writingOverall =
        writingScope === 'task1'
          ? t1
          : writingScope === 'task2'
          ? t2
          : calculateWritingBand(t1, t2);
      const nextScores = {
        ...baseScores,
        writing: {
          task1Band: writingScope === 'task2' ? null : t1,
          task2Band: writingScope === 'task1' ? null : t2,
          overallBand: writingOverall
        }
      };
      if (hasIntegratedSpeaking) {
        const spFc = roundWholeBand(gradingScores.speakingFc);
        const spLr = roundWholeBand(gradingScores.speakingLr);
        const spGra = roundWholeBand(gradingScores.speakingGra);
        const spPr = roundWholeBand(gradingScores.speakingPr);
        const spBand = roundWholeBand(gradingScores.speakingBand || (spFc + spLr + spGra + spPr) / 4);
        nextScores.speaking = {
          band: spBand,
          criteria: { fc: spFc, lr: spLr, gra: spGra, pr: spPr }
        };
      }
      const finalOverall = computeAttemptFinalOverall(nextScores, writingOverall, gradingAttempt);
      updatedAttemptObj = {
        ...gradingAttempt,
        teacherGraded: true,
        scores: nextScores,
        overallBand: finalOverall,
        teacherFeedback: gradingScores.feedback
      };
    } else if (gradingAttempt.testMode === 'single_skill') {
      const finalOverall = computeAttemptFinalOverall(baseScores, 0, gradingAttempt);
      updatedAttemptObj = {
        ...gradingAttempt,
        teacherGraded: true,
        scores: baseScores,
        overallBand: finalOverall,
        teacherFeedback: gradingScores.feedback
      };
    } else {
      const existingWritingOverall = gradingAttempt.scores?.writing?.overallBand;
      const hasWritingBand = typeof existingWritingOverall === 'number';
      const nextOverall = hasWritingBand
        ? computeAttemptFinalOverall(baseScores, existingWritingOverall, gradingAttempt)
        : null;
      updatedAttemptObj = {
        ...gradingAttempt,
        scores: baseScores,
        overallBand: nextOverall,
        teacherFeedback: gradingScores.feedback
      };
    }

    const wasPreviouslyApproved = Boolean(gradingAttempt.teacherGraded);
    const updatedAttempts = attempts.map(att => (att.id === gradingAttempt.id ? updatedAttemptObj : att));

    setAttempts(updatedAttempts);
    dispatchSyncAction('UPSERT_ATTEMPT', { attempt: updatedAttemptObj });
    if (
      updatedAttemptObj.teacherGraded &&
      !wasPreviouslyApproved &&
      updatedAttemptObj.studentId &&
      updatedAttemptObj.studentId !== currentUser?.username
    ) {
      dispatchSyncAction('CREATE_NOTIFICATION', {
        title: `Ms. Như đã duyệt & trả điểm: ${updatedAttemptObj.testTitle}`,
        message: `Bài thi của bạn đã được Ms. Như duyệt xong (Overall Band ${updatedAttemptObj.overallBand ?? '-'}). Vào xem điểm chi tiết, lỗi sai & nhận xét ngay!`,
        type: 'announcement',
        testId: updatedAttemptObj.testId || '',
        targetUsernames: [updatedAttemptObj.studentId]
      });
    }
    setGradingAttempt(null);
    if (isSingleSpeakingAttempt) {
      const crit = updatedAttemptObj.scores?.speaking?.criteria || {};
      showToast(
        `Đã duyệt & trả điểm Speaking: Band ${updatedAttemptObj.overallBand} (FC ${crit.fc ?? '-'} · LR ${crit.lr ?? '-'} · GRA ${crit.gra ?? '-'} · PR ${crit.pr ?? '-'})!`
      );
    } else if (gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'listening') {
      showToast(`Đã lưu điểm Daily Listening: Band ${updatedAttemptObj.overallBand} (${cleanLRaw}/${lTotal} câu)!`);
    } else if (gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'reading') {
      showToast(`Đã lưu điểm Daily Reading: Band ${updatedAttemptObj.overallBand} (${cleanRRaw}/${rTotal} câu)!`);
    } else if (gradingAttempt.testMode === 'single_skill' && gradingAttempt.focusSkill === 'writing') {
      showToast(
        `Đã duyệt & trả điểm Daily Writing: Band ${updatedAttemptObj.overallBand}!`
      );
    } else {
      const spSuffix = typeof updatedAttemptObj.scores?.speaking?.band === 'number'
        ? ` · Speaking ${updatedAttemptObj.scores.speaking.band}`
        : '';
      showToast(
        includeWriting
          ? `Đã duyệt & trả điểm 4 kỹ năng: Listening ${lBand} · Reading ${rBand} · Writing ${updatedAttemptObj.scores?.writing?.overallBand ?? '-'}${spSuffix} · Overall ${updatedAttemptObj.overallBand}`
          : `Đã cập nhật điểm Listening ${lBand} & Reading ${rBand}!`
      );
    }
  };

  // Highlighter and Notes
  const dismissSelectionToolbar = () => {
    setSelectedPassageText('');
    setSelectionCoords(null);
  };

  const handlePassageTextSelect = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (!selectedText) {
      return;
    }
    let nextCoords = null;
    try {
      if (selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) {
          const vw = window.innerWidth || 1280;
          const vh = window.innerHeight || 720;
          const centerX = rect.left + rect.width / 2;
          const clampedX = Math.max(175, Math.min(vw - 175, centerX));
          const preferredY = rect.top > 125 ? rect.top - 52 : rect.bottom + 10;
          const clampedY = Math.max(70, Math.min(vh - 76, preferredY));
          nextCoords = { x: Math.round(clampedX), y: Math.round(clampedY) };
        }
      }
    } catch (_e) {
      nextCoords = null;
    }
    setSelectionCoords(nextCoords);
    setSelectedPassageText(selectedText);
  };

  const addHighlight = (color) => {
    if (!selectedPassageText) return;
    setExamState(prev => ({
      ...prev,
      highlights: [...prev.highlights, { id: Date.now() + Math.floor(Math.random() * 1000), text: selectedPassageText, color }]
    }));
    dismissSelectionToolbar();
  };

  const removeHighlight = (highlightId) => {
    if (!highlightId) return;
    setExamState(prev => ({
      ...prev,
      highlights: (prev.highlights || []).filter(item => item.id !== highlightId)
    }));
  };

  const addNote = (customNoteText = null) => {
    if (!selectedPassageText) return;
    const noteContent =
      typeof customNoteText === 'string'
        ? customNoteText.trim()
        : prompt('Nhập ghi chú cho đoạn văn bản đã chọn:', '');
    if (noteContent) {
      setExamState(prev => ({
        ...prev,
        notes: [...prev.notes, { id: Date.now(), text: selectedPassageText, note: noteContent }]
      }));
    }
    dismissSelectionToolbar();
  };

  const handleCopyInternalExamText = async (rawText) => {
    const clean = String(rawText || '').trim();
    if (!clean) return;
    await recordInternalCopy(clean);
    showToast('Đã sao chép văn bản nội bộ (chỉ dán được vào phần bài làm trong bài thi)!', 'info');
  };

  // Exam Builder
  const openExamBuilder = (testToEdit = null, initialTab = 'general', initialClassIds = []) => {
    setEditingTest(testToEdit || null);
    setBuilderListeningIdx(0);
    setBuilderReadingIdx(0);
    if (testToEdit) {
      const cloned = JSON.parse(JSON.stringify(testToEdit));
      const cfg = normalizeExamConfig(cloned);
      const tracks = getListeningTracks(cloned.listening);
      const passages = getReadingPassages(cloned.reading);
      setTestForm({
        ...cloned,
        visibility: cfg.visibility,
        examCategory: cfg.examCategory,
        dailySubCategory: cfg.dailySubCategory,
        writingTaskScope: cfg.writingTaskScope,
        examPurpose: cfg.examPurpose,
        examPassword: cfg.examPassword,
        hasExamPassword: cfg.hasExamPassword,
        hashtags: cfg.hashtags,
        maxAttempts: cfg.maxAttempts,
        sequentialMode: cfg.sequentialMode,
        allowEarlyNextSection: cfg.allowEarlyNextSection,
        antiCheatEnabled: cfg.antiCheatEnabled,
        allowInternalCopyPaste: cfg.allowInternalCopyPaste,
        assignedClassIds: cfg.assignedClassIds,
        sectionOrder: cfg.order,
        sectionDurations: cfg.durations,
        allowViewAnswers: cloned.allowViewAnswers ?? false,
        listening: {
          audioUrl: tracks[0]?.audioUrl || '',
          audioFileName: tracks[0]?.audioFileName || '',
          imageUrl: tracks[0]?.imageUrl || '',
          imageFileName: tracks[0]?.imageFileName || '',
          contextText: tracks[0]?.contextText || '',
          transcript: tracks[0]?.transcript || '',
          questions: [],
          ...(cloned.listening || {}),
          tracks
        },
        reading: {
          passageTitle: passages[0]?.title || '',
          passageText: passages[0]?.passageText || '',
          imageUrl: passages[0]?.imageUrl || '',
          imageFileName: passages[0]?.imageFileName || '',
          questions: [],
          ...(cloned.reading || {}),
          passages
        },
        writing: {
          task1: { prompt: '', minWords: 150, imageUrl: '', modelAnswer: '', ...(cloned.writing?.task1 || {}) },
          task2: { prompt: '', minWords: 250, modelAnswer: '', ...(cloned.writing?.task2 || {}) }
        },
        speaking: { ...createDefaultSpeakingSection(), ...(cloned.speaking || {}) }
      });
    } else {
      setTestForm({
        ...createEmptyTestForm(),
        id: 'test-' + Date.now(),
        assignedClassIds: Array.isArray(initialClassIds) ? Array.from(new Set(initialClassIds.filter(Boolean))) : [],
        title: 'Đề Thực Chiến IELTS Full 4 Kỹ Năng Mới',
        description: 'Đề thi thực chiến liên hoàn đủ 4 kỹ năng Listening, Reading, Writing và Speaking (1 lượt thi thật, chờ Ms. Như duyệt điểm).',
        createdAt: new Date().toISOString().split('T')[0],
        listening: {
          audioUrl: '',
          audioFileName: '',
          imageUrl: '',
          imageFileName: '',
          contextText: '',
          transcript: 'Welcome to the lecture. Today we will discuss key developments in modern education...',
          tracks: [
            {
              id: 'track-1',
              title: 'Chủ đề 1: Lecture Introduction',
              audioUrl: '',
              audioFileName: '',
              imageUrl: '',
              imageFileName: '',
              contextText: '',
              transcript: 'Welcome to the lecture. Today we will discuss key developments in modern education...'
            }
          ],
          questions: [
            {
              id: 'lq-' + Date.now(),
              type: 'mcq',
              trackIdx: 0,
              question: '1. What is the main topic of the speaker\'s presentation?',
              options: [
                'A. Modern educational technology',
                'B. University admission requirements',
                'C. Library renovation schedules',
                'D. International student housing'
              ],
              correctAnswer: 'A. Modern educational technology'
            }
          ]
        },
        reading: {
          passageTitle: 'Bài 1: Urban Architecture & Sustainability',
          passageText: 'Modern cities are increasingly adopting sustainable architectural practices to reduce carbon footprints and improve residents\' quality of life...',
          imageUrl: '',
          imageFileName: '',
          passages: [
            {
              id: 'passage-1',
              title: 'Bài 1: Urban Architecture & Sustainability',
              imageUrl: '',
              imageFileName: '',
              passageText: 'Modern cities are increasingly adopting sustainable architectural practices to reduce carbon footprints and improve residents\' quality of life...'
            }
          ],
          questions: [
            {
              id: 'rq-' + (Date.now() + 1),
              type: 'tfng',
              passageIdx: 0,
              question: '1. Sustainable architecture helps lower carbon emissions in urban areas.',
              options: ['TRUE', 'FALSE', 'NOT GIVEN'],
              correctAnswer: 'TRUE'
            }
          ]
        },
        writing: {
          task1: {
            prompt: 'Task 1: The chart below shows changes in energy consumption between 2010 and 2025. Summarise the information by selecting and reporting the main features.',
            minWords: 150,
            imageUrl: '',
            modelAnswer: ''
          },
          task2: {
            prompt: 'Task 2: Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university is to give access to knowledge for its own sake. Discuss both views and give your opinion.',
            minWords: 250,
            modelAnswer: ''
          }
        },
        speaking: createDefaultSpeakingSection()
      });
    }
    setBuilderTab(initialTab || 'general');
    setView('EXAM_BUILDER');
  };

  const openSingleSkillBuilder = (skill = 'speaking', testToEdit = null, initialClassIds = [], subOpts = {}) => {
    if (testToEdit) {
      openExamBuilder(testToEdit, skill || 'general');
      return;
    }
    setEditingTest(null);
    setBuilderListeningIdx(0);
    setBuilderReadingIdx(0);
    const cleanClassIds = Array.isArray(initialClassIds) ? Array.from(new Set(initialClassIds.filter(Boolean))) : [];
    const baseSingleForm = createEmptySingleSkillTestForm(skill, subOpts);
    let nextSpeaking = baseSingleForm.speaking;
    let extraSingleFields = {};
    if (skill === 'speaking' && view === 'SKILL_HUB') {
      if (skillHubTab === 'speaking_daily') {
        nextSpeaking = createDefaultSpeakingSection({
          speakingTrack: 'daily',
          dailyDate: getVietnamTodayDateKey(Date.now() + serverClockOffsetMsRef.current),
          dailyMandatory: true,
          hashtags: ['#DailySpeaking']
        });
        extraSingleFields = { hashtags: ['#DailySpeaking'], dailySubCategory: 'speaking_daily' };
      } else if (skillHubTab === 'forecast') {
        nextSpeaking = createDefaultSpeakingSection({
          speakingTrack: 'general',
          isForecast: true,
          hashtags: ['#CayForecastMsNhu']
        });
        extraSingleFields = { hashtags: ['#CayForecastMsNhu'], dailySubCategory: 'speaking_forecast' };
      }
    }
    setTestForm({
      ...baseSingleForm,
      ...extraSingleFields,
      speaking: nextSpeaking,
      assignedClassIds: cleanClassIds
    });
    setBuilderTab(skill);
    setView('EXAM_BUILDER');
  };

  // Upload Audio & Optional Media for Listening (Teacher Builder - supports multiple topics)
  const readFileAsDataUrl = (file, onLoad) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLoad(ev.target.result);
    reader.readAsDataURL(file);
  };

  const updateListeningTrackField = (idx, patch) => {
    setTestForm(prev => {
      const tracks = getListeningTracks(prev.listening);
      const updatedTracks = tracks.map((tr, i) => (i === idx ? { ...tr, ...patch } : tr));
      const first = updatedTracks[0] || {};
      return {
        ...prev,
        listening: {
          ...prev.listening,
          tracks: updatedTracks,
          audioUrl: first.audioUrl || '',
          audioFileName: first.audioFileName || '',
          imageUrl: first.imageUrl || '',
          imageFileName: first.imageFileName || '',
          contextText: first.contextText || '',
          transcript: first.transcript || ''
        }
      };
    });
  };

  const handleAudioFileUpload = (e, targetIdx = builderListeningIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File âm thanh quá lớn (vui lòng chọn file dưới 15MB để lưu trữ mượt mà trên trình duyệt, hoặc dùng Link URL ngoài)!');
      return;
    }
    readFileAsDataUrl(file, (dataUrl) => {
      updateListeningTrackField(targetIdx, {
        audioUrl: dataUrl,
        audioFileName: file.name
      });
      showToast(`Đã tải lên file ghi âm Chủ đề ${targetIdx + 1}: ${file.name}`);
    });
  };

  const handleListeningImageUpload = (e, targetIdx = builderListeningIdx) => {
    const file = e.target.files?.[0];
    readFileAsDataUrl(file, (dataUrl) => {
      updateListeningTrackField(targetIdx, {
        imageUrl: dataUrl,
        imageFileName: file.name
      });
      showToast(`Đã thêm ảnh Chủ đề nghe số ${targetIdx + 1}: ${file.name}`);
    });
  };

  // Upload Image for Reading Passage (Teacher Builder - supports multiple passages)
  const updateReadingPassageField = (idx, patch) => {
    setTestForm(prev => {
      const passages = getReadingPassages(prev.reading);
      const updatedPassages = passages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      const first = updatedPassages[0] || {};
      return {
        ...prev,
        reading: {
          ...prev.reading,
          passages: updatedPassages,
          passageTitle: first.title || '',
          passageText: first.passageText || '',
          imageUrl: first.imageUrl || '',
          imageFileName: first.imageFileName || ''
        }
      };
    });
  };

  const handleReadingImageUpload = (e, targetIdx = builderReadingIdx) => {
    const file = e.target.files?.[0];
    readFileAsDataUrl(file, (dataUrl) => {
      updateReadingPassageField(targetIdx, {
        imageUrl: dataUrl,
        imageFileName: file.name
      });
      showToast(`Đã thêm ảnh bài đọc số ${targetIdx + 1}: ${file.name}`);
    });
  };

  // Upload Chart Image for Writing Task 1 (Teacher Builder)
  const handleWritingTask1ImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTestForm(prev => ({
        ...prev,
        writing: {
          ...prev.writing,
          task1: {
            ...prev.writing.task1,
            imageUrl: ev.target.result
          }
        }
      }));
      showToast(`Đã thêm ảnh biểu đồ Writing Task 1: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Question CRUD Helpers for Listening & Reading Builder (all 11 Reading + 6 Listening types)
  const addQuestionToSkill = (skill, questionType = 'mcq') => {
    const currentQuestions = testForm[skill]?.questions || [];
    const nextNum = currentQuestions.length + 1;
    const defaults = buildDefaultQuestionFields(questionType, skill);
    const newQ = {
      id: `${skill[0]}q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...defaults,
      source: 'manual',
      question: `${nextNum}. Nhập nội dung câu hỏi số ${nextNum}...`,
      ...(skill === 'reading' ? { passageIdx: builderReadingIdx } : {}),
      ...(skill === 'listening' ? { trackIdx: builderListeningIdx } : {})
    };
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: [...(prev[skill]?.questions || []), newQ]
      }
    }));
  };

  const updateQuestionInSkill = (skill, qId, field, value) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).map(q => {
          if (q.id !== qId) return q;
          if (field === 'type') {
            const defaults = buildDefaultQuestionFields(value, skill, q.options);
            return { ...q, ...defaults };
          }
          return { ...q, [field]: value };
        })
      }
    }));
  };

  const updateOptionInSkill = (skill, qId, optIdx, newValue) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).map(q => {
          if (q.id !== qId) return q;
          const oldOpt = q.options[optIdx];
          const updatedOpts = [...q.options];
          updatedOpts[optIdx] = newValue;
          const updatedCorrect = q.correctAnswer === oldOpt ? newValue : q.correctAnswer;
          return { ...q, options: updatedOpts, correctAnswer: updatedCorrect };
        })
      }
    }));
  };

  const removeQuestionFromSkill = (skill, qId) => {
    setTestForm(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        questions: (prev[skill]?.questions || []).filter(q => q.id !== qId)
      }
    }));
  };

  const handleSaveTestBuilder = () => {
    if (!testForm.title.trim()) {
      setBuilderTab('general');
      showToast('Vui lòng nhập Tên Đề Thi ở tab Thông Tin Chung trước khi lưu!', 'error');
      setTimeout(() => document.getElementById('builder-test-title-input')?.focus(), 60);
      return;
    }
    const cfg = normalizeExamConfig(testForm);
    if (cfg.scheduleMode !== 'flexible' && !cfg.dueAt) {
      setBuilderTab('general');
      showToast('Vui lòng chọn Hạn chót nộp bài (hoặc chuyển sang Làm khi nào cũng được)!', 'error');
      return;
    }
    if (cfg.openAt && cfg.dueAt && cfg.openAt >= cfg.dueAt) {
      setBuilderTab('general');
      showToast('Giờ bắt đầu mở đề phải sớm hơn Hạn chót nộp bài!', 'error');
      return;
    }
    const tracks = getListeningTracks(testForm.listening);
    const firstTrack = tracks[0] || {};
    const passages = getReadingPassages(testForm.reading);
    const firstPassage = passages[0] || {};

    let syncedListeningQs = Array.isArray(testForm.listening?.questions) ? [...testForm.listening.questions] : [];
    tracks.forEach((tr, idx) => {
      if (String(tr.clozeText || '').trim()) {
        syncedListeningQs = syncClozeBlanksWithQuestions({
          clozeText: tr.clozeText,
          existingQuestions: syncedListeningQs,
          scopeField: 'trackIdx',
          scopeIdx: idx,
          skill: 'listening'
        });
      }
    });

    let syncedReadingQs = Array.isArray(testForm.reading?.questions) ? [...testForm.reading.questions] : [];
    passages.forEach((ps, idx) => {
      if (String(ps.clozeText || '').trim()) {
        syncedReadingQs = syncClozeBlanksWithQuestions({
          clozeText: ps.clozeText,
          existingQuestions: syncedReadingQs,
          scopeField: 'passageIdx',
          scopeIdx: idx,
          skill: 'reading'
        });
      }
    });

    const rawSp = normalizeSpeakingSection(testForm.speaking);
    const mergedSpeakingPass =
      cfg.focusSkill === 'speaking'
        ? String(rawSp.roomPassword || cfg.examPassword || '').trim()
        : rawSp.roomPassword;
    const mergedSpeakingHasPass =
      cfg.focusSkill === 'speaking'
        ? Boolean(mergedSpeakingPass || rawSp.hasRoomPassword || testForm.hasExamPassword)
        : rawSp.hasRoomPassword;
    const syncedSpeaking =
      cfg.focusSkill === 'speaking'
        ? {
            ...rawSp,
            speakingTrack:
              rawSp.speakingTrack === 'daily'
                ? 'daily'
                : mergedSpeakingHasPass || cfg.examPurpose === 'real_exam'
                ? 'exam_room'
                : rawSp.speakingTrack,
            roomPassword: mergedSpeakingPass,
            hasRoomPassword: mergedSpeakingHasPass,
            hashtags: cfg.hashtags
          }
        : rawSp;

    const normalizedTest = {
      ...testForm,
      testMode: cfg.testMode,
      focusSkill: cfg.focusSkill,
      examCategory: cfg.examCategory,
      dailySubCategory: cfg.dailySubCategory,
      writingTaskScope: cfg.writingTaskScope,
      visibility: cfg.visibility,
      examPurpose: cfg.examPurpose,
      priceVnd: cfg.testMode === 'single_skill' ? 0 : cfg.priceVnd,
      examPassword: cfg.focusSkill === 'speaking' ? mergedSpeakingPass : cfg.examPassword,
      hasExamPassword:
        cfg.focusSkill === 'speaking'
          ? mergedSpeakingHasPass
          : Boolean(cfg.examPassword || testForm.hasExamPassword),
      hashtags: cfg.hashtags,
      maxAttempts: cfg.maxAttempts,
      sequentialMode: cfg.sequentialMode,
      allowEarlyNextSection: cfg.allowEarlyNextSection,
      antiCheatEnabled: cfg.antiCheatEnabled,
      allowInternalCopyPaste: cfg.allowInternalCopyPaste,
      assignedClassIds: cfg.assignedClassIds,
      scheduleMode: cfg.scheduleMode,
      openAt: cfg.openAt,
      dueAt: cfg.dueAt,
      sectionOrder: cfg.order,
      sectionDurations: cfg.durations,
      speaking: syncedSpeaking,
      listening: {
        ...testForm.listening,
        tracks,
        questions: syncedListeningQs,
        audioUrl: firstTrack.audioUrl || '',
        audioFileName: firstTrack.audioFileName || '',
        imageUrl: firstTrack.imageUrl || '',
        imageFileName: firstTrack.imageFileName || '',
        contextText: firstTrack.contextText || '',
        clozeText: firstTrack.clozeText || '',
        transcript: firstTrack.transcript || ''
      },
      reading: {
        ...testForm.reading,
        passages,
        questions: syncedReadingQs,
        passageTitle: firstPassage.title || '',
        passageText: firstPassage.passageText || '',
        clozeText: firstPassage.clozeText || '',
        imageUrl: firstPassage.imageUrl || '',
        imageFileName: firstPassage.imageFileName || ''
      }
    };
    const existingIndex = tests.findIndex(t => t.id === normalizedTest.id);
    const itemNoun = cfg.testMode === 'single_skill' ? 'bài tập' : 'đề thi';
    if (existingIndex >= 0) {
      const updated = [...tests];
      updated[existingIndex] = normalizedTest;
      setTests(updated);
      showToast(`Đã cập nhật ${itemNoun} "${normalizedTest.title}" thành công!`);
    } else {
      setTests([...tests, normalizedTest]);
      showToast(`Đã tạo mới ${itemNoun} "${normalizedTest.title}" thành công!`);
    }
    dispatchSyncAction('UPSERT_TEST', { test: normalizedTest });
    clearBuilderDraft(currentUser?.username);
    setEditingTest(null);
    setTeacherHubTab(cfg.testMode === 'single_skill' ? 'skill_exercises' : 'tests');
    setView('TEACHER_DASHBOARD');
  };

  // ==========================================
  // 3. GAME ARENA ENGINE LOGIC (REACT INTEGRATED)
  // ==========================================
  const skipNonAlphaIndex = (word, startIdx = 0) => {
    const upper = (word || '').toUpperCase();
    let idx = startIdx;
    while (idx < upper.length && !/^[A-Z]$/.test(upper[idx])) {
      idx++;
    }
    return idx;
  };

  const getGameTypingTarget = (questionObj, roundNum) => {
    if (!questionObj) return '';
    if (roundNum === 4) {
      return String(questionObj.v4Target || questionObj.collocation || questionObj.word || '').trim().toUpperCase();
    }
    return String(questionObj.word || '').trim().toUpperCase();
  };

  // Sync mutable pilot prefs for Canvas spaceship rendering & persist locally
  useEffect(() => {
    gameRuntimeRef.current.crewColorId = myCrewColor;
    gameRuntimeRef.current.animalId = myAnimalId;
    gameRuntimeRef.current.accessoryId = myAccessoryId;
    try {
      localStorage.setItem(
        'ielts_game_pilot_prefs',
        JSON.stringify({ colorId: myCrewColor, animalId: myAnimalId, accessoryId: myAccessoryId })
      );
    } catch {}
  }, [myCrewColor, myAnimalId, myAccessoryId]);

  useEffect(() => {
    const url = currentUser?.avatarUrl || '';
    if (!url || typeof Image === 'undefined') {
      avatarImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      avatarImageRef.current = img;
    };
    img.onerror = () => {
      avatarImageRef.current = null;
    };
    img.src = url;
  }, [currentUser?.avatarUrl]);

  // Helper to spawn particle bursts inside Space Arena Canvas
  const pushGameParticles = (x, y, color = '#00f2fe', count = 18) => {
    const arr = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.6 + Math.random() * 4.2;
      arr.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
  };

  const recordMissedWordInMatch = (word) => {
    const clean = String(word || '').trim().toUpperCase();
    if (!clean) return;
    if (!missedWordsMatchRef.current.includes(clean)) {
      missedWordsMatchRef.current = [...missedWordsMatchRef.current, clean];
    }
  };

  const resetWordTimer = (roundNum, speedModeOverride = null) => {
    const mode = speedModeOverride || gameRuntimeRef.current.speedMode || 'normal';
    const limit = getSpeedAdjustedTimeLimit(roundNum, mode);
    wordStartedAtRef.current = Date.now();
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;
    setIsFrozenBoost(false);
    timeRemainingFloatRef.current = limit;
    gameRuntimeRef.current.timeLimit = limit;
    gameRuntimeRef.current.questionResolved = false;
    setGameTimeLimit(limit);
    setGameTimeLeft(limit);
  };

  const recordGameWordReview = (questionObj, roundNum, isCorrect) => {
    if (!questionObj) return;
    setGameReviewLog(prev => {
      const idx = prev.findIndex(item => item.word === questionObj.word && item.round === roundNum);
      if (idx === -1) {
        return [...prev, {
          round: roundNum,
          word: questionObj.word,
          ipa: questionObj.ipa,
          prompt: questionObj.prompt,
          example: questionObj.example,
          passed: isCorrect
        }];
      }
      if (!isCorrect && prev[idx].passed) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], passed: false };
        return updated;
      }
      return prev;
    });
  };

  const buildRoundQueuesFromRoom = (pin, userObj = currentUser) => {
    const room = normalizeRoomObject(roomsDb[pin] || { rawVocab: DEFAULT_VOCAB_TEXT }, pin);
    return buildSeededRoundQueues(room, pin, userObj?.username || '', DEFAULT_VOCAB_TEXT);
  };

  // Sync authoritative server-side fastest-responder bonuses into live Game HUD
  useEffect(() => {
    if (view !== 'GAME_ARENA' || !currentUser || currentUser.role === 'teacher') return;
    if (gameRuntimeRef.current?.subState !== 'PLAYING' || gameRuntimeRef.current?.isSandbox) return;
    const activePin = joinedRoomPin || currentRoomPin;
    const myLiveEntry = roomsDb[activePin]?.liveMatch?.[currentUser.username];
    const remoteBonus = Number(myLiveEntry?.serverFirstBonusTotal) || 0;
    if (remoteBonus > serverBonusTotalRef.current) {
      const delta = remoteBonus - serverBonusTotalRef.current;
      serverBonusTotalRef.current = remoteBonus;
      gameRuntimeRef.current.score += delta;
      setGameScore(gameRuntimeRef.current.score);
      if (myLiveEntry?.lastFastestRank === 1 && myLiveEntry?.lastFastestWord) {
        triggerGameToast(
          `⚡ Nhanh nhất từ "${myLiveEntry.lastFastestWord}"! +${myLiveEntry.lastFastestBonus || delta}đ Hạng #1`,
          true
        );
      }
    }
  }, [roomsDb, view, joinedRoomPin, currentRoomPin, currentUser]);

  const submitPracticeGameScore = (scoreVal, passedWords, totalWords) => {
    if (!currentUser?.username) return;
    const meta = gameRuntimeRef.current.practiceMeta || practiceTopicMeta || { topicId: 'core', topicLabel: 'IELTS Core Academic', mode: 'full_4' };
    dispatchSyncAction('SUBMIT_PRACTICE_GAME_SCORE', {
      username: currentUser.username,
      topicId: meta.topicId || 'core',
      topicLabel: meta.topicLabel || 'IELTS Core Academic',
      mode: meta.singleRoundOnly ? `round_${gameRuntimeRef.current.round}` : 'full_4',
      score: scoreVal,
      passedCount: passedWords,
      totalCount: Math.max(1, totalWords)
    });
  };

  const initPracticeGameCampaign = ({
    topicId = 'core',
    topicLabel = 'IELTS Core Academic',
    rawVocab = DEFAULT_VOCAB_TEXT,
    speedMode = 'normal',
    startRound = 1,
    singleRoundOnly = false
  } = {}) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    serverBonusTotalRef.current = 0;

    const queues = buildPracticeRoundQueues({
      rawVocab: rawVocab || DEFAULT_VOCAB_TEXT,
      roundSize: 4,
      seedStr: `practice:${currentUser?.username || 'guest'}:${Date.now()}`
    });
    const validRound = [1, 2, 3, 4].includes(Number(startRound)) ? Number(startRound) : 1;
    const firstQ = queues[validRound]?.[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(getGameTypingTarget(firstQ, validRound), 0) : 0;

    homingLasersRef.current = [];
    particlesRef.current = [];
    missedWordsMatchRef.current = [];
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;

    const limit = getSpeedAdjustedTimeLimit(validRound, speedMode);
    const practiceMeta = { topicId, topicLabel, singleRoundOnly, mode: singleRoundOnly ? `round_${validRound}` : 'full_4' };
    setPracticeTopicMeta(practiceMeta);
    setIsPracticeGameSession(true);

    gameRuntimeRef.current = {
      round: validRound,
      score: 0,
      lives: 3,
      combo: 0,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      queues,
      isSandbox: false,
      isPractice: true,
      practiceMeta,
      paused: false,
      speedMode,
      crewColorId: myCrewColor,
      animalId: myAnimalId,
      accessoryId: myAccessoryId,
      timeLimit: limit,
      questionResolved: false
    };

    setGameQueues(queues);
    setGameRound(validRound);
    setGameScore(0);
    setGameLives(3);
    setGameCombo(0);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGamePaused(false);
    setFreezeCharges(2);
    setIsFrozenBoost(false);
    setGameOutcome(null);
    setIsSandboxRound(false);
    setGameReviewLog([]);
    setActiveQuestion(firstQ);
    setView('GAME_ARENA');
    resetWordTimer(validRound, speedMode);

    if (validRound === 2 && firstQ) {
      speakWord(firstQ.word);
    } else if (validRound === 4 && firstQ) {
      speakWord(firstQ.v4Display || firstQ.collocation || firstQ.word);
    }
  };

  const initGameCampaign = (pin = joinedRoomPin || currentRoomPin, _userObj = currentUser) => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    serverBonusTotalRef.current = 0;
    setIsPracticeGameSession(false);

    const roomObj = normalizeRoomObject(roomsDb[pin] || {}, pin);
    const speedMode = roomObj.speedMode || 'normal';
    const queues = buildRoundQueuesFromRoom(pin, _userObj);
    const firstQ = queues[1][0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(firstQ.word, 0) : 0;

    homingLasersRef.current = [];
    particlesRef.current = [];
    missedWordsMatchRef.current = [];
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;

    const r1Limit = getSpeedAdjustedTimeLimit(1, speedMode);
    gameRuntimeRef.current = {
      round: 1,
      score: 0,
      lives: 3,
      combo: 0,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      queues,
      isSandbox: false,
      isPractice: false,
      practiceMeta: null,
      paused: false,
      speedMode,
      crewColorId: myCrewColor,
      animalId: myAnimalId,
      accessoryId: myAccessoryId,
      timeLimit: r1Limit,
      questionResolved: false
    };

    setGameQueues(queues);
    setGameRound(1);
    setGameScore(0);
    setGameLives(3);
    setGameCombo(0);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGamePaused(false);
    setFreezeCharges(2);
    setIsFrozenBoost(false);
    setGameOutcome(null);
    setIsSandboxRound(false);
    setGameReviewLog([]);
    setActiveQuestion(firstQ);
    resetWordTimer(1, speedMode);
    syncLiveMatchProgress({
      scoreVal: 0,
      streakVal: 0,
      livesVal: 3,
      roundNum: 1,
      progressText: `Vòng 1/4 • Câu 1/${Math.max(1, queues[1]?.length || 1)}`,
      missedWords: []
    });
  };

  const jumpToGameSandboxRound = (roundNum) => {
    if (currentUser?.role !== 'teacher') return;
    const activePin = joinedRoomPin || currentRoomPin;
    const activeRoom = normalizeRoomObject(roomsDb[activePin] || {}, activePin);
    const hasStudents = Object.values(activeRoom?.lobbyPlayers || {}).some((p) => p?.role !== 'teacher');
    if (hasStudents) {
      showToast('Phòng đã có học sinh - Giáo viên chỉ giám sát Đua Top, không chơi lúc này!', 'info');
      return;
    }
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    setIsPracticeGameSession(false);

    let queues = gameRuntimeRef.current.queues;
    if (!queues?.[roundNum]?.length) {
      queues = buildRoundQueuesFromRoom(activePin, currentUser);
      setGameQueues(queues);
    }
    const speedMode = activeRoom.speedMode || 'normal';
    const queue = queues[roundNum] || [];
    const firstQ = queue[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(getGameTypingTarget(firstQ, roundNum), 0) : 0;

    homingLasersRef.current = [];
    particlesRef.current = [];
    missedWordsMatchRef.current = [];
    bonusTimeSecRef.current = 0;
    freezeUntilRef.current = 0;

    gameRuntimeRef.current = {
      ...gameRuntimeRef.current,
      round: roundNum,
      lives: 3,
      wordIdx: 0,
      typedProgress: initialProgress,
      subState: 'PLAYING',
      activeQuestion: firstQ,
      isSandbox: true,
      isPractice: false,
      paused: false,
      speedMode,
      crewColorId: myCrewColor,
      animalId: myAnimalId,
      accessoryId: myAccessoryId,
      timeLimit: getSpeedAdjustedTimeLimit(roundNum, speedMode),
      questionResolved: false
    };

    setGameRound(roundNum);
    setGameLives(3);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setGamePaused(false);
    setFreezeCharges(2);
    setIsFrozenBoost(false);
    setGameOutcome(null);
    setIsSandboxRound(true);
    setActiveQuestion(firstQ);
    resetWordTimer(roundNum, speedMode);

    if (roundNum === 2 && firstQ) {
      speakWord(firstQ.word);
    } else if (roundNum === 4 && firstQ) {
      speakWord(firstQ.v4Display || firstQ.collocation || firstQ.word);
    }
  };

  const advanceNextGameRound = () => {
    clearTimeout(autoNextTimerRef.current);
    const rt = gameRuntimeRef.current;
    const nextR = rt.round + 1;
    const queue = rt.queues[nextR] || [];
    const firstQ = queue[0] || null;
    const initialProgress = firstQ ? skipNonAlphaIndex(getGameTypingTarget(firstQ, nextR), 0) : 0;

    homingLasersRef.current = [];
    rt.round = nextR;
    rt.wordIdx = 0;
    rt.typedProgress = initialProgress;
    rt.subState = 'PLAYING';
    rt.activeQuestion = firstQ;
    rt.questionResolved = false;

    setGameRound(nextR);
    setGameWordIdx(0);
    setGameTypedProgress(initialProgress);
    setGameSubState('PLAYING');
    setActiveQuestion(firstQ);
    resetWordTimer(nextR);
    if (!rt.isPractice) {
      syncLiveMatchProgress({
        scoreVal: rt.score,
        streakVal: rt.combo,
        livesVal: rt.lives,
        roundNum: nextR,
        progressText: `Vòng ${nextR}/4 • Câu 1/${Math.max(1, queue.length)}`,
        missedWords: [...missedWordsMatchRef.current]
      });
    }

    if (firstQ && nextR === 2) {
      speakWord(firstQ.word);
    } else if (firstQ && nextR === 4) {
      speakWord(firstQ.v4Display || firstQ.collocation || firstQ.word);
    }
  };

  // Handle word progression in game
  const handleWordCleared = (isCorrect, latestScoreOverride = null, latestComboOverride = null, solveEvent = null) => {
    const rt = gameRuntimeRef.current;
    const q = rt.activeQuestion;
    if (!q || rt.subState !== 'PLAYING') return;

    const currentRoundNum = rt.round;
    const finalScore = latestScoreOverride !== null ? latestScoreOverride : rt.score;
    const finalCombo = latestComboOverride !== null ? latestComboOverride : rt.combo;

    recordGameWordReview(q, currentRoundNum, isCorrect);
    if (!isCorrect) {
      recordMissedWordInMatch(q.word);
    }

    const currentQueue = rt.queues[currentRoundNum] || [];
    const nextIdx = rt.wordIdx + 1;

    if (nextIdx < currentQueue.length) {
      const nextQ = currentQueue[nextIdx];
      const nextTyped = skipNonAlphaIndex(getGameTypingTarget(nextQ, currentRoundNum), 0);
      rt.wordIdx = nextIdx;
      rt.activeQuestion = nextQ;
      rt.typedProgress = nextTyped;
      rt.questionResolved = false;

      setGameWordIdx(nextIdx);
      setActiveQuestion(nextQ);
      setGameTypedProgress(nextTyped);
      resetWordTimer(currentRoundNum);
      if (!rt.isPractice) {
        syncLiveMatchProgress({
          scoreVal: finalScore,
          streakVal: finalCombo,
          livesVal: rt.lives,
          roundNum: currentRoundNum,
          progressText: `Vòng ${currentRoundNum}/4 • Câu ${nextIdx + 1}/${Math.max(1, currentQueue.length)}`,
          missedWords: [...missedWordsMatchRef.current],
          ...(isCorrect && solveEvent ? { solveEvent } : {})
        });
      }

      if (currentRoundNum === 2) {
        speakWord(nextQ.word);
      } else if (currentRoundNum === 4) {
        speakWord(nextQ.v4Display || nextQ.collocation || nextQ.word);
      }
    } else {
      clearInterval(wordTimerRef.current);
      const isSingleStop = (rt.isSandbox) || (rt.isPractice && rt.practiceMeta?.singleRoundOnly);
      if (currentRoundNum < 4 && !isSingleStop) {
        rt.subState = 'TRANSITION';
        setGameSubState('TRANSITION');
        setTransitionCountdown(3);
        if (!rt.isPractice) {
          syncLiveMatchProgress({
            scoreVal: finalScore,
            streakVal: finalCombo,
            livesVal: rt.lives,
            roundNum: currentRoundNum,
            progressText: `Xong Vòng ${currentRoundNum}/4`,
            missedWords: [...missedWordsMatchRef.current],
            ...(isCorrect && solveEvent ? { solveEvent } : {})
          });
        }
        let countdown = 3;
        clearTimeout(autoNextTimerRef.current);
        const tick = () => {
          if (gameRuntimeRef.current.subState !== 'TRANSITION') return;
          countdown--;
          setTransitionCountdown(Math.max(0, countdown));
          if (countdown <= 0) {
            advanceNextGameRound();
          } else {
            autoNextTimerRef.current = setTimeout(tick, 1000);
          }
        };
        autoNextTimerRef.current = setTimeout(tick, 1000);
      } else {
        // Finished all 4 rounds, Practice Run, or Sandbox Round
        rt.subState = 'GAMEOVER';
        setGameOutcome('VICTORY');
        setGameSubState('GAMEOVER');
        const allMissed = [...missedWordsMatchRef.current];
        const passedTotal = (gameReviewLog.filter(i => i.passed).length) + (isCorrect ? 1 : 0);
        const attemptedTotal = gameReviewLog.length + (gameReviewLog.some(i => i.word === q.word && i.round === currentRoundNum) ? 0 : 1);
        if (rt.isPractice) {
          submitPracticeGameScore(finalScore, passedTotal, attemptedTotal);
        } else {
          syncLiveMatchProgress({
            scoreVal: finalScore,
            streakVal: finalCombo,
            livesVal: rt.lives,
            roundNum: currentRoundNum,
            progressText: 'Hoàn thành 4 Vòng',
            finished: true,
            outcome: 'VICTORY',
            missedWords: allMissed,
            ...(isCorrect && solveEvent ? { solveEvent } : {})
          });
          syncScoreToLeaderboard(
            finalScore,
            rt.isSandbox ? `Hoàn thành Màn ${currentRoundNum} (GV)` : 'Hoàn thành 4 Vòng',
            finalCombo,
            allMissed
          );
        }
      }
    }
  };

  // Unified life deduction & immediate Game Over when lives hit 0
  const handleGameLifeLoss = (reasonMessage, advanceOnSurvive = false) => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING') return;

    const q = rt.activeQuestion;
    const roundNum = rt.round;
    const nextLives = Math.max(0, rt.lives - 1);

    rt.lives = nextLives;
    rt.combo = 0;
    setGameLives(nextLives);
    setGameCombo(0);

    playSound('wrong');
    triggerGameToast(reasonMessage, false);

    if (q) {
      recordGameWordReview(q, roundNum, false);
      recordMissedWordInMatch(q.word);
    }
    const allMissed = [...missedWordsMatchRef.current];

    if (nextLives <= 0) {
      clearTimeout(autoNextTimerRef.current);
      clearInterval(wordTimerRef.current);
      rt.subState = 'GAMEOVER';
      rt.questionResolved = true;
      setGameOutcome('LOST');
      setGameSubState('GAMEOVER');
      if (rt.isPractice) {
        const passedTotal = gameReviewLog.filter(i => i.passed).length;
        const attemptedTotal = Math.max(1, gameReviewLog.length + 1);
        submitPracticeGameScore(rt.score, passedTotal, attemptedTotal);
      } else {
        syncLiveMatchProgress({
          scoreVal: rt.score,
          streakVal: 0,
          livesVal: 0,
          roundNum,
          progressText: `Hết mạng ở Vòng ${roundNum}/4`,
          finished: true,
          outcome: 'LOST',
          missedWords: allMissed
        });
        syncScoreToLeaderboard(
          rt.score,
          `Hết mạng ở Vòng ${roundNum}`,
          0,
          allMissed
        );
      }
      return;
    }

    if (advanceOnSurvive) {
      handleWordCleared(false, rt.score, 0);
    } else if (!rt.isPractice) {
      syncLiveMatchProgress({
        scoreVal: rt.score,
        streakVal: 0,
        livesVal: nextLives,
        roundNum,
        progressText: `Vòng ${roundNum}/4 • Câu ${rt.wordIdx + 1}/${Math.max(1, (rt.queues[roundNum] || []).length)}`,
        missedWords: allMissed
      });
    }
  };

  // Unified choice / target resolution helper for V1 (Meaning) & V3 (Syn/Ant/Def)
  const resolveGameChoiceAttempt = (choiceLabel, isCorrect, fxX = null, fxY = null) => {
    const rt = gameRuntimeRef.current;
    const q = rt.activeQuestion;
    if (!q || rt.subState !== 'PLAYING' || rt.questionResolved || rt.paused) return false;
    if (rt.round !== 1 && rt.round !== 3) return false;

    const canvas = canvasRef.current;
    const px = fxX ?? ((canvas?.width || 800) / 2);
    const py = fxY ?? Math.max(90, (canvas?.height || 460) * 0.35);

    if (isCorrect) {
      rt.questionResolved = true;
      const limitSec = Math.max(1, rt.timeLimit || 22);
      const remainRatio = Math.max(0, Math.min(1, timeRemainingFloatRef.current / limitSec));
      const reactionMs = Math.max(200, Math.round((limitSec - timeRemainingFloatRef.current) * 1000));
      const basePts = rt.round === 3 ? 180 : 120;
      const speedBonus = Math.round(remainRatio * 90);
      const feverMult = rt.combo >= 3 ? 2 : 1;
      const gain = (basePts + rt.combo * 25 + speedBonus) * feverMult;
      const nextCombo = rt.combo + 1;
      const nextScore = rt.score + gain;
      rt.score = nextScore;
      rt.combo = nextCombo;
      setGameScore(nextScore);
      setGameCombo(nextCombo);

      pushGameParticles(px, py, feverMult > 1 ? '#fbbf24' : '#22d3ee', 26);
      playSound('word_clear');
      speakWord(q.word);
      const feedbackTag = rt.round === 3 ? q.v3Target : `${q.word} (${q.ipa})`;
      triggerGameToast(
        `✅ Chính xác! ${feedbackTag} +${gain}đ${speedBonus > 0 ? ` (⚡+${speedBonus})` : ''}${feverMult > 1 ? ' 🔥 FEVER x2!' : ''}`,
        true
      );
      handleWordCleared(true, nextScore, nextCombo, {
        questionKey: `${rt.round}:${q.word}`,
        word: q.word,
        reactionMs
      });
      return true;
    }

    pushGameParticles(px, py, '#fb7185', 16);
    const roundHint = rt.round === 3
      ? 'Hãy đọc kỹ yêu cầu Đồng nghĩa / Trái nghĩa / Định nghĩa!'
      : 'Hãy nhìn kỹ nghĩa tiếng Việt & bắn mục tiêu đúng!';
    handleGameLifeLoss(`❌ Chọn nhầm "${choiceLabel}"! ${roundHint}`, false);
    return false;
  };
  const resolveGameChoiceAttemptRef = useRef(resolveGameChoiceAttempt);
  resolveGameChoiceAttemptRef.current = resolveGameChoiceAttempt;

  const handleGameChoiceSelect = (choiceText) => {
    const rt = gameRuntimeRef.current;
    const q = rt.activeQuestion;
    if (!q || rt.subState !== 'PLAYING' || rt.questionResolved) return;
    const targetAnswer = rt.round === 1 ? q.word : rt.round === 3 ? q.v3Target : '';
    if (!targetAnswer) return;
    const isCorrect = String(choiceText || '').trim().toLowerCase() === String(targetAnswer).trim().toLowerCase();
    resolveGameChoiceAttempt(choiceText, isCorrect);
  };

  // Handle continuous typing attack in Round 2 (Full Word Boss) & Round 4 (Collocation Boss)
  const handleGameTypingInput = (char) => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || (rt.round !== 2 && rt.round !== 4) || !rt.activeQuestion || rt.questionResolved) return;

    const q = rt.activeQuestion;
    const target = getGameTypingTarget(q, rt.round);
    const expected = target[rt.typedProgress];

    if (char === expected) {
      playSound('type_hit');
      const nextProgress = skipNonAlphaIndex(target, rt.typedProgress + 1);
      rt.typedProgress = nextProgress;
      setGameTypedProgress(nextProgress);

      // Visual continuous laser attack & hit sparks toward boss monster
      const canvas = canvasRef.current;
      const w = canvas?.width || 800;
      const h = canvas?.height || 460;
      const hitX = w / 2 + (Math.random() * 44 - 22);
      const hitY = Math.max(60, h * 0.28);
      homingLasersRef.current.push({
        x: w / 2,
        y: h - 42,
        targetX: hitX,
        targetY: hitY,
        color: rt.round === 4 ? '#f43f5e' : '#10b981',
        progress: 0
      });
      pushGameParticles(hitX, hitY, rt.round === 4 ? '#fb7185' : '#34d399', 6);

      if (nextProgress >= target.length) {
        rt.questionResolved = true;
        const limitSec = Math.max(1, rt.timeLimit || (rt.round === 4 ? 32 : 25));
        const remainRatio = Math.max(0, Math.min(1, timeRemainingFloatRef.current / limitSec));
        const reactionMs = Math.max(200, Math.round((limitSec - timeRemainingFloatRef.current) * 1000));
        const speedBonus = Math.round(remainRatio * (rt.round === 4 ? 140 : 120));
        const feverMult = rt.combo >= 3 ? 2 : 1;
        const bonus = rt.round === 4 ? 260 : 200;
        const streakBonus = rt.combo * 25;
        const totalGain = (bonus + streakBonus + speedBonus) * feverMult;
        const nextScore = rt.score + totalGain;
        const nextCombo = rt.combo + 1;

        rt.score = nextScore;
        rt.combo = nextCombo;
        setGameScore(nextScore);
        setGameCombo(nextCombo);

        pushGameParticles(w / 2, Math.max(80, h * 0.3), feverMult > 1 ? '#fbbf24' : (rt.round === 4 ? '#f43f5e' : '#34d399'), rt.round === 4 ? 36 : 26);
        playSound('word_clear');
        speakWord(rt.round === 4 ? (q.v4Display || q.collocation || q.word) : q.word);
        const clearedLabel = rt.round === 4 ? `"${q.v4Display || q.collocation}"` : `${q.word} (${q.ipa})`;
        triggerGameToast(
          `${rt.round === 4 ? '💥 HẠ GỤC BOSS COLLOCATION!' : '🎯 Chính xác!'} ${clearedLabel} +${totalGain}đ${speedBonus > 0 ? ` (⚡+${speedBonus})` : ''}${feverMult > 1 ? ' 🔥 FEVER x2!' : ''}`,
          true
        );
        handleWordCleared(true, nextScore, nextCombo, {
          questionKey: `${rt.round}:${q.word}`,
          word: q.word,
          reactionMs
        });
      }
    } else {
      playSound('wrong');
      rt.combo = 0;
      setGameCombo(0);
      triggerGameToast(`❌ Sai chữ cái "${char}". Gõ chính xác để tấn công Boss!`, false);
    }
  };

  const handleGameHint = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || (rt.round !== 2 && rt.round !== 4) || !rt.activeQuestion || rt.paused) return;
    const nextChar = getGameTypingTarget(rt.activeQuestion, rt.round)[rt.typedProgress];
    if (!nextChar) return;
    const nextScore = Math.max(0, rt.score - 15);
    rt.score = nextScore;
    setGameScore(nextScore);
    handleGameTypingInput(nextChar);
  };

  const handleUseFreezePowerup = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || rt.paused || freezeCharges <= 0 || !rt.activeQuestion) return;
    bonusTimeSecRef.current += 8;
    freezeUntilRef.current = Date.now() + 4500;
    setFreezeCharges(prev => Math.max(0, prev - 1));
    setIsFrozenBoost(true);
    setGameTimeLeft(prev => prev + 8);
    const canvas = canvasRef.current;
    pushGameParticles((canvas?.width || 800) / 2, Math.max(90, (canvas?.height || 460) * 0.35), '#38bdf8', 24);
    playSound('word_clear');
    triggerGameToast('❄️ Đóng băng mục tiêu +8 giây!', true);
    setTimeout(() => {
      if (Date.now() >= freezeUntilRef.current - 50) {
        setIsFrozenBoost(false);
      }
    }, 4500);
  };

  const handleToggleGamePause = () => {
    const rt = gameRuntimeRef.current;
    if (rt.subState !== 'PLAYING' || !rt.isSandbox) return;
    if (!rt.paused) {
      pausedStartedAtRef.current = Date.now();
      rt.paused = true;
      setGamePaused(true);
      showToast('Đã tạm dừng màn demo để giảng giải từ vựng.', 'info');
    } else {
      if (pausedStartedAtRef.current > 0) {
        bonusTimeSecRef.current += (Date.now() - pausedStartedAtRef.current) / 1000;
        pausedStartedAtRef.current = 0;
      }
      rt.paused = false;
      setGamePaused(false);
    }
  };

  const handleToggleGameMute = () => {
    const nextMuted = !gameMuted;
    setGameMuted(nextMuted);
    if (typeof window !== 'undefined') {
      window.__lexiprepMuted = nextMuted;
      if (nextMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    showToast(nextMuted ? 'Đã tắt âm thanh hiệu ứng & giọng đọc.' : 'Đã bật lại âm thanh Game.', 'info');
  };

  // Per-Word Countdown Timer for Game Arena (Round 1, Round 2, Round 3)
  useEffect(() => {
    clearInterval(wordTimerRef.current);
    if (view !== 'GAME_ARENA' || gameSubState !== 'PLAYING' || !activeQuestion) return;

    const speedMode = gameRuntimeRef.current.speedMode || 'normal';
    const limit = getSpeedAdjustedTimeLimit(gameRound, speedMode);
    wordStartedAtRef.current = Date.now();
    bonusTimeSecRef.current = 0;
    pausedStartedAtRef.current = 0;
    timeRemainingFloatRef.current = limit;
    gameRuntimeRef.current.timeLimit = limit;
    gameRuntimeRef.current.questionResolved = false;

    wordTimerRef.current = setInterval(() => {
      const rt = gameRuntimeRef.current;
      if (rt.subState !== 'PLAYING' || rt.paused) return;
      const elapsedSec = (Date.now() - wordStartedAtRef.current) / 1000;
      const effectiveLimit = limit + bonusTimeSecRef.current;
      const remaining = Math.max(0, effectiveLimit - elapsedSec);
      timeRemainingFloatRef.current = remaining;
      setGameTimeLeft(Math.ceil(remaining));

      if (remaining <= 0 && !rt.questionResolved) {
        rt.questionResolved = true;
        clearInterval(wordTimerRef.current);
        const currentAnswer = rt.round === 4
          ? (rt.activeQuestion?.v4Display || getGameTypingTarget(rt.activeQuestion, 4))
          : (rt.activeQuestion?.word || '');
        handleGameLifeLoss(`⏰ Hết thời gian! Đáp án đúng là "${currentAnswer}"`, true);
      }
    }, 100);

    return () => clearInterval(wordTimerRef.current);
  }, [view, gameSubState, gameRound, activeQuestion]);

  // Keyboard Event Listeners for Game Arena
  useEffect(() => {
    if (view !== 'GAME_ARENA' || gameSubState !== 'PLAYING') return;

    const handleKeyDown = (e) => {
      const rt = gameRuntimeRef.current;
      if (e.code === 'Tab' && rt.activeQuestion) {
        e.preventDefault();
        const phraseToSpeak = rt.round === 4
          ? (rt.activeQuestion.v4Display || getGameTypingTarget(rt.activeQuestion, 4) || rt.activeQuestion.word)
          : rt.activeQuestion.word;
        speakWord(phraseToSpeak);
        return;
      }
      if (e.code === 'Digit2') {
        e.preventDefault();
        handleUseFreezePowerup();
        return;
      }
      if (rt.paused) return;
      if (rt.round === 2 || rt.round === 4) {
        if (e.code === 'Digit1') {
          e.preventDefault();
          handleGameHint();
          return;
        }
        if (e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          handleGameTypingInput(e.key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, gameSubState, freezeCharges, gamePaused]);

  // Canvas Animation Game Loop (Space-Shooter Canvas with ResizeObserver)
  useEffect(() => {
    if (view !== 'GAME_ARENA') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parentEl = canvas.parentElement;

    let width = (canvas.width = Math.max(300, parentEl?.clientWidth || 800));
    let height = (canvas.height = Math.max(220, parentEl?.clientHeight || 460));

    let playerX = width / 2;
    let bullets = [];
    let chickens = [];
    let stars = [];
    const pressedKeys = {};

    for (let i = 0; i < 65; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.1 + 0.3
      });
    }

    const spawnRoundChickens = (q, roundNum = 1) => {
      chickens = [];
      if (!q) return;
      let choices = [];
      if (roundNum === 1) {
        choices = [
          { word: q.word, fullValue: q.word, isCorrect: true },
          ...q.distractors.map(w => ({ word: w, fullValue: w, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);
      } else if (roundNum === 3 && Array.isArray(q.v3Choices)) {
        choices = q.v3Choices.map((c, cIdx) => {
          const code = String.fromCharCode(65 + cIdx);
          const shortWord = c.length > 16 ? `${code}. ${c.slice(0, 14)}…` : `${code}. ${c}`;
          return { word: shortWord, fullValue: c, isCorrect: c === q.v3Target };
        });
      }

      const twoRows = width < 620 && choices.length >= 4;
      const topCount = twoRows ? Math.ceil(choices.length / 2) : choices.length;
      const bottomCount = choices.length - topCount;

      choices.forEach((c, idx) => {
        const isSecondRow = twoRows && idx >= topCount;
        const rowCount = isSecondRow ? bottomCount : topCount;
        const rowIdx = isSecondRow ? idx - topCount : idx;
        const margin = Math.min(72, width * 0.14);
        const usableW = Math.max(120, width - margin * 2);
        const slotX = rowCount === 1
          ? width / 2
          : margin + (usableW * rowIdx) / (rowCount - 1);

        chickens.push({
          x: slotX,
          baseX: slotX,
          rowOffset: isSecondRow ? 74 : (idx % 2 === 0 ? 0 : 22),
          y: 70,
          width: Math.min(132, Math.max(88, width / 5)),
          height: 58,
          word: c.word,
          fullValue: c.fullValue,
          isCorrect: c.isCorrect,
          wingPhase: Math.random() * Math.PI * 2,
          swayRange: width < 520 ? 8 : 16
        });
      });
    };

    if ((gameRound === 1 || gameRound === 3) && activeQuestion && gameSubState === 'PLAYING') {
      spawnRoundChickens(activeQuestion, gameRound);
    }

    const syncCanvasDimensions = () => {
      if (!parentEl) return;
      const nextW = Math.max(300, Math.floor(parentEl.clientWidth));
      const nextH = Math.max(220, Math.floor(parentEl.clientHeight));
      if (nextW === width && nextH === height) return;

      const ratioX = nextW / Math.max(1, width);
      const ratioY = nextH / Math.max(1, height);

      width = canvas.width = nextW;
      height = canvas.height = nextH;

      playerX = Math.max(36, Math.min(width - 36, playerX * ratioX));
      chickens.forEach(c => {
        c.baseX = Math.max(54, Math.min(width - 54, c.baseX * ratioX));
        c.x = Math.max(54, Math.min(width - 54, c.x * ratioX));
      });
      stars.forEach(s => {
        s.x = (s.x * ratioX) % width;
        s.y = (s.y * ratioY) % height;
      });
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && parentEl) {
      resizeObserver = new ResizeObserver(syncCanvasDimensions);
      resizeObserver.observe(parentEl);
    }
    window.addEventListener('resize', syncCanvasDimensions);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / Math.max(1, rect.width);
      playerX = Math.max(36, Math.min(width - 36, (e.clientX - rect.left) * scaleX));
    };

    const fireBullet = () => {
      const r = gameRuntimeRef.current.round;
      if ((r === 1 || r === 3) && gameRuntimeRef.current.subState === 'PLAYING' && !gameRuntimeRef.current.paused) {
        bullets.push({ x: playerX, y: height - 74, speed: 13 });
        playSound('shoot');
      }
    };

    const handleClick = () => fireBullet();

    const handleTouchMove = (e) => {
      const r = gameRuntimeRef.current.round;
      if ((r !== 1 && r !== 3) || gameRuntimeRef.current.subState !== 'PLAYING') return;
      if (!e.touches?.[0]) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / Math.max(1, rect.width);
      playerX = Math.max(36, Math.min(width - 36, (e.touches[0].clientX - rect.left) * scaleX));
    };

    const handleTouchStart = (e) => {
      const r = gameRuntimeRef.current.round;
      if ((r !== 1 && r !== 3) || gameRuntimeRef.current.subState !== 'PLAYING') return;
      handleTouchMove(e);
      fireBullet();
    };

    const handleKeyDownCanvas = (e) => {
      pressedKeys[e.code] = true;
      const r = gameRuntimeRef.current.round;
      if (e.code === 'Space' && (r === 1 || r === 3) && gameRuntimeRef.current.subState === 'PLAYING') {
        e.preventDefault();
        fireBullet();
      }
    };

    const handleKeyUpCanvas = (e) => {
      pressedKeys[e.code] = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDownCanvas);
    window.addEventListener('keyup', handleKeyUpCanvas);

    const renderLoop = () => {
      syncCanvasDimensions();
      ctx.clearRect(0, 0, width, height);

      const rt = gameRuntimeRef.current;
      const isDark = rt.darkMode !== false;
      const isFrozen = Date.now() < freezeUntilRef.current;

      // Keyboard ship steering for shooter rounds (1, 3)
      if ((rt.round === 1 || rt.round === 3) && rt.subState === 'PLAYING' && !rt.paused) {
        if (pressedKeys['ArrowLeft'] || pressedKeys['KeyA']) {
          playerX = Math.max(36, playerX - 7);
        }
        if (pressedKeys['ArrowRight'] || pressedKeys['KeyD']) {
          playerX = Math.min(width - 36, playerX + 7);
        }
      }

      // Starfield / Pastel Daytime Sky Sparkles
      stars.forEach((s, idx) => {
        if (!rt.paused) {
          s.y += s.speed * (isFrozen ? 0.35 : 1);
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
        }
        if (isDark) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.5;
        } else {
          ctx.fillStyle = idx % 3 === 0 ? '#007a7a' : idx % 2 === 0 ? '#f472b6' : '#38bdf8';
          ctx.globalAlpha = 0.28;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, isDark ? s.size : s.size * 1.15, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const limit = Math.max(1, rt.timeLimit || 25);
      const elapsedRatio = Math.min(1, Math.max(0, 1 - timeRemainingFloatRef.current / limit));

      // Subtle Danger Warning Line near ship when time <= 6s
      if (rt.subState === 'PLAYING' && timeRemainingFloatRef.current <= 6) {
        const dangerY = height - 82;
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.45)' : 'rgba(225, 29, 72, 0.65)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, dangerY);
        ctx.lineTo(width - 20, dangerY);
        ctx.stroke();
        ctx.restore();
      }

      // Bullets & Hit detection (Round 1)
      ctx.fillStyle = isDark ? '#00f2fe' : '#007a7a';
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!rt.paused) b.y -= b.speed;
        ctx.beginPath();
        ctx.roundRect(b.x - 3, b.y, 6, 16, 3);
        ctx.fill();

        let bulletRemoved = false;
        if ((rt.round === 1 || rt.round === 3) && rt.subState === 'PLAYING' && !rt.questionResolved && !rt.paused) {
          for (let j = chickens.length - 1; j >= 0; j--) {
            const c = chickens[j];
            if (
              b.x > c.x - c.width / 2 &&
              b.x < c.x + c.width / 2 &&
              b.y > c.y - c.height / 2 &&
              b.y < c.y + c.height / 2 + 22
            ) {
              bullets.splice(i, 1);
              bulletRemoved = true;
              const hitOk = resolveGameChoiceAttemptRef.current?.(c.fullValue || c.word, c.isCorrect, c.x, c.y);
              if (!hitOk) {
                chickens.splice(j, 1);
              }
              break;
            }
          }
        }

        if (!bulletRemoved && b.y < -20) {
          bullets.splice(i, 1);
        }
      }

      // Homing Lasers (Round 2 & Round 4 typing hits)
      const lasers = homingLasersRef.current;
      for (let i = lasers.length - 1; i >= 0; i--) {
        const hl = lasers[i];
        if (!rt.paused) hl.progress += 0.22;
        ctx.strokeStyle = hl.color || '#10b981';
        ctx.lineWidth = rt.round === 4 ? 4 : 3;
        ctx.beginPath();
        ctx.moveTo(hl.x, hl.y);
        const curX = hl.x + (hl.targetX - hl.x) * Math.min(1, hl.progress);
        const curY = hl.y + (hl.targetY - hl.y) * Math.min(1, hl.progress);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        if (hl.progress >= 1) lasers.splice(i, 1);
      }

      // Particle explosions & Freeze crystal sparks
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!rt.paused) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha -= 0.028;
        }
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Chickens (Round 1, 3) - smoothly descend with timer
      if ((rt.round === 1 || rt.round === 3) && rt.subState === 'PLAYING') {
        const topBaseY = Math.max(46, height * 0.14);
        const maxDescendY = Math.max(topBaseY + 20, height - 172);
        chickens.forEach(c => {
          if (!rt.paused) {
            c.wingPhase += isFrozen ? 0.03 : 0.1;
            c.x = c.baseX + Math.sin(c.wingPhase * 0.5) * c.swayRange;
          }
          c.y = topBaseY + c.rowOffset + elapsedRatio * (maxDescendY - topBaseY - c.rowOffset);

          ctx.save();
          ctx.translate(c.x, c.y);

          if (isFrozen) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Wings
          const wingY = Math.sin(c.wingPhase) * 6;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(-24, wingY, 12, 6, -0.3, 0, Math.PI * 2);
          ctx.ellipse(24, wingY, 12, 6, 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          if (!isDark) {
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Comb & Beak
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-4, -2);
          ctx.lineTo(4, -2);
          ctx.lineTo(0, 5);
          ctx.fill();

          // Word card
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          const textW = Math.max(82, ctx.measureText(c.word).width + 16);
          ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';
          ctx.strokeStyle = isDark ? '#00f2fe' : '#007a7a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-textW / 2, 18, textW, 24, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isDark ? '#ffffff' : '#0f172b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.word, 0, 30);

          ctx.restore();
        });
      }

      // Draw Giant Boss Monster (Round 2: Gõ Từ Full & Round 4: Gõ Collocation Diệt Boss)
      if ((rt.round === 2 || rt.round === 4) && rt.activeQuestion && rt.subState === 'PLAYING') {
        const isCollocationBoss = rt.round === 4;
        const swayX = Math.sin(Date.now() * (isCollocationBoss ? 0.003 : 0.0025)) * Math.min(75, width * 0.14);
        const bossX = width / 2 + swayX;
        const startBossY = Math.max(66, height * 0.22);
        const endBossY = Math.max(startBossY + 35, height - 118);
        const bossY = startBossY + elapsedRatio * (endBossY - startBossY);

        // Compute Boss HP based on remaining untyped letters
        const targetPhrase = getGameTypingTarget(rt.activeQuestion, rt.round);
        let totalAlpha = 0;
        let typedAlpha = 0;
        for (let k = 0; k < targetPhrase.length; k++) {
          if (/^[A-Z]$/.test(targetPhrase[k])) {
            totalAlpha += 1;
            if (k < rt.typedProgress) typedAlpha += 1;
          }
        }
        const hpRatio = totalAlpha > 0 ? Math.max(0, (totalAlpha - typedAlpha) / totalAlpha) : 1;

        // Update active homing laser targets
        lasers.forEach(hl => {
          hl.targetX = bossX;
          hl.targetY = bossY;
        });

        ctx.save();
        ctx.translate(bossX, bossY);

        // Freeze crystal aura or Danger halo
        if (isFrozen) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, (isCollocationBoss ? 48 : 44) + Math.sin(Date.now() * 0.015) * 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (timeRemainingFloatRef.current <= 6 || isCollocationBoss) {
          ctx.strokeStyle = isCollocationBoss ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.65)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, (isCollocationBoss ? 46 : 42) + Math.sin(Date.now() * 0.02) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Boss Wings
        const wingY = Math.sin(Date.now() * 0.011) * 8;
        ctx.fillStyle = isCollocationBoss ? '#fb7185' : '#fcd34d';
        ctx.beginPath();
        ctx.ellipse(isCollocationBoss ? -44 : -38, wingY, isCollocationBoss ? 19 : 16, 9, -0.3, 0, Math.PI * 2);
        ctx.ellipse(isCollocationBoss ? 44 : 38, wingY, isCollocationBoss ? 19 : 16, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Giant Boss Body
        const bodyRadius = isCollocationBoss ? 34 : 30;
        ctx.fillStyle = isCollocationBoss ? '#e11d48' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
        ctx.fill();

        // Eyes & angry brows in Round 4
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-11, -5, 5.5, 0, Math.PI * 2);
        ctx.arc(11, -5, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-11, -5, 2.7, 0, Math.PI * 2);
        ctx.arc(11, -5, 2.7, 0, Math.PI * 2);
        ctx.fill();
        if (isCollocationBoss) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-18, -13);
          ctx.lineTo(-6, -9);
          ctx.moveTo(18, -13);
          ctx.lineTo(6, -9);
          ctx.stroke();
        }

        // Golden Crown on Final Collocation Boss in Round 4
        if (isCollocationBoss) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-20, -33);
          ctx.lineTo(-10, -47);
          ctx.lineTo(0, -35);
          ctx.lineTo(10, -47);
          ctx.lineTo(20, -33);
          ctx.closePath();
          ctx.fill();
        }

        // Boss HP Bar (primary) + Time Bar above Boss
        const barW = isCollocationBoss ? 124 : 96;
        const barH = isCollocationBoss ? 8 : 6;
        const hpBarY = isCollocationBoss ? -62 : -54;
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(203, 213, 225, 0.95)';
        ctx.fillRect(-barW / 2, hpBarY, barW, barH);
        ctx.fillStyle = hpRatio > 0.5 ? '#ef4444' : hpRatio > 0.25 ? '#f59e0b' : '#10b981';
        ctx.fillRect(-barW / 2, hpBarY, barW * hpRatio, barH);

        const remainRatio = Math.max(0, Math.min(1, timeRemainingFloatRef.current / limit));
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(226, 232, 240, 0.9)';
        ctx.fillRect(-barW / 2, hpBarY + barH + 2, barW, 4);
        ctx.fillStyle = remainRatio > 0.4 ? (isDark ? '#22d3ee' : '#007a7a') : '#f59e0b';
        ctx.fillRect(-barW / 2, hpBarY + barH + 2, barW * remainRatio, 4);

        // Full-phrase masked target label below Boss
        let masked = '';
        for (let k = 0; k < targetPhrase.length; k++) {
          const ch = targetPhrase[k];
          if (ch === ' ') masked += '   ';
          else if (k < rt.typedProgress || !/^[A-Z]$/.test(ch)) masked += ch + ' ';
          else masked += '_ ';
        }
        const label = masked.trim();
        ctx.font = `bold ${label.length > 26 ? 11 : 13}px "JetBrains Mono", monospace`;
        const lblW = Math.min(width - 24, Math.max(110, ctx.measureText(label).width + 22));
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.97)';
        ctx.strokeStyle = isCollocationBoss ? '#e11d48' : '#d97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-lblW / 2, bodyRadius + 8, lblW, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#0f172b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, bodyRadius + 21);

        ctx.restore();
      }

      // Draw Player Spaceship with chosen Animal Pilot + Accessory inside Glass Cockpit (Rounds 1..4)
      const shipX = (rt.round === 1 || rt.round === 3) ? playerX : width / 2;
      drawAnimalSpaceshipCanvas(ctx, {
        x: shipX,
        y: height - 48,
        animalId: rt.animalId || 'cat',
        accessoryId: rt.accessoryId || 'crown',
        colorId: rt.crewColorId || 'cyan',
        combo: rt.combo,
        round: rt.round,
        isFrozen,
        paused: rt.paused,
        timeMs: Date.now(),
        avatarImg: avatarImageRef.current
      });

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', syncCanvasDimensions);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDownCanvas);
      window.removeEventListener('keyup', handleKeyUpCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [view, gameRound, activeQuestion, gameSubState]);


  const dailySpeakingCompliance = (() => {
    if (!syncHydrated || !currentUser?.username) {
      return { myPendingDailyTests: [], missingStudentSummaries: [] };
    }
    return evaluateSpeakingDailyCompliance({
      tests,
      attempts,
      usersDb,
      classesDb,
      viewerUser: currentUser,
      nowMs: Date.now() + serverClockOffsetMs
    });
  })();
  const dailySpeakingPendingCount = currentUser?.role === 'student'
    ? (dailySpeakingCompliance.myPendingDailyTests?.length || 0)
    : 0;
  const openSpeakingDaily = () => {
    setFocusedTestId(null);
    setSkillHubTab('speaking_daily');
    setView('SKILL_HUB');
  };

  const titleUnlockEval = (() => {
    if (!syncHydrated || !currentUser?.username) {
      return { shouldPersistBaseline: false, baselineToSave: null, newlyUnlockedItems: [] };
    }
    const unameKey = currentUser.username.toLowerCase();
    const hasLocal = Object.prototype.hasOwnProperty.call(localSeenTitlesMap, unameKey);
    const localAck = hasLocal ? localSeenTitlesMap[unameKey] : [];
    const summary = resolveStudentTitleSummary(currentUser, attempts, roomsDb, customTitles);
    return evaluateTitleUnlockNotification({
      user: currentUser,
      titleSummary: summary,
      localAcknowledgedIds: localAck,
      hasLocalBaseline: hasLocal
    });
  })();

  const handleUpdateUserProfileFieldsRef = useRef(null);
  handleUpdateUserProfileFieldsRef.current = handleUpdateUserProfileFields;
  const titleBaselineKey = (titleUnlockEval.baselineToSave || []).join(',');

  useEffect(() => {
    const uname = currentUser?.username;
    if (!syncHydrated || !uname || !titleUnlockEval.shouldPersistBaseline || !titleBaselineKey) {
      return;
    }
    const cacheKey = `${uname.toLowerCase()}:${titleBaselineKey}`;
    if (titleBaselinePersistedRef.current === cacheKey) return;
    titleBaselinePersistedRef.current = cacheKey;
    const ids = titleBaselineKey.split(',').filter(Boolean);
    persistLocalSeenTitles(uname, ids);
    Promise.resolve().then(() => {
      setLocalSeenTitlesMap(prev => ({ ...prev, [uname.toLowerCase()]: ids }));
      handleUpdateUserProfileFieldsRef.current?.(uname, {
        acknowledgedTitleIds: ids,
        silentToast: true
      });
    });
  }, [syncHydrated, currentUser?.username, titleUnlockEval.shouldPersistBaseline, titleBaselineKey]);

  const canShowTitleCelebration =
    syncHydrated &&
    Boolean(currentUser?.username) &&
    view !== 'AUTH' &&
    view !== 'EXAM_MODE' &&
    view !== 'SPEAKING_MODE' &&
    !(view === 'GAME_ARENA' && gameSubState === 'PLAYING');

  const activeCelebratingTitles = canShowTitleCelebration ? titleUnlockEval.newlyUnlockedItems : [];

  useEffect(() => {
    const uname = String(currentUser?.username || '').trim().toLowerCase();
    if (
      !syncHydrated ||
      !uname ||
      currentUser?.role === 'teacher' ||
      hasActiveAieoVip(currentUser) ||
      view !== 'HOME'
    ) {
      return undefined;
    }
    try {
      const seenKey = `ielts_vip_promo_shown_${uname}`;
      if (sessionStorage.getItem(seenKey)) return undefined;
      sessionStorage.setItem(seenKey, '1');
    } catch {
      return undefined;
    }
    const timerId = setTimeout(() => {
      setShowVipPromoModal(true);
    }, 220);
    return () => clearTimeout(timerId);
  }, [syncHydrated, currentUser, view]);

  const handleNavigateAfterPurchase = (nextView, arg) => {
    setGlobalCheckoutState(null);
    if (nextView === 'EXAM_START' && arg) {
      startExam(arg);
      return;
    }
    if (nextView === 'CREATE_FRIEND_ROOM') {
      setGameSubState('JOIN');
      setView('GAME_ARENA');
      setShowCreateRoomModal(true);
      return;
    }
    if (arg) setSkillHubTab(arg);
    setView(nextView);
  };

  const handleAcknowledgeTitles = ({ equipTitle = null, openProfile = false } = {}) => {
    const uname = currentUser?.username;
    if (!uname) return;
    const unameKey = uname.toLowerCase();
    const newlyIds = activeCelebratingTitles.map(item => item.id).filter(Boolean);
    const mergedIds = Array.from(
      new Set([
        ...(Array.isArray(currentUser.acknowledgedTitleIds) ? currentUser.acknowledgedTitleIds : []),
        ...(Array.isArray(localSeenTitlesMap[unameKey]) ? localSeenTitlesMap[unameKey] : []),
        ...newlyIds,
        'newbie'
      ])
    );
    persistLocalSeenTitles(uname, mergedIds);
    setLocalSeenTitlesMap(prev => ({ ...prev, [unameKey]: mergedIds }));
    handleUpdateUserProfileFields(uname, {
      acknowledgedTitleIds: mergedIds,
      ...(equipTitle ? { equippedTitleId: equipTitle.id, showTitleBadge: true } : {}),
      ...(equipTitle
        ? { customToast: `Đã trang bị danh hiệu mới: ${equipTitle.icon} ${equipTitle.label}!` }
        : { silentToast: true })
    });
    if (openProfile) {
      openMemberProfile(uname, view);
    }
  };

  // ==========================================
  // MAIN VIEW ROUTER
  // ==========================================
  return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] font-sans text-[#0F172A] dark:text-[#FAFAFA] antialiased selection:bg-[#007A7A]/20 dark:selection:bg-zinc-700 transition-colors duration-200">
      {/* Navbar rendered when not on Auth, Full Exam, Speaking Room, or Game Arena */}
      {view !== 'AUTH' && view !== 'EXAM_MODE' && view !== 'SPEAKING_MODE' && view !== 'GAME_ARENA' && (
        <Navbar
          currentUser={currentUser}
          dailySpeakingPendingCount={dailySpeakingPendingCount}
          darkMode={darkMode}
          handleLogout={handleLogout}
          notifications={notifications}
          onDeleteNotification={handleDeleteNotification}
          onDismissNotifications={handleDismissNotifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenAccountSecurity={tab => setAccountSecurityTab(tab || 'password')}
          onOpenNotificationTarget={handleOpenNotificationTarget}
          onOpenSpeakingDaily={openSpeakingDaily}
          openMemberProfile={openMemberProfile}
          openStudentGamePortal={openStudentGamePortal}
          setDarkMode={setDarkMode}
          setSelectedProfileStudent={setSelectedProfileStudent}
          setShowAvatarModal={setShowAvatarModal}
          setView={setView}
          view={view}
        />
      )}

      {/* Main Views */}
      {view === 'AUTH' && (
        <AuthScreen
          authError={authError}
          authForm={authForm}
          darkMode={darkMode}
          handleAuthSubmit={handleAuthSubmit}
          onPasswordRecovered={handleSyncRememberedPassword}
          onRemoveRememberedLogin={handleRemoveRememberedLogin}
          onSelectRememberedLogin={handleSelectRememberedLogin}
          rememberPassword={rememberPassword}
          rememberedLogins={rememberedLogins}
          setAuthError={setAuthError}
          setAuthForm={setAuthForm}
          setDarkMode={setDarkMode}
          setRememberPassword={setRememberPassword}
          setShowAuthPass={setShowAuthPass}
          showAuthPass={showAuthPass}
          showToast={showToast}
        />
      )}

      {view === 'HOME' && (
        <StudentHome
          attempts={attempts}
          classesDb={classesDb}
          currentUser={currentUser}
          customTitles={customTitles}
          examUnlockTokens={examUnlockTokens}
          focusedTestId={focusedTestId}
          onClearFocusedTest={() => setFocusedTestId(null)}
          onOpenCheckoutModal={openGlobalCheckoutModal}
          onRedeemRealExamCredit={handleRedeemRealExamCredit}
          openMemberProfile={openMemberProfile}
          openSkillPracticeHub={(tab = 'speaking_daily') => {
            setFocusedTestId(null);
            setSkillHubTab(tab);
            setView('SKILL_HUB');
          }}
          openSpeakingDaily={openSpeakingDaily}
          openStudentGamePortal={openStudentGamePortal}
          paymentConfig={paymentConfig}
          roomsDb={roomsDb}
          serverClockOffsetMs={serverClockOffsetMs}
          setEditingTargetUser={setEditingTargetUser}
          setPreviousView={setPreviousView}
          setSelectedAttemptId={setSelectedAttemptId}
          setSelectedProfileStudent={setSelectedProfileStudent}
          setView={setView}
          startExam={startExam}
          supportAdminProfile={supportAdminProfile}
          tests={tests}
          usersDb={usersDb}
        />
      )}

      {view === 'SKILL_HUB' && (
        <SkillPracticeHub
          activeTab={skillHubTab}
          aiConfigured={Boolean(aiApiKey?.trim() || aiConfigured)}
          attempts={attempts}
          classesDb={classesDb}
          currentUser={currentUser}
          focusedTestId={focusedTestId}
          onChangeTab={nextTab => {
            setFocusedTestId(null);
            setSkillHubTab(nextTab);
          }}
          onClearFocusedTest={() => setFocusedTestId(null)}
          onNotifyMissingDaily={handleNotifyMissingDaily}
          onOpenCheckoutModal={openGlobalCheckoutModal}
          onOpenFullExamCatalog={() => {
            setFocusedTestId(null);
            setView('HOME');
          }}
          onOpenResult={attId => {
            setSelectedAttemptId(attId);
            setPreviousView('SKILL_HUB');
            setResultReviewTab('speaking');
            setView('RESULT_VIEW');
          }}
          onOpenSkillBuilder={(skill, testToEdit = null, subOpts = {}) => openSingleSkillBuilder(skill, testToEdit, [], subOpts)}
          onSpeakingRoomUnlocked={handleSpeakingRoomUnlocked}
          onStartSingleSkillExam={testId => startExam(testId)}
          onStartSpeakingExam={(testId, partMode = 'full') => startExam(testId, partMode)}
          paymentConfig={paymentConfig}
          serverClockOffsetMs={serverClockOffsetMs}
          showToast={showToast}
          examUnlockTokens={examUnlockTokens}
          speakingUnlockTokens={speakingUnlockTokens}
          tests={tests}
          usersDb={usersDb}
        />
      )}

      {view === 'SPEAKING_MODE' && (
        <SpeakingExamRoom
          aiApiKey={aiApiKey}
          currentUser={currentUser}
          dispatchSyncAction={dispatchSyncAction}
          onAttemptCreated={newAtt => setAttempts(prev => [newAtt, ...prev])}
          onExitSpeaking={() => {
            setSelectedTestId(null);
            setView('SKILL_HUB');
          }}
          onSpeakingRoomUnlocked={handleSpeakingRoomUnlocked}
          onViewResult={attId => {
            setSelectedAttemptId(attId);
            setPreviousView('SKILL_HUB');
            setResultReviewTab('speaking');
            setView('RESULT_VIEW');
          }}
          partMode={speakingPartMode}
          selectedTestId={selectedTestId}
          showToast={showToast}
          speakingUnlockTokens={speakingUnlockTokens}
          tests={tests}
        />
      )}

      {view === 'STUDENT_PROFILE' && (
        <StudentProfile
          adminFeedbacks={adminFeedbacks}
          attempts={attempts}
          classesDb={classesDb}
          currentRoomPin={currentRoomPin}
          currentUser={currentUser}
          customTitles={customTitles}
          dispatchSyncAction={dispatchSyncAction}
          handleTeacherOpenLobby={handleTeacherOpenLobby}
          onGrantUserTitles={handleGrantUserTitles}
          onOpenAccountSecurity={tab => setAccountSecurityTab(tab || 'password')}
          onOpenAdminTitleManager={targetUsername => setAdminTitleModalState({ isOpen: true, targetUsername: targetUsername || null })}
          onPullSync={() => pullServerSyncState(true)}
          onRequestCoverUnlock={handleRequestCoverUnlock}
          onToggleUserCoverUnlock={currentUser?.isSuperAdmin ? handleToggleUserCoverUnlock : undefined}
          onToggleUserSubscription={currentUser?.isSuperAdmin ? handleToggleUserSubscription : undefined}
          onNavigateAfterPurchase={handleNavigateAfterPurchase}
          openStudentGamePortal={openStudentGamePortal}
          paymentConfig={paymentConfig}
          previousView={previousView}
          roomsDb={roomsDb}
          selectedProfileStudent={selectedProfileStudent}
          handleUpdateUserProfileFields={handleUpdateUserProfileFields}
          setEditingTargetUser={setEditingTargetUser}
          setPreviousView={setPreviousView}
          setSelectedAttemptId={setSelectedAttemptId}
          setSelectedProfileStudent={setSelectedProfileStudent}
          setShowAvatarModal={setShowAvatarModal}
          setTeacherNotes={setTeacherNotes}
          setTempNoteText={setTempNoteText}
          setView={setView}
          showToast={showToast}
          startExam={startExam}
          supportAdminProfile={supportAdminProfile}
          teacherNotes={teacherNotes}
          tempNoteText={tempNoteText}
          tests={tests}
          usersDb={usersDb}
        />
      )}

      {view === 'GAME_ARENA' && (
        <GameArena
          activeQuestion={activeQuestion}
          advanceNextGameRound={advanceNextGameRound}
          attempts={attempts}
          autoNextTimerRef={autoNextTimerRef}
          canvasRef={canvasRef}
          chatScrollRef={chatScrollRef}
          copiedRoomPin={copiedRoomPin}
          currentRoomPin={currentRoomPin}
          currentUser={currentUser}
          customTitles={customTitles}
          darkMode={darkMode}
          freezeCharges={freezeCharges}
          gameCombo={gameCombo}
          gameLives={gameLives}
          gameMuted={gameMuted}
          gameOutcome={gameOutcome}
          gamePaused={gamePaused}
          gameQueues={gameQueues}
          gamePracticeLeaderboard={gamePracticeLeaderboard}
          gameReviewLog={gameReviewLog}
          gameRound={gameRound}
          gameRuntimeRef={gameRuntimeRef}
          gameScore={gameScore}
          gameSubState={gameSubState}
          gameTimeLeft={gameTimeLeft}
          gameTimeLimit={gameTimeLimit}
          gameToast={gameToast}
          gameTypedProgress={gameTypedProgress}
          gameWordIdx={gameWordIdx}
          handleChangeAccessory={handleChangeAccessory}
          handleChangeAnimal={handleChangeAnimal}
          handleChangeCrewColor={handleChangeCrewColor}
          handleClearLobbyChatNow={handleClearLobbyChatNow}
          handleCopyInviteLink={handleCopyInviteLink}
          handleDeleteRoom={handleDeleteRoom}
          handleFinishRoomMatch={handleFinishRoomMatch}
          handleGameChoiceSelect={handleGameChoiceSelect}
          handleGameHint={handleGameHint}
          handleGameTypingInput={handleGameTypingInput}
          handleKickLobbyPlayer={handleKickLobbyPlayer}
          handleLeaveGameLobby={handleLeaveGameLobby}
          handleSaveHostRoomSettings={handleSaveHostRoomSettings}
          handleSendLobbyChat={handleSendLobbyChat}
          handleSetPlayerTeam={handleSetPlayerTeam}
          handleShuffleRoomTeams={handleShuffleRoomTeams}
          handleStudentJoinRoom={handleStudentJoinRoom}
          handleTeacherApproveLobbyPlayer={handleTeacherApproveLobbyPlayer}
          handleTeacherOpenLobby={handleTeacherOpenLobby}
          handleTeacherResetLobby={handleTeacherResetLobby}
          handleTeacherStartLobbyGame={handleTeacherStartLobbyGame}
          handleToggleGameMute={handleToggleGameMute}
          handleToggleGamePause={handleToggleGamePause}
          handleToggleLobbyReady={handleToggleLobbyReady}
          handleUseFreezePowerup={handleUseFreezePowerup}
          hostRoomDraft={hostRoomDraft}
          initGameCampaign={initGameCampaign}
          initPracticeGameCampaign={initPracticeGameCampaign}
          isFrozenBoost={isFrozenBoost}
          isPracticeGameSession={isPracticeGameSession}
          isSandboxRound={isSandboxRound}
          practiceTopicMeta={practiceTopicMeta}
          joinedRoomPin={joinedRoomPin}
          jumpToGameSandboxRound={jumpToGameSandboxRound}
          liveRankDeltas={liveRankDeltas}
          lobbyChatInput={lobbyChatInput}
          lobbyCountdown={lobbyCountdown}
          lobbyCountdownTimerRef={lobbyCountdownTimerRef}
          lobbyNowTick={lobbyNowTick}
          myAccessoryId={myAccessoryId}
          myAnimalId={myAnimalId}
          myCrewColor={myCrewColor}
          onOpenCheckoutModal={openGlobalCheckoutModal}
          openMemberProfile={openMemberProfile}
          paymentConfig={paymentConfig}
          roomJoinError={roomJoinError}
          roomJoinForm={roomJoinForm}
          roomsDb={roomsDb}
          serverSyncConnected={serverSyncConnected}
          setCopiedRoomPin={setCopiedRoomPin}
          setCustomVocabInput={setCustomVocabInput}
          setDarkMode={setDarkMode}
          setGameSubState={setGameSubState}
          setHostRoomDraft={setHostRoomDraft}
          setLobbyChatInput={setLobbyChatInput}
          setLobbyCountdown={setLobbyCountdown}
          setMyAccessoryId={setMyAccessoryId}
          setMyAnimalId={setMyAnimalId}
          setMyCrewColor={setMyCrewColor}
          setRoomJoinError={setRoomJoinError}
          setRoomJoinForm={setRoomJoinForm}
          setShowAvatarModal={setShowAvatarModal}
          setShowCreateRoomModal={setShowCreateRoomModal}
          setShowMobileKeyboard={setShowMobileKeyboard}
          setShowVocabModal={setShowVocabModal}
          setView={setView}
          showMobileKeyboard={showMobileKeyboard}
          showToast={showToast}
          transitionCountdown={transitionCountdown}
          usersDb={usersDb}
          wordTimerRef={wordTimerRef}
        />
      )}

      {view === 'EXAM_MODE' && (
        <ExamMode
          addHighlight={addHighlight}
          addNote={addNote}
          advanceToNextExamSection={advanceToNextExamSection}
          audioProgress={audioProgress}
          currentUser={currentUser}
          darkMode={darkMode}
          examState={examState}
          handleFinalExamSubmit={handleFinalExamSubmit}
          handlePassageTextSelect={handlePassageTextSelect}
          handlePlayListeningAudio={handlePlayListeningAudio}
          isPlayingAudio={isPlayingAudio}
          onCopyInternalText={handleCopyInternalExamText}
          onDismissSelectionToolbar={dismissSelectionToolbar}
          onExitExam={handleExitExamMode}
          onExitMissingTest={() => {
            setSelectedTestId(null);
            setView(currentUser?.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME');
          }}
          playingAudioKey={playingAudioKey}
          removeHighlight={removeHighlight}
          selectedPassageText={selectedPassageText}
          selectionCoords={selectionCoords}
          selectedTestId={selectedTestId}
          setDarkMode={setDarkMode}
          setExamState={setExamState}
          setShowSubmitConfirmModal={setShowSubmitConfirmModal}
          setZoomedReadingImg={setZoomedReadingImg}
          showSubmitConfirmModal={showSubmitConfirmModal}
          showToast={showToast}
          stopExamAudio={stopExamAudio}
          tests={tests}
        />
      )}

      {view === 'RESULT_VIEW' && (
        <ResultView
          aiApiKey={aiApiKey}
          aiConfigured={Boolean(aiApiKey?.trim() || aiConfigured)}
          aiGradingStep={aiGradingStep}
          attempts={attempts}
          currentUser={currentUser}
          handleGradeSpeakingWithAI={att => handleGradeSpeakingWithAI(att, false)}
          handleGradeWritingWithAI={handleGradeWritingWithAI}
          isGradingAI={isGradingAI}
          onApproveAttempt={handleApproveAndPublishAttempt}
          onRevokeApproval={handleRevokeApprovalAttempt}
          onRetryTest={startExam}
          openTeacherGradingModal={openTeacherGradingModal}
          previousView={previousView}
          resultReviewTab={resultReviewTab}
          selectedAttemptId={selectedAttemptId}
          setApiTestState={setApiTestState}
          setResultReviewTab={setResultReviewTab}
          setShowApiKeyModal={setShowApiKeyModal}
          setView={setView}
          tests={tests}
          toggleTestAllowViewAnswers={toggleTestAllowViewAnswers}
          usersDb={usersDb}
        />
      )}

      {view === 'TEACHER_DASHBOARD' && (
        <TeacherDashboard
          attempts={attempts}
          classesDb={classesDb}
          copiedRoomPin={copiedRoomPin}
          currentRoomPin={currentRoomPin}
          currentUser={currentUser}
          expandedTeacherTestId={expandedTeacherTestId}
          gradingFilters={gradingFilters}
          handleBulkDeleteAccounts={handleBulkDeleteAccounts}
          handleCopyInviteLink={handleCopyInviteLink}
          handleCreateNotification={handleCreateNotification}
          handleDeleteAccount={handleDeleteAccount}
          handleDeleteAttempt={handleDeleteAttempt}
          handleDeleteNotification={handleDeleteNotification}
          handleDeleteRoom={handleDeleteRoom}
          handleDeleteTest={handleDeleteTest}
          handleDuplicateTest={handleDuplicateTest}
          handleKickLobbyPlayer={handleKickLobbyPlayer}
          handlePurgeOrphanAttempts={handlePurgeOrphanAttempts}
          handleTeacherOpenLobby={handleTeacherOpenLobby}
          handleTeacherResetLobby={handleTeacherResetLobby}
          initGameCampaign={initGameCampaign}
          notifications={sentNotifications}
          onAssignTestClasses={handleAssignTestClasses}
          onCreateSkillForClass={(classId, skill = 'speaking') => openSingleSkillBuilder(skill, null, [classId])}
          onCreateTestForClass={classId => openExamBuilder(null, 'general', [classId])}
          onDeleteClass={handleDeleteClass}
          onNotifyMissingDaily={handleNotifyMissingDaily}
          onOpenAdminTitleManager={targetUsername => setAdminTitleModalState({ isOpen: true, targetUsername: targetUsername || null })}
          onUpdateClassMembers={handleUpdateClassMembers}
          onUpsertClass={handleUpsertClass}
          openExamBuilder={openExamBuilder}
          openMemberProfile={openMemberProfile}
          openSingleSkillBuilder={openSingleSkillBuilder}
          openTeacherGradingModal={openTeacherGradingModal}
          roomsDb={roomsDb}
          serverClockOffsetMs={serverClockOffsetMs}
          customTitles={customTitles}
          setAddStudentMode={setAddStudentMode}
          setCopiedRoomPin={setCopiedRoomPin}
          setCurrentRoomPin={setCurrentRoomPin}
          setCustomVocabInput={setCustomVocabInput}
          setEditingStudentAccount={setEditingStudentAccount}
          setEditingTargetUser={setEditingTargetUser}
          setExpandedTeacherTestId={setExpandedTeacherTestId}
          setGradingFilters={setGradingFilters}
          setPreviousView={setPreviousView}
          setSelectedAttemptId={setSelectedAttemptId}
          setShowAddStudentModal={setShowAddStudentModal}
          setShowCreateRoomModal={setShowCreateRoomModal}
          setShowVocabModal={setShowVocabModal}
          setStudentPasswordDraft={setStudentPasswordDraft}
          mailConfigured={mailConfigured}
          aiConfigured={Boolean(aiApiKey?.trim() || aiConfigured)}
          onOpenApiKeyModal={() => {
            setApiTestState({ testing: false, ok: null, message: '', model: '' });
            setShowApiKeyModal(true);
          }}
          onOpenMailConfig={() => setShowMailConfigModal(true)}
          onOpenPaymentConfig={currentUser?.isSuperAdmin ? () => setShowPaymentConfigModal(true) : undefined}
          onToggleUserCoverUnlock={currentUser?.isSuperAdmin ? handleToggleUserCoverUnlock : undefined}
          onToggleUserSubscription={currentUser?.isSuperAdmin ? handleToggleUserSubscription : undefined}
          paymentConfig={paymentConfig}
          setStudentSearchQuery={setStudentSearchQuery}
          setTeacherHubTab={setTeacherHubTab}
          setView={setView}
          showToast={showToast}
          startExam={startExam}
          studentSearchQuery={studentSearchQuery}
          teacherHubTab={teacherHubTab}
          tests={tests}
          toggleTestAllowViewAnswers={toggleTestAllowViewAnswers}
          toggleTestAntiCheat={toggleTestAntiCheat}
          toggleTestExamMode={toggleTestExamMode}
          toggleTestVisibility={toggleTestVisibility}
          updateTestQuickDuration={updateTestQuickDuration}
          updateTestQuickTitle={updateTestQuickTitle}
          usersDb={usersDb}
        />
      )}

      {view === 'EXAM_BUILDER' && (
        <ExamBuilder
          addQuestionToSkill={addQuestionToSkill}
          aiApiKey={aiApiKey}
          aiConfigured={Boolean(aiApiKey?.trim() || aiConfigured)}
          builderListeningIdx={builderListeningIdx}
          builderReadingIdx={builderReadingIdx}
          builderTab={builderTab}
          classesDb={classesDb}
          currentUser={currentUser}
          defaultExamPriceVnd={normalizePaymentConfig(paymentConfig || {}).defaultExamPriceVnd ?? DEFAULT_EXAM_PRICE_VND}
          editingTest={editingTest}
          handleAudioFileUpload={handleAudioFileUpload}
          handleListeningImageUpload={handleListeningImageUpload}
          handleReadingImageUpload={handleReadingImageUpload}
          handleSaveTestBuilder={handleSaveTestBuilder}
          handleWritingTask1ImageUpload={handleWritingTask1ImageUpload}
          removeQuestionFromSkill={removeQuestionFromSkill}
          setApiTestState={setApiTestState}
          setBuilderListeningIdx={setBuilderListeningIdx}
          setBuilderReadingIdx={setBuilderReadingIdx}
          setBuilderTab={setBuilderTab}
          setEditingTest={setEditingTest}
          setShowApiKeyModal={setShowApiKeyModal}
          setTestForm={setTestForm}
          setView={setView}
          setZoomedReadingImg={setZoomedReadingImg}
          showToast={showToast}
          testForm={testForm}
          updateListeningTrackField={updateListeningTrackField}
          updateOptionInSkill={updateOptionInSkill}
          updateQuestionInSkill={updateQuestionInSkill}
          updateReadingPassageField={updateReadingPassageField}
        />
      )}

      <GlobalModals
        addStudentMode={addStudentMode}
        aiApiKey={aiApiKey}
        aiConfigured={Boolean(aiApiKey?.trim() || aiConfigured)}
        aiGradingStep={aiGradingStep}
        apiTestState={apiTestState}
        bulkStudentsText={bulkStudentsText}
        currentRoomPin={joinedRoomPin || currentRoomPin}
        currentUser={currentUser}
        customVocabInput={customVocabInput}
        customVocabTopics={customVocabTopics}
        dispatchSyncAction={dispatchSyncAction}
        editingStudentAccount={editingStudentAccount}
        editingTargetUser={editingTargetUser}
        globalToast={globalToast}
        gradingAttempt={gradingAttempt}
        gradingScores={gradingScores}
        handleChangeCrewColor={handleChangeCrewColor}
        handleCreateRoom={handleCreateRoom}
        handleDeleteCustomVocabTopic={handleDeleteCustomVocabTopic}
        handleResetStudentPassword={handleResetStudentPassword}
        handleSaveCustomVocabTopic={handleSaveCustomVocabTopic}
        handleSaveNewStudents={handleSaveNewStudents}
        handleTeacherAIGrade={handleTeacherAIGrade}
        handleTeacherAIGradeSpeaking={att => handleGradeSpeakingWithAI(att, true)}
        handleTestGeminiKey={handleTestGeminiKey}
        handleUpdateUserAvatar={handleUpdateUserAvatar}
        handleUpdateUserProfileFields={handleUpdateUserProfileFields}
        isGradingAI={isGradingAI}
        myAccessoryId={myAccessoryId}
        myAnimalId={myAnimalId}
        myCrewColor={myCrewColor}
        newRoomForm={newRoomForm}
        newStudentForm={newStudentForm}
        onOpenVipCheckout={() => {
          setShowAvatarModal(false);
          setGlobalCheckoutState({
            itemType: 'aieo_vip',
            itemId: '',
            itemLabel: 'Gói IELTS VIP Full Quyền (1 Tháng)',
            itemPrice: normalizePaymentConfig(paymentConfig || {}).aieoVipPrice ?? AIEO_VIP_PRICE_VND
          });
        }}
        paymentConfig={paymentConfig}
        recalculateObjectiveScores={recalculateObjectiveScores}
        saveTeacherGrading={saveTeacherGrading}
        setAddStudentMode={setAddStudentMode}
        setAiApiKey={setAiApiKey}
        setApiTestState={setApiTestState}
        setBulkStudentsText={setBulkStudentsText}
        setCustomVocabInput={setCustomVocabInput}
        setEditingStudentAccount={setEditingStudentAccount}
        setEditingTargetUser={setEditingTargetUser}
        setGradingAttempt={setGradingAttempt}
        setGradingScores={setGradingScores}
        setNewRoomForm={setNewRoomForm}
        setNewStudentForm={setNewStudentForm}
        setRoomsDb={setRoomsDb}
        setShowAddStudentModal={setShowAddStudentModal}
        setShowApiKeyModal={setShowApiKeyModal}
        setShowAvatarModal={setShowAvatarModal}
        setShowCreateRoomModal={setShowCreateRoomModal}
        setShowVocabModal={setShowVocabModal}
        setStudentPasswordDraft={setStudentPasswordDraft}
        setZoomedReadingImg={setZoomedReadingImg}
        showAddStudentModal={showAddStudentModal}
        showApiKeyModal={showApiKeyModal}
        showAvatarModal={showAvatarModal}
        showCreateRoomModal={showCreateRoomModal}
        showToast={showToast}
        showVocabModal={showVocabModal}
        studentPasswordDraft={studentPasswordDraft}
        zoomedReadingImg={zoomedReadingImg}
      />

      {Boolean(accountSecurityTab) && (
        <AccountSecurityModal
          key={`${accountSecurityTab}-${currentUser?.username || 'anon'}`}
          isOpen={true}
          initialTab={accountSecurityTab || 'password'}
          currentUser={currentUser}
          mailConfigured={mailConfigured}
          onClose={() => setAccountSecurityTab(null)}
          onOpenMailConfig={() => setShowMailConfigModal(true)}
          onUserUpdated={handleSyncAuthenticatedUser}
          onPasswordChanged={handleSyncRememberedPassword}
          showToast={showToast}
        />
      )}

      {showMailConfigModal && currentUser?.role === 'teacher' && (
        <MailConfigModal
          isOpen={true}
          onClose={() => setShowMailConfigModal(false)}
          onConfiguredChange={setMailConfigured}
          showToast={showToast}
        />
      )}

      {showPaymentConfigModal && currentUser?.isSuperAdmin && (
        <PaymentConfigModal
          isOpen={true}
          paymentConfig={paymentConfig}
          onClose={() => setShowPaymentConfigModal(false)}
          onSaved={cfg => cfg && setPaymentConfig(cfg)}
          showToast={showToast}
        />
      )}

      {adminTitleModalState.isOpen && currentUser?.isSuperAdmin && (
        <AdminTitleManagerModal
          key={adminTitleModalState.targetUsername || 'all-users'}
          attempts={attempts}
          customTitles={customTitles}
          initialTargetUsername={adminTitleModalState.targetUsername}
          isOpen={true}
          onClose={() => setAdminTitleModalState({ isOpen: false, targetUsername: null })}
          onDeleteCustomTitle={handleDeleteCustomTitle}
          onGrantUserTitles={handleGrantUserTitles}
          onUpsertCustomTitle={handleUpsertCustomTitle}
          roomsDb={roomsDb}
          showToast={showToast}
          usersDb={usersDb}
        />
      )}

      {activeCelebratingTitles.length > 0 && (
        <TitleUnlockedCelebrationModal
          key={activeCelebratingTitles.map(t => t.id).join(',')}
          titles={activeCelebratingTitles}
          onEquipTitle={item => handleAcknowledgeTitles({ equipTitle: item })}
          onOpenProfile={() => handleAcknowledgeTitles({ openProfile: true })}
          onDismiss={() => handleAcknowledgeTitles()}
        />
      )}

      {Boolean(examPasswordModal && currentUser) && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !examPasswordModal.verifying && setExamPasswordModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/40 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Nhập Mật Khẩu Phòng Thi Thực Chiến
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {examPasswordModal.testTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={examPasswordModal.verifying}
                onClick={() => setExamPasswordModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Đóng hộp thoại mật khẩu phòng thi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyExamPasswordSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Nhập mật khẩu giáo viên đã gửi cho lớp để mở phòng thi. Khi làm tuần tự từng kỹ năng, bạn <strong>không thể quay lại kỹ năng cũ</strong> sau khi đã chuyển phần.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu phòng thi
                </label>
                <input
                  type="text"
                  autoFocus
                  value={examPasswordModal.password}
                  onChange={e =>
                    setExamPasswordModal(prev => (prev ? { ...prev, password: e.target.value, error: '' } : null))
                  }
                  placeholder="VD: THI2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-extrabold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {examPasswordModal.error && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1.5">
                    {examPasswordModal.error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={examPasswordModal.verifying}
                  onClick={() => setExamPasswordModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={examPasswordModal.verifying}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-md transition"
                >
                  {examPasswordModal.verifying ? 'Đang kiểm tra...' : 'Vào Phòng Thi Thật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(() => {
        const canShowVipPromoSurface = Boolean(
          currentUser &&
          currentUser.role !== 'teacher' &&
          !hasActiveAieoVip(currentUser) &&
          !globalCheckoutState &&
          ['HOME', 'SKILL_HUB', 'STUDENT_PROFILE', 'RESULT_VIEW', 'GAME_ARENA'].includes(view) &&
          !(view === 'GAME_ARENA' && ['PLAYING', 'COUNTDOWN', 'TRANSITION'].includes(gameSubState))
        );
        if (!canShowVipPromoSurface) return null;
        return (
          <VipPromoPopupModal
            isOpen={Boolean(showVipPromoModal)}
            showFloatingTrigger={true}
            hasNavbar={view !== 'GAME_ARENA'}
            currentUser={currentUser}
            paymentConfig={paymentConfig}
            onOpen={() => setShowVipPromoModal(true)}
            onClose={() => setShowVipPromoModal(false)}
            onOpenVipCheckout={() => openGlobalCheckoutModal({ itemType: 'aieo_vip' })}
          />
        );
      })()}

      {Boolean(globalCheckoutState && currentUser) && (
        <CoverCheckoutModal
          key={`${globalCheckoutState.itemType || 'aieo_vip'}:${globalCheckoutState.itemId || ''}:${globalCheckoutState.renew ? 1 : 0}`}
          isOpen={true}
          itemType={globalCheckoutState.itemType || 'aieo_vip'}
          itemId={globalCheckoutState.itemId || ''}
          itemLabel={globalCheckoutState.itemLabel || ''}
          itemPrice={globalCheckoutState.itemPrice}
          renew={Boolean(globalCheckoutState.renew)}
          currentUser={currentUser}
          paymentConfig={paymentConfig}
          onClose={() => setGlobalCheckoutState(null)}
          onNavigateAfterPurchase={handleNavigateAfterPurchase}
          onRequestUnlock={handleRequestCoverUnlock}
          onPullSync={() => pullServerSyncState(true)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
