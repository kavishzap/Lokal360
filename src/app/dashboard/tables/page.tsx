"use client";

import { useMemo, useState } from "react";
import { Armchair, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableCard } from "@/components/tables/table-card";
import { TableForm } from "@/components/tables/table-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDate } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { RestaurantTable } from "@/types";

export default function TablesPage() {
  const tables = useAppStore((state) => state.tables);
  const zones = useAppStore((state) => state.zones);
  const deleteTable = useAppStore((state) => state.deleteTable);
  const [query, setQuery] = useState("");
  const [zoneId, setZoneId] = useState<string | null>("all");
  const [status, setStatus] = useState<string | null>("all");
  const [view, setView] = useState<"grid" | "list">("list");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = useState<RestaurantTable | null>(null);

  useCreateRequest("table", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return tables.filter((table) => {
      const zone = zones.find((row) => row.id === table.zoneId);
      const matchesQuery =
        !query ||
        table.name.toLowerCase().includes(query.toLowerCase()) ||
        (zone?.name.toLowerCase().includes(query.toLowerCase()) ?? false);
      const matchesZone = zoneId === "all" || zoneId == null || table.zoneId === zoneId;
      const matchesStatus =
        status === "all" || status == null || (status === "active" ? table.isActive : !table.isActive);
      return matchesQuery && matchesZone && matchesStatus;
    });
  }, [tables, zones, query, zoneId, status]);

  const grouped = zones
    .map((zone) => ({
      zone,
      tables: filtered.filter((table) => table.zoneId === zone.id),
    }))
    .filter((group) => group.tables.length > 0);

  const columns: DataTableColumn<RestaurantTable>[] = [
    { header: "Table", cell: (table) => <span className="font-medium">{table.name}</span> },
    {
      header: "Zone",
      cell: (table) => zones.find((zone) => zone.id === table.zoneId)?.name ?? "—",
    },
    { header: "Capacity", cell: (table) => `${table.capacity} seats` },
    { header: "Status", cell: (table) => <StatusBadge active={table.isActive} /> },
    { header: "Created", cell: (table) => formatDate(table.createdAt) },
    {
      header: "Actions",
      className: "text-right",
      cell: (table) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(table);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(table)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tables"
        description="Restaurant tables must belong to a zone. Duplicate names are not allowed in the same zone."
        actionLabel="Add table"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <div className="flex rounded-lg border bg-white p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
          >
            <List />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tables..." />
        <Select value={zoneId} onValueChange={setZoneId}>
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No tables found"
          description="Add tables to a zone to start building the floor plan."
          actionLabel="Add table"
          onAction={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      ) : view === "list" ? (
        <DataTable data={filtered} columns={columns} rowKey={(table) => table.id} />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ zone, tables: zoneTables }) => (
            <section key={zone.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">{zone.name}</h2>
                <span className="text-sm text-slate-500">{zoneTables.length} tables</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {zoneTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    zone={zone}
                    onEdit={() => {
                      setEditing(table);
                      setOpen(true);
                    }}
                    onDelete={() => setDeleting(table)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <TableForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        table={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete table?"
        description={`This will remove ${deleting?.name ?? "the table"} from the back office.`}
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteTable(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Table deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
