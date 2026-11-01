import { differenceInCalendarMonths, parseISO } from "date-fns";
import type { AssetCategory, AssetFunding, FixedAsset } from "@/types";

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "vehicle", label: "Vehicle" },
  { value: "kitchen", label: "Kitchen equipment" },
  { value: "furniture", label: "Furniture & fittings" },
  { value: "it", label: "IT & electronics" },
  { value: "building", label: "Building" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

export const FUNDING_LABEL: Record<AssetFunding, string> = {
  cash: "Cash",
  bank: "Bank",
  credit: "On credit",
  capital: "Owner's capital",
};

export function assetCategoryLabel(category: AssetCategory) {
  return ASSET_CATEGORIES.find((row) => row.value === category)?.label ?? category;
}

export function maxDepreciation(asset: Pick<FixedAsset, "cost" | "residualValue" | "depreciates">) {
  if (!asset.depreciates) return 0;
  return Number(Math.max(0, asset.cost - asset.residualValue).toFixed(2));
}

export function monthlyDepreciation(
  asset: Pick<FixedAsset, "cost" | "residualValue" | "depreciates" | "usefulLifeMonths">
) {
  if (!asset.depreciates || asset.usefulLifeMonths <= 0) return 0;
  return Number((maxDepreciation(asset) / asset.usefulLifeMonths).toFixed(2));
}

export function bookValue(asset: Pick<FixedAsset, "cost" | "accumulatedDepreciation">) {
  return Number(Math.max(0, asset.cost - asset.accumulatedDepreciation).toFixed(2));
}

export function monthsInService(acquiredOn: string, asOfDate: string) {
  try {
    const acquired = parseISO(acquiredOn.length === 10 ? `${acquiredOn}T12:00:00` : acquiredOn);
    const asOf = parseISO(asOfDate.length === 10 ? `${asOfDate}T12:00:00` : asOfDate);
    if (asOf < acquired) return 0;
    return differenceInCalendarMonths(asOf, acquired) + 1;
  } catch {
    return 0;
  }
}

export function expectedAccumulated(asset: FixedAsset, asOfDate: string) {
  if (!asset.depreciates) return 0;
  const months = monthsInService(asset.acquiredOn, asOfDate);
  return Number(Math.min(maxDepreciation(asset), monthlyDepreciation(asset) * months).toFixed(2));
}

export function pendingDepreciation(asset: FixedAsset, asOfDate: string) {
  return Number(Math.max(0, expectedAccumulated(asset, asOfDate) - asset.accumulatedDepreciation).toFixed(2));
}

export function assetTotals(assets: FixedAsset[]) {
  const cost = assets.reduce((sum, asset) => sum + asset.cost, 0);
  const accumulated = assets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
  return {
    cost: Number(cost.toFixed(2)),
    accumulated: Number(accumulated.toFixed(2)),
    book: Number((cost - accumulated).toFixed(2)),
  };
}
