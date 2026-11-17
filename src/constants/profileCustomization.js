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
    previewBg: 'bg-slate-200 dark:bg-slate-700'
  },
  {
    id: 'teal_glow',
    name: 'Ngọc Bích',
    ringClass: 'ring-4 ring-[#1EE1D6] shadow-[0_0_20px_rgba(30,225,214,0.45)]',
    previewBg: 'bg-[#1EE1D6]'
  },
  {
    id: 'gold_crown',
    name: 'Hoàng Kim',
    ringClass: 'ring-4 ring-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.55)]',
    previewBg: 'bg-amber-400'
  },
  {
    id: 'sakura_pink',
    name: 'Anh Đào',
    ringClass: 'ring-4 ring-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.5)]',
    previewBg: 'bg-pink-400'
  },
  {
    id: 'nebula_violet',
    name: 'Tím Vũ Trụ',
    ringClass: 'ring-4 ring-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.5)]',
    previewBg: 'bg-violet-400'
  },
  {
    id: 'flame_emerald',
    name: 'Lục Bảo',
    ringClass: 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.45)]',
    previewBg: 'bg-emerald-400'
  }
];

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

export const STUDENT_TITLES = [
  {
    id: 'newbie',
    label: 'Newbie',
    icon: '🌱',
    tier: 'Khởi Đầu',
    difficulty: 'Khởi Đầu',
    conditionText: 'Mặc định mở khóa cho mọi thành viên khi bắt đầu tham gia.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40',
    heroBadgeClass: 'bg-emerald-500/25 text-emerald-100 border-emerald-400/50',
    gameBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/40',
    isUnlocked: () => true,
    getProgress: () => ({ pct: 100, text: 'Mặc định sở hữu' })
  },
  {
    id: 'diligent',
    label: 'Chiến Binh Chăm Chỉ',
    icon: '📚',
    tier: 'Luyện Đề',
    difficulty: 'Cơ Bản',
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
    difficulty: 'Thử Thách',
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
    difficulty: 'Cơ Bản',
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
    difficulty: 'Thử Thách',
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
    id: 'speedster',
    label: 'Tia Chớp Đấu Trường',
    icon: '⚡',
    tier: 'Game',
    difficulty: 'Cơ Bản',
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
    difficulty: 'Thử Thách',
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
    id: 'streak_30d',
    label: 'Kiên Trì 1 Tháng',
    icon: '📅',
    tier: 'Chuyên Cần',
    difficulty: 'Thử Thách',
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
    tier: 'Chuyên Cần',
    difficulty: 'Khó',
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
    id: 'unbroken_streak_30',
    label: 'Ngọn Lửa Bất Diệt 30D',
    icon: '☄️',
    tier: 'Chuyên Cần',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Đăng nhập liên tục 30 ngày liền không bỏ lỡ ngày nào.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-400/60',
    heroBadgeClass: 'bg-rose-500/35 text-rose-100 border-rose-300/70',
    gameBadgeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-500/30 dark:text-rose-100 dark:border-rose-400/60',
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
    tier: 'Chuyên Cần',
    difficulty: 'Cực Khó',
    conditionText: 'CÀY CUỐC CỰC KHÓ: Bền bỉ đăng nhập tích lũy đủ 180 ngày (6 tháng) đồng hành cùng lớp.',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/70',
    heroBadgeClass: 'bg-amber-500/35 text-amber-100 border-amber-300/80',
    gameBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/70',
    isUnlocked: (stats) => stats.totalLoginDays >= 180,
    getProgress: (stats) => ({
      pct: Math.min(100, Math.round((stats.totalLoginDays / 180) * 100)),
      text: `${Math.min(stats.totalLoginDays, 180)}/180 ngày (6 tháng)`
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
  }
];

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
      coveredSkillsCount: 0
    };
  }

  const userAttempts = (Array.isArray(attempts) ? attempts : []).filter(
    a => a && (a.studentId === uname || a.studentUsername === uname)
  );
  let highestBand = 0;
  const coveredSkills = new Set();

  userAttempts.forEach(a => {
    const val = Number(a.overallBand);
    if (!Number.isNaN(val) && val > highestBand) {
      highestBand = val;
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

  return {
    examCount: userAttempts.length,
    highestBand,
    bestGameScore,
    totalLoginDays: loginMetrics.totalLoginDays,
    currentLoginStreak: loginMetrics.currentStreak,
    bestLoginStreak: loginMetrics.bestStreak,
    coveredSkillsCount: coveredSkills.size
  };
}

export function computeStudentTitleProgress(username, attempts = [], roomsDb = {}, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const userObj = 'loginDays' in opts || 'username' in opts ? opts : (opts.user || null);
  const customTitles = Array.isArray(opts.customTitles) ? opts.customTitles : [];
  const unlockAll = Boolean(opts.unlockAll || userObj?.isSuperAdmin || userObj?.isSystemAdmin || username === 'tuanpro123s');
  const grantedSet = new Set(Array.isArray(userObj?.grantedTitleIds) ? userObj.grantedTitleIds.map(String) : []);
  const stats = computeStudentStats(username, attempts, roomsDb, userObj);
  const catalog = getAllCatalogTitles(customTitles);

  const itemsWithProgress = catalog.map(t => {
    const unlockedByGrant = grantedSet.has(t.id);
    const unlockedByMetric = typeof t.isUnlocked === 'function' ? Boolean(t.isUnlocked(stats)) : false;
    const unlocked = unlockAll || unlockedByGrant || unlockedByMetric;
    const progress = typeof t.getProgress === 'function'
      ? t.getProgress(stats)
      : { pct: unlocked ? 100 : 0, text: unlocked ? 'Quản trị trao tặng' : 'Chờ Quản trị trao tặng' };
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
      isCustomTitle: Boolean(t.isCustomTitle),
      colorKey: t.colorKey || 'amber',
      unlocked,
      unlockedByGrant,
      progressPct: unlocked ? 100 : progress.pct,
      progressText: unlockAll
        ? 'Mở khóa tự động (Đặc quyền Quản trị)'
        : unlockedByGrant
        ? '👑 Quản trị trao tặng'
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

export function resolveStudentTitleSummary(user, attempts = [], roomsDb = {}, customTitles = []) {
  if (!user) return null;
  const isSystemAdmin = Boolean(user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s');
  const isTeacher = !isSystemAdmin && user.role === 'teacher';
  const roleBadge = resolveRoleBuiltInTitle(user);

  const progress = computeStudentTitleProgress(user.username, attempts, roomsDb, {
    unlockAll: isSystemAdmin,
    user,
    customTitles
  });

  const preferredId = String(user.equippedTitleId || '').trim();
  const preferred = progress.itemsWithProgress.find(item => item.id === preferredId && item.unlocked);
  const firstGrantedOrUnlocked =
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

export function resolveVisibleTitleBadge(user, attempts = [], roomsDb = {}, customTitles = []) {
  const summary = resolveStudentTitleSummary(user, attempts, roomsDb, customTitles);
  if (!summary) return null;
  if (summary.isHidden) return null;
  return summary.title || null;
}

export const TITLE_DIFFICULTY_RANK = {
  'Đặc Biệt': 6,
  'Cực Khó': 5,
  'Khó': 4,
  'Thử Thách': 3,
  'Cơ Bản': 2,
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

export function hasCustomCoverPermission(user) {
  if (!user || typeof user !== 'object') return false;
  if (user.isSuperAdmin || user.isSystemAdmin || user.username === 'tuanpro123s') return true;
  if (user.role === 'teacher') return true;
  return Boolean(user.customCoverUnlocked);
}

export function formatVndCurrency(amount = CUSTOM_COVER_UNLOCK_PRICE_VND) {
  const num = Number(amount);
  const safe = Number.isFinite(num) && num >= 0 ? Math.round(num) : CUSTOM_COVER_UNLOCK_PRICE_VND;
  return `${safe.toLocaleString('vi-VN')}đ`;
}

export function buildCoverUnlockTransferNote(username = '') {
  const cleaned = String(username || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 24);
  return `MOKHOANEN ${cleaned || 'HOCVIEN'}`;
}

export function normalizePaymentConfig(raw = {}) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const rawPrice = Number(obj.coverUnlockPrice);
  const coverUnlockPrice =
    Number.isFinite(rawPrice) && rawPrice >= 0
      ? Math.min(10_000_000, Math.round(rawPrice))
      : CUSTOM_COVER_UNLOCK_PRICE_VND;

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

  return {
    coverUnlockPrice,
    bankCode,
    bankName,
    accountNumber,
    accountName,
    customQrUrl,
    paymentNoteHint
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
