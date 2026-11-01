"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { JournalForm } from "@/components/accounting/journal-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormModal } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateRequest } from "@/hooks/use-create-request";
import { journalTotals } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { JournalEntry } from "@/types";

const SOURCE_LABEL = {
  manual: "Manual",
  purchase: "Purchase",
  inventory: "Inventory",
  expense: "Expense",
  asset: "Asset",
  depreciation: "Depreciation",
};

export default function JournalPage() {
  const journals = useAppStore((state) => state.journalEntries);
  const accounts = useAppStore((state) => state.accounts);
  const deleteJournal = useAppStore((state) => state.deleteJournal);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState<JournalEntry | null>(null);

  useCreateRequest("journal", () => setOpen(true));

  const rows = useMemo(() => {
    return [...journals]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
      .filter((entry) => {
        if (!query) return true;
        const hay = `${entry.number} ${entry.description} ${entry.lines
          .map((line) => line.description)
          .join(" ")}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      });
  }, [journals, query]);

  return (
    <div>
      <PageHeader
        title="Journal Book"
        description="Every double-entry posting. Purchases, expenses and inventory posts are created automatically. Use a manual entry for adjustments."
        actionLabel="Add journal entry"
        onAction={() => setOpen(true)}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard title="Journal entries" value={journals.length} icon={NotebookPen} />
        <StatCard
          title="Manual entries"
          value={journals.filter((entry) => entry.source === "manual").length}
          icon={NotebookPen}
          tone="slate"
        />
      </div>

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search journal..."
          className="sm:max-w-xs"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No journal entries"
          description="Post a balanced debit and credit."
          actionLabel="Add journal entry"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((entry) => {
            const totals = journalTotals(entry.lines);
            return (
              <div key={entry.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {entry.number}
                      <span className="ml-2 font-normal text-slate-500">{formatDate(entry.date)}</span>
                    </p>
                    <p className="text-sm text-slate-600">{entry.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{SOURCE_LABEL[entry.source]}</Badge>
                    <span className="text-sm font-medium">{formatMUR(totals.debit)}</span>
                    <Button variant="outline" size="sm" onClick={() => setViewing(entry)}>
                      View
                    </Button>
                    {entry.source === "manual" ? (
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(entry)}>
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {entry.lines.map((line) => {
                      const account = accounts.find((row) => row.id === line.accountId);
                      return (
                        <tr key={line.id} className="border-t border-slate-50">
                          <td className="px-4 py-2">
                            {account ? `${account.code} ${account.name}` : "Unknown account"}
                            {line.description ? (
                              <span className="text-slate-500"> — {line.description}</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {line.debit ? formatMUR(line.debit) : ""}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {line.credit ? formatMUR(line.credit) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <JournalForm open={open} onOpenChange={setOpen} />
      <FormModal
        open={Boolean(viewing)}
        onOpenChange={(next) => {
          if (!next) setViewing(null);
        }}
        title={viewing ? viewing.number : "Journal"}
        description={viewing?.description}
        className="sm:max-w-2xl"
      >
        {viewing ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-slate-500 uppercase">
                <th className="py-2">Account</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {viewing.lines.map((line) => {
                const account = accounts.find((row) => row.id === line.accountId);
                return (
                  <tr key={line.id} className="border-t">
                    <td className="py-2">
                      {account ? `${account.code} ${account.name}` : "Unknown"}
                    </td>
                    <td className="py-2 text-right">{line.debit ? formatMUR(line.debit) : "—"}</td>
                    <td className="py-2 text-right">{line.credit ? formatMUR(line.credit) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </FormModal>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete journal entry?"
        description="Only manual entries can be removed."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteJournal(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Journal entry deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
