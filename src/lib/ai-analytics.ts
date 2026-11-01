import { addDays, format, getDay, parseISO } from "date-fns";
import { orderTotal } from "@/lib/orders";
import type { Ingredient, InventoryItem, MeasurementUnit, MenuItem, Order } from "@/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface DayCall {
  date: string;
  label: string;
  weekday: string;
  sales: number;
  basis: "seen" | "guess";
}

export interface WeekAhead {
  days: DayCall[];
  headline: string;
  detail: string;
  sampleDays: number;
  confidence: "thin" | "fair" | "strong";
}

export interface DishCall {
  name: string;
  quantity: number;
  share: number;
}

export interface WhatSells {
  headline: string;
  detail: string;
  weekday: string;
  dishes: DishCall[];
}

export interface Runout {
  name: string;
  unit: string;
  onHand: number;
  perService: number;
  servicesLeft: number | null;
  note: string;
}

export interface StoreroomWatch {
  headline: string;
  detail: string;
  rows: Runout[];
}

function liveOrders(orders: Order[]) {
  return orders.filter((order) => order.status !== "cancelled");
}

function serviceDate(iso: string) {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function confidenceFor(sampleDays: number): WeekAhead["confidence"] {
  if (sampleDays >= 14) return "strong";
  if (sampleDays >= 6) return "fair";
  return "thin";
}

export function weekAhead(orders: Order[], today = new Date()): WeekAhead {
  const byDate = new Map<string, { sales: number; weekday: number }>();
  for (const order of liveOrders(orders)) {
    const date = serviceDate(order.createdAt);
    if (!date) continue;
    const key = format(date, "yyyy-MM-dd");
    const current = byDate.get(key) ?? { sales: 0, weekday: getDay(date) };
    current.sales += orderTotal(order);
    byDate.set(key, current);
  }

  const sampleDays = byDate.size;
  if (sampleDays === 0) {
    return {
      days: [],
      headline: "There are no tickets yet, so the next week cannot be projected.",
      detail: "Once a few services are on the books, this reading uses the same weekday again.",
      sampleDays: 0,
      confidence: "thin",
    };
  }

  const weekdayTotals = new Map<number, { sales: number; days: number }>();
  let salesSum = 0;
  for (const day of byDate.values()) {
    salesSum += day.sales;
    const bucket = weekdayTotals.get(day.weekday) ?? { sales: 0, days: 0 };
    bucket.sales += day.sales;
    bucket.days += 1;
    weekdayTotals.set(day.weekday, bucket);
  }
  const typicalDay = salesSum / sampleDays;

  const days: DayCall[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const weekday = getDay(date);
    const seen = weekdayTotals.get(weekday);
    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE d"),
      weekday: WEEKDAYS[weekday],
      sales: seen ? seen.sales / seen.days : typicalDay,
      basis: seen ? "seen" : "guess",
    };
  });

  const strongest = days.reduce((best, day) => (day.sales > best.sales ? day : best), days[0]);
  const seenLabel =
    strongest.basis === "seen"
      ? "That weekday is already in the tickets."
      : "That weekday has no tickets yet, so the figure is an average day.";
  return {
    days,
    headline: `${strongest.label} looks like the strongest day in the next week. ${seenLabel}`,
    detail: `Read from ${sampleDays} service ${sampleDays === 1 ? "day" : "days"}. A weekday with no tickets yet uses the average day and is marked as a guess.`,
    sampleDays,
    confidence: confidenceFor(sampleDays),
  };
}

export function whatSells(orders: Order[], today = new Date()): WhatSells {
  const weekday = getDay(today);
  const weekdayName = WEEKDAYS[weekday];
  const totals = new Map<string, number>();
  const sameDay = new Map<string, number>();
  const sameDates = new Set<string>();

  for (const order of liveOrders(orders)) {
    const date = serviceDate(order.createdAt);
    if (!date) continue;
    const key = format(date, "yyyy-MM-dd");
    const onWeekday = getDay(date) === weekday;
    if (onWeekday) sameDates.add(key);
    for (const item of order.items) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity);
      if (onWeekday) sameDay.set(item.name, (sameDay.get(item.name) ?? 0) + item.quantity);
    }
  }

  const source = sameDay.size > 0 ? sameDay : totals;
  const divisor = sameDay.size > 0 ? Math.max(sameDates.size, 1) : 1;
  const ranked = [...source.entries()]
    .map(([name, quantity]) => ({ name, quantity: quantity / divisor }))
    .sort((a, b) => b.quantity - a.quantity);
  const shown = ranked.slice(0, 3);
  const units = shown.reduce((sum, dish) => sum + dish.quantity, 0);
  const dishes = shown.map((dish) => ({
    ...dish,
    share: units > 0 ? dish.quantity / units : 0,
  }));

  if (dishes.length === 0) {
    return {
      headline: "No dishes have been sold yet, so there is no call for the next service.",
      detail: "The call uses the same weekday when that weekday is already in the tickets.",
      weekday: weekdayName,
      dishes: [],
    };
  }

  const lead = dishes
    .slice(0, 2)
    .map((dish) => dish.name)
    .join(" and ");
  const scope = sameDay.size > 0 ? `a ${weekdayName} like the ones on file` : "the tickets on file";
  return {
    headline: `${scope.charAt(0).toUpperCase()}${scope.slice(1)} leans on ${lead}.`,
    detail:
      sameDay.size > 0
        ? `Quantities are the average ${weekdayName} service, not the whole history.`
        : `${weekdayName} is not in the tickets yet, so this is the overall mix.`,
    weekday: weekdayName,
    dishes,
  };
}

export function storeroomWatch(
  orders: Order[],
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  units: MeasurementUnit[],
  inventory: InventoryItem[]
): StoreroomWatch {
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const ingredientById = new Map(ingredients.map((item) => [item.id, item]));
  const unitById = new Map(units.map((unit) => [unit.id, unit.abbreviation]));
  const stockByIngredient = new Map(inventory.map((item) => [item.ingredientId, item]));
  const used = new Map<string, number>();
  const serviceDays = new Set<string>();

  for (const order of liveOrders(orders)) {
    const date = serviceDate(order.createdAt);
    if (!date) continue;
    serviceDays.add(format(date, "yyyy-MM-dd"));
    for (const line of order.items) {
      const menu = menuById.get(line.menuItemId);
      if (!menu) continue;
      for (const part of menu.ingredients) {
        used.set(part.ingredientId, (used.get(part.ingredientId) ?? 0) + part.quantity * line.quantity);
      }
    }
  }

  const dayCount = Math.max(serviceDays.size, 1);
  const rows: Runout[] = [];
  for (const [ingredientId, stock] of stockByIngredient) {
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) continue;
    const perService = (used.get(ingredientId) ?? 0) / dayCount;
    const servicesLeft = perService > 0 ? stock.currentStock / perService : null;
    const underLine = stock.currentStock <= stock.minimumStock;
    if (servicesLeft === null && !underLine && stock.currentStock > 0) continue;
    const unit = unitById.get(ingredient.unitId) ?? "";
    let note = "Comfortable at this pace.";
    if (stock.currentStock <= 0) note = "Already at zero.";
    else if (servicesLeft === null) note = "Already under the minimum. These tickets do not draw it, so this is the shelf, not a pace.";
    else if (servicesLeft < 1) note = "Gone before one more service at this pace.";
    else note = `About ${servicesLeft < 10 ? servicesLeft.toFixed(1) : Math.round(servicesLeft)} services of cover.`;
    rows.push({
      name: ingredient.name,
      unit,
      onHand: stock.currentStock,
      perService,
      servicesLeft,
      note,
    });
  }

  rows.sort((a, b) => {
    const left = a.servicesLeft ?? (a.onHand <= 0 ? -1 : 10_000);
    const right = b.servicesLeft ?? (b.onHand <= 0 ? -1 : 10_000);
    return left - right;
  });
  const tight = rows.slice(0, 3);

  if (tight.length === 0) {
    return {
      headline: "Nothing in the storeroom is close to running out at the pace in these tickets.",
      detail: "Cover is current stock divided by the recipe draw of an average service day.",
      rows: [],
    };
  }

  const first = tight[0];
  const headline =
    first.onHand <= 0
      ? `${first.name} is already out.`
      : first.servicesLeft !== null && first.servicesLeft < 1
        ? `${first.name} runs out before the next service if the recent dishes keep selling.`
        : `${first.name} is the first to run short.`;

  return {
    headline,
    detail: "Each figure is stock on hand divided by how much a typical service day pulls through the recipes.",
    rows: tight,
  };
}
