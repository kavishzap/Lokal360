"use client";

import { useMemo, useState } from "react";
import { Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ExpenseForm } from "@/components/accounting/expense-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { expenseTotal, PAYMENT_LABEL } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Expense } from "@/types";

export default function ExpensesPage() {
  const expenses = useAppStore((state) => state.expenses);
  const accounts = useAppStore((state) => state.accounts);
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  useCreateRequest("expense", () => setOpen(true));

  const filtered = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
      .filter((expense) => {
        const matchesQuery =
          !query ||
          expense.number.toLowerCase().includes(query.toLowerCase()) ||
          expense.payee.toLowerCase().includes(query.toLowerCase()) ||
          expense.reference.toLowerCase().includes(query.toLowerCase()) ||
          expense.lines.some((line) => line.description.toLowerCase().includes(query.toLowerCase()));
        const matchesPayment = payment === "all" || payment == null || expense.payment === payment;
        return matchesQuery && matchesPayment;
      });
  }, [expenses, query, payment]);

  const total = expenses.reduce((sum, expense) => sum + expenseTotal(expense), 0);

  const columns: DataTableColumn<Expense>[] = [
    {
      header: "Expense",
      cell: (expense) => (
        <div>
          <p className="font-medium">{expense.number}</p>
          <p className="text-xs text-slate-500">{expense.reference || "No reference"}</p>
        </div>
      ),
    },
    { header: "Payee", cell: (expense) => expense.payee },
    { header: "Date", cell: (expense) => formatDate(expense.date) },
    {
      header: "Account",
      cell: (expense) =>
        expense.lines
          .map((line) => {
            const account = accounts.find((row) => row.id === line.accountId);
            return account ? `${account.code} ${account.name}` : line.description;
          })
          .join(", "),
    },
    { header: "Paid with", cell: (expense) => PAYMENT_LABEL[expense.payment] },
    {
      header: "Amount",
      cell: (expense) => <span className="font-medium">{formatMUR(expenseTotal(expense))}</span>,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (expense) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(expense)}>
          <Trash2 />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Record operating costs. They post to the journal as a debit to the expense account and a credit to cash, bank or payables."
        actionLabel="Record expense"
        onAction={() => setOpen(true)}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard title="Expense bills" value={expenses.length} icon={Receipt} />
        <StatCard title="Recorded spend" value={formatMUR(total)} icon={Receipt} tone="amber" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search expenses..."
          className="sm:max-w-xs"
        />
        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-48">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="credit">On credit</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(expense) => expense.id}
        empty={
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Record rent, electricity, wages and other operating costs."
            actionLabel="Record expense"
            onAction={() => setOpen(true)}
          />
        }
      />

      <ExpenseForm open={open} onOpenChange={setOpen} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete expense?"
        description="This also removes the related journal entry."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteExpense(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Expense deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
