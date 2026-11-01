import { format, parseISO } from "date-fns";

export function formatMUR(amount: number) {
  return `Rs ${amount.toLocaleString("en-MU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string) {
  try {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
    return format(parseISO(iso), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export function formatDateTime(value: string) {
  try {
    return format(parseISO(value), "dd MMM yyyy, HH:mm");
  } catch {
    return value;
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return crypto.randomUUID();
}
