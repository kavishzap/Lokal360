"use client";

import { useMemo } from "react";
import { ReportShell } from "@/components/reports/report-shell";
import { useReportQuery } from "@/hooks/use-report-query";
import { expenseTotal, purchaseTotal } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { orderTotal } from "@/lib/orders";
import { inDateRange, percent } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";

export default function PnlReportPage() {
  const orders = useAppStore((state) => state.orders);
  const purchases = useAppStore((state) => state.purchases ?? []);
  const expenses = useAppStore((state) => state.expenses ?? []);
  const journals = useAppStore((state) => state.journalEntries);
  const accounts = useAppStore((state) => state.accounts);
  const query = useReportQuery();

  const figures = useMemo(() => {
    const sales = orders
      .filter((order) => order.status !== "cancelled" && inDateRange(order.createdAt, query.from, query.to))
      .reduce((sum, order) => sum + orderTotal(order), 0);
    const cogs = purchases
      .filter((purchase) => inDateRange(purchase.date, query.from, query.to))
      .reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);
    const opex = expenses
      .filter((expense) => inDateRange(expense.date, query.from, query.to))
      .reduce((sum, expense) => sum + expenseTotal(expense), 0);
    const depreciation = journals
      .filter((entry) => entry.source === "depreciation" && inDateRange(entry.date, query.from, query.to))
      .reduce(
        (sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.debit, 0),
        0
      );
    const wageIds = new Set(
      accounts.filter((account) => ["5300", "5310", "5320", "5330", "5340"].includes(account.code)).map((account) => account.id)
    );
    const wages = journals
      .filter((entry) => entry.source === "payroll" && inDateRange(entry.date, query.from, query.to))
      .reduce(
        (sum, entry) =>
          sum + entry.lines.filter((line) => wageIds.has(line.accountId)).reduce((lineSum, line) => lineSum + line.debit, 0),
        0
      );
    const gross = sales - cogs;
    const net = gross - opex - wages - depreciation;
    return { sales, cogs, opex, wages, depreciation, gross, net };
  }, [orders, purchases, expenses, journals, accounts, query.from, query.to]);

  const ownerView = query.audience === "owner";
  const margin = percent(figures.net, figures.sales);
  const lines = [
    { label: ownerView ? "Sales" : "Food sales", amount: figures.sales, tone: "default" as const },
    {
      label: ownerView ? "Food and supplies bought" : "Cost of goods (purchases)",
      amount: -figures.cogs,
      tone: "muted" as const,
    },
    { label: "Gross profit", amount: figures.gross, tone: "emphasis" as const },
    {
      label: ownerView ? "Running the restaurant" : "Operating expenses",
      amount: -figures.opex,
      tone: "muted" as const,
    },
    { label: ownerView ? "Wages and contributions" : "Payroll", amount: -figures.wages, tone: "muted" as const },
    { label: "Depreciation", amount: -figures.depreciation, tone: "muted" as const },
    { label: ownerView ? "What is left" : "Net profit / (loss)", amount: figures.net, tone: "total" as const },
  ];

  return (
    <ReportShell
      title="Profit and loss"
      description="Sales less purchases, operating expenses and depreciation. Switch period or audience and the statement recalculates."
      query={query}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Sales</p>
          <p className="mt-1 text-xl font-semibold">{formatMUR(figures.sales)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Gross profit</p>
          <p className="mt-1 text-xl font-semibold">{formatMUR(figures.gross)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">
            {ownerView ? "Left after costs" : "Net profit"}
          </p>
          <p className={`mt-1 text-xl font-semibold ${figures.net < 0 ? "text-red-600" : ""}`}>
            {formatMUR(figures.net)}
          </p>
        </div>
      </div>

      {ownerView ? (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {figures.sales === 0
            ? "No sales in this period. Try This year to include the sample September tickets."
            : figures.net >= 0
              ? `The restaurant kept ${formatMUR(figures.net)} from ${formatMUR(figures.sales)} of sales (${margin}% margin).`
              : `The restaurant spent ${formatMUR(Math.abs(figures.net))} more than it took in. Sales were ${formatMUR(figures.sales)}.`}
        </p>
      ) : (
        <p className="mb-6 text-xs text-slate-500">
          Net margin {margin}%. Purchases are treated as cost of goods. Depreciation is taken from posted asset charges.
        </p>
      )}

      <table className="w-full text-sm">
        <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">{ownerView ? "Line" : "Particulars"}</th>
            <th className="py-2 text-right">Amount</th>
            {ownerView ? <th className="py-2 text-right">Of sales</th> : null}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr
              key={line.label}
              className={
                line.tone === "total"
                  ? "border-t-2 border-slate-900 font-semibold"
                  : line.tone === "emphasis"
                    ? "border-t font-medium"
                    : "border-t border-slate-100"
              }
            >
              <td className="py-3">{line.label}</td>
              <td className="py-3 text-right">{formatMUR(line.amount)}</td>
              {ownerView ? (
                <td className="py-3 text-right">{percent(Math.abs(line.amount), figures.sales)}%</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </ReportShell>
  );
}
