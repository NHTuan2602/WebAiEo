// ==========================================
// PROFILE CUSTOMIZATION & STUDENT TITLES ("DANH HIỆU")
// Pure helper module shared across UI & tests (no React/DOM deps)
// ==========================================

export const PROFILE_BANNERS = [
  {
    id: 'ocean',
    name: 'Biển Sáng Nha Trang',
    desc: 'Xanh trời và ngọc lam tươi sáng rạng rỡ',
    heroClass: 'bg-gradient-to-br from-[#BAE6FD] via-[#5EEAD4] to-[#14B8A6]',
    previewClass: 'bg-gradient-to-br from-[#BAE6FD] via-[#5EEAD4] to-[#14B8A6]'
  },
  {
    id: 'sakura',
    name: 'Anh Đào Pastel',
    desc: 'Hồng phấn nhẹ nhàng sáng sủa, thấy rõ từng chi tiết',
    heroClass: 'bg-gradient-to-br from-[#FFE4E6] via-[#FBCFE8] to-[#E9D5FF]',
    previewClass: 'bg-gradient-to-br from-[#FFE4E6] via-[#FBCFE8] to-[#E9D5FF]'
  },
  {
    id: 'sunset',
    name: 'Nắng Mai Ấm Áp',
    desc: 'Vàng nắng dịu hòa quyện sắc cam san hô tươi mới',
    heroClass: 'bg-gradient-to-br from-[#FEF08A] via-[#FED7AA] to-[#FDA4AF]',
    previewClass: 'bg-gradient-to-br from-[#FEF08A] via-[#FED7AA] to-[#FDA4AF]'
  },
  {
    id: 'emerald',
    name: 'Thảo Nguyên Xanh',
    desc: 'Xanh bạc hà mát mắt giúp tập trung học tập',
    heroClass: 'bg-gradient-to-br from-[#D1FAE5] via-[#6EE7B7] to-[#2DD4BF]',
    previewClass: 'bg-gradient-to-br from-[#D1FAE5] via-[#6EE7B7] to-[#2DD4BF]'
  },
  {
    id: 'aurora',
    name: 'Cực Quang Tím Ngọc',
    desc: 'Ánh sáng tím rực rỡ hòa quyện ngọc lam',
    heroClass: 'bg-gradient-to-br from-[#312E81] via-[#6D28D9] to-[#0D9488]',
    previewClass: 'bg-gradient-to-br from-[#312E81] via-[#6D28D9] to-[#0D9488]'
  },
  {
    id: 'cosmos',
    name: 'Đấu Trường Vũ Trụ',
    desc: 'Không gian thiên hà xanh thẫm tràn đầy năng lượng',
    heroClass: 'bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#4F46E5]',
    previewClass: 'bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#4F46E5]'
  }
];

export const AVATAR_FRAMES = [
  {
    id: 'none',
    name: 'Mặc định',
    ringClass: '',
    previewBg: 'bg-slate-200 dark:bg-zinc-700'
  },
  {
    id: 'teal_glow',
    name: 'Ngọc Bích',
    ringClass: 'vip-avatar-frame ring-4 ring-[#1EE1D6] shadow-[0_0_20px_rgba(30,225,214,0.45)]',
    previewBg: 'bg-[#1EE1D6]'
  },
  {
    id: 'gold_crown',
    name: 'Hoàng Kim',
    ringClass: 'vip-avatar-frame ring-4 ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.55)]',
    previewBg: 'bg-amber-400'
  },
  {
    id: 'sakura_pink',
    name: 'Anh Đào',
    ringClass: 'vip-avatar-frame ring-4 ring-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.5)]',
    previewBg: 'bg-pink-400'
  },
  {
    id: 'nebula_violet',
    name: 'Tím Vũ Trụ',
    ringClass: 'vip-avatar-frame ring-4 ring-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.5)]',
    previewBg: 'bg-violet-400'
  },
  {
    id: 'flame_emerald',
    name: 'Lục Bảo',
    ringClass: 'vip-avatar-frame ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.45)]',
    previewBg: 'bg-emerald-400'
  },
  {
    id: 'vip_neon_cyan',
    name: 'Neon Cyan VIP',
    vipOnly: true,
    ringClass: 'vip-avatar-frame ring-4 ring-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.65)]',
    previewBg: 'bg-gradient-to-tr from-cyan-400 to-teal-300'
  },
  {
    id: 'vip_neon_pink',
    name: 'Cyber Hồng VIP',
    vipOnly: true,
    ringClass: 'vip-avatar-frame ring-4 ring-fuchsia-400 shadow-[0_0_24px_rgba(232,121,249,0.65)]',
    previewBg: 'bg-gradient-to-tr from-pink-500 to-purple-500'
  },
  {
    id: 'vip_neon_gold',
    name: 'Hoàng Kim Neon VIP',
    vipOnly: true,
    ringClass: 'vip-avatar-frame ring-4 ring-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.7)]',
    previewBg: 'bg-gradient-to-tr from-amber-400 to-rose-500'
  }
];

export function isStaffOrAdminUser(user) {
  if (!user || typeof user !== 'object') return false;
  return Boolean(
    user.isSuperAdmin ||
    user.isSystemAdmin ||
    user.username === 'tuanpro123s' ||
    user.role === 'teacher'
  );
}

export function hasUnlockedAvatarFrame(user, frameId, nowMs = Date.now()) {
  if (!frameId || frameId === 'none') return true;
  const frame = AVATAR_FRAMES.find(f => f.id === frameId);
  if (!frame) return false;
  // Khung viền Avatar áp dụng cho Giáo viên, Admin và học viên có Gói Tháng VIP
  return isStaffOrAdminUser(user) || hasActiveAieoVip(user, nowMs);
}

export function getVietnamDateKey(ts = Date.now()) {
  const num = Number(ts) || Date.now();
  return new Date(num + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getVietnamDayBoundsMs(dateKeyOrNow = Date.now()) {
  const dateKey =
    typeof dateKeyOrNow === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateKeyOrNow.trim())
      ? dateKeyOrNow.trim()
      : getVietnamDateKey(dateKeyOrNow);
  const [y, mo, d] = dateKey.split('-').map(Number);
  const startMs = Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - 7 * 60 * 60 * 1000;
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
  return { dateKey, startMs, endMs };
}

export function formatRemainingDailyTitleText(endMs, nowMs = Date.now()) {
  const left = Number(endMs) - Number(nowMs);
  if (!Number.isFinite(left) || left <= 0) return 'Đã hết hiệu lực hôm nay';
  const totalMins = Math.max(1, Math.ceil(left / 60_000));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `Còn ${hrs}g ${mins}p (đến 23:59)`;
  return `Còn ${mins}p (đến 23:59)`;
}

export function parseAttemptTimestampMs(attempt) {
  const direct = Number(attempt?.submittedAtMs);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const raw = String(attempt?.submittedAt || '').trim();
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  // Format "HH:mm DD/MM/YYYY" or "DD/MM/YYYY, HH:mm" (VN timezone UTC+7)
  const m1 = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
  if (m1) {
    const [, hh, mm, ss = '0', dd, mo, yyyy] = m1;
    return Date.UTC(Number(yyyy), Number(mo) - 1, Number(dd), Number(hh) - 7, Number(mm), Number(ss));
  }
  const m2 = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/.exec(raw);
  if (m2) {
    const [, dd, mo, yyyy, hh = '12', mm = '0'] = m2;
    return Date.UTC(Number(yyyy), Number(mo) - 1, Number(dd), Number(hh) - 7, Number(mm), 0);
  }
  return 0;
}

function dateKeyToDayIndex(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Math.floor(Date.UTC(y, mo - 1, d) / 86_400_000);
}

export function computeLoginDayMetrics(loginDays = [], todayKey = getVietnamDateKey()) {
  const dayIndices = Array.from(
    new Set(
      (Array.isArray(loginDays) ? loginDays : [])
        .map(dateKeyToDayIndex)
        .filter(v => v !== null)
    )
  ).sort((a, b) => a - b);

  if (dayIndices.length === 0) {
    return { totalLoginDays: 0, currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 1;
  let running = 1;
  for (let i = 1; i < dayIndices.length; i++) {
    if (dayIndices[i] === dayIndices[i - 1] + 1) {
      running += 1;
      if (running > bestStreak) bestStreak = running;
    } else {
      running = 1;
    }
  }

  const todayIdx = dateKeyToDayIndex(todayKey);
  const lastIdx = dayIndices[dayIndices.length - 1];
  let currentStreak = 0;
  if (todayIdx !== null && (lastIdx === todayIdx || lastIdx === todayIdx - 1)) {
    currentStreak = 1;
    for (let i = dayIndices.length - 2; i >= 0; i--) {
      if (dayIndices[i] === dayIndices[i + 1] - 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    totalLoginDays: dayIndices.length,
    currentStreak,
    bestStreak
  };
}

// Verified Vietnamese Lunar New Year (Giao thừa & Mùng 1–3 Tết Nguyên Đán) dates 2025–2030
const TET_HOLIDAY_DATES = new Set([
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
  '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08',
  '2028-01-25', '2028-01-26', '2028-01-27', '2028-01-28',
  '2029-02-12', '2029-02-13', '2029-02-14', '2029-02-15',
  '2030-02-01', '2030-02-02', '2030-02-03', '2030-02-04'
]);

// Verified Vietnamese Mid-Autumn Festival (14–15/08 Âm Lịch) dates 2025–2030
const MID_AUTUMN_DATES = new Set([
  '2025-10-05', '2025-10-06',
  '2026-09-24', '2026-09-25',
  '2027-09-14', '2027-09-15',
  '2028-10-02', '2028-10-03',
  '2029-09-21', '2029-09-22',
  '2030-09-11', '2030-09-12'
]);

function formatDateKeyVi(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || '').trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function findMatchingHolidayLoginDate(loginDays = [], spec = {}) {
  const days = (Array.isArray(loginDays) ? loginDays : []).map(d => String(d || '').trim()).sort();
  for (let i = days.length - 1; i >= 0; i--) {
    const dk = days[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dk)) continue;
    if (spec.exactDates && spec.exactDates.has(dk)) return dk;
    if (Array.isArray(spec.monthDays) && spec.monthDays.includes(dk.slice(5))) return dk;
  }
  return '';
}

const HOLIDAY_TITLE_SPECS = [
  {
    id: 'holiday_new_year',
    label: 'Khai Xuân Năm Mới',
    icon: '🎆',
    monthDays: ['01-01'],
    dateHint: '01/01 (Tết Dương Lịch)',
    conditionText: 'Sự kiện Năm Mới: Chỉ cần đăng nhập vào ngày 01/01 (Tết Dương Lịch) để nhận danh hiệu kỷ niệm.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/60',
    heroBadgeClass: 'bg-sky-500/35 text-sky-100 border-sky-300/75',
    gameBadgeClass: 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/60'
  },
  {
    id: 'holiday_tet_nguyen_dan',
    label: 'Lộc Xuân Tết Cổ Truyền',
    icon: '🧧',
    exactDates: TET_HOLIDAY_DATES,
    dateHint: 'Giao Thừa & Mùng 1–3 Tết Âm Lịch',
    conditionText: 'Sự kiện Tết Nguyên Đán: Chỉ cần đăng nhập trong dịp Giao Thừa hoặc Mùng 1–3 Tết Âm Lịch hàng năm.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-400 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-rose-500/45 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/65'
  },
  {
    id: 'holiday_valentine',
    label: 'Trái Tim Yêu Thương',
    icon: '💌',
    monthDays: ['02-14'],
    dateHint: '14/02 (Valentine)',
    conditionText: 'Sự kiện Valentine 14/02: Chỉ cần đăng nhập vào ngày 14/02 để sở hữu huy hiệu ngọt ngào này.',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-400/60',
    heroBadgeClass: 'bg-pink-500/35 text-pink-100 border-pink-300/75',
    gameBadgeClass: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-500/25 dark:text-pink-200 dark:border-pink-400/60'
  },
  {
    id: 'holiday_women_83',
    label: 'Bông Hồng Rạng Ngời 08/03',
    icon: '🌷',
    monthDays: ['03-08'],
    dateHint: '08/03 (Quốc Tế Phụ Nữ)',
    conditionText: 'Sự kiện Quốc Tế Phụ Nữ 08/03: Chỉ cần đăng nhập đúng ngày 08/03 hàng năm.',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-400/60',
    heroBadgeClass: 'bg-fuchsia-500/35 text-fuchsia-100 border-fuchsia-300/75',
    gameBadgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-500/25 dark:text-fuchsia-200 dark:border-fuchsia-400/60'
  },
  {
    id: 'holiday_reunification',
    label: 'Hào Khí Đại Lễ 30/04',
    icon: '🇻🇳',
    monthDays: ['04-30', '05-01'],
    dateHint: '30/04 & 01/05',
    conditionText: 'Sự kiện Đại Lễ 30/04 – 01/05: Chỉ cần đăng nhập vào ngày 30/04 hoặc 01/05.',
    badgeClass: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/60',
    heroBadgeClass: 'bg-red-500/35 text-red-100 border-red-300/75',
    gameBadgeClass: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/25 dark:text-red-200 dark:border-red-400/60'
  },
  {
    id: 'holiday_national_day',
    label: 'Tinh Thần Quốc Khánh 02/09',
    icon: '⭐',
    monthDays: ['09-02'],
    dateHint: '02/09 (Quốc Khánh Việt Nam)',
    conditionText: 'Sự kiện Quốc Khánh 02/09: Chỉ cần đăng nhập vào ngày 02/09 để tự động mở khóa.',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-red-500/40 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/65'
  },
  {
    id: 'holiday_mid_autumn',
    label: 'Trăng Rằm Trung Thu',
    icon: '🌕',
    exactDates: MID_AUTUMN_DATES,
    dateHint: '14–15/08 Âm Lịch (Trung Thu)',
    conditionText: 'Sự kiện Tết Trung Thu: Chỉ cần đăng nhập vào dịp Rằm Tháng Tám (14 hoặc 15/08 Âm Lịch).',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/60',
    heroBadgeClass: 'bg-indigo-500/35 text-amber-100 border-amber-300/75',
    gameBadgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/60'
  },
  {
    id: 'holiday_vn_women_2010',
    label: 'Hương Sắc Việt Nam 20/10',
    icon: '💐',
    monthDays: ['10-20'],
    dateHint: '20/10 (Phụ Nữ Việt Nam)',
    conditionText: 'Sự kiện Ngày Phụ Nữ Việt Nam 20/10: Chỉ cần đăng nhập vào ngày 20/10 để nhận danh hiệu.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/60',
    heroBadgeClass: 'bg-rose-500/35 text-rose-100 border-rose-300/75',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60'
  },
  {
    id: 'holiday_halloween',
    label: 'Kỵ Sĩ Đêm Halloween',
    icon: '🎃',
    monthDays: ['10-31'],
    dateHint: '31/10 (Halloween)',
    conditionText: 'Sự kiện Halloween 31/10: Chỉ cần đăng nhập trong ngày 31/10 để mở khóa danh hiệu lễ hội.',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-400 dark:bg-orange-500/25 dark:text-orange-200 dark:border-orange-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-orange-500/40 to-purple-500/40 text-orange-100 border-orange-300/80',
    gameBadgeClass: 'bg-orange-100 text-orange-950 border-orange-400 dark:bg-orange-500/30 dark:text-orange-100 dark:border-orange-400/65'
  },
  {
    id: 'holiday_teachers_day',
    label: 'Tri Ân Nhà Giáo 20/11',
    icon: '🌺',
    monthDays: ['11-20'],
    dateHint: '20/11 (Ngày Nhà Giáo VN)',
    conditionText: 'Sự kiện Hiến Chương Nhà Giáo 20/11: Chỉ cần đăng nhập vào ngày 20/11 hàng năm cùng cô Ms. Như.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-400 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-teal-500/40 to-pink-500/40 text-teal-100 border-teal-300/80',
    gameBadgeClass: 'bg-teal-100 text-teal-950 border-teal-400 dark:bg-teal-500/30 dark:text-teal-100 dark:border-teal-400/65'
  },
  {
    id: 'holiday_christmas',
    label: 'Chuông Vàng Giáng Sinh',
    icon: '🎄',
    monthDays: ['12-24', '12-25'],
    dateHint: '24/12 & 25/12 (Noel)',
    conditionText: 'Sự kiện Giáng Sinh An Lành: Chỉ cần đăng nhập vào đêm 24/12 hoặc ngày 25/12.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-emerald-500/40 to-rose-500/35 text-emerald-100 border-emerald-300/80',
    gameBadgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-500/30 dark:text-emerald-100 dark:border-emerald-400/65'
  },
  {
    id: 'holiday_year_end',
    label: 'Khoảnh Khắc Giao Mùa',
    icon: '🥂',
    monthDays: ['12-31'],
    dateHint: '31/12 (Tất Niên)',
    conditionText: 'Sự kiện Đêm Giao Mùa 31/12: Chỉ cần đăng nhập vào ngày cuối cùng của năm 31/12.',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/60',
    heroBadgeClass: 'bg-violet-500/35 text-violet-100 border-violet-300/75',
    gameBadgeClass: 'bg-violet-100 text-violet-900 border-violet-400 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/60'
  }
];

function buildHolidayTitleEntry(spec) {
  return {
    id: spec.id,
    label: spec.label,
    icon: spec.icon,
    tier: 'Ngày Đặc Biệt',
    difficulty: 'Lễ Hội',
    isHolidayTitle: true,
    holidayDateHint: spec.dateHint,
    conditionText: spec.conditionText,
    badgeClass: spec.badgeClass,
    heroBadgeClass: spec.heroBadgeClass,
    gameBadgeClass: spec.gameBadgeClass,
    isUnlocked: (_stats, userObj) => Boolean(findMatchingHolidayLoginDate(userObj?.loginDays, spec)),
    getProgress: (_stats, userObj) => {
      const matched = findMatchingHolidayLoginDate(userObj?.loginDays, spec);
      return matched
        ? { pct: 100, text: `🎉 Đã điểm danh ngày ${formatDateKeyVi(matched)}` }
        : { pct: 0, text: `Đăng nhập vào ${spec.dateHint}` };
    }
  };
}

export const DAILY_RANK_BOARDS = [
  {
    id: 'overall',
    label: 'Thi Tổng 4 Kỹ Năng',
    shortLabel: 'Tổng 4 KN',
    priority: 1,
    ranks: [
      { rank: 1, id: 'daily_top1_overall', label: 'Thủ Khoa Toàn Diện (Top 1)', icon: '🏆' },
      { rank: 2, id: 'daily_top2_overall', label: 'Bảng Nhãn Toàn Diện (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_overall', label: 'Thám Hoa Toàn Diện (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'reading',
    label: 'BXH Reading Daily',
    shortLabel: 'Reading',
    priority: 2,
    ranks: [
      { rank: 1, id: 'daily_top1_reading', label: 'Độc Cô Reading (Top 1)', icon: '👑' },
      { rank: 2, id: 'daily_top2_reading', label: 'Á Quân Reading (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_reading', label: 'Quý Quân Reading (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'listening',
    label: 'BXH Listening Daily',
    shortLabel: 'Listening',
    priority: 3,
    ranks: [
      { rank: 1, id: 'daily_top1_listening', label: 'Thính Giả Độc Tôn (Top 1)', icon: '🎧' },
      { rank: 2, id: 'daily_top2_listening', label: 'Á Quân Listening (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_listening', label: 'Quý Quân Listening (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'writing',
    label: 'BXH Writing Daily',
    shortLabel: 'Writing',
    priority: 4,
    ranks: [
      { rank: 1, id: 'daily_top1_writing', label: 'Thánh Bút Writing (Top 1)', icon: '🖋️' },
      { rank: 2, id: 'daily_top2_writing', label: 'Á Quân Writing (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_writing', label: 'Quý Quân Writing (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'speaking',
    label: 'BXH Speaking Daily',
    shortLabel: 'Speaking',
    priority: 5,
    ranks: [
      { rank: 1, id: 'daily_top1_speaking', label: 'Hùng Biện Vô Địch (Top 1)', icon: '🎙️' },
      { rank: 2, id: 'daily_top2_speaking', label: 'Á Quân Speaking (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_speaking', label: 'Quý Quân Speaking (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'game',
    label: 'BXH Đấu Trường Phi Thuyền',
    shortLabel: 'Game Phi Thuyền',
    priority: 6,
    ranks: [
      { rank: 1, id: 'daily_top1_game', label: 'Đế Vương Đấu Trường (Top 1)', icon: '⚡' },
      { rank: 2, id: 'daily_top2_game', label: 'Phó Tướng Đấu Trường (Top 2)', icon: '🥈' },
      { rank: 3, id: 'daily_top3_game', label: 'Chiến Tướng Đấu Trường (Top 3)', icon: '🥉' }
    ]
  },
  {
    id: 'knight_game',
    label: 'BXH Hiệp Sĩ Diệt Rồng',
    shortLabel: 'Hiệp Sĩ RPG',
    priority: 6.5,
    ranks: [
      { rank: 1, id: 'daily_top1_knight', label: 'Đệ Nhất Đồ Long (Top 1)', icon: '🐉' },
      { rank: 2, id: 'daily_top2_knight', label: 'Thánh Kiếm Á Quân (Top 2)', icon: '⚔️' },
      { rank: 3, id: 'daily_top3_knight', label: 'Kỵ Sĩ Quý Quân (Top 3)', icon: '🛡️' }
    ]
  }
];

function buildDailyRankTitleEntry(board, rankSpec) {
  const rank = rankSpec.rank;
  const styleByRank =
    rank === 1
      ? {
          badgeClass:
            'bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-amber-950 border-amber-400 dark:from-amber-500/30 dark:via-yellow-500/25 dark:to-orange-500/30 dark:text-amber-100 dark:border-amber-400/75 font-bold',
          heroBadgeClass:
            'bg-gradient-to-r from-amber-500/45 to-yellow-500/40 text-amber-50 border-amber-300/85',
          gameBadgeClass:
            'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/75'
        }
      : rank === 2
      ? {
          badgeClass:
            'bg-slate-100 text-slate-900 border-slate-400 dark:bg-slate-500/30 dark:text-slate-100 dark:border-slate-300/70 font-bold',
          heroBadgeClass:
            'bg-slate-400/35 text-slate-50 border-slate-200/80',
          gameBadgeClass:
            'bg-slate-100 text-slate-900 border-slate-400 dark:bg-slate-500/30 dark:text-slate-100 dark:border-slate-300/70'
        }
      : {
          badgeClass:
            'bg-orange-50 text-orange-900 border-orange-400 dark:bg-orange-500/25 dark:text-orange-100 dark:border-orange-400/65 font-bold',
          heroBadgeClass:
            'bg-orange-500/35 text-orange-50 border-orange-300/75',
          gameBadgeClass:
            'bg-orange-100 text-orange-950 border-orange-400 dark:bg-orange-500/30 dark:text-orange-100 dark:border-orange-400/65'
        };

  return {
    id: rankSpec.id,
    label: rankSpec.label,
    icon: rankSpec.icon,
    tier: `BXH Ngày · ${board.shortLabel}`,
    difficulty: 'Theo Ngày',
    isDailyRankTitle: true,
    dailyRankBoard: board.id,
    dailyRankBoardLabel: board.label,
    dailyRankPosition: rank,
    conditionText: `Đứng Top #${rank} trên ${board.label} khi chốt BXH cuối ngày (23:59 giờ VN). Danh hiệu được tổng kết và trao vào 00:00 ngày hôm sau (hiệu lực suốt ngày hôm sau đến 23:59), độc quyền 1 người/hạng & mỗi học viên tối đa 1 danh hiệu BXH/ngày.`,
    ...styleByRank,
    isUnlocked: () => false,
    getProgress: () => ({ pct: 0, text: `Đua Top #${rank} ${board.shortLabel} (Chốt 23:59 & trao vào ngày hôm sau)` })
  };
}

export const DAILY_RANK_TITLES = DAILY_RANK_BOARDS.flatMap(board =>
  board.ranks.map(rankSpec => buildDailyRankTitleEntry(board, rankSpec))
);

function isExcludedStaffForDailyRank(username, usersDb = null) {
  const clean = String(username || '').trim();
  if (!clean) return true;
  const lower = clean.toLowerCase();
  if (lower === 'tuanpro123s' || lower === 'teacher_ielts') return true;
  if (usersDb && typeof usersDb === 'object') {
    const u =
      usersDb[clean] ||
      Object.values(usersDb).find(item => item && String(item.username || '').toLowerCase() === lower);
    if (u && (u.role === 'teacher' || u.isSuperAdmin || u.isSystemAdmin || u.hiddenFromTeacher)) {
      return true;
    }
  }
  return false;
}

export function computeDailyLeaderboardTitleHolders({
  attempts = [],
  roomsDb = {},
  gamePracticeLeaderboard = [],
  usersDb = null,
  nowMs = Date.now()
} = {}) {
  const { dateKey, startMs, endMs } = getVietnamDayBoundsMs(nowMs);
  // Daily Top 1/2/3 titles are settled from the PREVIOUS completed day (00:00–23:59 yesterday)
  // and awarded for the entire next day ("đến ngày hôm sau mới tặng chứ ko phải ai top 1 2 3 là tặng liền").
  const { dateKey: settledDateKey } = getVietnamDayBoundsMs(startMs - 86_400_000);
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const safePractice = Array.isArray(gamePracticeLeaderboard) ? gamePracticeLeaderboard : [];

  const getDisplayName = (uname, fallbackName = '') => {
    if (usersDb && typeof usersDb === 'object') {
      const u =
        usersDb[uname] ||
        Object.values(usersDb).find(
          item => item && String(item.username || '').toLowerCase() === String(uname || '').toLowerCase()
        );
      if (u?.name) return u.name;
    }
    return fallbackName || uname;
  };

  const evaluateForTargetDateKey = (targetDateKey) => {
    const boardMaps = {
      overall: new Map(),
      reading: new Map(),
      listening: new Map(),
      writing: new Map(),
      speaking: new Map(),
      game: new Map(),
      knight_game: new Map()
    };

    const recordExamBoardEntry = (boardId, uname, name, band, accuracy, durationSec, tsMs) => {
      if (!uname || isExcludedStaffForDailyRank(uname, usersDb)) return;
      if (!Number.isFinite(band) || band < 0) return;
      const key = uname.toLowerCase();
      const map = boardMaps[boardId];
      if (!map) return;
      const prev = map.get(key) || {
        username: uname,
        name: getDisplayName(uname, name),
        bestBand: -1,
        totalBand: 0,
        count: 0,
        bestAccuracy: -1,
        bestDuration: Number.POSITIVE_INFINITY,
        earliestAtMs: tsMs
      };
      const nextCount = prev.count + 1;
      const nextTotal = prev.totalBand + band;
      const betterScore =
        band > prev.bestBand ||
        (band === prev.bestBand && accuracy > prev.bestAccuracy) ||
        (band === prev.bestBand && accuracy === prev.bestAccuracy && durationSec < prev.bestDuration);
      map.set(key, {
        username: prev.username,
        name: prev.name || getDisplayName(uname, name),
        bestBand: betterScore ? band : prev.bestBand,
        totalBand: nextTotal,
        count: nextCount,
        bestAccuracy: betterScore ? accuracy : prev.bestAccuracy,
        bestDuration: betterScore ? durationSec : prev.bestDuration,
        earliestAtMs: betterScore ? tsMs : Math.min(prev.earliestAtMs, tsMs)
      });
    };

    safeAttempts.forEach(att => {
      if (!att || typeof att !== 'object') return;
      const tsMs = parseAttemptTimestampMs(att);
      if (!tsMs || getVietnamDateKey(tsMs) !== targetDateKey) return;
      const uname = String(att.studentId || att.studentUsername || '').trim();
      if (!uname) return;
      const dur = Number(att.durationSeconds) > 0 ? Number(att.durationSeconds) : Number.POSITIVE_INFINITY;

      if (att.testMode === 'single_skill') {
        const sk = String(att.focusSkill || '').trim();
        if (sk === 'reading') {
          const band = typeof att.overallBand === 'number' ? att.overallBand : Number(att.scores?.reading?.band);
          const raw = Number(att.scores?.reading?.raw) || 0;
          const total = Number(att.scores?.reading?.total) || 0;
          const acc = total > 0 ? raw / total : 0;
          if (Number.isFinite(band)) {
            recordExamBoardEntry('reading', uname, att.studentName, band, acc, dur, tsMs);
          }
        } else if (sk === 'listening') {
          const band = typeof att.overallBand === 'number' ? att.overallBand : Number(att.scores?.listening?.band);
          const raw = Number(att.scores?.listening?.raw) || 0;
          const total = Number(att.scores?.listening?.total) || 0;
          const acc = total > 0 ? raw / total : 0;
          if (Number.isFinite(band)) {
            recordExamBoardEntry('listening', uname, att.studentName, band, acc, dur, tsMs);
          }
        } else if (sk === 'writing') {
          if (att.teacherGraded === false) return;
          const band =
            typeof att.overallBand === 'number' ? att.overallBand : Number(att.scores?.writing?.overallBand);
          if (Number.isFinite(band)) {
            recordExamBoardEntry('writing', uname, att.studentName, band, 0, dur, tsMs);
          }
        } else if (sk === 'speaking') {
          const hasBand =
            typeof att.overallBand === 'number' || typeof att.scores?.speaking?.band === 'number';
          if (!hasBand) return;
          if (att.teacherGraded === false && typeof att.scores?.speaking?.band !== 'number') return;
          const band =
            typeof att.overallBand === 'number' ? att.overallBand : Number(att.scores?.speaking?.band);
          if (Number.isFinite(band)) {
            recordExamBoardEntry('speaking', uname, att.studentName, band, 0, dur, tsMs);
          }
        }
      } else {
        if (att.teacherGraded === false) return;
        const band = typeof att.overallBand === 'number' ? att.overallBand : NaN;
        if (Number.isFinite(band)) {
          recordExamBoardEntry('overall', uname, att.studentName, band, 0, dur, tsMs);
        }
      }
    });

    const recordGameBoardEntry = (boardId, uname, name, scoreVal, accPct, tsMs) => {
      if (!uname || isExcludedStaffForDailyRank(uname, usersDb)) return;
      const score = Number(scoreVal) || 0;
      if (score <= 0) return;
      const map = boardMaps[boardId];
      if (!map) return;
      const key = uname.toLowerCase();
      const prev = map.get(key);
      const acc = Number.isFinite(Number(accPct)) ? Number(accPct) : 0;
      if (
        !prev ||
        score > prev.bestScore ||
        (score === prev.bestScore && acc > prev.bestAccuracy) ||
        (score === prev.bestScore && acc === prev.bestAccuracy && tsMs < prev.earliestAtMs)
      ) {
        map.set(key, {
          username: uname,
          name: getDisplayName(uname, name),
          bestScore: score,
          bestAccuracy: acc,
          earliestAtMs: tsMs
        });
      }
    };

    safePractice.forEach(entry => {
      if (!entry?.username) return;
      const tsMs = Number(entry.updatedAtMs) || 0;
      if (!tsMs || getVietnamDateKey(tsMs) !== targetDateKey) return;
      const scoreVal =
        Number(entry.lastScore) > 0
          ? Math.max(Number(entry.lastScore), Number(entry.score) || 0)
          : Number(entry.score) || 0;
      const isKnightEntry =
        entry.gameType === 'knight_rpg' ||
        String(entry.mode || '').toLowerCase().startsWith('knight');
      recordGameBoardEntry(
        isKnightEntry ? 'knight_game' : 'game',
        entry.username,
        entry.name,
        scoreVal,
        entry.accuracyPct,
        tsMs
      );
    });

    Object.values(roomsDb || {}).forEach(room => {
      if (!room || typeof room !== 'object') return;
      const roomTs = Number(room.finishedAtMs || room.updatedAtMs || room.lastUpdatedAt) || 0;
      const checkPlayerMap = playerMap => {
        if (!playerMap || typeof playerMap !== 'object') return;
        Object.entries(playerMap).forEach(([uname, p]) => {
          if (!p || typeof p !== 'object') return;
          const pTs = Number(p.updatedAtMs || p.finishedAtMs || roomTs) || 0;
          if (!pTs || getVietnamDateKey(pTs) !== targetDateKey) return;
          const boardId =
            p.gameType === 'knight_rpg' || room.gameType === 'knight_rpg' ? 'knight_game' : 'game';
          recordGameBoardEntry(boardId, p.username || uname, p.name || uname, p.score, p.accuracyPct ?? 0, pTs);
        });
      };
      checkPlayerMap(room.players);
      checkPlayerMap(room.liveMatch);
    });

    const boardRankings = {};
    const candidates = [];

    DAILY_RANK_BOARDS.forEach(board => {
      const entries = Array.from((boardMaps[board.id] || new Map()).values());
      if (board.id === 'game' || board.id === 'knight_game') {
        entries.sort(
          (a, b) =>
            b.bestScore - a.bestScore ||
            b.bestAccuracy - a.bestAccuracy ||
            a.earliestAtMs - b.earliestAtMs ||
            a.username.localeCompare(b.username)
        );
      } else {
        entries.sort((a, b) => {
          const avgA = a.count > 0 ? a.totalBand / a.count : 0;
          const avgB = b.count > 0 ? b.totalBand / b.count : 0;
          return (
            b.bestBand - a.bestBand ||
            avgB - avgA ||
            b.bestAccuracy - a.bestAccuracy ||
            a.bestDuration - b.bestDuration ||
            a.earliestAtMs - b.earliestAtMs ||
            a.username.localeCompare(b.username)
          );
        });
      }

      const isGameBoard = board.id === 'game' || board.id === 'knight_game';
      const top3 = entries.slice(0, 3).map((row, idx) => {
        const rank = idx + 1;
        const rankSpec = board.ranks[idx];
        const metricLabel = isGameBoard
          ? `${Number(row.bestScore || 0).toLocaleString('vi-VN')} điểm`
          : `Band ${Number(row.bestBand || 0).toFixed(1)}`;
        return {
          board: board.id,
          boardLabel: board.label,
          boardShortLabel: board.shortLabel,
          boardPriority: board.priority,
          rank,
          titleId: rankSpec.id,
          username: row.username,
          name: row.name || row.username,
          metricLabel,
          scoreValue: isGameBoard ? row.bestScore : row.bestBand,
          dateKey,
          settledFromDateKey: targetDateKey,
          expiresAtMs: endMs
        };
      });

      boardRankings[board.id] = top3;
      candidates.push(...top3);
    });

    candidates.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.boardPriority - b.boardPriority ||
        (Number(b.scoreValue) || 0) - (Number(a.scoreValue) || 0) ||
        a.username.localeCompare(b.username)
    );

    const byTitleId = {};
    const byUsername = {};
    const assignedUsers = new Set();

    candidates.forEach(cand => {
      const uLower = cand.username.toLowerCase();
      if (byTitleId[cand.titleId]) return;
      if (assignedUsers.has(uLower)) return;
      assignedUsers.add(uLower);
      const record = {
        titleId: cand.titleId,
        board: cand.board,
        boardLabel: cand.boardLabel,
        boardShortLabel: cand.boardShortLabel,
        rank: cand.rank,
        username: cand.username,
        name: cand.name,
        metricLabel: cand.metricLabel,
        dateKey: cand.dateKey,
        settledFromDateKey: cand.settledFromDateKey,
        expiresAtMs: cand.expiresAtMs
      };
      byTitleId[cand.titleId] = record;
      byUsername[uLower] = record;
    });

    return { byTitleId, byUsername, boardRankings };
  };

  // Settled yesterday winners receive the actual title today:
  const settledResult = evaluateForTargetDateKey(settledDateKey);
  // Live today rankings are tracked for "Đang tạm dẫn hôm nay -> trao vào ngày mai" display:
  const liveTodayResult = evaluateForTargetDateKey(dateKey);

  return {
    dateKey,
    settledDateKey,
    expiresAtMs: endMs,
    byTitleId: settledResult.byTitleId,
    byUsername: settledResult.byUsername,
    boardRankings: settledResult.boardRankings,
    liveTodayByTitleId: liveTodayResult.byTitleId,
    liveTodayByUsername: liveTodayResult.byUsername,
    liveTodayBoardRankings: liveTodayResult.boardRankings
  };
}

export const STUDENT_TITLES = [
  // ==== NHÓM DỄ (Khởi đầu & Cột mốc đầu tiên - 14 danh hiệu) ====
  {
    id: 'newbie',
    label: 'Newbie',
    icon: '🌱',
    tier: 'Khởi Đầu',
    difficulty: 'Dễ',
    conditionText: 'Mặc định mở khóa cho mọi thành viên khi bắt đầu tham gia.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40',
    heroBadgeClass: 'bg-emerald-500/25 text-emerald-100 border-emerald-400/50',
    gameBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40',
    isUnlocked: () => true,
    getProgress: () => ({ pct: 100, text: 'Mặc định sở hữu' })
  },
  {
    id: 'first_step',
    label: 'Bước Chân Đầu Tiên',
    icon: '👟',
    tier: 'Khởi Đầu',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành và nộp bài thi hoặc bài tập thực hành đầu tiên (>= 1 bài).',
    badgeClass: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-500/40',
    heroBadgeClass: 'bg-lime-500/25 text-lime-100 border-lime-400/50',
    gameBadgeClass: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-400/40',
    isUnlocked: (stats) => stats.examCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 1) * 100)),
      text: `${Math.min(stats.examCount, 1)}/1 bài đầu tiên`
    })
  },
  {
    id: 'daily_starter',
    label: 'Khởi Động Daily Zone',
    icon: '☀️',
    tier: 'Daily Zone',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành bài tập đầu tiên trong khu vực Daily Zone (>= 1 bài).',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40',
    heroBadgeClass: 'bg-amber-500/25 text-amber-100 border-amber-400/50',
    gameBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/40',
    isUnlocked: (stats) => stats.dailyZoneCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 1) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 1)}/1 bài Daily Zone`
    })
  },
  {
    id: 'reading_starter',
    label: 'Người Đọc Chăm Chỉ',
    icon: '📖',
    tier: 'Kỹ Năng',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành bài luyện tập hoặc bài thi có kỹ năng Reading đầu tiên (>= 1 bài).',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40',
    heroBadgeClass: 'bg-blue-500/25 text-blue-100 border-blue-400/50',
    gameBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/40',
    isUnlocked: (stats) => stats.readingCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.readingCount / 1) * 100)),
      text: `${Math.min(stats.readingCount, 1)}/1 bài Reading`
    })
  },
  {
    id: 'listening_starter',
    label: 'Đôi Tai Nhạy Bén',
    icon: '🎧',
    tier: 'Kỹ Năng',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành bài luyện tập hoặc bài thi có kỹ năng Listening đầu tiên (>= 1 bài).',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-500/40',
    heroBadgeClass: 'bg-teal-500/25 text-teal-100 border-teal-400/50',
    gameBadgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/40',
    isUnlocked: (stats) => stats.listeningCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.listeningCount / 1) * 100)),
      text: `${Math.min(stats.listeningCount, 1)}/1 bài Listening`
    })
  },
  {
    id: 'writing_starter',
    label: 'Cây Bút Khởi Sắc',
    icon: '✍️',
    tier: 'Kỹ Năng',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành và nộp bài Writing đầu tiên (>= 1 bài).',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40',
    heroBadgeClass: 'bg-emerald-500/25 text-emerald-100 border-emerald-400/50',
    gameBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40',
    isUnlocked: (stats) => stats.writingCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.writingCount / 1) * 100)),
      text: `${Math.min(stats.writingCount, 1)}/1 bài Writing`
    })
  },
  {
    id: 'speaking_starter',
    label: 'Tự Tin Cất Tiếng',
    icon: '🎙️',
    tier: 'Kỹ Năng',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành bài luyện nói Speaking đầu tiên (>= 1 bài).',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40',
    heroBadgeClass: 'bg-rose-500/25 text-rose-100 border-rose-400/50',
    gameBadgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/40',
    isUnlocked: (stats) => stats.speakingCount >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.speakingCount / 1) * 100)),
      text: `${Math.min(stats.speakingCount, 1)}/1 bài Speaking`
    })
  },
  {
    id: 'game_rookie',
    label: 'Tân Binh Đấu Trường',
    icon: '🎮',
    tier: 'Game',
    difficulty: 'Dễ',
    conditionText: 'Chinh phục ít nhất 300 điểm trong Đấu Trường Từ Vựng.',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-500/40',
    heroBadgeClass: 'bg-cyan-500/25 text-cyan-100 border-cyan-400/50',
    gameBadgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/40',
    isUnlocked: (stats) => stats.bestGameScore >= 300,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 300) * 100)),
      text: `${Math.min(stats.bestGameScore, 300)}/300 điểm Game`
    })
  },
  {
    id: 'practice_700',
    label: 'Xạ Thủ Từ Vựng',
    icon: '🕹️',
    tier: 'Game',
    difficulty: 'Dễ',
    conditionText: 'Ghi ít nhất 700 điểm trong Đấu Trường Từ Vựng hoặc Khu Tự Luyện.',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/40',
    heroBadgeClass: 'bg-sky-500/25 text-sky-100 border-sky-400/50',
    gameBadgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/40',
    isUnlocked: (stats) => stats.bestGameScore >= 700,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 700) * 100)),
      text: `${Math.min(stats.bestGameScore, 700)}/700 điểm Game`
    })
  },
  {
    id: 'knight_slime_hunter',
    label: 'Tân Binh Diệt Slime',
    icon: '🗡️',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Dễ',
    conditionText: 'Hạ gục ít nhất 5 quái vật (Slime / Goblin / Orc) trong game Hiệp Sĩ Diệt Rồng.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    heroBadgeClass: 'bg-emerald-500/30 text-emerald-100 border-emerald-300/60',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50',
    isUnlocked: (stats) => stats.knightMonstersSlain >= 5 || stats.knightBestScore >= 500,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((Math.max(stats.knightMonstersSlain, Math.floor(stats.knightBestScore / 100)) / 5) * 100)),
      text: `${Math.min(5, Math.max(stats.knightMonstersSlain, Math.floor(stats.knightBestScore / 100)))}/5 quái Slime/Goblin`
    })
  },
  {
    id: 'knight_goblin_slayer',
    label: 'Khắc Tinh Goblin',
    icon: '⚔️',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Bình Thường',
    conditionText: 'Hạ gục ít nhất 20 quái vật hoặc đạt 1.200+ điểm trong game Hiệp Sĩ Diệt Rồng.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/50',
    heroBadgeClass: 'bg-amber-500/30 text-amber-100 border-amber-300/60',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50',
    isUnlocked: (stats) => stats.knightMonstersSlain >= 20 || stats.knightBestScore >= 1200,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.max(Math.round((stats.knightMonstersSlain / 20) * 100), Math.round((stats.knightBestScore / 1200) * 100))),
      text: `${Math.min(stats.knightMonstersSlain, 20)}/20 quái (${Math.min(stats.knightBestScore, 1200)}/1200đ)`
    })
  },
  {
    id: 'knight_key_finder',
    label: 'Thợ Săn Chìa Khóa Hồi Sinh',
    icon: '🗝️',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Bình Thường',
    conditionText: 'Nhặt được hoặc tích lũy từ 3 Chìa Khóa Hồi Sinh trở lên trên đường hành hiệp.',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-400 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-400/55',
    heroBadgeClass: 'bg-yellow-500/30 text-yellow-100 border-yellow-300/70',
    gameBadgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-400 dark:bg-yellow-500/25 dark:text-yellow-200 dark:border-yellow-400/55',
    isUnlocked: (stats) => stats.knightKeysCollected >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.knightKeysCollected / 3) * 100)),
      text: `${Math.min(stats.knightKeysCollected, 3)}/3 Chìa Khóa Hồi Sinh`
    })
  },
  {
    id: 'knight_hero_collector',
    label: 'Nhà Sưu Tập Anh Hùng',
    icon: '👗',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Khó',
    conditionText: 'Tích vàng đánh quái để mở khóa ít nhất 2 nhân vật / skin mới (Nữ Chiến Binh Valkyrie, Nữ Kiếm Khách Sakura...) trong Cửa Hàng Hiệp Sĩ.',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-400/55',
    heroBadgeClass: 'bg-pink-500/30 text-pink-100 border-pink-300/70',
    gameBadgeClass: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-500/25 dark:text-pink-200 dark:border-pink-400/55',
    isUnlocked: (stats) => stats.knightUnlockedSkinsCount >= 2,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.knightUnlockedSkinsCount / 2) * 100)),
      text: `${Math.min(stats.knightUnlockedSkinsCount, 2)}/2 nhân vật đã mở khóa`
    })
  },
  {
    id: 'knight_dragon_slayer',
    label: 'Dũng Sĩ Đồ Long',
    icon: '🐉',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Khó',
    conditionText: 'Đánh bại Boss Cuối Rồng Hắc Ám Cổ Đại ít nhất 1 lần trong game Hiệp Sĩ Diệt Rồng.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-400 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-rose-500/40 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/65',
    isUnlocked: (stats) => stats.knightDragonsSlain >= 1,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.knightDragonsSlain / 1) * 100)),
      text: `${Math.min(stats.knightDragonsSlain, 1)}/1 Boss Rồng Hắc Ám bị hạ`
    })
  },
  {
    id: 'knight_dragon_empress',
    label: 'Huyền Thoại Long Kỵ Sĩ',
    icon: '👑',
    tier: 'Hiệp Sĩ RPG',
    difficulty: 'Cực Khó',
    conditionText: 'Hạ gục Boss Cuối Rồng Hắc Ám từ 5 lần trở lên hoặc mở khóa từ 4 nhân vật trong Cửa Hàng Hiệp Sĩ.',
    badgeClass: 'bg-gradient-to-r from-amber-100 via-rose-50 to-amber-100 text-rose-950 border-amber-400 dark:from-amber-500/30 dark:via-rose-500/25 dark:to-amber-500/30 dark:text-amber-100 dark:border-amber-400/75 font-bold',
    heroBadgeClass: 'bg-gradient-to-r from-amber-500/45 to-rose-500/45 text-amber-50 border-amber-300/85',
    gameBadgeClass: 'bg-amber-100 text-rose-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/75',
    isUnlocked: (stats) => stats.knightDragonsSlain >= 5 || stats.knightUnlockedSkinsCount >= 4 || stats.knightBestScore >= 3000,
    getProgress: (stats) => ({
      pct: Math.min(
        100,
        Math.max(
          Math.round((stats.knightDragonsSlain / 5) * 100),
          Math.round((stats.knightUnlockedSkinsCount / 4) * 100),
          Math.round((stats.knightBestScore / 3000) * 100)
        )
      ),
      text: `${Math.min(stats.knightDragonsSlain, 5)}/5 Rồng • ${Math.min(stats.knightUnlockedSkinsCount, 4)}/4 Nhân vật`
    })
  },
  {
    id: 'diligent',
    label: 'Chiến Binh Chăm Chỉ',
    icon: '📚',
    tier: 'Luyện Đề',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành ít nhất 3 bài thi hoặc bài tập 4 kỹ năng.',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-500/40',
    heroBadgeClass: 'bg-sky-500/25 text-sky-100 border-sky-400/50',
    gameBadgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/40',
    isUnlocked: (stats) => stats.examCount >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 3) * 100)),
      text: `${Math.min(stats.examCount, 3)}/3 bài thi`
    })
  },
  {
    id: 'daily_5',
    label: 'Tập Sự Daily Zone',
    icon: '🧭',
    tier: 'Daily Zone',
    difficulty: 'Dễ',
    conditionText: 'Hoàn thành tích lũy tối thiểu 5 bài trong Daily Zone.',
    badgeClass: 'bg-lime-50 text-lime-800 border-lime-300 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-400/50',
    heroBadgeClass: 'bg-lime-500/25 text-lime-100 border-lime-300/60',
    gameBadgeClass: 'bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-500/25 dark:text-lime-200 dark:border-lime-400/50',
    isUnlocked: (stats) => stats.dailyZoneCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 5) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 5)}/5 bài Daily Zone`
    })
  },
  {
    id: 'band50_starter',
    label: 'Chạm Ngõ Band 5.0+',
    icon: '📘',
    tier: 'Điểm Thi',
    difficulty: 'Dễ',
    conditionText: 'Đạt Overall Band từ 5.0 trở lên ở một bài thi hoặc Daily Zone bất kỳ.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50',
    heroBadgeClass: 'bg-sky-500/25 text-sky-100 border-sky-300/60',
    gameBadgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50',
    isUnlocked: (stats) => stats.highestBand >= 5.0,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 5.0) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/5.0`
    })
  },
  {
    id: 'band55_climber',
    label: 'Bứt Tốc Band 5.5+',
    icon: '📗',
    tier: 'Điểm Thi',
    difficulty: 'Dễ',
    conditionText: 'Đạt Overall Band từ 5.5 trở lên ở một bài thi hoặc Daily Zone bất kỳ.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    heroBadgeClass: 'bg-emerald-500/25 text-emerald-100 border-emerald-300/60',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    isUnlocked: (stats) => stats.highestBand >= 5.5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 5.5) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/5.5`
    })
  },
  {
    id: 'band60_solid',
    label: 'Chắc Tay Band 6.0+',
    icon: '📙',
    tier: 'Điểm Thi',
    difficulty: 'Dễ',
    conditionText: 'Đạt Overall Band từ 6.0 trở lên ở một bài thi hoặc Daily Zone bất kỳ.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    heroBadgeClass: 'bg-teal-500/25 text-teal-100 border-teal-300/60',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    isUnlocked: (stats) => stats.highestBand >= 6.0,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 6.0) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/6.0`
    })
  },

  // ==== NHÓM BÌNH THƯỜNG (Phong độ ổn định & Kỹ năng vững - 16 danh hiệu) ====
  {
    id: 'veteran',
    label: 'Học Bá Chinh Chiến',
    icon: '🔥',
    tier: 'Luyện Đề',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành ít nhất 10 bài thi hoặc bài tập 4 kỹ năng.',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/40',
    heroBadgeClass: 'bg-orange-500/25 text-orange-100 border-orange-400/50',
    gameBadgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/40',
    isUnlocked: (stats) => stats.examCount >= 10,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 10) * 100)),
      text: `${Math.min(stats.examCount, 10)}/10 bài thi`
    })
  },
  {
    id: 'daily_15',
    label: 'Tín Đồ Daily Zone',
    icon: '📝',
    tier: 'Daily Zone',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 15 bài luyện tập trở lên trong Daily Zone.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50',
    heroBadgeClass: 'bg-sky-500/30 text-sky-100 border-sky-300/60',
    gameBadgeClass: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/50',
    isUnlocked: (stats) => stats.dailyZoneCount >= 15,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 15) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 15)}/15 bài Daily Zone`
    })
  },
  {
    id: 'daily_30',
    label: 'Chiến Binh Daily 30',
    icon: '🛡️',
    tier: 'Daily Zone',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 30 bài luyện tập trở lên trong Daily Zone.',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/50',
    heroBadgeClass: 'bg-indigo-500/30 text-indigo-100 border-indigo-300/60',
    gameBadgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/50',
    isUnlocked: (stats) => stats.dailyZoneCount >= 30,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 30) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 30)}/30 bài Daily Zone`
    })
  },
  {
    id: 'band65',
    label: 'Thợ Săn Band 6.5+',
    icon: '🎯',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt Overall Band từ 6.5 trở lên ở một bài thi bất kỳ.',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-500/40',
    heroBadgeClass: 'bg-teal-500/25 text-teal-100 border-teal-400/50',
    gameBadgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/40',
    isUnlocked: (stats) => stats.highestBand >= 6.5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 6.5) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/6.5`
    })
  },
  {
    id: 'band70_milestone',
    label: 'Chinh Phục Band 7.0+',
    icon: '🎖️',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt cột mốc Overall Band từ 7.0 trở lên ở một bài thi bất kỳ.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/50',
    heroBadgeClass: 'bg-blue-500/30 text-blue-100 border-blue-300/60',
    gameBadgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/50',
    isUnlocked: (stats) => stats.highestBand >= 7.0,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 7.0) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/7.0`
    })
  },
  {
    id: 'band75',
    label: 'Cao Thủ Band 7.5+',
    icon: '💎',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt Overall Band từ 7.5 trở lên ở một bài thi bất kỳ.',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/50',
    heroBadgeClass: 'bg-cyan-500/30 text-cyan-100 border-cyan-300/60',
    gameBadgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/50',
    isUnlocked: (stats) => stats.highestBand >= 7.5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 7.5) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/7.5`
    })
  },
  {
    id: 'band65_x5',
    label: 'Ổn Định Band 6.5+ (5 Lần)',
    icon: '📊',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt Overall Band >= 6.5 tích lũy ít nhất 5 lần.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    heroBadgeClass: 'bg-teal-500/30 text-teal-100 border-teal-300/60',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/50',
    isUnlocked: (stats) => stats.band65Count >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band65Count / 5) * 100)),
      text: `${Math.min(stats.band65Count, 5)}/5 lần đạt Band 6.5+`
    })
  },
  {
    id: 'steady_scholar',
    label: 'Học Giả Vững Phong Độ',
    icon: '📐',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Có ít nhất 2 bài thi/bài tập đạt Overall Band >= 7.0.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/50',
    heroBadgeClass: 'bg-blue-500/30 text-blue-100 border-blue-300/60',
    gameBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/50',
    isUnlocked: (stats) => stats.band70Count >= 2,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band70Count / 2) * 100)),
      text: `${Math.min(stats.band70Count, 2)}/2 bài >= 7.0`
    })
  },
  {
    id: 'band70_x3',
    label: 'Tam Tinh Band 7.0+ (3 Lần)',
    icon: '🌠',
    tier: 'Điểm Thi',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt Overall Band >= 7.0 tích lũy ít nhất 3 lần.',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/50',
    heroBadgeClass: 'bg-cyan-500/30 text-cyan-100 border-cyan-300/60',
    gameBadgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-400/50',
    isUnlocked: (stats) => stats.band70Count >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band70Count / 3) * 100)),
      text: `${Math.min(stats.band70Count, 3)}/3 lần đạt Band 7.0+`
    })
  },
  {
    id: 'reading_veteran_5',
    label: 'Mọt Sách Reading',
    icon: '🔎',
    tier: 'Kỹ Năng',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 5 bài Reading trở lên.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/50',
    heroBadgeClass: 'bg-blue-500/30 text-blue-100 border-blue-300/60',
    gameBadgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/50',
    isUnlocked: (stats) => stats.readingCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.readingCount / 5) * 100)),
      text: `${Math.min(stats.readingCount, 5)}/5 bài Reading`
    })
  },
  {
    id: 'listening_veteran_5',
    label: 'Thính Giả Đẳng Cấp',
    icon: '🎵',
    tier: 'Kỹ Năng',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 5 bài Listening trở lên.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    heroBadgeClass: 'bg-teal-500/30 text-teal-100 border-teal-300/60',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/50',
    isUnlocked: (stats) => stats.listeningCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.listeningCount / 5) * 100)),
      text: `${Math.min(stats.listeningCount, 5)}/5 bài Listening`
    })
  },
  {
    id: 'writing_veteran_5',
    label: 'Nhà Văn Học Thuật',
    icon: '🖋️',
    tier: 'Kỹ Năng',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 5 bài Writing trở lên.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    heroBadgeClass: 'bg-emerald-500/30 text-emerald-100 border-emerald-300/60',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50',
    isUnlocked: (stats) => stats.writingCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.writingCount / 5) * 100)),
      text: `${Math.min(stats.writingCount, 5)}/5 bài Writing`
    })
  },
  {
    id: 'speaking_veteran_5',
    label: 'Diễn Giả IELTS',
    icon: '🗣️',
    tier: 'Kỹ Năng',
    difficulty: 'Bình Thường',
    conditionText: 'Hoàn thành tích lũy từ 5 bài Speaking trở lên.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/50',
    heroBadgeClass: 'bg-rose-500/30 text-rose-100 border-rose-300/60',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/50',
    isUnlocked: (stats) => stats.speakingCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.speakingCount / 5) * 100)),
      text: `${Math.min(stats.speakingCount, 5)}/5 bài Speaking`
    })
  },
  {
    id: 'dual_skill_pro',
    label: 'Song Toàn 2 Kỹ Năng',
    icon: '⚖️',
    tier: 'Kỹ Năng',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt Band >= 6.5 ở ít nhất 2 kỹ năng khác nhau (trong L · R · W · S).',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/50',
    heroBadgeClass: 'bg-violet-500/30 text-violet-100 border-violet-300/60',
    gameBadgeClass: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/50',
    isUnlocked: (stats) => stats.skillsAt65Count >= 2,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.skillsAt65Count / 2) * 100)),
      text: `${Math.min(stats.skillsAt65Count, 2)}/2 kỹ năng đạt Band 6.5+`
    })
  },
  {
    id: 'speedster',
    label: 'Tia Chớp Đấu Trường',
    icon: '⚡',
    tier: 'Game',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt tối thiểu 1,200 điểm kỷ lục trong Game Từ Vựng.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/50',
    heroBadgeClass: 'bg-indigo-500/30 text-indigo-100 border-indigo-300/60',
    gameBadgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/50',
    isUnlocked: (stats) => stats.bestGameScore >= 1200,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 1200) * 100)),
      text: `${Math.min(stats.bestGameScore, 1200)}/1,200 điểm Game`
    })
  },
  {
    id: 'space_commander',
    label: 'Thủ Lĩnh Vũ Trụ',
    icon: '🚀',
    tier: 'Game',
    difficulty: 'Bình Thường',
    conditionText: 'Đạt tối thiểu 2,500 điểm kỷ lục trong Game Từ Vựng.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-400/50',
    heroBadgeClass: 'bg-purple-500/30 text-purple-100 border-purple-300/60',
    gameBadgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/50',
    isUnlocked: (stats) => stats.bestGameScore >= 2500,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 2500) * 100)),
      text: `${Math.min(stats.bestGameScore, 2500)}/2,500 điểm Game`
    })
  },

  // ==== NHÓM KHÓ (Tách riêng khỏi Cực Khó — Điểm cao & Chinh chiến mạnh - 12 danh hiệu) ====
  {
    id: 'band80_ace',
    label: 'Tinh Anh Band 8.0+',
    icon: '🦁',
    tier: 'Điểm Thi',
    difficulty: 'Khó',
    conditionText: 'Chạm mốc Overall Band từ 8.0 trở lên ở một bài thi hoặc bài tập bất kỳ.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
    heroBadgeClass: 'bg-amber-500/35 text-amber-100 border-amber-300/70',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
    isUnlocked: (stats) => stats.highestBand >= 8.0,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 8.0) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/8.0`
    })
  },
  {
    id: 'band85',
    label: 'Huyền Thoại IELTS 8.5+',
    icon: '👑',
    tier: 'Tối Thượng',
    difficulty: 'Khó',
    conditionText: 'Chạm mốc Overall Band từ 8.5 trở lên trong kỳ thi IELTS.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
    heroBadgeClass: 'bg-amber-500/35 text-amber-100 border-amber-300/70',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
    isUnlocked: (stats) => stats.highestBand >= 8.5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 8.5) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/8.5`
    })
  },
  {
    id: 'band70_x7',
    label: 'Thất Tinh Band 7.0 (7 Lần)',
    icon: '✨',
    tier: 'Điểm Thi',
    difficulty: 'Khó',
    conditionText: 'Đạt Overall Band từ 7.0 trở lên đủ 7 lần trên hệ thống (không tính điểm danh).',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/65',
    heroBadgeClass: 'bg-gradient-to-r from-amber-500/35 to-yellow-500/35 text-amber-100 border-amber-300/75',
    gameBadgeClass: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/65',
    isUnlocked: (stats) => stats.band70Count >= 7,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band70Count / 7) * 100)),
      text: `${Math.min(stats.band70Count, 7)}/7 lần đạt Band 7.0+`
    })
  },
  {
    id: 'band75_x5',
    label: 'Ngũ Hổ Band 7.5+ (5 Lần)',
    icon: '💠',
    tier: 'Điểm Thi',
    difficulty: 'Khó',
    conditionText: 'Đạt Overall Band từ 7.5 trở lên tối thiểu 5 lần.',
    badgeClass: 'bg-cyan-50 text-cyan-900 border-cyan-400 dark:bg-cyan-500/25 dark:text-cyan-100 dark:border-cyan-400/65',
    heroBadgeClass: 'bg-cyan-500/35 text-cyan-100 border-cyan-300/75',
    gameBadgeClass: 'bg-cyan-100 text-cyan-950 border-cyan-400 dark:bg-cyan-500/30 dark:text-cyan-100 dark:border-cyan-400/65',
    isUnlocked: (stats) => stats.band75Count >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band75Count / 5) * 100)),
      text: `${Math.min(stats.band75Count, 5)}/5 lần đạt Band 7.5+`
    })
  },
  {
    id: 'band80_x3',
    label: 'Tam Hoàng Band 8.0+ (3 Lần)',
    icon: '🔱',
    tier: 'Điểm Thi',
    difficulty: 'Khó',
    conditionText: 'Đạt Overall Band từ 8.0 trở lên tối thiểu 3 lần.',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-400 dark:bg-orange-500/25 dark:text-orange-100 dark:border-orange-400/65',
    heroBadgeClass: 'bg-orange-500/35 text-orange-100 border-orange-300/75',
    gameBadgeClass: 'bg-orange-100 text-orange-950 border-orange-400 dark:bg-orange-500/30 dark:text-orange-100 dark:border-orange-400/65',
    isUnlocked: (stats) => stats.band80Count >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band80Count / 3) * 100)),
      text: `${Math.min(stats.band80Count, 3)}/3 lần đạt Band 8.0+`
    })
  },
  {
    id: 'reading_ace_5',
    label: 'Bậc Thầy L & R 7.5+',
    icon: '📖',
    tier: 'Điểm Thi',
    difficulty: 'Khó',
    conditionText: 'Đạt Band Listening hoặc Reading >= 7.5 trong ít nhất 5 lượt thi.',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/60',
    heroBadgeClass: 'bg-indigo-500/35 text-indigo-100 border-indigo-300/70',
    gameBadgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/60',
    isUnlocked: (stats) => stats.highLrCount >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highLrCount / 5) * 100)),
      text: `${Math.min(stats.highLrCount, 5)}/5 lượt L/R >= 7.5`
    })
  },
  {
    id: 'speaking_75_x3',
    label: 'Hùng Biện Band 7.5+',
    icon: '🎤',
    tier: 'Kỹ Năng',
    difficulty: 'Khó',
    conditionText: 'Đạt Speaking Band từ 7.5 trở lên ít nhất 3 lần.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60',
    heroBadgeClass: 'bg-rose-500/35 text-rose-100 border-rose-300/70',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60',
    isUnlocked: (stats) => stats.highSpeakingCount >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highSpeakingCount / 3) * 100)),
      text: `${Math.min(stats.highSpeakingCount, 3)}/3 lượt Speaking >= 7.5`
    })
  },
  {
    id: 'writing_70_x3',
    label: 'Bút Chiến Band 7.0+',
    icon: '📜',
    tier: 'Kỹ Năng',
    difficulty: 'Khó',
    conditionText: 'Đạt Writing Band từ 7.0 trở lên ít nhất 3 lần (đã chấm duyệt).',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/60',
    heroBadgeClass: 'bg-emerald-500/35 text-emerald-100 border-emerald-300/70',
    gameBadgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-100 dark:border-emerald-400/60',
    isUnlocked: (stats) => stats.highWritingCount >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highWritingCount / 3) * 100)),
      text: `${Math.min(stats.highWritingCount, 3)}/3 lượt Writing >= 7.0`
    })
  },
  {
    id: 'all_rounder_4',
    label: 'Toàn Diện Tứ Kỹ Năng',
    icon: '🌟',
    tier: 'Thành Tựu',
    difficulty: 'Khó',
    conditionText: 'Hoàn thành bài làm có ghi nhận đủ cả 4 kỹ năng: Listening, Reading, Writing và Speaking.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/60',
    heroBadgeClass: 'bg-sky-500/35 text-sky-100 border-sky-300/70',
    gameBadgeClass: 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/60',
    isUnlocked: (stats) => stats.coveredSkillsCount >= 4,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.coveredSkillsCount / 4) * 100)),
      text: `${Math.min(stats.coveredSkillsCount, 4)}/4 kỹ năng (L·R·W·S)`
    })
  },
  {
    id: 'marathon_25',
    label: 'Chiến Mã 25 Đề',
    icon: '⚔️',
    tier: 'Luyện Đề',
    difficulty: 'Khó',
    conditionText: 'Hoàn thành tích lũy từ 25 bài thi IELTS hoặc bài tập kỹ năng trở lên.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/50',
    heroBadgeClass: 'bg-amber-500/30 text-amber-100 border-amber-300/60',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50',
    isUnlocked: (stats) => stats.examCount >= 25,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 25) * 100)),
      text: `${Math.min(stats.examCount, 25)}/25 bài hoàn thành`
    })
  },
  {
    id: 'daily_zone_100',
    label: 'Bách Chiến Daily Zone',
    icon: '🌩️',
    tier: 'Daily Zone',
    difficulty: 'Khó',
    conditionText: 'Hoàn thành tích lũy từ 100 bài tập trở lên trong Daily Zone.',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-400 dark:bg-purple-500/25 dark:text-purple-100 dark:border-purple-400/65',
    heroBadgeClass: 'bg-purple-500/35 text-purple-100 border-purple-300/75',
    gameBadgeClass: 'bg-purple-100 text-purple-950 border-purple-400 dark:bg-purple-500/30 dark:text-purple-100 dark:border-purple-400/65',
    isUnlocked: (stats) => stats.dailyZoneCount >= 100,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 100) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 100)}/100 bài Daily Zone`
    })
  },
  {
    id: 'grandmaster',
    label: 'Song Toàn Đỉnh Cao',
    icon: '🏆',
    tier: 'Tối Thượng',
    difficulty: 'Khó',
    conditionText: 'Đạt cả IELTS Band >= 7.0 VÀ Game Từ Vựng >= 2,000 điểm.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/50',
    heroBadgeClass: 'bg-gradient-to-r from-amber-500/35 to-rose-500/35 text-amber-100 border-amber-300/70',
    gameBadgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/50',
    isUnlocked: (stats) => stats.highestBand >= 7.0 && stats.bestGameScore >= 2000,
    getProgress: (stats) => {
      const bandPct = Math.min(1, stats.highestBand / 7.0);
      const gamePct = Math.min(1, stats.bestGameScore / 2000);
      const avgPct = Math.round(((bandPct + gamePct) / 2) * 100);
      return {
        pct: Math.min(100, avgPct),
        text: `Band ${stats.highestBand.toFixed(1)}/7.0 • Game ${stats.bestGameScore}/2,000đ`
      };
    }
  },

  // ==== NHÓM CỰC KHÓ (Tách riêng hoàn toàn — 100% Điểm Thi, Daily Zone & Luyện Đề, KHÔNG điểm danh - 14 danh hiệu) ====
  {
    id: 'band90_god',
    label: 'Tuyệt Đỉnh IELTS 9.0',
    icon: '💎',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Chạm cột mốc điểm tuyệt đối Overall Band 9.0.',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-400 dark:bg-cyan-500/30 dark:text-cyan-100 dark:border-cyan-400/70',
    heroBadgeClass: 'bg-cyan-500/40 text-cyan-100 border-cyan-300/80',
    gameBadgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-400 dark:bg-cyan-500/30 dark:text-cyan-100 dark:border-cyan-400/70',
    isUnlocked: (stats) => stats.highestBand >= 9.0,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.highestBand / 9.0) * 100)),
      text: `Band cao nhất: ${stats.highestBand > 0 ? stats.highestBand.toFixed(1) : '0.0'}/9.0`
    })
  },
  {
    id: 'band70_x20',
    label: 'Nhị Thập Band 7.0+ (20 Lần)',
    icon: '🔥',
    tier: 'Điểm Thi',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Đạt Overall Band từ 7.0 trở lên tích lũy đủ 20 lần.',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-500 dark:bg-orange-500/35 dark:text-orange-100 dark:border-orange-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-orange-600/45 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-orange-100 text-orange-950 border-orange-500 dark:bg-orange-500/35 dark:text-orange-100 dark:border-orange-400/75',
    isUnlocked: (stats) => stats.band70Count >= 20,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band70Count / 20) * 100)),
      text: `${Math.min(stats.band70Count, 20)}/20 lần đạt Band 7.0+`
    })
  },
  {
    id: 'band70_x70',
    label: 'Thất Thập Huyền Thoại 7.0+ (70 Lần)',
    icon: '👑',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ HUYỀN THOẠI: Đạt Overall Band từ 7.0 trở lên đủ 70 lần trên hệ thống.',
    badgeClass: 'bg-gradient-to-r from-rose-100 via-amber-100 to-rose-100 text-rose-950 border-rose-500 dark:from-rose-600/40 dark:via-amber-500/35 dark:to-rose-600/40 dark:text-amber-100 dark:border-amber-400/80 font-bold',
    heroBadgeClass: 'bg-gradient-to-r from-rose-600/50 via-amber-500/45 to-fuchsia-600/45 text-amber-50 border-amber-300/85',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-600/40 dark:text-amber-100 dark:border-amber-400/80',
    isUnlocked: (stats) => stats.band70Count >= 70,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band70Count / 70) * 100)),
      text: `${Math.min(stats.band70Count, 70)}/70 lần đạt Band 7.0+`
    })
  },
  {
    id: 'band75_x25',
    label: 'Chiến Thần Band 7.5+ (25 Lần)',
    icon: '⚜️',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Đạt Overall Band từ 7.5 trở lên tích lũy đủ 25 lần.',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-500 dark:bg-fuchsia-500/35 dark:text-fuchsia-100 dark:border-fuchsia-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-fuchsia-600/45 to-purple-600/45 text-fuchsia-100 border-fuchsia-300/80',
    gameBadgeClass: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-500 dark:bg-fuchsia-500/35 dark:text-fuchsia-100 dark:border-fuchsia-400/75',
    isUnlocked: (stats) => stats.band75Count >= 25,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band75Count / 25) * 100)),
      text: `${Math.min(stats.band75Count, 25)}/25 lần đạt Band 7.5+`
    })
  },
  {
    id: 'band80_x10',
    label: 'Thập Toàn Band 8.0+ (10 Lần)',
    icon: '🌠',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Đạt Overall Band từ 8.0 trở lên tối thiểu 10 lần.',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-500/35 dark:text-amber-100 dark:border-amber-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-amber-500/45 to-orange-600/45 text-amber-50 border-amber-300/80',
    gameBadgeClass: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-500/35 dark:text-amber-100 dark:border-amber-400/75',
    isUnlocked: (stats) => stats.band80Count >= 10,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band80Count / 10) * 100)),
      text: `${Math.min(stats.band80Count, 10)}/10 lần đạt Band 8.0+`
    })
  },
  {
    id: 'band85_x5',
    label: 'Độc Cô Cầu Bại 8.5+ (5 Lần)',
    icon: '🦅',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Đạt Overall Band từ 8.5 trở lên tối thiểu 5 lần.',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-600/35 dark:text-rose-100 dark:border-rose-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-rose-600/45 to-red-600/45 text-rose-50 border-rose-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-600/35 dark:text-rose-100 dark:border-rose-400/75',
    isUnlocked: (stats) => stats.band85Count >= 5,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band85Count / 5) * 100)),
      text: `${Math.min(stats.band85Count, 5)}/5 lần đạt Band 8.5+`
    })
  },
  {
    id: 'band90_x3',
    label: 'Tam Tuyệt Đỉnh 9.0 (3 Lần)',
    icon: '🌌',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ HUYỀN THOẠI: Đạt điểm tuyệt đối Overall Band 9.0 đủ 3 lần.',
    badgeClass: 'bg-gradient-to-r from-indigo-100 via-cyan-100 to-fuchsia-100 text-indigo-950 border-indigo-500 dark:from-indigo-600/45 dark:via-cyan-500/35 dark:to-fuchsia-600/45 dark:text-cyan-100 dark:border-cyan-300/80 font-bold',
    heroBadgeClass: 'bg-gradient-to-r from-indigo-600/50 via-cyan-500/45 to-fuchsia-600/50 text-white border-cyan-300/85',
    gameBadgeClass: 'bg-indigo-100 text-indigo-950 border-indigo-500 dark:bg-indigo-600/45 dark:text-cyan-100 dark:border-cyan-300/80',
    isUnlocked: (stats) => stats.band90Count >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.band90Count / 3) * 100)),
      text: `${Math.min(stats.band90Count, 3)}/3 lần đạt Band 9.0`
    })
  },
  {
    id: 'all_four_70',
    label: 'Tứ Trụ Band 7.0+',
    icon: '🏛️',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Chạm mốc Band >= 7.0 ở cả 4 kỹ năng Listening, Reading, Writing và Speaking.',
    badgeClass: 'bg-violet-100 text-violet-950 border-violet-500 dark:bg-violet-600/35 dark:text-violet-100 dark:border-violet-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-violet-600/45 to-indigo-600/45 text-violet-50 border-violet-300/80',
    gameBadgeClass: 'bg-violet-100 text-violet-950 border-violet-500 dark:bg-violet-600/35 dark:text-violet-100 dark:border-violet-400/75',
    isUnlocked: (stats) => stats.skillsAt70Count >= 4,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.skillsAt70Count / 4) * 100)),
      text: `${Math.min(stats.skillsAt70Count, 4)}/4 kỹ năng đạt Band 7.0+`
    })
  },
  {
    id: 'perfect_score_x10',
    label: 'Thập Toàn Tuyệt Đối (10 Lần 100%)',
    icon: '🎯',
    tier: 'Điểm Thi',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Đạt độ chính xác tuyệt đối 100% câu đúng Listening hoặc Reading (>= 5 câu) đủ 10 lần.',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-500 dark:bg-emerald-600/35 dark:text-emerald-100 dark:border-emerald-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-emerald-600/45 to-teal-500/45 text-emerald-50 border-emerald-300/80',
    gameBadgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-500 dark:bg-emerald-600/35 dark:text-emerald-100 dark:border-emerald-400/75',
    isUnlocked: (stats) => stats.perfectAccuracyCount >= 10,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.perfectAccuracyCount / 10) * 100)),
      text: `${Math.min(stats.perfectAccuracyCount, 10)}/10 lần đúng 100%`
    })
  },
  {
    id: 'iron_scholar_50',
    label: 'Đại Học Giả 50 Đề',
    icon: '🔱',
    tier: 'Luyện Đề',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Chinh phục tối thiểu 50 bài thi hoặc bài tập thực hành.',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-500/30 dark:text-orange-100 dark:border-orange-400/60',
    heroBadgeClass: 'bg-orange-500/35 text-orange-100 border-orange-300/70',
    gameBadgeClass: 'bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-500/30 dark:text-orange-100 dark:border-orange-400/60',
    isUnlocked: (stats) => stats.examCount >= 50,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 50) * 100)),
      text: `${Math.min(stats.examCount, 50)}/50 bài hoàn thành`
    })
  },
  {
    id: 'legend_100',
    label: 'Bất Tử Trăm Đề',
    icon: '🐉',
    tier: 'Luyện Đề',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Hoàn thành tối thiểu 100 bài thi & bài tập IELTS trên hệ thống.',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-500 dark:bg-rose-500/35 dark:text-rose-100 dark:border-rose-400/70',
    heroBadgeClass: 'bg-gradient-to-r from-rose-600/45 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-500/35 dark:text-rose-100 dark:border-rose-400/70',
    isUnlocked: (stats) => stats.examCount >= 100,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 100) * 100)),
      text: `${Math.min(stats.examCount, 100)}/100 bài hoàn thành`
    })
  },
  {
    id: 'daily_zone_300',
    label: 'Hộ Pháp Daily Zone 300',
    icon: '🗡️',
    tier: 'Daily Zone',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Hoàn thành tích lũy từ 300 bài tập trở lên trong Daily Zone.',
    badgeClass: 'bg-red-100 text-red-950 border-red-500 dark:bg-red-600/35 dark:text-red-100 dark:border-red-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-red-600/45 to-orange-500/45 text-red-50 border-red-300/80',
    gameBadgeClass: 'bg-red-100 text-red-950 border-red-500 dark:bg-red-600/35 dark:text-red-100 dark:border-red-400/75',
    isUnlocked: (stats) => stats.dailyZoneCount >= 300,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 300) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 300)}/300 bài Daily Zone`
    })
  },
  {
    id: 'daily_zone_1000',
    label: 'Thần Vương Daily Zone 1,000',
    icon: '🌋',
    tier: 'Daily Zone',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ HUYỀN THOẠI: Hoàn thành đủ 1,000 bài tập trong khu vực Daily Zone.',
    badgeClass: 'bg-gradient-to-r from-red-100 via-orange-100 to-amber-100 text-red-950 border-red-500 dark:from-red-600/45 dark:via-orange-500/40 dark:to-amber-500/40 dark:text-amber-100 dark:border-amber-400/85 font-bold',
    heroBadgeClass: 'bg-gradient-to-r from-red-600/55 via-orange-500/50 to-amber-400/45 text-white border-amber-300/90',
    gameBadgeClass: 'bg-red-100 text-red-950 border-red-500 dark:bg-red-600/45 dark:text-amber-100 dark:border-amber-400/85',
    isUnlocked: (stats) => stats.dailyZoneCount >= 1000,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.dailyZoneCount / 1000) * 100)),
      text: `${Math.min(stats.dailyZoneCount, 1000).toLocaleString('vi-VN')}/1,000 bài Daily Zone`
    })
  },
  {
    id: 'arena_overlord_5000',
    label: 'Chúa Tể Đấu Trường',
    icon: '🛸',
    tier: 'Game',
    difficulty: 'Cực Khó',
    conditionText: 'CỰC KHÓ: Ghi kỷ lục từ 5,000 điểm trở lên trong Game Đấu Trường Từ Vựng.',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400 dark:bg-fuchsia-500/30 dark:text-fuchsia-100 dark:border-fuchsia-400/70',
    heroBadgeClass: 'bg-fuchsia-500/35 text-fuchsia-100 border-fuchsia-300/70',
    gameBadgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400 dark:bg-fuchsia-500/30 dark:text-fuchsia-100 dark:border-fuchsia-400/70',
    isUnlocked: (stats) => stats.bestGameScore >= 5000,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 5000) * 100)),
      text: `${Math.min(stats.bestGameScore, 5000)}/5,000 điểm Game`
    })
  },

  // ==== NHÓM BXH THEO NGÀY (Top 1 / Top 2 / Top 3 — Hiệu lực 1 ngày, Độc quyền không trùng lặp) ====
  ...DAILY_RANK_TITLES,
  // ==== NHÓM ĐIỂM DANH RIÊNG BIỆT (Không xếp chung vào Khó / Cực Khó) ====
  {
    id: 'streak_3d',
    label: 'Mầm Non Chuyên Cần',
    icon: '🌿',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Điểm danh đăng nhập học tập tích lũy đủ 3 ngày khác nhau.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    heroBadgeClass: 'bg-emerald-500/25 text-emerald-100 border-emerald-300/60',
    gameBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50',
    isUnlocked: (stats) => stats.totalLoginDays >= 3,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.totalLoginDays / 3) * 100)),
      text: `${Math.min(stats.totalLoginDays, 3)}/3 ngày điểm danh`
    })
  },
  {
    id: 'streak_7d',
    label: 'Tuần Lễ Bền Bỉ',
    icon: '🔆',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Đăng nhập liên tục 7 ngày không gián đoạn.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    heroBadgeClass: 'bg-teal-500/30 text-teal-100 border-teal-300/60',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/50',
    isUnlocked: (stats) => stats.bestLoginStreak >= 7,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestLoginStreak / 7) * 100)),
      text: `Chuỗi ${Math.min(stats.bestLoginStreak, 7)}/7 ngày liên tiếp`
    })
  },
  {
    id: 'streak_30d',
    label: 'Kiên Trì 1 Tháng',
    icon: '📅',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Đăng nhập học tập tích lũy đủ 30 ngày khác nhau trên hệ thống.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    heroBadgeClass: 'bg-emerald-500/30 text-emerald-100 border-emerald-300/60',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50',
    isUnlocked: (stats) => stats.totalLoginDays >= 30,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.totalLoginDays / 30) * 100)),
      text: `${Math.min(stats.totalLoginDays, 30)}/30 ngày đăng nhập`
    })
  },
  {
    id: 'loyal_90d',
    label: 'Chiến Binh 3 Tháng',
    icon: '🗓️',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Đăng nhập học tập tích lũy đủ 90 ngày (3 tháng) trên hệ thống.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-400 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/60',
    heroBadgeClass: 'bg-teal-500/35 text-teal-100 border-teal-300/70',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-400 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/60',
    isUnlocked: (stats) => stats.totalLoginDays >= 90,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.totalLoginDays / 90) * 100)),
      text: `${Math.min(stats.totalLoginDays, 90)}/90 ngày (3 tháng)`
    })
  },
  {
    id: 'unbroken_streak_30',
    label: 'Ngọn Lửa Bất Diệt 30D',
    icon: '☄️',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Đăng nhập điểm danh liên tục 30 ngày liền không bỏ lỡ ngày nào.',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/60',
    heroBadgeClass: 'bg-emerald-500/35 text-emerald-100 border-emerald-300/70',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/30 dark:text-emerald-100 dark:border-emerald-400/60',
    isUnlocked: (stats) => stats.bestLoginStreak >= 30,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestLoginStreak / 30) * 100)),
      text: `Chuỗi tốt nhất: ${Math.min(stats.bestLoginStreak, 30)}/30 ngày liên tiếp`
    })
  },
  {
    id: 'half_year_180d',
    label: 'Cổ Thụ Nửa Năm',
    icon: '🏛️',
    tier: 'Điểm Danh',
    difficulty: 'Điểm Danh',
    conditionText: 'Bền bỉ điểm danh đăng nhập tích lũy đủ 180 ngày (6 tháng) đồng hành cùng lớp.',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-400 dark:bg-teal-500/30 dark:text-teal-100 dark:border-teal-400/70',
    heroBadgeClass: 'bg-teal-500/35 text-teal-100 border-teal-300/80',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-400 dark:bg-teal-500/30 dark:text-teal-100 dark:border-teal-400/70',
    isUnlocked: (stats) => stats.totalLoginDays >= 180,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.totalLoginDays / 180) * 100)),
      text: `${Math.min(stats.totalLoginDays, 180)}/180 ngày (6 tháng)`
    })
  },
  // ==== DANH HIỆU BÍ ẨN (MỞ KHÓA BẤT NGỜ - CHE TÊN & ĐIỀU KIỆN ĐẾN KHI ĐẠT ĐƯỢC) ====
  {
    id: 'secret_night_owl',
    label: 'Cú Đêm Khổ Luyện',
    icon: '🦉',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Hoàn thành & nộp bài IELTS trong khung giờ khuya (23:00 – 03:59 giờ VN).',
    badgeClass: 'bg-slate-800 text-amber-200 border-amber-400/60 dark:bg-slate-800 dark:text-amber-200 dark:border-amber-400/60',
    heroBadgeClass: 'bg-slate-900/75 text-amber-200 border-amber-400/70',
    gameBadgeClass: 'bg-slate-800 text-amber-200 border-amber-400/60 dark:bg-slate-800 dark:text-amber-200 dark:border-amber-400/60',
    isUnlocked: (stats) => Boolean(stats.hasNightOwlSubmit),
    getProgress: (stats) => ({
      pct: stats.hasNightOwlSubmit ? 100 : 0,
      text: stats.hasNightOwlSubmit ? '🦉 Đã khám phá bí ẩn cú đêm!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_early_bird',
    label: 'Bình Minh Chinh Phục',
    icon: '🌅',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Dậy sớm nộp bài luyện thi trong khung giờ sáng sớm (04:30 – 06:30 giờ VN).',
    badgeClass: 'bg-amber-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-400/60',
    heroBadgeClass: 'bg-orange-500/35 text-amber-100 border-orange-300/75',
    gameBadgeClass: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/25 dark:text-orange-200 dark:border-orange-400/60',
    isUnlocked: (stats) => Boolean(stats.hasEarlyBirdSubmit),
    getProgress: (stats) => ({
      pct: stats.hasEarlyBirdSubmit ? 100 : 0,
      text: stats.hasEarlyBirdSubmit ? '🌅 Đã đánh thức bình minh!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_sniper_100',
    label: 'Xạ Thủ Tuyệt Đối 100%',
    icon: '🏹',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Đạt độ chính xác 100% câu đúng ở phần Listening hoặc Reading (>= 5 câu).',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-400/60',
    heroBadgeClass: 'bg-rose-500/35 text-rose-100 border-rose-300/75',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60',
    isUnlocked: (stats) => Boolean(stats.hasPerfectAccuracy),
    getProgress: (stats) => ({
      pct: stats.hasPerfectAccuracy ? 100 : 0,
      text: stats.hasPerfectAccuracy ? '🏹 Phát bắn chuẩn xác 100%!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_supporter',
    label: 'Người Bạn Đồng Hành',
    icon: '💜',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Ủng hộ duy trì trang web qua Ảnh Nền Riêng hoặc Danh Hiệu VIP.',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-400/60',
    heroBadgeClass: 'bg-violet-500/35 text-violet-100 border-violet-300/75',
    gameBadgeClass: 'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/60',
    isUnlocked: (stats) => Boolean(stats.hasSupporterPerk),
    getProgress: (stats) => ({
      pct: stats.hasSupporterPerk ? 100 : 0,
      text: stats.hasSupporterPerk ? '💜 Cảm ơn bạn đã đồng hành!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_lucky_777',
    label: 'Thần Tài Ba Số 7',
    icon: '🎰',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Đạt chính xác Overall Band 7.0 (đúng tròn 7.0) đủ 3 lần.',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-400/70',
    heroBadgeClass: 'bg-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/70',
    isUnlocked: (stats) => stats.exactBand70Count >= 3,
    getProgress: (stats) => ({
      pct: stats.exactBand70Count >= 3 ? 100 : 0,
      text: stats.exactBand70Count >= 3 ? '🎰 7-7-7 Trúng độc đắc Band 7.0!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_speed_demon',
    label: 'Tốc Độ Ánh Sáng',
    icon: '⚡',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Hoàn thành 1 bài Daily Reading hoặc Listening trong <= 5 phút mà vẫn đạt Band >= 7.0.',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-400 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-400/70',
    heroBadgeClass: 'bg-sky-500/40 text-sky-100 border-sky-300/80',
    gameBadgeClass: 'bg-sky-100 text-sky-950 border-sky-400 dark:bg-sky-500/30 dark:text-sky-100 dark:border-sky-400/70',
    isUnlocked: (stats) => Boolean(stats.hasSpeedDemon),
    getProgress: (stats) => ({
      pct: stats.hasSpeedDemon ? 100 : 0,
      text: stats.hasSpeedDemon ? '⚡ Giải đề thần tốc như tia chớp!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_hat_trick_day',
    label: 'Cú Hat-Trick Trong Ngày',
    icon: '🎩',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Hoàn thành tối thiểu 3 bài thi hoặc Daily Zone trong cùng một ngày.',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-400/70',
    heroBadgeClass: 'bg-indigo-500/40 text-indigo-100 border-indigo-300/80',
    gameBadgeClass: 'bg-indigo-100 text-indigo-950 border-indigo-400 dark:bg-indigo-500/30 dark:text-indigo-100 dark:border-indigo-400/70',
    isUnlocked: (stats) => stats.maxExamsInOneDay >= 3,
    getProgress: (stats) => ({
      pct: stats.maxExamsInOneDay >= 3 ? 100 : 0,
      text: stats.maxExamsInOneDay >= 3 ? '🎩 Cú hat-trick cày đề ấn tượng!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_grinder_day_10',
    label: 'Quái Vật Cày Đề 24H',
    icon: '☄️',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Hoàn thành tối thiểu 10 bài thi hoặc Daily Zone chỉ trong vòng 1 ngày.',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-400 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-400/70',
    heroBadgeClass: 'bg-gradient-to-r from-rose-600/45 to-orange-500/45 text-rose-50 border-rose-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/70',
    isUnlocked: (stats) => stats.maxExamsInOneDay >= 10,
    getProgress: (stats) => ({
      pct: stats.maxExamsInOneDay >= 10 ? 100 : 0,
      text: stats.maxExamsInOneDay >= 10 ? '☄️ Sức bền phi thường 10 bài/ngày!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_comeback_king',
    label: 'Màn Lội Ngược Dòng',
    icon: '🦅',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Bứt phá tăng ít nhất +2.0 Band so với bài làm đầu tiên của chính bạn.',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-400/70',
    heroBadgeClass: 'bg-emerald-500/40 text-emerald-100 border-emerald-300/80',
    gameBadgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-500/30 dark:text-emerald-100 dark:border-emerald-400/70',
    isUnlocked: (stats) => stats.maxBandJump >= 2.0,
    getProgress: (stats) => ({
      pct: stats.maxBandJump >= 2.0 ? 100 : 0,
      text: stats.maxBandJump >= 2.0 ? '🦅 Bước nhảy vọt +2.0 Band ngoạn mục!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_weekend_warrior',
    label: 'Chiến Binh Cuối Tuần',
    icon: '🛡️',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Không nghỉ ngơi cuối tuần — nộp bài vào cả Thứ 7 và Chủ Nhật (giờ VN).',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-400 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-400/70',
    heroBadgeClass: 'bg-teal-500/40 text-teal-100 border-teal-300/80',
    gameBadgeClass: 'bg-teal-100 text-teal-950 border-teal-400 dark:bg-teal-500/30 dark:text-teal-100 dark:border-teal-400/70',
    isUnlocked: (stats) => Boolean(stats.hasSaturdaySubmit && stats.hasSundaySubmit),
    getProgress: (stats) => ({
      pct: stats.hasSaturdaySubmit && stats.hasSundaySubmit ? 100 : 0,
      text: stats.hasSaturdaySubmit && stats.hasSundaySubmit ? '🛡️ Chiến binh bền bỉ cuối tuần!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_midnight_exact',
    label: 'Người Gác Đêm 0 Giờ',
    icon: '🌑',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Nộp bài đúng khung giờ chuyển giao nửa đêm 00:00 – 00:59 (giờ VN).',
    badgeClass: 'bg-zinc-900 text-indigo-200 border-indigo-400/70 dark:bg-zinc-800 dark:text-indigo-200 dark:border-indigo-400/70',
    heroBadgeClass: 'bg-zinc-900/80 text-indigo-200 border-indigo-400/80',
    gameBadgeClass: 'bg-zinc-900 text-indigo-200 border-indigo-400/70 dark:bg-zinc-800 dark:text-indigo-200 dark:border-indigo-400/70',
    isUnlocked: (stats) => Boolean(stats.hasMidnightSubmit),
    getProgress: (stats) => ({
      pct: stats.hasMidnightSubmit ? 100 : 0,
      text: stats.hasMidnightSubmit ? '🌑 Dấu ấn giao thừa lúc 0 giờ!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_quad_master_day',
    label: 'Tứ Tuyệt Trong Một Ngày',
    icon: '🌀',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Thực hành ghi nhận đủ cả 4 kỹ năng L · R · W · S trong cùng một ngày.',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-400 dark:bg-fuchsia-950/60 dark:text-fuchsia-200 dark:border-fuchsia-400/70',
    heroBadgeClass: 'bg-fuchsia-500/40 text-fuchsia-100 border-fuchsia-300/80',
    gameBadgeClass: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-400 dark:bg-fuchsia-500/30 dark:text-fuchsia-100 dark:border-fuchsia-400/70',
    isUnlocked: (stats) => Boolean(stats.hasAllFourSkillsInOneDay),
    getProgress: (stats) => ({
      pct: stats.hasAllFourSkillsInOneDay ? 100 : 0,
      text: stats.hasAllFourSkillsInOneDay ? '🌀 Chinh phục đủ 4 kỹ năng trong 24h!' : '??? (Thử thách ẩn)'
    })
  },
  {
    id: 'secret_game_perfection',
    label: 'Bất Khả Chiến Bại Game',
    icon: '🛸',
    tier: 'Bí Ẩn',
    difficulty: 'Bí Ẩn',
    isSecretTitle: true,
    conditionText: 'Thử thách ẩn đã mở: Đạt độ chính xác 100% cùng tối thiểu 1,500 điểm trong Khu Tự Luyện Game Từ Vựng.',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-400 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-400/70',
    heroBadgeClass: 'bg-purple-500/40 text-purple-100 border-purple-300/80',
    gameBadgeClass: 'bg-purple-100 text-purple-950 border-purple-400 dark:bg-purple-500/30 dark:text-purple-100 dark:border-purple-400/70',
    isUnlocked: (stats) => Boolean(stats.hasGamePerfectRun),
    getProgress: (stats) => ({
      pct: stats.hasGamePerfectRun ? 100 : 0,
      text: stats.hasGamePerfectRun ? '🛸 Kỷ lục 100% không sai một từ!' : '??? (Thử thách ẩn)'
    })
  },
  ...HOLIDAY_TITLE_SPECS.map(buildHolidayTitleEntry),
  {
    id: 'vip_thieu_gia',
    label: 'Thiếu Gia Luyện Đề',
    icon: '💰',
    tier: 'Donate Ủng Hộ (Vĩnh Viễn)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    isPermanentDonateTitle: true,
    defaultPriceVnd: 10000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-emerald-400',
    conditionText: 'Danh hiệu Phú Quý (Vĩnh viễn): Tự động mở khóa VĨNH VIỄN khi Donate ủng hộ duy trì website đạt mốc từ 10.000đ trở lên (hiệu lực trọn đời, không hết hạn).',
    badgeClass: 'vip-paid-badge vip-paid-emerald bg-[#047857] text-[#FFFFFF] border-emerald-300 font-semibold',
    heroBadgeClass: 'vip-paid-badge vip-paid-emerald bg-[#047857] text-[#FFFFFF] border-emerald-300 font-semibold',
    gameBadgeClass: 'vip-paid-badge vip-paid-emerald bg-[#047857] text-[#FFFFFF] border-emerald-300 font-semibold',
    isUnlocked: (_stats, userObj) => Number(userObj?.donatedTotalVnd || 0) >= 10000,
    getProgress: (_stats, userObj, priceVnd = 10000) => {
      const donated = Math.max(0, Number(userObj?.donatedTotalVnd) || 0);
      const target = Math.max(1000, Number(priceVnd) || 10000);
      if (donated >= target) {
        return { pct: 100, text: '💜 Đã mở khóa VĨNH VIỄN (Donate ủng hộ)' };
      }
      return {
        pct: Math.min(99, Math.round((donated / target) * 100)),
        text: `Donate tích lũy: ${donated.toLocaleString('vi-VN')}đ / ${target.toLocaleString('vi-VN')}đ (Mở vĩnh viễn)`
      };
    }
  },
  {
    id: 'vip_manh_thuong_quan',
    label: 'Mạnh Thường Quân',
    icon: '🥂',
    tier: 'Donate Ủng Hộ (Vĩnh Viễn)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    isPermanentDonateTitle: true,
    defaultPriceVnd: 15000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-rose-400',
    conditionText: 'Danh hiệu Phú Quý (Vĩnh viễn): Tự động mở khóa VĨNH VIỄN khi Donate ủng hộ duy trì server đạt mốc quy định (hiệu ứng ánh kim Hồng Ngọc trọn đời).',
    badgeClass: 'vip-paid-badge vip-paid-ruby bg-[#BE123C] text-[#FFFFFF] border-rose-300 font-semibold',
    heroBadgeClass: 'vip-paid-badge vip-paid-ruby bg-[#BE123C] text-[#FFFFFF] border-rose-300 font-semibold',
    gameBadgeClass: 'vip-paid-badge vip-paid-ruby bg-[#BE123C] text-[#FFFFFF] border-rose-300 font-semibold',
    isUnlocked: (_stats, userObj) => Number(userObj?.donatedTotalVnd || 0) >= 15000,
    getProgress: (_stats, userObj, priceVnd = 15000) => {
      const donated = Math.max(0, Number(userObj?.donatedTotalVnd) || 0);
      const target = Math.max(1000, Number(priceVnd) || 15000);
      if (donated >= target) {
        return { pct: 100, text: '💜 Đã mở khóa VĨNH VIỄN (Donate ủng hộ)' };
      }
      return {
        pct: Math.min(99, Math.round((donated / target) * 100)),
        text: `Donate tích lũy: ${donated.toLocaleString('vi-VN')}đ / ${target.toLocaleString('vi-VN')}đ (Mở vĩnh viễn)`
      };
    }
  },
  {
    id: 'vip_dai_gia',
    label: 'Đại Gia IELTS',
    icon: '💸',
    tier: 'Donate Ủng Hộ (Vĩnh Viễn)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    isPermanentDonateTitle: true,
    defaultPriceVnd: 20000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-amber-400',
    conditionText: 'Danh hiệu Phú Quý (Vĩnh viễn): Ánh vàng Hoàng Kim rực sáng & huy hiệu ưu tiên trên BXH mở khóa VĨNH VIỄN khi Donate ủng hộ đạt mốc quy định.',
    badgeClass: 'vip-paid-badge vip-paid-gold bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    heroBadgeClass: 'vip-paid-badge vip-paid-gold bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    gameBadgeClass: 'vip-paid-badge vip-paid-gold bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    isUnlocked: (_stats, userObj) => Number(userObj?.donatedTotalVnd || 0) >= 20000,
    getProgress: (_stats, userObj, priceVnd = 20000) => {
      const donated = Math.max(0, Number(userObj?.donatedTotalVnd) || 0);
      const target = Math.max(1000, Number(priceVnd) || 20000);
      if (donated >= target) {
        return { pct: 100, text: '💜 Đã mở khóa VĨNH VIỄN (Donate ủng hộ)' };
      }
      return {
        pct: Math.min(99, Math.round((donated / target) * 100)),
        text: `Donate tích lũy: ${donated.toLocaleString('vi-VN')}đ / ${target.toLocaleString('vi-VN')}đ (Mở vĩnh viễn)`
      };
    }
  },
  {
    id: 'vip_ty_phu',
    label: 'Tỷ Phú Tri Thức',
    icon: '⚜️',
    tier: 'Donate Ủng Hộ (Vĩnh Viễn)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    isPermanentDonateTitle: true,
    defaultPriceVnd: 50000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-amber-300',
    conditionText: 'Danh hiệu Phú Quý Đỉnh Cao (Vĩnh viễn): Ánh kim Vàng Đỏ phát sáng độc tôn + vinh danh VIP trên BXH mở khóa VĨNH VIỄN khi Donate ủng hộ đạt mốc quy định.',
    badgeClass: 'vip-paid-badge vip-paid-imperial bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    heroBadgeClass: 'vip-paid-badge vip-paid-imperial bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    gameBadgeClass: 'vip-paid-badge vip-paid-imperial bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    isUnlocked: (_stats, userObj) => Number(userObj?.donatedTotalVnd || 0) >= 50000,
    getProgress: (_stats, userObj, priceVnd = 50000) => {
      const donated = Math.max(0, Number(userObj?.donatedTotalVnd) || 0);
      const target = Math.max(1000, Number(priceVnd) || 50000);
      if (donated >= target) {
        return { pct: 100, text: '💜 Đã mở khóa VĨNH VIỄN (Donate ủng hộ)' };
      }
      return {
        pct: Math.min(99, Math.round((donated / target) * 100)),
        text: `Donate tích lũy: ${donated.toLocaleString('vi-VN')}đ / ${target.toLocaleString('vi-VN')}đ (Mở vĩnh viễn)`
      };
    }
  },
  {
    id: 'aieo_vip',
    label: 'IELTS VIP',
    icon: '👑',
    tier: 'Gói IELTS VIP (1 Tháng)',
    difficulty: 'VIP Độc Quyền',
    isVipBundleTitle: true,
    defaultPriceVnd: 20000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-red-500',
    conditionText: 'Đặc quyền Gói IELTS VIP (20.000đ/1 tháng): Ảnh Avatar Động (.GIF/.WebP), Tự do Đổi Màu Chữ, Viền Bìa & Thẻ LED Neon Nhiều Màu, Ảnh Nền Cá Nhân miễn phí, 3 Khung Avatar Neon, Tạo Phòng Game Bạn Bè vô hạn & Danh hiệu IELTS VIP.',
    badgeClass: 'vip-paid-badge vip-paid-vip bg-[#991B1B] text-[#FFFFFF] border-[#F59E0B] font-semibold',
    heroBadgeClass: 'vip-paid-badge vip-paid-vip bg-[#991B1B] text-[#FFFFFF] border-[#F59E0B] font-semibold',
    gameBadgeClass: 'vip-paid-badge vip-paid-vip bg-[#991B1B] text-[#FFFFFF] border-[#F59E0B] font-semibold',
    isUnlocked: (_stats, userObj) => Number(userObj?.aieoVipExpiresAt) > Date.now(),
    getProgress: (_stats, userObj, priceVnd = 20000) => {
      const exp = Number(userObj?.aieoVipExpiresAt) || 0;
      const now = Date.now();
      if (exp > now) {
        const days = Math.max(1, Math.ceil((exp - now) / 86400000));
        return { pct: 100, text: `👑 Đang bật IELTS VIP (còn ${days} ngày)` };
      }
      return {
        pct: 0,
        text: `Gói IELTS VIP 1 tháng: ${Number(priceVnd).toLocaleString('vi-VN')}đ`
      };
    }
  },
  {
    id: 'staff_ielts_10',
    label: '10.0 IELTS Huyền Thoại',
    icon: '🎖️',
    tier: 'Độc Quyền GV & QT',
    difficulty: 'Độc Quyền',
    isStaffOnly: true,
    conditionText: 'Đặc quyền tối thượng dành riêng cho Giáo Viên IELTS & Quản Trị Hệ Thống - biểu tượng đỉnh cao 10.0 IELTS.',
    badgeClass: 'bg-gradient-to-r from-purple-100 via-amber-100 to-rose-100 text-amber-950 border-amber-400 dark:from-purple-600/35 dark:via-amber-500/30 dark:to-rose-500/30 dark:text-amber-100 dark:border-amber-400/75',
    heroBadgeClass: 'bg-gradient-to-r from-amber-500/45 via-purple-500/40 to-rose-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-gradient-to-r from-purple-100 via-amber-100 to-rose-100 text-amber-950 border-amber-400 dark:from-purple-600/35 dark:via-amber-500/30 dark:to-rose-500/30 dark:text-amber-100 dark:border-amber-400/75',
    isUnlocked: (_stats, userObj) => Boolean(
      userObj &&
      (userObj.role === 'teacher' || userObj.isSuperAdmin || userObj.isSystemAdmin || userObj.username === 'tuanpro123s')
    ),
    getProgress: (_stats, userObj) => {
      const ok = Boolean(
        userObj &&
        (userObj.role === 'teacher' || userObj.isSuperAdmin || userObj.isSystemAdmin || userObj.username === 'tuanpro123s')
      );
      return {
        pct: ok ? 100 : 0,
        text: ok ? '🎖️ Độc quyền Giáo Viên & Quản Trị' : 'Chỉ dành riêng cho Giáo Viên & Quản Trị'
      };
    }
  }
];

export const PAID_SHOP_TITLES = STUDENT_TITLES.filter(t => Boolean(t.isPaidTitle));

export function getPaidTitleDefaultPrices() {
  const out = {};
  PAID_SHOP_TITLES.forEach(t => {
    out[t.id] = Number(t.defaultPriceVnd) || 20000;
  });
  return out;
}

export function getTitlePriceVnd(titleOrId, paymentConfig = null) {
  const tid = typeof titleOrId === 'string' ? titleOrId : titleOrId?.id;
  const matched = PAID_SHOP_TITLES.find(t => t.id === tid);
  const fallback = Number((typeof titleOrId === 'object' && titleOrId?.defaultPriceVnd) || matched?.defaultPriceVnd || 20000);
  const configured = Number(paymentConfig?.paidTitlePrices?.[tid]);
  return Number.isFinite(configured) && configured >= 0 ? Math.min(10_000_000, Math.round(configured)) : fallback;
}

export const PROFILE_TITLES = STUDENT_TITLES;

export const CUSTOM_TITLE_THEMES = {
  amber: {
    label: 'Vàng Hoàng Kim',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/60',
    heroBadgeClass: 'bg-amber-500/35 text-amber-100 border-amber-300/70',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60'
  },
  teal: {
    label: 'Ngọc Lam',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/60',
    heroBadgeClass: 'bg-teal-500/35 text-teal-100 border-teal-300/70',
    gameBadgeClass: 'bg-teal-100 text-teal-900 border-teal-400 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/60'
  },
  rose: {
    label: 'Hồng Ruby',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/60',
    heroBadgeClass: 'bg-rose-500/35 text-rose-100 border-rose-300/70',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60'
  },
  violet: {
    label: 'Tím Hoàng Gia',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-400/60',
    heroBadgeClass: 'bg-purple-500/35 text-purple-100 border-purple-300/70',
    gameBadgeClass: 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/60'
  },
  emerald: {
    label: 'Lục Bảo',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/60',
    heroBadgeClass: 'bg-emerald-500/35 text-emerald-100 border-emerald-300/70',
    gameBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/60'
  },
  sky: {
    label: 'Xanh Thiên Thanh',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/60',
    heroBadgeClass: 'bg-sky-500/35 text-sky-100 border-sky-300/70',
    gameBadgeClass: 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/60'
  }
};

export function normalizeCustomTitle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 64);
  const label = String(raw.label || '').trim().slice(0, 60);
  if (!id || !label) return null;
  const colorKey = Object.prototype.hasOwnProperty.call(CUSTOM_TITLE_THEMES, raw.colorKey)
    ? raw.colorKey
    : 'amber';
  const theme = CUSTOM_TITLE_THEMES[colorKey];
  return {
    id,
    label,
    icon: String(raw.icon || '🏅').trim().slice(0, 10) || '🏅',
    tier: String(raw.tier || 'Đặc Biệt').trim().slice(0, 30) || 'Đặc Biệt',
    difficulty: String(raw.difficulty || 'Đặc Biệt').trim().slice(0, 24) || 'Đặc Biệt',
    conditionText:
      String(raw.conditionText || 'Danh hiệu đặc biệt do Quản Trị Hệ Thống trao tặng.').trim().slice(0, 180),
    colorKey,
    badgeClass: theme.badgeClass,
    heroBadgeClass: theme.heroBadgeClass,
    gameBadgeClass: theme.gameBadgeClass,
    isCustomTitle: true,
    createdBy: String(raw.createdBy || 'tuanpro123s'),
    createdAt: Number(raw.createdAt) || 0
  };
}

export function getAllCatalogTitles(customTitles = []) {
  const customList = (Array.isArray(customTitles) ? customTitles : [])
    .map(normalizeCustomTitle)
    .filter(Boolean);
  return [...STUDENT_TITLES, ...customList];
}

export function getProfileBannerById(bannerId) {
  return PROFILE_BANNERS.find(b => b.id === bannerId) || PROFILE_BANNERS[0];
}

export function getAvatarFrameById(frameId) {
  return AVATAR_FRAMES.find(f => f.id === frameId) || AVATAR_FRAMES[0];
}

export function computeStudentStats(username, attempts = [], roomsDb = {}, user = null, extra = {}) {
  const uname = String(username || '').trim();
  const unameLower = uname.toLowerCase();
  const loginMetrics = computeLoginDayMetrics(user?.loginDays || []);
  const gamePracticeLeaderboard = Array.isArray(extra?.gamePracticeLeaderboard) ? extra.gamePracticeLeaderboard : [];
  if (!uname) {
    return {
      examCount: 0,
      dailyZoneCount: 0,
      highestBand: 0,
      bestGameScore: 0,
      totalLoginDays: loginMetrics.totalLoginDays,
      currentLoginStreak: loginMetrics.currentStreak,
      bestLoginStreak: loginMetrics.bestStreak,
      coveredSkillsCount: 0,
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      skillsAt65Count: 0,
      skillsAt70Count: 0,
      band65Count: 0,
      band70Count: 0,
      exactBand70Count: 0,
      band75Count: 0,
      band80Count: 0,
      band85Count: 0,
      band90Count: 0,
      highLrCount: 0,
      highSpeakingCount: 0,
      highWritingCount: 0,
      perfectAccuracyCount: 0,
      maxExamsInOneDay: 0,
      maxBandJump: 0,
      hasAllFourSkillsInOneDay: false,
      hasSpeedDemon: false,
      hasSaturdaySubmit: false,
      hasSundaySubmit: false,
      hasMidnightSubmit: false,
      hasGamePerfectRun: false,
      hasNightOwlSubmit: false,
      hasEarlyBirdSubmit: false,
      hasPerfectAccuracy: false,
      hasSupporterPerk: false
    };
  }

  const userAttempts = (Array.isArray(attempts) ? attempts : []).filter(
    a =>
      a &&
      (String(a.studentId || '').toLowerCase() === unameLower ||
        String(a.studentUsername || '').toLowerCase() === unameLower)
  );
  let dailyZoneCount = 0;
  let highestBand = 0;
  let band65Count = 0;
  let band70Count = 0;
  let exactBand70Count = 0;
  let band75Count = 0;
  let band80Count = 0;
  let band85Count = 0;
  let band90Count = 0;
  let readingCount = 0;
  let listeningCount = 0;
  let writingCount = 0;
  let speakingCount = 0;
  let highLrCount = 0;
  let highSpeakingCount = 0;
  let highWritingCount = 0;
  let perfectAccuracyCount = 0;
  let hasNightOwlSubmit = false;
  let hasEarlyBirdSubmit = false;
  let hasMidnightSubmit = false;
  let hasSaturdaySubmit = false;
  let hasSundaySubmit = false;
  let hasSpeedDemon = false;
  let hasPerfectAccuracy = false;
  const coveredSkills = new Set();
  const bestSkillBand = { listening: 0, reading: 0, writing: 0, speaking: 0 };
  const perDayCount = new Map();
  const perDaySkills = new Map();
  const approvedChronoBands = [];

  userAttempts.forEach((a, idx) => {
    if (a.testMode === 'single_skill') {
      dailyZoneCount += 1;
    }

    const isApprovedBand =
      a.teacherGraded !== false ||
      (a.testMode === 'single_skill' && (a.focusSkill === 'listening' || a.focusSkill === 'reading'));
    const rawOverall =
      typeof a.overallBand === 'number'
        ? Number(a.overallBand)
        : a.testMode === 'single_skill' && a.focusSkill === 'speaking' && typeof a.scores?.speaking?.band === 'number'
        ? Number(a.scores.speaking.band)
        : NaN;
    const val = isApprovedBand && Number.isFinite(rawOverall) ? rawOverall : NaN;

    if (!Number.isNaN(val)) {
      if (val > highestBand) highestBand = val;
      if (val >= 6.5) band65Count += 1;
      if (val >= 7.0) band70Count += 1;
      if (Math.abs(val - 7.0) < 0.001) exactBand70Count += 1;
      if (val >= 7.5) band75Count += 1;
      if (val >= 8.0) band80Count += 1;
      if (val >= 8.5) band85Count += 1;
      if (val >= 9.0) band90Count += 1;
      approvedChronoBands.push({
        tsMs: parseAttemptTimestampMs(a),
        revOrder: userAttempts.length - idx,
        band: val
      });
    }

    const lBand = Number(a.scores?.listening?.band);
    const rBand = Number(a.scores?.reading?.band);
    const wBand = Number(a.scores?.writing?.overallBand);
    const sBand = Number(a.scores?.speaking?.band);

    if (Number.isFinite(lBand) && lBand > bestSkillBand.listening) bestSkillBand.listening = lBand;
    if (Number.isFinite(rBand) && rBand > bestSkillBand.reading) bestSkillBand.reading = rBand;
    if (isApprovedBand && Number.isFinite(wBand) && wBand > bestSkillBand.writing) bestSkillBand.writing = wBand;
    if (isApprovedBand && Number.isFinite(sBand) && sBand > bestSkillBand.speaking) bestSkillBand.speaking = sBand;

    if ((!Number.isNaN(lBand) && lBand >= 7.5) || (!Number.isNaN(rBand) && rBand >= 7.5)) {
      highLrCount += 1;
    }
    if (isApprovedBand && Number.isFinite(sBand) && sBand >= 7.5) {
      highSpeakingCount += 1;
    }
    if (isApprovedBand && Number.isFinite(wBand) && wBand >= 7.0) {
      highWritingCount += 1;
    }

    const lTotal = Number(a.scores?.listening?.total) || 0;
    const lRaw = Number(a.scores?.listening?.raw) || 0;
    const rTotal = Number(a.scores?.reading?.total) || 0;
    const rRaw = Number(a.scores?.reading?.raw) || 0;
    if ((lTotal >= 5 && lRaw === lTotal) || (rTotal >= 5 && rRaw === rTotal)) {
      hasPerfectAccuracy = true;
      perfectAccuracyCount += 1;
    }

    const durSec = Number(a.durationSeconds) || 0;
    if (
      a.testMode === 'single_skill' &&
      (a.focusSkill === 'reading' || a.focusSkill === 'listening') &&
      durSec > 0 &&
      durSec <= 300 &&
      !Number.isNaN(val) &&
      val >= 7.0
    ) {
      hasSpeedDemon = true;
    }

    const isSingle = a.testMode === 'single_skill' && a.focusSkill;
    const attemptSkills = [];
    if (typeof a.scores?.listening?.band === 'number' || (isSingle && a.focusSkill === 'listening')) {
      coveredSkills.add('listening');
      attemptSkills.push('listening');
      listeningCount += 1;
    }
    if (typeof a.scores?.reading?.band === 'number' || (isSingle && a.focusSkill === 'reading')) {
      coveredSkills.add('reading');
      attemptSkills.push('reading');
      readingCount += 1;
    }
    if (
      typeof a.scores?.writing?.overallBand === 'number' ||
      typeof a.scores?.writing?.task1Band === 'number' ||
      typeof a.scores?.writing?.task2Band === 'number' ||
      Boolean(a.answers?.writingTask1 || a.answers?.writingTask2) ||
      (isSingle && a.focusSkill === 'writing')
    ) {
      coveredSkills.add('writing');
      attemptSkills.push('writing');
      writingCount += 1;
    }
    if (typeof a.scores?.speaking?.band === 'number' || (isSingle && a.focusSkill === 'speaking')) {
      coveredSkills.add('speaking');
      attemptSkills.push('speaking');
      speakingCount += 1;
    }

    const subMs = parseAttemptTimestampMs(a);
    if (Number.isFinite(subMs) && subMs > 0) {
      const vnDate = new Date(subMs + 7 * 60 * 60 * 1000);
      const hr = vnDate.getUTCHours();
      const min = vnDate.getUTCMinutes();
      const dow = vnDate.getUTCDay();
      if (hr >= 23 || hr < 4) hasNightOwlSubmit = true;
      if (hr === 0) hasMidnightSubmit = true;
      if ((hr === 4 && min >= 30) || hr === 5 || (hr === 6 && min <= 30)) hasEarlyBirdSubmit = true;
      if (dow === 6) hasSaturdaySubmit = true;
      if (dow === 0) hasSundaySubmit = true;

      const dayKey = getVietnamDateKey(subMs);
      perDayCount.set(dayKey, (perDayCount.get(dayKey) || 0) + 1);
      if (!perDaySkills.has(dayKey)) perDaySkills.set(dayKey, new Set());
      const skillSet = perDaySkills.get(dayKey);
      attemptSkills.forEach(sk => skillSet.add(sk));
    }
  });

  let maxExamsInOneDay = 0;
  perDayCount.forEach(c => {
    if (c > maxExamsInOneDay) maxExamsInOneDay = c;
  });
  let hasAllFourSkillsInOneDay = false;
  perDaySkills.forEach(skSet => {
    if (skSet.size >= 4) hasAllFourSkillsInOneDay = true;
  });

  let maxBandJump = 0;
  if (approvedChronoBands.length >= 2) {
    approvedChronoBands.sort((a, b) => (a.tsMs || 0) - (b.tsMs || 0) || a.revOrder - b.revOrder);
    const firstBand = approvedChronoBands[0].band;
    let peakAfter = firstBand;
    for (let i = 1; i < approvedChronoBands.length; i++) {
      if (approvedChronoBands[i].band > peakAfter) peakAfter = approvedChronoBands[i].band;
    }
    maxBandJump = Math.max(0, Number((peakAfter - firstBand).toFixed(2)));
  }

  let bestGameScore = 0;
  let knightBestScore = Math.max(0, Math.floor(Number(user?.knightRpgProfile?.bestScore) || 0));
  const knightMonstersSlain = Math.max(0, Math.floor(Number(user?.knightRpgProfile?.monstersSlain) || 0));
  const knightDragonsSlain = Math.max(0, Math.floor(Number(user?.knightRpgProfile?.dragonsSlain) || 0));
  const knightKeysCollected = Math.max(
    0,
    Math.floor(Number(user?.knightRpgProfile?.keysCollected ?? user?.knightRpgProfile?.keys) || 0)
  );
  const knightUnlockedSkinsCount = Array.isArray(user?.knightRpgProfile?.unlockedSkins)
    ? Math.max(0, user.knightRpgProfile.unlockedSkins.filter(id => id && id !== 'knight_arthur').length)
    : 0;
  let hasGamePerfectRun = false;
  Object.values(roomsDb || {}).forEach(room => {
    const pScore = Number(room?.players?.[uname]?.score) || 0;
    const liveScore = Number(room?.liveMatch?.[uname]?.score) || 0;
    if (pScore > bestGameScore) bestGameScore = pScore;
    if (liveScore > bestGameScore) bestGameScore = liveScore;
  });
  gamePracticeLeaderboard.forEach(entry => {
    if (!entry?.username || String(entry.username).toLowerCase() !== unameLower) return;
    const sc = Number(entry.score) || 0;
    if (sc > bestGameScore) bestGameScore = sc;
    if (
      (entry.gameType === 'knight_rpg' || String(entry.mode || '').toLowerCase().startsWith('knight')) &&
      sc > knightBestScore
    ) {
      knightBestScore = sc;
    }
    if (sc >= 1500 && Number(entry.accuracyPct) >= 100) {
      hasGamePerfectRun = true;
    }
  });
  if (knightBestScore > bestGameScore) bestGameScore = knightBestScore;

  const skillBandList = [
    bestSkillBand.listening,
    bestSkillBand.reading,
    bestSkillBand.writing,
    bestSkillBand.speaking
  ];
  const skillsAt65Count = skillBandList.filter(b => b >= 6.5).length;
  const skillsAt70Count = skillBandList.filter(b => b >= 7.0).length;

  const hasSupporterPerk = Boolean(
    user?.customCoverUnlocked ||
    Number(user?.skillPracticeExpiresAt) > 0 ||
    Number(user?.aieoVipExpiresAt) > 0 ||
    Number(user?.donatedTotalVnd) > 0 ||
    Number(user?.totalPaidVnd) > 0 ||
    (Array.isArray(user?.purchasedTitleIds) && user.purchasedTitleIds.length > 0)
  );

  return {
    examCount: userAttempts.length,
    dailyZoneCount,
    highestBand,
    bestGameScore,
    knightBestScore,
    knightMonstersSlain,
    knightDragonsSlain,
    knightKeysCollected,
    knightUnlockedSkinsCount,
    band65Count,
    band70Count,
    exactBand70Count,
    band75Count,
    band80Count,
    band85Count,
    band90Count,
    readingCount,
    listeningCount,
    writingCount,
    speakingCount,
    skillsAt65Count,
    skillsAt70Count,
    highLrCount,
    highSpeakingCount,
    highWritingCount,
    perfectAccuracyCount,
    maxExamsInOneDay,
    maxBandJump,
    hasAllFourSkillsInOneDay,
    hasSpeedDemon,
    hasSaturdaySubmit,
    hasSundaySubmit,
    hasMidnightSubmit,
    hasGamePerfectRun,
    hasNightOwlSubmit,
    hasEarlyBirdSubmit,
    hasPerfectAccuracy,
    hasSupporterPerk,
    totalLoginDays: loginMetrics.totalLoginDays,
    currentLoginStreak: loginMetrics.currentStreak,
    bestLoginStreak: loginMetrics.bestStreak,
    coveredSkillsCount: coveredSkills.size
  };
}

export const SUBSCRIPTION_DURATION_DAYS = 30;
export const SUBSCRIPTION_DURATION_MS = SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const SKILL_PASS_PRICE_VND = 0; // Daily Zone mở cho học viên theo Team/Pass lớp
export const DEFAULT_EXAM_PRICE_VND = 100000; // 1 đề lẻ Thực Chiến Thi Thật: 100.000đ
export const PERIODIC_MOCK_PRICE_VND = 300000; // Mock Test Định Kỳ (3 tháng/lần): 300.000đ
export const REAL_EXAM_COMBO_3_PRICE_VND = 249000; // Combo 3 đề Thực Chiến: 249.000đ
export const REAL_EXAM_COMBO_5_PRICE_VND = 399000; // Combo 5 đề Thực Chiến: 399.000đ
export const REAL_EXAM_COMBO_8_PRICE_VND = 599000; // Combo 8 đề Thực Chiến: 599.000đ
export const REAL_EXAM_COMBO_10_PRICE_VND = 699000; // Combo 10 đề Thực Chiến: 699.000đ
export const FRIEND_ROOM_TICKET_PRICE_VND = 5000;
export const AIEO_VIP_PRICE_VND = 20000;

export const REAL_EXAM_COMBOS = [
  {
    id: 'exam_combo_3',
    itemType: 'exam_combo_3',
    credits: 3,
    defaultPrice: REAL_EXAM_COMBO_3_PRICE_VND,
    defaultPriceVnd: REAL_EXAM_COMBO_3_PRICE_VND,
    priceKey: 'realExamCombo3Price',
    priceField: 'realExamCombo3Price',
    label: 'Combo 3 Đề',
    fullLabel: 'Combo 3 Đề Thực Chiến Thi Thật',
    shortLabel: 'Combo 3 đề',
    savingNote: 'Tiết kiệm 51.000đ'
  },
  {
    id: 'exam_combo_5',
    itemType: 'exam_combo_5',
    credits: 5,
    defaultPrice: REAL_EXAM_COMBO_5_PRICE_VND,
    defaultPriceVnd: REAL_EXAM_COMBO_5_PRICE_VND,
    priceKey: 'realExamCombo5Price',
    priceField: 'realExamCombo5Price',
    label: 'Combo 5 Đề',
    fullLabel: 'Combo 5 Đề Thực Chiến Thi Thật',
    shortLabel: 'Combo 5 đề',
    savingNote: 'Tiết kiệm 101.000đ'
  },
  {
    id: 'exam_combo_8',
    itemType: 'exam_combo_8',
    credits: 8,
    defaultPrice: REAL_EXAM_COMBO_8_PRICE_VND,
    defaultPriceVnd: REAL_EXAM_COMBO_8_PRICE_VND,
    priceKey: 'realExamCombo8Price',
    priceField: 'realExamCombo8Price',
    label: 'Combo 8 Đề',
    fullLabel: 'Combo 8 Đề Thực Chiến Thi Thật',
    shortLabel: 'Combo 8 đề',
    savingNote: 'Tiết kiệm 201.000đ'
  },
  {
    id: 'exam_combo_10',
    itemType: 'exam_combo_10',
    credits: 10,
    defaultPrice: REAL_EXAM_COMBO_10_PRICE_VND,
    defaultPriceVnd: REAL_EXAM_COMBO_10_PRICE_VND,
    priceKey: 'realExamCombo10Price',
    priceField: 'realExamCombo10Price',
    label: 'Combo 10 Đề',
    fullLabel: 'Combo 10 Đề Thực Chiến Thi Thật',
    shortLabel: 'Combo 10 đề',
    savingNote: 'Tiết kiệm 301.000đ'
  }
];

/** 10 bậc hạng thành viên theo tổng số đề Thực Chiến đã nạp (từ màu thường lên màu VIP). */
export const EXAM_PURCHASE_TIERS = [
  {
    id: 'basic',
    label: 'Basic',
    minExams: 1,
    isVipVisual: false,
    showCrown: false,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600'
  },
  {
    id: 'standard',
    label: 'Standard',
    minExams: 3,
    isVipVisual: false,
    showCrown: false,
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-600/60'
  },
  {
    id: 'plus',
    label: 'Plus',
    minExams: 5,
    isVipVisual: false,
    showCrown: false,
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-400 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-500/60'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    minExams: 8,
    isVipVisual: false,
    showCrown: false,
    badgeClass: 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
  },
  {
    id: 'premier',
    label: 'Premier',
    minExams: 12,
    isVipVisual: true,
    showCrown: false,
    badgeClass: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-300 shadow-xs'
  },
  {
    id: 'signature',
    label: 'Signature',
    minExams: 16,
    isVipVisual: true,
    showCrown: false,
    badgeClass: 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white border-pink-300 shadow-xs'
  },
  {
    id: 'elite',
    label: 'Elite',
    minExams: 20,
    isVipVisual: true,
    showCrown: true,
    badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-300 shadow-sm'
  },
  {
    id: 'prestige',
    label: 'Prestige',
    minExams: 25,
    isVipVisual: true,
    showCrown: true,
    badgeClass: 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white border-amber-300 shadow-sm'
  },
  {
    id: 'royal',
    label: 'Royal',
    minExams: 30,
    isVipVisual: true,
    showCrown: true,
    badgeClass: 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-amber-400 text-white border-amber-300 shadow-md'
  },
  {
    id: 'imperial',
    label: 'Imperial',
    minExams: 40,
    isVipVisual: true,
    showCrown: true,
    badgeClass: 'vip-paid-badge vip-paid-vip bg-gradient-to-r from-zinc-900 via-red-700 to-amber-500 text-amber-100 border-amber-300 shadow-md'
  }
];

export function getPurchasedExamCount(user) {
  if (!user || typeof user !== 'object') return 0;
  const tracked = Math.max(0, Math.floor(Number(user.totalPurchasedExams) || 0));
  const unlockedCount = Array.isArray(user.purchasedTestIds) ? user.purchasedTestIds.length : 0;
  const creditsCount = Math.max(0, Math.floor(Number(user.realExamCredits) || 0));
  return Math.max(tracked, unlockedCount + creditsCount);
}

export function resolveExamPurchaseTier(user) {
  const count = getPurchasedExamCount(user);
  let matched = null;
  for (const tier of EXAM_PURCHASE_TIERS) {
    if (count >= tier.minExams) matched = tier;
  }
  return matched;
}

export function getNextExamPurchaseTier(user) {
  const count = getPurchasedExamCount(user);
  return EXAM_PURCHASE_TIERS.find(tier => count < tier.minExams) || null;
}

export function hasGamePracticeAccess(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  if (user.isGuest) return false;
  if (isStaffOrAdminUser(user)) return true;
  return Number(user.aieoVipExpiresAt) > nowMs;
}

export function getRealExamComboMeta(itemType, paymentConfig = null) {
  const found = REAL_EXAM_COMBOS.find(c => c.id === String(itemType || '').trim());
  if (!found) return null;
  const cfg = normalizePaymentConfig(paymentConfig || {});
  const priceVnd = Number(cfg[found.priceKey]) > 0 ? Number(cfg[found.priceKey]) : found.defaultPriceVnd;
  return { ...found, itemType: found.id, price: priceVnd, priceVnd };
}

export function getRealExamCredits(user) {
  if (!user || typeof user !== 'object') return 0;
  return Math.max(0, Math.floor(Number(user.realExamCredits) || 0));
}

export function formatRemainingSubscriptionText(expiresAt, nowMs = Date.now()) {
  const exp = Number(expiresAt) || 0;
  if (!exp) return '';
  if (exp <= nowMs) return 'Đã hết hạn';
  const days = Math.max(1, Math.ceil((exp - nowMs) / 86400000));
  const dateStr = new Date(exp + 7 * 3600 * 1000).toISOString().slice(0, 10).split('-').reverse().join('/');
  return `Còn ${days} ngày (đến ${dateStr})`;
}

export function hasActiveAieoVip(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  return Number(user.aieoVipExpiresAt) > nowMs;
}

export function hasSkillPracticeAccess(user) {
  return Boolean(user && typeof user === 'object');
}

export function getTestPurchasePriceVnd(test, _paymentConfig = null) {
  if (!test || typeof test !== 'object' || test.testMode === 'single_skill') return 0;
  const raw = Number(test.priceVnd);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(10_000_000, Math.round(raw));
  }
  return 0;
}

export function hasTestPurchaseAccess(user, test, _nowMs = Date.now()) {
  if (!test || typeof test !== 'object' || test.testMode === 'single_skill') return true;
  const price = getTestPurchasePriceVnd(test);
  if (price <= 0) return true;
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  if (user.role === 'teacher') return true;
  const purchased = Array.isArray(user.purchasedTestIds) ? user.purchasedTestIds.map(String) : [];
  if (purchased.includes(String(test.id))) return true;
  return false;
}

export function hasVipFriendRoomAccess(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  if (user.role === 'teacher') return true;
  return Number(user.aieoVipExpiresAt) > nowMs;
}

export function getFriendRoomTicketCredits(user) {
  if (!user || typeof user !== 'object') return 0;
  return Math.max(0, Math.floor(Number(user.roomCreateCredits) || 0));
}

export function canCreateFriendRoomNow(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  return hasVipFriendRoomAccess(user, nowMs) || getFriendRoomTicketCredits(user) > 0;
}

export function hasActivePaidTitlePermission(user, titleId, nowMs = Date.now(), paymentConfig = null) {
  if (!user || typeof user !== 'object' || !titleId) return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  const grantedArr = Array.isArray(user.grantedTitleIds) ? user.grantedTitleIds.map(String) : [];
  if (grantedArr.includes(String(titleId))) return true;
  if (titleId === 'aieo_vip') {
    return Number(user.aieoVipExpiresAt) > nowMs;
  }
  const purchasedArr = Array.isArray(user.purchasedTitleIds) ? user.purchasedTitleIds.map(String) : [];
  const paidMeta = PAID_SHOP_TITLES.find(t => t.id === String(titleId));
  if (paidMeta?.isPermanentDonateTitle) {
    if (purchasedArr.includes(String(titleId))) return true;
    const threshold = getTitlePriceVnd(paidMeta, paymentConfig);
    return Number(user.donatedTotalVnd || 0) >= threshold;
  }
  if (!purchasedArr.includes(String(titleId))) return false;
  const exp = Number(user.purchasedTitleExpiries?.[titleId]) || 0;
  return exp > 0 ? exp > nowMs : true;
}

export function hasPaidTitleVisualPerk(user, _nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  // Viền aura phát sáng quanh avatar chỉ áp dụng cho Giáo viên & Admin
  return isStaffOrAdminUser(user);
}

export const VIP_NAME_COLORS = [
  {
    id: 'crimson',
    label: 'Đỏ Ruby',
    swatch: '#dc2626',
    cssClass: 'vip-red-name-text vip-color-crimson !text-red-600 dark:!text-red-400 font-black'
  },
  {
    id: 'orange',
    label: 'Cam Lửa',
    swatch: '#ea580c',
    cssClass: 'vip-custom-name-text vip-color-orange !text-orange-700 dark:!text-orange-400 font-black'
  },
  {
    id: 'amber',
    label: 'Vàng Kim',
    swatch: '#d97706',
    cssClass: 'vip-custom-name-text vip-color-amber !text-amber-700 dark:!text-amber-300 font-black'
  },
  {
    id: 'emerald',
    label: 'Lục Bảo',
    swatch: '#059669',
    cssClass: 'vip-custom-name-text vip-color-emerald !text-emerald-700 dark:!text-emerald-400 font-black'
  },
  {
    id: 'cyan',
    label: 'Cyan Băng',
    swatch: '#0891b2',
    cssClass: 'vip-custom-name-text vip-color-cyan !text-cyan-700 dark:!text-cyan-300 font-black'
  },
  {
    id: 'royal',
    label: 'Sapphire',
    swatch: '#2563eb',
    cssClass: 'vip-custom-name-text vip-color-royal !text-blue-700 dark:!text-blue-400 font-black'
  },
  {
    id: 'violet',
    label: 'Tím Cyber',
    swatch: '#9333ea',
    cssClass: 'vip-custom-name-text vip-color-violet !text-purple-700 dark:!text-purple-300 font-black'
  },
  {
    id: 'pink',
    label: 'Hồng Neon',
    swatch: '#db2777',
    cssClass: 'vip-custom-name-text vip-color-pink !text-pink-700 dark:!text-pink-400 font-black'
  }
];

export const VIP_NEON_COVER_THEMES = [
  {
    id: 'aurora_rgb',
    name: 'LED 7 Sắc Nhiều Màu',
    desc: 'Viền đèn LED đa sắc chuyển động nổi bật',
    swatchClass: 'bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400',
    frameWrapClass: 'vip-neon-frame vip-neon-aurora-frame shadow-[0_14px_36px_-6px_rgba(236,72,153,0.55),0_10px_28px_-6px_rgba(34,211,238,0.55)]',
    cardRimWrapClass: 'vip-neon-frame vip-neon-aurora-frame shadow-[0_8px_22px_-6px_rgba(168,85,247,0.5),0_6px_18px_-6px_rgba(34,211,238,0.45)]',
    coverLedInnerClass: 'vip-cover-led-aurora',
    seamBarClass: 'vip-neon-aurora-seam',
    cardAccentClass: 'vip-neon-frame ring-2 ring-fuchsia-400/85 border-cyan-400 shadow-[0_10px_24px_-8px_rgba(168,85,247,0.48)]'
  },
  {
    id: 'neon_pink',
    name: 'LED Hồng Cyber',
    desc: 'Viền LED hồng tím neon nổi bật',
    swatchClass: 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400',
    frameWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#FF2E93] via-[#E879F9] to-[#22D3EE] shadow-[0_14px_34px_-6px_rgba(236,72,153,0.68)]',
    cardRimWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#FF2E93] via-[#C084FC] to-[#22D3EE] shadow-[0_8px_22px_-6px_rgba(236,72,153,0.52)]',
    coverLedInnerClass: 'vip-cover-led shadow-[inset_0_0_26px_rgba(255,46,147,0.62),inset_0_3px_12px_rgba(34,211,238,0.45)]',
    seamBarClass: 'vip-neon-seam bg-gradient-to-r from-[#FF2E93] via-[#E879F9] to-[#22D3EE]',
    cardAccentClass: 'vip-neon-frame ring-2 ring-pink-500/80 border-pink-400 shadow-[0_10px_24px_-8px_rgba(236,72,153,0.45)]'
  },
  {
    id: 'cyber_cyan',
    name: 'LED Cyan Băng',
    desc: 'Viền đèn LED xanh điện lạnh sắc nét',
    swatchClass: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400',
    frameWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#00F5D4] via-[#22D3EE] to-[#6366F1] shadow-[0_14px_34px_-6px_rgba(6,182,212,0.7)]',
    cardRimWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#00F5D4] via-[#22D3EE] to-[#6366F1] shadow-[0_8px_22px_-6px_rgba(6,182,212,0.52)]',
    coverLedInnerClass: 'vip-cover-led shadow-[inset_0_0_26px_rgba(34,211,238,0.65),inset_0_3px_12px_rgba(0,245,212,0.45)]',
    seamBarClass: 'vip-neon-seam bg-gradient-to-r from-[#00F5D4] via-[#22D3EE] to-[#6366F1]',
    cardAccentClass: 'vip-neon-frame ring-2 ring-cyan-400/80 border-cyan-400 shadow-[0_10px_24px_-8px_rgba(6,182,212,0.45)]'
  },
  {
    id: 'emerald_volt',
    name: 'LED Lục Điện',
    desc: 'Viền LED xanh ngọc sắc nét nổi bật',
    swatchClass: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400',
    frameWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#10B981] via-[#1EE1D6] to-[#38BDF8] shadow-[0_14px_34px_-6px_rgba(16,185,129,0.68)]',
    cardRimWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#10B981] via-[#1EE1D6] to-[#38BDF8] shadow-[0_8px_22px_-6px_rgba(16,185,129,0.52)]',
    coverLedInnerClass: 'vip-cover-led shadow-[inset_0_0_26px_rgba(30,225,214,0.62),inset_0_3px_12px_rgba(16,185,129,0.45)]',
    seamBarClass: 'vip-neon-seam bg-gradient-to-r from-[#10B981] via-[#1EE1D6] to-[#38BDF8]',
    cardAccentClass: 'vip-neon-frame ring-2 ring-emerald-400/85 border-emerald-400 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.45)]'
  },
  {
    id: 'ruby_fire',
    name: 'LED Đỏ Hổ Phách',
    desc: 'Viền LED đỏ cam năng lượng VIP',
    swatchClass: 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-400',
    frameWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#EF4444] via-[#FB7185] to-[#FBBF24] shadow-[0_14px_34px_-6px_rgba(239,68,68,0.68)]',
    cardRimWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#EF4444] via-[#FB7185] to-[#FBBF24] shadow-[0_8px_22px_-6px_rgba(239,68,68,0.52)]',
    coverLedInnerClass: 'vip-cover-led shadow-[inset_0_0_26px_rgba(239,68,68,0.62),inset_0_3px_12px_rgba(251,191,36,0.45)]',
    seamBarClass: 'vip-neon-seam bg-gradient-to-r from-[#EF4444] via-[#FB7185] to-[#FBBF24]',
    cardAccentClass: 'vip-neon-frame ring-2 ring-rose-500/80 border-rose-400 shadow-[0_10px_24px_-8px_rgba(239,68,68,0.45)]'
  },
  {
    id: 'solar_gold',
    name: 'LED Hoàng Kim',
    desc: 'Viền LED vàng kim ánh sáng hoàng gia',
    swatchClass: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-400',
    frameWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#F59E0B] via-[#FDE047] to-[#FB7185] shadow-[0_14px_34px_-6px_rgba(245,158,11,0.7)]',
    cardRimWrapClass: 'vip-neon-frame bg-gradient-to-r from-[#F59E0B] via-[#FDE047] to-[#FB7185] shadow-[0_8px_22px_-6px_rgba(245,158,11,0.52)]',
    coverLedInnerClass: 'vip-cover-led shadow-[inset_0_0_26px_rgba(251,191,36,0.65),inset_0_3px_12px_rgba(251,113,133,0.42)]',
    seamBarClass: 'vip-neon-seam bg-gradient-to-r from-[#F59E0B] via-[#FDE047] to-[#FB7185]',
    cardAccentClass: 'vip-neon-frame ring-2 ring-amber-400/85 border-amber-400 shadow-[0_10px_24px_-8px_rgba(245,158,11,0.45)]'
  }
];

export function normalizeVipNameColor(raw) {
  const clean = String(raw || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toLowerCase();
  const matched = VIP_NAME_COLORS.find(c => c.id === clean.toLowerCase());
  return matched ? matched.id : 'crimson';
}

export function getVipNameColorMeta(raw) {
  const norm = normalizeVipNameColor(raw);
  if (norm.startsWith('#')) {
    return {
      id: norm,
      label: norm.toUpperCase(),
      isCustomHex: true,
      hex: norm,
      swatch: norm,
      cssClass: 'vip-custom-name-text font-black'
    };
  }
  const preset = VIP_NAME_COLORS.find(c => c.id === norm) || VIP_NAME_COLORS[0];
  return {
    ...preset,
    isCustomHex: false,
    hex: preset.swatch
  };
}

export function normalizeVipNeonCoverColor(raw) {
  const clean = String(raw || '').trim().toLowerCase();
  const matched = VIP_NEON_COVER_THEMES.find(t => t.id === clean);
  return matched ? matched.id : 'aurora_rgb';
}

export function getVipNeonCoverMeta(raw) {
  const norm = normalizeVipNeonCoverColor(raw);
  return VIP_NEON_COVER_THEMES.find(t => t.id === norm) || VIP_NEON_COVER_THEMES[0];
}

export function resolveUserVipNameVisual(user, nowMs = Date.now()) {
  const defaultColorMeta = getVipNameColorMeta('crimson');
  const defaultNeonMeta = getVipNeonCoverMeta('aurora_rgb');
  if (!user || typeof user !== 'object') {
    return {
      isSuperAdmin: false,
      hasAieoVip: false,
      canToggleEffects: false,
      showRedName: false,
      showNameColor: false,
      nameColorValue: defaultColorMeta.id,
      nameColorMeta: defaultColorMeta,
      showVipTag: false,
      showNeonCover: false,
      neonCoverColor: defaultNeonMeta.id,
      neonCoverMeta: defaultNeonMeta,
      vipExpiresAt: 0
    };
  }
  const isSuperAdmin = Boolean(user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s');
  const isStaff = isStaffOrAdminUser(user);
  const vipExpiresAt = Number(user.aieoVipExpiresAt) || 0;
  const hasAieoVip = vipExpiresAt > nowMs;
  const canToggleEffects = hasAieoVip || isStaff;
  const defaultWhenActive = hasAieoVip;
  const showNameColor = canToggleEffects && (user.vipRedNameEnabled !== undefined ? Boolean(user.vipRedNameEnabled) : defaultWhenActive);
  const nameColorValue = normalizeVipNameColor(user.vipNameColor || 'crimson');
  const nameColorMeta = getVipNameColorMeta(nameColorValue);
  const purchaseTier = resolveExamPurchaseTier(user);
  const showVipTag = Boolean(purchaseTier) || (isStaff && (user.vipTagEnabled !== undefined ? Boolean(user.vipTagEnabled) : false));
  // Viền LED bìa chỉ dành riêng cho Giáo viên & Admin
  const defaultNeonWhenActive = isSuperAdmin && Boolean(user.vipRedNameEnabled || user.vipTagEnabled);
  const showNeonCover = isStaff && (user.vipNeonCoverEnabled !== undefined ? Boolean(user.vipNeonCoverEnabled) : defaultNeonWhenActive);
  const neonCoverColor = normalizeVipNeonCoverColor(user.vipNeonCoverColor || 'aurora_rgb');
  const neonCoverMeta = getVipNeonCoverMeta(neonCoverColor);
  return {
    isSuperAdmin,
    isStaff,
    hasAieoVip,
    canToggleEffects,
    canUseNeonCover: isStaff,
    showRedName: showNameColor,
    showNameColor,
    nameColorValue,
    nameColorMeta,
    showVipTag,
    purchaseTier,
    showNeonCover,
    neonCoverColor,
    neonCoverMeta,
    vipExpiresAt
  };
}

export function computeStudentTitleProgress(username, attempts = [], roomsDb = {}, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const nowMs = Number(opts.nowMs) || Date.now();
  const userObj = 'loginDays' in opts || 'username' in opts ? opts : (opts.user || null);
  const customTitles = Array.isArray(opts.customTitles) ? opts.customTitles : [];
  const paymentConfig = opts.paymentConfig || null;
  const gamePracticeLeaderboard = Array.isArray(opts.gamePracticeLeaderboard) ? opts.gamePracticeLeaderboard : [];
  const usersDb = opts.usersDb && typeof opts.usersDb === 'object' ? opts.usersDb : null;
  const hideAdminPrivilegeText = Boolean(opts.hideAdminPrivilegeText);
  const unlockAll = Boolean(opts.unlockAll || userObj?.isSuperAdmin || userObj?.isSystemAdmin || username === 'tuanpro123s');
  const grantedSet = new Set(Array.isArray(userObj?.grantedTitleIds) ? userObj.grantedTitleIds.map(String) : []);
  const purchasedSet = new Set(Array.isArray(userObj?.purchasedTitleIds) ? userObj.purchasedTitleIds.map(String) : []);
  const purchasedExpiries = userObj?.purchasedTitleExpiries && typeof userObj.purchasedTitleExpiries === 'object'
    ? userObj.purchasedTitleExpiries
    : {};
  const stats = computeStudentStats(username, attempts, roomsDb, userObj, { gamePracticeLeaderboard });
  const catalog = getAllCatalogTitles(customTitles);
  const unameLower = String(username || '').trim().toLowerCase();
  const { dateKey: todayKey, endMs: todayEndMs } = getVietnamDayBoundsMs(nowMs);
  const providedDaily = opts.dailyRankTitles && opts.dailyRankTitles.dateKey === todayKey ? opts.dailyRankTitles : null;
  const dailyHolders =
    providedDaily ||
    computeDailyLeaderboardTitleHolders({
      attempts,
      roomsDb,
      gamePracticeLeaderboard,
      usersDb,
      nowMs
    });
  const userHeldDailyRecord = unameLower ? dailyHolders?.byUsername?.[unameLower] || null : null;

  const itemsWithProgress = catalog.map(t => {
    const priceVnd = (t.isPaidTitle || t.isVipBundleTitle)
      ? (t.isVipBundleTitle ? (Number(paymentConfig?.aieoVipPrice) || AIEO_VIP_PRICE_VND) : getTitlePriceVnd(t, paymentConfig))
      : 0;
    const isPermanentDonate = Boolean(t.isPermanentDonateTitle);
    const unlockedByGrant = grantedSet.has(t.id);
    const hasPurchasedEntry = purchasedSet.has(t.id);
    const unlockedByDonateThreshold = isPermanentDonate && priceVnd > 0 && Number(userObj?.donatedTotalVnd || 0) >= priceVnd;
    const purchaseExp = isPermanentDonate
      ? 0
      : (Number(purchasedExpiries[t.id]) || (t.isVipBundleTitle ? Number(userObj?.aieoVipExpiresAt) || 0 : 0));
    const unlockedByPurchase = isPermanentDonate
      ? (hasPurchasedEntry || unlockedByDonateThreshold)
      : t.isVipBundleTitle
      ? (Number(userObj?.aieoVipExpiresAt) > nowMs)
      : hasPurchasedEntry && (purchaseExp > 0 ? purchaseExp > nowMs : true);
    const purchaseExpired = isPermanentDonate
      ? false
      : Boolean(
          !unlockedByPurchase &&
          !unlockedByGrant &&
          ((hasPurchasedEntry && purchaseExp > 0 && purchaseExp <= nowMs) || (t.isVipBundleTitle && Number(userObj?.aieoVipExpiresAt) > 0 && Number(userObj?.aieoVipExpiresAt) <= nowMs))
        );

    const dailySlot = t.isDailyRankTitle ? (dailyHolders?.byTitleId?.[t.id] || null) : null;
    const isHeldByUserToday = Boolean(
      t.isDailyRankTitle &&
      dailySlot &&
      dailySlot.username &&
      String(dailySlot.username).toLowerCase() === unameLower &&
      Number(dailySlot.expiresAtMs || todayEndMs) > nowMs
    );
    const unlockedByDailyRank = isHeldByUserToday;
    const unlockedByMetric = t.isDailyRankTitle
      ? unlockedByDailyRank
      : isPermanentDonate
      ? unlockedByDonateThreshold
      : typeof t.isUnlocked === 'function'
      ? Boolean(t.isUnlocked(stats, userObj))
      : false;
    const unlocked = unlockAll || unlockedByGrant || unlockedByPurchase || unlockedByMetric;

    let dailyRankMeta = null;
    let progress = typeof t.getProgress === 'function'
      ? t.getProgress(stats, userObj, priceVnd)
      : { pct: unlocked ? 100 : 0, text: unlocked ? 'Quản trị trao tặng' : 'Chờ Quản trị trao tặng' };

    if (t.isDailyRankTitle) {
      const slotExpMs = Number(dailySlot?.expiresAtMs || dailyHolders?.expiresAtMs || todayEndMs);
      const remainingText = formatRemainingDailyTitleText(slotExpMs, nowMs);
      const userHasOtherDailyTitle = Boolean(userHeldDailyRecord && userHeldDailyRecord.titleId !== t.id);
      const liveTodaySlot = dailyHolders?.liveTodayByTitleId?.[t.id] || null;
      const isLeadingLiveToday = Boolean(
        liveTodaySlot &&
        liveTodaySlot.username &&
        String(liveTodaySlot.username).toLowerCase() === unameLower
      );
      const settledDateLabel = formatDateKeyVi(dailySlot?.settledFromDateKey || dailyHolders?.settledDateKey || '');
      dailyRankMeta = {
        board: t.dailyRankBoard,
        boardLabel: t.dailyRankBoardLabel,
        rank: t.dailyRankPosition,
        dateKey: todayKey,
        settledFromDateKey: dailySlot?.settledFromDateKey || dailyHolders?.settledDateKey || '',
        expiresAtMs: slotExpMs,
        remainingText,
        holderUsername: dailySlot?.username || '',
        holderName: dailySlot?.name || '',
        occupiedByOtherClass: Boolean(dailySlot?.occupiedByOtherClass),
        metricLabel: dailySlot?.metricLabel || '',
        isHeldByUserToday,
        isLeadingLiveToday,
        liveTodayLeaderName: liveTodaySlot?.name || '',
        liveTodayMetricLabel: liveTodaySlot?.metricLabel || '',
        userHasOtherDailyTitle,
        userHeldDailyTitleId: userHeldDailyRecord?.titleId || ''
      };
      if (isHeldByUserToday) {
        progress = {
          pct: 100,
          text: `🏅 Thưởng Top #${t.dailyRankPosition} ngày ${settledDateLabel || 'hôm qua'} • ${remainingText}`
        };
      } else if (dailySlot) {
        progress = {
          pct: isLeadingLiveToday ? 50 : 0,
          text: dailySlot.occupiedByOtherClass
            ? `🔒 Đã trao hôm nay (${dailySlot.metricLabel || 'BXH hôm qua'})`
            : `👤 Thưởng ngày ${settledDateLabel || 'hôm qua'}: ${dailySlot.name}${dailySlot.metricLabel ? ` (${dailySlot.metricLabel})` : ''}${isLeadingLiveToday ? ' • Bạn đang dẫn đầu hôm nay (trao vào ngày mai)' : ''}`
        };
      } else if (isLeadingLiveToday) {
        progress = {
          pct: 60,
          text: `🔥 Bạn đang tạm dẫn Top #${t.dailyRankPosition} hôm nay (${liveTodaySlot.metricLabel}) • Chốt 23:59 & trao vào 00:00 ngày mai!`
        };
      } else if (liveTodaySlot) {
        progress = {
          pct: 0,
          text: `⏳ Đang đua hôm nay: ${liveTodaySlot.name} tạm dẫn (${liveTodaySlot.metricLabel}) • Chốt 23:59 & trao vào ngày mai`
        };
      } else if (userHasOtherDailyTitle) {
        progress = { pct: 0, text: '🔒 Bạn đã giữ 1 suất BXH hôm nay (không cấp trùng)' };
      } else {
        progress = {
          pct: 0,
          text: `⏳ Đua Top #${t.dailyRankPosition} hôm nay • Chốt BXH lúc 23:59 & trao danh hiệu vào ngày hôm sau`
        };
      }
    }

    const subLeftLabel = purchaseExp > nowMs ? formatRemainingSubscriptionText(purchaseExp, nowMs) : '';
    const effectiveExpiresAt = t.isDailyRankTitle
      ? (isHeldByUserToday ? Number(dailySlot?.expiresAtMs || todayEndMs) : 0)
      : purchaseExp;

    return {
      id: t.id,
      label: t.label,
      icon: t.icon,
      tier: t.tier,
      difficulty: t.difficulty || 'Cơ Bản',
      conditionText: t.conditionText,
      badgeClass: t.badgeClass,
      heroBadgeClass: t.heroBadgeClass,
      gameBadgeClass: t.gameBadgeClass,
      vipHaloClass: t.vipHaloClass || '',
      isCustomTitle: Boolean(t.isCustomTitle),
      isPaidTitle: Boolean(t.isPaidTitle),
      isPermanentDonateTitle: Boolean(t.isPermanentDonateTitle),
      isVipBundleTitle: Boolean(t.isVipBundleTitle),
      isStaffOnly: Boolean(t.isStaffOnly),
      isHolidayTitle: Boolean(t.isHolidayTitle),
      isSecretTitle: Boolean(t.isSecretTitle),
      isDailyRankTitle: Boolean(t.isDailyRankTitle),
      dailyRankMeta,
      holidayDateHint: t.holidayDateHint || '',
      priceVnd,
      expiresAt: effectiveExpiresAt,
      purchaseExpired,
      colorKey: t.colorKey || 'amber',
      unlocked,
      unlockedByGrant,
      unlockedByPurchase,
      unlockedByDailyRank,
      progressPct: unlocked ? 100 : progress.pct,
      progressText: unlockAll
        ? (hideAdminPrivilegeText ? 'Đã sở hữu' : 'Mở khóa tự động (Đặc quyền Quản trị)')
        : unlockedByGrant
        ? '👑 Quản trị trao tặng'
        : unlockedByDailyRank
        ? progress.text
        : unlockedByPurchase
        ? (isPermanentDonate
            ? '💜 Đã mở khóa VĨNH VIỄN (Donate ủng hộ)'
            : subLeftLabel
            ? `💎 Gói 1 tháng (${subLeftLabel})`
            : '💎 Đã mua mở khóa')
        : purchaseExpired
        ? '⌛ Hết hạn 1 tháng - Bấm gia hạn để đeo tiếp'
        : unlocked && t.isHolidayTitle && progress?.text
        ? progress.text
        : unlocked
        ? 'Đã mở khóa'
        : progress.text
    };
  });
  const unlockedIds = itemsWithProgress.filter(i => i.unlocked).map(i => i.id);
  return { stats, unlockedIds, itemsWithProgress, dailyHolders };
}

export function resolveRoleBuiltInTitle(user) {
  if (!user) return null;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') {
    return {
      id: 'role_superadmin',
      label: 'Quản Trị Hệ Thống',
      icon: '🛡️',
      tier: 'Quản Trị',
      isRoleBuiltIn: true,
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-400/50',
      heroBadgeClass: 'bg-purple-500/30 text-purple-200 border-purple-400/40',
      gameBadgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/25 dark:text-purple-200 dark:border-purple-400/50'
    };
  }
  if (user.role === 'teacher') {
    return {
      id: 'role_teacher',
      label: 'Giảng Viên IELTS',
      icon: '👩‍🏫',
      tier: 'Giảng Viên',
      isRoleBuiltIn: true,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/50',
      heroBadgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
      gameBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50'
    };
  }
  return null;
}

export function resolveStudentTitleSummary(
  user,
  attempts = [],
  roomsDb = {},
  customTitles = [],
  paymentConfig = null,
  extra = {}
) {
  if (!user) return null;
  const isSystemAdmin = Boolean(user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s');
  const isTeacher = !isSystemAdmin && user.role === 'teacher';
  const roleBadge = resolveRoleBuiltInTitle(user);

  const progress = computeStudentTitleProgress(user.username, attempts, roomsDb, {
    unlockAll: isSystemAdmin,
    user,
    customTitles,
    paymentConfig,
    ...(extra && typeof extra === 'object' ? extra : {})
  });

  const preferredId = String(user.equippedTitleId || '').trim();
  const preferred = progress.itemsWithProgress.find(item => item.id === preferredId && item.unlocked);
  const staffDefault = (isSystemAdmin || isTeacher)
    ? progress.itemsWithProgress.find(item => item.id === 'staff_ielts_10' && item.unlocked)
    : null;
  const firstGrantedOrUnlocked =
    staffDefault ||
    progress.itemsWithProgress.find(item => item.unlockedByDailyRank && item.unlocked) ||
    progress.itemsWithProgress.find(item => item.unlockedByGrant && item.unlocked) ||
    progress.itemsWithProgress[0];
  const activeTitle = preferred || firstGrantedOrUnlocked;
  const isHidden = user.showTitleBadge === false;

  return {
    isRoleBuiltIn: false,
    isSystemAdmin,
    isTeacher,
    autoUnlockedAll: isSystemAdmin,
    roleBadge,
    isHidden,
    title: activeTitle,
    ...progress
  };
}

export function resolveVisibleTitleBadge(
  user,
  attempts = [],
  roomsDb = {},
  customTitles = [],
  paymentConfig = null,
  extra = {}
) {
  const summary = resolveStudentTitleSummary(user, attempts, roomsDb, customTitles, paymentConfig, extra);
  if (!summary) return null;
  if (summary.isHidden) return null;
  return summary.title || null;
}

export const TITLE_DIFFICULTY_RANK = {
  'VIP Độc Quyền': 9,
  'Độc Quyền': 8,
  'Phú Quý': 7,
  'Đặc Biệt': 7,
  'Theo Ngày': 6.5,
  'Bí Ẩn': 6,
  'Cực Khó': 5.5,
  'Khó': 4.5,
  'Lễ Hội': 4,
  'Điểm Danh': 3,
  'Bình Thường': 2,
  'Thử Thách': 2,
  'Cơ Bản': 1,
  'Dễ': 1,
  'Khởi Đầu': 1
};

export function sortTitlesByPrestige(items = []) {
  const orderMap = new Map(STUDENT_TITLES.map((t, idx) => [t.id, idx]));
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const rankDiff = (TITLE_DIFFICULTY_RANK[b?.difficulty] || 0) - (TITLE_DIFFICULTY_RANK[a?.difficulty] || 0);
    if (rankDiff !== 0) return rankDiff;
    return (orderMap.get(b?.id) ?? -1) - (orderMap.get(a?.id) ?? -1);
  });
}

export function evaluateTitleUnlockNotification({
  user,
  titleSummary,
  localAcknowledgedIds = [],
  hasLocalBaseline = false,
  nowMs = Date.now()
}) {
  if (!user || !titleSummary || titleSummary.isSystemAdmin) {
    return { shouldPersistBaseline: false, baselineToSave: null, newlyUnlockedItems: [] };
  }
  const todayKey = titleSummary?.dailyHolders?.dateKey || getVietnamDateKey(nowMs);
  const ackKeyFor = item => (item?.isDailyRankTitle ? `${item.id}@${todayKey}` : item?.id);
  const unlockedItems = (titleSummary.itemsWithProgress || []).filter(item => item && item.unlocked);
  const serverAck = Array.isArray(user.acknowledgedTitleIds) ? user.acknowledgedTitleIds : null;
  const localAck = Array.isArray(localAcknowledgedIds) ? localAcknowledgedIds : [];
  const hasBaseline = serverAck !== null || Boolean(hasLocalBaseline);

  if (!hasBaseline) {
    const seedIds = unlockedItems.length > 0 ? unlockedItems.map(ackKeyFor).filter(Boolean) : ['newbie'];
    return {
      shouldPersistBaseline: true,
      baselineToSave: seedIds,
      newlyUnlockedItems: []
    };
  }

  const seenSet = new Set([...(serverAck || []), ...localAck, 'newbie']);
  const freshItems = unlockedItems
    .filter(item => !seenSet.has(ackKeyFor(item)) && !seenSet.has(item.id))
    .map(item => ({ ...item, ackKey: ackKeyFor(item) }));
  const needsServerSync = serverAck === null && localAck.length > 0;

  return {
    shouldPersistBaseline: needsServerSync,
    baselineToSave: needsServerSync ? Array.from(seenSet) : null,
    newlyUnlockedItems: sortTitlesByPrestige(freshItems)
  };
}

// ==========================================
// CUSTOM PROFILE COVER UNLOCK (5.000đ / VIETQR)
// ==========================================

export const CUSTOM_COVER_UNLOCK_PRICE_VND = 5000;
export const MIN_DONATE_AMOUNT_VND = 5000;

export const VIETQR_BANK_OPTIONS = [
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'SHB', name: 'SHB' },
  { code: 'VIB', name: 'VIB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'CAKE', name: 'CAKE by VPBank' },
  { code: 'TIMO', name: 'Timo (BVBank)' }
];

export const STATIC_IMAGE_MAX_DATA_URL_LENGTH = 500_000;
export const VIP_ANIMATED_AVATAR_MAX_DATA_URL_LENGTH = 28_000_000;
export const MAX_AUDIO_UPLOAD_BYTES = 100 * 1024 * 1024;

export function hasAnimatedAvatarPermission(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  if (user.role === 'teacher') return true;
  return Number(user.aieoVipExpiresAt) > nowMs;
}

export function isWebpBufferAnimated(bytes) {
  if (!bytes || bytes.length < 22) return false;
  // RIFF .... WEBP VP8X <4-byte size> <flags>
  const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  const isVp8x = bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58;
  return isRiff && isWebp && isVp8x && (bytes[20] & 0x02) !== 0;
}

export function isSyncMediaUrl(rawUrl) {
  return /^\/api\/sync\/media\/[a-zA-Z0-9._-]{6,120}$/.test(String(rawUrl || '').trim());
}

export function isAnimatedDataUrl(rawUrl) {
  const str = String(rawUrl || '').trim();
  if (!str) return false;
  if (/^data:image\/(gif|apng);/i.test(str)) return true;
  if (/^https:\/\/.+\.(gif|apng)([?#].*)?$/i.test(str)) return true;
  if (/^\/api\/sync\/media\/.+\.(gif|apng|anim\.webp)([?#].*)?$/i.test(str)) return true;
  if (/^data:image\/webp;base64,/i.test(str)) {
    const b64 = str.slice(str.indexOf(',') + 1, str.indexOf(',') + 64);
    try {
      if (typeof Buffer !== 'undefined') {
        return isWebpBufferAnimated(Buffer.from(b64, 'base64'));
      }
      if (typeof atob === 'function') {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return isWebpBufferAnimated(arr);
      }
    } catch {
      return false;
    }
  }
  return false;
}

export function hasCustomCoverPermission(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  if (user.role === 'teacher') return true;
  if (hasActiveAieoVip(user, nowMs)) return true;
  const coverExp = Number(user.customCoverExpiresAt) || 0;
  if (coverExp > 0) return coverExp > nowMs;
  return Boolean(user.customCoverUnlocked);
}

export function formatVndCurrency(amount = CUSTOM_COVER_UNLOCK_PRICE_VND) {
  const num = Number(amount);
  const safe = Number.isFinite(num) && num >= 0 ? Math.round(num) : CUSTOM_COVER_UNLOCK_PRICE_VND;
  return `${safe.toLocaleString('vi-VN')}đ`;
}

export function buildCoverUnlockTransferNote(username = '', orderCode = '') {
  const cleanOrder = String(orderCode || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20);
  if (cleanOrder) return cleanOrder;
  const cleaned = String(username || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 24);
  return `MOKHOANEN ${cleaned || 'HOCVIEN'}`;
}

export function normalizePaymentConfig(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const clampVnd = (val, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) && n >= 0 ? Math.min(10_000_000, Math.round(n)) : fallback;
  };
  const rawSchemaVersion = Math.floor(Number(obj.pricingSchemaVersion) || 0);
  const coverUnlockPrice = clampVnd(obj.coverUnlockPrice, CUSTOM_COVER_UNLOCK_PRICE_VND);
  const skillPassPrice = clampVnd(obj.skillPassPrice, SKILL_PASS_PRICE_VND);
  let defaultExamPriceVnd = clampVnd(obj.defaultExamPriceVnd, DEFAULT_EXAM_PRICE_VND);
  const periodicMockPrice = clampVnd(obj.periodicMockPrice ?? obj.periodicMockPriceVnd, PERIODIC_MOCK_PRICE_VND);
  let realExamCombo3Price = clampVnd(obj.realExamCombo3Price ?? obj.combo3ExamPriceVnd, REAL_EXAM_COMBO_3_PRICE_VND);
  let realExamCombo5Price = clampVnd(obj.realExamCombo5Price ?? obj.combo5ExamPriceVnd, REAL_EXAM_COMBO_5_PRICE_VND);
  let realExamCombo8Price = clampVnd(obj.realExamCombo8Price ?? obj.combo8ExamPriceVnd, REAL_EXAM_COMBO_8_PRICE_VND);
  let realExamCombo10Price = clampVnd(obj.realExamCombo10Price ?? obj.combo10ExamPriceVnd, REAL_EXAM_COMBO_10_PRICE_VND);
  const friendRoomTicketPrice = clampVnd(obj.friendRoomTicketPrice, FRIEND_ROOM_TICKET_PRICE_VND);
  let aieoVipPrice = clampVnd(obj.aieoVipPrice, AIEO_VIP_PRICE_VND);

  // Auto-migrate legacy persisted defaults to schema v3 (100k / 249k / 399k / 599k / 699k)
  if (rawSchemaVersion < 2) {
    if (defaultExamPriceVnd === 15000) defaultExamPriceVnd = DEFAULT_EXAM_PRICE_VND;
    if (aieoVipPrice === 80000) aieoVipPrice = AIEO_VIP_PRICE_VND;
  }
  if (rawSchemaVersion < 3) {
    if (defaultExamPriceVnd === 20000 || defaultExamPriceVnd === 15000) defaultExamPriceVnd = DEFAULT_EXAM_PRICE_VND;
    if (realExamCombo3Price === 50000) realExamCombo3Price = REAL_EXAM_COMBO_3_PRICE_VND;
    if (realExamCombo5Price === 70000 || realExamCombo5Price === 75000) realExamCombo5Price = REAL_EXAM_COMBO_5_PRICE_VND;
    if (realExamCombo10Price === 150000) realExamCombo10Price = REAL_EXAM_COMBO_10_PRICE_VND;
  }

  const bankCode = String(obj.bankCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20);
  const matchedBank = VIETQR_BANK_OPTIONS.find(b => b.code === bankCode);
  const bankName = String(obj.bankName || matchedBank?.name || '').trim().slice(0, 80);
  const accountNumber = String(obj.accountNumber || '')
    .trim()
    .replace(/\s+/g, '')
    .slice(0, 40);
  const accountName = String(obj.accountName || '').trim().slice(0, 80);
  const paymentNoteHint = String(obj.paymentNoteHint || '').trim().slice(0, 160);

  const rawQr = String(obj.customQrUrl || '').trim();
  const customQrUrl =
    (rawQr.startsWith('data:image/') || rawQr.startsWith('https://') || isSyncMediaUrl(rawQr)) && rawQr.length <= 500_000
      ? rawQr
      : '';

  const rawDonateQr = String(obj.donateQrUrl || '').trim();
  const donateQrUrl =
    (rawDonateQr.startsWith('data:image/') || rawDonateQr.startsWith('https://') || isSyncMediaUrl(rawDonateQr)) && rawDonateQr.length <= 500_000
      ? rawDonateQr
      : '';
  const donateMessage = String(obj.donateMessage || '').trim().slice(0, 240);

  const rawPaidPrices = obj.paidTitlePrices && typeof obj.paidTitlePrices === 'object' ? obj.paidTitlePrices : {};
  const paidTitlePrices = {};
  PAID_SHOP_TITLES.forEach(t => {
    const p = Number(rawPaidPrices[t.id]);
    paidTitlePrices[t.id] =
      Number.isFinite(p) && p >= 0
        ? Math.min(10_000_000, Math.round(p))
        : Number(t.defaultPriceVnd) || 20000;
  });

  return {
    pricingSchemaVersion: 3,
    coverUnlockPrice,
    skillPassPrice,
    defaultExamPriceVnd,
    periodicMockPrice,
    realExamCombo3Price,
    realExamCombo5Price,
    realExamCombo8Price,
    realExamCombo10Price,
    friendRoomTicketPrice,
    aieoVipPrice,
    bankCode,
    bankName,
    accountNumber,
    accountName,
    customQrUrl,
    donateQrUrl,
    donateMessage,
    paymentNoteHint,
    paidTitlePrices
  };
}

export function buildVietQrImageUrl({
  bankCode = '',
  accountNumber = '',
  accountName = '',
  amount = CUSTOM_COVER_UNLOCK_PRICE_VND,
  addInfo = ''
} = {}) {
  const cleanBank = String(bankCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanAccount = String(accountNumber || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanBank || !cleanAccount || cleanAccount.length < 4) return '';
  const parsedAmount =
    amount === '' || amount === null || amount === undefined
      ? CUSTOM_COVER_UNLOCK_PRICE_VND
      : Number(amount);
  const safeAmount =
    Number.isFinite(parsedAmount) && parsedAmount >= 0
      ? Math.min(50_000_000, Math.round(parsedAmount))
      : CUSTOM_COVER_UNLOCK_PRICE_VND;
  const params = new URLSearchParams();
  if (safeAmount > 0) params.set('amount', String(safeAmount));
  if (addInfo) params.set('addInfo', String(addInfo).trim().slice(0, 60));
  if (accountName) params.set('accountName', String(accountName).trim().slice(0, 80));
  const query = params.toString();
  return `https://img.vietqr.io/image/${encodeURIComponent(cleanBank)}-${encodeURIComponent(cleanAccount)}-compact2.png${query ? `?${query}` : ''}`;
}
