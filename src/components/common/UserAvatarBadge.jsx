import React from 'react';
import { getAvatarFrameById, hasPaidTitleVisualPerk, hasUnlockedAvatarFrame } from '../../constants/profileCustomization';

export default function UserAvatarBadge({
  user,
  sizeClass = 'w-8 h-8',
  textClass = 'text-xs',
  rounded = 'rounded-lg',
  className = '',
  showFrame = true
}) {
  const initial = user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U');
  const frameAllowed = showFrame && hasUnlockedAvatarFrame(user, user?.avatarFrameId);
  const frameClass = frameAllowed ? (getAvatarFrameById(user?.avatarFrameId)?.ringClass || '') : '';
  const hasVipAura = showFrame && hasPaidTitleVisualPerk(user);
  const auraCls = hasVipAura ? 'vip-avatar-aura ring-2 ring-amber-400 dark:ring-amber-300' : '';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`${sizeClass} aspect-square ${rounded} block object-cover object-center bg-white border border-[#E2E8F0] dark:border-slate-700 shadow-sm shrink-0 overflow-hidden ${frameClass} ${auraCls} ${className}`}
      />
    );
  }
  const fallbackGradient = user?.isSuperAdmin
    ? 'bg-[#334155]'
    : user?.role === 'teacher'
    ? 'bg-[#B45309]'
    : 'bg-[#047857]';
  return (
    <div className={`${sizeClass} ${rounded} ${fallbackGradient} flex items-center justify-center font-black ${textClass} text-white uppercase shadow-sm shrink-0 ${frameClass} ${auraCls} ${className}`}>
      {initial}
    </div>
  );
}
