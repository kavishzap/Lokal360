"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { InvoicePaymentForm } from "@/components/accounting/invoice-payment-form";
import { InvoicePreview } from "@/components/accounting/invoice-preview";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useTranslate } from "@/i18n/use-translate";
import { invoiceTotals } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partial: "Part paid",
  paid: "Paid",
  void: "Void",
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  issued: "bg-blue-50 text-blue-700",
  partial: "bg-amber-50 text-amber-800",
  paid: "bg-emerald-50 text-emerald-700",
  void: "bg-red-50 text-red-700",
};

export default function InvoicesPage() {
  const { t } = useTranslate();
  const invoices = useAppStore((state) => state.invoices);
  const issueInvoice = useAppStore((state) => state.issueInvoice);
  const voidInvoice = useAppStore((state) => state.voidInvoice);
  const deleteInvoice = useAppStore((state) => state.deleteInvoice);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [removing, setRemoving] = useState<Invoice | null>(null);
  const [voiding, setVoiding] = useState<Invoice | null>(null);

  useCreateRequest("invoice", () => router.push("/dashboard/invoices/new"));

  const filtered = useMemo(() => {
    return [...invoices]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
      .filter((invoice) => {
        const haystack = `${invoice.number} ${invoice.customerName} ${invoice.customerPhone}`.toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        const matchesStatus = status === "all" || status == null || invoice.status === status;
        return matchesQuery && matchesStatus;
      });
  }, [invoices, query, status]);

  const openInvoices = invoices.filter((invoice) => invoice.status === "issued" || invoice.status === "partial");
  const outstanding = openInvoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).balance, 0);
  const collected = invoices
    .filter((invoice) => invoice.status !== "void")
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).paid, 0);

  const run = (result: { ok: boolean; error?: string }, success: string) => {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      header: "Invoice",
      cell: (invoice) => (
        <div>
          <p className="font-medium">{invoice.number}</p>
          <p className="text-xs text-slate-500">{formatDate(invoice.date)}</p>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (invoice) => (
        <div>
          <p>{invoice.customerName}</p>
          <p className="text-xs text-slate-500">{invoice.customerPhone || "—"}</p>
        </div>
      ),
    },
    { header: "Due", cell: (invoice) => formatDate(invoice.dueDate) },
    {
      header: "Status",
      cell: (invoice) => (
        <Badge className={STATUS_CLASS[invoice.status]} variant="outline">
          {t(STATUS_LABEL[invoice.status])}
        </Badge>
      ),
    },
    {
      header: "Total",
      cell: (invoice) => <span className="font-medium">{formatMUR(invoiceTotals(invoice).gross)}</span>,
    },
    {
      header: "Balance",
      cell: (invoice) => formatMUR(invoice.status === "void" ? 0 : invoiceTotals(invoice).balance),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={t("Actions")}>
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setViewing(invoice)}>{t("View")}</DropdownMenuItem>
            {invoice.status === "draft" ? (
              <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                {t("Edit")}
              </DropdownMenuItem>
            ) : null}
            {invoice.status === "draft" ? (
              <DropdownMenuItem
                onClick={() => run(issueInvoice(invoice.id), t("Issue invoice"))}
              >
                {t("Issue")}
              </DropdownMenuItem>
            ) : null}
            {invoice.status === "issued" || invoice.status === "partial" ? (
              <DropdownMenuItem onClick={() => setPaying(invoice)}>{t("Record payment")}</DropdownMenuItem>
            ) : null}
            {invoice.status !== "draft" && invoice.status !== "void" ? (
              <DropdownMenuItem onClick={() => setVoiding(invoice)}>{t("Void invoice")}</DropdownMenuItem>
            ) : null}
            {invoice.status === "draft" ? (
              <DropdownMenuItem variant="destructive" onClick={() => setRemoving(invoice)}>
                {t("Delete")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoicing"
        description="Customer invoices with VAT. Issuing one posts the sale. Record a payment when the customer pays."
        actionLabel="Create invoice"
        onAction={() => router.push("/dashboard/invoices/new")}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Invoices" value={invoices.length} icon={FileText} />
        <StatCard title="Outstanding" value={formatMUR(outstanding)} icon={FileText} tone="amber" />
        <StatCard title="Collected" value={formatMUR(collected)} icon={FileText} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search invoices..."
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-48">
            <SelectValue placeholder={t("All statuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All statuses")}</SelectItem>
            <SelectItem value="draft">{t("Draft")}</SelectItem>
            <SelectItem value="issued">{t("Issued")}</SelectItem>
            <SelectItem value="partial">{t("Part paid")}</SelectItem>
            <SelectItem value="paid">{t("Paid")}</SelectItem>
            <SelectItem value="void">{t("Void")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(invoice) => invoice.id}
        empty={
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Write a customer invoice, then issue it so the sale and VAT post to the books."
            actionLabel="Create invoice"
            onAction={() => router.push("/dashboard/invoices/new")}
          />
        }
      />

      <InvoicePreview invoice={viewing} onOpenChange={(open) => { if (!open) setViewing(null); }} />
      <InvoicePaymentForm invoice={paying} onOpenChange={(open) => { if (!open) setPaying(null); }} />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => { if (!open) setRemoving(null); }}
        title="Delete invoice"
        description="This draft will be removed."
        onConfirm={() => {
          if (!removing) return;
          run(deleteInvoice(removing.id), t("Delete invoice"));
          setRemoving(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(voiding)}
        onOpenChange={(open) => { if (!open) setVoiding(null); }}
        title="Void invoice"
        description="This reverses the sales posting and any payments already recorded."
        confirmLabel="Void invoice"
        onConfirm={() => {
          if (!voiding) return;
          run(voidInvoice(voiding.id), t("Void invoice"));
          setVoiding(null);
        }}
      />
    </div>
  );
}
