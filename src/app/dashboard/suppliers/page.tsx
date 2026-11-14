"use client";

import { useMemo, useState } from "react";
import { Pencil, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SupplierForm } from "@/components/accounting/supplier-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useTranslate } from "@/i18n/use-translate";
import { useAppStore } from "@/store/app-store";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const { t } = useTranslate();
  const suppliers = useAppStore((state) => state.suppliers);
  const purchases = useAppStore((state) => state.purchases);
  const deleteSupplier = useAppStore((state) => state.deleteSupplier);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  useCreateRequest("supplier", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return [...suppliers]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((supplier) => {
        if (!query) return true;
        const needle = query.toLowerCase();
        return (
          supplier.name.toLowerCase().includes(needle) ||
          supplier.phone.toLowerCase().includes(needle) ||
          supplier.email.toLowerCase().includes(needle)
        );
      });
  }, [suppliers, query]);

  const columns: DataTableColumn<Supplier>[] = [
    {
      header: "Supplier",
      cell: (supplier) => <span className="font-medium">{supplier.name}</span>,
    },
    { header: "Phone", cell: (supplier) => supplier.phone || "—" },
    { header: "Email", cell: (supplier) => supplier.email || "—" },
    {
      header: "Purchases",
      cell: (supplier) => purchases.filter((purchase) => purchase.supplierId === supplier.id).length,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (supplier) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Edit")}
            onClick={() => {
              setEditing(supplier);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("Delete")} onClick={() => setDeleting(supplier)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Companies you buy from."
        actionLabel="Add supplier"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={query} onChange={setQuery} placeholder="Search suppliers..." />
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(supplier) => supplier.id}
        empty={
          <EmptyState
            icon={Store}
            title="No suppliers yet"
            description="Companies you buy from."
            actionLabel="Add supplier"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <SupplierForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        supplier={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete supplier?"
        description="This removes the supplier from the directory."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteSupplier(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success(t("Delete supplier?"));
          setDeleting(null);
        }}
      />
    </div>
  );
}
