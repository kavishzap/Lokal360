"use client";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useTranslate();
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t(title)}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{t(description)}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actionLabel && onAction ? (
          <Button className="h-9 px-3" onClick={onAction}>
            {t(actionLabel)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
