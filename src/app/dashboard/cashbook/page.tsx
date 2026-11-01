"use client";

import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cashbookRows } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export default function CashbookPage() {
  const accounts = useAppStore((state) => state.accounts);
  const journals = useAppStore((state) => state.journalEntries);
  const cashAccounts = useMemo(
    () => accounts.filter((account) => account.isCash && account.isActive).sort((a, b) => a.code.localeCompare(b.code)),
    [accounts]
  );
  const [accountId, setAccountId] = useState<string | null>("all");
  const selected =
    accountId && accountId !== "all"
      ? cashAccounts.filter((account) => account.id === accountId)
      : cashAccounts;

  const books = selected.map((account) => {
    const rows = cashbookRows(account, journals);
    const receipts = rows.reduce((sum, row) => sum + row.receipt, 0);
    const payments = rows.reduce((sum, row) => sum + row.payment, 0);
    return {
      account,
      rows,
      receipts,
      payments,
      closing: Number((receipts - payments).toFixed(2)),
    };
  });

  const totals = books.reduce(
    (sum, book) => ({
      receipts: sum.receipts + book.receipts,
      payments: sum.payments + book.payments,
      closing: sum.closing + book.closing,
    }),
    { receipts: 0, payments: 0, closing: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Cashbook"
        description="Receipts and payments on cash and bank accounts. Closing balance is what should be in the till or at the bank."
      />

      <div className="mb-4 max-w-md">
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Cash account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cash and bank</SelectItem>
            {cashAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.code} {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Receipts" value={formatMUR(totals.receipts)} icon={Wallet} tone="green" />
        <StatCard title="Payments" value={formatMUR(totals.payments)} icon={Wallet} tone="amber" />
        <StatCard title="Closing" value={formatMUR(totals.closing)} icon={Wallet} />
      </div>

      {cashAccounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No cash accounts"
          description="Mark an asset account as cashbook in the chart of accounts."
        />
      ) : (
        <div className="space-y-8">
          {books.map((book) => (
            <section key={book.account.id}>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {book.account.code} {book.account.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Closing {formatMUR(book.closing)}
                  </p>
                </div>
              </div>
              {book.rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No cash movements on this account.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Ref</th>
                        <th className="px-4 py-3">Particulars</th>
                        <th className="px-4 py-3 text-right">Receipt</th>
                        <th className="px-4 py-3 text-right">Payment</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {book.rows.map(({ entry, line, receipt, payment, running }) => (
                        <tr key={`${entry.id}-${line.id}`} className="border-t">
                          <td className="px-4 py-3">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3">{entry.number}</td>
                          <td className="px-4 py-3">
                            {entry.description}
                            {line.description ? (
                              <p className="text-xs text-slate-500">{line.description}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {receipt ? formatMUR(receipt) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {payment ? formatMUR(payment) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatMUR(running)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
