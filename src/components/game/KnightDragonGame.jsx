import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Clock,
  Coins,
  Crown,
  Flame,
  Heart,
  KeyRound,
  Keyboard,
  Lightbulb,
  Play,
  RefreshCw,
  Shield,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  Zap
} from 'lucide-react';
import {
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_MONSTER_STAGES,
  REVIVE_KEY_GOLD_PRICE,
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

export default function KnightDragonGame({
  currentUser,
  customVocabTopics = [],
  initialRawVocab = DEFAULT_VOCAB_TEXT,
  initialTopicId = 'core',
  initialTopicLabel = 'IELTS Core Academic',
  onBackToSpaceMode,
  onExitArena,
  onSyncKnightResult,
  roomPin = '',
  roomRawVocab = '',
  showToast
}) {
  const username = currentUser?.username || 'guest';
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
  const [playerLane, setPlayerLane] = useState(1); // 0: Trái, 1: Giữa, 2: Phải
  const [bannerAlert, setBannerAlert] = useState(null);
  const [finalSmashReason, setFinalSmashReason] = useState('');
  const [reviewLog, setReviewLog] = useState([]);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const runtimeRef = useRef({
    lane: 1,
    heroAttackAnim: 0,
    monsterHitAnim: 0,
    knightHurtAnim: 0,
    dragonFireAnim: 0,
    finalSmashAnim: 0,
    roadOffset: 0,
    roadPickups: [],
    floatingTexts: [],
    particles: [],
    timeRemainingFloat: 22,
    timeLimit: 22,
    round4MatchRatio: 0,
    typedProgress: 0,
    round: 1,
    matchState: 'HUB'
  });

  const activeSkin =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === rpgProfile.equippedSkin) ||
    KNIGHT_CHARACTER_SKINS[0];
  const stageMeta =
    KNIGHT_MONSTER_STAGES.find(s => s.round === round) || KNIGHT_MONSTER_STAGES[0];
  const currentMonster =
    stageMeta.monsters[wordIdx % stageMeta.monsters.length] || stageMeta.monsters[0];

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
      vy: -1.4
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
        radius: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1
      });
    }
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
    runtimeRef.current.roadPickups = [
      { id: 'pk_1', lane: 0, z: 0.25, type: 'gold', amount: 15 },
      { id: 'pk_2', lane: 2, z: 0.58, type: 'gold', amount: 20 },
      { id: 'pk_3', lane: 1, z: 0.82, type: Math.random() < 0.45 ? 'key' : 'gold', amount: 25 }
    ];
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
    const baseGold = currentMonster?.goldBase || (isDragonBoss ? 110 : 25);
    const skinMult = 1 + (Number(activeSkin.goldBonusPct) || 0) / 100;
    const comboGold = Math.min(40, combo * 5);
    const goldGain = Math.round((baseGold + comboGold) * skinMult);

    const keyChance = (isDragonBoss ? 0.55 : 0.2) + (Number(activeSkin.keyDropBonusPct) || 0) / 100;
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

    spawnFloatingText(`+${goldGain} 🪙 Vàng`, '#fbbf24', 0.52, 0.34);
    if (droppedKey > 0) {
      spawnFloatingText(`+1 🗝️ Chìa Khóa Hồi Sinh!`, '#38bdf8', 0.5, 0.24);
    }
    return { goldGain, droppedKey };
  };

  const triggerDragonFinalSmashOrLifeLoss = (reason, isTimeoutOnDragon = false) => {
    const nextLives = isTimeoutOnDragon ? 0 : Math.max(0, lives - 1);
    setCombo(0);
    playSound('wrong');
    runtimeRef.current.knightHurtAnim = 1;
    runtimeRef.current.dragonFireAnim = 1;
    spawnBurstParticles(0.5, 0.72, '#ef4444', 24);

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

  const handleSwitchLane = (nextLane) => {
    const clamped = Math.max(0, Math.min(2, nextLane));
    setPlayerLane(clamped);
    runtimeRef.current.lane = clamped;
  };

  // Choice handler for Wave 1 (Slime/Goblin Rune Shields) & Wave 3 (Dark Mage Spell Orbs)
  const handleSelectRuneChoice = (choiceText, laneIdx = 1) => {
    if (matchState !== 'PLAYING' || !activeQ) return;
    handleSwitchLane(laneIdx % 3);
    const targetAnswer = round === 1 ? activeQ.word : round === 3 ? activeQ.v3Target : '';
    const isCorrect =
      String(choiceText || '').trim().toLowerCase() === String(targetAnswer || '').trim().toLowerCase();

    if (isCorrect) {
      runtimeRef.current.heroAttackAnim = 1;
      runtimeRef.current.monsterHitAnim = 1;
      playSound('word_clear');
      speakWord(activeQ.word);
      spawnBurstParticles(0.5, 0.32, activeSkin.slashColor || '#38bdf8', 28);

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
        `⚔️ Chém hạ ${currentMonster.name}! +${gain}đ • +${goldGain} 🪙 Vàng${
          droppedKey ? ' • 🗝️ NHẶT ĐƯỢC 1 CHÌA KHÓA HỒI SINH!' : ''
        }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `💥 Chém trượt khiên "${choiceText}"! ${currentMonster.name} phản đòn (-1 ❤️)!`,
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
      spawnBurstParticles(0.5, 0.34, activeSkin.slashColor || '#fbbf24', 10);

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
            droppedKey ? ' • +1 🗝️ Chìa Khóa!' : ''
          }`,
          'success'
        );
        advanceToNextMonsterOrStage(nextScore);
      }
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `❌ Gõ sai chữ "${char}"! ${currentMonster.name} vung rìu phản công (-1 ❤️)!`,
        false
      );
    }
  };

  // Wave 4: Dragon Boss typing (each correct letter slashes Dragon HP; wrong letter or wrong submit triggers Dragon Fire Counter!)
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
        spawnBurstParticles(0.5, 0.28, activeSkin.slashColor || '#fbbf24', 12);
      } else {
        // Wrong letter typed against Dragon -> Dragon scorches Knight with fire counter-breath!
        playSound('wrong');
        runtimeRef.current.dragonFireAnim = 0.85;
        runtimeRef.current.knightHurtAnim = 0.6;
        spawnFloatingText('🔥 Rồng Khè Lửa Phản Đòn!', '#ef4444', 0.5, 0.62);
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
      spawnBurstParticles(0.5, 0.28, '#fde047', 42);

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
          droppedKey ? ' • +1 🗝️ Chìa Khóa!' : ''
        }`,
        'success'
      );
      advanceToNextMonsterOrStage(nextScore);
    } else {
      triggerDragonFinalSmashOrLifeLoss(
        `🔥 "${rawTyped}" chưa đúng! Rồng Hắc Ám quất đuôi & phun lửa phản công (-1 ❤️)!`,
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

  // Subway Surfers Revive Mechanic (Use Keys or Buy Keys with Gold)
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
    setupQuestionClock(round, activeQ);
    spawnBurstParticles(0.5, 0.7, '#fde047', 35);
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
    setupQuestionClock(round, activeQ);
    spawnBurstParticles(0.5, 0.7, '#fbbf24', 35);
    showQuickBanner(
      `🪙 ĐÃ MUA MẠNG HỒI SINH (-${reviveGoldCost} Vàng)! Đầy 3 ❤️ & Tiếp tục chiến đấu!`,
      'success'
    );
  };

  // Keyboard listener for Lane Switching (ArrowLeft/ArrowRight) & Wave 2 Typing
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
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSwitchLane(runtimeRef.current.lane - 1);
        return;
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSwitchLane(runtimeRef.current.lane + 1);
        return;
      }
      if (round === 2 && e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleWave2KeyInput(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [matchState, round, activeQ, typedProgress, score, combo]);

  // 60 FPS RPG Dungeon Runner & Boss Duel Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const parent = canvas.parentElement;
      const w = (canvas.width = Math.max(320, parent?.clientWidth || 760));
      const h = (canvas.height = Math.max(230, parent?.clientHeight || 300));
      const rt = runtimeRef.current;

      // 1. Sky / Dungeon Backdrop
      const isDragonStage = round === 4;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDragonStage) {
        bgGrad.addColorStop(0, '#1e0510');
        bgGrad.addColorStop(0.55, '#3b0718');
        bgGrad.addColorStop(1, '#0f172a');
      } else if (round === 3) {
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(0.6, '#311042');
        bgGrad.addColorStop(1, '#0f172a');
      } else {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.55, '#1e293b');
        bgGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Perspective 3-Lane Dungeon Stone Road (Subway Surfers style)
      const horizonY = h * 0.25;
      const roadTopW = w * 0.28;
      const roadBotW = w * 0.86;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(w / 2 - roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 + roadTopW / 2, horizonY);
      ctx.lineTo(w / 2 + roadBotW / 2, h);
      ctx.lineTo(w / 2 - roadBotW / 2, h);
      ctx.closePath();
      ctx.fillStyle = isDragonStage ? '#27121b' : '#1e293b';
      ctx.fill();
      ctx.strokeStyle = isDragonStage ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lane dividers
      for (let l = 1; l <= 2; l += 1) {
        const topX = w / 2 - roadTopW / 2 + (roadTopW * l) / 3;
        const botX = w / 2 - roadBotW / 2 + (roadBotW * l) / 3;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Scrolling Road Coins (🪙) & Revive Keys (🗝️) on the 3 lanes
      if (rt.matchState === 'PLAYING') {
        rt.roadOffset = (rt.roadOffset + 0.012) % 1;
        rt.roadPickups.forEach(pk => {
          pk.z += 0.0065;
          if (pk.z >= 0.88 && pk.z <= 0.96 && pk.lane === rt.lane) {
            // Collected by Knight on this lane!
            if (pk.type === 'key') {
              setSessionKeysEarned(k => k + 1);
              updateAndPersistProfile(prev => ({
                ...prev,
                keys: (prev.keys || 0) + 1,
                keysCollected: (prev.keysCollected || 0) + 1
              }));
              spawnFloatingText('+1 🗝️ Nhặt Chìa Khóa!', '#38bdf8', 0.5, 0.72);
            } else {
              const gAmt = pk.amount || 15;
              setSessionGoldEarned(g => g + gAmt);
              updateAndPersistProfile(prev => ({
                ...prev,
                gold: (prev.gold || 0) + gAmt
              }));
              spawnFloatingText(`+${gAmt} 🪙 Vàng`, '#fbbf24', 0.5, 0.75);
            }
            pk.z = 0.05;
            pk.lane = Math.floor(Math.random() * 3);
            pk.type = Math.random() < 0.22 ? 'key' : 'gold';
          } else if (pk.z > 1.02) {
            pk.z = 0.05;
            pk.lane = Math.floor(Math.random() * 3);
            pk.type = Math.random() < 0.22 ? 'key' : 'gold';
          }

          const curRoadW = roadTopW + (roadBotW - roadTopW) * pk.z;
          const laneCenterX = w / 2 - curRoadW / 2 + ((pk.lane + 0.5) * curRoadW) / 3;
          const pkY = horizonY + (h - horizonY) * pk.z;
          const scale = 0.55 + pk.z * 0.65;

          ctx.save();
          ctx.translate(laneCenterX, pkY);
          ctx.scale(scale, scale);
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = pk.type === 'key' ? '#38bdf8' : '#fbbf24';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(pk.type === 'key' ? '🗝️' : '🪙', 0, 0);
          ctx.restore();
        });
      }

      // 4. Draw Monster / Dragon Boss at top-center of road
      const monsterX = w / 2 + Math.sin(Date.now() * 0.003) * (isDragonStage ? 28 : 16);
      const monsterY = Math.max(58, h * 0.33) + (rt.monsterHitAnim > 0 ? -8 : 0);
      if (rt.monsterHitAnim > 0) rt.monsterHitAnim = Math.max(0, rt.monsterHitAnim - 0.06);

      // Compute Monster HP ratio
      let monsterHpRatio = 1;
      if (round === 4) {
        monsterHpRatio = Math.max(0, 1 - (rt.round4MatchRatio || 0));
      } else if (round === 2 && activeQ?.word) {
        const len = Math.max(1, activeQ.word.length);
        monsterHpRatio = Math.max(0, (len - rt.typedProgress) / len);
      }

      ctx.save();
      ctx.translate(monsterX, monsterY);
      if (isDragonStage) {
        // Giant Ancient Dragon Boss
        const wingFlap = Math.sin(Date.now() * 0.01) * 14;
        ctx.fillStyle = '#9f1239';
        // Left & Right Dragon Wings
        ctx.beginPath();
        ctx.moveTo(-20, -5);
        ctx.lineTo(-82, -32 + wingFlap);
        ctx.lineTo(-64, 18 + wingFlap * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, -5);
        ctx.lineTo(82, -32 + wingFlap);
        ctx.lineTo(64, 18 + wingFlap * 0.5);
        ctx.closePath();
        ctx.fill();

        // Dragon Body & Scales
        ctx.fillStyle = rt.monsterHitAnim > 0 ? '#ffffff' : '#e11d48';
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();

        // Dragon Golden Horns
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-18, -26);
        ctx.lineTo(-32, -48);
        ctx.lineTo(-8, -32);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(18, -26);
        ctx.lineTo(32, -48);
        ctx.lineTo(8, -32);
        ctx.closePath();
        ctx.fill();

        // Dragon Glowing Eyes
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-11, -6, 5, 0, Math.PI * 2);
        ctx.arc(11, -6, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Slime / Goblin / Orc / Dark Mage
        const rSize = round === 1 ? 24 : 28;
        ctx.fillStyle = rt.monsterHitAnim > 0 ? '#ffffff' : (currentMonster?.color || '#10b981');
        ctx.beginPath();
        ctx.arc(0, 0, rSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Monster Eyes
        ctx.fillStyle = currentMonster?.eyeColor || '#0f172a';
        ctx.beginPath();
        ctx.arc(-8, -4, 4, 0, Math.PI * 2);
        ctx.arc(8, -4, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Monster Name & HP Bar
      const hpW = isDragonStage ? 150 : 104;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(-hpW / 2, -56, hpW, 8);
      ctx.fillStyle = isDragonStage ? '#f43f5e' : '#10b981';
      ctx.fillRect(-hpW / 2, -56, hpW * monsterHpRatio, 8);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(currentMonster?.name || 'Quái Vật', 0, -62);
      ctx.restore();

      // 5. Draw Knight / Female Hero on the Selected Lane (Bottom)
      const botLaneW = roadBotW * 0.78;
      const heroBaseX = w / 2 - botLaneW / 2 + ((rt.lane + 0.5) * botLaneW) / 3;
      const attackLungeY = rt.heroAttackAnim > 0 ? -36 * rt.heroAttackAnim : 0;
      const heroY = h - 48 + attackLungeY;
      if (rt.heroAttackAnim > 0) rt.heroAttackAnim = Math.max(0, rt.heroAttackAnim - 0.08);
      if (rt.knightHurtAnim > 0) rt.knightHurtAnim = Math.max(0, rt.knightHurtAnim - 0.07);

      // Dragon Fire Breath Counter-Attack / Final Smash Beam
      if (rt.dragonFireAnim > 0 || rt.finalSmashAnim > 0) {
        if (rt.dragonFireAnim > 0) rt.dragonFireAnim = Math.max(0, rt.dragonFireAnim - 0.05);
        ctx.save();
        const beamGrad = ctx.createLinearGradient(monsterX, monsterY, heroBaseX, heroY);
        beamGrad.addColorStop(0, '#fde047');
        beamGrad.addColorStop(0.5, '#f97316');
        beamGrad.addColorStop(1, '#e11d48');
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = rt.finalSmashAnim > 0 ? 44 : 18;
        ctx.beginPath();
        ctx.moveTo(monsterX, monsterY + 18);
        ctx.lineTo(heroBaseX, heroY);
        ctx.stroke();
        ctx.restore();
      }

      // Hero Sword Slash Wave toward Monster
      if (rt.heroAttackAnim > 0.15) {
        ctx.save();
        ctx.strokeStyle = activeSkin.slashColor || '#38bdf8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(heroBaseX, heroY - 16);
        ctx.lineTo(monsterX, monsterY + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(monsterX, monsterY, 36, -0.8, 0.8);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Hero Sprite (Cape, Hair/Headgear for Male/Female skins, Armor, Glowing Sword)
      ctx.save();
      ctx.translate(heroBaseX, heroY);

      // Cape
      ctx.fillStyle = activeSkin.capeColor || '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(14, -6);
      ctx.lineTo(20, 22);
      ctx.lineTo(-20, 22);
      ctx.closePath();
      ctx.fill();

      // Female Long Hair / Twin-tails / Ponytail behind head
      if (activeSkin.hairStyle === 'long_flowing') {
        ctx.fillStyle = activeSkin.hairColor || '#fde047';
        ctx.beginPath();
        ctx.ellipse(0, -10, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeSkin.hairStyle === 'twin_tails') {
        ctx.fillStyle = activeSkin.hairColor || '#c084fc';
        ctx.beginPath();
        ctx.ellipse(-16, -12, 6, 16, 0.35, 0, Math.PI * 2);
        ctx.ellipse(16, -12, 6, 16, -0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeSkin.hairStyle === 'high_ponytail') {
        ctx.fillStyle = activeSkin.hairColor || '#1e293b';
        ctx.beginPath();
        ctx.ellipse(12, -26, 7, 14, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Armor Body
      ctx.fillStyle = rt.knightHurtAnim > 0 ? '#ef4444' : (activeSkin.armorPrimary || '#3b82f6');
      ctx.beginPath();
      ctx.roundRect(-13, -8, 26, 24, 6);
      ctx.fill();
      ctx.strokeStyle = activeSkin.armorSecondary || '#93c5fd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Head
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, -18, 11, 0, Math.PI * 2);
      ctx.fill();

      // Headgear (Valkyrie wings, Dragon horns, Star tiara, Knight visor)
      if (activeSkin.headgear === 'valkyrie_wings') {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-11, -22);
        ctx.lineTo(-24, -32);
        ctx.lineTo(-10, -16);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(11, -22);
        ctx.lineTo(24, -32);
        ctx.lineTo(10, -16);
        ctx.fill();
      } else if (activeSkin.headgear === 'dragon_horns') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-8, -27);
        ctx.lineTo(-16, -40);
        ctx.lineTo(-3, -28);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -27);
        ctx.lineTo(16, -40);
        ctx.lineTo(3, -28);
        ctx.fill();
      } else {
        ctx.fillStyle = activeSkin.armorSecondary || '#93c5fd';
        ctx.fillRect(-10, -29, 20, 6);
      }

      // Glowing Sword in Right Hand
      ctx.save();
      ctx.translate(16, -4);
      ctx.rotate(rt.heroAttackAnim > 0 ? -0.9 : -0.25);
      ctx.fillStyle = activeSkin.bladeColor || '#38bdf8';
      ctx.fillRect(-2.5, -34, 5, 32);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-7, -4, 14, 4);
      ctx.restore();

      ctx.restore();

      // 6. Particles & Floating Loot Text
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
        ft.alpha -= 0.022;
        if (ft.alpha <= 0) {
          rt.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.xRatio * w, ft.yRatio * h);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [round, wordIdx, activeQ, activeSkin]);

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
      {/* Top Bar: Switch Game Mode + Gold / Revive Keys Inventory + Character Skin Shop */}
      <header className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 flex-wrap z-30">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onExitArena}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Thoát Đấu Trường
          </button>

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
            title="Chìa Khóa Hồi Sinh (Nhặt ngẫu nhiên trên đường hoặc đổi bằng Vàng để mua mạng khi thua giống Subway Surfers)"
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

      {/* HUB SCREEN: Stage Select, Hero Preview & Topic Selector */}
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
                  Chạy trên đường hầm 3 làn nhặt <b>🪙 Vàng</b> &amp; <b>🗝️ Chìa Khóa Hồi Sinh</b> (mua mạng khi thua giống Subway Surfers), tích vàng mở khóa <b>Nữ Chiến Binh Valkyrie, Nữ Kiếm Khách Sakura, Nữ Pháp Sư Selena</b> và chém hạ <b>Boss Cuối Rồng Hắc Ám</b> trước khi Rồng tung <b>Skill Tất Sát Kết Liễu (Final Smash)</b>!
                </p>
              </div>

              {/* Active Hero Card */}
              <div className="shrink-0 rounded-2xl border border-pink-500/40 bg-slate-950/80 p-3.5 flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border-2 shadow-md"
                  style={{
                    backgroundColor: activeSkin.armorPrimary,
                    borderColor: activeSkin.armorSecondary
                  }}
                >
                  {activeSkin.gender === 'Nữ' ? '👩‍🎤' : '⚔️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">{activeSkin.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold">
                      {activeSkin.genderBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300 font-bold mt-0.5">{activeSkin.weaponName}</p>
                  <p className="text-[11px] text-slate-400">{activeSkin.passiveText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold transition shrink-0"
                >
                  Đổi Skin
                </button>
              </div>
            </div>

            {/* Vocab Topic & Speed Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chọn Kho Từ Vựng Chiến Đấu ({bankItemsCount} từ)
                </label>
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
                <span>XUẤT CHinh ĐỦ 4 ẢI: SLIME ➔ GOBLIN ➔ ORC ➔ BOSS RỒNG HẮC ÁM</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {KNIGHT_MONSTER_STAGES.map(st => (
                  <button
                    key={st.round}
                    type="button"
                    data-testid={`start-knight-stage-${st.round}`}
                    onClick={() => startKnightCampaign(st.round, true)}
                    className={`p-3.5 rounded-2xl border text-left transition space-y-1 ${
                      st.round === 4
                        ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/50 text-rose-100'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-amber-400">{st.shortTitle}</span>
                      {st.round === 4 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                          FINAL BOSS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-200">{st.mechanicLabel}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{st.questionDesc}</p>
                  </button>
                ))}
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

          {/* 3-Lane Dungeon Canvas + Lane Switch Controls */}
          <div className="relative h-56 sm:h-64 w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950 shrink-0">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* 3-Lane Pick-up Switcher Pills at bottom-right of canvas */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-900/85 border border-slate-700 rounded-xl p-1 z-20">
              {['← Làn Trái', '↑ Làn Giữa', 'Làn Phải →'].map((lbl, lIdx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => handleSwitchLane(lIdx)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition ${
                    playerLane === lIdx
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {lbl}
                </button>
              ))}
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
                          onClick={() => handleSelectRuneChoice(cText, idx)}
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

      {/* SUBWAY SURFERS STYLE "SAVE ME / MUA MẠNG HỒI SINH BẰNG CHÌA KHÓA" MODAL */}
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
                Giống như Subway Surfers, bạn có thể dùng <b>🗝️ Chìa Khóa Hồi Sinh</b> nhặt được trên đường (hoặc dùng <b>🪙 Vàng</b>) để hồi đầy <b>3 ❤️</b> và chiến đấu tiếp ngay tại con quái này!
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
              Điểm trận này: <b className="text-amber-300 text-base">{score} điểm</b> • Nhặt được: <b className="text-amber-400">+{sessionGoldEarned} 🪙 Vàng</b> &amp; <b className="text-sky-300">+{sessionKeysEarned} 🗝️ Chìa Khóa</b>
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

      {/* CHARACTER SKIN SHOP MODAL (MALE & FEMALE HEROES + BUY REVIVE KEYS) */}
      {showShopModal && (
        <div
          data-testid="knight-skin-shop-modal"
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="max-w-3xl w-full rounded-3xl border border-pink-500/40 bg-slate-900 p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <span>Cửa Hàng Nhân Vật &amp; Skin Hiệp Sĩ (Nam / Nữ)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tích vàng từ đánh quái Slime, Goblin, Orc và Rồng để mở khóa Nữ Chiến Binh Valkyrie, Nữ Kiếm Khách Sakura, Nữ Pháp Sư Selena...
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

            {/* Character Skins Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border-2 shrink-0"
                        style={{
                          backgroundColor: skin.armorPrimary,
                          borderColor: skin.armorSecondary
                        }}
                      >
                        {skin.gender === 'Nữ' ? '👩‍🎤' : '⚔️'}
                      </div>
                      <div className="min-w-0 flex-1">
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
                        <p className="text-xs font-bold text-amber-300 mt-0.5">
                          🗡️ {skin.weaponName}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">{skin.passiveText}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyOrEquipSkin(skin)}
                      className={`w-full py-2 rounded-xl text-xs font-black transition ${
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
