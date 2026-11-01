import type { Order, OrderStatus } from "@/types";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "preparing", label: "Preparing" },
  { value: "served", label: "Served" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function orderTotal(order: { items: { quantity: number; unitPrice: number }[] }) {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function nextOrderNumber(orders: Order[]) {
  const max = orders.reduce((current, order) => {
    const match = order.orderNumber.match(/(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Math.max(current, value);
  }, 1000);
  return `ORD-${max + 1}`;
}
