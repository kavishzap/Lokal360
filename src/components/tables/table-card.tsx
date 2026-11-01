"use client";

import { Armchair, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { RestaurantTable, Zone } from "@/types";

export function TableCard({
  table,
  zone,
  onEdit,
  onDelete,
}: {
  table: RestaurantTable;
  zone?: Zone;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="gap-0 py-4 transition hover:ring-slate-300">
      <div className="flex items-start justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Armchair className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{table.name}</p>
            <p className="text-sm text-slate-500">{zone?.name ?? "Unassigned zone"}</p>
          </div>
        </div>
        <StatusBadge active={table.isActive} />
      </div>
      <div className="mt-4 flex items-center justify-between px-4 text-sm text-slate-600">
        <span>{table.capacity} seats</span>
        <span className="text-xs text-slate-400">Added {formatDate(table.createdAt)}</span>
      </div>
      <div className="mt-4 flex justify-end gap-1 border-t px-3 pt-3">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 /> Delete
        </Button>
      </div>
    </Card>
  );
}
