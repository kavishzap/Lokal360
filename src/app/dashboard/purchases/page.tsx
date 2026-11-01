"use client";

import { useMemo, useState } from "react";
import { Boxes, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { PostInventoryDialog } from "@/components/accounting/post-inventory-dialog";
import { PurchaseForm } from "@/components/accounting/purchase-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
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
import { lineAmount, purchaseTotal } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Purchase, PurchaseLine } from "@/types";

const PAYMENT_LABEL = {
  cash: "Cash",
  bank: "Bank",
  credit: "On credit",
};

export default function PurchasesPage() {
  const purchases = useAppStore((state) => state.purchases);
  const ingredients = useAppStore((state) => state.ingredients);
  const deletePurchase = useAppStore((state) => state.deletePurchase);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const [posting, setPosting] = useState<{ purchase: Purchase; line: PurchaseLine } | null>(null);

  useCreateRequest("purchase", () => setOpen(true));

  const filtered = useMemo(() => {
    return [...purchases]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
      .filter((purchase) => {
        const matchesQuery =
          !query ||
          purchase.number.toLowerCase().includes(query.toLowerCase()) ||
          purchase.supplier.toLowerCase().includes(query.toLowerCase()) ||
          purchase.invoiceNumber.toLowerCase().includes(query.toLowerCase());
        const matchesPayment = payment === "all" || payment == null || purchase.payment === payment;
        return matchesQuery && matchesPayment;
      });
  }, [purchases, query, payment]);

  const outstanding = purchases.filter((purchase) =>
    purchase.lines.some((line) => !line.postedToInventory)
  ).length;
  const monthTotal = purchases.reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);

  const columns: DataTableColumn<Purchase>[] = [
    {
      header: "Purchase",
      cell: (purchase) => (
        <div>
          <p className="font-medium">{purchase.number}</p>
          <p className="text-xs text-slate-500">{purchase.invoiceNumber || "No invoice no."}</p>
        </div>
      ),
    },
    { header: "Supplier", cell: (purchase) => purchase.supplier },
    { header: "Date", cell: (purchase) => formatDate(purchase.date) },
    { header: "Paid with", cell: (purchase) => PAYMENT_LABEL[purchase.payment] },
    {
      header: "Amount",
      cell: (purchase) => <span className="font-medium">{formatMUR(purchaseTotal(purchase))}</span>,
    },
    {
      header: "Inventory",
      cell: (purchase) => {
        const posted = purchase.lines.filter((line) => line.postedToInventory).length;
        const pending = purchase.lines.length - posted;
        return pending === 0 ? (
          <Badge className="bg-emerald-50 text-emerald-700" variant="outline">
            In stock
          </Badge>
        ) : (
          <Badge className="bg-amber-50 text-amber-800" variant="outline">
            {pending} line{pending === 1 ? "" : "s"} to post
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (purchase) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(purchase)}>
          <Trash2 />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Record supplier bills. They post to the journal at once. After saving, post each line to inventory when the goods are on the shelf."
        actionLabel="Record purchase"
        onAction={() => setOpen(true)}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Purchase bills" value={purchases.length} icon={Truck} />
        <StatCard title="Waiting on inventory" value={outstanding} icon={Boxes} tone="amber" />
        <StatCard title="Recorded spend" value={formatMUR(monthTotal)} icon={Truck} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search purchases..."
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
        rowKey={(purchase) => purchase.id}
        empty={
          <EmptyState
            icon={Truck}
            title="No purchases yet"
            description="Record a supplier invoice, then post lines to inventory when stock arrives."
            actionLabel="Record purchase"
            onAction={() => setOpen(true)}
          />
        }
      />

      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Lines waiting for inventory</h2>
        {purchases.every((purchase) => purchase.lines.every((line) => line.postedToInventory)) ? (
          <p className="text-sm text-slate-500">Every purchased line has been posted to inventory.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Purchase</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.flatMap((purchase) =>
                  purchase.lines
                    .filter((line) => !line.postedToInventory)
                    .map((line) => (
                      <tr key={line.id} className="border-t">
                        <td className="px-4 py-3">
                          {purchase.number}
                          <p className="text-xs text-slate-500">{purchase.supplier}</p>
                        </td>
                        <td className="px-4 py-3">{line.description}</td>
                        <td className="px-4 py-3">
                          {ingredients.find((item) => item.id === line.ingredientId)?.name ??
                            "Not linked"}
                        </td>
                        <td className="px-4 py-3">{line.quantity}</td>
                        <td className="px-4 py-3">{formatMUR(lineAmount(line))}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => setPosting({ purchase, line })}
                          >
                            Add to inventory
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseForm open={open} onOpenChange={setOpen} />
      <PostInventoryDialog
        open={Boolean(posting)}
        onOpenChange={(next) => {
          if (!next) setPosting(null);
        }}
        purchase={posting?.purchase ?? null}
        line={posting?.line ?? null}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete purchase?"
        description="This also removes the related journal entry. Lines already posted to inventory cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deletePurchase(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Purchase deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
