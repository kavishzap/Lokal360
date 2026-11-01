"use client";

import { endOfMonth, format, startOfMonth, startOfYear } from "date-fns";
import { fr as french } from "date-fns/locale";
import Link from "next/link";
import { Banknote, ClipboardList, TrendingUp, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  SYSTEM_ACCOUNT_CODES,
  accountBalance,
  accountByCode,
  expenseTotal,
  purchaseTotal,
} from "@/lib/accounting";
import { useTranslate } from "@/i18n/use-translate";
import { formatMUR } from "@/lib/format";
import { getStockStatus } from "@/lib/inventory";
import { orderTotal } from "@/lib/orders";
import { inDateRange } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const session = useAuthStore((state) => state.session);
  const { locale, t } = useTranslate();
  const kreolMonths = ["zanvie", "fevriye", "mars", "avril", "me", "zin", "zilye", "out", "septam", "oktob", "novam", "desam"];
  const orders = useAppStore((state) => state.orders);
  const purchases = useAppStore((state) => state.purchases);
  const expenses = useAppStore((state) => state.expenses);
  const journals = useAppStore((state) => state.journalEntries);
  const accounts = useAppStore((state) => state.accounts);
  const inventory = useAppStore((state) => state.inventory);
  const employees = useAppStore((state) => state.employees);
  const leaveRequests = useAppStore((state) => state.leaveRequests);
  const payslips = useAppStore((state) => state.payslips);

  const today = new Date();
  const monthFrom = format(startOfMonth(today), "yyyy-MM-dd");
  const monthTo = format(endOfMonth(today), "yyyy-MM-dd");
  const yearFrom = format(startOfYear(today), "yyyy-MM-dd");
  const todayIso = format(today, "yyyy-MM-dd");
  const period = format(today, "yyyy-MM");
  const monthLabel =
    locale === "fr"
      ? format(today, "MMMM yyyy", { locale: french })
      : locale === "mfe"
        ? `${kreolMonths[today.getMonth()]} ${format(today, "yyyy")}`
        : format(today, "MMMM yyyy");

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
    return { sales, food, running, depreciation, left: sales - food - running - depreciation };
  };

  const month = movement(monthFrom, monthTo);
  const quietMonth = month.sales === 0 && month.food === 0 && month.running === 0;
  const figures = quietMonth ? movement(yearFrom, todayIso) : month;
  const yearLabel = format(today, "yyyy");
  const periodLabel = quietMonth
    ? locale === "fr"
      ? `${yearLabel} jusqu'ici`
      : locale === "mfe"
        ? `${yearLabel} ziska zordi`
        : `${yearLabel} so far`
    : monthLabel;
  const { sales, left } = figures;

  const cash = accountByCode(accounts, SYSTEM_ACCOUNT_CODES.cash);
  const bank = accountByCode(accounts, SYSTEM_ACCOUNT_CODES.bank);
  const money =
    (cash ? accountBalance(cash, journals).balance : 0) + (bank ? accountBalance(bank, journals).balance : 0);

  const activeStaff = employees.filter((employee) => employee.isActive);
  const wageBill = activeStaff.reduce((sum, employee) => sum + employee.basicSalary, 0);
  const floor = orders.filter((order) => order.status === "open" || order.status === "preparing");
  const stockAlerts = inventory.filter((item) => getStockStatus(item) !== "in_stock");
  const pendingLeave = leaveRequests.filter((request) => request.status === "pending");
  const missingPayslips = activeStaff.filter(
    (employee) => !payslips.some((slip) => slip.employeeId === employee.id && slip.period === period)
  );

  const attention = [
    floor.length
      ? {
          href: "/dashboard/orders",
          title:
            locale === "fr"
              ? `${floor.length} commande${floor.length > 1 ? "s" : ""} encore en salle`
              : locale === "mfe"
                ? `${floor.length} komann ankor lor sal`
                : `${floor.length} order${floor.length === 1 ? "" : "s"} still on the floor`,
          detail: `${formatMUR(floor.reduce((sum, order) => sum + orderTotal(order), 0))} ${t("open or being prepared")}`,
          action: "See orders",
        }
      : null,
    stockAlerts.length
      ? {
          href: "/dashboard/inventory",
          title:
            locale === "fr"
              ? `${stockAlerts.length} ingrédient${stockAlerts.length > 1 ? "s" : ""} au minimum ou en dessous`
              : locale === "mfe"
                ? `${stockAlerts.length} engredian lor ouswa anba minimem`
                : `${stockAlerts.length} ingredient${stockAlerts.length === 1 ? "" : "s"} at or below minimum`,
          detail: "Restock before service runs short",
          action: "See inventory",
        }
      : null,
    pendingLeave.length
      ? {
          href: "/dashboard/payroll/leave",
          title:
            locale === "fr"
              ? `${pendingLeave.length} demande${pendingLeave.length > 1 ? "s" : ""} de congé en attente`
              : locale === "mfe"
                ? `${pendingLeave.length} demann konze pe atann`
                : `${pendingLeave.length} leave request${pendingLeave.length === 1 ? "" : "s"} waiting`,
          detail: "Approve or decline before the roster is set",
          action: "See leave",
        }
      : null,
    missingPayslips.length
      ? {
          href: "/dashboard/payroll/payslips",
          title:
            locale === "fr"
              ? `Les fiches de ${monthLabel} ne sont pas prêtes`
              : locale === "mfe"
                ? `Bilten ${monthLabel} pa pare`
                : `${monthLabel} payslips are not ready`,
          detail:
            locale === "fr"
              ? `${missingPayslips.length} employé${missingPayslips.length > 1 ? "s" : ""} actif${missingPayslips.length > 1 ? "s" : ""} sans fiche`
              : locale === "mfe"
                ? `${missingPayslips.length} anplwaye aktif bizwin ankor enn bilten`
                : `${missingPayslips.length} active employee${missingPayslips.length === 1 ? "" : "s"} still need a slip`,
          action: "Open payslips",
        }
      : null,
  ].filter((item): item is { href: string; title: string; detail: string; action: string } => Boolean(item));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`${locale === "fr" ? "Bonjour" : locale === "mfe" ? "Bonzour" : "Hello"}, ${session?.name.split(" ")[0] ?? (locale === "en" ? "there" : "")}`}
        description={
          locale === "fr"
            ? `${periodLabel}. Ventes, coûts et caisse, d'après les livres de ce navigateur.`
            : locale === "mfe"
              ? `${periodLabel}. Lavant, kou ek kas, depi liv dan sa navigater la.`
              : `${periodLabel}. Sales, costs and cash from the books in this browser.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sales"
          value={formatMUR(sales)}
          hint={quietMonth ? "No tickets this month, so this is the year" : "Tickets that were not cancelled"}
          icon={TrendingUp}
        />
        <StatCard
          title="Left after costs"
          value={formatMUR(left)}
          hint="Sales, less food, running costs and depreciation"
          icon={Wallet}
          tone={left < 0 ? "red" : "green"}
        />
        <StatCard title="Cash and bank" value={formatMUR(money)} hint="What the cashbook currently holds" icon={Banknote} />
        <StatCard
          title="Team"
          value={activeStaff.length}
          hint={
            locale === "fr"
              ? `${formatMUR(wageBill)} de salaires de base ce mois`
              : locale === "mfe"
                ? `${formatMUR(wageBill)} saler baz sa mwa`
                : `${formatMUR(wageBill)} basic salaries this month`
          }
          icon={Users}
          tone="slate"
        />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">{t("Needs a decision")}</h2>
        {attention.length === 0 ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {t("The floor, the storeroom and payroll are clear for now.")}
          </p>
        ) : (
          <div className="mt-3 divide-y overflow-hidden rounded-xl border border-slate-200 bg-white">
            {attention.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t(item.detail)}</span>
                </span>
                <span className="shrink-0 text-sm text-blue-700">{t(item.action)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/dashboard/reports/pnl" className="text-slate-600 hover:text-slate-900">
          {t("Profit and loss")}
        </Link>
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900">
          <ClipboardList className="size-3.5" />
          {t("Orders")}
        </Link>
        <Link href="/dashboard/inventory" className="text-slate-600 hover:text-slate-900">
          {t("Inventory")}
        </Link>
        <Link href="/dashboard/payroll/payslips" className="text-slate-600 hover:text-slate-900">
          {t("Payslips")}
        </Link>
      </div>
    </div>
  );
}
