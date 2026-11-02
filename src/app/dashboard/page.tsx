"use client";

import { endOfMonth, format, startOfMonth, startOfYear } from "date-fns";
import { fr as french } from "date-fns/locale";
import Link from "next/link";
import {
  SYSTEM_ACCOUNT_CODES,
  accountBalance,
  accountByCode,
  expenseTotal,
  purchaseTotal,
} from "@/lib/accounting";
import { useTranslate } from "@/i18n/use-translate";
import { formatMUR } from "@/lib/format";
import { orderTotal } from "@/lib/orders";
import { inDateRange } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

const KREOL_MONTHS = ["zanvie", "fevriye", "mars", "avril", "me", "zin", "zilye", "out", "septam", "oktob", "novam", "desam"];

const WAGE_CODES = ["5300", "5310", "5320", "5330", "5340"];
const STATUTORY_CODES = [
  SYSTEM_ACCOUNT_CODES.payePayable,
  SYSTEM_ACCOUNT_CODES.csgPayable,
  SYSTEM_ACCOUNT_CODES.nsfPayable,
  SYSTEM_ACCOUNT_CODES.hrdcPayable,
  SYSTEM_ACCOUNT_CODES.prgfPayable,
];

export default function DashboardPage() {
  const session = useAuthStore((state) => state.session);
  const { locale, t } = useTranslate();
  const orders = useAppStore((state) => state.orders);
  const purchases = useAppStore((state) => state.purchases);
  const expenses = useAppStore((state) => state.expenses);
  const journals = useAppStore((state) => state.journalEntries);
  const accounts = useAppStore((state) => state.accounts);

  const today = new Date();
  const yearLabel = format(today, "yyyy");
  const period = format(today, "yyyy-MM");
  const monthFrom = format(startOfMonth(today), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(today), "yyyy-MM-dd");
  const yearFrom = format(startOfYear(today), "yyyy-MM-dd");
  const todayIso = format(today, "yyyy-MM-dd");
  const hello = locale === "fr" ? "Bonjour" : locale === "mfe" ? "Bonzour" : "Hello";
  const firstName = session?.name.split(" ")[0] ?? "";

  const monthName = (date: Date, style: "MMMM" | "MMM") => {
    if (locale === "fr") return format(date, style, { locale: french });
    if (locale === "mfe") {
      const name = KREOL_MONTHS[date.getMonth()];
      return style === "MMM" ? name.slice(0, 3) : name;
    }
    return format(date, style);
  };

  const movement = (from: string, to: string) => {
    const sales = orders
      .filter((order) => order.status !== "cancelled" && inDateRange(order.createdAt, from, to))
      .reduce((sum, order) => sum + orderTotal(order), 0);
    const food = purchases
      .filter((purchase) => inDateRange(purchase.date, from, to))
      .reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);
    const running = expenses
      .filter((expense) => inDateRange(expense.date, from, to))
      .reduce((sum, expense) => sum + expenseTotal(expense), 0);
    const depreciation = journals
      .filter((entry) => entry.source === "depreciation" && inDateRange(entry.date, from, to))
      .reduce((sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.debit, 0), 0);
    const wageIds = new Set(accounts.filter((account) => WAGE_CODES.includes(account.code)).map((account) => account.id));
    const payroll = journals
      .filter((entry) => entry.source === "payroll" && inDateRange(entry.date, from, to))
      .reduce(
        (sum, entry) =>
          sum + entry.lines.filter((line) => wageIds.has(line.accountId)).reduce((lineSum, line) => lineSum + line.debit, 0),
        0
      );
    return { sales, food, running, depreciation, payroll, left: sales - food - running - depreciation - payroll };
  };

  const month = movement(monthFrom, monthTo);
  const year = movement(yearFrom, todayIso);
  const months = Array.from({ length: today.getMonth() + 1 }, (_, index) => {
    const start = new Date(today.getFullYear(), index, 1);
    const key = format(start, "yyyy-MM");
    return {
      key,
      name: monthName(start, "MMMM"),
      short: monthName(start, "MMM"),
      ...movement(format(start, "yyyy-MM-dd"), format(endOfMonth(start), "yyyy-MM-dd")),
    };
  });
  const latest = [...months].reverse().find((row) => row.sales > 0);
  const peak = Math.max(...months.map((row) => row.sales), 1);
  const caption = !latest
    ? t("No takings yet this year.")
    : latest.key === period
      ? ""
      : locale === "fr"
        ? `${latest.name} a fait ${formatMUR(latest.sales)}.`
        : locale === "mfe"
          ? `${latest.name} inn fer ${formatMUR(latest.sales)}.`
          : `${latest.name} took ${formatMUR(latest.sales)}.`;

  const balanceOf = (code: string) => {
    const account = accountByCode(accounts, code);
    return account ? accountBalance(account, journals).balance : 0;
  };
  const cashBalance = balanceOf(SYSTEM_ACCOUNT_CODES.cash);
  const bankBalance = balanceOf(SYSTEM_ACCOUNT_CODES.bank);
  const wagesOwed = balanceOf(SYSTEM_ACCOUNT_CODES.netWages);
  const statutory = STATUTORY_CODES.reduce((sum, code) => sum + balanceOf(code), 0);

  const statement = [
    { label: "Sales", amount: year.sales, tone: "in" as const },
    { label: "Food bought", amount: -year.food, tone: "out" as const },
    { label: "Gross", amount: year.sales - year.food, tone: "mid" as const },
    { label: "Wages in the books", amount: -year.payroll, tone: "out" as const },
    { label: "Running costs", amount: -year.running, tone: "out" as const },
    { label: "Depreciation", amount: -year.depreciation, tone: "out" as const },
    { label: "Left after costs", amount: year.left, tone: "total" as const },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {hello}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{yearLabel}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("How much you took")}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{formatMUR(year.sales)}</p>
            <p className="mt-1 text-sm text-slate-500">{yearLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("This month")}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{formatMUR(month.sales)}</p>
            <p className="mt-1 text-sm text-slate-500 capitalize">{monthName(today, "MMMM")}</p>
          </div>
        </div>
        {caption ? <p className="mt-4 text-sm text-slate-600">{caption}</p> : null}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{t("Month by month")}</p>
          <div className="mt-4 flex items-end gap-2">
            {months.map((row) => (
              <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn("w-full rounded-sm", row.sales > 0 ? "bg-slate-900" : "bg-slate-200")}
                    style={{ height: `${row.sales > 0 ? Math.max(8, (row.sales / peak) * 100) : 4}%` }}
                    title={`${row.name} ${formatMUR(row.sales)}`}
                  />
                </div>
                <span className="text-[11px] text-slate-500 capitalize">{row.short}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-900">{t("Where the money went")}</h2>
            <Link href="/dashboard/reports/pnl" className="text-sm text-blue-700">
              {t("Profit and loss")}
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">{yearLabel}</p>
          <ul className="mt-4">
            {statement.map((row) => (
              <li
                key={row.label}
                className={cn(
                  "flex items-baseline justify-between gap-4 py-2 text-sm",
                  row.tone === "mid" || row.tone === "total" ? "border-t border-slate-200 font-semibold" : "text-slate-600"
                )}
              >
                <span className={row.tone === "in" || row.tone === "total" ? "text-slate-900" : undefined}>{t(row.label)}</span>
                <span className={cn("tabular-nums", row.amount < 0 ? "text-red-600" : "text-slate-900")}>{formatMUR(row.amount)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-[#0F172A] p-5 text-white">
          <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{t("Cash and bank")}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{formatMUR(cashBalance + bankBalance)}</p>
          <div className="mt-4 space-y-1 text-sm text-slate-300">
            <p className="flex justify-between gap-4">
              <span>{t("Cash on hand")}</span>
              <span className="shrink-0 whitespace-nowrap">{formatMUR(cashBalance)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>{t("In the bank")}</span>
              <span className={cn("shrink-0 whitespace-nowrap", bankBalance < 0 && "text-amber-300")}>{formatMUR(bankBalance)}</span>
            </p>
          </div>
          {wagesOwed > 0 || statutory > 0 ? (
            <div className="mt-6 border-t border-white/10 pt-4 text-sm">
              <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{t("Still to pay")}</p>
              {wagesOwed > 0 ? (
                <p className="mt-3 flex justify-between gap-4 text-slate-300">
                  <span>{t("Wages still to pay")}</span>
                  <span className="shrink-0 whitespace-nowrap text-white">{formatMUR(wagesOwed)}</span>
                </p>
              ) : null}
              {statutory > 0 ? (
                <p className="mt-2 flex justify-between gap-4 text-slate-300">
                  <span>{t("PAYE and contributions")}</span>
                  <span className="shrink-0 whitespace-nowrap text-white">{formatMUR(statutory)}</span>
                </p>
              ) : null}
              <Link href="/dashboard/payroll/run" className="mt-4 inline-block text-sm text-sky-300">
                {t("Pay and file")}
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
