import { useEffect, useRef, useState } from 'react';
import {
  Coins,
  Crown,
  History,
  KeyRound,
  Lock,
  QrCode,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Swords,
  X
} from 'lucide-react';
import {
  formatVndCurrency,
  GACHA_WISH_10_PRICE_VND,
  GACHA_WISH_1_PRICE_VND,
  normalizePaymentConfig
} from '../../constants/profileCustomization';
import {
  KNIGHT_CHARACTER_EVENT_BANNERS,
  KNIGHT_CHARACTER_SKINS,
  KNIGHT_DUPLICATE_HERO_REFUND_GOLD,
  KNIGHT_GACHA_GOLD_SINGLE,
  KNIGHT_GACHA_GOLD_TEN,
  KNIGHT_GACHA_RATES,
  KNIGHT_GACHA_WEAPONS,
  REVIVE_KEY_GOLD_PRICE
} from '../../constants/knightRpgData';

function playGachaWishSound(maxRarity = 3, allWhiff = false) {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const playTone = (freq, startOffset, duration, type = 'sine', gainPeak = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.03);
    };

    if (maxRarity === 5) {
      [392, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98].forEach((f, idx) => {
        playTone(f, idx * 0.09, 0.75, 'triangle', 0.13);
      });
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f => {
        playTone(f, 0.72, 1.25, 'sine', 0.11);
      });
    } else if (maxRarity === 4) {
      [329.63, 440, 523.25, 659.25, 880, 1046.5].forEach((f, idx) => {
        playTone(f, idx * 0.085, 0.65, 'triangle', 0.11);
      });
    } else if (allWhiff) {
      playTone(349.23, 0, 0.35, 'sawtooth', 0.06);
      playTone(233.08, 0.22, 0.55, 'sine', 0.08);
    } else {
      playTone(523.25, 0, 0.35, 'sine', 0.09);
      playTone(659.25, 0.12, 0.45, 'triangle', 0.09);
      playTone(783.99, 0.25, 0.55, 'sine', 0.08);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2400);
  } catch {}
}

function renderStars(count = 3) {
  return '★'.repeat(Math.max(1, Math.min(5, count)));
}

export default function KnightGachaModal({
  isOpen,
  isStrictAdmin = false,
  rpgProfile,
  paymentConfig = null,
  onClose,
  onExecutePull,
  onAdminResetHeroes = null,
  onEquipSkin,
  onEquipWeapon,
  onExchangeGoldForWishes,
  onBuyReviveKeyWithGold,
  onOpenWishQrCheckout,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('character_event');
  const [selectedBannerId, setSelectedBannerId] = useState(KNIGHT_CHARACTER_EVENT_BANNERS[0].id);
  const [cutscene, setCutscene] = useState(null);
  const meteorTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (meteorTimerRef.current) clearTimeout(meteorTimerRef.current);
    };
  }, []);

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
  const wishHistory = Array.isArray(rpgProfile?.wishHistory) ? rpgProfile.wishHistory : [];

  const activeBannerMeta =
    KNIGHT_CHARACTER_EVENT_BANNERS.find(b => b.id === selectedBannerId) ||
    KNIGHT_CHARACTER_EVENT_BANNERS[0];
  const featured5Hero =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === activeBannerMeta.featuredHeroId) ||
    KNIGHT_CHARACTER_SKINS[KNIGHT_CHARACTER_SKINS.length - 1];
  const featured4Heroes = KNIGHT_CHARACTER_SKINS.filter(s =>
    activeBannerMeta.featured4StarIds.includes(s.id)
  );

  const startGachaPull = (bannerType, count) => {
    const res = onExecutePull?.({
      bannerType,
      bannerId: activeBannerMeta.id,
      count
    });
    if (!res || !res.ok) return;

    if (meteorTimerRef.current) clearTimeout(meteorTimerRef.current);
    playGachaWishSound(res.maxRarity, res.allWhiff);

    setCutscene({
      phase: 'meteor',
      results: res.results,
      maxRarity: res.maxRarity,
      allWhiff: res.allWhiff,
      revealIdx: 0
    });

    meteorTimerRef.current = setTimeout(() => {
      setCutscene(prev => {
        if (!prev || prev.phase !== 'meteor') return prev;
        return {
          ...prev,
          phase: prev.results.length === 1 ? 'summary' : 'reveal',
          revealIdx: 0
        };
      });
    }, 1750);
  };

  const skipCutsceneToSummary = () => {
    if (meteorTimerRef.current) clearTimeout(meteorTimerRef.current);
    setCutscene(prev => (prev ? { ...prev, phase: 'summary' } : null));
  };

  const advanceRevealCard = () => {
    setCutscene(prev => {
      if (!prev) return null;
      if (prev.revealIdx + 1 < prev.results.length) {
        return { ...prev, revealIdx: prev.revealIdx + 1 };
      }
      return { ...prev, phase: 'summary' };
    });
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

  return (
    <div
      data-testid="knight-skin-shop-modal"
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      {/* SHOOTING-STAR GACHA CUTSCENE OVERLAY */}
      {cutscene && (
        <div
          data-testid="knight-gacha-cutscene"
          data-rarity={String(cutscene.maxRarity)}
          data-phase={cutscene.phase}
          className={`fixed inset-0 z-[70] flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto select-none ${
            cutscene.maxRarity === 5
              ? 'bg-gradient-to-br from-[#1f1200] via-[#451a03] to-[#090d16]'
              : cutscene.maxRarity === 4
              ? 'bg-gradient-to-br from-[#1e0936] via-[#3b0764] to-[#090d16]'
              : cutscene.allWhiff
              ? 'bg-gradient-to-br from-[#090d16] via-[#1e293b] to-[#020617]'
              : 'bg-gradient-to-br from-[#04162d] via-[#0c4a6e] to-[#090d16]'
          }`}
        >
          <div className="w-full max-w-5xl flex items-center justify-between z-20">
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border shadow-lg ${
                cutscene.maxRarity === 5
                  ? 'bg-amber-400/20 border-amber-300 text-amber-200'
                  : cutscene.maxRarity === 4
                  ? 'bg-fuchsia-500/20 border-fuchsia-300 text-fuchsia-200'
                  : cutscene.allWhiff
                  ? 'bg-slate-700/60 border-slate-400 text-slate-200'
                  : 'bg-sky-500/20 border-sky-300 text-sky-200'
              }`}
            >
              {cutscene.maxRarity === 5
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

          {cutscene.phase === 'meteor' && (
            <div
              onClick={skipCutsceneToSummary}
              className="flex-1 w-full flex flex-col items-center justify-center relative cursor-pointer overflow-hidden"
            >
              <style>{`
                @keyframes gachaMeteorFly {
                  0% { transform: translate(-42vw, -36vh) scale(0.45) rotate(32deg); opacity: 0.2; }
                  45% { opacity: 1; }
                  85% { transform: translate(8vw, 6vh) scale(1.35) rotate(32deg); opacity: 1; }
                  100% { transform: translate(22vw, 18vh) scale(2.4) rotate(32deg); opacity: 0; }
                }
                @keyframes gachaBurstPulse {
                  0%, 55% { transform: scale(0.1); opacity: 0; }
                  78% { transform: scale(1.25); opacity: 0.95; }
                  100% { transform: scale(2.6); opacity: 0; }
                }
              `}</style>

              <div className="absolute inset-0 pointer-events-none opacity-65">
                {Array.from({ length: 22 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                      width: `${(idx % 3) + 2}px`,
                      height: `${(idx % 3) + 2}px`,
                      left: `${(idx * 17) % 96}%`,
                      top: `${(idx * 29) % 92}%`,
                      animationDelay: `${(idx % 5) * 0.2}s`
                    }}
                  />
                ))}
              </div>

              <div
                style={{ animation: 'gachaMeteorFly 1.7s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                className="relative flex items-center"
              >
                <div
                  className={`w-64 sm:w-96 h-3 sm:h-4 rounded-full blur-[2px] ${
                    cutscene.maxRarity === 5
                      ? 'bg-gradient-to-r from-transparent via-amber-300 to-yellow-100 shadow-[0_0_45px_#fbbf24]'
                      : cutscene.maxRarity === 4
                      ? 'bg-gradient-to-r from-transparent via-fuchsia-400 to-purple-100 shadow-[0_0_40px_#c084fc]'
                      : cutscene.allWhiff
                      ? 'bg-gradient-to-r from-transparent via-slate-500 to-slate-300'
                      : 'bg-gradient-to-r from-transparent via-sky-400 to-cyan-100 shadow-[0_0_35px_#38bdf8]'
                  }`}
                />
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 -ml-4 rounded-full flex items-center justify-center ${
                    cutscene.maxRarity === 5
                      ? 'bg-amber-200 shadow-[0_0_80px_25px_rgba(251,191,36,0.95)] ring-4 ring-yellow-100'
                      : cutscene.maxRarity === 4
                      ? 'bg-fuchsia-200 shadow-[0_0_70px_20px_rgba(192,132,252,0.9)] ring-4 ring-purple-100'
                      : cutscene.allWhiff
                      ? 'bg-slate-300 shadow-[0_0_30px_8px_rgba(148,163,184,0.6)]'
                      : 'bg-cyan-100 shadow-[0_0_60px_18px_rgba(56,189,248,0.85)] ring-4 ring-sky-100'
                  }`}
                >
                  <Sparkles
                    className={`w-7 h-7 ${
                      cutscene.maxRarity === 5
                        ? 'text-amber-700'
                        : cutscene.maxRarity === 4
                        ? 'text-purple-800'
                        : 'text-sky-800'
                    }`}
                  />
                </div>
              </div>

              <div
                style={{ animation: 'gachaBurstPulse 1.75s ease-out forwards' }}
                className={`absolute w-64 h-64 rounded-full border-4 pointer-events-none ${
                  cutscene.maxRarity === 5
                    ? 'border-amber-300 bg-amber-400/25 shadow-[0_0_120px_#fbbf24]'
                    : cutscene.maxRarity === 4
                    ? 'border-fuchsia-300 bg-purple-500/25 shadow-[0_0_100px_#c084fc]'
                    : cutscene.allWhiff
                    ? 'border-slate-400 bg-slate-500/20'
                    : 'border-sky-300 bg-sky-400/20 shadow-[0_0_90px_#38bdf8]'
                }`}
              />
            </div>
          )}

          {cutscene.phase === 'reveal' && cutscene.results[cutscene.revealIdx] && (() => {
            const item = cutscene.results[cutscene.revealIdx];
            return (
              <div
                onClick={advanceRevealCard}
                className="flex-1 w-full max-w-xl flex flex-col items-center justify-center text-center gap-4 cursor-pointer py-4"
              >
                <div
                  className={`relative p-6 sm:p-8 rounded-3xl border-2 w-full shadow-2xl transition-all ${
                    item.starRarity === 5
                      ? 'bg-gradient-to-b from-amber-500/25 via-amber-950/80 to-slate-950 border-amber-300 shadow-[0_0_70px_rgba(251,191,36,0.5)]'
                      : item.starRarity === 4
                      ? 'bg-gradient-to-b from-purple-500/25 via-purple-950/80 to-slate-950 border-fuchsia-400 shadow-[0_0_55px_rgba(192,132,252,0.45)]'
                      : item.isWhiff
                      ? 'bg-gradient-to-b from-slate-800/80 to-slate-950 border-slate-500'
                      : 'bg-gradient-to-b from-sky-500/20 via-slate-900 to-slate-950 border-sky-400 shadow-[0_0_40px_rgba(56,189,248,0.3)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-black text-white/75">
                      Lượt {cutscene.revealIdx + 1} / {cutscene.results.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.isNew && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">
                          MỚI!
                        </span>
                      )}
                      {item.isRefundedHero && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[11px] font-black">
                          +{KNIGHT_DUPLICATE_HERO_REFUND_GOLD.toLocaleString('vi-VN')} Vàng
                        </span>
                      )}
                      {item.isWhiff && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black">
                          TẠCH
                        </span>
                      )}
                      {item.rateOutcome === 'lost_50_50' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-black">
                          Lệch 50/50 (Kế tiếp 100% UP)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-3xl flex items-center justify-center p-2 bg-black/40 border border-white/15 shadow-inner">
                    <img
                      src={item.spriteUrl}
                      alt={item.name}
                      className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
                    />
                  </div>

                  <p
                    className={`mt-3 text-lg sm:text-2xl font-black tracking-wider ${
                      item.starRarity === 5
                        ? 'text-amber-300'
                        : item.starRarity === 4
                        ? 'text-fuchsia-300'
                        : item.isWhiff
                        ? 'text-slate-400'
                        : 'text-sky-300'
                    }`}
                  >
                    {renderStars(item.starRarity)}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">{item.name}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto">{item.passiveText}</p>
                  {item.bonusText && (
                    <p className="mt-2 inline-block px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-extrabold">
                      {item.bonusText}
                    </p>
                  )}
                </div>

                <p className="text-xs font-bold text-white/80">
                  Chạm để xem tiếp ({cutscene.revealIdx + 1}/{cutscene.results.length}) ▸
                </p>
              </div>
            );
          })()}

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
                {cutscene.results.map(item => (
                  <div
                    key={item.pullId}
                    data-testid={`gacha-result-card-${item.starRarity}`}
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
                        {renderStars(item.starRarity)}
                      </span>
                      {item.isNew ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[9px] font-black">
                          MỚI
                        </span>
                      ) : item.isRefundedHero ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-300 text-slate-950 text-[9px] font-black">
                          +200K VÀNG
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
                      <p className="text-[10px] text-amber-200/90 line-clamp-2">{item.bonusText || item.passiveText}</p>
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
            5★: 0.6% (bảo hiểm 90 lượt) • 4★: 5.1% (bảo hiểm 10 lượt) • Nhân vật cũ / &gt;1 nhân vật trong 10 lượt hoàn 200.000 Vàng
          </div>
        </div>
      )}

      {/* MAIN MODAL */}
      <div className="max-w-5xl w-full rounded-3xl border border-amber-300/70 dark:border-amber-400/35 bg-white dark:bg-[#0B1020] text-[#0F172B] dark:text-white p-4 sm:p-6 space-y-4 max-h-[93vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-[#0F172B] dark:text-white">
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
              10.000 Vàng / 1 lượt • Trùng nhân vật cũ hoặc ra trên 1 nhân vật trong 10 lượt được hoàn trả 200.000 Vàng.
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
                title="Reset danh sách nhân vật đã mở về mặc định để test quay lại từ đầu"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            <span>Banner Nhân Vật</span>
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
            <span>Tủ Đồ ({unlockedSkins.length}/10)</span>
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
        </div>

        {/* TAB 1: CHARACTER BANNER */}
        {activeTab === 'character_event' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {KNIGHT_CHARACTER_EVENT_BANNERS.map(b => {
                  const hero = KNIGHT_CHARACTER_SKINS.find(s => s.id === b.featuredHeroId);
                  const active = b.id === activeBannerMeta.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBannerId(b.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 transition ${
                        active
                          ? 'bg-amber-100 dark:bg-amber-500/25 border-amber-400 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/50'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400/50'
                      }`}
                    >
                      <img src={hero?.spriteUrl} alt={hero?.name} className="w-5 h-5 object-contain" />
                      <span>{hero?.name}</span>
                    </button>
                  );
                })}
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
                    BANNER NHÂN VẬT TĂNG TỈ LỆ
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-amber-200 leading-tight">
                    {featured5Hero.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Quay 10 lượt chắc chắn có vật phẩm ≥ 4★. Nổ 5★ có 50% trúng nhân vật tâm điểm (nếu lệch, lần 5★ kế tiếp chắc chắn trúng).
                  </p>

                  <div className="p-3.5 rounded-2xl bg-black/45 border border-amber-400/40 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-amber-300 font-black text-sm">⭐⭐⭐⭐⭐ {featured5Hero.name}</span>
                    </div>
                    <p className="text-xs text-amber-100 font-bold">🗡️ {featured5Hero.weaponName}</p>
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
                      {unlockedSkins.includes(featured5Hero.id) ? 'ĐÃ SỞ HỮU' : 'CHƯA SỞ HỮU'}
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
                      {gachaState.charGuaranteed5 ? 'Bảo hiểm 100% UP' : 'Tỉ lệ 50/50'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    5★: 0.6% • 4★: 5.1% • 3★: 94.3% • Trùng nhân vật hoàn 200.000 Vàng
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

        {/* TAB 2: STANDARD BANNER */}
        {activeTab === 'standard' && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-400/60 bg-gradient-to-br from-[#0c1938] via-[#1e1b4b] to-[#090d16] text-white p-5 sm:p-7 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 border border-cyan-300/60 text-cyan-200 text-xs font-black">
                    BANNER THƯỜNG
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-cyan-200 leading-tight">
                    Vòng Quay Thường (Nhân Vật &amp; Vũ Khí)
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Không có bảo hiểm UP 50/50 và có tỉ lệ tạch Gacha ở bậc 3★ (hoàn 250 Vàng). Vẫn đảm bảo 10 lượt ≥ 4★ và 90 lượt nổ 5★.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {KNIGHT_CHARACTER_SKINS.filter(s => s.obtainMethod === 'gacha' && s.starRarity === 5).map(h => (
                      <span
                        key={h.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-amber-300/40 text-xs font-bold text-amber-200"
                      >
                        <img src={h.spriteUrl} alt={h.name} className="w-5 h-5 object-contain" />
                        <span>5★ {h.name}</span>
                      </span>
                    ))}
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
                    Có tỉ lệ tạch Gacha
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

        {/* TAB 3: INVENTORY (NO C1-C6, NO DIRECT BUY) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Nhân Vật ({unlockedSkins.length}/{KNIGHT_CHARACTER_SKINS.length})</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Mở khóa qua Gacha • Trùng nhân vật hoàn 200.000 Vàng
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {KNIGHT_CHARACTER_SKINS.map(skin => {
                  const unlocked = unlockedSkins.includes(skin.id);
                  const equipped = rpgProfile.equippedSkin === skin.id;
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
                            background: `radial-gradient(circle at 50% 45%, ${skin.bladeColor}40, #090d16 78%)`,
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
                              skin.starRarity === 5
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {skin.starRarity}★
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-[#0F172B] dark:text-white">
                              {skin.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
                              {skin.genderBadge}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                            🗡️ {skin.weaponName}
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-slate-300 leading-snug">
                            {skin.passiveText}
                          </p>
                        </div>
                      </div>

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
                          {equipped ? '✓ Đang Trang Bị' : 'Trang Bị'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`locked-gacha-hero-btn-${skin.id}`}
                          onClick={() => {
                            setActiveTab('character_event');
                            showToast?.('Nhân vật mở khóa qua vòng quay Gacha!', 'info');
                          }}
                          className="w-full py-2 rounded-xl text-xs font-black bg-slate-200/80 hover:bg-amber-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-300 border border-dashed border-amber-400/50 inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Chưa sở hữu • Quay Gacha</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#0F172B] dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-fuchsia-500" />
                  <span>Vũ Khí 4★ &amp; 3★ ({unlockedWeapons.length}/{KNIGHT_GACHA_WEAPONS.length})</span>
                </h3>
                {rpgProfile.equippedWeapon && (
                  <button
                    type="button"
                    onClick={() => onEquipWeapon?.(null)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 underline"
                  >
                    Gỡ vũ khí
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KNIGHT_GACHA_WEAPONS.map(wp => {
                  const owned = unlockedWeapons.includes(wp.id);
                  const isEquipped = rpgProfile.equippedWeapon === wp.id;
                  return (
                    <div
                      key={wp.id}
                      data-testid={`knight-weapon-card-${wp.id}`}
                      className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                        isEquipped
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
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              wp.starRarity === 4
                                ? 'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300'
                                : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            {renderStars(wp.starRarity)}
                          </span>
                          <p className="text-xs font-black text-[#0F172B] dark:text-white truncate mt-0.5">
                            {wp.name}
                          </p>
                          <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-tight">
                            {wp.passiveText}
                          </p>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          onClick={() => onEquipWeapon?.(wp)}
                          className={`w-full py-1.5 rounded-xl text-xs font-black transition ${
                            isEquipped
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                          }`}
                        >
                          {isEquipped ? '✓ Đang Trang Bị' : 'Trang Bị'}
                        </button>
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

        {/* TAB 4: BUY WISH PACKS & HISTORY */}
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
                  Tỉ Lệ Vòng Quay
                </h4>
                <ul className="space-y-1.5 text-[#334155] dark:text-slate-300 leading-relaxed">
                  <li>• <b>5★ Nhân vật:</b> 0.6% cơ bản (tăng từ lượt 74, chắc chắn nổ ở lượt 90).</li>
                  <li>• <b>4★ Nhân vật &amp; Vũ khí:</b> 5.1% cơ bản (mỗi 10 lượt chắc chắn có ≥ 4★).</li>
                  <li>• <b>3★ Vũ khí / Tạch:</b> 94.3% cơ bản (Banner Thường có tỉ lệ tạch hoàn 250 Vàng).</li>
                  <li>• <b>Hoàn Vàng:</b> Quay trúng nhân vật cũ hoặc ra trên 1 nhân vật trong 10 lượt hoàn ngay <b>200.000 Vàng</b>.</li>
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
                          [{h.starRarity}★] {h.name}{h.isRefundedHero ? ' (+200k Vàng)' : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {h.bannerType === 'standard' ? 'Thường' : 'Nhân vật'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
