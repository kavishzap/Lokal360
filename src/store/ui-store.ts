import { create } from "zustand";
import { SIDEBAR_KEY } from "@/lib/constants";
import type { ReportAudience, ReportPeriod } from "@/lib/reports";

export type CreateTarget =
  | "zone"
  | "table"
  | "category"
  | "unit"
  | "ingredient"
  | "menu-item"
  | "order"
  | "inventory"
  | "purchase"
  | "expense"
  | "asset"
  | "account"
  | "journal"
  | "employee"
  | "leave"
  | "attendance"
  | "payslip"
  | null;

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  createTarget: CreateTarget;
  reportAudience: ReportAudience;
  reportPeriod: ReportPeriod;
  reportCustomFrom: string;
  reportCustomTo: string;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (value: boolean) => void;
  requestCreate: (target: CreateTarget) => void;
  consumeCreate: (target: Exclude<CreateTarget, null>) => boolean;
  setReportAudience: (value: ReportAudience) => void;
  setReportPeriod: (value: ReportPeriod) => void;
  setReportCustomFrom: (value: string) => void;
  setReportCustomTo: (value: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  createTarget: null,
  reportAudience: "owner",
  reportPeriod: "this_year",
  reportCustomFrom: `${new Date().getFullYear()}-01-01`,
  reportCustomTo: new Date().toISOString().slice(0, 10),
  setSidebarCollapsed: (value) => {
    set({ sidebarCollapsed: value });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_KEY, JSON.stringify(value));
    }
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    get().setSidebarCollapsed(next);
  },
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  requestCreate: (target) => set({ createTarget: target }),
  consumeCreate: (target) => {
    if (get().createTarget !== target) return false;
    set({ createTarget: null });
    return true;
  },
  setReportAudience: (value) => set({ reportAudience: value }),
  setReportPeriod: (value) => set({ reportPeriod: value }),
  setReportCustomFrom: (value) => set({ reportCustomFrom: value }),
  setReportCustomTo: (value) => set({ reportCustomTo: value }),
}));

export function hydrateUiStore() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_KEY);
    if (raw) {
      useUiStore.setState({ sidebarCollapsed: JSON.parse(raw) as boolean });
    }
  } catch {
    /* ignore */
  }
}
