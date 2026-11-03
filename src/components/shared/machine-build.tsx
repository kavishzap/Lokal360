const TEETH = [0, 45, 90, 135, 180, 225, 270, 315];

export function MachineBuild() {
  return (
    <div className="machine-scene" aria-hidden>
      <style>{`
        .machine-scene .spin { transform-box: fill-box; transform-origin: center; animation: machine-spin 4s linear infinite; }
        .machine-scene .spin-back { transform-box: fill-box; transform-origin: center; animation: machine-spin 4s linear infinite reverse; }
        .machine-scene .arm { transform-box: fill-box; transform-origin: 0 0; animation: machine-arm 2.6s ease-in-out infinite; }
        .machine-scene .chassis { animation: machine-drop 6.4s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        .machine-scene .gearbox { animation: machine-slide 6.4s cubic-bezier(0.22, 1, 0.36, 1) infinite 0.35s; }
        .machine-scene .display { animation: machine-drop 6.4s cubic-bezier(0.22, 1, 0.36, 1) infinite 0.7s; }
        .machine-scene .paper { transform-box: fill-box; transform-origin: top center; animation: machine-print 6.4s cubic-bezier(0.22, 1, 0.36, 1) infinite 1.15s; }
        .machine-scene .bolt { animation: machine-bolt 6.4s ease-in-out infinite 1.35s; }
        .machine-scene .belt { stroke-dasharray: 7 9; animation: machine-belt 0.9s linear infinite; }
        @keyframes machine-spin { to { transform: rotate(360deg); } }
        @keyframes machine-arm {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(16deg); }
        }
        @keyframes machine-drop {
          0% { opacity: 0; transform: translateY(-28px); }
          14% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          92%, 100% { opacity: 0; transform: translateY(-18px); }
        }
        @keyframes machine-slide {
          0% { opacity: 0; transform: translateX(-24px); }
          14% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; transform: translateX(0); }
          92%, 100% { opacity: 0; transform: translateX(-16px); }
        }
        @keyframes machine-print {
          0%, 10% { opacity: 0; transform: scaleY(0.05); }
          28% { opacity: 1; transform: scaleY(1); }
          80% { opacity: 1; transform: scaleY(1); }
          92%, 100% { opacity: 0; transform: scaleY(0.05); }
        }
        @keyframes machine-bolt {
          0%, 18% { opacity: 0; }
          28%, 80% { opacity: 1; }
          92%, 100% { opacity: 0; }
        }
        @keyframes machine-belt { to { stroke-dashoffset: -32; } }
        @media (prefers-reduced-motion: reduce) {
          .machine-scene .spin,
          .machine-scene .spin-back,
          .machine-scene .arm,
          .machine-scene .chassis,
          .machine-scene .gearbox,
          .machine-scene .display,
          .machine-scene .paper,
          .machine-scene .bolt,
          .machine-scene .belt { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      <svg viewBox="0 0 520 230" className="h-56 w-full">
        <path d="M36 196 H484" fill="none" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <path className="belt" d="M48 196 H472" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

        <g transform="translate(118 16)">
          <g className="chassis">
            <rect x="118" y="156" width="64" height="16" rx="5" fill="#2563EB" />
            <rect x="142" y="142" width="16" height="18" rx="3" fill="#1D4ED8" />
            <rect x="78" y="78" width="176" height="70" rx="14" fill="#1E40AF" />
            <rect x="78" y="78" width="176" height="70" rx="14" fill="none" stroke="#BFDBFE" strokeWidth="3" />
            <rect x="94" y="90" width="112" height="46" rx="8" fill="#020617" stroke="#93C5FD" strokeWidth="2" />
          </g>

          <g className="gearbox">
            <rect x="16" y="86" width="70" height="62" rx="12" fill="#172554" stroke="#60A5FA" strokeWidth="2" />
            <g transform="translate(40 108)">
            <g className="spin">
              {TEETH.map((angle) => (
                <rect key={angle} x="-3" y="-22" width="6" height="8" rx="1" fill="#DBEAFE" transform={`rotate(${angle})`} />
              ))}
              <circle r="14" fill="#1E3A8A" stroke="#DBEAFE" strokeWidth="3" />
              <circle r="4" fill="#93C5FD" />
            </g>
            </g>
            <g transform="translate(64 132)">
            <g className="spin-back">
              {TEETH.map((angle) => (
                <rect key={angle} x="-2.5" y="-15" width="5" height="6" rx="1" fill="#93C5FD" transform={`rotate(${angle})`} />
              ))}
              <circle r="9" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="2.5" />
              <circle r="3" fill="#DBEAFE" />
            </g>
            </g>
          </g>

          <g className="display">
            <rect x="102" y="98" width="46" height="30" rx="4" fill="#2563EB" />
            <rect x="154" y="98" width="42" height="6" rx="2" fill="#60A5FA" />
            <rect x="154" y="110" width="32" height="6" rx="2" fill="#1D4ED8" />
            <rect x="154" y="122" width="24" height="6" rx="2" fill="#1E3A8A" />
          </g>

          <g className="paper">
            <path d="M214 136 h26 v36 l-5 -4 -4 4 -4 -4 -4 4 -5 -4 -4 4 z" fill="#E2E8F0" />
            <path d="M220 146 h14 M220 152 h14 M220 158 h10" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          <g transform="translate(150 18)">
            <g className="arm">
              <path d="M0 0 H78" fill="none" stroke="#BFDBFE" strokeWidth="6" strokeLinecap="round" />
              <path d="M78 0 v34" fill="none" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
              <circle cx="78" cy="40" r="6" fill="#60A5FA" />
            </g>
          </g>
          <circle className="bolt" cx="246" cy="74" r="4" fill="#FDE68A" />
        </g>
      </svg>
    </div>
  );
}
