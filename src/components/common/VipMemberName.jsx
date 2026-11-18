import React from 'react';
import { Crown } from 'lucide-react';
import { resolveUserVipNameVisual } from '../../constants/profileCustomization';

export default function VipMemberName({
  user,
  fallbackName = '',
  className = '',
  nameClassName = '',
  badgeSize = 'sm',
  showVipBadge = true
}) {
  const displayName = user?.name || fallbackName || user?.username || '';
  const { showNameColor, nameColorMeta, showVipTag } = resolveUserVipNameVisual(user);

  const badgeCls =
    badgeSize === 'xs'
      ? 'text-xs px-2 py-0.5 gap-1 rounded-full'
      : 'text-xs px-2.5 py-0.5 gap-1 rounded-full';

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap min-w-0 ${className}`}>
      <span
        className={`${nameClassName} ${
          showNameColor ? nameColorMeta.cssClass : ''
        }`}
        style={showNameColor && nameColorMeta.isCustomHex ? { color: nameColorMeta.hex, fontWeight: 900 } : undefined}
      >
        {displayName}
      </span>
      {showVipBadge && showVipTag && (
        <span
          className={`vip-shimmer-badge inline-flex items-center font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white border border-amber-300/80 shadow-xs shrink-0 ${badgeCls}`}
          title="Thành viên Gói Ai eo VIP"
        >
          <Crown className={badgeSize === 'xs' ? 'w-2.5 h-2.5 text-amber-200' : 'w-3 h-3 text-amber-200'} />
          <span>AIEOVIP</span>
        </span>
      )}
    </span>
  );
}
