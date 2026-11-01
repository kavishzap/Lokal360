"use client";

import { useMemo } from "react";
import { ReportShell } from "@/components/reports/report-shell";
import { useReportQuery } from "@/hooks/use-report-query";
import { formatDate, formatMUR } from "@/lib/format";
import { orderTotal } from "@/lib/orders";
import { inDateRange, percent } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";

export default function SalesReportPage() {
  const orders = useAppStore((state) => state.orders);
  const tables = useAppStore((state) => state.tables);
  const zones = useAppStore((state) => state.zones);
  const categories = useAppStore((state) => state.categories);
  const query = useReportQuery();

  const rows = useMemo(
    () =>
      [...orders]
        .filter((order) => order.status !== "cancelled" && inDateRange(order.createdAt, query.from, query.to))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders, query.from, query.to]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>();
    for (const order of rows) {
      for (const item of order.items) {
        const current = map.get(item.categoryId) ?? { qty: 0, amount: 0 };
        current.qty += item.quantity;
        current.amount += item.quantity * item.unitPrice;
        map.set(item.categoryId, current);
      }
    }
    return [...map.entries()]
      .map(([categoryId, value]) => ({
        category: categories.find((category) => category.id === categoryId),
        ...value,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [rows, categories]);

  const covers = rows.length;
  const itemsSold = rows.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const total = rows.reduce((sum, order) => sum + orderTotal(order), 0);
  const average = covers ? total / covers : 0;
  const top = byCategory[0];
  const ownerView = query.audience === "owner";

  return (
    <ReportShell
      title="Sales report"
      description="Choose who the report is for and a period. Cancelled tickets are excluded."
      query={query}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Tickets</p>
          <p className="mt-1 text-xl font-semibold">{covers}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Items sold</p>
          <p className="mt-1 text-xl font-semibold">{itemsSold}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Sales</p>
          <p className="mt-1 text-xl font-semibold">{formatMUR(total)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs tracking-wide text-slate-500 uppercase">Average ticket</p>
          <p className="mt-1 text-xl font-semibold">{formatMUR(average)}</p>
        </div>
      </div>

      {ownerView && top && total > 0 ? (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Best seller category is{" "}
          <span className="font-medium text-slate-900">{top.category?.name ?? "Uncategorised"}</span>{" "}
          at {formatMUR(top.amount)} ({percent(top.amount, total)}% of sales).
        </p>
      ) : null}

      <h2 className="mb-2 text-sm font-semibold text-slate-900">
        {ownerView ? "Sales mix" : "By menu category"}
      </h2>
      <table className="mb-8 w-full text-sm">
        <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">Category</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Amount</th>
            <th className="py-2 text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {byCategory.length === 0 ? (
            <tr>
              <td className="py-3 text-slate-500" colSpan={4}>
                No sales in this period. Try This year — sample orders sit in September.
              </td>
            </tr>
          ) : (
            byCategory.map((row) => (
              <tr key={row.category?.id ?? "unknown"} className="border-t">
                <td className="py-2">{row.category?.name ?? "Uncategorised"}</td>
                <td className="py-2 text-right">{row.qty}</td>
                <td className="py-2 text-right">{formatMUR(row.amount)}</td>
                <td className="py-2 text-right">{percent(row.amount, total)}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {ownerView ? null : (
        <>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Tickets</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Order</th>
                <th className="py-2">Zone / table</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={5}>
                    No orders in this period.
                  </td>
                </tr>
              ) : (
                rows.map((order) => {
                  const table = tables.find((row) => row.id === order.tableId);
                  const zone = zones.find((row) => row.id === order.zoneId);
                  return (
                    <tr key={order.id} className="border-t">
                      <td className="py-2">{formatDate(order.createdAt)}</td>
                      <td className="py-2">{order.orderNumber}</td>
                      <td className="py-2">
                        {zone?.name ?? "—"} / {table?.name ?? "—"}
                      </td>
                      <td className="py-2 capitalize">{order.status}</td>
                      <td className="py-2 text-right">{formatMUR(orderTotal(order))}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </ReportShell>
  );
}
