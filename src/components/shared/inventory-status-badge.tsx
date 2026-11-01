import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types";

const CONFIG: Record<StockStatus, { label: string; className: string; dot: string }> = {
  in_stock: {
    label: "In Stock",
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  low_stock: {
    label: "Low Stock",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

export function InventoryStatusBadge({ status }: { status: StockStatus }) {
  const config = CONFIG[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", config.className)}>
      <span className={cn("mr-1 size-1.5 rounded-full", config.dot)} />
      {config.label}
    </Badge>
  );
}
