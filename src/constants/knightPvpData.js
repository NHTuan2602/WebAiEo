// ==========================================
// KNIGHT & DRAGON 1v1 PVP ARENA ("ĐẤU TRƯỜNG 1 VS 1")
// Stealth Ranked Matchmaking Opponents (Zero NPC labels),
// Casual 1v1 Friend Rooms, 5s Wrong-Answer Freeze, & 2-2 Mysterious Entity Wheel
// ==========================================

import { KNIGHT_CHARACTER_SKINS } from './knightRpgData.js';

export const KNIGHT_PVP_LIVES_PER_ROUND = 3;
export const KNIGHT_PVP_FREEZE_MS = 5000;
export const KNIGHT_PVP_TOTAL_ROUNDS = 4;
export const KNIGHT_PVP_READY_CHECK_SEC = 10;

export const KNIGHT_PVP_RANK_TIERS = [
  {
    id: 'rookie',
    minRp: 0,
    maxRp: 199,
    label: 'Tân Binh Đấu Trường',
    shortLabel: 'Tân Binh',
    icon: '🛡️',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    winRp: 35,
    lossRp: 8,
    goldWin: 160
  },
  {
    id: 'fighter',
    minRp: 200,
    maxRp: 449,
    label: 'Đấu Sĩ Tinh Anh',
    shortLabel: 'Đấu Sĩ',
    icon: '⚔️',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50',
    winRp: 32,
    lossRp: 12,
    goldWin: 210
  },
  {
    id: 'master',
    minRp: 450,
    maxRp: 799,
    label: 'Cao Thủ Song Đấu',
    shortLabel: 'Cao Thủ',
    icon: '🔥',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/50',
    winRp: 30,
    lossRp: 15,
    goldWin: 260
  },
  {
    id: 'grandmaster',
    minRp: 800,
    maxRp: 1199,
    label: 'Đại Cao Thủ 1v1',
    shortLabel: 'Đại Cao Thủ',
    icon: '👑',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
    winRp: 28,
    lossRp: 18,
    goldWin: 320
  },
  {
    id: 'overlord',
    minRp: 1200,
    maxRp: Infinity,
    label: 'Bá Chủ Đối Kháng',
    shortLabel: 'Bá Chủ',
    icon: '🐉',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-500/25 dark:text-rose-100 dark:border-rose-400/70',
    winRp: 26,
    lossRp: 20,
    goldWin: 400
  }
];

export function getKnightPvpRankTier(rp = 0) {
  const cleanRp = Math.max(0, Math.floor(Number(rp) || 0));
  for (let i = KNIGHT_PVP_RANK_TIERS.length - 1; i >= 0; i -= 1) {
    if (cleanRp >= KNIGHT_PVP_RANK_TIERS[i].minRp) {
      return KNIGHT_PVP_RANK_TIERS[i];
    }
  }
  return KNIGHT_PVP_RANK_TIERS[0];
}

// Stealth scaling opponents: realistic student/player names, ZERO "NPC" clues anywhere!
export const KNIGHT_PVP_NPCS = [
  {
    id: 'duel_minh_khoi',
    name: 'Minh Khôi',
    tierId: 'rookie',
    minRp: 0,
    rpDisplay: 85,
    skinId: 'knight_arthur',
    weaponId: '',
    titleLabel: '🛡️ Tân Binh Đấu Trường',
    minDelayMs: 6200,
    maxDelayMs: 9500,
    accuracy: 0.60,
    typingCps: 1.9
  },
  {
    id: 'duel_bao_ngoc',
    name: 'Bảo Ngọc',
    tierId: 'rookie',
    minRp: 0,
    rpDisplay: 145,
    skinId: 'crying_banana_cat',
    weaponId: '',
    titleLabel: '🛡️ Tân Binh Đấu Trường',
    minDelayMs: 5600,
    maxDelayMs: 8700,
    accuracy: 0.64,
    typingCps: 2.2
  },
  {
    id: 'duel_hoang_nam',
    name: 'Hoàng Nam',
    tierId: 'fighter',
    minRp: 200,
    rpDisplay: 290,
    skinId: 'cheems_bonk',
    weaponId: '',
    titleLabel: '⚔️ Đấu Sĩ Tinh Anh',
    minDelayMs: 4500,
    maxDelayMs: 7100,
    accuracy: 0.72,
    typingCps: 2.9
  },
  {
    id: 'duel_phuong_thao',
    name: 'Phương Thảo',
    tierId: 'fighter',
    minRp: 200,
    rpDisplay: 395,
    skinId: 'stonks_meme_man',
    weaponId: '',
    titleLabel: '⚔️ Đấu Sĩ Tinh Anh',
    minDelayMs: 4100,
    maxDelayMs: 6600,
    accuracy: 0.76,
    typingCps: 3.2
  },
  {
    id: 'duel_gia_huy',
    name: 'Gia Huy',
    tierId: 'master',
    minRp: 450,
    rpDisplay: 560,
    skinId: 'pepe_wizard',
    weaponId: '',
    titleLabel: '🔥 Cao Thủ Song Đấu',
    minDelayMs: 3300,
    maxDelayMs: 5400,
    accuracy: 0.82,
    typingCps: 3.9
  },
  {
    id: 'duel_khanh_linh',
    name: 'Khánh Linh',
    tierId: 'master',
    minRp: 450,
    rpDisplay: 710,
    skinId: 'buff_doge_titan',
    weaponId: '',
    titleLabel: '🔥 Cao Thủ Song Đấu',
    minDelayMs: 3000,
    maxDelayMs: 4900,
    accuracy: 0.85,
    typingCps: 4.3
  },
  {
    id: 'duel_tuan_kiet',
    name: 'Tuấn Kiệt',
    tierId: 'grandmaster',
    minRp: 800,
    rpDisplay: 940,
    skinId: 'capybara_chill_minister',
    weaponId: '',
    titleLabel: '👑 Đại Cao Thủ 1v1',
    minDelayMs: 2400,
    maxDelayMs: 4100,
    accuracy: 0.89,
    typingCps: 5.0
  },
  {
    id: 'duel_thao_vy',
    name: 'Thảo Vy',
    tierId: 'grandmaster',
    minRp: 800,
    rpDisplay: 1110,
    skinId: 'pedro_spinning_raccoon',
    weaponId: '',
    titleLabel: '👑 Đại Cao Thủ 1v1',
    minDelayMs: 2200,
    maxDelayMs: 3800,
    accuracy: 0.91,
    typingCps: 5.4
  },
  {
    id: 'duel_quoc_anh',
    name: 'Quốc Anh',
    tierId: 'overlord',
    minRp: 1200,
    rpDisplay: 1450,
    skinId: 'gigachad_knight',
    weaponId: '',
    titleLabel: '🐉 Bá Chủ Đối Kháng',
    minDelayMs: 1850,
    maxDelayMs: 3200,
    accuracy: 0.94,
    typingCps: 6.2
  },
  {
    id: 'duel_hai_dang',
    name: 'Hải Đăng',
    tierId: 'overlord',
    minRp: 1200,
    rpDisplay: 1680,
    skinId: 'patrick_sigma_suit',
    weaponId: '',
    titleLabel: '🐉 Bá Chủ Đối Kháng',
    minDelayMs: 1750,
    maxDelayMs: 2950,
    accuracy: 0.95,
    typingCps: 6.6
  }
];

export function pickScaledNpcForRp(playerRp = 0, seedNum = Date.now()) {
  const tier = getKnightPvpRankTier(playerRp);
  const sameTier = KNIGHT_PVP_NPCS.filter(n => n.tierId === tier.id);
  const pool = sameTier.length > 0 ? sameTier : KNIGHT_PVP_NPCS.slice(0, 2);
  const idx = Math.abs(Math.floor(Number(seedNum) || 0)) % pool.length;
  const chosen = pool[idx];
  const skin =
    KNIGHT_CHARACTER_SKINS.find(s => s.id === chosen.skinId) ||
    KNIGHT_CHARACTER_SKINS[0];
  return {
    ...chosen,
    isNpc: true,
    skin,
    weapon: null,
    tierMeta: getKnightPvpRankTier(chosen.rpDisplay)
  };
}

// 4-Sector Wheel of Fate spun by a Mysterious Entity when tied 2 - 2 after Round 4 (Zero Secret Boss Spoilers!)
export const DEMON_KING_ROULETTE_SECTORS = [
  {
    id: 'sector_r1',
    roundType: 1,
    shortLabel: 'Khiên Nghĩa',
    title: 'Trắc Nghiệm Nghĩa Thần Tốc',
    desc: 'Chọn đúng nghĩa trước đối phương để chém -1 ❤️ • Sai đóng băng 5s',
    color: '#e11d48'
  },
  {
    id: 'sector_r2',
    roundType: 2,
    shortLabel: 'Phá Giáp',
    title: 'Gõ Ký Tự Tốc Độ',
    desc: 'Gõ hoàn tất từ vựng trước để chém -1 ❤️ • Gõ sai đóng băng 5s',
    color: '#d97706'
  },
  {
    id: 'sector_r3',
    roundType: 3,
    shortLabel: 'Phản Xạ Từ',
    title: 'Đồng Nghĩa & Trái Nghĩa',
    desc: 'Chọn nhanh đáp án Đồng / Trái nghĩa chuẩn xác để đoạt mạng!',
    color: '#7c3aed'
  },
  {
    id: 'sector_r4',
    roundType: 4,
    shortLabel: 'Cụm Từ',
    title: 'Điền Cụm Từ Học Thuật',
    desc: 'Điền chuẩn cụm Collocation vào câu để tung đòn kết liễu cuối cùng!',
    color: '#0284c7'
  }
];

export function hashDeterministicSeed(str = '') {
  const s = String(str || 'pvp_seed');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickDemonRouletteSector(seedStr = '') {
  const h = hashDeterministicSeed(`demon_wheel:${seedStr}`);
  const idx = h % DEMON_KING_ROULETTE_SECTORS.length;
  return {
    sectorIndex: idx,
    sector: DEMON_KING_ROULETTE_SECTORS[idx]
  };
}

export function normalizeKnightPvpProfile(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const rp = Math.max(0, Math.min(99999, Math.floor(Number(obj.rp) || 0)));
  const peakRp = Math.max(rp, Math.min(99999, Math.floor(Number(obj.peakRp) || 0)));
  const wins = Math.max(0, Math.min(99999, Math.floor(Number(obj.wins) || 0)));
  const losses = Math.max(0, Math.min(99999, Math.floor(Number(obj.losses) || 0)));
  const winStreak = Math.max(0, Math.min(9999, Math.floor(Number(obj.winStreak) || 0)));
  const bestWinStreak = Math.max(winStreak, Math.min(9999, Math.floor(Number(obj.bestWinStreak) || 0)));
  const demonTiebreakerWins = Math.max(0, Math.min(9999, Math.floor(Number(obj.demonTiebreakerWins) || 0)));
  const matchesPlayed = Math.max(wins + losses, Math.min(99999, Math.floor(Number(obj.matchesPlayed) || 0)));
  return {
    rp,
    peakRp,
    wins,
    losses,
    winStreak,
    bestWinStreak,
    demonTiebreakerWins,
    matchesPlayed
  };
}
