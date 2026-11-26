// ==========================================
// KNIGHT & DRAGON 1v1 PVP ARENA ("ĐẤU TRƯỜNG SONG ĐẤU 1V1")
// Ranked Matchmaking (Scaling 4★ -> 5★ -> Limited 5★ NPCs + Real Player Queue),
// Casual 1v1 Friend Rooms (For-Fun Only), 5s Wrong-Answer Freeze, & 2-2 Demon King Wheel
// ==========================================

import { KNIGHT_CHARACTER_SKINS, KNIGHT_GACHA_WEAPONS } from './knightRpgData.js';

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

// NPC opponents scale progressively with player's RP: faster reaction, higher accuracy, and 5★ / Limited 5★ Meme Heroes!
export const KNIGHT_PVP_NPCS = [
  {
    id: 'npc_goose_rookie',
    name: 'NPC Ngỗng Tập Chém',
    tierId: 'rookie',
    minRp: 0,
    rpDisplay: 80,
    skinId: 'knight_arthur',
    weaponId: 'wp3_harbinger_dawn',
    titleLabel: '🛡️ Tân Binh Nhập Môn',
    minDelayMs: 6200,
    maxDelayMs: 9600,
    accuracy: 0.60,
    typingCps: 1.9
  },
  {
    id: 'npc_banana_cry',
    name: 'NPC Mèo Chuối Run Tay',
    tierId: 'rookie',
    minRp: 0,
    rpDisplay: 145,
    skinId: 'crying_banana_cat',
    weaponId: 'wp3_skyrider_sword',
    titleLabel: '🍌 Khóc Nhưng Vẫn Đánh',
    minDelayMs: 5600,
    maxDelayMs: 8800,
    accuracy: 0.64,
    typingCps: 2.2
  },
  {
    id: 'npc_bonk_patrol',
    name: 'NPC Đội Trưởng Cheems Bonk',
    tierId: 'fighter',
    minRp: 200,
    rpDisplay: 290,
    skinId: 'cheems_bonk',
    weaponId: 'wp4_bonk_club',
    titleLabel: '⚔️ Đấu Sĩ Gõ Đầu',
    minDelayMs: 4500,
    maxDelayMs: 7200,
    accuracy: 0.72,
    typingCps: 2.9
  },
  {
    id: 'npc_stonks_trader',
    name: 'NPC Cá Mập Từ Vựng Stonks',
    tierId: 'fighter',
    minRp: 200,
    rpDisplay: 395,
    skinId: 'stonks_meme_man',
    weaponId: 'wp4_stonks_spear',
    titleLabel: '📈 Đấu Sĩ Bắt Đáy',
    minDelayMs: 4100,
    maxDelayMs: 6700,
    accuracy: 0.76,
    typingCps: 3.2
  },
  {
    id: 'npc_pepe_sage',
    name: 'NPC Pháp Sư Pepe 5★',
    tierId: 'master',
    minRp: 450,
    rpDisplay: 560,
    skinId: 'pepe_wizard',
    weaponId: 'wp4_widsith_codex',
    titleLabel: '🔥 Cao Thủ 5★ Thường',
    minDelayMs: 3300,
    maxDelayMs: 5400,
    accuracy: 0.82,
    typingCps: 3.9
  },
  {
    id: 'npc_swole_doge',
    name: 'NPC Chiến Thần Shiba 8 Múi',
    tierId: 'master',
    minRp: 450,
    rpDisplay: 710,
    skinId: 'buff_doge_titan',
    weaponId: 'wp4_skyward_claymore',
    titleLabel: '💪 Cao Thủ Cơ Bắp 5★',
    minDelayMs: 3000,
    maxDelayMs: 4900,
    accuracy: 0.85,
    typingCps: 4.3
  },
  {
    id: 'npc_swamp_lord',
    name: 'NPC Chúa Tể Đầm Lầy (Giới Hạn)',
    tierId: 'grandmaster',
    minRp: 800,
    rpDisplay: 940,
    skinId: 'shrek_swamp_king',
    weaponId: 'wp4_serpent_spine',
    titleLabel: '👑 Đại Cao Thủ 5★ Giới Hạn',
    minDelayMs: 2400,
    maxDelayMs: 4100,
    accuracy: 0.89,
    typingCps: 5.0
  },
  {
    id: 'npc_kevin_dragon',
    name: 'NPC Rồng Ba Đầu Kevin (Giới Hạn)',
    tierId: 'grandmaster',
    minRp: 800,
    rpDisplay: 1110,
    skinId: 'dragon_empress',
    weaponId: 'wp4_skyward_claymore',
    titleLabel: '🐉 Đại Cao Thủ Long Tộc',
    minDelayMs: 2200,
    maxDelayMs: 3800,
    accuracy: 0.91,
    typingCps: 5.4
  },
  {
    id: 'npc_gigachad_apex',
    name: 'NPC Đại Đế GigaChad (5★ Giới Hạn)',
    tierId: 'overlord',
    minRp: 1200,
    rpDisplay: 1450,
    skinId: 'gigachad_knight',
    weaponId: 'wp4_skyward_claymore',
    titleLabel: '🗿 Bá Chủ Bất Bại 1v1',
    minDelayMs: 1850,
    maxDelayMs: 3200,
    accuracy: 0.94,
    typingCps: 6.2
  },
  {
    id: 'npc_galaxy_overlord',
    name: 'NPC Não To Vũ Trụ IQ ∞ (5★ Giới Hạn)',
    tierId: 'overlord',
    minRp: 1200,
    rpDisplay: 1680,
    skinId: 'archmage_zephyr',
    weaponId: 'wp4_astral_scepter',
    titleLabel: '🌌 Thần Thoại Đấu Trường',
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
  const weapon = KNIGHT_GACHA_WEAPONS.find(w => w.id === chosen.weaponId) || null;
  return {
    ...chosen,
    isNpc: true,
    skin,
    weapon,
    tierMeta: getKnightPvpRankTier(chosen.rpDisplay)
  };
}

// 4-Sector Wheel of Fate spun by Demon King Malakor when tied 2 - 2 after Round 4!
export const DEMON_KING_ROULETTE_SECTORS = [
  {
    id: 'sector_r1',
    roundType: 1,
    shortLabel: 'Vòng 1: Khiên Nghĩa',
    title: 'Trắc Nghiệm Nghĩa Thần Tốc',
    desc: 'Ai chọn đúng nghĩa tiếng Anh trước sẽ chém đối thủ -1 ❤️; chọn sai đóng băng 5 giây!',
    color: '#e11d48'
  },
  {
    id: 'sector_r2',
    roundType: 2,
    shortLabel: 'Vòng 2: Phá Giáp',
    title: 'Gõ Ký Tự Phá Giáp Tốc Độ',
    desc: 'Đua gõ từng chữ cái hoàn thành từ vựng trước để chém -1 ❤️; gõ sai ký tự đóng băng 5 giây!',
    color: '#d97706'
  },
  {
    id: 'sector_r3',
    roundType: 3,
    shortLabel: 'Vòng 3: Phản Xạ Từ',
    title: 'Đồng Nghĩa & Trái Nghĩa Sinh Tử',
    desc: 'Chọn nhanh từ đồng nghĩa / trái nghĩa chuẩn xác để đoạt mạng đối phương!',
    color: '#7c3aed'
  },
  {
    id: 'sector_r4',
    roundType: 4,
    shortLabel: 'Vòng 4: Collocation',
    title: 'Tuyệt Kỹ Cụm Từ Học Thuật',
    desc: 'Gõ chính xác cụm Collocation để tung đòn kết liễu cuối cùng dưới sự chứng kiến của Ma Vương!',
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
