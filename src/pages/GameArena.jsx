import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Camera,
  Check,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  Clock,
  Copy,
  Crown,
  DoorOpen,
  Edit,
  Gamepad2,
  Heart,
  Keyboard,
  Lightbulb,
  Lock,
  MessageSquare,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Shuffle,
  Snowflake,
  Square,
  Sun,
  Swords,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserMinus,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import {
  ANIMAL_ACCESSORIES,
  ANIMAL_CHARACTERS,
  CREWMATE_COLORS,
  DEFAULT_VOCAB_TEXT,
  VOCAB_PRESETS
} from '../constants/seedData';
import {
  GAME_TEAM_META,
  LOBBY_CHAT_RESET_MS,
  computeRoomTeamStandings,
  getActiveTeamIds,
  getSpeedAdjustedTimeLimit,
  matchRound4TypingAnswer,
  normalizeRoomObject,
  parseRawVocabText
} from '../utils/examHelpers';
import { speakWord } from '../utils/mediaHelpers';
import AnimalPilotAvatar from '../components/common/AnimalPilotAvatar';
import UserAvatarBadge from '../components/common/UserAvatarBadge';
import VipMemberName from '../components/common/VipMemberName';
import KnightDragonGame from '../components/game/KnightDragonGame';
import {
  AIEO_VIP_PRICE_VND,
  FRIEND_ROOM_TICKET_PRICE_VND,
  canCreateFriendRoomNow,
  formatVndCurrency,
  getFriendRoomTicketCredits,
  hasGamePracticeAccess,
  hasVipFriendRoomAccess,
  normalizePaymentConfig,
  resolveUserVipNameVisual,
  resolveVisibleTitleBadge
} from '../constants/profileCustomization';

export default function GameArena({
  activeQuestion,
  advanceNextGameRound,
  attempts = [],
  autoNextTimerRef,
  canvasRef,
  chatScrollRef,
  copiedRoomPin,
  currentRoomPin,
  currentUser,
  customTitles = [],
  customVocabTopics = [],
  dailyRankTitles = null,
  darkMode = false,
  freezeCharges,
  gameCombo,
  gameLives,
  gameMuted,
  gameOutcome,
  gamePaused,
  gamePracticeLeaderboard = [],
  gameQueues,
  gameReviewLog,
  gameRound,
  gameRuntimeRef,
  gameScore,
  gameSubState,
  gameTimeLeft,
  gameTimeLimit,
  arenaEntryNonce = 0,
  arenaInitialMode = 'hub',
  gameToast,
  gameTypedProgress,
  gameRound4Input = '',
  gameWordIdx,
  handleChangeAccessory,
  handleChangeAnimal,
  handleChangeCrewColor,
  handleClearLobbyChatNow,
  handleCopyInviteLink,
  handleDeleteRoom,
  handleFinishRoomMatch,
  handleGameChoiceSelect,
  handleGameHint,
  handleGameTypingInput,
  handleRound4InputChange,
  handleSubmitRound4Answer,
  handleKickLobbyPlayer,
  handleLeaveGameLobby,
  handleSaveHostRoomSettings,
  handleSendLobbyChat,
  handleSetPlayerTeam,
  handleShuffleRoomTeams,
  handleStudentJoinRoom,
  handleTeacherApproveLobbyPlayer,
  handleTeacherOpenLobby,
  handleTeacherResetLobby,
  handleTeacherStartLobbyGame,
  handleToggleGameMute,
  handleToggleGamePause,
  handleToggleLobbyReady,
  handleUseFreezePowerup,
  hostRoomDraft,
  initGameCampaign,
  initPracticeGameCampaign,
  isFrozenBoost,
  isPracticeGameSession = false,
  isSandboxRound,
  practiceTopicMeta = null,
  joinedRoomPin,
  jumpToGameSandboxRound,
  liveRankDeltas,
  lobbyChatInput,
  lobbyCountdown,
  lobbyCountdownTimerRef,
  lobbyNowTick,
  myAccessoryId = 'crown',
  myAnimalId = 'cat',
  myCrewColor,
  onOpenCheckoutModal = null,
  onSyncKnightResult = null,
  openMemberProfile,
  paymentConfig = null,
  previousView = '',
  roomJoinError,
  roomJoinForm,
  roomsDb,
  serverSyncConnected,
  setCopiedRoomPin,
  setCustomVocabInput,
  setDarkMode,
  setGameSubState,
  setHostRoomDraft,
  setLobbyChatInput,
  setLobbyCountdown,
  setMyAccessoryId,
  setMyAnimalId,
  setMyCrewColor,
  setRoomJoinError,
  setRoomJoinForm,
  setShowAvatarModal,
  setShowCreateRoomModal,
  setShowMobileKeyboard,
  setShowVocabModal,
  setView,
  showMobileKeyboard,
  showToast,
  transitionCountdown,
  usersDb,
  wordTimerRef
}) {
  const [inspectedLobbyUsername, setInspectedLobbyUsername] = useState(null);
  const [showPilotDrawer, setShowPilotDrawer] = useState(false);
  const [arenaGameMode, setArenaGameMode] = useState(() =>
    arenaInitialMode || (gameSubState === 'JOIN' || gameSubState === 'LOBBY' ? 'hub' : 'space_shooter')
  ); // 'hub' | 'space_shooter' | 'knight_rpg'

  const gameSubStateRef = useRef(gameSubState);
  gameSubStateRef.current = gameSubState;

  useEffect(() => {
    const curSub = gameSubStateRef.current;
    if (curSub === 'PLAYING' || curSub === 'COUNTDOWN' || curSub === 'HOST_SPECTATE') {
      return;
    }
    setArenaGameMode(arenaInitialMode || 'hub');
  }, [arenaEntryNonce, arenaInitialMode]);
  const [entryZone, setEntryZone] = useState('live'); // 'live' | 'practice'
  const [practiceTopicId, setPracticeTopicId] = useState('core');
  const [practiceSpeed, setPracticeSpeed] = useState('normal');
  const [practiceRoundSize, setPracticeRoundSize] = useState(0); // 0 = tất cả từ trong kho
  const [practiceSelectedWords, setPracticeSelectedWords] = useState([]);
  const [showPracticeWordPicker, setShowPracticeWordPicker] = useState(false);
  const [showLobbyWordPicker, setShowLobbyWordPicker] = useState(false);
  const isTeacher = currentUser?.role === 'teacher';
  const canAccessPracticeGame = isTeacher || hasGamePracticeAccess(currentUser);
  const activePin = joinedRoomPin || currentRoomPin;
  const room = normalizeRoomObject(roomsDb[activePin], activePin, lobbyNowTick);
  const isFriendVipRoom = room.roomMode === 'friend_vip';
  const isFriendVipHost = Boolean(isFriendVipRoom && currentUser?.username && room.hostUsername === currentUser.username);
  const isRoomHost = isTeacher || isFriendVipHost;
  const hasFullVipRoomAccess = isTeacher || hasVipFriendRoomAccess(currentUser);
  const roomTicketCredits = getFriendRoomTicketCredits(currentUser);
  const canCreateFriendVipRoom = isTeacher || canCreateFriendRoomNow(currentUser);
  const normalizedPayCfg = normalizePaymentConfig(paymentConfig || {});
  const aieoVipPriceLabel = formatVndCurrency(normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND);
  const roomTicketPriceLabel = formatVndCurrency(normalizedPayCfg.friendRoomTicketPrice ?? FRIEND_ROOM_TICKET_PRICE_VND);
  const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin, lobbyNowTick));
  const roomChatMessages = Array.isArray(room.chatMessages) ? room.chatMessages : [];
  const chatRemainingMs =
    roomChatMessages.length > 0 && room.chatCycleStartedAt
      ? Math.max(0, LOBBY_CHAT_RESET_MS - Math.max(0, lobbyNowTick - room.chatCycleStartedAt))
      : LOBBY_CHAT_RESET_MS;
  const chatRemMin = Math.floor(chatRemainingMs / 60000);
  const chatRemSec = Math.floor((chatRemainingMs % 60000) / 1000);
  const chatResetCountdownStr = `${String(chatRemMin).padStart(2, '0')}:${String(chatRemSec).padStart(2, '0')}`;
  const leaderboardPlayers = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
  const lobbyPlayersList = Object.values(room.lobbyPlayers || {}).sort((a, b) => {
    if (a.role === 'teacher' && b.role !== 'teacher') return -1;
    if (b.role === 'teacher' && a.role !== 'teacher') return 1;
    return (a.joinedAt || 0) - (b.joinedAt || 0);
  });
  const myLobbyEntry = currentUser?.username ? room.lobbyPlayers?.[currentUser.username] : null;
  const roomVocabCount = parseRawVocabText(room.rawVocab || DEFAULT_VOCAB_TEXT).length;
  const readyCount = lobbyPlayersList.filter(p => p.ready || p.role === 'teacher').length;
  const studentLobbyPlayers = lobbyPlayersList.filter(p => p.role !== 'teacher');
  const hasStudentsInLobby = studentLobbyPlayers.length > 0;
  const activeTeamIds = getActiveTeamIds(room.teamCount || 0);
  const isTeamRoom = activeTeamIds.length >= 2;
  const roomMaxPlayers = Math.max(2, Math.min(30, Number(room.maxPlayers || 30)));
  const activeCrewColorId = myLobbyEntry?.colorId || myCrewColor;
  const activeAnimalId = myLobbyEntry?.animalId || myAnimalId;
  const activeAccessoryId = myLobbyEntry?.accessoryId || myAccessoryId;
  const activeAnimalObj = ANIMAL_CHARACTERS.find(a => a.id === activeAnimalId) || ANIMAL_CHARACTERS[0];
  const activeAccessoryObj = ANIMAL_ACCESSORIES.find(a => a.id === activeAccessoryId) || ANIMAL_ACCESSORIES[0];
  const myAvatarUrl = currentUser?.avatarUrl || '';
  const timePct = Math.max(0, Math.min(100, (gameTimeLeft / Math.max(1, gameTimeLimit)) * 100));
  const isLowTime = gameTimeLeft <= 5;
  const isMidTime = gameTimeLeft <= 10 && gameTimeLeft > 5;

  const exitGame = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    const targetBack = ['TEACHER_DASHBOARD', 'SKILL_HUB', 'HOME', 'STUDENT_PROFILE'].includes(previousView)
      ? previousView
      : (isTeacher ? 'TEACHER_DASHBOARD' : 'HOME');
    setView(targetBack);
  };

  if (arenaGameMode === 'knight_rpg') {
    return (
      <KnightDragonGame
        currentUser={currentUser}
        customVocabTopics={customVocabTopics}
        initialRawVocab={room.rawVocab || DEFAULT_VOCAB_TEXT}
        initialTopicId={practiceTopicId}
        onBackToGameHub={() => setArenaGameMode('hub')}
        onBackToSpaceMode={() => setArenaGameMode('space_shooter')}
        onExitArena={exitGame}
        onSyncKnightResult={onSyncKnightResult}
        roomPin={activePin}
        roomRawVocab={room.rawVocab || DEFAULT_VOCAB_TEXT}
        showToast={showToast}
      />
    );
  }

  const themeToggleButton = setDarkMode ? (
    <button
      type="button"
      onClick={() => setDarkMode(d => !d)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition"
      title={darkMode ? 'Chuyển sang giao diện Sáng (Hồng dịu)' : 'Chuyển sang giao diện Tối (Vũ trụ)'}
    >
      {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#007A7A]" />}
      <span className="hidden sm:inline">{darkMode ? 'Sáng' : 'Tối'}</span>
    </button>
  ) : null;

  const renderPilotCustomizer = (compact = false) => {
    const swatchSize = compact ? 'w-5 h-5' : 'w-6 h-6';
    const applyColor = (colorId) => {
      if (gameSubState === 'JOIN') {
        setMyCrewColor(colorId);
      } else {
        handleChangeCrewColor(colorId);
      }
    };
    const applyAnimal = (animalId) => {
      if (gameSubState === 'JOIN') {
        setMyAnimalId?.(animalId);
      } else {
        handleChangeAnimal?.(animalId);
      }
    };
    const applyAccessory = (accessoryId) => {
      if (gameSubState === 'JOIN') {
        setMyAccessoryId?.(accessoryId);
      } else {
        handleChangeAccessory?.(accessoryId);
      }
    };

    return (
      <div className="space-y-3">
        {/* 1. Animal Species Picker */}
        <div>
          <p className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>1. Chọn Nhân Vật Động Vật</span>
            <span className="text-[#007A7A] dark:text-cyan-300 font-extrabold normal-case">{activeAnimalObj.label}</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {ANIMAL_CHARACTERS.map(sp => {
              const selected = activeAnimalId === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => applyAnimal(sp.id)}
                  className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    selected
                      ? 'bg-[#EDFFFD] dark:bg-cyan-500/20 border-[#007A7A] dark:border-cyan-400 text-[#007A7A] dark:text-white shadow-sm ring-1 ring-[#007A7A]/30 dark:ring-cyan-400/50'
                      : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300 hover:border-[#007A7A]/50 dark:hover:border-slate-600'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300 dark:border-slate-950"
                    style={{ backgroundColor: sp.body }}
                  />
                  <span className="truncate">{sp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Accessories Picker */}
        <div>
          <p className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>2. Phụ Kiện Đeo / Đội Đầu</span>
            <span className="text-amber-700 dark:text-amber-300 font-extrabold normal-case">{activeAccessoryObj.icon} {activeAccessoryObj.label}</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {ANIMAL_ACCESSORIES.map(acc => {
              const selected = activeAccessoryId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => applyAccessory(acc.id)}
                  className={`px-2 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                    selected
                      ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-400 text-amber-800 dark:text-amber-200 shadow-sm ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300 hover:border-amber-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span>{acc.icon}</span>
                  <span className="truncate">{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Spaceship Paint Color & Avatar */}
        <div>
          <p className="text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider mb-1.5">
            3. Màu Phi Thuyền &amp; Ảnh Mặt Avatar
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {CREWMATE_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => applyColor(c.id)}
                className={`${swatchSize} rounded-full border-2 transition ${
                  activeCrewColorId === c.id ? 'border-[#0F172B] dark:border-white scale-115 shadow-lg' : 'border-slate-300 dark:border-slate-700 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.fill }}
                title={`Màu tàu ${c.label}`}
              />
            ))}
            {myAvatarUrl ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => applyColor('avatar')}
                  className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-full overflow-hidden border-2 transition bg-white dark:bg-slate-800 ${
                    activeCrewColorId === 'avatar'
                      ? 'border-[#007A7A] dark:border-cyan-300 ring-2 ring-[#007A7A]/40 dark:ring-cyan-400/60 scale-115 shadow-lg'
                      : 'border-slate-200 dark:border-slate-600 opacity-85 hover:opacity-100'
                  }`}
                  title="Dùng Ảnh Avatar làm mặt phi công"
                >
                  <img src={myAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#007A7A] dark:text-cyan-300 transition flex items-center gap-1"
                  title="Đổi ảnh Avatar khuôn mặt"
                >
                  <Camera className="w-3 h-3" /> Đổi ảnh
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="ml-1 px-2.5 py-1 rounded-full border border-dashed border-[#007A7A]/60 dark:border-cyan-500/60 bg-[#EDFFFD] dark:bg-cyan-500/10 hover:bg-[#D5FBF7] dark:hover:bg-cyan-500/20 text-xs font-bold text-[#007A7A] dark:text-cyan-300 transition flex items-center gap-1"
                title="Tải ảnh khuôn mặt để gắn lên phi công"
              >
                <Camera className="w-3 h-3" /> + Avatar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLobbyChatPanel = (heightClass = 'h-[270px] lg:h-[360px]', titleLabel = 'Chat Phòng Chờ') => (
    <div className={`lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 flex flex-col ${heightClass} shadow-xl backdrop-blur-md`}>
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-2.5 shrink-0 flex-wrap">
        <span className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#007A7A] dark:text-cyan-400" /> {titleLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
              roomChatMessages.length > 0 && room.chatCycleStartedAt
                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-400/30 font-mono'
                : 'bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Khung chat tự động làm mới xóa trắng sau mỗi 10 phút"
          >
            <Clock className="w-3 h-3 shrink-0" />
            {roomChatMessages.length > 0 && room.chatCycleStartedAt
              ? `Xóa sau ${chatResetCountdownStr}`
              : 'Làm mới mỗi 10p'}
          </span>
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 tabular-nums">
            {roomChatMessages.length} tin
          </span>
          {isTeacher && roomChatMessages.length > 0 && handleClearLobbyChatNow && (
            <button
              type="button"
              onClick={() => handleClearLobbyChatNow(activePin)}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-[#475569] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition"
              title="Xóa trắng khung chat ngay"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {roomChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#475569] dark:text-slate-500 text-xs px-3 gap-1">
            <MessageSquare className="w-7 h-7 mb-1 opacity-40" />
            <p>Chưa có tin nhắn nào. Hãy nhắn chào cả phòng hoặc chọn câu chat nhanh bên dưới!</p>
            <p className="text-xs text-[#94A3B8] dark:text-slate-500/80">Khung chat tự động làm mới xóa trắng sau mỗi 10 phút.</p>
          </div>
        ) : (
          roomChatMessages.map(msg => {
            const isMine = msg.username === currentUser?.username;
            const swatch = CREWMATE_COLORS.find(c => c.id === msg.colorId)?.fill || '#06b6d4';
            const msgAvatar = msg.avatarUrl || usersDb[msg.username]?.avatarUrl || '';
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5 text-xs text-[#475569] dark:text-slate-400">
                  {msgAvatar ? (
                    <img src={msgAvatar} alt="" className="w-4 h-4 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
                  )}
                  <span className="font-bold text-[#0F172B] dark:text-slate-200">{msg.name}</span>
                  {msg.role === 'teacher' && <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400" />}
                  <span>• {msg.timeStr}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[88%] break-words shadow-2xs ${
                  isMine
                    ? 'bg-[#EDFFFD] dark:bg-cyan-600/30 border border-[#007A7A]/35 dark:border-cyan-500/40 text-[#0F172B] dark:text-cyan-100 rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0F172B] dark:text-slate-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Sẵn sàng!', 'Bắt đầu thôi!', 'Cố lên cả lớp!'].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSendLobbyChat(q)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#334155] dark:text-slate-300 transition"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!lobbyChatInput.trim()) return;
            handleSendLobbyChat(lobbyChatInput);
            setLobbyChatInput('');
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={lobbyChatInput}
            onChange={e => setLobbyChatInput(e.target.value)}
            placeholder="Nhập tin nhắn chat..."
            maxLength={140}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#0F172B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#007A7A] dark:focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Gửi
          </button>
        </form>
      </div>
    </div>
  );

  // 0. DEDICATED GAME SELECTION HUB SCREEN (Choose between Space Shooter vs Knight & Dragon RPG before entering room)
  if (arenaGameMode === 'hub' && (gameSubState === 'JOIN' || gameSubState === 'LOBBY')) {
    const openLobbyRoomsCount = allRoomsList.filter(r => r.status === 'LOBBY').length;
    return (
      <div
        data-testid="arena-game-selection-hub"
        className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-[-12%] left-[12%] w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-12%] right-[12%] w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hub Header */}
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between relative z-10 gap-2 flex-wrap">
          <button
            type="button"
            onClick={exitGame}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại Trang Chủ
          </button>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isTeacher && (
              <button
                type="button"
                onClick={() => {
                  setArenaGameMode('space_shooter');
                  setShowCreateRoomModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Phòng Mới
              </button>
            )}
            {themeToggleButton}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold border ${
                serverSyncConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {serverSyncConnected ? 'Đã đồng bộ Live' : 'Local Mode'}
            </span>
          </div>
        </div>

        {/* Center 2-Game Arcade Showcase */}
        <div className="max-w-5xl w-full mx-auto my-auto py-6 relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5" /> SẢNH CHỌN GAME ĐẤU TRƯỜNG TỪ VỰNG IELTS
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Chọn Tựa Game Bạn Muốn Tham Gia
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              Mỗi tựa game đều tích hợp 14 kho từ vựng IELTS &amp; bộ đề của Giáo viên, bảng xếp hạng đua Top 1/2/3 theo ngày (chốt 23:59 trao danh hiệu vào ngày hôm sau) và hệ thống danh hiệu độc quyền!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* GAME CARD 1: SPACE SHOOTER ARENA */}
            <div className="group rounded-3xl border-2 border-cyan-500/45 hover:border-cyan-400 bg-gradient-to-br from-slate-900 via-[#0b192c] to-slate-950 p-6 flex flex-col justify-between gap-5 shadow-2xl transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black">
                    🚀 GAME 1 • MULTIPLAYER &amp; TỰ LUYỆN
                  </span>
                  {openLobbyRoomsCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold animate-pulse">
                      ● {openLobbyRoomsCount} phòng PIN đang mở
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-slate-950/80 border border-cyan-500/25 rounded-2xl p-4">
                  <AnimalPilotAvatar
                    animalId={myAnimalId}
                    accessoryId={myAccessoryId}
                    colorId={myCrewColor}
                    avatarUrl={myAvatarUrl}
                    size={64}
                    onShip={true}
                  />
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white">
                      Đấu Trường Phi Thuyền Vũ Trụ
                    </h2>
                    <p className="text-xs text-cyan-300 font-bold">
                      Space Shooter Arena • Đấu Phòng PIN Live &amp; Chia Đội
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Chọn <b>Phi Công Thú Cưng &amp; Màu Tàu</b>, vào phòng PIN thi đấu trực tiếp cùng cả lớp hoặc tự luyện 4 vòng: <b>Bắn Thiên Thạch Nghĩa ➔ Gõ Từ Full ➔ Đồng/Trái Nghĩa ➔ Gõ Câu Diệt Boss</b>.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 font-bold">
                    🛸 Phòng Đấu PIN Live cùng Giáo viên &amp; Bạn bè
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 font-bold">
                    🐾 12 Thú Cưng Phi Công &amp; Phụ kiện vương miện
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-testid="select-space-shooter-game-btn"
                onClick={() => setArenaGameMode('space_shooter')}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
              >
                <Rocket className="w-4 h-4" />
                <span>CHỌN GAME PHI THUYỀN — VÀO PHÒNG NGAY →</span>
              </button>
            </div>

            {/* GAME CARD 2: KNIGHT & DRAGON RPG QUEST */}
            <div className="group rounded-3xl border-2 border-rose-500/50 hover:border-amber-400 bg-gradient-to-br from-slate-900 via-[#220d1c] to-slate-950 p-6 flex flex-col justify-between gap-5 shadow-2xl transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black">
                    ⚔️ GAME 2 • NHẬP VAI DIỆT RỒNG (MỚI)
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                    🐉 Boss Cuối Final Smash
                  </span>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/80 border border-rose-500/25 rounded-2xl p-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-md shrink-0">
                    ⚔️
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white">
                      Hiệp Sĩ Diệt Rồng — RPG Quest
                    </h2>
                    <p className="text-xs text-amber-300 font-bold">
                      Slime ➔ Goblin ➔ Orc ➔ Boss Cuối Rồng Hắc Ám
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Đánh hạ quái vật để <b>quái rớt ra 🪙 Tiền Vàng</b> tích lũy mở khóa nhân vật mới (<b>Nữ Chiến Binh Valkyrie, Nữ Kiếm Khách Sakura, Nữ Pháp Sư Selena</b>), ngẫu nhiên nhặt <b>🗝️ Chìa Khóa Hồi Sinh</b> trên đường để mua mạng khi thua và né <b>Skill Tất Sát (Final Smash)</b> của Rồng!
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-amber-200 font-bold">
                    🪙 Đánh quái rớt Vàng • Mở khóa 6 Skin Nam &amp; Nữ
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sky-200 font-bold">
                    🗝️ Nhặt Chìa Khóa trên đường để Hồi Sinh
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-testid="switch-to-knight-game-btn"
                onClick={() => setArenaGameMode('knight_rpg')}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 hover:opacity-95 text-slate-950 font-black text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition"
              >
                <Swords className="w-4 h-4" />
                <span>CHỌN GAME HIỆP SĨ — VÀO PHÒNG RPG →</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 relative z-10">
          Bạn có thể chuyển đổi qua lại giữa 2 game bất kỳ lúc nào ngay trong phòng chờ.
        </div>
      </div>
    );
  }

  // 1. JOIN ROOM SCREEN (Students must enter Teacher's Room PIN & Password)
  if (gameSubState === 'JOIN' && !isTeacher) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070b14] text-[#0F172B] dark:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-teal-400/15 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[15%] w-96 h-96 bg-pink-400/20 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full mx-auto flex items-center justify-between relative z-10 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exitGame}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-[#F8FAFC] dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0F172B] dark:text-slate-200 shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
            <button
              type="button"
              data-testid="back-to-game-hub-btn"
              onClick={() => setArenaGameMode('hub')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/40 text-xs font-extrabold text-indigo-700 dark:text-indigo-200 transition"
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Chọn Game Khác (2 Game)
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {themeToggleButton}
            <button
              type="button"
              data-testid="lobby-switch-to-knight-game-btn"
              onClick={() => setArenaGameMode('knight_rpg')}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 font-black transition inline-flex items-center gap-1 shadow-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>⚔️ Game Hiệp Sĩ Diệt Rồng</span>
            </button>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold border ${
              serverSyncConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
            }`}>
              <Wifi className="w-3.5 h-3.5" />
              {serverSyncConnected ? 'Đã đồng bộ Live' : 'Local Mode'}
            </span>
            <span className="hidden sm:inline-flex text-[#475569] dark:text-slate-400 font-medium items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#007A7A] dark:text-cyan-400" /> Xác thực phòng thi đấu trực tiếp
            </span>
          </div>
        </div>

        <div className="max-w-3xl w-full mx-auto my-auto py-4 relative z-10 space-y-4">
          {/* 2-Game Switcher Banner inside Zone Đấu Trường: Space Shooter vs Knight & Dragon RPG */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/85 border border-rose-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                  GAME MỚI TRONG ĐẤU TRƯỜNG
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  ⚔️ Hiệp Sĩ Diệt Rồng (Slime ➔ Goblin ➔ Boss Rồng Hắc Ám)
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Đánh hạ quái vật rớt 🪙 Tiền Vàng &amp; ngẫu nhiên nhặt 🗝️ Chìa Khóa Hồi Sinh trên đường, mở khóa Nữ Chiến Binh Valkyrie / Nữ Kiếm Khách Sakura &amp; né Skill Tất Sát (Final Smash) của Rồng!
              </p>
            </div>
            <button
              type="button"
              data-testid="switch-to-knight-game-btn"
              onClick={() => setArenaGameMode('knight_rpg')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 text-xs font-black shrink-0 inline-flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <Swords className="w-4 h-4" />
              <span>Chơi Hiệp Sĩ Diệt Rồng Ngay →</span>
            </button>
          </div>

          {/* 2-Zone Selector: Live (Teacher Approval) vs Open Self-Practice + BXH */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setEntryZone('live')}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition ${
                entryZone === 'live'
                  ? 'bg-[#007A7A] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zone Thực Chiến Live (GV Duyệt)</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryZone('practice')}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition ${
                entryZone === 'practice'
                  ? 'bg-gradient-to-r from-[#007A7A] to-[#0F766E] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
              }`}
            >
              <Rocket className="w-4 h-4 shrink-0" />
              <span>Zone Tự Luyện Tập Cùng Nhau (BXH)</span>
            </button>
          </div>

          {entryZone === 'practice' ? (
            !canAccessPracticeGame ? (
              <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-amber-300 dark:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172B] dark:text-white">
                    Khu Tự Luyện Tập Game Từ Vựng (14 Kho + Collocation)
                  </h1>
                  <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                    Đăng ký <b>Gói Tháng ({aieoVipPriceLabel}/tháng)</b> để mở khóa toàn bộ quyền lợi:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs pt-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ✅ Luyện Tập Game Từ Vựng (14 kho + Collocation &amp; chọn từ làm luôn)
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ✅ Quyền Tạo Phòng Luyện Tập Từ Vựng theo Chủ Đề
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ✅ Chỉnh Màu Chữ Tên &amp; Chọn Khung Viền Avatar nổi bật
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                      ✅ Thêm &amp; Đổi Ảnh Bìa Hồ Sơ cá nhân
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCheckoutModal?.({
                        itemType: 'aieo_vip',
                        itemId: '',
                        itemLabel: 'Gói Tháng Game & Hồ Sơ (1 Tháng)',
                        itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                      })
                    }
                    className="px-6 py-3 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-extrabold inline-flex items-center gap-2 shadow-md transition"
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>Mở Khóa Gói Tháng ({aieoVipPriceLabel}/tháng)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryZone('live')}
                    className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Quay lại Phòng Đấu Live của Giáo Viên
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="text-center space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E] dark:text-[#1EE1D6] bg-indigo-50 dark:bg-teal-500/20 border border-indigo-200 dark:border-[#007A7A]/40 px-3 py-1 rounded-full">
                  4 Vòng Chuẩn IELTS: V1 Bắn Nghĩa • V2 Gõ Full • V3 Đồng/Trái Nghĩa &amp; MCQ • V4 Đọc Câu &amp; Gõ Đáp Án
                </span>
                <h1 className="text-2xl font-extrabold text-[#0F172B] dark:text-white pt-1">
                  Luyện Tập Game 14 Kho Từ &amp; Câu Hỏi
                </h1>
                <p className="text-xs text-[#475569] dark:text-slate-400 max-w-lg mx-auto">
                  Chọn 1 trong <b>14 kho từ</b> hoặc kho tự tạo, chọn số lượng từ hoặc tích chọn trực tiếp các câu muốn luyện ngay!
                </p>
              </div>

              {(() => {
                const isCustomTopic = String(practiceTopicId).startsWith('custom:');
                const customTopicObj = isCustomTopic
                  ? (customVocabTopics || []).find(t => `custom:${t.id}` === practiceTopicId)
                  : null;
                const selectedPreset = VOCAB_PRESETS?.[practiceTopicId];
                const chosenTopicLabel =
                  practiceTopicId === 'room_custom'
                    ? `Phòng #${activePin}`
                    : customTopicObj
                    ? customTopicObj.label
                    : selectedPreset?.label || 'IELTS Core Academic';
                const chosenRawVocab =
                  practiceTopicId === 'room_custom'
                    ? (room.rawVocab || DEFAULT_VOCAB_TEXT)
                    : customTopicObj
                    ? customTopicObj.text
                    : selectedPreset?.text || DEFAULT_VOCAB_TEXT;
                const bankItems = parseRawVocabText(chosenRawVocab);
                const validSelectedWords = practiceSelectedWords.filter(w =>
                  bankItems.some(it => it.word === w)
                );
                const effectiveRoundSize =
                  validSelectedWords.length > 0
                    ? validSelectedWords.length
                    : practiceRoundSize > 0
                    ? Math.min(bankItems.length, practiceRoundSize)
                    : bankItems.length;

                const toggleWordSelection = (word) => {
                  setPracticeSelectedWords(prev =>
                    prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
                  );
                };

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="sm:col-span-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                            Chọn Kho Từ (14 Kho + Tự Tạo)
                          </label>
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomVocabInput(chosenRawVocab);
                                setShowVocabModal(true);
                              }}
                              className="text-[11px] font-extrabold text-[#007A7A] dark:text-[#1EE1D6] hover:underline inline-flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Soạn / Sửa Kho
                            </button>
                          )}
                        </div>
                        <select
                          value={practiceTopicId}
                          onChange={e => {
                            setPracticeTopicId(e.target.value);
                            setPracticeSelectedWords([]);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        >
                          <option value="core">🎯 IELTS Core Academic (Mặc định)</option>
                          {Object.entries(VOCAB_PRESETS || {}).map(([key, preset]) => (
                            <option key={key} value={key}>
                              📚 {preset.label}
                            </option>
                          ))}
                          {(customVocabTopics || []).map(t => (
                            <option key={t.id} value={`custom:${t.id}`}>
                              ⭐ {t.label}
                            </option>
                          ))}
                          {roomVocabCount > 0 && (
                            <option value="room_custom">🏫 Bộ từ Phòng Đấu #{activePin} ({roomVocabCount} từ)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          Số Từ Mỗi Vòng ({bankItems.length} từ có sẵn)
                        </label>
                        <select
                          value={practiceRoundSize}
                          onChange={e => setPracticeRoundSize(Number(e.target.value) || 0)}
                          disabled={validSelectedWords.length > 0}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-60"
                        >
                          <option value={0}>Tất cả ({bankItems.length} từ)</option>
                          {[4, 8, 12, 16, 20, 30, 50, 100].map(n => (
                            <option key={n} value={n}>{n} từ / vòng</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          Tốc Độ Luyện Tập
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'relaxed', label: 'Chậm' },
                            { id: 'normal', label: 'Chuẩn' },
                            { id: 'turbo', label: 'Nhanh' }
                          ].map(sp => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => setPracticeSpeed(sp.id)}
                              className={`px-2 py-2.5 rounded-xl text-xs font-extrabold border transition ${
                                practiceSpeed === sp.id
                                  ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {sp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Word Picker: Chọn từ làm luôn */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPracticeWordPicker(v => !v)}
                          className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] inline-flex items-center gap-1.5 hover:underline"
                        >
                          <CheckSquare className="w-4 h-4" />
                          <span>
                            {showPracticeWordPicker ? 'Ẩn danh sách chọn từ' : 'Chọn từ làm luôn'} (
                            {validSelectedWords.length > 0
                              ? `Đã chọn ${validSelectedWords.length}/${bankItems.length} từ`
                              : `Sẽ chơi ${effectiveRoundSize}/${bankItems.length} từ`}
                            )
                          </span>
                        </button>
                        {showPracticeWordPicker && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setPracticeSelectedWords(bankItems.map(i => i.word))}
                              className="font-bold text-teal-700 dark:text-teal-300 hover:underline"
                            >
                              Chọn hết ({bankItems.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPracticeSelectedWords([])}
                              className="font-bold text-slate-500 hover:underline"
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        )}
                      </div>

                      {showPracticeWordPicker && (
                        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pt-1">
                          {bankItems.map(item => {
                            const checked = validSelectedWords.includes(item.word);
                            const isColloc = item.word.includes(' ');
                            return (
                              <button
                                key={item.word}
                                type="button"
                                onClick={() => toggleWordSelection(item.word)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition ${
                                  checked
                                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                    : isColloc
                                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-500/40 hover:border-purple-400'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                                }`}
                                title={item.prompt}
                              >
                                {checked ? <CheckSquare className="w-3.5 h-3.5 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0 opacity-60" />}
                                <span>{item.word}</span>
                                <span className={`text-[10px] font-medium truncate max-w-[110px] ${checked ? 'text-teal-100' : 'text-slate-400'}`}>
                                  · {item.prompt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          initPracticeGameCampaign?.({
                            topicId: practiceTopicId,
                            topicLabel: chosenTopicLabel,
                            rawVocab: chosenRawVocab,
                            roundSize: effectiveRoundSize,
                            selectedWords: validSelectedWords,
                            speedMode: practiceSpeed,
                            startRound: 1,
                            singleRoundOnly: false
                          })
                        }
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#007A7A] to-[#0F766E] hover:opacity-95 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                      >
                        <Play className="w-4 h-4 fill-current" /> BẮT ĐẦU TỰ LUYỆN ĐỦ 4 VÒNG ({effectiveRoundSize} từ/vòng)
                      </button>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { r: 1, title: 'V1: Bắn Nghĩa', desc: 'Từ ↔ Nghĩa' },
                          { r: 2, title: 'V2: Gõ Từ Full', desc: 'Chính tả đầy đủ' },
                          { r: 3, title: 'V3: Đồng / Trái Nghĩa', desc: 'Đồng nghĩa · Trái nghĩa · MCQ' },
                          { r: 4, title: 'V4: Đọc Câu & Gõ', desc: 'Hiện câu hỏi → Gõ đáp án' }
                        ].map(item => (
                          <button
                            key={item.r}
                            type="button"
                            onClick={() =>
                              initPracticeGameCampaign?.({
                                topicId: practiceTopicId,
                                topicLabel: chosenTopicLabel,
                                rawVocab: chosenRawVocab,
                                roundSize: effectiveRoundSize,
                                selectedWords: validSelectedWords,
                                speedMode: practiceSpeed,
                                startRound: item.r,
                                singleRoundOnly: true
                              })
                            }
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-950/75 hover:border-[#007A7A] border border-slate-200 dark:border-slate-700 text-left transition"
                          >
                            <span className="block text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6]">
                              {item.title}
                            </span>
                            <span className="block text-xs text-[#475569] dark:text-slate-400">
                              {item.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Practice Leaderboard (BXH Ranking) */}
              <div className="bg-white/95 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> BXH Khu Tự Luyện Tập ({gamePracticeLeaderboard.length} kỷ lục)
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">Tự động cập nhật sau mỗi lượt chơi</span>
                </div>
                {gamePracticeLeaderboard.length === 0 ? (
                  <p className="text-xs text-[#475569] dark:text-slate-400 text-center py-4">
                    Chưa có kỷ lục nào trong Khu Tự Luyện Tập - hãy chơi ngay để lên Top #1!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {gamePracticeLeaderboard.slice(0, 10).map((row, idx) => {
                      const isMe = row.username === currentUser?.username;
                      return (
                        <div
                          key={row.id || `${row.username}-${idx}`}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                            isMe
                              ? 'bg-[#EDFFFD] dark:bg-cyan-500/15 border-[#007A7A]/50 dark:border-cyan-400/50'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1">
                              <span>#{idx + 1}</span>
                              <VipMemberName user={usersDb[row.username] || row} fallbackName={row.name || row.username} badgeSize="xs" />
                              {isMe && <span className="text-xs font-bold text-[#007A7A] dark:text-cyan-300">(Bạn)</span>}
                            </p>
                            <p className="text-xs text-[#475569] dark:text-slate-400 truncate">
                              {row.topicLabel} • {row.accuracyPct ?? 100}% đúng
                            </p>
                          </div>
                          <span className="font-mono font-black text-amber-600 dark:text-amber-300 shrink-0 ml-2">
                            {row.score}đ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )
          ) : (
          <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.14)] dark:shadow-2xl">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="flex items-center justify-center gap-5 mb-3 bg-white/90 dark:bg-slate-950/75 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
                <div className="flex flex-col items-center">
                  <AnimalPilotAvatar
                    animalId={myAnimalId}
                    accessoryId={myAccessoryId}
                    colorId={myCrewColor}
                    avatarUrl={myAvatarUrl}
                    size={58}
                    onShip={false}
                  />
                  <span className="text-xs font-bold text-[#475569] dark:text-slate-400 mt-1">Trong Sảnh</span>
                </div>
                <div className="h-10 w-px bg-pink-200 dark:bg-slate-800" />
                <div className="flex flex-col items-center">
                  <AnimalPilotAvatar
                    animalId={myAnimalId}
                    accessoryId={myAccessoryId}
                    colorId={myCrewColor}
                    avatarUrl={myAvatarUrl}
                    size={62}
                    onShip={true}
                  />
                  <span className="text-xs font-bold text-[#007A7A] dark:text-cyan-300 mt-1">Phi Thuyền 4 Vòng</span>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#007A7A] dark:text-cyan-400 bg-[#EDFFFD] dark:bg-cyan-500/10 border border-[#B5F5F1] dark:border-cyan-500/30 px-3 py-1 rounded-full mb-2">
                Zone Thực Chiến Live · Cần Giáo Viên Duyệt
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F172B] dark:text-white">Tham Gia Phòng Đấu Từ Vựng</h1>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                Chọn <b>Thú Cưng &amp; Phụ Kiện</b> để cùng bạn lái phi thuyền vượt qua <b>4 vòng đấu (Bắn nghĩa → Gõ Full → Đồng/Trái nghĩa → Gõ Collocation diệt Boss)</b>. Trận đấu bắt đầu khi giáo viên duyệt &amp; bấm khởi hành!
              </p>
            </div>

            {/* Pick Animal + Accessory + Ship Color before entering */}
            <div className="mb-4 bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4">
              {renderPilotCustomizer(false)}
            </div>

            {/* VIP / 5k Pay-Per-Room Friend Room Creation Banner */}
            <div className={`mb-5 rounded-2xl border p-4 flex flex-col gap-3 ${
              canCreateFriendVipRoom
                ? 'bg-gradient-to-r from-amber-50 via-rose-50 to-white dark:from-amber-950/30 dark:via-rose-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-500/40'
                : 'bg-gradient-to-r from-rose-50/90 via-white to-amber-50/80 dark:from-rose-950/25 dark:via-slate-900 dark:to-amber-950/20 border-rose-200 dark:border-rose-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <p className="text-xs font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 flex-wrap">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Phòng Đấu Riêng Chơi Cùng Bạn Bè ({roomTicketPriceLabel}/lần hoặc Gói IELTS VIP)</span>
                    {!hasFullVipRoomAccess && roomTicketCredits > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">
                        Còn {roomTicketCredits} lượt tạo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {hasFullVipRoomAccess
                      ? 'Tài khoản của bạn đã mở quyền tạo phòng không giới hạn - tự chọn số người, chia Team và đua cùng bạn bè ngay!'
                      : roomTicketCredits > 0
                      ? `Bạn đang có ${roomTicketCredits} vé tạo phòng lẻ (${roomTicketPriceLabel}/lần). Bấm Tạo Phòng Bạn Bè để mở phòng riêng ngay!`
                      : `Chọn mua vé lẻ ${roomTicketPriceLabel}/lần tạo phòng hoặc nâng cấp Gói IELTS VIP (${aieoVipPriceLabel}/1 tháng) để tạo vô hạn, Đổi Màu Chữ & Viền Bìa Neon! Bạn bè vào phòng miễn phí - bạn vẫn có thể Tập luyện 1 mình miễn phí!`}
                  </p>
                </div>
                {canCreateFriendVipRoom && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCreateRoomModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {!hasFullVipRoomAccess && roomTicketCredits > 0
                          ? `Tạo Phòng Bạn Bè (Dùng 1 vé · còn ${roomTicketCredits})`
                          : 'Tạo Phòng Bạn Bè'}
                      </span>
                    </button>
                    {!hasFullVipRoomAccess && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenCheckoutModal?.({
                            itemType: 'aieo_vip',
                            itemId: '',
                            itemLabel: 'Gói IELTS VIP Full Quyền (1 Tháng)',
                            itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                          })
                        }
                        className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 text-xs font-extrabold transition"
                      >
                        Mở VIP Vô Hạn
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!canCreateFriendVipRoom && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCheckoutModal?.({
                        itemType: 'room_ticket',
                        itemId: '',
                        itemLabel: 'Vé Tạo 1 Phòng Đấu Riêng (5k/lần)',
                        itemPrice: normalizedPayCfg.friendRoomTicketPrice ?? FRIEND_ROOM_TICKET_PRICE_VND
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Zap className="w-4 h-4" /> Mua 1 Lượt Tạo Phòng ({roomTicketPriceLabel}/lần)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCheckoutModal?.({
                        itemType: 'aieo_vip',
                        itemId: '',
                        itemLabel: 'Gói IELTS VIP Full Quyền (1 Tháng)',
                        itemPrice: normalizedPayCfg.aieoVipPrice ?? AIEO_VIP_PRICE_VND
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-[#FFFFFF] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Crown className="w-4 h-4 text-amber-200" /> Mở IELTS VIP ({aieoVipPriceLabel}/1 tháng - Vô hạn)
                  </button>
                </div>
              )}
            </div>

            {roomJoinError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{roomJoinError}</span>
              </div>
            )}

            <form onSubmit={handleStudentJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1.5">Mã Phòng (PIN)</label>
                <input
                  type="text"
                  placeholder="VD: 686868"
                  value={roomJoinForm.pin}
                  onChange={e => {
                    setRoomJoinForm({ ...roomJoinForm, pin: e.target.value });
                    if (roomJoinError) setRoomJoinError('');
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-lg font-extrabold tracking-widest text-[#007A7A] dark:text-cyan-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[#007A7A] dark:focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-slate-300 mb-1.5">Mật Khẩu Phòng</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu phòng..."
                  value={roomJoinForm.pass}
                  onChange={e => {
                    setRoomJoinForm({ ...roomJoinForm, pass: e.target.value });
                    if (roomJoinError) setRoomJoinError('');
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-semibold text-[#0F172B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[#007A7A] dark:focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#007A7A] to-[#0D9488] hover:from-[#065B5B] hover:to-[#0F766E] dark:from-cyan-500 dark:to-indigo-600 dark:hover:from-cyan-400 dark:hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-teal-900/15 dark:shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <DoorOpen className="w-4 h-4" /> VÀO SẢNH CHỜ NGAY
              </button>
            </form>

            {allRoomsList.filter(r => r.status === 'LOBBY').length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/90">
                <p className="text-xs font-semibold text-[#475569] dark:text-slate-400 mb-2 text-center">
                  Phòng đang mở sảnh chờ (bấm để chọn nhanh mã PIN):
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {allRoomsList.filter(r => r.status === 'LOBBY').map(r => (
                    <button
                      key={r.pin}
                      type="button"
                      onClick={() => {
                        setRoomJoinForm(prev => ({ ...prev, pin: r.pin }));
                        setRoomJoinError('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        roomJoinForm.pin === r.pin
                          ? 'bg-[#EDFFFD] dark:bg-cyan-500/20 border-[#007A7A] dark:border-cyan-400 text-[#007A7A] dark:text-cyan-200'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300 hover:border-[#007A7A]/60 dark:hover:border-cyan-500/50'
                      }`}
                    >
                      <span className="font-mono text-amber-600 dark:text-amber-300">#{r.pin}</span>
                      <span className="truncate max-w-[140px]">{r.name}</span>
                      {r.roomMode === 'friend_vip' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black">
                          VIP
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        <div className="text-center text-xs text-[#475569] dark:text-slate-500 relative z-10">
          Mẹo: Nếu giáo viên mở phòng trong một tab/cửa sổ trình duyệt khác, danh sách người chơi sẽ đồng bộ trực tiếp.
        </div>
      </div>
    );
  }

  // 2. AMONG US DROPSHIP WAITING LOBBY + LAUNCH COUNTDOWN
  if (gameSubState === 'LOBBY' || gameSubState === 'COUNTDOWN') {
    const canHostLaunch = isRoomHost && gameSubState === 'LOBBY' && (isFriendVipRoom ? lobbyPlayersList.length >= 1 : hasStudentsInLobby);
    const isRoomAlreadyPlayingWithoutLaunch = !isRoomHost && room.status === 'PLAYING' && gameSubState === 'LOBBY';
    const manageableRooms = isTeacher
      ? allRoomsList
      : allRoomsList.filter(r => r.hostUsername && r.hostUsername === currentUser?.username);

    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#070b15] text-[#0F172B] dark:text-white flex flex-col select-none relative transition-colors duration-200">
        {/* Top Lobby Header */}
        <header className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLeaveGameLobby}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Rời Sảnh
            </button>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-[#334155] px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#007A7A] dark:bg-[#1EE1D6]" />
              <span className="text-xs font-bold text-[#0F172B] dark:text-slate-200 max-w-[180px] truncate">{room.name}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-[#334155] text-[#475569] dark:text-slate-300">
              <Wifi className={`w-3 h-3 ${serverSyncConnected ? 'text-[#007A7A] dark:text-[#1EE1D6]' : 'text-amber-500'}`} /> {serverSyncConnected ? 'Live' : 'Local'}
            </span>
            {isRoomHost && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-[#334155] px-3 py-1.5 rounded-lg text-xs">
                <span className="text-[#475569] dark:text-slate-300">PIN: <b className="font-mono text-[#0F172B] dark:text-white">{room.pin}</b></span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[#475569] dark:text-slate-300">Pass: <b className="font-mono text-[#007A7A] dark:text-[#1EE1D6]">{room.pass}</b></span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`Mã phòng Game Từ Vựng: ${room.pin} | Mật khẩu: ${room.pass}`);
                    setCopiedRoomPin(true);
                    setTimeout(() => setCopiedRoomPin(false), 1800);
                    showToast(`Đã sao chép PIN ${room.pin} & Pass "${room.pass}"!`);
                  }}
                  className="ml-1 text-slate-500 hover:text-[#007A7A] dark:text-slate-400 dark:hover:text-[#1EE1D6]"
                  title="Sao chép mã PIN & Mật khẩu"
                >
                  {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(room.pin)}
                  className="text-slate-500 hover:text-[#007A7A] dark:text-slate-400 dark:hover:text-[#1EE1D6] pl-1.5 border-l border-slate-200 dark:border-[#334155]"
                  title="Sao chép Link mời tự điền PIN (?pin=...)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="open-arena-game-hub-btn"
              onClick={() => setArenaGameMode('hub')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 text-xs font-extrabold transition inline-flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>🎮 Chọn Game (2 Game)</span>
            </button>
            <button
              type="button"
              data-testid="lobby-switch-to-knight-game-btn"
              onClick={() => setArenaGameMode('knight_rpg')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 text-xs font-black transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>⚔️ Game Hiệp Sĩ Diệt Rồng</span>
            </button>
            {themeToggleButton}
            <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-[#334155] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-[#0F172B] dark:text-slate-200">
              <Users className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> {lobbyPlayersList.length}/{room.maxPlayers}
            </span>
            {isRoomHost && (
              <>
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Tạo Phòng
                </button>
                <button
                  onClick={() => {
                    setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                    setShowVocabModal(true);
                  }}
                  data-testid="lobby-edit-vocab-btn"
                  className="px-3.5 py-1.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" /> Soạn / Sửa Bộ Câu Hỏi ({roomVocabCount})
                </button>
                {isTeacher && (
                  !hasStudentsInLobby ? (
                    <button
                      onClick={() => jumpToGameSandboxRound(1)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition hidden sm:inline-flex items-center gap-1"
                      title="Chỉ khả dụng khi phòng chưa có học sinh"
                    >
                      Chơi Thử GV
                    </button>
                  ) : room.status === 'PLAYING' ? (
                    <button
                      onClick={() => setGameSubState('HOST_SPECTATE')}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition inline-flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Bảng Đua Top
                    </button>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#475569] dark:text-slate-300">
                      <Trophy className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Giám Sát Đua Top
                    </span>
                  )
                )}
              </>
            )}
          </div>
        </header>

        {/* Main Lobby Content Area */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 p-3 sm:p-5 overflow-y-auto bg-[#F8FAFC] dark:bg-[#070b15]">
          <div className="max-w-6xl w-full mx-auto space-y-3">
            {/* HOST INLINE ROOM NAME / PIN / PASSWORD EDITOR */}
            {isRoomHost && (
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-[#334155] rounded-xl p-3.5 space-y-3">
                {manageableRooms.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">Chuyển phòng:</span>
                    {manageableRooms.map(r => (
                      <div key={r.pin} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-300 dark:border-[#334155]">
                        <button
                          type="button"
                          onClick={() => handleTeacherOpenLobby(r.pin)}
                          className={`px-2.5 py-1 text-xs font-semibold transition ${
                            r.pin === activePin
                              ? 'bg-[#007A7A] text-white'
                              : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          #{r.pin} • {r.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(r.pin)}
                          className="px-1.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-600 text-[#475569] dark:text-slate-400 hover:text-white text-xs transition border-l border-slate-300 dark:border-[#334155]"
                          title={`Xóa phòng #${r.pin}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSaveHostRoomSettings} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1">
                      Tên phòng hiển thị
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.name}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên phòng..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-semibold text-[#0F172B] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1">
                      Mã PIN
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.pin}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, pin: e.target.value }))}
                      placeholder="686868"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1">
                      Mật khẩu
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.pass}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, pass: e.target.value }))}
                      placeholder="Mật khẩu..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1">
                      Từ/vòng
                    </label>
                    <select
                      value={hostRoomDraft.roundSize || 4}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, roundSize: Number(e.target.value) }))}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-semibold text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    >
                      {[2, 4, 6, 8, 10, 12, 16, 20, 30, 50, 100, 200].map(num => (
                        <option key={num} value={num}>{num === 200 ? 'Tất cả' : num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1">
                      Tốc độ
                    </label>
                    <select
                      value={hostRoomDraft.speedMode || 'normal'}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, speedMode: e.target.value }))}
                      className="w-full px-1.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-semibold text-[#0F172B] dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                    >
                      <option value="relaxed">Chậm</option>
                      <option value="normal">Chuẩn</option>
                      <option value="turbo">Nhanh</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Lưu Phòng
                    </button>
                  </div>
                  <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
                    {(() => {
                      const roomVocabList = parseRawVocabText(room.rawVocab || DEFAULT_VOCAB_TEXT);
                      const draftSelected = Array.isArray(hostRoomDraft.selectedWords)
                        ? hostRoomDraft.selectedWords
                        : (room.selectedWords || []);
                      const toggleDraftWord = (word) => {
                        setHostRoomDraft(prev => {
                          const cur = Array.isArray(prev.selectedWords) ? prev.selectedWords : (room.selectedWords || []);
                          const next = cur.includes(word) ? cur.filter(w => w !== word) : [...cur, word];
                          return { ...prev, selectedWords: next };
                        });
                      };
                      return (
                        <div className="w-full mb-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setShowLobbyWordPicker(v => !v)}
                              className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] inline-flex items-center gap-1.5 hover:underline"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>
                                {showLobbyWordPicker ? 'Ẩn chọn từ phòng đấu' : 'Chọn từ làm luôn cho phòng'} (
                                {draftSelected.length > 0 ? `Đã chọn ${draftSelected.length}/${roomVocabList.length} từ` : `Ngẫu nhiên ${hostRoomDraft.roundSize || 4} từ/vòng`})
                              </span>
                            </button>
                            {showLobbyWordPicker && (
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setHostRoomDraft(prev => ({ ...prev, selectedWords: roomVocabList.map(i => i.word) }))}
                                  className="font-bold text-teal-700 dark:text-teal-300 hover:underline"
                                >
                                  Chọn hết ({roomVocabList.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHostRoomDraft(prev => ({ ...prev, selectedWords: [] }))}
                                  className="font-bold text-slate-500 hover:underline"
                                >
                                  Dùng theo số lượng
                                </button>
                              </div>
                            )}
                          </div>
                          {showLobbyWordPicker && (
                            <div className="mt-2 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              {roomVocabList.map(item => {
                                const checked = draftSelected.includes(item.word);
                                return (
                                  <button
                                    key={item.word}
                                    type="button"
                                    onClick={() => toggleDraftWord(item.word)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition ${
                                      checked
                                        ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                                    }`}
                                    title={item.prompt}
                                  >
                                    {checked ? <CheckSquare className="w-3 h-3 shrink-0" /> : <Square className="w-3 h-3 shrink-0 opacity-60" />}
                                    <span>{item.word}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-slate-300">
                        <span>Tối đa:</span>
                        <select
                          value={Math.max(2, Math.min(30, Number(hostRoomDraft.maxPlayers || 30)))}
                          onChange={e => {
                            const nextMax = Number(e.target.value) || 30;
                            setHostRoomDraft(prev => {
                              const prevTeam = Number(prev.teamCount || 0);
                              return {
                                ...prev,
                                maxPlayers: nextMax,
                                teamCount: prevTeam > nextMax ? (nextMax >= 2 ? 2 : 0) : prevTeam
                              };
                            });
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-semibold text-[#0F172B] dark:text-slate-200"
                        >
                          {[2, 4, 6, 8, 10, 12, 16, 20, 30].map(n => (
                            <option key={n} value={n}>{n} người</option>
                          ))}
                        </select>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-slate-300">
                        <span>Chia Team:</span>
                        <select
                          value={Number(hostRoomDraft.teamCount || 0)}
                          onChange={e => setHostRoomDraft(prev => ({ ...prev, teamCount: Number(e.target.value) || 0 }))}
                          className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-[#334155] rounded-lg text-xs font-semibold text-[#0F172B] dark:text-slate-200"
                        >
                          <option value={0}>Đấu Đơn (Solo)</option>
                          <option value={2} disabled={Number(hostRoomDraft.maxPlayers || 30) < 2}>2 Team (A vs B)</option>
                          <option value={3} disabled={Number(hostRoomDraft.maxPlayers || 30) < 3}>3 Team (A·B·C)</option>
                          <option value={4} disabled={Number(hostRoomDraft.maxPlayers || 30) < 4}>4 Team (A·B·C·D)</option>
                        </select>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172B] dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(hostRoomDraft.shufflePerPlayer)}
                          onChange={e => setHostRoomDraft(prev => ({ ...prev, shufflePerPlayer: e.target.checked }))}
                          className="w-4 h-4 rounded accent-[#007A7A]"
                        />
                        <span>Đảo thứ tự từ riêng cho từng HS</span>
                      </label>
                    </div>
                    <span className="text-xs font-medium text-[#475569] dark:text-slate-400">
                      {hostRoomDraft.shufflePerPlayer
                        ? 'Chế độ: Đảo riêng thứ tự câu mỗi học sinh'
                        : 'Chế độ: Đua tốc độ cùng bộ câu'}
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 2-Column Stage: Integrated Dropship Crewmates Grid + Persistent Lobby Chat */}
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1">
            {/* Left: Crewmates Deck (with Integrated Header, Large PIN Board & Empty Slots) */}
            <div className="lg:col-span-7 xl:col-span-8 relative rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-slate-900/85 p-4 sm:p-6 min-h-[300px] flex flex-col justify-between gap-4">
              {/* Integrated Dropship Lobby Header & Flat Specs */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#EDFFFD] dark:bg-teal-500/15 border border-[#B5F5F1] dark:border-teal-500/30 flex items-center justify-center text-[#007A7A] dark:text-[#1EE1D6] shrink-0 mt-0.5">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm sm:text-base text-[#0F172B] dark:text-white leading-tight">
                      Khoang Chờ Tàu Vũ Trụ (Dropship Lobby)
                    </h2>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                      {isTeacher
                        ? 'Học sinh nhập Mã PIN & Mật khẩu để vào khoang. Nhấn Bắt Đầu Trận Đấu để tất cả cùng vào game.'
                        : isFriendVipHost
                        ? 'Bạn là Chủ Phòng Bạn Bè - chia sẻ Mã PIN & Pass để bạn bè vào và bấm Bắt Đầu!'
                        : isRoomAlreadyPlayingWithoutLaunch
                        ? 'Lượt chơi trước đang chạy hoặc đã xong - chờ Chủ phòng mở lại sảnh.'
                        : isFriendVipRoom
                        ? 'Bạn đã vào Phòng Bạn Bè! Bấm Sẵn Sàng và chờ Chủ phòng bấm khởi hành.'
                        : 'Bạn đã ở trong Sảnh Chờ! Bấm Sẵn Sàng và chờ Chủ phòng bấm khởi hành.'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 space-y-0.5">
                  <p className="text-xs font-semibold text-[#0F172B] dark:text-slate-200 tabular-nums">
                    {roomVocabCount} từ • {room.roundSize || 4}/vòng • {room.speedMode === 'relaxed' ? 'Chậm' : room.speedMode === 'turbo' ? 'Nhanh' : 'Chuẩn'} • {studentLobbyPlayers.length}/{roomMaxPlayers} người
                  </p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    {readyCount}/{lobbyPlayersList.length} Sẵn sàng • {room.shufflePerPlayer ? 'Đảo từ riêng HS' : 'Thi tốc độ'}
                    {isTeamRoom ? ` • Đấu đội ${room.teamCount} Team` : ''}
                  </p>
                </div>
              </div>

              {isTeamRoom && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeTeamIds.map(tid => {
                      const tMeta = GAME_TEAM_META[tid];
                      const teamMembers = studentLobbyPlayers.filter(
                        p => (activeTeamIds.includes(p.teamId) ? p.teamId : '') === tid || (isFriendVipRoom && p.username === room.hostUsername && p.teamId === tid)
                      );
                      const isMyTeam = myLobbyEntry?.teamId === tid;
                      const canSwitchToTeam = Boolean(
                        myLobbyEntry && (isFriendVipRoom || myLobbyEntry.role !== 'teacher')
                      );
                      return (
                        <button
                          key={tid}
                          type="button"
                          disabled={!canSwitchToTeam}
                          onClick={() => canSwitchToTeam && handleSetPlayerTeam?.(activePin, currentUser.username, tid)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                            isMyTeam
                              ? `${tMeta.badgeCls} ring-2 ring-[#007A7A]/60`
                              : tMeta.pillCls
                          } ${canSwitchToTeam ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                          title={canSwitchToTeam ? `Bấm để đổi sang ${tMeta.name}` : tMeta.name}
                        >
                          <span>{tMeta.dot}</span>
                          <span>{tMeta.short}: {teamMembers.length}</span>
                        </button>
                      );
                    })}
                  </div>
                  {isRoomHost && (
                    <button
                      type="button"
                      onClick={() => handleShuffleRoomTeams?.(activePin)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 flex items-center gap-1 transition"
                    >
                      <Shuffle className="w-3 h-3 text-[#007A7A] dark:text-[#1EE1D6]" /> Chia Team Cân Bằng
                    </button>
                  )}
                </div>
              )}

              {/* Central Large PIN & Password Invitation Board when room has 0-4 players */}
              {lobbyPlayersList.length <= 4 && (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#334155] bg-white/80 dark:bg-slate-950/60 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                        Mã PIN Vào Phòng
                      </p>
                      <p className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-[#0F172B] dark:text-white leading-tight">
                        {room.pin}
                      </p>
                    </div>
                    {isRoomHost && (
                      <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                          Mật Khẩu Phòng
                        </p>
                        <p className="text-lg sm:text-2xl font-mono font-bold text-[#007A7A] dark:text-[#1EE1D6] leading-tight">
                          {room.pass || 'Không cần'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isRoomHost && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(`Mã phòng Game Từ Vựng: ${room.pin} | Mật khẩu: ${room.pass}`);
                          setCopiedRoomPin(true);
                          setTimeout(() => setCopiedRoomPin(false), 1800);
                          showToast(`Đã sao chép PIN ${room.pin} & Pass "${room.pass}"!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition inline-flex items-center gap-1.5"
                      >
                        {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Chép PIN &amp; Pass</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(room.pin)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 transition inline-flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Chép Link Mời
                    </button>
                  </div>
                </div>
              )}

              {/* Crewmates Stage: Kahoot-Style Player Wall for Solo vs 2 / 3 / 4 Team Columns */}
              {(() => {
                const renderLobbyPlayerUnit = (player, idx, compactKahoot = false) => {
                  const isHost = player.role === 'teacher' || (isFriendVipRoom && player.username === room.hostUsername);
                  const isSelf = player.username === currentUser?.username;
                  const showBubble = Boolean(player.chat && player.chatAt && Math.abs(lobbyNowTick - player.chatAt) < 5500);
                  const participatesInTeam = isTeamRoom && (isFriendVipRoom || player.role !== 'teacher');
                  const playerTeamId = participatesInTeam
                    ? activeTeamIds.includes(player.teamId)
                      ? player.teamId
                      : activeTeamIds[idx % activeTeamIds.length]
                    : '';
                  const playerTeamMeta = playerTeamId ? GAME_TEAM_META[playerTeamId] : null;
                  const nextTeamId = playerTeamId
                    ? activeTeamIds[(activeTeamIds.indexOf(playerTeamId) + 1) % activeTeamIds.length]
                    : '';
                  const canCycleTeam = Boolean(participatesInTeam && (isRoomHost || isSelf));
                  const pTitle = resolveVisibleTitleBadge(usersDb[player.username] || player, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb });

                  if (compactKahoot) {
                    return (
                      <div
                        key={player.username}
                        className={`relative group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition ${
                          isSelf
                            ? 'bg-[#EDFFFD] dark:bg-teal-500/15 border-[#007A7A] dark:border-[#1EE1D6]/60'
                            : 'bg-[#F8FAFC] dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        {showBubble && (
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg max-w-[170px] truncate border border-slate-200">
                            {player.chat}
                          </div>
                        )}

                        {isRoomHost && !isHost && (
                          <button
                            type="button"
                            onClick={() => handleKickLobbyPlayer(activePin, player.username, player.name)}
                            className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
                            title={`Mời ${player.name} rời sảnh`}
                          >
                            <UserMinus className="w-3 h-3" />
                          </button>
                        )}

                        <AnimalPilotAvatar
                          animalId={player.animalId || 'cat'}
                          accessoryId={player.accessoryId || 'none'}
                          colorId={player.colorId || 'cyan'}
                          avatarUrl={player.avatarUrl || usersDb[player.username]?.avatarUrl || ''}
                          size={46}
                          flip={idx % 2 === 1}
                          animate={true}
                          onShip={false}
                        />

                        <div className="min-w-0 text-left space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectedLobbyUsername(player.username)}
                              className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white hover:text-[#007A7A] dark:hover:text-[#1EE1D6] flex items-center gap-1.5 cursor-pointer"
                              title={`Xem nhanh hồ sơ ${player.name}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${player.ready || isHost ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                              <span className="truncate max-w-[140px]">
                                <VipMemberName user={usersDb[player.username] || player} fallbackName={player.name} badgeSize="xs" />
                              </span>
                            </button>
                            {isHost ? (
                              <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-extrabold inline-flex items-center gap-1">
                                <Crown className="w-3 h-3" /> {isFriendVipRoom ? 'Chủ Phòng VIP' : 'Chủ Phòng'}
                              </span>
                            ) : (
                              <span className={`text-xs font-bold ${player.approved || player.ready || isFriendVipRoom ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {isFriendVipRoom
                                  ? (player.ready ? '✓ Sẵn sàng' : '✓ Đã vào')
                                  : (player.approved ? '✓ GV Đã Duyệt' : player.ready ? 'Chờ GV duyệt' : 'Chờ duyệt')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pTitle && (
                              <span className={`text-xs font-extrabold px-2 py-0.2 rounded-full border ${pTitle.gameBadgeClass}`}>
                                {pTitle.icon} {pTitle.label}
                              </span>
                            )}
                            {!isHost && isTeacher && !isFriendVipRoom && (
                              <button
                                type="button"
                                onClick={() => handleTeacherApproveLobbyPlayer?.(activePin, player.username, false)}
                                className={`px-2 py-0.5 rounded-md text-xs font-extrabold border transition ${
                                  player.approved
                                    ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                    : 'bg-white dark:bg-slate-900 hover:bg-[#007A7A] text-[#0F172B] dark:text-slate-200 hover:text-white border-slate-300 dark:border-[#334155]'
                                }`}
                              >
                                {player.approved ? '✓ Đã duyệt' : '+ Duyệt vào thi'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={player.username} className="flex flex-col items-center relative group">
                      {showBubble && (
                        <div className="absolute -top-10 z-20 bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg max-w-[150px] truncate border border-slate-200 dark:border-slate-200">
                          {player.chat}
                        </div>
                      )}

                      {isRoomHost && !isHost && (
                        <button
                          type="button"
                          onClick={() => handleKickLobbyPlayer(activePin, player.username, player.name)}
                          className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
                          title={`Mời ${player.name} rời sảnh`}
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      )}

                      {isHost ? (
                        <div className="mb-0.5 text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider">
                          <Crown className="w-3.5 h-3.5" /> {isFriendVipRoom ? 'Chủ Phòng VIP' : 'Chủ Phòng'}
                        </div>
                      ) : (
                        <div className="mb-0.5 flex flex-col items-center gap-0.5">
                          <div className={`text-xs font-bold uppercase tracking-wider ${player.approved || player.ready || isFriendVipRoom ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {isFriendVipRoom
                              ? (player.ready ? '✓ Sẵn sàng' : '✓ Bạn bè đã vào')
                              : (player.approved ? '✓ GV Đã Duyệt' : player.ready ? 'Sẵn sàng (Chờ GV duyệt)' : 'Chờ GV duyệt')}
                          </div>
                          {isTeacher && !isFriendVipRoom && (
                            <button
                              type="button"
                              onClick={() => handleTeacherApproveLobbyPlayer?.(activePin, player.username, false)}
                              className={`px-2 py-0.5 rounded-md text-xs font-extrabold border transition ${
                                player.approved
                                  ? 'bg-[#007A7A] text-white border-[#007A7A]'
                                  : 'bg-white dark:bg-slate-800 hover:bg-[#007A7A] text-[#0F172B] dark:text-slate-200 hover:text-white border-slate-300 dark:border-[#334155]'
                              }`}
                            >
                              {player.approved ? '✓ Đã duyệt' : '+ Duyệt vào thi'}
                            </button>
                          )}
                        </div>
                      )}

                      <AnimalPilotAvatar
                        animalId={player.animalId || 'cat'}
                        accessoryId={player.accessoryId || 'none'}
                        colorId={player.colorId || 'cyan'}
                        avatarUrl={player.avatarUrl || usersDb[player.username]?.avatarUrl || ''}
                        size={54}
                        flip={idx % 2 === 1}
                        animate={true}
                        onShip={false}
                      />

                      <div className="w-11 h-2 bg-slate-900/20 dark:bg-black/50 rounded-full blur-[2px] -mt-1 mb-2" />

                      <button
                        type="button"
                        onClick={() => setInspectedLobbyUsername(player.username)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition hover:scale-105 cursor-pointer ${
                          isSelf
                            ? 'bg-[#EDFFFD] dark:bg-teal-500/20 border-[#007A7A]/60 dark:border-[#1EE1D6]/50 text-[#007A7A] dark:text-[#1EE1D6]'
                            : 'bg-white/95 dark:bg-slate-800/90 border-slate-300 dark:border-[#334155] text-[#0F172B] dark:text-slate-200 hover:border-[#007A7A]'
                        }`}
                        title={`Xem nhanh hồ sơ ${player.name}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${player.ready || isHost ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className="truncate max-w-[130px]">
                          <VipMemberName user={usersDb[player.username] || player} fallbackName={player.name} badgeSize="xs" />
                        </span>
                      </button>
                      {pTitle && (
                        <span className={`mt-0.5 text-xs font-extrabold px-2 py-0.5 rounded-full border ${pTitle.gameBadgeClass}`}>
                          {pTitle.icon} {pTitle.label}
                        </span>
                      )}
                      {playerTeamMeta && (
                        <button
                          type="button"
                          disabled={!canCycleTeam}
                          onClick={() => canCycleTeam && handleSetPlayerTeam?.(activePin, player.username, nextTeamId)}
                          className={`mt-1 text-xs font-extrabold px-2 py-0.5 rounded-full border transition ${playerTeamMeta.badgeCls} ${
                            canCycleTeam ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                          }`}
                          title={canCycleTeam ? `Bấm để chuyển sang ${GAME_TEAM_META[nextTeamId]?.name}` : playerTeamMeta.name}
                        >
                          {playerTeamMeta.dot} {playerTeamMeta.short}{canCycleTeam ? ' ↻' : ''}
                        </button>
                      )}
                    </div>
                  );
                };

                if (!isTeamRoom) {
                  return (
                    <div className="space-y-4 my-auto pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                          <span>Sảnh Đấu Đơn (Kahoot Live) · {lobbyPlayersList.length} người đã vào</span>
                        </span>
                        <span className="font-semibold text-[#475569] dark:text-slate-300">
                          {studentLobbyPlayers.length === 0
                            ? `Đang chờ học viên nhập PIN #${room.pin}...`
                            : `${readyCount}/${lobbyPlayersList.length} người đã sẵn sàng`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 min-h-[130px] py-2">
                        {lobbyPlayersList.map((player, idx) => renderLobbyPlayerUnit(player, idx, true))}
                      </div>
                    </div>
                  );
                }

                const refereeTeachers = !isFriendVipRoom
                  ? lobbyPlayersList.filter(p => p.role === 'teacher')
                  : [];
                const teamCombatants = !isFriendVipRoom
                  ? lobbyPlayersList.filter(p => p.role !== 'teacher')
                  : lobbyPlayersList;
                const teamGridColsCls =
                  activeTeamIds.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : activeTeamIds.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
                const canSwitchMyTeam = Boolean(
                  myLobbyEntry && (isFriendVipRoom || myLobbyEntry.role !== 'teacher')
                );

                return (
                  <div className="space-y-3 my-auto pt-1">
                    {refereeTeachers.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold text-[#475569] dark:text-slate-300 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Chủ Phòng / Trọng Tài:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {refereeTeachers.map((tPlayer, tIdx) => renderLobbyPlayerUnit(tPlayer, tIdx, true))}
                        </div>
                      </div>
                    )}

                    <div className={`grid ${teamGridColsCls} gap-3.5 items-stretch`}>
                      {activeTeamIds.map(tid => {
                        const tMeta = GAME_TEAM_META[tid];
                        const membersOfTeam = teamCombatants.filter((p, idx) => {
                          const assigned = activeTeamIds.includes(p.teamId)
                            ? p.teamId
                            : activeTeamIds[idx % activeTeamIds.length];
                          return assigned === tid;
                        });
                        const isMyTeam = canSwitchMyTeam && myLobbyEntry?.teamId === tid;

                        return (
                          <div
                            key={tid}
                            className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 min-h-[210px] ${tMeta.cardCls}`}
                          >
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span>{tMeta.dot}</span>
                                <span className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white truncate">
                                  {tMeta.name}
                                </span>
                                <span className="px-2 py-0.2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs font-extrabold tabular-nums">
                                  {membersOfTeam.length}
                                </span>
                              </div>
                              {canSwitchMyTeam && (
                                <button
                                  type="button"
                                  disabled={isMyTeam}
                                  onClick={() => !isMyTeam && handleSetPlayerTeam?.(activePin, currentUser.username, tid)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition shrink-0 ${
                                    isMyTeam
                                      ? `${tMeta.badgeCls} cursor-default`
                                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172B] dark:text-slate-200 border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  {isMyTeam ? '✓ Đội bạn' : `+ Vào ${tMeta.short}`}
                                </button>
                              )}
                            </div>

                            {membersOfTeam.length === 0 ? (
                              <div className="my-auto py-5 rounded-xl border border-dashed border-slate-300/85 dark:border-slate-700/75 bg-white/45 dark:bg-slate-950/35 flex flex-col items-center justify-center gap-1 text-center px-3">
                                <Users className="w-4 h-4 text-[#475569] dark:text-slate-400" />
                                <span className="text-xs font-bold text-[#475569] dark:text-slate-300">
                                  Vị trí trống {tMeta.short}
                                </span>
                                <span className="text-xs text-[#475569] dark:text-slate-400">
                                  Chờ thành viên vào đội
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-start justify-center gap-3 my-auto py-1">
                                {membersOfTeam.map((player, mIdx) => renderLobbyPlayerUnit(player, mIdx, false))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right: Persistent Live Lobby Chat Box */}
            {renderLobbyChatPanel('h-[270px] lg:h-[360px]', 'Chat Phòng Chờ')}
          </div>

          {/* Bottom Controls Bar (Animal Pilot Customize + Ready / Host Launch) */}
          <div className="max-w-6xl w-full mx-auto space-y-2">
            {showPilotDrawer && (
              <div className="bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-[#334155] rounded-xl p-4 shadow-lg backdrop-blur-md">
                {renderPilotCustomizer(true)}
              </div>
            )}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-[#334155] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] flex-wrap justify-center">
                <AnimalPilotAvatar
                  animalId={activeAnimalId}
                  accessoryId={activeAccessoryId}
                  colorId={activeCrewColorId}
                  avatarUrl={myAvatarUrl}
                  size={36}
                  animate={false}
                  onShip={true}
                />
                <div className="text-left">
                  <p className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1.5">
                    <span>{activeAnimalObj.label}</span>
                    <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                      {activeAccessoryObj.icon} {activeAccessoryObj.label}
                    </span>
                  </p>
                  <p className="text-xs text-[#007A7A] dark:text-[#1EE1D6] font-medium">Lái phi thuyền cả 4 vòng (V1–V4)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPilotDrawer(v => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    showPilotDrawer
                      ? 'bg-[#007A7A] text-white border-[#007A7A]'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 border-slate-300 dark:border-[#334155]'
                  }`}
                >
                  {showPilotDrawer ? 'Thu Gọn' : 'Đổi Thú & Phụ Kiện'}
                </button>
              </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-center shrink-0">
              {!isRoomHost ? (
                <button
                  type="button"
                  onClick={handleToggleLobbyReady}
                  className={`px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
                    myLobbyEntry?.ready
                      ? 'bg-white dark:bg-slate-800 border border-[#007A7A] text-[#007A7A] dark:text-[#1EE1D6]'
                      : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isFriendVipRoom
                    ? (myLobbyEntry?.ready ? 'Đã Sẵn Sàng - Chờ Chủ Phòng' : 'Bấm Sẵn Sàng Đua Cùng Bạn')
                    : (myLobbyEntry?.approved
                      ? 'GV Đã Duyệt - Chờ Khởi Hành!'
                      : myLobbyEntry?.ready
                      ? 'Đã Sẵn Sàng (Chờ GV Duyệt)'
                      : 'Xin Duyệt & Sẵn Sàng')}
                </button>
              ) : (
                <>
                  {!isFriendVipRoom && hasStudentsInLobby && (
                    <button
                      type="button"
                      onClick={() => handleTeacherApproveLobbyPlayer?.(activePin, '', true)}
                      className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-[#0F172B] dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Duyệt Tất Cả HS
                    </button>
                  )}
                  {room.status === 'PLAYING' && (
                    <button
                      type="button"
                      onClick={() => handleTeacherResetLobby(activePin)}
                      className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-[#334155] text-xs font-semibold text-[#0F172B] dark:text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" /> Mở Lại Sảnh (Cho Bạn Vào)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTeacherStartLobbyGame(activePin)}
                    disabled={!canHostLaunch}
                    title={canHostLaunch ? 'Khởi động trận đấu Đua Top ngay' : 'Cần ít nhất 1 thành viên vào sảnh mới có thể bắt đầu'}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
                      canHostLaunch
                        ? 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    {isFriendVipRoom
                      ? `BẮT ĐẦU ĐUA CÙNG BẠN (${lobbyPlayersList.length} người)`
                      : hasStudentsInLobby
                      ? `BẮT ĐẦU ĐUA TOP (${studentLobbyPlayers.length} HS)`
                      : 'CHỜ HỌC SINH VÀO SẢNH (0 HS)'}
                  </button>
                </>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Non-disruptive Quick Profile Card in Lobby */}
        {inspectedLobbyUsername && (() => {
          const member = usersDb[inspectedLobbyUsername] || room.lobbyPlayers?.[inspectedLobbyUsername];
          if (!member) return null;
          const isMemberTeacher = member.role === 'teacher';
          const memberAttempts = attempts.filter(a => a.studentId === inspectedLobbyUsername);
          const memberBands = memberAttempts.map(a => a.overallBand).filter(b => typeof b === 'number');
          const memberBest = memberBands.length > 0 ? Math.max(...memberBands) : null;
          const memberGameRec = room.players?.[member.name] || room.players?.[inspectedLobbyUsername];
          const memberVip = resolveUserVipNameVisual(member);
          return (
            <div
              className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
              onClick={() => setInspectedLobbyUsername(null)}
            >
              <div
                className={`rounded-3xl max-w-sm w-full p-5 text-[#0F172B] dark:text-white shadow-2xl space-y-4 ${
                  memberVip.showNeonCover
                    ? `bg-white dark:bg-slate-900 border ${memberVip.neonCoverMeta.cardAccentClass}`
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatarBadge user={member} sizeClass="w-12 h-12" textClass="text-lg" rounded="rounded-2xl" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm text-[#0F172B] dark:text-white truncate">
                          <VipMemberName user={member} fallbackName={member.name || inspectedLobbyUsername} badgeSize="xs" />
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          isMemberTeacher
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/40'
                            : 'bg-[#EDFFFD] dark:bg-cyan-500/20 text-[#007A7A] dark:text-cyan-300 border-[#B5F5F1] dark:border-cyan-400/40'
                        }`}>
                          {isMemberTeacher ? 'Giáo viên' : 'Học viên'}
                        </span>
                        {(() => {
                          const mTitle = resolveVisibleTitleBadge(member, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb });
                          if (!mTitle || mTitle.isRoleBuiltIn) return null;
                          return (
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${mTitle.gameBadgeClass}`}>
                              {mTitle.icon} {mTitle.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs font-mono text-[#475569] dark:text-slate-400 mt-0.5">@{inspectedLobbyUsername}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedLobbyUsername(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {member.studyGoal && (
                  <p className="text-xs text-[#007A7A] dark:text-cyan-200 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                    🎯 {member.studyGoal}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                    <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <Target className="w-3 h-3 text-amber-500 dark:text-amber-400" /> {isMemberTeacher ? 'Vai trò' : 'Target'}
                    </p>
                    <p className="font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                      {isMemberTeacher ? 'GV IELTS' : `Band ${member.targetBand || '7.5'}`}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                    <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {isMemberTeacher ? 'Đề thi' : 'Best Band'}
                    </p>
                    <p className="font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {isMemberTeacher ? 'Quản trị' : memberBest !== null ? memberBest : '-'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                    <p className="text-xs text-[#475569] dark:text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <Trophy className="w-3 h-3 text-pink-500 dark:text-pink-400" /> Game
                    </p>
                    <p className="font-extrabold text-pink-600 dark:text-pink-300 mt-0.5 font-mono">
                      {memberGameRec ? `${memberGameRec.score}đ` : '0đ'}
                    </p>
                  </div>
                </div>

                {openMemberProfile && usersDb[inspectedLobbyUsername] && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetUname = inspectedLobbyUsername;
                      setInspectedLobbyUsername(null);
                      openMemberProfile(targetUname, 'GAME_ARENA');
                    }}
                    className="w-full py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-extrabold transition"
                  >
                    Mở Trang Hồ Sơ Đầy Đủ →
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Synchronized 3-2-1 Rocket Launch Countdown Overlay */}
        {gameSubState === 'COUNTDOWN' && (
          <div className="absolute inset-0 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#007A7A] dark:text-cyan-400 mb-3">
              Tất cả phi hành gia chuẩn bị
            </p>
            <div className="text-7xl sm:text-8xl font-black text-[#0F172B] dark:text-white font-mono transition-transform duration-300 animate-pulse">
              {lobbyCountdown ?? 1}
            </div>
            <p className="text-sm text-[#475569] dark:text-slate-300 mt-4 font-semibold">
              {isTeacher ? 'Đang mở Bảng Xếp Hạng Đua Top Trực Tiếp...' : 'Đang khởi động Đấu Trường Từ Vựng 4 Vòng...'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 2B. TEACHER HOST LIVE "ĐUA TOP" SPECTATE LEADERBOARD (No Teacher Gameplay When Students Exist)
  if (gameSubState === 'HOST_SPECTATE' && isTeacher) {
    const mergedMap = {};
    studentLobbyPlayers.forEach(lp => {
      mergedMap[lp.username] = {
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
        progressText: 'Đang vào trận...',
        finished: false,
        outcome: null
      };
    });
    Object.values(room.liveMatch || {}).forEach(lm => {
      if (!lm?.username || lm.role === 'teacher') return;
      mergedMap[lm.username] = {
        ...(mergedMap[lm.username] || {}),
        ...lm,
        teamId: lm.teamId || mergedMap[lm.username]?.teamId || '',
        avatarUrl: lm.avatarUrl || mergedMap[lm.username]?.avatarUrl || usersDb[lm.username]?.avatarUrl || ''
      };
    });

    const rankedPlayers = Object.values(mergedMap).sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
      if ((b.lives ?? 3) !== (a.lives ?? 3)) return (b.lives ?? 3) - (a.lives ?? 3);
      return (a.name || a.username).localeCompare(b.name || b.username);
    });

    const rankIndexMap = {};
    rankedPlayers.forEach((p, idx) => {
      rankIndexMap[p.username] = idx;
    });
    const stableDomPlayers = [...rankedPlayers].sort((a, b) => a.username.localeCompare(b.username));
    const finishedCount = rankedPlayers.filter(p => p.finished).length;
    const leaderScore = Math.max(150, rankedPlayers[0]?.score || 0);
    const ROW_STRIDE = 88;
    const podiumOrder = rankedPlayers.length >= 2 ? [1, 0, 2] : [0];
    const missedFreqMap = {};
    rankedPlayers.forEach(p => {
      (p.missed || []).forEach(wordStr => {
        const w = String(wordStr || '').trim().toUpperCase();
        if (w) missedFreqMap[w] = (missedFreqMap[w] || 0) + 1;
      });
    });
    const topMissedWords = Object.entries(missedFreqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return (
      <div className="min-h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#060914] text-[#0F172B] dark:text-white flex flex-col select-none relative overflow-x-hidden transition-colors duration-200">
        <div className="absolute top-[-10%] left-[15%] w-96 h-96 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-teal-400/15 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Host Spectate Header */}
        <header className="shrink-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exitGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" /> Thoát Ra Bảng Tin
            </button>
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-400/40 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-extrabold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Đua Top Trực Tiếp</span>
            </div>
            <span className="text-xs font-bold text-[#334155] dark:text-slate-300 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              PIN: <b className="font-mono text-[#007A7A] dark:text-cyan-300">{room.pin}</b> • {room.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="open-arena-game-hub-btn"
              onClick={() => setArenaGameMode('hub')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 text-xs font-extrabold transition inline-flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>🎮 Chọn Game (2 Game)</span>
            </button>
            <button
              type="button"
              data-testid="lobby-switch-to-knight-game-btn"
              onClick={() => setArenaGameMode('knight_rpg')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 text-xs font-black transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>⚔️ Game Hiệp Sĩ Diệt Rồng</span>
            </button>
            {themeToggleButton}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
              serverSyncConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
            }`}>
              <Wifi className="w-3.5 h-3.5" /> {serverSyncConnected ? 'Live Sync' : 'Local'}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#007A7A] dark:text-cyan-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {finishedCount}/{rankedPlayers.length} Đã xong
            </span>
            {room.status !== 'ENDED' && (
              <button
                type="button"
                onClick={() => handleFinishRoomMatch(activePin)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow"
              >
                <Trophy className="w-3.5 h-3.5" /> Chốt BXH & Kết Thúc
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                handleTeacherResetLobby(activePin);
                setGameSubState('LOBBY');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-teal-900/15 dark:shadow-indigo-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mở Sảnh Ván Mới
            </button>
          </div>
        </header>

        {/* Main Spectate Race Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
          {/* Left 8 Cols: Live Top-3 Podium + Animated Rank Tracks */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Live Team Standings (When Room Uses Teams) */}
            {isTeamRoom && (() => {
              const spectateTeamStandings = computeRoomTeamStandings(room);
              if (spectateTeamStandings.length === 0) return null;
              return (
                <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Bảng Đua Điểm Theo Đội ({room.teamCount} Team)
                    </h2>
                    <span className="text-xs text-[#475569] dark:text-slate-400">Tổng điểm thành viên cùng team</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                    {spectateTeamStandings.map((team, tIdx) => (
                      <div key={team.teamId} className={`rounded-2xl border p-3 ${team.meta.cardCls}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-black text-[#0F172B] dark:text-white flex items-center gap-1.5">
                            <span>#{tIdx + 1}</span>
                            <span>{team.meta.dot} {team.meta.name}</span>
                          </span>
                          <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-300 tabular-nums">
                            {team.totalScore}đ
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-300 truncate">
                          {team.members.length} thành viên{team.members.length > 0 ? `: ${team.members.map(m => m.name).join(', ')}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Top 3 Live Podium */}
            {rankedPlayers.length > 0 && (
              <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4" /> Top 3 Dẫn Đầu Hiện Tại
                  </h2>
                  <span className="text-xs text-[#475569] dark:text-slate-400">Giáo viên chỉ giám sát • Tự động cập nhật</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {podiumOrder.map((rankIdx) => {
                    const p = rankedPlayers[rankIdx];
                    if (!p) return null;
                    const isFirst = rankIdx === 0;
                    const medalStyles =
                      rankIdx === 0
                        ? 'bg-gradient-to-b from-amber-100 to-white dark:from-amber-500/25 dark:to-slate-900/90 border-amber-400/70 dark:border-amber-400/60 sm:py-5 shadow-lg shadow-amber-500/10'
                        : rankIdx === 1
                        ? 'bg-gradient-to-b from-slate-100 to-white dark:from-slate-400/15 dark:to-slate-900/90 border-slate-300 dark:border-slate-400/40'
                        : 'bg-gradient-to-b from-orange-100 to-white dark:from-orange-500/15 dark:to-slate-900/90 border-orange-300 dark:border-orange-500/40';
                    const rankLabel = rankIdx === 0 ? 'HẠNG #1' : rankIdx === 1 ? 'HẠNG #2' : 'HẠNG #3';

                    return (
                      <div key={`pod-${p.username}`} className={`rounded-2xl border p-3.5 flex flex-col items-center text-center transition-all duration-300 ${medalStyles}`}>
                        <span className={`text-xs font-black tracking-widest px-2.5 py-0.5 rounded-full mb-2 ${
                          isFirst ? 'bg-amber-400 text-slate-950' : 'bg-white dark:bg-slate-800 text-[#0F172B] dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {rankLabel}
                        </span>
                        <AnimalPilotAvatar
                          animalId={p.animalId || 'cat'}
                          accessoryId={p.accessoryId || 'none'}
                          colorId={p.colorId || 'cyan'}
                          avatarUrl={p.avatarUrl}
                          size={isFirst ? 52 : 42}
                          animate={!p.finished && (p.lives ?? 3) > 0}
                          onShip={true}
                        />
                        <p className="font-extrabold text-sm text-[#0F172B] dark:text-white mt-1.5 truncate max-w-full">
                          <VipMemberName user={usersDb[p.username] || p} fallbackName={p.name} badgeSize="xs" />
                        </p>
                        {(() => {
                          const podTitle = resolveVisibleTitleBadge(usersDb[p.username] || p, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb });
                          if (!podTitle) return null;
                          return (
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border mt-0.5 ${podTitle.gameBadgeClass}`}>
                              {podTitle.icon} {podTitle.label}
                            </span>
                          );
                        })()}
                        <p className="font-mono text-lg font-black text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">{p.score || 0}đ</p>
                        <p className="text-xs text-[#475569] dark:text-slate-400 truncate max-w-full mt-0.5">{p.progressText || 'Đang đua'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Smoothly Animated Live Leaderboard Tracks */}
            <div className="bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex-1">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#007A7A] dark:text-cyan-400" /> Bảng Xếp Hạng Biến Động Thời Gian Thực
                </h3>
                <span className="text-xs font-semibold text-[#475569] dark:text-slate-400">
                  {rankedPlayers.length} thí sinh
                </span>
              </div>

              {rankedPlayers.length === 0 ? (
                <div className="py-12 text-center text-[#475569] dark:text-slate-400 text-sm">
                  Chưa có học sinh nào tham gia phòng này. Nhấn <b>Mở Sảnh Ván Mới</b> để học sinh vào phòng!
                </div>
              ) : (
                <div className="relative" style={{ height: `${rankedPlayers.length * ROW_STRIDE}px` }}>
                  {stableDomPlayers.map((p) => {
                    const rankIdx = rankIndexMap[p.username] ?? 0;
                    const delta = liveRankDeltas[p.username] || 0;
                    const livesLeft = Math.max(0, Math.min(3, p.lives ?? 3));
                    const barPct = Math.max(6, Math.min(100, Math.round(((p.score || 0) / leaderScore) * 100)));
                    const rowBorder =
                      rankIdx === 0
                        ? 'border-amber-400/70 dark:border-amber-400/60 bg-amber-50/90 dark:bg-amber-500/10'
                        : rankIdx === 1
                        ? 'border-slate-300 dark:border-slate-500/60 bg-white dark:bg-slate-800/80'
                        : rankIdx === 2
                        ? 'border-orange-300 dark:border-orange-500/50 bg-orange-50/80 dark:bg-orange-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/75';

                    return (
                      <div
                        key={p.username}
                        style={{ transform: `translateY(${rankIdx * ROW_STRIDE}px)` }}
                        className={`absolute inset-x-0 top-0 h-[78px] px-3.5 rounded-2xl border ${rowBorder} flex items-center gap-3 transition-transform duration-500 ease-out shadow-md`}
                      >
                        {/* Rank Number + Delta Badge */}
                        <div className="w-12 shrink-0 flex flex-col items-center justify-center">
                          <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center tabular-nums ${
                            rankIdx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : rankIdx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : rankIdx === 2
                              ? 'bg-orange-400 text-slate-950'
                              : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172B] dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            #{rankIdx + 1}
                          </span>
                          {delta !== 0 && (
                            <span className={`mt-0.5 text-xs font-extrabold inline-flex items-center gap-0.5 ${
                              delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>

                        {/* Animal Pilot Spaceship Character */}
                        <div className="shrink-0">
                          <AnimalPilotAvatar
                            animalId={p.animalId || 'cat'}
                            accessoryId={p.accessoryId || 'none'}
                            colorId={p.colorId || 'cyan'}
                            avatarUrl={p.avatarUrl}
                            size={40}
                            animate={!p.finished && livesLeft > 0}
                            onShip={true}
                          />
                        </div>

                        {/* Name, Progress Bar, Hearts & Combo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#0F172B] dark:text-white truncate max-w-[190px] sm:max-w-[260px]">
                              <VipMemberName user={usersDb[p.username] || p} fallbackName={p.name} badgeSize="xs" />
                            </span>
                            {(() => {
                              const rowTitle = resolveVisibleTitleBadge(usersDb[p.username] || p, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb });
                              if (!rowTitle) return null;
                              return (
                                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${rowTitle.gameBadgeClass}`}>
                                  {rowTitle.icon} {rowTitle.label}
                                </span>
                              );
                            })()}
                            {(p.fastestWinsCount || 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                                ⚡ {p.fastestWinsCount}x #1
                              </span>
                            )}
                            {p.finished ? (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                p.outcome === 'VICTORY'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40'
                                  : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                              }`}>
                                {p.outcome === 'VICTORY' ? 'Hoàn thành!' : 'Hết mạng'}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-cyan-500/15 text-[#007A7A] dark:text-cyan-300 border border-[#B5F5F1] dark:border-cyan-500/30 truncate max-w-[145px]">
                                {p.progressText || `Vòng ${p.round || 1}/3`}
                              </span>
                            )}
                            {(p.streak || 0) > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                                <Zap className="w-3 h-3" /> x{p.streak}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  rankIdx === 0
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                    : p.finished && p.outcome === 'LOST'
                                    ? 'bg-rose-500'
                                    : 'bg-gradient-to-r from-[#007A7A] to-teal-500 dark:from-cyan-500 dark:to-indigo-500'
                                }`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0" title={`Còn ${livesLeft}/3 mạng`}>
                              {[0, 1, 2].map(i => (
                                <Heart
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < livesLeft ? 'text-rose-500 fill-rose-500' : 'text-slate-300 dark:text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Live Score */}
                        <div className="text-right shrink-0 pl-2">
                          <p className={`font-mono text-lg sm:text-xl font-black tabular-nums ${
                            rankIdx === 0 ? 'text-amber-600 dark:text-amber-300' : 'text-[#007A7A] dark:text-cyan-300'
                          }`}>
                            {p.score || 0}<span className="text-xs font-bold ml-0.5">đ</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Classroom Most-Missed Words Analytics for Live Review */}
            {topMissedWords.length > 0 && (
              <div className="bg-white/95 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Từ Cả Lớp Hay Sai Nhất (Bấm Để Đọc Mẫu)
                  </h3>
                  <span className="text-xs text-[#475569] dark:text-slate-400">Phục vụ ôn tập ngay sau trận</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topMissedWords.map(([wordStr, errCount]) => (
                    <button
                      key={wordStr}
                      type="button"
                      onClick={() => speakWord(wordStr)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/40 text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#007A7A] dark:text-cyan-300" />
                      <span className="font-mono">{wordStr}</span>
                      <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-md">{errCount} lượt sai</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 4 Cols: Live Lobby Chat during Match */}
          {renderLobbyChatPanel('h-[340px] lg:h-[520px]', 'Chat Trực Tiếp')}
        </div>
      </div>
    );
  }

  const passedWordsCount = gameReviewLog.filter(i => i.passed).length;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172B] dark:text-white flex flex-col select-none transition-colors duration-200">
      {/* Game Navigation Header */}
      <header className="shrink-0 bg-white/95 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2 z-30">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={exitGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold text-[#0F172B] dark:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Thoát Game
          </button>
          {isPracticeGameSession ? (
            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full font-bold">
              Tự Luyện: {practiceTopicMeta?.topicLabel || 'IELTS Core'}
            </span>
          ) : (
            <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 px-2.5 py-1 rounded-full font-bold">
              Phòng: {activePin}
            </span>
          )}
          <span className="hidden sm:inline-flex bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
            {currentUser?.name || currentUser?.username}
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 bg-[#EDFFFD] dark:bg-cyan-500/15 text-[#007A7A] dark:text-cyan-200 border border-[#B5F5F1] dark:border-cyan-500/35 px-2.5 py-0.5 rounded-full font-bold">
            <AnimalPilotAvatar
              animalId={myAnimalId}
              accessoryId={myAccessoryId}
              colorId={myCrewColor}
              avatarUrl={myAvatarUrl}
              size={18}
              animate={false}
              onShip={true}
            />
            <span>{activeAnimalObj.label}</span>
            {activeAccessoryId !== 'none' && <span className="text-amber-600 dark:text-amber-300">{activeAccessoryObj.icon}</span>}
          </span>
          <button
            type="button"
            onClick={handleToggleGameMute}
            className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
              gameMuted
                ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300'
                : 'bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-[#007A7A] dark:text-cyan-300'
            }`}
            title={gameMuted ? 'Bật âm thanh Game' : 'Tắt âm thanh Game'}
          >
            {gameMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{gameMuted ? 'Đang tắt tiếng' : 'Âm thanh'}</span>
          </button>
          {themeToggleButton}
          <button
            type="button"
            data-testid="lobby-switch-to-knight-game-btn"
            onClick={() => setArenaGameMode('knight_rpg')}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 font-black transition inline-flex items-center gap-1 shadow-xs"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>⚔️ Game Hiệp Sĩ Diệt Rồng</span>
          </button>
          {isTeacher && isSandboxRound && gameSubState === 'PLAYING' && (
            <button
              type="button"
              onClick={handleToggleGamePause}
              className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
                gamePaused
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-white hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300'
              }`}
            >
              {gamePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{gamePaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </button>
          )}
        </div>

        {/* Teacher Sandbox Controls (4 Rounds) */}
        {isTeacher && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[#475569] dark:text-slate-400 font-bold hidden sm:inline">GV Sandbox:</span>
            <button
              onClick={() => jumpToGameSandboxRound(1)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 1 ? 'bg-[#007A7A] dark:bg-cyan-500 text-white dark:text-slate-950' : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'}`}
            >
              Màn 1
            </button>
            <button
              onClick={() => jumpToGameSandboxRound(2)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 2 ? 'bg-amber-500 text-slate-950' : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'}`}
            >
              Màn 2
            </button>
            <button
              onClick={() => jumpToGameSandboxRound(3)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 3 ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'}`}
            >
              Màn 3
            </button>
            <button
              onClick={() => jumpToGameSandboxRound(4)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 4 ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'}`}
            >
              Màn 4
            </button>
            <button
              onClick={() => {
                setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                setShowVocabModal(true);
              }}
              className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 px-2.5 py-1 rounded font-bold transition"
            >
              Soạn Bộ Câu Hỏi
            </button>
          </div>
        )}
      </header>

      {/* HUD In-Game Bar */}
      <div className="shrink-0 w-full max-w-4xl mx-auto px-2 sm:px-0 pt-2 z-20">
        <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between font-bold text-xs sm:text-sm gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-xs sm:text-xs ${
                gameRound === 1
                  ? 'bg-[#007A7A] dark:bg-sky-600'
                  : gameRound === 2
                  ? 'bg-amber-600'
                  : gameRound === 3
                  ? 'bg-sky-600'
                  : 'bg-rose-600'
              }`}>
                {gameRound === 1
                  ? 'VÒNG 1/4: NHẬN DIỆN TỪ'
                  : gameRound === 2
                  ? 'VÒNG 2/4: GÕ TỪ FULL'
                  : gameRound === 3
                  ? 'VÒNG 3/4: ĐỒNG · TRÁI NGHĨA'
                  : 'VÒNG 4/4: ĐỌC CÂU & GÕ ĐÁP ÁN'}
              </span>
              <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent px-2 py-1 rounded-lg text-[#334155] dark:text-slate-300 text-xs">
                Từ: {gameWordIdx + 1}/{gameQueues[gameRound]?.length || 1}
              </span>
              <span className="text-rose-500 text-sm tracking-wide" title={`Còn ${gameLives} mạng`}>
                {gameLives > 0 ? '❤️'.repeat(gameLives) : '💀'}
              </span>
              {(() => {
                const selfTitle = resolveVisibleTitleBadge(currentUser, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb });
                if (!selfTitle) return null;
                return (
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold border ${selfTitle.gameBadgeClass}`}>
                    {selfTitle.icon} {selfTitle.label}
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs flex items-center gap-1 border ${
                  isFrozenBoost
                    ? 'bg-sky-100 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-400 animate-pulse'
                    : isLowTime
                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/50 animate-pulse'
                    : isMidTime
                    ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/50'
                    : 'bg-[#EDFFFD] dark:bg-cyan-500/15 text-[#007A7A] dark:text-cyan-300 border-[#B5F5F1] dark:border-cyan-500/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {gameTimeLeft}s
              </span>
              {gameCombo >= 3 && (
                <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white dark:text-slate-950 font-black text-xs animate-pulse">
                  🔥 FEVER x2
                </span>
              )}
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-xs sm:text-sm">Combo: {gameCombo}</span>
              <span className="text-[#007A7A] dark:text-cyan-400 font-extrabold text-xs sm:text-sm tabular-nums">Điểm: {gameScore}</span>
            </div>
          </div>

          {/* Time Limit Progress Bar */}
          <div className="w-full h-1.5 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full transition-all duration-100 ${
                isLowTime ? 'bg-rose-500' : isMidTime ? 'bg-amber-400' : 'bg-[#007A7A] dark:bg-cyan-400'
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>

          {/* Active Question Prompt */}
          {activeQuestion && (
            <div className="bg-white dark:bg-slate-950/85 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="flex justify-center items-center gap-2 flex-wrap mb-1">
                <span className="text-xs text-[#007A7A] dark:text-cyan-400 uppercase font-bold tracking-wider">
                  {gameRound === 1
                    ? `Di chuyển & bắn từ đúng (hoặc bấm nút chọn - ${gameTimeLimit}s)`
                    : gameRound === 2
                    ? `Nghe & gõ đủ từ đầy đủ (GÕ FULL - ${gameTimeLimit}s)`
                    : gameRound === 3
                    ? `${activeQuestion.v3Badge || 'ĐỒNG · TRÁI NGHĨA'} - Bắn hoặc bấm đáp án (${gameTimeLimit}s)`
                    : `TYPING DIỆT BOSS - ĐỌC CÂU HỎI & GÕ ĐÁP ÁN (${gameTimeLimit}s)`}
                </span>
                <button
                  onClick={() =>
                    speakWord(
                      gameRound === 4
                        ? String(activeQuestion.v4Question || '').replace(/_{3,}/g, ' blank ')
                        : activeQuestion.word
                    )
                  }
                  className="bg-[#EDFFFD] hover:bg-[#D5FBF7] dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-[#007A7A] dark:text-cyan-300 border border-[#B5F5F1] dark:border-transparent px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" /> {gameRound === 4 ? 'Đọc Câu (TAB)' : 'Nghe (TAB)'}
                </button>
                <button
                  type="button"
                  onClick={handleUseFreezePowerup}
                  disabled={freezeCharges <= 0 || gamePaused}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 transition border ${
                    freezeCharges > 0 && !gamePaused
                      ? 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-400/40'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-[#475569] dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  }`}
                  title="Đóng băng thời gian & làm chậm Boss (+8 giây) - Phím tắt [2]"
                >
                  <Snowflake className="w-3 h-3" /> Đóng băng +8s [2] ({freezeCharges})
                </button>
                {(gameRound === 2 || gameRound === 4) && (
                  <>
                    <button
                      type="button"
                      onClick={handleGameHint}
                      className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-transparent px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Lightbulb className="w-3 h-3" /> Gợi ý (-15đ)
                    </button>
                    {gameRound === 2 && (
                      <button
                        type="button"
                        onClick={() => setShowMobileKeyboard(v => !v)}
                        className="bg-[#F8FAFC] hover:bg-[#F1F5F9] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 border border-slate-200 dark:border-transparent px-2 py-0.5 rounded text-xs font-bold transition"
                      >
                        {showMobileKeyboard ? 'Ẩn phím' : 'Phím ảo'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {gameRound !== 4 && (
                <p className="text-sm sm:text-base font-bold text-[#0F172B] dark:text-white leading-snug">
                  {gameRound === 3 ? activeQuestion.v3Question : activeQuestion.prompt}
                </p>
              )}

              {/* Clickable Choice Cards ONLY for V3 (Syn/Ant/Def) synced seamlessly with Shooter */}
              {gameRound === 3 && (() => {
                const choices = activeQuestion.v3Choices || [];
                if (choices.length === 0) return null;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 text-left">
                    {choices.map((choiceText, cIdx) => (
                      <button
                        key={`${choiceText}-${cIdx}`}
                        type="button"
                        onClick={() => handleGameChoiceSelect?.(choiceText)}
                        className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#EDFFFD] dark:bg-slate-900 dark:hover:bg-cyan-500/20 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A] dark:hover:border-cyan-400 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 transition"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#007A7A] text-white text-xs font-black flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + cIdx)}
                        </span>
                        <span className="leading-snug">{choiceText}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {gameRound === 2 && (
                <p className="text-xs sm:text-xs text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                  Phiên âm: {activeQuestion.ipa || 'N/A'} • {activeQuestion.word.length} ký tự (Bắt đầu: &quot;{activeQuestion.word[0]}&quot;)
                </p>
              )}

              {/* Full Typing Character Boxes for Round 2 (V2: GÕ TỪ FULL) */}
              {gameRound === 2 && (
                <div className="flex justify-center gap-1 sm:gap-1.5 mt-2 flex-wrap">
                  {activeQuestion.word.toUpperCase().split('').map((char, cIdx) => {
                    const isAlpha = /^[A-Z]$/.test(char);
                    const isTyped = cIdx < gameTypedProgress || !isAlpha;
                    const isCurrent = cIdx === gameTypedProgress;
                    const displayChar = isTyped ? char : '_';

                    return (
                      <div
                        key={cIdx}
                        className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-all ${
                          isTyped
                            ? 'bg-emerald-500 text-white dark:text-slate-950 border border-emerald-500 dark:border-emerald-400 scale-105'
                            : isCurrent
                            ? 'bg-amber-50 dark:bg-slate-800 text-[#0F172B] dark:text-white border-2 border-amber-500 dark:border-amber-400 shadow-md'
                            : 'bg-[#F8FAFC]/70 dark:bg-slate-900 text-[#475569] dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {displayChar}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Round 4: Fill-in-the-Blank Question Prompt + Multi-Answer Typing Box + Boss HP Bar */}
              {gameRound === 4 && (() => {
                const acceptedList = Array.isArray(activeQuestion.v4Answers) && activeQuestion.v4Answers.length > 0
                  ? activeQuestion.v4Answers
                  : [activeQuestion.v4Display || activeQuestion.collocation || activeQuestion.word];
                const evalRes = matchRound4TypingAnswer(gameRound4Input, acceptedList);
                const hpPct = Math.max(0, Math.round((1 - (evalRes.matchRatio || 0)) * 100));
                const sentenceParts = String(activeQuestion.v4Question || '').split(/(_{3,})/);
                const showMeaningSub =
                  activeQuestion.v4HintMeaning &&
                  !String(activeQuestion.v4Question || '').includes(activeQuestion.v4HintMeaning);

                return (
                  <div className="mt-1.5 space-y-2.5">
                    {/* Sentence Question Prompt with highlighted inline blank */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left sm:text-center">
                      <p className="text-sm sm:text-base font-bold text-[#0F172B] dark:text-white leading-relaxed">
                        {sentenceParts.map((part, pIdx) =>
                          /^_{3,}$/.test(part) ? (
                            <span
                              key={pIdx}
                              className="inline-block mx-1 px-2.5 py-0.5 rounded-lg border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs sm:text-sm font-black align-baseline min-w-[96px] text-center"
                            >
                              {gameRound4Input.trim() || '____________'}
                            </span>
                          ) : (
                            <span key={pIdx}>{part}</span>
                          )
                        )}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
                        {showMeaningSub && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            💡 Gợi ý nghĩa: {activeQuestion.v4HintMeaning}
                          </span>
                        )}
                        {acceptedList.length > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                            Chấp nhận {acceptedList.length} đáp án tương đương
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Boss HP Bar */}
                    <div className="max-w-lg mx-auto">
                      <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                        <span className="text-rose-600 dark:text-rose-400">
                          ⚔️ Máu Boss Typing: {hpPct}%
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {evalRes.matched ? '✅ Khớp đáp án! Nhấn Enter để hạ gục!' : 'Gõ đáp án rồi nhấn Enter'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-150 ${
                            hpPct > 50 ? 'bg-rose-600' : hpPct > 25 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Real Typing Input Box + Submit Button */}
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSubmitRound4Answer?.(gameRound4Input);
                      }}
                      className="max-w-xl mx-auto flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          autoComplete="off"
                          spellCheck="false"
                          disabled={gamePaused}
                          data-testid="game-round4-input"
                          value={gameRound4Input}
                          onChange={e => handleRound4InputChange?.(e.target.value)}
                          placeholder="Gõ từ / cụm từ cần điền vào chỗ trống rồi nhấn Enter..."
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 text-sm font-bold text-[#0F172B] dark:text-white focus:outline-none transition ${
                            evalRes.matched
                              ? 'border-emerald-500 ring-2 ring-emerald-500/25'
                              : 'border-rose-400/80 dark:border-rose-500/60 focus:border-[#007A7A] dark:focus:border-cyan-400'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={gamePaused || !gameRound4Input.trim()}
                        data-testid="game-round4-submit-btn"
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs sm:text-sm font-extrabold shadow-sm inline-flex items-center gap-1.5 shrink-0 transition"
                      >
                        <Zap className="w-4 h-4" /> Bắn Boss
                      </button>
                    </form>
                  </div>
                );
              })()}

              {/* Optional On-Screen Keyboard (Round 2) */}
              {gameRound === 2 && showMobileKeyboard && gameSubState === 'PLAYING' && (
                <div className="mt-2.5 space-y-1">
                  {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(rowStr => (
                    <div key={rowStr} className="flex justify-center gap-1">
                      {rowStr.split('').map(letter => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleGameTypingInput(letter)}
                          className="px-2 py-1.5 min-w-[26px] sm:min-w-[32px] bg-white hover:bg-[#007A7A] dark:bg-slate-800 dark:hover:bg-cyan-500 hover:text-white dark:hover:text-slate-950 text-[#0F172B] dark:text-white font-mono font-bold text-xs rounded border border-slate-200 dark:border-slate-700 transition active:scale-95"
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-0 py-1.5">
        <div className="relative w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-[#e0f2fe] via-[#fdecf2] to-[#fff5f8] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair block touch-none" />

          {/* Sandbox Pause Overlay */}
          {gamePaused && gameSubState === 'PLAYING' && (
            <div className="absolute inset-0 bg-white/85 dark:bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Chế độ Giảng Bài GV</p>
              <h3 className="text-2xl font-black text-[#0F172B] dark:text-white mb-4">ĐANG TẠM DỪNG</h3>
              <button
                type="button"
                onClick={handleToggleGamePause}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Tiếp Tục Chơi
              </button>
            </div>
          )}

          {/* Feedback Toast Overlay */}
          {gameToast.visible && (
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-2xl transition-all border z-30 max-w-[90%] text-center ${
              gameToast.isSuccess ? 'bg-emerald-600/95 text-white border-emerald-400' : 'bg-rose-600/95 text-white border-rose-400'
            }`}>
              {gameToast.text}
            </div>
          )}

          {/* Round Transition Screen */}
          {gameSubState === 'TRANSITION' && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
              <h2 className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mb-2">HOÀN THÀNH VÒNG {gameRound}/4!</h2>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 max-w-md mb-3 leading-relaxed">
                Chuẩn bị bước sang <b>Vòng {gameRound + 1}/4</b> ({gameRound + 1 === 2 ? 'Gõ Từ Full' : gameRound + 1 === 3 ? 'Đồng nghĩa / Trái nghĩa / Định nghĩa' : 'Gõ Cụm Từ Collocation Diệt Boss'}) - giới hạn {getSpeedAdjustedTimeLimit(gameRound + 1, room.speedMode || 'normal')} giây/từ!
              </p>
              <p className="text-xs font-mono text-[#007A7A] dark:text-cyan-300 mb-5">
                Tự động bắt đầu sau {transitionCountdown} giây...
              </p>
              <button
                onClick={advanceNextGameRound}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-lg"
              >
                VÀO NGAY VÒNG TIẾP THEO
              </button>
            </div>
          )}

          {/* Game Over & Review Summary */}
          {gameSubState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-[#F8FAFC]/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-40 overflow-y-auto">
              <h2 className={`text-xl sm:text-2xl font-extrabold mb-1 ${
                gameOutcome === 'LOST' ? 'text-rose-600 dark:text-rose-400' : 'text-[#007A7A] dark:text-cyan-300'
              }`}>
                {gameOutcome === 'LOST'
                  ? `HẾT MẠNG TẠI VÒNG ${gameRound}/4`
                  : isSandboxRound
                  ? `HOÀN THÀNH MÀN ${gameRound} (GV)`
                  : isPracticeGameSession
                  ? 'HOÀN THÀNH LUYỆN TẬP TỪ VỰNG'
                  : 'TỔNG KẾT KẾT QUẢ ĐẤU TRƯỜNG'}
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-300 mb-4">
                Điểm số: <b className="text-amber-600 dark:text-amber-400 text-base">{gameScore} điểm</b> • Đạt: <b className="text-emerald-600 dark:text-emerald-400">{passedWordsCount}/{gameReviewLog.length} từ</b> • Đã lưu vào Bảng Xếp Hạng!
              </p>

              {/* Practice BXH OR Live Room Top 5 Standings */}
              {isPracticeGameSession ? (
                gamePracticeLeaderboard.length > 0 && (
                  <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-indigo-500/30 rounded-xl p-3 mb-3 text-left text-xs shadow-sm">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> BXH Khu Tự Luyện Tập (Top {Math.min(5, gamePracticeLeaderboard.length)})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {gamePracticeLeaderboard.slice(0, 5).map((st, sIdx) => {
                        const isMe = st.username === currentUser?.username;
                        return (
                          <div
                            key={st.id || sIdx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                              isMe
                                ? 'bg-[#EDFFFD] dark:bg-cyan-500/15 border-[#007A7A]/50 dark:border-cyan-400/50 text-[#007A7A] dark:text-cyan-200'
                                : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-[#0F172B] dark:text-slate-200'
                            }`}
                          >
                            <span className="truncate font-semibold flex items-center gap-1 min-w-0">
                              <span>#{sIdx + 1}</span>
                              <VipMemberName user={usersDb[st.username] || st} fallbackName={st.name || st.username} badgeSize="xs" />
                              <span className="text-xs text-slate-400">({st.topicLabel})</span>
                            </span>
                            <span className="font-mono font-extrabold text-amber-600 dark:text-amber-300 ml-2 shrink-0">{st.score}đ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (() => {
                const matchEntries = Object.values(room.liveMatch || {});
                const topStandings = (
                  matchEntries.length > 0
                    ? [...matchEntries].sort((a, b) => (b.score || 0) - (a.score || 0))
                    : leaderboardPlayers
                ).slice(0, 5);
                const gameoverTeamStandings = isTeamRoom ? computeRoomTeamStandings(room) : [];
                if (topStandings.length === 0 && gameoverTeamStandings.length === 0) return null;
                return (
                  <>
                    {gameoverTeamStandings.length > 0 && (
                      <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 mb-2.5 text-left text-xs shadow-sm">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" /> Xếp Hạng Đội - Phòng #{activePin} ({room.teamCount} Team)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {gameoverTeamStandings.map((team, tIdx) => (
                            <div key={team.teamId} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${team.meta.cardCls}`}>
                              <div className="min-w-0">
                                <p className="font-extrabold text-[#0F172B] dark:text-white truncate">
                                  #{tIdx + 1} {team.meta.dot} {team.meta.name}
                                </p>
                                <p className="text-xs text-[#475569] dark:text-slate-300 truncate">
                                  {team.members.length} thành viên
                                </p>
                              </div>
                              <span className="font-mono font-black text-amber-600 dark:text-amber-300 ml-2 shrink-0">
                                {team.totalScore}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {topStandings.length > 0 && (
                  <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-indigo-500/30 rounded-xl p-3 mb-3 text-left text-xs shadow-sm">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Bảng Xếp Hạng Phòng #{activePin} (Top {topStandings.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {topStandings.map((st, sIdx) => {
                        const isMe = st.username === currentUser?.username || st.name === currentUser?.name;
                        const stTitle = st.username ? resolveVisibleTitleBadge(usersDb[st.username] || st, attempts, roomsDb, customTitles, paymentConfig, { gamePracticeLeaderboard, dailyRankTitles, usersDb }) : null;
                        return (
                          <div
                            key={st.username || st.name || sIdx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                              isMe
                                ? 'bg-[#EDFFFD] dark:bg-cyan-500/15 border-[#007A7A]/50 dark:border-cyan-400/50 text-[#007A7A] dark:text-cyan-200'
                                : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-[#0F172B] dark:text-slate-200'
                            }`}
                          >
                            <span className="truncate font-semibold flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0">#{sIdx + 1}</span>
                              <VipMemberName user={usersDb[st.username] || st} fallbackName={st.name || st.username} badgeSize="xs" />
                              {isMe && <span className="text-xs font-bold shrink-0">(Bạn)</span>}
                              {stTitle && (
                                <span className={`text-xs font-extrabold px-1.5 py-0.2 rounded-full border shrink-0 ${stTitle.gameBadgeClass}`}>
                                  {stTitle.icon} {stTitle.label}
                                </span>
                              )}
                              {(st.fastestWinsCount || 0) > 0 && (
                                <span className="text-xs font-black text-amber-600 dark:text-amber-300 shrink-0">⚡{st.fastestWinsCount}</span>
                              )}
                            </span>
                            <span className="font-mono font-extrabold text-amber-600 dark:text-amber-300 ml-2 shrink-0">{st.score || 0}đ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                    )}
                  </>
                );
              })()}

              {/* Review List of Words */}
              <div className="max-w-xl w-full max-h-48 sm:max-h-56 overflow-y-auto bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-left space-y-2 mb-4 text-xs shadow-sm">
                {gameReviewLog.length === 0 ? (
                  <p className="text-[#475569] dark:text-slate-400 text-center py-4">Chưa có từ vựng nào được ghi nhận.</p>
                ) : (
                  gameReviewLog.map((item, idx) => (
                    <div key={idx} className="border-b border-pink-100 dark:border-slate-800 pb-2 last:border-b-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-[#F8FAFC] dark:bg-slate-800 text-[#475569] dark:text-slate-400 px-1.5 py-0.5 rounded font-bold border border-slate-200 dark:border-transparent">V{item.round}</span>
                        <span className={item.passed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                          {item.passed ? 'Đạt' : 'Cần ôn'}
                        </span>
                        <b className="text-[#007A7A] dark:text-cyan-300">{item.word}</b>
                        <span className="text-[#475569] dark:text-slate-400 font-mono">{item.ipa}</span>
                        <button
                          type="button"
                          onClick={() => speakWord(item.word)}
                          className="ml-auto p-1 rounded-md bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EDFFFD] dark:hover:bg-cyan-500/20 text-[#007A7A] dark:text-cyan-300 transition"
                          title={`Nghe phát âm "${item.word}"`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[#334155] dark:text-slate-300 mt-0.5">{item.prompt}</p>
                      <p className="text-xs text-[#475569] dark:text-slate-500 italic mt-0.5">"{item.example}"</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                {isPracticeGameSession ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEntryZone('practice');
                        setGameSubState('JOIN');
                        gameRuntimeRef.current.subState = 'JOIN';
                      }}
                      className="bg-[#007A7A] hover:bg-[#065B5B] text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Về Khu Luyện Tập &amp; Xem BXH
                    </button>
                  </>
                ) : isRoomHost ? (
                  <>
                    <button
                      onClick={() => handleTeacherResetLobby(activePin)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Mở Sảnh Chờ Ván Mới
                    </button>
                    {isTeacher && (
                      <button
                        onClick={() => initGameCampaign(activePin, currentUser)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow"
                      >
                        Chơi Thử Lại (GV)
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setGameSubState('LOBBY');
                      gameRuntimeRef.current.subState = 'LOBBY';
                    }}
                    className="bg-[#007A7A] hover:bg-[#065B5B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" /> Quay Lại Sảnh Chờ Phòng
                  </button>
                )}
                <button
                  onClick={exitGame}
                  className="bg-white hover:bg-[#F8FAFC] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172B] dark:text-white font-bold px-4 py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-700"
                >
                  {isTeacher ? 'Về Quản Trị' : 'Về Trang Chủ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Leaderboard Footer */}
      <div className="shrink-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-xs text-[#475569] dark:text-slate-400 gap-2 flex-wrap">
          <span className="truncate">
            {isPracticeGameSession
              ? `Top Tự Luyện: ${gamePracticeLeaderboard.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.score}đ)`).join(' • ') || 'Chưa có kỷ lục'}`
              : `Top: ${leaderboardPlayers.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.score}đ)`).join(' • ') || 'Chưa có điểm'}`}
          </span>
          <span className="font-mono text-[#007A7A] dark:text-cyan-400">
            {gameRound === 4
              ? '[TAB] Nghe cụm từ • [1] Gợi ý • Gõ bàn phím liên tục diệt Boss Collocation'
              : gameRound === 2
              ? '[TAB] Nghe lại • [1] Gợi ý • Gõ bàn phím (Full từ)'
              : 'Chuột / ← → để lái • Click / Space để bắn hoặc Bấm chọn • [TAB] Nghe'}
          </span>
        </div>
      </div>
    </div>
  );
}
