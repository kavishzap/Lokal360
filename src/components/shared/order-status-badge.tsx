import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const TONES: Record<OrderStatus, { className: string; dot: string }> = {
  open: { className: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  preparing: { className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  served: { className: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  completed: { className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { className: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = TONES[status];
  const label = ORDER_STATUSES.find((item) => item.value === status)?.label ?? status;
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", tone.className)}>
      <span className={cn("mr-1 size-1.5 rounded-full", tone.dot)} />
      {label}
    </Badge>
  );
}
