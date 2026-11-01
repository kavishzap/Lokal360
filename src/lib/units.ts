import type { MeasurementUnit } from "@/types";

export function findUnit(units: MeasurementUnit[], unitId?: string | null) {
  if (!unitId) return undefined;
  return units.find((unit) => unit.id === unitId);
}

export function unitAbbreviation(units: MeasurementUnit[], unitId?: string | null) {
  return findUnit(units, unitId)?.abbreviation ?? "—";
}

export function unitDisplayName(units: MeasurementUnit[], unitId?: string | null) {
  const unit = findUnit(units, unitId);
  if (!unit) return "—";
  return `${unit.name} (${unit.abbreviation})`;
}
