"use client";

import { useMemo } from "react";
import { ReportShell } from "@/components/reports/report-shell";
import { useReportQuery } from "@/hooks/use-report-query";
import { expenseTotal, PAYMENT_LABEL } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { inDateRange, percent } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";

export default function ExpenseReportPage() {
  const expenses = useAppStore((state) => state.expenses ?? []);
  const accounts = useAppStore((state) => state.accounts);
  const query = useReportQuery();

  const rows = useMemo(
    () =>
      [...expenses]
        .filter((expense) => inDateRange(expense.date, query.from, query.to))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [expenses, query.from, query.to]
  );

  const byAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of rows) {
      for (const line of expense.lines) {
        map.set(line.accountId, (map.get(line.accountId) ?? 0) + line.amount);
      }
    }
    return [...map.entries()]
      .map(([accountId, amount]) => ({
        account: accounts.find((account) => account.id === accountId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [rows, accounts]);

  const total = rows.reduce((sum, expense) => sum + expenseTotal(expense), 0);
  const top = byAccount[0];
  const ownerView = query.audience === "owner";

  return (
    <ReportShell
      title="Expense report"
      description="Choose who the report is for and a period. Figures update immediately from live books."
      query={query}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Bills</p>
          <p className="mt-1 text-xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Accounts used</p>
          <p className="mt-1 text-xl font-semibold">{byAccount.length}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Total spend</p>
          <p className="mt-1 text-xl font-semibold">{formatMUR(total)}</p>
        </div>
      </div>

      {ownerView && top && total > 0 ? (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Largest cost this period is{" "}
          <span className="font-medium text-slate-900">{top.account?.name ?? "Unassigned"}</span> at{" "}
          {formatMUR(top.amount)} ({percent(top.amount, total)}% of spend).
        </p>
      ) : null}

      <h2 className="mb-2 text-sm font-semibold text-slate-900">
        {ownerView ? "Where the money went" : "By ledger account"}
      </h2>
      <table className="mb-8 w-full text-sm">
        <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">Account</th>
            <th className="py-2 text-right">Amount</th>
            <th className="py-2 text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {byAccount.length === 0 ? (
            <tr>
              <td className="py-3 text-slate-500" colSpan={3}>
                No expenses in this period. Try This year or Custom dates.
              </td>
            </tr>
          ) : (
            byAccount.map((row) => (
              <tr key={row.account?.id ?? "unknown"} className="border-t">
                <td className="py-2">
                  {ownerView
                    ? (row.account?.name ?? "Unassigned")
                    : row.account
                      ? `${row.account.code} ${row.account.name}`
                      : "Unassigned"}
                </td>
                <td className="py-2 text-right">{formatMUR(row.amount)}</td>
                <td className="py-2 text-right">{percent(row.amount, total)}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {ownerView ? null : (
        <>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Source bills</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Ref</th>
                <th className="py-2">Payee</th>
                <th className="py-2">Paid with</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={5}>
                    No expense bills in this period.
                  </td>
                </tr>
              ) : (
                rows.map((expense) => (
                  <tr key={expense.id} className="border-t">
                    <td className="py-2">{formatDate(expense.date)}</td>
                    <td className="py-2">{expense.number}</td>
                    <td className="py-2">{expense.payee}</td>
                    <td className="py-2">{PAYMENT_LABEL[expense.payment]}</td>
                    <td className="py-2 text-right">{formatMUR(expenseTotal(expense))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </ReportShell>
  );
}
