import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Coins,
  Flame,
  KeyRound,
  Keyboard,
  Lightbulb,
  Lock,
  Moon,
  Music,
  RefreshCw,
  Snowflake,
  Sparkles,
  Sun,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX
} from 'lucide-react';
import VerticalPodiumLeaderboard from '../common/VerticalPodiumLeaderboard';
import KnightCharacterPage from './KnightCharacterPage';
import KnightGachaModal from './KnightGachaModal';
import KnightPvpArena from './KnightPvpArena';
import {
  canHeroEquipWeapon,
  DEATH_REVIVE_DELAY_SEC,
  DEMON_KING_BOSS,
  getHeroCosmeticWeapon,
  getVietnamMondayWeekState,
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_GACHA_GOLD_SINGLE,
  KNIGHT_GACHA_WEAPONS,
  KNIGHT_HINT_SCORE_COST,
  KNIGHT_MONSTER_STAGES,
  REVIVE_KEY_GOLD_PRICE,
  STARTER_FIRST_GAME_FREE_WISHES,
  applyServerPurchasedWishes,
  computeMonsterGoldDrop,
  computeMonsterKeyDropChance,
  loadLocalKnightRpgProfile,
  rollKnightGachaPulls,
  saveLocalKnightRpgProfile
} from '../../constants/knightRpgData';
import { DEFAULT_VOCAB_TEXT, VOCAB_PRESETS } from '../../constants/seedData';
import {
  buildPracticeRoundQueues,
  getSpeedAdjustedTimeLimit,
  matchRound4TypingAnswer,
  parseRawVocabText
} from '../../utils/examHelpers';
import { playSound, speakWord } from '../../utils/mediaHelpers';
import { KNIGHT_BGM_TRACKS, knightRpgBgm } from '../../utils/knightRpgBgm';
import {
  AIEO_VIP_PRICE_VND,
  formatVndCurrency,
  hasGamePracticeAccess,
  normalizePaymentConfig
} from '../../constants/profileCustomization';

function skipNonAlphaIndex(word, startIdx = 0) {
  const upper = String(word || '').toUpperCase();
  let idx = startIdx;
  while (idx < upper.length && !/^[A-Z]$/.test(upper[idx])) {
    idx += 1;
  }
  return idx;
}

const ALL_SPRITE_URLS = Array.from(
  new Set([
    ...KNIGHT_CHARACTER_SKINS.map(s => s.spriteUrl).filter(Boolean),
    ...KNIGHT_GACHA_WEAPONS.map(w => w.iconUrl).filter(Boolean),
    ...KNIGHT_MONSTER_STAGES.flatMap(st => st.monsters.map(m => m.spriteUrl)).filter(Boolean),
    DEMON_KING_BOSS.spriteUrl
  ])
);

const WHEEL_SECTORS = [
  {
    round: 1,
    shortLabel: 'VÒNG 1',
    title: 'Chọn Khiên Nghĩa',
    desc: 'Đọc nghĩa Việt → Chọn từ tiếng Anh',
    color: '#0ea5e9',
    accent: '#bae6fd'
  },
  {
    round: 2,
    shortLabel: 'VÒNG 2',
    title: 'Gõ Chữ Phá Giáp',
    desc: 'Gõ từng chữ cái tiếng Anh đầy đủ',
    color: '#f59e0b',
    accent: '#fef08a'
  },
  {
    round: 3,
    shortLabel: 'VÒNG 3',
    title: 'Đồng / Trái Nghĩa',
    desc: 'Phản đòn phép Đồng/Trái nghĩa',
    color: '#8b5cf6',
    accent: '#ddd6fe'
  },
  {
    round: 4,
    shortLabel: 'VÒNG 4',
    title: 'Điền Từ Đồ Long',
    desc: 'Đọc câu → Gõ từ/cụm từ chính xác',
    color: '#e11d48',
    accent: '#fecdd3'
  }
];

const DEMON_STAGE_META = {
  round: 5,
  stageTitle: 'BOSS ẨN: MA VƯƠNG HẮC ÁM MALAKOR',
  shortTitle: 'BOSS ẨN: MA VƯƠNG',
  goldPerKill: DEMON_KING_BOSS.rewardGold,
  mechanicLabel: 'Cứ 5 Giây Rút 1 Tim (-1 ❤️) • Chết Bị Phong Ấn Không Thể Hồi Sinh',
  questionDesc: 'Ma Vương quay vòng chọn luật chơi 1 trong 4 vòng!'
};

export default function KnightDragonGame({
  canAccessKnightGame = false,
  currentUser,
  customVocabTopics = [],
  darkMode = false,
  dispatchSyncAction = null,
  gamePracticeLeaderboard = [],
  knightPvpLeaderboard = [],
  knightPvpRealtime = null,
  initialRawVocab = DEFAULT_VOCAB_TEXT,
  initialTopicId = 'core',
  initialTopicLabel = 'IELTS Core Academic',
  initialOpenShop = false,
  knightGachaConfig = null,
  onAdminGrantGachaWishes = null,
  onAdminSetGachaBannerConfig = null,
  onBackToGameHub,
  onBackToSpaceMode,
  onConsumedInitialOpenShop = null,
  onExitArena,
  onOpenCheckoutModal = null,
  onOpenVocabManager = null,
  onSyncKnightResult,
  paymentConfig = null,
  roomPin = '',
  roomRawVocab = '',
  setDarkMode = null,
  showToast,
  usersDb = {}
}) {
  const username = currentUser?.username || 'guest';
  const isStrictAdmin = Boolean(
    currentUser?.isSuperAdmin ||
      currentUser?.isSystemAdmin ||
      currentUser?.role === 'admin' ||
      String(currentUser?.username || '').trim().toLowerCase() === 'tuanpro123s'
  );
  const isTeacherOrAdmin = Boolean(isStrictAdmin || currentUser?.role === 'teacher');

  const [bgmMuted, setBgmMuted] = useState(() => knightRpgBgm.isMuted());

  const [rpgProfile, setRpgProfile] = useState(() =>
    loadLocalKnightRpgProfile(username, currentUser)
  );
  // Sub-page inside Knight RPG: 'MAIN' | 'PVP' | 'CHARACTERS' | 'GACHA' (full pages, NOT modal popups!)
  const [hubSubPage, setHubSubPage] = useState(() => (initialOpenShop ? 'GACHA' : 'MAIN'));
  const [gachaInitialTab, setGachaInitialTab] = useState('character_event');
  const [isGachaCutsceneActive, setIsGachaCutsceneActive] = useState(false);
  const [isPvpFighting, setIsPvpFighting] = useState(false);
  const [starterGiftJustUnlocked, setStarterGiftJustUnlocked] = useState(false);

  useEffect(() => {
    if (initialOpenShop) {
      setHubSubPage('GACHA');
      onConsumedInitialOpenShop?.();
    }
  }, [initialOpenShop, onConsumedInitialOpenShop]);

  // Sync incoming server wish grants / Starter Gift / QR wish purchases in real time without page reload
  const liveServerUser =
    usersDb?.[username] ||
    Object.values(usersDb || {}).find(
      u => u && String(u.username || '').toLowerCase() === String(username || '').toLowerCase()
    ) ||
    currentUser;
  const liveServerWishCredits = Math.max(
    Math.floor(Number(currentUser?.gachaWishCredits) || 0),
    Math.floor(Number(liveServerUser?.gachaWishCredits) || 0)
  );
  const hasKnightPass = Boolean(
    isTeacherOrAdmin ||
      canAccessKnightGame ||
      hasGamePracticeAccess(liveServerUser) ||
      hasGamePracticeAccess(currentUser)
  );
  const knightMonthlyPriceVnd =
    normalizePaymentConfig(paymentConfig || {}).aieoVipPrice ?? AIEO_VIP_PRICE_VND;

  const promptBuyKnightMonthlyPass = () => {
    if (!currentUser?.username || currentUser?.isGuest) {
      showToast?.(
        `Vui lòng đăng nhập và đăng ký Thẻ Tháng (${formatVndCurrency(knightMonthlyPriceVnd)}/tháng) để chơi Hiệp Sĩ Diệt Rồng!`,
        'error'
      );
      return;
    }
    showToast?.(
      `Vui lòng đăng ký Thẻ Tháng (${formatVndCurrency(knightMonthlyPriceVnd)}/tháng) để chơi Hiệp Sĩ Diệt Rồng!`,
      'info'
    );
    onOpenCheckoutModal?.({
      itemType: 'aieo_vip',
      itemId: '',
      itemLabel: 'Thẻ Tháng Hiệp Sĩ Diệt Rồng (1 Tháng)',
      itemPrice: knightMonthlyPriceVnd
    });
  };
  const liveStarterGiftClaimed = Boolean(
    currentUser?.starterFirstGameGiftClaimed ||
      liveServerUser?.starterFirstGameGiftClaimed ||
      currentUser?.knightRpgProfile?.firstGameGiftClaimed ||
      liveServerUser?.knightRpgProfile?.firstGameGiftClaimed
  );
  const isStarterGiftUnclaimed = Boolean(
    !rpgProfile?.firstGameGiftClaimed && !liveStarterGiftClaimed
  );
  useEffect(() => {
    if (!username || username === 'guest') return;
    if (
      liveServerWishCredits > (rpgProfile.claimedServerWishCredits || 0) ||
      (liveStarterGiftClaimed && !rpgProfile.firstGameGiftClaimed)
    ) {
      setRpgProfile(prev => {
        const credited = applyServerPurchasedWishes(prev, {
          gachaWishCredits: liveServerWishCredits,
          starterFirstGameGiftClaimed: liveStarterGiftClaimed
        });
        return saveLocalKnightRpgProfile(username, credited);
      });
    }
  }, [
    username,
    liveServerWishCredits,
    liveStarterGiftClaimed,
    rpgProfile.claimedServerWishCredits,
    rpgProfile.firstGameGiftClaimed
  ]);
  const [topicId, setTopicId] = useState(initialTopicId || 'core');
  const [roundSize, setRoundSize] = useState(8);
  const [speedMode, setSpeedMode] = useState('normal');

  // Match state:
  // 'HUB' | 'PLAYING' | 'DEATH_COUNTDOWN' | 'REVIVE_PROMPT' | 'FINAL_SMASH' |
  // 'DEMON_WARNING' | 'DEMON_WHEEL' | 'DEMON_EXECUTION' | 'TRANSITION' | 'GAMEOVER'
  const [matchState, setMatchState] = useState('HUB');

  useEffect(() => {
    const st = knightPvpRealtime?.activeMatch?.status;
    if ((st === 'READY_CHECK' || st === 'PLAYING') && matchState === 'HUB') {
      setHubSubPage('PVP');
    }
  }, [knightPvpRealtime?.activeMatch?.status, matchState]);
  const [round, setRound] = useState(1);
  const [singleRoundOnly, setSingleRoundOnly] = useState(false);
  const [queues, setQueues] = useState({ 1: [], 2: [], 3: [], 4: [], 5: [] });
  const [wordIdx, setWordIdx] = useState(0);
  const [activeQ, setActiveQ] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(22);
  const [timeLimit, setTimeLimit] = useState(22);
  const [typedProgress, setTypedProgress] = useState(0);
  const [round4Input, setRound4Input] = useState('');
  const [freezeCharges, setFreezeCharges] = useState(2);
  const [reviveUsedCount, setReviveUsedCount] = useState(0);
  const [sessionGoldEarned, setSessionGoldEarned] = useState(0);
  const [sessionKeysEarned, setSessionKeysEarned] = useState(0);
  const [sessionMonstersSlain, setSessionMonstersSlain] = useState(0);
  const [sessionDragonsSlain, setSessionDragonsSlain] = useState(0);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [finalSmashReason, setFinalSmashReason] = useState('');
  const [reviewLog, setReviewLog] = useState([]);

  // 5-second Death Delay before Revive modal appears
  const [deathCountdownSec, setDeathCountdownSec] = useState(DEATH_REVIVE_DELAY_SEC);
  const [reviveCelebration, setReviveCelebration] = useState(null);

  // Secret Demon King Boss states
  const [demonWarningSec, setDemonWarningSec] = useState(DEMON_KING_BOSS.warningDurationSec);
  const [pacmanFlashTick, setPacmanFlashTick] = useState(0);
  const [demonWheelStyle, setDemonWheelStyle] = useState(1);
  const [demonWheelRotation, setDemonWheelRotation] = useState(0);
  const [demonWheelSettled, setDemonWheelSettled] = useState(false);
  const [demonCurseLeft, setDemonCurseLeft] = useState(DEMON_KING_BOSS.curseIntervalSec);
  const [demonKingDefeated, setDemonKingDefeated] = useState(false);
  const [cannotReviveByDemon, setCannotReviveByDemon] = useState(false);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const demonCurseTimerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const phaseIntervalRef = useRef(null);
  const animRef = useRef(null);
  const spriteImagesRef = useRef(new Map());

  const runtimeRef = useRef({
    lane: 1,
    heroAttackAnim: 0,
    monsterAttackAnim: 0,
    monsterHitAnim: 0,
    knightHurtAnim: 0,
    dragonFireAnim: 0,
    demonCurseAnim: 0,
    finalSmashAnim: 0,
    tombstoneDropAnim: 0,
    reviveBeamAnim: 0,
    tombstoneShards: [],
    screenShake: 0,
    roadOffset: 0,
    slashes: [],
    droppedCoins: [],
    droppedKeys: [],
    floatingTexts: [],
    particles: [],
    timeRemainingFloat: 22,
    timeLimit: 22,
    curseRemainingFloat: DEMON_KING_BOSS.curseIntervalSec,
    round4MatchRatio: 0,
    typedProgress: 0,
    round: 1,
    demonWheelStyle: 1,
    matchState: 'HUB',
    questionResolved: false,
    reviveBusy: false,
    lastWrongAt: 0,
    matchId: '',
    lives: 3,
    score: 0,
    combo: 0
  });
  const reviveCelebrationTimerRef = useRef(null);

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearInterval(demonCurseTimerRef.current);
    clearTimeout(phaseTimerRef.current);
    clearInterval(phaseIntervalRef.current);
    clearTimeout(reviveCelebrationTimerRef.current);
  };

  useEffect(
    () => () => {
      clearAllTimers();
      knightRpgBgm.stop();
    },
    []
  );

  // Per-page & per-stage procedural RPG Background Music (BGM) switcher
  // Immediately mutes BGM during Gacha Summon Cutscene!
  const activeBgmTrackId = isGachaCutsceneActive
    ? null
    : matchState === 'HUB'
    ? hubSubPage === 'GACHA'
      ? 'gacha'
      : hubSubPage === 'CHARACTERS'
      ? 'roster'
      : hubSubPage === 'PVP'
      ? isPvpFighting
        ? 'pvp_battle'
        : 'pvp_lobby'
      : 'hub'
    : matchState === 'DEMON_WARNING'
    ? 'demon_warning'
    : matchState === 'DEMON_WHEEL' || (round === 5 && matchState === 'PLAYING')
    ? 'stage5'
    : matchState === 'PLAYING' || matchState === 'TRANSITION' || matchState === 'FINAL_SMASH'
    ? `stage${Math.min(5, Math.max(1, Number(round) || 1))}`
    : null;

  useEffect(() => {
    if (bgmMuted || !activeBgmTrackId) {
      knightRpgBgm.stop();
      return;
    }
    knightRpgBgm.setTrack(activeBgmTrackId);
  }, [activeBgmTrackId, bgmMuted]);

  useEffect(() => {
    const unlockAudio = () => {
      if (!bgmMuted) {
        knightRpgBgm.unlock();
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [bgmMuted]);

  const handleToggleBgm = () => {
    const nextMuted = !bgmMuted;
    setBgmMuted(nextMuted);
    knightRpgBgm.setMuted(nextMuted);
    if (!nextMuted && activeBgmTrackId) {
      knightRpgBgm.setTrack(activeBgmTrackId);
      knightRpgBgm.unlock();
    }
  };

  // Preload all 19 RPG Hero, Monster, Dragon & Secret Demon King sprites for 60 FPS canvas
  useEffect(() => {
    const cache = spriteImagesRef.current;
    ALL_SPRITE_URLS.forEach(url => {
      if (cache.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      cache.set(url, img);
    });
  }, []);

  const isDemonKingBattle = round === 5;
  const effectiveCombatRound = isDemonKingBattle ? demonWheelStyle : round;

  const activeSkin =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === rpgProfile.equippedSkin) ||
    KNIGHT_CHARACTER_SKINS[0];
  const activeWeapon = getHeroCosmeticWeapon(rpgProfile, activeSkin);
  const stageMeta = isDemonKingBattle
    ? DEMON_STAGE_META
    : KNIGHT_MONSTER_STAGES.find(s => s.round === round) || KNIGHT_MONSTER_STAGES[0];
  const currentMonster = isDemonKingBattle
    ? DEMON_KING_BOSS
    : stageMeta.monsters[wordIdx % stageMeta.monsters.length] || stageMeta.monsters[0];

  const expectedMonsterGold = computeMonsterGoldDrop(
    currentMonster,
    activeSkin,
    combo
  );

  // Sync key numeric states to runtimeRef safely inside effect
  useEffect(() => {
    runtimeRef.current.lives = lives;
    runtimeRef.current.score = score;
    runtimeRef.current.combo = combo;
    runtimeRef.current.round = round;
    runtimeRef.current.demonWheelStyle = demonWheelStyle;
    runtimeRef.current.matchState = matchState;
  }, [lives, score, combo, round, demonWheelStyle, matchState]);

  const updateAndPersistProfile = (updater) => {
    setRpgProfile(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return saveLocalKnightRpgProfile(username, next);
    });
  };

  const resolveSelectedRawVocab = () => {
    if (topicId === 'room_custom' && roomRawVocab) return roomRawVocab;
    if (String(topicId).startsWith('custom:')) {
      const found = (customVocabTopics || []).find(t => `custom:${t.id}` === topicId);
      if (found?.text) return found.text;
    }
    return VOCAB_PRESETS?.[topicId]?.text || initialRawVocab || DEFAULT_VOCAB_TEXT;
  };

  const resolveSelectedTopicLabel = () => {
    if (topicId === 'room_custom') return `Phòng Đấu #${roomPin || 'Live'}`;
    if (String(topicId).startsWith('custom:')) {
      const found = (customVocabTopics || []).find(t => `custom:${t.id}` === topicId);
      if (found?.label) return found.label;
    }
    return VOCAB_PRESETS?.[topicId]?.label || initialTopicLabel || 'IELTS Core Academic';
  };

  const spawnFloatingText = (text, color = '#fbbf24', xRatio = 0.5, yRatio = 0.45) => {
    runtimeRef.current.floatingTexts.push({
      id: `${Date.now()}_${Math.random()}`,
      text,
      color,
      xRatio,
      yRatio,
      alpha: 1,
      vy: -1.35
    });
  };

  const spawnBurstParticles = (xRatio = 0.5, yRatio = 0.35, color = '#fbbf24', count = 20) => {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const speed = 1.8 + Math.random() * 4.5;
      runtimeRef.current.particles.push({
        xRatio,
        yRatio,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.2 + Math.random() * 3.4,
        color,
        alpha: 1
      });
    }
  };

  // Multi-layered anime RPG sword slash arcs tailored per hero weapon style
  const spawnHeroSlashEffects = (isHeavyKill = false) => {
    const rt = runtimeRef.current;
    rt.heroAttackAnim = 1;
    rt.monsterHitAnim = isHeavyKill ? 1 : 0.78;
    rt.screenShake = isHeavyKill ? 9 : 4;

    const style = activeSkin.slashStyle || 'holy';
    const primaryColor = activeWeapon?.slashColor || activeSkin.slashColor || '#38bdf8';
    const slashCount = isHeavyKill ? 3 : 2;
    const baseAngles = isHeavyKill ? [-0.62, 0.54, -0.14] : [-0.55, 0.48];

    for (let i = 0; i < slashCount; i += 1) {
      rt.slashes.push({
        id: `${Date.now()}_${i}_${Math.random()}`,
        angle: baseAngles[i] + (Math.random() - 0.5) * 0.16,
        offsetX: (Math.random() - 0.5) * 34,
        offsetY: (Math.random() - 0.5) * 34,
        radius: isHeavyKill ? 68 + i * 10 : 48 + i * 8,
        color: primaryColor,
        bladeColor: activeSkin.bladeColor || primaryColor,
        style,
        age: 0,
        maxAge: isHeavyKill ? 24 : 16,
        delay: i * 3
      });
    }

    // Extra style-themed slash sparks
    if (style === 'sakura') {
      spawnBurstParticles(0.73, 0.5, '#f9a8d4', isHeavyKill ? 26 : 10);
    } else if (style === 'thunder') {
      spawnBurstParticles(0.73, 0.48, '#7dd3fc', isHeavyKill ? 28 : 12);
    } else if (style === 'magma' || style === 'dragon') {
      spawnBurstParticles(0.73, 0.5, '#fb923c', isHeavyKill ? 30 : 12);
    } else if (style === 'solar') {
      spawnBurstParticles(0.73, 0.48, '#fde047', isHeavyKill ? 28 : 12);
    } else {
      spawnBurstParticles(0.73, 0.5, primaryColor, isHeavyKill ? 26 : 10);
    }
  };

  // Physical Gold Coins burst ONLY out of struck/slain monsters
  const spawnMonsterCoinDrops = (coinCount = 8) => {
    const coins = runtimeRef.current.droppedCoins || [];
    for (let i = 0; i < coinCount; i += 1) {
      coins.push({
        id: `${Date.now()}_${i}_${Math.random()}`,
        xRatio: 0.72 + (Math.random() - 0.5) * 0.08,
        yRatio: 0.5 + (Math.random() - 0.5) * 0.08,
        vx: -2.0 - Math.random() * 2.8,
        vy: -3.8 - Math.random() * 3.0,
        age: 0,
        alpha: 1
      });
    }
    runtimeRef.current.droppedCoins = coins;
  };

  // Rare Revive Key (🗝️) physically bursts ONLY out of slain monsters
  const spawnMonsterKeyDrop = (count = 1) => {
    const keys = runtimeRef.current.droppedKeys || [];
    for (let i = 0; i < count; i += 1) {
      keys.push({
        id: `${Date.now()}_key_${i}_${Math.random()}`,
        xRatio: 0.72 + (Math.random() - 0.5) * 0.08,
        yRatio: 0.44 + (Math.random() - 0.5) * 0.06,
        vx: -2.0 - Math.random() * 1.8,
        vy: -4.6 - Math.random() * 1.8,
        age: 0,
        alpha: 1
      });
    }
    runtimeRef.current.droppedKeys = keys;
  };

  const showQuickBanner = (text, kind = 'success') => {
    setBannerAlert({ text, kind });
  };

  const setupQuestionClock = (combatRoundNum, qObj) => {
    const baseLim = getSpeedAdjustedTimeLimit(combatRoundNum, speedMode);
    const skinBonus = Number(activeSkin.bonusTimeSec) || 0;
    const lim = baseLim + skinBonus;
    setTimeLimit(lim);
    setTimeLeft(lim);
    runtimeRef.current.timeLimit = lim;
    runtimeRef.current.timeRemainingFloat = lim;
    runtimeRef.current.round4MatchRatio = 0;
    runtimeRef.current.questionResolved = false;
    setRound4Input('');
    const initTyped = qObj ? skipNonAlphaIndex(qObj.word, 0) : 0;
    setTypedProgress(initTyped);
    runtimeRef.current.typedProgress = initTyped;
  };

  const finalizeMatchAndSync = (finalScoreVal, latestProfile, extraMode = '') => {
    if (runtimeRef.current.matchState === 'GAMEOVER') return;
    clearAllTimers();
    setMatchState('GAMEOVER');
    runtimeRef.current.matchState = 'GAMEOVER';
    runtimeRef.current.questionResolved = true;
    const alreadyClaimedGift = Boolean(
      latestProfile?.firstGameGiftClaimed ||
        rpgProfile?.firstGameGiftClaimed ||
        liveStarterGiftClaimed
    );
    let syncedProfile = latestProfile;
    if (!alreadyClaimedGift) {
      setStarterGiftJustUnlocked(true);
      if (!username || username === 'guest' || currentUser?.isGuest) {
        syncedProfile = saveLocalKnightRpgProfile(username, {
          ...latestProfile,
          firstGameGiftClaimed: true,
          wishes: (Number(latestProfile?.wishes) || 0) + STARTER_FIRST_GAME_FREE_WISHES
        });
        setRpgProfile(syncedProfile);
      }
      showToast?.(
        `🎁 Quà Tân Thủ: Hoàn thành game đầu tiên — Tặng +${STARTER_FIRST_GAME_FREE_WISHES} Lượt Quay Gacha miễn phí!`,
        'success'
      );
    }
    const passedCount = reviewLog.filter(item => item.passed).length;
    const totalCount = Math.max(1, reviewLog.length);
    const currentMatchId =
      runtimeRef.current.matchId || `krpg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    onSyncKnightResult?.({
      matchId: currentMatchId,
      score: finalScoreVal,
      passedCount,
      totalCount,
      topicId,
      topicLabel: resolveSelectedTopicLabel(),
      mode: extraMode || (singleRoundOnly ? `knight_round_${round}` : 'knight_full_4'),
      gameType: 'knight_rpg',
      gameCompleted: true,
      knightRpgProfile: syncedProfile
    });
  };

  // Start the 5-second countdown with Tombstone ("Bia Mộ") drop animation before displaying the Revive Modal
  const startDeathDelayBeforeRevive = () => {
    clearAllTimers();
    setDeathCountdownSec(DEATH_REVIVE_DELAY_SEC);
    setMatchState('DEATH_COUNTDOWN');
    runtimeRef.current.matchState = 'DEATH_COUNTDOWN';
    runtimeRef.current.tombstoneDropAnim = 0.01;
    runtimeRef.current.reviveBeamAnim = 0;
    runtimeRef.current.screenShake = 11;
    spawnBurstParticles(0.23, 0.76, '#94a3b8', 26);
    spawnFloatingText('🪦 BIA MỘ HIỆP SĨ...', '#cbd5e1', 0.24, 0.48);

    let remaining = DEATH_REVIVE_DELAY_SEC;
    phaseIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setDeathCountdownSec(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(phaseIntervalRef.current);
        setMatchState('REVIVE_PROMPT');
        runtimeRef.current.matchState = 'REVIVE_PROMPT';
      }
    }, 1000);
  };

  // Trigger Demon King's Unrevivable Soul-Seal Execution Finisher -> straight to GAMEOVER
  const triggerDemonKingUnrevivableExecution = (latestScore) => {
    clearAllTimers();
    setLives(0);
    runtimeRef.current.lives = 0;
    setCannotReviveByDemon(true);
    setMatchState('DEMON_EXECUTION');
    runtimeRef.current.matchState = 'DEMON_EXECUTION';
    runtimeRef.current.demonCurseAnim = 1;
    runtimeRef.current.screenShake = 16;
    playSound('wrong');
    spawnBurstParticles(0.24, 0.62, '#c026d3', 46);
    spawnBurstParticles(0.24, 0.62, '#f43f5e', 30);

    let latestProf = rpgProfile;
    updateAndPersistProfile(prev => {
      latestProf = {
        ...prev,
        bestScore: Math.max(prev.bestScore || 0, latestScore)
      };
      return latestProf;
    });

    phaseTimerRef.current = setTimeout(() => {
      finalizeMatchAndSync(latestScore, latestProf, 'knight_demon_king_failed');
    }, 3200);
  };

  // Secret Demon King Boss Sequence: 3s Pac-Man Warning (+5 Hearts) -> Spinning Wheel -> Stage 5 Boss Battle
  const beginDemonKingEncounter = (builtQueuesSource) => {
    clearAllTimers();
    const activeQueues = builtQueuesSource || queues;

    // 1. Grant 5 lives & launch 3-second Pac-Man flashing warning
    setLives(DEMON_KING_BOSS.grantedLives);
    runtimeRef.current.lives = DEMON_KING_BOSS.grantedLives;
    setRound(5);
    runtimeRef.current.round = 5;
    setCannotReviveByDemon(false);
    setDemonKingDefeated(false);
    setDemonWarningSec(DEMON_KING_BOSS.warningDurationSec);
    setPacmanFlashTick(0);
    setMatchState('DEMON_WARNING');
    runtimeRef.current.matchState = 'DEMON_WARNING';
    runtimeRef.current.screenShake = 10;
    playSound('wrong');

    let ticks = 0;
    phaseIntervalRef.current = setInterval(() => {
      ticks += 1;
      setPacmanFlashTick(ticks);
      const secLeft = Math.max(1, DEMON_KING_BOSS.warningDurationSec - Math.floor((ticks * 150) / 1000));
      setDemonWarningSec(secLeft);
      if (ticks % 4 === 0) playSound('type_hit');
    }, 150);

    // 2. After exact 6 seconds -> Spin the 4-Round Demon Wheel
    phaseTimerRef.current = setTimeout(() => {
      clearInterval(phaseIntervalRef.current);

      const forcedWheel =
        typeof window !== 'undefined' && [1, 2, 3, 4].includes(Number(window.__FORCE_DEMON_WHEEL_ROUND__))
          ? Number(window.__FORCE_DEMON_WHEEL_ROUND__)
          : null;
      const chosenStyle = forcedWheel || (Math.floor(Math.random() * 4) + 1);
      setDemonWheelStyle(chosenStyle);
      runtimeRef.current.demonWheelStyle = chosenStyle;
      setDemonWheelSettled(false);
      setDemonWheelRotation(0);
      setMatchState('DEMON_WHEEL');
      runtimeRef.current.matchState = 'DEMON_WHEEL';

      // Target sector center angle aligned to top pointer (0deg):
      // Sector 1: 0..90 (center 45 -> rotate -45 => 315)
      // Sector 2: 90..180 (center 135 -> rotate 225)
      // Sector 3: 180..270 (center 225 -> rotate 135)
      // Sector 4: 270..360 (center 315 -> rotate 45)
      const targetAngleMap = { 1: 315, 2: 225, 3: 135, 4: 45 };
      const finalDeg = 5 * 360 + (targetAngleMap[chosenStyle] || 315);

      requestAnimationFrame(() => {
        setDemonWheelRotation(finalDeg);
      });

      // Settle wheel after 2.3s, show chosen mechanic for 0.9s, then enter Stage 5 Battle!
      phaseTimerRef.current = setTimeout(() => {
        setDemonWheelSettled(true);
        playSound('word_clear');

        phaseTimerRef.current = setTimeout(() => {
          const sourceList = activeQueues[chosenStyle] || activeQueues[1] || [];
          const demonQueue = sourceList.slice(0, Math.min(3, Math.max(1, sourceList.length)));
          const firstDemonQ = demonQueue[0] || null;

          setQueues(prev => ({
            ...prev,
            5: demonQueue
          }));
          setWordIdx(0);
          setActiveQ(firstDemonQ);
          setDemonCurseLeft(DEMON_KING_BOSS.curseIntervalSec);
          runtimeRef.current.curseRemainingFloat = DEMON_KING_BOSS.curseIntervalSec;
          setMatchState('PLAYING');
          runtimeRef.current.matchState = 'PLAYING';
          setupQuestionClock(chosenStyle, firstDemonQ);
          showQuickBanner(
            `👿 MA VƯƠNG MALAKOR CHỌN LUẬT VÒNG ${chosenStyle}! Cẩn thận: cứ 5 giây mất 1 tim (-1 ❤️)!`,
            'error'
          );

          if (firstDemonQ) {
            if (chosenStyle === 2) speakWord(firstDemonQ.word);
            else if (chosenStyle === 4) {
              speakWord(firstDemonQ.v4Display || firstDemonQ.collocation || firstDemonQ.word);
            }
          }
        }, 900);
      }, 2300);
    }, DEMON_KING_BOSS.warningDurationSec * 1000);
  };

  const startKnightCampaign = (startRoundNum = 1, onlyOneRound = false) => {
    if (!hasKnightPass) {
      promptBuyKnightMonthlyPass();
      return;
    }
    clearAllTimers();
    const rawVocab = resolveSelectedRawVocab();
    const builtQueues = buildPracticeRoundQueues({
      rawVocab,
      roundSize: Math.max(1, Math.min(100, Number(roundSize) || 8)),
      selectedWords: [],
      seedStr: `knight:${username}:${Date.now()}`
    });

    // Strict role guard: Teacher & Admin can practice Stages 1–4; students always start from Stage 1
    const rNum =
      isTeacherOrAdmin && [1, 2, 3, 4].includes(Number(startRoundNum)) ? Number(startRoundNum) : 1;
    const safeOnlyOne = isTeacherOrAdmin ? Boolean(onlyOneRound) : false;
    const firstQ = builtQueues[rNum]?.[0] || null;

    setQueues({ ...builtQueues, 5: [] });
    setRound(rNum);
    setSingleRoundOnly(safeOnlyOne);
    setWordIdx(0);
    setActiveQ(firstQ);
    setScore(0);
    setCombo(0);
    setLives(3);
    setFreezeCharges(2);
    setReviveUsedCount(0);
    setSessionGoldEarned(0);
    setSessionKeysEarned(0);
    setSessionMonstersSlain(0);
    setSessionDragonsSlain(0);
    setDemonKingDefeated(false);
    setCannotReviveByDemon(false);
    setStarterGiftJustUnlocked(false);
    setReviewLog([]);
    setBannerAlert(null);
    setMatchState('PLAYING');

    runtimeRef.current.round = rNum;
    runtimeRef.current.matchState = 'PLAYING';
    runtimeRef.current.questionResolved = false;
    runtimeRef.current.reviveBusy = false;
    runtimeRef.current.lastWrongAt = 0;
    runtimeRef.current.matchId = `krpg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    runtimeRef.current.lives = 3;
    runtimeRef.current.score = 0;
    runtimeRef.current.combo = 0;
    runtimeRef.current.droppedCoins = [];
    runtimeRef.current.droppedKeys = [];
    runtimeRef.current.slashes = [];
    runtimeRef.current.dragonFireAnim = 0;
    runtimeRef.current.demonCurseAnim = 0;
    runtimeRef.current.monsterAttackAnim = 0;
    runtimeRef.current.heroAttackAnim = 0;
    runtimeRef.current.finalSmashAnim = 0;
    runtimeRef.current.tombstoneDropAnim = 0;
    runtimeRef.current.reviveBeamAnim = 0;
    runtimeRef.current.tombstoneShards = [];
    runtimeRef.current.screenShake = 0;
    setReviveCelebration(null);
    setupQuestionClock(rNum, firstQ);

    if (firstQ) {
      if (rNum === 2) speakWord(firstQ.word);
      else if (rNum === 4) speakWord(firstQ.v4Display || firstQ.collocation || firstQ.word);
    }
  };

  // STRICTLY Admin-only launcher to test the Secret Boss (Teachers can only test Stages 1–4)
  const handleAdminStartDemonKingTest = () => {
    if (!isStrictAdmin) return;
    clearAllTimers();
    const rawVocab = resolveSelectedRawVocab();
    const builtQueues = buildPracticeRoundQueues({
      rawVocab,
      roundSize: Math.max(1, Math.min(100, Number(roundSize) || 8)),
      selectedWords: [],
      seedStr: `knight_demon_test:${username}:${Date.now()}`
    });
    setQueues({ ...builtQueues, 5: [] });
    setSingleRoundOnly(true);
    setScore(0);
    setCombo(0);
    setFreezeCharges(2);
    setReviveUsedCount(0);
    setSessionGoldEarned(0);
    setSessionKeysEarned(0);
    setSessionMonstersSlain(0);
    setSessionDragonsSlain(0);
    setReviewLog([]);
    setBannerAlert(null);
    runtimeRef.current.score = 0;
    runtimeRef.current.combo = 0;
    runtimeRef.current.questionResolved = false;
    runtimeRef.current.reviveBusy = false;
    runtimeRef.current.matchId = `krpg_demon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    runtimeRef.current.droppedCoins = [];
    runtimeRef.current.droppedKeys = [];
    runtimeRef.current.slashes = [];
    beginDemonKingEncounter(builtQueues);
  };

  const recordWordAttempt = (qObj, rNum, passed) => {
    if (!qObj) return;
    setReviewLog(prev => [
      ...prev,
      {
        round: rNum,
        word: qObj.word,
        ipa: qObj.ipa || '',
        prompt: qObj.prompt || '',
        passed
      }
    ]);
  };

  const rewardDemonKingVictory = (finalScoreVal) => {
    const goldGain = DEMON_KING_BOSS.rewardGold;
    const keyGain = DEMON_KING_BOSS.rewardKeys;
    setSessionGoldEarned(prev => prev + goldGain);
    setSessionKeysEarned(prev => prev + keyGain);
    setSessionMonstersSlain(prev => prev + 1);
    setDemonKingDefeated(true);

    let syncedProfile = rpgProfile;
    updateAndPersistProfile(prev => {
      syncedProfile = {
        ...prev,
        gold: (prev.gold || 0) + goldGain,
        keys: (prev.keys || 0) + keyGain,
        keysCollected: (prev.keysCollected || 0) + keyGain,
        monstersSlain: (prev.monstersSlain || 0) + 1,
        demonKingsSlain: (prev.demonKingsSlain || 0) + 1,
        bestScore: Math.max(prev.bestScore || 0, finalScoreVal)
      };
      return syncedProfile;
    });

    spawnMonsterCoinDrops(22);
    spawnMonsterKeyDrop(5);
    spawnBurstParticles(0.72, 0.44, '#e879f9', 48);
    spawnBurstParticles(0.5, 0.32, '#fde047', 42);
    spawnFloatingText(`+1.000 🪙 Vàng & +10 🗝️ Chìa Khóa!`, '#fde047', 0.52, 0.28);
    spawnFloatingText('👿 MỞ KHÓA DANH HIỆU ẨN: DIỆT MA VƯƠNG!', '#f0abfc', 0.52, 0.18);
    showToast?.(
      '👿 CHIẾN THẮNG BOSS MA VƯƠNG ẨN! Nhận +1.000 🪙 Vàng, +10 🗝️ Chìa Khóa & Danh Hiệu Ẩn "Diệt Ma Vương"!'
    );

    finalizeMatchAndSync(finalScoreVal, syncedProfile, 'knight_demon_king_clear');
  };

  const advanceToNextMonsterOrStage = (latestScore) => {
    const curQueue = queues[round] || [];
    const nextIdx = wordIdx + 1;
    if (nextIdx < curQueue.length) {
      const nextQ = curQueue[nextIdx];
      setWordIdx(nextIdx);
      setActiveQ(nextQ);
      setupQuestionClock(effectiveCombatRound, nextQ);
      if (effectiveCombatRound === 2) speakWord(nextQ.word);
      else if (effectiveCombatRound === 4) {
        speakWord(nextQ.v4Display || nextQ.collocation || nextQ.word);
      }
      return;
    }

    // Cleared Secret Demon King Boss!
    if (round === 5) {
      rewardDemonKingVictory(latestScore);
      return;
    }

    if (round < 4 && !singleRoundOnly) {
      setMatchState('TRANSITION');
      runtimeRef.current.matchState = 'TRANSITION';
      return;
    }

    // Defeated Stage 4 Dragon Boss -> 5% chance to summon Secret Demon King Boss!
    if (round === 4) {
      const disableRandom =
        typeof window !== 'undefined' && Boolean(window.__DISABLE_RANDOM_DEMON_KING__);
      const forceDemon =
        typeof window !== 'undefined' && Boolean(window.__FORCE_DEMON_KING__);
      const rolledDemon = forceDemon || (!disableRandom && Math.random() < DEMON_KING_BOSS.spawnChance);

      if (rolledDemon) {
        beginDemonKingEncounter(queues);
        return;
      }
    }

    // Completed campaign normally!
    let syncedProfile = rpgProfile;
    updateAndPersistProfile(prev => {
      syncedProfile = {
        ...prev,
        bestScore: Math.max(prev.bestScore || 0, latestScore)
      };
      return syncedProfile;
    });
    finalizeMatchAndSync(latestScore, syncedProfile);
  };

  const rewardMonsterKill = (isDragonBoss = false) => {
    if (round === 5) {
      // Mid-phase slash reward on Demon King (full 1000g + 10 keys granted on final kill)
      spawnMonsterCoinDrops(6);
      spawnFloatingText('⚔️ Chém Trúng Ma Vương!', '#f0abfc', 0.68, 0.34);
      return { goldGain: 0, droppedKey: 0 };
    }

    const goldGain = computeMonsterGoldDrop(
      currentMonster,
      activeSkin,
      combo
    );
    const keyChance = computeMonsterKeyDropChance(currentMonster, activeSkin);
    const droppedKey = Math.random() < keyChance ? 1 : 0;

    setSessionGoldEarned(prev => prev + goldGain);
    if (droppedKey > 0) {
      setSessionKeysEarned(prev => prev + droppedKey);
    }
    setSessionMonstersSlain(prev => prev + 1);
    if (isDragonBoss) {
      setSessionDragonsSlain(prev => prev + 1);
    }

    updateAndPersistProfile(prev => ({
      ...prev,
      gold: (prev.gold || 0) + goldGain,
      keys: (prev.keys || 0) + droppedKey,
      keysCollected: (prev.keysCollected || 0) + droppedKey,
      monstersSlain: (prev.monstersSlain || 0) + 1,
      dragonsSlain: (prev.dragonsSlain || 0) + (isDragonBoss ? 1 : 0),
      bestScore: Math.max(prev.bestScore || 0, score + 200)
    }));

    spawnMonsterCoinDrops(isDragonBoss ? 14 : 7);
    spawnFloatingText(`+${goldGain} 🪙 Vàng Rớt Từ Quái!`, '#fbbf24', 0.68, 0.34);
    if (droppedKey > 0) {
      spawnMonsterKeyDrop(1);
      spawnBurstParticles(0.72, 0.44, '#38bdf8', 24);
      spawnFloatingText('+1 🗝️ Quái Rớt Chìa Khóa Hồi Sinh (Hiếm)!', '#38bdf8', 0.56, 0.22);
    }
    return { goldGain, droppedKey };
  };

  const triggerDragonFinalSmashOrLifeLoss = (reason, isTimeoutOnDragon = false) => {
    const currentLives = runtimeRef.current.lives;
    const nextLives = isTimeoutOnDragon ? 0 : Math.max(0, currentLives - 1);
    setCombo(0);
    runtimeRef.current.combo = 0;
    playSound('wrong');
    runtimeRef.current.knightHurtAnim = 1;
    runtimeRef.current.screenShake = 8;

    if (round === 5) {
      runtimeRef.current.demonCurseAnim = 1;
    } else if (round === 4 || isTimeoutOnDragon) {
      runtimeRef.current.dragonFireAnim = 1;
    } else {
      runtimeRef.current.monsterAttackAnim = 1;
    }
    spawnBurstParticles(0.25, 0.66, round === 5 ? '#c026d3' : '#ef4444', 24);

    if (activeQ) {
      recordWordAttempt(activeQ, effectiveCombatRound, false);
    }

    // Demon King Boss Death -> Unrevivable Execution Finisher!
    if (round === 5 && nextLives <= 0) {
      triggerDemonKingUnrevivableExecution(runtimeRef.current.score);
      return;
    }

    if (isTimeoutOnDragon && round === 4) {
      // Super Smash Bros. FINAL SMASH Finisher -> then 5-second Death Countdown -> Revive Modal
      clearAllTimers();
      setLives(0);
      runtimeRef.current.lives = 0;
      setFinalSmashReason(reason);
      setMatchState('FINAL_SMASH');
      runtimeRef.current.matchState = 'FINAL_SMASH';
      runtimeRef.current.finalSmashAnim = 1;
      phaseTimerRef.current = setTimeout(() => {
        startDeathDelayBeforeRevive();
      }, 2100);
      return;
    }

    setLives(nextLives);
    runtimeRef.current.lives = nextLives;
    showQuickBanner(reason, 'error');

    if (nextLives <= 0) {
      startDeathDelayBeforeRevive();
    }
  };

  // Per-question timer
  useEffect(() => {
    clearInterval(timerRef.current);
    if (matchState !== 'PLAYING' || !activeQ) return undefined;

    let lastTick = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const nextRem = Math.max(0, runtimeRef.current.timeRemainingFloat - dt);
      runtimeRef.current.timeRemainingFloat = nextRem;
      setTimeLeft(Math.ceil(nextRem));

      if (nextRem <= 0) {
        clearInterval(timerRef.current);
        const correctAns =
          effectiveCombatRound === 4
            ? activeQ.v4Display || activeQ.collocation || activeQ.word
            : effectiveCombatRound === 3
            ? activeQ.v3Target || activeQ.word
            : activeQ.word;

        if (round === 4) {
          triggerDragonFinalSmashOrLifeLoss(
            `🐉 QUÁ GIỜ! RỒNG HẮC ÁM TUNG SKILL TẤT SÁT "LONG HỎA DIỆT THẾ"! (Đáp án: "${correctAns}")`,
            true
          );
        } else if (round === 5) {
          // Reset question clock if still alive after Demon King timeout hit
          triggerDragonFinalSmashOrLifeLoss(
            `👿 Hết giờ! Ma Vương Malakor chém phản công (-1 ❤️)! (Đáp án: "${correctAns}")`,
            false
          );
          if (runtimeRef.current.lives > 0) {
            setupQuestionClock(effectiveCombatRound, activeQ);
          }
        } else {
          triggerDragonFinalSmashOrLifeLoss(
            `⏰ Quá thời gian! ${currentMonster.name} lao tới tấn công! (Đáp án: "${correctAns}")`,
            false
          );
          if (runtimeRef.current.lives > 0) {
            setupQuestionClock(effectiveCombatRound, activeQ);
          }
        }
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [matchState, round, demonWheelStyle, wordIdx, activeQ]);

  // Secret Demon King 5-Second Curse Heart Drain Loop (-1 ❤️ every 5s!)
  useEffect(() => {
    clearInterval(demonCurseTimerRef.current);
    if (matchState !== 'PLAYING' || round !== 5) return undefined;

    let lastTick = Date.now();
    demonCurseTimerRef.current = setInterval(() => {
      if (runtimeRef.current.matchState !== 'PLAYING' || runtimeRef.current.round !== 5) {
        clearInterval(demonCurseTimerRef.current);
        return;
      }
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      const nextCurse = runtimeRef.current.curseRemainingFloat - dt;
      if (nextCurse <= 0) {
        runtimeRef.current.curseRemainingFloat = DEMON_KING_BOSS.curseIntervalSec;
        setDemonCurseLeft(DEMON_KING_BOSS.curseIntervalSec);

        const nextLives = Math.max(0, runtimeRef.current.lives - 1);
        runtimeRef.current.lives = nextLives;
        setLives(nextLives);
        runtimeRef.current.demonCurseAnim = 1;
        runtimeRef.current.knightHurtAnim = 1;
        runtimeRef.current.screenShake = 11;
        playSound('wrong');
        spawnBurstParticles(0.24, 0.62, '#c026d3', 28);
        spawnFloatingText('👿 Lời Nguyền 5 Giây (-1 ❤️)!', '#e879f9', 0.34, 0.44);

        if (nextLives <= 0) {
          triggerDemonKingUnrevivableExecution(runtimeRef.current.score);
        } else {
          showQuickBanner(
            `👿 Đủ 5 giây! Ma Vương Malakor rút 1 tim của bạn (Còn ${nextLives} ❤️)!`,
            'error'
          );
        }
      } else {
        runtimeRef.current.curseRemainingFloat = nextCurse;
        setDemonCurseLeft(Math.max(1, Math.ceil(nextCurse)));
      }
    }, 100);

    return () => clearInterval(demonCurseTimerRef.current);
  }, [matchState, round]);

  // Choice handler for Wave 1 (Meaning Shields) & Wave 3 (Syn/Ant/Context Spell Orbs)
  const handleSelectRuneChoice = (choiceText) => {
    if (
      matchState !== 'PLAYING' ||
      runtimeRef.current.matchState !== 'PLAYING' ||
      runtimeRef.current.questionResolved ||
      !activeQ
    ) {
      return;
    }
    const targetAnswer =
      effectiveCombatRound === 1 ? activeQ.word : effectiveCombatRound === 3 ? activeQ.v3Target : '';
    const isCorrect =
      String(choiceText || '').trim().toLowerCase() === String(targetAnswer || '').trim().toLowerCase();

    if (isCorrect) {
      runtimeRef.current.questionResolved = true;
      spawnHeroSlashEffects(true);
      playSound('word_clear');
      speakWord(activeQ.word);

      const remainRatio = Math.max(
        0,
        Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
      );
      const speedBonus = Math.round(remainRatio * 90);
      const gain = (round === 5 ? 350 : 150) + combo * 30 + speedBonus;
      const nextScore = score + gain;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      runtimeRef.current.score = nextScore;
      runtimeRef.current.combo = nextCombo;

      const { goldGain, droppedKey } = rewardMonsterKill(false);
      recordWordAttempt(activeQ, effectiveCombatRound, true);
      showQuickBanner(
        round === 5
          ? `⚔️ Chém trúng Ma Vương Malakor! +${gain}đ (Combo x${nextCombo})`
          : `⚔️ Chém hạ ${currentMonster.name}! +${gain}đ • Quái rớt +${goldGain} 🪙 Vàng${
              droppedKey ? ' • 🗝️ Quái rớt 1 Chìa Khóa Hồi Sinh (Hiếm)!' : ''
            }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      if (runtimeRef.current.lives <= 0) return;
      triggerDragonFinalSmashOrLifeLoss(
        `💥 Chém trượt "${choiceText}"! ${currentMonster.name} phản đòn (-1 ❤️)!`,
        false
      );
    }
  };

  // Wave 2: Continuous sword-combo typing to shatter armor
  const handleWave2KeyInput = (char) => {
    if (
      matchState !== 'PLAYING' ||
      runtimeRef.current.matchState !== 'PLAYING' ||
      runtimeRef.current.questionResolved ||
      effectiveCombatRound !== 2 ||
      !activeQ
    ) {
      return;
    }
    const target = String(activeQ.word || '').toUpperCase();
    const expected = target[typedProgress];
    if (!expected) return;

    if (char.toUpperCase() === expected) {
      playSound('type_hit');
      const nextProg = skipNonAlphaIndex(target, typedProgress + 1);
      const isFinishingBlow = nextProg >= target.length;
      if (isFinishingBlow) {
        runtimeRef.current.questionResolved = true;
      }
      spawnHeroSlashEffects(isFinishingBlow);
      spawnMonsterCoinDrops(isFinishingBlow ? 4 : 1);

      setTypedProgress(nextProg);
      runtimeRef.current.typedProgress = nextProg;

      if (isFinishingBlow) {
        playSound('word_clear');
        speakWord(activeQ.word);
        const remainRatio = Math.max(
          0,
          Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
        );
        const gain = (round === 5 ? 400 : 210) + combo * 30 + Math.round(remainRatio * 110);
        const nextScore = score + gain;
        setScore(nextScore);
        setCombo(combo + 1);
        runtimeRef.current.score = nextScore;
        runtimeRef.current.combo = combo + 1;
        const { goldGain, droppedKey } = rewardMonsterKill(false);
        recordWordAttempt(activeQ, 2, true);
        showQuickBanner(
          round === 5
            ? `🗡️ Đòn chém trúng Ma Vương ("${activeQ.word}")! +${gain}đ`
            : `🗡️ Hạ gục ${currentMonster.name} ("${activeQ.word}")! +${gain}đ • +${goldGain} Vàng${
                droppedKey ? ' • +1 🗝️ Chìa Khóa!' : ''
              }`,
          'success'
        );
        advanceToNextMonsterOrStage(nextScore);
      }
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `❌ Gõ sai chữ "${char}"! ${currentMonster.name} vung vũ khí phản công (-1 ❤️)!`,
        false
      );
    }
  };

  // Wave 4 (and Demon King Wheel 4): Sentence Fill-in-the-Blank Typing
  const handleWave4InputChange = (nextVal) => {
    if (matchState !== 'PLAYING' || effectiveCombatRound !== 4 || !activeQ) return;
    const prevVal = round4Input;
    setRound4Input(nextVal);

    const accepted =
      Array.isArray(activeQ.v4Answers) && activeQ.v4Answers.length > 0
        ? activeQ.v4Answers
        : [activeQ.v4Display || activeQ.collocation || activeQ.word];
    const evalRes = matchRound4TypingAnswer(nextVal, accepted);
    const prevEval = matchRound4TypingAnswer(prevVal, accepted);
    runtimeRef.current.round4MatchRatio = evalRes.matchRatio;

    if (nextVal.length > prevVal.length) {
      if (evalRes.matchRatio >= prevEval.matchRatio && evalRes.matchRatio > 0) {
        playSound('type_hit');
        spawnHeroSlashEffects(false);
      } else {
        playSound('wrong');
        if (round === 5) {
          runtimeRef.current.demonCurseAnim = 0.7;
          spawnFloatingText('👿 Ma Vương Phản Phép!', '#e879f9', 0.48, 0.56);
        } else {
          runtimeRef.current.dragonFireAnim = 0.85;
          spawnFloatingText('🔥 Rồng Khè Lửa Phản Đòn!', '#fb7185', 0.48, 0.56);
        }
        runtimeRef.current.knightHurtAnim = 0.6;
      }
    }
  };

  const handleWave4Submit = (e) => {
    if (e) e.preventDefault();
    if (
      matchState !== 'PLAYING' ||
      runtimeRef.current.matchState !== 'PLAYING' ||
      runtimeRef.current.questionResolved ||
      effectiveCombatRound !== 4 ||
      !activeQ
    ) {
      return;
    }
    const rawTyped = round4Input.trim();
    if (!rawTyped) return;

    const accepted =
      Array.isArray(activeQ.v4Answers) && activeQ.v4Answers.length > 0
        ? activeQ.v4Answers
        : [activeQ.v4Display || activeQ.collocation || activeQ.word];
    const evalRes = matchRound4TypingAnswer(rawTyped, accepted);

    if (evalRes.matched) {
      runtimeRef.current.questionResolved = true;
      spawnHeroSlashEffects(true);
      runtimeRef.current.round4MatchRatio = 1;
      playSound('word_clear');
      speakWord(evalRes.matchedAnswer || activeQ.v4Display || activeQ.word);

      const remainRatio = Math.max(
        0,
        Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
      );
      const gain = (round === 5 ? 500 : 320) + combo * 40 + Math.round(remainRatio * 150);
      const nextScore = score + gain;
      setScore(nextScore);
      setCombo(combo + 1);
      runtimeRef.current.score = nextScore;
      runtimeRef.current.combo = combo + 1;
      const { goldGain, droppedKey } = rewardMonsterKill(round === 4);
      recordWordAttempt(activeQ, 4, true);
      showQuickBanner(
        round === 5
          ? `⚔️ TRẢM MA VƯƠNG ("${evalRes.matchedAnswer}")! +${gain}đ`
          : `🐉 ĐỒ LONG TRẢM! Hạ gục Rồng Hắc Ám ("${evalRes.matchedAnswer}")! +${gain}đ • +${goldGain} 🪙 Vàng${
              droppedKey ? ' • +1 🗝️ Chìa Khóa Hiếm!' : ''
            }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        round === 5
          ? `👿 "${rawTyped}" chưa đúng! Ma Vương phản công (-1 ❤️)!`
          : `🔥 "${rawTyped}" chưa đúng! Rồng Hắc Ám khè lửa phản công (-1 ❤️)!`,
        false
      );
    }
  };

  // Fixed Hint Logic: STRICTLY requires >= 300 points; cannot use at 0 points!
  const handleUseHint = () => {
    if (matchState !== 'PLAYING' || !activeQ) return;
    if (score < KNIGHT_HINT_SCORE_COST) {
      playSound('wrong');
      showQuickBanner(
        `❌ Cần tối thiểu ${KNIGHT_HINT_SCORE_COST} điểm mới được dùng Gợi ý (Hiện có ${score}đ)!`,
        'error'
      );
      return;
    }

    if (effectiveCombatRound === 2) {
      const target = String(activeQ.word || '').toUpperCase();
      const nextChar = target[typedProgress];
      if (nextChar) {
        const nextScore = score - KNIGHT_HINT_SCORE_COST;
        setScore(nextScore);
        runtimeRef.current.score = nextScore;
        handleWave2KeyInput(nextChar);
      }
    } else if (effectiveCombatRound === 4) {
      const primary = String(
        activeQ.v4Answers?.[0] || activeQ.v4Display || activeQ.collocation || activeQ.word || ''
      ).trim();
      if (!primary) return;
      const nextLen = Math.min(primary.length, Math.max(3, round4Input.length + 3));
      const nextScore = score - KNIGHT_HINT_SCORE_COST;
      setScore(nextScore);
      runtimeRef.current.score = nextScore;
      handleWave4InputChange(primary.slice(0, nextLen));
    }
  };

  const handleUseFreeze = () => {
    if (matchState !== 'PLAYING' || freezeCharges <= 0) return;
    setFreezeCharges(c => Math.max(0, c - 1));
    runtimeRef.current.timeRemainingFloat += 8;
    setTimeLeft(t => t + 8);
    spawnBurstParticles(0.5, 0.35, '#38bdf8', 25);
    showQuickBanner('❄️ Băng Phong Kiếm: Đóng băng quái vật +8 giây!', 'success');
  };

  // Revive Mechanic (Stages 1–4 ONLY; blocked completely by Demon King Soul Seal)
  const reviveKeyCost = reviveUsedCount + 1;
  const reviveGoldCost = reviveKeyCost * REVIVE_KEY_GOLD_PRICE;

  // Trigger Tombstone-Shatter & Holy Pillar of Light Resurrection Animation
  const triggerHeroResurrectionAnimation = (methodLabel, bannerText) => {
    const rt = runtimeRef.current;
    setReviveUsedCount(c => c + 1);
    setLives(3);
    rt.lives = 3;
    setMatchState('PLAYING');
    rt.matchState = 'PLAYING';
    rt.reviveBusy = false;
    rt.finalSmashAnim = 0;
    rt.dragonFireAnim = 0;
    rt.tombstoneDropAnim = 0;
    rt.reviveBeamAnim = 1;
    rt.screenShake = 12;

    // Spawn 14 shattering tombstone rock shards flying outward from Hero's grave
    const shards = [];
    for (let i = 0; i < 14; i += 1) {
      const ang = -Math.PI * 0.1 - Math.random() * Math.PI * 0.8;
      const spd = 2.6 + Math.random() * 5.2;
      shards.push({
        xRatio: 0.23 + (Math.random() - 0.5) * 0.04,
        yRatio: 0.72 + (Math.random() - 0.5) * 0.08,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.8,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.28,
        alpha: 1
      });
    }
    rt.tombstoneShards = shards;

    playSound('word_clear');
    setupQuestionClock(effectiveCombatRound, activeQ);
    spawnBurstParticles(0.23, 0.66, '#fde047', 36);
    spawnBurstParticles(0.23, 0.62, '#38bdf8', 24);
    spawnFloatingText('⚡ PHÁ BIA MỘ HỒI SINH (+3 ❤️)!', '#fde047', 0.28, 0.34);
    showQuickBanner(bannerText, 'success');

    setReviveCelebration({
      id: Date.now(),
      methodLabel
    });
    clearTimeout(reviveCelebrationTimerRef.current);
    reviveCelebrationTimerRef.current = setTimeout(() => {
      setReviveCelebration(null);
    }, 1450);
  };

  const handleReviveWithKeys = () => {
    if (
      runtimeRef.current.reviveBusy ||
      runtimeRef.current.matchState !== 'REVIVE_PROMPT' ||
      cannotReviveByDemon ||
      round === 5
    ) {
      return;
    }
    if ((rpgProfile.keys || 0) < reviveKeyCost) {
      showToast?.(`Cần ${reviveKeyCost} 🗝️ Chìa Khóa Hồi Sinh! Bạn có thể dùng Vàng để hồi sinh.`, 'error');
      return;
    }
    runtimeRef.current.reviveBusy = true;
    updateAndPersistProfile(prev => ({
      ...prev,
      keys: Math.max(0, (prev.keys || 0) - reviveKeyCost)
    }));
    triggerHeroResurrectionAnimation(
      `Dùng ${reviveKeyCost} 🗝️ Chìa Khóa`,
      `🗝️ HỒI SINH THÀNH CÔNG (-${reviveKeyCost} Chìa Khóa)! Phá bia mộ hồi đầy 3 ❤️ & Reset thời gian!`
    );
  };

  const handleReviveWithGold = () => {
    if (
      runtimeRef.current.reviveBusy ||
      runtimeRef.current.matchState !== 'REVIVE_PROMPT' ||
      cannotReviveByDemon ||
      round === 5
    ) {
      return;
    }
    if ((rpgProfile.gold || 0) < reviveGoldCost) {
      showToast?.(`Không đủ Vàng! Cần ${reviveGoldCost} 🪙 Vàng để mua mạng hồi sinh.`, 'error');
      return;
    }
    runtimeRef.current.reviveBusy = true;
    updateAndPersistProfile(prev => ({
      ...prev,
      gold: Math.max(0, (prev.gold || 0) - reviveGoldCost)
    }));
    triggerHeroResurrectionAnimation(
      `Mua mạng ${reviveGoldCost} 🪙 Vàng`,
      `🪙 ĐÃ MUA MẠNG HỒI SINH (-${reviveGoldCost} Vàng)! Phá bia mộ hồi đầy 3 ❤️ & Tiếp tục chiến đấu!`
    );
  };

  // Keyboard listener for TAB pronunciation & Wave 2 Typing
  useEffect(() => {
    if (matchState !== 'PLAYING') return undefined;
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.code === 'Tab' && activeQ) {
        e.preventDefault();
        speakWord(effectiveCombatRound === 4 ? activeQ.v4Display || activeQ.word : activeQ.word);
        return;
      }
      if (inInput) return;
      if (effectiveCombatRound === 2 && e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleWave2KeyInput(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [matchState, round, demonWheelStyle, activeQ, typedProgress, score, combo]);

  // 60 FPS Fantasy RPG Illustrated Sprite Duel, Multi-Slash VFX & Demon King Realm Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const parent = canvas.parentElement;
      const w = (canvas.width = Math.max(320, parent?.clientWidth || 780));
      const h = (canvas.height = Math.max(248, parent?.clientHeight || 288));
      const rt = runtimeRef.current;
      const now = Date.now();
      const isDragonStage = round === 4;
      const isDemonStage = round === 5;
      const isBossStage = isDragonStage || isDemonStage;
      const groundY = h * 0.81;

      // Apply brief camera shake on heavy sword slash / Demon curse impact
      let shakeX = 0;
      let shakeY = 0;
      if (rt.screenShake > 0.2) {
        shakeX = (Math.random() - 0.5) * rt.screenShake;
        shakeY = (Math.random() - 0.5) * rt.screenShake * 0.7;
        rt.screenShake *= 0.84;
      } else {
        rt.screenShake = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Atmospheric Fantasy Sky Backdrop per Stage Biome
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDemonStage) {
        bgGrad.addColorStop(0, '#0a0118');
        bgGrad.addColorStop(0.45, '#2e0449');
        bgGrad.addColorStop(0.82, '#4a0624');
        bgGrad.addColorStop(1, '#09020e');
      } else if (isDragonStage) {
        bgGrad.addColorStop(0, '#16040d');
        bgGrad.addColorStop(0.5, '#3b0918');
        bgGrad.addColorStop(0.82, '#5c1218');
        bgGrad.addColorStop(1, '#12070c');
      } else if (round === 3) {
        bgGrad.addColorStop(0, '#120c2c');
        bgGrad.addColorStop(0.55, '#2b144d');
        bgGrad.addColorStop(1, '#0c0d1f');
      } else if (round === 2) {
        bgGrad.addColorStop(0, '#0b1222');
        bgGrad.addColorStop(0.58, '#1e293b');
        bgGrad.addColorStop(1, '#090e18');
      } else {
        bgGrad.addColorStop(0, '#09152a');
        bgGrad.addColorStop(0.55, '#132a47');
        bgGrad.addColorStop(1, '#09131e');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-16, -16, w + 32, h + 32);

      // Twinkling stars / void sparks
      ctx.save();
      for (let s = 0; s < 26; s += 1) {
        const sx = ((s * 97.3) % 100) / 100 * w;
        const sy = ((s * 43.7) % 52) / 100 * h;
        const twinkle = 0.25 + 0.65 * Math.abs(Math.sin(now * 0.0018 + s * 1.7));
        ctx.fillStyle = isDemonStage
          ? `rgba(240, 171, 252, ${twinkle * 0.8})`
          : isDragonStage
          ? `rgba(253, 186, 116, ${twinkle * 0.6})`
          : `rgba(226, 232, 240, ${twinkle * 0.85})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s % 5 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Moon / Volcanic Eclipse / Abyssal Demon Rift
      const moonX = w * 0.16;
      const moonY = h * 0.23;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 74);
      if (isDemonStage) {
        moonGlow.addColorStop(0, 'rgba(217, 70, 239, 0.72)');
        moonGlow.addColorStop(0.45, 'rgba(225, 29, 72, 0.34)');
        moonGlow.addColorStop(1, 'rgba(88, 28, 135, 0)');
      } else if (isDragonStage) {
        moonGlow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
        moonGlow.addColorStop(0.45, 'rgba(225, 29, 72, 0.24)');
        moonGlow.addColorStop(1, 'rgba(225, 29, 72, 0)');
      } else if (round === 3) {
        moonGlow.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
        moonGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.18)');
        moonGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
      } else {
        moonGlow.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
        moonGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
        moonGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 74, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fillStyle = isDemonStage
        ? '#e879f9'
        : isDragonStage
        ? '#fb7185'
        : round === 3
        ? '#ddd6fe'
        : '#e0f2fe';
      ctx.fill();
      if (isBossStage) {
        ctx.beginPath();
        ctx.arc(moonX + 3, moonY - 1, 14, 0, Math.PI * 2);
        ctx.fillStyle = isDemonStage ? '#0d021a' : '#1f0610';
        ctx.fill();
      }

      // 2. Parallax Distant Mountains & Castle / Abyssal Monoliths
      ctx.save();
      const mountainShift = (rt.roadOffset * 28) % 240;
      ctx.fillStyle = isDemonStage
        ? 'rgba(26, 4, 42, 0.9)'
        : isDragonStage
        ? 'rgba(42, 7, 17, 0.85)'
        : round === 3
        ? 'rgba(24, 14, 48, 0.82)'
        : 'rgba(15, 28, 46, 0.82)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = -240; x <= w + 240; x += 120) {
        const px = x - mountainShift;
        ctx.lineTo(px + 30, groundY - 58);
        ctx.lineTo(px + 65, groundY - (isBossStage ? 94 : 76));
        ctx.lineTo(px + 100, groundY - 46);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      const castleX = w * 0.49;
      ctx.fillStyle = isDemonStage
        ? 'rgba(18, 2, 32, 0.92)'
        : isDragonStage
        ? 'rgba(30, 6, 14, 0.9)'
        : 'rgba(15, 23, 42, 0.86)';
      ctx.fillRect(castleX - 44, groundY - 78, 88, 78);
      ctx.fillRect(castleX - 58, groundY - 102, 22, 102);
      ctx.fillRect(castleX + 36, groundY - 96, 22, 96);
      ctx.beginPath();
      ctx.moveTo(castleX - 62, groundY - 102);
      ctx.lineTo(castleX - 47, groundY - 126);
      ctx.lineTo(castleX - 32, groundY - 102);
      ctx.moveTo(castleX + 32, groundY - 96);
      ctx.lineTo(castleX + 47, groundY - 118);
      ctx.lineTo(castleX + 62, groundY - 96);
      ctx.fill();
      ctx.fillStyle = isDemonStage
        ? 'rgba(232, 121, 249, 0.75)'
        : isDragonStage
        ? 'rgba(251, 146, 60, 0.65)'
        : 'rgba(253, 224, 71, 0.55)';
      ctx.fillRect(castleX - 50, groundY - 86, 5, 10);
      ctx.fillRect(castleX + 44, groundY - 82, 5, 10);
      ctx.fillRect(castleX - 10, groundY - 56, 6, 11);
      ctx.fillRect(castleX + 8, groundY - 56, 6, 11);
      ctx.restore();

      // 3. Stone Pillars & Animated Flickering Torches / Abyssal Braziers
      ctx.save();
      const pillarSpacing = 195;
      for (let pIdx = 0; pIdx < 6; pIdx += 1) {
        const span = w + pillarSpacing;
        const px = ((pIdx * pillarSpacing - rt.roadOffset * 95) % span + span) % span - 95;
        ctx.fillStyle = isDemonStage
          ? 'rgba(46, 10, 68, 0.68)'
          : isDragonStage
          ? 'rgba(54, 15, 24, 0.65)'
          : round === 3
          ? 'rgba(42, 24, 74, 0.58)'
          : 'rgba(30, 41, 59, 0.58)';
        ctx.fillRect(px, h * 0.14, 30, groundY - h * 0.14);

        const flicker = Math.sin(now * 0.015 + pIdx * 2.1) * 3.5;
        const tx = px + 15;
        const ty = h * 0.42;
        const torchGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, 38 + flicker);
        if (isDemonStage) {
          torchGrad.addColorStop(0, 'rgba(250, 232, 255, 0.92)');
          torchGrad.addColorStop(0.32, 'rgba(217, 70, 239, 0.48)');
          torchGrad.addColorStop(1, 'rgba(217, 70, 239, 0)');
        } else if (isDragonStage) {
          torchGrad.addColorStop(0, 'rgba(254, 215, 170, 0.9)');
          torchGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.45)');
          torchGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        } else if (round === 3) {
          torchGrad.addColorStop(0, 'rgba(240, 171, 252, 0.85)');
          torchGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.35)');
          torchGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        } else {
          torchGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          torchGrad.addColorStop(0.32, 'rgba(245, 158, 11, 0.36)');
          torchGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        }
        ctx.fillStyle = torchGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, 38 + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, 4.5 + flicker * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = isDemonStage || round === 3 ? '#f0abfc' : '#fde047';
        ctx.fill();
      }

      // Ambient drifting particles
      for (let m = 0; m < 16; m += 1) {
        const mx = (m * 73 + now * (isBossStage ? 0.02 : 0.01)) % w;
        const my = isBossStage
          ? groundY - ((m * 41 + now * 0.036) % (groundY * 0.85))
          : h * 0.24 + ((m * 37) % (groundY * 0.52)) + Math.sin(now * 0.003 + m) * 10;
        const mAlpha = 0.25 + 0.55 * Math.abs(Math.sin(now * 0.004 + m * 1.4));
        ctx.fillStyle = isDemonStage
          ? `rgba(232, 121, 249, ${mAlpha})`
          : isDragonStage
          ? `rgba(251, 146, 60, ${mAlpha})`
          : round === 3
          ? `rgba(192, 132, 252, ${mAlpha})`
          : `rgba(52, 211, 153, ${mAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(mx, my, isBossStage ? 2.2 : 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Cobblestone Battlefield Ground
      ctx.save();
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      if (isDemonStage) {
        groundGrad.addColorStop(0, '#2a093b');
        groundGrad.addColorStop(1, '#09020e');
      } else if (isDragonStage) {
        groundGrad.addColorStop(0, '#301119');
        groundGrad.addColorStop(1, '#12060a');
      } else if (round === 3) {
        groundGrad.addColorStop(0, '#22183b');
        groundGrad.addColorStop(1, '#0d091c');
      } else {
        groundGrad.addColorStop(0, '#1e2c42');
        groundGrad.addColorStop(1, '#0b1220');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, w, h - groundY);

      ctx.strokeStyle = isDemonStage
        ? 'rgba(217, 70, 239, 0.28)'
        : isDragonStage
        ? 'rgba(244, 63, 94, 0.22)'
        : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1.2;
      const tileW = 64;
      const tileShift = (rt.roadOffset * 120) % tileW;
      for (let tx = -tileW; tx <= w + tileW; tx += tileW) {
        const sx = tx - tileShift;
        ctx.beginPath();
        ctx.moveTo(sx, groundY);
        ctx.lineTo(sx - 18, h);
        ctx.stroke();
      }

      if (isBossStage) {
        const pulse = 0.36 + 0.26 * Math.sin(now * 0.006);
        const floorGlow = ctx.createLinearGradient(0, groundY - 6, 0, groundY + 14);
        floorGlow.addColorStop(
          0,
          isDemonStage ? `rgba(217, 70, 239, ${pulse})` : `rgba(249, 115, 22, ${pulse})`
        );
        floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = floorGlow;
        ctx.fillRect(0, groundY - 6, w, 20);
      }

      ctx.strokeStyle = isDemonStage
        ? '#e879f9'
        : isDragonStage
        ? '#fb7185'
        : round === 3
        ? '#a855f7'
        : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();
      ctx.restore();

      if (rt.matchState === 'PLAYING') {
        rt.roadOffset = (rt.roadOffset + 0.0038) % 10;
      }

      // 5. Physical Gold Coins bursting from monsters into Hero
      for (let i = (rt.droppedCoins || []).length - 1; i >= 0; i -= 1) {
        const coin = rt.droppedCoins[i];
        coin.age += 1;
        if (coin.age < 24) {
          coin.xRatio += coin.vx / w;
          coin.yRatio += coin.vy / h;
          coin.vy += 0.28;
          if (coin.yRatio >= 0.78) {
            coin.yRatio = 0.78;
            coin.vy = -Math.abs(coin.vy) * 0.45;
          }
        } else {
          coin.xRatio += (0.23 - coin.xRatio) * 0.16;
          coin.yRatio += (0.64 - coin.yRatio) * 0.16;
        }
        const cx = coin.xRatio * w;
        const cy = coin.yRatio * h;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('🪙', 0, 0.5);
        ctx.restore();

        if (coin.age >= 24 && Math.hypot(coin.xRatio - 0.23, coin.yRatio - 0.64) < 0.04) {
          rt.droppedCoins.splice(i, 1);
        } else if (coin.age > 95) {
          rt.droppedCoins.splice(i, 1);
        }
      }

      // 6. Rare Revive Keys bursting ONLY from slain monsters
      for (let i = (rt.droppedKeys || []).length - 1; i >= 0; i -= 1) {
        const kItem = rt.droppedKeys[i];
        kItem.age += 1;
        if (kItem.age < 30) {
          kItem.xRatio += kItem.vx / w;
          kItem.yRatio += kItem.vy / h;
          kItem.vy += 0.26;
          if (kItem.yRatio >= 0.76) {
            kItem.yRatio = 0.76;
            kItem.vy = -Math.abs(kItem.vy) * 0.55;
          }
        } else {
          kItem.xRatio += (0.23 - kItem.xRatio) * 0.14;
          kItem.yRatio += (0.62 - kItem.yRatio) * 0.14;
        }
        const kx = kItem.xRatio * w;
        const ky = kItem.yRatio * h;
        ctx.save();
        ctx.translate(kx, ky);
        const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
        halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7dd3fc';
        ctx.stroke();
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗝️', 0, 1);
        ctx.restore();

        if (kItem.age >= 30 && Math.hypot(kItem.xRatio - 0.23, kItem.yRatio - 0.62) < 0.045) {
          rt.droppedKeys.splice(i, 1);
        } else if (kItem.age > 115) {
          rt.droppedKeys.splice(i, 1);
        }
      }

      // Compute Combat Positions & Timers
      const heroAttackSin = Math.sin(rt.heroAttackAnim * Math.PI);
      const monsterAttackSin = Math.sin(rt.monsterAttackAnim * Math.PI);
      const heroLungeX = heroAttackSin * Math.min(110, w * 0.16);
      const heroHurtShiftX = -rt.knightHurtAnim * 20;
      const heroBaseX = w * 0.23 + heroLungeX + heroHurtShiftX;

      const monsterLungeX = -monsterAttackSin * Math.min(92, w * 0.13);
      const monsterRecoilX = rt.monsterHitAnim * 18;
      const monsterIdleSway = Math.sin(now * 0.0028) * (isBossStage ? 8 : 5);
      const monsterX = w * 0.75 + monsterLungeX + monsterRecoilX + monsterIdleSway;

      if (rt.heroAttackAnim > 0) rt.heroAttackAnim = Math.max(0, rt.heroAttackAnim - 0.055);
      if (rt.monsterAttackAnim > 0) rt.monsterAttackAnim = Math.max(0, rt.monsterAttackAnim - 0.055);
      if (rt.monsterHitAnim > 0) rt.monsterHitAnim = Math.max(0, rt.monsterHitAnim - 0.06);
      if (rt.knightHurtAnim > 0) rt.knightHurtAnim = Math.max(0, rt.knightHurtAnim - 0.065);
      if (rt.dragonFireAnim > 0) rt.dragonFireAnim = Math.max(0, rt.dragonFireAnim - 0.042);
      if (rt.demonCurseAnim > 0) rt.demonCurseAnim = Math.max(0, rt.demonCurseAnim - 0.04);
      if (rt.tombstoneDropAnim > 0 && rt.tombstoneDropAnim < 1) {
        rt.tombstoneDropAnim = Math.min(1, rt.tombstoneDropAnim + 0.065);
      }
      if (rt.reviveBeamAnim > 0) {
        rt.reviveBeamAnim = Math.max(0, rt.reviveBeamAnim - 0.018);
      }

      // Compute Monster HP ratio
      let monsterHpRatio = 1;
      if (isDemonStage) {
        const totalDemonPhases = Math.max(1, (queues[5] || []).length);
        const subProg =
          effectiveCombatRound === 4
            ? rt.round4MatchRatio || 0
            : effectiveCombatRound === 2 && activeQ?.word
            ? rt.typedProgress / Math.max(1, activeQ.word.length)
            : 0;
        monsterHpRatio = Math.max(0, (totalDemonPhases - wordIdx - subProg) / totalDemonPhases);
      } else if (round === 4) {
        monsterHpRatio = Math.max(0, 1 - (rt.round4MatchRatio || 0));
      } else if (round === 2 && activeQ?.word) {
        const len = Math.max(1, activeQ.word.length);
        monsterHpRatio = Math.max(0, (len - rt.typedProgress) / len);
      }

      // 7. Draw Real Illustrated Monster / Ancient Dragon / Secret Demon King Sprite
      const monsterImg = spriteImagesRef.current.get(currentMonster?.spriteUrl);
      const monsterDrawH = isBossStage ? Math.min(208, h * 0.76) : Math.min(144, h * 0.56);
      const mAspect =
        monsterImg && monsterImg.complete && monsterImg.naturalHeight > 0
          ? monsterImg.naturalWidth / monsterImg.naturalHeight
          : isBossStage
          ? 1.12
          : 1.0;
      const monsterDrawW = monsterDrawH * mAspect;
      const isFloatingMonster = isBossStage || currentMonster?.id === 'dark_lich';
      const monsterBobY = isFloatingMonster
        ? Math.sin(now * 0.0042) * 6 - 6
        : Math.sin(now * 0.005) * 2.5;
      const monsterTopY = groundY + 6 - monsterDrawH + monsterBobY - rt.monsterHitAnim * 6;
      const monsterCenterY = monsterTopY + monsterDrawH * 0.5;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.54)';
      ctx.beginPath();
      ctx.ellipse(monsterX, groundY + 3, monsterDrawW * 0.36, isBossStage ? 11 : 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const mAura = ctx.createRadialGradient(
        monsterX,
        monsterCenterY,
        10,
        monsterX,
        monsterCenterY,
        monsterDrawH * 0.65
      );
      mAura.addColorStop(
        0,
        isDemonStage
          ? 'rgba(217, 70, 239, 0.44)'
          : isDragonStage
          ? 'rgba(244, 63, 94, 0.34)'
          : `${currentMonster?.color || '#10b981'}38`
      );
      mAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mAura;
      ctx.beginPath();
      ctx.arc(monsterX, monsterCenterY, monsterDrawH * 0.65, 0, Math.PI * 2);
      ctx.fill();

      if (monsterImg && monsterImg.complete && monsterImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(monsterX, monsterTopY + monsterDrawH);
        const breatheScaleY = 1 + Math.sin(now * 0.0045) * 0.018;
        ctx.scale(1, breatheScaleY);
        if (rt.monsterAttackAnim > 0) {
          ctx.rotate(-monsterAttackSin * 0.1);
        }
        ctx.drawImage(monsterImg, -monsterDrawW / 2, -monsterDrawH, monsterDrawW, monsterDrawH);
        ctx.restore();
      } else {
        ctx.fillStyle = currentMonster?.color || '#10b981';
        ctx.beginPath();
        ctx.arc(monsterX, monsterCenterY, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Monster Nameplate + HP Bar
      const hpW = isBossStage ? 196 : 138;
      const plateX = Math.min(w - hpW / 2 - 14, Math.max(hpW / 2 + 14, monsterX));
      const plateY = Math.max(24, monsterTopY - 12);
      const labelText = isDemonStage
        ? `${DEMON_KING_BOSS.shortName} (+1.000 🪙 & +10 🗝️)`
        : `${currentMonster?.name || 'Quái Vật'} (+${expectedMonsterGold} 🪙)`;

      ctx.font = 'bold 11px sans-serif';
      const labelW = Math.max(hpW + 16, ctx.measureText(labelText).width + 20);
      ctx.fillStyle = isDemonStage ? 'rgba(32, 4, 48, 0.9)' : 'rgba(9, 13, 24, 0.84)';
      ctx.beginPath();
      ctx.roundRect(plateX - labelW / 2, plateY - 15, labelW, 20, 8);
      ctx.fill();
      ctx.strokeStyle = isDemonStage
        ? 'rgba(232, 121, 249, 0.72)'
        : isDragonStage
        ? 'rgba(244, 63, 94, 0.55)'
        : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = isDemonStage ? '#f5d0fe' : isDragonStage ? '#fecdd3' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, plateX, plateY - 5);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(plateX - hpW / 2, plateY + 8, hpW, 8, 4);
      ctx.fill();
      const hpGrad = ctx.createLinearGradient(plateX - hpW / 2, 0, plateX + hpW / 2, 0);
      if (isDemonStage) {
        hpGrad.addColorStop(0, '#a21caf');
        hpGrad.addColorStop(0.5, '#e879f9');
        hpGrad.addColorStop(1, '#f43f5e');
      } else if (isDragonStage) {
        hpGrad.addColorStop(0, '#e11d48');
        hpGrad.addColorStop(1, '#f97316');
      } else {
        hpGrad.addColorStop(0, '#10b981');
        hpGrad.addColorStop(1, '#34d399');
      }
      ctx.fillStyle = hpGrad;
      if (monsterHpRatio > 0) {
        ctx.beginPath();
        ctx.roundRect(plateX - hpW / 2, plateY + 8, Math.max(6, hpW * monsterHpRatio), 8, 4);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(plateX - hpW / 2, plateY + 8, hpW, 8, 4);
      ctx.stroke();
      ctx.restore();

      // 8. Draw Illustrated Playable Hero Sprite OR Fallen Knight Tombstone ("Bia Mộ") & Holy Resurrection Beam
      const heroImg = spriteImagesRef.current.get(activeSkin.spriteUrl);
      const heroDrawH = Math.min(142, h * 0.55);
      const hAspect =
        heroImg && heroImg.complete && heroImg.naturalHeight > 0
          ? heroImg.naturalWidth / heroImg.naturalHeight
          : 1.0;
      const heroDrawW = heroDrawH * hAspect;
      const heroBobY = Math.sin(now * 0.0055) * 2.2;
      const heroTopY = groundY + 6 - heroDrawH + heroBobY;
      const heroCenterY = heroTopY + heroDrawH * 0.5;
      const isHeroDeadOnCanvas =
        rt.lives <= 0 ||
        rt.matchState === 'DEATH_COUNTDOWN' ||
        rt.matchState === 'REVIVE_PROMPT' ||
        rt.matchState === 'DEMON_EXECUTION';

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.beginPath();
      ctx.ellipse(heroBaseX, groundY + 3, heroDrawW * 0.34, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isHeroDeadOnCanvas) {
        // 8A. FALLEN HERO TOMBSTONE ("BIA MỘ HIỆP SĨ") + PLANTED SWORD + FLOATING SOUL WISP
        const dropT = Math.min(1, Math.max(0, rt.tombstoneDropAnim || 1));
        const bounceOffset =
          dropT < 0.75
            ? -115 * (1 - dropT / 0.75) * (1 - dropT / 0.75)
            : -Math.sin(((dropT - 0.75) / 0.25) * Math.PI) * 12;
        const tombX = heroBaseX;
        const tombBaseY = groundY + 4 + bounceOffset;

        // Eerie ghostly ground mist around tombstone
        const ghostMist = ctx.createRadialGradient(tombX, tombBaseY - 30, 6, tombX, tombBaseY - 30, 68);
        ghostMist.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
        ghostMist.addColorStop(0.6, 'rgba(148, 163, 184, 0.14)');
        ghostMist.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ghostMist;
        ctx.beginPath();
        ctx.arc(tombX, tombBaseY - 30, 68, 0, Math.PI * 2);
        ctx.fill();

        // Hero's Glowing Sword planted diagonally in the ground beside the grave
        ctx.save();
        ctx.translate(tombX + 34, tombBaseY - 4);
        ctx.rotate(0.32);
        ctx.fillStyle = activeSkin.bladeColor || '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-4, -52);
        ctx.lineTo(4, -52);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Crossguard & pommel
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-13, -55, 26, 6);
        ctx.strokeRect(-13, -55, 26, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-3.5, -72, 7, 17);
        ctx.beginPath();
        ctx.arc(0, -75, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Gothic Arched Stone Tombstone Body
        const tombW = 54;
        const tombH = 74;
        ctx.save();
        ctx.translate(tombX, tombBaseY);

        const stoneGrad = ctx.createLinearGradient(-tombW / 2, -tombH, tombW / 2, 0);
        stoneGrad.addColorStop(0, '#94a3b8');
        stoneGrad.addColorStop(0.45, '#64748b');
        stoneGrad.addColorStop(1, '#334155');
        ctx.fillStyle = stoneGrad;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(-tombW / 2, -10);
        ctx.lineTo(-tombW / 2, -tombH + tombW / 2);
        ctx.arc(0, -tombH + tombW / 2, tombW / 2, Math.PI, 0, false);
        ctx.lineTo(tombW / 2, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner carved stone rim
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-tombW / 2 + 6, -14);
        ctx.lineTo(-tombW / 2 + 6, -tombH + tombW / 2);
        ctx.arc(0, -tombH + tombW / 2, tombW / 2 - 6, Math.PI, 0, false);
        ctx.lineTo(tombW / 2 - 6, -14);
        ctx.stroke();

        // Tiered Stone Pedestal Steps
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(-tombW / 2 - 7, -12, tombW + 14, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-tombW / 2 - 12, -5, tombW + 24, 8, 3);
        ctx.fill();
        ctx.stroke();

        // Carved Cross Emblem & R.I.P Inscription
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-2.5, -tombH + 13, 5, 18);
        ctx.fillRect(-8, -tombH + 18, 16, 4.5);

        ctx.font = '900 12px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText('R.I.P', 0, -26);

        // Weathered cracks on stone
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tombW / 2 - 8, -36);
        ctx.lineTo(tombW / 2 - 16, -31);
        ctx.lineTo(tombW / 2 - 12, -24);
        ctx.stroke();
        ctx.restore();

        // Rising Translucent Soul Wisp / Spirit Orb floating above Tombstone
        const soulX = tombX + Math.sin(now * 0.0045) * 11;
        const soulY = tombBaseY - tombH - 18 - ((now * 0.025) % 28);
        const soulAlpha = 1 - (((now * 0.025) % 28) / 28) * 0.75;
        ctx.save();
        ctx.globalAlpha = Math.max(0.2, soulAlpha);
        const soulGlow = ctx.createRadialGradient(soulX, soulY, 2, soulX, soulY, 16);
        soulGlow.addColorStop(0, '#e0f2fe');
        soulGlow.addColorStop(0.5, '#38bdf8');
        soulGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = soulGlow;
        ctx.beginPath();
        ctx.arc(soulX, soulY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', soulX, soulY);
        ctx.restore();
      } else {
        // 8B. LIVING HERO SPRITE (+ HOLY RESURRECTION PILLAR & SHATTERING TOMBSTONE SHARDS!)
        if (rt.reviveBeamAnim > 0.02) {
          const revT = rt.reviveBeamAnim;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';

          // Heavenly Golden-Cyan Pillar of Light from Sky to Ground
          const beamW = (34 + Math.sin(now * 0.03) * 8) * Math.min(1, revT * 1.3);
          const pillarGrad = ctx.createLinearGradient(heroBaseX - beamW, 0, heroBaseX + beamW, 0);
          pillarGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          pillarGrad.addColorStop(0.25, `rgba(56, 189, 248, ${0.42 * revT})`);
          pillarGrad.addColorStop(0.5, `rgba(254, 240, 138, ${0.88 * revT})`);
          pillarGrad.addColorStop(0.75, `rgba(56, 189, 248, ${0.42 * revT})`);
          pillarGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = pillarGrad;
          ctx.fillRect(heroBaseX - beamW, 0, beamW * 2, groundY + 6);

          // Expanding Golden Resurrection Halo Rings on Ground
          for (let rIdx = 0; rIdx < 2; rIdx += 1) {
            const prog = (1 - revT + rIdx * 0.35) % 1;
            ctx.strokeStyle = rIdx === 0 ? `rgba(253, 224, 71, ${1 - prog})` : `rgba(56, 189, 248, ${1 - prog})`;
            ctx.lineWidth = 3 * (1 - prog);
            ctx.beginPath();
            ctx.ellipse(heroBaseX, groundY + 2, 22 + prog * 72, 6 + prog * 18, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Radiant Valkyrie Light Wings unfurling behind revived Hero
          const wingSpread = 42 + (1 - revT) * 26;
          ctx.fillStyle = `rgba(254, 240, 138, ${0.55 * revT})`;
          ctx.beginPath();
          ctx.moveTo(heroBaseX - 8, heroCenterY);
          ctx.quadraticCurveTo(heroBaseX - wingSpread, heroCenterY - 48, heroBaseX - wingSpread * 0.85, heroCenterY + 14);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(heroBaseX + 8, heroCenterY);
          ctx.quadraticCurveTo(heroBaseX + wingSpread, heroCenterY - 48, heroBaseX + wingSpread * 0.85, heroCenterY + 14);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Shattered Tombstone Rock Shards flying outward after resurrection
        for (let sIdx = (rt.tombstoneShards || []).length - 1; sIdx >= 0; sIdx -= 1) {
          const sh = rt.tombstoneShards[sIdx];
          sh.xRatio += sh.vx / w;
          sh.yRatio += sh.vy / h;
          sh.vy += 0.24;
          sh.rot += sh.vRot;
          sh.alpha -= 0.024;
          if (sh.alpha <= 0) {
            rt.tombstoneShards.splice(sIdx, 1);
            continue;
          }
          ctx.save();
          ctx.translate(sh.xRatio * w, sh.yRatio * h);
          ctx.rotate(sh.rot);
          ctx.globalAlpha = Math.max(0, sh.alpha);
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.fillRect(-sh.size / 2, -sh.size / 2, sh.size, sh.size * 0.8);
          ctx.strokeRect(-sh.size / 2, -sh.size / 2, sh.size, sh.size * 0.8);
          ctx.restore();
        }

        const hAura = ctx.createRadialGradient(
          heroBaseX,
          heroCenterY,
          8,
          heroBaseX,
          heroCenterY,
          heroDrawH * 0.58
        );
        hAura.addColorStop(
          0,
          rt.reviveBeamAnim > 0.1
            ? 'rgba(253, 224, 71, 0.65)'
            : rt.knightHurtAnim > 0.25
            ? 'rgba(239, 68, 68, 0.48)'
            : `${activeSkin.bladeColor || '#38bdf8'}38`
        );
        hAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = hAura;
        ctx.beginPath();
        ctx.arc(heroBaseX, heroCenterY, heroDrawH * 0.58, 0, Math.PI * 2);
        ctx.fill();

        if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
          if (rt.heroAttackAnim > 0.28) {
            for (let g = 1; g <= 2; g += 1) {
              ctx.save();
              ctx.globalAlpha = (0.3 - g * 0.1) * rt.heroAttackAnim;
              ctx.translate(heroBaseX - g * 24, heroTopY + heroDrawH);
              ctx.drawImage(heroImg, -heroDrawW / 2, -heroDrawH, heroDrawW, heroDrawH);
              ctx.restore();
            }
          }
          ctx.save();
          // During early reviveBeamAnim, Hero rises up from the ground
          const reviveLiftY = rt.reviveBeamAnim > 0.6 ? (rt.reviveBeamAnim - 0.6) * 45 : 0;
          ctx.translate(heroBaseX, heroTopY + heroDrawH + reviveLiftY);
          const hScaleY = 1 + Math.sin(now * 0.0055) * 0.016;
          ctx.scale(1, hScaleY);
          if (rt.heroAttackAnim > 0) {
            ctx.rotate(heroAttackSin * 0.11);
          } else if (rt.knightHurtAnim > 0) {
            ctx.rotate(-rt.knightHurtAnim * 0.09);
          }
          ctx.drawImage(heroImg, -heroDrawW / 2, -heroDrawH, heroDrawW, heroDrawH);

          // Render equipped Class-Matched Cosmetic Weapon held by the Hero!
          if (activeWeapon?.iconUrl) {
            const wpImg = spriteImagesRef.current.get(activeWeapon.iconUrl);
            if (wpImg && wpImg.complete && wpImg.naturalWidth > 0) {
              ctx.save();
              ctx.translate(heroDrawW * 0.34, -heroDrawH * 0.44);
              const swingAngle =
                rt.heroAttackAnim > 0
                  ? Math.sin((1 - rt.heroAttackAnim) * Math.PI) * 0.95
                  : Math.sin(now * 0.004) * 0.08;
              ctx.rotate(swingAngle);
              ctx.shadowColor = activeWeapon.bladeColor || activeSkin.bladeColor || '#38bdf8';
              ctx.shadowBlur = 12;
              ctx.drawImage(wpImg, -22, -22, 44, 44);
              ctx.restore();
            }
          }
          ctx.restore();
        } else {
          ctx.fillStyle = activeSkin.armorPrimary || '#3b82f6';
          ctx.beginPath();
          ctx.arc(heroBaseX, heroCenterY, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 9. Upgraded Multi-Layered Sword Slash & Combat VFX
      // 9a. Sweeping Energy Crescent Wave from Hero Blade -> Monster
      if (rt.heroAttackAnim > 0.06) {
        const progress = 1 - rt.heroAttackAnim;
        const slashX = heroBaseX + 34 + (monsterX - heroBaseX - 38) * Math.min(1, progress * 1.35);
        const slashY = heroCenterY + (monsterCenterY - heroCenterY) * progress;
        ctx.save();
        ctx.translate(slashX, slashY);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, rt.heroAttackAnim * 1.45);
        ctx.shadowColor = activeSkin.slashColor || '#38bdf8';
        ctx.shadowBlur = 22;

        ctx.fillStyle = activeSkin.slashColor || '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 44, -Math.PI * 0.46, Math.PI * 0.46);
        ctx.quadraticCurveTo(14, 0, Math.cos(-Math.PI * 0.46) * 44, Math.sin(-Math.PI * 0.46) * 44);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(5, 0, 40, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.restore();
      }

      // 9b. Multi-Cut Criss-Crossing Anime Sword Slashes Directly Across Monster
      for (let i = (rt.slashes || []).length - 1; i >= 0; i -= 1) {
        const sl = rt.slashes[i];
        sl.age += 1;
        if (sl.age < sl.delay) continue;
        const localAge = sl.age - sl.delay;
        const lifeT = localAge / sl.maxAge;
        if (lifeT >= 1) {
          rt.slashes.splice(i, 1);
          continue;
        }
        const alpha = lifeT < 0.25 ? lifeT / 0.25 : 1 - (lifeT - 0.25) / 0.75;
        const stretch = Math.min(1, lifeT * 3.2);
        const sx = monsterX + sl.offsetX;
        const sy = monsterCenterY + sl.offsetY;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sl.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.shadowColor = sl.color;
        ctx.shadowBlur = 18;

        // Curved tapering anime blade slash arc
        const halfLen = sl.radius * (0.65 + 0.55 * stretch);
        const thickness = (1 - lifeT * 0.65) * 14;
        ctx.fillStyle = sl.color;
        ctx.beginPath();
        ctx.moveTo(-halfLen, 0);
        ctx.quadraticCurveTo(0, -thickness, halfLen, 0);
        ctx.quadraticCurveTo(0, thickness * 0.45, -halfLen, 0);
        ctx.closePath();
        ctx.fill();

        // White-hot razor center line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, (1 - lifeT) * 4.5);
        ctx.beginPath();
        ctx.moveTo(-halfLen * 0.92, 0);
        ctx.quadraticCurveTo(0, -thickness * 0.35, halfLen * 0.92, 0);
        ctx.stroke();

        // Thunder hero adds jagged electric crackle on slash
        if (sl.style === 'thunder') {
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-halfLen * 0.75, 0);
          ctx.lineTo(-halfLen * 0.3, -10);
          ctx.lineTo(0, 7);
          ctx.lineTo(halfLen * 0.35, -9);
          ctx.lineTo(halfLen * 0.75, 0);
          ctx.stroke();
        }

        // Expanding radial impact shockwave ring on first slash
        if (i === 0 && lifeT < 0.6) {
          ctx.strokeStyle = sl.bladeColor;
          ctx.lineWidth = 2.5 * (1 - lifeT);
          ctx.beginPath();
          ctx.arc(0, 0, 14 + lifeT * 66, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 9c. Regular Monster Claw / Arcane Counter-Attack (Stages 1–3 ONLY)
      if (rt.monsterAttackAnim > 0.06 && !isBossStage) {
        ctx.save();
        ctx.translate(heroBaseX, heroCenterY);
        ctx.globalAlpha = Math.min(1, rt.monsterAttackAnim * 1.3);
        const strikeColor = round === 3 ? '#c084fc' : '#f43f5e';
        ctx.strokeStyle = strikeColor;
        ctx.shadowColor = strikeColor;
        ctx.shadowBlur = 14;
        ctx.lineCap = 'round';
        [-14, 0, 14].forEach((offset, idx) => {
          ctx.lineWidth = idx === 1 ? 4.5 : 3;
          ctx.beginPath();
          ctx.moveTo(26 + offset, -26 + offset * 0.5);
          ctx.quadraticCurveTo(offset * 0.4, offset * 0.2, -26 + offset, 26 + offset * 0.5);
          ctx.stroke();
        });
        const ringR = 18 + (1 - rt.monsterAttackAnim) * 44;
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 9d. Volumetric Dragon Fire Breath Cone (Stage 4 ONLY)
      if ((rt.dragonFireAnim > 0.05 || rt.finalSmashAnim > 0.05) && isDragonStage) {
        const intensity = rt.finalSmashAnim > 0 ? 1 : rt.dragonFireAnim;
        const mouthX = monsterX - monsterDrawW * 0.21;
        const mouthY = monsterTopY + monsterDrawH * 0.34;
        const targetX = heroBaseX;
        const targetY = heroCenterY;
        const puffCount = rt.finalSmashAnim > 0 ? 32 : 22;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let f = 0; f < puffCount; f += 1) {
          const t = (f + ((now * 0.024) % 1)) / puffCount;
          const wobble = Math.sin(now * 0.025 + f * 1.4) * (6 + t * 14);
          const fx = mouthX + (targetX - mouthX) * t;
          const fy = mouthY + (targetY - mouthY) * t + wobble;
          const radius = (rt.finalSmashAnim > 0 ? 14 : 9) + t * (rt.finalSmashAnim > 0 ? 34 : 20);
          const fGrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, radius);
          fGrad.addColorStop(0, `rgba(254, 249, 195, ${0.82 * intensity * (1 - t * 0.25)})`);
          fGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.65 * intensity * (1 - t * 0.2)})`);
          fGrad.addColorStop(0.75, `rgba(225, 29, 72, ${0.35 * intensity * (1 - t * 0.25)})`);
          fGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(fx, fy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 9e. Demon King Abyssal Void Lightning & Soul-Drain Curse VFX (Stage 5 ONLY)
      if (rt.demonCurseAnim > 0.05 && isDemonStage) {
        const intensity = rt.demonCurseAnim;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, intensity * 1.25);

        // Dark crimson-magenta lightning arc from Demon King blade to Hero
        ctx.strokeStyle = '#e879f9';
        ctx.shadowColor = '#c026d3';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const startX = monsterX - monsterDrawW * 0.24;
        const startY = monsterCenterY;
        ctx.moveTo(startX, startY);
        for (let seg = 1; seg <= 6; seg += 1) {
          const t = seg / 6;
          const lx = startX + (heroBaseX - startX) * t;
          const ly = startY + (heroCenterY - startY) * t + Math.sin(now * 0.04 + seg * 2.3) * 18;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        // Cursed Void Seal Ring locking around Hero
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(heroBaseX, heroCenterY, 44 * (1.2 - intensity * 0.35), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 10. Particles & Floating Combat / Loot Texts
      for (let i = rt.particles.length - 1; i >= 0; i -= 1) {
        const p = rt.particles[i];
        p.xRatio += p.vx / w;
        p.yRatio += p.vy / h;
        p.alpha -= 0.032;
        if (p.alpha <= 0) {
          rt.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.xRatio * w, p.yRatio * h, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = rt.floatingTexts.length - 1; i >= 0; i -= 1) {
        const ft = rt.floatingTexts[i];
        ft.yRatio += ft.vy / h;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
          rt.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(9, 13, 24, 0.9)';
        ctx.strokeText(ft.text, ft.xRatio * w, ft.yRatio * h);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.xRatio * w, ft.yRatio * h);
        ctx.restore();
      }

      ctx.restore(); // restore screenShake transform
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [round, wordIdx, activeQ, activeSkin, expectedMonsterGold, currentMonster, queues, effectiveCombatRound]);

  const syncRpgProfileToServer = (profileToSync, mode = 'knight_gacha_sync') => {
    if (!profileToSync) return;
    onSyncKnightResult?.({
      score: profileToSync.bestScore || 0,
      passedCount: 1,
      totalCount: 1,
      topicId,
      topicLabel: resolveSelectedTopicLabel(),
      mode,
      gameType: 'knight_rpg',
      knightRpgProfile: profileToSync
    });
  };

  const handleEquipSkin = (skin) => {
    if (!skin) return;
    const isUnlocked = rpgProfile.unlockedSkins.includes(skin.id);
    if (!isUnlocked) {
      showToast?.('Nhân vật hiện không thể mua trực tiếp — Hãy quay Cầu Nguyện Gacha để sở hữu!', 'info');
      return;
    }
    let updatedProfile = null;
    updateAndPersistProfile(prev => {
      updatedProfile = {
        ...prev,
        equippedSkin: skin.id
      };
      return updatedProfile;
    });
    if (updatedProfile) syncRpgProfileToServer(updatedProfile, 'knight_equip_sync');
    showToast?.(`⚔️ Đã trang bị nhân vật: ${skin.name}!`);
  };

  const handleEquipHeroWeapon = (heroId, weaponId) => {
    const heroObj = KNIGHT_CHARACTER_SKINS.find(s => s.id === heroId);
    if (!heroObj) return;
    if (!weaponId) {
      let updatedProfile = null;
      updateAndPersistProfile(prev => {
        const nextMap = { ...(prev.heroEquippedWeapons || {}) };
        delete nextMap[heroId];
        updatedProfile = { ...prev, heroEquippedWeapons: nextMap };
        return updatedProfile;
      });
      if (updatedProfile) syncRpgProfileToServer(updatedProfile, 'knight_equip_sync');
      showToast?.(`Đã gỡ vũ khí trang trí của ${heroObj.name}.`);
      return;
    }

    const wpObj = KNIGHT_GACHA_WEAPONS.find(w => w.id === weaponId);
    if (!wpObj || !(rpgProfile.unlockedWeapons || []).includes(wpObj.id)) {
      showToast?.('Bạn chưa sở hữu vũ khí này!', 'error');
      return;
    }
    if (!canHeroEquipWeapon(heroObj, wpObj)) {
      showToast?.(
        `${heroObj.name} thuộc ${heroObj.weaponClassLabel}, không thể cầm ${wpObj.weaponClassLabel}!`,
        'error'
      );
      return;
    }

    let updatedProfile = null;
    updateAndPersistProfile(prev => {
      updatedProfile = {
        ...prev,
        heroEquippedWeapons: {
          ...(prev.heroEquippedWeapons || {}),
          [heroId]: wpObj.id
        }
      };
      return updatedProfile;
    });
    if (updatedProfile) syncRpgProfileToServer(updatedProfile, 'knight_equip_sync');
    showToast?.(`🗡️ ${heroObj.name} đã cầm ${wpObj.name} (Trang trí)!`);
  };

  const handleExchangeGoldForWishes = (wishCount = 1) => {
    const count = wishCount === 10 ? 10 : 1;
    const costGold = count * KNIGHT_GACHA_GOLD_SINGLE;
    if ((rpgProfile.gold || 0) < costGold) {
      showToast?.(
        `Chưa đủ Vàng! Cần ${costGold.toLocaleString('vi-VN')} 🪙 Vàng để đổi +${count} 🌠 Lượt Quay (Hiện có ${(rpgProfile.gold || 0).toLocaleString('vi-VN')} 🪙).`,
        'error'
      );
      return;
    }
    let updatedProfile = null;
    updateAndPersistProfile(prev => {
      updatedProfile = {
        ...prev,
        gold: Math.max(0, (prev.gold || 0) - costGold),
        wishes: (prev.wishes || 0) + count
      };
      return updatedProfile;
    });
    if (updatedProfile) syncRpgProfileToServer(updatedProfile, 'knight_gacha_exchange');
    playSound('word_clear');
    showToast?.(`🌠 Đã đổi ${costGold.toLocaleString('vi-VN')} Vàng lấy +${count} lượt quay Gacha!`);
  };

  const handleExecuteGachaPull = ({ bannerType, bannerId, count }) => {
    const rollResult = rollKnightGachaPulls(rpgProfile, {
      bannerType,
      bannerId,
      count,
      gachaConfig: knightGachaConfig,
      isAdminFreePull: isStrictAdmin
    });
    if (!rollResult.ok) {
      showToast?.(rollResult.error, 'error');
      return rollResult;
    }
    const saved = saveLocalKnightRpgProfile(username, rollResult.nextProfile);
    setRpgProfile(saved);
    syncRpgProfileToServer(saved, 'knight_gacha_pull');
    return { ...rollResult, nextProfile: saved };
  };

  const handleAdminResetHeroes = () => {
    if (!isStrictAdmin) return;
    let updatedProfile = null;
    updateAndPersistProfile(prev => {
      updatedProfile = {
        ...prev,
        unlockedSkins: ['knight_arthur'],
        equippedSkin: 'knight_arthur',
        unlockedWeapons: [],
        weaponCounts: {},
        heroEquippedWeapons: {},
        equippedWeapon: '',
        gachaState: {
          charPity5: 0,
          charPity4: 0,
          charGuaranteed5: false,
          charGuaranteed4: false,
          stdPity5: 0,
          stdPity4: 0,
          totalPulls: 0
        },
        wishHistory: []
      };
      return updatedProfile;
    });
    if (updatedProfile) syncRpgProfileToServer(updatedProfile, 'knight_admin_reset');
    showToast?.('Đã reset tủ đồ Gacha về mặc định để test!');
  };

  const handleOpenWishQrCheckout = (itemType) => {
    if (!currentUser?.username || currentUser?.isGuest) {
      showToast?.('Vui lòng đăng nhập tài khoản học viên để mua Lượt Quay Gacha bằng VietQR!', 'error');
      return;
    }
    if (!onOpenCheckoutModal) {
      showToast?.('Hệ thống thanh toán đang khởi tạo, vui lòng thử lại sau giây lát.', 'info');
      return;
    }
    onOpenCheckoutModal({ itemType });
  };

  const handleBuyReviveKeyWithGold = () => {
    if ((rpgProfile.gold || 0) < REVIVE_KEY_GOLD_PRICE) {
      showToast?.(`Cần ${REVIVE_KEY_GOLD_PRICE} 🪙 Vàng để đổi 1 🗝️ Chìa Khóa Hồi Sinh!`, 'error');
      return;
    }
    updateAndPersistProfile(prev => ({
      ...prev,
      gold: Math.max(0, (prev.gold || 0) - REVIVE_KEY_GOLD_PRICE),
      keys: (prev.keys || 0) + 1,
      keysCollected: (prev.keysCollected || 0) + 1
    }));
    playSound('word_clear');
    showToast?.('🗝️ Đã đổi 100 Vàng lấy +1 Chìa Khóa Hồi Sinh!');
  };

  const bankItemsCount = parseRawVocabText(resolveSelectedRawVocab()).length;
  const activeWheelMeta = WHEEL_SECTORS.find(s => s.round === demonWheelStyle) || WHEEL_SECTORS[0];

  // Aggregate & deduplicate Knight & Dragon RPG Score Leaderboard for the waiting screen (resets every Monday 00:00 VN)
  const knightLeaderboardRows = (() => {
    const { weekStartMs, weekKey: currentWeekKey } = getVietnamMondayWeekState(Date.now());
    const byUser = new Map();
    const upsertRow = (unameRaw, candidate) => {
      const cleanUname = String(unameRaw || '').trim();
      if (!cleanUname) return;
      const key = cleanUname.toLowerCase();
      const userObj =
        usersDb?.[cleanUname] ||
        Object.values(usersDb || {}).find(
          u => u && String(u.username || '').toLowerCase() === key
        ) ||
        (cleanUname === username ? currentUser : null);
      const nextScore = Math.max(0, Math.floor(Number(candidate.score) || 0));
      const existing = byUser.get(key);
      const profileObj =
        cleanUname === username
          ? rpgProfile
          : userObj?.knightRpgProfile || candidate.knightRpgProfile || {};
      const monstersSlain = Math.max(
        existing?.monstersSlain || 0,
        Math.floor(Number(profileObj?.monstersSlain) || 0)
      );
      const dragonsSlain = Math.max(
        existing?.dragonsSlain || 0,
        Math.floor(Number(profileObj?.dragonsSlain) || 0)
      );

      if (!existing || nextScore > existing.score) {
        byUser.set(key, {
          username: userObj?.username || cleanUname,
          name: userObj?.name || candidate.name || cleanUname,
          userObj: userObj || { username: cleanUname, name: candidate.name || cleanUname },
          score: Math.max(existing?.score || 0, nextScore),
          accuracyPct: candidate.accuracyPct ?? existing?.accuracyPct ?? 100,
          topicLabel: candidate.topicLabel || existing?.topicLabel || 'Hành Trình Đồ Long',
          monstersSlain,
          dragonsSlain
        });
      } else {
        existing.monstersSlain = monstersSlain;
        existing.dragonsSlain = dragonsSlain;
      }
    };

    (Array.isArray(gamePracticeLeaderboard) ? gamePracticeLeaderboard : []).forEach(entry => {
      if (!entry?.username) return;
      if (Number(entry.updatedAtMs) > 0 && Number(entry.updatedAtMs) < weekStartMs) return;
      const isKnight =
        entry.gameType === 'knight_rpg' ||
        String(entry.mode || '').toLowerCase().startsWith('knight');
      if (!isKnight) return;
      const best = Math.max(Number(entry.score) || 0, Number(entry.lastScore) || 0);
      if (best <= 0) return;
      upsertRow(entry.username, {
        name: entry.name,
        score: best,
        accuracyPct: entry.accuracyPct ?? 100,
        topicLabel: entry.topicLabel || 'Hành Trình Đồ Long'
      });
    });

    Object.values(usersDb || {}).forEach(u => {
      if (!u?.username) return;
      const uWeekKey = u?.knightRpgProfile?.bestScoreWeekKey;
      if (uWeekKey && uWeekKey !== currentWeekKey) return;
      const pBest = Math.floor(Number(u?.knightRpgProfile?.bestScore) || 0);
      if (pBest > 0) {
        upsertRow(u.username, {
          name: u.name,
          score: pBest,
          knightRpgProfile: u.knightRpgProfile
        });
      }
    });

    if (
      username &&
      Number(rpgProfile?.bestScore) > 0 &&
      (!rpgProfile?.bestScoreWeekKey || rpgProfile.bestScoreWeekKey === currentWeekKey)
    ) {
      upsertRow(username, {
        name: currentUser?.name || username,
        score: Number(rpgProfile.bestScore) || 0,
        knightRpgProfile: rpgProfile
      });
    }

    return Array.from(byUser.values())
      .filter(r => r.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.dragonsSlain - a.dragonsSlain ||
          b.monstersSlain - a.monstersSlain
      )
      .slice(0, 10);
  })();

  return (
    <div
      data-testid="knight-dragon-game-root"
      className="min-h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172B] dark:text-white flex flex-col select-none relative overflow-x-hidden transition-colors duration-200"
    >
      {/* Redesigned Sleek RPG Command Bar */}
      <header className="shrink-0 bg-white/95 dark:bg-[#11131A]/95 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2.5 flex-wrap z-30">
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToGameHub && (
            <button
              type="button"
              data-testid="knight-back-to-hub-btn"
              onClick={() => {
                clearAllTimers();
                onBackToGameHub();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-extrabold text-zinc-800 dark:text-zinc-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Đổi Game</span>
            </button>
          )}

          <button
            type="button"
            data-testid="switch-to-space-game-btn"
            onClick={() => {
              clearAllTimers();
              onBackToSpaceMode?.();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-cyan-50 dark:bg-zinc-800/80 dark:hover:bg-cyan-950/40 text-xs font-bold text-zinc-700 dark:text-cyan-300 transition"
          >
            <span>🚀 Phi Thuyền</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (matchState === 'HUB') setHubSubPage('MAIN');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black shadow-xs transition"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Hiệp Sĩ Diệt Rồng</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Unified Economy Capsule */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-black tabular-nums">
            <span data-testid="knight-gold-badge" className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{Number(rpgProfile.gold || 0).toLocaleString('vi-VN')} Vàng</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span data-testid="knight-keys-badge" className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-300" title="Chìa Khóa Hồi Sinh">
              <KeyRound className="w-3.5 h-3.5 text-sky-500" />
              <span>{rpgProfile.keys || 0}</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span data-testid="knight-wishes-badge" className="text-fuchsia-700 dark:text-fuchsia-300" title="Lượt Quay Gacha">
              🌠 {rpgProfile.wishes || 0} Lượt
            </span>
          </div>

          {/* Dedicated Page 1: NHÂN VẬT */}
          <button
            type="button"
            data-testid="open-knight-characters-btn"
            onClick={() => {
              if (matchState !== 'HUB') {
                clearAllTimers();
                setMatchState('HUB');
                runtimeRef.current.matchState = 'HUB';
              }
              setHubSubPage('CHARACTERS');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition ${
              matchState === 'HUB' && hubSubPage === 'CHARACTERS'
                ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                : 'bg-zinc-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300" />
            <span>
              Nhân Vật ({isStrictAdmin ? KNIGHT_CHARACTER_SKINS.length : rpgProfile.unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})
            </span>
          </button>

          {/* Dedicated Page 2: VÒNG QUAY GACHA */}
          <button
            type="button"
            data-testid="open-knight-shop-btn"
            onClick={() => {
              if (matchState !== 'HUB') {
                clearAllTimers();
                setMatchState('HUB');
                runtimeRef.current.matchState = 'HUB';
              }
              setGachaInitialTab('character_event');
              setHubSubPage('GACHA');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-xs ${
              matchState === 'HUB' && hubSubPage === 'GACHA'
                ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-200'
                : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gacha</span>
          </button>

          {isTeacherOrAdmin && onOpenVocabManager && (
            <button
              type="button"
              data-testid="knight-open-vocab-manager-btn"
              onClick={() => onOpenVocabManager(resolveSelectedRawVocab())}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Bộ Đề</span>
            </button>
          )}

          <button
            type="button"
            data-testid="knight-bgm-toggle-btn"
            onClick={handleToggleBgm}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-extrabold transition ${
              bgmMuted
                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                : 'bg-violet-50 dark:bg-violet-500/15 border-violet-300 dark:border-violet-400/40 text-violet-700 dark:text-violet-200'
            }`}
            title={bgmMuted ? 'Bật nhạc nền' : 'Tắt nhạc nền'}
          >
            {bgmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
            <span>
              {bgmMuted
                ? 'Nhạc: Tắt'
                : `Nhạc: ${KNIGHT_BGM_TRACKS[activeBgmTrackId]?.label || 'Sảnh Lâu Đài'}`}
            </span>
          </button>

          {setDarkMode && (
            <button
              type="button"
              data-testid="knight-theme-toggle-btn"
              onClick={() => setDarkMode(d => !d)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
              title={darkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              clearAllTimers();
              onExitArena?.();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/50 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-rose-600 transition"
          >
            Thoát
          </button>
        </div>
      </header>

      {/* PAGE 1: 1 VS 1 PVP ARENA */}
      {matchState === 'HUB' && hubSubPage === 'PVP' && (
        <KnightPvpArena
          bgmMuted={bgmMuted}
          currentUser={currentUser}
          dispatchSyncAction={dispatchSyncAction}
          effectiveRawVocab={resolveSelectedRawVocab()}
          isStrictAdmin={isStrictAdmin}
          knightPvpLeaderboard={knightPvpLeaderboard}
          knightPvpRealtime={knightPvpRealtime}
          onBackToKnightHub={() => setHubSubPage('MAIN')}
          onPvpCombatStateChange={setIsPvpFighting}
          onRewardGoldSynced={goldAdded => {
            updateAndPersistProfile(prev => ({
              ...prev,
              gold: (prev.gold || 0) + goldAdded
            }));
          }}
          onSelectTopicId={setTopicId}
          rpgProfile={rpgProfile}
          showToast={showToast}
          topicId={topicId}
          topicOptions={[
            { id: 'core', title: '🎯 IELTS Core Academic' },
            ...Object.entries(VOCAB_PRESETS || {}).map(([k, preset]) => ({
              id: k,
              title: `📚 ${preset.label}`
            })),
            ...(customVocabTopics || []).map(t => ({
              id: `custom:${t.id}`,
              title: `⭐ ${t.label}`
            }))
          ]}
          usersDb={usersDb}
        />
      )}

      {/* PAGE 2: DEDICATED CHARACTER ROSTER PAGE */}
      {matchState === 'HUB' && hubSubPage === 'CHARACTERS' && (
        <KnightCharacterPage
          bgmMuted={bgmMuted}
          isStrictAdmin={isStrictAdmin}
          onBackToHub={() => setHubSubPage('MAIN')}
          onEquipSkin={handleEquipSkin}
          onOpenGachaTab={tabName => {
            setGachaInitialTab(tabName || 'character_event');
            setHubSubPage('GACHA');
          }}
          onToggleBgm={handleToggleBgm}
          rpgProfile={rpgProfile}
          showToast={showToast}
        />
      )}

      {/* PAGE 3: DEDICATED FULL-PAGE MEME GACHA SHRINE */}
      {matchState === 'HUB' && hubSubPage === 'GACHA' && (
        <KnightGachaModal
          isOpen
          initialTab={gachaInitialTab}
          isStrictAdmin={isStrictAdmin}
          bgmMuted={bgmMuted}
          onToggleBgm={handleToggleBgm}
          onCutsceneActiveChange={setIsGachaCutsceneActive}
          onOpenCharactersPage={() => setHubSubPage('CHARACTERS')}
          knightGachaConfig={knightGachaConfig}
          usersDb={usersDb}
          currentUsername={username}
          rpgProfile={rpgProfile}
          paymentConfig={paymentConfig}
          onClose={() => setHubSubPage('MAIN')}
          onExecutePull={handleExecuteGachaPull}
          onAdminResetHeroes={handleAdminResetHeroes}
          onAdminGrantGachaWishes={onAdminGrantGachaWishes}
          onAdminSetGachaBannerConfig={onAdminSetGachaBannerConfig}
          onExchangeGoldForWishes={handleExchangeGoldForWishes}
          onBuyReviveKeyWithGold={handleBuyReviveKeyWithGold}
          onOpenWishQrCheckout={handleOpenWishQrCheckout}
          showToast={showToast}
        />
      )}

      {/* PAGE 4: MAIN SOLO CAMPAIGN HUB */}
      {matchState === 'HUB' && hubSubPage === 'MAIN' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className="rounded-3xl border border-rose-200 dark:border-rose-500/35 bg-gradient-to-br from-white via-[#FFF5F7] to-[#FEFCE8]/70 dark:from-slate-900 dark:via-[#1a1025] dark:to-slate-900 p-5 sm:p-7 shadow-xl dark:shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-400/40 text-rose-800 dark:text-rose-300 text-xs font-extrabold">
                  🐉 VƯỢT 4 ẢI: SLIME ➔ GOBLIN ➔ ORC ➔ BOSS RỒNG
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172B] dark:text-white">
                  Hiệp Sĩ Diệt Rồng — Đấu Trường Từ Vựng RPG
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 max-w-2xl leading-relaxed">
                  Đánh bại quái vật và Boss Rồng qua 4 ải để tích Vàng mở khóa nhân vật &amp; vũ khí trong Gacha.
                </p>
                {isStarterGiftUnclaimed && (
                  <div
                    data-testid="knight-hub-starter-gift-banner"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-rose-500/20 border border-amber-400/70 text-amber-900 dark:text-amber-200 text-xs font-black shadow-xs"
                  >
                    <span>🎁 Quà Tân Thủ:</span>
                    <span>
                      Chơi xong ván game đầu tiên tặng ngay{' '}
                      <b className="text-rose-600 dark:text-amber-300 underline">
                        +{STARTER_FIRST_GAME_FREE_WISHES} 🌠 Lượt Quay miễn phí
                      </b>
                      !
                    </span>
                  </div>
                )}
              </div>

              {/* Active Hero Showcase Card (Clean, Zero Weapons) */}
              <div className="shrink-0 rounded-2xl border border-pink-300 dark:border-pink-500/40 bg-white/95 dark:bg-slate-950/90 p-3 flex items-center gap-3.5 shadow-md dark:shadow-lg">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 p-1 shadow-inner relative overflow-hidden shrink-0"
                  style={{
                    background: `radial-gradient(circle at 50% 45%, ${activeSkin.bladeColor}33, #090d16 80%)`,
                    borderColor: activeSkin.armorSecondary
                  }}
                >
                  <img
                    src={activeSkin.spriteUrl}
                    alt={activeSkin.name}
                    className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
                  />
                </div>
                <div className="min-w-0 max-w-[215px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#0F172B] dark:text-white truncate">{activeSkin.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 text-xs font-extrabold shrink-0">
                      {activeSkin.starRarity || 4}★
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-slate-400 leading-snug line-clamp-2 mt-1">
                    {activeSkin.passiveText}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHubSubPage('CHARACTERS')}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition"
                  >
                    Nhân Vật
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGachaInitialTab('character_event');
                      setHubSubPage('GACHA');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:opacity-95 text-white text-xs font-extrabold transition"
                  >
                    🌠 Gacha
                  </button>
                </div>
              </div>
            </div>

            {/* Vocab Topic & Speed Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/95 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-[#334155] dark:text-slate-300">
                    Chọn Kho Từ Vựng ({bankItemsCount} từ)
                  </label>
                  {isTeacherOrAdmin && onOpenVocabManager && (
                    <button
                      type="button"
                      data-testid="knight-hub-manage-vocab-btn"
                      onClick={() => onOpenVocabManager(resolveSelectedRawVocab())}
                      className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200 underline underline-offset-2 transition"
                    >
                      + Tạo / Sửa bộ đề
                    </button>
                  )}
                </div>
                <select
                  value={topicId}
                  onChange={e => setTopicId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                >
                  <option value="core">🎯 IELTS Core Academic (Mặc định)</option>
                  {Object.entries(VOCAB_PRESETS || {}).map(([k, preset]) => (
                    <option key={k} value={k}>
                      📚 {preset.label}
                    </option>
                  ))}
                  {(customVocabTopics || []).map(t => (
                    <option key={t.id} value={`custom:${t.id}`}>
                      ⭐ {t.label}
                    </option>
                  ))}
                  {roomRawVocab && (
                    <option value="room_custom">🏫 Bộ từ Phòng Đấu #{roomPin}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">
                  Số Quái Vật Mỗi Ải
                </label>
                <select
                  value={roundSize}
                  onChange={e => setRoundSize(Number(e.target.value) || 8)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white"
                >
                  {[4, 8, 12, 16, 20, 30].map(n => (
                    <option key={n} value={n}>
                      {n} quái vật / ải
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">
                  Tốc Độ Quái Tấn Công
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'relaxed', label: 'Chậm' },
                    { id: 'normal', label: 'Chuẩn' },
                    { id: 'turbo', label: 'Nhanh' }
                  ].map(sp => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setSpeedMode(sp.id)}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                        speedMode === sp.id
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-white dark:bg-slate-900 text-[#334155] dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Full 4-Stage Campaign + Admin/Teacher Per-Map Practice Controls */}
            <div className="space-y-3">
              {!hasKnightPass && (
                <div
                  data-testid="knight-monthly-pass-gate"
                  className="vip-pvp-card rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-fuchsia-500/15 border-2 border-amber-400/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-black uppercase">
                      <Lock className="w-3 h-3" /> Yêu Cầu Thẻ Tháng {formatVndCurrency(knightMonthlyPriceVnd)}
                    </div>
                    <p className="text-sm font-black text-[#0F172B] dark:text-white">
                      Mở khóa trọn gói Hiệp Sĩ Diệt Rồng &amp; Đấu Trường 1 vs 1 chỉ {formatVndCurrency(knightMonthlyPriceVnd)} / tháng
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-300">
                      Bao gồm vượt 4 Ải RPG, Song Đấu 1v1 Xếp Hạng, tích Vàng quay Gacha Meme và đặc quyền Hồ Sơ VIP.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="buy-knight-monthly-pass-btn"
                    onClick={promptBuyKnightMonthlyPass}
                    className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:opacity-95 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shrink-0 transition"
                  >
                    👑 Mua Thẻ Tháng ({formatVndCurrency(knightMonthlyPriceVnd)})
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  data-testid="start-knight-campaign-btn"
                  onClick={() => startKnightCampaign(1, false)}
                  className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 hover:opacity-95 text-slate-950 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition"
                >
                  {hasKnightPass ? <Swords className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  <span>
                    {hasKnightPass
                      ? 'XUẤT CHINH (4 ẢI)'
                      : `🔒 MỞ KHÓA XUẤT CHINH (THẺ THÁNG ${formatVndCurrency(knightMonthlyPriceVnd)})`}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="open-knight-pvp-btn"
                  onClick={() => {
                    if (!hasKnightPass) {
                      promptBuyKnightMonthlyPass();
                      return;
                    }
                    setHubSubPage('PVP');
                  }}
                  className="sm:w-auto py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-amber-500 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition shrink-0"
                >
                  {hasKnightPass ? <Swords className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{hasKnightPass ? '⚔️ ĐẤU TRƯỜNG 1 VS 1' : '🔒 1 VS 1 (THẺ THÁNG)'}</span>
                </button>

                {isStrictAdmin && (
                  <button
                    type="button"
                    data-testid="admin-test-demon-king-btn"
                    onClick={handleAdminStartDemonKingTest}
                    className="sm:w-auto py-3.5 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-700 via-purple-700 to-rose-700 hover:opacity-95 border border-fuchsia-400/60 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 transition shrink-0"
                    title="Chỉ tài khoản Admin: Test màn ẩn"
                  >
                    <span>👿 Test Màn Ẩn (Admin)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[11px] font-bold text-[#475569] dark:text-slate-400">
                  {isStrictAdmin
                    ? '🛡️ Quyền Admin: Bấm vào bất kỳ bản đồ Ải 1–4 để luyện tập/kiểm thử riêng hoặc test màn ẩn.'
                    : isTeacherOrAdmin
                    ? '🛡️ Quyền Giáo viên: Bấm vào bất kỳ bản đồ Ải 1–4 bên dưới để luyện tập hoặc kiểm thử riêng từng map.'
                    : '🗺️ Lộ trình chinh phục 4 Ải (Học viên luôn xuất phát từ Ải 1 — Chỉ Admin/Giáo viên mới được chọn luyện tập riêng từng map).'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {KNIGHT_MONSTER_STAGES.map(st => {
                  const cardContent = (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400">{st.shortTitle}</span>
                        {st.round === 4 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                            FINAL BOSS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            Ải {st.round}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-xl bg-slate-900/90 border border-slate-800/90">
                        {st.monsters.map(m => (
                          <div key={m.id} className="flex flex-col items-center gap-0.5" title={m.name}>
                            <img
                              src={m.spriteUrl}
                              alt={m.name}
                              className={
                                st.round === 4
                                  ? 'w-20 h-16 object-contain drop-shadow-[0_4px_10px_rgba(244,63,94,0.65)]'
                                  : 'w-12 h-12 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]'
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] font-bold text-[#0F172B] dark:text-slate-200">{st.mechanicLabel}</p>
                      <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-snug">{st.questionDesc}</p>

                      {!isTeacherOrAdmin && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-[#475569] dark:text-slate-400">
                          <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400/80" />
                          <span>{st.round === 1 ? 'Bắt đầu từ nút Xuất Chinh ở trên' : 'Vượt ải trước để mở khóa'}</span>
                        </div>
                      )}
                    </div>
                  );

                  if (isTeacherOrAdmin) {
                    return (
                      <button
                        key={st.round}
                        type="button"
                        data-testid={`start-knight-stage-${st.round}`}
                        onClick={() => startKnightCampaign(st.round, true)}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                          st.round === 4
                            ? 'bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/45 dark:hover:bg-rose-900/55 border-rose-300 dark:border-rose-500/50 text-[#0F172B] dark:text-rose-100'
                            : 'bg-white hover:bg-amber-50/50 dark:bg-slate-950/85 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-[#0F172B] dark:text-slate-100'
                        }`}
                      >
                        {cardContent}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={st.round}
                      data-testid={`locked-knight-stage-${st.round}`}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 opacity-90 ${
                        st.round === 4
                          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/35 text-[#0F172B] dark:text-rose-100'
                          : 'bg-white/90 dark:bg-slate-950/65 border-slate-200 dark:border-slate-800 text-[#0F172B] dark:text-slate-100'
                      }`}
                    >
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Player RPG Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                <p className="text-[11px] text-[#475569] dark:text-slate-400 font-bold">Quái Đã Hạ</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{rpgProfile.monstersSlain || 0}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                <p className="text-[11px] text-[#475569] dark:text-slate-400 font-bold">
                  {(rpgProfile.demonKingsSlain || 0) > 0 ? 'Rồng / Boss Ẩn Đã Hạ' : 'Boss Rồng Đã Hạ'}
                </p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {rpgProfile.dragonsSlain || 0} 🐉
                  {(rpgProfile.demonKingsSlain || 0) > 0 ? ` · ${rpgProfile.demonKingsSlain} 👿` : ''}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                <p className="text-[11px] text-[#475569] dark:text-slate-400 font-bold">Kỷ Lục Điểm Hiệp Sĩ</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-300">{rpgProfile.bestScore || 0}đ</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                <p className="text-[11px] text-[#475569] dark:text-slate-400 font-bold">Danh Hiệu Top 1/2/3 Ngày</p>
                <p className="text-xs font-extrabold text-[#007A7A] dark:text-cyan-300 mt-1">Chốt 23:59 • Trao 00:00 hôm sau</p>
              </div>
            </div>

            {/* Knight & Dragon RPG Waiting Screen Score Leaderboard */}
            <div
              data-testid="knight-lobby-leaderboard"
              className="rounded-2xl bg-white/95 dark:bg-slate-950/85 border border-amber-300 dark:border-amber-500/35 p-4 space-y-3 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/90 pb-2.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>BẢNG XẾP HẠNG ĐIỂM — HIỆP SĨ DIỆT RỒNG ({knightLeaderboardRows.length} cao thủ)</span>
                </h3>
                <span className="text-[11px] text-[#475569] dark:text-slate-400 font-bold">
                  Reset 00:00 Thứ 2 hàng tuần • Đua Top 1/2/3 theo ngày
                </span>
              </div>

              {knightLeaderboardRows.length === 0 ? (
                <div className="text-center py-4 space-y-1">
                  <p className="text-xs font-bold text-[#334155] dark:text-slate-300">
                    Chưa có kỷ lục điểm nào trên Bảng Xếp Hạng Hiệp Sĩ Diệt Rồng.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90">
                    ⚔️ Hãy bấm <b>Xuất Chinh Từ Ải 1</b> ngay để mở hàng Top #1 Đệ Nhất Đồ Long!
                  </p>
                </div>
              ) : (
                <VerticalPodiumLeaderboard
                  items={knightLeaderboardRows.map((row, idx) => ({
                    key: `${row.username}-${idx}`,
                    userObj: row.userObj,
                    name: row.name || row.username,
                    isMe: String(row.username || '').toLowerCase() === String(username || '').toLowerCase(),
                    subtitle: `${row.topicLabel} • ⚔️ ${row.monstersSlain} quái • 🐉 ${row.dragonsSlain} Rồng`,
                    scoreText: `${Number(row.score || 0).toLocaleString('vi-VN')}đ`
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE GAMEPLAY SCREEN */}
      {matchState !== 'HUB' && (
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-2 sm:p-4 gap-2.5 min-h-0">
          {/* HUD Status Strip */}
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-lg text-white text-xs font-black ${
                  isDemonKingBattle ? 'bg-gradient-to-r from-fuchsia-600 to-rose-600' : 'bg-rose-600'
                }`}
              >
                {stageMeta.shortTitle}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0F172B] dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-transparent">
                {isDemonKingBattle
                  ? `Đòn ${wordIdx + 1}/${(queues[5] || []).length || 1} (Luật Vòng ${demonWheelStyle})`
                  : `Quái ${wordIdx + 1}/${(queues[round] || []).length || 1}: ${currentMonster?.name}`}
              </span>
              <span
                data-testid="knight-lives-display"
                className="text-sm tracking-wider"
                title={`Còn ${lives} mạng`}
              >
                {lives > 0 ? '❤️'.repeat(lives) : '💀'}
              </span>
              {isDemonKingBattle && matchState === 'PLAYING' && (
                <span
                  data-testid="demon-curse-timer-badge"
                  className="px-2.5 py-1 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-600/25 border border-fuchsia-300 dark:border-fuchsia-400/60 text-fuchsia-800 dark:text-fuchsia-200 text-xs font-black animate-pulse"
                >
                  👿 Rút 1 ❤️ sau: {demonCurseLeft}s
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black flex items-center gap-1 border ${
                  timeLeft <= 5
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-500 animate-pulse'
                    : 'bg-[#EDFFFD] dark:bg-cyan-500/15 text-[#007A7A] dark:text-cyan-300 border-[#B5F5F1] dark:border-cyan-500/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {timeLeft}s
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">Combo x{combo}</span>
              <span data-testid="knight-score-display" className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {score}đ
              </span>
              <button
                type="button"
                onClick={handleUseFreeze}
                disabled={freezeCharges <= 0}
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 disabled:opacity-40 border border-sky-300 dark:border-sky-400/40 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1"
              >
                <Snowflake className="w-3 h-3" /> +8s ({freezeCharges})
              </button>
              {(effectiveCombatRound === 2 || effectiveCombatRound === 4) && (
                <button
                  type="button"
                  data-testid="knight-hint-btn"
                  onClick={handleUseHint}
                  disabled={score < KNIGHT_HINT_SCORE_COST}
                  title={
                    score < KNIGHT_HINT_SCORE_COST
                      ? `Cần tối thiểu ${KNIGHT_HINT_SCORE_COST} điểm mới được dùng Gợi ý!`
                      : `Mở gợi ý đáp án (-${KNIGHT_HINT_SCORE_COST}đ)`
                  }
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
                    score >= KNIGHT_HINT_SCORE_COST
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border-amber-300 dark:border-amber-400/40 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" /> Gợi ý (-{KNIGHT_HINT_SCORE_COST}đ)
                </button>
              )}
            </div>
          </div>

          {/* Side-Scrolling RPG Monster Duel Canvas */}
          <div className="relative h-64 sm:h-72 w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950 shrink-0">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Monster Gold & Rare Key Drop Info Pill */}
            <div
              data-testid="knight-loot-info-pill"
              className="absolute bottom-2 right-2.5 flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 z-20 text-[11px] font-bold text-slate-200 backdrop-blur-xs"
            >
              {isDemonKingBattle ? (
                <>
                  <span className="text-fuchsia-300">
                    👿 Hạ Ma Vương: +1.000 Vàng &amp; +10 🗝️ Chìa Khóa
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-300">⛓️ Chết không thể hồi sinh</span>
                </>
              ) : (
                <span className="text-amber-300">
                  Hạ {currentMonster?.name}: Rớt +{expectedMonsterGold} Vàng
                </span>
              )}
            </div>

            {bannerAlert && (
              <div
                className={`absolute top-2.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl text-xs font-extrabold border shadow-lg z-20 max-w-[92%] text-center ${
                  bannerAlert.kind === 'error'
                    ? 'bg-rose-600/95 text-white border-rose-300'
                    : 'bg-emerald-600/95 text-white border-emerald-300'
                }`}
              >
                {bannerAlert.text}
              </div>
            )}

            {/* SUPER SMASH BROS. DRAGON FINAL SMASH OVERLAY */}
            {matchState === 'FINAL_SMASH' && (
              <div
                data-testid="dragon-final-smash-overlay"
                className="absolute inset-0 bg-gradient-to-br from-red-950/95 via-black/90 to-rose-950/95 flex flex-col items-center justify-center p-4 text-center z-40 animate-pulse"
              >
                <div className="w-full py-2.5 bg-gradient-to-r from-transparent via-red-600 to-transparent border-y-2 border-amber-300 shadow-[0_0_40px_rgba(239,68,68,0.9)] -rotate-2">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
                    ⚡ SUPER SMASH FINISHER • SKILL TẤT SÁT KẾT LIỄU ⚡
                  </p>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wider">
                    🐉 LONG HỎA DIỆT THẾ — K.O.!
                  </h2>
                </div>
                <p className="text-xs sm:text-sm font-bold text-rose-200 mt-3 max-w-md">
                  {finalSmashReason}
                </p>
              </div>
            )}

            {/* 5-SECOND DEATH DELAY WITH ANIMATED TOMBSTONE ("BIA MỘ HIỆP SĨ") BEFORE REVIVE MODAL */}
            {matchState === 'DEATH_COUNTDOWN' && (
              <div
                data-testid="knight-death-countdown-overlay"
                className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-40 space-y-2"
              >
                <div
                  data-testid="knight-tombstone-graphic"
                  className="relative flex items-center justify-center"
                >
                  {/* Glowing Ghostly Aura Ring */}
                  <div className="absolute -inset-3 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
                  {/* Illustrated SVG Gothic Tombstone & Planted Sword */}
                  <svg viewBox="0 0 120 110" className="w-24 h-24 drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]">
                    <ellipse cx="60" cy="98" rx="44" ry="8" fill="rgba(15,23,42,0.85)" />
                    {/* Planted Hero Sword beside Tombstone */}
                    <g transform="translate(86, 88) rotate(18)">
                      <rect x="-2.5" y="-44" width="5" height="44" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
                      <rect x="-10" y="-47" width="20" height="4.5" rx="1.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.2" />
                      <rect x="-2" y="-59" width="4" height="12" fill="#78350f" />
                      <circle cx="0" cy="-61" r="3.8" fill="#fde047" />
                    </g>
                    {/* Gothic Arched Stone Headstone */}
                    <path
                      d="M34 90 L34 46 A24 24 0 0 1 82 46 L82 90 Z"
                      fill="#64748b"
                      stroke="#1e293b"
                      strokeWidth="3"
                    />
                    <path
                      d="M39 86 L39 47 A19 19 0 0 1 77 47 L77 86"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.4"
                      opacity="0.5"
                    />
                    {/* Pedestal Base */}
                    <rect x="28" y="86" width="60" height="7" rx="2.5" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                    <rect x="23" y="92" width="70" height="7" rx="2.5" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    {/* Carved Cross & R.I.P */}
                    <rect x="56" y="34" width="4" height="15" fill="#1e293b" />
                    <rect x="51" y="38" width="14" height="4" fill="#1e293b" />
                    <text x="58" y="68" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="900" fontFamily="monospace">
                      R.I.P
                    </text>
                    {/* Floating Soul Wisp */}
                    <circle cx="42" cy="22" r="6" fill="#38bdf8" opacity="0.65" />
                    <circle cx="42" cy="22" r="3" fill="#e0f2fe" />
                  </svg>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-rose-400 tracking-wide drop-shadow">
                  🪦 HIỆP SĨ ĐÃ NGÃ XUỐNG!
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 font-bold bg-slate-900/90 border border-slate-700 px-3.5 py-1 rounded-full">
                  Triệu hồi Bảng Hồi Sinh sau{' '}
                  <span className="text-amber-300 text-base font-black font-mono px-1">
                    {deathCountdownSec}s
                  </span>
                  ...
                </p>
              </div>
            )}

            {/* HOLY RESURRECTION ("HỒI SINH PHÁ BIA MỘ") CINEMATIC FLASH OVERLAY */}
            {reviveCelebration && (
              <div
                data-testid="knight-revive-animation-overlay"
                className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 text-center z-30"
              >
                <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/95 via-yellow-400/95 to-cyan-400/95 text-slate-950 border-2 border-white shadow-[0_0_45px_rgba(250,204,21,0.95)] animate-bounce">
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    ⚡ THÁNH QUANG PHÁ BIA MỘ • {reviveCelebration.methodLabel} ⚡
                  </p>
                  <p className="text-base sm:text-xl font-black">
                    🗝️ HỒI SINH ĐẦY 3 ❤️ — TIẾP TỤC CHIẾN ĐẤU!
                  </p>
                </div>
              </div>
            )}

            {/* DEMON KING UNREVIVABLE SOUL-SEAL EXECUTION OVERLAY */}
            {matchState === 'DEMON_EXECUTION' && (
              <div
                data-testid="demon-king-execution-overlay"
                className="absolute inset-0 bg-gradient-to-br from-[#140024]/95 via-black/95 to-[#3d001b]/95 flex flex-col items-center justify-center p-4 text-center z-40 space-y-2.5 animate-pulse"
              >
                <div className="w-full py-3 bg-gradient-to-r from-transparent via-fuchsia-800/90 to-transparent border-y-2 border-rose-400 shadow-[0_0_50px_rgba(217,70,239,0.95)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-fuchsia-200">
                    ⛓️ TUYỆT KỸ ĐOẠT HỒN • PHONG ẤN VĨNH VIỄN ⛓️
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider mt-0.5">
                    👿 HƯ KHÔNG PHONG ẤN — KHÔNG THỂ HỒI SINH!
                  </h2>
                </div>
                <p className="text-xs sm:text-sm font-bold text-rose-200 max-w-md">
                  Ma Vương Hắc Ám Malakor đã khóa chặt linh hồn bạn — Chìa Khóa Hồi Sinh &amp; Vàng đều vô hiệu!
                </p>
              </div>
            )}
          </div>

          {/* Interactive Combat Question Panel */}
          {activeQ && matchState === 'PLAYING' && (
            <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {isDemonKingBattle
                    ? `👿 MA VƯƠNG MALAKOR • CHẾ ĐỘ VÒNG ${demonWheelStyle}: ${activeWheelMeta.title}`
                    : stageMeta.mechanicLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    speakWord(
                      effectiveCombatRound === 4 ? activeQ.v4Display || activeQ.word : activeQ.word
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#EDFFFD] hover:bg-[#D5FBF7] dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 border border-[#B5F5F1] dark:border-transparent text-[#007A7A] dark:text-cyan-300 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm (TAB)
                </button>
              </div>

              {/* Wave 1 (Meaning Shields) & Wave 3 (Syn/Ant/Context Spell Orbs) */}
              {(effectiveCombatRound === 1 || effectiveCombatRound === 3) && (() => {
                const choices =
                  effectiveCombatRound === 1
                    ? (Array.isArray(activeQ.v1Choices) && activeQ.v1Choices.length > 0
                        ? activeQ.v1Choices
                        : [activeQ.word, ...(activeQ.distractors || [])].slice(0, 4))
                    : activeQ.v3Choices || [];
                return (
                  <div className="space-y-3">
                    <p className="text-base sm:text-lg font-extrabold text-[#0F172B] dark:text-white">
                      {effectiveCombatRound === 3
                        ? activeQ.v3Question
                        : `Nghĩa tiếng Việt: "${activeQ.prompt}"`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {choices.map((cText, idx) => (
                        <button
                          key={`${cText}-${idx}`}
                          type="button"
                          data-testid={`knight-choice-${idx}`}
                          onClick={() => handleSelectRuneChoice(cText)}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-slate-700 hover:border-rose-400 text-left flex items-center gap-3 transition group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-rose-600 group-hover:bg-amber-400 group-hover:text-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm font-bold text-[#0F172B] dark:text-slate-100">{cText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Wave 2: Full Word Typing */}
              {effectiveCombatRound === 2 && (
                <div className="space-y-3 text-center">
                  <p className="text-base font-extrabold text-[#0F172B] dark:text-white">
                    Nghĩa: &quot;{activeQ.prompt}&quot; • Phiên âm:{' '}
                    <span className="text-amber-700 dark:text-amber-300 font-mono">{activeQ.ipa || ''}</span>
                  </p>
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {String(activeQ.word || '')
                      .toUpperCase()
                      .split('')
                      .map((ch, idx) => {
                        const isAlpha = /^[A-Z]$/.test(ch);
                        const isTyped = idx < typedProgress || !isAlpha;
                        return (
                          <div
                            key={idx}
                            className={`w-8 h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm border ${
                              isTyped
                                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                                : idx === typedProgress
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {isTyped ? ch : '_'}
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-center gap-1 flex-wrap pt-1">
                    {'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').map(letter => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleWave2KeyInput(letter)}
                        className="w-7 h-8 rounded bg-white hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 dark:hover:text-slate-950 border border-slate-200 dark:border-transparent text-xs font-mono font-bold text-[#0F172B] dark:text-white"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wave 4: Sentence Fill-in-the-Blank Typing */}
              {effectiveCombatRound === 4 && (() => {
                const acceptedList =
                  Array.isArray(activeQ.v4Answers) && activeQ.v4Answers.length > 0
                    ? activeQ.v4Answers
                    : [activeQ.v4Display || activeQ.collocation || activeQ.word];
                const evalRes = matchRound4TypingAnswer(round4Input, acceptedList);
                const bossHpPct = Math.max(0, Math.round((1 - (evalRes.matchRatio || 0)) * 100));

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-500/40 space-y-1.5">
                      <p className="text-sm sm:text-base font-extrabold text-[#0F172B] dark:text-white leading-relaxed">
                        {activeQ.v4Question}
                      </p>
                      {activeQ.v4HintMeaning && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                          💡 Gợi ý nghĩa: {activeQ.v4HintMeaning}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />{' '}
                          {isDemonKingBattle
                            ? `THANH CHÉM MA VƯƠNG: ${bossHpPct}%`
                            : `MÁU RỒNG HẮC ÁM: ${bossHpPct}%`}
                        </span>
                        <span className="text-amber-700 dark:text-amber-300">
                          {evalRes.matched
                            ? '⚡ Đủ sát thương! Nhấn Enter để tung nhát chém kết liễu!'
                            : 'Gõ đúng từ để chém mất máu Boss • Gõ sai bị Boss phản đòn!'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-rose-300 dark:border-rose-500/40">
                        <div
                          className={`h-full transition-all duration-150 ${
                            isDemonKingBattle
                              ? 'bg-gradient-to-r from-fuchsia-600 via-purple-500 to-rose-400'
                              : 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400'
                          }`}
                          style={{ width: `${bossHpPct}%` }}
                        />
                      </div>
                    </div>

                    <form onSubmit={handleWave4Submit} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          data-testid="knight-dragon-boss-input"
                          value={round4Input}
                          onChange={e => handleWave4InputChange(e.target.value)}
                          placeholder={
                            isDemonKingBattle
                              ? 'Gõ từ / cụm từ tiếng Anh để trảm Ma Vương rồi nhấn Enter...'
                              : 'Gõ từ / cụm từ tiếng Anh để chém Rồng Hắc Ám rồi nhấn Enter...'
                          }
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-rose-500/60 focus:border-amber-500 dark:focus:border-amber-400 text-sm font-bold text-[#0F172B] dark:text-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        data-testid="knight-dragon-boss-submit"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 text-xs sm:text-sm font-black shrink-0 flex items-center gap-1.5"
                      >
                        <Swords className="w-4 h-4" /> {isDemonKingBattle ? 'Trảm Ma Vương' : 'Chém Rồng'}
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 6-SECOND RETRO PAC-MAN FLASHING WARNING OVERLAY FOR SECRET DEMON KING BOSS */}
      {matchState === 'DEMON_WARNING' && (() => {
        const flashPhase = pacmanFlashTick % 3;
        const flashBg =
          flashPhase === 0
            ? 'bg-[#0018A8]/95 border-[#38bdf8]'
            : flashPhase === 1
            ? 'bg-[#000000]/96 border-[#facc15]'
            : 'bg-[#990024]/95 border-[#f43f5e]';
        return (
          <div
            data-testid="demon-king-warning-overlay"
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 text-center transition-colors duration-75 border-8 ${flashBg}`}
          >
            {/* Retro Pac-Man Pixel Maze Dots Header */}
            <div className="flex items-center gap-3 mb-4 text-xl sm:text-2xl font-mono tracking-[0.4em] text-yellow-300">
              <span>🟡 · · · · 👻 · · · · 🟡</span>
            </div>

            <div className="max-w-xl w-full rounded-2xl border-4 border-yellow-300 bg-black/90 p-6 sm:p-8 shadow-[0_0_70px_rgba(250,204,21,0.55)] space-y-4">
              <p className="text-xs sm:text-sm font-mono font-black uppercase tracking-[0.3em] text-yellow-300 animate-pulse">
                ⚠️ WARNING! SECRET BOSS ALERT! ⚠️
              </p>

              <div className="flex items-center justify-center gap-4">
                <img
                  src={DEMON_KING_BOSS.spriteUrl}
                  alt={DEMON_KING_BOSS.shortName}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_24px_rgba(232,121,249,0.9)]"
                />
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-fuchsia-300 tracking-wider font-mono">
                MA VƯƠNG ẨN XUẤT HIỆN!
              </h2>

              <div className="py-2 px-4 rounded-xl bg-rose-950/80 border-2 border-rose-400 inline-block">
                <p className="text-sm sm:text-base font-black text-white">
                  ❤️❤️❤️❤️❤️ TRAO NGAY 5 MẠNG CHIẾN ĐẤU!
                </p>
              </div>

              <p className="text-xs sm:text-sm text-amber-200 font-bold">
                Cứ 5 giây Ma Vương rút 1 tim (-1 ❤️) • Thua sẽ bị Phong Ấn không thể hồi sinh!
                <br />
                Thắng nhận ngay <b className="text-yellow-300">1.000 🪙 Vàng + 10 🗝️ Chìa Khóa + Danh Hiệu Ẩn &quot;Diệt Ma Vương&quot;</b>!
              </p>

              <div className="text-4xl sm:text-5xl font-black font-mono text-yellow-300">
                {demonWarningSec}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 text-xl sm:text-2xl font-mono tracking-[0.4em] text-yellow-300">
              <span>👻 · · · · 🟡 · · · · 👻</span>
            </div>
          </div>
        );
      })()}

      {/* DEMON KING SPINNING 4-SLICE FORTUNE WHEEL MODAL */}
      {matchState === 'DEMON_WHEEL' && (
        <div
          data-testid="demon-king-wheel-overlay"
          className="fixed inset-0 bg-[#070212]/94 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 text-center"
        >
          <div className="max-w-lg w-full rounded-3xl border-2 border-fuchsia-500/70 bg-slate-950/95 p-6 space-y-4 shadow-[0_0_60px_rgba(192,38,211,0.45)]">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-fuchsia-600/25 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-black uppercase">
                🎡 VÒNG QUAY ĐỊNH MỆNH CỦA MA VƯƠNG
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {demonWheelSettled
                  ? `🎯 TRÚNG VÒNG ${demonWheelStyle}: ${activeWheelMeta.title.toUpperCase()}!`
                  : 'Ma Vương Đang Quay Chọn Luật Chơi...'}
              </h2>
            </div>

            {/* 4-Slice Animated SVG Wheel with Top Pointer */}
            <div className="relative w-60 h-60 mx-auto my-2 flex items-center justify-center">
              {/* Golden Pointer Arrow at Top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-300 drop-shadow-[0_2px_6px_rgba(251,191,36,0.9)]" />

              <div
                className="w-56 h-56 rounded-full border-4 border-amber-300 shadow-[0_0_30px_rgba(217,70,239,0.55)] overflow-hidden"
                style={{
                  transform: `rotate(${demonWheelRotation}deg)`,
                  transition: 'transform 2.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Sector 1: 0..90 deg (Top-Right) */}
                  <path d="M100 100 L100 0 A100 100 0 0 1 200 100 Z" fill="#0284c7" stroke="#0f172a" strokeWidth="3" />
                  {/* Sector 2: 90..180 deg (Bottom-Right) */}
                  <path d="M100 100 L200 100 A100 100 0 0 1 100 200 Z" fill="#d97706" stroke="#0f172a" strokeWidth="3" />
                  {/* Sector 3: 180..270 deg (Bottom-Left) */}
                  <path d="M100 100 L100 200 A100 100 0 0 1 0 100 Z" fill="#7c3aed" stroke="#0f172a" strokeWidth="3" />
                  {/* Sector 4: 270..360 deg (Top-Left) */}
                  <path d="M100 100 L0 100 A100 100 0 0 1 100 0 Z" fill="#e11d48" stroke="#0f172a" strokeWidth="3" />

                  <text x="142" y="56" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">VÒNG 1</text>
                  <text x="142" y="72" textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="700">Chọn Nghĩa</text>

                  <text x="142" y="138" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">VÒNG 2</text>
                  <text x="142" y="154" textAnchor="middle" fill="#fef3c7" fontSize="8" fontWeight="700">Gõ Full Từ</text>

                  <text x="58" y="138" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">VÒNG 3</text>
                  <text x="58" y="154" textAnchor="middle" fill="#ede9fe" fontSize="8" fontWeight="700">Đồng/Trái</text>

                  <text x="58" y="56" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">VÒNG 4</text>
                  <text x="58" y="72" textAnchor="middle" fill="#ffe4e6" fontSize="8" fontWeight="700">Điền Câu</text>

                  <circle cx="100" cy="100" r="20" fill="#090d16" stroke="#fde047" strokeWidth="3" />
                  <text x="100" y="106" textAnchor="middle" fontSize="16">👿</text>
                </svg>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-300">
              {demonWheelSettled
                ? `⚔️ Chuẩn bị quyết chiến theo cách chơi ${activeWheelMeta.shortLabel} (${activeWheelMeta.desc}) với 5 ❤️!`
                : 'Trúng ô nào sẽ đấu Boss Ma Vương theo đúng thể thức của vòng đó!'}
            </p>
          </div>
        </div>
      )}

      {/* REVIVE PROMPT MODAL (APPEARS AFTER 5-SECOND DEATH DELAY ON STAGES 1–4 ONLY) */}
      {matchState === 'REVIVE_PROMPT' && !cannotReviveByDemon && round !== 5 && (
        <div
          data-testid="knight-revive-modal"
          className="fixed inset-0 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-3xl border-2 border-amber-400 bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-2xl shadow-inner">
                🪦
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-black text-lg animate-pulse">➔ 🗝️ ➔</span>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                ⚡
              </div>
            </div>
            <div className="space-y-1">
              <span className="px-3 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black">
                HIỆP SĨ NGÃ XUỐNG TẠI {stageMeta.shortTitle}
              </span>
              <h2 className="text-2xl font-black text-[#0F172B] dark:text-white">
                Dùng Chìa Khóa Hồi Sinh Ngay?
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                Bạn có thể dùng <b>🗝️ Chìa Khóa Hồi Sinh</b> rớt ra từ quái (hoặc dùng <b>🪙 Vàng</b>) để hồi đầy <b>3 ❤️</b> và chiến đấu tiếp ngay tại con quái này!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-[#475569] dark:text-slate-400 font-bold">Chìa Khóa Hiện Có</p>
                <p className="text-base font-black text-sky-700 dark:text-sky-300">{rpgProfile.keys || 0} 🗝️</p>
              </div>
              <div>
                <p className="text-[#475569] dark:text-slate-400 font-bold">Vàng Hiện Có</p>
                <p className="text-base font-black text-amber-700 dark:text-amber-300">{rpgProfile.gold || 0} 🪙</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                data-testid="knight-revive-by-key-btn"
                onClick={handleReviveWithKeys}
                disabled={(rpgProfile.keys || 0) < reviveKeyCost}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:opacity-95 disabled:opacity-40 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition"
              >
                <KeyRound className="w-4 h-4" />
                <span>Hồi Sinh Bằng {reviveKeyCost} 🗝️ Chìa Khóa (+3 ❤️)</span>
              </button>

              <button
                type="button"
                data-testid="knight-revive-by-gold-btn"
                onClick={handleReviveWithGold}
                disabled={(rpgProfile.gold || 0) < reviveGoldCost}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition"
              >
                <Coins className="w-4 h-4" />
                <span>Mua Mạng Hồi Sinh Bằng {reviveGoldCost} 🪙 Vàng (+3 ❤️)</span>
              </button>

              <button
                type="button"
                data-testid="knight-skip-revive-btn"
                onClick={() => finalizeMatchAndSync(score, rpgProfile)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#334155] dark:text-slate-300 text-xs font-bold transition"
              >
                Không hồi sinh • Kết thúc trận &amp; Lưu điểm ({score}đ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE TRANSITION OVERLAY */}
      {matchState === 'TRANSITION' && (
        <div className="fixed inset-0 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-amber-400/60 bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              VƯỢT QUA {stageMeta.shortTitle}!
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-300">
              Chuẩn bị tiến vào <b>{KNIGHT_MONSTER_STAGES[round]?.stageTitle}</b>!
            </p>
            <button
              type="button"
              onClick={() => {
                const nextR = round + 1;
                const firstQ = queues[nextR]?.[0] || null;
                setRound(nextR);
                setWordIdx(0);
                setActiveQ(firstQ);
                setMatchState('PLAYING');
                runtimeRef.current.round = nextR;
                runtimeRef.current.matchState = 'PLAYING';
                setupQuestionClock(nextR, firstQ);
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm"
            >
              TIẾN VÀO ẢI {round + 1}/4 NGAY →
            </button>
          </div>
        </div>
      )}

      {/* GAMEOVER SUMMARY OVERLAY */}
      {matchState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full rounded-3xl border border-amber-400/60 bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-2xl font-black text-amber-600 dark:text-amber-300">
              TỔNG KẾT HÀNH TRÌNH HIỆP SĨ
            </h2>

            {starterGiftJustUnlocked && (
              <div
                data-testid="starter-gift-10-wishes-banner"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-fuchsia-600/25 to-rose-500/20 dark:from-amber-950/90 dark:via-fuchsia-950/85 dark:to-rose-950/90 border-2 border-amber-400 text-left space-y-1 shadow-lg"
              >
                <p className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300">
                  🎁 QUÀ TÂN THỦ MỞ KHÓA: +{STARTER_FIRST_GAME_FREE_WISHES} 🌠 LƯỢT QUAY GACHA MIỄN PHÍ!
                </p>
                <p className="text-xs text-[#334155] dark:text-slate-200 font-bold">
                  Chúc mừng hoàn thành trận đầu tiên! Đã cộng ngay{' '}
                  <span className="text-fuchsia-700 dark:text-fuchsia-300 underline">
                    +{STARTER_FIRST_GAME_FREE_WISHES} Lượt Quay
                  </span>{' '}
                  vào Vòng Quay Gacha (hiện có <b>{rpgProfile.wishes || 0} Lượt</b>)!
                </p>
              </div>
            )}

            {demonKingDefeated && (
              <div
                data-testid="demon-king-victory-banner"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/90 via-purple-900/80 to-amber-950/85 border-2 border-fuchsia-400 text-left space-y-1 shadow-lg"
              >
                <p className="text-xs sm:text-sm font-black text-fuchsia-200">
                  👿 CHIẾN THẮNG BOSS MA VƯƠNG ẨN MALAKOR!
                </p>
                <p className="text-xs text-amber-200 font-bold">
                  🏆 Mở khóa Danh Hiệu Ẩn: <span className="text-white underline">Diệt Ma Vương</span>
                  <br />
                  🎁 Phần thưởng: <span className="text-yellow-300">+1.000 🪙 Vàng</span> &amp;{' '}
                  <span className="text-sky-300">+10 🗝️ Chìa Khóa Hồi Sinh</span>!
                </p>
              </div>
            )}

            {cannotReviveByDemon && !demonKingDefeated && (
              <div
                data-testid="demon-king-sealed-banner"
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/75 border border-rose-300 dark:border-rose-500/70 text-xs font-bold text-rose-800 dark:text-rose-200"
              >
                ⛓️ Bạn đã bị Tuyệt Kỹ Hư Không Phong Ấn của Ma Vương kết liễu — Không thể hồi sinh!
              </div>
            )}

            <p className="text-xs text-[#475569] dark:text-slate-300">
              Điểm trận này: <b className="text-amber-600 dark:text-amber-300 text-base">{score} điểm</b> • Chiến lợi phẩm quái rớt:{' '}
              <b className="text-amber-600 dark:text-amber-400">+{sessionGoldEarned} 🪙 Vàng</b> &amp;{' '}
              <b className="text-sky-700 dark:text-sky-300">+{sessionKeysEarned} 🗝️ Chìa Khóa</b>
            </p>
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-[#475569] dark:text-slate-400">Quái Đã Hạ Trong Trận</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{sessionMonstersSlain} quái</p>
              </div>
              <div>
                <p className="text-[#475569] dark:text-slate-400">{demonKingDefeated ? 'Boss Rồng / Ma Vương' : 'Boss Rồng Đã Hạ'}</p>
                <p className="text-base font-black text-rose-600 dark:text-rose-400">
                  {sessionDragonsSlain} 🐉{demonKingDefeated ? ' · 1 👿' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => startKnightCampaign(round === 5 ? 1 : round, round === 5 ? false : singleRoundOnly)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Chơi Lại Ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllTimers();
                  setMatchState('HUB');
                  runtimeRef.current.matchState = 'HUB';
                  setHubSubPage('GACHA');
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Vòng Quay Gacha
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllTimers();
                  setMatchState('HUB');
                  runtimeRef.current.matchState = 'HUB';
                  setHubSubPage('MAIN');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172B] dark:text-slate-200 text-xs font-bold"
              >
                Về Sảnh Hiệp Sĩ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
