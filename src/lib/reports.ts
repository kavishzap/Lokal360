import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";

export type ReportAudience = "owner" | "accountant";
export type ReportPeriod =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export const REPORT_AUDIENCES: { value: ReportAudience; label: string; hint: string }[] = [
  { value: "owner", label: "Business owner", hint: "Summary view" },
  { value: "accountant", label: "Accountant", hint: "Full working papers" },
];

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "custom", label: "Custom dates" },
];

function iso(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export function rangeForPeriod(
  period: ReportPeriod,
  customFrom: string,
  customTo: string,
  today = new Date()
) {
  switch (period) {
    case "this_month":
      return { from: iso(startOfMonth(today)), to: iso(endOfMonth(today)) };
    case "last_month": {
      const last = subMonths(today, 1);
      return { from: iso(startOfMonth(last)), to: iso(endOfMonth(last)) };
    }
    case "this_quarter":
      return { from: iso(startOfQuarter(today)), to: iso(endOfQuarter(today)) };
    case "last_quarter": {
      const last = subQuarters(today, 1);
      return { from: iso(startOfQuarter(last)), to: iso(endOfQuarter(last)) };
    }
    case "this_year":
      return { from: iso(startOfYear(today)), to: iso(endOfYear(today)) };
    case "last_year": {
      const last = subYears(today, 1);
      return { from: iso(startOfYear(last)), to: iso(endOfYear(last)) };
    }
    default:
      return {
        from: customFrom || iso(startOfYear(today)),
        to: customTo || iso(today),
      };
  }
}

export function periodLabel(period: ReportPeriod, from: string, to: string) {
  const preset = REPORT_PERIODS.find((row) => row.value === period)?.label ?? "Custom";
  if (period === "custom") return `${from} to ${to}`;
  return `${preset} · ${from} to ${to}`;
}

export function inDateRange(value: string, from: string, to: string) {
  const day = value.slice(0, 10);
  return day >= from && day <= to;
}

export function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(1));
}
