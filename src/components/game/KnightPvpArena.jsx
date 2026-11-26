import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Snowflake,
  Swords,
  Trophy,
  Users
} from 'lucide-react';
import {
  DEMON_KING_BOSS,
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_GACHA_WEAPONS,
  getHeroCosmeticWeapon
} from '../../constants/knightRpgData';
import {
  DEMON_KING_ROULETTE_SECTORS,
  KNIGHT_PVP_FREEZE_MS,
  KNIGHT_PVP_LIVES_PER_ROUND,
  KNIGHT_PVP_READY_CHECK_SEC,
  getKnightPvpRankTier,
  hashDeterministicSeed,
  normalizeKnightPvpProfile
} from '../../constants/knightPvpData';
import { DEFAULT_VOCAB_TEXT } from '../../constants/seedData';
import {
  buildPracticeRoundQueues,
  matchRound4TypingAnswer
} from '../../utils/examHelpers';

function skipNonAlphaIndex(word, startIdx = 0) {
  const upper = String(word || '').toUpperCase();
  let idx = startIdx;
  while (idx < upper.length && !/^[A-Z]$/.test(upper[idx])) {
    idx += 1;
  }
  return idx;
}

function playPvpSynthesizedSfx(kind = 'hit', muted = false) {
  if (muted || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const playTone = (freq, startOffset, dur, type = 'triangle', gainVal = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(gainVal, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + dur);
    };
    if (kind === 'match_found') {
      // Dramatic arena ready-check metallic chime chord
      playTone(392, 0, 0.25, 'triangle', 0.16);
      playTone(587.33, 0.09, 0.35, 'triangle', 0.16);
      playTone(783.99, 0.18, 0.55, 'sine', 0.18);
    } else if (kind === 'accept') {
      playTone(523.25, 0, 0.16, 'triangle', 0.15);
      playTone(1046.5, 0.08, 0.32, 'sine', 0.16);
    } else if (kind === 'hit') {
      playTone(660, 0, 0.11, 'sawtooth', 0.12);
      playTone(880, 0.06, 0.18, 'triangle', 0.14);
    } else if (kind === 'freeze') {
      playTone(260, 0, 0.22, 'sawtooth', 0.14);
      playTone(175, 0.12, 0.32, 'sine', 0.14);
    } else if (kind === 'demon_wheel') {
      playTone(220, 0, 0.22, 'sawtooth', 0.15);
      playTone(277.18, 0.14, 0.24, 'sawtooth', 0.15);
      playTone(329.63, 0.28, 0.4, 'triangle', 0.16);
    } else if (kind === 'victory') {
      playTone(523.25, 0, 0.18, 'triangle', 0.15);
      playTone(659.25, 0.12, 0.18, 'triangle', 0.15);
      playTone(783.99, 0.24, 0.22, 'triangle', 0.16);
      playTone(1046.5, 0.38, 0.45, 'sine', 0.18);
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Ignore audio context errors in headless/autoplay-restricted browsers
  }
}

function deterministicShuffleChoices(items = [], seedKey = '') {
  const arr = [...items];
  let seed = hashDeterministicSeed(seedKey) || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function resolveSkinObj(skinId) {
  return (
    KNIGHT_CHARACTER_SKINS.find(s => s.id === skinId) ||
    KNIGHT_CHARACTER_SKINS[0]
  );
}

function resolveWeaponObj(weaponId, rpgProfile, skinObj) {
  if (weaponId) {
    const found = KNIGHT_GACHA_WEAPONS.find(w => w.id === weaponId);
    if (found) return found;
  }
  if (rpgProfile) {
    return getHeroCosmeticWeapon(rpgProfile, skinObj);
  }
  return null;
}

const ROUND_STAGE_META = {
  1: {
    badge: 'Vòng 1 / 4',
    title: 'Khiên Nghĩa Thần Tốc',
    desc: 'Chọn đúng từ tiếng Anh khớp nghĩa tiếng Việt trước đối thủ để chém -1 ❤️!'
  },
  2: {
    badge: 'Vòng 2 / 4',
    title: 'Gõ Ký Tự Phá Giáp',
    desc: 'Đua gõ từng chữ cái hoàn thành từ vựng trước để chém -1 ❤️; gõ sai bị đóng băng 5 giây!'
  },
  3: {
    badge: 'Vòng 3 / 4',
    title: 'Phản Xạ Đồng / Trái Nghĩa',
    desc: 'Chọn nhanh đáp án Đồng nghĩa / Trái nghĩa chính xác để đoạt mạng đối phương!'
  },
  4: {
    badge: 'Vòng 4 / 4',
    title: 'Tuyệt Kỹ Cụm Từ Học Thuật',
    desc: 'Gõ chuẩn cụm Collocation vào chỗ trống và bấm Chém trước đối thủ!'
  }
};

export default function KnightPvpArena({
  bgmMuted = false,
  currentUser,
  dispatchSyncAction,
  effectiveRawVocab = DEFAULT_VOCAB_TEXT,
  isStrictAdmin = false,
  knightPvpLeaderboard = [],
  knightPvpRealtime = null,
  onBackToKnightHub,
  onRewardGoldSynced = null,
  rpgProfile = null,
  showToast,
  topicId = 'core',
  topicOptions = [],
  onSelectTopicId = null,
  usersDb = {}
}) {
  const username = currentUser?.username || 'guest';
  const vLower = String(username).toLowerCase();
  const liveUser =
    usersDb?.[username] ||
    Object.values(usersDb || {}).find(
      u => u && String(u.username || '').toLowerCase() === vLower
    ) ||
    currentUser;

  const myPvpProfile = useMemo(
    () => normalizeKnightPvpProfile(liveUser?.knightPvpProfile || currentUser?.knightPvpProfile || {}),
    [liveUser?.knightPvpProfile, currentUser?.knightPvpProfile]
  );
  const myRankTier = useMemo(() => getKnightPvpRankTier(myPvpProfile.rp), [myPvpProfile.rp]);
  const myHeroSkin = useMemo(
    () => resolveSkinObj(rpgProfile?.equippedSkin || liveUser?.knightRpgProfile?.equippedSkin || 'holy_paladin'),
    [rpgProfile?.equippedSkin, liveUser?.knightRpgProfile?.equippedSkin]
  );
  const myWeapon = useMemo(
    () => resolveWeaponObj(rpgProfile?.equippedWeapon || '', rpgProfile, myHeroSkin),
    [rpgProfile, myHeroSkin]
  );

  const selectedTopicObj = useMemo(
    () => topicOptions.find(t => t.id === topicId) || topicOptions[0] || { id: 'core', title: 'IELTS Core Academic' },
    [topicOptions, topicId]
  );

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [nowTickMs, setNowTickMs] = useState(() => Date.now());

  // Local high-speed combat state for NPC Ranked matches + UI animations
  const [npcCombat, setNpcCombat] = useState(null);
  const [typedProgress, setTypedProgress] = useState(0);
  const [round4Input, setRound4Input] = useState('');
  const [combatAlert, setCombatAlert] = useState(null);
  const [slashSide, setSlashSide] = useState(''); // 'left_to_right' | 'right_to_left' | ''
  const [demonWheelSpinning, setDemonWheelSpinning] = useState(false);
  const [demonWheelRevealedForMatch, setDemonWheelRevealedForMatch] = useState('');
  const [vsSplashForMatch, setVsSplashForMatch] = useState('');

  const readySoundPlayedRef = useRef('');
  const npcSettlingRef = useRef('');
  const npcCombatRef = useRef(null);
  const dispatchActionRef = useRef(dispatchSyncAction);
  const selectedTopicRef = useRef(selectedTopicObj);
  npcCombatRef.current = npcCombat;
  dispatchActionRef.current = dispatchSyncAction;
  selectedTopicRef.current = selectedTopicObj;

  const inQueue = Boolean(knightPvpRealtime?.inQueue);
  const queuedAt = Number(knightPvpRealtime?.queuedAt) || 0;
  const activeRoom = knightPvpRealtime?.activeRoom || null;
  const serverMatch = knightPvpRealtime?.activeMatch || null;

  // Global 100ms ticker when searching, ready-checking, or fighting
  useEffect(() => {
    if (!inQueue && !serverMatch && !npcCombat) return undefined;
    const id = setInterval(() => {
      setNowTickMs(Date.now());
    }, 100);
    return () => clearInterval(id);
  }, [inQueue, Boolean(serverMatch), Boolean(npcCombat)]);

  // Poll matchmaking queue -> spawn Rank-Scaled NPC after 3.0s if no real human is in queue
  useEffect(() => {
    if (!inQueue || serverMatch) return undefined;
    const pollId = setInterval(() => {
      const waitedMs = Date.now() - (queuedAt || Date.now());
      const curTopic = selectedTopicRef.current || { id: 'core', title: 'IELTS Core Academic' };
      dispatchActionRef.current?.('KNIGHT_PVP_FIND_MATCH', {
        topicId: curTopic.id,
        topicLabel: curTopic.title,
        spawnNpcNow: waitedMs >= 3000
      });
    }, 1050);
    return () => clearInterval(pollId);
  }, [inQueue, queuedAt, Boolean(serverMatch)]);

  // Play arena ready chime when READY_CHECK appears
  useEffect(() => {
    if (serverMatch?.status === 'READY_CHECK' && readySoundPlayedRef.current !== serverMatch.id) {
      readySoundPlayedRef.current = serverMatch.id;
      playPvpSynthesizedSfx('match_found', bgmMuted);
    }
  }, [serverMatch?.id, serverMatch?.status, bgmMuted]);

  // Build deterministic shared question queues from match seed
  const sharedQueues = useMemo(() => {
    if (!serverMatch?.seed) return { 1: [], 2: [], 3: [], 4: [] };
    return buildPracticeRoundQueues({
      rawVocab: effectiveRawVocab || DEFAULT_VOCAB_TEXT,
      roundSize: 18,
      seedStr: serverMatch.seed
    });
  }, [serverMatch?.seed, effectiveRawVocab]);

  // Initialize local NPC combat state as soon as ranked_npc transitions to PLAYING
  useEffect(() => {
    if (!serverMatch || serverMatch.mode !== 'ranked_npc') {
      if (npcCombat) setNpcCombat(null);
      return;
    }
    if (serverMatch.status === 'PLAYING' && (!npcCombat || npcCombat.matchId !== serverMatch.id)) {
      const startTie22 = Boolean(serverMatch.forceTie22Test || serverMatch.round === 5);
      setVsSplashForMatch(serverMatch.id);
      const splashTimer = setTimeout(() => {
        setVsSplashForMatch(prev => (prev === serverMatch.id ? '' : prev));
      }, startTie22 ? 600 : 1200);

      if (startTie22) {
        setDemonWheelSpinning(true);
        playPvpSynthesizedSfx('demon_wheel', bgmMuted);
        setTimeout(() => {
          setDemonWheelSpinning(false);
          setDemonWheelRevealedForMatch(serverMatch.id);
        }, 2200);
      }

      setNpcCombat({
        matchId: serverMatch.id,
        round: startTie22 ? 5 : 1,
        questionIdx: 0,
        p1Lives: KNIGHT_PVP_LIVES_PER_ROUND,
        p2Lives: KNIGHT_PVP_LIVES_PER_ROUND,
        p1RoundsWon: startTie22 ? 2 : 0,
        p2RoundsWon: startTie22 ? 2 : 0,
        p1FrozenUntilMs: 0,
        p2FrozenUntilMs: 0,
        totalCorrectHits: 0,
        totalFreezes: 0,
        tiebreakerTriggered: startTie22,
        roundBanner: '',
        npcTypingRatio: 0,
        npcNextActionAtMs: Date.now() + (startTie22 ? 5800 : 4800),
        finished: false
      });
      setTypedProgress(0);
      setRound4Input('');
      return () => clearTimeout(splashTimer);
    }
    return undefined;
  }, [serverMatch?.id, serverMatch?.status, serverMatch?.mode]);

  // Trigger Demon King Wheel overlay when a human 1v1 match hits Round 5 (2 - 2 tiebreaker)
  useEffect(() => {
    if (
      serverMatch &&
      serverMatch.mode !== 'ranked_npc' &&
      serverMatch.status === 'PLAYING' &&
      serverMatch.round === 5 &&
      demonWheelRevealedForMatch !== serverMatch.id &&
      !demonWheelSpinning
    ) {
      setDemonWheelSpinning(true);
      playPvpSynthesizedSfx('demon_wheel', bgmMuted);
      const t = setTimeout(() => {
        setDemonWheelSpinning(false);
        setDemonWheelRevealedForMatch(serverMatch.id);
      }, 2300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [serverMatch?.id, serverMatch?.mode, serverMatch?.status, serverMatch?.round, demonWheelRevealedForMatch, demonWheelSpinning, bgmMuted]);

  // Determine my slot & opponent slot for human/npc match
  const mySlotKey = useMemo(() => {
    if (!serverMatch) return 'p1';
    if (String(serverMatch.p1?.username || '').toLowerCase() === vLower) return 'p1';
    if (!serverMatch.p2?.isNpc && String(serverMatch.p2?.username || '').toLowerCase() === vLower) return 'p2';
    return 'p1';
  }, [serverMatch, vLower]);
  const oppSlotKey = mySlotKey === 'p1' ? 'p2' : 'p1';

  const effectiveRound = serverMatch?.mode === 'ranked_npc' && npcCombat
    ? npcCombat.round
    : Number(serverMatch?.round) || 1;
  const effectiveCombatStyle =
    effectiveRound === 5
      ? Number(serverMatch?.demonRoundType) || 1
      : Math.min(4, Math.max(1, effectiveRound));

  const effectiveQIdx = serverMatch?.mode === 'ranked_npc' && npcCombat
    ? npcCombat.questionIdx
    : Number(serverMatch?.questionIdx) || 0;

  const activeRoundPool = sharedQueues[effectiveCombatStyle] || sharedQueues[1] || [];
  const activeQuestion =
    activeRoundPool.length > 0 ? activeRoundPool[effectiveQIdx % activeRoundPool.length] : null;

  // Reset typing buffers whenever question or round changes
  useEffect(() => {
    if (activeQuestion && effectiveCombatStyle === 2) {
      const target = String(activeQuestion.word || '').toUpperCase();
      setTypedProgress(skipNonAlphaIndex(target, 0));
    } else {
      setTypedProgress(0);
    }
    setRound4Input('');
  }, [effectiveRound, effectiveCombatStyle, effectiveQIdx, activeQuestion?.word]);

  const myLives =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p1Lives
      : Number(serverMatch?.[mySlotKey]?.lives ?? KNIGHT_PVP_LIVES_PER_ROUND);
  const oppLives =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p2Lives
      : Number(serverMatch?.[oppSlotKey]?.lives ?? KNIGHT_PVP_LIVES_PER_ROUND);

  const myRoundsWon =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p1RoundsWon
      : Number(serverMatch?.[mySlotKey]?.roundsWon || 0);
  const oppRoundsWon =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p2RoundsWon
      : Number(serverMatch?.[oppSlotKey]?.roundsWon || 0);

  const myFrozenUntilMs =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p1FrozenUntilMs
      : Number(serverMatch?.[mySlotKey]?.frozenUntilMs || 0);
  const oppFrozenUntilMs =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p2FrozenUntilMs
      : Number(serverMatch?.[oppSlotKey]?.frozenUntilMs || 0);

  const myFreezeRemSec = Math.max(0, (myFrozenUntilMs - nowTickMs) / 1000);
  const oppFreezeRemSec = Math.max(0, (oppFrozenUntilMs - nowTickMs) / 1000);
  const isMeFrozen = myFreezeRemSec > 0.05;
  const isOppFrozen = oppFreezeRemSec > 0.05;

  const isShowingDemonWheelModal = Boolean(
    serverMatch?.status === 'PLAYING' &&
      effectiveRound === 5 &&
      demonWheelRevealedForMatch !== serverMatch?.id
  );
  const isShowingVsSplash = Boolean(
    serverMatch?.status === 'PLAYING' && vsSplashForMatch === serverMatch?.id && !isShowingDemonWheelModal
  );

  const computeNextNpcDelayMs = (npcObj, styleRound, qObj) => {
    const minD = Math.max(1650, Number(npcObj?.minDelayMs) || 4500);
    const maxD = Math.max(minD + 600, Number(npcObj?.maxDelayMs) || 7500);
    const base = minD + Math.random() * (maxD - minD);
    if (styleRound === 2 || styleRound === 4) {
      const targetLen = String(
        styleRound === 4 ? qObj?.v4Display || qObj?.word || '' : qObj?.word || ''
      ).length;
      const cps = Math.max(1.8, Number(npcObj?.typingCps) || 3.0);
      return Math.round(Math.max(minD, (targetLen / cps) * 1000 + base * 0.45));
    }
    return Math.round(base);
  };

  const settleNpcMatchWithServer = async (finalState) => {
    if (!serverMatch || npcSettlingRef.current === serverMatch.id) return;
    npcSettlingRef.current = serverMatch.id;
    const snap = await dispatchSyncAction?.('KNIGHT_PVP_FINISH_NPC_MATCH', {
      matchId: serverMatch.id,
      p1RoundsWon: finalState.p1RoundsWon,
      p2RoundsWon: finalState.p2RoundsWon,
      totalCorrectHits: finalState.totalCorrectHits,
      totalFreezes: finalState.totalFreezes,
      tiebreakerTriggered: finalState.tiebreakerTriggered
    });
    const settledMatch = snap?.knightPvpRealtime?.activeMatch;
    const goldAdded = Number(settledMatch?.rewards?.p1?.goldGain) || 0;
    if (goldAdded > 0) {
      onRewardGoldSynced?.(goldAdded);
    }
    if (finalState.p1RoundsWon > finalState.p2RoundsWon) {
      playPvpSynthesizedSfx('victory', bgmMuted);
    }
  };

  const applyLocalNpcRoundTransition = (prev, roundWinnerSlot, npcSlotObj) => {
    const nextP1Rounds = prev.p1RoundsWon + (roundWinnerSlot === 'p1' ? 1 : 0);
    const nextP2Rounds = prev.p2RoundsWon + (roundWinnerSlot === 'p2' ? 1 : 0);
    const bannerMsg =
      roundWinnerSlot === 'p1'
        ? `🏆 Bạn thắng Vòng ${prev.round}! (Tỷ số vòng: ${nextP1Rounds} - ${nextP2Rounds})`
        : `💥 ${npcSlotObj?.name || 'Đối thủ'} thắng Vòng ${prev.round}! (Tỷ số vòng: ${nextP1Rounds} - ${nextP2Rounds})`;

    if (prev.round < 4) {
      const nextRound = prev.round + 1;
      const nextPool = sharedQueues[nextRound] || sharedQueues[1] || [];
      return {
        nextState: {
          ...prev,
          round: nextRound,
          questionIdx: 0,
          p1Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p2Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p1RoundsWon: nextP1Rounds,
          p2RoundsWon: nextP2Rounds,
          p1FrozenUntilMs: 0,
          p2FrozenUntilMs: 0,
          roundBanner: bannerMsg,
          npcTypingRatio: 0,
          npcNextActionAtMs: Date.now() + 1400 + computeNextNpcDelayMs(npcSlotObj, nextRound, nextPool[0])
        },
        shouldFinish: false,
        triggerDemonWheel: false
      };
    }

    if (prev.round === 4 && nextP1Rounds === 2 && nextP2Rounds === 2) {
      // 2 - 2 Tiebreaker -> Demon King Malakor spins Wheel of Fate!
      const style5 = Number(serverMatch?.demonRoundType) || 1;
      const pool5 = sharedQueues[style5] || sharedQueues[1] || [];
      return {
        nextState: {
          ...prev,
          round: 5,
          questionIdx: 0,
          p1Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p2Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p1RoundsWon: 2,
          p2RoundsWon: 2,
          p1FrozenUntilMs: 0,
          p2FrozenUntilMs: 0,
          tiebreakerTriggered: true,
          roundBanner: '👿 HÒA 2 - 2! MA VƯƠNG MALAKOR TRIỆU HỒI VÒNG QUAY ĐỊNH MỆNH!',
          npcTypingRatio: 0,
          npcNextActionAtMs: Date.now() + 3600 + computeNextNpcDelayMs(npcSlotObj, style5, pool5[0])
        },
        shouldFinish: false,
        triggerDemonWheel: true
      };
    }

    return {
      nextState: {
        ...prev,
        p1RoundsWon: nextP1Rounds,
        p2RoundsWon: nextP2Rounds,
        p1Lives: roundWinnerSlot === 'p1' ? prev.p1Lives : 0,
        p2Lives: roundWinnerSlot === 'p2' ? prev.p2Lives : 0,
        finished: true,
        roundBanner: bannerMsg
      },
      shouldFinish: true,
      triggerDemonWheel: false
    };
  };

  // NPC AI reaction loop for ranked_npc mode
  useEffect(() => {
    if (
      !serverMatch ||
      serverMatch.mode !== 'ranked_npc' ||
      serverMatch.status !== 'PLAYING' ||
      !npcCombat ||
      npcCombat.finished ||
      isShowingDemonWheelModal ||
      isShowingVsSplash
    ) {
      return undefined;
    }
    const npcObj = serverMatch.p2;
    const aiTimer = setInterval(() => {
      const cur = npcCombatRef.current;
      if (!cur || cur.finished) return;
      const now = Date.now();
      if (now < cur.p2FrozenUntilMs) return;
      if (now < cur.npcNextActionAtMs) return;

      const styleRound = cur.round === 5 ? Number(serverMatch.demonRoundType) || 1 : cur.round;
      const pool = sharedQueues[styleRound] || sharedQueues[1] || [];
      const acc = Math.min(0.96, Math.max(0.45, Number(npcObj?.accuracy) || 0.65));
      const npcHits = Math.random() < acc;

      if (!npcHits) {
        // NPC answered wrong -> NPC gets frozen for 5 seconds!
        const nextDelay = KNIGHT_PVP_FREEZE_MS + computeNextNpcDelayMs(npcObj, styleRound, pool[(cur.questionIdx) % Math.max(1, pool.length)]);
        setCombatAlert({
          tone: 'info',
          text: `❄️ ${npcObj?.name || 'NPC'} trả lời sai — Bị đóng băng 5 giây!`
        });
        setNpcCombat(prev =>
          prev
            ? {
                ...prev,
                p2FrozenUntilMs: now + KNIGHT_PVP_FREEZE_MS,
                npcNextActionAtMs: now + nextDelay
              }
            : prev
        );
        return;
      }

      // NPC answered right first -> Player loses -1 ❤️ life!
      playPvpSynthesizedSfx('freeze', bgmMuted);
      setSlashSide('right_to_left');
      setTimeout(() => setSlashSide(''), 420);

      const nextP1Lives = Math.max(0, cur.p1Lives - 1);
      if (nextP1Lives <= 0) {
        const trans = applyLocalNpcRoundTransition(cur, 'p2', npcObj);
        setCombatAlert({ tone: 'danger', text: trans.nextState.roundBanner });
        setNpcCombat(trans.nextState);
        if (trans.triggerDemonWheel) {
          setDemonWheelSpinning(true);
          playPvpSynthesizedSfx('demon_wheel', bgmMuted);
          setTimeout(() => {
            setDemonWheelSpinning(false);
            setDemonWheelRevealedForMatch(serverMatch.id);
          }, 2200);
        }
        if (trans.shouldFinish) {
          settleNpcMatchWithServer(trans.nextState);
        }
      } else {
        const nextQIdx = cur.questionIdx + 1;
        const nextQ = pool[nextQIdx % Math.max(1, pool.length)];
        setCombatAlert({
          tone: 'danger',
          text: `💥 ${npcObj?.name || 'Đối thủ'} trả lời đúng trước! Bạn mất -1 ❤️ (Còn ${nextP1Lives} ❤️)`
        });
        setNpcCombat(prev =>
          prev
            ? {
                ...prev,
                p1Lives: nextP1Lives,
                questionIdx: nextQIdx,
                npcNextActionAtMs: now + computeNextNpcDelayMs(npcObj, styleRound, nextQ)
              }
            : prev
        );
      }
    }, 160);

    return () => clearInterval(aiTimer);
  }, [
    serverMatch?.id,
    serverMatch?.mode,
    serverMatch?.status,
    npcCombat?.finished,
    isShowingDemonWheelModal,
    isShowingVsSplash,
    bgmMuted,
    sharedQueues
  ]);

  const triggerMyCorrectStrike = () => {
    if (!serverMatch || serverMatch.status !== 'PLAYING' || isMeFrozen || isShowingDemonWheelModal) return;
    playPvpSynthesizedSfx('hit', bgmMuted);
    setSlashSide('left_to_right');
    setTimeout(() => setSlashSide(''), 420);

    if (serverMatch.mode === 'ranked_npc' && npcCombat) {
      const npcObj = serverMatch.p2;
      const nextOppLives = Math.max(0, npcCombat.p2Lives - 1);
      const updatedBase = {
        ...npcCombat,
        totalCorrectHits: npcCombat.totalCorrectHits + 1
      };
      if (nextOppLives <= 0) {
        const trans = applyLocalNpcRoundTransition(updatedBase, 'p1', npcObj);
        setCombatAlert({ tone: 'success', text: trans.nextState.roundBanner });
        setNpcCombat(trans.nextState);
        if (trans.triggerDemonWheel) {
          setDemonWheelSpinning(true);
          playPvpSynthesizedSfx('demon_wheel', bgmMuted);
          setTimeout(() => {
            setDemonWheelSpinning(false);
            setDemonWheelRevealedForMatch(serverMatch.id);
          }, 2200);
        }
        if (trans.shouldFinish) {
          settleNpcMatchWithServer(trans.nextState);
        }
      } else {
        const nextQIdx = npcCombat.questionIdx + 1;
        const styleRound = npcCombat.round === 5 ? Number(serverMatch.demonRoundType) || 1 : npcCombat.round;
        const pool = sharedQueues[styleRound] || sharedQueues[1] || [];
        const nextQ = pool[nextQIdx % Math.max(1, pool.length)];
        setCombatAlert({
          tone: 'success',
          text: `⚔️ Chém chính xác! ${npcObj?.name || 'Đối thủ'} mất -1 ❤️ (Còn ${nextOppLives} ❤️)`
        });
        setNpcCombat({
          ...updatedBase,
          p2Lives: nextOppLives,
          questionIdx: nextQIdx,
          npcNextActionAtMs: Date.now() + computeNextNpcDelayMs(npcObj, styleRound, nextQ)
        });
      }
      return;
    }

    dispatchSyncAction?.('KNIGHT_PVP_SYNC_COMBAT', {
      matchId: serverMatch.id,
      event: 'STRIKE_HIT',
      questionIdx: effectiveQIdx
    });
    setCombatAlert({
      tone: 'success',
      text: '⚔️ Đòn chém trúng đích! Đối phương mất -1 ❤️!'
    });
  };

  const triggerMyWrongFreeze = (wrongDetail = '') => {
    if (!serverMatch || serverMatch.status !== 'PLAYING' || isMeFrozen || isShowingDemonWheelModal) return;
    playPvpSynthesizedSfx('freeze', bgmMuted);
    const freezeUntil = Date.now() + KNIGHT_PVP_FREEZE_MS;
    setCombatAlert({
      tone: 'freeze',
      text: `❄️ ${wrongDetail || 'Trả lời sai'} — Bạn bị đóng băng 5 giây!`
    });

    if (serverMatch.mode === 'ranked_npc' && npcCombat) {
      setNpcCombat(prev =>
        prev
          ? {
              ...prev,
              p1FrozenUntilMs: freezeUntil,
              totalFreezes: prev.totalFreezes + 1
            }
          : prev
      );
      return;
    }

    dispatchSyncAction?.('KNIGHT_PVP_SYNC_COMBAT', {
      matchId: serverMatch.id,
      event: 'WRONG_ANSWER'
    });
  };

  // Choice handler for Round 1 & Round 3
  const handleSelectChoice = (choiceText) => {
    if (!activeQuestion || isMeFrozen || isShowingDemonWheelModal) return;
    const expected =
      effectiveCombatStyle === 3 ? activeQuestion.v3Target : activeQuestion.word;
    const ok =
      String(choiceText || '').trim().toLowerCase() === String(expected || '').trim().toLowerCase();
    if (ok) {
      triggerMyCorrectStrike();
    } else {
      triggerMyWrongFreeze(`Chọn sai "${choiceText}"`);
    }
  };

  // Typing handler for Round 2
  const handleRound2Letter = (letter) => {
    if (!activeQuestion || effectiveCombatStyle !== 2 || isMeFrozen || isShowingDemonWheelModal) return;
    const target = String(activeQuestion.word || '').toUpperCase();
    const expected = target[typedProgress];
    if (!expected) return;
    if (String(letter || '').toUpperCase() === expected) {
      const nextProg = skipNonAlphaIndex(target, typedProgress + 1);
      setTypedProgress(nextProg);
      if (nextProg >= target.length) {
        triggerMyCorrectStrike();
      }
    } else {
      triggerMyWrongFreeze(`Gõ sai ký tự "${String(letter || '').toUpperCase()}"`);
    }
  };

  // Physical keyboard support for Round 2
  useEffect(() => {
    if (
      !serverMatch ||
      serverMatch.status !== 'PLAYING' ||
      effectiveCombatStyle !== 2 ||
      isMeFrozen ||
      isShowingDemonWheelModal
    ) {
      return undefined;
    }
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleRound2Letter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Round 4 Collocation Submit
  const handleRound4Submit = (e) => {
    if (e) e.preventDefault();
    if (!activeQuestion || effectiveCombatStyle !== 4 || isMeFrozen || isShowingDemonWheelModal) return;
    const trimmed = round4Input.trim();
    if (!trimmed) return;
    const accepted =
      Array.isArray(activeQuestion.v4Answers) && activeQuestion.v4Answers.length > 0
        ? activeQuestion.v4Answers
        : [activeQuestion.v4Display || activeQuestion.collocation || activeQuestion.word];
    const evalRes = matchRound4TypingAnswer(trimmed, accepted);
    if (evalRes.matched) {
      setRound4Input('');
      triggerMyCorrectStrike();
    } else {
      triggerMyWrongFreeze(`Cụm từ "${trimmed}" chưa chính xác`);
    }
  };

  const handleStartMatchmaking = async (forceTie22Test = false) => {
    if (busyAction) return;
    setBusyAction('queue');
    npcSettlingRef.current = '';
    setDemonWheelRevealedForMatch('');
    await dispatchSyncAction?.('KNIGHT_PVP_FIND_MATCH', {
      topicId: selectedTopicObj.id,
      topicLabel: selectedTopicObj.title,
      spawnNpcNow: forceTie22Test,
      forceTie22Test
    });
    setBusyAction('');
  };

  const handleCancelQueue = async () => {
    setBusyAction('cancel');
    await dispatchSyncAction?.('KNIGHT_PVP_CANCEL_QUEUE', {});
    setBusyAction('');
  };

  const handleCreateCasualRoom = async () => {
    setBusyAction('create_room');
    await dispatchSyncAction?.('KNIGHT_PVP_CREATE_ROOM', {
      topicId: selectedTopicObj.id,
      topicLabel: selectedTopicObj.title
    });
    setBusyAction('');
    showToast?.('Đã tạo phòng giao hữu 1v1 (Chỉ giải trí)! Hãy gửi mã 6 số cho bạn bè.', 'success');
  };

  const handleJoinCasualRoom = async (e) => {
    if (e) e.preventDefault();
    const clean = joinCodeInput.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 6) {
      showToast?.('Vui lòng nhập đủ mã phòng 6 chữ số.', 'error');
      return;
    }
    setBusyAction('join_room');
    const snap = await dispatchSyncAction?.('KNIGHT_PVP_JOIN_ROOM', { roomCode: clean });
    setBusyAction('');
    if (!snap?.knightPvpRealtime?.activeMatch) {
      showToast?.('Không tìm thấy phòng giao hữu 1v1 hoặc phòng là của chính bạn.', 'error');
    } else {
      setJoinCodeInput('');
    }
  };

  const handleLeaveRoomOrMatch = async () => {
    setBusyAction('leave');
    setNpcCombat(null);
    await dispatchSyncAction?.('KNIGHT_PVP_LEAVE_ROOM', {});
    setBusyAction('');
  };

  const handleAcceptReady = async () => {
    if (!serverMatch) return;
    playPvpSynthesizedSfx('accept', bgmMuted);
    await dispatchSyncAction?.('KNIGHT_PVP_ACCEPT_READY', { matchId: serverMatch.id });
  };

  const handleDeclineReady = async () => {
    if (!serverMatch) return;
    await dispatchSyncAction?.('KNIGHT_PVP_DECLINE_READY', { matchId: serverMatch.id });
  };

  const myFighterObj = serverMatch?.[mySlotKey] || {
    name: currentUser?.name || username,
    skinId: myHeroSkin.id,
    weaponId: myWeapon?.id || '',
    rp: myPvpProfile.rp
  };
  const oppFighterObj = serverMatch?.[oppSlotKey] || null;
  const oppSkin = resolveSkinObj(oppFighterObj?.skinId || 'knight_arthur');
  const oppWeapon = oppFighterObj?.weaponId
    ? KNIGHT_GACHA_WEAPONS.find(w => w.id === oppFighterObj.weaponId) || null
    : null;
  const oppTier = getKnightPvpRankTier(oppFighterObj?.rp || 0);

  const readyRemSec = serverMatch?.status === 'READY_CHECK'
    ? Math.max(0, Math.min(KNIGHT_PVP_READY_CHECK_SEC, ((Number(serverMatch.readyDeadlineMs) || nowTickMs) - nowTickMs) / 1000))
    : 0;
  const readyPct = (readyRemSec / KNIGHT_PVP_READY_CHECK_SEC) * 100;
  const myAccepted = Boolean(serverMatch?.[mySlotKey]?.accepted);
  const oppAccepted = Boolean(serverMatch?.[oppSlotKey]?.accepted);

  const demonSectorMeta =
    DEMON_KING_ROULETTE_SECTORS[Number(serverMatch?.demonSectorIdx) || 0] ||
    DEMON_KING_ROULETTE_SECTORS[0];

  const renderHearts = (count) => (
    <div className="flex items-center gap-1" aria-label={`${count} mạng`}>
      {[0, 1, 2].map(idx => {
        const alive = idx < count;
        return (
          <Heart
            key={idx}
            className={`w-5 h-5 transition-transform duration-200 ${
              alive
                ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.55)] scale-100'
                : 'text-zinc-400 dark:text-zinc-700 scale-90'
            }`}
          />
        );
      })}
    </div>
  );

  // ==========================================
  // VIEW 1: ACTIVE / FINISHED MATCH VIEW
  // ==========================================
  if (serverMatch && (serverMatch.status === 'PLAYING' || serverMatch.status === 'FINISHED')) {
    const isFinished = serverMatch.status === 'FINISHED';
    const didIWin = serverMatch.winnerSlot === mySlotKey;
    const myReward = serverMatch.rewards?.[mySlotKey] || null;
    const activeStageMeta = ROUND_STAGE_META[effectiveCombatStyle] || ROUND_STAGE_META[1];

    const mcqChoices =
      activeQuestion && (effectiveCombatStyle === 1 || effectiveCombatStyle === 3)
        ? effectiveCombatStyle === 3
          ? activeQuestion.v3Choices || []
          : deterministicShuffleChoices(
              [activeQuestion.word, ...(activeQuestion.distractors || [])].slice(0, 4),
              `${serverMatch.seed}:r${effectiveRound}:q${effectiveQIdx}`
            )
        : [];

    return (
      <div
        data-testid="knight-pvp-combat-screen"
        className="max-w-5xl w-full mx-auto p-3 sm:p-5 space-y-4"
      >
        {/* Top Match Bar */}
        <div className="vip-pvp-card rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3 flex-wrap shadow-sm">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                serverMatch.mode === 'casual_room'
                  ? 'bg-sky-600 text-white'
                  : effectiveRound === 5
                  ? 'bg-fuchsia-700 text-white'
                  : 'bg-amber-500 text-zinc-950'
              }`}
            >
              {serverMatch.mode === 'casual_room'
                ? `🎈 PHÒNG GIAO HỮU #${serverMatch.roomCode || ''}`
                : effectiveRound === 5
                ? '👿 VÒNG QUYẾT ĐỊNH MA VƯƠNG'
                : '⚔️ ĐỐI KHÁNG XẾP HẠNG 1 VS 1'}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
              {effectiveRound === 5
                ? `Vòng 5 (Hòa 2-2) • Luật ${demonSectorMeta.shortLabel}`
                : `${activeStageMeta.badge}: ${activeStageMeta.title}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              data-testid="knight-pvp-round-score"
              className="px-3.5 py-1 rounded-xl bg-zinc-900 text-amber-300 font-black text-sm tabular-nums border border-amber-500/40"
            >
              Tỷ Số Vòng: {myRoundsWon} – {oppRoundsWon}
            </div>
            {!isFinished && (
              <button
                type="button"
                onClick={handleLeaveRoomOrMatch}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-zinc-700 dark:text-zinc-200 hover:text-rose-600 text-xs font-bold transition"
              >
                Rời trận
              </button>
            )}
          </div>
        </div>

        {/* Arena Fighter Stage */}
        <div className="vip-pvp-card relative rounded-2xl bg-gradient-to-br from-[#12131A] via-[#181824] to-[#1F1528] border border-amber-500/35 p-4 sm:p-5 overflow-hidden text-white shadow-lg">
          {/* Slash Beam FX */}
          {slashSide && (
            <div
              className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center ${
                slashSide === 'left_to_right' ? ' bg-emerald-500/10' : 'bg-rose-500/15'
              }`}
            >
              <div
                className={`w-3/4 h-2 rounded-full shadow-[0_0_28px_rgba(251,191,36,0.95)] ${
                  slashSide === 'left_to_right'
                    ? 'bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 -rotate-6'
                    : 'bg-gradient-to-l from-rose-500 via-amber-400 to-fuchsia-400 rotate-6'
                }`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center relative z-10">
            {/* LEFT: PLAYER */}
            <div
              className={`vip-pvp-card md:col-span-5 rounded-2xl p-3.5 border transition ${
                isMeFrozen
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.45)]'
                  : 'bg-zinc-900/85 border-zinc-700/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-800 border border-amber-400/50 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={myHeroSkin.spriteUrl}
                    alt={myHeroSkin.name}
                    className="w-14 h-14 object-contain"
                  />
                  {myWeapon?.spriteUrl && (
                    <img
                      src={myWeapon.spriteUrl}
                      alt={myWeapon.name}
                      className="w-6 h-6 object-contain absolute -bottom-0.5 -right-0.5 bg-zinc-950 rounded-md p-0.5 border border-amber-400/50"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      BẠN
                    </span>
                    <span className="text-sm font-black text-white truncate">
                      {myFighterObj.name || username}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-bold truncate">
                    {myHeroSkin.starRarity}★ {myHeroSkin.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {renderHearts(myLives)}
                    {isMeFrozen && (
                      <span
                        data-testid="knight-pvp-freeze-badge"
                        className="px-2 py-0.5 rounded-lg bg-cyan-400 text-zinc-950 text-xs font-black tabular-nums inline-flex items-center gap-1"
                      >
                        <Snowflake className="w-3.5 h-3.5" /> {myFreezeRemSec.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: VS + DEMON WATCHER */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
              {effectiveRound === 5 ? (
                <div className="flex flex-col items-center">
                  <img
                    src={DEMON_KING_BOSS.spriteUrl}
                    alt="Ma Vương Malakor"
                    className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                  />
                  <span className="text-xs font-black text-fuchsia-300">2 – 2</span>
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 text-zinc-950 font-black text-sm flex items-center justify-center shadow-md">
                  VS
                </div>
              )}
            </div>

            {/* RIGHT: OPPONENT / SCALED NPC */}
            <div
              className={`vip-pvp-card md:col-span-5 rounded-2xl p-3.5 border transition ${
                isOppFrozen
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.45)]'
                  : 'bg-zinc-900/85 border-rose-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-800 border border-rose-400/50 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={oppSkin.spriteUrl}
                    alt={oppSkin.name}
                    className="w-14 h-14 object-contain"
                  />
                  {oppWeapon?.spriteUrl && (
                    <img
                      src={oppWeapon.spriteUrl}
                      alt={oppWeapon.name}
                      className="w-6 h-6 object-contain absolute -bottom-0.5 -right-0.5 bg-zinc-950 rounded-md p-0.5 border border-rose-400/50"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-200 border border-rose-400/40">
                      {oppFighterObj?.isNpc ? 'NPC ĐẤU SĨ' : 'ĐỐI THỦ'}
                    </span>
                    <span className="text-sm font-black text-white truncate">
                      {oppFighterObj?.name || 'Đấu Sĩ Bí Ẩn'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 font-bold truncate">
                    {oppSkin.pool === 'limited' ? '🌟 5★ Giới Hạn' : `${oppSkin.starRarity}★`} • {oppSkin.name}
                    {serverMatch.mode !== 'casual_room' ? ` • ${oppTier.icon} ${oppFighterObj?.rp || 0} RP` : ''}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div data-testid="knight-pvp-opp-hearts">{renderHearts(oppLives)}</div>
                    {isOppFrozen && (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-zinc-950 text-xs font-black tabular-nums inline-flex items-center gap-1">
                        <Snowflake className="w-3.5 h-3.5" /> {oppFreezeRemSec.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Combat Alert Strip */}
          {combatAlert && !isFinished && (
            <div
              className={`mt-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-between gap-2 ${
                combatAlert.tone === 'freeze'
                  ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400/60'
                  : combatAlert.tone === 'success'
                  ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/50'
                  : combatAlert.tone === 'danger'
                  ? 'bg-rose-500/25 text-rose-100 border border-rose-400/50'
                  : 'bg-zinc-800/90 text-amber-200 border border-amber-400/40'
              }`}
            >
              <span>{combatAlert.text}</span>
            </div>
          )}

          {/* VS Splash Overlay */}
          {isShowingVsSplash && (
            <div className="absolute inset-0 bg-zinc-950/92 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">
                ĐẤU TRƯỜNG SONG ĐẤU KHỞI TRANH
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {myFighterObj.name || username} <span className="text-amber-400 px-2">VS</span> {oppFighterObj?.name}
              </h3>
              <p className="text-xs text-zinc-300 font-semibold">
                Ai trả lời đúng trước chém đối phương -1 ❤️ • Trả lời sai đóng băng 5 giây!
              </p>
            </div>
          )}

          {/* 2 - 2 DEMON KING MALAKOR ROULETTE WHEEL OVERLAY */}
          {isShowingDemonWheelModal && (
            <div
              data-testid="knight-pvp-demon-wheel"
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="vip-pvp-card max-w-lg w-full rounded-3xl bg-gradient-to-b from-[#1A0B2E] via-[#13091F] to-[#18181B] border-2 border-fuchsia-500/70 p-6 text-center text-white space-y-4 shadow-[0_0_60px_rgba(217,70,239,0.45)]">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={DEMON_KING_BOSS.spriteUrl}
                    alt="Ma Vương Malakor"
                    className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(232,121,249,0.85)]"
                  />
                  <span className="px-3 py-1 rounded-full bg-fuchsia-600/30 border border-fuchsia-400/60 text-fuchsia-200 text-xs font-black uppercase tracking-wider">
                    TỶ SỐ HÒA 2 – 2 SAU 4 VÒNG!
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    👿 VÒNG QUAY MA VƯƠNG MALAKOR
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Ma Vương xoay Vòng Quay Định Mệnh để ấn định thể thức cho Vòng Chung Kết Quyết Định!
                  </p>
                </div>

                {/* 4-Sector Wheel Visual */}
                <div className="relative w-52 h-52 mx-auto">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-300 drop-shadow" />
                  <div
                    style={{
                      transform: `rotate(${
                        demonWheelSpinning
                          ? 1080 + (Number(serverMatch?.demonSectorIdx) || 0) * 90 + 45
                          : (Number(serverMatch?.demonSectorIdx) || 0) * 90 + 45
                      }deg)`,
                      transition: demonWheelSpinning ? 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                      background:
                        'conic-gradient(#e11d48 0deg 90deg, #d97706 90deg 180deg, #7c3aed 180deg 270deg, #0284c7 270deg 360deg)'
                    }}
                    className="w-full h-full rounded-full border-4 border-amber-300 shadow-[0_0_30px_rgba(217,70,239,0.5)] flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-zinc-950 border-2 border-amber-300 flex items-center justify-center text-xl">
                      👿
                    </div>
                  </div>
                </div>

                <div className="vip-pvp-card rounded-2xl bg-zinc-900/90 border border-fuchsia-400/50 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-fuchsia-300 uppercase">
                    {demonWheelSpinning ? 'Đang quay định mệnh...' : 'Thể thức Vòng Quyết Định đã chọn:'}
                  </p>
                  <p className="text-base font-black text-amber-300">
                    {demonWheelSpinning ? '🔮 ???' : `${demonSectorMeta.shortLabel} — ${demonSectorMeta.title}`}
                  </p>
                  {!demonWheelSpinning && (
                    <p className="text-xs text-zinc-300">{demonSectorMeta.desc}</p>
                  )}
                </div>

                {!demonWheelSpinning && (
                  <button
                    type="button"
                    data-testid="knight-pvp-enter-round5-btn"
                    onClick={() => setDemonWheelRevealedForMatch(serverMatch.id)}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 hover:opacity-95 text-white font-black text-sm shadow-lg transition"
                  >
                    ⚔️ BƯỚC VÀO VÒNG CHUNG KẾT SINH TỬ (3 ❤️)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* POST-MATCH SUMMARY OR INTERACTIVE SHARED QUESTION */}
        {isFinished ? (
          <div
            data-testid="knight-pvp-result-panel"
            className="vip-pvp-card rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-6 text-center space-y-4 shadow-md"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40">
              {serverMatch.mode === 'casual_room'
                ? '🎈 KẾT QUẢ PHÒNG GIAO HỮU GIẢI TRÍ'
                : didIWin
                ? '🏆 CHIẾN THẮNG ĐỐI KHÁNG 1 VS 1'
                : '🛡️ TỔNG KẾT TRẬN ĐẤU 1 VS 1'}
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-black ${
                didIWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {didIWin ? 'BẠN ĐÃ GIÀNH CHIẾN THẮNG!' : 'ĐỐI THỦ GIÀNH CHIẾN THẮNG!'}
            </h2>

            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
              {serverMatch.finishReason || `Tỷ số chung cuộc: ${myRoundsWon} – ${oppRoundsWon}`}
            </p>

            {serverMatch.mode === 'casual_room' ? (
              <div className="vip-pvp-card max-w-md mx-auto rounded-2xl bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-700 p-3.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                🎈 Phòng Giao Hữu 1v1 chỉ phục vụ giải trí cùng bạn bè — Không cộng/trừ Điểm Đối Kháng (RP), không ghi BXH và không tính Danh Hiệu 1v1.
              </div>
            ) : (
              myReward && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                  <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Điểm Đối Kháng (RP)</p>
                    <p
                      data-testid="knight-pvp-rp-delta"
                      className={`text-xl font-black tabular-nums ${
                        myReward.rpDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                      }`}
                    >
                      {myReward.rpDelta >= 0 ? `+${myReward.rpDelta}` : myReward.rpDelta} RP (Tổng: {myReward.nextRp})
                    </p>
                  </div>
                  <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Thưởng Vàng Hiệp Sĩ</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-300 tabular-nums">
                      +{myReward.goldGain} 🪙
                    </p>
                  </div>
                  <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Bậc Hạng Hiện Tại</p>
                    <p className="text-base font-black text-zinc-900 dark:text-white">
                      {myReward.tierLabel}
                    </p>
                  </div>
                </div>
              )
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {serverMatch.mode !== 'casual_room' && (
                <button
                  type="button"
                  onClick={() => handleStartMatchmaking(false)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white font-black text-sm shadow-md transition inline-flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" /> Ghép Trận Tiếp
                </button>
              )}
              <button
                type="button"
                data-testid="knight-pvp-return-lobby-btn"
                onClick={handleLeaveRoomOrMatch}
                className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-extrabold text-sm transition"
              >
                Về Sảnh Đối Kháng 1v1
              </button>
            </div>
          </div>
        ) : (
          activeQuestion && (
            <div className="vip-pvp-card relative rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-sm overflow-hidden">
              {/* 5-SECOND FREEZE LOCK OVERLAY */}
              {isMeFrozen && (
                <div
                  data-testid="knight-pvp-freeze-banner"
                  className="rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 p-4 text-center text-white space-y-1.5 shadow-[0_0_30px_rgba(34,211,238,0.45)]"
                >
                  <div className="inline-flex items-center gap-2 text-cyan-300 font-black text-sm sm:text-base tabular-nums">
                    <Snowflake className="w-5 h-5 animate-spin" />
                    <span>BẠN ĐANG BỊ ĐÓNG BĂNG: {myFreezeRemSec.toFixed(1)} GIÂY!</span>
                  </div>
                  <p className="text-xs text-cyan-100/90 font-semibold">
                    Trả lời sai bị khóa thao tác 5 giây — Đối thủ đang tranh thủ cơ hội tấn công!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Câu #{effectiveQIdx + 1} (Câu hỏi chung cho cả 2 bên) • {activeStageMeta.desc}
                </span>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Chủ đề: {serverMatch.topicLabel}
                </span>
              </div>

              {/* ROUND 1 & ROUND 3: SHARED MCQ */}
              {(effectiveCombatStyle === 1 || effectiveCombatStyle === 3) && (
                <div className="space-y-3">
                  <p
                    data-testid="knight-pvp-question-prompt"
                    className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white"
                  >
                    {effectiveCombatStyle === 3
                      ? activeQuestion.v3Question
                      : `Nghĩa tiếng Việt: "${activeQuestion.prompt}"`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {mcqChoices.map((choiceText, idx) => (
                      <button
                        key={`${choiceText}-${idx}`}
                        type="button"
                        disabled={isMeFrozen}
                        data-testid={`knight-pvp-choice-${idx}`}
                        data-choice-value={choiceText}
                        onClick={() => handleSelectChoice(choiceText)}
                        className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                          isMeFrozen
                            ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800'
                            : 'bg-zinc-50 hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-amber-500/15 border-zinc-200 dark:border-zinc-700 hover:border-amber-400'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 text-xs font-black flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {choiceText}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ROUND 2: LETTER TYPING */}
              {effectiveCombatStyle === 2 && (
                <div className="space-y-3 text-center">
                  <p
                    data-testid="knight-pvp-question-prompt"
                    className="text-base font-extrabold text-zinc-900 dark:text-white"
                  >
                    Nghĩa: &quot;{activeQuestion.prompt}&quot;{' '}
                    {activeQuestion.ipa ? (
                      <span className="text-amber-700 dark:text-amber-300 font-mono">
                        {activeQuestion.ipa}
                      </span>
                    ) : null}
                  </p>
                  <div
                    data-testid="knight-pvp-target-word"
                    data-word={activeQuestion.word}
                    className="flex justify-center gap-1.5 flex-wrap"
                  >
                    {String(activeQuestion.word || '')
                      .toUpperCase()
                      .split('')
                      .map((ch, idx) => {
                        const isAlpha = /^[A-Z]$/.test(ch);
                        const isTyped = idx < typedProgress || !isAlpha;
                        return (
                          <span
                            key={idx}
                            className={`w-8 h-9 rounded-lg inline-flex items-center justify-center font-mono font-black text-sm border ${
                              isTyped
                                ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                                : idx === typedProgress
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400'
                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                            }`}
                          >
                            {isTyped ? ch : '_'}
                          </span>
                        );
                      })}
                  </div>
                  <div className="flex justify-center gap-1 flex-wrap pt-1">
                    {'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').map(letter => (
                      <button
                        key={letter}
                        type="button"
                        disabled={isMeFrozen}
                        data-testid={`knight-pvp-key-${letter}`}
                        onClick={() => handleRound2Letter(letter)}
                        className="w-8 h-9 rounded-lg bg-zinc-100 hover:bg-amber-400 hover:text-zinc-950 disabled:opacity-45 dark:bg-zinc-800 dark:hover:bg-amber-400 dark:hover:text-zinc-950 text-xs font-mono font-black text-zinc-900 dark:text-white transition"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ROUND 4: ACADEMIC COLLOCATION */}
              {effectiveCombatStyle === 4 && (
                <form onSubmit={handleRound4Submit} className="space-y-3">
                  <div className="vip-pvp-card p-3.5 rounded-xl bg-amber-50/70 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 space-y-1">
                    <p
                      data-testid="knight-pvp-question-prompt"
                      className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white"
                    >
                      {activeQuestion.v4Question}
                    </p>
                    {activeQuestion.v4HintMeaning && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                        💡 Gợi ý nghĩa: {activeQuestion.v4HintMeaning}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isMeFrozen}
                      data-testid="knight-pvp-round4-input"
                      value={round4Input}
                      onChange={e => setRound4Input(e.target.value)}
                      placeholder={isMeFrozen ? 'Đang bị đóng băng 5 giây...' : 'Nhập từ / cụm từ còn thiếu...'}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isMeFrozen || !round4Input.trim()}
                      data-testid="knight-pvp-round4-submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-zinc-950 font-black text-sm transition shrink-0"
                    >
                      ⚔️ Chém!
                    </button>
                  </div>
                </form>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: 1v1 LOBBY + READY-CHECK MODAL + 1v1 LEADERBOARD
  // ==========================================
  const queueElapsedSec = inQueue ? Math.max(0, Math.floor((nowTickMs - (queuedAt || nowTickMs)) / 1000)) : 0;
  const top3Rows = knightPvpLeaderboard.slice(0, 3);
  const restRows = knightPvpLeaderboard.slice(3, 15);

  return (
    <div
      data-testid="knight-pvp-lobby"
      className="max-w-5xl w-full mx-auto p-3 sm:p-5 space-y-5"
    >
      {/* Top Bar */}
      <div className="vip-pvp-card rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="knight-pvp-back-btn"
            onClick={onBackToKnightHub}
            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-extrabold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Về Sảnh Hiệp Sĩ
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-500" />
              <span>ĐẤU TRƯỜNG SONG ĐẤU 1 VS 1</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              4 Vòng Đối Kháng Trực Tiếp • Đúng Chém -1 ❤️ • Sai Đóng Băng 5s • Hòa 2-2 Gặp Ma Vương
            </p>
          </div>
        </div>

        {/* Player Equipped Fighter & Rank Summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src={myHeroSkin.spriteUrl}
              alt={myHeroSkin.name}
              className="w-9 h-9 object-contain"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${myRankTier.badgeClass}`}>
                  {myRankTier.icon} {myRankTier.shortLabel}
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-300 tabular-nums">
                  {myPvpProfile.rp} RP
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tabular-nums">
                Thắng {myPvpProfile.wins} • Thua {myPvpProfile.losses} • Chuỗi {myPvpProfile.winStreak}🔥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Selector */}
      {topicOptions.length > 0 && (
        <div className="vip-pvp-card rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
            📚 Bộ từ vựng giao đấu 1v1:
          </span>
          <select
            value={topicId}
            onChange={e => onSelectTopicId?.(e.target.value)}
            disabled={inQueue || Boolean(activeRoom)}
            className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white"
          >
            {topicOptions.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.wordCount || 16}+ từ)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Two Main Mode Cards: Ranked Matchmaking vs For-Fun Casual Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT (7 cols): RANKED 1V1 MATCHMAKING */}
        <div className="vip-pvp-card lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#131520] via-[#18181B] to-[#231729] border border-amber-500/40 p-5 text-white flex flex-col justify-between gap-4 shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-wider">
                🏆 CHẾ ĐỘ XẾP HẠNG ĐỐI KHÁNG
              </span>
              <span className="text-xs font-bold text-zinc-300">
                Tính BXH 1v1 • Mở Khóa Danh Hiệu Đấu Sĩ
              </span>
            </div>

            <h3 className="text-xl font-black text-white">
              Ghép Trận Ngẫu Nhiên 1 vs 1
            </h3>

            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300 font-medium">
              <li>• Đấu <b>4 vòng</b> câu hỏi giống nhau (mỗi vòng <b>3 ❤️ mạng</b>): mất hết 3 mạng sẽ thua vòng đó và sang vòng tiếp theo.</li>
              <li>• Ai trả lời đúng trước sẽ <b>chém đối thủ mất 1 ❤️</b>; trả lời sai bị <b>đóng băng 5 giây (❄️)</b>.</li>
              <li>• Hòa <b>2 – 2</b> sau 4 vòng: <b>Ma Vương Malakor</b> xuất hiện quay vòng quay chọn vòng quyết định cuối cùng!</li>
              <li>• Nếu hàng chờ chưa có người thật: Tự động ghép <b>NPC Đấu Sĩ</b> mạnh dần theo Rank (NPC bậc cao dùng tướng <b>5★ Thường &amp; 5★ Giới Hạn</b>, phản xạ cực nhanh!).</li>
            </ul>
          </div>

          {inQueue ? (
            <div
              data-testid="knight-pvp-queue-box"
              className="vip-pvp-card rounded-2xl bg-zinc-900/95 border border-cyan-400/50 p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-amber-400 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-black text-cyan-300">
                    Đang dò tìm đối thủ xứng tầm... ({queueElapsedSec}s)
                  </p>
                  <p className="text-xs text-zinc-400">
                    Ưu tiên người chơi thật trong hàng chờ • Tự động triệu hồi Đấu Sĩ NPC nếu trống
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelQueue}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white text-xs font-black transition"
              >
                Hủy Tìm Trận
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                data-testid="knight-pvp-find-match-btn"
                disabled={Boolean(busyAction) || Boolean(activeRoom)}
                onClick={() => handleStartMatchmaking(false)}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:opacity-95 disabled:opacity-50 text-zinc-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Swords className="w-5 h-5" />
                <span>GHÉP TRẬN ĐỐI KHÁNG NGAY</span>
              </button>

              {isStrictAdmin && (
                <button
                  type="button"
                  data-testid="knight-pvp-admin-tie22-btn"
                  disabled={Boolean(busyAction) || Boolean(activeRoom)}
                  onClick={() => handleStartMatchmaking(true)}
                  className="py-3.5 px-4 rounded-2xl bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-50 text-white font-black text-xs border border-fuchsia-400/60 transition shrink-0"
                  title="Quyền Admin: Vào thẳng kịch bản Hòa 2-2 gặp Ma Vương quay vòng quay"
                >
                  👿 Test Hòa 2-2 (Admin)
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT (5 cols): CASUAL 1V1 FRIEND ROOM (FOR FUN ONLY) */}
        <div className="vip-pvp-card lg:col-span-5 rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4 shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 text-xs font-black uppercase">
                🎈 TẠO PHÒNG GIAO HỮU
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Chỉ để giải trí
              </span>
            </div>

            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Đấu Tay Đôi Cùng Bạn Bè
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tạo mã phòng 6 số để mời bạn học so tài 4 vòng vui vẻ. <b>Chế độ giải trí không ghép NPC, không cộng/trừ Điểm BXH và không mở khóa Danh Hiệu Đối Kháng.</b>
            </p>
          </div>

          {activeRoom ? (
            <div
              data-testid="knight-pvp-casual-room-box"
              className="vip-pvp-card rounded-2xl bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-700 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Mã phòng 1v1 của bạn:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeRoom.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1600);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold text-sky-700 dark:text-sky-300 inline-flex items-center gap-1 border border-sky-200 dark:border-zinc-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
              <p
                data-testid="knight-pvp-room-code"
                className="text-2xl font-mono font-black tracking-[0.25em] text-center text-sky-700 dark:text-sky-300 py-1"
              >
                {activeRoom.code}
              </p>
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                Đang chờ người chơi thứ 2 nhập mã phòng... (Không tự thêm NPC)
              </p>
              <button
                type="button"
                onClick={handleLeaveRoomOrMatch}
                className="w-full py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-extrabold transition"
              >
                Đóng Phòng Giao Hữu
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                data-testid="knight-pvp-create-room-btn"
                disabled={inQueue || busyAction === 'create_room'}
                onClick={handleCreateCasualRoom}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Users className="w-4 h-4" /> Tạo Phòng 1v1 Giải Trí
              </button>

              <form onSubmit={handleJoinCasualRoom} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  data-testid="knight-pvp-join-room-input"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 số..."
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white"
                />
                <button
                  type="submit"
                  data-testid="knight-pvp-join-room-btn"
                  disabled={inQueue || joinCodeInput.length < 6}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-45 text-white text-xs font-extrabold transition shrink-0"
                >
                  Vào Phòng
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED 1 VS 1 LEADERBOARD */}
      <div
        data-testid="knight-pvp-leaderboard"
        className="vip-pvp-card rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-zinc-900 dark:text-white">
              BẢNG XẾP HẠNG ĐỐI KHÁNG 1 VS 1 ({knightPvpLeaderboard.length} ĐẤU SĨ)
            </h3>
          </div>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Reset RP hàng tuần lúc 00:00 Thứ Hai • Chỉ tính trận Ghép Trận Xếp Hạng
          </span>
        </div>

        {knightPvpLeaderboard.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Chưa có Đấu Sĩ nào ghi danh trên Bảng Xếp Hạng Đối Kháng tuần này.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              ⚔️ Hãy bấm &quot;Ghép Trận Đối Kháng Ngay&quot; để chiếm giữ ngôi vị Bá Chủ Top #1!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 1 - 3 Podium Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3Rows.map((entry, idx) => {
                const tier = getKnightPvpRankTier(entry.rp);
                const skin = resolveSkinObj(entry.skinId);
                const rankMedals = ['🥇 TOP 1', '🥈 TOP 2', '🥉 TOP 3'];
                const isMe = String(entry.username || '').toLowerCase() === vLower;
                return (
                  <div
                    key={entry.id || entry.username}
                    className={`vip-pvp-card rounded-2xl p-3.5 border flex items-center gap-3 ${
                      idx === 0
                        ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-400'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <img src={skin.spriteUrl} alt={skin.name} className="w-12 h-12 object-contain shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                          {rankMedals[idx]}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                        {entry.name || entry.username}
                      </p>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {tier.icon} {entry.rp} RP • {entry.wins}T - {entry.losses}B
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top 4+ List */}
            {restRows.length > 0 && (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {restRows.map((entry, i) => {
                  const tier = getKnightPvpRankTier(entry.rp);
                  const skin = resolveSkinObj(entry.skinId);
                  const isMe = String(entry.username || '').toLowerCase() === vLower;
                  return (
                    <div
                      key={entry.id || entry.username}
                      className="py-2.5 px-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 text-xs font-black text-zinc-500 tabular-nums">
                          #{i + 4}
                        </span>
                        <img src={skin.spriteUrl} alt={skin.name} className="w-8 h-8 object-contain shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {entry.name || entry.username} {isMe ? '(Bạn)' : ''}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {tier.icon} {tier.shortLabel} • Chuỗi thắng cao nhất: {entry.bestWinStreak || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <p className="text-sm font-black text-amber-600 dark:text-amber-300">{entry.rp} RP</p>
                        <p className="text-xs text-zinc-500">{entry.wins}T / {entry.losses}B</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ARENA MATCH-FOUND READY-CHECK OVERLAY (ORIGINAL FANTASY KNIGHT THEME — ZERO THIRD-PARTY BRANDING) */}
      {serverMatch?.status === 'READY_CHECK' && (
        <div
          data-testid="knight-pvp-ready-modal"
          className="fixed inset-0 z-50 bg-[#070A12]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="vip-pvp-card max-w-md w-full rounded-3xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#18181B] border-2 border-amber-400/70 p-6 text-center text-white space-y-5 shadow-[0_0_70px_rgba(245,158,11,0.35)]">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                {serverMatch.mode === 'casual_room' ? 'PHÒNG GIAO HỮU 1 VS 1' : 'ĐẤU TRƯỜNG SONG ĐẤU 1 VS 1'}
              </p>
              <h3 className="text-2xl font-black text-amber-300 tracking-wide">
                ĐÃ TÌM THẤY ĐỐI THỦ!
              </h3>
            </div>

            {/* Animated Circular Arcane Gold-Cyan Countdown Ring */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="7"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#pvpReadyGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - Math.max(0, Math.min(100, readyPct)) / 100)}
                />
                <defs>
                  <linearGradient id="pvpReadyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Swords className="w-8 h-8 text-amber-300 mb-1" />
                <span className="text-2xl font-black tabular-nums text-white">
                  {Math.ceil(readyRemSec)}s
                </span>
                <span className="text-xs text-cyan-300 font-bold">Sẵn sàng</span>
              </div>
            </div>

            {/* Ready Status Slots */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    myAccepted ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="text-xs font-bold text-zinc-200">
                  Bạn: {myAccepted ? 'Đã sẵn sàng' : 'Chờ xác nhận'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    oppAccepted ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="text-xs font-bold text-zinc-200">
                  Đối thủ: {oppAccepted ? 'Đã sẵn sàng' : 'Chờ xác nhận'}
                </span>
              </div>
            </div>

            {!myAccepted ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  data-testid="knight-pvp-accept-btn"
                  onClick={handleAcceptReady}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-400 to-amber-500 hover:opacity-95 text-zinc-950 font-black text-base tracking-wide shadow-[0_0_28px_rgba(34,211,238,0.45)] transition"
                >
                  ⚔️ CHẤP NHẬN GIAO ĐẤU
                </button>
                <button
                  type="button"
                  data-testid="knight-pvp-decline-btn"
                  onClick={handleDeclineReady}
                  className="w-full py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Từ chối trận đấu
                </button>
              </div>
            ) : (
              <p className="text-sm font-extrabold text-emerald-300">
                ✓ Đã chấp nhận! Đang chờ đối thủ tiến vào đấu trường...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
