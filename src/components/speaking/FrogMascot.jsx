/**
 * Friendly Frog Mascot SVG inspired by Luyennoi.com.
 * Supports mood: 'idle' | 'listening' | 'celebrate'.
 */
export default function FrogMascot({ className = 'w-16 h-16', mood = 'idle' }) {
  const isCelebrate = mood === 'celebrate';
  const isListening = mood === 'listening';

  return (
    <svg
      viewBox="0 0 180 160"
      className={`${className} select-none`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Subtle shadow */}
      <ellipse cx="90" cy="147" rx="54" ry="7" fill="#0f172a" opacity="0.16" />

      {/* Back feet / Haunches */}
      <ellipse cx="44" cy="126" rx="22" ry="15" fill="#2f7f49" />
      <ellipse cx="42" cy="124" rx="19" ry="13" fill="#3f9a5c" />
      <ellipse cx="136" cy="126" rx="22" ry="15" fill="#2f7f49" />
      <ellipse cx="138" cy="124" rx="19" ry="13" fill="#3f9a5c" />

      {/* Main body */}
      <path
        d="M90 38 C126 38 148 64 148 98 C148 130 124 142 90 142 C56 142 32 130 32 98 C32 64 54 38 90 38Z"
        fill="#3f9a5c"
      />
      <path
        d="M90 42 C122 42 142 66 142 96 C142 124 120 135 90 135 C60 135 38 124 38 96 C38 66 58 42 90 42Z"
        fill="#57ba76"
      />

      {/* Cream belly */}
      <ellipse cx="90" cy="108" rx="34" ry="24" fill="#eedcb2" />
      <ellipse cx="90" cy="106" rx="31" ry="21" fill="#fbf1d8" />

      {/* Front paws */}
      <ellipse cx="64" cy="139" rx="13" ry="6" fill="#3f9a5c" />
      <ellipse cx="63" cy="138" rx="11" ry="4.8" fill="#57ba76" />
      <ellipse cx="116" cy="139" rx="13" ry="6" fill="#3f9a5c" />
      <ellipse cx="117" cy="138" rx="11" ry="4.8" fill="#57ba76" />

      {/* Left Eye Socket */}
      <g transform="translate(62 44)">
        <circle r="21" fill="#46a865" />
        <circle cx="-1" cy="-1.5" r="18.5" fill="#5cbf7a" />
        <circle r="14" fill="#dfa53c" />
        <circle cx="-0.6" cy="-0.8" r="12.8" fill="#f2c14e" />
        {isCelebrate ? (
          <path
            d="M-8 3 Q0 -6 8 3"
            fill="none"
            stroke="#1f2622"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle cx={isListening ? 2 : 0} cy="-1" r="8.2" fill="#1f2622" />
            <circle cx={isListening ? -1 : -3} cy="-4" r="2.8" fill="#ffffff" />
            <circle cx="3" cy="2.5" r="1.3" fill="#ffffff" opacity="0.8" />
          </>
        )}
      </g>

      {/* Right Eye Socket */}
      <g transform="translate(118 44)">
        <circle r="21" fill="#46a865" />
        <circle cx="1" cy="-1.5" r="18.5" fill="#5cbf7a" />
        <circle r="14" fill="#dfa53c" />
        <circle cx="0.6" cy="-0.8" r="12.8" fill="#f2c14e" />
        {isCelebrate ? (
          <path
            d="M-8 3 Q0 -6 8 3"
            fill="none"
            stroke="#1f2622"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle cx={isListening ? -2 : 0} cy="-1" r="8.2" fill="#1f2622" />
            <circle cx={isListening ? -4 : -3} cy="-4" r="2.8" fill="#ffffff" />
            <circle cx="3" cy="2.5" r="1.3" fill="#ffffff" opacity="0.8" />
          </>
        )}
      </g>

      {/* Nostrils */}
      <circle cx="83" cy="58" r="1.7" fill="#2f7f49" opacity="0.75" />
      <circle cx="97" cy="58" r="1.7" fill="#2f7f49" opacity="0.75" />

      {/* Cheeks */}
      <ellipse cx="52" cy="74" rx={isCelebrate ? 8 : 5.5} ry={isCelebrate ? 4.5 : 3.2} fill="#ff8aa8" opacity={isCelebrate ? 0.85 : 0.45} />
      <ellipse cx="128" cy="74" rx={isCelebrate ? 8 : 5.5} ry={isCelebrate ? 4.5 : 3.2} fill="#ff8aa8" opacity={isCelebrate ? 0.85 : 0.45} />

      {/* Smile */}
      {isCelebrate ? (
        <path
          d="M66 71 Q90 87 114 71 Q90 77 66 71Z"
          fill="#5b2333"
          stroke="#2f7f49"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M68 72 Q90 81 112 72"
          fill="none"
          stroke="#24563a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Celebratory sparkles */}
      {isCelebrate && (
        <g fill="#f2c14e">
          <path d="M24 30 L26.5 23 L29 30 L36 32.5 L29 35 L26.5 42 L24 35 L17 32.5Z" />
          <path d="M154 24 L156 18 L158 24 L164 26 L158 28 L156 34 L154 28 L148 26Z" />
        </g>
      )}
    </svg>
  );
}
