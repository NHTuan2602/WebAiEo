import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Snowflake,
  Swords,
  Trophy,
  Users,
  Zap
} from 'lucide-react';
import { KNIGHT_CHARACTER_SKINS } from '../../constants/knightRpgData';
import {
  DEMON_KING_ROULETTE_SECTORS,
  KNIGHT_PVP_COUNTDOWN_STEP_MS,
  KNIGHT_PVP_FREEZE_MS,
  KNIGHT_PVP_LIVES_PER_ROUND,
  KNIGHT_PVP_QUESTION_TIMEOUT_MS,
  KNIGHT_PVP_READY_CHECK_SEC,
  KNIGHT_PVP_SLOWMO_KO_MS,
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

// Dramatic multi-layered WebAudio SFX for 1v1 Duel
function playPvpDramaticSfx(kind = 'hit', muted = false) {
  if (muted || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const tone = (freq, start, dur, type = 'sawtooth', peak = 0.14, endFreq = null) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(35, freq), now + start);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(35, endFreq), now + start + dur);
      }
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(peak, now + start + Math.min(0.03, dur * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    if (kind === 'enter_arena') {
      tone(196, 0, 0.28, 'sawtooth', 0.12);
      tone(293.66, 0.1, 0.34, 'sawtooth', 0.13);
      tone(392, 0.22, 0.55, 'triangle', 0.16);
    } else if (kind === 'match_found') {
      tone(392, 0, 0.22, 'triangle', 0.16);
      tone(587.33, 0.08, 0.3, 'triangle', 0.17);
      tone(880, 0.17, 0.58, 'sine', 0.19);
    } else if (kind === 'accept') {
      tone(440, 0, 0.14, 'sawtooth', 0.13);
      tone(659.25, 0.07, 0.18, 'triangle', 0.15);
      tone(1046.5, 0.15, 0.38, 'sine', 0.17);
    } else if (kind === 'countdown_tick') {
      tone(523.25, 0, 0.14, 'triangle', 0.15);
      tone(1046.5, 0.02, 0.08, 'sine', 0.09);
    } else if (kind === 'countdown_go') {
      tone(392, 0, 0.2, 'sawtooth', 0.15);
      tone(587.33, 0.06, 0.26, 'sawtooth', 0.16);
      tone(783.99, 0.12, 0.44, 'triangle', 0.19);
    } else if (kind === 'hit') {
      tone(150, 0, 0.16, 'sine', 0.18, 52);
      tone(740, 0, 0.09, 'sawtooth', 0.15, 320);
      tone(1174.66, 0.04, 0.16, 'triangle', 0.14);
    } else if (kind === 'hurt') {
      tone(190, 0, 0.24, 'sawtooth', 0.17, 65);
      tone(130, 0.06, 0.26, 'square', 0.12, 55);
    } else if (kind === 'freeze') {
      tone(1320, 0, 0.1, 'sine', 0.12, 880);
      tone(987.77, 0.06, 0.12, 'triangle', 0.12, 587);
      tone(240, 0.08, 0.36, 'sawtooth', 0.14, 110);
    } else if (kind === 'thunder_smite') {
      // Twin sky-lightning crackle + heavy thunder sub-boom!
      tone(1480, 0, 0.09, 'sawtooth', 0.18, 210);
      tone(960, 0.05, 0.14, 'square', 0.14, 140);
      tone(98, 0.03, 0.58, 'sawtooth', 0.22, 38);
    } else if (kind === 'slowmo_ko') {
      // Cinematic time-dilation bass drop + resonant katana ring!
      tone(220, 0, 0.72, 'sawtooth', 0.2, 42);
      tone(880, 0.02, 0.48, 'triangle', 0.16, 440);
      tone(1318.5, 0.08, 0.65, 'sine', 0.12);
    } else if (kind === 'mystery_rift') {
      tone(110, 0, 0.65, 'sawtooth', 0.13, 82.4);
      tone(311.13, 0.12, 0.55, 'sine', 0.13, 466.16);
      tone(622.25, 0.26, 0.65, 'triangle', 0.12);
    } else if (kind === 'victory') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        tone(f, i * 0.09, 0.42, 'triangle', 0.16);
      });
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {}
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

const ROUND_STAGE_META = {
  1: { badge: 'Vòng 1/4', title: 'Khiên Nghĩa' },
  2: { badge: 'Vòng 2/4', title: 'Gõ Từ Phá Giáp' },
  3: { badge: 'Vòng 3/4', title: 'Đồng / Trái Nghĩa' },
  4: { badge: 'Vòng 4/4', title: 'Cụm Từ Học Thuật' }
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
  onPvpCombatStateChange = null,
  onRewardGoldSynced = null,
  onSelectTopicId = null,
  rpgProfile = null,
  showToast,
  topicId = 'core',
  topicOptions = [],
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
    () => resolveSkinObj(rpgProfile?.equippedSkin || liveUser?.knightRpgProfile?.equippedSkin || 'knight_arthur'),
    [rpgProfile?.equippedSkin, liveUser?.knightRpgProfile?.equippedSkin]
  );

  const selectedTopicObj = useMemo(
    () => topicOptions.find(t => t.id === topicId) || topicOptions[0] || { id: 'core', title: 'IELTS Core Academic' },
    [topicOptions, topicId]
  );

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [nowTickMs, setNowTickMs] = useState(() => Date.now());

  const [npcCombat, setNpcCombat] = useState(null);
  const [typedProgress, setTypedProgress] = useState(0);
  const [round4Input, setRound4Input] = useState('');
  const [combatAlert, setCombatAlert] = useState(null);
  const [demonWheelSpinning, setDemonWheelSpinning] = useState(false);
  const [demonWheelRevealedForMatch, setDemonWheelRevealedForMatch] = useState('');

  // New Combat Sequence States: 3-2-1 Ready Countdown, 10s Divine Lightning, & Slow-Motion KO Finisher
  const [countdownStep, setCountdownStep] = useState('');
  const [slowMoKo, setSlowMoKo] = useState(null);
  const [questionDeadlineMs, setQuestionDeadlineMs] = useState(0);

  // 60FPS Duel Canvas refs & animation state (Hero vs Hero like Stages 1-4!)
  const battleCanvasRef = useRef(null);
  const spriteCacheRef = useRef(new Map());
  const duelAnimRef = useRef({
    myAttack: 0,
    oppAttack: 0,
    myHurt: 0,
    oppHurt: 0,
    shake: 0,
    roadOffset: 0,
    slowMoUntilMs: 0,
    thunderAnim: 0,
    koWinner: '',
    slashes: [],
    sparks: [],
    popups: []
  });

  const readySoundPlayedRef = useRef('');
  const npcSettlingRef = useRef('');
  const npcCombatRef = useRef(null);
  const dispatchActionRef = useRef(dispatchSyncAction);
  const selectedTopicRef = useRef(selectedTopicObj);
  const prevOppLivesRef = useRef(KNIGHT_PVP_LIVES_PER_ROUND);
  const prevMyLivesRef = useRef(KNIGHT_PVP_LIVES_PER_ROUND);
  const countdownTimerIdsRef = useRef([]);
  const countedRoundsRef = useRef('');
  const slowMoTimerRef = useRef(null);
  const lastSeenServerKoAtRef = useRef(0);
  const lastSeenServerThunderAtRef = useRef(0);
  const thunderFiredKeyRef = useRef('');
  const questionDeadlineRef = useRef(0);

  npcCombatRef.current = npcCombat;
  dispatchActionRef.current = dispatchSyncAction;
  selectedTopicRef.current = selectedTopicObj;

  const clearRoundCountdownTimers = () => {
    countdownTimerIdsRef.current.forEach(clearTimeout);
    countdownTimerIdsRef.current = [];
  };

  // Play arena entry horn once on mount + cleanup timers on unmount
  useEffect(() => {
    playPvpDramaticSfx('enter_arena', bgmMuted);
    return () => {
      clearRoundCountdownTimers();
      if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
    };
  }, []);

  const inQueue = Boolean(knightPvpRealtime?.inQueue);
  const queuedAt = Number(knightPvpRealtime?.queuedAt) || 0;
  const activeRoom = knightPvpRealtime?.activeRoom || null;
  const serverMatch = knightPvpRealtime?.activeMatch || null;
  const isActivelyFighting = Boolean(serverMatch?.status === 'PLAYING' || Boolean(slowMoKo));

  // Switch parent BGM between 'pvp_lobby' and high-energy 'pvp_battle'
  useEffect(() => {
    onPvpCombatStateChange?.(isActivelyFighting);
    return () => {
      onPvpCombatStateChange?.(false);
    };
  }, [isActivelyFighting, onPvpCombatStateChange]);

  useEffect(() => {
    if (!inQueue && !serverMatch && !npcCombat && !slowMoKo) return undefined;
    const id = setInterval(() => {
      setNowTickMs(Date.now());
    }, 100);
    return () => clearInterval(id);
  }, [inQueue, Boolean(serverMatch), Boolean(npcCombat), Boolean(slowMoKo)]);

  // Poll matchmaking queue -> seamlessly match opponent after 3.0s if queue empty
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

  useEffect(() => {
    if (serverMatch?.status === 'READY_CHECK' && readySoundPlayedRef.current !== serverMatch.id) {
      readySoundPlayedRef.current = serverMatch.id;
      playPvpDramaticSfx('match_found', bgmMuted);
    }
  }, [serverMatch?.id, serverMatch?.status, bgmMuted]);

  const sharedQueues = useMemo(() => {
    if (!serverMatch?.seed) return { 1: [], 2: [], 3: [], 4: [] };
    return buildPracticeRoundQueues({
      rawVocab: effectiveRawVocab || DEFAULT_VOCAB_TEXT,
      roundSize: 18,
      seedStr: serverMatch.seed
    });
  }, [serverMatch?.seed, effectiveRawVocab]);

  const spawnCanvasAttackFx = (attacker = 'me', color = '#fbbf24') => {
    const rt = duelAnimRef.current;
    if (attacker === 'me') {
      rt.myAttack = 1;
      rt.oppHurt = 1;
      rt.shake = 7;
      rt.slashes.push({ xRatio: 0.72, yRatio: 0.56, dir: 1, color, life: 1 });
      rt.popups.push({ text: '-1 ❤️', xRatio: 0.75, yRatio: 0.34, color: '#fb7185', life: 1 });
      for (let i = 0; i < 16; i += 1) {
        const ang = (Math.PI * 2 * i) / 16;
        rt.sparks.push({
          xRatio: 0.75,
          yRatio: 0.56,
          vx: Math.cos(ang) * (2.2 + Math.random() * 2.5),
          vy: Math.sin(ang) * (2.2 + Math.random() * 2.5),
          color,
          life: 1
        });
      }
    } else {
      rt.oppAttack = 1;
      rt.myHurt = 1;
      rt.shake = 9;
      rt.slashes.push({ xRatio: 0.28, yRatio: 0.56, dir: -1, color: '#f43f5e', life: 1 });
      rt.popups.push({ text: '-1 ❤️', xRatio: 0.25, yRatio: 0.34, color: '#f43f5e', life: 1 });
      for (let i = 0; i < 16; i += 1) {
        const ang = (Math.PI * 2 * i) / 16;
        rt.sparks.push({
          xRatio: 0.25,
          yRatio: 0.56,
          vx: Math.cos(ang) * (2.2 + Math.random() * 2.5),
          vy: Math.sin(ang) * (2.2 + Math.random() * 2.5),
          color: '#f43f5e',
          life: 1
        });
      }
    }
  };

  // Twin Divine Punishment Sky-Lightning striking BOTH players simultaneously!
  const spawnCanvasThunderSmite = () => {
    const rt = duelAnimRef.current;
    rt.thunderAnim = 1.0;
    rt.myHurt = 1.0;
    rt.oppHurt = 1.0;
    rt.shake = 16;
    rt.popups.push({ text: '⚡ -1 ❤️', xRatio: 0.24, yRatio: 0.31, color: '#fde047', life: 1.25 });
    rt.popups.push({ text: '⚡ -1 ❤️', xRatio: 0.76, yRatio: 0.31, color: '#fde047', life: 1.25 });
    [0.24, 0.76].forEach(rx => {
      for (let i = 0; i < 22; i += 1) {
        const ang = (Math.PI * 2 * i) / 22;
        rt.sparks.push({
          xRatio: rx,
          yRatio: 0.58,
          vx: Math.cos(ang) * (2.6 + Math.random() * 3.4),
          vy: Math.sin(ang) * (2.6 + Math.random() * 3.4),
          color: i % 2 === 0 ? '#fde047' : '#38bdf8',
          life: 1.15
        });
      }
    });
  };

  // Cinematic Slow-Motion Finisher VFX on the final blow of EVERY round!
  const spawnCanvasSlowMoFinisher = (winner = 'me') => {
    const slowDurMs =
      typeof window !== 'undefined' && Number(window.__PVP_SLOWMO_MS__) >= 150
        ? Number(window.__PVP_SLOWMO_MS__)
        : KNIGHT_PVP_SLOWMO_KO_MS;
    const rt = duelAnimRef.current;
    rt.slowMoUntilMs = Date.now() + slowDurMs;
    rt.koWinner = winner;
    rt.shake = 18;
    const targets = winner === 'draw' ? [0.25, 0.75] : [winner === 'me' ? 0.75 : 0.25];
    const mainColor = winner === 'draw' ? '#fde047' : winner === 'me' ? '#fde047' : '#fb7185';
    targets.forEach((tx, idx) => {
      rt.slashes.push({ xRatio: tx, yRatio: 0.54, dir: idx === 0 ? 1 : -1, color: mainColor, life: 1.35 });
      rt.slashes.push({ xRatio: tx, yRatio: 0.54, dir: idx === 0 ? -1 : 1, color: '#ffffff', life: 1.25 });
      for (let i = 0; i < 24; i += 1) {
        const ang = (Math.PI * 2 * i) / 24;
        rt.sparks.push({
          xRatio: tx,
          yRatio: 0.55,
          vx: Math.cos(ang) * (3.2 + Math.random() * 4.5),
          vy: Math.sin(ang) * (3.2 + Math.random() * 4.5),
          color: i % 3 === 0 ? '#ffffff' : mainColor,
          life: 1.35
        });
      }
    });
    rt.popups.push({
      text: winner === 'draw' ? '⚡ HÒA VÒNG! ⚡' : '⚡ KẾT LIỄU! ⚡',
      xRatio: winner === 'draw' ? 0.5 : targets[0],
      yRatio: 0.26,
      color: '#fde047',
      life: 1.35
    });
    return slowDurMs;
  };

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

  useEffect(() => {
    if (!serverMatch || serverMatch.mode !== 'ranked_npc') {
      if (npcCombat) setNpcCombat(null);
      return undefined;
    }
    if (serverMatch.status === 'PLAYING' && (!npcCombat || npcCombat.matchId !== serverMatch.id)) {
      const startTie22 = Boolean(serverMatch.forceTie22Test || serverMatch.round === 5);
      countedRoundsRef.current = '';
      clearRoundCountdownTimers();
      setCountdownStep('');
      setSlowMoKo(null);
      setQuestionDeadlineMs(0);

      if (startTie22) {
        setDemonWheelSpinning(true);
        playPvpDramaticSfx('mystery_rift', bgmMuted);
        setTimeout(() => {
          setDemonWheelSpinning(false);
          setDemonWheelRevealedForMatch(`${serverMatch.id}:spin0`);
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
        totalThunderStrikes: 0,
        totalFreezes: 0,
        tiebreakerTriggered: startTie22,
        tiebreakerSpinSeq: 0,
        demonSectorIdx: Number(serverMatch?.demonSectorIdx) || 0,
        demonRoundType: Number(serverMatch?.demonRoundType) || 1,
        roundEnding: false,
        roundBanner: '',
        npcNextActionAtMs: Date.now() + (startTie22 ? 7500 : 5500),
        finished: false
      });
      setTypedProgress(0);
      setRound4Input('');
    }
    return undefined;
  }, [serverMatch?.id, serverMatch?.status, serverMatch?.mode]);

  const effectiveTiebreakerSpinSeq =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? Number(npcCombat.tiebreakerSpinSeq) || 0
      : Number(serverMatch?.tiebreakerSpinSeq) || 0;
  const effectiveDemonSectorIdx =
    serverMatch?.mode === 'ranked_npc' && npcCombat && npcCombat.demonSectorIdx !== undefined
      ? Number(npcCombat.demonSectorIdx) || 0
      : Number(serverMatch?.demonSectorIdx) || 0;
  const effectiveDemonRoundType =
    serverMatch?.mode === 'ranked_npc' && npcCombat && npcCombat.demonRoundType !== undefined
      ? Number(npcCombat.demonRoundType) || 1
      : Number(serverMatch?.demonRoundType) || 1;
  const activeWheelSpinKey = serverMatch ? `${serverMatch.id}:spin${effectiveTiebreakerSpinSeq}` : '';

  useEffect(() => {
    if (
      serverMatch &&
      serverMatch.mode !== 'ranked_npc' &&
      serverMatch.status === 'PLAYING' &&
      serverMatch.round === 5 &&
      demonWheelRevealedForMatch !== activeWheelSpinKey &&
      !demonWheelSpinning &&
      !slowMoKo
    ) {
      setDemonWheelSpinning(true);
      playPvpDramaticSfx('mystery_rift', bgmMuted);
      const t = setTimeout(() => {
        setDemonWheelSpinning(false);
        setDemonWheelRevealedForMatch(activeWheelSpinKey);
      }, 2300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [
    serverMatch?.id,
    serverMatch?.mode,
    serverMatch?.status,
    serverMatch?.round,
    activeWheelSpinKey,
    demonWheelRevealedForMatch,
    demonWheelSpinning,
    Boolean(slowMoKo),
    bgmMuted
  ]);

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
      ? effectiveDemonRoundType
      : Math.min(4, Math.max(1, effectiveRound));

  const effectiveQIdx = serverMatch?.mode === 'ranked_npc' && npcCombat
    ? npcCombat.questionIdx
    : Number(serverMatch?.questionIdx) || 0;

  const activeRoundPool = sharedQueues[effectiveCombatStyle] || sharedQueues[1] || [];
  const activeQuestion =
    activeRoundPool.length > 0 ? activeRoundPool[effectiveQIdx % activeRoundPool.length] : null;

  useEffect(() => {
    if (activeQuestion && effectiveCombatStyle === 2) {
      const target = String(activeQuestion.word || '').toUpperCase();
      setTypedProgress(skipNonAlphaIndex(target, 0));
    } else {
      setTypedProgress(0);
    }
    setRound4Input('');
  }, [effectiveRound, effectiveCombatStyle, effectiveQIdx, activeQuestion?.word]);

  const isShowingDemonWheelModal = Boolean(
    serverMatch?.status === 'PLAYING' &&
      effectiveRound === 5 &&
      !slowMoKo &&
      demonWheelRevealedForMatch !== activeWheelSpinKey
  );

  // ==========================================
  // PRE-ROUND 3 -> 2 -> 1 -> CHIẾN! COUNTDOWN CONTROLLER (ROUNDS 1, 2, 3, 4 & 5!)
  // ==========================================
  useEffect(() => {
    if (
      !serverMatch ||
      serverMatch.status !== 'PLAYING' ||
      Boolean(slowMoKo) ||
      isShowingDemonWheelModal ||
      npcCombat?.finished ||
      npcCombat?.roundEnding
    ) {
      return undefined;
    }
    const roundKey = `${serverMatch.id}:r${effectiveRound}:s${effectiveTiebreakerSpinSeq}`;
    if (countedRoundsRef.current === roundKey) return undefined;
    countedRoundsRef.current = roundKey;

    clearRoundCountdownTimers();
    const stepMs =
      typeof window !== 'undefined' && Number(window.__PVP_COUNTDOWN_STEP_MS__) >= 60
        ? Number(window.__PVP_COUNTDOWN_STEP_MS__)
        : KNIGHT_PVP_COUNTDOWN_STEP_MS;
    const goHoldMs = Math.min(360, Math.max(120, Math.round(stepMs * 0.55)));

    setCountdownStep('3');
    playPvpDramaticSfx('countdown_tick', bgmMuted);

    const t1 = setTimeout(() => {
      setCountdownStep('2');
      playPvpDramaticSfx('countdown_tick', bgmMuted);
    }, stepMs);

    const t2 = setTimeout(() => {
      setCountdownStep('1');
      playPvpDramaticSfx('countdown_tick', bgmMuted);
    }, stepMs * 2);

    const t3 = setTimeout(() => {
      setCountdownStep('CHIẾN!');
      playPvpDramaticSfx('countdown_go', bgmMuted);
    }, stepMs * 3);

    const t4 = setTimeout(() => {
      setCountdownStep('');
      setNpcCombat(prev => {
        if (!prev || prev.finished || prev.roundEnding) return prev;
        const npcObj = serverMatch?.p2;
        const styleR = prev.round === 5 ? Number(serverMatch?.demonRoundType) || 1 : prev.round;
        const pool = sharedQueues[styleR] || sharedQueues[1] || [];
        const curQ = pool[prev.questionIdx % Math.max(1, pool.length)];
        return {
          ...prev,
          npcNextActionAtMs: Date.now() + computeNextNpcDelayMs(npcObj, styleR, curQ)
        };
      });
    }, stepMs * 3 + goHoldMs);

    countdownTimerIdsRef.current = [t1, t2, t3, t4];
    return undefined;
  }, [
    serverMatch?.id,
    serverMatch?.status,
    effectiveRound,
    effectiveTiebreakerSpinSeq,
    Boolean(slowMoKo),
    isShowingDemonWheelModal,
    npcCombat?.finished,
    npcCombat?.roundEnding,
    bgmMuted,
    sharedQueues
  ]);

  const isCombatInteractive = Boolean(
    serverMatch?.status === 'PLAYING' &&
      !isShowingDemonWheelModal &&
      !slowMoKo &&
      !countdownStep &&
      !npcCombat?.finished &&
      !npcCombat?.roundEnding
  );

  // Reset / arm the 10-second Divine Punishment ("Thiên Phạt Sấm Sét") clock whenever combat is live on a question
  useEffect(() => {
    if (!isCombatInteractive || !serverMatch) {
      questionDeadlineRef.current = 0;
      setQuestionDeadlineMs(0);
      return;
    }
    const thunderLimitMs =
      typeof window !== 'undefined' && Number(window.__PVP_THUNDER_TIMEOUT_MS__) >= 1000
        ? Number(window.__PVP_THUNDER_TIMEOUT_MS__)
        : KNIGHT_PVP_QUESTION_TIMEOUT_MS;
    const nextDeadline = Date.now() + thunderLimitMs;
    thunderFiredKeyRef.current = '';
    questionDeadlineRef.current = nextDeadline;
    setQuestionDeadlineMs(nextDeadline);
  }, [isCombatInteractive, serverMatch?.id, effectiveRound, effectiveQIdx]);

  const myLives =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p1Lives
      : Number(serverMatch?.[mySlotKey]?.lives ?? KNIGHT_PVP_LIVES_PER_ROUND);
  const oppLives =
    serverMatch?.mode === 'ranked_npc' && npcCombat
      ? npcCombat.p2Lives
      : Number(serverMatch?.[oppSlotKey]?.lives ?? KNIGHT_PVP_LIVES_PER_ROUND);

  // Trigger canvas slash / slow-mo KO / thunder FX when human-vs-human server state updates!
  useEffect(() => {
    if (!serverMatch || serverMatch.mode === 'ranked_npc') {
      prevMyLivesRef.current = myLives;
      prevOppLivesRef.current = oppLives;
      return;
    }
    const srvThunderAt = Number(serverMatch.lastThunderAtMs) || 0;
    if (srvThunderAt > 0 && srvThunderAt > lastSeenServerThunderAtRef.current) {
      lastSeenServerThunderAtRef.current = srvThunderAt;
      playPvpDramaticSfx('thunder_smite', bgmMuted);
      spawnCanvasThunderSmite();
    } else if (oppLives < prevOppLivesRef.current) {
      spawnCanvasAttackFx('me', myHeroSkin.slashColor || '#fbbf24');
    } else if (myLives < prevMyLivesRef.current) {
      playPvpDramaticSfx('hurt', bgmMuted);
      spawnCanvasAttackFx('opp', '#f43f5e');
    }

    const srvKo = serverMatch.lastRoundKo;
    if (srvKo?.atMs && srvKo.atMs > lastSeenServerKoAtRef.current) {
      lastSeenServerKoAtRef.current = srvKo.atMs;
      const isDrawKo = srvKo.winnerSlot === 'draw';
      const didWinKo = srvKo.winnerSlot === mySlotKey;
      const koMode = isDrawKo ? 'draw' : didWinKo ? 'me' : 'opp';
      playPvpDramaticSfx('slowmo_ko', bgmMuted);
      const slowDurMs = spawnCanvasSlowMoFinisher(koMode);
      setSlowMoKo({
        round: srvKo.round || 1,
        winner: koMode,
        bannerText: isDrawKo
          ? `⚡ THIÊN ĐẠO HÒA VÒNG ${srvKo.round || 1}! ⚡`
          : didWinKo
          ? `⚡ KẾT LIỄU VÒNG ${srvKo.round || 1}! ⚡`
          : `💥 THẤT THỦ VÒNG ${srvKo.round || 1}! 💥`
      });
      if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
      slowMoTimerRef.current = setTimeout(() => {
        setSlowMoKo(null);
      }, slowDurMs);
    }

    prevMyLivesRef.current = myLives;
    prevOppLivesRef.current = oppLives;
  }, [
    myLives,
    oppLives,
    serverMatch?.mode,
    serverMatch?.lastThunderAtMs,
    serverMatch?.lastRoundKo?.atMs,
    mySlotKey,
    myHeroSkin.slashColor,
    bgmMuted
  ]);

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
  const isMeFrozen = myFreezeRemSec > 0.05;

  const myFighterObj = serverMatch?.[mySlotKey] || {
    name: currentUser?.name || username,
    skinId: myHeroSkin.id,
    rp: myPvpProfile.rp
  };
  const oppFighterObj = serverMatch?.[oppSlotKey] || null;
  const oppSkin = resolveSkinObj(oppFighterObj?.skinId || 'knight_arthur');
  const oppTier = getKnightPvpRankTier(oppFighterObj?.rp || 0);

  // Preload fighter sprites for 60FPS duel canvas
  useEffect(() => {
    [myHeroSkin.spriteUrl, oppSkin.spriteUrl].forEach(url => {
      if (!url || spriteCacheRef.current.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      spriteCacheRef.current.set(url, img);
    });
  }, [myHeroSkin.spriteUrl, oppSkin.spriteUrl]);

  // 60FPS HERO-VS-HERO BATTLEFIELD CANVAS (WITH TWIN LIGHTNING & BULLET-TIME SLOW-MO KO!)
  useEffect(() => {
    if (!serverMatch || (serverMatch.status !== 'PLAYING' && !slowMoKo)) return undefined;
    let rafId = 0;

    const renderFrame = () => {
      const canvas = battleCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(320, Math.floor(rect.width || 720));
        const h = Math.max(180, Math.floor(rect.height || 230));
        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          const now = Date.now();
          const rt = duelAnimRef.current;
          const isSlowMo = now < (rt.slowMoUntilMs || 0);
          const dtScale = isSlowMo ? 0.2 : 1.0;
          const groundY = h * 0.8;
          const isRiftRound = effectiveRound === 5;
          const isCrimsonRound = effectiveRound === 4;

          if (rt.shake > 0.1) {
            ctx.translate((Math.random() - 0.5) * rt.shake, (Math.random() - 0.5) * rt.shake);
            rt.shake *= isSlowMo ? 0.94 : 0.86;
          } else {
            rt.shake = 0;
          }

          // 1. Atmospheric Sky Backdrop
          const sky = ctx.createLinearGradient(0, 0, 0, groundY);
          if (isRiftRound) {
            sky.addColorStop(0, '#130424');
            sky.addColorStop(1, '#2b0940');
          } else if (isCrimsonRound) {
            sky.addColorStop(0, '#1c0610');
            sky.addColorStop(1, '#3b0d1d');
          } else if (effectiveRound === 3) {
            sky.addColorStop(0, '#0f0a29');
            sky.addColorStop(1, '#22154a');
          } else if (effectiveRound === 2) {
            sky.addColorStop(0, '#0f172a');
            sky.addColorStop(1, '#1e293b');
          } else {
            sky.addColorStop(0, '#071326');
            sky.addColorStop(1, '#102a45');
          }
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h);

          // Sky Thunder Flash during Divine Punishment
          if (rt.thunderAnim > 0.45) {
            ctx.fillStyle = `rgba(224, 242, 254, ${(rt.thunderAnim - 0.45) * 0.65})`;
            ctx.fillRect(0, 0, w, h);
          }

          // 2. Center Moon / Rift Orb
          const moonX = w * 0.5;
          const moonY = h * 0.25;
          const moonGlow = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 64);
          moonGlow.addColorStop(
            0,
            isRiftRound
              ? 'rgba(217, 70, 239, 0.65)'
              : isCrimsonRound
              ? 'rgba(251, 113, 133, 0.55)'
              : 'rgba(56, 189, 248, 0.45)'
          );
          moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = moonGlow;
          ctx.beginPath();
          ctx.arc(moonX, moonY, 64, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
          ctx.fillStyle = isRiftRound ? '#f0abfc' : isCrimsonRound ? '#fda4af' : '#e0f2fe';
          ctx.fill();

          // 3. Distant Mountains & Fortress Silhouette
          ctx.fillStyle = isRiftRound ? 'rgba(24, 5, 42, 0.88)' : 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          for (let x = 0; x <= w + 120; x += 110) {
            ctx.lineTo(x + 35, groundY - 48);
            ctx.lineTo(x + 70, groundY - 72);
            ctx.lineTo(x + 110, groundY - 38);
          }
          ctx.lineTo(w, groundY);
          ctx.closePath();
          ctx.fill();

          // Flickering Arena Torches
          [0.12, 0.38, 0.62, 0.88].forEach((rx, idx) => {
            const px = w * rx;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
            ctx.fillRect(px - 10, h * 0.18, 20, groundY - h * 0.18);
            const fl = Math.sin(now * (isSlowMo ? 0.003 : 0.015) + idx * 1.9) * 3;
            const tg = ctx.createRadialGradient(px, h * 0.44, 2, px, h * 0.44, 28 + fl);
            tg.addColorStop(0, isRiftRound ? 'rgba(240,171,252,0.9)' : 'rgba(253,224,71,0.9)');
            tg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = tg;
            ctx.beginPath();
            ctx.arc(px, h * 0.44, 28 + fl, 0, Math.PI * 2);
            ctx.fill();
          });

          // 4. Cobblestone Ground
          const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
          groundGrad.addColorStop(0, isRiftRound ? '#2e1042' : isCrimsonRound ? '#36131d' : '#1e293b');
          groundGrad.addColorStop(1, '#090d16');
          ctx.fillStyle = groundGrad;
          ctx.fillRect(0, groundY, w, h - groundY);
          ctx.strokeStyle = isRiftRound ? '#e879f9' : isCrimsonRound ? '#fb7185' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(w, groundY);
          ctx.stroke();

          // Decay combat animations (scaled by 0.2x during Slow-Motion KO!)
          const myAtkSin = Math.sin(rt.myAttack * Math.PI);
          const oppAtkSin = Math.sin(rt.oppAttack * Math.PI);
          if (rt.myAttack > 0) rt.myAttack = Math.max(0, rt.myAttack - 0.06 * dtScale);
          if (rt.oppAttack > 0) rt.oppAttack = Math.max(0, rt.oppAttack - 0.06 * dtScale);
          if (rt.myHurt > 0) rt.myHurt = Math.max(0, rt.myHurt - 0.065 * dtScale);
          if (rt.oppHurt > 0) rt.oppHurt = Math.max(0, rt.oppHurt - 0.065 * dtScale);
          if (rt.thunderAnim > 0) rt.thunderAnim = Math.max(0, rt.thunderAnim - 0.042 * dtScale);

          const heroDrawH = Math.min(126, h * 0.56);
          const myKoKnock = isSlowMo && (rt.koWinner === 'opp' || rt.koWinner === 'draw') ? 28 : 0;
          const oppKoKnock = isSlowMo && (rt.koWinner === 'me' || rt.koWinner === 'draw') ? 28 : 0;
          const myX = w * 0.24 + myAtkSin * Math.min(120, w * 0.18) - rt.myHurt * 16 - myKoKnock;
          const oppX = w * 0.76 - oppAtkSin * Math.min(120, w * 0.18) + rt.oppHurt * 16 + oppKoKnock;

          const drawFighter = ({
            x,
            skin,
            nameLabel,
            hearts,
            isRightSide,
            attackSin,
            hurtVal,
            frozenSec,
            auraColor,
            isDefeatedKo
          }) => {
            const img = spriteCacheRef.current.get(skin.spriteUrl);
            const aspect =
              img && img.complete && img.naturalHeight > 0
                ? img.naturalWidth / img.naturalHeight
                : 1;
            const drawW = heroDrawH * aspect;
            const bobY =
              frozenSec > 0.05 || isSlowMo
                ? 0
                : Math.sin(now * 0.0055 + (isRightSide ? 1.7 : 0)) * 2.8;
            const topY = groundY + 4 - heroDrawH + bobY - hurtVal * 5 - (isDefeatedKo ? 10 : 0);

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.52)';
            ctx.beginPath();
            ctx.ellipse(x, groundY + 3, drawW * 0.36, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            const aura = ctx.createRadialGradient(
              x,
              topY + heroDrawH * 0.55,
              8,
              x,
              topY + heroDrawH * 0.55,
              heroDrawH * 0.65
            );
            aura.addColorStop(0, frozenSec > 0.05 ? 'rgba(34,211,238,0.45)' : auraColor);
            aura.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(x, topY + heroDrawH * 0.55, heroDrawH * 0.65, 0, Math.PI * 2);
            ctx.fill();

            if (img && img.complete && img.naturalWidth > 0) {
              ctx.save();
              ctx.translate(x, topY + heroDrawH);
              if (isRightSide) ctx.scale(-1, 1);
              if (isDefeatedKo) {
                ctx.rotate(-0.42);
                ctx.globalAlpha = 0.85;
              } else if (attackSin > 0) {
                ctx.rotate(attackSin * 0.14);
              }
              ctx.drawImage(img, -drawW / 2, -heroDrawH, drawW, heroDrawH);
              ctx.restore();
            }

            if (frozenSec > 0.05) {
              ctx.save();
              ctx.fillStyle = 'rgba(34, 211, 238, 0.34)';
              ctx.strokeStyle = '#67e8f9';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(x - drawW * 0.44, groundY + 2);
              ctx.lineTo(x - drawW * 0.36, topY + 6);
              ctx.lineTo(x, topY - 10);
              ctx.lineTo(x + drawW * 0.36, topY + 6);
              ctx.lineTo(x + drawW * 0.44, groundY + 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.font = 'bold 12px sans-serif';
              ctx.fillStyle = '#ecfeff';
              ctx.textAlign = 'center';
              ctx.fillText(`❄️ ${frozenSec.toFixed(1)}s`, x, topY + heroDrawH * 0.5);
              ctx.restore();
            }

            const plateY = Math.max(22, topY - 14);
            ctx.font = 'bold 11px sans-serif';
            const textW = Math.max(96, ctx.measureText(nameLabel).width + 20);
            ctx.fillStyle = 'rgba(9, 13, 24, 0.86)';
            ctx.beginPath();
            ctx.roundRect(x - textW / 2, plateY - 15, textW, 20, 8);
            ctx.fill();
            ctx.strokeStyle = isRightSide ? 'rgba(244, 63, 94, 0.65)' : 'rgba(52, 211, 153, 0.65)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(nameLabel, x, plateY - 5);

            ctx.font = '13px sans-serif';
            const heartStr = [0, 1, 2].map(i => (i < hearts ? '❤️' : '🖤')).join(' ');
            ctx.fillText(heartStr, x, plateY + 13);
            ctx.restore();
          };

          const curMyFreeze = Math.max(0, (myFrozenUntilMs - now) / 1000);
          const curOppFreeze = Math.max(0, (oppFrozenUntilMs - now) / 1000);

          drawFighter({
            x: myX,
            skin: myHeroSkin,
            nameLabel: myFighterObj.name || username,
            hearts: myLives,
            isRightSide: false,
            attackSin: myAtkSin,
            hurtVal: rt.myHurt,
            frozenSec: curMyFreeze,
            auraColor: 'rgba(251, 191, 36, 0.34)',
            isDefeatedKo: Boolean(isSlowMo && (rt.koWinner === 'opp' || rt.koWinner === 'draw'))
          });

          drawFighter({
            x: oppX,
            skin: oppSkin,
            nameLabel: oppFighterObj?.name || 'Đối Thủ',
            hearts: oppLives,
            isRightSide: true,
            attackSin: oppAtkSin,
            hurtVal: rt.oppHurt,
            frozenSec: curOppFreeze,
            auraColor: 'rgba(244, 63, 94, 0.34)',
            isDefeatedKo: Boolean(isSlowMo && (rt.koWinner === 'me' || rt.koWinner === 'draw'))
          });

          // 5. TWIN DIVINE LIGHTNING BOLTS ("THIÊN PHẠT SẤM SÉT") STRIKING BOTH HEROES!
          if (rt.thunderAnim > 0.02) {
            const drawBolt = (targetX, seedShift) => {
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              ctx.globalAlpha = Math.min(1, rt.thunderAnim * 1.35);

              // Outer cyan-gold plasma pillar
              const pillar = ctx.createLinearGradient(targetX - 24, 0, targetX + 24, 0);
              pillar.addColorStop(0, 'rgba(56, 189, 248, 0)');
              pillar.addColorStop(0.5, `rgba(253, 224, 71, ${0.42 * rt.thunderAnim})`);
              pillar.addColorStop(1, 'rgba(56, 189, 248, 0)');
              ctx.fillStyle = pillar;
              ctx.fillRect(targetX - 24, 0, 48, groundY + 4);

              // Jagged main lightning bolt from y=0 to groundY
              ctx.strokeStyle = '#fde047';
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 20;
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(targetX + Math.sin(now * 0.05 + seedShift) * 10, 0);
              const segments = 7;
              for (let s = 1; s <= segments; s += 1) {
                const py = (groundY * s) / segments;
                const jag =
                  s === segments
                    ? 0
                    : Math.sin(now * 0.08 + s * 2.7 + seedShift) * (s % 2 === 0 ? 18 : -18);
                ctx.lineTo(targetX + jag, py);
              }
              ctx.stroke();

              // White-hot inner core
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Ground impact shockwave ring
              const ringProg = 1 - rt.thunderAnim;
              ctx.strokeStyle = `rgba(253, 224, 71, ${rt.thunderAnim})`;
              ctx.lineWidth = 3 * rt.thunderAnim;
              ctx.beginPath();
              ctx.ellipse(targetX, groundY + 2, 18 + ringProg * 58, 6 + ringProg * 14, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            };

            drawBolt(myX, 0.4);
            drawBolt(oppX, 3.1);
          }

          // Crescent Sword Slashes
          for (let i = rt.slashes.length - 1; i >= 0; i -= 1) {
            const sl = rt.slashes[i];
            sl.life -= 0.08 * dtScale;
            if (sl.life <= 0) {
              rt.slashes.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.translate(sl.xRatio * w, sl.yRatio * h);
            ctx.scale(sl.dir, 1);
            ctx.strokeStyle = sl.color;
            ctx.globalAlpha = Math.min(1, sl.life);
            ctx.lineWidth = 6 * Math.min(1.2, sl.life);
            ctx.beginPath();
            ctx.arc(0, 0, isSlowMo ? 58 : 46, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.restore();
          }

          // Sparks
          for (let i = rt.sparks.length - 1; i >= 0; i -= 1) {
            const sp = rt.sparks[i];
            sp.xRatio += (sp.vx * dtScale) / w;
            sp.yRatio += (sp.vy * dtScale) / h;
            sp.life -= 0.06 * dtScale;
            if (sp.life <= 0) {
              rt.sparks.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.min(1, sp.life);
            ctx.fillStyle = sp.color;
            ctx.beginPath();
            ctx.arc(sp.xRatio * w, sp.yRatio * h, isSlowMo ? 3.6 : 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Floating Damage Popups
          for (let i = rt.popups.length - 1; i >= 0; i -= 1) {
            const p = rt.popups[i];
            p.yRatio -= 0.004 * dtScale;
            p.life -= 0.035 * dtScale;
            if (p.life <= 0) {
              rt.popups.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.life * 1.4);
            ctx.font = '900 16px sans-serif';
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.xRatio * w, p.yRatio * h);
            ctx.restore();
          }

          // 6. CINEMATIC SLOW-MOTION FINISHER OVERLAY (Letterbox + Katana Horizon Cut!)
          if (isSlowMo) {
            const remRatio = Math.max(0, Math.min(1, ((rt.slowMoUntilMs || now) - now) / KNIGHT_PVP_SLOWMO_KO_MS));
            ctx.save();
            // Horizon razor slash gleam across battlefield
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = rt.koWinner === 'me' ? 'rgba(253, 224, 71, 0.85)' : 'rgba(251, 113, 133, 0.85)';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 22;
            ctx.lineWidth = Math.max(1.5, remRatio * 5.5);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.64);
            ctx.lineTo(w, h * 0.36);
            ctx.stroke();
            ctx.restore();

            // Widescreen cinema letterbox bars
            const barH = Math.round(h * 0.11);
            ctx.fillStyle = 'rgba(4, 6, 12, 0.92)';
            ctx.fillRect(0, 0, w, barH);
            ctx.fillRect(0, h - barH, w, barH);
          }

          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [
    serverMatch?.id,
    serverMatch?.status,
    Boolean(slowMoKo),
    effectiveRound,
    myHeroSkin,
    oppSkin,
    myLives,
    oppLives,
    myFrozenUntilMs,
    oppFrozenUntilMs,
    myFighterObj.name,
    oppFighterObj?.name,
    username
  ]);

  const settleNpcMatchWithServer = async (finalState) => {
    if (!serverMatch || npcSettlingRef.current === serverMatch.id) return;
    npcSettlingRef.current = serverMatch.id;
    const snap = await dispatchActionRef.current?.('KNIGHT_PVP_FINISH_NPC_MATCH', {
      matchId: serverMatch.id,
      p1RoundsWon: finalState.p1RoundsWon,
      p2RoundsWon: finalState.p2RoundsWon,
      totalCorrectHits: finalState.totalCorrectHits,
      totalThunderStrikes: finalState.totalThunderStrikes || 0,
      totalFreezes: finalState.totalFreezes,
      tiebreakerTriggered: finalState.tiebreakerTriggered
    });
    const settledMatch = snap?.knightPvpRealtime?.activeMatch;
    const goldAdded = Number(settledMatch?.rewards?.p1?.goldGain) || 0;
    if (goldAdded > 0) {
      onRewardGoldSynced?.(goldAdded);
    }
    if (finalState.p1RoundsWon > finalState.p2RoundsWon) {
      playPvpDramaticSfx('victory', bgmMuted);
    }
  };

  const applyLocalNpcRoundTransition = (prev, roundWinnerSlot, npcSlotObj) => {
    const isDraw = roundWinnerSlot === 'draw';
    const nextP1Rounds = prev.p1RoundsWon + (roundWinnerSlot === 'p1' ? 1 : 0);
    const nextP2Rounds = prev.p2RoundsWon + (roundWinnerSlot === 'p2' ? 1 : 0);
    const bannerMsg = isDraw
      ? `⚡ Thiên Đạo giáng xuống — Hòa Vòng ${prev.round}! (${nextP1Rounds} – ${nextP2Rounds})`
      : roundWinnerSlot === 'p1'
      ? `🏆 Thắng Vòng ${prev.round}! (${nextP1Rounds} – ${nextP2Rounds})`
      : `💥 ${npcSlotObj?.name || 'Đối thủ'} thắng Vòng ${prev.round}! (${nextP1Rounds} – ${nextP2Rounds})`;

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
          roundEnding: false,
          roundBanner: bannerMsg,
          npcNextActionAtMs: Date.now() + 3400 + computeNextNpcDelayMs(npcSlotObj, nextRound, nextPool[0])
        },
        shouldFinish: false,
        triggerDemonWheel: false
      };
    }

    if (prev.round === 4 && nextP1Rounds === nextP2Rounds) {
      const style5 = Number(serverMatch?.demonRoundType) || 1;
      const pool5 = sharedQueues[style5] || sharedQueues[1] || [];
      return {
        nextState: {
          ...prev,
          round: 5,
          questionIdx: 0,
          p1Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p2Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p1RoundsWon: nextP1Rounds,
          p2RoundsWon: nextP2Rounds,
          p1FrozenUntilMs: 0,
          p2FrozenUntilMs: 0,
          tiebreakerTriggered: true,
          roundEnding: false,
          roundBanner: `👁️‍🗨️ Hòa ${nextP1Rounds} – ${nextP2Rounds}! Một thực thể bí ẩn vừa xoay Vòng Quay Định Mệnh!`,
          npcNextActionAtMs: Date.now() + 5600 + computeNextNpcDelayMs(npcSlotObj, style5, pool5[0])
        },
        shouldFinish: false,
        triggerDemonWheel: true
      };
    }

    if (prev.round === 5 && isDraw) {
      const prevSectorIdx = Number(prev.demonSectorIdx ?? serverMatch?.demonSectorIdx) || 0;
      const nextSectorIdx =
        (prevSectorIdx + 1 + Math.floor(Math.random() * 3)) % DEMON_KING_ROULETTE_SECTORS.length;
      const nextSector = DEMON_KING_ROULETTE_SECTORS[nextSectorIdx] || DEMON_KING_ROULETTE_SECTORS[0];
      const nextStyle5 = Number(nextSector.round) || 1;
      const pool5 = sharedQueues[nextStyle5] || sharedQueues[1] || [];
      const nextQIdx = (prev.questionIdx || 0) + 1;
      return {
        nextState: {
          ...prev,
          round: 5,
          questionIdx: nextQIdx,
          p1Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p2Lives: KNIGHT_PVP_LIVES_PER_ROUND,
          p1FrozenUntilMs: 0,
          p2FrozenUntilMs: 0,
          tiebreakerSpinSeq: (Number(prev.tiebreakerSpinSeq) || 0) + 1,
          demonSectorIdx: nextSectorIdx,
          demonRoundType: nextStyle5,
          roundEnding: false,
          roundBanner: '👁️‍🗨️ Thiên Đạo hòa ở Vòng Quyết Định — Thực Thể Bí Ẩn xoay vòng quay thể thức mới!',
          npcNextActionAtMs:
            Date.now() + 5600 + computeNextNpcDelayMs(npcSlotObj, nextStyle5, pool5[nextQIdx % Math.max(1, pool5.length)])
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
        roundEnding: false,
        finished: true,
        roundBanner: bannerMsg
      },
      shouldFinish: true,
      triggerDemonWheel: false
    };
  };

  // Run Slow-Motion KO Finisher on the killing blow of EVERY round, THEN advance round (which starts 3-2-1!)
  const triggerNpcRoundSlowMoFinisher = (stateAtKill, winnerSlot, npcSlotObj) => {
    const isDraw = winnerSlot === 'draw';
    const didWinRound = winnerSlot === 'p1';
    const koSnapshot = {
      ...stateAtKill,
      p1Lives: isDraw ? 0 : didWinRound ? Math.max(1, stateAtKill.p1Lives) : 0,
      p2Lives: isDraw ? 0 : didWinRound ? 0 : Math.max(1, stateAtKill.p2Lives),
      roundEnding: true
    };
    setNpcCombat(koSnapshot);

    const trans = applyLocalNpcRoundTransition(koSnapshot, winnerSlot, npcSlotObj);
    playPvpDramaticSfx('slowmo_ko', bgmMuted);
    const koMode = isDraw ? 'draw' : didWinRound ? 'me' : 'opp';
    const slowDurMs = spawnCanvasSlowMoFinisher(koMode);
    setSlowMoKo({
      round: stateAtKill.round,
      winner: koMode,
      bannerText: isDraw
        ? `⚡ THIÊN ĐẠO HÒA VÒNG ${stateAtKill.round}! ⚡`
        : didWinRound
        ? `⚡ KẾT LIỄU VÒNG ${stateAtKill.round}! ⚡`
        : `💥 THẤT THỦ VÒNG ${stateAtKill.round}! 💥`
    });
    setCombatAlert({
      tone: isDraw ? 'info' : didWinRound ? 'success' : 'danger',
      text: trans.nextState.roundBanner
    });

    if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
    slowMoTimerRef.current = setTimeout(() => {
      if (trans.triggerDemonWheel) {
        const nextSpinSeq = Number(trans.nextState?.tiebreakerSpinSeq) || 0;
        const spinKey = `${serverMatch?.id || ''}:spin${nextSpinSeq}`;
        setDemonWheelSpinning(true);
        playPvpDramaticSfx('mystery_rift', bgmMuted);
        setTimeout(() => {
          setDemonWheelSpinning(false);
          setDemonWheelRevealedForMatch(spinKey);
        }, 2200);
      }
      setSlowMoKo(null);
      setNpcCombat(trans.nextState);
      if (trans.shouldFinish) {
        settleNpcMatchWithServer(trans.nextState);
      }
    }, slowDurMs);
  };

  // ==========================================
  // 10-SECOND DIVINE PUNISHMENT ("THIÊN PHẠT SẤM SÉT") CHECK
  // ==========================================
  useEffect(() => {
    const activeDeadline = questionDeadlineRef.current;
    if (!isCombatInteractive || !serverMatch || activeDeadline <= 0) return;
    if (nowTickMs < activeDeadline) return;

    const fireKey = `${serverMatch.id}:r${effectiveRound}:q${effectiveQIdx}:${activeDeadline}`;
    if (thunderFiredKeyRef.current === fireKey) return;
    thunderFiredKeyRef.current = fireKey;
    const nextLimitMs =
      typeof window !== 'undefined' && Number(window.__PVP_THUNDER_TIMEOUT_MS__) >= 1000
        ? Number(window.__PVP_THUNDER_TIMEOUT_MS__)
        : KNIGHT_PVP_QUESTION_TIMEOUT_MS;
    questionDeadlineRef.current = Date.now() + nextLimitMs;

    if (serverMatch.mode === 'ranked_npc') {
      const cur = npcCombatRef.current;
      if (!cur || cur.finished || cur.roundEnding) return;
      const npcObj = serverMatch.p2;
      playPvpDramaticSfx('thunder_smite', bgmMuted);
      spawnCanvasThunderSmite();

      const rawP1 = cur.p1Lives - 1;
      const rawP2 = cur.p2Lives - 1;
      const styleR = cur.round === 5 ? Number(serverMatch.demonRoundType) || 1 : cur.round;
      const pool = sharedQueues[styleR] || sharedQueues[1] || [];

      if (rawP1 <= 0 && rawP2 <= 0) {
        triggerNpcRoundSlowMoFinisher(
          {
            ...cur,
            p1Lives: 0,
            p2Lives: 0,
            totalThunderStrikes: (cur.totalThunderStrikes || 0) + 1
          },
          'draw',
          npcObj
        );
      } else if (rawP2 <= 0 && rawP1 >= 1) {
        triggerNpcRoundSlowMoFinisher(
          {
            ...cur,
            p1Lives: rawP1,
            p2Lives: 0,
            totalThunderStrikes: (cur.totalThunderStrikes || 0) + 1
          },
          'p1',
          npcObj
        );
      } else if (rawP1 <= 0 && rawP2 >= 1) {
        triggerNpcRoundSlowMoFinisher(
          {
            ...cur,
            p1Lives: 0,
            p2Lives: rawP2,
            totalThunderStrikes: (cur.totalThunderStrikes || 0) + 1
          },
          'p2',
          npcObj
        );
      } else {
        const nextQIdx = cur.questionIdx + 1;
        const nextQ = pool[nextQIdx % Math.max(1, pool.length)];
        setCombatAlert({
          tone: 'danger',
          text: '⚡ THIÊN PHẠT SẤM SÉT! Quá 10 giây không ai giải được — Cả 2 bị sét đánh mất -1 ❤️!'
        });
        setNpcCombat({
          ...cur,
          p1Lives: rawP1,
          p2Lives: rawP2,
          totalThunderStrikes: (cur.totalThunderStrikes || 0) + 1,
          questionIdx: nextQIdx,
          npcNextActionAtMs: Date.now() + computeNextNpcDelayMs(npcObj, styleR, nextQ)
        });
      }
      return;
    }

    lastSeenServerThunderAtRef.current = Date.now() + 3000;
    playPvpDramaticSfx('thunder_smite', bgmMuted);
    spawnCanvasThunderSmite();
    setCombatAlert({
      tone: 'danger',
      text: '⚡ THIÊN PHẠT SẤM SÉT! Quá 10 giây không ai giải được — Cả 2 mất -1 ❤️!'
    });
    dispatchActionRef.current?.('KNIGHT_PVP_SYNC_COMBAT', {
      matchId: serverMatch.id,
      event: 'THUNDER_TIMEOUT',
      questionIdx: effectiveQIdx
    });
  }, [
    nowTickMs,
    isCombatInteractive,
    questionDeadlineMs,
    serverMatch?.id,
    serverMatch?.mode,
    effectiveRound,
    effectiveQIdx,
    bgmMuted,
    sharedQueues
  ]);

  // Stealth Opponent reaction loop (paused cleanly during 3-2-1 countdown, Slow-Mo KO, & 2-2 Wheel!)
  useEffect(() => {
    if (
      !serverMatch ||
      serverMatch.mode !== 'ranked_npc' ||
      !isCombatInteractive
    ) {
      return undefined;
    }
    const npcObj = serverMatch.p2;
    const aiTimer = setInterval(() => {
      const cur = npcCombatRef.current;
      if (!cur || cur.finished || cur.roundEnding) return;
      const now = Date.now();
      if (now < cur.p2FrozenUntilMs) return;
      if (now < cur.npcNextActionAtMs) return;

      const styleRound = cur.round === 5 ? Number(serverMatch.demonRoundType) || 1 : cur.round;
      const pool = sharedQueues[styleRound] || sharedQueues[1] || [];
      const acc = Math.min(0.96, Math.max(0.45, Number(npcObj?.accuracy) || 0.65));
      const oppHits = Math.random() < acc;

      if (!oppHits) {
        playPvpDramaticSfx('freeze', bgmMuted);
        const nextDelay =
          KNIGHT_PVP_FREEZE_MS +
          computeNextNpcDelayMs(npcObj, styleRound, pool[cur.questionIdx % Math.max(1, pool.length)]);
        setCombatAlert({
          tone: 'info',
          text: `❄️ ${npcObj?.name || 'Đối thủ'} trả lời sai — Đóng băng 5s!`
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

      playPvpDramaticSfx('hurt', bgmMuted);
      spawnCanvasAttackFx('opp', '#f43f5e');

      const nextP1Lives = Math.max(0, cur.p1Lives - 1);
      if (nextP1Lives <= 0) {
        triggerNpcRoundSlowMoFinisher(cur, 'p2', npcObj);
      } else {
        const nextQIdx = cur.questionIdx + 1;
        const nextQ = pool[nextQIdx % Math.max(1, pool.length)];
        setCombatAlert({
          tone: 'danger',
          text: `💥 ${npcObj?.name || 'Đối thủ'} chém trước! Bạn mất -1 ❤️`
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
    isCombatInteractive,
    bgmMuted,
    sharedQueues
  ]);

  const triggerMyCorrectStrike = () => {
    if (!serverMatch || !isCombatInteractive || isMeFrozen) return;
    playPvpDramaticSfx('hit', bgmMuted);
    spawnCanvasAttackFx('me', myHeroSkin.slashColor || '#fbbf24');

    if (serverMatch.mode === 'ranked_npc' && npcCombat) {
      const npcObj = serverMatch.p2;
      const nextOppLives = Math.max(0, npcCombat.p2Lives - 1);
      const updatedBase = {
        ...npcCombat,
        totalCorrectHits: npcCombat.totalCorrectHits + 1
      };
      if (nextOppLives <= 0) {
        triggerNpcRoundSlowMoFinisher(updatedBase, 'p1', npcObj);
      } else {
        const nextQIdx = npcCombat.questionIdx + 1;
        const styleRound = npcCombat.round === 5 ? Number(serverMatch.demonRoundType) || 1 : npcCombat.round;
        const pool = sharedQueues[styleRound] || sharedQueues[1] || [];
        const nextQ = pool[nextQIdx % Math.max(1, pool.length)];
        setCombatAlert({
          tone: 'success',
          text: `⚔️ Chém trúng ${npcObj?.name || 'Đối thủ'} (-1 ❤️)!`
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

    dispatchActionRef.current?.('KNIGHT_PVP_SYNC_COMBAT', {
      matchId: serverMatch.id,
      event: 'STRIKE_HIT',
      questionIdx: effectiveQIdx
    });
    setCombatAlert({
      tone: 'success',
      text: '⚔️ Chém trúng đối phương (-1 ❤️)!'
    });
  };

  const triggerMyWrongFreeze = () => {
    if (!serverMatch || !isCombatInteractive || isMeFrozen) return;
    playPvpDramaticSfx('freeze', bgmMuted);
    const freezeUntil = Date.now() + KNIGHT_PVP_FREEZE_MS;
    setCombatAlert({
      tone: 'freeze',
      text: '❄️ Trả lời sai — Đóng băng 5 giây!'
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

    dispatchActionRef.current?.('KNIGHT_PVP_SYNC_COMBAT', {
      matchId: serverMatch.id,
      event: 'WRONG_ANSWER'
    });
  };

  const handleSelectChoice = (choiceText) => {
    if (!activeQuestion || isMeFrozen || !isCombatInteractive) return;
    const expected = effectiveCombatStyle === 3 ? activeQuestion.v3Target : activeQuestion.word;
    const ok = String(choiceText || '').trim().toLowerCase() === String(expected || '').trim().toLowerCase();
    if (ok) triggerMyCorrectStrike();
    else triggerMyWrongFreeze();
  };

  const handleRound2Letter = (letter) => {
    if (!activeQuestion || effectiveCombatStyle !== 2 || isMeFrozen || !isCombatInteractive) return;
    const target = String(activeQuestion.word || '').toUpperCase();
    const expected = target[typedProgress];
    if (!expected) return;
    if (String(letter || '').toUpperCase() === expected) {
      const nextProg = skipNonAlphaIndex(target, typedProgress + 1);
      setTypedProgress(nextProg);
      if (nextProg >= target.length) triggerMyCorrectStrike();
    } else {
      triggerMyWrongFreeze();
    }
  };

  useEffect(() => {
    if (
      !serverMatch ||
      !isCombatInteractive ||
      effectiveCombatStyle !== 2 ||
      isMeFrozen
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

  const handleRound4Submit = (e) => {
    if (e) e.preventDefault();
    if (!activeQuestion || effectiveCombatStyle !== 4 || isMeFrozen || !isCombatInteractive) return;
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
      triggerMyWrongFreeze();
    }
  };

  const resetLocalArenaTransientState = () => {
    npcSettlingRef.current = '';
    countedRoundsRef.current = '';
    questionDeadlineRef.current = 0;
    clearRoundCountdownTimers();
    if (slowMoTimerRef.current) clearTimeout(slowMoTimerRef.current);
    setCountdownStep('');
    setSlowMoKo(null);
    setQuestionDeadlineMs(0);
    setDemonWheelRevealedForMatch('');
  };

  const handleStartMatchmaking = async (forceTie22Test = false) => {
    if (busyAction) return;
    setBusyAction('queue');
    resetLocalArenaTransientState();
    await dispatchActionRef.current?.('KNIGHT_PVP_FIND_MATCH', {
      topicId: selectedTopicObj.id,
      topicLabel: selectedTopicObj.title,
      spawnNpcNow: forceTie22Test,
      forceTie22Test
    });
    setBusyAction('');
  };

  const handleCancelQueue = async () => {
    setBusyAction('cancel');
    await dispatchActionRef.current?.('KNIGHT_PVP_CANCEL_QUEUE', {});
    setBusyAction('');
  };

  const handleCreateCasualRoom = async () => {
    setBusyAction('create_room');
    await dispatchActionRef.current?.('KNIGHT_PVP_CREATE_ROOM', {
      topicId: selectedTopicObj.id,
      topicLabel: selectedTopicObj.title
    });
    setBusyAction('');
    showToast?.('Đã tạo phòng giao hữu 1v1! Gửi mã 6 số cho bạn bè.', 'success');
  };

  const handleJoinCasualRoom = async (e) => {
    if (e) e.preventDefault();
    const clean = joinCodeInput.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 6) {
      showToast?.('Vui lòng nhập đủ mã 6 chữ số.', 'error');
      return;
    }
    setBusyAction('join_room');
    const snap = await dispatchActionRef.current?.('KNIGHT_PVP_JOIN_ROOM', { roomCode: clean });
    setBusyAction('');
    if (!snap?.knightPvpRealtime?.activeMatch) {
      showToast?.('Không tìm thấy phòng hoặc mã không hợp lệ.', 'error');
    } else {
      setJoinCodeInput('');
    }
  };

  const handleLeaveRoomOrMatch = async () => {
    setBusyAction('leave');
    resetLocalArenaTransientState();
    setNpcCombat(null);
    await dispatchActionRef.current?.('KNIGHT_PVP_LEAVE_ROOM', {});
    setBusyAction('');
  };

  const handleAcceptReady = async () => {
    if (!serverMatch) return;
    playPvpDramaticSfx('accept', bgmMuted);
    await dispatchActionRef.current?.('KNIGHT_PVP_ACCEPT_READY', { matchId: serverMatch.id });
  };

  const handleDeclineReady = async () => {
    if (!serverMatch) return;
    await dispatchActionRef.current?.('KNIGHT_PVP_DECLINE_READY', { matchId: serverMatch.id });
  };

  const readyRemSec = serverMatch?.status === 'READY_CHECK'
    ? Math.max(0, Math.min(KNIGHT_PVP_READY_CHECK_SEC, ((Number(serverMatch.readyDeadlineMs) || nowTickMs) - nowTickMs) / 1000))
    : 0;
  const readyPct = (readyRemSec / KNIGHT_PVP_READY_CHECK_SEC) * 100;
  const myAccepted = Boolean(serverMatch?.[mySlotKey]?.accepted);
  const oppAccepted = Boolean(serverMatch?.[oppSlotKey]?.accepted);

  const demonSectorMeta =
    DEMON_KING_ROULETTE_SECTORS[effectiveDemonSectorIdx] ||
    DEMON_KING_ROULETTE_SECTORS[0];

  const thunderLimitMsDisplay =
    typeof window !== 'undefined' && Number(window.__PVP_THUNDER_TIMEOUT_MS__) >= 1000
      ? Number(window.__PVP_THUNDER_TIMEOUT_MS__)
      : KNIGHT_PVP_QUESTION_TIMEOUT_MS;
  const thunderRemMs =
    isCombatInteractive && questionDeadlineMs > 0
      ? Math.max(0, questionDeadlineMs - nowTickMs)
      : thunderLimitMsDisplay;
  const thunderRemSec = Math.ceil(thunderRemMs / 1000);
  const thunderPct = Math.max(0, Math.min(100, (thunderRemMs / thunderLimitMsDisplay) * 100));

  // ==========================================
  // VIEW 1: ACTIVE / FINISHED DUEL VIEW (WITH HERO-VS-HERO CANVAS!)
  // ==========================================
  if (serverMatch && (serverMatch.status === 'PLAYING' || serverMatch.status === 'FINISHED')) {
    const showFinishedSummary = serverMatch.status === 'FINISHED' && !slowMoKo;
    const didIWin = serverMatch.winnerSlot === mySlotKey;
    const myReward = serverMatch.rewards?.[mySlotKey] || null;
    const activeStageMeta = ROUND_STAGE_META[effectiveCombatStyle] || ROUND_STAGE_META[1];
    const inputsDisabled = isMeFrozen || !isCombatInteractive;

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
        className="max-w-4xl w-full mx-auto p-2.5 sm:p-4 space-y-3"
      >
        {/* Compact Combat HUD Strip */}
        <div className="vip-pvp-card rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between gap-2 flex-wrap shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                serverMatch.mode === 'casual_room'
                  ? 'bg-sky-600 text-white'
                  : effectiveRound === 5
                  ? 'bg-fuchsia-700 text-white'
                  : 'bg-amber-500 text-zinc-950'
              }`}
            >
              {serverMatch.mode === 'casual_room'
                ? `Phòng #${serverMatch.roomCode || ''}`
                : effectiveRound === 5
                ? '⚡ Vòng Quyết Định'
                : activeStageMeta.badge}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
              {effectiveRound === 5 ? demonSectorMeta.title : activeStageMeta.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              data-testid="knight-pvp-round-score"
              className="px-3 py-1 rounded-xl bg-zinc-900 text-amber-300 font-black text-sm tabular-nums border border-amber-500/40"
            >
              {myRoundsWon} – {oppRoundsWon}
            </div>
            {!showFinishedSummary && (
              <button
                type="button"
                onClick={handleLeaveRoomOrMatch}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-zinc-600 dark:text-zinc-300 hover:text-rose-500 text-xs font-bold transition"
              >
                Rời trận
              </button>
            )}
          </div>
        </div>

        {/* 60FPS HERO VS HERO BATTLEFIELD CANVAS */}
        {!showFinishedSummary && (
          <div className="vip-pvp-card relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#090d16] shadow-lg">
            <canvas
              ref={battleCanvasRef}
              data-testid="knight-pvp-battle-canvas"
              className="w-full h-52 sm:h-60 block"
            />

            {/* Fighter Corner Pills (Zero "NPC" clues!) */}
            <div className="px-3.5 py-2 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">BẠN</span>
                <span className="font-bold text-white truncate">{myHeroSkin.name}</span>
              </div>
              {combatAlert ? (
                <span className="font-black text-amber-300 truncate hidden sm:inline">
                  {combatAlert.text}
                </span>
              ) : null}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-rose-200 truncate">{oppSkin.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-black">
                  {serverMatch.mode === 'casual_room' ? 'ĐỐI THỦ' : `${oppTier.icon} ${oppFighterObj?.rp || 0} RP`}
                </span>
              </div>
            </div>

            {/* CINEMATIC SLOW-MOTION KO BANNER (Pointer-events-none so Bullet-Time Canvas shines!) */}
            {slowMoKo && (
              <div
                data-testid="knight-pvp-slowmo-ko"
                className="pointer-events-none absolute inset-x-0 top-6 z-20 flex flex-col items-center justify-center text-center px-4"
              >
                <span
                  className={`px-4 py-1.5 rounded-full border-2 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(251,191,36,0.65)] ${
                    slowMoKo.winner === 'me'
                      ? 'bg-zinc-950/90 border-amber-400 text-amber-300'
                      : 'bg-zinc-950/90 border-rose-500 text-rose-300'
                  }`}
                >
                  {slowMoKo.bannerText} • SLOW MOTION
                </span>
              </div>
            )}

            {/* PRE-ROUND 3 -> 2 -> 1 -> CHIẾN! READY COUNTDOWN OVERLAY */}
            {countdownStep && !slowMoKo && (
              <div
                data-testid="knight-pvp-countdown-overlay"
                className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center space-y-2"
              >
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] font-black uppercase tracking-widest">
                  {effectiveRound === 5 ? 'VÒNG QUYẾT ĐỊNH — CHUẨN BỊ SẴN SÀNG' : `VÒNG ${effectiveRound} — CHUẨN BỊ SẴN SÀNG`}
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-zinc-200">
                  {myFighterObj.name || username} <span className="text-amber-400 px-1.5">VS</span> {oppFighterObj?.name}
                </p>
                <div
                  data-testid="knight-pvp-countdown-number"
                  className={`font-black tracking-tight drop-shadow-[0_0_28px_rgba(251,191,36,0.85)] ${
                    countdownStep === 'CHIẾN!'
                      ? 'text-4xl sm:text-5xl text-emerald-300 scale-110'
                      : 'text-5xl sm:text-6xl text-amber-300 tabular-nums'
                  } transition-transform`}
                >
                  {countdownStep === 'CHIẾN!' ? '⚔️ CHIẾN!' : countdownStep}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2 - 2 MYSTERIOUS ENTITY ROULETTE MODAL (ZERO SECRET BOSS SPOILERS!) */}
        {isShowingDemonWheelModal && (
          <div
            data-testid="knight-pvp-demon-wheel"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="vip-pvp-card max-w-md w-full rounded-3xl bg-gradient-to-b from-[#170B2B] via-[#11091D] to-[#18181B] border-2 border-fuchsia-500/70 p-6 text-center text-white space-y-4 shadow-[0_0_60px_rgba(192,38,211,0.45)]">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full bg-fuchsia-950/90 border-2 border-fuchsia-400 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(232,121,249,0.7)]">
                  👁️‍🗨️
                </div>
                <span className="px-3 py-0.5 rounded-full bg-fuchsia-600/30 border border-fuchsia-400/60 text-fuchsia-200 text-xs font-black uppercase">
                  HÒA 2 – 2 • VÒNG QUYẾT ĐỊNH
                </span>
                <h3 className="text-xl font-black text-white">
                  Thực Thể Bí Ẩn Xuất Hiện!
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Một thực thể bí ẩn vừa giáng lâm, xoay vòng quay chọn thể thức cuối cùng rồi biến mất vào hư không...
                </p>
              </div>

              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-300" />
                <div
                  style={{
                    transform: `rotate(${
                      demonWheelSpinning
                        ? 1080 + effectiveDemonSectorIdx * 90 + 45
                        : effectiveDemonSectorIdx * 90 + 45
                    }deg)`,
                    transition: demonWheelSpinning ? 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                    background:
                      'conic-gradient(#e11d48 0deg 90deg, #d97706 90deg 180deg, #7c3aed 180deg 270deg, #0284c7 270deg 360deg)'
                  }}
                  className="w-full h-full rounded-full border-4 border-amber-300 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-950 border-2 border-amber-300 flex items-center justify-center text-lg font-black text-fuchsia-300">
                    ???
                  </div>
                </div>
              </div>

              <div className="vip-pvp-card rounded-2xl bg-zinc-900/90 border border-fuchsia-400/40 p-3">
                <p className="text-sm font-black text-amber-300">
                  {demonWheelSpinning ? '🔮 Đang xoay định mệnh...' : `${demonSectorMeta.shortLabel} — ${demonSectorMeta.title}`}
                </p>
              </div>

              {!demonWheelSpinning && (
                <button
                  type="button"
                  data-testid="knight-pvp-enter-round5-btn"
                  onClick={() => setDemonWheelRevealedForMatch(activeWheelSpinKey)}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-amber-500 hover:opacity-95 text-white font-black text-sm shadow-lg transition"
                >
                  ⚔️ BẮT ĐẦU VÒNG QUYẾT ĐỊNH
                </button>
              )}
            </div>
          </div>
        )}

        {/* POST-MATCH SUMMARY OR SHARED QUESTION PANEL */}
        {showFinishedSummary ? (
          <div
            data-testid="knight-pvp-result-panel"
            className="vip-pvp-card rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-6 text-center space-y-4 shadow-md"
          >
            <h2
              className={`text-2xl sm:text-3xl font-black ${
                didIWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {didIWin ? '🏆 CHIẾN THẮNG!' : '💥 THẤT BẠI!'}
            </h2>

            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
              {serverMatch.finishReason || `Tỷ số: ${myRoundsWon} – ${oppRoundsWon}`}
            </p>

            {serverMatch.mode !== 'casual_room' && myReward && (
              <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto">
                <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                  <p className="text-xs text-zinc-500 font-bold">Điểm BXH</p>
                  <p
                    data-testid="knight-pvp-rp-delta"
                    className={`text-lg font-black tabular-nums ${
                      myReward.rpDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {myReward.rpDelta >= 0 ? `+${myReward.rpDelta}` : myReward.rpDelta} RP
                  </p>
                </div>
                <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                  <p className="text-xs text-zinc-500 font-bold">Thưởng Vàng</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-300 tabular-nums">
                    +{myReward.goldGain} 🪙
                  </p>
                </div>
                <div className="vip-pvp-card rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                  <p className="text-xs text-zinc-500 font-bold">Bậc Hạng</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
                    {myReward.tierLabel}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
              {serverMatch.mode !== 'casual_room' && (
                <button
                  type="button"
                  onClick={() => handleStartMatchmaking(false)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white font-black text-sm shadow-md transition inline-flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" /> Đấu Trận Tiếp
                </button>
              )}
              <button
                type="button"
                data-testid="knight-pvp-return-lobby-btn"
                onClick={handleLeaveRoomOrMatch}
                className="px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-extrabold text-sm transition"
              >
                Về Sảnh 1v1
              </button>
            </div>
          </div>
        ) : (
          activeQuestion && (
            <div className="vip-pvp-card relative rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-sm">
              {/* 10-Second Divine Punishment ("Thiên Phạt Sấm Sét") Countdown Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Câu #{effectiveQIdx + 1} • {serverMatch.topicLabel}
                  </span>
                  <span
                    data-testid="knight-pvp-thunder-timer"
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black tabular-nums border ${
                      !isCombatInteractive
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                        : thunderRemSec <= 3
                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {isCombatInteractive
                        ? `Thiên Phạt Sấm Sét: ${thunderRemSec}s`
                        : 'Đang chuẩn bị...'}
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${isCombatInteractive ? thunderPct : 100}%` }}
                    className={`h-full transition-all duration-100 ${
                      thunderRemSec <= 3
                        ? 'bg-gradient-to-r from-rose-600 to-amber-400'
                        : 'bg-gradient-to-r from-cyan-400 via-amber-400 to-amber-500'
                    }`}
                  />
                </div>
              </div>

              {isMeFrozen && (
                <div
                  data-testid="knight-pvp-freeze-banner"
                  className="rounded-xl bg-cyan-950/95 border border-cyan-400 px-4 py-2.5 text-center text-white flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(34,211,238,0.4)]"
                >
                  <Snowflake className="w-4 h-4 text-cyan-300 animate-spin" />
                  <span className="text-cyan-200 font-black text-sm tabular-nums">
                    ĐANG ĐÓNG BĂNG: {myFreezeRemSec.toFixed(1)}s
                  </span>
                </div>
              )}

              {(effectiveCombatStyle === 1 || effectiveCombatStyle === 3) && (
                <div className="space-y-2.5">
                  <p
                    data-testid="knight-pvp-question-prompt"
                    className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white"
                  >
                    {effectiveCombatStyle === 3
                      ? activeQuestion.v3Question
                      : `Nghĩa: "${activeQuestion.prompt}"`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mcqChoices.map((choiceText, idx) => (
                      <button
                        key={`${choiceText}-${idx}`}
                        type="button"
                        disabled={inputsDisabled}
                        data-testid={`knight-pvp-choice-${idx}`}
                        data-choice-value={choiceText}
                        onClick={() => handleSelectChoice(choiceText)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          inputsDisabled
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
                        disabled={inputsDisabled}
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

              {effectiveCombatStyle === 4 && (
                <form onSubmit={handleRound4Submit} className="space-y-2.5">
                  <div className="vip-pvp-card p-3 rounded-xl bg-amber-50/70 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 space-y-1">
                    <p
                      data-testid="knight-pvp-question-prompt"
                      className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white"
                    >
                      {activeQuestion.v4Question}
                    </p>
                    {activeQuestion.v4HintMeaning && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                        💡 {activeQuestion.v4HintMeaning}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={inputsDisabled}
                      data-testid="knight-pvp-round4-input"
                      value={round4Input}
                      onChange={e => setRound4Input(e.target.value)}
                      placeholder={
                        isMeFrozen
                          ? 'Đang đóng băng 5s...'
                          : !isCombatInteractive
                          ? 'Đang đếm ngược chuẩn bị...'
                          : 'Nhập cụm từ còn thiếu...'
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={inputsDisabled || !round4Input.trim()}
                      data-testid="knight-pvp-round4-submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-zinc-950 font-black text-sm transition shrink-0"
                    >
                      ⚔️ Chém
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
  // VIEW 2: SLEEK, ULTRA-CONCISE 1v1 LOBBY (ZERO NPC & ZERO SECRET BOSS SPOILERS!)
  // ==========================================
  const queueElapsedSec = inQueue ? Math.max(0, Math.floor((nowTickMs - (queuedAt || nowTickMs)) / 1000)) : 0;
  const top3Rows = knightPvpLeaderboard.slice(0, 3);
  const restRows = knightPvpLeaderboard.slice(3, 15);

  return (
    <div
      data-testid="knight-pvp-lobby"
      className="max-w-5xl w-full mx-auto p-3 sm:p-5 space-y-4"
    >
      {/* Compact Header + Topic Picker in ONE clean bar */}
      <div className="vip-pvp-card rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="knight-pvp-back-btn"
            onClick={onBackToKnightHub}
            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-extrabold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Về Sảnh
          </button>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
              ĐẤU TRƯỜNG 1 VS 1
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {topicOptions.length > 0 && (
            <select
              value={topicId}
              onChange={e => onSelectTopicId?.(e.target.value)}
              disabled={inQueue || Boolean(activeRoom)}
              className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
            >
              {topicOptions.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img src={myHeroSkin.spriteUrl} alt={myHeroSkin.name} className="w-8 h-8 object-contain" />
            <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${myRankTier.badgeClass}`}>
              {myRankTier.icon} {myRankTier.shortLabel}
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-300 tabular-nums">
              {myPvpProfile.rp} RP
            </span>
          </div>
        </div>
      </div>

      {/* Two Concise Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ranked 1v1 Card */}
        <div className="vip-pvp-card lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#131520] via-[#18181B] to-[#231729] border border-amber-500/40 p-5 text-white flex flex-col justify-between gap-4 shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase">
                🏆 ĐỐI KHÁNG XẾP HẠNG
              </span>
              <span className="text-xs font-bold text-zinc-400 tabular-nums">
                {myPvpProfile.wins} Thắng • {myPvpProfile.losses} Thua
              </span>
            </div>

            <h3 className="text-xl font-black text-white">
              Ghép Trận 1 vs 1
            </h3>

            {/* Concise 4-Chip Rule Summary */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-200">
                ⚔️ 4 Vòng • 3 ❤️ / vòng
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                ⚡ Đúng trước: Chém -1 ❤️
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                ❄️ Sai: Đóng băng 5s
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/30">
                🌩️ Quá 10s: Thiên phạt -1 ❤️ cả 2
              </span>
            </div>
          </div>

          {inQueue ? (
            <div
              data-testid="knight-pvp-queue-box"
              className="vip-pvp-card rounded-2xl bg-zinc-900/95 border border-cyan-400/50 p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-amber-400 animate-spin shrink-0" />
                <p className="text-sm font-black text-cyan-300 tabular-nums">
                  Đang tìm đối thủ... ({queueElapsedSec}s)
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelQueue}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white text-xs font-black transition"
              >
                Hủy
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
                <span>GHÉP TRẬN NGAY</span>
              </button>

              {isStrictAdmin && (
                <button
                  type="button"
                  data-testid="knight-pvp-admin-tie22-btn"
                  disabled={Boolean(busyAction) || Boolean(activeRoom)}
                  onClick={() => handleStartMatchmaking(true)}
                  className="py-3.5 px-4 rounded-2xl bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-50 text-white font-black text-xs border border-fuchsia-400/60 transition shrink-0"
                >
                  ⚡ Test Hòa 2-2 (Admin)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Casual Room Card */}
        <div className="vip-pvp-card lg:col-span-5 rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 text-xs font-black uppercase">
              🎈 PHÒNG GIAO HỮU
            </span>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Đấu Cùng Bạn Bè
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Giao hữu giải trí bằng mã 6 số • Không tính điểm BXH &amp; Danh hiệu.
            </p>
          </div>

          {activeRoom ? (
            <div
              data-testid="knight-pvp-casual-room-box"
              className="vip-pvp-card rounded-2xl bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-700 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-500">Mã phòng:</span>
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
                  {copiedCode ? 'Đã chép' : 'Chép mã'}
                </button>
              </div>
              <p
                data-testid="knight-pvp-room-code"
                className="text-2xl font-mono font-black tracking-[0.25em] text-center text-sky-700 dark:text-sky-300"
              >
                {activeRoom.code}
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
            <div className="space-y-2">
              <button
                type="button"
                data-testid="knight-pvp-create-room-btn"
                disabled={inQueue || busyAction === 'create_room'}
                onClick={handleCreateCasualRoom}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Users className="w-4 h-4" /> Tạo Phòng 1v1
              </button>

              <form onSubmit={handleJoinCasualRoom} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  data-testid="knight-pvp-join-room-input"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Mã 6 số..."
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
        className="vip-pvp-card rounded-3xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-3.5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-white">
              BXH ĐỐI KHÁNG 1 VS 1 ({knightPvpLeaderboard.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Reset 00:00 Thứ Hai
          </span>
        </div>

        {knightPvpLeaderboard.length === 0 ? (
          <p className="py-5 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Chưa có kỷ lục tuần này — Ghép trận ngay để mở BXH!
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3Rows.map((entry, idx) => {
                const tier = getKnightPvpRankTier(entry.rp);
                const skin = resolveSkinObj(entry.skinId);
                const rankMedals = ['🥇 TOP 1', '🥈 TOP 2', '🥉 TOP 3'];
                const isMe = String(entry.username || '').toLowerCase() === vLower;
                return (
                  <div
                    key={entry.id || entry.username}
                    className={`vip-pvp-card rounded-2xl p-3 border flex items-center gap-3 ${
                      idx === 0
                        ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-400'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <img src={skin.spriteUrl} alt={skin.name} className="w-11 h-11 object-contain shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
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
                      <p className="text-xs font-bold text-zinc-500 tabular-nums">
                        {tier.icon} {entry.rp} RP • {entry.wins}T - {entry.losses}B
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {restRows.length > 0 && (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {restRows.map((entry, i) => {
                  const tier = getKnightPvpRankTier(entry.rp);
                  const skin = resolveSkinObj(entry.skinId);
                  const isMe = String(entry.username || '').toLowerCase() === vLower;
                  return (
                    <div
                      key={entry.id || entry.username}
                      className="py-2 px-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-xs font-black text-zinc-500 tabular-nums">#{i + 4}</span>
                        <img src={skin.spriteUrl} alt={skin.name} className="w-7 h-7 object-contain shrink-0" />
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {entry.name || entry.username} {isMe ? '(Bạn)' : ''}
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-300 tabular-nums shrink-0">
                        {tier.icon} {entry.rp} RP
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ARENA MATCH-FOUND READY-CHECK OVERLAY */}
      {serverMatch?.status === 'READY_CHECK' && (
        <div
          data-testid="knight-pvp-ready-modal"
          className="fixed inset-0 z-50 bg-[#070A12]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="vip-pvp-card max-w-sm w-full rounded-3xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#18181B] border-2 border-amber-400/70 p-6 text-center text-white space-y-5 shadow-[0_0_70px_rgba(245,158,11,0.35)]">
            <h3 className="text-xl font-black text-amber-300 tracking-wide">
              ĐÃ TÌM THẤY ĐỐI THỦ!
            </h3>

            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
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
                <Swords className="w-7 h-7 text-amber-300 mb-1" />
                <span className="text-2xl font-black tabular-nums text-white">
                  {Math.ceil(readyRemSec)}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  myAccepted
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                }`}
              >
                Bạn {myAccepted ? '✓' : '...'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  oppAccepted
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                }`}
              >
                Đối thủ {oppAccepted ? '✓' : '...'}
              </span>
            </div>

            {!myAccepted ? (
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="knight-pvp-accept-btn"
                  onClick={handleAcceptReady}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-400 to-amber-500 hover:opacity-95 text-zinc-950 font-black text-base shadow-[0_0_28px_rgba(34,211,238,0.45)] transition"
                >
                  ⚔️ CHẤP NHẬN
                </button>
                <button
                  type="button"
                  data-testid="knight-pvp-decline-btn"
                  onClick={handleDeclineReady}
                  className="w-full py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Từ chối
                </button>
              </div>
            ) : (
              <p className="text-xs font-extrabold text-emerald-300">
                ✓ Đã sẵn sàng — Đang vào trận...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
