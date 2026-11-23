// ==========================================
// KNIGHT & DRAGON RPG QUEST ("HIỆP SĨ DIỆT RỒNG")
// Character Skins (5 Male & 5 Female), Monster Stages, Secret Demon King Boss & Storage Helpers
// ==========================================

export const KNIGHT_STORAGE_KEY_PREFIX = 'ielts_knight_rpg_profile_v1';

export const KNIGHT_HINT_SCORE_COST = 300;
export const DEATH_REVIVE_DELAY_SEC = 5;

export const DEMON_KING_BOSS = {
  id: 'demon_king_abyss',
  name: 'BOSS ẨN: MA VƯƠNG HẮC ÁM MALAKOR',
  shortName: 'Ma Vương Hắc Ám Malakor',
  color: '#c026d3',
  eyeColor: '#fb7185',
  goldBase: 1000,
  keyDropChance: 1,
  isDragonBoss: false,
  isDemonKing: true,
  spriteUrl: '/assets/knight-rpg/demon_king_abyss.svg',
  spawnChance: 0.05,
  warningDurationSec: 3,
  curseIntervalSec: 5,
  grantedLives: 5,
  rewardGold: 1000,
  rewardKeys: 10
};

export const KNIGHT_CHARACTER_SKINS = [
  {
    id: 'knight_arthur',
    name: 'Hiệp Sĩ Ánh Sáng Arthur',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Cơ Bản',
    priceGold: 0,
    weaponName: 'Thánh Kiếm Excalibur',
    passiveText: 'Cân bằng công thủ • Mặc định sở hữu',
    spriteUrl: '/assets/knight-rpg/knight_arthur.png',
    slashStyle: 'holy',
    goldBonusPct: 0,
    keyDropBonusPct: 0,
    bonusTimeSec: 0,
    armorPrimary: '#3b82f6',
    armorSecondary: '#93c5fd',
    capeColor: '#1d4ed8',
    hairColor: '#f59e0b',
    hairStyle: 'short_spiky',
    headgear: 'knight_visor',
    bladeColor: '#38bdf8',
    slashColor: '#60a5fa'
  },
  {
    id: 'valkyrie_freya',
    name: 'Nữ Chiến Binh Valkyrie Freya',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Hiếm',
    priceGold: 120,
    weaponName: 'Song Kiếm Thiên Vũ',
    passiveText: '+15% Vàng & +2% tỉ lệ hiếm rớt Chìa Khóa khi hạ quái',
    spriteUrl: '/assets/knight-rpg/valkyrie_freya.png',
    slashStyle: 'holy',
    goldBonusPct: 15,
    keyDropBonusPct: 2,
    bonusTimeSec: 0,
    armorPrimary: '#ec4899',
    armorSecondary: '#fbcfe8',
    capeColor: '#db2777',
    hairColor: '#fde047',
    hairStyle: 'long_flowing',
    headgear: 'valkyrie_wings',
    bladeColor: '#f472b6',
    slashColor: '#f9a8d4'
  },
  {
    id: 'paladin_leon',
    name: 'Thánh Kỵ Sĩ Thái Dương Leon',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Hiếm',
    priceGold: 190,
    weaponName: 'Đại Kiếm Mặt Trời Solarius',
    passiveText: '+18% Vàng & +2% tỉ lệ hiếm rớt Chìa Khóa khi hạ quái',
    spriteUrl: '/assets/knight-rpg/paladin_leon.svg',
    slashStyle: 'solar',
    goldBonusPct: 18,
    keyDropBonusPct: 2,
    bonusTimeSec: 0,
    armorPrimary: '#f59e0b',
    armorSecondary: '#fef08a',
    capeColor: '#dc2626',
    hairColor: '#facc15',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#fde047',
    slashColor: '#fbbf24'
  },
  {
    id: 'samurai_tomoe',
    name: 'Nữ Kiếm Khách Anh Đào Tomoe',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Sử Thi',
    priceGold: 260,
    weaponName: 'Katana Hoa Anh Đào',
    passiveText: '+25% Vàng & +3% tỉ lệ hiếm rớt Chìa Khóa khi hạ quái',
    spriteUrl: '/assets/knight-rpg/samurai_tomoe.png',
    slashStyle: 'sakura',
    goldBonusPct: 25,
    keyDropBonusPct: 3,
    bonusTimeSec: 0,
    armorPrimary: '#e11d48',
    armorSecondary: '#fda4af',
    capeColor: '#9f1239',
    hairColor: '#1e293b',
    hairStyle: 'high_ponytail',
    headgear: 'sakura_ribbon',
    bladeColor: '#fb7185',
    slashColor: '#fda4af'
  },
  {
    id: 'mage_selena',
    name: 'Nữ Pháp Sư Tinh Tú Selena',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Sử Thi',
    priceGold: 420,
    weaponName: 'Quyền Trượng Ngân Hà',
    passiveText: '+3 giây suy nghĩ mỗi câu, +20% Vàng & +2% rớt Chìa Khóa',
    spriteUrl: '/assets/knight-rpg/mage_selena.png',
    slashStyle: 'arcane',
    goldBonusPct: 20,
    keyDropBonusPct: 2,
    bonusTimeSec: 3,
    armorPrimary: '#8b5cf6',
    armorSecondary: '#ddd6fe',
    capeColor: '#6d28d9',
    hairColor: '#c084fc',
    hairStyle: 'twin_tails',
    headgear: 'star_tiara',
    bladeColor: '#a78bfa',
    slashColor: '#c4b5fd'
  },
  {
    id: 'ronin_kenji',
    name: 'Kiếm Sĩ Lôi Kiếm Kenji',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Sử Thi',
    priceGold: 480,
    weaponName: 'Lôi Đao Raijin',
    passiveText: '+28% Vàng, +3% rớt Chìa Khóa & trảm lôi điện tốc độ cao',
    spriteUrl: '/assets/knight-rpg/ronin_kenji.svg',
    slashStyle: 'thunder',
    goldBonusPct: 28,
    keyDropBonusPct: 3,
    bonusTimeSec: 0,
    armorPrimary: '#1e1b4b',
    armorSecondary: '#38bdf8',
    capeColor: '#0284c7',
    hairColor: '#0f172a',
    hairStyle: 'high_ponytail',
    headgear: 'thunder_band',
    bladeColor: '#38bdf8',
    slashColor: '#7dd3fc'
  },
  {
    id: 'assassin_kael',
    name: 'Sát Thủ Bóng Đêm Kael',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Sử Thi',
    priceGold: 560,
    weaponName: 'Huyết Ảnh Song Đao',
    passiveText: '+30% Vàng, +3% rớt Chìa Khóa & chém chí mạng tốc độ cao',
    spriteUrl: '/assets/knight-rpg/assassin_kael.png',
    slashStyle: 'crimson',
    goldBonusPct: 30,
    keyDropBonusPct: 3,
    bonusTimeSec: 0,
    armorPrimary: '#1e293b',
    armorSecondary: '#ef4444',
    capeColor: '#991b1b',
    hairColor: '#e2e8f0',
    hairStyle: 'short_spiky',
    headgear: 'shadow_hood',
    bladeColor: '#ef4444',
    slashColor: '#f87171'
  },
  {
    id: 'cyber_nova',
    name: 'Nữ Thánh Kỵ Sĩ Cyber Nova',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Huyền Thoại',
    priceGold: 780,
    weaponName: 'Đại Kiếm Plasma Neon',
    passiveText: '+35% Vàng, +4% rớt Chìa Khóa khi hạ quái & +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/cyber_nova.png',
    slashStyle: 'plasma',
    goldBonusPct: 35,
    keyDropBonusPct: 4,
    bonusTimeSec: 2,
    armorPrimary: '#06b6d4',
    armorSecondary: '#f43f5e',
    capeColor: '#0e7490',
    hairColor: '#22d3ee',
    hairStyle: 'long_flowing',
    headgear: 'cyber_halo',
    bladeColor: '#22d3ee',
    slashColor: '#67e8f9'
  },
  {
    id: 'berserker_drake',
    name: 'Chiến Thần Cuồng Chiến Drake',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Huyền Thoại',
    priceGold: 880,
    weaponName: 'Chiến Rìu Dung Nham Ragnarok',
    passiveText: '+42% Vàng, +5% rớt Chìa Khóa khi hạ quái & +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/berserker_drake.svg',
    slashStyle: 'magma',
    goldBonusPct: 42,
    keyDropBonusPct: 5,
    bonusTimeSec: 2,
    armorPrimary: '#334155',
    armorSecondary: '#f97316',
    capeColor: '#7f1d1d',
    hairColor: '#e2e8f0',
    hairStyle: 'long_flowing',
    headgear: 'wolf_pelt',
    bladeColor: '#f97316',
    slashColor: '#fb923c'
  },
  {
    id: 'dragon_empress',
    name: 'Nữ Hoàng Long Tộc Ignis',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Thần Thoại',
    priceGold: 1100,
    weaponName: 'Long Vương Hỏa Kiếm',
    passiveText: '+50% Vàng, +6% rớt Chìa Khóa khi hạ quái & +3 giây gặp Boss Rồng',
    spriteUrl: '/assets/knight-rpg/dragon_empress.png',
    slashStyle: 'dragon',
    goldBonusPct: 50,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#f59e0b',
    armorSecondary: '#fef08a',
    capeColor: '#dc2626',
    hairColor: '#fffbeb',
    hairStyle: 'long_flowing',
    headgear: 'dragon_horns',
    bladeColor: '#fbbf24',
    slashColor: '#fde047'
  }
];

export const KNIGHT_MONSTER_STAGES = [
  {
    round: 1,
    stageTitle: 'Ải 1/4: Rừng Slime & Goblin',
    shortTitle: 'Ải 1: Slime & Goblin',
    goldPerKill: 26,
    mechanicLabel: 'Đánh Hạ Quái Rớt Tiền Vàng (🪙) • Tỉ Lệ Hiếm Rớt 🗝️ Chìa Khóa Hồi Sinh',
    questionDesc: 'Đọc nghĩa tiếng Việt → Chọn đúng chiêu kiếm từ tiếng Anh khớp nghĩa để chém hạ Slime & Goblin làm văng Tiền Vàng (🪙) và có cơ hội hiếm rớt 🗝️ Chìa Khóa!',
    monsters: [
      {
        id: 'slime_blue',
        name: 'Slime Thủy Tinh',
        color: '#38bdf8',
        eyeColor: '#0f172a',
        goldBase: 22,
        keyDropChance: 0.05,
        spriteUrl: '/assets/knight-rpg/slime_blue.png'
      },
      {
        id: 'slime_king',
        name: 'Vua Slime Lục Bảo',
        color: '#10b981',
        eyeColor: '#064e3b',
        goldBase: 26,
        keyDropChance: 0.06,
        spriteUrl: '/assets/knight-rpg/slime_king.png'
      },
      {
        id: 'goblin_scout',
        name: 'Goblin Rừng Xanh',
        color: '#84cc16',
        eyeColor: '#7f1d1d',
        goldBase: 30,
        keyDropChance: 0.07,
        spriteUrl: '/assets/knight-rpg/goblin_scout.png'
      }
    ]
  },
  {
    round: 2,
    stageTitle: 'Ải 2/4: Pháo Đài Kỵ Sĩ Xương & Orc',
    shortTitle: 'Ải 2: Skeleton & Orc',
    goldPerKill: 40,
    mechanicLabel: 'Gõ Chữ Liên Hoàn Kiếm Phá Giáp Quái Rớt Vàng (🪙) & 🗝️ Hiếm',
    questionDesc: 'Gõ từng chữ cái tiếng Anh chính xác để tung liên hoàn kiếm phá vỡ giáp sắt của Skeleton & Orc, hạ quái rớt Tiền Vàng & tỉ lệ hiếm rớt 🗝️ Chìa Khóa!',
    monsters: [
      {
        id: 'skeleton_knight',
        name: 'Kỵ Sĩ Xương Cổ Đại',
        color: '#94a3b8',
        eyeColor: '#ef4444',
        goldBase: 35,
        keyDropChance: 0.08,
        spriteUrl: '/assets/knight-rpg/skeleton_knight.svg'
      },
      {
        id: 'orc_berserker',
        name: 'Orc Cuồng Nộ Giáp Sắt',
        color: '#d97706',
        eyeColor: '#fef08a',
        goldBase: 45,
        keyDropChance: 0.09,
        spriteUrl: '/assets/knight-rpg/orc_berserker.svg'
      }
    ]
  },
  {
    round: 3,
    stageTitle: 'Ải 3/4: Tháp Pháp Sư Hắc Ám',
    shortTitle: 'Ải 3: Golem & Dark Mage',
    goldPerKill: 52,
    mechanicLabel: 'Phản Đòn Cầu Phép Đồng Nghĩa / Trái Nghĩa Hạ Quái Rớt Vàng & 🗝️ Hiếm',
    questionDesc: 'Chọn đúng cầu phép thuật (Đồng nghĩa / Trái nghĩa / Ngữ cảnh) để phản đòn phép hạ Golem & Pháp Sư Hắc Ám, thu Tiền Vàng & cơ hội rớt 🗝️ Chìa Khóa!',
    monsters: [
      {
        id: 'stone_golem',
        name: 'Golem Đá Hộ Pháp',
        color: '#64748b',
        eyeColor: '#38bdf8',
        goldBase: 48,
        keyDropChance: 0.1,
        spriteUrl: '/assets/knight-rpg/stone_golem.png'
      },
      {
        id: 'dark_lich',
        name: 'Pháp Sư Hắc Ám Lich',
        color: '#9333ea',
        eyeColor: '#f43f5e',
        goldBase: 55,
        keyDropChance: 0.11,
        spriteUrl: '/assets/knight-rpg/dark_lich.svg'
      }
    ]
  },
  {
    round: 4,
    stageTitle: 'Ải 4/4 — BOSS CUỐI: Rồng Hắc Ám Cổ Đại',
    shortTitle: 'Ải 4: Boss Rồng Hắc Ám',
    goldPerKill: 110,
    mechanicLabel: 'Đọc Câu Gõ Từ Đồ Long • Rồng Tất Sát (Final Smash) Khi Hết Giờ',
    questionDesc: 'Gõ đúng từ/cụm từ điền vào câu để chém mất máu Rồng & nổ kho báu Tiền Vàng + tỉ lệ rớt 🗝️ cao nhất! Gõ sai bị Rồng khè lửa phản công — quá giờ Rồng tung Skill Tất Sát Kết Liễu!',
    monsters: [
      {
        id: 'ancient_dragon',
        name: 'BOSS CUỐI: RỒNG HẮC ÁM IGNIS-REX',
        color: '#e11d48',
        eyeColor: '#fde047',
        goldBase: 110,
        keyDropChance: 0.18,
        isDragonBoss: true,
        spriteUrl: '/assets/knight-rpg/ancient_dragon.png'
      }
    ]
  }
];

export const REVIVE_KEY_GOLD_PRICE = 100;

export function computeMonsterGoldDrop(monster, skin, combo = 0) {
  if (monster?.isDemonKing) return DEMON_KING_BOSS.rewardGold;
  const baseGold = Math.max(1, Number(monster?.goldBase) || (monster?.isDragonBoss ? 110 : 25));
  const skinMult = 1 + Math.max(0, Number(skin?.goldBonusPct) || 0) / 100;
  const comboGold = Math.min(40, Math.max(0, Number(combo) || 0) * 5);
  return Math.round((baseGold + comboGold) * skinMult);
}

export function computeMonsterKeyDropChance(monster, skin) {
  if (monster?.isDemonKing) return 1;
  const rawBase = Number(monster?.keyDropChance);
  const baseChance = Number.isFinite(rawBase)
    ? rawBase
    : monster?.isDragonBoss
    ? 0.18
    : 0.06;
  const skinBonus = Math.min(0.08, Math.max(0, Number(skin?.keyDropBonusPct) || 0) / 100);
  return Math.min(0.35, Math.max(0.02, baseChance + skinBonus));
}

export function normalizeKnightRpgProfile(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const rawGold = obj.gold === undefined || obj.gold === null ? 150 : Number(obj.gold);
  const gold = Math.max(0, Math.min(9_999_999, Math.floor(Number.isFinite(rawGold) ? rawGold : 150)));
  const rawKeys = obj.keys === undefined || obj.keys === null ? 1 : Number(obj.keys);
  const keys = Math.max(0, Math.min(999, Math.floor(Number.isFinite(rawKeys) ? rawKeys : 1)));
  const rawSkins = Array.isArray(obj.unlockedSkins) ? obj.unlockedSkins.map(String) : [];
  const validSkinIds = new Set(KNIGHT_CHARACTER_SKINS.map(s => s.id));
  const unlockedSkins = Array.from(
    new Set(['knight_arthur', ...rawSkins.filter(id => validSkinIds.has(id))])
  );
  const equippedSkin = unlockedSkins.includes(String(obj.equippedSkin || ''))
    ? String(obj.equippedSkin)
    : 'knight_arthur';
  const monstersSlain = Math.max(0, Math.floor(Number(obj.monstersSlain) || 0));
  const dragonsSlain = Math.max(0, Math.floor(Number(obj.dragonsSlain) || 0));
  const demonKingsSlain = Math.max(0, Math.floor(Number(obj.demonKingsSlain) || 0));
  const keysCollected = Math.max(keys, Math.floor(Number(obj.keysCollected) || keys));
  const bestScore = Math.max(0, Math.floor(Number(obj.bestScore) || 0));

  return {
    gold,
    keys,
    unlockedSkins,
    equippedSkin,
    monstersSlain,
    dragonsSlain,
    demonKingsSlain,
    keysCollected,
    bestScore
  };
}

export function loadLocalKnightRpgProfile(username = 'guest', userRecord = null) {
  const serverProfile = userRecord?.knightRpgProfile ? normalizeKnightRpgProfile(userRecord.knightRpgProfile) : null;
  if (typeof window === 'undefined') {
    return serverProfile || normalizeKnightRpgProfile({});
  }
  try {
    const key = `${KNIGHT_STORAGE_KEY_PREFIX}:${String(username || 'guest').toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    const localProfile = raw ? normalizeKnightRpgProfile(JSON.parse(raw)) : null;
    if (!localProfile && !serverProfile) return normalizeKnightRpgProfile({});
    if (!localProfile) return serverProfile;
    if (!serverProfile) return localProfile;
    const mergedSkins = Array.from(new Set([...localProfile.unlockedSkins, ...serverProfile.unlockedSkins]));
    return normalizeKnightRpgProfile({
      gold: Math.max(localProfile.gold, serverProfile.gold),
      keys: Math.max(localProfile.keys, serverProfile.keys),
      unlockedSkins: mergedSkins,
      equippedSkin: localProfile.equippedSkin || serverProfile.equippedSkin,
      monstersSlain: Math.max(localProfile.monstersSlain, serverProfile.monstersSlain),
      dragonsSlain: Math.max(localProfile.dragonsSlain, serverProfile.dragonsSlain),
      demonKingsSlain: Math.max(localProfile.demonKingsSlain, serverProfile.demonKingsSlain),
      keysCollected: Math.max(localProfile.keysCollected, serverProfile.keysCollected),
      bestScore: Math.max(localProfile.bestScore, serverProfile.bestScore)
    });
  } catch {
    return serverProfile || normalizeKnightRpgProfile({});
  }
}

export function saveLocalKnightRpgProfile(username = 'guest', profile = {}) {
  const normalized = normalizeKnightRpgProfile(profile);
  if (typeof window !== 'undefined') {
    try {
      const key = `${KNIGHT_STORAGE_KEY_PREFIX}:${String(username || 'guest').toLowerCase()}`;
      window.localStorage.setItem(key, JSON.stringify(normalized));
    } catch {}
  }
  return normalized;
}
