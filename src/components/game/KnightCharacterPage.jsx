import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Crown,
  Lock,
  Music,
  QrCode,
  Settings,
  Sparkles,
  Users,
  VolumeX
} from 'lucide-react';
import { KNIGHT_CHARACTER_SKINS } from '../../constants/knightRpgData';

function playRosterUiSfx(kind = 'select', muted = false) {
  if (muted || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const tone = (freq, start, dur, type = 'triangle', peak = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(peak, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };
    if (kind === 'equip') {
      tone(523.25, 0, 0.14, 'triangle', 0.12);
      tone(659.25, 0.07, 0.16, 'triangle', 0.13);
      tone(1046.5, 0.15, 0.32, 'sine', 0.15);
    } else {
      tone(659.25, 0, 0.09, 'sine', 0.08);
      tone(880, 0.05, 0.12, 'triangle', 0.08);
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 650);
  } catch {}
}

export default function KnightCharacterPage({
  bgmMuted = false,
  isStrictAdmin = false,
  onBackToHub,
  onEquipSkin,
  onOpenGachaTab,
  onToggleBgm,
  rpgProfile,
  showToast
}) {
  const unlockedSkins = useMemo(
    () =>
      isStrictAdmin
        ? KNIGHT_CHARACTER_SKINS.map(s => s.id)
        : Array.isArray(rpgProfile?.unlockedSkins)
        ? rpgProfile.unlockedSkins
        : ['knight_arthur'],
    [isStrictAdmin, rpgProfile?.unlockedSkins]
  );

  const equippedId = rpgProfile?.equippedSkin || 'knight_arthur';
  const [filterPool, setFilterPool] = useState('all'); // 'all' | 'limited' | 'standard5' | 'meme4' | 'owned'
  const [previewId, setPreviewId] = useState(equippedId);

  const filteredSkins = useMemo(() => {
    return KNIGHT_CHARACTER_SKINS.filter(s => {
      if (filterPool === 'limited') return s.pool === 'limited';
      if (filterPool === 'standard5') return s.pool === 'standard' && s.starRarity === 5;
      if (filterPool === 'meme4') return s.starRarity === 4;
      if (filterPool === 'owned') return unlockedSkins.includes(s.id);
      return true;
    });
  }, [filterPool, unlockedSkins]);

  const previewHero = useMemo(
    () =>
      KNIGHT_CHARACTER_SKINS.find(s => s.id === previewId) ||
      KNIGHT_CHARACTER_SKINS.find(s => s.id === equippedId) ||
      KNIGHT_CHARACTER_SKINS[0],
    [previewId, equippedId]
  );

  const isPreviewOwned = unlockedSkins.includes(previewHero.id);
  const isPreviewEquipped = equippedId === previewHero.id;

  const limitedCount = KNIGHT_CHARACTER_SKINS.filter(s => s.pool === 'limited').length;
  const standard5Count = KNIGHT_CHARACTER_SKINS.filter(s => s.pool === 'standard' && s.starRarity === 5).length;
  const meme4Count = KNIGHT_CHARACTER_SKINS.filter(s => s.starRarity === 4).length;

  return (
    <div
      data-testid="knight-characters-page"
      className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-5"
    >
      {/* Clean Page Top Bar */}
      <div
        data-testid="knight-skin-shop-modal"
        className="vip-pvp-card rounded-3xl bg-white dark:bg-[#14151C] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-5 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="close-knight-gacha-modal-btn"
              onClick={onBackToHub}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-extrabold inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Về Sảnh Chính
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Users className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                  Nhân Vật
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-xs font-black tabular-nums">
                  {unlockedSkins.length} / {KNIGHT_CHARACTER_SKINS.length}
                </span>
                {isStrictAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                    Admin: Mở Toàn Bộ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Cross-Navigation to Gacha Page & BGM */}
          <div className="flex items-center gap-2 flex-wrap">
            {onToggleBgm && (
              <button
                type="button"
                onClick={onToggleBgm}
                className={`px-3 py-2 rounded-xl border text-xs font-extrabold inline-flex items-center gap-1.5 transition ${
                  bgmMuted
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                    : 'bg-violet-50 dark:bg-violet-500/15 border-violet-300 dark:border-violet-400/40 text-violet-700 dark:text-violet-200'
                }`}
              >
                {bgmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                <span>{bgmMuted ? 'Nhạc: Tắt' : 'Nhạc: Sảnh Nhân Vật'}</span>
              </button>
            )}

            <button
              type="button"
              data-testid="gacha-tab-character"
              onClick={() => onOpenGachaTab?.('character_event')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vòng Quay Gacha</span>
            </button>

            <button
              type="button"
              data-testid="gacha-tab-shop"
              onClick={() => onOpenGachaTab?.('shop')}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mua Lượt</span>
            </button>

            {isStrictAdmin && (
              <button
                type="button"
                data-testid="gacha-tab-admin"
                onClick={() => onOpenGachaTab?.('admin')}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40 text-xs font-black inline-flex items-center gap-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Quản Trị</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Hero Spotlight Card */}
        <div className="vip-pvp-card rounded-3xl bg-gradient-to-br from-[#141322] via-[#181824] to-[#231528] border border-amber-400/40 p-5 text-white grid grid-cols-1 md:grid-cols-12 gap-5 items-center shadow-md">
          <div className="md:col-span-4 flex items-center justify-center">
            <div
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl border-2 p-3 flex items-center justify-center relative overflow-hidden shadow-[0_0_45px_rgba(251,191,36,0.22)]"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${previewHero.bladeColor || '#fbbf24'}44, #090d16 80%)`,
                borderColor: previewHero.pool === 'limited' ? '#fbbf24' : previewHero.starRarity === 5 ? '#38bdf8' : '#c084fc'
              }}
            >
              <img
                src={previewHero.spriteUrl}
                alt={previewHero.name}
                className={`w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)] transition-transform duration-300 ${
                  isPreviewOwned ? 'scale-105' : 'grayscale opacity-75'
                }`}
              />
              <span
                className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-black ${
                  previewHero.pool === 'limited'
                    ? 'bg-amber-400 text-zinc-950'
                    : previewHero.starRarity === 5
                    ? 'bg-cyan-300 text-zinc-950'
                    : 'bg-purple-500 text-white'
                }`}
              >
                {previewHero.pool === 'limited'
                  ? '5★ GIỚI HẠN'
                  : `${previewHero.starRarity}★`}
              </span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-300 text-sm font-black tracking-wider">
                {'★'.repeat(previewHero.starRarity || 4)}
              </span>
              {isPreviewEquipped && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-zinc-950 text-xs font-black">
                  ✓ ĐANG XUẤT CHIẾN
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {previewHero.name}
            </h3>

            {previewHero.memeQuote && (
              <p className="text-xs sm:text-sm italic text-amber-200/95 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5">
                {previewHero.memeQuote}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200">
                ⚡ {previewHero.passiveText}
              </span>
            </div>

            <div className="pt-1">
              {isPreviewOwned ? (
                <button
                  type="button"
                  onClick={() => {
                    playRosterUiSfx('equip', bgmMuted);
                    onEquipSkin?.(previewHero);
                  }}
                  className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition inline-flex items-center gap-2 shadow-lg ${
                    isPreviewEquipped
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-gradient-to-r from-amber-400 to-rose-500 hover:opacity-95 text-zinc-950'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isPreviewEquipped ? 'Đang Xuất Chiến' : 'Trang Bị Xuất Chiến'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenGachaTab?.(previewHero.pool === 'limited' ? 'character_event' : 'standard');
                    showToast?.(
                      previewHero.pool === 'limited'
                        ? 'Nhân vật 5★ Giới Hạn mở khóa tại Banner Giới Hạn hàng tuần!'
                        : 'Nhân vật mở khóa tại Vòng Quay Gacha!',
                      'info'
                    );
                  }}
                  className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-400/50 text-xs sm:text-sm font-black transition inline-flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Quay Gacha Để Mở Khóa →</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: `Tất cả (${KNIGHT_CHARACTER_SKINS.length})` },
            { id: 'limited', label: `👑 5★ Giới Hạn (${limitedCount})` },
            { id: 'standard5', label: `⭐ 5★ Thường (${standard5Count})` },
            { id: 'meme4', label: `🎭 4★ Meme (${meme4Count})` },
            { id: 'owned', label: `✓ Đã sở hữu (${unlockedSkins.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPool(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition ${
                filterPool === tab.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Character Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSkins.map(skin => {
            const unlocked = unlockedSkins.includes(skin.id);
            const equipped = equippedId === skin.id;
            const isSelected = previewHero.id === skin.id;

            return (
              <div
                key={skin.id}
                data-testid={`knight-skin-card-${skin.id}`}
                onClick={() => {
                  playRosterUiSfx('select', bgmMuted);
                  setPreviewId(skin.id);
                }}
                className={`vip-pvp-card cursor-pointer p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                  equipped
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400'
                    : isSelected
                    ? 'bg-amber-50/70 dark:bg-zinc-800/90 border-amber-400'
                    : unlocked
                    ? 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-amber-400/60'
                    : 'bg-zinc-50/80 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800/80 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-18 h-18 rounded-2xl flex items-center justify-center border p-1.5 shrink-0 relative overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 50% 45%, ${skin.bladeColor || '#fbbf24'}35, #090d16 80%)`,
                      borderColor: skin.pool === 'limited' ? '#fbbf24' : skin.starRarity === 5 ? '#38bdf8' : '#a855f7'
                    }}
                  >
                    <img
                      src={skin.spriteUrl}
                      alt={skin.name}
                      className={`w-14 h-14 object-contain ${unlocked ? '' : 'grayscale opacity-65'}`}
                    />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-black leading-none ${
                        skin.pool === 'limited'
                          ? 'bg-amber-400 text-zinc-950'
                          : skin.starRarity === 5
                          ? 'bg-cyan-300 text-zinc-950'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {skin.pool === 'limited' ? '5★GH' : `${skin.starRarity}★`}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                      {skin.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">
                      {skin.passiveText}
                    </p>
                  </div>
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      playRosterUiSfx('equip', bgmMuted);
                      onEquipSkin?.(skin);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-black transition ${
                      equipped
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-100 hover:bg-amber-400 hover:text-zinc-950 dark:bg-zinc-800 dark:hover:bg-amber-400 dark:hover:text-zinc-950 text-zinc-900 dark:text-white'
                    }`}
                  >
                    {equipped ? '✓ Đang Xuất Chiến' : 'Trang Bị'}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid={`locked-gacha-hero-btn-${skin.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      onOpenGachaTab?.(skin.pool === 'limited' ? 'character_event' : 'standard');
                    }}
                    className="w-full py-2 rounded-xl text-xs font-black bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-amber-300 border border-dashed border-amber-400/50 inline-flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{skin.pool === 'limited' ? 'Banner Giới Hạn' : 'Quay Gacha'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
