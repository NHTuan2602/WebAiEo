// ==========================================
// PROFILE CUSTOMIZATION & STUDENT TITLES ("DANH HIỆU")
// Pure helper module shared across UI & tests (no React/DOM deps)
// ==========================================

export const PROFILE_BANNERS = [
  {
    id: 'ocean',
    name: 'Đại Dương Nha Trang',
    desc: 'Gradient xanh ngọc lam sâu lắng mặc định',
    heroClass: 'bg-gradient-to-r from-[#0F172B] via-[#003538] to-[#065B5B]',
    previewClass: 'bg-gradient-to-r from-[#0F172B] via-[#003538] to-[#065B5B]'
  },
  {
    id: 'aurora',
    name: 'Cực Quang Tím Ngọc',
    desc: 'Ánh sáng tím huyền ảo hòa quyện ngọc lam',
    heroClass: 'bg-gradient-to-r from-[#1E1B4B] via-[#4C1D95] to-[#0F766E]',
    previewClass: 'bg-gradient-to-r from-[#1E1B4B] via-[#4C1D95] to-[#0F766E]'
  },
  {
    id: 'sakura',
    name: 'Anh Đào Hoàng Hôn',
    desc: 'Sắc hồng rượu vang ấm áp và nổi bật',
    heroClass: 'bg-gradient-to-r from-[#4C0519] via-[#9D174D] to-[#701A75]',
    previewClass: 'bg-gradient-to-r from-[#4C0519] via-[#9D174D] to-[#701A75]'
  },
  {
    id: 'cosmos',
    name: 'Đấu Trường Vũ Trụ',
    desc: 'Không gian thiên hà xanh thẫm tràn đầy năng lượng',
    heroClass: 'bg-gradient-to-r from-[#06091A] via-[#1E3A8A] to-[#4338CA]',
    previewClass: 'bg-gradient-to-r from-[#06091A] via-[#1E3A8A] to-[#4338CA]'
  },
  {
    id: 'sunset',
    name: 'Nắng Vàng Rực Rỡ',
    desc: 'Tông cam hổ phách truyền cảm hứng bứt phá',
    heroClass: 'bg-gradient-to-r from-[#451A03] via-[#9A3412] to-[#B45309]',
    previewClass: 'bg-gradient-to-r from-[#451A03] via-[#9A3412] to-[#B45309]'
  },
  {
    id: 'emerald',
    name: 'Rừng Ngọc Lục Bảo',
    desc: 'Tông xanh lá học thuật thanh lịch & tập trung',
    heroClass: 'bg-gradient-to-r from-[#022C22] via-[#065F46] to-[#0F766E]',
    previewClass: 'bg-gradient-to-r from-[#022C22] via-[#065F46] to-[#0F766E]'
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

export const STUDENT_TITLES = [
  {
    id: 'newbie',
    label: 'Newbie',
    icon: '🌱',
    tier: 'Khởi Đầu',
    conditionText: 'Mặc định mở khóa cho mọi học viên khi bắt đầu học.',
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
  }
];

export function getProfileBannerById(bannerId) {
  return PROFILE_BANNERS.find(b => b.id === bannerId) || PROFILE_BANNERS[0];
}

export function getAvatarFrameById(frameId) {
  return AVATAR_FRAMES.find(f => f.id === frameId) || AVATAR_FRAMES[0];
}

export function computeStudentStats(username, attempts = [], roomsDb = {}) {
  const uname = String(username || '').trim();
  if (!uname) {
    return { examCount: 0, highestBand: 0, bestGameScore: 0 };
  }

  const userAttempts = (Array.isArray(attempts) ? attempts : []).filter(
    a => a && (a.studentId === uname || a.studentUsername === uname)
  );
  let highestBand = 0;
  userAttempts.forEach(a => {
    const val = Number(a.overallBand);
    if (!Number.isNaN(val) && val > highestBand) {
      highestBand = val;
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
    bestGameScore
  };
}

export function computeStudentTitleProgress(username, attempts = [], roomsDb = {}) {
  const stats = computeStudentStats(username, attempts, roomsDb);
  const itemsWithProgress = STUDENT_TITLES.map(t => {
    const unlocked = Boolean(t.isUnlocked(stats));
    const progress = t.getProgress(stats);
    return {
      id: t.id,
      label: t.label,
      icon: t.icon,
      tier: t.tier,
      conditionText: t.conditionText,
      badgeClass: t.badgeClass,
      heroBadgeClass: t.heroBadgeClass,
      gameBadgeClass: t.gameBadgeClass,
      unlocked,
      progressPct: unlocked ? 100 : progress.pct,
      progressText: unlocked ? 'Đã mở khóa' : progress.text
    };
  });
  const unlockedIds = itemsWithProgress.filter(i => i.unlocked).map(i => i.id);
  return { stats, unlockedIds, itemsWithProgress };
}

export function resolveRoleBuiltInTitle(user) {
  if (!user) return null;
  if (user.isSuperAdmin || user.username === 'tuanpro123s') {
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

export function resolveStudentTitleSummary(user, attempts = [], roomsDb = {}) {
  if (!user) return null;
  const builtIn = resolveRoleBuiltInTitle(user);
  if (builtIn) {
    return {
      isRoleBuiltIn: true,
      isHidden: false,
      title: builtIn,
      stats: null,
      unlockedIds: [builtIn.id],
      itemsWithProgress: []
    };
  }

  const progress = computeStudentTitleProgress(user.username, attempts, roomsDb);
  const preferredId = String(user.equippedTitleId || 'newbie').trim();
  const preferred = progress.itemsWithProgress.find(item => item.id === preferredId && item.unlocked);
  const activeTitle = preferred || progress.itemsWithProgress[0];
  const isHidden = user.showTitleBadge === false;

  return {
    isRoleBuiltIn: false,
    isHidden,
    title: activeTitle,
    ...progress
  };
}

export function resolveVisibleTitleBadge(user, attempts = [], roomsDb = {}) {
  const summary = resolveStudentTitleSummary(user, attempts, roomsDb);
  if (!summary) return null;
  if (!summary.isRoleBuiltIn && summary.isHidden) return null;
  return summary.title || null;
}
