"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { OrderForm } from "@/components/orders/order-form";
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
import { ORDER_STATUSES, orderTotal } from "@/lib/orders";
import { useAppStore } from "@/store/app-store";
import type { Order } from "@/types";

export default function OrdersPage() {
  const orders = useAppStore((state) => state.orders);
  const tables = useAppStore((state) => state.tables);
  const zones = useAppStore((state) => state.zones);
  const categories = useAppStore((state) => state.categories);
  const deleteOrder = useAppStore((state) => state.deleteOrder);
  const [query, setQuery] = useState("");
  const [zoneId, setZoneId] = useState<string | null>("all");
  const [tableId, setTableId] = useState<string | null>("all");
  const [categoryId, setCategoryId] = useState<string | null>("all");
  const [status, setStatus] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  useCreateRequest("order", () => {
    setEditing(null);
    setOpen(true);
  });

  const zoneTables = useMemo(
    () => tables.filter((table) => zoneId === "all" || zoneId == null || table.zoneId === zoneId),
    [tables, zoneId]
  );

  const filtered = useMemo(() => {
    return [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((order) => {
        const table = tables.find((row) => row.id === order.tableId);
        const zone = zones.find((row) => row.id === order.zoneId);
        const matchesQuery =
          !query ||
          order.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          (table?.name.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          (zone?.name.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          order.items.some((item) => item.name.toLowerCase().includes(query.toLowerCase()));
        const matchesZone = zoneId === "all" || zoneId == null || order.zoneId === zoneId;
        const matchesTable = tableId === "all" || tableId == null || order.tableId === tableId;
        const matchesStatus = status === "all" || status == null || order.status === status;
        const matchesCategory =
          categoryId === "all" ||
          categoryId == null ||
          order.items.some((item) => item.categoryId === categoryId);
        return matchesQuery && matchesZone && matchesTable && matchesStatus && matchesCategory;
      });
  }, [orders, tables, zones, query, zoneId, tableId, status, categoryId]);

  const columns: DataTableColumn<Order>[] = [
    {
      header: "Order",
      cell: (order) => <span className="font-medium">{order.orderNumber}</span>,
    },
    {
      header: "Zone",
      cell: (order) => zones.find((zone) => zone.id === order.zoneId)?.name ?? "—",
    },
    {
      header: "Table",
      cell: (order) => tables.find((table) => table.id === order.tableId)?.name ?? "—",
    },
    {
      header: "Items",
      cell: (order) => (
        <div>
          <p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
          <p className="max-w-xs truncate text-xs text-slate-500">
            {order.items
              .map((item) => {
                const category = categories.find((row) => row.id === item.categoryId);
                return `${item.quantity}× ${item.name}${category ? ` (${category.name})` : ""}`;
              })
              .join(", ")}
          </p>
        </div>
      ),
    },
    {
      header: "Total",
      cell: (order) => <span className="font-medium">{formatMUR(orderTotal(order))}</span>,
    },
    {
      header: "Status",
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      header: "Created",
      cell: (order) => formatDateTime(order.createdAt),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (order) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(order);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(order)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Create table orders using restaurant zones, tables, menu categories and menu items."
        actionLabel="Add order"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={query} onChange={setQuery} placeholder="Search orders..." />
        <Select
          value={zoneId}
          onValueChange={(value) => {
            setZoneId(value);
            setTableId("all");
          }}
        >
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tableId} onValueChange={setTableId}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tables</SelectItem>
            {zoneTables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                {table.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(order) => order.id}
        empty={
          <EmptyState
            icon={ClipboardList}
            title="No orders found"
            description="Create an order by choosing a zone, table and menu items."
            actionLabel="Add order"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <OrderForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        order={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete order?"
        description={`This will remove ${deleting?.orderNumber ?? "the order"} from the back office.`}
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteOrder(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Order deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
