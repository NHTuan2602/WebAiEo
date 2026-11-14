import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Copy,
  Crown,
  DoorOpen,
  Heart,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Snowflake,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserMinus,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  Zap
} from 'lucide-react';
import { CREWMATE_COLORS, DEFAULT_VOCAB_TEXT } from '../constants/seedData';
import { getSpeedAdjustedTimeLimit, normalizeRoomObject, parseRawVocabText } from '../utils/examHelpers';
import { speakWord } from '../utils/mediaHelpers';
import AmongUsCrewmate from '../components/common/AmongUsCrewmate';

export default function GameArena({
  activeQuestion,
  advanceNextGameRound,
  autoNextTimerRef,
  canvasRef,
  chatScrollRef,
  copiedRoomPin,
  currentRoomPin,
  currentUser,
  freezeCharges,
  gameCombo,
  gameLives,
  gameMuted,
  gameOutcome,
  gamePaused,
  gameQueues,
  gameReviewLog,
  gameRound,
  gameRuntimeRef,
  gameScore,
  gameSubState,
  gameTimeLeft,
  gameTimeLimit,
  gameToast,
  gameTypedProgress,
  gameWordIdx,
  handleChangeCrewColor,
  handleCopyInviteLink,
  handleDeleteRoom,
  handleFinishRoomMatch,
  handleGameHint,
  handleGameTypingInput,
  handleKickLobbyPlayer,
  handleLeaveGameLobby,
  handleSaveHostRoomSettings,
  handleSendLobbyChat,
  handleStudentJoinRoom,
  handleTeacherOpenLobby,
  handleTeacherResetLobby,
  handleTeacherStartLobbyGame,
  handleToggleGameMute,
  handleToggleGamePause,
  handleToggleLobbyReady,
  handleUseFreezePowerup,
  hostRoomDraft,
  initGameCampaign,
  isFrozenBoost,
  isSandboxRound,
  joinedRoomPin,
  jumpToGameSandboxRound,
  liveRankDeltas,
  lobbyChatInput,
  lobbyCountdown,
  lobbyCountdownTimerRef,
  lobbyNowTick,
  myCrewColor,
  roomJoinError,
  roomJoinForm,
  roomsDb,
  serverSyncConnected,
  setCopiedRoomPin,
  setCustomVocabInput,
  setGameSubState,
  setHostRoomDraft,
  setLobbyChatInput,
  setLobbyCountdown,
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
  const isTeacher = currentUser?.role === 'teacher';
  const activePin = joinedRoomPin || currentRoomPin;
  const room = normalizeRoomObject(roomsDb[activePin], activePin);
  const allRoomsList = Object.values(roomsDb || {}).map(r => normalizeRoomObject(r, r.pin));
  const roomChatMessages = Array.isArray(room.chatMessages) ? room.chatMessages : [];
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
  const activeCrewColorId = myLobbyEntry?.colorId || myCrewColor;
  const myAvatarUrl = currentUser?.avatarUrl || '';
  const timePct = Math.max(0, Math.min(100, (gameTimeLeft / Math.max(1, gameTimeLimit)) * 100));
  const isLowTime = gameTimeLeft <= 5;
  const isMidTime = gameTimeLeft <= 10 && gameTimeLeft > 5;

  const exitGame = () => {
    clearTimeout(autoNextTimerRef.current);
    clearInterval(wordTimerRef.current);
    clearInterval(lobbyCountdownTimerRef.current);
    setLobbyCountdown(null);
    setView(isTeacher ? 'TEACHER_DASHBOARD' : 'HOME');
  };

  const renderCrewColorPicker = (compact = false) => {
    const swatchSize = compact ? 'w-5 h-5' : 'w-7 h-7';
    const applyColor = (colorId) => {
      if (gameSubState === 'JOIN') {
        setMyCrewColor(colorId);
      } else {
        handleChangeCrewColor(colorId);
      }
    };

    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {CREWMATE_COLORS.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => applyColor(c.id)}
            className={`${swatchSize} rounded-full border-2 transition ${
              activeCrewColorId === c.id ? 'border-white scale-115 shadow-lg' : 'border-slate-700 opacity-75 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.fill }}
            title={c.label}
          />
        ))}
        {myAvatarUrl ? (
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700/80">
            <button
              type="button"
              onClick={() => applyColor('avatar')}
              className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden border-2 transition bg-slate-800 ${
                activeCrewColorId === 'avatar'
                  ? 'border-cyan-300 ring-2 ring-cyan-400/60 scale-115 shadow-lg'
                  : 'border-slate-600 opacity-85 hover:opacity-100'
              }`}
              title="Dùng Ảnh Avatar trên đầu nhân vật"
            >
              <img src={myAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-cyan-300 transition flex items-center gap-1"
              title="Đổi ảnh Avatar khuôn mặt"
            >
              <Camera className="w-3 h-3" /> Đổi ảnh
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="ml-1 px-2.5 py-1 rounded-full border border-dashed border-cyan-500/60 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-300 transition flex items-center gap-1"
            title="Tải ảnh khuôn mặt để gắn lên đầu nhân vật"
          >
            <Camera className="w-3 h-3" /> + Avatar
          </button>
        )}
      </div>
    );
  };

  const renderLobbyChatPanel = (heightClass = 'h-[270px] lg:h-[360px]', titleLabel = 'Chat Phòng Chờ') => (
    <div className={`lg:col-span-5 xl:col-span-4 bg-slate-900/85 border border-slate-700/80 rounded-3xl p-4 flex flex-col ${heightClass} shadow-xl backdrop-blur-md`}>
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5 shrink-0">
        <span className="text-xs font-extrabold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" /> {titleLabel}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          {roomChatMessages.length} tin nhắn
        </span>
      </div>

      <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {roomChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs px-3">
            <MessageSquare className="w-7 h-7 mb-1.5 opacity-40" />
            <p>Chưa có tin nhắn nào. Hãy nhắn chào cả phòng hoặc chọn câu chat nhanh bên dưới!</p>
          </div>
        ) : (
          roomChatMessages.map(msg => {
            const isMine = msg.username === currentUser?.username;
            const swatch = CREWMATE_COLORS.find(c => c.id === msg.colorId)?.fill || '#06b6d4';
            const msgAvatar = msg.avatarUrl || usersDb[msg.username]?.avatarUrl || '';
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                  {msgAvatar ? (
                    <img src={msgAvatar} alt="" className="w-4 h-4 rounded-full object-cover border border-slate-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
                  )}
                  <span className="font-bold text-slate-200">{msg.name}</span>
                  {msg.role === 'teacher' && <Crown className="w-3 h-3 text-amber-400" />}
                  <span>• {msg.timeStr}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[88%] break-words ${
                  isMine
                    ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 rounded-tr-sm'
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Sẵn sàng!', 'Bắt đầu thôi!', 'Cố lên cả lớp!'].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSendLobbyChat(q)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 transition"
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
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Gửi
          </button>
        </form>
      </div>
    </div>
  );

  // 1. JOIN ROOM SCREEN (Students must enter Teacher's Room PIN & Password)
  if (gameSubState === 'JOIN' && !isTeacher) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[15%] w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full mx-auto flex items-center justify-between relative z-10">
          <button
            onClick={exitGame}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
              serverSyncConnected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Wifi className="w-3.5 h-3.5" />
              {serverSyncConnected ? 'Đã đồng bộ Live' : 'Local Mode'}
            </span>
            <span className="hidden sm:inline-flex text-slate-400 font-medium items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Xác thực phòng thi đấu trực tiếp
            </span>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto my-auto py-6 relative z-10">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3">
                <AmongUsCrewmate colorId={myCrewColor} avatarUrl={myAvatarUrl} size={64} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full mb-2">
                Sảnh Chờ Phi Hành Đoàn
              </span>
              <h1 className="text-2xl font-extrabold text-white">Tham Gia Phòng Đấu Từ Vựng</h1>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
                Nhập <b>Mã Phòng (PIN)</b> và <b>Mật Khẩu</b> do giáo viên tạo để bước vào Sảnh Chờ. Trận đấu sẽ chỉ bắt đầu khi giáo viên bấm khởi hành!
              </p>
            </div>

            {/* Pick Suit Color before entering */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-400 text-center mb-2">Chọn màu phi hành gia hoặc đầu Avatar:</p>
              {renderCrewColorPicker(false)}
            </div>

            {roomJoinError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{roomJoinError}</span>
              </div>
            )}

            <form onSubmit={handleStudentJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Phòng (PIN)</label>
                <input
                  type="text"
                  placeholder="VD: 686868"
                  value={roomJoinForm.pin}
                  onChange={e => {
                    setRoomJoinForm({ ...roomJoinForm, pin: e.target.value });
                    if (roomJoinError) setRoomJoinError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-lg font-extrabold tracking-widest text-cyan-300 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật Khẩu Phòng</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu phòng..."
                  value={roomJoinForm.pass}
                  onChange={e => {
                    setRoomJoinForm({ ...roomJoinForm, pass: e.target.value });
                    if (roomJoinError) setRoomJoinError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-semibold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <DoorOpen className="w-4 h-4" /> VÀO SẢNH CHỜ NGAY
              </button>
            </form>

            {allRoomsList.filter(r => r.status === 'LOBBY').length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800/90">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
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
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 ${
                        roomJoinForm.pin === r.pin
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <span className="font-mono text-amber-300">#{r.pin}</span>
                      <span className="truncate max-w-[140px]">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 relative z-10">
          Mẹo: Nếu giáo viên mở phòng trong một tab/cửa sổ trình duyệt khác, danh sách người chơi sẽ đồng bộ trực tiếp.
        </div>
      </div>
    );
  }

  // 2. AMONG US DROPSHIP WAITING LOBBY + LAUNCH COUNTDOWN
  if (gameSubState === 'LOBBY' || gameSubState === 'COUNTDOWN') {
    const canHostLaunch = isTeacher && gameSubState === 'LOBBY' && hasStudentsInLobby;
    const isRoomAlreadyPlayingWithoutLaunch = !isTeacher && room.status === 'PLAYING' && gameSubState === 'LOBBY';

    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-[#070b15] text-white flex flex-col select-none relative">
        {/* Top Lobby Header */}
        <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLeaveGameLobby}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
            >
              <ChevronLeft className="w-4 h-4" /> Rời Sảnh
            </button>
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 max-w-[180px] truncate">{room.name}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
              serverSyncConnected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Wifi className="w-3 h-3" /> {serverSyncConnected ? 'Live' : 'Local'}
            </span>
            {isTeacher && (
              <div className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-300">PIN: <b className="font-mono text-amber-300">{room.pin}</b></span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">Pass: <b className="font-mono text-cyan-300">{room.pass}</b></span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`Mã phòng Game Từ Vựng: ${room.pin} | Mật khẩu: ${room.pass}`);
                    setCopiedRoomPin(true);
                    setTimeout(() => setCopiedRoomPin(false), 1800);
                    showToast(`Đã sao chép PIN ${room.pin} & Pass "${room.pass}"!`);
                  }}
                  className="ml-1 text-indigo-300 hover:text-white"
                  title="Sao chép mã PIN & Mật khẩu"
                >
                  {copiedRoomPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(room.pin)}
                  className="text-cyan-300 hover:text-white pl-1 border-l border-indigo-500/30"
                  title="Sao chép Link mời tự điền PIN (?pin=...)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-cyan-300">
              <Users className="w-3.5 h-3.5" /> {lobbyPlayersList.length}/{room.maxPlayers}
            </span>
            {isTeacher && (
              <>
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo Phòng
                </button>
                <button
                  onClick={() => {
                    setCustomVocabInput(room.rawVocab || DEFAULT_VOCAB_TEXT);
                    setShowVocabModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition"
                >
                  Kho Từ ({roomVocabCount})
                </button>
                {!hasStudentsInLobby ? (
                  <button
                    onClick={() => jumpToGameSandboxRound(1)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition hidden sm:inline-flex items-center gap-1"
                    title="Chỉ khả dụng khi phòng chưa có học sinh"
                  >
                    Chơi Thử GV
                  </button>
                ) : room.status === 'PLAYING' ? (
                  <button
                    onClick={() => setGameSubState('HOST_SPECTATE')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-300 transition inline-flex items-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Bảng Đua Top
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                    <Trophy className="w-3.5 h-3.5" /> Giám Sát Đua Top
                  </span>
                )}
              </>
            )}
          </div>
        </header>

        {/* Main Lobby Content Area */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 p-3 sm:p-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.28),_rgba(7,11,21,1)_70%)]">
          <div className="max-w-6xl w-full mx-auto space-y-3">
            {/* TEACHER INLINE ROOM NAME / PIN / PASSWORD EDITOR */}
            {isTeacher && (
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3.5 backdrop-blur-md shadow-lg space-y-3">
                {allRoomsList.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400">Chuyển phòng:</span>
                    {allRoomsList.map(r => (
                      <div key={r.pin} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleTeacherOpenLobby(r.pin)}
                          className={`px-2.5 py-1 text-[11px] font-bold transition ${
                            r.pin === activePin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          #{r.pin} • {r.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(r.pin)}
                          className="px-1.5 py-1 bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white text-[11px] transition border-l border-slate-700"
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                      Tên phòng hiển thị
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.name}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên phòng..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                      Mã PIN
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.pin}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, pin: e.target.value }))}
                      placeholder="686868"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                      Mật khẩu
                    </label>
                    <input
                      type="text"
                      value={hostRoomDraft.pass}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, pass: e.target.value }))}
                      placeholder="Mật khẩu..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                      Từ/vòng
                    </label>
                    <select
                      value={hostRoomDraft.roundSize || 4}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, roundSize: Number(e.target.value) }))}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {[2, 3, 4, 5, 6, 8].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-pink-300 mb-1">
                      Tốc độ
                    </label>
                    <select
                      value={hostRoomDraft.speedMode || 'normal'}
                      onChange={e => setHostRoomDraft(prev => ({ ...prev, speedMode: e.target.value }))}
                      className="w-full px-1.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-pink-300 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    >
                      <option value="relaxed">Chậm</option>
                      <option value="normal">Chuẩn</option>
                      <option value="turbo">Nhanh</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" /> Lưu Phòng
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Console Banner */}
            <div className="bg-slate-900/75 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-white">Khoang Chờ Tàu Vũ Trụ (Dropship Lobby)</h2>
                  <p className="text-[11px] text-slate-400">
                    {isTeacher
                      ? 'Học sinh nhập Mã PIN & Mật khẩu để vào khoang. Nhấn Bắt Đầu Trận Đấu để tất cả cùng vào game.'
                      : isRoomAlreadyPlayingWithoutLaunch
                      ? 'Lượt chơi trước đang chạy hoặc đã xong — chờ Giáo viên bấm Bắt Đầu / Mở Sảnh Mới để cùng khởi hành.'
                      : 'Bạn đã ở trong Sảnh Chờ! Bấm Sẵn Sàng và chờ Chủ phòng (Giáo viên) bấm khởi hành.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold">
                  {roomVocabCount} từ • {room.roundSize || 4}/vòng • {room.speedMode === 'relaxed' ? 'Chậm (+6s)' : room.speedMode === 'turbo' ? 'Siêu tốc (-5s)' : 'Chuẩn'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  {readyCount}/{lobbyPlayersList.length} Sẵn sàng
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Stage: Dropship Crewmates Grid + Persistent Lobby Chat */}
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 my-auto py-1">
            {/* Left: Crewmates Deck */}
            <div className="lg:col-span-7 xl:col-span-8 relative rounded-3xl border-2 border-slate-700/70 bg-slate-900/60 backdrop-blur-sm pt-12 pb-6 px-5 sm:px-8 shadow-2xl min-h-[260px] flex flex-col justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
                {lobbyPlayersList.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                    Chưa có thành viên nào trong khoang chờ...
                  </div>
                ) : (
                  lobbyPlayersList.map((player, idx) => {
                    const isHost = player.role === 'teacher';
                    const isSelf = player.username === currentUser?.username;
                    const showBubble = Boolean(player.chat && player.chatAt && Math.abs(lobbyNowTick - player.chatAt) < 5500);

                    return (
                      <div key={player.username} className="flex flex-col items-center relative group">
                        {/* Speech Bubble above Crewmate */}
                        {showBubble && (
                          <div className="absolute -top-10 z-20 bg-white text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg max-w-[150px] truncate border border-slate-200">
                            {player.chat}
                          </div>
                        )}

                        {/* Kick Button for Teacher */}
                        {isTeacher && !isHost && (
                          <button
                            type="button"
                            onClick={() => handleKickLobbyPlayer(activePin, player.username, player.name)}
                            className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition"
                            title={`Mời ${player.name} rời sảnh`}
                          >
                            <UserMinus className="w-3 h-3" />
                          </button>
                        )}

                        {/* Host Crown */}
                        {isHost ? (
                          <div className="mb-0.5 text-amber-400 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">
                            <Crown className="w-3.5 h-3.5" /> Chủ Phòng
                          </div>
                        ) : (
                          <div className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${player.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {player.ready ? 'Sẵn sàng' : 'Đang chờ'}
                          </div>
                        )}

                        <AmongUsCrewmate
                          colorId={player.colorId || 'cyan'}
                          avatarUrl={player.avatarUrl || usersDb[player.username]?.avatarUrl || ''}
                          size={56}
                          flip={idx % 2 === 1}
                          animate={true}
                        />

                        {/* Floor Shadow */}
                        <div className="w-11 h-2 bg-black/50 rounded-full blur-[2px] -mt-1 mb-2" />

                        {/* Nameplate */}
                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                          isSelf
                            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            player.ready || isHost ? 'bg-emerald-400' : 'bg-amber-400'
                          }`} />
                          <span className="truncate max-w-[105px]">{player.name}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Persistent Live Lobby Chat Box */}
            {renderLobbyChatPanel('h-[270px] lg:h-[360px]', 'Chat Phòng Chờ')}
          </div>

          {/* Bottom Controls Bar (Suit Customize + Ready / Host Launch) */}
          <div className="max-w-6xl w-full mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800 flex-wrap justify-center">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Phi hành gia:</span>
              {renderCrewColorPicker(true)}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-center shrink-0">
              {!isTeacher ? (
                <button
                  type="button"
                  onClick={handleToggleLobbyReady}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg ${
                    myLobbyEntry?.ready
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {myLobbyEntry?.ready ? 'Đã Sẵn Sàng (Bấm để Hủy)' : 'Bấm Sẵn Sàng'}
                </button>
              ) : (
                <>
                  {room.status === 'PLAYING' && (
                    <button
                      type="button"
                      onClick={() => handleTeacherResetLobby(activePin)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Mở Lại Sảnh (Cho HS Vào)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTeacherStartLobbyGame(activePin)}
                    disabled={!canHostLaunch}
                    title={hasStudentsInLobby ? 'Khởi động trận đấu & mở bảng Đua Top cho Giáo viên' : 'Cần ít nhất 1 học sinh vào sảnh mới có thể bắt đầu'}
                    className={`px-6 py-2.5 rounded-xl font-extrabold text-sm transition flex items-center gap-2 shadow-xl ${
                      canHostLaunch
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    {hasStudentsInLobby
                      ? `BẮT ĐẦU ĐUA TOP (${studentLobbyPlayers.length} HS)`
                      : 'CHỜ HỌC SINH VÀO SẢNH (0 HS)'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Synchronized 3-2-1 Rocket Launch Countdown Overlay */}
        {gameSubState === 'COUNTDOWN' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-3">
              Tất cả phi hành gia chuẩn bị
            </p>
            <div className="text-7xl sm:text-8xl font-black text-white font-mono animate-bounce">
              {lobbyCountdown ?? 1}
            </div>
            <p className="text-sm text-slate-300 mt-4 font-semibold">
              {isTeacher ? 'Đang mở Bảng Xếp Hạng Đua Top Trực Tiếp...' : 'Đang khởi động Đấu Trường Từ Vựng 3 Vòng...'}
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
      <div className="min-h-[100dvh] w-full bg-[#060914] text-white flex flex-col select-none relative overflow-x-hidden">
        <div className="absolute top-[-10%] left-[15%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Host Spectate Header */}
        <header className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exitGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
            >
              <ChevronLeft className="w-4 h-4" /> Thoát Ra Bảng Tin
            </button>
            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/40 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold text-amber-200 uppercase tracking-wide">Đua Top Trực Tiếp</span>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
              PIN: <b className="font-mono text-cyan-300">{room.pin}</b> • {room.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
              serverSyncConnected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Wifi className="w-3.5 h-3.5" /> {serverSyncConnected ? 'Live Sync' : 'Local'}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5">
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
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mở Sảnh Ván Mới
            </button>
          </div>
        </header>

        {/* Main Spectate Race Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
          {/* Left 8 Cols: Live Top-3 Podium + Animated Rank Tracks */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Top 3 Live Podium */}
            {rankedPlayers.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4" /> Top 3 Dẫn Đầu Hiện Tại
                  </h2>
                  <span className="text-[11px] text-slate-400">Giáo viên chỉ giám sát • Tự động cập nhật</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {podiumOrder.map((rankIdx) => {
                    const p = rankedPlayers[rankIdx];
                    if (!p) return null;
                    const isFirst = rankIdx === 0;
                    const medalStyles =
                      rankIdx === 0
                        ? 'bg-gradient-to-b from-amber-500/25 to-slate-900/90 border-amber-400/60 sm:py-5 shadow-lg shadow-amber-500/10'
                        : rankIdx === 1
                        ? 'bg-gradient-to-b from-slate-400/15 to-slate-900/90 border-slate-400/40'
                        : 'bg-gradient-to-b from-orange-500/15 to-slate-900/90 border-orange-500/40';
                    const rankLabel = rankIdx === 0 ? 'HẠNG #1' : rankIdx === 1 ? 'HẠNG #2' : 'HẠNG #3';

                    return (
                      <div key={`pod-${p.username}`} className={`rounded-2xl border p-3.5 flex flex-col items-center text-center transition-all duration-300 ${medalStyles}`}>
                        <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full mb-2 ${
                          isFirst ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                          {rankLabel}
                        </span>
                        <AmongUsCrewmate
                          colorId={p.colorId || 'cyan'}
                          avatarUrl={p.avatarUrl}
                          size={isFirst ? 54 : 44}
                          animate={!p.finished && (p.lives ?? 3) > 0}
                        />
                        <p className="font-extrabold text-sm text-white mt-1.5 truncate max-w-full">{p.name}</p>
                        <p className="font-mono text-lg font-black text-amber-300 tabular-nums">{p.score || 0}đ</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">{p.progressText || 'Đang đua'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Smoothly Animated Live Leaderboard Tracks */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex-1">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" /> Bảng Xếp Hạng Biến Động Thời Gian Thực
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {rankedPlayers.length} thí sinh
                </span>
              </div>

              {rankedPlayers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
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
                        ? 'border-amber-400/60 bg-amber-500/10'
                        : rankIdx === 1
                        ? 'border-slate-500/60 bg-slate-800/80'
                        : rankIdx === 2
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-slate-800 bg-slate-950/75';

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
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            #{rankIdx + 1}
                          </span>
                          {delta !== 0 && (
                            <span className={`mt-0.5 text-[9px] font-extrabold inline-flex items-center gap-0.5 ${
                              delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {delta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>

                        {/* Crewmate / Avatar Character */}
                        <div className="shrink-0">
                          <AmongUsCrewmate
                            colorId={p.colorId || 'cyan'}
                            avatarUrl={p.avatarUrl}
                            size={42}
                            animate={!p.finished && livesLeft > 0}
                          />
                        </div>

                        {/* Name, Progress Bar, Hearts & Combo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-white truncate max-w-[150px] sm:max-w-[210px]">
                              {p.name}
                            </span>
                            {p.finished ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.outcome === 'VICTORY'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}>
                                {p.outcome === 'VICTORY' ? 'Hoàn thành!' : 'Hết mạng'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 truncate max-w-[145px]">
                                {p.progressText || `Vòng ${p.round || 1}/3`}
                              </span>
                            )}
                            {(p.streak || 0) > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                                <Zap className="w-3 h-3" /> x{p.streak}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  rankIdx === 0
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                    : p.finished && p.outcome === 'LOST'
                                    ? 'bg-rose-500'
                                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                                }`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0" title={`Còn ${livesLeft}/3 mạng`}>
                              {[0, 1, 2].map(i => (
                                <Heart
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < livesLeft ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Live Score */}
                        <div className="text-right shrink-0 pl-2">
                          <p className={`font-mono text-lg sm:text-xl font-black tabular-nums ${
                            rankIdx === 0 ? 'text-amber-300' : 'text-cyan-300'
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
              <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Từ Cả Lớp Hay Sai Nhất (Bấm Để Đọc Mẫu)
                  </h3>
                  <span className="text-[11px] text-slate-400">Phục vụ ôn tập ngay sau trận</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topMissedWords.map(([wordStr, errCount]) => (
                    <button
                      key={wordStr}
                      type="button"
                      onClick={() => speakWord(wordStr)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-bold text-rose-200 flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                      <span className="font-mono">{wordStr}</span>
                      <span className="bg-rose-500/30 text-white text-[10px] px-1.5 py-0.5 rounded-md">{errCount} lượt sai</span>
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
    <div className="h-[100dvh] w-full overflow-hidden bg-slate-950 text-white flex flex-col select-none">
      {/* Game Navigation Header */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={exitGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold transition"
          >
            <ChevronLeft className="w-4 h-4" /> Thoát Game
          </button>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-full font-bold">
            Phòng: {activePin}
          </span>
          <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
            {currentUser?.name || currentUser?.username}
          </span>
          <button
            type="button"
            onClick={handleToggleGameMute}
            className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
              gameMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
            }`}
            title={gameMuted ? 'Bật âm thanh Game' : 'Tắt âm thanh Game'}
          >
            {gameMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{gameMuted ? 'Đang tắt tiếng' : 'Âm thanh'}</span>
          </button>
          {isTeacher && isSandboxRound && gameSubState === 'PLAYING' && (
            <button
              type="button"
              onClick={handleToggleGamePause}
              className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
                gamePaused
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
            >
              {gamePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{gamePaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </button>
          )}
        </div>

        {/* Teacher Sandbox Controls */}
        {isTeacher && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-slate-400 font-bold hidden sm:inline">GV Sandbox:</span>
            <button
              onClick={() => jumpToGameSandboxRound(1)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Màn 1
            </button>
            <button
              onClick={() => jumpToGameSandboxRound(2)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Màn 2
            </button>
            <button
              onClick={() => jumpToGameSandboxRound(3)}
              className={`px-2.5 py-1 rounded font-bold transition ${gameRound === 3 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Màn 3
            </button>
            <button
              onClick={() => setShowVocabModal(true)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-bold transition"
            >
              Sửa Kho Từ
            </button>
          </div>
        )}
      </header>

      {/* HUD In-Game Bar */}
      <div className="shrink-0 w-full max-w-4xl mx-auto px-2 sm:px-0 pt-2 z-20">
        <div className="bg-slate-900/95 border border-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between font-bold text-xs sm:text-sm gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[11px] sm:text-xs ${
                gameRound === 1 ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : gameRound === 2 ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-pink-600 to-purple-600'
              }`}>
                {gameRound === 1 ? 'VÒNG 1/3: NHẬN DIỆN' : gameRound === 2 ? 'VÒNG 2/3: GÕ TỪ KHUYẾT' : 'VÒNG 3/3: BOSS IPA'}
              </span>
              <span className="bg-slate-800 px-2 py-1 rounded-lg text-slate-300 text-xs">
                Từ: {gameWordIdx + 1}/{gameQueues[gameRound]?.length || 1}
              </span>
              <span className="text-rose-500 text-sm tracking-wide" title={`Còn ${gameLives} mạng`}>
                {gameLives > 0 ? '❤️'.repeat(gameLives) : '💀'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs flex items-center gap-1 border ${
                  isFrozenBoost
                    ? 'bg-sky-500/25 text-sky-200 border-sky-400 animate-pulse'
                    : isLowTime
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                    : isMidTime
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {gameTimeLeft}s
              </span>
              {gameCombo >= 3 && (
                <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[11px] animate-pulse">
                  🔥 FEVER x2
                </span>
              )}
              <span className="text-amber-400 font-extrabold text-xs sm:text-sm">Combo: {gameCombo}</span>
              <span className="text-cyan-400 font-extrabold text-xs sm:text-sm tabular-nums">Điểm: {gameScore}</span>
            </div>
          </div>

          {/* Time Limit Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full transition-all duration-100 ${
                isLowTime ? 'bg-rose-500' : isMidTime ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>

          {/* Active Question Prompt */}
          {activeQuestion && (
            <div className="bg-slate-950/85 px-3 py-2.5 rounded-xl border border-slate-800 text-center">
              <div className="flex justify-center items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                  {gameRound === 1
                    ? `Di chuyển & bắn gà đúng (${gameTimeLimit}s)`
                    : `Nghe & gõ đủ từ trước khi Boss chạm tàu (${gameTimeLimit}s)`}
                </span>
                <button
                  onClick={() => speakWord(activeQuestion.word)}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Nghe (TAB)
                </button>
                <button
                  type="button"
                  onClick={handleUseFreezePowerup}
                  disabled={freezeCharges <= 0 || gamePaused}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition border ${
                    freezeCharges > 0 && !gamePaused
                      ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-400/40'
                      : 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                  title="Đóng băng thời gian & làm chậm Boss (+8 giây) — Phím tắt [2]"
                >
                  <Snowflake className="w-3 h-3" /> Đóng băng +8s [2] ({freezeCharges})
                </button>
                {(gameRound === 2 || gameRound === 3) && (
                  <>
                    <button
                      onClick={handleGameHint}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Lightbulb className="w-3 h-3" /> Gợi ý (-15đ)
                    </button>
                    <button
                      onClick={() => setShowMobileKeyboard(v => !v)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-bold transition"
                    >
                      {showMobileKeyboard ? 'Ẩn phím' : 'Phím ảo'}
                    </button>
                  </>
                )}
              </div>

              <p className="text-sm sm:text-base font-bold text-white leading-snug">
                {activeQuestion.prompt}
              </p>

              {(gameRound === 2 || gameRound === 3) && (
                <p className="text-[11px] sm:text-xs text-amber-300 font-mono mt-0.5">
                  Phiên âm: {activeQuestion.ipa || 'N/A'} • {activeQuestion.word.length} ký tự (Bắt đầu: "{activeQuestion.word[0]}")
                </p>
              )}

              {/* Typing Character Boxes for Round 2 & Round 3 */}
              {(gameRound === 2 || gameRound === 3) && (
                <div className="flex justify-center gap-1 sm:gap-1.5 mt-2 flex-wrap">
                  {activeQuestion.word.toUpperCase().split('').map((char, cIdx) => {
                    const isAlpha = /^[A-Z]$/.test(char);
                    const isTyped = cIdx < gameTypedProgress || !isAlpha;
                    const isCurrent = cIdx === gameTypedProgress;
                    const displayChar = isTyped
                      ? char
                      : (gameRound === 2 && cIdx % 2 === 0 ? char : '_');

                    return (
                      <div
                        key={cIdx}
                        className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-all ${
                          isTyped
                            ? 'bg-emerald-500 text-slate-950 border border-emerald-400 scale-105'
                            : isCurrent
                            ? 'bg-slate-800 text-white border-2 border-amber-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {displayChar}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional On-Screen Keyboard */}
              {(gameRound === 2 || gameRound === 3) && showMobileKeyboard && gameSubState === 'PLAYING' && (
                <div className="mt-2.5 space-y-1">
                  {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(rowStr => (
                    <div key={rowStr} className="flex justify-center gap-1">
                      {rowStr.split('').map(letter => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleGameTypingInput(letter)}
                          className="px-2 py-1.5 min-w-[26px] sm:min-w-[32px] bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-mono font-bold text-xs rounded border border-slate-700 transition active:scale-95"
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
        <div className="relative w-full h-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair block touch-none" />

          {/* Sandbox Pause Overlay */}
          {gamePaused && gameSubState === 'PLAYING' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-2">Chế độ Giảng Bài GV</p>
              <h3 className="text-2xl font-black text-white mb-4">ĐANG TẠM DỪNG</h3>
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
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
              <h2 className="text-xl sm:text-2xl font-extrabold text-amber-400 mb-2">HOÀN THÀNH VÒNG {gameRound}/3!</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-3 leading-relaxed">
                Chuẩn bị bước sang <b>Vòng {gameRound + 1}</b> với <b>bộ từ vựng mới</b> (giới hạn {getSpeedAdjustedTimeLimit(gameRound + 1, room.speedMode || 'normal')} giây/từ)!
              </p>
              <p className="text-xs font-mono text-cyan-300 mb-5">
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
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-40 overflow-y-auto">
              <h2 className={`text-xl sm:text-2xl font-extrabold mb-1 ${
                gameOutcome === 'LOST' ? 'text-rose-400' : 'text-cyan-300'
              }`}>
                {gameOutcome === 'LOST'
                  ? `HẾT MẠNG TẠI VÒNG ${gameRound}`
                  : isSandboxRound
                  ? `HOÀN THÀNH MÀN ${gameRound} (GV)`
                  : 'TỔNG KẾT KẾT QUẢ ĐẤU TRƯỜNG'}
              </h2>
              <p className="text-xs text-slate-300 mb-4">
                Điểm số: <b className="text-amber-400 text-base">{gameScore} điểm</b> • Đạt: <b className="text-emerald-400">{passedWordsCount}/{gameReviewLog.length} từ</b> • Đã lưu vào Bảng Xếp Hạng!
              </p>

              {/* Live Room Top 5 Standings at End of Match */}
              {(() => {
                const matchEntries = Object.values(room.liveMatch || {});
                const topStandings = (
                  matchEntries.length > 0
                    ? [...matchEntries].sort((a, b) => (b.score || 0) - (a.score || 0))
                    : leaderboardPlayers
                ).slice(0, 5);
                if (topStandings.length === 0) return null;
                return (
                  <div className="max-w-xl w-full bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 mb-3 text-left text-xs">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Bảng Xếp Hạng Phòng #{activePin} (Top {topStandings.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {topStandings.map((st, sIdx) => {
                        const isMe = st.username === currentUser?.username || st.name === currentUser?.name;
                        return (
                          <div
                            key={st.username || st.name || sIdx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                              isMe
                                ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                                : 'bg-slate-950/70 border-slate-800 text-slate-200'
                            }`}
                          >
                            <span className="truncate font-semibold">
                              #{sIdx + 1} {st.name || st.username} {isMe ? '(Bạn)' : ''}
                            </span>
                            <span className="font-mono font-extrabold text-amber-300 ml-2 shrink-0">{st.score || 0}đ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Review List of Words */}
              <div className="max-w-xl w-full max-h-48 sm:max-h-56 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-left space-y-2 mb-4 text-xs">
                {gameReviewLog.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Chưa có từ vựng nào được ghi nhận.</p>
                ) : (
                  gameReviewLog.map((item, idx) => (
                    <div key={idx} className="border-b border-slate-800 pb-2 last:border-b-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">V{item.round}</span>
                        <span className={item.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {item.passed ? 'Đạt' : 'Cần ôn'}
                        </span>
                        <b className="text-cyan-300">{item.word}</b>
                        <span className="text-slate-400 font-mono">{item.ipa}</span>
                        <button
                          type="button"
                          onClick={() => speakWord(item.word)}
                          className="ml-auto p-1 rounded-md bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 transition"
                          title={`Nghe phát âm "${item.word}"`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-slate-300 mt-0.5">{item.prompt}</p>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">"{item.example}"</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                {isTeacher ? (
                  <>
                    <button
                      onClick={() => handleTeacherResetLobby(activePin)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Mở Sảnh Chờ Ván Mới
                    </button>
                    <button
                      onClick={() => initGameCampaign(activePin, currentUser)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow"
                    >
                      Chơi Thử Lại (GV)
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setGameSubState('LOBBY');
                      gameRuntimeRef.current.subState = 'LOBBY';
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" /> Quay Lại Sảnh Chờ Phòng
                  </button>
                )}
                <button
                  onClick={exitGame}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition border border-slate-700"
                >
                  {isTeacher ? 'Về Quản Trị' : 'Về Trang Chủ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Leaderboard Footer */}
      <div className="shrink-0 w-full bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-2 flex-wrap">
          <span className="truncate">
            Top: {leaderboardPlayers.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.score}đ)`).join(' • ') || 'Chưa có điểm'}
          </span>
          <span className="font-mono text-cyan-400">
            {gameRound === 1 ? 'Chuột / ← → để lái • Click / Space để bắn • [TAB] Nghe' : '[TAB] Nghe lại • [1] Gợi ý • Gõ bàn phím'}
          </span>
        </div>
      </div>
    </div>
  );
}
