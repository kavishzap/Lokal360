"use client";

import { useMemo, useState } from "react";
import { BookText } from "lucide-react";
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
import { accountBalance, ACCOUNT_TYPES, isDebitNormal, ledgerRows } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export default function LedgerPage() {
  const accounts = useAppStore((state) => state.accounts);
  const journals = useAppStore((state) => state.journalEntries);
  const ordered = useMemo(
    () => [...accounts].sort((a, b) => a.code.localeCompare(b.code)),
    [accounts]
  );
  const [accountId, setAccountId] = useState<string | null>(ordered[0]?.id ?? null);
  const account = accounts.find((row) => row.id === accountId) ?? ordered[0] ?? null;
  const rows = account ? ledgerRows(account, journals) : [];
  const totals = account ? accountBalance(account, journals) : null;

  return (
    <div>
      <PageHeader
        title="Ledger"
        description="One account at a time, with a running balance. This is the book the accountant uses to inspect cash, stock, sales and expenses."
      />

      <div className="mb-4 max-w-md">
        <Select value={account?.id ?? null} onValueChange={setAccountId}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((type) => (
              <div key={type.value}>
                {ordered
                  .filter((row) => row.type === type.value)
                  .map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.code} {row.name}
                    </SelectItem>
                  ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {account && totals ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard title="Debits" value={formatMUR(totals.debit)} icon={BookText} />
          <StatCard title="Credits" value={formatMUR(totals.credit)} icon={BookText} tone="slate" />
          <StatCard
            title={`${isDebitNormal(account.type) ? "Debit" : "Credit"} balance`}
            value={formatMUR(totals.balance)}
            icon={BookText}
            tone="green"
          />
        </div>
      ) : null}

      {!account ? (
        <EmptyState icon={BookText} title="No accounts" description="Add accounts first." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookText}
          title="No postings"
          description={`${account.code} ${account.name} has no journal activity yet.`}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Journal</th>
                <th className="px-4 py-3">Particulars</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, line, running }) => (
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
                    {line.debit ? formatMUR(line.debit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {line.credit ? formatMUR(line.credit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatMUR(running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
