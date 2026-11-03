"use client";

import Link from "next/link";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { MachineBuild } from "@/components/shared/machine-build";
import { MissingRobot } from "@/components/shared/missing-robot";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/i18n/use-translate";
import { APP_NAME } from "@/lib/constants";
import { type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

function DarkStage({ children }: { children: ReactNode }) {
  const { t } = useTranslate();

  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
    event.currentTarget.style.setProperty("--nx", ((x / rect.width - 0.5) * 2).toFixed(4));
    event.currentTarget.style.setProperty("--ny", ((y / rect.height - 0.5) * 2).toFixed(4));
  };

  const resetPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--mx", "50%");
    event.currentTarget.style.setProperty("--my", "42%");
    event.currentTarget.style.setProperty("--nx", "0");
    event.currentTarget.style.setProperty("--ny", "0");
  };

  return (
    <div
      className="login-stage relative min-h-screen bg-[#0F172A] text-white"
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
    >
      <style>{`
        .login-stage { --mx: 50%; --my: 42%; --nx: 0; --ny: 0; }
        .login-spot {
          background: radial-gradient(520px circle at var(--mx) var(--my), rgba(59, 130, 246, 0.5), transparent 62%);
        }
        .login-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(420px circle at var(--mx) var(--my), #000 0%, transparent 74%);
          -webkit-mask-image: radial-gradient(420px circle at var(--mx) var(--my), #000 0%, transparent 74%);
        }
        .login-shift {
          transform: translate3d(calc(var(--nx) * var(--d) * 1px), calc(var(--ny) * var(--d) * 1px), 0);
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .login-shift { transform: none; transition: none; }
        }
      `}</style>
      <div className="login-spot pointer-events-none absolute inset-0" />
      <div className="login-grid pointer-events-none absolute inset-0" />
      <div className="login-shift pointer-events-none absolute -top-10 left-1/2 size-64 -translate-x-1/2 rounded-full bg-blue-500/25 blur-3xl" style={{ "--d": 34 } as React.CSSProperties} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex w-full items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-semibold">B42</div>
            <div className="min-w-0">
              <p className="font-semibold">{APP_NAME}</p>
              <p className="text-sm text-slate-400">{t("Back office")}</p>
            </div>
          </div>
          <LanguageSwitch tone="dark" />
        </header>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-8">
          <div className="login-shift" style={{ "--d": -12 } as React.CSSProperties}>
            {children}
          </div>
        </div>
        <p className="px-6 pb-8 text-center text-xs text-slate-500 sm:px-10">
          {t("One restaurant. The floor, the books and the wage bill.")}
        </p>
      </div>
    </div>
  );
}

export function NotFoundStage() {
  const { t } = useTranslate();
  return (
    <DarkStage>
      <div className="flex flex-col items-center text-center">
        <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.32em] text-blue-200 uppercase">
          <span className="h-px w-8 bg-blue-400" />
          404
        </p>
        <h1 className="mt-5 text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white xl:text-5xl xl:leading-[1.05]">
          {t("Page not found")}
        </h1>
        <p className="mt-6 max-w-sm text-[15px] leading-7 text-pretty text-slate-300">
          {t("That address is not part of this office.")}
        </p>
        <div className="mt-8">
          <MissingRobot onDark />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            {t("Back to the office")}
          </Button>
        </div>
      </div>
    </DarkStage>
  );
}

export function MaintenanceStage() {
  const { t } = useTranslate();
  return (
    <DarkStage>
      <h1 className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.32em] text-blue-200 uppercase">
        <span className="h-px w-8 bg-blue-400" />
        {t("Under maintenance")}
      </h1>
      <p className="mt-5 max-w-[12em] text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-white xl:text-5xl xl:leading-[1.05]">
        {t("The machines are being built.")}
      </p>
      <p className="mt-6 max-w-sm text-[15px] leading-7 text-pretty text-slate-300">
        {t("The office is briefly closed while we update it. Please come back shortly.")}
      </p>
      <div className="mt-8">
        <MachineBuild />
      </div>
    </DarkStage>
  );
}
