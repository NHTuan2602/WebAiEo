import React from 'react';
import { CREWMATE_COLORS } from '../../constants/seedData';

export default function AmongUsCrewmate({
  colorId = 'cyan',
  avatarUrl = '',
  size = 56,
  flip = false,
  animate = true
}) {
  const isAvatarSuit = colorId === 'avatar' && Boolean(avatarUrl);
  const palette = isAvatarSuit
    ? { id: 'avatar', label: 'Mặt Avatar', fill: '#4f46e5', shade: '#312e81' }
    : (CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[1]);
  const headDia = Math.round(size * 0.68);

  return (
    <div
      className={`relative inline-flex items-end justify-center shrink-0 ${animate ? 'animate-crewmate-bob' : ''}`}
      style={{ width: size, height: Math.round(size * 1.15) }}
    >
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 64 74"
        className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        {/* Oxygen Backpack */}
        <rect x="6" y="24" width="13" height="27" rx="6" fill={palette.shade} stroke="#0f172a" strokeWidth="3.5" />
        {/* Body Silhouette */}
        <path
          d="M17 24 C17 10, 49 10, 49 24 L49 52 L49 63 C49 67, 45 69, 41 69 C37 69, 36 66, 36 62 L36 55 L29 55 L29 62 C29 66, 27 69, 23 69 C19 69, 17 67, 17 63 Z"
          fill={palette.fill}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Subtle Body Highlight */}
        <path
          d="M22 20 C24 14, 39 14, 43 19"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Visor */}
        <rect x="27" y="19" width="24" height="14" rx="7" fill="#7dd3fc" stroke="#0f172a" strokeWidth="3.2" />
        <ellipse cx="42" cy="23.5" rx="6" ry="2.6" fill="#e0f2fe" opacity="0.9" />
      </svg>

      {/* Avatar Helmet Head Overlay when user selects Avatar Face Suit */}
      {isAvatarSuit && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border-[3px] border-cyan-300 bg-slate-900 shadow-[0_0_14px_rgba(34,211,238,0.65)] pointer-events-none"
          style={{
            width: headDia,
            height: headDia,
            top: -Math.round(headDia * 0.24)
          }}
        >
          <img src={avatarUrl} alt="Avatar nhân vật" className="w-full h-full object-cover" />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
        </div>
      )}
    </div>
  );
}
