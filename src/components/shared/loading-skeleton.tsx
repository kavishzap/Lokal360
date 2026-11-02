"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslate } from "@/i18n/use-translate";

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="space-y-2 rounded-xl border bg-white p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function PageSpinner() {
  const { t } = useTranslate();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      <p className="text-sm text-slate-500">{t("Opening the books…")}</p>
    </div>
  );
}

export function OfficeLoading() {
  const { t } = useTranslate();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="hidden w-[260px] shrink-0 flex-col bg-[#0F172A] lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <div className="size-9 animate-pulse rounded-xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-white/15" />
            <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="space-y-2 px-3 py-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="size-9 animate-pulse rounded-full bg-slate-200" />
        </header>
        <main className="px-4 py-6 lg:px-6">
          <p className="mb-4 text-sm font-medium text-slate-600">{t("Opening the books…")}</p>
          <LoadingSkeleton />
        </main>
      </div>
    </div>
  );
}
