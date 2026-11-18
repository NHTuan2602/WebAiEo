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
  const auraCls = !frameClass && hasVipAura ? 'border-2 border-amber-500 dark:border-amber-400' : '';
  const defaultBorderCls = !frameClass && !auraCls ? 'border border-[#E2E8F0] dark:border-zinc-700' : '';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`${sizeClass} aspect-square ${rounded} block object-cover object-center bg-white ${defaultBorderCls} shrink-0 overflow-hidden shadow-none ${frameClass} ${auraCls} ${className}`}
      />
    );
  }
  const fallbackGradient = user?.isSuperAdmin
    ? 'bg-zinc-700 dark:bg-[#27272A]'
    : user?.role === 'teacher'
    ? 'bg-[#B45309]'
    : 'bg-[#047857]';
  return (
    <div className={`${sizeClass} ${rounded} ${fallbackGradient} ${defaultBorderCls} flex items-center justify-center font-black ${textClass} text-white uppercase shrink-0 shadow-none ${frameClass} ${auraCls} ${className}`}>
      {initial}
    </div>
  );
}
