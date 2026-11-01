"use client";

import { useMemo, useState } from "react";
import { Boxes, History, Minus, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormModal } from "@/components/shared/form-modal";
import { InventoryStatusBadge } from "@/components/shared/inventory-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { InventorySetupForm } from "@/components/inventory/inventory-setup-form";
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDateTime, formatMUR } from "@/lib/format";
import { getStockStatus, inventoryValue } from "@/lib/inventory";
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { InventoryItem } from "@/types";

export default function InventoryPage() {
  const inventory = useAppStore((state) => state.inventory);
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const transactions = useAppStore((state) => state.transactions);
  const deleteInventory = useAppStore((state) => state.deleteInventory);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [setupOpen, setSetupOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [stockMode, setStockMode] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);

  useCreateRequest("inventory", () => {
    setEditing(null);
    setSetupOpen(true);
  });

  const rows = useMemo(() => {
    return inventory.filter((item) => {
      const ingredient = ingredients.find((row) => row.id === item.ingredientId);
      const stockStatus = getStockStatus(item);
      const matchesQuery =
        !query || (ingredient?.name.toLowerCase().includes(query.toLowerCase()) ?? false);
      const matchesStatus = status === "all" || status == null || stockStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [inventory, ingredients, query, status]);

  const lowStock = inventory.filter((item) => getStockStatus(item) === "low_stock").length;
  const outOfStock = inventory.filter((item) => getStockStatus(item) === "out_of_stock").length;
  const totalValue = inventory.reduce((sum, item) => sum + inventoryValue(item), 0);
  const historyRows = historyItem
    ? transactions.filter((tx) => tx.inventoryItemId === historyItem.id)
    : transactions;

  const openStock = (item: InventoryItem, mode: "IN" | "OUT" | "ADJUSTMENT") => {
    setStockItem(item);
    setStockMode(mode);
  };

  const openHistory = (item: InventoryItem | null) => {
    setHistoryItem(item);
    setHistoryOpen(true);
  };

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      header: "Ingredient",
      cell: (item) => ingredients.find((row) => row.id === item.ingredientId)?.name ?? "Unknown",
    },
    {
      header: "Current stock",
      cell: (item) => {
        const ingredient = ingredients.find((row) => row.id === item.ingredientId);
        return `${item.currentStock} ${unitAbbreviation(units, ingredient?.unitId)}`;
      },
    },
    { header: "Min level", cell: (item) => item.minimumStock },
    { header: "Unit cost", cell: (item) => formatMUR(item.costPerUnit) },
    { header: "Total value", cell: (item) => formatMUR(inventoryValue(item)) },
    {
      header: "Status",
      cell: (item) => <InventoryStatusBadge status={getStockStatus(item)} />,
    },
    { header: "Updated", cell: (item) => formatDateTime(item.lastUpdated) },
    {
      header: "Actions",
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openStock(item, "IN")}>
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openStock(item, "OUT")}>
            <Minus />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openStock(item, "ADJUSTMENT")}>
            <SlidersHorizontal />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openHistory(item)}>
            <History />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(item);
              setSetupOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(item)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track ingredient stock, costs and movement. Stock is not deducted when recipes change."
        actionLabel="Track ingredient"
        onAction={() => {
          setEditing(null);
          setSetupOpen(true);
        }}
      >
        <Button variant="outline" className="h-9" onClick={() => openHistory(null)}>
          <History /> All history
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ingredients tracked" value={inventory.length} icon={Boxes} />
        <StatCard title="Low stock items" value={lowStock} icon={Boxes} tone="amber" />
        <StatCard title="Out of stock" value={outOfStock} icon={Boxes} tone="red" />
        <StatCard title="Total inventory value" value={formatMUR(totalValue)} icon={Boxes} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search inventory..."
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-48">
            <SelectValue placeholder="Stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(item) => item.id}
        empty={
          <EmptyState
            icon={Boxes}
            title="No inventory records"
            description="Select an existing ingredient and set opening stock, minimum level and unit cost."
            actionLabel="Track ingredient"
            onAction={() => {
              setEditing(null);
              setSetupOpen(true);
            }}
          />
        }
      />

      <InventorySetupForm
        open={setupOpen}
        onOpenChange={(next) => {
          setSetupOpen(next);
          if (!next) setEditing(null);
        }}
        item={editing}
      />
      <StockAdjustmentDialog
        open={Boolean(stockItem)}
        onOpenChange={(next) => !next && setStockItem(null)}
        item={stockItem}
        mode={stockMode}
      />
      <FormModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title={historyItem ? "Stock history" : "All stock history"}
        className="sm:max-w-3xl"
      >
        <div className="max-h-[60vh] overflow-auto">
          {historyRows.length === 0 ? (
            <p className="text-sm text-slate-500">No stock movements recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="pb-2">Ingredient</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2">From → To</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((tx) => {
                  const record = inventory.find((item) => item.id === tx.inventoryItemId);
                  const ingredient = ingredients.find((item) => item.id === record?.ingredientId);
                  return (
                    <tr key={tx.id} className="border-t">
                      <td className="py-2 font-medium">{ingredient?.name ?? "—"}</td>
                      <td className="py-2">{tx.type}</td>
                      <td className="py-2">{tx.quantityChange}</td>
                      <td className="py-2">
                        {tx.previousStock} → {tx.newStock}
                      </td>
                      <td className="py-2 text-slate-500">{tx.reason}</td>
                      <td className="py-2">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </FormModal>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Remove inventory record?"
        description="This removes stock tracking for the ingredient. The ingredient itself is not deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteInventory(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Inventory record removed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
