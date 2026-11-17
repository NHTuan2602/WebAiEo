import React from 'react';
import { getAvatarFrameById } from '../../constants/profileCustomization';

export default function UserAvatarBadge({
  user,
  sizeClass = 'w-8 h-8',
  textClass = 'text-xs',
  rounded = 'rounded-lg',
  className = '',
  showFrame = true
}) {
  const initial = user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U');
  const frameClass = showFrame ? (getAvatarFrameById(user?.avatarFrameId)?.ringClass || '') : '';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`${sizeClass} ${rounded} object-cover bg-white border border-pink-200/80 dark:border-slate-700 shadow-sm shrink-0 ${frameClass} ${className}`}
      />
    );
  }
  const fallbackGradient = user?.isSuperAdmin
    ? 'bg-gradient-to-tr from-purple-600 to-amber-500'
    : user?.role === 'teacher'
    ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
    : 'bg-gradient-to-tr from-[#007A7A] to-teal-500';
  return (
    <div className={`${sizeClass} ${rounded} ${fallbackGradient} flex items-center justify-center font-black ${textClass} text-white uppercase shadow-sm shrink-0 ${frameClass} ${className}`}>
      {initial}
    </div>
  );
}
