import { Crown } from 'lucide-react';
import UserAvatarBadge from './UserAvatarBadge';
import VipMemberName from './VipMemberName';
import { resolveUserVipNameVisual } from '../../constants/profileCustomization';

export default function VerticalPodiumLeaderboard({
  items = [],
  compact = false,
  maxHeightClass = '',
  accentTheme = 'amber'
}) {
  const topItems = Array.isArray(items) ? items.slice(0, 10) : [];
  if (topItems.length === 0) return null;

  const podiumItems = topItems.slice(0, 3);
  const listItems = topItems.slice(3, 10);

  const podiumGridClass =
    podiumItems.length === 1
      ? 'grid grid-cols-1 max-w-sm mx-auto w-full'
      : podiumItems.length === 2
      ? 'grid grid-cols-2 gap-2 sm:gap-3 items-end'
      : 'grid grid-cols-3 gap-2 sm:gap-3.5 items-end';

  const scoreAccentCls =
    accentTheme === 'teal'
      ? 'text-[#007A7A] dark:text-[#1EE1D6]'
      : 'text-amber-700 dark:text-amber-300';

  return (
    <div className={`space-y-3 ${maxHeightClass}`.trim()}>
      {/* Top 1 - Top 3 Podium Row */}
      <div data-testid="leaderboard-podium-row" className={podiumGridClass}>
        {podiumItems.map((item, idx) => {
          const rank = idx + 1;
          const isFirst = rank === 1;
          const isSecond = rank === 2;
          const vipVisual = resolveUserVipNameVisual(item.userObj);

          const orderClass =
            podiumItems.length === 3
              ? isFirst
                ? 'order-2'
                : isSecond
                ? 'order-1'
                : 'order-3'
              : '';

          const cardThemeClass = isFirst
            ? 'bg-gradient-to-b from-amber-50 via-white to-amber-50/40 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-950 border-2 border-amber-400 dark:border-amber-400/80 shadow-md shadow-amber-500/10'
            : isSecond
            ? 'bg-gradient-to-b from-slate-100/90 to-white dark:from-slate-400/15 dark:to-slate-900/95 border border-slate-300 dark:border-slate-500/60 shadow-xs'
            : 'bg-gradient-to-b from-orange-50/90 to-white dark:from-orange-500/15 dark:to-slate-900/95 border border-orange-300 dark:border-orange-500/50 shadow-xs';

          const paddingClass = isFirst
            ? compact
              ? 'px-2 py-3 sm:px-3 sm:py-4'
              : 'px-2.5 py-3.5 sm:px-4 sm:py-5'
            : compact
            ? 'px-2 py-2.5 sm:p-3'
            : 'px-2 py-3 sm:p-3.5';

          const selfRingClass = item.isMe ? 'ring-2 ring-[#007A7A] dark:ring-cyan-400' : '';

          const cardInner = (
            <div
              data-leaderboard-rank={rank}
              className={`min-w-0 overflow-hidden flex flex-col items-center text-center transition-all ${
                vipVisual.showNeonCover
                  ? 'rounded-[14px] bg-white/95 dark:bg-slate-900'
                  : `rounded-2xl ${cardThemeClass}`
              } ${paddingClass} ${selfRingClass}`}
            >
              {isFirst ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs mb-2">
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>TOP 1</span>
                </span>
              ) : isSecond ? (
                <span className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full mb-2">
                  <span>🥈 TOP 2</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-orange-200/90 dark:bg-orange-500/25 text-orange-950 dark:text-orange-200 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full mb-2">
                  <span>🥉 TOP 3</span>
                </span>
              )}

              <UserAvatarBadge
                user={item.userObj}
                sizeClass={
                  isFirst
                    ? compact
                      ? 'w-11 h-11 sm:w-14 sm:h-14'
                      : 'w-12 h-12 sm:w-16 sm:h-16'
                    : compact
                    ? 'w-9 h-9 sm:w-11 sm:h-11'
                    : 'w-10 h-10 sm:w-12 sm:h-12'
                }
                textClass={isFirst ? 'text-sm sm:text-lg' : 'text-xs sm:text-sm'}
                rounded={isFirst ? 'rounded-2xl' : 'rounded-xl'}
              />

              <div className="w-full min-w-0 mt-2 flex items-center justify-center gap-1 flex-wrap">
                <VipMemberName
                  user={item.userObj}
                  fallbackName={item.name}
                  badgeSize="xs"
                  className="truncate max-w-full text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white"
                />
                {item.isMe && (
                  <span className="text-[10px] sm:text-xs font-extrabold text-[#007A7A] dark:text-cyan-300 shrink-0">
                    (Bạn)
                  </span>
                )}
                {item.extraBadges}
              </div>

              {item.subtitle && (
                <p className="text-[10px] sm:text-xs text-[#475569] dark:text-slate-400 truncate max-w-full mt-0.5">
                  {item.subtitle}
                </p>
              )}

              <span
                className={
                  isFirst
                    ? `text-sm sm:text-xl font-mono font-black tabular-nums mt-1 ${
                        accentTheme === 'teal' ? scoreAccentCls : 'text-amber-600 dark:text-amber-300'
                      }`
                    : isSecond
                    ? `text-xs sm:text-lg font-mono font-black tabular-nums mt-1 ${
                        accentTheme === 'teal' ? scoreAccentCls : 'text-slate-700 dark:text-slate-200'
                      }`
                    : `text-xs sm:text-lg font-mono font-black tabular-nums mt-1 ${
                        accentTheme === 'teal' ? scoreAccentCls : 'text-orange-700 dark:text-orange-300'
                      }`
                }
              >
                {item.scoreText}
              </span>
            </div>
          );

          if (vipVisual.showNeonCover) {
            return (
              <div
                key={item.key || idx}
                className={`min-w-0 rounded-2xl p-[2px] transition-all ${orderClass} ${vipVisual.neonCoverMeta.cardRimWrapClass}`}
              >
                {cardInner}
              </div>
            );
          }

          return (
            <div key={item.key || idx} className={`min-w-0 ${orderClass}`}>
              {cardInner}
            </div>
          );
        })}
      </div>

      {/* Top 4 - Top 10 Vertical Rows */}
      {listItems.length > 0 && (
        <div data-testid="leaderboard-vertical-list" className="flex flex-col gap-2">
          {listItems.map((item, idx) => {
            const rank = idx + 4;
            const vipVisual = resolveUserVipNameVisual(item.userObj);

            const rowContent = (
              <div
                data-leaderboard-rank={rank}
                className={`w-full min-w-0 flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs transition ${
                  vipVisual.showNeonCover
                    ? 'rounded-[10px] bg-white dark:bg-slate-900'
                    : item.isMe
                    ? 'rounded-xl border bg-[#EDFFFD] dark:bg-cyan-500/15 border-[#007A7A]/60 dark:border-cyan-400/60'
                    : 'rounded-xl border bg-slate-50/90 dark:bg-slate-900/75 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-7 sm:w-9 sm:h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-[#334155] dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                    #{rank}
                  </span>
                  <UserAvatarBadge
                    user={item.userObj}
                    sizeClass="w-8 h-8"
                    textClass="text-xs"
                    rounded="rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[#0F172B] dark:text-white truncate flex items-center gap-1.5 flex-wrap">
                      <VipMemberName
                        user={item.userObj}
                        fallbackName={item.name}
                        badgeSize="xs"
                      />
                      {item.isMe && (
                        <span className="text-[11px] font-bold text-[#007A7A] dark:text-cyan-300 shrink-0">
                          (Bạn)
                        </span>
                      )}
                      {item.extraBadges}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-[#475569] dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`font-mono font-black text-sm tabular-nums ${scoreAccentCls}`}>
                    {item.scoreText}
                  </span>
                </div>
              </div>
            );

            if (vipVisual.showNeonCover) {
              return (
                <div
                  key={item.key || rank}
                  className={`rounded-xl p-[2px] transition-all ${vipVisual.neonCoverMeta.cardRimWrapClass}`}
                >
                  {rowContent}
                </div>
              );
            }

            return <div key={item.key || rank}>{rowContent}</div>;
          })}
        </div>
      )}
    </div>
  );
}
