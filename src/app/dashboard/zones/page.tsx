"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinned, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormModal } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ZoneForm } from "@/components/zones/zone-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDate, formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Zone } from "@/types";

export default function ZonesPage() {
  const router = useRouter();
  const zones = useAppStore((state) => state.zones);
  const tables = useAppStore((state) => state.tables);
  const deleteZone = useAppStore((state) => state.deleteZone);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState<Zone | null>(null);
  const [viewing, setViewing] = useState<Zone | null>(null);

  useCreateRequest("zone", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return zones.filter((zone) => {
      const matchesQuery = !query || zone.name.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ||
        status == null ||
        (status === "active" ? zone.isActive : !zone.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [zones, query, status]);

  const viewingTables = tables.filter((table) => table.zoneId === viewing?.id);

  const columns: DataTableColumn<Zone>[] = [
    {
      header: "Zone",
      cell: (zone) => <span className="font-medium text-slate-900">{zone.name}</span>,
    },
    {
      header: "Tables",
      cell: (zone) => {
        const count = tables.filter((table) => table.zoneId === zone.id).length;
        return (
          <Button
            variant="ghost"
            className="h-8 px-2 text-blue-700"
            onClick={() => setViewing(zone)}
          >
            {count} {count === 1 ? "table" : "tables"}
          </Button>
        );
      },
    },
    {
      header: "Status",
      cell: (zone) => <StatusBadge active={zone.isActive} />,
    },
    {
      header: "Created",
      cell: (zone) => formatDate(zone.createdAt),
    },
    {
      header: "Last updated",
      cell: (zone) => formatDateTime(zone.updatedAt),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (zone) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(zone);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(zone)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Zones"
        description="Physical restaurant areas used to organise tables."
        actionLabel="Add zone"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search zones..."
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(zone) => zone.id}
        empty={
          <EmptyState
            icon={MapPinned}
            title="No zones found"
            description="Create your first dining zone to start assigning tables."
            actionLabel="Add zone"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <ZoneForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        zone={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete zone?"
        description="This will permanently remove the zone from the back office. Zones with assigned tables cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteZone(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Zone deleted");
          setDeleting(null);
        }}
      />
      <FormModal
        open={Boolean(viewing)}
        onOpenChange={(next) => !next && setViewing(null)}
        title={viewing ? `${viewing.name} tables` : "Tables"}
        description="Tables currently assigned to this zone."
      >
        {viewingTables.length === 0 ? (
          <p className="text-sm text-slate-500">No tables are assigned to this zone yet.</p>
        ) : (
          <div className="space-y-2">
            {viewingTables.map((table) => (
              <div key={table.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{table.name}</span>
                <span className="text-slate-500">{table.capacity} seats</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              setViewing(null);
              router.push("/dashboard/tables");
            }}
          >
            Manage tables
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
