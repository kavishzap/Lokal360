import type { InventoryItem, StockStatus } from "@/types";

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock <= 0) return "out_of_stock";
  if (item.currentStock <= item.minimumStock) return "low_stock";
  return "in_stock";
}

export function inventoryValue(item: InventoryItem) {
  return item.currentStock * item.costPerUnit;
}
