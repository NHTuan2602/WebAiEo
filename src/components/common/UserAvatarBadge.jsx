import React from 'react';
import { getAvatarFrameById, hasUnlockedAvatarFrame, isStaffOrAdminUser } from '../../constants/profileCustomization';

export default function UserAvatarBadge({
  user,
  sizeClass = 'w-8 h-8',
  textClass = 'text-xs',
  rounded = 'rounded-lg',
  className = '',
  showFrame = true
}) {
  const initial = user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U');
  const isStaff = isStaffOrAdminUser(user);
  const frameAllowed = showFrame && hasUnlockedAvatarFrame(user, user?.avatarFrameId);
  const frameClass = frameAllowed ? (getAvatarFrameById(user?.avatarFrameId)?.ringClass || '') : '';
  const hasVipAura = showFrame && isStaff && Boolean(user?.vipNeonCoverEnabled);
  const auraCls = hasVipAura
    ? (frameClass ? 'vip-avatar-aura' : 'vip-avatar-aura ring-2 ring-amber-400 dark:ring-amber-300')
    : '';
  const defaultBorderCls = !frameClass && !auraCls ? 'border border-[#E2E8F0] dark:border-zinc-700 shadow-none' : '';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        data-avatar-badge="true"
        className={`vip-avatar-badge ${sizeClass} aspect-square ${rounded} block object-cover object-center bg-white ${defaultBorderCls} shrink-0 overflow-hidden ${frameClass} ${auraCls} ${className}`}
      />
    );
  }
  const fallbackGradient = user?.isSuperAdmin
    ? 'bg-zinc-700 dark:bg-[#27272A]'
    : user?.role === 'teacher'
    ? 'bg-[#B45309]'
    : 'bg-[#047857]';
  return (
    <div
      data-avatar-badge="true"
      className={`vip-avatar-badge ${sizeClass} aspect-square ${rounded} ${fallbackGradient} ${defaultBorderCls} flex items-center justify-center font-black ${textClass} text-white uppercase shrink-0 ${frameClass} ${auraCls} ${className}`}
    >
      {initial}
    </div>
  );
}
