"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AccountForm } from "@/components/accounting/account-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { ACCOUNT_TYPES, accountBalance, isDebitNormal, trialBalance } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Account } from "@/types";

export default function ChartOfAccountsPage() {
  const accounts = useAppStore((state) => state.accounts);
  const journals = useAppStore((state) => state.journalEntries);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  useCreateRequest("account", () => {
    setEditing(null);
    setOpen(true);
  });

  const rows = useMemo(() => {
    return [...accounts]
      .sort((a, b) => a.code.localeCompare(b.code))
      .filter((account) => {
        const matchesQuery =
          !query ||
          account.code.includes(query) ||
          account.name.toLowerCase().includes(query.toLowerCase());
        const matchesType = type === "all" || type == null || account.type === type;
        return matchesQuery && matchesType;
      });
  }, [accounts, query, type]);

  const trial = trialBalance(accounts, journals);
  const debitTotal = trial.reduce((sum, row) => sum + row.debit, 0);
  const creditTotal = trial.reduce((sum, row) => sum + row.credit, 0);

  const columns: DataTableColumn<Account>[] = [
    {
      header: "Code",
      cell: (account) => <span className="font-medium">{account.code}</span>,
    },
    { header: "Account", cell: (account) => account.name },
    {
      header: "Type",
      cell: (account) => (
        <Badge variant="outline" className="capitalize">
          {account.type}
        </Badge>
      ),
    },
    {
      header: "Normal",
      cell: (account) => (isDebitNormal(account.type) ? "Debit" : "Credit"),
    },
    {
      header: "Balance",
      cell: (account) => formatMUR(accountBalance(account, journals).balance),
    },
    {
      header: "Status",
      cell: (account) => (
        <div className="flex items-center gap-2">
          <StatusBadge active={account.isActive} />
          {account.isCash ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Cashbook
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (account) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(account);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={account.isSystem}
            onClick={() => setDeleting(account)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="The restaurant ledger. System accounts stay in place so purchases, cash and inventory post correctly."
        actionLabel="Add account"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Accounts" value={accounts.length} icon={BookOpen} />
        <StatCard title="Trial debit" value={formatMUR(debitTotal)} icon={BookOpen} tone="slate" />
        <StatCard title="Trial credit" value={formatMUR(creditTotal)} icon={BookOpen} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search accounts..."
          className="sm:max-w-xs"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACCOUNT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(account) => account.id}
        empty={
          <EmptyState
            icon={BookOpen}
            title="No accounts"
            description="Add the accounts the restaurant posts to."
            actionLabel="Add account"
            onAction={() => setOpen(true)}
          />
        }
      />

      <AccountForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        account={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete account?"
        description="Accounts with journal activity cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteAccount(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Account deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
