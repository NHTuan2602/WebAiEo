// ==========================================
// KNIGHT & DRAGON RPG ("HIỆP SĨ DIỆT RỒNG")
// Weekly Rotating Limited Banner (7-Day Cycle), Standard Pool vs Exclusive Limited Pool,
// 10k (4★) / 200k (5★) Duplicate Hero Refunds & Class-Matched Cosmetic Weapons
// ==========================================

export const KNIGHT_STORAGE_KEY_PREFIX = 'ielts_knight_rpg_profile_v1';

export const KNIGHT_HINT_SCORE_COST = 300;
export const DEATH_REVIVE_DELAY_SEC = 5;
export const REVIVE_KEY_GOLD_PRICE = 100;

// Gacha Costs & Duplicate Refunds
export const KNIGHT_GACHA_GOLD_SINGLE = 10000; // 10.000 Vàng = 1 lượt quay
export const KNIGHT_GACHA_GOLD_TEN = 100000; // 100.000 Vàng = 10 lượt quay
export const KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD = 200000; // Trùng nhân vật 5★ → hoàn 200.000 Vàng
export const KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD = 10000; // Trùng nhân vật 4★ → hoàn 10.000 Vàng

// Weekly Banner Rotation: strictly 1 Limited Banner per 7-day period
export const LIMITED_BANNER_ROTATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export const KNIGHT_WEAPON_CLASS_LABELS = {
  sword: 'Hệ Kiếm',
  claymore: 'Hệ Trọng Kiếm',
  polearm: 'Hệ Thương & Đao',
  catalyst: 'Hệ Pháp Khí'
};

export const KNIGHT_GACHA_RATES = {
  base5Star: 0.006, // 0.6% cơ bản
  consolidated5StarPct: 1.6,
  softPity5Start: 74, // tăng tỉ lệ từ lượt 74
  hardPity5: 90, // chắc chắn 5★ ở lượt 90
  base4Star: 0.051, // 5.1% cơ bản
  consolidated4StarPct: 13.0,
  softPity4Start: 9,
  hardPity4: 10, // mỗi 10 lượt chắc chắn ≥ 4★
  base3Star: 0.943, // 94.3% cơ bản
  standardWhiffChance: 0.45 // tỉ lệ tạch ở Banner Thường
};

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
  warningDurationSec: 6,
  curseIntervalSec: 5,
  grantedLives: 5,
  rewardGold: 1000,
  rewardKeys: 10
};

function buildWeaponSvgDataUrl({ kind = 'sword', primary = '#a855f7', secondary = '#fde047', bg = '#1e1b4b', stars = 4 }) {
  const glow = stars >= 4 ? '#e879f9' : '#38bdf8';
  const border = stars >= 4 ? '#c084fc' : '#38bdf8';
  let shape = '';
  if (kind === 'claymore') {
    shape = `
      <g transform="translate(60,60) rotate(-38)">
        <polygon points="0,-44 11,-24 8,16 -8,16 -11,-24" fill="${primary}" stroke="${secondary}" stroke-width="2.2"/>
        <line x1="0" y1="-38" x2="0" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.7"/>
        <rect x="-18" y="15" width="36" height="6" rx="3" fill="${secondary}"/>
        <rect x="-4" y="21" width="8" height="17" rx="2" fill="#475569"/>
        <circle cx="0" cy="40" r="5" fill="${secondary}"/>
      </g>`;
  } else if (kind === 'katana') {
    shape = `
      <g transform="translate(60,60) rotate(-40)">
        <path d="M-3,-45 Q6,-15 3,16 L-4,16 Q-2,-15 -3,-45 Z" fill="${primary}" stroke="#ffffff" stroke-width="1.6"/>
        <ellipse cx="0" cy="17" rx="13" ry="4" fill="${secondary}"/>
        <rect x="-3.5" y="20" width="7" height="20" rx="2" fill="#9f1239"/>
        <line x1="-3.5" y1="25" x2="3.5" y2="28" stroke="${secondary}" stroke-width="1.5"/>
        <line x1="-3.5" y1="31" x2="3.5" y2="34" stroke="${secondary}" stroke-width="1.5"/>
      </g>`;
  } else if (kind === 'spear') {
    shape = `
      <g transform="translate(60,60) rotate(-42)">
        <polygon points="0,-46 9,-24 0,-18 -9,-24" fill="${primary}" stroke="${secondary}" stroke-width="2"/>
        <polygon points="-10,-22 0,-15 10,-22 0,-11" fill="${secondary}"/>
        <rect x="-2.8" y="-14" width="5.6" height="56" rx="2.5" fill="#cbd5e1"/>
        <circle cx="0" cy="43" r="4" fill="${secondary}"/>
      </g>`;
  } else if (kind === 'staff' || kind === 'codex') {
    shape = kind === 'codex'
      ? `
      <g transform="translate(60,60)">
        <rect x="-24" y="-30" width="48" height="60" rx="7" fill="${primary}" stroke="${secondary}" stroke-width="3"/>
        <rect x="-17" y="-22" width="34" height="44" rx="4" fill="${bg}" opacity="0.65"/>
        <polygon points="0,-14 5,-3 16,-3 7,4 10,15 0,8 -10,15 -7,4 -16,-3 -5,-3" fill="${secondary}"/>
      </g>`
      : `
      <g transform="translate(60,60) rotate(-36)">
        <circle cx="0" cy="-28" r="14" fill="none" stroke="${secondary}" stroke-width="3"/>
        <polygon points="0,-39 8,-28 0,-17 -8,-28" fill="${primary}" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="-3" y="-13" width="6" height="53" rx="3" fill="${secondary}"/>
      </g>`;
  } else if (kind === 'axe') {
    shape = `
      <g transform="translate(60,60) rotate(-36)">
        <path d="M-4,-28 C-26,-34 -30,-6 -4,-10 Z" fill="${primary}" stroke="${secondary}" stroke-width="2"/>
        <path d="M4,-28 C26,-34 30,-6 4,-10 Z" fill="${primary}" stroke="${secondary}" stroke-width="2"/>
        <rect x="-3.5" y="-34" width="7" height="74" rx="3" fill="#94a3b8"/>
        <circle cx="0" cy="-19" r="5" fill="${secondary}"/>
      </g>`;
  } else if (kind === 'twin') {
    shape = `
      <g transform="translate(60,60)">
        <g transform="rotate(-32)">
          <polygon points="0,-40 6,-18 4,14 -4,14 -6,-18" fill="${primary}" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="-11" y="14" width="22" height="4.5" rx="2" fill="${secondary}"/>
          <rect x="-3" y="18" width="6" height="14" rx="2" fill="#475569"/>
        </g>
        <g transform="rotate(32)">
          <polygon points="0,-40 6,-18 4,14 -4,14 -6,-18" fill="${secondary}" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="-11" y="14" width="22" height="4.5" rx="2" fill="${primary}"/>
          <rect x="-3" y="18" width="6" height="14" rx="2" fill="#475569"/>
        </g>
      </g>`;
  } else {
    shape = `
      <g transform="translate(60,60) rotate(-38)">
        <polygon points="0,-44 7,-22 5,16 -5,16 -7,-22" fill="${primary}" stroke="#ffffff" stroke-width="1.8"/>
        <rect x="-15" y="15" width="30" height="5.5" rx="2.5" fill="${secondary}"/>
        <rect x="-3.5" y="20" width="7" height="16" rx="2" fill="#334155"/>
        <circle cx="0" cy="38" r="4.5" fill="${secondary}"/>
      </g>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <defs>
      <radialGradient id="g" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.48"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.98"/>
      </radialGradient>
    </defs>
    <rect x="4" y="4" width="112" height="112" rx="24" fill="url(#g)" stroke="${border}" stroke-width="3"/>
    <circle cx="60" cy="56" r="36" fill="none" stroke="${glow}" stroke-opacity="0.28" stroke-dasharray="4 4" stroke-width="1.5"/>
    ${shape}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ==========================================
// 13 HEROES:
// - 1 Starter: Arthur (4★)
// - 4 Standard 4★ Heroes (pool: 'standard')
// - 3 Standard 5★ Heroes (pool: 'standard' — obtainable on Standard Banner AND 50/50 loss on Limited Banner)
// - 5 Exclusive Limited 5★ Heroes (pool: 'limited' — ONLY obtainable on their 7-day Weekly Limited Banner, NEVER on Standard Banner!)
// ==========================================
export const KNIGHT_CHARACTER_SKINS = [
  {
    id: 'knight_arthur',
    name: 'Hiệp Sĩ Ánh Sáng Arthur',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: 'Mặc Định',
    starRarity: 4,
    pool: 'starter',
    isStarter: true,
    obtainMethod: 'starter',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: 0,
    weaponName: 'Thánh Kiếm Excalibur',
    passiveText: 'Nhân vật mặc định',
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

  // ---- 4★ STANDARD POOL ----
  {
    id: 'valkyrie_freya',
    name: 'Nữ Chiến Binh Valkyrie Freya',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Song Kiếm Thiên Vũ',
    passiveText: '+15% Vàng khi hạ quái',
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
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm Mặt Trời Solarius',
    passiveText: '+18% Vàng khi hạ quái',
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
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Katana Hoa Anh Đào',
    passiveText: '+25% Vàng khi hạ quái',
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
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Quyền Trượng Ngân Hà',
    passiveText: '+20% Vàng • +3 giây mỗi câu',
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

  // ---- 5★ STANDARD POOL (Banner Thường & lệch 50/50 ở Banner Giới Hạn) ----
  {
    id: 'ronin_kenji',
    name: 'Kiếm Sĩ Lôi Kiếm Kenji',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Lôi Đao Raijin',
    passiveText: '+32% Vàng • +1 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/ronin_kenji.svg',
    slashStyle: 'thunder',
    goldBonusPct: 32,
    keyDropBonusPct: 3,
    bonusTimeSec: 1,
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
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Huyết Ảnh Song Đao',
    passiveText: '+34% Vàng • +1 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/assassin_kael.png',
    slashStyle: 'crimson',
    goldBonusPct: 34,
    keyDropBonusPct: 4,
    bonusTimeSec: 1,
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
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm Plasma Neon',
    passiveText: '+38% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/cyber_nova.png',
    slashStyle: 'plasma',
    goldBonusPct: 38,
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

  // ---- 5 EXCLUSIVE LIMITED 5★ POOL (CHỈ XUẤT HIỆN Ở BANNER GIỚI HẠN 7 NGÀY/LẦN — KHÔNG RƠI Ở BANNER THƯỜNG) ----
  {
    id: 'dragon_empress',
    name: 'Nữ Hoàng Long Tộc Ignis',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Long Vương Hỏa Kiếm',
    passiveText: '+50% Vàng • +3 giây mỗi câu',
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
  },
  {
    id: 'berserker_drake',
    name: 'Chiến Thần Cuồng Chiến Drake',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Chiến Rìu Dung Nham Ragnarok',
    passiveText: '+44% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/berserker_drake.svg',
    slashStyle: 'magma',
    goldBonusPct: 44,
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
    id: 'archmage_zephyr',
    name: 'Đại Pháp Sư Tinh Không Zephyr',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Quyền Trượng Tinh Vân',
    passiveText: '+46% Vàng • +3 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/archmage_zephyr.svg',
    slashStyle: 'arcane',
    goldBonusPct: 46,
    keyDropBonusPct: 5,
    bonusTimeSec: 3,
    armorPrimary: '#312e81',
    armorSecondary: '#c084fc',
    capeColor: '#4c1d95',
    hairColor: '#e0f2fe',
    hairStyle: 'short_spiky',
    headgear: 'star_tiara',
    bladeColor: '#c084fc',
    slashColor: '#e879f9'
  },
  {
    id: 'valkyrie_celestia',
    name: 'Thánh Nữ Thần Thương Celestia',
    gender: 'Nữ',
    genderBadge: '♀ Nữ',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Thánh Thương Quang Minh',
    passiveText: '+48% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/valkyrie_celestia.svg',
    slashStyle: 'solar',
    goldBonusPct: 48,
    keyDropBonusPct: 5,
    bonusTimeSec: 2,
    armorPrimary: '#f8fafc',
    armorSecondary: '#fde047',
    capeColor: '#1d4ed8',
    hairColor: '#fef08a',
    hairStyle: 'long_flowing',
    headgear: 'valkyrie_wings',
    bladeColor: '#38bdf8',
    slashColor: '#fef08a'
  },
  {
    id: 'emperor_raiden',
    name: 'Lôi Đế Huyết Kiếm Raiden',
    gender: 'Nam',
    genderBadge: '♂ Nam',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Huyết Lôi Thần Kiếm',
    passiveText: '+45% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/emperor_raiden.svg',
    slashStyle: 'crimson',
    goldBonusPct: 45,
    keyDropBonusPct: 5,
    bonusTimeSec: 2,
    armorPrimary: '#3b0764',
    armorSecondary: '#f43f5e',
    capeColor: '#881337',
    hairColor: '#2e1065',
    hairStyle: 'short_spiky',
    headgear: 'dragon_horns',
    bladeColor: '#f43f5e',
    slashColor: '#e879f9'
  }
];

// Strictly ONE active Limited Banner per 7-day cycle! Rotates automatically every 7 days.
export const KNIGHT_LIMITED_BANNERS = [
  {
    id: 'limited_ignis',
    featuredHeroId: 'dragon_empress',
    bannerTitle: 'Banner Giới Hạn: Nữ Hoàng Long Tộc Ignis',
    featured4StarIds: ['mage_selena', 'samurai_tomoe', 'paladin_leon']
  },
  {
    id: 'limited_drake',
    featuredHeroId: 'berserker_drake',
    bannerTitle: 'Banner Giới Hạn: Chiến Thần Drake',
    featured4StarIds: ['valkyrie_freya', 'paladin_leon', 'samurai_tomoe']
  },
  {
    id: 'limited_zephyr',
    featuredHeroId: 'archmage_zephyr',
    bannerTitle: 'Banner Giới Hạn: Đại Pháp Sư Zephyr',
    featured4StarIds: ['mage_selena', 'valkyrie_freya', 'paladin_leon']
  },
  {
    id: 'limited_celestia',
    featuredHeroId: 'valkyrie_celestia',
    bannerTitle: 'Banner Giới Hạn: Thánh Nữ Celestia',
    featured4StarIds: ['samurai_tomoe', 'valkyrie_freya', 'mage_selena']
  },
  {
    id: 'limited_raiden',
    featuredHeroId: 'emperor_raiden',
    bannerTitle: 'Banner Giới Hạn: Lôi Đế Raiden',
    featured4StarIds: ['paladin_leon', 'samurai_tomoe', 'valkyrie_freya']
  }
];

// Keep backward-compatible alias for any import expecting KNIGHT_CHARACTER_EVENT_BANNERS
export const KNIGHT_CHARACTER_EVENT_BANNERS = KNIGHT_LIMITED_BANNERS;

export function getWeeklyLimitedBannerState(nowMs = Date.now()) {
  const vnAdjustedMs = (Number(nowMs) || Date.now()) + 7 * 60 * 60 * 1000;
  const weekNumber = Math.floor(vnAdjustedMs / LIMITED_BANNER_ROTATION_MS);
  const bannerIdx = ((weekNumber % KNIGHT_LIMITED_BANNERS.length) + KNIGHT_LIMITED_BANNERS.length) % KNIGHT_LIMITED_BANNERS.length;
  const nextRotationVnMs = (weekNumber + 1) * LIMITED_BANNER_ROTATION_MS;
  const remainingMs = Math.max(1000, nextRotationVnMs - vnAdjustedMs);
  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const activeBanner = KNIGHT_LIMITED_BANNERS[bannerIdx];
  const nextBanner = KNIGHT_LIMITED_BANNERS[(bannerIdx + 1) % KNIGHT_LIMITED_BANNERS.length];

  return {
    weekNumber,
    bannerIdx,
    activeBanner,
    nextBanner,
    remainingMs,
    countdownText: `${days} ngày ${hours} giờ ${minutes} phút`
  };
}

// ==========================================
// 4★ & 3★ COSMETIC WEAPONS (Trang trí ngoại hình theo Hệ nhân vật — không cộng chỉ số)
// ==========================================
export const KNIGHT_GACHA_WEAPONS = [
  // ---- 4★ COSMETIC WEAPONS (2 per class = 8) ----
  {
    id: 'wp4_sacrificial_sword',
    name: 'Kiếm Nghi Lễ Cổ Đại',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#c084fc',
    slashColor: '#e879f9',
    passiveText: 'Trang trí vũ khí (Hệ Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'sword', primary: '#c084fc', secondary: '#fbbf24', bg: '#312e81', stars: 4 })
  },
  {
    id: 'wp4_frost_twinblades',
    name: 'Băng Tinh Song Kiếm',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#67e8f9',
    passiveText: 'Trang trí vũ khí (Hệ Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'twin', primary: '#38bdf8', secondary: '#e879f9', bg: '#1e1b4b', stars: 4 })
  },
  {
    id: 'wp4_skyward_claymore',
    name: 'Đại Kiếm Bầu Trời',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#a855f7',
    slashColor: '#fde047',
    passiveText: 'Trang trí vũ khí (Hệ Trọng Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'claymore', primary: '#c084fc', secondary: '#fde047', bg: '#2e1065', stars: 4 })
  },
  {
    id: 'wp4_serpent_spine',
    name: 'Chiến Rìu Hắc Long',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#fb7185',
    slashColor: '#fde047',
    passiveText: 'Trang trí vũ khí (Hệ Trọng Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'axe', primary: '#fb7185', secondary: '#fde047', bg: '#4c0519', stars: 4 })
  },
  {
    id: 'wp4_amenoma_katana',
    name: 'Đoản Đao Ảnh Nguyệt',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#e879f9',
    slashColor: '#f472b6',
    passiveText: 'Trang trí vũ khí (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'katana', primary: '#e879f9', secondary: '#f472b6', bg: '#3b0764', stars: 4 })
  },
  {
    id: 'wp4_favonius_lance',
    name: 'Trường Thương Phong Kỵ',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#a78bfa',
    slashColor: '#67e8f9',
    passiveText: 'Trang trí vũ khí (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'spear', primary: '#a78bfa', secondary: '#67e8f9', bg: '#1e1b4b', stars: 4 })
  },
  {
    id: 'wp4_widsith_codex',
    name: 'Pháp Điển Cổ Ngữ',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#9333ea',
    slashColor: '#fde047',
    passiveText: 'Trang trí vũ khí (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'codex', primary: '#9333ea', secondary: '#fde047', bg: '#2e1065', stars: 4 })
  },
  {
    id: 'wp4_astral_scepter',
    name: 'Quyền Trượng Tinh Hà',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#e879f9',
    slashColor: '#38bdf8',
    passiveText: 'Trang trí vũ khí (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'staff', primary: '#e879f9', secondary: '#38bdf8', bg: '#2e1065', stars: 4 })
  },

  // ---- 3★ COSMETIC WEAPONS (10) ----
  {
    id: 'wp3_harbinger_dawn',
    name: 'Kiếm Bình Minh',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#bae6fd',
    passiveText: 'Trang trí vũ khí (Hệ Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'sword', primary: '#38bdf8', secondary: '#bae6fd', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_skyrider_sword',
    name: 'Kiếm Bạc Kỵ Binh',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#06b6d4',
    slashColor: '#cffafe',
    passiveText: 'Trang trí vũ khí (Hệ Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'sword', primary: '#06b6d4', secondary: '#cffafe', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_traveler_twin',
    name: 'Song Đao Lữ Khách',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#94a3b8',
    passiveText: 'Trang trí vũ khí (Hệ Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'twin', primary: '#38bdf8', secondary: '#94a3b8', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_debate_club',
    name: 'Đại Kiếm Thiết Giáp',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#93c5fd',
    passiveText: 'Trang trí vũ khí (Hệ Trọng Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'claymore', primary: '#38bdf8', secondary: '#93c5fd', bg: '#0c4a6e', stars: 3 })
  },
  {
    id: 'wp3_iron_point',
    name: 'Chiến Rìu Lính Gác',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#94a3b8',
    slashColor: '#7dd3fc',
    passiveText: 'Trang trí vũ khí (Hệ Trọng Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'axe', primary: '#64748b', secondary: '#7dd3fc', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_black_tassel',
    name: 'Trường Thương Thép Đen',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#0ea5e9',
    slashColor: '#e2e8f0',
    passiveText: 'Trang trí vũ khí (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'spear', primary: '#0ea5e9', secondary: '#e2e8f0', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_cool_steel',
    name: 'Đoản Đao Thép Lạnh',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#60a5fa',
    slashColor: '#e0f2fe',
    passiveText: 'Trang trí vũ khí (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'katana', primary: '#60a5fa', secondary: '#e0f2fe', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_thrilling_tales',
    name: 'Sách Diệt Rồng',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#0284c7',
    slashColor: '#7dd3fc',
    passiveText: 'Trang trí vũ khí (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'codex', primary: '#0284c7', secondary: '#7dd3fc', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_magic_guide',
    name: 'Trượng Học Đồ',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#a5f3fc',
    passiveText: 'Trang trí vũ khí (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'staff', primary: '#38bdf8', secondary: '#a5f3fc', bg: '#0f172a', stars: 3 })
  },
  {
    id: 'wp3_star_grimoire',
    name: 'Ấn Ký Sao Đêm',
    starRarity: 3,
    rarityLabel: 'Vũ Khí 3★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#67e8f9',
    slashColor: '#bae6fd',
    passiveText: 'Trang trí vũ khí (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'codex', primary: '#0ea5e9', secondary: '#fde047', bg: '#0f172a', stars: 3 })
  }
];

export const STANDARD_WHIFF_ITEM = {
  id: 'whiff_empty',
  name: 'Tạch Gacha',
  starRarity: 3,
  rarityLabel: 'Tạch (3★)',
  isWhiff: true,
  consolationGold: 250,
  passiveText: 'Không trúng vật phẩm • Hoàn +250 Vàng',
  iconUrl: buildWeaponSvgDataUrl({ kind: 'sword', primary: '#475569', secondary: '#94a3b8', bg: '#090d16', stars: 3 })
};

export const KNIGHT_MONSTER_STAGES = [
  {
    round: 1,
    stageTitle: 'Ải 1/4: Rừng Slime & Goblin',
    shortTitle: 'Ải 1: Slime & Goblin',
    goldPerKill: 26,
    mechanicLabel: 'Chọn từ đúng nghĩa',
    questionDesc: 'Đọc nghĩa tiếng Việt và chọn từ tiếng Anh tương ứng.',
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
    mechanicLabel: 'Gõ từ tiếng Anh',
    questionDesc: 'Gõ chính xác từng chữ cái của từ vựng để hạ quái.',
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
    mechanicLabel: 'Đồng nghĩa & Trái nghĩa',
    questionDesc: 'Chọn từ đồng nghĩa hoặc trái nghĩa phù hợp.',
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
    mechanicLabel: 'Điền từ vào câu',
    questionDesc: 'Gõ đúng từ/cụm từ còn thiếu để hạ Boss Rồng trước khi hết giờ.',
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

export function canHeroEquipWeapon(hero, weapon) {
  if (!hero || !weapon) return false;
  return hero.weaponClass === weapon.weaponClass;
}

export function getHeroCosmeticWeapon(profile, heroOrId = null) {
  const heroObj =
    typeof heroOrId === 'string'
      ? KNIGHT_CHARACTER_SKINS.find(s => s.id === heroOrId)
      : heroOrId || KNIGHT_CHARACTER_SKINS.find(s => s.id === profile?.equippedSkin) || KNIGHT_CHARACTER_SKINS[0];
  if (!heroObj) return null;
  const map = profile?.heroEquippedWeapons && typeof profile.heroEquippedWeapons === 'object'
    ? profile.heroEquippedWeapons
    : {};
  const wpId = String(map[heroObj.id] || '');
  if (!wpId) return null;
  const unlocked = Array.isArray(profile?.unlockedWeapons) ? profile.unlockedWeapons : [];
  if (!unlocked.includes(wpId)) return null;
  const wp = KNIGHT_GACHA_WEAPONS.find(w => w.id === wpId) || null;
  return canHeroEquipWeapon(heroObj, wp) ? wp : null;
}

// Keep backward-compat helper returning cosmetic weapon for active hero
export function getEquippedWeaponMeta(profile) {
  return getHeroCosmeticWeapon(profile);
}

// Weapons are purely cosmetic: monster gold & key drop depend strictly on Hero passive!
export function computeMonsterGoldDrop(monster, skin, combo = 0) {
  if (monster?.isDemonKing) return DEMON_KING_BOSS.rewardGold;
  const baseGold = Math.max(1, Number(monster?.goldBase) || (monster?.isDragonBoss ? 110 : 25));
  const skinPct = Math.max(0, Number(skin?.goldBonusPct) || 0);
  const totalMult = 1 + skinPct / 100;
  const comboGold = Math.min(40, Math.max(0, Number(combo) || 0) * 5);
  return Math.round((baseGold + comboGold) * totalMult);
}

export function computeMonsterKeyDropChance(monster, skin) {
  if (monster?.isDemonKing) return 1;
  const rawBase = Number(monster?.keyDropChance);
  const baseChance = Number.isFinite(rawBase)
    ? rawBase
    : monster?.isDragonBoss
    ? 0.18
    : 0.06;
  const skinBonus = Math.min(0.1, Math.max(0, Number(skin?.keyDropBonusPct) || 0) / 100);
  return Math.min(0.38, Math.max(0.02, baseChance + skinBonus));
}

export function compute5StarProbability(nextPullIndex5) {
  if (nextPullIndex5 >= KNIGHT_GACHA_RATES.hardPity5) return 1.0;
  if (nextPullIndex5 < KNIGHT_GACHA_RATES.softPity5Start) {
    return KNIGHT_GACHA_RATES.base5Star;
  }
  return Math.min(
    1.0,
    KNIGHT_GACHA_RATES.base5Star + (nextPullIndex5 - (KNIGHT_GACHA_RATES.softPity5Start - 1)) * 0.06
  );
}

export function compute4StarProbability(nextPullIndex4) {
  if (nextPullIndex4 >= KNIGHT_GACHA_RATES.hardPity4) return 1.0;
  if (nextPullIndex4 === KNIGHT_GACHA_RATES.softPity4Start) return 0.561;
  return KNIGHT_GACHA_RATES.base4Star;
}

function pickRandomItem(arr, randFn = Math.random) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const idx = Math.min(arr.length - 1, Math.floor(randFn() * arr.length));
  return arr[idx];
}

export function rollKnightGachaPulls(
  rawProfile = {},
  {
    bannerType = 'character_event', // 'character_event' (1 weekly limited banner) | 'standard'
    count = 1,
    isAdminFreePull = false,
    nowMs = Date.now(),
    randFn = Math.random
  } = {}
) {
  const pullCount = count === 10 ? 10 : 1;
  const profile = normalizeKnightRpgProfile(rawProfile);
  const availableWishes = profile.wishes || 0;
  const wishesToSpend = isAdminFreePull ? 0 : Math.min(pullCount, availableWishes);
  const remainingPullsByGold = isAdminFreePull ? 0 : pullCount - wishesToSpend;
  const goldCost = remainingPullsByGold * KNIGHT_GACHA_GOLD_SINGLE;

  if (!isAdminFreePull && remainingPullsByGold > 0 && (profile.gold || 0) < goldCost) {
    return {
      ok: false,
      error: `Chưa đủ lượt hoặc Vàng! Cần ${pullCount} lượt quay hoặc ${(pullCount * KNIGHT_GACHA_GOLD_SINGLE).toLocaleString('vi-VN')} Vàng.`
    };
  }

  const isCharBanner = bannerType !== 'standard';
  const weeklyState = getWeeklyLimitedBannerState(nowMs);
  const activeBannerMeta = weeklyState.activeBanner;

  // STRICT POOL SEPARATION:
  // - Standard 5★ pool: ONLY pool === 'standard' & starRarity === 5 (Kenji, Kael, Cyber Nova)
  // - Limited 5★ hero: ONLY this week's single active Limited 5★ hero (NEVER drops on Standard Banner!)
  const standardHeroes5 = KNIGHT_CHARACTER_SKINS.filter(
    h => h.obtainMethod === 'gacha' && h.pool === 'standard' && h.starRarity === 5
  );
  const standardHeroes4 = KNIGHT_CHARACTER_SKINS.filter(
    h => h.obtainMethod === 'gacha' && h.pool === 'standard' && h.starRarity === 4
  );
  const featuredLimitedHero =
    KNIGHT_CHARACTER_SKINS.find(h => h.id === activeBannerMeta.featuredHeroId) ||
    KNIGHT_CHARACTER_SKINS.find(h => h.pool === 'limited');

  const weapons4 = KNIGHT_GACHA_WEAPONS.filter(w => w.starRarity === 4);
  const weapons3 = KNIGHT_GACHA_WEAPONS.filter(w => w.starRarity === 3);

  const unlockedSkinsSet = new Set(profile.unlockedSkins);
  const unlockedWeaponsSet = new Set(profile.unlockedWeapons);
  const weaponCounts = { ...(profile.weaponCounts || {}) };
  const gachaState = { ...(profile.gachaState || {}) };

  let nextGold = Math.max(0, (profile.gold || 0) - goldCost);
  const nextWishes = Math.max(0, availableWishes - wishesToSpend);

  const forcedRarityGlobal =
    typeof window !== 'undefined' && window.__FORCE_GACHA_RARITY__ !== undefined
      ? window.__FORCE_GACHA_RARITY__
      : null;

  const results = [];
  const nowTs = Date.now();
  let heroesPulledInBatch = 0;

  for (let i = 0; i < pullCount; i += 1) {
    const pity5Key = isCharBanner ? 'charPity5' : 'stdPity5';
    const pity4Key = isCharBanner ? 'charPity4' : 'stdPity4';

    const nextPull5 = (gachaState[pity5Key] || 0) + 1;
    const nextPull4 = (gachaState[pity4Key] || 0) + 1;

    const prob5 = compute5StarProbability(nextPull5);
    const prob4 = compute4StarProbability(nextPull4);
    const roll = randFn();

    let starRarity = 3;
    let forceWhiff = false;
    if (forcedRarityGlobal && i === 0) {
      if (forcedRarityGlobal === 5 || forcedRarityGlobal === '5') starRarity = 5;
      else if (forcedRarityGlobal === 4 || forcedRarityGlobal === '4') starRarity = 4;
      else if (forcedRarityGlobal === 'whiff') {
        starRarity = 3;
        forceWhiff = true;
      } else {
        starRarity = 3;
      }
    } else if (roll < prob5) {
      starRarity = 5;
    } else if (nextPull4 >= KNIGHT_GACHA_RATES.hardPity4 || roll < prob5 + prob4) {
      starRarity = 4;
    } else {
      starRarity = 3;
    }

    if (starRarity === 5) {
      gachaState[pity5Key] = 0;
      gachaState[pity4Key] = nextPull4;

      let chosenHero = null;
      let rateOutcome = 'standard_5';
      if (isCharBanner) {
        if (gachaState.charGuaranteed5) {
          chosenHero = featuredLimitedHero;
          gachaState.charGuaranteed5 = false;
          rateOutcome = 'guaranteed_up';
        } else if (randFn() < 0.5) {
          chosenHero = featuredLimitedHero;
          gachaState.charGuaranteed5 = false;
          rateOutcome = 'won_50_50';
        } else {
          // Lệch 50/50 ở Banner Giới Hạn → Rơi vào Nhân Vật 5★ của Banner Thường!
          chosenHero = pickRandomItem(standardHeroes5, randFn) || standardHeroes5[0];
          gachaState.charGuaranteed5 = true;
          rateOutcome = 'lost_50_50';
        }
      } else {
        // Banner Thường TUYỆT ĐỐI KHÔNG ra nhân vật Giới Hạn
        chosenHero = pickRandomItem(standardHeroes5, randFn) || standardHeroes5[0];
      }

      heroesPulledInBatch += 1;
      const alreadyOwned = unlockedSkinsSet.has(chosenHero.id);
      const extraHeroInTenPull = pullCount === 10 && heroesPulledInBatch > 1;
      const shouldRefundHero = alreadyOwned || extraHeroInTenPull;

      let isNew = false;
      let bonusText = '';
      if (shouldRefundHero) {
        nextGold += KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD;
        bonusText = `Hoàn +${KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD.toLocaleString('vi-VN')} Vàng`;
      } else {
        isNew = true;
        unlockedSkinsSet.add(chosenHero.id);
      }

      results.push({
        pullId: `wish_${nowTs}_${i}`,
        itemKind: 'character',
        id: chosenHero.id,
        name: chosenHero.name,
        starRarity: 5,
        rarityLabel: chosenHero.rarity,
        weaponClass: chosenHero.weaponClass,
        weaponClassLabel: chosenHero.weaponClassLabel,
        spriteUrl: chosenHero.spriteUrl,
        passiveText: chosenHero.passiveText,
        weaponName: chosenHero.weaponName,
        genderBadge: chosenHero.genderBadge,
        isNew,
        isRefundedHero: shouldRefundHero,
        refundGoldAmount: shouldRefundHero ? KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD : 0,
        isWhiff: false,
        rateOutcome,
        bonusText,
        bannerType: isCharBanner ? 'character_event' : 'standard',
        timestamp: nowTs + i
      });
    } else if (starRarity === 4) {
      gachaState[pity5Key] = nextPull5;
      gachaState[pity4Key] = 0;

      let rollCharacter4 = false;
      if (isCharBanner) {
        if (gachaState.charGuaranteed4) {
          rollCharacter4 = true;
          gachaState.charGuaranteed4 = false;
        } else if (randFn() < 0.5) {
          rollCharacter4 = true;
          gachaState.charGuaranteed4 = false;
        } else {
          rollCharacter4 = false;
          gachaState.charGuaranteed4 = true;
        }
      } else {
        rollCharacter4 = randFn() < 0.35;
      }

      if (rollCharacter4) {
        let chosen4Hero = pickRandomItem(standardHeroes4, randFn);
        if (isCharBanner && Array.isArray(activeBannerMeta.featured4StarIds) && randFn() < 0.7) {
          const upPool = standardHeroes4.filter(h => activeBannerMeta.featured4StarIds.includes(h.id));
          if (upPool.length > 0) chosen4Hero = pickRandomItem(upPool, randFn);
        }

        heroesPulledInBatch += 1;
        const alreadyOwned = unlockedSkinsSet.has(chosen4Hero.id);
        const extraHeroInTenPull = pullCount === 10 && heroesPulledInBatch > 1;
        const shouldRefundHero = alreadyOwned || extraHeroInTenPull;

        let isNew = false;
        let bonusText = '';
        if (shouldRefundHero) {
          // Nhân vật 4★ trùng hoàn 10.000 Vàng
          nextGold += KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD;
          bonusText = `Hoàn +${KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD.toLocaleString('vi-VN')} Vàng`;
        } else {
          isNew = true;
          unlockedSkinsSet.add(chosen4Hero.id);
        }

        results.push({
          pullId: `wish_${nowTs}_${i}`,
          itemKind: 'character',
          id: chosen4Hero.id,
          name: chosen4Hero.name,
          starRarity: 4,
          rarityLabel: chosen4Hero.rarity,
          weaponClass: chosen4Hero.weaponClass,
          weaponClassLabel: chosen4Hero.weaponClassLabel,
          spriteUrl: chosen4Hero.spriteUrl,
          passiveText: chosen4Hero.passiveText,
          weaponName: chosen4Hero.weaponName,
          genderBadge: chosen4Hero.genderBadge,
          isNew,
          isRefundedHero: shouldRefundHero,
          refundGoldAmount: shouldRefundHero ? KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD : 0,
          isWhiff: false,
          bonusText,
          bannerType: isCharBanner ? 'character_event' : 'standard',
          timestamp: nowTs + i
        });
      } else {
        const chosenWp4 = pickRandomItem(weapons4, randFn);
        const isNew = !unlockedWeaponsSet.has(chosenWp4.id);
        unlockedWeaponsSet.add(chosenWp4.id);
        weaponCounts[chosenWp4.id] = (weaponCounts[chosenWp4.id] || 0) + 1;

        results.push({
          pullId: `wish_${nowTs}_${i}`,
          itemKind: 'weapon',
          id: chosenWp4.id,
          name: chosenWp4.name,
          starRarity: 4,
          rarityLabel: chosenWp4.rarityLabel,
          weaponClass: chosenWp4.weaponClass,
          weaponClassLabel: chosenWp4.weaponClassLabel,
          spriteUrl: chosenWp4.iconUrl,
          passiveText: chosenWp4.passiveText,
          isNew,
          isWhiff: false,
          bonusText: '',
          bannerType: isCharBanner ? 'character_event' : 'standard',
          timestamp: nowTs + i
        });
      }
    } else {
      gachaState[pity5Key] = nextPull5;
      gachaState[pity4Key] = nextPull4;

      const isStandardWhiff =
        forceWhiff || (!isCharBanner && randFn() < KNIGHT_GACHA_RATES.standardWhiffChance);

      if (isStandardWhiff) {
        nextGold += STANDARD_WHIFF_ITEM.consolationGold;
        results.push({
          pullId: `wish_${nowTs}_${i}`,
          itemKind: 'whiff',
          id: STANDARD_WHIFF_ITEM.id,
          name: STANDARD_WHIFF_ITEM.name,
          starRarity: 3,
          rarityLabel: STANDARD_WHIFF_ITEM.rarityLabel,
          spriteUrl: STANDARD_WHIFF_ITEM.iconUrl,
          passiveText: STANDARD_WHIFF_ITEM.passiveText,
          isNew: false,
          isWhiff: true,
          bonusText: `+${STANDARD_WHIFF_ITEM.consolationGold} Vàng`,
          bannerType: 'standard',
          timestamp: nowTs + i
        });
      } else {
        const chosenWp3 = pickRandomItem(weapons3, randFn);
        const isNew = !unlockedWeaponsSet.has(chosenWp3.id);
        unlockedWeaponsSet.add(chosenWp3.id);
        weaponCounts[chosenWp3.id] = (weaponCounts[chosenWp3.id] || 0) + 1;

        results.push({
          pullId: `wish_${nowTs}_${i}`,
          itemKind: 'weapon',
          id: chosenWp3.id,
          name: chosenWp3.name,
          starRarity: 3,
          rarityLabel: chosenWp3.rarityLabel,
          weaponClass: chosenWp3.weaponClass,
          weaponClassLabel: chosenWp3.weaponClassLabel,
          spriteUrl: chosenWp3.iconUrl,
          passiveText: chosenWp3.passiveText,
          isNew,
          isWhiff: false,
          bonusText: '',
          bannerType: isCharBanner ? 'character_event' : 'standard',
          timestamp: nowTs + i
        });
      }
    }

    gachaState.totalPulls = (gachaState.totalPulls || 0) + 1;
  }

  const historyItems = results.map(r => ({
    pullId: r.pullId,
    name: r.name,
    itemKind: r.itemKind,
    starRarity: r.starRarity,
    isWhiff: r.isWhiff,
    isRefundedHero: Boolean(r.isRefundedHero),
    refundGoldAmount: Number(r.refundGoldAmount) || 0,
    rateOutcome: r.rateOutcome || '',
    bannerType: r.bannerType,
    timestamp: r.timestamp
  }));

  const nextProfile = normalizeKnightRpgProfile({
    ...profile,
    gold: nextGold,
    wishes: nextWishes,
    unlockedSkins: Array.from(unlockedSkinsSet),
    unlockedWeapons: Array.from(unlockedWeaponsSet),
    weaponCounts,
    gachaState,
    wishHistory: [...historyItems.reverse(), ...(profile.wishHistory || [])].slice(0, 50)
  });

  const maxRarity = results.reduce((mx, r) => Math.max(mx, r.starRarity || 3), 3);

  return {
    ok: true,
    nextProfile,
    results,
    maxRarity,
    has5Star: maxRarity === 5,
    has4Star: maxRarity === 4,
    allWhiff: results.every(r => r.isWhiff),
    wishesSpent: wishesToSpend,
    goldSpent: goldCost
  };
}

export function normalizeKnightRpgProfile(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const rawGold = obj.gold === undefined || obj.gold === null ? 150 : Number(obj.gold);
  const gold = Math.max(0, Math.min(99_999_999, Math.floor(Number.isFinite(rawGold) ? rawGold : 150)));
  const rawKeys = obj.keys === undefined || obj.keys === null ? 1 : Number(obj.keys);
  const keys = Math.max(0, Math.min(999, Math.floor(Number.isFinite(rawKeys) ? rawKeys : 1)));
  const rawWishes = obj.wishes === undefined || obj.wishes === null ? 0 : Number(obj.wishes);
  const wishes = Math.max(0, Math.min(99_999, Math.floor(Number.isFinite(rawWishes) ? rawWishes : 0)));
  const claimedServerWishCredits = Math.max(
    0,
    Math.floor(Number(obj.claimedServerWishCredits) || 0)
  );

  const rawSkins = Array.isArray(obj.unlockedSkins) ? obj.unlockedSkins.map(String) : [];
  const validSkinIds = new Set(KNIGHT_CHARACTER_SKINS.map(s => s.id));
  const unlockedSkins = Array.from(
    new Set(['knight_arthur', ...rawSkins.filter(id => validSkinIds.has(id))])
  );
  const equippedSkin = unlockedSkins.includes(String(obj.equippedSkin || ''))
    ? String(obj.equippedSkin)
    : 'knight_arthur';

  const validWeaponIds = new Set(KNIGHT_GACHA_WEAPONS.map(w => w.id));
  const rawWeapons = Array.isArray(obj.unlockedWeapons) ? obj.unlockedWeapons.map(String) : [];
  const unlockedWeapons = Array.from(new Set(rawWeapons.filter(id => validWeaponIds.has(id))));

  const rawWpCounts = obj.weaponCounts && typeof obj.weaponCounts === 'object' ? obj.weaponCounts : {};
  const weaponCounts = {};
  unlockedWeapons.forEach(id => {
    weaponCounts[id] = Math.max(1, Math.min(9999, Math.floor(Number(rawWpCounts[id]) || 1)));
  });

  // Per-character cosmetic weapon assignment (validated by weaponClass!)
  const rawHeroWpMap =
    obj.heroEquippedWeapons && typeof obj.heroEquippedWeapons === 'object'
      ? obj.heroEquippedWeapons
      : {};
  const heroEquippedWeapons = {};
  Object.entries(rawHeroWpMap).forEach(([hId, wId]) => {
    const heroObj = KNIGHT_CHARACTER_SKINS.find(s => s.id === hId);
    const wpObj = KNIGHT_GACHA_WEAPONS.find(w => w.id === String(wId || ''));
    if (heroObj && wpObj && unlockedWeapons.includes(wpObj.id) && canHeroEquipWeapon(heroObj, wpObj)) {
      heroEquippedWeapons[hId] = wpObj.id;
    }
  });

  // Migrate legacy single equippedWeapon if valid for equippedSkin
  if (obj.equippedWeapon && !heroEquippedWeapons[equippedSkin]) {
    const activeHero = KNIGHT_CHARACTER_SKINS.find(s => s.id === equippedSkin);
    const legacyWp = KNIGHT_GACHA_WEAPONS.find(w => w.id === String(obj.equippedWeapon));
    if (activeHero && legacyWp && unlockedWeapons.includes(legacyWp.id) && canHeroEquipWeapon(activeHero, legacyWp)) {
      heroEquippedWeapons[equippedSkin] = legacyWp.id;
    }
  }

  const equippedWeapon = heroEquippedWeapons[equippedSkin] || '';

  const rawGacha = obj.gachaState && typeof obj.gachaState === 'object' ? obj.gachaState : {};
  const gachaState = {
    charPity5: Math.max(0, Math.min(89, Math.floor(Number(rawGacha.charPity5) || 0))),
    charPity4: Math.max(0, Math.min(9, Math.floor(Number(rawGacha.charPity4) || 0))),
    charGuaranteed5: Boolean(rawGacha.charGuaranteed5),
    charGuaranteed4: Boolean(rawGacha.charGuaranteed4),
    stdPity5: Math.max(0, Math.min(89, Math.floor(Number(rawGacha.stdPity5) || 0))),
    stdPity4: Math.max(0, Math.min(9, Math.floor(Number(rawGacha.stdPity4) || 0))),
    totalPulls: Math.max(0, Math.floor(Number(rawGacha.totalPulls) || 0))
  };

  const wishHistory = Array.isArray(obj.wishHistory)
    ? obj.wishHistory
        .filter(item => item && typeof item === 'object' && item.name)
        .slice(0, 50)
        .map(item => ({
          pullId: String(item.pullId || ''),
          name: String(item.name || ''),
          itemKind: String(item.itemKind || 'weapon'),
          starRarity: Math.max(3, Math.min(5, Math.floor(Number(item.starRarity) || 3))),
          isWhiff: Boolean(item.isWhiff),
          isRefundedHero: Boolean(item.isRefundedHero),
          refundGoldAmount: Math.max(0, Math.floor(Number(item.refundGoldAmount) || 0)),
          rateOutcome: String(item.rateOutcome || ''),
          bannerType: String(item.bannerType || 'character_event'),
          timestamp: Number(item.timestamp) || 0
        }))
    : [];

  const monstersSlain = Math.max(0, Math.floor(Number(obj.monstersSlain) || 0));
  const dragonsSlain = Math.max(0, Math.floor(Number(obj.dragonsSlain) || 0));
  const demonKingsSlain = Math.max(0, Math.floor(Number(obj.demonKingsSlain) || 0));
  const keysCollected = Math.max(keys, Math.floor(Number(obj.keysCollected) || keys));
  const bestScore = Math.max(0, Math.floor(Number(obj.bestScore) || 0));

  return {
    gold,
    keys,
    wishes,
    claimedServerWishCredits,
    unlockedSkins,
    equippedSkin,
    unlockedWeapons,
    weaponCounts,
    heroEquippedWeapons,
    equippedWeapon,
    gachaState,
    wishHistory,
    monstersSlain,
    dragonsSlain,
    demonKingsSlain,
    keysCollected,
    bestScore
  };
}

export function applyServerPurchasedWishes(profileObj, userRecord = null) {
  const normalized = normalizeKnightRpgProfile(profileObj || {});
  const serverPurchasedTotal = Math.max(0, Math.floor(Number(userRecord?.gachaWishCredits) || 0));
  if (serverPurchasedTotal > normalized.claimedServerWishCredits) {
    const delta = serverPurchasedTotal - normalized.claimedServerWishCredits;
    return normalizeKnightRpgProfile({
      ...normalized,
      wishes: normalized.wishes + delta,
      claimedServerWishCredits: serverPurchasedTotal
    });
  }
  return normalized;
}

export function loadLocalKnightRpgProfile(username = 'guest', userRecord = null) {
  const serverProfile = userRecord?.knightRpgProfile ? normalizeKnightRpgProfile(userRecord.knightRpgProfile) : null;
  if (typeof window === 'undefined') {
    return applyServerPurchasedWishes(serverProfile || normalizeKnightRpgProfile({}), userRecord);
  }
  try {
    const key = `${KNIGHT_STORAGE_KEY_PREFIX}:${String(username || 'guest').toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    const localProfile = raw ? normalizeKnightRpgProfile(JSON.parse(raw)) : null;
    if (!localProfile && !serverProfile) return applyServerPurchasedWishes({}, userRecord);
    if (!localProfile) return applyServerPurchasedWishes(serverProfile, userRecord);
    if (!serverProfile) return applyServerPurchasedWishes(localProfile, userRecord);

    const mergedSkins = Array.from(new Set([...localProfile.unlockedSkins, ...serverProfile.unlockedSkins]));
    const mergedWeapons = Array.from(new Set([...localProfile.unlockedWeapons, ...serverProfile.unlockedWeapons]));
    const mergedWeaponCounts = { ...(serverProfile.weaponCounts || {}) };
    Object.entries(localProfile.weaponCounts || {}).forEach(([k, v]) => {
      mergedWeaponCounts[k] = Math.max(mergedWeaponCounts[k] || 0, v);
    });
    const mergedHeroWp = {
      ...(serverProfile.heroEquippedWeapons || {}),
      ...(localProfile.heroEquippedWeapons || {})
    };

    const localPulls = localProfile.gachaState?.totalPulls || 0;
    const serverPulls = serverProfile.gachaState?.totalPulls || 0;
    const newerByPulls = localPulls >= serverPulls ? localProfile : serverProfile;

    const mergedBase = normalizeKnightRpgProfile({
      gold: newerByPulls.gold,
      keys: Math.max(localProfile.keys, serverProfile.keys),
      wishes: newerByPulls.wishes,
      claimedServerWishCredits: Math.max(
        localProfile.claimedServerWishCredits || 0,
        serverProfile.claimedServerWishCredits || 0
      ),
      unlockedSkins: mergedSkins,
      equippedSkin: localProfile.equippedSkin || serverProfile.equippedSkin,
      unlockedWeapons: mergedWeapons,
      weaponCounts: mergedWeaponCounts,
      heroEquippedWeapons: mergedHeroWp,
      gachaState: newerByPulls.gachaState,
      wishHistory: newerByPulls.wishHistory,
      monstersSlain: Math.max(localProfile.monstersSlain, serverProfile.monstersSlain),
      dragonsSlain: Math.max(localProfile.dragonsSlain, serverProfile.dragonsSlain),
      demonKingsSlain: Math.max(localProfile.demonKingsSlain, serverProfile.demonKingsSlain),
      keysCollected: Math.max(localProfile.keysCollected, serverProfile.keysCollected),
      bestScore: Math.max(localProfile.bestScore, serverProfile.bestScore)
    });

    return applyServerPurchasedWishes(mergedBase, userRecord);
  } catch {
    return applyServerPurchasedWishes(serverProfile || {}, userRecord);
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
