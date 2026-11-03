export function MachineBuild() {
  return (
    <div className="machine-scene" aria-hidden>
      <style>{`
        .machine-scene .bob { transform-box: fill-box; transform-origin: center bottom; animation: crew-bob 2.8s ease-in-out infinite; }
        .machine-scene .bob-late { transform-box: fill-box; transform-origin: center bottom; animation: crew-bob 2.8s ease-in-out infinite 0.4s; }
        .machine-scene .roller { transform-box: fill-box; transform-origin: 0 0; animation: roller-stroke 2.4s ease-in-out infinite; }
        .machine-scene .paint { transform-box: fill-box; transform-origin: left center; animation: paint-wipe 2.4s ease-in-out infinite; }
        .machine-scene .card { transform-box: fill-box; transform-origin: left center; animation: card-float 2.8s ease-in-out infinite; }
        .machine-scene .blink { animation: lamp-blink 1.1s ease-in-out infinite; }
        .machine-scene .blink-late { animation: lamp-blink 1.1s ease-in-out infinite 0.45s; }
        .machine-scene .cone { transform-box: fill-box; transform-origin: center bottom; animation: cone-sway 2.6s ease-in-out infinite; }
        .machine-scene .chip { animation: chip-in 3.6s ease-in-out infinite; }
        .machine-scene .chip-2 { animation-delay: 0.25s; }
        .machine-scene .chip-3 { animation-delay: 0.5s; }
        @keyframes crew-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes roller-stroke {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes paint-wipe {
          0%, 8% { transform: scaleX(0.18); }
          50%, 70% { transform: scaleX(1); }
          100% { transform: scaleX(0.18); }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }
        @keyframes lamp-blink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes cone-sway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes chip-in {
          0%, 18% { opacity: 0; transform: translateY(8px); }
          36%, 78% { opacity: 1; transform: none; }
          100% { opacity: 0; transform: translateY(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .machine-scene .bob,
          .machine-scene .bob-late,
          .machine-scene .roller,
          .machine-scene .paint,
          .machine-scene .card,
          .machine-scene .blink,
          .machine-scene .blink-late,
          .machine-scene .cone,
          .machine-scene .chip { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      <svg viewBox="0 0 760 420" className="h-auto w-full">
        <ellipse cx="120" cy="352" rx="78" ry="14" fill="#93C5FD" opacity="0.28" />
        <ellipse cx="390" cy="368" rx="168" ry="16" fill="#93C5FD" opacity="0.22" />
        <ellipse cx="640" cy="356" rx="62" ry="12" fill="#93C5FD" opacity="0.28" />

        <g transform="translate(36 292)">
          <rect x="0" y="18" width="7" height="52" rx="2" fill="#FB923C" />
          <rect x="48" y="18" width="7" height="52" rx="2" fill="#FB923C" />
          <g transform="rotate(-16 28 36)">
            <rect x="2" y="24" width="52" height="12" rx="2" fill="#FDBA74" />
            <rect x="2" y="24" width="12" height="12" fill="#fff" />
            <rect x="22" y="24" width="12" height="12" fill="#fff" />
            <rect x="42" y="24" width="12" height="12" fill="#fff" />
          </g>
          <circle className="blink" cx="3" cy="14" r="5" fill="#EF4444" />
        </g>
        <g transform="translate(78 308)">
          <rect x="0" y="14" width="6" height="40" rx="2" fill="#FB923C" />
          <rect x="36" y="14" width="6" height="40" rx="2" fill="#FB923C" />
          <g transform="rotate(14 22 28)">
            <rect x="0" y="20" width="42" height="10" rx="2" fill="#FDBA74" />
            <rect x="0" y="20" width="10" height="10" fill="#fff" />
            <rect x="16" y="20" width="10" height="10" fill="#fff" />
            <rect x="32" y="20" width="10" height="10" fill="#fff" />
          </g>
          <circle className="blink-late" cx="40" cy="12" r="4" fill="#EF4444" />
        </g>

        <g transform="translate(168 24)">
          <rect width="400" height="286" rx="22" fill="#2563EB" />
          <rect x="16" y="16" width="368" height="254" rx="12" fill="#F8FAFC" />
          <circle cx="36" cy="36" r="5" fill="#FB7185" />
          <circle cx="52" cy="36" r="5" fill="#FBBF24" />
          <circle cx="68" cy="36" r="5" fill="#34D399" />
          <path d="M28 54 H372" stroke="#E2E8F0" strokeWidth="2" />
          <rect x="32" y="70" width="150" height="118" rx="10" fill="#EFF6FF" />
          <rect x="44" y="82" width="58" height="42" rx="6" fill="#BFDBFE" />
          <path d="M58 112 l10 -12 8 8 8 -14 16 18 H58 z" fill="#60A5FA" />
          <rect x="112" y="86" width="54" height="7" rx="3" fill="#93C5FD" />
          <rect x="112" y="100" width="40" height="7" rx="3" fill="#DBEAFE" />
          <rect x="44" y="136" width="120" height="8" rx="3" fill="#DBEAFE" />
          <rect x="44" y="152" width="92" height="8" rx="3" fill="#E2E8F0" />
          <rect x="200" y="70" width="156" height="118" rx="10" fill="#DBEAFE" />
          <g className="paint">
            <rect x="200" y="70" width="156" height="118" rx="10" fill="#3B82F6" />
            <rect x="214" y="86" width="70" height="8" rx="3" fill="#EFF6FF" />
            <rect x="214" y="102" width="110" height="8" rx="3" fill="#BFDBFE" />
            <rect x="214" y="118" width="88" height="8" rx="3" fill="#BFDBFE" />
          </g>
          <circle className="chip" cx="52" cy="214" r="9" fill="#34D399" />
          <circle className="chip chip-2" cx="80" cy="214" r="9" fill="#FBBF24" />
          <circle className="chip chip-3" cx="108" cy="214" r="9" fill="#FB7185" />
          <rect x="168" y="286" width="64" height="28" fill="#1D4ED8" />
          <rect x="132" y="310" width="136" height="18" rx="9" fill="#3B82F6" />
        </g>

        <g transform="translate(118 352)">
          <g className="bob">
            <path d="M-16 -92 h32 l-4 10 h-24 z" fill="#FBBF24" />
            <rect x="-14" y="-84" width="28" height="6" rx="2" fill="#F59E0B" />
            <circle cy="-68" r="11" fill="#FDBA74" />
            <path d="M-14 -54 h28 l6 36 h-40 z" fill="#3B82F6" />
            <rect x="-12" y="-18" width="10" height="28" rx="3" fill="#1E3A8A" />
            <rect x="2" y="-18" width="10" height="28" rx="3" fill="#1E3A8A" />
            <rect x="-16" y="8" width="16" height="6" rx="2" fill="#0F172A" />
            <rect x="2" y="8" width="16" height="6" rx="2" fill="#0F172A" />
            <g className="card">
              <rect x="18" y="-78" width="92" height="36" rx="8" fill="#fff" />
              <circle cx="36" cy="-60" r="8" fill="#FEE2E2" />
              <path d="M34 -64 l8 4 -8 4 z" fill="#EF4444" />
              <rect x="50" y="-68" width="48" height="5" rx="2" fill="#DBEAFE" />
              <rect x="50" y="-58" width="34" height="5" rx="2" fill="#E2E8F0" />
            </g>
          </g>
        </g>

        <g transform="translate(470 168)" fill="none" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round">
          <path d="M0 0 L18 150" />
          <path d="M46 0 L28 150" />
          <path d="M6 36 H40" />
          <path d="M10 72 H44" />
          <path d="M14 108 H46" />
        </g>

        <g transform="translate(508 338)">
          <g className="bob-late">
            <path d="M-16 -118 h32 l-4 10 h-24 z" fill="#FBBF24" />
            <rect x="-14" y="-110" width="28" height="6" rx="2" fill="#F59E0B" />
            <circle cy="-94" r="11" fill="#FDBA74" />
            <path d="M-16 -80 h18 l4 46 h-16 z" fill="#1E3A8A" />
            <path d="M2 -80 h16 l8 28 h-20 z" fill="#60A5FA" />
            <rect x="-12" y="-34" width="10" height="34" rx="3" fill="#1E3A8A" />
            <rect x="4" y="-34" width="10" height="34" rx="3" fill="#1E3A8A" />
            <rect x="-16" y="-2" width="16" height="6" rx="2" fill="#0F172A" />
            <rect x="2" y="-2" width="16" height="6" rx="2" fill="#0F172A" />
            <g className="roller">
              <path d="M8 -78 l46 -34" fill="none" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" />
              <rect x="48" y="-122" width="28" height="16" rx="4" fill="#7DD3FC" transform="rotate(-28 62 -114)" />
            </g>
          </g>
        </g>

        <g transform="translate(656 348)">
          <g className="bob">
            <path d="M-16 -96 h32 l-4 10 h-24 z" fill="#FBBF24" />
            <rect x="-14" y="-88" width="28" height="6" rx="2" fill="#F59E0B" />
            <circle cy="-72" r="11" fill="#FDBA74" />
            <path d="M-14 -58 h28 l5 34 h-38 z" fill="#60A5FA" />
            <rect x="-8" y="-46" width="16" height="18" rx="3" fill="#1E3A8A" />
            <rect x="-12" y="-24" width="10" height="28" rx="3" fill="#1E3A8A" />
            <rect x="2" y="-24" width="10" height="28" rx="3" fill="#1E3A8A" />
            <rect x="-16" y="2" width="16" height="6" rx="2" fill="#0F172A" />
            <rect x="2" y="2" width="16" height="6" rx="2" fill="#0F172A" />
            <path d="M12 -52 q16 -8 14 -22" fill="none" stroke="#FDBA74" strokeWidth="5" strokeLinecap="round" />
            <rect x="20" y="-78" width="10" height="16" rx="3" fill="#1E293B" />
          </g>
        </g>

        <g transform="translate(400 372)">
          <g className="cone">
            <path d="M0 -52 L-18 -4 H18 Z" fill="#F97316" />
            <rect x="-20" y="-8" width="40" height="8" rx="2" fill="#FDBA74" />
            <path d="M-8 -34 H8 L6 -26 H-6 Z" fill="#fff" />
            <path d="M-12 -18 H12 L10 -12 H-10 Z" fill="#fff" />
          </g>
        </g>
        <g transform="translate(700 360)">
          <g className="cone">
            <path d="M0 -40 L-14 -2 H14 Z" fill="#F97316" />
            <rect x="-16" y="-6" width="32" height="7" rx="2" fill="#FDBA74" />
            <path d="M-6 -26 H6 L5 -20 H-5 Z" fill="#fff" />
          </g>
        </g>
      </svg>
    </div>
  );
}
