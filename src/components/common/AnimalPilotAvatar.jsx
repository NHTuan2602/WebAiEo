import React from 'react';
import {
  ANIMAL_CHARACTERS,
  CREWMATE_COLORS,
  normalizeAccessoryId,
  normalizeAnimalId
} from '../../constants/seedData';

function AnimalEarsSvg({ animalId, species }) {
  if (animalId === 'lion') {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const ang = (i * Math.PI) / 10;
      const rad = i % 2 === 0 ? 33 : 27;
      pts.push(`${(Math.cos(ang) * rad).toFixed(1)},${(Math.sin(ang) * rad - 5).toFixed(1)}`);
    }
    return <polygon points={pts.join(' ')} fill={species.accent} stroke="#0f172a" strokeWidth="3.2" strokeLinejoin="round" />;
  }

  if (animalId === 'bunny') {
    return (
      <g>
        {[-1, 1].map(dir => (
          <g key={dir} transform={`translate(${dir * 11}, -26) rotate(${dir * 10})`}>
            <ellipse cx="0" cy="-12" rx="7.5" ry="17" fill={species.body} stroke="#0f172a" strokeWidth="3.2" />
            <ellipse cx="0" cy="-11" rx="3.8" ry="11.5" fill={species.innerEar} />
          </g>
        ))}
      </g>
    );
  }

  if (animalId === 'panda') {
    return (
      <g>
        {[-1, 1].map(dir => (
          <circle key={dir} cx={dir * 19} cy="-23" r="9" fill="#0f172a" stroke="#0f172a" strokeWidth="2.5" />
        ))}
      </g>
    );
  }

  if (animalId === 'frog') {
    return (
      <g>
        {[-1, 1].map(dir => (
          <circle key={dir} cx={dir * 13} cy="-25" r="9.5" fill={species.body} stroke="#0f172a" strokeWidth="3.2" />
        ))}
      </g>
    );
  }

  if (animalId === 'cat' || animalId === 'shiba' || animalId === 'fox') {
    const earFill = animalId === 'fox' ? '#991b1b' : species.body;
    return (
      <g>
        {[-1, 1].map(dir => (
          <g key={dir}>
            <polygon
              points={`${dir * 7},-24 ${dir * 23},-36 ${dir * 24},-13`}
              fill={earFill}
              stroke="#0f172a"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <polygon
              points={`${dir * 10.5},-23 ${dir * 20.5},-31 ${dir * 21},-16`}
              fill={species.innerEar}
            />
          </g>
        ))}
      </g>
    );
  }

  return null;
}

function AnimalFaceSvg({ animalId, species, isAvatarMode }) {
  if (isAvatarMode) return null;

  return (
    <g>
      {animalId === 'shiba' && (
        <>
          <ellipse cx="0" cy="3" rx="20" ry="14" fill={species.belly} />
          <ellipse cx="-9" cy="-13" rx="3.6" ry="2.2" fill={species.belly} transform="rotate(-12 -9 -13)" />
          <ellipse cx="9" cy="-13" rx="3.6" ry="2.2" fill={species.belly} transform="rotate(12 9 -13)" />
        </>
      )}
      {animalId === 'fox' && (
        <>
          <ellipse cx="-12" cy="3" rx="12" ry="9.5" fill={species.belly} transform="rotate(14 -12 3)" />
          <ellipse cx="12" cy="3" rx="12" ry="9.5" fill={species.belly} transform="rotate(-14 12 3)" />
        </>
      )}
      {animalId === 'penguin' && (
        <>
          <ellipse cx="-6.5" cy="-1" rx="11.5" ry="14" fill="#f8fafc" />
          <ellipse cx="6.5" cy="-1" rx="11.5" ry="14" fill="#f8fafc" />
        </>
      )}
      {(animalId === 'cat' || animalId === 'bunny' || animalId === 'lion') && (
        <ellipse cx="0" cy="4" rx="11.5" ry="7.5" fill={species.belly} />
      )}
      {animalId === 'frog' && <ellipse cx="0" cy="3" rx="17" ry="9.5" fill={species.belly} />}
      {animalId === 'panda' && (
        <>
          <ellipse cx="-9.5" cy="-6" rx="6.2" ry="7.2" fill="#1e293b" transform="rotate(18 -9.5 -6)" />
          <ellipse cx="9.5" cy="-6" rx="6.2" ry="7.2" fill="#1e293b" transform="rotate(-18 9.5 -6)" />
        </>
      )}

      {/* Eyes */}
      {animalId === 'frog' ? (
        <g>
          {[-1, 1].map(dir => (
            <g key={dir}>
              <circle cx={dir * 13} cy="-25" r="6" fill="#ffffff" />
              <circle cx={dir * 13} cy="-25" r="3.6" fill="#0f172a" />
              <circle cx={dir * 13 - 1.2} cy="-26.4" r="1.4" fill="#ffffff" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {[-1, 1].map(dir => (
            <g key={dir}>
              <circle cx={dir * 9.5} cy="-6" r="3.6" fill="#0f172a" />
              <circle cx={dir * 9.5 - 1.2} cy="-7.2" r="1.3" fill="#ffffff" />
            </g>
          ))}
        </g>
      )}

      {/* Cheeks */}
      <ellipse cx="-15" cy="1" rx="4.2" ry="2.6" fill="#f472b6" opacity="0.52" />
      <ellipse cx="15" cy="1" rx="4.2" ry="2.6" fill="#f472b6" opacity="0.52" />

      {/* Nose & Mouth */}
      {animalId === 'penguin' ? (
        <polygon points="-5,-1 5,-1 0,6" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.2" strokeLinejoin="round" />
      ) : animalId === 'frog' ? (
        <path d="M -8,1 Q 0,9 8,1" fill="none" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <g>
          <ellipse cx="0" cy="0.5" rx="3.4" ry="2.3" fill={animalId === 'bunny' ? '#f43f5e' : '#0f172a'} />
          <path d="M -5,4 Q -2.5,7 0,4 Q 2.5,7 5,4" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* Cat Whiskers */}
      {animalId === 'cat' && (
        <g stroke="#431407" strokeWidth="1.6" strokeLinecap="round">
          <line x1="-16" y1="0" x2="-27" y2="-2" />
          <line x1="-16" y1="3.5" x2="-27" y2="5" />
          <line x1="16" y1="0" x2="27" y2="-2" />
          <line x1="16" y1="3.5" x2="27" y2="5" />
        </g>
      )}
    </g>
  );
}

function AnimalAccessorySvg({ accessoryId }) {
  if (accessoryId === 'glasses') {
    return (
      <g>
        <rect x="-16.5" y="-11" width="13.5" height="8" rx="2.5" fill="#0f172a" stroke="#f8fafc" strokeWidth="1.6" />
        <rect x="3" y="-11" width="13.5" height="8" rx="2.5" fill="#0f172a" stroke="#f8fafc" strokeWidth="1.6" />
        <line x1="-3" y1="-7.5" x2="3" y2="-7.5" stroke="#0f172a" strokeWidth="2.8" />
        <line x1="-13" y1="-9" x2="-9.5" y2="-5.2" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
        <line x1="6.5" y1="-9" x2="10" y2="-5.2" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
      </g>
    );
  }

  if (accessoryId === 'headphones') {
    return (
      <g>
        <path d="M -26,-5 A 26,26 0 0,1 26,-5" fill="none" stroke="#22d3ee" strokeWidth="4.6" strokeLinecap="round" />
        <rect x="-30" y="-11" width="9" height="15" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2.4" />
        <rect x="21" y="-11" width="9" height="15" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2.4" />
      </g>
    );
  }

  if (accessoryId === 'crown') {
    return (
      <g>
        <polygon
          points="-12,-24 -14,-37 -5.5,-30 0,-40 5.5,-30 14,-37 12,-24"
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-28.5" r="2.5" fill="#ef4444" />
      </g>
    );
  }

  if (accessoryId === 'grad_cap') {
    return (
      <g>
        <rect x="-11.5" y="-30" width="23" height="8" rx="2" fill="#1e293b" stroke="#020617" strokeWidth="2.2" />
        <polygon points="0,-40 22,-32 0,-24 -22,-32" fill="#1e293b" stroke="#020617" strokeWidth="2.2" strokeLinejoin="round" />
        <polyline points="0,-32 17,-28 18,-17" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="18" cy="-16" r="2.6" fill="#facc15" />
      </g>
    );
  }

  if (accessoryId === 'bow') {
    return (
      <g transform="translate(12, -23) rotate(18)">
        <polygon points="0,0 -9,-5.5 -9,5.5" fill="#ec4899" stroke="#831843" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 9,-5.5 9,5.5" fill="#ec4899" stroke="#831843" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="0" cy="0" r="3" fill="#fbcfe8" stroke="#831843" strokeWidth="1.8" />
      </g>
    );
  }

  if (accessoryId === 'halo') {
    return <ellipse cx="0" cy="-37" rx="16" ry="5" fill="none" stroke="#fde047" strokeWidth="4" />;
  }

  if (accessoryId === 'helmet') {
    return (
      <g>
        <circle cx="0" cy="-5" r="31" fill="rgba(125, 211, 252, 0.16)" stroke="#e0f2fe" strokeWidth="3.2" />
        <path d="M -21,-17 A 24,24 0 0,1 -6,-28" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.8" strokeLinecap="round" />
      </g>
    );
  }

  return null;
}

export default function AnimalPilotAvatar({
  animalId = 'cat',
  accessoryId = 'none',
  colorId = 'cyan',
  avatarUrl = '',
  size = 56,
  flip = false,
  animate = true,
  onShip = false
}) {
  const safeAnimal = normalizeAnimalId(animalId);
  const safeAcc = normalizeAccessoryId(accessoryId);
  const species = ANIMAL_CHARACTERS.find(a => a.id === safeAnimal) || ANIMAL_CHARACTERS[0];
  const isAvatarMode = colorId === 'avatar' && Boolean(avatarUrl);
  const palette = isAvatarMode
    ? { id: 'avatar', label: 'Mặt Avatar', fill: '#4f46e5', shade: '#312e81' }
    : (CREWMATE_COLORS.find(c => c.id === colorId) || CREWMATE_COLORS[1]);

  const widthPx = onShip ? Math.round(size * 1.25) : size;
  const heightPx = onShip ? Math.round(size * 1.25) : Math.round(size * 1.15);
  const headCenterTopPct = onShip ? '46%' : '42%';
  const avatarDia = Math.round(size * (onShip ? 0.48 : 0.62));

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${animate ? 'animate-crewmate-bob' : ''}`}
      style={{ width: widthPx, height: heightPx }}
    >
      <svg
        width={widthPx}
        height={heightPx}
        viewBox={onShip ? '-58 -58 116 122' : '-50 -56 100 118'}
        className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.42)] overflow-visible"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        {onShip ? (
          <g>
            {/* Twin & Center Thruster Flames */}
            <polygon points="-24,28 -20,44 -16,28" fill="#38bdf8" />
            <polygon points="16,28 20,44 24,28" fill="#38bdf8" />
            <polygon points="-8,30 0,52 8,30" fill="#fbbf24" />
            {/* Side Laser Cannons */}
            <rect x="-41" y="-12" width="7" height="26" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.4" />
            <circle cx="-37.5" cy="-13" r="3.6" fill="#22d3ee" />
            <rect x="34" y="-12" width="7" height="26" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.4" />
            <circle cx="37.5" cy="-13" r="3.6" fill="#22d3ee" />
            {/* Wings */}
            <polygon
              points="-48,24 -25,-12 25,-12 48,24 20,21 15,30 -15,30 -20,21"
              fill={palette.shade}
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Main Fuselage */}
            <polygon
              points="0,-46 27,-8 25,25 -25,25 -27,-8"
              fill={palette.fill}
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polygon points="0,-46 7,-32 -7,-32" fill="#22d3ee" />
            {/* Cockpit Bay */}
            <ellipse cx="0" cy="2" rx="25" ry="23" fill="#090d1a" stroke="#38bdf8" strokeWidth="2.8" />
            <g transform="translate(0, 5) scale(0.68)">
              <path d="M -22,20 C -22,6 22,6 22,20 Z" fill={palette.fill} stroke="#0f172a" strokeWidth="3" />
              <AnimalEarsSvg animalId={safeAnimal} species={species} />
              <ellipse cx="0" cy="-3" rx="25.5" ry="22.5" fill={species.body} stroke="#0f172a" strokeWidth="3.2" />
              <AnimalFaceSvg animalId={safeAnimal} species={species} isAvatarMode={isAvatarMode} />
              <AnimalAccessorySvg accessoryId={safeAcc} />
            </g>
            {/* Glass Dome Reflection */}
            <ellipse cx="0" cy="2" rx="24.5" ry="22.5" fill="rgba(186,230,253,0.14)" />
            <path d="M -16,-7 A 18,16 0 0,1 -3,-16" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {/* Mini Cute Space Suit Body (Pilot Standing in Dropship) */}
            <rect x="-25" y="13" width="12" height="22" rx="5.5" fill={palette.shade} stroke="#0f172a" strokeWidth="3.2" />
            <path
              d="M -18,14 C -18,5 18,5 18,14 L 20,38 C 20,44 16,47 11,47 C 7,47 5,44 5,40 L 5,37 L -5,37 L -5,40 C -5,44 -7,47 -11,47 C -16,47 -20,44 -20,38 Z"
              fill={palette.fill}
              stroke="#0f172a"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Suit Collar & Chest Star Badge */}
            <ellipse cx="0" cy="14" rx="16" ry="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.6" />
            <circle cx="0" cy="25" r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />

            {/* Animal Head & Accessory */}
            <g transform="translate(0, -4)">
              <AnimalEarsSvg animalId={safeAnimal} species={species} />
              <ellipse cx="0" cy="-3" rx="26" ry="23" fill={species.body} stroke="#0f172a" strokeWidth="3.2" />
              <AnimalFaceSvg animalId={safeAnimal} species={species} isAvatarMode={isAvatarMode} />
              <AnimalAccessorySvg accessoryId={safeAcc} />
            </g>
          </g>
        )}
      </svg>

      {isAvatarMode && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden border-2 border-cyan-300 bg-slate-900 shadow-md pointer-events-none"
          style={{
            width: avatarDia,
            height: avatarDia,
            top: headCenterTopPct
          }}
        >
          <img src={avatarUrl} alt="Avatar phi công" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
