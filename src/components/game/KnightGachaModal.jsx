import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Coins,
  Crown,
  Gift,
  History,
  KeyRound,
  Music,
  QrCode,
  RotateCcw,
  Settings,
  Sparkles,
  Star,
  Users,
  VolumeX
} from 'lucide-react';
import {
  formatVndCurrency,
  GACHA_WISH_10_PRICE_VND,
  GACHA_WISH_1_PRICE_VND,
  normalizePaymentConfig
} from '../../constants/profileCustomization';
import {
  getWeeklyLimitedBannerState,
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD,
  KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD,
  KNIGHT_GACHA_GOLD_SINGLE,
  KNIGHT_GACHA_GOLD_TEN,
  KNIGHT_GACHA_RATES,
  KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
  REVIVE_KEY_GOLD_PRICE
} from '../../constants/knightRpgData';

// ==========================================
// WEB AUDIO SYNTHESIZER FOR GACHA SUSPENSE, CLIMAX, SILHOUETTE & MEME SOUND FX
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
  scheduleTone(ctx, 165, 0.0, 2.95, 'sine', 0.07, 640);
  scheduleTone(ctx, 247.5, 0.2, 2.75, 'triangle', 0.05, 900);
  const pulseTimes = [0.1, 0.58, 1.0, 1.38, 1.72, 2.02, 2.28, 2.5, 2.7, 2.86];
  pulseTimes.forEach((t, idx) => {
    scheduleTone(ctx, 440 + idx * 44, t, 0.18, 'sine', 0.06);
  });
}

function playMeteorClimaxReveal(maxRarity = 3) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  if (maxRarity === 5) {
    scheduleTone(ctx, 130.81, 0, 0.55, 'sawtooth', 0.11, 65.4);
    [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((f, idx) => {
      scheduleTone(ctx, f, idx * 0.07, 0.88, 'triangle', 0.14);
    });
    [523.25, 783.99, 1046.5, 1318.5].forEach(f => {
      scheduleTone(ctx, f, 0.45, 0.95, 'sine', 0.11);
    });
  } else if (maxRarity === 4) {
    scheduleTone(ctx, 174.61, 0, 0.4, 'triangle', 0.09, 110);
    [440, 523.25, 659.25, 880, 1046.5].forEach((f, idx) => {
      scheduleTone(ctx, f, idx * 0.07, 0.65, 'triangle', 0.12);
    });
  } else {
    // Funny sad-trombone / meme womp-womp on 3★ whiff!
    scheduleTone(ctx, 311.13, 0.0, 0.22, 'sawtooth', 0.08, 293.66);
    scheduleTone(ctx, 293.66, 0.22, 0.22, 'sawtooth', 0.08, 277.18);
    scheduleTone(ctx, 277.18, 0.44, 0.48, 'sawtooth', 0.09, 196.0);
  }
}

function playSilhouetteEnterSound() {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  scheduleTone(ctx, 220, 0, 0.45, 'sine', 0.065, 440);
}

function playItemUnveilSound(starRarity = 3, isWhiff = false) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  if (starRarity === 5) {
    [523.25, 659.25, 783.99, 1046.5, 1567.98].forEach((f, i) => {
      scheduleTone(ctx, f, i * 0.05, 0.72, 'triangle', 0.12);
    });
  } else if (starRarity === 4) {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      scheduleTone(ctx, f, i * 0.05, 0.52, 'triangle', 0.1);
    });
  } else if (isWhiff) {
    // Comedic boing + sad slide
    scheduleTone(ctx, 293.66, 0, 0.16, 'triangle', 0.08, 246.94);
    scheduleTone(ctx, 233.08, 0.16, 0.34, 'sawtooth', 0.07, 155.56);
  }
}

function playStarPopPing(starIdx = 0, totalStars = 3) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  const scale = [587.33, 659.25, 783.99, 987.77, 1318.51];
  const freq = scale[Math.min(scale.length - 1, starIdx)] || 783.99;
  const isFinalHighStar = starIdx === totalStars - 1 && totalStars >= 4;
  scheduleTone(ctx, freq, 0, isFinalHighStar ? 0.42 : 0.22, 'triangle', isFinalHighStar ? 0.12 : 0.085);
}

export default function KnightGachaModal({
  isOpen,
  initialTab = 'character_event',
  isStrictAdmin = false,
  bgmMuted = false,
  onToggleBgm = null,
  onCutsceneActiveChange = null,
  onOpenCharactersPage = null,
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
  onExchangeGoldForWishes,
  onBuyReviveKeyWithGold,
  onOpenWishQrCheckout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'character_event');
  const [cutscene, setCutscene] = useState(null);
  const [unveilStage, setUnveilStage] = useState('silhouette');
  const [visibleStars, setVisibleStars] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [grantTargetQuery, setGrantTargetQuery] = useState('');
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantNote, setGrantNote] = useState('');

  const timersRef = useRef([]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Notify parent immediately when Gacha Pull Cutscene starts/ends so BGM stops immediately on pull!
  useEffect(() => {
    onCutsceneActiveChange?.(Boolean(cutscene));
    return () => {
      onCutsceneActiveChange?.(false);
    };
  }, [Boolean(cutscene), onCutsceneActiveChange]);

  const clearAllCutsceneTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllCutsceneTimers();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => {
      setNowTick(Date.now());
    }, 30_000);
    return () => clearInterval(iv);
  }, [isOpen]);

  const weeklyBanner = getWeeklyLimitedBannerState(nowTick, knightGachaConfig);

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
  const unlockedSkins = isStrictAdmin
    ? KNIGHT_CHARACTER_SKINS.map(s => s.id)
    : Array.isArray(rpgProfile?.unlockedSkins)
    ? rpgProfile.unlockedSkins
    : ['knight_arthur'];
  const wishHistory = Array.isArray(rpgProfile?.wishHistory) ? rpgProfile.wishHistory : [];

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

    // Immediately silence BGM on pull!
    onCutsceneActiveChange?.(true);
    clearAllCutsceneTimers();
    playMeteorSuspenseBuildup();

    setCutscene({
      phase: 'meteor_suspense',
      results: res.results,
      maxRarity: res.maxRarity,
      allWhiff: res.allWhiff,
      revealIdx: 0
    });

    const tClimax = setTimeout(() => {
      playMeteorClimaxReveal(res.maxRarity);
      setCutscene(prev =>
        prev && prev.phase === 'meteor_suspense'
          ? { ...prev, phase: 'meteor_climax' }
          : prev
      );
    }, 3000);

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
    if (isStrictAdmin) return 'Miễn phí (Admin)';
    if (wishes >= count) return `${count} Lượt Quay`;
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
      className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-5"
    >
      {/* =========================================================
          CINEMATIC MEME GACHA SUMMON CUTSCENE (BGM SILENCED!)
      ========================================================= */}
      {cutscene && (
        <div
          data-testid="knight-gacha-cutscene"
          data-rarity={isSuspensePhase ? 'neutral' : String(cutscene.maxRarity)}
          data-target-rarity={String(cutscene.maxRarity)}
          data-phase={cutscene.phase}
          className={`fixed inset-0 z-[140] flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto select-none transition-colors duration-500 ${
            isSuspensePhase
              ? 'bg-gradient-to-br from-[#050816] via-[#0e1633] to-[#040712]'
              : cutscene.maxRarity === 5
              ? 'bg-gradient-to-br from-[#331800] via-[#6b2804] to-[#090d16]'
              : cutscene.maxRarity === 4
              ? 'bg-gradient-to-br from-[#280a48] via-[#4f0b82] to-[#090d16]'
              : 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#090d16]'
          }`}
        >
          <style>{`
            @keyframes gachaSpinCw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes gachaSpinCcw { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            @keyframes gachaSpeedStreak {
              0% { transform: translate(-55vw, -45vh) rotate(32deg); opacity: 0; }
              25% { opacity: 0.78; }
              100% { transform: translate(55vw, 45vh) rotate(32deg); opacity: 0; }
            }
            @keyframes gachaSuspenseComet {
              0% { transform: translate(-44vw, -36vh) scale(0.42) rotate(32deg); opacity: 0.25; }
              30% { opacity: 1; }
              100% { transform: translate(2vw, 2vh) scale(1.08) rotate(32deg); opacity: 1; }
            }
            @keyframes gachaClimaxComet {
              0% { transform: translate(2vw, 2vh) scale(1.15) rotate(32deg); opacity: 1; }
              65% { transform: translate(14vw, 11vh) scale(1.9) rotate(32deg); opacity: 1; }
              100% { transform: translate(28vw, 22vh) scale(3.0) rotate(32deg); opacity: 0; }
            }
            @keyframes gachaClimaxFlash { 0% { opacity: 0.95; } 100% { opacity: 0; } }
            @keyframes gachaShockwave { 0% { transform: scale(0.15); opacity: 1; } 100% { transform: scale(3.3); opacity: 0; } }
            @keyframes gachaCameraShake {
              0%, 100% { transform: translate(0, 0); }
              20% { transform: translate(-9px, 7px); }
              40% { transform: translate(9px, -7px); }
              60% { transform: translate(-6px, -4px); }
              80% { transform: translate(6px, 4px); }
            }
            @keyframes gachaSilhouetteZoom { 0% { transform: scale(1.26); opacity: 0.2; } 100% { transform: scale(1.0); opacity: 1; } }
            @keyframes gachaUnveilBurst {
              0% { transform: scale(0.84) rotate(-3deg); filter: brightness(2.9); }
              55% { transform: scale(1.08) rotate(1deg); filter: brightness(1.25); }
              100% { transform: scale(1.0) rotate(0deg); filter: brightness(1); }
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

          {/* Cutscene Top Controls */}
          <div className="w-full max-w-5xl flex items-center justify-between z-20">
            <span
              data-testid="gacha-cutscene-status-pill"
              className={`px-4 py-1.5 rounded-full text-xs font-black border shadow-lg transition-all duration-300 ${
                isSuspensePhase
                  ? 'bg-zinc-900/80 border-sky-300/40 text-sky-100'
                  : cutscene.maxRarity === 5
                  ? 'bg-amber-400 text-zinc-950 border-yellow-100 scale-105'
                  : cutscene.maxRarity === 4
                  ? 'bg-fuchsia-500 text-white border-fuchsia-200 scale-105'
                  : 'bg-zinc-800 border-zinc-500 text-zinc-200'
              }`}
            >
              {isSuspensePhase
                ? '☄️ Đang triệu hồi sao băng...'
                : cutscene.maxRarity === 5
                ? '🔥 RA VÀNG 5 SAO ĐỈNH NÓC!'
                : cutscene.maxRarity === 4
                ? '⚡ NỔ MEME 4 SAO!'
                : '💀 TẠCH GACHA (+500 VÀNG)'}
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
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black shadow-lg transition"
              >
                Đóng ✕
              </button>
            )}
          </div>

          {/* METEOR SUSPENSE -> CLIMAX SHIFT */}
          {(isSuspensePhase || isClimaxPhase) && (
            <div
              style={
                isClimaxPhase && cutscene.maxRarity >= 4
                  ? { animation: 'gachaCameraShake 0.48s ease-out' }
                  : undefined
              }
              className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden"
            >
              {isClimaxPhase && (
                <div
                  style={{ animation: 'gachaClimaxFlash 0.65s ease-out forwards' }}
                  className={`fixed inset-0 pointer-events-none z-30 ${
                    cutscene.maxRarity === 5
                      ? 'bg-amber-200'
                      : cutscene.maxRarity === 4
                      ? 'bg-fuchsia-300'
                      : 'bg-slate-400/50'
                  }`}
                />
              )}

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  style={{ animation: 'gachaSpinCw 9s linear infinite' }}
                  className={`w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed ${
                    isSuspensePhase
                      ? 'border-sky-300/25'
                      : cutscene.maxRarity === 5
                      ? 'border-amber-300/80 shadow-[0_0_90px_rgba(251,191,36,0.5)]'
                      : cutscene.maxRarity === 4
                      ? 'border-fuchsia-400/75 shadow-[0_0_75px_rgba(192,132,252,0.45)]'
                      : 'border-slate-500/40'
                  }`}
                />
                <div
                  style={{ animation: 'gachaSpinCcw 6s linear infinite' }}
                  className={`absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border ${
                    isSuspensePhase
                      ? 'border-indigo-300/20'
                      : cutscene.maxRarity === 5
                      ? 'border-yellow-200/85'
                      : cutscene.maxRarity === 4
                      ? 'border-purple-300/75'
                      : 'border-slate-400/35'
                  }`}
                />
              </div>

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
                        : 'bg-gradient-to-r from-transparent via-slate-400/60 to-transparent'
                    }`}
                  />
                ))}
              </div>

              <div
                style={{
                  animation: isSuspensePhase
                    ? 'gachaSuspenseComet 3s cubic-bezier(0.25, 0.8, 0.4, 1) forwards'
                    : 'gachaClimaxComet 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}
                className="relative flex items-center z-10"
              >
                <div
                  className={`w-64 sm:w-[420px] h-4 sm:h-5 rounded-full blur-[1.5px] ${
                    isSuspensePhase
                      ? 'bg-gradient-to-r from-transparent via-sky-200 to-white shadow-[0_0_30px_rgba(186,230,253,0.8)]'
                      : cutscene.maxRarity === 5
                      ? 'bg-gradient-to-r from-transparent via-amber-400 to-yellow-100 shadow-[0_0_70px_#fbbf24]'
                      : cutscene.maxRarity === 4
                      ? 'bg-gradient-to-r from-transparent via-fuchsia-500 to-purple-100 shadow-[0_0_55px_#c084fc]'
                      : 'bg-gradient-to-r from-transparent via-slate-500 to-slate-300'
                  }`}
                />
                <div
                  className={`w-14 h-14 sm:w-18 sm:h-18 -ml-4 rounded-full flex items-center justify-center text-2xl ${
                    isSuspensePhase
                      ? 'bg-white shadow-[0_0_55px_16px_rgba(186,230,253,0.85)] ring-4 ring-sky-100'
                      : cutscene.maxRarity === 5
                      ? 'bg-amber-200 shadow-[0_0_110px_38px_rgba(251,191,36,1)] ring-4 ring-yellow-50 scale-125'
                      : cutscene.maxRarity === 4
                      ? 'bg-fuchsia-200 shadow-[0_0_95px_28px_rgba(192,132,252,0.95)] ring-4 ring-purple-50 scale-115'
                      : 'bg-slate-400 shadow-[0_0_30px_8px_rgba(148,163,184,0.6)]'
                  }`}
                >
                  {isSuspensePhase ? '☄️' : cutscene.maxRarity === 5 ? '👑' : cutscene.maxRarity === 4 ? '⚡' : '💀'}
                </div>
              </div>

              {isClimaxPhase && (
                <div
                  style={{ animation: 'gachaShockwave 1.15s ease-out forwards' }}
                  className={`absolute w-56 h-56 rounded-full border-4 pointer-events-none ${
                    cutscene.maxRarity === 5
                      ? 'border-amber-300 bg-amber-400/25 shadow-[0_0_120px_#fbbf24]'
                      : cutscene.maxRarity === 4
                      ? 'border-fuchsia-300 bg-purple-500/25 shadow-[0_0_100px_#c084fc]'
                      : 'border-slate-400 bg-slate-500/20'
                  }`}
                />
              )}

              <p className="mt-20 text-sm sm:text-base font-black text-white tracking-wider z-10">
                {isSuspensePhase
                  ? 'Đang triệu hồi nhân vật Meme từ vũ trụ...'
                  : cutscene.maxRarity === 5
                  ? '🌈 NỔ KIM QUANG 5 SAO HUYỀN THOẠI!!'
                  : cutscene.maxRarity === 4
                  ? '🔮 NỔ ÁNH TÍM NHÂN VẬT MEME 4 SAO!'
                  : '💨 TẠCH RỒI! NHẬN +500 VÀNG AN ỦI...'}
              </p>
            </div>
          )}

          {/* MEME CARD REVEAL */}
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
                  className={`vip-pvp-card relative p-6 sm:p-8 rounded-3xl border-2 w-full shadow-2xl overflow-hidden transition-all duration-500 ${
                    isSilhouette
                      ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-white/25'
                      : item.starRarity === 5
                      ? 'bg-gradient-to-b from-amber-500/35 via-amber-950/90 to-zinc-950 border-amber-300 shadow-[0_0_85px_rgba(251,191,36,0.6)]'
                      : item.starRarity === 4
                      ? 'bg-gradient-to-b from-purple-500/30 via-purple-950/90 to-zinc-950 border-fuchsia-400 shadow-[0_0_65px_rgba(192,132,252,0.5)]'
                      : 'bg-gradient-to-b from-slate-800/90 to-zinc-950 border-slate-500'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black text-white/75 tabular-nums">
                      Lượt {cutscene.revealIdx + 1} / {cutscene.results.length}
                    </span>
                    {!isSilhouette && (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {item.isNew && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-zinc-950 text-xs font-black">
                            NHÂN VẬT MỚI!
                          </span>
                        )}
                        {item.isRefundedHero && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-zinc-950 text-xs font-black">
                            +{(item.refundGoldAmount || 0).toLocaleString('vi-VN')} Vàng
                          </span>
                        )}
                        {item.isWhiff && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
                            💀 TẠCH +500 VÀNG
                          </span>
                        )}
                        {item.rateOutcome === 'lost_50_50' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black">
                            Lệch 50/50 (Kế tiếp 100% Giới Hạn)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-3xl flex items-center justify-center p-3 bg-black/50 border border-white/15 shadow-inner">
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

                  <div
                    data-testid="gacha-reveal-stars-row"
                    className="relative z-10 mt-4 h-9 flex items-center justify-center gap-1.5"
                  >
                    {!isSilhouette &&
                      Array.from({ length: totalItemStars }).map((_, sIdx) => {
                        const shown = sIdx < visibleStars;
                        if (!shown) return <span key={sIdx} className="w-6 h-6 inline-block opacity-0" />;
                        return (
                          <span
                            key={sIdx}
                            data-testid="gacha-popped-star"
                            style={{ animation: 'gachaStarPop 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                            className={`inline-flex items-center justify-center text-2xl sm:text-3xl font-black ${
                              item.starRarity === 5
                                ? 'text-amber-300'
                                : item.starRarity === 4
                                ? 'text-fuchsia-300'
                                : 'text-slate-400'
                            }`}
                          >
                            ★
                          </span>
                        );
                      })}
                  </div>

                  <h3 className="relative z-10 text-xl sm:text-2xl font-black text-white mt-1">
                    {isSilhouette ? '???' : item.name}
                  </h3>

                  {!isSilhouette && (
                    <div className="relative z-10 space-y-2 mt-2">
                      {item.memeQuote && (
                        <p className="text-xs sm:text-sm italic font-semibold text-amber-200 bg-black/40 border border-white/10 rounded-2xl px-4 py-2 max-w-md mx-auto">
                          {item.memeQuote}
                        </p>
                      )}
                      <p className="text-xs text-zinc-300 font-semibold">
                        {item.passiveText}
                      </p>
                      {item.bonusText && (
                        <span className="inline-block px-3.5 py-1 rounded-xl bg-amber-400/25 border border-amber-300/50 text-amber-200 text-xs font-black">
                          🪙 {item.bonusText}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-white/80">
                  {isSilhouette
                    ? 'Đang hé lộ...'
                    : cutscene.revealIdx + 1 < cutscene.results.length
                    ? `Chạm để lật tiếp (${cutscene.revealIdx + 1}/${cutscene.results.length}) ▸`
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
                Kết Quả Triệu Hồi ({cutscene.results.length} Lượt)
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
                    style={{ animation: `gachaCardRise 0.35s ease-out ${idx * 0.05}s both` }}
                    className={`vip-pvp-card rounded-2xl border-2 p-3 flex flex-col items-center text-center justify-between gap-2 relative overflow-hidden ${
                      item.starRarity === 5
                        ? 'bg-gradient-to-b from-amber-400/30 via-amber-950/85 to-zinc-950 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.45)]'
                        : item.starRarity === 4
                        ? 'bg-gradient-to-b from-fuchsia-500/25 via-purple-950/85 to-zinc-950 border-fuchsia-400'
                        : 'bg-gradient-to-b from-slate-800/90 to-zinc-950 border-slate-600'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-black ${
                          item.starRarity === 5
                            ? 'text-amber-300'
                            : item.starRarity === 4
                            ? 'text-fuchsia-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {'★'.repeat(item.starRarity)}
                      </span>
                      {item.isNew ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-zinc-950 text-xs font-black">
                          MỚI
                        </span>
                      ) : item.isRefundedHero ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-300 text-zinc-950 text-xs font-black">
                          +{item.refundGoldAmount === 10000 ? '10K' : '200K'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-xs font-black">
                          +500🪙
                        </span>
                      )}
                    </div>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/40 border border-white/10 p-1.5 flex items-center justify-center">
                      <img src={item.spriteUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-white line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-xs text-amber-200/90 line-clamp-1">
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
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs sm:text-sm font-black shadow-lg transition"
                >
                  Xác Nhận
                </button>
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      )}

      {/* =========================================================
          DEDICATED FULL-PAGE GACHA SHRINE CONTAINER (NOT A POPUP!)
      ========================================================= */}
      <div className="vip-pvp-card w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#14151C] text-zinc-900 dark:text-white p-4 sm:p-6 space-y-5 shadow-lg">
        {/* Clean Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              data-testid="close-knight-gacha-modal-btn"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-extrabold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Về Sảnh Chính
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                Triệu Hồi Meme Gacha
              </h2>
              {isStrictAdmin && (
                <span
                  data-testid="admin-gacha-free-badge"
                  className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-600 dark:text-rose-300 text-xs font-black"
                >
                  Admin: Quay Vô Hạn
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-black tabular-nums">
              <span className="text-amber-600 dark:text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {gold.toLocaleString('vi-VN')} Vàng
              </span>
              <span className="text-zinc-400">•</span>
              <span data-testid="gacha-wishes-count" className="text-fuchsia-700 dark:text-fuchsia-300">
                🌠 {wishes} Lượt
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-sky-600 dark:text-sky-300 inline-flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> {keys}
              </span>
            </div>

            <button
              type="button"
              data-testid="buy-revive-key-with-gold-btn"
              onClick={onBuyReviveKeyWithGold}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-black transition"
              title="Đổi 100 Vàng lấy 1 Chìa Khóa Hồi Sinh"
            >
              +1 🗝️ ({REVIVE_KEY_GOLD_PRICE}🪙)
            </button>

            {onToggleBgm && (
              <button
                type="button"
                data-testid="gacha-modal-bgm-btn"
                onClick={onToggleBgm}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition ${
                  bgmMuted
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                    : 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-400/50 text-indigo-700 dark:text-indigo-200'
                }`}
              >
                {bgmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                <span>{bgmMuted ? 'Nhạc: Tắt' : 'Nhạc: Cầu Nguyện Sao Băng'}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="gacha-tab-inventory"
              onClick={() => onOpenCharactersPage?.()}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black inline-flex items-center gap-1.5 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân Vật ({unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})</span>
            </button>

            {isStrictAdmin && onAdminResetHeroes && (
              <button
                type="button"
                data-testid="admin-reset-gacha-heroes-btn"
                onClick={onAdminResetHeroes}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-600 dark:text-rose-200 text-xs font-bold inline-flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Banner Mode Tabs */}
        <div className={`grid grid-cols-2 ${isStrictAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
          <button
            type="button"
            data-testid="gacha-tab-character"
            onClick={() => setActiveTab('character_event')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'character_event'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-amber-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Banner Giới Hạn</span>
          </button>

          <button
            type="button"
            data-testid="gacha-tab-standard"
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'standard'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-cyan-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Banner Thường</span>
          </button>

          <button
            type="button"
            data-testid="gacha-tab-shop"
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
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
              className={`px-3 py-2.5 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white border-rose-300 shadow-sm'
                  : 'bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Quản Trị (Admin)</span>
            </button>
          )}
        </div>

        {/* =========================================================
            TAB 1: WEEKLY LIMITED MEME BANNER
        ========================================================= */}
        {activeTab === 'character_event' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                data-testid="weekly-limited-banner-timer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-black"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset 00:00 Thứ 2 (còn {weeklyBanner.countdownText})</span>
              </div>

              <button
                type="button"
                data-testid="quick-open-wish-shop-btn"
                onClick={() => setActiveTab('shop')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition"
              >
                + Đổi / Mua Lượt Quay
              </button>
            </div>

            <div className="vip-pvp-card relative rounded-3xl overflow-hidden border-2 border-amber-400/70 bg-gradient-to-br from-[#2a1205] via-[#1c1033] to-[#090d16] text-white p-5 sm:p-7 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs font-black">
                    👑 MEME 5★ GIỚI HẠN TUẦN NÀY
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-amber-200 leading-tight">
                    {featured5Hero.name}
                  </h3>

                  {featured5Hero.memeQuote && (
                    <p className="text-xs sm:text-sm italic text-amber-100/95 bg-black/35 border border-amber-300/30 rounded-2xl px-4 py-2.5">
                      {featured5Hero.memeQuote}
                    </p>
                  )}

                  <p className="text-xs text-amber-200 font-bold">
                    ⚡ {featured5Hero.passiveText}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {featured4Heroes.map(h4 => (
                      <div
                        key={h4.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/80 border border-fuchsia-400/50 text-xs font-bold text-fuchsia-100"
                      >
                        <img src={h4.spriteUrl} alt={h4.name} className="w-5 h-5 object-contain" />
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
                    <span className="absolute bottom-2.5 px-3 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-black shadow">
                      {unlockedSkins.includes(featured5Hero.id) ? 'ĐÃ SỞ HỮU' : 'GIỚI HẠN TUẦN'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-amber-200 tabular-nums">
                    Bảo hiểm 5★: {gachaState.charPity5 || 0}/{KNIGHT_GACHA_RATES.hardPity5}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-fuchsia-200 tabular-nums">
                    4★: {gachaState.charPity4 || 0}/{KNIGHT_GACHA_RATES.hardPity4}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black ${
                      gachaState.charGuaranteed5
                        ? 'bg-emerald-400 text-zinc-950'
                        : 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                    }`}
                  >
                    {gachaState.charGuaranteed5 ? 'Chắc chắn 100% Giới Hạn' : 'Tỉ lệ 50/50'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    data-testid="gacha-pull-1-btn"
                    onClick={() => startGachaPull('character_event', 1)}
                    className={`px-4 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-lg ${
                      canAffordPull(1)
                        ? 'bg-[#fffbeb] hover:bg-amber-100 text-zinc-950 border-amber-300'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <div>Quay x1</div>
                    <div className="text-xs font-extrabold text-amber-700">
                      {getCostLabel(1)}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="gacha-pull-10-btn"
                    onClick={() => startGachaPull('character_event', 10)}
                    className={`px-5 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-xl ${
                      canAffordPull(10)
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 text-zinc-950 border-yellow-100'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <div>Quay x10 (Chắc chắn ≥ 4★)</div>
                    <div className="text-xs font-extrabold text-zinc-900">
                      {getCostLabel(10)}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: STANDARD MEME BANNER (ZERO WEAPONS • 3★ WHIFF = +500 GOLD)
        ========================================================= */}
        {activeTab === 'standard' && (
          <div className="space-y-4">
            <div className="vip-pvp-card relative rounded-3xl overflow-hidden border-2 border-cyan-400/60 bg-gradient-to-br from-[#0c1938] via-[#1e1b4b] to-[#090d16] text-white p-5 sm:p-7 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-300/60 text-cyan-200 text-xs font-black">
                    ⭐ BANNER THƯỜNG
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-cyan-200 leading-tight">
                    Hội Tụ Meme Huyền Thoại
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-200">
                    Triệu hồi 10 nhân vật Meme 5★ Thường &amp; dàn Meme 4★ • Ra 3★ tính là Tạch Gacha (hoàn ngay +{KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD} Vàng).
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {standard5Heroes.slice(0, 6).map(h => (
                      <span
                        key={h.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-cyan-300/35 text-xs font-bold text-amber-200"
                      >
                        <img src={h.spriteUrl} alt={h.name} className="w-5 h-5 object-contain" />
                        <span>{h.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 grid grid-cols-2 gap-2.5">
                  {standard5Heroes.slice(0, 4).map(hero => (
                    <div
                      key={hero.id}
                      className="vip-pvp-card rounded-2xl bg-black/45 border border-cyan-400/40 p-3 flex flex-col items-center text-center gap-1.5"
                    >
                      <img src={hero.spriteUrl} alt={hero.name} className="w-16 h-16 object-contain" />
                      <span className="text-xs font-black text-amber-300">★★★★★</span>
                      <span className="text-xs font-bold text-white line-clamp-1">{hero.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-amber-200 tabular-nums">
                    Bảo hiểm 5★: {gachaState.stdPity5 || 0}/{KNIGHT_GACHA_RATES.hardPity5}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold text-fuchsia-200 tabular-nums">
                    4★: {gachaState.stdPity4 || 0}/{KNIGHT_GACHA_RATES.hardPity4}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    data-testid="gacha-std-pull-1-btn"
                    onClick={() => startGachaPull('standard', 1)}
                    className={`px-4 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-lg ${
                      canAffordPull(1)
                        ? 'bg-cyan-50 hover:bg-cyan-100 text-zinc-950 border-cyan-300'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <div>Quay Thường x1</div>
                    <div className="text-xs font-extrabold text-cyan-800">{getCostLabel(1)}</div>
                  </button>

                  <button
                    type="button"
                    data-testid="gacha-std-pull-10-btn"
                    onClick={() => startGachaPull('standard', 10)}
                    className={`px-5 py-3 rounded-2xl border-2 text-xs sm:text-sm font-black transition shadow-xl ${
                      canAffordPull(10)
                        ? 'bg-gradient-to-r from-cyan-300 to-sky-400 hover:brightness-105 text-zinc-950 border-white'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <div>Quay Thường x10 (Chắc chắn ≥ 4★)</div>
                    <div className="text-xs font-extrabold text-zinc-900">{getCostLabel(10)}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: BUY WISH PACKS & CONCISE HISTORY
        ========================================================= */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="vip-pvp-card rounded-2xl border-2 border-cyan-400/60 bg-cyan-50/50 dark:bg-zinc-900 p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500 text-zinc-950 text-xs font-black">
                    GÓI 1 LƯỢT
                  </span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white">
                    1 Lượt Quay Gacha
                  </h4>
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

              <div className="vip-pvp-card rounded-2xl border-2 border-amber-400 bg-amber-50/50 dark:bg-zinc-900 p-4 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-black">
                    GÓI 10 LƯỢT (CHẮC CHẮN ≥ 4★)
                  </span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white">
                    10 Lượt Quay Gacha
                  </h4>
                </div>
                <button
                  type="button"
                  data-testid="buy-wish-10-vnd-btn"
                  onClick={() => onOpenWishQrCheckout?.('gacha_wish_10')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-95 text-zinc-950 text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mua 10 Lượt — {formatVndCurrency(wish10VndPrice)}</span>
                </button>
              </div>
            </div>

            <div className="vip-pvp-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                  Đổi Vàng Lấy Lượt Quay (10.000 Vàng = 1 Lượt)
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ra 3★ (Tạch) hoàn +{KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD} Vàng • Trùng 4★ hoàn +{KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD.toLocaleString('vi-VN')} Vàng • Trùng 5★ hoàn +{KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD.toLocaleString('vi-VN')} Vàng
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="exchange-gold-1-wish-btn"
                  onClick={() => onExchangeGoldForWishes?.(1)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition"
                >
                  +1 Lượt ({KNIGHT_GACHA_GOLD_SINGLE.toLocaleString('vi-VN')}🪙)
                </button>
                <button
                  type="button"
                  data-testid="exchange-gold-10-wish-btn"
                  onClick={() => onExchangeGoldForWishes?.(10)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition"
                >
                  +10 Lượt ({KNIGHT_GACHA_GOLD_TEN.toLocaleString('vi-VN')}🪙)
                </button>
              </div>
            </div>

            <div className="vip-pvp-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2 text-xs max-h-56 overflow-y-auto">
              <h4 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Lịch Sử Quay Gần Nhất ({wishHistory.length})</span>
              </h4>
              {wishHistory.length === 0 ? (
                <p className="text-zinc-400 italic">Chưa có lịch sử quay.</p>
              ) : (
                <div className="space-y-1">
                  {wishHistory.slice(0, 15).map((h, i) => (
                    <div
                      key={`${h.pullId}_${i}`}
                      className="flex items-center justify-between gap-2 py-1 border-b border-zinc-200/70 dark:border-zinc-800"
                    >
                      <span
                        className={`font-bold truncate ${
                          h.starRarity === 5
                            ? 'text-amber-600 dark:text-amber-300 font-black'
                            : h.starRarity === 4
                            ? 'text-purple-600 dark:text-fuchsia-300 font-extrabold'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        [{h.starRarity}★] {h.name}
                        {h.isRefundedHero
                          ? ` (+${h.refundGoldAmount === 10000 ? '10k' : '200k'}🪙)`
                          : h.isWhiff
                          ? ' (+500🪙)'
                          : ''}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {h.bannerType === 'standard' ? 'Thường' : 'Giới hạn'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4 (ADMIN ONLY): GRANT WISHES & SCHEDULE NEXT LIMITED HERO
        ========================================================= */}
        {isStrictAdmin && activeTab === 'admin' && (() => {
          const allAccounts = Object.entries(usersDb || {})
            .map(([uKey, uVal]) => ({
              username: uVal?.username || uKey,
              name: uVal?.name || uKey,
              isGuest: Boolean(uVal?.isGuest),
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
          const exactTarget = allAccounts.find(acc => acc.username.toLowerCase() === qTrim);

          const handleGrantSubmit = (e) => {
            e?.preventDefault();
            const targetAcc = exactTarget || (filteredAccounts.length === 1 ? filteredAccounts[0] : null);
            const cleanAmt = Math.max(1, Math.min(10000, Math.round(Number(grantAmount) || 0)));
            if (!targetAcc) {
              showToast?.('Vui lòng chọn đúng tài khoản nhận lượt quay.', 'error');
              return;
            }
            onAdminGrantGachaWishes?.({
              username: targetAcc.username,
              amount: cleanAmt,
              note: grantNote.trim()
            });
            showToast?.(`🎁 Đã trao +${cleanAmt} lượt quay cho @${targetAcc.username}!`);
            setGrantNote('');
          };

          return (
            <div className="space-y-5">
              <form
                data-testid="admin-grant-wishes-panel"
                onSubmit={handleGrantSubmit}
                className="vip-pvp-card rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-zinc-900 p-4 sm:p-5 space-y-4"
              >
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-500" />
                  <span>Trao Lượt Quay Gacha Cho Tài Khoản</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      data-testid="admin-grant-username-input"
                      value={grantTargetQuery}
                      onChange={e => setGrantTargetQuery(e.target.value)}
                      placeholder="Nhập @username hoặc tên học viên..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      data-testid="admin-grant-amount-input"
                      value={grantAmount}
                      onChange={e => setGrantAmount(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-black text-amber-600 dark:text-amber-300"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      data-testid="admin-grant-wishes-btn"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-black shadow transition flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Trao +{grantAmount} Lượt</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
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
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200'
                        }`}
                      >
                        <span>{acc.name}</span>
                        <span className="opacity-75">(@{acc.username}{isSelf ? ' • Bạn' : ''})</span>
                        <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-200 font-black text-xs">
                          {acc.wishes}🌠
                        </span>
                      </button>
                    );
                  })}
                </div>
              </form>

              {/* Schedule Next Limited Hero */}
              <div
                data-testid="admin-next-banner-panel"
                className="vip-pvp-card rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/30 dark:bg-zinc-900 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Chọn Nhân Vật 5★ Giới Hạn Tiếp Theo ({limited5Heroes.length} Nhân Vật)</span>
                  </h3>
                  <span
                    data-testid="admin-scheduled-next-hero-name"
                    className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 text-xs font-black"
                  >
                    Thứ 2 tới: {nextFeatured5Hero.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {limited5Heroes.map(hero => {
                    const isCurrentActive = featured5Hero.id === hero.id;
                    const isScheduledNext = weeklyBanner.scheduledNextHeroId === hero.id;
                    return (
                      <div
                        key={hero.id}
                        className={`vip-pvp-card p-3 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                          isScheduledNext
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400'
                            : isCurrentActive
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400'
                            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={hero.spriteUrl} alt={hero.name} className="w-12 h-12 object-contain shrink-0" />
                          <p className="text-xs font-black text-zinc-900 dark:text-white leading-snug">{hero.name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            data-testid={`admin-schedule-next-hero-${hero.id}`}
                            onClick={() => {
                              onAdminSetGachaBannerConfig?.({ nextFeaturedHeroId: hero.id });
                              showToast?.(`📌 Đã đặt "${hero.name}" cho Banner 00:00 Thứ 2 tới!`);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs font-black transition ${
                              isScheduledNext
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {isScheduledNext ? '✓ Thứ 2 Tới' : '📌 Thứ 2 Tới'}
                          </button>

                          <button
                            type="button"
                            data-testid={`admin-activate-now-hero-${hero.id}`}
                            onClick={() => {
                              onAdminSetGachaBannerConfig?.({ activeFeaturedHeroId: hero.id });
                              showToast?.(`⚡ Đã mở ngay Banner "${hero.name}"!`);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs font-black transition ${
                              isCurrentActive
                                ? 'bg-amber-400 text-zinc-950'
                                : 'bg-amber-500/15 hover:bg-amber-500 hover:text-zinc-950 text-amber-700 dark:text-amber-300'
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
