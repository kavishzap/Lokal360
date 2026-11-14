"use client";

import { officeBarClass } from "@/components/layout/app-header";
import { GridStage } from "@/components/layout/grid-stage";
import { useTranslate } from "@/i18n/use-translate";

const FOLDERS = [
  "bg-[#5B9BFF]",
  "bg-[#FF8B7B]",
  "bg-[#5DCFB0]",
  "bg-[#FFB15E]",
  "bg-[#9B8CFF]",
  "bg-[#4CC3D9]",
  "bg-[#F27AA6]",
  "bg-[#7BC67E]",
];

function FolderGhost({ color }: { color: string }) {
  return (
    <div className={`relative mt-2 h-28 animate-pulse rounded-2xl ${color}`}>
      <span className={`absolute -top-2 left-4 h-3 w-12 rounded-t-md ${color}`} />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 h-8 w-44 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid items-start gap-4 lg:grid-cols-6">
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:col-span-2 lg:row-span-2">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <FolderGhost key={index} color={FOLDERS[index % FOLDERS.length]} />
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:col-span-4">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <FolderGhost key={index} color={FOLDERS[(index + 2) % FOLDERS.length]} />
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:col-span-4">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <FolderGhost key={index} color={FOLDERS[(index + 4) % FOLDERS.length]} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PageSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="h-11 animate-pulse bg-sky-700" />
        <div className="space-y-px p-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 6, variant = "page" }: { rows?: number; variant?: "board" | "page" }) {
  return variant === "board" ? <BoardSkeleton /> : <PageSkeleton rows={rows} />;
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
    <GridStage>
      <header className={officeBarClass}>
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="size-9 animate-pulse rounded-xl bg-blue-600/80" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="size-8 animate-pulse rounded-full bg-blue-600/80" />
          </div>
        </div>
      </header>
      <main className="px-4 py-6 lg:px-6">
        <p className="sr-only">{t("Opening the books…")}</p>
        <BoardSkeleton />
      </main>
    </GridStage>
  );
}
