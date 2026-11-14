"use client";

import type { ReactNode } from "react";

export function GridStage({ children }: { children: ReactNode }) {
  return (
    <div className="office-stage relative min-h-screen">
      <style>{`
        .office-stage {
          background-color: #f3f5f8;
          background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1.15px, transparent 1.15px);
          background-size: 22px 22px;
        }
        .office-stage [data-slot="input"],
        .office-stage [data-slot="textarea"],
        .office-stage [data-slot="select-trigger"] {
          background-color: #fff;
          color: #0f172a;
        }
        .office-stage .rounded-xl.bg-white:not(.module-card),
        .office-stage [data-slot="card"] {
          position: relative;
          background-color: #ffffff;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }
        .office-stage thead,
        .office-stage thead tr,
        .office-stage thead tr:hover {
          background-color: #0369a1;
        }
        .office-stage thead th {
          color: #ffffff;
        }
      `}</style>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
