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
  RefreshCw,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Swords,
  Volume2
} from 'lucide-react';
import {
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_MONSTER_STAGES,
  REVIVE_KEY_GOLD_PRICE,
  computeMonsterGoldDrop,
  computeMonsterKeyDropChance,
  loadLocalKnightRpgProfile,
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
    ...KNIGHT_MONSTER_STAGES.flatMap(st => st.monsters.map(m => m.spriteUrl)).filter(Boolean)
  ])
);

export default function KnightDragonGame({
  currentUser,
  customVocabTopics = [],
  initialRawVocab = DEFAULT_VOCAB_TEXT,
  initialTopicId = 'core',
  initialTopicLabel = 'IELTS Core Academic',
  onBackToGameHub,
  onBackToSpaceMode,
  onExitArena,
  onOpenVocabManager = null,
  onSyncKnightResult,
  roomPin = '',
  roomRawVocab = '',
  showToast
}) {
  const username = currentUser?.username || 'guest';
  const isTeacher = currentUser?.role === 'teacher';
  const [rpgProfile, setRpgProfile] = useState(() =>
    loadLocalKnightRpgProfile(username, currentUser)
  );
  const [showShopModal, setShowShopModal] = useState(false);
  const [topicId, setTopicId] = useState(initialTopicId || 'core');
  const [roundSize, setRoundSize] = useState(8);
  const [speedMode, setSpeedMode] = useState('normal');

  // Match state: 'HUB' | 'PLAYING' | 'REVIVE_PROMPT' | 'FINAL_SMASH' | 'TRANSITION' | 'GAMEOVER'
  const [matchState, setMatchState] = useState('HUB');
  const [round, setRound] = useState(1);
  const [singleRoundOnly, setSingleRoundOnly] = useState(false);
  const [queues, setQueues] = useState({ 1: [], 2: [], 3: [], 4: [] });
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

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const spriteImagesRef = useRef(new Map());
  const runtimeRef = useRef({
    lane: 1,
    heroAttackAnim: 0,
    monsterAttackAnim: 0,
    monsterHitAnim: 0,
    knightHurtAnim: 0,
    dragonFireAnim: 0,
    finalSmashAnim: 0,
    roadOffset: 0,
    droppedCoins: [],
    droppedKeys: [],
    floatingTexts: [],
    particles: [],
    timeRemainingFloat: 22,
    timeLimit: 22,
    round4MatchRatio: 0,
    typedProgress: 0,
    round: 1,
    matchState: 'HUB'
  });

  // Preload all 15 RPG Hero & Monster sprites into memory for smooth 60 FPS canvas rendering
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

  const activeSkin =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === rpgProfile.equippedSkin) ||
    KNIGHT_CHARACTER_SKINS[0];
  const stageMeta =
    KNIGHT_MONSTER_STAGES.find(s => s.round === round) || KNIGHT_MONSTER_STAGES[0];
  const currentMonster =
    stageMeta.monsters[wordIdx % stageMeta.monsters.length] || stageMeta.monsters[0];

  const expectedMonsterGold = computeMonsterGoldDrop(currentMonster, activeSkin, combo);
  const expectedKeyDropPct = Math.round(
    computeMonsterKeyDropChance(currentMonster, activeSkin) * 100
  );

  const updateAndPersistProfile = (updater) => {
    setRpgProfile(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const saved = saveLocalKnightRpgProfile(username, next);
      return saved;
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

  // Rare Revive Key (🗝️) physically bursts ONLY out of slain monsters on a low drop roll
  const spawnMonsterKeyDrop = () => {
    const keys = runtimeRef.current.droppedKeys || [];
    keys.push({
      id: `${Date.now()}_key_${Math.random()}`,
      xRatio: 0.72,
      yRatio: 0.44,
      vx: -2.4,
      vy: -5.2,
      age: 0,
      alpha: 1
    });
    runtimeRef.current.droppedKeys = keys;
  };

  const showQuickBanner = (text, kind = 'success') => {
    setBannerAlert({ text, kind });
  };

  const setupQuestionClock = (targetRound, qObj) => {
    const baseLim = getSpeedAdjustedTimeLimit(targetRound, speedMode);
    const skinBonus = Number(activeSkin.bonusTimeSec) || 0;
    const lim = baseLim + skinBonus;
    setTimeLimit(lim);
    setTimeLeft(lim);
    runtimeRef.current.timeLimit = lim;
    runtimeRef.current.timeRemainingFloat = lim;
    runtimeRef.current.round4MatchRatio = 0;
    setRound4Input('');
    const initTyped = qObj ? skipNonAlphaIndex(qObj.word, 0) : 0;
    setTypedProgress(initTyped);
    runtimeRef.current.typedProgress = initTyped;
  };

  const startKnightCampaign = (startRoundNum = 1, onlyOneRound = false) => {
    clearInterval(timerRef.current);
    const rawVocab = resolveSelectedRawVocab();
    const builtQueues = buildPracticeRoundQueues({
      rawVocab,
      roundSize: Math.max(1, Math.min(100, Number(roundSize) || 8)),
      selectedWords: [],
      seedStr: `knight:${username}:${Date.now()}`
    });
    const rNum = [1, 2, 3, 4].includes(Number(startRoundNum)) ? Number(startRoundNum) : 1;
    const firstQ = builtQueues[rNum]?.[0] || null;

    setQueues(builtQueues);
    setRound(rNum);
    setSingleRoundOnly(Boolean(onlyOneRound));
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
    setReviewLog([]);
    setBannerAlert(null);
    setMatchState('PLAYING');

    runtimeRef.current.round = rNum;
    runtimeRef.current.matchState = 'PLAYING';
    runtimeRef.current.droppedCoins = [];
    runtimeRef.current.droppedKeys = [];
    runtimeRef.current.dragonFireAnim = 0;
    runtimeRef.current.monsterAttackAnim = 0;
    runtimeRef.current.heroAttackAnim = 0;
    runtimeRef.current.finalSmashAnim = 0;
    setupQuestionClock(rNum, firstQ);

    if (firstQ) {
      if (rNum === 2) speakWord(firstQ.word);
      else if (rNum === 4) speakWord(firstQ.v4Display || firstQ.collocation || firstQ.word);
    }
  };

  const finalizeMatchAndSync = (finalScoreVal, latestProfile) => {
    clearInterval(timerRef.current);
    setMatchState('GAMEOVER');
    runtimeRef.current.matchState = 'GAMEOVER';
    const passedCount = reviewLog.filter(item => item.passed).length;
    const totalCount = Math.max(1, reviewLog.length);
    onSyncKnightResult?.({
      score: finalScoreVal,
      passedCount,
      totalCount,
      topicId,
      topicLabel: resolveSelectedTopicLabel(),
      mode: singleRoundOnly ? `knight_round_${round}` : 'knight_full_4',
      gameType: 'knight_rpg',
      knightRpgProfile: latestProfile
    });
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

  const advanceToNextMonsterOrStage = (latestScore) => {
    const curQueue = queues[round] || [];
    const nextIdx = wordIdx + 1;
    if (nextIdx < curQueue.length) {
      const nextQ = curQueue[nextIdx];
      setWordIdx(nextIdx);
      setActiveQ(nextQ);
      setupQuestionClock(round, nextQ);
      if (round === 2) speakWord(nextQ.word);
      else if (round === 4) speakWord(nextQ.v4Display || nextQ.collocation || nextQ.word);
      return;
    }

    if (round < 4 && !singleRoundOnly) {
      setMatchState('TRANSITION');
      runtimeRef.current.matchState = 'TRANSITION';
      return;
    }

    // Completed campaign!
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
    const goldGain = computeMonsterGoldDrop(currentMonster, activeSkin, combo);
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
      spawnMonsterKeyDrop();
      spawnBurstParticles(0.72, 0.44, '#38bdf8', 24);
      spawnFloatingText('+1 🗝️ Quái Rớt Chìa Khóa Hồi Sinh (Hiếm)!', '#38bdf8', 0.56, 0.22);
    }
    return { goldGain, droppedKey };
  };

  const triggerDragonFinalSmashOrLifeLoss = (reason, isTimeoutOnDragon = false) => {
    const nextLives = isTimeoutOnDragon ? 0 : Math.max(0, lives - 1);
    setCombo(0);
    playSound('wrong');
    runtimeRef.current.knightHurtAnim = 1;
    if (round === 4 || isTimeoutOnDragon) {
      runtimeRef.current.dragonFireAnim = 1;
    } else {
      runtimeRef.current.monsterAttackAnim = 1;
    }
    spawnBurstParticles(0.25, 0.66, '#ef4444', 22);

    if (activeQ) {
      recordWordAttempt(activeQ, round, false);
    }

    if (isTimeoutOnDragon) {
      // Super Smash Bros. FINAL SMASH Finisher!
      setLives(0);
      setFinalSmashReason(reason);
      setMatchState('FINAL_SMASH');
      runtimeRef.current.matchState = 'FINAL_SMASH';
      runtimeRef.current.finalSmashAnim = 1;
      setTimeout(() => {
        setMatchState('REVIVE_PROMPT');
        runtimeRef.current.matchState = 'REVIVE_PROMPT';
      }, 2100);
      return;
    }

    setLives(nextLives);
    showQuickBanner(reason, 'error');

    if (nextLives <= 0) {
      setMatchState('REVIVE_PROMPT');
      runtimeRef.current.matchState = 'REVIVE_PROMPT';
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
          round === 4
            ? activeQ.v4Display || activeQ.collocation || activeQ.word
            : round === 3
            ? activeQ.v3Target || activeQ.word
            : activeQ.word;

        if (round === 4) {
          triggerDragonFinalSmashOrLifeLoss(
            `🐉 QUÁ GIỜ! RỒNG HẮC ÁM TUNG SKILL TẤT SÁT "LONG HỎA DIỆT THẾ"! (Đáp án: "${correctAns}")`,
            true
          );
        } else {
          triggerDragonFinalSmashOrLifeLoss(
            `⏰ Quá thời gian! ${currentMonster.name} lao tới tấn công! (Đáp án: "${correctAns}")`,
            false
          );
        }
      }
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [matchState, round, wordIdx, activeQ]);

  // Choice handler for Wave 1 (Slime/Goblin Rune Shields) & Wave 3 (Golem/Dark Lich Spell Orbs)
  const handleSelectRuneChoice = (choiceText) => {
    if (matchState !== 'PLAYING' || !activeQ) return;
    const targetAnswer = round === 1 ? activeQ.word : round === 3 ? activeQ.v3Target : '';
    const isCorrect =
      String(choiceText || '').trim().toLowerCase() === String(targetAnswer || '').trim().toLowerCase();

    if (isCorrect) {
      runtimeRef.current.heroAttackAnim = 1;
      runtimeRef.current.monsterHitAnim = 1;
      playSound('word_clear');
      speakWord(activeQ.word);
      spawnBurstParticles(0.73, 0.52, activeSkin.slashColor || '#38bdf8', 28);

      const remainRatio = Math.max(
        0,
        Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
      );
      const speedBonus = Math.round(remainRatio * 90);
      const gain = 150 + combo * 30 + speedBonus;
      const nextScore = score + gain;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);

      const { goldGain, droppedKey } = rewardMonsterKill(false);
      recordWordAttempt(activeQ, round, true);
      showQuickBanner(
        `⚔️ Chém hạ ${currentMonster.name}! +${gain}đ • Quái rớt +${goldGain} 🪙 Vàng${
          droppedKey ? ' • 🗝️ Quái rớt 1 Chìa Khóa Hồi Sinh (Hiếm)!' : ''
        }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `💥 Chém trượt "${choiceText}"! ${currentMonster.name} phản đòn (-1 ❤️)!`,
        false
      );
    }
  };

  // Wave 2: Continuous sword-combo typing to shatter Skeleton/Orc armor
  const handleWave2KeyInput = (char) => {
    if (matchState !== 'PLAYING' || round !== 2 || !activeQ) return;
    const target = String(activeQ.word || '').toUpperCase();
    const expected = target[typedProgress];
    if (!expected) return;

    if (char.toUpperCase() === expected) {
      playSound('type_hit');
      runtimeRef.current.heroAttackAnim = 0.85;
      runtimeRef.current.monsterHitAnim = 0.7;
      spawnBurstParticles(0.73, 0.52, activeSkin.slashColor || '#fbbf24', 10);
      spawnMonsterCoinDrops(2);

      const nextProg = skipNonAlphaIndex(target, typedProgress + 1);
      setTypedProgress(nextProg);
      runtimeRef.current.typedProgress = nextProg;

      if (nextProg >= target.length) {
        playSound('word_clear');
        speakWord(activeQ.word);
        const remainRatio = Math.max(
          0,
          Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
        );
        const gain = 210 + combo * 30 + Math.round(remainRatio * 110);
        const nextScore = score + gain;
        setScore(nextScore);
        setCombo(combo + 1);
        const { goldGain, droppedKey } = rewardMonsterKill(false);
        recordWordAttempt(activeQ, 2, true);
        showQuickBanner(
          `🗡️ Phá giáp hạ gục ${currentMonster.name} ("${activeQ.word}")! +${gain}đ • +${goldGain} 🪙${
            droppedKey ? ' • +1 🗝️ Chìa Khóa Hiếm!' : ''
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

  // Wave 4: Dragon Boss typing (each correct letter slashes Dragon HP; wrong letter/submit triggers Dragon Fire Counter!)
  const handleWave4InputChange = (nextVal) => {
    if (matchState !== 'PLAYING' || round !== 4 || !activeQ) return;
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
        runtimeRef.current.heroAttackAnim = 0.9;
        runtimeRef.current.monsterHitAnim = 0.8;
        spawnBurstParticles(0.72, 0.42, activeSkin.slashColor || '#fbbf24', 12);
      } else {
        playSound('wrong');
        runtimeRef.current.dragonFireAnim = 0.85;
        runtimeRef.current.knightHurtAnim = 0.6;
        spawnFloatingText('🔥 Rồng Khè Lửa Phản Đòn!', '#fb7185', 0.48, 0.56);
      }
    }
  };

  const handleWave4Submit = (e) => {
    if (e) e.preventDefault();
    if (matchState !== 'PLAYING' || round !== 4 || !activeQ) return;
    const rawTyped = round4Input.trim();
    if (!rawTyped) return;

    const accepted =
      Array.isArray(activeQ.v4Answers) && activeQ.v4Answers.length > 0
        ? activeQ.v4Answers
        : [activeQ.v4Display || activeQ.collocation || activeQ.word];
    const evalRes = matchRound4TypingAnswer(rawTyped, accepted);

    if (evalRes.matched) {
      runtimeRef.current.heroAttackAnim = 1;
      runtimeRef.current.monsterHitAnim = 1;
      runtimeRef.current.round4MatchRatio = 1;
      playSound('word_clear');
      speakWord(evalRes.matchedAnswer || activeQ.v4Display || activeQ.word);
      spawnBurstParticles(0.72, 0.42, '#fde047', 42);

      const remainRatio = Math.max(
        0,
        Math.min(1, runtimeRef.current.timeRemainingFloat / Math.max(1, timeLimit))
      );
      const gain = 320 + combo * 40 + Math.round(remainRatio * 150);
      const nextScore = score + gain;
      setScore(nextScore);
      setCombo(combo + 1);
      const { goldGain, droppedKey } = rewardMonsterKill(true);
      recordWordAttempt(activeQ, 4, true);
      showQuickBanner(
        `🐉 ĐỒ LONG TRẢM! Hạ gục Rồng Hắc Ám ("${evalRes.matchedAnswer}")! +${gain}đ • +${goldGain} 🪙 Vàng${
          droppedKey ? ' • +1 🗝️ Chìa Khóa Hiếm!' : ''
        }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `🔥 "${rawTyped}" chưa đúng! Rồng Hắc Ám khè lửa phản công (-1 ❤️)!`,
        false
      );
    }
  };

  const handleUseHint = () => {
    if (matchState !== 'PLAYING' || !activeQ) return;
    if (round === 2) {
      const target = String(activeQ.word || '').toUpperCase();
      const nextChar = target[typedProgress];
      if (nextChar) {
        setScore(s => Math.max(0, s - 15));
        handleWave2KeyInput(nextChar);
      }
    } else if (round === 4) {
      const primary = String(
        activeQ.v4Answers?.[0] || activeQ.v4Display || activeQ.collocation || activeQ.word || ''
      ).trim();
      if (!primary) return;
      const nextLen = Math.min(primary.length, Math.max(3, round4Input.length + 3));
      setScore(s => Math.max(0, s - 15));
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

  // Revive Mechanic (Use rare Monster-dropped Keys or Gold)
  const reviveKeyCost = reviveUsedCount + 1;
  const reviveGoldCost = reviveKeyCost * REVIVE_KEY_GOLD_PRICE;

  const handleReviveWithKeys = () => {
    if ((rpgProfile.keys || 0) < reviveKeyCost) {
      showToast?.(`Cần ${reviveKeyCost} 🗝️ Chìa Khóa Hồi Sinh! Bạn có thể dùng Vàng để hồi sinh.`, 'error');
      return;
    }
    updateAndPersistProfile(prev => ({
      ...prev,
      keys: Math.max(0, (prev.keys || 0) - reviveKeyCost)
    }));
    setReviveUsedCount(c => c + 1);
    setLives(3);
    setMatchState('PLAYING');
    runtimeRef.current.matchState = 'PLAYING';
    runtimeRef.current.finalSmashAnim = 0;
    runtimeRef.current.dragonFireAnim = 0;
    setupQuestionClock(round, activeQ);
    spawnBurstParticles(0.25, 0.68, '#fde047', 35);
    showQuickBanner(
      `🗝️ HỒI SINH THÀNH CÔNG (-${reviveKeyCost} Chìa Khóa)! Đầy 3 ❤️ & Reset thời gian!`,
      'success'
    );
  };

  const handleReviveWithGold = () => {
    if ((rpgProfile.gold || 0) < reviveGoldCost) {
      showToast?.(`Không đủ Vàng! Cần ${reviveGoldCost} 🪙 Vàng để mua mạng hồi sinh.`, 'error');
      return;
    }
    updateAndPersistProfile(prev => ({
      ...prev,
      gold: Math.max(0, (prev.gold || 0) - reviveGoldCost)
    }));
    setReviveUsedCount(c => c + 1);
    setLives(3);
    setMatchState('PLAYING');
    runtimeRef.current.matchState = 'PLAYING';
    runtimeRef.current.finalSmashAnim = 0;
    runtimeRef.current.dragonFireAnim = 0;
    setupQuestionClock(round, activeQ);
    spawnBurstParticles(0.25, 0.68, '#fbbf24', 35);
    showQuickBanner(
      `🪙 ĐÃ MUA MẠNG HỒI SINH (-${reviveGoldCost} Vàng)! Đầy 3 ❤️ & Tiếp tục chiến đấu!`,
      'success'
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
        speakWord(round === 4 ? activeQ.v4Display || activeQ.word : activeQ.word);
        return;
      }
      if (inInput) return;
      if (round === 2 && e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleWave2KeyInput(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [matchState, round, activeQ, typedProgress, score, combo]);

  // 60 FPS Fantasy RPG Illustrated Sprite Duel & Volumetric VFX Canvas Loop
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
      const groundY = h * 0.81;

      // 1. Atmospheric Fantasy Sky Backdrop per Stage Biome
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDragonStage) {
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
      ctx.fillRect(0, 0, w, h);

      // Twinkling stars
      ctx.save();
      for (let s = 0; s < 26; s += 1) {
        const sx = ((s * 97.3) % 100) / 100 * w;
        const sy = ((s * 43.7) % 52) / 100 * h;
        const twinkle = 0.25 + 0.65 * Math.abs(Math.sin(now * 0.0018 + s * 1.7));
        ctx.fillStyle = isDragonStage
          ? `rgba(253, 186, 116, ${twinkle * 0.6})`
          : `rgba(226, 232, 240, ${twinkle * 0.85})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s % 5 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Moon / Volcanic Eclipse with soft atmospheric halo
      const moonX = w * 0.16;
      const moonY = h * 0.23;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 68);
      if (isDragonStage) {
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
      ctx.arc(moonX, moonY, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fillStyle = isDragonStage ? '#fb7185' : round === 3 ? '#ddd6fe' : '#e0f2fe';
      ctx.fill();
      if (isDragonStage) {
        ctx.beginPath();
        ctx.arc(moonX + 3, moonY - 1, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#1f0610';
        ctx.fill();
      }

      // 2. Parallax Distant Mountain Ridges & Gothic Castle / Volcanic Spires
      ctx.save();
      const mountainShift = (rt.roadOffset * 28) % 240;
      ctx.fillStyle = isDragonStage
        ? 'rgba(42, 7, 17, 0.85)'
        : round === 3
        ? 'rgba(24, 14, 48, 0.82)'
        : 'rgba(15, 28, 46, 0.82)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = -240; x <= w + 240; x += 120) {
        const px = x - mountainShift;
        ctx.lineTo(px + 30, groundY - 58);
        ctx.lineTo(px + 65, groundY - (isDragonStage ? 92 : 76));
        ctx.lineTo(px + 100, groundY - 46);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // Distant Castle Silhouette on mid-horizon
      const castleX = w * 0.49;
      ctx.fillStyle = isDragonStage ? 'rgba(30, 6, 14, 0.9)' : 'rgba(15, 23, 42, 0.86)';
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
      // Glowing castle windows
      ctx.fillStyle = isDragonStage ? 'rgba(251, 146, 60, 0.65)' : 'rgba(253, 224, 71, 0.55)';
      ctx.fillRect(castleX - 50, groundY - 86, 5, 10);
      ctx.fillRect(castleX + 44, groundY - 82, 5, 10);
      ctx.fillRect(castleX - 10, groundY - 56, 6, 11);
      ctx.fillRect(castleX + 8, groundY - 56, 6, 11);
      ctx.restore();

      // 3. Midground Stone Bridge Pillars & Flickering Animated Torches
      ctx.save();
      const pillarSpacing = 195;
      for (let pIdx = 0; pIdx < 6; pIdx += 1) {
        const span = w + pillarSpacing;
        const px = ((pIdx * pillarSpacing - rt.roadOffset * 95) % span + span) % span - 95;
        // Stone column
        ctx.fillStyle = isDragonStage
          ? 'rgba(54, 15, 24, 0.65)'
          : round === 3
          ? 'rgba(42, 24, 74, 0.58)'
          : 'rgba(30, 41, 59, 0.58)';
        ctx.fillRect(px, h * 0.14, 30, groundY - h * 0.14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(px, h * 0.14, 4, groundY - h * 0.14);

        // Animated Torch radial light cone
        const flicker = Math.sin(now * 0.015 + pIdx * 2.1) * 3.5;
        const tx = px + 15;
        const ty = h * 0.42;
        const torchGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, 36 + flicker);
        if (isDragonStage) {
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
        ctx.arc(tx, ty, 36 + flicker, 0, Math.PI * 2);
        ctx.fill();

        // Flame core
        ctx.beginPath();
        ctx.arc(tx, ty, 4.5 + flicker * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = round === 3 ? '#e879f9' : '#fde047';
        ctx.fill();
      }

      // Ambient floating fireflies / volcanic embers
      for (let m = 0; m < 16; m += 1) {
        const mx = ((m * 73 + now * (isDragonStage ? 0.018 : 0.01)) % w);
        const my = isDragonStage
          ? groundY - ((m * 41 + now * 0.032) % (groundY * 0.85))
          : h * 0.24 + ((m * 37) % (groundY * 0.52)) + Math.sin(now * 0.003 + m) * 10;
        const mAlpha = 0.25 + 0.55 * Math.abs(Math.sin(now * 0.004 + m * 1.4));
        ctx.fillStyle = isDragonStage
          ? `rgba(251, 146, 60, ${mAlpha})`
          : round === 3
          ? `rgba(192, 132, 252, ${mAlpha})`
          : `rgba(52, 211, 153, ${mAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(mx, my, isDragonStage ? 2.1 : 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Textured Stone Cobblestone Battlefield Ground
      ctx.save();
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      if (isDragonStage) {
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

      // Scrolling stone slab seams
      ctx.strokeStyle = isDragonStage ? 'rgba(244, 63, 94, 0.22)' : 'rgba(148, 163, 184, 0.16)';
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

      // Glowing magma pulse beneath floor in Stage 4
      if (isDragonStage) {
        const lavaPulse = 0.35 + 0.25 * Math.sin(now * 0.005);
        const lavaGlow = ctx.createLinearGradient(0, groundY - 6, 0, groundY + 14);
        lavaGlow.addColorStop(0, `rgba(249, 115, 22, ${lavaPulse})`);
        lavaGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = lavaGlow;
        ctx.fillRect(0, groundY - 6, w, 20);
      }

      // Crisp illuminated ground rim line
      ctx.strokeStyle = isDragonStage ? '#fb7185' : round === 3 ? '#a855f7' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();
      ctx.restore();

      if (rt.matchState === 'PLAYING') {
        rt.roadOffset = (rt.roadOffset + 0.0038) % 10;
      }

      // 5. Physical Gold Coins (🪙) bursting from slain/struck Monsters into Knight's pouch
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

      // 6. Rare Revive Keys (🗝️) bursting ONLY out of slain monsters & flying to Knight
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

      // Compute Combat Positions & Animation Timers
      const heroAttackSin = Math.sin(rt.heroAttackAnim * Math.PI);
      const monsterAttackSin = Math.sin(rt.monsterAttackAnim * Math.PI);
      const heroLungeX = heroAttackSin * Math.min(92, w * 0.13);
      const heroHurtShiftX = -rt.knightHurtAnim * 18;
      const heroBaseX = w * 0.23 + heroLungeX + heroHurtShiftX;

      const monsterLungeX = -monsterAttackSin * Math.min(92, w * 0.13);
      const monsterRecoilX = rt.monsterHitAnim * 16;
      const monsterIdleSway = Math.sin(now * 0.0028) * (isDragonStage ? 8 : 5);
      const monsterX = w * 0.75 + monsterLungeX + monsterRecoilX + monsterIdleSway;

      // Decay animation timers
      if (rt.heroAttackAnim > 0) rt.heroAttackAnim = Math.max(0, rt.heroAttackAnim - 0.055);
      if (rt.monsterAttackAnim > 0) rt.monsterAttackAnim = Math.max(0, rt.monsterAttackAnim - 0.055);
      if (rt.monsterHitAnim > 0) rt.monsterHitAnim = Math.max(0, rt.monsterHitAnim - 0.06);
      if (rt.knightHurtAnim > 0) rt.knightHurtAnim = Math.max(0, rt.knightHurtAnim - 0.065);
      if (rt.dragonFireAnim > 0) rt.dragonFireAnim = Math.max(0, rt.dragonFireAnim - 0.042);

      // Compute Monster HP ratio
      let monsterHpRatio = 1;
      if (round === 4) {
        monsterHpRatio = Math.max(0, 1 - (rt.round4MatchRatio || 0));
      } else if (round === 2 && activeQ?.word) {
        const len = Math.max(1, activeQ.word.length);
        monsterHpRatio = Math.max(0, (len - rt.typedProgress) / len);
      }

      // 7. Draw Real Illustrated Monster / Ancient Dragon Boss Sprite
      const monsterImg = spriteImagesRef.current.get(currentMonster?.spriteUrl);
      const monsterDrawH = isDragonStage
        ? Math.min(202, h * 0.74)
        : Math.min(144, h * 0.56);
      const mAspect =
        monsterImg && monsterImg.complete && monsterImg.naturalHeight > 0
          ? monsterImg.naturalWidth / monsterImg.naturalHeight
          : isDragonStage
          ? 1.16
          : 1.0;
      const monsterDrawW = monsterDrawH * mAspect;
      const isFloatingMonster = isDragonStage || currentMonster?.id === 'dark_lich';
      const monsterBobY = isFloatingMonster
        ? Math.sin(now * 0.0042) * 6 - 6
        : Math.sin(now * 0.005) * 2.5;
      const monsterTopY = groundY + 6 - monsterDrawH + monsterBobY - rt.monsterHitAnim * 6;
      const monsterCenterY = monsterTopY + monsterDrawH * 0.5;

      // Soft dark contact shadow under monster
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.beginPath();
      ctx.ellipse(monsterX, groundY + 3, monsterDrawW * 0.36, isDragonStage ? 11 : 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle atmospheric aura behind Monster
      const mAura = ctx.createRadialGradient(
        monsterX,
        monsterCenterY,
        10,
        monsterX,
        monsterCenterY,
        monsterDrawH * 0.62
      );
      mAura.addColorStop(
        0,
        isDragonStage ? 'rgba(244, 63, 94, 0.34)' : `${currentMonster?.color || '#10b981'}38`
      );
      mAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mAura;
      ctx.beginPath();
      ctx.arc(monsterX, monsterCenterY, monsterDrawH * 0.62, 0, Math.PI * 2);
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
        // Brief loading fallback silhouette
        ctx.fillStyle = currentMonster?.color || '#10b981';
        ctx.beginPath();
        ctx.arc(monsterX, monsterCenterY, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp white-gold impact flash star when monster is struck
      if (rt.monsterHitAnim > 0.25) {
        ctx.save();
        ctx.translate(monsterX - monsterDrawW * 0.06, monsterCenterY);
        ctx.globalAlpha = Math.min(1, rt.monsterHitAnim);
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = activeSkin.slashColor || '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-26, -24);
        ctx.lineTo(26, 24);
        ctx.moveTo(22, -26);
        ctx.lineTo(-22, 26);
        ctx.stroke();
        ctx.restore();
      }

      // Monster Nameplate + HP Bar (clamped cleanly inside viewport, NEVER undefined!)
      const hpW = isDragonStage ? 186 : 138;
      const plateX = Math.min(w - hpW / 2 - 14, Math.max(hpW / 2 + 14, monsterX));
      const plateY = Math.max(24, monsterTopY - 12);
      const labelText = `${currentMonster?.name || 'Quái Vật'} (+${expectedMonsterGold} 🪙)`;

      ctx.font = 'bold 11px sans-serif';
      const labelW = Math.max(hpW + 16, ctx.measureText(labelText).width + 20);
      ctx.fillStyle = 'rgba(9, 13, 24, 0.84)';
      ctx.beginPath();
      ctx.roundRect(plateX - labelW / 2, plateY - 15, labelW, 20, 8);
      ctx.fill();
      ctx.strokeStyle = isDragonStage ? 'rgba(244, 63, 94, 0.55)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isDragonStage ? '#fecdd3' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, plateX, plateY - 5);

      // Gradient HP Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(plateX - hpW / 2, plateY + 8, hpW, 8, 4);
      ctx.fill();
      const hpGrad = ctx.createLinearGradient(plateX - hpW / 2, 0, plateX + hpW / 2, 0);
      if (isDragonStage) {
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(plateX - hpW / 2, plateY + 8, hpW, 8, 4);
      ctx.stroke();
      ctx.restore();

      // 8. Draw Real Illustrated Playable Hero Sprite on the Left Side
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

      ctx.save();
      // Ground contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.beginPath();
      ctx.ellipse(heroBaseX, groundY + 3, heroDrawW * 0.34, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle weapon/class aura glow behind hero
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
        rt.knightHurtAnim > 0.25 ? 'rgba(239, 68, 68, 0.45)' : `${activeSkin.bladeColor || '#38bdf8'}36`
      );
      hAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hAura;
      ctx.beginPath();
      ctx.arc(heroBaseX, heroCenterY, heroDrawH * 0.58, 0, Math.PI * 2);
      ctx.fill();

      if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(heroBaseX, heroTopY + heroDrawH);
        const hScaleY = 1 + Math.sin(now * 0.0055) * 0.016;
        ctx.scale(1, hScaleY);
        if (rt.heroAttackAnim > 0) {
          ctx.rotate(heroAttackSin * 0.09);
        } else if (rt.knightHurtAnim > 0) {
          ctx.rotate(-rt.knightHurtAnim * 0.08);
        }
        ctx.drawImage(heroImg, -heroDrawW / 2, -heroDrawH, heroDrawW, heroDrawH);
        ctx.restore();
      } else {
        ctx.fillStyle = activeSkin.armorPrimary || '#3b82f6';
        ctx.beginPath();
        ctx.arc(heroBaseX, heroCenterY, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 9. Crisp RPG Combat VFX (Crescent Sword Slash / Monster Claw Strike / Volumetric Dragon Fire Breath)
      // 9a. Hero Crescent Energy Slash Wave
      if (rt.heroAttackAnim > 0.06) {
        const progress = 1 - rt.heroAttackAnim;
        const slashX = heroBaseX + 26 + (monsterX - heroBaseX - 36) * Math.min(1, progress * 1.25);
        const slashY = heroCenterY + (monsterCenterY - heroCenterY) * progress;
        ctx.save();
        ctx.translate(slashX, slashY);
        ctx.globalAlpha = Math.min(1, rt.heroAttackAnim * 1.4);
        ctx.shadowColor = activeSkin.slashColor || '#38bdf8';
        ctx.shadowBlur = 18;

        // Outer glowing crescent moon arc
        ctx.fillStyle = activeSkin.slashColor || '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 38, -Math.PI * 0.44, Math.PI * 0.44);
        ctx.quadraticCurveTo(10, 0, Math.cos(-Math.PI * 0.44) * 38, Math.sin(-Math.PI * 0.44) * 38);
        ctx.closePath();
        ctx.fill();

        // Bright white inner razor edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(3, 0, 34, -Math.PI * 0.38, Math.PI * 0.38);
        ctx.stroke();
        ctx.restore();
      }

      // 9b. Regular Monster Claw / Arcane Counter-Attack Slash (Stages 1–3 ONLY)
      if (rt.monsterAttackAnim > 0.06 && !isDragonStage) {
        ctx.save();
        ctx.translate(heroBaseX, heroCenterY);
        ctx.globalAlpha = Math.min(1, rt.monsterAttackAnim * 1.3);
        const strikeColor = round === 3 ? '#c084fc' : '#f43f5e';
        ctx.strokeStyle = strikeColor;
        ctx.shadowColor = strikeColor;
        ctx.shadowBlur = 14;
        ctx.lineCap = 'round';
        // 3 diagonal claw marks slashing over Hero
        [-14, 0, 14].forEach((offset, idx) => {
          ctx.lineWidth = idx === 1 ? 4.5 : 3;
          ctx.beginPath();
          ctx.moveTo(26 + offset, -26 + offset * 0.5);
          ctx.quadraticCurveTo(offset * 0.4, offset * 0.2, -26 + offset, 26 + offset * 0.5);
          ctx.stroke();
        });
        // Expanding shockwave ring
        const ringR = 18 + (1 - rt.monsterAttackAnim) * 44;
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 9c. Volumetric Dragon Fire Breath Cone (Stage 4 Boss Dragon ONLY — ZERO solid rectangle!)
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

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [round, wordIdx, activeQ, activeSkin, expectedMonsterGold, currentMonster]);

  const handleBuyOrEquipSkin = (skin) => {
    const isUnlocked = rpgProfile.unlockedSkins.includes(skin.id);
    if (isUnlocked) {
      updateAndPersistProfile(prev => ({
        ...prev,
        equippedSkin: skin.id
      }));
      showToast?.(`Đã trang bị nhân vật: ${skin.name}!`);
      return;
    }
    if ((rpgProfile.gold || 0) < skin.priceGold) {
      showToast?.(
        `Chưa đủ Vàng! Cần ${skin.priceGold} 🪙 Vàng (Bạn đang có ${rpgProfile.gold || 0} 🪙). Hãy đánh quái để tích thêm vàng!`,
        'error'
      );
      return;
    }
    let updatedProfile = null;
    updateAndPersistProfile(prev => {
      updatedProfile = {
        ...prev,
        gold: Math.max(0, (prev.gold || 0) - skin.priceGold),
        unlockedSkins: Array.from(new Set([...(prev.unlockedSkins || []), skin.id])),
        equippedSkin: skin.id
      };
      return updatedProfile;
    });
    if (updatedProfile) {
      onSyncKnightResult?.({
        score: updatedProfile.bestScore || 0,
        passedCount: 1,
        totalCount: 1,
        topicId,
        topicLabel: resolveSelectedTopicLabel(),
        mode: 'knight_shop_sync',
        gameType: 'knight_rpg',
        knightRpgProfile: updatedProfile
      });
    }
    playSound('word_clear');
    showToast?.(`🎉 Đã mở khóa & trang bị nhân vật mới: ${skin.name}!`);
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

  return (
    <div
      data-testid="knight-dragon-game-root"
      className="min-h-[100dvh] w-full bg-[#090D16] text-white flex flex-col select-none relative overflow-x-hidden"
    >
      {/* Top Bar: Switch Game Mode + Teacher Question Bank + Gold / Revive Keys + Character Skin Shop */}
      <header className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap z-30">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExitArena}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Thoát Đấu Trường
          </button>

          {onBackToGameHub && (
            <button
              type="button"
              data-testid="knight-back-to-hub-btn"
              onClick={onBackToGameHub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-xs font-extrabold text-indigo-200 transition"
            >
              <span>🎮 Chọn Game Đấu Trường</span>
            </button>
          )}

          <button
            type="button"
            data-testid="switch-to-space-game-btn"
            onClick={onBackToSpaceMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-extrabold text-cyan-300 transition"
          >
            <span>🚀 Đổi sang Game Phi Thuyền Vũ Trụ</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black shadow-sm">
            <Swords className="w-3.5 h-3.5" /> HIỆP SĨ DIỆT RỒNG (RPG QUEST)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Teacher Question Bank Manager Button */}
          {isTeacher && onOpenVocabManager && (
            <button
              type="button"
              data-testid="knight-open-vocab-manager-btn"
              onClick={() => onOpenVocabManager(resolveSelectedRawVocab())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/50 text-white text-xs font-extrabold shadow-sm transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Quản Lý Bộ Đề / Ra Đề (GV)</span>
            </button>
          )}

          {/* Gold Balance */}
          <div
            data-testid="knight-gold-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{Number(rpgProfile.gold || 0).toLocaleString('vi-VN')} 🪙 Vàng</span>
          </div>

          {/* Revive Keys Balance */}
          <div
            data-testid="knight-keys-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/40 text-sky-300 text-xs font-black"
            title="Chìa Khóa Hồi Sinh (Tỉ lệ hiếm rớt khi hạ quái hoặc đổi bằng Vàng để hồi sinh khi thua)"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span>{rpgProfile.keys || 0} 🗝️ Chìa Khóa</span>
          </div>

          {/* Character Skin Shop Button */}
          <button
            type="button"
            data-testid="open-knight-shop-btn"
            onClick={() => setShowShopModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-95 text-white text-xs font-extrabold shadow-sm transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cửa Hàng Nhân Vật ({rpgProfile.unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})</span>
          </button>
        </div>
      </header>

      {/* HUB SCREEN: Stage Select, Illustrated Hero Preview, Monster Roster & Topic Selector */}
      {matchState === 'HUB' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className="rounded-3xl border border-rose-500/35 bg-gradient-to-br from-slate-900 via-[#1a1025] to-slate-900 p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-extrabold">
                  🐉 HÀNH TRÌNH ĐỒ LONG 4 ẢI: SLIME ➔ GOBLIN ➔ ORC ➔ BOSS RỒNG HẮC ÁM
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Hiệp Sĩ Diệt Rồng — Đấu Trường Từ Vựng RPG
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Đánh hạ quái <b>Slime, Goblin, Skeleton, Orc, Golem &amp; Boss Rồng Hắc Ám</b> để quái rớt ra <b>🪙 Tiền Vàng</b> tích lũy mua nhân vật mới (<b>Valkyrie Freya, Kiếm Khách Tomoe, Pháp Sư Selena, Nữ Hoàng Long Tộc...</b>), hạ quái có <b>tỉ lệ hiếm rớt 🗝️ Chìa Khóa Hồi Sinh</b> để mua mạng khi thua và né <b>Skill Tất Sát (Final Smash)</b> của Rồng!
                </p>
              </div>

              {/* Active Hero Showcase Card with Real Illustrated Sprite */}
              <div className="shrink-0 rounded-2xl border border-pink-500/40 bg-slate-950/90 p-3 flex items-center gap-3.5 shadow-lg">
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
                <div className="min-w-0 max-w-[205px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">{activeSkin.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold shrink-0">
                      {activeSkin.genderBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300 font-bold mt-0.5 truncate">{activeSkin.weaponName}</p>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{activeSkin.passiveText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold transition shrink-0"
                >
                  Đổi Skin
                </button>
              </div>
            </div>

            {/* Vocab Topic & Speed Configuration + Teacher Quick Question Bank Link */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Chọn Kho Từ Vựng ({bankItemsCount} từ)
                  </label>
                  {isTeacher && onOpenVocabManager && (
                    <button
                      type="button"
                      data-testid="knight-hub-manage-vocab-btn"
                      onClick={() => onOpenVocabManager(resolveSelectedRawVocab())}
                      className="text-[11px] font-extrabold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 transition"
                    >
                      + Tạo / Sửa bộ đề
                    </button>
                  )}
                </div>
                <select
                  value={topicId}
                  onChange={e => setTopicId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Số Quái Vật Mỗi Ải
                </label>
                <select
                  value={roundSize}
                  onChange={e => setRoundSize(Number(e.target.value) || 8)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                >
                  {[4, 8, 12, 16, 20, 30].map(n => (
                    <option key={n} value={n}>
                      {n} quái vật / ải
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Full 4-Stage Campaign OR Jump to Specific Monster Stage */}
            <div className="space-y-3">
              <button
                type="button"
                data-testid="start-knight-campaign-btn"
                onClick={() => startKnightCampaign(1, false)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 hover:opacity-95 text-slate-950 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition"
              >
                <Swords className="w-5 h-5" />
                <span>XUẤT CHINH ĐỦ 4 ẢI: SLIME ➔ GOBLIN ➔ ORC ➔ BOSS RỒNG HẮC ÁM</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {KNIGHT_MONSTER_STAGES.map(st => {
                  const stageKeyMinPct = Math.round(
                    computeMonsterKeyDropChance(st.monsters[0], activeSkin) * 100
                  );
                  return (
                    <button
                      key={st.round}
                      type="button"
                      data-testid={`start-knight-stage-${st.round}`}
                      onClick={() => startKnightCampaign(st.round, true)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                        st.round === 4
                          ? 'bg-rose-950/45 hover:bg-rose-900/55 border-rose-500/50 text-rose-100'
                          : 'bg-slate-950/85 hover:bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-100'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-black text-amber-400">{st.shortTitle}</span>
                          {st.round === 4 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                              FINAL BOSS
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-bold">
                              🗝️ {stageKeyMinPct}%+
                            </span>
                          )}
                        </div>

                        {/* Real Illustrated Monster Roster Preview */}
                        <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-xl bg-slate-900/80 border border-slate-800/90">
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

                        <p className="text-[11px] font-bold text-slate-200">{st.mechanicLabel}</p>
                        <p className="text-[11px] text-slate-400 leading-snug">{st.questionDesc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player RPG Stats & Next-Day Daily Rank Rule Note */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 font-bold">Quái Đã Hạ</p>
                <p className="text-lg font-black text-emerald-400">{rpgProfile.monstersSlain || 0}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 font-bold">Boss Rồng Đã Hạ</p>
                <p className="text-lg font-black text-rose-400">{rpgProfile.dragonsSlain || 0} 🐉</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 font-bold">Kỷ Lục Điểm Hiệp Sĩ</p>
                <p className="text-lg font-black text-amber-300">{rpgProfile.bestScore || 0}đ</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 font-bold">Danh Hiệu Top 1/2/3 Ngày</p>
                <p className="text-xs font-extrabold text-cyan-300 mt-1">Chốt 23:59 • Trao 00:00 hôm sau</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE GAMEPLAY SCREEN */}
      {matchState !== 'HUB' && (
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-2 sm:p-4 gap-2.5 min-h-0">
          {/* HUD Status Strip */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-black">
                {stageMeta.shortTitle}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold">
                Quái {wordIdx + 1}/{(queues[round] || []).length || 1}: {currentMonster?.name}
              </span>
              <span className="text-sm tracking-wider" title={`Còn ${lives} mạng`}>
                {lives > 0 ? '❤️'.repeat(lives) : '💀'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black flex items-center gap-1 border ${
                  timeLeft <= 5
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {timeLeft}s
              </span>
              <span className="text-xs font-black text-amber-400">Combo x{combo}</span>
              <span className="text-xs font-black text-emerald-400 tabular-nums">{score}đ</span>
              <button
                type="button"
                onClick={handleUseFreeze}
                disabled={freezeCharges <= 0}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 border border-sky-400/40 text-sky-300 text-xs font-bold flex items-center gap-1"
              >
                <Snowflake className="w-3 h-3" /> +8s ({freezeCharges})
              </button>
              {(round === 2 || round === 4) && (
                <button
                  type="button"
                  onClick={handleUseHint}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" /> Gợi ý (-15đ)
                </button>
              )}
            </div>
          </div>

          {/* Side-Scrolling RPG Monster Duel Canvas */}
          <div className="relative h-64 sm:h-72 w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950 shrink-0">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Monster Gold & Rare Key Drop Info Pill (computed cleanly — never undefined / NaN) */}
            <div
              data-testid="knight-loot-info-pill"
              className="absolute bottom-2 right-2.5 flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 z-20 text-[11px] font-bold text-slate-200 backdrop-blur-xs"
            >
              <span className="text-amber-300">
                🪙 Hạ {currentMonster?.name}: Rớt +{expectedMonsterGold} Vàng
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sky-300">
                🗝️ Tỉ lệ rớt Chìa Khóa: {expectedKeyDropPct}%
              </span>
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

            {/* SUPER SMASH BROS. "FINAL SMASH / SKILL TẤT SÁT KẾT LIỄU" OVERLAY */}
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
          </div>

          {/* Interactive Combat Question Panel */}
          {activeQ && matchState === 'PLAYING' && (
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  {stageMeta.mechanicLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    speakWord(round === 4 ? activeQ.v4Display || activeQ.word : activeQ.word)
                  }
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm (TAB)
                </button>
              </div>

              {/* Wave 1 (Meaning Shields) & Wave 3 (Syn/Ant/Context Spell Orbs) */}
              {(round === 1 || round === 3) && (() => {
                const choices =
                  round === 1
                    ? [activeQ.word, ...(activeQ.distractors || [])].slice(0, 4)
                    : activeQ.v3Choices || [];
                return (
                  <div className="space-y-3">
                    <p className="text-base sm:text-lg font-extrabold text-white">
                      {round === 3 ? activeQ.v3Question : `Nghĩa tiếng Việt: "${activeQ.prompt}"`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {choices.map((cText, idx) => (
                        <button
                          key={`${cText}-${idx}`}
                          type="button"
                          data-testid={`knight-choice-${idx}`}
                          onClick={() => handleSelectRuneChoice(cText)}
                          className="p-3 rounded-xl bg-slate-950 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-left flex items-center gap-3 transition group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-rose-600 group-hover:bg-amber-400 group-hover:text-slate-950 text-white text-xs font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm font-bold text-slate-100">{cText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Wave 2: Skeleton & Orc Armor-Shatter Full Word Typing */}
              {round === 2 && (
                <div className="space-y-3 text-center">
                  <p className="text-base font-extrabold text-white">
                    Nghĩa: &quot;{activeQ.prompt}&quot; • Phiên âm: <span className="text-amber-300 font-mono">{activeQ.ipa || ''}</span>
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
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                : 'bg-slate-950 text-slate-500 border-slate-800'
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
                        className="w-7 h-8 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-mono font-bold text-white"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wave 4: FINAL DRAGON BOSS Sentence Fill-in-the-Blank Typing */}
              {round === 4 && (() => {
                const acceptedList =
                  Array.isArray(activeQ.v4Answers) && activeQ.v4Answers.length > 0
                    ? activeQ.v4Answers
                    : [activeQ.v4Display || activeQ.collocation || activeQ.word];
                const evalRes = matchRound4TypingAnswer(round4Input, acceptedList);
                const dragonHpPct = Math.max(0, Math.round((1 - (evalRes.matchRatio || 0)) * 100));

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-rose-950/35 border border-rose-500/40 space-y-1.5">
                      <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                        {activeQ.v4Question}
                      </p>
                      {activeQ.v4HintMeaning && (
                        <p className="text-xs text-amber-300 font-semibold">
                          💡 Gợi ý nghĩa: {activeQ.v4HintMeaning}
                        </p>
                      )}
                    </div>

                    {/* Dragon Boss HP Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                        <span className="text-rose-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> MÁU RỒNG HẮC ÁM: {dragonHpPct}%
                        </span>
                        <span className="text-amber-300">
                          {evalRes.matched
                            ? '⚡ Đủ sát thương! Nhấn Enter để tung Đồ Long Trảm!'
                            : 'Gõ đúng từ để chém mất máu Rồng • Gõ sai bị Rồng khè lửa!'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-rose-500/40">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 transition-all duration-150"
                          style={{ width: `${dragonHpPct}%` }}
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
                          placeholder="Gõ từ / cụm từ tiếng Anh để chém Rồng Hắc Ám rồi nhấn Enter..."
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border-2 border-rose-500/60 focus:border-amber-400 text-sm font-bold text-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        data-testid="knight-dragon-boss-submit"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-slate-950 text-xs sm:text-sm font-black shrink-0 flex items-center gap-1.5"
                      >
                        <Swords className="w-4 h-4" /> Chém Rồng
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* REVIVE PROMPT MODAL (USE RARE MONSTER-DROPPED KEYS OR GOLD) */}
      {matchState === 'REVIVE_PROMPT' && (
        <div
          data-testid="knight-revive-modal"
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-3xl border-2 border-amber-400 bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl">
              🗝️
            </div>
            <div className="space-y-1">
              <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black">
                HIỆP SĨ NGÃ XUỐNG TẠI {stageMeta.shortTitle}
              </span>
              <h2 className="text-2xl font-black text-white">
                Dùng Chìa Khóa Hồi Sinh Ngay?
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bạn có thể dùng <b>🗝️ Chìa Khóa Hồi Sinh</b> rớt ra từ quái (hoặc dùng <b>🪙 Vàng</b>) để hồi đầy <b>3 ❤️</b> và chiến đấu tiếp ngay tại con quái này!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <p className="text-slate-400 font-bold">Chìa Khóa Hiện Có</p>
                <p className="text-base font-black text-sky-300">{rpgProfile.keys || 0} 🗝️</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Vàng Hiện Có</p>
                <p className="text-base font-black text-amber-300">{rpgProfile.gold || 0} 🪙</p>
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
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Không hồi sinh • Kết thúc trận &amp; Lưu điểm ({score}đ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE TRANSITION OVERLAY */}
      {matchState === 'TRANSITION' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-amber-400/50 bg-slate-900 p-6 text-center space-y-4">
            <h2 className="text-2xl font-black text-amber-400">
              VƯỢT QUA {stageMeta.shortTitle}!
            </h2>
            <p className="text-xs text-slate-300">
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full rounded-3xl border border-amber-400/50 bg-slate-900 p-6 text-center space-y-4">
            <h2 className="text-2xl font-black text-amber-300">
              TỔNG KẾT HÀNH TRÌNH HIỆP SĨ
            </h2>
            <p className="text-xs text-slate-300">
              Điểm trận này: <b className="text-amber-300 text-base">{score} điểm</b> • Chiến lợi phẩm quái rớt: <b className="text-amber-400">+{sessionGoldEarned} 🪙 Vàng</b> &amp; <b className="text-sky-300">+{sessionKeysEarned} 🗝️ Chìa Khóa</b>
            </p>
            <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div>
                <p className="text-slate-400">Quái Đã Hạ Trong Trận</p>
                <p className="text-base font-black text-emerald-400">{sessionMonstersSlain} quái</p>
              </div>
              <div>
                <p className="text-slate-400">Boss Rồng Đã Hạ</p>
                <p className="text-base font-black text-rose-400">{sessionDragonsSlain} 🐉</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => startKnightCampaign(round, singleRoundOnly)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Chơi Lại Ngay
              </button>
              <button
                type="button"
                onClick={() => setShowShopModal(true)}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" /> Mở Cửa Hàng Mua Nhân Vật
              </button>
              <button
                type="button"
                onClick={() => {
                  setMatchState('HUB');
                  runtimeRef.current.matchState = 'HUB';
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Về Sảnh Hiệp Sĩ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHARACTER SKIN SHOP MODAL (7 DISTINCT ILLUSTRATED MALE & FEMALE HEROES + BUY REVIVE KEYS) */}
      {showShopModal && (
        <div
          data-testid="knight-skin-shop-modal"
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="max-w-4xl w-full rounded-3xl border border-pink-500/40 bg-slate-900 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <span>Cửa Hàng Nhân Vật &amp; Skin Hiệp Sĩ (7 Nhân Vật Nam / Nữ)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tích vàng từ đánh quái Slime, Goblin, Skeleton, Orc, Golem và Rồng để mở khóa nhân vật độc bản với ngoại hình, vũ khí &amp; kỹ năng riêng biệt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShopModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Đóng ✕
              </button>
            </div>

            {/* Balance & Buy Revive Key Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-4 text-xs font-black">
                <span className="text-amber-300">🪙 Vàng của bạn: {rpgProfile.gold || 0}</span>
                <span className="text-sky-300">🗝️ Chìa Khóa Hồi Sinh: {rpgProfile.keys || 0}</span>
              </div>
              <button
                type="button"
                data-testid="buy-revive-key-with-gold-btn"
                onClick={handleBuyReviveKeyWithGold}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition"
              >
                + Mua 1 🗝️ Chìa Khóa Hồi Sinh ({REVIVE_KEY_GOLD_PRICE} 🪙 Vàng)
              </button>
            </div>

            {/* Character Skins Grid with Real Illustrated Hero Portraits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {KNIGHT_CHARACTER_SKINS.map(skin => {
                const unlocked = rpgProfile.unlockedSkins.includes(skin.id);
                const equipped = rpgProfile.equippedSkin === skin.id;
                return (
                  <div
                    key={skin.id}
                    data-testid={`knight-skin-card-${skin.id}`}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                      equipped
                        ? 'bg-pink-950/35 border-pink-400 ring-1 ring-pink-400/40'
                        : unlocked
                        ? 'bg-slate-950/90 border-slate-700'
                        : 'bg-slate-950/65 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center border-2 p-1.5 shrink-0 relative overflow-hidden shadow-lg"
                        style={{
                          background: `radial-gradient(circle at 50% 45%, ${skin.bladeColor}40, #090d16 78%)`,
                          borderColor: equipped ? '#f472b6' : skin.armorSecondary
                        }}
                      >
                        <img
                          src={skin.spriteUrl}
                          alt={skin.name}
                          className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white">{skin.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              skin.gender === 'Nữ'
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            }`}
                          >
                            {skin.genderBadge}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-black">
                            {skin.rarity}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-300">
                          🗡️ {skin.weaponName}
                        </p>
                        <p className="text-[11px] text-slate-300 leading-snug">{skin.passiveText}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrEquipSkin(skin)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition ${
                        equipped
                          ? 'bg-emerald-500 text-slate-950'
                          : unlocked
                          ? 'bg-slate-800 hover:bg-slate-700 text-white'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-slate-950'
                      }`}
                    >
                      {equipped
                        ? '✓ Đang Trang Bị'
                        : unlocked
                        ? 'Trang Bị Nhân Vật Này'
                        : `Mở Khóa Nhân Vật (${skin.priceGold} 🪙 Vàng)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
