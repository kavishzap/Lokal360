import type {
  Ingredient,
  InventoryItem,
  InventoryTransaction,
  MenuItem,
  Order,
  OrderStatus,
} from "@/types";

export type BalanceStatus = "balanced" | "unrecorded" | "over_recorded" | "shortage";

export interface BalanceRow {
  ingredientId: string;
  ingredientName: string;
  unitId: string;
  theoreticalUsage: number;
  recordedOut: number;
  variance: number;
  currentStock: number;
  openRequirement: number;
  orderCount: number;
  status: BalanceStatus;
}

export interface BalanceReport {
  ranAt: string;
  rows: BalanceRow[];
  balancedCount: number;
  unrecordedCount: number;
  overRecordedCount: number;
  shortageCount: number;
  overall: "good" | "attention" | "critical";
}

const COUNTED_STATUSES: OrderStatus[] = ["open", "preparing", "served", "completed"];
const OPEN_STATUSES: OrderStatus[] = ["open", "preparing"];

function roundQty(value: number) {
  return Number(value.toFixed(4));
}

function isWithinTolerance(value: number, compare: number) {
  const tolerance = Math.max(0.01, compare * 0.02);
  return Math.abs(value) <= tolerance;
}

export function formatQty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString("en-MU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function runInventoryBalance(input: {
  orders: Order[];
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
}): BalanceReport {
  const menuById = new Map(input.menuItems.map((item) => [item.id, item]));
  const inventoryByIngredient = new Map(
    input.inventory.map((item) => [item.ingredientId, item])
  );
  const theoretical = new Map<string, number>();
  const openNeed = new Map<string, number>();
  const orderCounts = new Map<string, Set<string>>();

  const addUsage = (
    target: Map<string, number>,
    ingredientId: string,
    quantity: number
  ) => {
    target.set(ingredientId, roundQty((target.get(ingredientId) ?? 0) + quantity));
  };

  for (const order of input.orders) {
    if (!COUNTED_STATUSES.includes(order.status)) continue;
    for (const line of order.items) {
      const menuItem = menuById.get(line.menuItemId);
      if (!menuItem) continue;
      for (const recipe of menuItem.ingredients) {
        const qty = line.quantity * recipe.quantity;
        addUsage(theoretical, recipe.ingredientId, qty);
        if (OPEN_STATUSES.includes(order.status)) {
          addUsage(openNeed, recipe.ingredientId, qty);
        }
        const ordersForIngredient = orderCounts.get(recipe.ingredientId) ?? new Set<string>();
        ordersForIngredient.add(order.id);
        orderCounts.set(recipe.ingredientId, ordersForIngredient);
      }
    }
  }

  const recordedOut = new Map<string, number>();
  for (const transaction of input.transactions) {
    const inventoryItem = input.inventory.find((item) => item.id === transaction.inventoryItemId);
    if (!inventoryItem) continue;
    const reduction =
      transaction.type === "OUT"
        ? Math.abs(transaction.quantityChange)
        : transaction.type === "ADJUSTMENT" && transaction.quantityChange < 0
          ? Math.abs(transaction.quantityChange)
          : 0;
    if (reduction <= 0) continue;
    addUsage(recordedOut, inventoryItem.ingredientId, reduction);
  }

  const ingredientIds = new Set([
    ...theoretical.keys(),
    ...recordedOut.keys(),
    ...openNeed.keys(),
  ]);

  const rows: BalanceRow[] = [...ingredientIds]
    .map((ingredientId) => {
      const ingredient = input.ingredients.find((item) => item.id === ingredientId);
      const stock = inventoryByIngredient.get(ingredientId);
      const usage = theoretical.get(ingredientId) ?? 0;
      const bookedOut = recordedOut.get(ingredientId) ?? 0;
      const requiredOpen = openNeed.get(ingredientId) ?? 0;
      const currentStock = stock?.currentStock ?? 0;
      const variance = roundQty(bookedOut - usage);
      let status: BalanceStatus = "balanced";
      if (requiredOpen > currentStock + 0.0001) status = "shortage";
      else if (variance < 0 && !isWithinTolerance(variance, usage)) status = "unrecorded";
      else if (variance > 0 && !isWithinTolerance(variance, usage)) status = "over_recorded";

      return {
        ingredientId,
        ingredientName: ingredient?.name ?? "Unknown ingredient",
        unitId: ingredient?.unitId ?? "",
        theoreticalUsage: usage,
        recordedOut: bookedOut,
        variance,
        currentStock,
        openRequirement: requiredOpen,
        orderCount: orderCounts.get(ingredientId)?.size ?? 0,
        status,
      };
    })
    .sort((a, b) => {
      const rank = { shortage: 0, unrecorded: 1, over_recorded: 2, balanced: 3 };
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return a.ingredientName.localeCompare(b.ingredientName);
    });

  const balancedCount = rows.filter((row) => row.status === "balanced").length;
  const unrecordedCount = rows.filter((row) => row.status === "unrecorded").length;
  const overRecordedCount = rows.filter((row) => row.status === "over_recorded").length;
  const shortageCount = rows.filter((row) => row.status === "shortage").length;

  return {
    ranAt: new Date().toISOString(),
    rows,
    balancedCount,
    unrecordedCount,
    overRecordedCount,
    shortageCount,
    overall: shortageCount > 0 ? "critical" : unrecordedCount + overRecordedCount > 0 ? "attention" : "good",
  };
}
