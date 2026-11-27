// ==========================================
// KNIGHT & DRAGON RPG ("HIỆP SĨ DIỆT RỒNG")
// Weekly Rotating Limited Banner (7-Day Cycle), Standard Pool vs Exclusive Limited Pool,
// 10k (4★) / 200k (5★) Duplicate Hero Refunds & Class-Matched Cosmetic Weapons
// ==========================================

export const KNIGHT_STORAGE_KEY_PREFIX = 'ielts_knight_rpg_profile_v1';

export const KNIGHT_HINT_SCORE_COST = 300;
export const DEATH_REVIVE_DELAY_SEC = 5;
export const REVIVE_KEY_GOLD_PRICE = 100;

// Gacha Costs, Starter Gift & Duplicate Refunds
export const STARTER_FIRST_GAME_FREE_WISHES = 10; // Quà Tân Thủ: Hoàn thành game đầu tiên tặng ngay +10 lượt quay miễn phí
export const KNIGHT_GACHA_GOLD_SINGLE = 10000; // 10.000 Vàng = 1 lượt quay
export const KNIGHT_GACHA_GOLD_TEN = 100000; // 100.000 Vàng = 10 lượt quay
export const KNIGHT_DUPLICATE_HERO_5_REFUND_GOLD = 200000; // Trùng nhân vật 5★ → hoàn 200.000 Vàng
export const KNIGHT_DUPLICATE_HERO_4_REFUND_GOLD = 10000; // Trùng nhân vật 4★ → hoàn 10.000 Vàng
export const KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD = 500; // Quay ra 3★ = Tạch Gacha → hoàn ngay 500 Vàng

// Weekly Banner & Game Leaderboard Reset: strictly every Monday 00:00 Vietnam time (UTC+7)
export const LIMITED_BANNER_ROTATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày
export const VN_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
export const VN_MONDAY_EPOCH_OFFSET_MS = 4 * 24 * 60 * 60 * 1000; // 1970-01-05 00:00 was Monday

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
// 33 HEROES (100% MEME ROSTER!):
// - 1 Starter: Chiến Thần Ngỗng Trắng Ngậm Kiếm (4★)
// - 13 Standard 4★ Meme Heroes (pool: 'standard')
// - 10 Standard 5★ Meme Heroes (pool: 'standard' — Banner Thường & lệch 50/50 ở Banner Giới Hạn)
// - 9 Exclusive Limited 5★ Meme Heroes (pool: 'limited' — ONLY obtainable on 7-day Weekly Limited Banner)
// ==========================================
export const KNIGHT_CHARACTER_SKINS = [
  {
    id: 'knight_arthur',
    name: 'Chiến Thần Ngỗng Trắng Ngậm Kiếm',
    gender: 'Meme',
    genderBadge: '🪿 Meme',
    rarity: 'Mặc Định',
    starRarity: 4,
    pool: 'starter',
    isStarter: true,
    obtainMethod: 'starter',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: 0,
    weaponName: 'Thánh Kiếm Ngậm Mỏ (Peace Was Never An Option)',
    memeQuote: '“Quạc! Hòa bình chưa bao giờ là lựa chọn, vào chém quái ngay!”',
    passiveText: 'Nhân vật tân thủ • Cắn quái không trượt phát nào',
    spriteUrl: '/assets/knight-rpg/knight_arthur.svg',
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
    name: 'Thánh Mèo Chữ O Pop Cat',
    gender: 'Meme',
    genderBadge: '😮 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Song Kiếm Âm Thanh POP-POP-POP',
    memeQuote: '“POP! POP! POP! Tung chiêu 1 nhịp bay hết đáp án sai!”',
    passiveText: '+15% Vàng khi hạ quái • Sức mạnh POP liên hoàn',
    spriteUrl: '/assets/knight-rpg/valkyrie_freya.svg',
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
    name: 'Thánh Nhây Trollface Huyền Thoại',
    gender: 'Meme',
    genderBadge: '😈 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm Tấu Hài (Problem, Boss Rồng?)',
    memeQuote: '“Ủa Boss Rồng bất ngờ chưa? Problem? Hahaha!”',
    passiveText: '+18% Vàng khi hạ quái • Nụ cười chọc tức Boss',
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
    name: 'Kiếm Khách Mèo Gõ Bongo Cat',
    gender: 'Meme',
    genderBadge: '🥁 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Đao Gõ Trống Bongo Tốc Độ Ánh Sáng',
    memeQuote: '“Bụp bụp bụp! Tay gõ 300 phím/phút né luôn deadline!”',
    passiveText: '+25% Vàng khi hạ quái • Gõ nhịp anh đào siêu tốc',
    spriteUrl: '/assets/knight-rpg/samurai_tomoe.svg',
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
    name: 'Pháp Sư Cú Xanh Nhắc Học Bài',
    gender: 'Meme',
    genderBadge: '🦉 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Quyền Trượng Giữ Chuỗi Streak 365 Ngày',
    memeQuote: '“23:59 rồi mà chưa học từ mới hả?? Vào ôn bài ngay!”',
    passiveText: '+20% Vàng • +3 giây mỗi câu (Áp lực nhắc học bài)',
    spriteUrl: '/assets/knight-rpg/mage_selena.svg',
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
    id: 'cheems_bonk',
    name: 'Thần Chó Cheems Gậy Bonk',
    gender: 'Meme',
    genderBadge: '🐕 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Chày Gỗ BONK Chống Lười Học',
    memeQuote: '“BONK! Quái vật dám quên từ vựng hả!”',
    passiveText: '+22% Vàng • +1 giây mỗi câu (Gõ Bonk u đầu quái)',
    spriteUrl: '/assets/knight-rpg/cheems_bonk.svg',
    slashStyle: 'solar',
    goldBonusPct: 22,
    keyDropBonusPct: 3,
    bonusTimeSec: 1,
    armorPrimary: '#f59e0b',
    armorSecondary: '#fde68a',
    capeColor: '#dc2626',
    hairColor: '#fbbf24',
    hairStyle: 'short_spiky',
    headgear: 'knight_visor',
    bladeColor: '#fbbf24',
    slashColor: '#fde047'
  },
  {
    id: 'smudge_cat',
    name: 'Hoàng Thượng Mèo Trắng Đa Nghi',
    gender: 'Meme',
    genderBadge: '😼 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Đĩa Salad Phán Xét Vũ Trụ',
    memeQuote: '“Ủa tự nhiên bắt trẫm học từ vựng là sao??”',
    passiveText: '+24% Vàng • +2 giây mỗi câu (Ánh mắt khinh bỉ)',
    spriteUrl: '/assets/knight-rpg/smudge_cat.svg',
    slashStyle: 'arcane',
    goldBonusPct: 24,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#9333ea',
    armorSecondary: '#f8fafc',
    capeColor: '#6b21a8',
    hairColor: '#ffffff',
    hairStyle: 'short_spiky',
    headgear: 'star_tiara',
    bladeColor: '#34d399',
    slashColor: '#6ee7b7'
  },
  {
    id: 'nyan_cat_mage',
    name: 'Mèo Cầu Vồng Nyan Cat',
    gender: 'Meme',
    genderBadge: '🌈 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Bánh Nướng Dâu Tây Cầu Vồng 8-Bit',
    memeQuote: '“Nyan nyan nyan~ Bay vèo qua 4 ải không kịp nhìn đề!”',
    passiveText: '+23% Vàng • +2 giây mỗi câu (Đường bay cầu vồng)',
    spriteUrl: '/assets/knight-rpg/nyan_cat_mage.svg',
    slashStyle: 'plasma',
    goldBonusPct: 23,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#ec4899',
    armorSecondary: '#38bdf8',
    capeColor: '#7c3aed',
    hairColor: '#f472b6',
    hairStyle: 'twin_tails',
    headgear: 'star_tiara',
    bladeColor: '#f472b6',
    slashColor: '#38bdf8'
  },
  {
    id: 'this_is_fine_dog',
    name: 'Chú Chó Giữa Biển Lửa',
    gender: 'Meme',
    genderBadge: '🔥 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Ly Cà Phê Bình Tâm Giữa Biển Lửa',
    memeQuote: '“Còn 1 giây hết giờ, máu còn 1 tim: Ổn mà, mọi thứ vẫn ổn!”',
    passiveText: '+21% Vàng • +2 giây mỗi câu (Tinh thần thép This Is Fine)',
    spriteUrl: '/assets/knight-rpg/this_is_fine_dog.svg',
    slashStyle: 'magma',
    goldBonusPct: 21,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#ea580c',
    armorSecondary: '#fde047',
    capeColor: '#b91c1c',
    hairColor: '#fbbf24',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#fb923c',
    slashColor: '#fde047'
  },
  {
    id: 'stonks_meme_man',
    name: 'Chuyên Gia Đầu Tư Stonks',
    gender: 'Meme',
    genderBadge: '📈 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Mũi Tên Biểu Đồ Tăng Trưởng Dựng Đứng',
    memeQuote: '“Đoán đại trúng từ khó — Vàng tăng STONKS dựng đứng!”',
    passiveText: '+28% Vàng • +1 giây mỗi câu (Lãi kép diệt quái)',
    spriteUrl: '/assets/knight-rpg/stonks_meme_man.svg',
    slashStyle: 'plasma',
    goldBonusPct: 28,
    keyDropBonusPct: 3,
    bonusTimeSec: 1,
    armorPrimary: '#1e293b',
    armorSecondary: '#22c55e',
    capeColor: '#0f172a',
    hairColor: '#cbd5e1',
    hairStyle: 'short_spiky',
    headgear: 'cyber_halo',
    bladeColor: '#22c55e',
    slashColor: '#4ade80'
  },
  {
    id: 'crying_banana_cat',
    name: 'Mèo Chuối Mít Ướt',
    gender: 'Meme',
    genderBadge: '🍌 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Thánh Kiếm Vỏ Chuối Trơn Trượt',
    memeQuote: '“Hu hu sao câu này dài quá vậy... nhưng em vẫn chém trúng!”',
    passiveText: '+20% Vàng • +2 giây mỗi câu (Nước mắt cá sấu)',
    spriteUrl: '/assets/knight-rpg/crying_banana_cat.svg',
    slashStyle: 'solar',
    goldBonusPct: 20,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#facc15',
    armorSecondary: '#fef08a',
    capeColor: '#ca8a04',
    hairColor: '#fde047',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#fde047',
    slashColor: '#38bdf8'
  },
  {
    id: 'el_gato_boots',
    name: 'Mèo Đi Hia Mắt Long Lanh',
    gender: 'Meme',
    genderBadge: '🐱 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Kiếm Liễu Tây Ban Nha Xin Tha Mạng',
    memeQuote: '“Nhìn đôi mắt long lanh này đi Boss Rồng nỡ khè lửa sao?”',
    passiveText: '+22% Vàng • +2 giây mỗi câu (Mắt ướt làm mềm lòng Boss)',
    spriteUrl: '/assets/knight-rpg/el_gato_boots.svg',
    slashStyle: 'holy',
    goldBonusPct: 22,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#ea580c',
    armorSecondary: '#fde68a',
    capeColor: '#7c2d12',
    hairColor: '#f97316',
    hairStyle: 'short_spiky',
    headgear: 'knight_visor',
    bladeColor: '#e2e8f0',
    slashColor: '#fbbf24'
  },
  {
    id: 'question_mark_guy',
    name: 'Chiến Thần Chấm Hỏi ???',
    gender: 'Meme',
    genderBadge: '❓ Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Trường Thương Ba Dấu Hỏi Chấm ???',
    memeQuote: '“Ủa từ này học hồi nào vậy cô?? Khoanh đại trúng luôn ???”',
    passiveText: '+23% Vàng • +2 giây mỗi câu (Hoang mang cực độ)',
    spriteUrl: '/assets/knight-rpg/question_mark_guy.svg',
    slashStyle: 'thunder',
    goldBonusPct: 23,
    keyDropBonusPct: 3,
    bonusTimeSec: 2,
    armorPrimary: '#7c3aed',
    armorSecondary: '#facc15',
    capeColor: '#4c1d95',
    hairColor: '#0f172a',
    hairStyle: 'short_spiky',
    headgear: 'thunder_band',
    bladeColor: '#facc15',
    slashColor: '#fde047'
  },
  {
    id: 'pointing_laugh_cat',
    name: 'Mèo Cười Chỉ Tay Quê Chữ Ê',
    gender: 'Meme',
    genderBadge: '🫵 Meme',
    rarity: '4★ Thường',
    starRarity: 4,
    pool: 'standard',
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Bàn Tay Vàng Chỉ Điểm Quái Vật',
    memeQuote: '“Hahaha Boss Rồng đánh hụt rồi kìa, ngại quá đi!!”',
    passiveText: '+24% Vàng • +1 giây mỗi câu (Sát thương tâm lý cực mạnh)',
    spriteUrl: '/assets/knight-rpg/pointing_laugh_cat.svg',
    slashStyle: 'crimson',
    goldBonusPct: 24,
    keyDropBonusPct: 3,
    bonusTimeSec: 1,
    armorPrimary: '#f43f5e',
    armorSecondary: '#facc15',
    capeColor: '#be185d',
    hairColor: '#ffffff',
    hairStyle: 'short_spiky',
    headgear: 'star_tiara',
    bladeColor: '#facc15',
    slashColor: '#fb7185'
  },

  // ---- 5★ STANDARD POOL (Banner Thường & lệch 50/50 ở Banner Giới Hạn) ----
  {
    id: 'ronin_kenji',
    name: 'Kiếm Sĩ Thông Thái Chỉ Đầu Roll Safe',
    gender: 'Meme',
    genderBadge: '🧠 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Thương Mẹo Thi Không Cần Nháp (Suy Nghĩ Lên!)',
    memeQuote: '“Không thể làm sai câu này nếu bạn đọc kỹ đáp án C!”',
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
    name: 'Sát Thủ Cười Gượng Hide The Pain',
    gender: 'Meme',
    genderBadge: '☕ Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Song Đao Cười Cho Qua Nỗi Đau Đọc Hiểu',
    memeQuote: '“Ngoài mặt cười tươi nhưng trong lòng đang cắn răng nhớ từ vựng!”',
    passiveText: '+34% Vàng • +1 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/assassin_kael.svg',
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
    name: 'Hiệp Sĩ Ếch Áo Choàng Hắc Ám Kermit',
    gender: 'Meme',
    genderBadge: '🕶️ Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm RGB Xúi Nghỉ Học Nhưng Vẫn Cày',
    memeQuote: '“Bản thân: đi ngủ đi • Nội tâm hắc ám: bật gacha thêm 10 nháy nữa!”',
    passiveText: '+38% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/cyber_nova.svg',
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
  {
    id: 'pepe_wizard',
    name: 'Pháp Sư Ếch Xanh Pepe',
    gender: 'Meme',
    genderBadge: '🐸 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Bí Kíp Chống Liệt IELTS 9.0',
    memeQuote: '“Feels Good Man — Đoán bừa cũng trúng!”',
    passiveText: '+36% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/pepe_wizard.svg',
    slashStyle: 'arcane',
    goldBonusPct: 36,
    keyDropBonusPct: 4,
    bonusTimeSec: 2,
    armorPrimary: '#4338ca',
    armorSecondary: '#4ade80',
    capeColor: '#312e81',
    hairColor: '#22c55e',
    hairStyle: 'short_spiky',
    headgear: 'star_tiara',
    bladeColor: '#4ade80',
    slashColor: '#fde047'
  },
  {
    id: 'capybara_chill',
    name: 'Thánh Capybara Đội Cam',
    gender: 'Meme',
    genderBadge: '🍊 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Thánh Kiếm Mía Đường Hệ Chill',
    memeQuote: '“Rồng khè lửa kệ Rồng, đội trái quýt chill tiếp”',
    passiveText: '+39% Vàng • +2 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/capybara_chill.svg',
    slashStyle: 'sakura',
    goldBonusPct: 39,
    keyDropBonusPct: 4,
    bonusTimeSec: 2,
    armorPrimary: '#d97706',
    armorSecondary: '#22c55e',
    capeColor: '#059669',
    hairColor: '#b45309',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#22c55e',
    slashColor: '#86efac'
  },
  {
    id: 'buff_doge_titan',
    name: 'Chiến Thần Shiba Cơ Bắp Swole Doge',
    gender: 'Meme',
    genderBadge: '💪 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm Cơ Bắp Cuồn Cuộn 8 Múi',
    memeQuote: '“Học sinh IELTS xưa gõ từ điển giấy — Giờ gõ 1 phát bay Boss!”',
    passiveText: '+40% Vàng • +2 giây mỗi câu (Sức mạnh Shiba cổ đại)',
    spriteUrl: '/assets/knight-rpg/buff_doge_titan.svg',
    slashStyle: 'solar',
    goldBonusPct: 40,
    keyDropBonusPct: 4,
    bonusTimeSec: 2,
    armorPrimary: '#d97706',
    armorSecondary: '#fef08a',
    capeColor: '#991b1b',
    hairColor: '#f59e0b',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#fbbf24',
    slashColor: '#fde047'
  },
  {
    id: 'sigma_moai',
    name: 'Thần Tượng Đá Moai Lạnh Lùng',
    gender: 'Meme',
    genderBadge: '🗿 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Cột Đá Phục Sinh Ngàn Cân 🗿',
    memeQuote: '“🗿 Không chớp mắt, không đổi sắc mặt, âm thầm lụm Top 1”',
    passiveText: '+38% Vàng • +3 giây mỗi câu (Tâm bất biến 🗿)',
    spriteUrl: '/assets/knight-rpg/sigma_moai.svg',
    slashStyle: 'plasma',
    goldBonusPct: 38,
    keyDropBonusPct: 4,
    bonusTimeSec: 3,
    armorPrimary: '#475569',
    armorSecondary: '#38bdf8',
    capeColor: '#1e293b',
    hairColor: '#64748b',
    hairStyle: 'short_spiky',
    headgear: 'cyber_halo',
    bladeColor: '#94a3b8',
    slashColor: '#38bdf8'
  },
  {
    id: 'maxwell_spin_cat',
    name: 'Mèo Đen Xoay Vòng Maxwell',
    gender: 'Meme',
    genderBadge: '🐈‍⬛ Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Đĩa Nhạc Xoay Tròn Vô Tận',
    memeQuote: '“Doo-doo-doo~ Xoay vòng vòng thôi miên cả đàn quái vật!”',
    passiveText: '+37% Vàng • +3 giây mỗi câu (Nhạc xoay thôi miên)',
    spriteUrl: '/assets/knight-rpg/maxwell_spin_cat.svg',
    slashStyle: 'arcane',
    goldBonusPct: 37,
    keyDropBonusPct: 4,
    bonusTimeSec: 3,
    armorPrimary: '#1e293b',
    armorSecondary: '#e879f9',
    capeColor: '#581c87',
    hairColor: '#0f172a',
    hairStyle: 'short_spiky',
    headgear: 'star_tiara',
    bladeColor: '#e879f9',
    slashColor: '#f0abfc'
  },
  {
    id: 'thinking_monkey_sage',
    name: 'Đại Sư Khỉ Trầm Tư Chọn Đáp Án',
    gender: 'Meme',
    genderBadge: '🐒 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Bí Kíp Chống Cằm Ngẫm Nhân Sinh',
    memeQuote: '“Chống cằm suy ngẫm 5 giây... quyết định chọn C vì C đẹp!”',
    passiveText: '+38% Vàng • +3 giây mỗi câu (Trầm tư thấu thiên cơ)',
    spriteUrl: '/assets/knight-rpg/thinking_monkey_sage.svg',
    slashStyle: 'holy',
    goldBonusPct: 38,
    keyDropBonusPct: 4,
    bonusTimeSec: 3,
    armorPrimary: '#0284c7',
    armorSecondary: '#fde047',
    capeColor: '#1e3a8a',
    hairColor: '#92400e',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#38bdf8',
    slashColor: '#fde047'
  },
  {
    id: 'two_buttons_sweat_hero',
    name: 'Siêu Anh Hùng Đổ Mồ Hôi Chọn Đáp Án',
    gender: 'Meme',
    genderBadge: '💦 Meme',
    rarity: '5★ Thường',
    starRarity: 5,
    pool: 'standard',
    isStandard5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Bảng Điều Khiển 2 Nút Đỏ Định Mệnh',
    memeQuote: '“Loại được 2 câu sai rồi, còn 2 câu giống hệt nhau lau mồ hôi hột!”',
    passiveText: '+39% Vàng • +2 giây mỗi câu (Hồi hộp nghẹt thở)',
    spriteUrl: '/assets/knight-rpg/two_buttons_sweat_hero.svg',
    slashStyle: 'crimson',
    goldBonusPct: 39,
    keyDropBonusPct: 4,
    bonusTimeSec: 2,
    armorPrimary: '#ef4444',
    armorSecondary: '#ffffff',
    capeColor: '#991b1b',
    hairColor: '#9a3412',
    hairStyle: 'short_spiky',
    headgear: 'knight_visor',
    bladeColor: '#ef4444',
    slashColor: '#fca5a5'
  },

  // ---- 9 EXCLUSIVE LIMITED 5★ MEME HEROES (CHỈ XUẤT HIỆN Ở BANNER GIỚI HẠN 7 NGÀY/LẦN — KHÔNG RƠI Ở BANNER THƯỜNG) ----
  {
    id: 'dragon_empress',
    name: 'Rồng Ba Đầu Ngáo Ngơ Kevin',
    gender: 'Meme',
    genderBadge: '🐉 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Hỏa Kiếm 2 Đầu Nghiêm Túc + 1 Đầu Lè Lưỡi',
    memeQuote: '“Hai đầu trái phải đang cực kỳ nghiêm túc, đầu thứ 3 thì... blep 😛!”',
    passiveText: '+50% Vàng • +3 giây mỗi câu',
    spriteUrl: '/assets/knight-rpg/dragon_empress.svg',
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
    name: 'Quý Ngài Gấu Pooh Đế Vương Tuxedo',
    gender: 'Meme',
    genderBadge: '🎩 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Chiến Rìu Quý Tộc Điểm 9.0 Reading',
    memeQuote: '“Pooh thường học tủ từ đơn — Pooh Quý Tộc xài luôn Collocation 8.5!”',
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
    name: 'Đại Pháp Sư Não To Vũ Trụ Galaxy Brain',
    gender: 'Meme',
    genderBadge: '🌌 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Quyền Trượng Thiên Hà IQ Vô Cực',
    memeQuote: '“Đọc câu hỏi trong 0.5 giây — Tia chớp trí tuệ quét sạch 4 ải!”',
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
    name: 'Thánh Nữ Tính Toán Vũ Trụ Math Lady',
    gender: 'Meme',
    genderBadge: '📐 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Thánh Thương Công Thức Hình Học Đa Chiều',
    memeQuote: '“Khoan đã... sin² + cos² = 1 vậy suy ra đáp án câu IELTS này là B!”',
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
    name: 'Lôi Đế Chuột Vàng Tròn Mắt Kinh Ngạc',
    gender: 'Meme',
    genderBadge: '⚡ Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Lôi Thần Kiếm Ơ Kìa Bất Ngờ Chưa?!',
    memeQuote: '“Quái vật vừa khè lửa xong thấy mình trả lời đúng liền tròn mắt kinh ngạc :O!”',
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
  },
  {
    id: 'gigachad_knight',
    name: 'Đại Đế Cơ Bắp GigaChad',
    gender: 'Meme',
    genderBadge: '🗿 Chad',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Kiếm Cằm Vuông Tối Thượng',
    memeQuote: '“Vào phòng thi không cần nháp, gật đầu là qua ải”',
    passiveText: '+52% Vàng • +3 giây mỗi câu (Hào quang Chad)',
    spriteUrl: '/assets/knight-rpg/gigachad_knight.svg',
    slashStyle: 'dragon',
    goldBonusPct: 52,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#cbd5e1',
    armorSecondary: '#fbbf24',
    capeColor: '#991b1b',
    hairColor: '#0f172a',
    hairStyle: 'short_spiky',
    headgear: 'solar_circlet',
    bladeColor: '#fbbf24',
    slashColor: '#fef08a'
  },
  {
    id: 'bing_chilling_panda',
    name: 'Tông Sư Gấu Trúc Kem Ốc Quế',
    gender: 'Meme',
    genderBadge: '🐼 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Thánh Thương Kem Ốc Quế Băng Giá',
    memeQuote: '“Chào buổi sáng! Ăn một cây kem đóng băng Boss Rồng!”',
    passiveText: '+50% Vàng • +3 giây mỗi câu (Kem lạnh tê não)',
    spriteUrl: '/assets/knight-rpg/bing_chilling_panda.svg',
    slashStyle: 'thunder',
    goldBonusPct: 50,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#0284c7',
    armorSecondary: '#38bdf8',
    capeColor: '#0369a1',
    hairColor: '#0f172a',
    hairStyle: 'short_spiky',
    headgear: 'thunder_band',
    bladeColor: '#38bdf8',
    slashColor: '#bae6fd'
  },
  {
    id: 'shrek_swamp_king',
    name: 'Chúa Tể Đầm Lầy Xanh',
    gender: 'Meme',
    genderBadge: '🧅 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Đại Chùy Hành Tây Nhiều Lớp',
    memeQuote: '“Quái vật biến khỏi đầm lầy IELTS của ta ngay lập tức!!”',
    passiveText: '+51% Vàng • +3 giây mỗi câu (Bá chủ Đầm Lầy)',
    spriteUrl: '/assets/knight-rpg/shrek_swamp_king.svg',
    slashStyle: 'dragon',
    goldBonusPct: 51,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#65a30d',
    armorSecondary: '#bef264',
    capeColor: '#78350f',
    hairColor: '#4d7c0f',
    hairStyle: 'short_spiky',
    headgear: 'wolf_pelt',
    bladeColor: '#84cc16',
    slashColor: '#bef264'
  },
  {
    id: 'ultra_instinct_hamster',
    name: 'Chuột Hamster Bản Năng Vô Cực',
    gender: 'Meme',
    genderBadge: '🐹 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    priceGold: null,
    weaponName: 'Thần Thương Hạt Hướng Dương Ánh Bạc',
    memeQuote: '“Nhỏ mà có võ — Bật Bản Năng Vô Cực né mọi đòn khè lửa của Boss Rồng!”',
    passiveText: '+52% Vàng • +3 giây mỗi câu (Hào quang Vô Cực)',
    spriteUrl: '/assets/knight-rpg/ultra_instinct_hamster.svg',
    slashStyle: 'plasma',
    goldBonusPct: 52,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#e2e8f0',
    armorSecondary: '#38bdf8',
    capeColor: '#1d4ed8',
    hairColor: '#f59e0b',
    hairStyle: 'short_spiky',
    headgear: 'cyber_halo',
    bladeColor: '#38bdf8',
    slashColor: '#e0f2fe'
  }  ,
  {
    id: 'capybara_chill_minister',
    name: 'Bộ Trưởng Ngoại Giao Capybara Đội Quýt',
    gender: 'Meme',
    genderBadge: '🍊 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Trúc Kiếm Suối Nước Nóng Điềm Tĩnh',
    memeQuote: '“Trời sập kệ trời, đội quả quýt làm câu từ vựng đã rồi tính.”',
    passiveText: '+53% Vàng • +3 giây mỗi câu (Tâm bất biến giữa dòng đời vạn biến)',
    spriteUrl: '/assets/knight-rpg/capybara_chill_minister.svg',
    slashStyle: 'holy',
    goldBonusPct: 53,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#f97316',
    armorSecondary: '#fde047',
    capeColor: '#0284c7',
    hairColor: '#78350f',
    hairStyle: 'short_spiky',
    headgear: 'gold_crown',
    bladeColor: '#84cc16',
    slashColor: '#fde047'
  },
  {
    id: 'chill_guy_hands_pocket',
    name: 'Chàng Trai Thư Giãn Đút Túi Quần',
    gender: 'Meme',
    genderBadge: '😎 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Tuyệt Kỹ Đút Túi Quần Né Lửa Rồng',
    memeQuote: '“Boss khè lửa căng đấy, nhưng mình chỉ là một chàng trai thư giãn.”',
    passiveText: '+53% Vàng • +3 giây mỗi câu (Thư giãn tuyệt đối)',
    spriteUrl: '/assets/knight-rpg/chill_guy_hands_pocket.svg',
    slashStyle: 'plasma',
    goldBonusPct: 53,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#64748b',
    armorSecondary: '#38bdf8',
    capeColor: '#2563eb',
    hairColor: '#92400e',
    hairStyle: 'short_spiky',
    headgear: 'none',
    bladeColor: '#38bdf8',
    slashColor: '#bae6fd'
  },
  {
    id: 'pedro_spinning_raccoon',
    name: 'Gấu Mèo Pedro Xoay Vòng Disco',
    gender: 'Meme',
    genderBadge: '🦝 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Vòng Xoay Disco Chóng Mặt Boss',
    memeQuote: '“Pedro Pedro Pedro — Xoay một vòng bay sạch máu quái!”',
    passiveText: '+54% Vàng • +3 giây mỗi câu (Nhịp điệu bất tận)',
    spriteUrl: '/assets/knight-rpg/pedro_spinning_raccoon.svg',
    slashStyle: 'arcane',
    goldBonusPct: 54,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#a855f7',
    armorSecondary: '#f472b6',
    capeColor: '#4c1d95',
    hairColor: '#475569',
    hairStyle: 'short_spiky',
    headgear: 'cyber_halo',
    bladeColor: '#e879f9',
    slashColor: '#f5d0fe'
  },
  {
    id: 'maxwell_spinning_cat',
    name: 'Hoàng Thượng Mèo Đen Xoay 3D Maxwell',
    gender: 'Meme',
    genderBadge: '🐈‍⬛ Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Sóng Âm Nằm Im Xoay 360 Độ',
    memeQuote: '“Chỉ cần xoay vòng 360 độ cũng dọn sạch 4 ải!”',
    passiveText: '+52% Vàng • +3 giây mỗi câu (Quỹ đạo Mèo 3D)',
    spriteUrl: '/assets/knight-rpg/maxwell_spinning_cat.svg',
    slashStyle: 'arcane',
    goldBonusPct: 52,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#18181b',
    armorSecondary: '#38bdf8',
    capeColor: '#ef4444',
    hairColor: '#09090b',
    hairStyle: 'short_spiky',
    headgear: 'none',
    bladeColor: '#38bdf8',
    slashColor: '#e0f2fe'
  },
  {
    id: 'coffin_dance_captain',
    name: 'Đội Trưởng Nhạc Hội Kính Đen',
    gender: 'Meme',
    genderBadge: '🕶️ Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Nhạc Hội Vũ Điệu Tiễn Quái',
    memeQuote: '“Quái vật dám chặn đường? Nhạc nổi lên tiễn về sảnh ngay!”',
    passiveText: '+55% Vàng • +3 giây mỗi câu (Vũ điệu tiễn biệt)',
    spriteUrl: '/assets/knight-rpg/coffin_dance_captain.svg',
    slashStyle: 'holy',
    goldBonusPct: 55,
    keyDropBonusPct: 7,
    bonusTimeSec: 3,
    armorPrimary: '#18181b',
    armorSecondary: '#fbbf24',
    capeColor: '#dc2626',
    hairColor: '#09090b',
    hairStyle: 'short_spiky',
    headgear: 'gold_crown',
    bladeColor: '#fbbf24',
    slashColor: '#fef08a'
  },
  {
    id: 'uno_reverse_sorcerer',
    name: 'Pháp Sư Thẻ Đảo Ngược Uno Reverse',
    gender: 'Meme',
    genderBadge: '🔄 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    priceGold: null,
    weaponName: 'Thần Bài Đảo Ngược Sát Thương Vũ Trụ',
    memeQuote: '“Boss định chém ta ư? Rút thẻ Đảo Ngược trả lại gấp đôi!”',
    passiveText: '+54% Vàng • +3 giây mỗi câu (Phản đòn định mệnh)',
    spriteUrl: '/assets/knight-rpg/uno_reverse_sorcerer.svg',
    slashStyle: 'dragon',
    goldBonusPct: 54,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#ef4444',
    armorSecondary: '#fde047',
    capeColor: '#2563eb',
    hairColor: '#7c3aed',
    hairStyle: 'short_spiky',
    headgear: 'wizard_hat',
    bladeColor: '#f59e0b',
    slashColor: '#fde047'
  },
  {
    id: 'patrick_sigma_suit',
    name: 'Quý Ông Lạnh Lùng Nhíu Mày Sigma',
    gender: 'Meme',
    genderBadge: '🗿 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'sword',
    weaponClassLabel: 'Hệ Kiếm',
    priceGold: null,
    weaponName: 'Ánh Nhìn Điện Ảnh Bĩu Môi Tối Thượng',
    memeQuote: '“Ấn tượng đấy. Bây giờ hãy nhìn tốc độ chém từ vựng của ta.”',
    passiveText: '+55% Vàng • +3 giây mỗi câu (Thần thái đỉnh cao)',
    spriteUrl: '/assets/knight-rpg/patrick_sigma_suit.svg',
    slashStyle: 'crimson',
    goldBonusPct: 55,
    keyDropBonusPct: 7,
    bonusTimeSec: 3,
    armorPrimary: '#18181b',
    armorSecondary: '#e11d48',
    capeColor: '#27272a',
    hairColor: '#18181b',
    hairStyle: 'short_spiky',
    headgear: 'none',
    bladeColor: '#f43f5e',
    slashColor: '#fda4af'
  },
  {
    id: 'el_risitas_laugh_lord',
    name: 'Thánh Cười Sặc Sụa Đập Bàn',
    gender: 'Meme',
    genderBadge: '😂 Meme',
    rarity: '5★ Giới Hạn',
    starRarity: 5,
    pool: 'limited',
    isLimited5Star: true,
    obtainMethod: 'gacha',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    priceGold: null,
    weaponName: 'Chưởng Pháp Đập Bàn Cười Vỡ Bụng',
    memeQuote: '“Hahaha câu hỏi thế này mà Boss Rồng cũng đem ra dọa à!”',
    passiveText: '+53% Vàng • +3 giây mỗi câu (Tiếng cười chấn thiên)',
    spriteUrl: '/assets/knight-rpg/el_risitas_laugh_lord.svg',
    slashStyle: 'holy',
    goldBonusPct: 53,
    keyDropBonusPct: 6,
    bonusTimeSec: 3,
    armorPrimary: '#dc2626',
    armorSecondary: '#facc15',
    capeColor: '#991b1b',
    hairColor: '#292524',
    hairStyle: 'short_spiky',
    headgear: 'none',
    bladeColor: '#facc15',
    slashColor: '#fef08a'
  }
];

// Strictly ONE active Limited Banner per week! Resets every Monday at 00:00 Vietnam time (or Admin next-hero pick).
export const KNIGHT_LIMITED_BANNERS = [
  {
    id: 'limited_gigachad',
    featuredHeroId: 'gigachad_knight',
    bannerTitle: 'Banner Giới Hạn: Đại Đế Cơ Bắp GigaChad',
    featured4StarIds: ['cheems_bonk', 'nyan_cat_mage', 'stonks_meme_man']
  },
  {
    id: 'limited_panda',
    featuredHeroId: 'bing_chilling_panda',
    bannerTitle: 'Banner Giới Hạn: Tông Sư Gấu Trúc Kem Ốc Quế',
    featured4StarIds: ['smudge_cat', 'this_is_fine_dog', 'question_mark_guy']
  },
  {
    id: 'limited_shrek',
    featuredHeroId: 'shrek_swamp_king',
    bannerTitle: 'Banner Giới Hạn: Chúa Tể Đầm Lầy Xanh',
    featured4StarIds: ['el_gato_boots', 'pointing_laugh_cat', 'crying_banana_cat']
  },
  {
    id: 'limited_hamster',
    featuredHeroId: 'ultra_instinct_hamster',
    bannerTitle: 'Banner Giới Hạn: Chuột Hamster Bản Năng Vô Cực',
    featured4StarIds: ['nyan_cat_mage', 'stonks_meme_man', 'cheems_bonk']
  },
  {
    id: 'limited_ignis',
    featuredHeroId: 'dragon_empress',
    bannerTitle: 'Banner Giới Hạn: Rồng Ba Đầu Ngáo Ngơ Kevin',
    featured4StarIds: ['this_is_fine_dog', 'mage_selena', 'samurai_tomoe']
  },
  {
    id: 'limited_drake',
    featuredHeroId: 'berserker_drake',
    bannerTitle: 'Banner Giới Hạn: Quý Ngài Gấu Pooh Tuxedo',
    featured4StarIds: ['smudge_cat', 'question_mark_guy', 'paladin_leon']
  },
  {
    id: 'limited_zephyr',
    featuredHeroId: 'archmage_zephyr',
    bannerTitle: 'Banner Giới Hạn: Đại Pháp Sư Não To Galaxy Brain',
    featured4StarIds: ['nyan_cat_mage', 'mage_selena', 'valkyrie_freya']
  },
  {
    id: 'limited_celestia',
    featuredHeroId: 'valkyrie_celestia',
    bannerTitle: 'Banner Giới Hạn: Thánh Nữ Tính Toán Math Lady',
    featured4StarIds: ['el_gato_boots', 'samurai_tomoe', 'valkyrie_freya']
  },
  {
    id: 'limited_raiden',
    featuredHeroId: 'emperor_raiden',
    bannerTitle: 'Banner Giới Hạn: Lôi Đế Chuột Vàng Kinh Ngạc',
    featured4StarIds: ['stonks_meme_man', 'pointing_laugh_cat', 'samurai_tomoe']
  },
  {
    id: 'limited_capybara_minister',
    featuredHeroId: 'capybara_chill_minister',
    bannerTitle: 'Banner Giới Hạn: Bộ Trưởng Capybara Đội Quýt',
    featured4StarIds: ['cheems_bonk', 'smudge_cat', 'crying_banana_cat']
  },
  {
    id: 'limited_chill_guy',
    featuredHeroId: 'chill_guy_hands_pocket',
    bannerTitle: 'Banner Giới Hạn: Chàng Trai Thư Giãn Chill Guy',
    featured4StarIds: ['stonks_meme_man', 'this_is_fine_dog', 'question_mark_guy']
  },
  {
    id: 'limited_pedro_raccoon',
    featuredHeroId: 'pedro_spinning_raccoon',
    bannerTitle: 'Banner Giới Hạn: Gấu Mèo Pedro Xoay Vòng Disco',
    featured4StarIds: ['nyan_cat_mage', 'valkyrie_freya', 'samurai_tomoe']
  },
  {
    id: 'limited_maxwell_cat',
    featuredHeroId: 'maxwell_spinning_cat',
    bannerTitle: 'Banner Giới Hạn: Mèo Đen Xoay 3D Maxwell',
    featured4StarIds: ['el_gato_boots', 'pointing_laugh_cat', 'smudge_cat']
  },
  {
    id: 'limited_coffin_captain',
    featuredHeroId: 'coffin_dance_captain',
    bannerTitle: 'Banner Giới Hạn: Đội Trưởng Nhạc Hội Kính Đen',
    featured4StarIds: ['paladin_leon', 'stonks_meme_man', 'cheems_bonk']
  },
  {
    id: 'limited_uno_reverse',
    featuredHeroId: 'uno_reverse_sorcerer',
    bannerTitle: 'Banner Giới Hạn: Pháp Sư Thẻ Đảo Ngược Uno Reverse',
    featured4StarIds: ['mage_selena', 'nyan_cat_mage', 'question_mark_guy']
  },
  {
    id: 'limited_patrick_sigma',
    featuredHeroId: 'patrick_sigma_suit',
    bannerTitle: 'Banner Giới Hạn: Quý Ông Lạnh Lùng Nhíu Mày Sigma',
    featured4StarIds: ['stonks_meme_man', 'paladin_leon', 'samurai_tomoe']
  },
  {
    id: 'limited_el_risitas',
    featuredHeroId: 'el_risitas_laugh_lord',
    bannerTitle: 'Banner Giới Hạn: Thánh Cười Sặc Sụa Đập Bàn',
    featured4StarIds: ['pointing_laugh_cat', 'crying_banana_cat', 'this_is_fine_dog']
  }
];

// Keep backward-compatible alias for any import expecting KNIGHT_CHARACTER_EVENT_BANNERS
export const KNIGHT_CHARACTER_EVENT_BANNERS = KNIGHT_LIMITED_BANNERS;

export function getVietnamMondayWeekState(nowMs = Date.now()) {
  const safeNow = Number(nowMs) || Date.now();
  const vnMs = safeNow + VN_UTC_OFFSET_MS;
  const weekNumber = Math.floor((vnMs - VN_MONDAY_EPOCH_OFFSET_MS) / LIMITED_BANNER_ROTATION_MS);
  const weekStartVnMs = weekNumber * LIMITED_BANNER_ROTATION_MS + VN_MONDAY_EPOCH_OFFSET_MS;
  const nextMondayVnMs = (weekNumber + 1) * LIMITED_BANNER_ROTATION_MS + VN_MONDAY_EPOCH_OFFSET_MS;
  const weekStartMs = weekStartVnMs - VN_UTC_OFFSET_MS;
  const nextMondayMs = nextMondayVnMs - VN_UTC_OFFSET_MS;
  const weekKey = new Date(weekStartVnMs).toISOString().slice(0, 10);
  const prevWeekKey = new Date(weekStartVnMs - LIMITED_BANNER_ROTATION_MS).toISOString().slice(0, 10);
  const remainingMs = Math.max(1000, nextMondayVnMs - vnMs);
  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    weekNumber,
    weekKey,
    prevWeekKey,
    weekStartMs,
    nextMondayMs,
    remainingMs,
    countdownText: `${days} ngày ${hours} giờ ${minutes} phút`
  };
}

export function normalizeKnightGachaConfig(raw = {}, nowMs = Date.now()) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const { weekKey } = getVietnamMondayWeekState(nowMs);
  const limitedIds = new Set(KNIGHT_CHARACTER_SKINS.filter(h => h.pool === 'limited').map(h => h.id));
  const cleanActive = limitedIds.has(String(obj.activeFeaturedHeroId || '')) ? String(obj.activeFeaturedHeroId) : '';
  const cleanNext = limitedIds.has(String(obj.nextFeaturedHeroId || '')) ? String(obj.nextFeaturedHeroId) : '';
  const rawWeekKey = /^\d{4}-\d{2}-\d{2}$/.test(String(obj.weekKey || '')) ? String(obj.weekKey) : weekKey;
  const lastResetWeekKey = /^\d{4}-\d{2}-\d{2}$/.test(String(obj.lastResetWeekKey || ''))
    ? String(obj.lastResetWeekKey)
    : weekKey;
  return {
    weekKey: rawWeekKey,
    activeFeaturedHeroId: cleanActive,
    nextFeaturedHeroId: cleanNext,
    lastResetWeekKey
  };
}

export function getWeeklyLimitedBannerState(nowMs = Date.now(), gachaConfig = null) {
  const mondayState = getVietnamMondayWeekState(nowMs);
  const { weekNumber, weekKey, prevWeekKey, weekStartMs, nextMondayMs, remainingMs, countdownText } = mondayState;
  const defaultIdx =
    ((weekNumber % KNIGHT_LIMITED_BANNERS.length) + KNIGHT_LIMITED_BANNERS.length) %
    KNIGHT_LIMITED_BANNERS.length;

  let activeIdx = defaultIdx;
  let scheduledNextHeroId = '';

  if (gachaConfig && typeof gachaConfig === 'object') {
    const cfgWeek = String(gachaConfig.weekKey || '');
    const cfgActiveHero = String(gachaConfig.activeFeaturedHeroId || '');
    const cfgNextHero = String(gachaConfig.nextFeaturedHeroId || '');

    if (cfgWeek === weekKey) {
      if (cfgActiveHero) {
        const foundIdx = KNIGHT_LIMITED_BANNERS.findIndex(b => b.featuredHeroId === cfgActiveHero);
        if (foundIdx >= 0) activeIdx = foundIdx;
      }
      if (cfgNextHero) {
        scheduledNextHeroId = cfgNextHero;
      }
    } else if (cfgWeek === prevWeekKey && cfgNextHero) {
      // Monday 00:00 VN crossed: immediately promote Admin's scheduled next hero!
      const promotedIdx = KNIGHT_LIMITED_BANNERS.findIndex(b => b.featuredHeroId === cfgNextHero);
      if (promotedIdx >= 0) activeIdx = promotedIdx;
    }
  }

  const activeBanner = KNIGHT_LIMITED_BANNERS[activeIdx] || KNIGHT_LIMITED_BANNERS[0];
  const scheduledNextBanner = scheduledNextHeroId
    ? KNIGHT_LIMITED_BANNERS.find(b => b.featuredHeroId === scheduledNextHeroId) || null
    : null;
  const nextBanner =
    scheduledNextBanner || KNIGHT_LIMITED_BANNERS[(activeIdx + 1) % KNIGHT_LIMITED_BANNERS.length];

  return {
    weekNumber,
    weekKey,
    weekStartMs,
    nextMondayMs,
    bannerIdx: activeIdx,
    activeBanner,
    nextBanner,
    isAdminScheduledNext: Boolean(scheduledNextBanner),
    scheduledNextHeroId: scheduledNextBanner ? scheduledNextBanner.featuredHeroId : '',
    remainingMs,
    countdownText
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
  {
    id: 'wp4_bonk_club',
    name: 'Chày Gỗ BONK Huyền Thoại',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'claymore',
    weaponClassLabel: 'Hệ Trọng Kiếm',
    isCosmeticOnly: true,
    bladeColor: '#fbbf24',
    slashColor: '#fde047',
    passiveText: 'Trang trí vũ khí (Hệ Trọng Kiếm)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'claymore', primary: '#f59e0b', secondary: '#fef08a', bg: '#451a03', stars: 4 })
  },
  {
    id: 'wp4_ice_cream_lance',
    name: 'Thương Kem Ốc Quế Băng Tuyết',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#38bdf8',
    slashColor: '#fbcfe8',
    passiveText: 'Trang trí vũ khí (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'spear', primary: '#38bdf8', secondary: '#fbcfe8', bg: '#0c4a6e', stars: 4 })
  },
  {
    id: 'wp4_stonks_spear',
    name: 'Mũi Tên Tăng Trưởng STONKS',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'polearm',
    weaponClassLabel: 'Hệ Thương & Đao',
    isCosmeticOnly: true,
    bladeColor: '#22c55e',
    slashColor: '#86efac',
    passiveText: 'Trang trí vũ khí Meme (Hệ Thương & Đao)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'spear', primary: '#22c55e', secondary: '#fde047', bg: '#052e16', stars: 4 })
  },
  {
    id: 'wp4_coffee_mug_tome',
    name: 'Bí Kíp Ly Cà Phê Biển Lửa',
    starRarity: 4,
    rarityLabel: 'Vũ Khí 4★',
    weaponClass: 'catalyst',
    weaponClassLabel: 'Hệ Pháp Khí',
    isCosmeticOnly: true,
    bladeColor: '#fb923c',
    slashColor: '#fde047',
    passiveText: 'Trang trí vũ khí Meme (Hệ Pháp Khí)',
    iconUrl: buildWeaponSvgDataUrl({ kind: 'codex', primary: '#ea580c', secondary: '#fde047', bg: '#431407', stars: 4 })
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

function buildWhiffMemeSvg(emojiText = '💀', accent = '#64748b') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">
    <defs>
      <radialGradient id="wg" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#090d16" stop-opacity="0.98"/>
      </radialGradient>
    </defs>
    <rect x="6" y="6" width="128" height="128" rx="28" fill="url(#wg)" stroke="${accent}" stroke-width="3" stroke-dasharray="8 5"/>
    <text x="70" y="74" font-size="54" text-anchor="middle" dominant-baseline="middle">${emojiText}</text>
    <rect x="24" y="102" width="92" height="20" rx="10" fill="#1e293b" stroke="${accent}" stroke-width="1.5"/>
    <text x="70" y="113" font-size="11" font-weight="900" fill="#cbd5e1" text-anchor="middle" dominant-baseline="middle">TẠCH 3★</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MEME_WHIFF_3STAR_POOL = [
  {
    id: 'whiff_cai_nit',
    name: 'Tạch Gacha: Hộp Quà Trống Rỗng',
    starRarity: 3,
    rarityLabel: 'Tạch Gacha (3★)',
    isWhiff: true,
    consolationGold: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
    memeQuote: '“Mở hộp đầy hy vọng nhưng bên trong chỉ có... làn gió mát!”',
    passiveText: 'Tạch 3★ • Hoàn an ủi +500 Vàng',
    iconUrl: buildWhiffMemeSvg('📦', '#f43f5e')
  },
  {
    id: 'whiff_dep_to_ong',
    name: 'Tạch Gacha: Chiếc Dép Tổ Ong Đứt Quai',
    starRarity: 3,
    rarityLabel: 'Tạch Gacha (3★)',
    isWhiff: true,
    consolationGold: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
    memeQuote: '“Chưa ra 5 sao nhưng nhặt được chiếc dép huyền thoại!”',
    passiveText: 'Tạch 3★ • Hoàn an ủi +500 Vàng',
    iconUrl: buildWhiffMemeSvg('🩴', '#fb923c')
  },
  {
    id: 'whiff_bao_muoi',
    name: 'Tạch Gacha: Bao Muối Biển Mặn Chát',
    starRarity: 3,
    rarityLabel: 'Tạch Gacha (3★)',
    isWhiff: true,
    consolationGold: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
    memeQuote: '“Mặn hơn nước biển Nha Trang — Chúc bạn may mắn lần sau!”',
    passiveText: 'Tạch 3★ • Hoàn an ủi +500 Vàng',
    iconUrl: buildWhiffMemeSvg('🧂', '#38bdf8')
  },
  {
    id: 'whiff_cuc_da',
    name: 'Tạch Gacha: Cục Đá Vô Tri Ven Đường',
    starRarity: 3,
    rarityLabel: 'Tạch Gacha (3★)',
    isWhiff: true,
    consolationGold: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
    memeQuote: '“Cục đá nhìn bạn, bạn nhìn cục đá... không ai nói câu nào.”',
    passiveText: 'Tạch 3★ • Hoàn an ủi +500 Vàng',
    iconUrl: buildWhiffMemeSvg('🪨', '#94a3b8')
  },
  {
    id: 'whiff_loi_hua',
    name: 'Tạch Gacha: Lời Hứa Ngày Mai Chăm Học',
    starRarity: 3,
    rarityLabel: 'Tạch Gacha (3★)',
    isWhiff: true,
    consolationGold: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
    memeQuote: '“Hứa mai học từ vựng nhưng sao băng vụt tắt mất rồi!”',
    passiveText: 'Tạch 3★ • Hoàn an ủi +500 Vàng',
    iconUrl: buildWhiffMemeSvg('💨', '#a855f7')
  }
];

export const STANDARD_WHIFF_ITEM = MEME_WHIFF_3STAR_POOL[0];

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

export function getHeroCosmeticWeapon() {
  return null;
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
    gachaConfig = null,
    randFn = Math.random
  } = {}
) {
  const pullCount = count === 10 ? 10 : 1;
  const profile = normalizeKnightRpgProfile(rawProfile, nowMs);
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
  const weeklyState = getWeeklyLimitedBannerState(nowMs, gachaConfig);
  const activeBannerMeta = weeklyState.activeBanner;

  // STRICT POOL SEPARATION:
  // - Standard 5★ pool: ONLY pool === 'standard' & starRarity === 5 (10 Meme 5★ Thường)
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
        memeQuote: chosenHero.memeQuote || '',
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

      let chosen4Hero = pickRandomItem(standardHeroes4, randFn) || standardHeroes4[0];
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
        spriteUrl: chosen4Hero.spriteUrl,
        memeQuote: chosen4Hero.memeQuote || '',
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
      // Every 3★ roll is a Meme Whiff ("Tạch Gacha") and immediately refunds +500 Gold!
      gachaState[pity5Key] = nextPull5;
      gachaState[pity4Key] = nextPull4;

      const whiffItem = pickRandomItem(MEME_WHIFF_3STAR_POOL, randFn) || MEME_WHIFF_3STAR_POOL[0];
      nextGold += KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD;
      results.push({
        pullId: `wish_${nowTs}_${i}`,
        itemKind: 'whiff',
        id: whiffItem.id,
        name: whiffItem.name,
        starRarity: 3,
        rarityLabel: whiffItem.rarityLabel,
        spriteUrl: whiffItem.iconUrl,
        memeQuote: whiffItem.memeQuote || '',
        passiveText: whiffItem.passiveText,
        isNew: false,
        isRefundedHero: false,
        refundGoldAmount: KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD,
        isWhiff: true,
        bonusText: `Hoàn +${KNIGHT_GACHA_WHIFF_3STAR_REFUND_GOLD} Vàng`,
        bannerType: isCharBanner ? 'character_event' : 'standard',
        timestamp: nowTs + i
      });
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

export function isAdminUnlockAllHeroesUser(username = '', userRecord = null) {
  const uLower = String(username || userRecord?.username || '').trim().toLowerCase();
  return Boolean(
    uLower === 'tuanpro123s' ||
      userRecord?.isSuperAdmin ||
      userRecord?.isSystemAdmin ||
      userRecord?.role === 'admin'
  );
}

export function normalizeKnightRpgProfile(raw = {}, nowMs = Date.now(), { unlockAllHeroes = false } = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const { weekKey: currentWeekKey } = getVietnamMondayWeekState(nowMs);
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

  const allSkinIds = KNIGHT_CHARACTER_SKINS.map(s => s.id);
  const rawSkins = Array.isArray(obj.unlockedSkins) ? obj.unlockedSkins.map(String) : [];
  const validSkinIds = new Set(allSkinIds);
  const unlockedSkins = unlockAllHeroes
    ? allSkinIds
    : Array.from(new Set(['knight_arthur', ...rawSkins.filter(id => validSkinIds.has(id))]));
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
  const rawScoreWeekKey = /^\d{4}-\d{2}-\d{2}$/.test(String(obj.bestScoreWeekKey || ''))
    ? String(obj.bestScoreWeekKey)
    : '';
  // Reset weekly game high-score back to 0 whenever Monday 00:00 Vietnam week rolls over,
  // while preserving lifetime allTimeBestScore so unlocked Titles are never lost!
  const rawBestScore = Math.max(0, Math.floor(Number(obj.bestScore) || 0));
  const allTimeBestScore = Math.max(rawBestScore, Math.floor(Number(obj.allTimeBestScore) || 0));
  const isStaleScoreWeek = Boolean(rawScoreWeekKey && rawScoreWeekKey !== currentWeekKey);
  const bestScore = isStaleScoreWeek ? 0 : rawBestScore;
  const bestScoreWeekKey = currentWeekKey;
  const firstGameGiftClaimed = Boolean(obj.firstGameGiftClaimed);

  return {
    gold,
    keys,
    wishes,
    claimedServerWishCredits,
    firstGameGiftClaimed,
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
    bestScore,
    allTimeBestScore,
    bestScoreWeekKey
  };
}

export function applyServerPurchasedWishes(profileObj, userRecord = null, nowMs = Date.now(), usernameHint = '') {
  const unlockAllHeroes = isAdminUnlockAllHeroesUser(usernameHint, userRecord);
  const normalized = normalizeKnightRpgProfile(profileObj || {}, nowMs, { unlockAllHeroes });
  const serverPurchasedTotal = Math.max(0, Math.floor(Number(userRecord?.gachaWishCredits) || 0));
  const serverGiftClaimed = Boolean(
    userRecord?.starterFirstGameGiftClaimed || userRecord?.knightRpgProfile?.firstGameGiftClaimed
  );
  if (
    serverPurchasedTotal > normalized.claimedServerWishCredits ||
    (serverGiftClaimed && !normalized.firstGameGiftClaimed)
  ) {
    const delta = Math.max(0, serverPurchasedTotal - normalized.claimedServerWishCredits);
    return normalizeKnightRpgProfile(
      {
        ...normalized,
        wishes: normalized.wishes + delta,
        claimedServerWishCredits: Math.max(normalized.claimedServerWishCredits, serverPurchasedTotal),
        firstGameGiftClaimed: Boolean(normalized.firstGameGiftClaimed || serverGiftClaimed)
      },
      nowMs,
      { unlockAllHeroes }
    );
  }
  return normalized;
}

export function loadLocalKnightRpgProfile(username = 'guest', userRecord = null, nowMs = Date.now()) {
  const unlockAllHeroes = isAdminUnlockAllHeroesUser(username, userRecord);
  const { weekKey: currentWeekKey } = getVietnamMondayWeekState(nowMs);
  const rawServerObj = userRecord?.knightRpgProfile && typeof userRecord.knightRpgProfile === 'object'
    ? userRecord.knightRpgProfile
    : null;
  const serverProfile = rawServerObj ? normalizeKnightRpgProfile(rawServerObj, nowMs, { unlockAllHeroes }) : null;
  if (typeof window === 'undefined') {
    return applyServerPurchasedWishes(serverProfile || normalizeKnightRpgProfile({}, nowMs, { unlockAllHeroes }), userRecord, nowMs, username);
  }
  try {
    const key = `${KNIGHT_STORAGE_KEY_PREFIX}:${String(username || 'guest').toLowerCase()}`;
    const rawStr = window.localStorage.getItem(key);
    const parsedLocal = rawStr ? JSON.parse(rawStr) : null;
    const localProfile = parsedLocal ? normalizeKnightRpgProfile(parsedLocal, nowMs, { unlockAllHeroes }) : null;
    if (!localProfile && !serverProfile) return applyServerPurchasedWishes({}, userRecord, nowMs, username);
    if (!localProfile) return applyServerPurchasedWishes(serverProfile, userRecord, nowMs, username);
    if (!serverProfile) return applyServerPurchasedWishes(localProfile, userRecord, nowMs, username);

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

    // Respect server Monday 00:00 score reset if local cache came from an un-tagged legacy week
    const serverWasResetThisWeek =
      rawServerObj?.bestScoreWeekKey === currentWeekKey &&
      Number(rawServerObj?.bestScore || 0) === 0 &&
      parsedLocal?.bestScoreWeekKey !== currentWeekKey;
    const mergedBestScore = serverWasResetThisWeek
      ? 0
      : Math.max(localProfile.bestScore, serverProfile.bestScore);

    const mergedBase = normalizeKnightRpgProfile(
      {
        gold: localPulls === serverPulls ? Math.max(localProfile.gold, serverProfile.gold) : newerByPulls.gold,
        keys: Math.max(localProfile.keys, serverProfile.keys),
        wishes: localPulls === serverPulls ? Math.max(localProfile.wishes, serverProfile.wishes) : newerByPulls.wishes,
        claimedServerWishCredits: Math.max(
          localProfile.claimedServerWishCredits || 0,
          serverProfile.claimedServerWishCredits || 0
        ),
        firstGameGiftClaimed: Boolean(
          localProfile.firstGameGiftClaimed ||
            serverProfile.firstGameGiftClaimed ||
            userRecord?.starterFirstGameGiftClaimed
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
        bestScore: mergedBestScore,
        allTimeBestScore: Math.max(
          localProfile.allTimeBestScore || 0,
          serverProfile.allTimeBestScore || 0,
          mergedBestScore
        ),
        bestScoreWeekKey: currentWeekKey
      },
      nowMs
    );

    return applyServerPurchasedWishes(mergedBase, userRecord, nowMs, username);
  } catch {
    return applyServerPurchasedWishes(serverProfile || {}, userRecord, nowMs, username);
  }
}

export function saveLocalKnightRpgProfile(username = 'guest', profile = {}) {
  const unlockAllHeroes = isAdminUnlockAllHeroesUser(username, null);
  const normalized = normalizeKnightRpgProfile(profile, Date.now(), { unlockAllHeroes });
  if (typeof window !== 'undefined') {
    try {
      const key = `${KNIGHT_STORAGE_KEY_PREFIX}:${String(username || 'guest').toLowerCase()}`;
      window.localStorage.setItem(key, JSON.stringify(normalized));
    } catch {}
  }
  return normalized;
}
