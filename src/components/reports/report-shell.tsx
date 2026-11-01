"use client";

import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportQuery } from "@/hooks/use-report-query";
import { APP_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { REPORT_AUDIENCES, REPORT_PERIODS } from "@/lib/reports";

export function ReportShell({
  title,
  description,
  query,
  children,
}: {
  title: string;
  description: string;
  query: ReportQuery;
  children: React.ReactNode;
}) {
  const audienceMeta = REPORT_AUDIENCES.find((row) => row.value === query.audience);

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Prepared for</span>
            <Select
              value={query.audience}
              onValueChange={(value) => query.setAudience(value as ReportQuery["audience"])}
            >
              <SelectTrigger className="h-9 w-full bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_AUDIENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} — {option.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Period</span>
            <Select
              value={query.period}
              onValueChange={(value) => query.setPeriod(value as ReportQuery["period"])}
            >
              <SelectTrigger className="h-9 w-full bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_PERIODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            className="h-9"
            onClick={() =>
              toast.message("PDF export is not connected yet.", {
                description: `${title} for ${audienceMeta?.label}, ${query.label}.`,
              })
            }
          >
            <FileDown /> Generate PDF
          </Button>
        </div>
        {query.period === "custom" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">From</span>
              <Input
                type="date"
                value={query.customFrom}
                onChange={(event) => query.setCustomFrom(event.target.value)}
                className="h-9 bg-slate-50"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">To</span>
              <Input
                type="date"
                value={query.customTo}
                onChange={(event) => query.setCustomTo(event.target.value)}
                className="h-9 bg-slate-50"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs font-medium tracking-[0.16em] text-slate-400 uppercase">{APP_NAME}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">
            {audienceMeta?.label} · {formatDate(query.from)} – {formatDate(query.to)}
          </p>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
