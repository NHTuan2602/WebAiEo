import React from 'react';

export default function UserAvatarBadge({
  user,
  sizeClass = 'w-8 h-8',
  textClass = 'text-xs',
  rounded = 'rounded-lg',
  className = ''
}) {
  const initial = user?.name ? user.name[0] : (user?.username ? user.username[0] : 'U');
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`${sizeClass} ${rounded} object-cover border border-white/25 shadow-sm shrink-0 ${className}`}
      />
    );
  }
  return (
    <div className={`${sizeClass} ${rounded} bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center font-bold ${textClass} text-white uppercase shrink-0 ${className}`}>
      {initial}
    </div>
  );
}
