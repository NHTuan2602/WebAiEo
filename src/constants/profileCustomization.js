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

export function hasUnlockedAvatarFrame(user, frameId, nowMs = Date.now()) {
  const frame = AVATAR_FRAMES.find(f => f.id === frameId);
  if (!frame || !frame.vipOnly) return true;
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s' || user.role === 'teacher') {
    return true;
  }
  return Number(user.aieoVipExpiresAt) > nowMs;
}

export function getVietnamDateKey(ts = Date.now()) {
  const num = Number(ts) || Date.now();
  return new Date(num + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

export const STUDENT_TITLES = [
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
    id: 'iron_scholar_50',
    label: 'Đại Học Giả 50 Đề',
    icon: '🔱',
    tier: 'Luyện Đề',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Chinh phục tối thiểu 50 bài thi hoặc bài tập thực hành.',
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
    id: 'band90_god',
    label: 'Tuyệt Đỉnh IELTS 9.0',
    icon: '💠',
    tier: 'Tối Thượng',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Đạt cột mốc điểm tuyệt đối Overall Band 9.0.',
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
    id: 'arena_overlord_5000',
    label: 'Chúa Tể Đấu Trường',
    icon: '🛸',
    tier: 'Game',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Ghi kỷ lục từ 5,000 điểm trở lên trong Game Đấu Trường Từ Vựng.',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400 dark:bg-fuchsia-500/30 dark:text-fuchsia-100 dark:border-fuchsia-400/70',
    heroBadgeClass: 'bg-fuchsia-500/35 text-fuchsia-100 border-fuchsia-300/70',
    gameBadgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-400 dark:bg-fuchsia-500/30 dark:text-fuchsia-100 dark:border-fuchsia-400/70',
    isUnlocked: (stats) => stats.bestGameScore >= 5000,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.bestGameScore / 5000) * 100)),
      text: `${Math.min(stats.bestGameScore, 5000)}/5,000 điểm Game`
    })
  },
  {
    id: 'legend_100',
    label: 'Bất Tử Trăm Đề',
    icon: '🐉',
    tier: 'Luyện Đề',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Hoàn thành tối thiểu 100 bài thi & bài tập IELTS trên hệ thống.',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-500 dark:bg-rose-500/35 dark:text-rose-100 dark:border-rose-400/70',
    heroBadgeClass: 'bg-gradient-to-r from-rose-600/45 to-amber-500/40 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-rose-100 text-rose-950 border-rose-500 dark:bg-rose-500/35 dark:text-rose-100 dark:border-rose-400/70',
    isUnlocked: (stats) => stats.examCount >= 100,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.examCount / 100) * 100)),
      text: `${Math.min(stats.examCount, 100)}/100 bài hoàn thành`
    })
  },
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
  ...HOLIDAY_TITLE_SPECS.map(buildHolidayTitleEntry),
  {
    id: 'vip_thieu_gia',
    label: 'Thiếu Gia Luyện Đề',
    icon: '💰',
    tier: 'Cửa Hàng VIP (1 Tháng)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    defaultPriceVnd: 10000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-emerald-400',
    conditionText: 'Danh hiệu Phú Quý (1 tháng): Sở hữu vòng hào quang Lục Bảo & nổi bật trên Hồ sơ + BXH suốt 30 ngày.',
    badgeClass: 'bg-emerald-100 text-[#09090B] border-emerald-500 font-semibold dark:bg-[#064E3B] dark:text-[#F4F4F5] dark:border-emerald-600',
    heroBadgeClass: 'bg-[#064E3B] text-[#F4F4F5] border-emerald-600 font-semibold',
    gameBadgeClass: 'bg-emerald-100 text-[#09090B] border-emerald-500 font-semibold dark:bg-[#064E3B] dark:text-[#F4F4F5] dark:border-emerald-600',
    isUnlocked: () => false,
    getProgress: (_stats, _user, priceVnd = 10000) => ({
      pct: 0,
      text: `Gói 1 tháng bằng QR: ${Number(priceVnd).toLocaleString('vi-VN')}đ`
    })
  },
  {
    id: 'vip_manh_thuong_quan',
    label: 'Mạnh Thường Quân',
    icon: '🥂',
    tier: 'Cửa Hàng VIP (1 Tháng)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    defaultPriceVnd: 15000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-rose-400',
    conditionText: 'Danh hiệu Phú Quý (1 tháng): Hiệu ứng ánh kim Hồng Ngọc + hào quang Avatar khi đồng hành duy trì server.',
    badgeClass: 'bg-rose-100 text-[#09090B] border-rose-500 font-semibold dark:bg-[#881337] dark:text-[#F4F4F5] dark:border-rose-600',
    heroBadgeClass: 'bg-[#881337] text-[#F4F4F5] border-rose-600 font-semibold',
    gameBadgeClass: 'bg-rose-100 text-[#09090B] border-rose-500 font-semibold dark:bg-[#881337] dark:text-[#F4F4F5] dark:border-rose-600',
    isUnlocked: () => false,
    getProgress: (_stats, _user, priceVnd = 15000) => ({
      pct: 0,
      text: `Gói 1 tháng bằng QR: ${Number(priceVnd).toLocaleString('vi-VN')}đ`
    })
  },
  {
    id: 'vip_dai_gia',
    label: 'Đại Gia IELTS',
    icon: '💸',
    tier: 'Cửa Hàng VIP (1 Tháng)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    defaultPriceVnd: 20000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-amber-400',
    conditionText: 'Danh hiệu Phú Quý (1 tháng): Ánh vàng Hoàng Kim rực sáng kèm hào quang Avatar & huy hiệu ưu tiên trên BXH 30 ngày.',
    badgeClass: 'bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    heroBadgeClass: 'bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    gameBadgeClass: 'bg-[#FBBF24] text-[#09090B] border-[#D97706] font-semibold',
    isUnlocked: () => false,
    getProgress: (_stats, _user, priceVnd = 20000) => ({
      pct: 0,
      text: `Gói 1 tháng bằng QR: ${Number(priceVnd).toLocaleString('vi-VN')}đ`
    })
  },
  {
    id: 'vip_ty_phu',
    label: 'Tỷ Phú Tri Thức',
    icon: '⚜️',
    tier: 'Cửa Hàng VIP (1 Tháng)',
    difficulty: 'Phú Quý',
    isPaidTitle: true,
    defaultPriceVnd: 50000,
    vipHaloClass: 'vip-avatar-aura ring-2 ring-amber-300',
    conditionText: 'Danh hiệu Phú Quý Đỉnh Cao (1 tháng): Ánh kim Vàng Đỏ phát sáng độc tôn + hào quang Avatar & vinh danh VIP trên BXH.',
    badgeClass: 'bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    heroBadgeClass: 'bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    gameBadgeClass: 'bg-[#F59E0B] text-[#09090B] border-[#B45309] font-semibold',
    isUnlocked: () => false,
    getProgress: (_stats, _user, priceVnd = 50000) => ({
      pct: 0,
      text: `Gói 1 tháng bằng QR: ${Number(priceVnd).toLocaleString('vi-VN')}đ`
    })
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
    badgeClass: 'bg-[#991B1B] text-[#FFFFFF] border-[#EF4444] font-semibold',
    heroBadgeClass: 'bg-[#991B1B] text-[#FFFFFF] border-[#EF4444] font-semibold',
    gameBadgeClass: 'bg-[#991B1B] text-[#FFFFFF] border-[#EF4444] font-semibold',
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

export function computeStudentStats(username, attempts = [], roomsDb = {}, user = null) {
  const uname = String(username || '').trim();
  const loginMetrics = computeLoginDayMetrics(user?.loginDays || []);
  if (!uname) {
    return {
      examCount: 0,
      highestBand: 0,
      bestGameScore: 0,
      totalLoginDays: loginMetrics.totalLoginDays,
      currentLoginStreak: loginMetrics.currentStreak,
      bestLoginStreak: loginMetrics.bestStreak,
      coveredSkillsCount: 0,
      band70Count: 0,
      highLrCount: 0,
      hasNightOwlSubmit: false,
      hasEarlyBirdSubmit: false,
      hasPerfectAccuracy: false,
      hasSupporterPerk: false
    };
  }

  const userAttempts = (Array.isArray(attempts) ? attempts : []).filter(
    a => a && (a.studentId === uname || a.studentUsername === uname)
  );
  let highestBand = 0;
  let band70Count = 0;
  let highLrCount = 0;
  let hasNightOwlSubmit = false;
  let hasEarlyBirdSubmit = false;
  let hasPerfectAccuracy = false;
  const coveredSkills = new Set();

  userAttempts.forEach(a => {
    const isApprovedBand =
      a.teacherGraded !== false ||
      (a.testMode === 'single_skill' && (a.focusSkill === 'listening' || a.focusSkill === 'reading'));
    const val = isApprovedBand && typeof a.overallBand === 'number' ? Number(a.overallBand) : NaN;
    if (!Number.isNaN(val) && val > highestBand) {
      highestBand = val;
    }
    if (!Number.isNaN(val) && val >= 7.0) {
      band70Count += 1;
    }
    const lBand = Number(a.scores?.listening?.band);
    const rBand = Number(a.scores?.reading?.band);
    if ((!Number.isNaN(lBand) && lBand >= 7.5) || (!Number.isNaN(rBand) && rBand >= 7.5)) {
      highLrCount += 1;
    }
    const lTotal = Number(a.scores?.listening?.total) || 0;
    const lRaw = Number(a.scores?.listening?.raw) || 0;
    const rTotal = Number(a.scores?.reading?.total) || 0;
    const rRaw = Number(a.scores?.reading?.raw) || 0;
    if ((lTotal >= 5 && lRaw === lTotal) || (rTotal >= 5 && rRaw === rTotal)) {
      hasPerfectAccuracy = true;
    }
    const subMs = Number(a.submittedAtMs);
    if (Number.isFinite(subMs) && subMs > 0) {
      const vnDate = new Date(subMs + 7 * 60 * 60 * 1000);
      const hr = vnDate.getUTCHours();
      const min = vnDate.getUTCMinutes();
      if (hr >= 23 || hr < 4) hasNightOwlSubmit = true;
      if ((hr === 4 && min >= 30) || hr === 5 || (hr === 6 && min <= 30)) hasEarlyBirdSubmit = true;
    }
    const isSingle = a.testMode === 'single_skill' && a.focusSkill;
    if (typeof a.scores?.listening?.band === 'number' || (isSingle && a.focusSkill === 'listening')) {
      coveredSkills.add('listening');
    }
    if (typeof a.scores?.reading?.band === 'number' || (isSingle && a.focusSkill === 'reading')) {
      coveredSkills.add('reading');
    }
    if (
      typeof a.scores?.writing?.overallBand === 'number' ||
      typeof a.scores?.writing?.task1Band === 'number' ||
      typeof a.scores?.writing?.task2Band === 'number' ||
      Boolean(a.answers?.writingTask1 || a.answers?.writingTask2) ||
      (isSingle && a.focusSkill === 'writing')
    ) {
      coveredSkills.add('writing');
    }
    if (typeof a.scores?.speaking?.band === 'number' || (isSingle && a.focusSkill === 'speaking')) {
      coveredSkills.add('speaking');
    }
  });

  let bestGameScore = 0;
  Object.values(roomsDb || {}).forEach(room => {
    const pScore = Number(room?.players?.[uname]?.score) || 0;
    const liveScore = Number(room?.liveMatch?.[uname]?.score) || 0;
    if (pScore > bestGameScore) bestGameScore = pScore;
    if (liveScore > bestGameScore) bestGameScore = liveScore;
  });

  const hasSupporterPerk = Boolean(
    user?.customCoverUnlocked ||
    Number(user?.skillPracticeExpiresAt) > 0 ||
    Number(user?.aieoVipExpiresAt) > 0 ||
    (Array.isArray(user?.purchasedTitleIds) && user.purchasedTitleIds.length > 0)
  );

  return {
    examCount: userAttempts.length,
    highestBand,
    bestGameScore,
    band70Count,
    highLrCount,
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
export const DEFAULT_EXAM_PRICE_VND = 20000; // 1 đề lẻ Thực Chiến Thi Thật: 20.000đ
export const PERIODIC_MOCK_PRICE_VND = 300000; // Mock Test Định Kỳ (3 tháng/lần): 300.000đ
export const REAL_EXAM_COMBO_3_PRICE_VND = 50000; // Combo 3 đề Thực Chiến: 50.000đ
export const REAL_EXAM_COMBO_5_PRICE_VND = 70000; // Combo 5 đề Thực Chiến: 70.000đ
export const REAL_EXAM_COMBO_10_PRICE_VND = 150000; // Combo 10 đề Thực Chiến: 150.000đ
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
    savingNote: 'Tiết kiệm 10.000đ'
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
    savingNote: 'Tiết kiệm 30.000đ'
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
    savingNote: 'Tiết kiệm 50.000đ'
  }
];

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

export function hasActivePaidTitlePermission(user, titleId, nowMs = Date.now()) {
  if (!user || typeof user !== 'object' || !titleId) return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  const grantedArr = Array.isArray(user.grantedTitleIds) ? user.grantedTitleIds.map(String) : [];
  if (grantedArr.includes(String(titleId))) return true;
  if (titleId === 'aieo_vip') {
    return Number(user.aieoVipExpiresAt) > nowMs;
  }
  const purchasedArr = Array.isArray(user.purchasedTitleIds) ? user.purchasedTitleIds.map(String) : [];
  if (!purchasedArr.includes(String(titleId))) return false;
  const exp = Number(user.purchasedTitleExpiries?.[titleId]) || 0;
  return exp > 0 ? exp > nowMs : true;
}

export function hasPaidTitleVisualPerk(user, nowMs = Date.now()) {
  if (!user || typeof user !== 'object') return false;
  const eqId = String(user.equippedTitleId || '').trim();
  const paidIds = new Set(['vip_thieu_gia', 'vip_manh_thuong_quan', 'vip_dai_gia', 'vip_ty_phu', 'aieo_vip']);
  if (paidIds.has(eqId) && hasActivePaidTitlePermission(user, eqId, nowMs)) return true;
  if (Number(user.aieoVipExpiresAt) > nowMs && eqId !== 'newbie' && user.showTitleBadge !== false) return eqId === 'aieo_vip';
  return false;
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
  const vipExpiresAt = Number(user.aieoVipExpiresAt) || 0;
  const hasAieoVip = vipExpiresAt > nowMs;
  const canToggleEffects = hasAieoVip || isSuperAdmin;
  const defaultWhenActive = hasAieoVip;
  const showNameColor = canToggleEffects && (user.vipRedNameEnabled !== undefined ? Boolean(user.vipRedNameEnabled) : defaultWhenActive);
  const nameColorValue = normalizeVipNameColor(user.vipNameColor || 'crimson');
  const nameColorMeta = getVipNameColorMeta(nameColorValue);
  const showVipTag = canToggleEffects && (user.vipTagEnabled !== undefined ? Boolean(user.vipTagEnabled) : defaultWhenActive);
  const defaultNeonWhenActive = hasAieoVip || (isSuperAdmin && Boolean(user.vipRedNameEnabled || user.vipTagEnabled));
  const showNeonCover = canToggleEffects && (user.vipNeonCoverEnabled !== undefined ? Boolean(user.vipNeonCoverEnabled) : defaultNeonWhenActive);
  const neonCoverColor = normalizeVipNeonCoverColor(user.vipNeonCoverColor || 'aurora_rgb');
  const neonCoverMeta = getVipNeonCoverMeta(neonCoverColor);
  return {
    isSuperAdmin,
    hasAieoVip,
    canToggleEffects,
    showRedName: showNameColor,
    showNameColor,
    nameColorValue,
    nameColorMeta,
    showVipTag,
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
  const unlockAll = Boolean(opts.unlockAll || userObj?.isSuperAdmin || userObj?.isSystemAdmin || username === 'tuanpro123s');
  const grantedSet = new Set(Array.isArray(userObj?.grantedTitleIds) ? userObj.grantedTitleIds.map(String) : []);
  const purchasedSet = new Set(Array.isArray(userObj?.purchasedTitleIds) ? userObj.purchasedTitleIds.map(String) : []);
  const purchasedExpiries = userObj?.purchasedTitleExpiries && typeof userObj.purchasedTitleExpiries === 'object'
    ? userObj.purchasedTitleExpiries
    : {};
  const stats = computeStudentStats(username, attempts, roomsDb, userObj);
  const catalog = getAllCatalogTitles(customTitles);

  const itemsWithProgress = catalog.map(t => {
    const unlockedByGrant = grantedSet.has(t.id);
    const hasPurchasedEntry = purchasedSet.has(t.id);
    const purchaseExp = Number(purchasedExpiries[t.id]) || (t.isVipBundleTitle ? Number(userObj?.aieoVipExpiresAt) || 0 : 0);
    const unlockedByPurchase = t.isVipBundleTitle
      ? (Number(userObj?.aieoVipExpiresAt) > nowMs)
      : hasPurchasedEntry && (purchaseExp > 0 ? purchaseExp > nowMs : true);
    const purchaseExpired = Boolean(
      !unlockedByPurchase &&
      !unlockedByGrant &&
      ((hasPurchasedEntry && purchaseExp > 0 && purchaseExp <= nowMs) || (t.isVipBundleTitle && Number(userObj?.aieoVipExpiresAt) > 0 && Number(userObj?.aieoVipExpiresAt) <= nowMs))
    );
    const unlockedByMetric = typeof t.isUnlocked === 'function' ? Boolean(t.isUnlocked(stats, userObj)) : false;
    const unlocked = unlockAll || unlockedByGrant || unlockedByPurchase || unlockedByMetric;
    const priceVnd = (t.isPaidTitle || t.isVipBundleTitle)
      ? (t.isVipBundleTitle ? (Number(paymentConfig?.aieoVipPrice) || AIEO_VIP_PRICE_VND) : getTitlePriceVnd(t, paymentConfig))
      : 0;
    const progress = typeof t.getProgress === 'function'
      ? t.getProgress(stats, userObj, priceVnd)
      : { pct: unlocked ? 100 : 0, text: unlocked ? 'Quản trị trao tặng' : 'Chờ Quản trị trao tặng' };
    const subLeftLabel = purchaseExp > nowMs ? formatRemainingSubscriptionText(purchaseExp, nowMs) : '';
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
      isVipBundleTitle: Boolean(t.isVipBundleTitle),
      isStaffOnly: Boolean(t.isStaffOnly),
      isHolidayTitle: Boolean(t.isHolidayTitle),
      isSecretTitle: Boolean(t.isSecretTitle),
      holidayDateHint: t.holidayDateHint || '',
      priceVnd,
      expiresAt: purchaseExp,
      purchaseExpired,
      colorKey: t.colorKey || 'amber',
      unlocked,
      unlockedByGrant,
      unlockedByPurchase,
      progressPct: unlocked ? 100 : progress.pct,
      progressText: unlockAll
        ? 'Mở khóa tự động (Đặc quyền Quản trị)'
        : unlockedByGrant
        ? '👑 Quản trị trao tặng'
        : unlockedByPurchase
        ? (subLeftLabel ? `💎 Gói 1 tháng (${subLeftLabel})` : '💎 Đã mua mở khóa')
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
  return { stats, unlockedIds, itemsWithProgress };
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

export function resolveStudentTitleSummary(user, attempts = [], roomsDb = {}, customTitles = [], paymentConfig = null) {
  if (!user) return null;
  const isSystemAdmin = Boolean(user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s');
  const isTeacher = !isSystemAdmin && user.role === 'teacher';
  const roleBadge = resolveRoleBuiltInTitle(user);

  const progress = computeStudentTitleProgress(user.username, attempts, roomsDb, {
    unlockAll: isSystemAdmin,
    user,
    customTitles,
    paymentConfig
  });

  const preferredId = String(user.equippedTitleId || '').trim();
  const preferred = progress.itemsWithProgress.find(item => item.id === preferredId && item.unlocked);
  const staffDefault = (isSystemAdmin || isTeacher)
    ? progress.itemsWithProgress.find(item => item.id === 'staff_ielts_10' && item.unlocked)
    : null;
  const firstGrantedOrUnlocked =
    staffDefault ||
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

export function resolveVisibleTitleBadge(user, attempts = [], roomsDb = {}, customTitles = [], paymentConfig = null) {
  const summary = resolveStudentTitleSummary(user, attempts, roomsDb, customTitles, paymentConfig);
  if (!summary) return null;
  if (summary.isHidden) return null;
  return summary.title || null;
}

export const TITLE_DIFFICULTY_RANK = {
  'VIP Độc Quyền': 9,
  'Độc Quyền': 8,
  'Phú Quý': 7,
  'Đặc Biệt': 7,
  'Bí Ẩn': 6,
  'Cực Khó': 5,
  'Lễ Hội': 4,
  'Khó': 4,
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
  hasLocalBaseline = false
}) {
  if (!user || !titleSummary || titleSummary.isSystemAdmin) {
    return { shouldPersistBaseline: false, baselineToSave: null, newlyUnlockedItems: [] };
  }
  const unlockedIds = Array.isArray(titleSummary.unlockedIds) ? titleSummary.unlockedIds : [];
  const serverAck = Array.isArray(user.acknowledgedTitleIds) ? user.acknowledgedTitleIds : null;
  const localAck = Array.isArray(localAcknowledgedIds) ? localAcknowledgedIds : [];
  const hasBaseline = serverAck !== null || Boolean(hasLocalBaseline);

  if (!hasBaseline) {
    const seedIds = unlockedIds.length > 0 ? unlockedIds : ['newbie'];
    return {
      shouldPersistBaseline: true,
      baselineToSave: seedIds,
      newlyUnlockedItems: []
    };
  }

  const seenSet = new Set([...(serverAck || []), ...localAck, 'newbie']);
  const freshItems = (titleSummary.itemsWithProgress || []).filter(
    item => item && item.unlocked && !seenSet.has(item.id)
  );
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
export const VIP_ANIMATED_AVATAR_MAX_DATA_URL_LENGTH = 1_500_000;

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

export function isAnimatedDataUrl(rawUrl) {
  const str = String(rawUrl || '').trim();
  if (!str) return false;
  if (/^data:image\/(gif|apng);/i.test(str)) return true;
  if (/^https:\/\/.+\.(gif|apng)([?#].*)?$/i.test(str)) return true;
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
  const realExamCombo3Price = clampVnd(obj.realExamCombo3Price ?? obj.combo3ExamPriceVnd, REAL_EXAM_COMBO_3_PRICE_VND);
  const realExamCombo5Price = clampVnd(obj.realExamCombo5Price ?? obj.combo5ExamPriceVnd, REAL_EXAM_COMBO_5_PRICE_VND);
  const realExamCombo10Price = clampVnd(obj.realExamCombo10Price ?? obj.combo10ExamPriceVnd, REAL_EXAM_COMBO_10_PRICE_VND);
  const friendRoomTicketPrice = clampVnd(obj.friendRoomTicketPrice, FRIEND_ROOM_TICKET_PRICE_VND);
  let aieoVipPrice = clampVnd(obj.aieoVipPrice, AIEO_VIP_PRICE_VND);

  // Auto-migrate legacy persisted defaults (15k single test -> 20k, 80k VIP -> 20k) once
  if (rawSchemaVersion < 2) {
    if (defaultExamPriceVnd === 15000) defaultExamPriceVnd = DEFAULT_EXAM_PRICE_VND;
    if (aieoVipPrice === 80000) aieoVipPrice = AIEO_VIP_PRICE_VND;
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
    (rawQr.startsWith('data:image/') || rawQr.startsWith('https://')) && rawQr.length <= 500_000
      ? rawQr
      : '';

  const rawDonateQr = String(obj.donateQrUrl || '').trim();
  const donateQrUrl =
    (rawDonateQr.startsWith('data:image/') || rawDonateQr.startsWith('https://')) && rawDonateQr.length <= 500_000
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
    pricingSchemaVersion: 2,
    coverUnlockPrice,
    skillPassPrice,
    defaultExamPriceVnd,
    periodicMockPrice,
    realExamCombo3Price,
    realExamCombo5Price,
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
  const safeAmount = Math.max(0, Math.round(Number(amount) || CUSTOM_COVER_UNLOCK_PRICE_VND));
  const params = new URLSearchParams();
  if (safeAmount > 0) params.set('amount', String(safeAmount));
  if (addInfo) params.set('addInfo', String(addInfo).trim().slice(0, 60));
  if (accountName) params.set('accountName', String(accountName).trim().slice(0, 80));
  const query = params.toString();
  return `https://img.vietqr.io/image/${encodeURIComponent(cleanBank)}-${encodeURIComponent(cleanAccount)}-compact2.png${query ? `?${query}` : ''}`;
}
