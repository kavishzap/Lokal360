"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatMUR } from "@/lib/format";
import { useTranslate } from "@/i18n/use-translate";
import type { MenuCategory, MenuItem } from "@/types";

export function MenuItemCard({
  item,
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: MenuItem;
  category?: MenuCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslate();
  return (
    <Card className="overflow-hidden py-0 ring-slate-200/80">
      <div className="relative h-40 bg-slate-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge
            active={item.isAvailable}
            activeLabel="Available"
            inactiveLabel="Unavailable"
          />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          {item.nameEn && item.nameEn !== item.name ? (
            <p className="text-sm text-slate-500">{item.nameEn}</p>
          ) : null}
          <p className="text-sm text-slate-500">{category?.name ?? "Uncategorised"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">{t("Selling price (MUR)")}</p>
            <p className="font-semibold text-blue-700">{formatMUR(item.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{t("Manufactured")}</p>
            <p className="font-semibold text-slate-700">{formatMUR(item.manufacturedPrice ?? 0)}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">{item.ingredients.length} ingredients</p>
        <div className="flex items-center justify-between border-t pt-3">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <Switch checked={item.isAvailable} onCheckedChange={onToggle} />
            Availability
          </label>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
