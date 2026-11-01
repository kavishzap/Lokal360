"use client";

import { useMemo } from "react";
import { periodLabel, rangeForPeriod } from "@/lib/reports";
import { useUiStore } from "@/store/ui-store";

export function useReportQuery() {
  const audience = useUiStore((state) => state.reportAudience);
  const period = useUiStore((state) => state.reportPeriod);
  const customFrom = useUiStore((state) => state.reportCustomFrom);
  const customTo = useUiStore((state) => state.reportCustomTo);
  const setAudience = useUiStore((state) => state.setReportAudience);
  const setPeriod = useUiStore((state) => state.setReportPeriod);
  const setCustomFrom = useUiStore((state) => state.setReportCustomFrom);
  const setCustomTo = useUiStore((state) => state.setReportCustomTo);

  const range = useMemo(
    () => rangeForPeriod(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  return {
    audience,
    setAudience,
    period,
    setPeriod,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    from: range.from,
    to: range.to,
    label: periodLabel(period, range.from, range.to),
  };
}

export type ReportQuery = ReturnType<typeof useReportQuery>;
