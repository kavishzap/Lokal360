"use client";

import { useMemo, useState } from "react";
import { Pencil, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { UnitForm } from "@/components/units/unit-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { MeasurementUnit } from "@/types";

export default function UnitsPage() {
  const units = useAppStore((state) => state.units);
  const ingredients = useAppStore((state) => state.ingredients);
  const deleteUnit = useAppStore((state) => state.deleteUnit);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeasurementUnit | null>(null);
  const [deleting, setDeleting] = useState<MeasurementUnit | null>(null);

  useCreateRequest("unit", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return units.filter((unit) => {
      const matchesQuery =
        !query ||
        unit.name.toLowerCase().includes(query.toLowerCase()) ||
        unit.abbreviation.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ||
        status == null ||
        (status === "active" ? unit.isActive : !unit.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [units, query, status]);

  const columns: DataTableColumn<MeasurementUnit>[] = [
    { header: "Unit", cell: (unit) => <span className="font-medium">{unit.name}</span> },
    { header: "Abbreviation", cell: (unit) => unit.abbreviation },
    {
      header: "Used by ingredients",
      cell: (unit) => ingredients.filter((ingredient) => ingredient.unitId === unit.id).length,
    },
    { header: "Status", cell: (unit) => <StatusBadge active={unit.isActive} /> },
    { header: "Last updated", cell: (unit) => formatDateTime(unit.updatedAt) },
    {
      header: "Actions",
      className: "text-right",
      cell: (unit) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(unit);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(unit)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Units of measurement"
        description="Master units used by ingredients and inventory. Units in use cannot be deleted."
        actionLabel="Add unit"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search units..."
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
        rowKey={(unit) => unit.id}
        empty={
          <EmptyState
            icon={Ruler}
            title="No units found"
            description="Add units such as kilogram, litre or piece before creating ingredients."
            actionLabel="Add unit"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <UnitForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        unit={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete unit?"
        description="Units that are assigned to ingredients cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteUnit(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Unit deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
