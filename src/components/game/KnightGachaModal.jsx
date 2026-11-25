import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Coins,
  Crown,
  Gift,
  History,
  KeyRound,
  Lock,
  Music,
  QrCode,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Star,
  Swords,
  VolumeX,
  X
} from 'lucide-react';
import {
  formatVndCurrency,
  GACHA_WISH_10_PRICE_VND,
  GACHA_WISH_1_PRICE_VND,
  normalizePaymentConfig
} from '../../constants/profileCustomization';
import {
  canHeroEquipWeapon,
  getHeroCosmeticWeapon,
  getWeeklyLimitedBannerState,
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD,
  KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD,
  KNIGHT_GACHA_GOLD_SINGLE,
  KNIGHT_GACHA_GOLD_TEN,
  KNIGHT_GACHA_RATES,
  KNIGHT_GACHA_WEAPONS,
  REVIVE_KEY_GOLD_PRICE
} from '../../constants/knightRpgData';

// ==========================================
// WEB AUDIO SYNTHESIZER FOR GACHA SUSPENSE, CLIMAX, SILHOUETTE & STAR POP-IN
// ==========================================
let sharedGachaAudioCtx = null;
function getGachaAudioCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!sharedGachaAudioCtx || sharedGachaAudioCtx.state === 'closed') {
      sharedGachaAudioCtx = new AudioCtx();
    }
    if (sharedGachaAudioCtx.state === 'suspended') {
      sharedGachaAudioCtx.resume().catch(() => {});
    }
    return sharedGachaAudioCtx;
  } catch {
    return null;
  }
}

function scheduleTone(ctx, freq, startOffset, duration, type = 'sine', peakGain = 0.1, endFreq = null) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), now + startOffset);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + startOffset + duration);
    }
    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + Math.min(0.05, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.03);
  } catch {}
}

function playMeteorSuspenseBuildup() {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  // 3.0s neutral cosmic buildup — identical for 3★, 4★, 5★ so sound never spoils rarity early!
  scheduleTone(ctx, 165, 0.0, 2.95, 'sine', 0.06, 620);
  scheduleTone(ctx, 247.5, 0.2, 2.75, 'triangle', 0.04, 880);
  const pulseTimes = [0.1, 0.58, 1.0, 1.38, 1.72, 2.02, 2.28, 2.5, 2.7, 2.86];
  pulseTimes.forEach((t, idx) => {
    scheduleTone(ctx, 440 + idx * 42, t, 0.18, 'sine', 0.055);
  });
}

function playMeteorClimaxReveal(maxRarity = 3, allWhiff = false) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  if (maxRarity === 5) {
    // Dramatic 5★ Golden Transformation Explosion + Fanfare
    scheduleTone(ctx, 130.81, 0, 0.55, 'sawtooth', 0.09, 65.4);
    [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((f, idx) => {
      scheduleTone(ctx, f, idx * 0.075, 0.85, 'triangle', 0.13);
    });
    [523.25, 783.99, 1046.5, 1318.5].forEach(f => {
      scheduleTone(ctx, f, 0.48, 0.95, 'sine', 0.1);
    });
  } else if (maxRarity === 4) {
    // 4★ Amethyst Purple Shift Chord
    scheduleTone(ctx, 174.61, 0, 0.4, 'triangle', 0.08, 110);
    [440, 523.25, 659.25, 880, 1046.5].forEach((f, idx) => {
      scheduleTone(ctx, f, idx * 0.07, 0.65, 'triangle', 0.11);
    });
  } else if (allWhiff) {
    scheduleTone(ctx, 329.63, 0, 0.35, 'sawtooth', 0.05, 164.81);
  } else {
    [523.25, 659.25, 783.99].forEach((f, idx) => {
      scheduleTone(ctx, f, idx * 0.08, 0.45, 'sine', 0.085);
    });
  }
}

function playSilhouetteEnterSound() {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  scheduleTone(ctx, 220, 0, 0.48, 'sine', 0.06, 440);
}

function playItemUnveilSound(starRarity = 3, isWhiff = false) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  if (starRarity === 5) {
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((f, i) => {
      scheduleTone(ctx, f, i * 0.05, 0.7, 'triangle', 0.11);
    });
  } else if (starRarity === 4) {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      scheduleTone(ctx, f, i * 0.05, 0.5, 'triangle', 0.095);
    });
  } else if (isWhiff) {
    scheduleTone(ctx, 246.94, 0, 0.3, 'sine', 0.06, 185);
  } else {
    [523.25, 659.25].forEach((f, i) => {
      scheduleTone(ctx, f, i * 0.06, 0.35, 'sine', 0.08);
    });
  }
}

function playStarPopPing(starIdx = 0, totalStars = 3) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  const scale = [587.33, 659.25, 783.99, 987.77, 1318.51];
  const freq = scale[Math.min(scale.length - 1, starIdx)] || 783.99;
  const isFinalHighStar = starIdx === totalStars - 1 && totalStars >= 4;
  scheduleTone(ctx, freq, 0, isFinalHighStar ? 0.42 : 0.22, 'triangle', isFinalHighStar ? 0.12 : 0.085);
  if (isFinalHighStar) {
    scheduleTone(ctx, freq * 1.5, 0.03, 0.38, 'sine', 0.08);
  }
}

export default function KnightGachaModal({
  isOpen,
  isStrictAdmin = false,
  bgmMuted = false,
  onToggleBgm = null,
  knightGachaConfig = null,
  usersDb = {},
  currentUsername = '',
  rpgProfile,
  paymentConfig = null,
  onClose,
  onExecutePull,
  onAdminResetHeroes = null,
  onAdminGrantGachaWishes = null,
  onAdminSetGachaBannerConfig = null,
  onEquipSkin,
  onEquipHeroWeapon,
  onExchangeGoldForWishes,
  onBuyReviveKeyWithGold,
  onOpenWishQrCheckout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('character_event');
  const [cutscene, setCutscene] = useState(null);
  // Per-item silhouette → full-color unveil + sequential star pop-in states
  const [unveilStage, setUnveilStage] = useState('silhouette'); // 'silhouette' | 'lit'
  const [visibleStars, setVisibleStars] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [grantTargetQuery, setGrantTargetQuery] = useState('');
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantNote, setGrantNote] = useState('');

  const timersRef = useRef([]);

  const clearAllCutsceneTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllCutsceneTimers();
  }, []);

  // Refresh Monday 00:00 countdown every 30s while open
  useEffect(() => {
    if (!isOpen) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => {
      setNowTick(Date.now());
    }, 30_000);
    return () => clearInterval(iv);
  }, [isOpen]);

  const weeklyBanner = getWeeklyLimitedBannerState(nowTick, knightGachaConfig);

  // Trigger silhouette -> flash unveil -> star-by-star pop-in whenever entering 'reveal' phase or changing revealIdx!
  useEffect(() => {
    if (!cutscene || cutscene.phase !== 'reveal') return undefined;
    const item = cutscene.results[cutscene.revealIdx];
    if (!item) return undefined;

    const localTimers = [];
    setUnveilStage('silhouette');
    setVisibleStars(0);
    playSilhouetteEnterSound();

    const unveilTimer = setTimeout(() => {
      setUnveilStage('lit');
      playItemUnveilSound(item.starRarity, item.isWhiff);

      const starTotal = Math.max(1, Math.min(5, item.starRarity || 3));
      for (let s = 1; s <= starTotal; s += 1) {
        const st = setTimeout(() => {
          setVisibleStars(s);
          playStarPopPing(s - 1, starTotal);
        }, s * 135);
        localTimers.push(st);
      }
    }, 680);
    localTimers.push(unveilTimer);

    return () => {
      localTimers.forEach(t => clearTimeout(t));
    };
  }, [cutscene?.phase, cutscene?.revealIdx]);

  if (!isOpen) return null;

  const payCfg = normalizePaymentConfig(paymentConfig || {});
  const wish1VndPrice = payCfg.gachaWish1Price ?? GACHA_WISH_1_PRICE_VND;
  const wish10VndPrice = payCfg.gachaWish10Price ?? GACHA_WISH_10_PRICE_VND;

  const wishes = rpgProfile?.wishes || 0;
  const gold = rpgProfile?.gold || 0;
  const keys = rpgProfile?.keys || 0;
  const gachaState = rpgProfile?.gachaState || {};
  const unlockedSkins = Array.isArray(rpgProfile?.unlockedSkins) ? rpgProfile.unlockedSkins : ['knight_arthur'];
  const unlockedWeapons = Array.isArray(rpgProfile?.unlockedWeapons) ? rpgProfile.unlockedWeapons : [];
  const weaponCounts = rpgProfile?.weaponCounts || {};
  const wishHistory = Array.isArray(rpgProfile?.wishHistory) ? rpgProfile.wishHistory : [];

  const activeSkin =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === rpgProfile?.equippedSkin) ||
    KNIGHT_CHARACTER_SKINS[0];

  // Single weekly active Limited Banner (resets every Monday 00:00 VN — never >1 Limited Banner in a week!)
  const activeBannerMeta = weeklyBanner.activeBanner;
  const featured5Hero =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === activeBannerMeta.featuredHeroId) ||
    KNIGHT_CHARACTER_SKINS.find(s => s.pool === 'limited');
  const nextFeatured5Hero =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === weeklyBanner.nextBanner?.featuredHeroId) ||
    featured5Hero;
  const limited5Heroes = KNIGHT_CHARACTER_SKINS.filter(s => s.pool === 'limited');
  const featured4Heroes = KNIGHT_CHARACTER_SKINS.filter(s =>
    activeBannerMeta.featured4StarIds.includes(s.id)
  );
  const standard5Heroes = KNIGHT_CHARACTER_SKINS.filter(
    s => s.obtainMethod === 'gacha' && s.pool === 'standard' && s.starRarity === 5
  );

  const startGachaPull = (bannerType, count) => {
    const res = onExecutePull?.({
      bannerType,
      count
    });
    if (!res || !res.ok) return;

    clearAllCutsceneTimers();
    playMeteorSuspenseBuildup();

    // Stage 1 (0.0s -> 3.0s): NEUTRAL MYSTERY METEOR — Never reveals Gold/Purple early!
    setCutscene({
      phase: 'meteor_suspense',
      results: res.results,
      maxRarity: res.maxRarity,
      allWhiff: res.allWhiff,
      revealIdx: 0
    });

    // Stage 2 (at 3.0s -> 4.3s): DRAMATIC COLOR SHIFT TO GOLD (5★) OR PURPLE (4★) OR BLUE (3★)!
    const tClimax = setTimeout(() => {
      playMeteorClimaxReveal(res.maxRarity, res.allWhiff);
      setCutscene(prev =>
        prev && prev.phase === 'meteor_suspense'
          ? { ...prev, phase: 'meteor_climax' }
          : prev
      );
    }, 3000);

    // Stage 3 (at 4.3s): Enter Silhouette -> Full-Color Unveil + Sequential Star Pop-in!
    const tReveal = setTimeout(() => {
      setCutscene(prev =>
        prev && (prev.phase === 'meteor_suspense' || prev.phase === 'meteor_climax')
          ? { ...prev, phase: 'reveal', revealIdx: 0 }
          : prev
      );
    }, 4300);

    timersRef.current.push(tClimax, tReveal);
  };

  const skipCutsceneToSummary = () => {
    clearAllCutsceneTimers();
    setCutscene(prev => (prev ? { ...prev, phase: 'summary' } : null));
  };

  const handleRevealCardClick = () => {
    if (!cutscene || cutscene.phase !== 'reveal') return;
    const currentItem = cutscene.results[cutscene.revealIdx];
    const maxStars = currentItem?.starRarity || 3;

    // If still in black silhouette or stars still popping in, instant-reveal current card first!
    if (unveilStage === 'silhouette' || visibleStars < maxStars) {
      setUnveilStage('lit');
      setVisibleStars(maxStars);
      playItemUnveilSound(maxStars, currentItem?.isWhiff);
      return;
    }

    if (cutscene.revealIdx + 1 < cutscene.results.length) {
      setCutscene(prev => (prev ? { ...prev, revealIdx: prev.revealIdx + 1 } : null));
    } else {
      setCutscene(prev => (prev ? { ...prev, phase: 'summary' } : null));
    }
  };

  const getCostLabel = (count) => {
    if (isStrictAdmin) {
      return 'Miễn phí (Admin Test)';
    }
    if (wishes >= count) {
      return `${count} Lượt Quay`;
    }
    if (wishes > 0) {
      const remGold = (count - wishes) * KNIGHT_GACHA_GOLD_SINGLE;
      return `${wishes} Lượt + ${remGold.toLocaleString('vi-VN')} Vàng`;
    }
    const totalGold = count === 10 ? KNIGHT_GACHA_GOLD_TEN : KNIGHT_GACHA_GOLD_SINGLE;
    return `${totalGold.toLocaleString('vi-VN')} Vàng`;
  };

  const canAffordPull = (count) => {
    if (isStrictAdmin) return true;
    const rem = Math.max(0, count - wishes);
    return gold >= rem * KNIGHT_GACHA_GOLD_SINGLE;
  };

  const isSuspensePhase = cutscene?.phase === 'meteor_suspense';
  const isClimaxPhase = cutscene?.phase === 'meteor_climax';

  return (
    <div
      data-testid="knight-skin-shop-modal"
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[85] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      {/* =========================================================
          SUSPENSEFUL METEOR (3s NEUTRAL -> CLIMAX SHIFT) + SILHOUETTE UNVEIL + STAR POP-IN
      ========================================================= */}
      {cutscene && (
        <div
          data-testid="knight-gacha-cutscene"
          data-rarity={isSuspensePhase ? 'neutral' : String(cutscene.maxRarity)}
          data-target-rarity={String(cutscene.maxRarity)}
          data-phase={cutscene.phase}
          className={`fixed inset-0 z-[140] flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto select-none transition-colors duration-500 ${
            isSuspensePhase
              ? 'bg-gradient-to-br from-[#040714] via-[#0b132b] to-[#050816]'
              : cutscene.maxRarity === 5
              ? 'bg-gradient-to-br from-[#291500] via-[#5c2404] to-[#090d16]'
              : cutscene.maxRarity === 4
              ? 'bg-gradient-to-br from-[#240a42] via-[#4a097a] to-[#090d16]'
              : cutscene.allWhiff
              ? 'bg-gradient-to-br from-[#090d16] via-[#1e293b] to-[#020617]'
              : 'bg-gradient-to-br from-[#04162d] via-[#0c4a6e] to-[#090d16]'
          }`}
        >
          <style>{`
            @keyframes gachaSpinCw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes gachaSpinCcw {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            @keyframes gachaSpeedStreak {
              0% { transform: translate(-55vw, -45vh) rotate(32deg); opacity: 0; }
              25% { opacity: 0.75; }
              100% { transform: translate(55vw, 45vh) rotate(32deg); opacity: 0; }
            }
            @keyframes gachaSuspenseComet {
              0% { transform: translate(-44vw, -36vh) scale(0.42) rotate(32deg); opacity: 0.25; }
              30% { opacity: 1; }
              100% { transform: translate(2vw, 2vh) scale(1.08) rotate(32deg); opacity: 1; }
            }
            @keyframes gachaClimaxComet {
              0% { transform: translate(2vw, 2vh) scale(1.15) rotate(32deg); opacity: 1; }
              65% { transform: translate(14vw, 11vh) scale(1.85) rotate(32deg); opacity: 1; }
              100% { transform: translate(28vw, 22vh) scale(2.9) rotate(32deg); opacity: 0; }
            }
            @keyframes gachaClimaxFlash {
              0% { opacity: 0.95; }
              100% { opacity: 0; }
            }
            @keyframes gachaShockwave {
              0% { transform: scale(0.15); opacity: 1; }
              100% { transform: scale(3.2); opacity: 0; }
            }
            @keyframes gachaCameraShake {
              0%, 100% { transform: translate(0, 0); }
              20% { transform: translate(-8px, 6px); }
              40% { transform: translate(8px, -6px); }
              60% { transform: translate(-5px, -4px); }
              80% { transform: translate(5px, 4px); }
            }
            @keyframes gachaSilhouetteZoom {
              0% { transform: scale(1.26); opacity: 0.2; }
              100% { transform: scale(1.0); opacity: 1; }
            }
            @keyframes gachaUnveilBurst {
              0% { transform: scale(0.86); filter: brightness(2.8); }
              55% { transform: scale(1.06); filter: brightness(1.25); }
              100% { transform: scale(1.0); filter: brightness(1); }
            }
            @keyframes gachaStarPop {
              0% { transform: scale(0) rotate(-45deg); opacity: 0; }
              65% { transform: scale(1.48) rotate(10deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes gachaCardRise {
              0% { transform: translateY(22px) scale(0.94); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>

          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between z-20">
            <span
              data-testid="gacha-cutscene-status-pill"
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border shadow-lg transition-all duration-300 ${
                isSuspensePhase
                  ? 'bg-slate-800/80 border-sky-300/40 text-sky-100'
                  : cutscene.maxRarity === 5
                  ? 'bg-amber-400/25 border-amber-300 text-amber-200 scale-105'
                  : cutscene.maxRarity === 4
                  ? 'bg-fuchsia-500/25 border-fuchsia-300 text-fuchsia-200 scale-105'
                  : cutscene.allWhiff
                  ? 'bg-slate-700/60 border-slate-400 text-slate-200'
                  : 'bg-sky-500/20 border-sky-300 text-sky-200'
              }`}
            >
              {isSuspensePhase
                ? '☄️ Đang triệu hồi sao băng...'
                : cutscene.maxRarity === 5
                ? '⭐⭐⭐⭐⭐ RA VÀNG 5 SAO!'
                : cutscene.maxRarity === 4
                ? '⭐⭐⭐⭐ VẬT PHẨM 4 SAO!'
                : cutscene.allWhiff
                ? '💨 TẠCH GACHA!'
                : '⭐⭐⭐ VŨ KHÍ 3 SAO'}
            </span>

            {cutscene.phase !== 'summary' ? (
              <button
                type="button"
                data-testid="gacha-skip-cutscene-btn"
                onClick={skipCutsceneToSummary}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-black backdrop-blur-sm transition"
              >
                Bỏ qua ⏭
              </button>
            ) : (
              <button
                type="button"
                data-testid="gacha-close-results-btn"
                onClick={() => setCutscene(null)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg transition"
              >
                Đóng ✕
              </button>
            )}
          </div>

          {/* METEOR PHASES: 0-3s NEUTRAL SUSPENSE -> 3.0s+ DRAMATIC COLOR SHIFT */}
          {(isSuspensePhase || isClimaxPhase) && (
            <div
              style={
                isClimaxPhase && cutscene.maxRarity >= 4
                  ? { animation: 'gachaCameraShake 0.48s ease-out' }
                  : undefined
              }
              className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden"
            >
              {/* Full-screen Flashbang right at the 3.0s color shift moment */}
              {isClimaxPhase && (
                <div
                  style={{ animation: 'gachaClimaxFlash 0.65s ease-out forwards' }}
                  className={`fixed inset-0 pointer-events-none z-30 ${
                    cutscene.maxRarity === 5
                      ? 'bg-amber-200'
                      : cutscene.maxRarity === 4
                      ? 'bg-fuchsia-300'
                      : 'bg-sky-200/70'
                  }`}
                />
              )}

              {/* Rotating Astral Gate Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  style={{ animation: 'gachaSpinCw 9s linear infinite' }}
                  className={`w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed transition-colors duration-300 ${
                    isSuspensePhase
                      ? 'border-sky-300/25'
                      : cutscene.maxRarity === 5
                      ? 'border-amber-300/70 shadow-[0_0_80px_rgba(251,191,36,0.45)]'
                      : cutscene.maxRarity === 4
                      ? 'border-fuchsia-400/70 shadow-[0_0_70px_rgba(192,132,252,0.4)]'
                      : 'border-sky-400/40'
                  }`}
                />
                <div
                  style={{ animation: 'gachaSpinCcw 6s linear infinite' }}
                  className={`absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border transition-colors duration-300 ${
                    isSuspensePhase
                      ? 'border-indigo-300/20'
                      : cutscene.maxRarity === 5
                      ? 'border-yellow-200/80'
                      : cutscene.maxRarity === 4
                      ? 'border-purple-300/75'
                      : 'border-cyan-300/35'
                  }`}
                />
              </div>

              {/* Diagonal Hyperspace Speed-Lines */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 18 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      top: `${(idx * 19) % 95}%`,
                      left: `${(idx * 23) % 90}%`,
                      animation: `gachaSpeedStreak ${0.75 + (idx % 4) * 0.22}s linear infinite`,
                      animationDelay: `${(idx % 6) * 0.12}s`
                    }}
                    className={`absolute w-28 sm:w-44 h-[2px] rounded-full ${
                      isSuspensePhase
                        ? 'bg-gradient-to-r from-transparent via-sky-200/50 to-transparent'
                        : cutscene.maxRarity === 5
                        ? 'bg-gradient-to-r from-transparent via-amber-300 to-transparent'
                        : cutscene.maxRarity === 4
                        ? 'bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Shooting Star Comet (Neutral Silver-Blue in 0-3s -> Transforms at 3.0s!) */}
              <div
                style={{
                  animation: isSuspensePhase
                    ? 'gachaSuspenseComet 3s cubic-bezier(0.25, 0.8, 0.4, 1) forwards'
                    : 'gachaClimaxComet 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}
                className="relative flex items-center z-10"
              >
                <div
                  className={`w-64 sm:w-[420px] h-3.5 sm:h-5 rounded-full blur-[1.5px] transition-all duration-300 ${
                    isSuspensePhase
                      ? 'bg-gradient-to-r from-transparent via-sky-200 to-white shadow-[0_0_30px_rgba(186,230,253,0.8)]'
                      : cutscene.maxRarity === 5
                      ? 'bg-gradient-to-r from-transparent via-amber-400 to-yellow-100 shadow-[0_0_65px_#fbbf24]'
                      : cutscene.maxRarity === 4
                      ? 'bg-gradient-to-r from-transparent via-fuchsia-500 to-purple-100 shadow-[0_0_55px_#c084fc]'
                      : cutscene.allWhiff
                      ? 'bg-gradient-to-r from-transparent via-slate-500 to-slate-300'
                      : 'bg-gradient-to-r from-transparent via-sky-400 to-cyan-100 shadow-[0_0_40px_#38bdf8]'
                  }`}
                />
                <div
                  className={`w-12 h-12 sm:w-18 sm:h-18 -ml-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSuspensePhase
                      ? 'bg-white shadow-[0_0_55px_16px_rgba(186,230,253,0.85)] ring-4 ring-sky-100'
                      : cutscene.maxRarity === 5
                      ? 'bg-amber-200 shadow-[0_0_110px_36px_rgba(251,191,36,1)] ring-4 ring-yellow-50 scale-125'
                      : cutscene.maxRarity === 4
                      ? 'bg-fuchsia-200 shadow-[0_0_95px_28px_rgba(192,132,252,0.95)] ring-4 ring-purple-50 scale-115'
                      : cutscene.allWhiff
                      ? 'bg-slate-400 shadow-[0_0_30px_8px_rgba(148,163,184,0.6)]'
                      : 'bg-cyan-100 shadow-[0_0_65px_20px_rgba(56,189,248,0.9)] ring-4 ring-sky-100'
                  }`}
                >
                  <Sparkles
                    className={`w-7 h-7 ${
                      isSuspensePhase
                        ? 'text-sky-700 animate-spin'
                        : cutscene.maxRarity === 5
                        ? 'text-amber-700'
                        : cutscene.maxRarity === 4
                        ? 'text-purple-800'
                        : 'text-sky-800'
                    }`}
                  />
                </div>
              </div>

              {/* Expanding Shockwaves at 3.0s Climax */}
              {isClimaxPhase && (
                <>
                  <div
                    style={{ animation: 'gachaShockwave 1.15s ease-out forwards' }}
                    className={`absolute w-56 h-56 rounded-full border-4 pointer-events-none ${
                      cutscene.maxRarity === 5
                        ? 'border-amber-300 bg-amber-400/25 shadow-[0_0_120px_#fbbf24]'
                        : cutscene.maxRarity === 4
                        ? 'border-fuchsia-300 bg-purple-500/25 shadow-[0_0_100px_#c084fc]'
                        : 'border-sky-300 bg-sky-400/20'
                    }`}
                  />
                  {cutscene.maxRarity >= 4 && (
                    <div
                      style={{ animation: 'gachaShockwave 1.15s ease-out 0.18s forwards' }}
                      className={`absolute w-40 h-40 rounded-full border-2 pointer-events-none ${
                        cutscene.maxRarity === 5 ? 'border-yellow-100' : 'border-purple-200'
                      }`}
                    />
                  )}
                </>
              )}

              <p className="mt-20 text-xs sm:text-sm font-extrabold text-white/85 tracking-wider z-10">
                {isSuspensePhase
                  ? 'Sao băng đang lao xuống...'
                  : cutscene.maxRarity === 5
                  ? '✨ Sao băng hóa Kim Quang 5★!'
                  : cutscene.maxRarity === 4
                  ? '🔮 Sao băng hóa Ánh Tím 4★!'
                  : cutscene.allWhiff
                  ? '💨 Sao băng vụt tắt...'
                  : '☄️ Kết tinh vũ khí 3★!'}
              </p>
            </div>
          )}

          {/* SILHOUETTE BLACKOUT -> FLASH UNVEIL + SEQUENTIAL STAR POP-IN (RUNS FOR BOTH 1x & 10x!) */}
          {cutscene.phase === 'reveal' && cutscene.results[cutscene.revealIdx] && (() => {
            const item = cutscene.results[cutscene.revealIdx];
            const isSilhouette = unveilStage === 'silhouette';
            const totalItemStars = Math.max(1, Math.min(5, item.starRarity || 3));

            return (
              <div
                data-testid="knight-gacha-single-reveal"
                data-unveil={unveilStage}
                onClick={handleRevealCardClick}
                className="flex-1 w-full max-w-xl flex flex-col items-center justify-center text-center gap-4 cursor-pointer py-4 relative"
              >
                <div
                  className={`relative p-6 sm:p-8 rounded-3xl border-2 w-full shadow-2xl overflow-hidden transition-all duration-500 ${
                    isSilhouette
                      ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-black border-white/25 shadow-[0_0_55px_rgba(255,255,255,0.18)]'
                      : item.starRarity === 5
                      ? 'bg-gradient-to-b from-amber-500/30 via-amber-950/85 to-slate-950 border-amber-300 shadow-[0_0_80px_rgba(251,191,36,0.55)]'
                      : item.starRarity === 4
                      ? 'bg-gradient-to-b from-purple-500/30 via-purple-950/85 to-slate-950 border-fuchsia-400 shadow-[0_0_65px_rgba(192,132,252,0.5)]'
                      : item.isWhiff
                      ? 'bg-gradient-to-b from-slate-800/80 to-slate-950 border-slate-500'
                      : 'bg-gradient-to-b from-sky-500/20 via-slate-900 to-slate-950 border-sky-400 shadow-[0_0_45px_rgba(56,189,248,0.35)]'
                  }`}
                >
                  {/* Rotating Radiant God-Rays behind revealed Hero/Weapon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div
                      style={{ animation: 'gachaSpinCw 14s linear infinite' }}
                      className={`w-80 h-80 rounded-full border-4 border-dashed ${
                        isSilhouette
                          ? 'border-white/20'
                          : item.starRarity === 5
                          ? 'border-amber-300/60'
                          : item.starRarity === 4
                          ? 'border-fuchsia-400/55'
                          : 'border-sky-300/40'
                      }`}
                    />
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black text-white/75">
                      Lượt {cutscene.revealIdx + 1} / {cutscene.results.length}
                    </span>
                    {!isSilhouette && (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {item.isNew && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">
                            MỚI!
                          </span>
                        )}
                        {item.isRefundedHero && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[11px] font-black">
                            +{(item.refundGoldAmount || 0).toLocaleString('vi-VN')} Vàng
                          </span>
                        )}
                        {item.isWhiff && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black">
                            TẠCH
                          </span>
                        )}
                        {item.rateOutcome === 'lost_50_50' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-black">
                            Lệch 50/50 (Kế tiếp 100% Giới Hạn)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Artwork Container: Black Silhouette -> Bright Flash Unveil! */}
                  <div className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-3xl flex items-center justify-center p-2.5 bg-black/45 border border-white/15 shadow-inner">
                    <img
                      src={item.spriteUrl}
                      alt={isSilhouette ? '???' : item.name}
                      style={{
                        animation: isSilhouette
                          ? 'gachaSilhouetteZoom 0.65s ease-out forwards'
                          : 'gachaUnveilBurst 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        filter: isSilhouette
                          ? 'brightness(0) contrast(220%) drop-shadow(0 0 18px rgba(255,255,255,0.65))'
                          : 'brightness(1) contrast(100%) drop-shadow(0 12px 22px rgba(0,0,0,0.85))'
                      }}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>

                  {/* Sequential Star Pop-in Row */}
                  <div
                    data-testid="gacha-reveal-stars-row"
                    className="relative z-10 mt-4 h-9 flex items-center justify-center gap-1.5"
                  >
                    {!isSilhouette &&
                      Array.from({ length: totalItemStars }).map((_, sIdx) => {
                        const shown = sIdx < visibleStars;
                        if (!shown) {
                          return <span key={sIdx} className="w-6 h-6 inline-block opacity-0" />;
                        }
                        return (
                          <span
                            key={sIdx}
                            data-testid="gacha-popped-star"
                            style={{ animation: 'gachaStarPop 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                            className={`inline-flex items-center justify-center text-2xl sm:text-3xl font-black drop-shadow-[0_0_12px_currentColor] ${
                              item.starRarity === 5
                                ? 'text-amber-300'
                                : item.starRarity === 4
                                ? 'text-fuchsia-300'
                                : item.isWhiff
                                ? 'text-slate-400'
                                : 'text-sky-300'
                            }`}
                          >
                            ★
                          </span>
                        );
                      })}
                  </div>

                  <h3 className="relative z-10 text-lg sm:text-2xl font-black text-white mt-1">
                    {isSilhouette ? '???' : item.name}
                  </h3>

                  {!isSilhouette && (
                    <>
                      <p className="relative z-10 text-xs font-bold text-amber-200/90 mt-1">
                        {item.itemKind === 'character'
                          ? `${item.rarityLabel} • ${item.weaponClassLabel || ''}`
                          : item.isWhiff
                          ? 'Không trúng vật phẩm'
                          : `${item.rarityLabel} • ${item.weaponClassLabel || 'Trang trí'}`}
                      </p>
                      <p className="relative z-10 text-xs text-slate-300 mt-1.5 max-w-md mx-auto">
                        {item.passiveText}
                      </p>
                      {item.bonusText && (
                        <p className="relative z-10 mt-2.5 inline-block px-3.5 py-1 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-extrabold">
                          {item.bonusText}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <p className="text-xs font-bold text-white/80">
                  {isSilhouette
                    ? 'Đang hé lộ nhân vật / vật phẩm...'
                    : cutscene.revealIdx + 1 < cutscene.results.length
                    ? `Chạm để mở tiếp (${cutscene.revealIdx + 1}/${cutscene.results.length}) ▸`
                    : 'Chạm để xem tổng kết ▸'}
                </p>
              </div>
            );
          })()}

          {/* SUMMARY GRID */}
          {cutscene.phase === 'summary' && (
            <div
              data-testid="knight-gacha-results-view"
              className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center gap-5 py-4"
            >
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Kết Quả Quay ({cutscene.results.length} Lượt)
              </h3>

              <div
                className={`grid gap-3 w-full ${
                  cutscene.results.length === 1
                    ? 'grid-cols-1 max-w-md mx-auto'
                    : 'grid-cols-2 sm:grid-cols-5'
                }`}
              >
                {cutscene.results.map((item, idx) => (
                  <div
                    key={item.pullId}
                    data-testid={`gacha-result-card-${item.starRarity}`}
                    style={{
                      animation: `gachaCardRise 0.35s ease-out ${idx * 0.05}s both`
                    }}
                    className={`rounded-2xl border-2 p-3 flex flex-col items-center text-center justify-between gap-2 relative overflow-hidden transition ${
                      item.starRarity === 5
                        ? 'bg-gradient-to-b from-amber-400/30 via-amber-950/85 to-slate-950 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.45)]'
                        : item.starRarity === 4
                        ? 'bg-gradient-to-b from-fuchsia-500/25 via-purple-950/85 to-slate-950 border-fuchsia-400 shadow-[0_0_25px_rgba(192,132,252,0.35)]'
                        : item.isWhiff
                        ? 'bg-gradient-to-b from-slate-800/90 to-slate-950 border-slate-600 opacity-90'
                        : 'bg-gradient-to-b from-sky-500/20 via-slate-900/90 to-slate-950 border-sky-400/70'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1">
                      <span
                        className={`text-[11px] font-black ${
                          item.starRarity === 5
                            ? 'text-amber-300'
                            : item.starRarity === 4
                            ? 'text-fuchsia-300'
                            : item.isWhiff
                            ? 'text-slate-400'
                            : 'text-sky-300'
                        }`}
                      >
                        {'★'.repeat(item.starRarity)}
                      </span>
                      {item.isNew ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[9px] font-black">
                          MỚI
                        </span>
                      ) : item.isRefundedHero ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-300 text-slate-950 text-[9px] font-black">
                          +{item.refundGoldAmount === 10000 ? '10K' : '200K'} VÀNG
                        </span>
                      ) : item.isWhiff ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black">
                          TẠCH
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/80 text-[9px] font-bold">
                          {item.itemKind === 'character' ? 'Nhân Vật' : 'Vũ Khí'}
                        </span>
                      )}
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/35 border border-white/10 p-1.5 flex items-center justify-center">
                      <img src={item.spriteUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-white line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-amber-200/90 line-clamp-2">
                        {item.bonusText || item.passiveText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    startGachaPull(
                      activeTab === 'standard' ? 'standard' : 'character_event',
                      cutscene.results.length === 10 ? 10 : 1
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-black transition"
                >
                  Quay Tiếp x{cutscene.results.length}
                </button>
                <button
                  type="button"
                  onClick={() => setCutscene(null)}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg transition"
                >
                  Xác Nhận
                </button>
              </div>
            </div>
          )}

          <div className="text-[11px] text-white/60 text-center">
            Hoàn trùng nhân vật: 5★ +200.000 Vàng • 4★ +10.000 Vàng • Vũ khí dùng trang trí theo Hệ
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN MODAL CONTAINER
      ========================================================= */}
      <div className="max-w-5xl w-full rounded-3xl border border-amber-300/70 dark:border-amber-400/35 bg-white dark:bg-[#0B1020] text-[#0F172B] dark:text-white p-4 sm:p-6 space-y-4 max-h-[93vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 flex-wrap text-[#0F172B] dark:text-white">
              <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>Vòng Quay Gacha &amp; Tủ Đồ</span>
              {isStrictAdmin && (
                <span
                  data-testid="admin-gacha-free-badge"
                  className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-600 dark:text-rose-300 text-[11px] font-black"
                >
                  Admin: Quay Test Vô Hạn
                </span>
              )}
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
              <span>10.000 Vàng / 1 lượt • Trùng nhân vật 5★ hoàn 200.000 Vàng, trùng nhân vật 4★ hoàn 10.000 Vàng • {KNIGHT_CHARACTER_SKINS.length} Nhân Vật Meme &amp; Hiệp Sĩ.</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 text-xs font-black">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{gold.toLocaleString('vi-VN')} Vàng</span>
            </div>

            <div
              data-testid="gacha-wishes-count"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-500/20 border border-fuchsia-300 dark:border-fuchsia-400/50 text-fuchsia-800 dark:text-fuchsia-200 text-xs font-black"
            >
              <span>🌠 {wishes} Lượt</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-400/40 text-sky-800 dark:text-sky-300 text-xs font-black">
              <KeyRound className="w-3.5 h-3.5 text-sky-500" />
              <span>{keys} Chìa</span>
            </div>

            {onToggleBgm && (
              <button
                type="button"
                data-testid="gacha-modal-bgm-btn"
                onClick={onToggleBgm}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition ${
                  bgmMuted
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    : 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-400/50 text-indigo-700 dark:text-indigo-200'
                }`}
                title="Bật / Tắt nhạc nền riêng của sảnh Cầu Nguyện Gacha"
              >
                {bgmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                <span>{bgmMuted ? 'Nhạc: Tắt' : 'Nhạc: Cầu Nguyện Sao Băng'}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="buy-revive-key-with-gold-btn"
              onClick={onBuyReviveKeyWithGold}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition"
              title="Đổi Vàng lấy Chìa Khóa Hồi Sinh"
            >
              +1 🗝️ ({REVIVE_KEY_GOLD_PRICE} Vàng)
            </button>

            {isStrictAdmin && onAdminResetHeroes && (
              <button
                type="button"
                data-testid="admin-reset-gacha-heroes-btn"
                onClick={onAdminResetHeroes}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-700 dark:text-rose-200 text-xs font-bold inline-flex items-center gap-1 transition"
                title="Reset tủ đồ Gacha về mặc định để test"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Test</span>
              </button>
            )}

            <button
              type="button"
              data-testid="close-knight-gacha-modal-btn"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-200 inline-flex items-center gap-1"
            >
              <span>Đóng</span> <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`grid grid-cols-2 ${isStrictAdmin ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2`}>
          <button
            type="button"
            data-testid="gacha-tab-character"
            onClick={() => setActiveTab('character_event')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'character_event'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-amber-300 shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Banner Giới Hạn (Thứ 2)</span>
          </button>

          <button
            type="button"
            data-testid="gacha-tab-standard"
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'standard'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-cyan-300 shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Banner Thường</span>
          </button>

          <button
            type="button"
            data-testid="gacha-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-pink-600 to-violet-600 text-white border-pink-300 shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Tủ Đồ ({unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})</span>
          </button>

          <button
            type="button"
            data-testid="gacha-tab-shop"
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-[#334155] dark:text-slate-300'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mua Lượt Quay</span>
          </button>

          {isStrictAdmin && (
            <button
              type="button"
              data-testid="gacha-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white border-rose-300 shadow-md'
                  : 'bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Quản Trị (Admin)</span>
            </button>
          )}
        </div>

        {/* =========================================================
            TAB 1: WEEKLY SINGLE LIMITED BANNER (ONLY 1 PER 7 DAYS!)
        ========================================================= */}
        {activeTab === 'character_event' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                data-testid="weekly-limited-banner-timer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-black"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset 00:00 Thứ 2 (còn {weeklyBanner.countdownText}) • 1 Banner Giới Hạn / tuần</span>
              </div>

              <button
                type="button"
                data-testid="quick-open-wish-shop-btn"
                onClick={() => setActiveTab('shop')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-sm"
              >
                + Mua Lượt Quay (5k = 1 lượt • 50k = 10 lượt)
              </button>
            </div>

            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-400/70 bg-gradient-to-br from-[#2a1205] via-[#1c1033] to-[#090d16] text-white p-5 sm:p-7 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs font-black">
                    BANNER NHÂN VẬT GIỚI HẠN TUẦN NÀY
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-amber-200 leading-tight">
                    {featured5Hero.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Khi nổ 5★ có <b>50%</b> ra nhân vật giới hạn <b>{featured5Hero.name}</b> và <b>50%</b> ra nhân vật 5★ Banner Thường (nếu lệch, lần 5★ sau chắc chắn trúng Giới Hạn).
                  </p>

                  <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-400/40 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-amber-300 font-black text-sm">⭐⭐⭐⭐⭐ {featured5Hero.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-amber-200 text-[10px] font-black">
                        {featured5Hero.weaponClassLabel}
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-bold">🗡️ {featured5Hero.weaponName}</p>
                    {featured5Hero.memeQuote && (
                      <p className="text-xs italic text-amber-200/95">{featured5Hero.memeQuote}</p>
                    )}
                    <p className="text-xs text-slate-300">{featured5Hero.passiveText}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {featured4Heroes.map(h4 => (
                      <div
                        key={h4.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/80 border border-fuchsia-400/50 text-xs font-bold text-fuchsia-100"
                      >
                        <img src={h4.spriteUrl} alt={h4.name} className="w-6 h-6 object-contain" />
                        <span>4★ {h4.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-400/25 via-rose-500/15 to-black/70 p-3 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.35)] relative">
                    <img
                      src={featured5Hero.spriteUrl}
                      alt={featured5Hero.name}
                      className="w-full h-full object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.9)]"
                    />
                    <span className="absolute bottom-2.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow">
                      {unlockedSkins.includes(featured5Hero.id) ? 'ĐÃ SỞ HỮU' : 'GIỚI HẠN TUẦN'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-amber-200">
                      5★: {gachaState.charPity5 || 0} / {KNIGHT_GACHA_RATES.hardPity5}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-fuchsia-200">
                      4★: {gachaState.charPity4 || 0} / {KNIGHT_GACHA_RATES.hardPity4}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black ${
                        gachaState.charGuaranteed5
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                      }`}
                    >
                      {gachaState.charGuaranteed5 ? 'Bảo hiểm 100% Giới Hạn' : 'Tỉ lệ 50/50'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    5★: 0.6% • 4★: 5.1% • Trùng 5★ hoàn 200k Vàng • Trùng 4★ hoàn 10k Vàng
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    data-testid="gacha-pull-1-btn"
                    onClick={() => startGachaPull('character_event', 1)}
                    className={`px-4 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-lg ${
                      canAffordPull(1)
                        ? 'bg-[#fffbeb] hover:bg-amber-100 text-slate-950 border-amber-300'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <div>Quay x1</div>
                    <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-600">
                      {getCostLabel(1)}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="gacha-pull-10-btn"
                    onClick={() => startGachaPull('character_event', 10)}
                    className={`px-5 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-xl ${
                      canAffordPull(10)
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 text-slate-950 border-yellow-100'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <div>Quay x10 (Chắc chắn ≥ 4★)</div>
                    <div className="text-[11px] font-extrabold text-slate-900">
                      {getCostLabel(10)}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: STANDARD BANNER (ONLY STANDARD 5★/4★ HEROES — NEVER LIMITED!)
        ========================================================= */}
        {activeTab === 'standard' && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-400/60 bg-gradient-to-br from-[#0c1938] via-[#1e1b4b] to-[#090d16] text-white p-5 sm:p-7 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-300/60 text-cyan-200 text-xs font-black">
                    BANNER THƯỜNG
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-cyan-200 leading-tight">
                    Vòng Quay Thường (Nhân Vật Thường &amp; Vũ Khí)
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Chỉ gồm các nhân vật 5★/4★ Thường và vũ khí 4★/3★ (không ra nhân vật Giới Hạn). Có tỉ lệ tạch Gacha ở bậc 3★ (hoàn 250 Vàng).
                  </p>

                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-cyan-200">Nhân vật 5★ trong Banner Thường:</p>
                    <div className="flex flex-wrap gap-2">
                      {standard5Heroes.map(h => (
                        <span
                          key={h.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-cyan-300/40 text-xs font-bold text-amber-200"
                        >
                          <img src={h.spriteUrl} alt={h.name} className="w-5 h-5 object-contain" />
                          <span>5★ {h.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 grid grid-cols-2 gap-2.5">
                  {KNIGHT_GACHA_WEAPONS.slice(0, 4).map(wp => (
                    <div
                      key={wp.id}
                      className="rounded-2xl bg-black/45 border border-fuchsia-400/40 p-3 flex flex-col items-center text-center gap-1"
                    >
                      <img src={wp.iconUrl} alt={wp.name} className="w-16 h-16 object-contain" />
                      <span className="text-[11px] font-black text-fuchsia-300">⭐⭐⭐⭐</span>
                      <span className="text-xs font-bold text-white line-clamp-1">{wp.name}</span>
                      <span className="text-[10px] text-slate-300">{wp.weaponClassLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-amber-200">
                    5★: {gachaState.stdPity5 || 0} / {KNIGHT_GACHA_RATES.hardPity5}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-fuchsia-200">
                    4★: {gachaState.stdPity4 || 0} / {KNIGHT_GACHA_RATES.hardPity4}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/25 border border-rose-400/40 font-black text-rose-200">
                    Không có nhân vật Giới Hạn • Có tỉ lệ tạch
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    data-testid="gacha-std-pull-1-btn"
                    onClick={() => startGachaPull('standard', 1)}
                    className={`px-4 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-lg ${
                      canAffordPull(1)
                        ? 'bg-cyan-50 hover:bg-cyan-100 text-slate-950 border-cyan-300'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <div>Quay Thường x1</div>
                    <div className="text-[11px] font-extrabold text-cyan-800">{getCostLabel(1)}</div>
                  </button>

                  <button
                    type="button"
                    data-testid="gacha-std-pull-10-btn"
                    onClick={() => startGachaPull('standard', 10)}
                    className={`px-5 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-xl ${
                      canAffordPull(10)
                        ? 'bg-gradient-to-r from-cyan-300 to-sky-400 hover:brightness-105 text-slate-950 border-white'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <div>Quay Thường x10 (Chắc chắn ≥ 4★)</div>
                    <div className="text-[11px] font-extrabold text-slate-900">{getCostLabel(10)}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: INVENTORY & CLASS-MATCHED COSMETIC WEAPON EQUIPPING
        ========================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Nhân Vật ({unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Mỗi nhân vật chỉ cầm được vũ khí trang trí đúng Hệ của mình
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {KNIGHT_CHARACTER_SKINS.map(skin => {
                  const unlocked = unlockedSkins.includes(skin.id);
                  const equipped = rpgProfile.equippedSkin === skin.id;
                  const heldWeapon = getHeroCosmeticWeapon(rpgProfile, skin);
                  const compatibleOwnedWeapons = KNIGHT_GACHA_WEAPONS.filter(
                    w => unlockedWeapons.includes(w.id) && canHeroEquipWeapon(skin, w)
                  );

                  return (
                    <div
                      key={skin.id}
                      data-testid={`knight-skin-card-${skin.id}`}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                        equipped
                          ? 'bg-pink-50 dark:bg-pink-950/35 border-pink-400 ring-1 ring-pink-400/40'
                          : unlocked
                          ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center border-2 p-1.5 shrink-0 relative overflow-hidden shadow-md"
                          style={{
                            background: `radial-gradient(circle at 50% 45%, ${(heldWeapon?.bladeColor || skin.bladeColor)}40, #090d16 78%)`,
                            borderColor: skin.starRarity === 5 ? '#fbbf24' : '#c084fc'
                          }}
                        >
                          <img
                            src={skin.spriteUrl}
                            alt={skin.name}
                            className={`w-full h-full object-contain ${unlocked ? '' : 'grayscale opacity-70'}`}
                          />
                          <span
                            className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                              skin.pool === 'limited'
                                ? 'bg-amber-400 text-slate-950'
                                : skin.starRarity === 5
                                ? 'bg-cyan-300 text-slate-950'
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {skin.pool === 'limited' ? '5★ GH' : `${skin.starRarity}★`}
                          </span>
                          {unlocked && heldWeapon && (
                            <img
                              src={heldWeapon.iconUrl}
                              alt={heldWeapon.name}
                              title={`Đang cầm: ${heldWeapon.name}`}
                              className="absolute bottom-1 right-1 w-7 h-7 rounded-lg border border-amber-300 bg-slate-950/90 object-contain shadow"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-[#0F172B] dark:text-white">
                              {skin.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 text-[10px] font-extrabold">
                              {skin.weaponClassLabel}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate">
                            🗡️ {heldWeapon ? `${heldWeapon.name} (Trang trí)` : skin.weaponName}
                          </p>
                          {skin.memeQuote && (
                            <p className="text-[11px] italic text-pink-600 dark:text-pink-300 leading-snug">
                              {skin.memeQuote}
                            </p>
                          )}
                          <p className="text-[11px] text-[#475569] dark:text-slate-300 leading-snug">
                            {skin.passiveText}
                          </p>
                        </div>
                      </div>

                      {/* Class-Matched Cosmetic Weapon Selector for Unlocked Hero */}
                      {unlocked && (
                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-600 dark:text-slate-400">
                              Cầm vũ khí ({skin.weaponClassLabel} • Trang trí):
                            </span>
                            {heldWeapon && (
                              <button
                                type="button"
                                onClick={() => onEquipHeroWeapon?.(skin.id, '')}
                                className="text-rose-500 font-bold hover:underline"
                              >
                                Về mặc định
                              </button>
                            )}
                          </div>
                          {compatibleOwnedWeapons.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              Chưa có vũ khí {skin.weaponClassLabel} trong kho.
                            </p>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {compatibleOwnedWeapons.map(wp => {
                                const isHolding = heldWeapon?.id === wp.id;
                                return (
                                  <button
                                    key={wp.id}
                                    type="button"
                                    data-testid={`equip-hero-wp-${skin.id}-${wp.id}`}
                                    onClick={() => onEquipHeroWeapon?.(skin.id, isHolding ? '' : wp.id)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[11px] font-bold transition ${
                                      isHolding
                                        ? 'bg-amber-400/25 border-amber-400 text-amber-800 dark:text-amber-200'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    <img src={wp.iconUrl} alt={wp.name} className="w-4 h-4 rounded object-contain" />
                                    <span>{wp.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => onEquipSkin?.(skin)}
                          className={`w-full py-2 rounded-xl text-xs font-black transition ${
                            equipped
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172B] dark:text-white'
                          }`}
                        >
                          {equipped ? '✓ Đang Xuất Trận' : 'Chọn Nhân Vật'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`locked-gacha-hero-btn-${skin.id}`}
                          onClick={() => {
                            setActiveTab(skin.pool === 'limited' ? 'character_event' : 'standard');
                            showToast?.(
                              skin.pool === 'limited'
                                ? 'Nhân vật Giới Hạn chỉ xuất hiện theo chu kỳ 7 ngày ở Banner Giới Hạn!'
                                : 'Nhân vật mở khóa qua vòng quay Gacha!',
                              'info'
                            );
                          }}
                          className="w-full py-2 rounded-xl text-xs font-black bg-slate-200/80 hover:bg-amber-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-300 border border-dashed border-amber-400/50 inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {skin.pool === 'limited' ? 'Nhân vật Banner Giới Hạn' : 'Chưa sở hữu • Quay Gacha'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weapons Collection */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-fuchsia-500" />
                  <span>Kho Vũ Khí Trang Trí 4★ &amp; 3★ ({unlockedWeapons.length}/{KNIGHT_GACHA_WEAPONS.length})</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Nhân vật đang chọn: <b>{activeSkin.name}</b> ({activeSkin.weaponClassLabel})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KNIGHT_GACHA_WEAPONS.map(wp => {
                  const owned = unlockedWeapons.includes(wp.id);
                  const countOwned = weaponCounts[wp.id] || (owned ? 1 : 0);
                  const matchesActiveHero = canHeroEquipWeapon(activeSkin, wp);
                  const activeHeroHeldWp = getHeroCosmeticWeapon(rpgProfile, activeSkin);
                  const isEquippedOnActive = activeHeroHeldWp?.id === wp.id;

                  return (
                    <div
                      key={wp.id}
                      data-testid={`knight-weapon-card-${wp.id}`}
                      className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                        isEquippedOnActive
                          ? 'bg-fuchsia-50 dark:bg-fuchsia-950/35 border-fuchsia-400 ring-1 ring-fuchsia-400/40'
                          : owned
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={wp.iconUrl}
                          alt={wp.name}
                          className={`w-14 h-14 rounded-xl object-contain shrink-0 ${owned ? '' : 'grayscale opacity-60'}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                wp.starRarity === 4
                                  ? 'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300'
                                  : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                              }`}
                            >
                              {'★'.repeat(wp.starRarity)}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {wp.weaponClassLabel}
                            </span>
                            {owned && countOwned > 1 && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-300">
                                x{countOwned}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-[#0F172B] dark:text-white truncate mt-0.5">
                            {wp.name}
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-tight">
                            Chỉ trang trí ngoại hình
                          </p>
                        </div>
                      </div>

                      {owned ? (
                        matchesActiveHero ? (
                          <button
                            type="button"
                            onClick={() =>
                              onEquipHeroWeapon?.(activeSkin.id, isEquippedOnActive ? '' : wp.id)
                            }
                            className={`w-full py-1.5 rounded-xl text-xs font-black transition ${
                              isEquippedOnActive
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                            }`}
                          >
                            {isEquippedOnActive ? '✓ Đang Cầm' : `Cho ${activeSkin.name.split(' ').pop()} Cầm`}
                          </button>
                        ) : (
                          <span className="text-[11px] text-center py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                            Dành cho {wp.weaponClassLabel}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-center py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 font-bold">
                          Chưa mở
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: BUY WISH PACKS & HISTORY
        ========================================================= */}
        {activeTab === 'shop' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-50 to-white dark:from-slate-900 dark:to-cyan-950/30 p-4 flex flex-col justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-black">
                    GÓI 1 LƯỢT
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-[#0F172B] dark:text-white">
                    1 Lượt Quay Gacha
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-slate-300">
                    Quét VietQR tự động cộng +1 lượt quay.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="buy-wish-1-vnd-btn"
                  onClick={() => onOpenWishQrCheckout?.('gacha_wish_1')}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-black shadow transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mua 1 Lượt — {formatVndCurrency(wish1VndPrice)}</span>
                </button>
              </div>

              <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white dark:from-amber-950/35 dark:via-slate-900 dark:to-rose-950/30 p-4 flex flex-col justify-between gap-3 shadow-lg">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                    GÓI 10 LƯỢT (CHẮC CHẮN ≥ 4★)
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-[#0F172B] dark:text-white">
                    10 Lượt Quay Gacha
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-slate-300">
                    Quét VietQR tự động cộng +10 lượt quay.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="buy-wish-10-vnd-btn"
                  onClick={() => onOpenWishQrCheckout?.('gacha_wish_10')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-slate-950 text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mua 10 Lượt — {formatVndCurrency(wish10VndPrice)}</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-[#0F172B] dark:text-white">
                  Đổi Vàng Lấy Lượt Quay (10.000 Vàng = 1 Lượt)
                </h4>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  Dùng Vàng tích lũy từ đánh quái và Boss để đổi lượt quay.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="exchange-gold-1-wish-btn"
                  onClick={() => onExchangeGoldForWishes?.(1)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition"
                >
                  Đổi +1 Lượt ({KNIGHT_GACHA_GOLD_SINGLE.toLocaleString('vi-VN')} Vàng)
                </button>
                <button
                  type="button"
                  data-testid="exchange-gold-10-wish-btn"
                  onClick={() => onExchangeGoldForWishes?.(10)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition"
                >
                  Đổi +10 Lượt ({KNIGHT_GACHA_GOLD_TEN.toLocaleString('vi-VN')} Vàng)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                <h4 className="font-black text-sm text-[#0F172B] dark:text-white">
                  Quy Tắc Vòng Quay
                </h4>
                <ul className="space-y-1.5 text-[#334155] dark:text-slate-300 leading-relaxed">
                  <li>• <b>Banner Giới Hạn:</b> Reset cố định lúc <b>00:00 Thứ 2 hàng tuần</b> (1 banner duy nhất/tuần). Có tỉ lệ 50% ra nhân vật Thường nếu lệch 50/50.</li>
                  <li>• <b>Banner Thường:</b> Không bao giờ ra nhân vật Giới Hạn, có tỉ lệ tạch ở bậc 3★.</li>
                  <li>• <b>Hoàn Vàng trùng nhân vật:</b> Nhân vật 5★ hoàn <b>{KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD.toLocaleString('vi-VN')} Vàng</b> • Nhân vật 4★ hoàn <b>{KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD.toLocaleString('vi-VN')} Vàng</b>.</li>
                  <li>• <b>Vũ khí 4★ &amp; 3★:</b> Trùng vẫn cộng dồn bình thường, dùng trang trí ngoại hình theo đúng Hệ nhân vật.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs max-h-56 overflow-y-auto">
                <h4 className="font-black text-sm text-[#0F172B] dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-500" />
                  <span>Lịch Sử Quay ({wishHistory.length})</span>
                </h4>
                {wishHistory.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có lịch sử quay.</p>
                ) : (
                  <div className="space-y-1">
                    {wishHistory.slice(0, 15).map((h, i) => (
                      <div
                        key={`${h.pullId}_${i}`}
                        className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800/70"
                      >
                        <span
                          className={`font-bold truncate ${
                            h.starRarity === 5
                              ? 'text-amber-500 dark:text-amber-300 font-black'
                              : h.starRarity === 4
                              ? 'text-purple-600 dark:text-fuchsia-300 font-extrabold'
                              : h.isWhiff
                              ? 'text-rose-500'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          [{h.starRarity}★] {h.name}
                          {h.isRefundedHero
                            ? ` (+${h.refundGoldAmount === 10000 ? '10k' : '200k'} Vàng)`
                            : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {h.bannerType === 'standard' ? 'Thường' : 'Giới hạn'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5 (ADMIN ONLY): GRANT WISHES TO ACCOUNTS & SCHEDULE NEXT MONDAY BANNER HERO
        ========================================================= */}
        {isStrictAdmin && activeTab === 'admin' && (() => {
          const allAccounts = Object.entries(usersDb || {})
            .map(([uKey, uVal]) => ({
              username: uVal?.username || uKey,
              name: uVal?.name || uKey,
              isGuest: Boolean(uVal?.isGuest),
              role: uVal?.role || 'student',
              wishes: Math.max(0, Math.floor(Number(uVal?.knightRpgProfile?.wishes) || 0))
            }))
            .filter(acc => acc.username && !acc.isGuest)
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

          const qTrim = grantTargetQuery.trim().replace(/^@/, '').toLowerCase();
          const filteredAccounts = qTrim
            ? allAccounts.filter(
                acc =>
                  acc.username.toLowerCase().includes(qTrim) ||
                  acc.name.toLowerCase().includes(qTrim)
              )
            : allAccounts;
          const exactTarget = allAccounts.find(
            acc => acc.username.toLowerCase() === qTrim
          );

          const handleGrantSubmit = (e) => {
            e?.preventDefault();
            const targetAcc = exactTarget || (filteredAccounts.length === 1 ? filteredAccounts[0] : null);
            const cleanTargetUname = targetAcc?.username || grantTargetQuery.trim().replace(/^@/, '');
            const cleanAmt = Math.max(1, Math.min(10000, Math.round(Number(grantAmount) || 0)));
            if (!cleanTargetUname) {
              showToast?.('Vui lòng chọn hoặc nhập @username tài khoản cần trao lượt quay!', 'error');
              return;
            }
            const existsInDb = allAccounts.find(
              acc => acc.username.toLowerCase() === cleanTargetUname.toLowerCase()
            );
            if (!existsInDb) {
              showToast?.(`Không tìm thấy tài khoản "@${cleanTargetUname}" trong hệ thống!`, 'error');
              return;
            }
            if (!onAdminGrantGachaWishes) {
              showToast?.('Chức năng đồng bộ Admin chưa sẵn sàng.', 'error');
              return;
            }
            onAdminGrantGachaWishes({
              username: existsInDb.username,
              amount: cleanAmt,
              note: grantNote.trim()
            });
            setGrantNote('');
            showToast?.(
              `🎁 Đã trao +${cleanAmt} 🌠 Lượt Quay Gacha cho ${existsInDb.name} (@${existsInDb.username})!`
            );
          };

          return (
            <div className="space-y-5">
              {/* 1. Grant Wishes to Another Account */}
              <form
                onSubmit={handleGrantSubmit}
                data-testid="admin-grant-wishes-panel"
                className="rounded-2xl border-2 border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-slate-900/90 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                      <Gift className="w-4 h-4 text-rose-500" />
                      <span>Trao Lượt Quay Gacha Cho Tài Khoản Khác</span>
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                      Cộng trực tiếp lượt quay vào tài khoản học viên / giáo viên và gửi thông báo tự động theo thời gian thực.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-1.5">
                    <label className="block text-xs font-extrabold text-[#334155] dark:text-slate-300">
                      Tài khoản nhận (@username hoặc tên)
                    </label>
                    <input
                      type="text"
                      data-testid="admin-grant-target-input"
                      value={grantTargetQuery}
                      onChange={e => setGrantTargetQuery(e.target.value)}
                      placeholder="VD: e2e_student hoặc bấm chọn bên dưới..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0F172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-xs font-extrabold text-[#334155] dark:text-slate-300">
                      Số lượt quay tặng
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      data-testid="admin-grant-amount-input"
                      value={grantAmount}
                      onChange={e => setGrantAmount(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-black text-amber-600 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-end">
                    <button
                      type="submit"
                      data-testid="admin-grant-wishes-btn"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Trao +{grantAmount} Lượt</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Chọn nhanh số lượt:</span>
                  {[1, 5, 10, 20, 50, 90].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGrantAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border transition ${
                        Number(grantAmount) === preset
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      +{preset} lượt
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={grantNote}
                    onChange={e => setGrantNote(e.target.value)}
                    placeholder="Lời nhắn kèm thông báo (tùy chọn, VD: Thưởng Top BXH tuần này!)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-[#0F172B] dark:text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Bấm chọn nhanh tài khoản ({filteredAccounts.length} tài khoản):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {filteredAccounts.slice(0, 30).map(acc => {
                      const isSelected = acc.username.toLowerCase() === qTrim;
                      const isSelf = acc.username.toLowerCase() === String(currentUsername || '').toLowerCase();
                      return (
                        <button
                          key={acc.username}
                          type="button"
                          data-testid={`admin-pick-account-${acc.username}`}
                          onClick={() => setGrantTargetQuery(acc.username)}
                          className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition inline-flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0F172B] dark:text-slate-200 hover:border-rose-400'
                          }`}
                        >
                          <span>{acc.name}</span>
                          <span className="opacity-75">(@{acc.username}{isSelf ? ' • Bạn' : ''})</span>
                          <span className="px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200 font-black text-[10px]">
                            {acc.wishes}🌠
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>

              {/* 2. Choose Next Featured Limited Hero for Monday 00:00 Reset */}
              <div
                data-testid="admin-next-banner-panel"
                className="rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50/40 dark:bg-slate-900/90 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Chọn Nhân Vật Tiếp Theo Cho Banner Giới Hạn (Reset 00:00 Thứ 2)</span>
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                      Đúng <b>00:00 Thứ 2 hàng tuần</b>: Banner Giới Hạn sẽ tự động chuyển sang nhân vật Admin đã chọn (đồng thời điểm BXH ở 2 game tự động reset về 0, không ảnh hưởng điểm học tập).
                    </p>
                  </div>
                  {weeklyBanner.isAdminScheduledNext && (
                    <button
                      type="button"
                      data-testid="admin-clear-scheduled-hero-btn"
                      onClick={() => {
                        onAdminSetGachaBannerConfig?.({ nextFeaturedHeroId: '' });
                        showToast?.('Đã chuyển Banner Thứ 2 tới về chế độ tự động xoay vòng!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-[#0F172B] dark:text-slate-200 transition"
                    >
                      🔄 Để Tự Động Xoay Vòng
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-500/40 flex items-center gap-3">
                    <img src={featured5Hero.spriteUrl} alt={featured5Hero.name} className="w-12 h-12 object-contain shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-300">
                        Đang mở tuần này ({weeklyBanner.weekKey})
                      </span>
                      <p className="font-black text-[#0F172B] dark:text-white truncate">{featured5Hero.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Còn {weeklyBanner.countdownText}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-3">
                    <img src={nextFeatured5Hero.spriteUrl} alt={nextFeatured5Hero.name} className="w-12 h-12 object-contain shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-300">
                        {weeklyBanner.isAdminScheduledNext ? '📌 Đã khóa cho 00:00 Thứ 2 tới' : '🔄 Dự kiến 00:00 Thứ 2 tới (Tự động)'}
                      </span>
                      <p
                        data-testid="admin-scheduled-next-hero-name"
                        className="font-black text-[#0F172B] dark:text-white truncate"
                      >
                        {nextFeatured5Hero.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{nextFeatured5Hero.weaponClassLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {limited5Heroes.map(hero => {
                    const isCurrentActive = featured5Hero.id === hero.id;
                    const isScheduledNext = weeklyBanner.scheduledNextHeroId === hero.id;
                    return (
                      <div
                        key={hero.id}
                        className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                          isScheduledNext
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 ring-1 ring-emerald-400/40'
                            : isCurrentActive
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={hero.spriteUrl} alt={hero.name} className="w-12 h-12 object-contain shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#0F172B] dark:text-white leading-snug">{hero.name}</p>
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-300">{hero.weaponClassLabel}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            data-testid={`admin-schedule-next-hero-${hero.id}`}
                            onClick={() => {
                              onAdminSetGachaBannerConfig?.({ nextFeaturedHeroId: hero.id });
                              showToast?.(`📌 Đã chọn "${hero.name}" làm Banner Giới Hạn cho 00:00 Thứ 2 tới!`);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition ${
                              isScheduledNext
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-400/40'
                            }`}
                          >
                            {isScheduledNext ? '✓ Thứ 2 Tới' : '📌 Thứ 2 Tới'}
                          </button>

                          <button
                            type="button"
                            data-testid={`admin-activate-now-hero-${hero.id}`}
                            onClick={() => {
                              onAdminSetGachaBannerConfig?.({ activeFeaturedHeroId: hero.id });
                              showToast?.(`⚡ Đã chuyển Banner Giới Hạn tuần này sang "${hero.name}"!`);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition ${
                              isCurrentActive
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-300 border border-amber-400/40'
                            }`}
                          >
                            {isCurrentActive ? '★ Đang Mở' : '⚡ Mở Ngay'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
