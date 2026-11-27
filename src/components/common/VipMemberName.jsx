import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import {
  getPurchasedExamCount,
  isStaffOrAdminUser,
  resolveExamPurchaseTier,
  resolveUserVipNameVisual
} from '../../constants/profileCustomization';
import ExamTierGuideModal from './ExamTierGuideModal';

export default function VipMemberName({
  user,
  fallbackName = '',
  className = '',
  nameClassName = '',
  badgeSize = 'sm',
  showVipBadge = true,
  allowInspectTier = true
}) {
  const [showTierGuide, setShowTierGuide] = useState(false);
  const displayName = user?.name || fallbackName || user?.username || '';
  const { showNameColor, nameColorMeta, showVipTag } = resolveUserVipNameVisual(user);
  const isStaff = isStaffOrAdminUser(user);
  const purchaseTier = resolveExamPurchaseTier(user);
  const purchasedCount = getPurchasedExamCount(user);
  const showExamTier = user?.showExamTierBadge !== false;

  const badgeCls =
    badgeSize === 'xs'
      ? 'text-[11px] px-2 py-0.5 gap-1 rounded-full'
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
      {showVipBadge && purchaseTier && showExamTier && (
        <span
          role={allowInspectTier ? 'button' : undefined}
          tabIndex={allowInspectTier ? 0 : undefined}
          onClick={
            allowInspectTier
              ? e => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowTierGuide(true);
                }
              : undefined
          }
          onKeyDown={
            allowInspectTier
              ? e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowTierGuide(true);
                  }
                }
              : undefined
          }
          className={`inline-flex items-center font-extrabold uppercase tracking-wider border shrink-0 ${
            allowInspectTier ? 'cursor-pointer hover:brightness-110 transition' : ''
          } ${purchaseTier.badgeClass} ${badgeCls}`}
          title={`Hạng ${purchaseTier.label} (${purchasedCount} đề Thực Chiến đã nạp) · Bấm để xem bảng 10 hạng & cách mở khóa`}
        >
          {purchaseTier.showCrown && (
            <Crown className={badgeSize === 'xs' ? 'w-2.5 h-2.5 text-amber-200' : 'w-3 h-3 text-amber-200'} />
          )}
          <span>{purchaseTier.label}</span>
        </span>
      )}
      {showVipBadge && (!purchaseTier || !showExamTier) && isStaff && showVipTag && (
        <span
          className={`vip-paid-badge vip-paid-vip inline-flex items-center font-semibold uppercase tracking-wider bg-[#991B1B] text-[#FFFFFF] border border-[#F59E0B] shrink-0 ${badgeCls}`}
          title="Đặc quyền Quản Trị / Giáo Viên"
        >
          <Crown className={badgeSize === 'xs' ? 'w-2.5 h-2.5 text-amber-300' : 'w-3 h-3 text-amber-300'} />
          <span>{user?.isSuperAdmin || user?.username === 'tuanpro123s' ? 'ADMIN' : 'IMPERIAL'}</span>
        </span>
      )}
      {showTierGuide && (
        <ExamTierGuideModal
          isOpen={showTierGuide}
          user={user}
          onClose={() => setShowTierGuide(false)}
        />
      )}
    </span>
  );
}
