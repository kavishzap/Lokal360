"use client";

import { useTranslate } from "@/i18n/use-translate";

export function MissingRobot({ onDark = false }: { onDark?: boolean }) {
  const { t } = useTranslate();

  return (
    <div className={`robot-scene flex items-end gap-3 ${onDark ? "" : "justify-center"}`}>
      <style>{`
        .robot-scene .body { transform-box: fill-box; transform-origin: center bottom; animation: robot-bob 2.6s ease-in-out infinite; }
        .robot-scene .eyes { transform-box: fill-box; animation: robot-look 3.4s ease-in-out infinite; }
        .robot-scene .blink { transform-box: fill-box; transform-origin: center; animation: robot-blink 3.4s ease-in-out infinite; }
        .robot-scene .lamp { animation: robot-lamp 1.6s ease-in-out infinite; }
        .robot-scene .bubble { animation: robot-pop 3.4s ease-in-out infinite; }
        @keyframes robot-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes robot-look {
          0%, 20% { transform: translateX(0); }
          40%, 60% { transform: translateX(5px); }
          80%, 100% { transform: translateX(-3px); }
        }
        @keyframes robot-blink {
          0%, 42%, 48%, 100% { transform: scaleY(1); }
          45% { transform: scaleY(0.15); }
        }
        @keyframes robot-lamp {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes robot-pop {
          0%, 12% { opacity: 0; transform: translateY(6px) scale(0.96); }
          24%, 100% { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .robot-scene .body,
          .robot-scene .eyes,
          .robot-scene .blink,
          .robot-scene .lamp,
          .robot-scene .bubble { animation: none; }
        }
      `}</style>
      <svg viewBox="0 0 140 170" className="h-36 w-28 shrink-0" aria-hidden>
        <g className="body">
          <line x1="70" y1="18" x2="70" y2="34" stroke={onDark ? "#93C5FD" : "#2563EB"} strokeWidth="4" strokeLinecap="round" />
          <circle className="lamp" cx="70" cy="12" r="6" fill="#FDE68A" />
          <rect x="34" y="34" width="72" height="54" rx="16" fill={onDark ? "#1E3A8A" : "#1D4ED8"} />
          <g className="eyes">
            <g className="blink">
              <rect x="50" y="50" width="14" height="14" rx="4" fill="white" />
              <rect x="76" y="50" width="14" height="14" rx="4" fill="white" />
            </g>
          </g>
          <rect x="46" y="94" width="48" height="40" rx="12" fill={onDark ? "#172554" : "#1E3A8A"} />
          <rect x="22" y="100" width="18" height="8" rx="4" fill={onDark ? "#60A5FA" : "#3B82F6"} />
          <rect x="100" y="100" width="18" height="8" rx="4" fill={onDark ? "#60A5FA" : "#3B82F6"} />
          <rect x="54" y="136" width="10" height="18" rx="4" fill={onDark ? "#93C5FD" : "#2563EB"} />
          <rect x="76" y="136" width="10" height="18" rx="4" fill={onDark ? "#93C5FD" : "#2563EB"} />
        </g>
      </svg>
      <div
        className={`bubble relative mb-10 max-w-[220px] rounded-2xl px-4 py-3 text-sm font-medium leading-5 shadow-lg ${
          onDark ? "rounded-bl-md bg-white text-slate-900" : "rounded-bl-md bg-slate-900 text-white"
        }`}
      >
        {t("This page doesn't exist.")}
      </div>
    </div>
  );
}
