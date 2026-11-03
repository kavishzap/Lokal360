"use client";

import { useTranslate } from "@/i18n/use-translate";
import { cn } from "@/lib/utils";

export function StatusScreen({
  code,
  title,
  description,
  embedded = false,
  visual,
  children,
}: {
  code?: string;
  title: string;
  description: string;
  embedded?: boolean;
  visual?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t } = useTranslate();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center px-6 py-16",
        embedded ? "min-h-[60vh]" : "min-h-screen bg-slate-50"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(420px circle at 50% 40%, #000 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(420px circle at 50% 40%, #000 0%, transparent 72%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <img
          src="/Lokal360%20POS%20Terminal%20Logo.png"
          alt="Lokal360"
          className="mx-auto h-14 w-auto"
        />
        {visual ? <div className="mt-6 flex justify-center">{visual}</div> : null}
        {code ? (
          <p className="mt-6 text-sm font-medium tracking-[0.2em] text-blue-700 uppercase">{code}</p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{t(title)}</h1>
        <p className="mt-2 text-sm text-slate-500">{t(description)}</p>
        {children ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
