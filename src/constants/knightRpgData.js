// ==========================================
// KNIGHT & DRAGON RPG QUEST ("HIỆP SĨ DIỆT RỒNG")
// Character Skins (Male & Female), Monster Stages, Loot & Storage Helpers
// ==========================================

export const KNIGHT_STORAGE_KEY_PREFIX = 'ielts_knight_rpg_profile_v1';

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
    passiveText: '+15% Vàng rơi ra khi hạ quái',
    goldBonusPct: 15,
    keyDropBonusPct: 4,
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
    id: 'samurai_tomoe',
    name: 'Nữ Kiếm Khách Anh Đào Tomoe',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Sử Thi',
    priceGold: 260,
    weaponName: 'Katana Hoa Anh Đào',
    passiveText: '+25% Vàng rơi ra & +8% tỉ lệ rơi Chìa Khóa',
    goldBonusPct: 25,
    keyDropBonusPct: 8,
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
    passiveText: '+3 giây suy nghĩ mỗi câu & +20% Vàng',
    goldBonusPct: 20,
    keyDropBonusPct: 5,
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
    id: 'assassin_kael',
    name: 'Sát Thủ Bóng Đêm Kael',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Sử Thi',
    priceGold: 560,
    weaponName: 'Huyết Ảnh Song Đao',
    passiveText: '+30% Vàng rơi ra & chém chí mạng tốc độ cao',
    goldBonusPct: 30,
    keyDropBonusPct: 6,
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
    passiveText: '+35% Vàng, +10% rơi Chìa Khóa & +2 giây mỗi câu',
    goldBonusPct: 35,
    keyDropBonusPct: 10,
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
    id: 'dragon_empress',
    name: 'Nữ Hoàng Long Tộc Ignis',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: 'Thần Thoại',
    priceGold: 1100,
    weaponName: 'Long Vương Hỏa Kiếm',
    passiveText: '+50% Vàng rơi ra, +15% rơi Chìa Khóa & +3 giây gặp Boss Rồng',
    goldBonusPct: 50,
    keyDropBonusPct: 15,
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
    mechanicLabel: 'Chạy 3 Làn Nhặt Vàng/Chìa Khóa & Chém Khiên Từ Vựng',
    questionDesc: 'Đọc nghĩa tiếng Việt → Chuyển làn nhặt Vàng/Chìa khóa và chém đúng quái mang từ tiếng Anh khớp nghĩa!',
    monsters: [
      { id: 'slime_blue', name: 'Slime Thủy Tinh', color: '#38bdf8', eyeColor: '#0f172a', goldBase: 22 },
      { id: 'slime_king', name: 'Vua Slime Lục Bảo', color: '#10b981', eyeColor: '#064e3b', goldBase: 26 },
      { id: 'goblin_scout', name: 'Goblin Rừng Xanh', color: '#84cc16', eyeColor: '#7f1d1d', goldBase: 30 }
    ]
  },
  {
    round: 2,
    stageTitle: 'Ải 2/4: Pháo Đài Kỵ Sĩ Xương & Orc',
    shortTitle: 'Ải 2: Skeleton & Orc',
    mechanicLabel: 'Gõ Chữ Cường Hóa Kiếm Khí Phá Giáp Quái',
    questionDesc: 'Gõ từng chữ cái tiếng Anh chính xác để tung liên hoàn kiếm phá vỡ giáp sắt của Skeleton & Orc!',
    monsters: [
      { id: 'skeleton_knight', name: 'Kỵ Sĩ Xương Cổ Đại', color: '#94a3b8', eyeColor: '#ef4444', goldBase: 35 },
      { id: 'orc_berserker', name: 'Orc Cuồng Nộ Giáp Sắt', color: '#d97706', eyeColor: '#fef08a', goldBase: 45 }
    ]
  },
  {
    round: 3,
    stageTitle: 'Ải 3/4: Tháp Pháp Sư Hắc Ám',
    shortTitle: 'Ải 3: Golem & Dark Mage',
    mechanicLabel: 'Phản Đòn Cầu Phép Đồng Nghĩa / Trái Nghĩa',
    questionDesc: 'Chọn đúng cầu phép thuật (Đồng nghĩa / Trái nghĩa / Ngữ cảnh) để phản đòn phép về phía Pháp Sư Hắc Ám!',
    monsters: [
      { id: 'stone_golem', name: 'Golem Đá Hộ Pháp', color: '#64748b', eyeColor: '#38bdf8', goldBase: 48 },
      { id: 'dark_lich', name: 'Pháp Sư Hắc Ám Lich', color: '#9333ea', eyeColor: '#f43f5e', goldBase: 55 }
    ]
  },
  {
    round: 4,
    stageTitle: 'Ải 4/4 — BOSS CUỐI: Rồng Hắc Ám Cổ Đại',
    shortTitle: 'Ải 4: Boss Rồng Hắc Ám',
    mechanicLabel: 'Đọc Câu Gõ Từ Đồ Long • Rồng Tất Sát (Final Smash) Khi Hết Giờ',
    questionDesc: 'Gõ đúng từ/cụm từ điền vào câu để chém mất máu Rồng! Gõ sai bị Rồng khè lửa phản công — quá thời gian Rồng sẽ tung Skill Tất Sát Kết Liễu!',
    monsters: [
      { id: 'ancient_dragon', name: 'BOSS CUỐI: RỒNG HẮC ÁM IGNIS-REX', color: '#e11d48', eyeColor: '#fde047', goldBase: 110, isDragonBoss: true }
    ]
  }
];

export const REVIVE_KEY_GOLD_PRICE = 100;

export function normalizeKnightRpgProfile(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const rawGold = obj.gold === undefined || obj.gold === null ? 150 : Number(obj.gold);
  const gold = Math.max(0, Math.min(9_999_999, Math.floor(Number.isFinite(rawGold) ? rawGold : 150)));
  const keys = Math.max(0, Math.min(999, Math.floor(Number(obj.keys) ?? 1)));
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
  const keysCollected = Math.max(keys, Math.floor(Number(obj.keysCollected) || keys));
  const bestScore = Math.max(0, Math.floor(Number(obj.bestScore) || 0));

  return {
    gold,
    keys,
    unlockedSkins,
    equippedSkin,
    monstersSlain,
    dragonsSlain,
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
