import { create } from "zustand";
import {
  accountByCode,
  expenseTotal,
  lineAmount,
  nextDocumentNumber,
  purchaseTotal,
  SYSTEM_ACCOUNT_CODES,
  validateJournalLines,
} from "@/lib/accounting";
import { pendingDepreciation } from "@/lib/assets";
import { defaultCompany } from "@/lib/company";
import { buildPayslip, defaultPayrollPolicy, employeeName, leaveDaysInRange, payrollTotals, periodBounds } from "@/lib/payroll";
import { createId, nowIso } from "@/lib/format";
import { nextOrderNumber } from "@/lib/orders";
import { emptyData, loadAppData, resetAppData, saveAppData } from "@/lib/storage";
import { DATA_SLICES, type DataSlice } from "@/lib/data-slices";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isRemoteSignedIn, loadSlices, loadedSliceNames, noteSignedOut, scheduleRemoteSave } from "@/lib/supabase/sync";
import type {
  Account,
  AccountType,
  ActionResult,
  AppData,
  AssetCategory,
  AssetFunding,
  AttendanceRecord,
  AttendanceStatus,
  CompanyProfile,
  Employee,
  Expense,
  FixedAsset,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PayrollPolicy,
  PayrollRun,
  Ingredient,
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  JournalEntry,
  JournalLine,
  MenuCategory,
  MenuItem,
  MeasurementUnit,
  MenuItemIngredient,
  Order,
  OrderItem,
  OrderStatus,
  Purchase,
  PurchasePayment,
  RestaurantTable,
  Zone,
} from "@/types";

type ZoneInput = Pick<Zone, "name" | "description" | "isActive">;
type TableInput = Pick<RestaurantTable, "name" | "zoneId" | "capacity" | "isActive">;
type CategoryInput = Pick<
  MenuCategory,
  "name" | "description" | "image" | "displayOrder" | "isActive"
>;
type UnitInput = Pick<MeasurementUnit, "name" | "abbreviation" | "isActive">;
type IngredientInput = Pick<Ingredient, "name" | "description" | "unitId" | "isActive">;
type MenuItemInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;
type OrderInput = {
  tableId: string;
  status: OrderStatus;
  notes: string;
  items: Omit<OrderItem, "id">[];
};
type InventorySetupInput = {
  ingredientId: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
};
type AccountInput = Pick<Account, "code" | "name" | "type" | "isCash" | "isActive">;
type JournalInput = {
  date: string;
  description: string;
  lines: Omit<JournalLine, "id">[];
};
type PurchaseLineInput = {
  description: string;
  ingredientId: string | null;
  quantity: number;
  unitCost: number;
  addToInventory: boolean;
};
type PurchaseInput = {
  supplier: string;
  invoiceNumber: string;
  date: string;
  payment: PurchasePayment;
  notes: string;
  lines: PurchaseLineInput[];
};
type ExpenseInput = {
  payee: string;
  reference: string;
  date: string;
  payment: PurchasePayment;
  notes: string;
  lines: { description: string; accountId: string; amount: number }[];
};
type AssetInput = {
  name: string;
  category: AssetCategory;
  acquiredOn: string;
  cost: number;
  funding: AssetFunding;
  depreciates: boolean;
  usefulLifeYears: number;
  residualValue: number;
  notes: string;
};
type EmployeeInput = Omit<Employee, "id" | "employeeNumber" | "createdAt" | "updatedAt">;
type LeaveInput = {
  employeeId: string;
  type: LeaveType;
  from: string;
  to: string;
  reason: string;
};
type AttendanceInput = {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  overtimeHours: number;
  publicHolidayHours: number;
  notes: string;
};

interface AppState extends AppData {
  hydrated: boolean;
  loadedSlices: DataSlice[];
  hydrate: () => Promise<void>;
  ensureSlices: (slices: DataSlice[]) => Promise<void>;
  clearRemote: () => void;
  resetDemo: () => void;
  createZone: (input: ZoneInput) => ActionResult;
  updateZone: (id: string, input: ZoneInput) => ActionResult;
  deleteZone: (id: string) => ActionResult;
  createTable: (input: TableInput) => ActionResult;
  updateTable: (id: string, input: TableInput) => ActionResult;
  deleteTable: (id: string) => ActionResult;
  createCategory: (input: CategoryInput) => ActionResult;
  updateCategory: (id: string, input: CategoryInput) => ActionResult;
  deleteCategory: (id: string) => ActionResult;
  reorderCategory: (id: string, direction: "up" | "down") => ActionResult;
  createUnit: (input: UnitInput) => ActionResult;
  updateUnit: (id: string, input: UnitInput) => ActionResult;
  deleteUnit: (id: string) => ActionResult;
  createIngredient: (input: IngredientInput) => ActionResult;
  updateIngredient: (id: string, input: IngredientInput) => ActionResult;
  deleteIngredient: (id: string) => ActionResult;
  createMenuItem: (input: MenuItemInput) => ActionResult;
  updateMenuItem: (id: string, input: MenuItemInput) => ActionResult;
  deleteMenuItem: (id: string) => ActionResult;
  toggleMenuAvailability: (id: string) => ActionResult;
  setupInventory: (input: InventorySetupInput) => ActionResult;
  updateInventoryMeta: (
    id: string,
    input: Pick<InventoryItem, "minimumStock" | "costPerUnit">
  ) => ActionResult;
  addStock: (inventoryId: string, quantity: number, reason: string, date?: string) => ActionResult;
  removeStock: (
    inventoryId: string,
    quantity: number,
    reason: string,
    date?: string
  ) => ActionResult;
  adjustStock: (
    inventoryId: string,
    newQuantity: number,
    reason: string,
    date?: string
  ) => ActionResult;
  deleteInventory: (id: string) => ActionResult;
  createOrder: (input: OrderInput) => ActionResult;
  updateOrder: (id: string, input: OrderInput) => ActionResult;
  deleteOrder: (id: string) => ActionResult;
  createAccount: (input: AccountInput) => ActionResult;
  updateAccount: (id: string, input: AccountInput) => ActionResult;
  deleteAccount: (id: string) => ActionResult;
  createJournal: (input: JournalInput) => ActionResult;
  deleteJournal: (id: string) => ActionResult;
  createPurchase: (input: PurchaseInput) => ActionResult;
  deletePurchase: (id: string) => ActionResult;
  createExpense: (input: ExpenseInput) => ActionResult;
  deleteExpense: (id: string) => ActionResult;
  createAsset: (input: AssetInput) => ActionResult;
  deleteAsset: (id: string) => ActionResult;
  chargeAssetDepreciation: (id: string, asOfDate?: string) => ActionResult;
  chargeAllDepreciation: (asOfDate?: string) => ActionResult;
  createEmployee: (input: EmployeeInput) => ActionResult;
  updateEmployee: (id: string, input: EmployeeInput) => ActionResult;
  deleteEmployee: (id: string) => ActionResult;
  createLeave: (input: LeaveInput) => ActionResult;
  setLeaveStatus: (id: string, status: LeaveStatus) => ActionResult;
  deleteLeave: (id: string) => ActionResult;
  upsertAttendance: (input: AttendanceInput) => ActionResult;
  deleteAttendance: (id: string) => ActionResult;
  generatePayslips: (period: string, employeeId?: string) => ActionResult;
  deletePayslip: (id: string) => ActionResult;
  postPayroll: (period: string) => ActionResult;
  paySalaries: (period: string, date: string, reference: string) => ActionResult;
  filePayroll: (period: string, date: string, reference: string) => ActionResult;
  remitPayroll: (period: string, date: string, reference: string) => ActionResult;
  undoPayrollPost: (period: string) => ActionResult;
  undoSalaryPayment: (period: string) => ActionResult;
  undoPayrollFiling: (period: string) => ActionResult;
  undoRemittance: (period: string) => ActionResult;
  updatePayrollPolicy: (input: PayrollPolicy) => ActionResult;
  updateCompany: (input: CompanyProfile) => ActionResult;
  addHoliday: (date: string, name: string) => ActionResult;
  deleteHoliday: (id: string) => ActionResult;
  postPurchaseLineToInventory: (
    purchaseId: string,
    lineId: string,
    ingredientId?: string | null
  ) => ActionResult;
}

let remoteHydrateGeneration = 0;
let appHydrateInflight: Promise<void> | null = null;

function persist(data: AppData) {
  if (isSupabaseConfigured()) {
    scheduleRemoteSave(data);
    return;
  }
  saveAppData(data);
}

function snapshot(state: AppState): AppData {
  return {
    zones: state.zones,
    tables: state.tables,
    categories: state.categories,
    units: state.units,
    ingredients: state.ingredients,
    menuItems: state.menuItems,
    inventory: state.inventory,
    transactions: state.transactions,
    orders: state.orders,
    accounts: state.accounts,
    journalEntries: state.journalEntries,
    purchases: state.purchases,
    expenses: state.expenses ?? [],
    assets: state.assets ?? [],
    employees: state.employees ?? [],
    holidays: state.holidays ?? [],
    leaveRequests: state.leaveRequests ?? [],
    attendance: state.attendance ?? [],
    payslips: state.payslips ?? [],
    payrollRuns: state.payrollRuns ?? [],
    payrollPolicy: state.payrollPolicy ?? defaultPayrollPolicy(),
    company: state.company ?? defaultCompany(),
  };
}

function inactiveIngredientWarning(items: MenuItemIngredient[], ingredients: Ingredient[]) {
  const inactive = items
    .map((row) => ingredients.find((ingredient) => ingredient.id === row.ingredientId))
    .filter((ingredient): ingredient is Ingredient => Boolean(ingredient && !ingredient.isActive));
  if (inactive.length === 0) return undefined;
  return `Saved with inactive ingredient${inactive.length > 1 ? "s" : ""}: ${inactive
    .map((item) => item.name)
    .join(", ")}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  ...emptyData(),
  hydrated: false,
  loadedSlices: [],
  hydrate: () => {
    if (appHydrateInflight) return appHydrateInflight;
    const generation = ++remoteHydrateGeneration;
    appHydrateInflight = (async () => {
      if (!isSupabaseConfigured()) {
        try {
          set({ ...loadAppData(), hydrated: true, loadedSlices: [...DATA_SLICES] });
        } catch (error) {
          console.error(error);
          set({ ...emptyData(), hydrated: true, loadedSlices: [...DATA_SLICES] });
        }
        return;
      }
      if (generation !== remoteHydrateGeneration) return;
      if (!isRemoteSignedIn()) {
        noteSignedOut();
        set({ ...emptyData(), hydrated: true, loadedSlices: [] });
        return;
      }
      try {
        const data = await loadSlices(["company"]);
        if (generation !== remoteHydrateGeneration) return;
        set({ ...data, hydrated: true, loadedSlices: loadedSliceNames() });
      } catch (error) {
        if (generation !== remoteHydrateGeneration) return;
        console.error(error);
        set({ hydrated: true });
      }
    })().finally(() => {
      appHydrateInflight = null;
    });
    return appHydrateInflight;
  },
  ensureSlices: (slices) => {
    if (!isSupabaseConfigured()) return Promise.resolve();
    const missing = slices.filter((slice) => !get().loadedSlices.includes(slice));
    if (missing.length === 0) return Promise.resolve();
    return loadSlices(missing)
      .then((data) => {
        set({ ...data, loadedSlices: loadedSliceNames() });
      })
      .catch((error: unknown) => {
        console.error(error);
        throw error;
      });
  },
  clearRemote: () => {
    remoteHydrateGeneration += 1;
    appHydrateInflight = null;
    noteSignedOut();
    set({ ...emptyData(), hydrated: true, loadedSlices: [] });
  },
  resetDemo: () => {
    if (isSupabaseConfigured()) return;
    set({ ...resetAppData(), hydrated: true, loadedSlices: [...DATA_SLICES] });
  },
  createZone: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Zone name is required." };
    const duplicate = state.zones.some(
      (zone) => zone.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) return { ok: false, error: "A zone with this name already exists." };
    const zone: Zone = {
      id: createId(),
      name: input.name.trim(),
      description: input.description.trim(),
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), zones: [zone, ...state.zones] };
    persist(next);
    set(next);
    return { ok: true, id: zone.id };
  },
  updateZone: (id, input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Zone name is required." };
    const duplicate = state.zones.some(
      (zone) =>
        zone.id !== id && zone.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) return { ok: false, error: "A zone with this name already exists." };
    const next = {
      ...snapshot(state),
      zones: state.zones.map((zone) =>
        zone.id === id
          ? {
              ...zone,
              name: input.name.trim(),
              description: input.description.trim(),
              isActive: input.isActive,
              updatedAt: nowIso(),
            }
          : zone
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteZone: (id) => {
    const state = get();
    const assigned = state.tables.filter((table) => table.zoneId === id).length;
    if (assigned > 0) {
      return {
        ok: false,
        error: `This zone cannot be deleted because ${assigned} table${assigned === 1 ? " is" : "s are"} assigned to it. Reassign or delete those tables first.`,
      };
    }
    const next = { ...snapshot(state), zones: state.zones.filter((zone) => zone.id !== id) };
    persist(next);
    set(next);
    return { ok: true };
  },
  createTable: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Table name is required." };
    if (!input.zoneId) return { ok: false, error: "A zone is required." };
    if (input.capacity < 1) return { ok: false, error: "Capacity must be at least 1." };
    const duplicate = state.tables.some(
      (table) =>
        table.zoneId === input.zoneId &&
        table.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) {
      return { ok: false, error: "A table with this name already exists in the selected zone." };
    }
    const table: RestaurantTable = {
      id: createId(),
      name: input.name.trim(),
      zoneId: input.zoneId,
      capacity: input.capacity,
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), tables: [table, ...state.tables] };
    persist(next);
    set(next);
    return { ok: true, id: table.id };
  },
  updateTable: (id, input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Table name is required." };
    if (!input.zoneId) return { ok: false, error: "A zone is required." };
    if (input.capacity < 1) return { ok: false, error: "Capacity must be at least 1." };
    const duplicate = state.tables.some(
      (table) =>
        table.id !== id &&
        table.zoneId === input.zoneId &&
        table.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) {
      return { ok: false, error: "A table with this name already exists in the selected zone." };
    }
    const next = {
      ...snapshot(state),
      tables: state.tables.map((table) =>
        table.id === id
          ? {
              ...table,
              name: input.name.trim(),
              zoneId: input.zoneId,
              capacity: input.capacity,
              isActive: input.isActive,
              updatedAt: nowIso(),
            }
          : table
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteTable: (id) => {
    const state = get();
    const linkedOrders = state.orders.filter((order) => order.tableId === id).length;
    if (linkedOrders > 0) {
      return {
        ok: false,
        error: `This table cannot be deleted because ${linkedOrders} order${linkedOrders === 1 ? " is" : "s are"} linked to it.`,
      };
    }
    const next = { ...snapshot(state), tables: state.tables.filter((table) => table.id !== id) };
    persist(next);
    set(next);
    return { ok: true };
  },
  createCategory: (input) => {
    const state = get();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Category name is required." };
    const duplicate = state.categories.some(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return { ok: false, error: "A category with this name already exists." };
    const category: MenuCategory = {
      id: createId(),
      name,
      description: input.description.trim(),
      image: input.image,
      displayOrder: input.displayOrder || state.categories.length + 1,
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), categories: [...state.categories, category] };
    persist(next);
    set(next);
    return { ok: true, id: category.id };
  },
  updateCategory: (id, input) => {
    const state = get();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Category name is required." };
    const duplicate = state.categories.some(
      (category) => category.id !== id && category.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) return { ok: false, error: "A category with this name already exists." };
    const next = {
      ...snapshot(state),
      categories: state.categories.map((category) =>
        category.id === id
          ? {
              ...category,
              name,
              description: input.description.trim(),
              image: input.image,
              displayOrder: input.displayOrder,
              isActive: input.isActive,
              updatedAt: nowIso(),
            }
          : category
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteCategory: (id) => {
    const state = get();
    const linked = state.menuItems.filter((item) => item.categoryId === id).length;
    if (linked > 0) {
      return {
        ok: false,
        error: `This category cannot be deleted because ${linked} menu item${linked === 1 ? " is" : "s are"} assigned to it.`,
      };
    }
    const next = {
      ...snapshot(state),
      categories: state.categories.filter((category) => category.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  reorderCategory: (id, direction) => {
    const state = get();
    const ordered = [...state.categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = ordered.findIndex((category) => category.id === id);
    if (index < 0) return { ok: false, error: "Category not found." };
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return { ok: true };
    const current = ordered[index];
    const other = ordered[swapWith];
    const nextOrder = ordered.map((category) => {
      if (category.id === current.id) return { ...category, displayOrder: other.displayOrder, updatedAt: nowIso() };
      if (category.id === other.id) return { ...category, displayOrder: current.displayOrder, updatedAt: nowIso() };
      return category;
    });
    const next = { ...snapshot(state), categories: nextOrder };
    persist(next);
    set(next);
    return { ok: true };
  },
  createUnit: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Unit name is required." };
    if (!input.abbreviation.trim()) return { ok: false, error: "Abbreviation is required." };
    const nameTaken = state.units.some(
      (unit) => unit.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (nameTaken) return { ok: false, error: "A unit with this name already exists." };
    const abbrTaken = state.units.some(
      (unit) => unit.abbreviation.trim().toLowerCase() === input.abbreviation.trim().toLowerCase()
    );
    if (abbrTaken) return { ok: false, error: "A unit with this abbreviation already exists." };
    const unit: MeasurementUnit = {
      id: createId(),
      name: input.name.trim(),
      abbreviation: input.abbreviation.trim(),
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), units: [unit, ...state.units] };
    persist(next);
    set(next);
    return { ok: true, id: unit.id };
  },
  updateUnit: (id, input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Unit name is required." };
    if (!input.abbreviation.trim()) return { ok: false, error: "Abbreviation is required." };
    const nameTaken = state.units.some(
      (unit) =>
        unit.id !== id && unit.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (nameTaken) return { ok: false, error: "A unit with this name already exists." };
    const abbrTaken = state.units.some(
      (unit) =>
        unit.id !== id &&
        unit.abbreviation.trim().toLowerCase() === input.abbreviation.trim().toLowerCase()
    );
    if (abbrTaken) return { ok: false, error: "A unit with this abbreviation already exists." };
    const next = {
      ...snapshot(state),
      units: state.units.map((unit) =>
        unit.id === id
          ? {
              ...unit,
              name: input.name.trim(),
              abbreviation: input.abbreviation.trim(),
              isActive: input.isActive,
              updatedAt: nowIso(),
            }
          : unit
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteUnit: (id) => {
    const state = get();
    const used = state.ingredients.some((ingredient) => ingredient.unitId === id);
    if (used) {
      return {
        ok: false,
        error: "This unit cannot be deleted because it is used by one or more ingredients.",
      };
    }
    const next = { ...snapshot(state), units: state.units.filter((unit) => unit.id !== id) };
    persist(next);
    set(next);
    return { ok: true };
  },
  createIngredient: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Ingredient name is required." };
    if (!input.unitId) return { ok: false, error: "A unit of measurement is required." };
    const duplicate = state.ingredients.some(
      (ingredient) => ingredient.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) return { ok: false, error: "An ingredient with this name already exists." };
    const ingredient: Ingredient = {
      id: createId(),
      name: input.name.trim(),
      description: input.description.trim(),
      unitId: input.unitId,
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), ingredients: [ingredient, ...state.ingredients] };
    persist(next);
    set(next);
    return { ok: true, id: ingredient.id };
  },
  updateIngredient: (id, input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Ingredient name is required." };
    if (!input.unitId) return { ok: false, error: "A unit of measurement is required." };
    const duplicate = state.ingredients.some(
      (ingredient) =>
        ingredient.id !== id &&
        ingredient.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (duplicate) return { ok: false, error: "An ingredient with this name already exists." };
    const next = {
      ...snapshot(state),
      ingredients: state.ingredients.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              name: input.name.trim(),
              description: input.description.trim(),
              unitId: input.unitId,
              isActive: input.isActive,
              updatedAt: nowIso(),
            }
          : ingredient
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteIngredient: (id) => {
    const state = get();
    const usedInMenu = state.menuItems.some((item) =>
      item.ingredients.some((row) => row.ingredientId === id)
    );
    if (usedInMenu) {
      return {
        ok: false,
        error: "This ingredient cannot be deleted because it is used in one or more menu item recipes.",
      };
    }
    const usedInInventory = state.inventory.some((item) => item.ingredientId === id);
    if (usedInInventory) {
      return {
        ok: false,
        error: "This ingredient cannot be deleted because it has an inventory record. Remove the inventory record first.",
      };
    }
    const next = {
      ...snapshot(state),
      ingredients: state.ingredients.filter((ingredient) => ingredient.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createMenuItem: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "French name is required." };
    if (!(input.nameEn ?? "").trim()) return { ok: false, error: "English name is required." };
    if (!input.categoryId) return { ok: false, error: "Category is required." };
    if (input.price < 0) return { ok: false, error: "Price cannot be negative." };
    if (!(input.manufacturedPrice >= 0)) {
      return { ok: false, error: "Manufactured price cannot be negative." };
    }
    const ids = input.ingredients.map((row) => row.ingredientId);
    if (new Set(ids).size !== ids.length) {
      return { ok: false, error: "Each ingredient can only be selected once." };
    }
    if (input.ingredients.some((row) => row.quantity <= 0)) {
      return { ok: false, error: "Ingredient quantities must be greater than zero." };
    }
    const item: MenuItem = {
      ...input,
      id: createId(),
      name: input.name.trim(),
      nameEn: (input.nameEn ?? "").trim(),
      description: input.description.trim(),
      manufacturedPrice: input.manufacturedPrice,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), menuItems: [item, ...state.menuItems] };
    persist(next);
    set(next);
    return {
      ok: true,
      id: item.id,
      warning: inactiveIngredientWarning(item.ingredients, state.ingredients),
    };
  },
  updateMenuItem: (id, input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "French name is required." };
    if (!(input.nameEn ?? "").trim()) return { ok: false, error: "English name is required." };
    if (!input.categoryId) return { ok: false, error: "Category is required." };
    if (input.price < 0) return { ok: false, error: "Price cannot be negative." };
    if (!(input.manufacturedPrice >= 0)) {
      return { ok: false, error: "Manufactured price cannot be negative." };
    }
    const ids = input.ingredients.map((row) => row.ingredientId);
    if (new Set(ids).size !== ids.length) {
      return { ok: false, error: "Each ingredient can only be selected once." };
    }
    if (input.ingredients.some((row) => row.quantity <= 0)) {
      return { ok: false, error: "Ingredient quantities must be greater than zero." };
    }
    const next = {
      ...snapshot(state),
      menuItems: state.menuItems.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              name: input.name.trim(),
              nameEn: (input.nameEn ?? "").trim(),
              description: input.description.trim(),
              manufacturedPrice: input.manufacturedPrice,
              updatedAt: nowIso(),
            }
          : item
      ),
    };
    persist(next);
    set(next);
    return {
      ok: true,
      id,
      warning: inactiveIngredientWarning(input.ingredients, state.ingredients),
    };
  },
  deleteMenuItem: (id) => {
    const state = get();
    const used = state.orders.some((order) =>
      ["open", "preparing"].includes(order.status) &&
      order.items.some((item) => item.menuItemId === id)
    );
    if (used) {
      return {
        ok: false,
        error: "This menu item cannot be deleted because it is used on an open or preparing order.",
      };
    }
    const next = {
      ...snapshot(state),
      menuItems: state.menuItems.filter((item) => item.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  toggleMenuAvailability: (id) => {
    const state = get();
    const next = {
      ...snapshot(state),
      menuItems: state.menuItems.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable, updatedAt: nowIso() } : item
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  setupInventory: (input) => {
    const state = get();
    if (!input.ingredientId) return { ok: false, error: "Select an ingredient." };
    if (state.inventory.some((item) => item.ingredientId === input.ingredientId)) {
      return { ok: false, error: "This ingredient already has an inventory record." };
    }
    if (input.currentStock < 0 || input.minimumStock < 0 || input.costPerUnit < 0) {
      return { ok: false, error: "Stock and cost values cannot be negative." };
    }
    const record: InventoryItem = {
      id: createId(),
      ingredientId: input.ingredientId,
      currentStock: input.currentStock,
      minimumStock: input.minimumStock,
      costPerUnit: input.costPerUnit,
      lastUpdated: nowIso(),
    };
    const next = { ...snapshot(state), inventory: [record, ...state.inventory] };
    persist(next);
    set(next);
    return { ok: true, id: record.id };
  },
  updateInventoryMeta: (id, input) => {
    const state = get();
    if (input.minimumStock < 0 || input.costPerUnit < 0) {
      return { ok: false, error: "Values cannot be negative." };
    }
    const next = {
      ...snapshot(state),
      inventory: state.inventory.map((item) =>
        item.id === id
          ? {
              ...item,
              minimumStock: input.minimumStock,
              costPerUnit: input.costPerUnit,
              lastUpdated: nowIso(),
            }
          : item
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  addStock: (inventoryId, quantity, reason, date) =>
    applyStockChange(get, set, inventoryId, "IN", quantity, reason, date),
  removeStock: (inventoryId, quantity, reason, date) =>
    applyStockChange(get, set, inventoryId, "OUT", quantity, reason, date),
  adjustStock: (inventoryId, newQuantity, reason, date) => {
    const state = get();
    const item = state.inventory.find((row) => row.id === inventoryId);
    if (!item) return { ok: false, error: "Inventory record not found." };
    if (newQuantity < 0) return { ok: false, error: "Stock cannot be negative." };
    return applyAbsoluteStock(get, set, inventoryId, newQuantity, reason, date);
  },
  deleteInventory: (id) => {
    const state = get();
    const next = {
      ...snapshot(state),
      inventory: state.inventory.filter((item) => item.id !== id),
      transactions: state.transactions.filter((tx) => tx.inventoryItemId !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createOrder: (input) => {
    const state = get();
    const table = state.tables.find((row) => row.id === input.tableId);
    if (!table) return { ok: false, error: "Select a table." };
    if (!input.items.length) return { ok: false, error: "Add at least one menu item." };
    if (input.items.some((item) => item.quantity < 1)) {
      return { ok: false, error: "Item quantities must be at least 1." };
    }
    const order: Order = {
      id: createId(),
      orderNumber: nextOrderNumber(state.orders),
      tableId: table.id,
      zoneId: table.zoneId,
      status: input.status,
      notes: input.notes.trim(),
      items: input.items.map((item) => ({ ...item, id: createId() })),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), orders: [order, ...state.orders] };
    persist(next);
    set(next);
    return { ok: true, id: order.id };
  },
  updateOrder: (id, input) => {
    const state = get();
    const table = state.tables.find((row) => row.id === input.tableId);
    if (!table) return { ok: false, error: "Select a table." };
    if (!input.items.length) return { ok: false, error: "Add at least one menu item." };
    if (input.items.some((item) => item.quantity < 1)) {
      return { ok: false, error: "Item quantities must be at least 1." };
    }
    const next = {
      ...snapshot(state),
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              tableId: table.id,
              zoneId: table.zoneId,
              status: input.status,
              notes: input.notes.trim(),
              items: input.items.map((item) => ({
                ...item,
                id: createId(),
              })),
              updatedAt: nowIso(),
            }
          : order
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteOrder: (id) => {
    const state = get();
    const next = { ...snapshot(state), orders: state.orders.filter((order) => order.id !== id) };
    persist(next);
    set(next);
    return { ok: true };
  },
  createAccount: (input) => {
    const state = get();
    const error = validateAccountInput(state.accounts, input);
    if (error) return { ok: false, error };
    const account: Account = {
      id: createId(),
      code: input.code.trim(),
      name: input.name.trim(),
      type: input.type,
      isCash: input.type === "asset" ? input.isCash : false,
      isSystem: false,
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), accounts: [...state.accounts, account].sort(sortAccounts) };
    persist(next);
    set(next);
    return { ok: true, id: account.id };
  },
  updateAccount: (id, input) => {
    const state = get();
    const existing = state.accounts.find((account) => account.id === id);
    if (!existing) return { ok: false, error: "Account not found." };
    const error = validateAccountInput(state.accounts, input, id);
    if (error) return { ok: false, error };
    if (existing.isSystem && existing.code !== input.code.trim()) {
      return { ok: false, error: "System account codes cannot be changed." };
    }
    const next = {
      ...snapshot(state),
      accounts: state.accounts
        .map((account) =>
          account.id === id
            ? {
                ...account,
                code: existing.isSystem ? account.code : input.code.trim(),
                name: input.name.trim(),
                type: existing.isSystem ? account.type : input.type,
                isCash: (existing.isSystem ? account.type : input.type) === "asset" ? input.isCash : false,
                isActive: input.isActive,
                updatedAt: nowIso(),
              }
            : account
        )
        .sort(sortAccounts),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteAccount: (id) => {
    const state = get();
    const account = state.accounts.find((row) => row.id === id);
    if (!account) return { ok: false, error: "Account not found." };
    if (account.isSystem) return { ok: false, error: "System accounts cannot be deleted." };
    const used = state.journalEntries.some((entry) =>
      entry.lines.some((line) => line.accountId === id)
    );
    if (used) {
      return { ok: false, error: "This account has journal activity. Deactivate it instead." };
    }
    const next = {
      ...snapshot(state),
      accounts: state.accounts.filter((row) => row.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createJournal: (input) => {
    const state = get();
    const lines: JournalLine[] = input.lines.map((line) => ({
      ...line,
      id: createId(),
      description: line.description.trim(),
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
    }));
    const error = validateJournalLines(lines);
    if (error) return { ok: false, error };
    if (!input.date) return { ok: false, error: "Date is required." };
    if (!input.description.trim()) return { ok: false, error: "Narration is required." };
    const entry: JournalEntry = {
      id: createId(),
      number: nextDocumentNumber(
        "JNL",
        state.journalEntries.map((row) => row.number)
      ),
      date: input.date,
      description: input.description.trim(),
      source: "manual",
      sourceId: null,
      lines,
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      journalEntries: [entry, ...state.journalEntries],
    };
    persist(next);
    set(next);
    return { ok: true, id: entry.id };
  },
  deleteJournal: (id) => {
    const state = get();
    const entry = state.journalEntries.find((row) => row.id === id);
    if (!entry) return { ok: false, error: "Journal entry not found." };
    if (entry.source !== "manual") {
      return { ok: false, error: "System-posted journals cannot be deleted here. Delete the source document instead." };
    }
    const next = {
      ...snapshot(state),
      journalEntries: state.journalEntries.filter((row) => row.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createPurchase: (input) => {
    const state = get();
    if (!input.supplier.trim()) return { ok: false, error: "Supplier is required." };
    if (!input.date) return { ok: false, error: "Date is required." };
    if (!input.lines.length) return { ok: false, error: "Add at least one purchase line." };
    if (input.lines.some((line) => !line.description.trim() || line.quantity <= 0 || line.unitCost < 0)) {
      return { ok: false, error: "Each line needs a description, quantity and unit cost." };
    }
    const creditAccount = creditAccountForPayment(state.accounts, input.payment);
    const purchasesAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.purchases);
    if (!creditAccount || !purchasesAccount) {
      return { ok: false, error: "Required accounts are missing from the chart of accounts." };
    }
    const purchaseId = createId();
    const journalId = createId();
    const lines = input.lines.map((line) => ({
      id: createId(),
      description: line.description.trim(),
      ingredientId: line.ingredientId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      postedToInventory: false,
    }));
    const total = purchaseTotal({ lines });
    const purchase: Purchase = {
      id: purchaseId,
      number: nextDocumentNumber(
        "PUR",
        state.purchases.map((row) => row.number)
      ),
      supplier: input.supplier.trim(),
      invoiceNumber: input.invoiceNumber.trim(),
      date: input.date,
      payment: input.payment,
      notes: input.notes.trim(),
      lines,
      journalEntryId: journalId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const journal: JournalEntry = {
      id: journalId,
      number: nextDocumentNumber(
        "JNL",
        state.journalEntries.map((row) => row.number)
      ),
      date: input.date,
      description: `Purchase ${purchase.number} ${purchase.supplier}`,
      source: "purchase",
      sourceId: purchase.id,
      lines: [
        {
          id: createId(),
          accountId: purchasesAccount.id,
          description: "Food purchases",
          debit: total,
          credit: 0,
        },
        {
          id: createId(),
          accountId: creditAccount.id,
          description: purchase.supplier,
          debit: 0,
          credit: total,
        },
      ],
      createdAt: nowIso(),
    };
    const next: AppData = {
      ...snapshot(state),
      purchases: [purchase, ...state.purchases],
      journalEntries: [journal, ...state.journalEntries],
    };
    persist(next);
    set(next);

    const toPost = lines.filter((_, index) => input.lines[index]?.addToInventory);
    for (const line of toPost) {
      const result = get().postPurchaseLineToInventory(purchase.id, line.id, line.ingredientId);
      if (!result.ok) return { ok: true, id: purchase.id, warning: result.error };
    }
    return { ok: true, id: purchase.id };
  },
  deletePurchase: (id) => {
    const state = get();
    const purchase = state.purchases.find((row) => row.id === id);
    if (!purchase) return { ok: false, error: "Purchase not found." };
    if (purchase.lines.some((line) => line.postedToInventory)) {
      return {
        ok: false,
        error: "This purchase has lines posted to inventory and cannot be deleted.",
      };
    }
    const next = {
      ...snapshot(state),
      purchases: state.purchases.filter((row) => row.id !== id),
      journalEntries: state.journalEntries.filter(
        (entry) => entry.id !== purchase.journalEntryId && entry.sourceId !== id
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createExpense: (input) => {
    const state = get();
    if (!input.payee.trim()) return { ok: false, error: "Payee is required." };
    if (!input.date) return { ok: false, error: "Date is required." };
    if (!input.lines.length) return { ok: false, error: "Add at least one expense line." };
    if (input.lines.some((line) => !line.description.trim() || !line.accountId || line.amount <= 0)) {
      return { ok: false, error: "Each line needs a description, account and amount." };
    }
    const invalidAccount = input.lines.some((line) => {
      const account = state.accounts.find((row) => row.id === line.accountId);
      return !account || account.type !== "expense";
    });
    if (invalidAccount) return { ok: false, error: "Expense lines must use an expense account." };
    const creditAccount = creditAccountForPayment(state.accounts, input.payment);
    if (!creditAccount) {
      return { ok: false, error: "Required accounts are missing from the chart of accounts." };
    }
    const expenseId = createId();
    const journalId = createId();
    const lines = input.lines.map((line) => ({
      id: createId(),
      description: line.description.trim(),
      accountId: line.accountId,
      amount: Number(line.amount.toFixed(2)),
    }));
    const total = expenseTotal({ lines });
    const expense: Expense = {
      id: expenseId,
      number: nextDocumentNumber(
        "EXP",
        state.expenses.map((row) => row.number)
      ),
      payee: input.payee.trim(),
      reference: input.reference.trim(),
      date: input.date,
      payment: input.payment,
      notes: input.notes.trim(),
      lines,
      journalEntryId: journalId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const debitLines = lines.map((line) => ({
      id: createId(),
      accountId: line.accountId,
      description: line.description,
      debit: line.amount,
      credit: 0,
    }));
    const journal: JournalEntry = {
      id: journalId,
      number: nextDocumentNumber(
        "JNL",
        state.journalEntries.map((row) => row.number)
      ),
      date: input.date,
      description: `Expense ${expense.number} ${expense.payee}`,
      source: "expense",
      sourceId: expense.id,
      lines: [
        ...debitLines,
        {
          id: createId(),
          accountId: creditAccount.id,
          description: expense.payee,
          debit: 0,
          credit: total,
        },
      ],
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      expenses: [expense, ...state.expenses],
      journalEntries: [journal, ...state.journalEntries],
    };
    persist(next);
    set(next);
    return { ok: true, id: expense.id };
  },
  deleteExpense: (id) => {
    const state = get();
    const expense = state.expenses.find((row) => row.id === id);
    if (!expense) return { ok: false, error: "Expense not found." };
    const next = {
      ...snapshot(state),
      expenses: state.expenses.filter((row) => row.id !== id),
      journalEntries: state.journalEntries.filter(
        (entry) => entry.id !== expense.journalEntryId && entry.sourceId !== id
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createAsset: (input) => {
    const state = get();
    if (!input.name.trim()) return { ok: false, error: "Asset name is required." };
    if (!input.acquiredOn) return { ok: false, error: "Acquisition date is required." };
    if (input.cost <= 0) return { ok: false, error: "Cost must be greater than zero." };
    if (input.depreciates && input.usefulLifeYears <= 0) {
      return { ok: false, error: "Depreciating assets need a useful life in years." };
    }
    if (input.residualValue < 0 || input.residualValue >= input.cost) {
      return { ok: false, error: "Residual value must be below cost." };
    }
    const creditAccount = creditAccountForPayment(state.accounts, input.funding);
    const assetAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.fixedAssets);
    if (!creditAccount || !assetAccount) {
      return { ok: false, error: "Required accounts are missing from the chart of accounts." };
    }
    const assetId = createId();
    const journalId = createId();
    const asset: FixedAsset = {
      id: assetId,
      number: nextDocumentNumber(
        "AST",
        (state.assets ?? []).map((row) => row.number)
      ),
      name: input.name.trim(),
      category: input.category,
      acquiredOn: input.acquiredOn,
      cost: Number(input.cost.toFixed(2)),
      funding: input.funding,
      depreciates: input.depreciates,
      usefulLifeMonths: input.depreciates ? Math.round(input.usefulLifeYears * 12) : 0,
      residualValue: input.depreciates ? Number(input.residualValue.toFixed(2)) : 0,
      accumulatedDepreciation: 0,
      lastDepreciationDate: null,
      notes: input.notes.trim(),
      journalEntryId: journalId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const journal: JournalEntry = {
      id: journalId,
      number: nextDocumentNumber(
        "JNL",
        state.journalEntries.map((row) => row.number)
      ),
      date: input.acquiredOn,
      description: `Asset ${asset.number} ${asset.name}`,
      source: "asset",
      sourceId: asset.id,
      lines: [
        {
          id: createId(),
          accountId: assetAccount.id,
          description: asset.name,
          debit: asset.cost,
          credit: 0,
        },
        {
          id: createId(),
          accountId: creditAccount.id,
          description: asset.name,
          debit: 0,
          credit: asset.cost,
        },
      ],
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      assets: [asset, ...(state.assets ?? [])],
      journalEntries: [journal, ...state.journalEntries],
    };
    persist(next);
    set(next);
    return { ok: true, id: asset.id };
  },
  deleteAsset: (id) => {
    const state = get();
    const asset = (state.assets ?? []).find((row) => row.id === id);
    if (!asset) return { ok: false, error: "Asset not found." };
    if (asset.accumulatedDepreciation > 0) {
      return {
        ok: false,
        error: "This asset has depreciation posted and cannot be deleted.",
      };
    }
    const next = {
      ...snapshot(state),
      assets: (state.assets ?? []).filter((row) => row.id !== id),
      journalEntries: state.journalEntries.filter(
        (entry) => entry.id !== asset.journalEntryId && entry.sourceId !== id
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  chargeAssetDepreciation: (id, asOfDate) => chargeOneAsset(get, set, id, asOfDate),
  chargeAllDepreciation: (asOfDate) => {
    const assets = (get().assets ?? []).filter((asset) => asset.depreciates);
    let posted = 0;
    for (const asset of assets) {
      const result = chargeOneAsset(get, set, asset.id, asOfDate);
      if (result.ok && result.id) posted += 1;
    }
    if (posted === 0) return { ok: false, error: "Nothing to depreciate up to this date." };
    return { ok: true, warning: `Posted depreciation on ${posted} asset${posted === 1 ? "" : "s"}.` };
  },
  createEmployee: (input) => {
    const state = get();
    if (!input.firstName.trim() || !input.lastName.trim()) {
      return { ok: false, error: "First name and last name are required." };
    }
    if (!input.jobTitle.trim()) return { ok: false, error: "Job title is required." };
    if (!input.startDate) return { ok: false, error: "Start date is required." };
    if (input.basicSalary < 0) return { ok: false, error: "Basic salary cannot be negative." };
    const employee: Employee = {
      ...input,
      id: createId(),
      employeeNumber: nextDocumentNumber(
        "EMP",
        (state.employees ?? []).map((row) => row.employeeNumber)
      ),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      nid: input.nid.trim(),
      jobTitle: input.jobTitle.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const next = { ...snapshot(state), employees: [employee, ...(state.employees ?? [])] };
    persist(next);
    set(next);
    return { ok: true, id: employee.id };
  },
  updateEmployee: (id, input) => {
    const state = get();
    if (!input.firstName.trim() || !input.lastName.trim()) {
      return { ok: false, error: "First name and last name are required." };
    }
    const next = {
      ...snapshot(state),
      employees: (state.employees ?? []).map((employee) =>
        employee.id === id
          ? {
              ...employee,
              ...input,
              firstName: input.firstName.trim(),
              lastName: input.lastName.trim(),
              nid: input.nid.trim(),
              jobTitle: input.jobTitle.trim(),
              updatedAt: nowIso(),
            }
          : employee
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteEmployee: (id) => {
    const state = get();
    const used = (state.payslips ?? []).some((slip) => slip.employeeId === id);
    if (used) {
      return { ok: false, error: "This employee has payslips. Deactivate the record instead." };
    }
    const next = {
      ...snapshot(state),
      employees: (state.employees ?? []).filter((employee) => employee.id !== id),
      leaveRequests: (state.leaveRequests ?? []).filter((row) => row.employeeId !== id),
      attendance: (state.attendance ?? []).filter((row) => row.employeeId !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  createLeave: (input) => {
    const state = get();
    if (!input.employeeId) return { ok: false, error: "Select an employee." };
    if (!input.from || !input.to) return { ok: false, error: "Leave dates are required." };
    const request: LeaveRequest = {
      id: createId(),
      employeeId: input.employeeId,
      type: input.type,
      from: input.from,
      to: input.to,
      days: leaveDaysInRange(input.from, input.to),
      reason: input.reason.trim(),
      status: "pending",
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      leaveRequests: [request, ...(state.leaveRequests ?? [])],
    };
    persist(next);
    set(next);
    return { ok: true, id: request.id };
  },
  setLeaveStatus: (id, status) => {
    const state = get();
    const next = {
      ...snapshot(state),
      leaveRequests: (state.leaveRequests ?? []).map((row) =>
        row.id === id ? { ...row, status } : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id };
  },
  deleteLeave: (id) => {
    const state = get();
    const next = {
      ...snapshot(state),
      leaveRequests: (state.leaveRequests ?? []).filter((row) => row.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  upsertAttendance: (input) => {
    const state = get();
    if (!input.employeeId || !input.date) return { ok: false, error: "Employee and date are required." };
    const existing = (state.attendance ?? []).find(
      (row) => row.employeeId === input.employeeId && row.date === input.date
    );
    const record: AttendanceRecord = {
      id: existing?.id ?? createId(),
      employeeId: input.employeeId,
      date: input.date,
      status: input.status,
      clockIn: input.clockIn,
      clockOut: input.clockOut,
      hoursWorked: input.hoursWorked,
      overtimeHours: input.overtimeHours,
      publicHolidayHours: input.publicHolidayHours,
      notes: input.notes.trim(),
    };
    const attendance = existing
      ? (state.attendance ?? []).map((row) => (row.id === existing.id ? record : row))
      : [record, ...(state.attendance ?? [])];
    const next = { ...snapshot(state), attendance };
    persist(next);
    set(next);
    return { ok: true, id: record.id };
  },
  deleteAttendance: (id) => {
    const state = get();
    const next = {
      ...snapshot(state),
      attendance: (state.attendance ?? []).filter((row) => row.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  generatePayslips: (period, employeeId) => {
    const state = get();
    if (!/^\d{4}-\d{2}$/.test(period)) return { ok: false, error: "Use a pay period such as 2026-10." };
    if ((state.payrollRuns ?? []).some((run) => run.period === period && run.journalEntryId)) {
      return { ok: false, error: "This month is already in the books. Undo the posting before you calculate again." };
    }
    const policy = state.payrollPolicy ?? defaultPayrollPolicy();
    const active = (state.employees ?? []).filter(
      (employee) => employee.isActive && (!employeeId || employee.id === employeeId)
    );
    if (!active.length) return { ok: false, error: employeeId ? "Employee is not active." : "No active employees." };
    let slips = [...(state.payslips ?? [])];
    for (const employee of active) {
      const priorPayslips = slips.filter((slip) => slip.employeeId === employee.id && slip.period !== period);
      slips = slips.filter((slip) => !(slip.employeeId === employee.id && slip.period === period));
      const built = buildPayslip({
        employee,
        period,
        attendance: state.attendance ?? [],
        leave: state.leaveRequests ?? [],
        holidays: state.holidays ?? [],
        policy,
        priorPayslips,
        number: nextDocumentNumber(
          "PAY",
          slips.map((slip) => slip.number)
        ),
      });
      slips = [
        {
          ...built,
          id: createId(),
          createdAt: nowIso(),
        },
        ...slips,
      ];
    }
    const next = { ...snapshot(state), payslips: slips };
    persist(next);
    set(next);
    return { ok: true, warning: `Payslips generated for ${active.length} employee${active.length === 1 ? "" : "s"}.` };
  },
  deletePayslip: (id) => {
    const state = get();
    const slip = (state.payslips ?? []).find((row) => row.id === id);
    if (!slip) return { ok: false, error: "Payslip not found." };
    if ((state.payrollRuns ?? []).some((run) => run.period === slip.period && run.journalEntryId)) {
      return { ok: false, error: "This month is in the books. Undo the posting before you delete a slip." };
    }
    const next = {
      ...snapshot(state),
      payslips: (state.payslips ?? []).filter((row) => row.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  postPayroll: (period) => {
    const state = get();
    const slips = (state.payslips ?? []).filter((slip) => slip.period === period);
    if (!slips.length) return { ok: false, error: "Calculate the month before you post it." };
    const active = (state.employees ?? []).filter((employee) => employee.isActive);
    const missing = active.filter((employee) => !slips.some((slip) => slip.employeeId === employee.id));
    if (missing.length) {
      return {
        ok: false,
        error: `Calculate a slip for ${missing.map((employee) => employeeName(employee)).join(", ")} first.`,
      };
    }
    const existing = (state.payrollRuns ?? []).find((run) => run.period === period);
    if (existing?.journalEntryId) return { ok: false, error: "This month is already in the books." };
    const totals = payrollTotals(slips);
    if (totals.employerCost <= 0) return { ok: false, error: "There is nothing to post for this month." };
    const codes = [
      [SYSTEM_ACCOUNT_CODES.wages, "Wages and salaries"],
      [SYSTEM_ACCOUNT_CODES.employerCsg, "Employer CSG"],
      [SYSTEM_ACCOUNT_CODES.employerNsf, "Employer NSF"],
      [SYSTEM_ACCOUNT_CODES.hrdc, "HRDC training levy"],
      [SYSTEM_ACCOUNT_CODES.prgfExpense, "PRGF"],
      [SYSTEM_ACCOUNT_CODES.netWages, "Net wages payable"],
      [SYSTEM_ACCOUNT_CODES.payePayable, "PAYE payable"],
      [SYSTEM_ACCOUNT_CODES.csgPayable, "CSG payable"],
      [SYSTEM_ACCOUNT_CODES.nsfPayable, "NSF payable"],
      [SYSTEM_ACCOUNT_CODES.hrdcPayable, "HRDC levy payable"],
      [SYSTEM_ACCOUNT_CODES.prgfPayable, "PRGF payable"],
    ] as const;
    const accounts = Object.fromEntries(
      codes.map(([code, label]) => {
        const account = accountByCode(state.accounts, code);
        return [code, account ? account.id : label];
      })
    );
    const missingAccount = codes.find(([code]) => !state.accounts.some((account) => account.code === code));
    if (missingAccount) {
      return { ok: false, error: "Payroll accounts are missing from the chart. Reload the page and try again." };
    }
    const line = (code: string, description: string, debit: number, credit: number): JournalLine | null => {
      if (debit <= 0 && credit <= 0) return null;
      return {
        id: createId(),
        accountId: accounts[code] as string,
        description,
        debit,
        credit,
      };
    };
    const lines = [
      line(SYSTEM_ACCOUNT_CODES.wages, "Gross pay", totals.wagesExpense, 0),
      line(SYSTEM_ACCOUNT_CODES.employerCsg, "Employer CSG", totals.csgEmployer, 0),
      line(SYSTEM_ACCOUNT_CODES.employerNsf, "Employer NSF", totals.nsfEmployer, 0),
      line(SYSTEM_ACCOUNT_CODES.hrdc, "HRDC training levy", totals.hrdc, 0),
      line(SYSTEM_ACCOUNT_CODES.prgfExpense, "PRGF", totals.prgf, 0),
      line(SYSTEM_ACCOUNT_CODES.netWages, "Net wages", 0, totals.net),
      line(SYSTEM_ACCOUNT_CODES.payePayable, "PAYE", 0, totals.paye),
      line(SYSTEM_ACCOUNT_CODES.csgPayable, "CSG", 0, totals.csgPayable),
      line(SYSTEM_ACCOUNT_CODES.nsfPayable, "NSF", 0, totals.nsfPayable),
      line(SYSTEM_ACCOUNT_CODES.hrdcPayable, "HRDC", 0, totals.hrdc),
      line(SYSTEM_ACCOUNT_CODES.prgfPayable, "PRGF", 0, totals.prgf),
    ].filter((row): row is JournalLine => Boolean(row));
    const invalid = validateJournalLines(lines);
    if (invalid) return { ok: false, error: invalid };
    const runId = existing?.id ?? createId();
    const bounds = periodBounds(period);
    const today = new Date().toISOString().slice(0, 10);
    const postingDate = today < bounds.from ? bounds.from : today < bounds.to ? today : bounds.to;
    const entry: JournalEntry = {
      id: createId(),
      number: nextDocumentNumber("JNL", state.journalEntries.map((row) => row.number)),
      date: postingDate,
      description: `Payroll ${period}`,
      source: "payroll",
      sourceId: runId,
      lines,
      createdAt: nowIso(),
    };
    const run: PayrollRun = {
      id: runId,
      period,
      journalEntryId: entry.id,
      paymentJournalId: existing?.paymentJournalId ?? null,
      remittanceJournalId: existing?.remittanceJournalId ?? null,
      paidOn: existing?.paidOn ?? null,
      filedOn: existing?.filedOn ?? null,
      paymentReference: existing?.paymentReference ?? "",
      filingReference: existing?.filingReference ?? "",
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      journalEntries: [entry, ...state.journalEntries],
      payrollRuns: [run, ...(state.payrollRuns ?? []).filter((row) => row.period !== period)],
    };
    persist(next);
    set(next);
    return { ok: true, id: entry.id, warning: `Payroll for ${period} is in the books.` };
  },
  paySalaries: (period, date, reference) => {
    const state = get();
    if (!date) return { ok: false, error: "Payment date is required." };
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.journalEntryId) return { ok: false, error: "Post the month to the books before you pay it." };
    if (run.paymentJournalId) return { ok: false, error: "Salaries for this month are already paid." };
    const slips = (state.payslips ?? []).filter((slip) => slip.period === period);
    const unpaid = slips
      .map((slip) => (state.employees ?? []).find((employee) => employee.id === slip.employeeId))
      .filter((employee): employee is Employee => Boolean(employee))
      .filter((employee) => !employee.bankName.trim() || !employee.bankAccount.trim());
    if (unpaid.length) {
      return {
        ok: false,
        error: `Add a bank and account number for ${unpaid.map((employee) => employeeName(employee)).join(", ")}.`,
      };
    }
    const totals = payrollTotals(slips);
    if (totals.net <= 0) return { ok: false, error: "Net pay is zero, so there is nothing to send to the bank." };
    const bank = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.bank);
    const wages = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.netWages);
    if (!bank || !wages) return { ok: false, error: "Bank or net wages account is missing." };
    const entry: JournalEntry = {
      id: createId(),
      number: nextDocumentNumber("JNL", state.journalEntries.map((row) => row.number)),
      date,
      description: `Salary payment ${period}${reference.trim() ? ` · ${reference.trim()}` : ""}`,
      source: "payroll",
      sourceId: run.id,
      lines: [
        { id: createId(), accountId: wages.id, description: "Net wages", debit: totals.net, credit: 0 },
        { id: createId(), accountId: bank.id, description: "Bank", debit: 0, credit: totals.net },
      ],
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      journalEntries: [entry, ...state.journalEntries],
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period
          ? { ...row, paymentJournalId: entry.id, paidOn: date, paymentReference: reference.trim(), updatedAt: nowIso() }
          : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id: entry.id, warning: `Salaries for ${period} are marked paid.` };
  },
  filePayroll: (period, date, reference) => {
    const state = get();
    if (!date) return { ok: false, error: "Filing date is required." };
    if (!reference.trim()) return { ok: false, error: "Enter the MRA acknowledgement or your own filing reference." };
    const tan = (state.company?.tan ?? "").trim();
    if (!tan) return { ok: false, error: "Add the company TAN in Settings before you file." };
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.journalEntryId) return { ok: false, error: "Post the month before you file it." };
    if (run.filedOn) return { ok: false, error: "This return is already marked filed." };
    const next = {
      ...snapshot(state),
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period
          ? { ...row, filedOn: date, filingReference: reference.trim(), updatedAt: nowIso() }
          : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true, warning: `The ${period} return is marked filed.` };
  },
  remitPayroll: (period, date, reference) => {
    const state = get();
    if (!date) return { ok: false, error: "Remittance date is required." };
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.filedOn) return { ok: false, error: "Mark the return filed before you remit it." };
    if (run.remittanceJournalId) return { ok: false, error: "Statutory contributions for this month are already remitted." };
    const slips = (state.payslips ?? []).filter((slip) => slip.period === period);
    const totals = payrollTotals(slips);
    const bank = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.bank);
    if (!bank) return { ok: false, error: "Bank account is missing." };
    const credits: { code: string; description: string; amount: number }[] = [
      { code: SYSTEM_ACCOUNT_CODES.payePayable, description: "PAYE", amount: totals.paye },
      { code: SYSTEM_ACCOUNT_CODES.csgPayable, description: "CSG", amount: totals.csgPayable },
      { code: SYSTEM_ACCOUNT_CODES.nsfPayable, description: "NSF", amount: totals.nsfPayable },
      { code: SYSTEM_ACCOUNT_CODES.hrdcPayable, description: "HRDC", amount: totals.hrdc },
      { code: SYSTEM_ACCOUNT_CODES.prgfPayable, description: "PRGF", amount: totals.prgf },
    ].filter((row) => row.amount > 0);
    if (!credits.length) return { ok: false, error: "There is nothing to remit for this month." };
    const lines: JournalLine[] = [];
    for (const row of credits) {
      const account = accountByCode(state.accounts, row.code);
      if (!account) return { ok: false, error: "A statutory account is missing." };
      lines.push({
        id: createId(),
        accountId: account.id,
        description: row.description,
        debit: row.amount,
        credit: 0,
      });
    }
    const remitted = Number(lines.reduce((sum, row) => sum + row.debit, 0).toFixed(2));
    lines.push({
      id: createId(),
      accountId: bank.id,
      description: "Bank",
      debit: 0,
      credit: remitted,
    });
    const invalid = validateJournalLines(lines);
    if (invalid) return { ok: false, error: invalid };
    const entry: JournalEntry = {
      id: createId(),
      number: nextDocumentNumber("JNL", state.journalEntries.map((row) => row.number)),
      date,
      description: `MRA remittance ${period}${reference.trim() ? ` · ${reference.trim()}` : ""}`,
      source: "payroll",
      sourceId: run.id,
      lines,
      createdAt: nowIso(),
    };
    const next = {
      ...snapshot(state),
      journalEntries: [entry, ...state.journalEntries],
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period ? { ...row, remittanceJournalId: entry.id, updatedAt: nowIso() } : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id: entry.id, warning: `PAYE and contributions for ${period} left the bank.` };
  },
  undoPayrollPost: (period) => {
    const state = get();
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.journalEntryId) return { ok: false, error: "This month is not in the books." };
    if (run.paymentJournalId || run.remittanceJournalId) {
      return { ok: false, error: "Undo the salary payment and the remittance first." };
    }
    const next = {
      ...snapshot(state),
      journalEntries: state.journalEntries.filter((entry) => entry.id !== run.journalEntryId),
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period ? { ...row, journalEntryId: null, updatedAt: nowIso() } : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  undoSalaryPayment: (period) => {
    const state = get();
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.paymentJournalId) return { ok: false, error: "Salaries for this month are not marked paid." };
    const next = {
      ...snapshot(state),
      journalEntries: state.journalEntries.filter((entry) => entry.id !== run.paymentJournalId),
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period
          ? { ...row, paymentJournalId: null, paidOn: null, paymentReference: "", updatedAt: nowIso() }
          : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  undoPayrollFiling: (period) => {
    const state = get();
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.filedOn) return { ok: false, error: "This return is not marked filed." };
    if (run.remittanceJournalId) return { ok: false, error: "Undo the remittance before you undo the filing." };
    const next = {
      ...snapshot(state),
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period ? { ...row, filedOn: null, filingReference: "", updatedAt: nowIso() } : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  undoRemittance: (period) => {
    const state = get();
    const run = (state.payrollRuns ?? []).find((row) => row.period === period);
    if (!run?.remittanceJournalId) return { ok: false, error: "Nothing has been remitted for this month." };
    const next = {
      ...snapshot(state),
      journalEntries: state.journalEntries.filter((entry) => entry.id !== run.remittanceJournalId),
      payrollRuns: (state.payrollRuns ?? []).map((row) =>
        row.period === period ? { ...row, remittanceJournalId: null, updatedAt: nowIso() } : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  updatePayrollPolicy: (input) => {
    const state = get();
    const next = { ...snapshot(state), payrollPolicy: input };
    persist(next);
    set(next);
    return { ok: true };
  },
  updateCompany: (input) => {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Company name is required." };
    const email = input.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Enter a valid email address." };
    }
    if (input.logo && !input.logo.startsWith("data:image/")) {
      return { ok: false, error: "Logo must be an image." };
    }
    if (input.logo && input.logo.length > 400_000) {
      return { ok: false, error: "Logo is too large. Use a smaller image." };
    }
    const company: CompanyProfile = {
      name,
      legalName: input.legalName.trim(),
      brn: input.brn.trim(),
      vatNumber: input.vatNumber.trim(),
      tan: input.tan.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      phone: input.phone.trim(),
      email,
      website: input.website.trim(),
      logo: input.logo,
    };
    const next = { ...snapshot(get()), company };
    persist(next);
    set(next);
    return { ok: true };
  },
  addHoliday: (date, name) => {
    const state = get();
    if (!date || !name.trim()) return { ok: false, error: "Date and holiday name are required." };
    if ((state.holidays ?? []).some((holiday) => holiday.date === date)) {
      return { ok: false, error: "That date is already a public holiday." };
    }
    const holiday = { id: createId(), date, name: name.trim() };
    const next = {
      ...snapshot(state),
      holidays: [...(state.holidays ?? []), holiday].sort((a, b) => a.date.localeCompare(b.date)),
    };
    persist(next);
    set(next);
    return { ok: true, id: holiday.id };
  },
  deleteHoliday: (id) => {
    const state = get();
    const next = {
      ...snapshot(state),
      holidays: (state.holidays ?? []).filter((holiday) => holiday.id !== id),
    };
    persist(next);
    set(next);
    return { ok: true };
  },
  postPurchaseLineToInventory: (purchaseId, lineId, ingredientId) => {
    const state = get();
    const purchase = state.purchases.find((row) => row.id === purchaseId);
    if (!purchase) return { ok: false, error: "Purchase not found." };
    const line = purchase.lines.find((row) => row.id === lineId);
    if (!line) return { ok: false, error: "Purchase line not found." };
    if (line.postedToInventory) return { ok: false, error: "This line is already in inventory." };
    const resolvedIngredientId = ingredientId || line.ingredientId;
    if (!resolvedIngredientId) {
      return { ok: false, error: "Select an ingredient before posting this line to inventory." };
    }
    const ingredient = state.ingredients.find((row) => row.id === resolvedIngredientId);
    if (!ingredient) return { ok: false, error: "Ingredient not found." };
    const inventoryAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.inventory);
    const purchasesAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.purchases);
    if (!inventoryAccount || !purchasesAccount) {
      return { ok: false, error: "Inventory or purchases account is missing." };
    }

    const amount = lineAmount(line);
    const reason = `${purchase.number} ${line.description}`;
    const stockDate = `${purchase.date}T09:00:00.000Z`;
    const existing = state.inventory.find((row) => row.ingredientId === resolvedIngredientId);
    let inventory = state.inventory;
    let transactions = state.transactions;

    if (existing) {
      const nextStock = Number((existing.currentStock + line.quantity).toFixed(4));
      const updated: InventoryItem = {
        ...existing,
        currentStock: nextStock,
        costPerUnit: line.unitCost,
        lastUpdated: stockDate,
      };
      const transaction: InventoryTransaction = {
        id: createId(),
        inventoryItemId: existing.id,
        type: "IN",
        quantityChange: line.quantity,
        previousStock: existing.currentStock,
        newStock: nextStock,
        reason,
        createdAt: stockDate,
      };
      inventory = state.inventory.map((row) => (row.id === existing.id ? updated : row));
      transactions = [transaction, ...state.transactions];
    } else {
      const record: InventoryItem = {
        id: createId(),
        ingredientId: resolvedIngredientId,
        currentStock: line.quantity,
        minimumStock: 0,
        costPerUnit: line.unitCost,
        lastUpdated: stockDate,
      };
      inventory = [record, ...state.inventory];
    }

    const journal: JournalEntry = {
      id: createId(),
      number: nextDocumentNumber(
        "JNL",
        state.journalEntries.map((row) => row.number)
      ),
      date: purchase.date,
      description: `Stock from ${purchase.number} ${line.description}`,
      source: "inventory",
      sourceId: purchase.id,
      lines: [
        {
          id: createId(),
          accountId: inventoryAccount.id,
          description: line.description,
          debit: amount,
          credit: 0,
        },
        {
          id: createId(),
          accountId: purchasesAccount.id,
          description: "Reclassify to inventory",
          debit: 0,
          credit: amount,
        },
      ],
      createdAt: nowIso(),
    };

    const next = {
      ...snapshot(state),
      inventory,
      transactions,
      journalEntries: [journal, ...state.journalEntries],
      purchases: state.purchases.map((row) =>
        row.id === purchase.id
          ? {
              ...row,
              lines: row.lines.map((item) =>
                item.id === line.id
                  ? { ...item, ingredientId: resolvedIngredientId, postedToInventory: true }
                  : item
              ),
              updatedAt: nowIso(),
            }
          : row
      ),
    };
    persist(next);
    set(next);
    return { ok: true, id: purchase.id };
  },
}));

function applyStockChange(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  inventoryId: string,
  type: Exclude<InventoryTransactionType, "ADJUSTMENT">,
  quantity: number,
  reason: string,
  date?: string
): ActionResult {
  if (quantity <= 0) return { ok: false, error: "Quantity must be greater than zero." };
  const state = get();
  const item = state.inventory.find((row) => row.id === inventoryId);
  if (!item) return { ok: false, error: "Inventory record not found." };
  const delta = type === "IN" ? quantity : -quantity;
  const nextStock = Number((item.currentStock + delta).toFixed(4));
  if (nextStock < 0) return { ok: false, error: "Stock cannot go below zero." };
  return writeStock(state, set, item, type, delta, nextStock, reason, date);
}

function applyAbsoluteStock(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  inventoryId: string,
  newQuantity: number,
  reason: string,
  date?: string
): ActionResult {
  const state = get();
  const item = state.inventory.find((row) => row.id === inventoryId);
  if (!item) return { ok: false, error: "Inventory record not found." };
  const nextStock = Number(newQuantity.toFixed(4));
  const delta = Number((nextStock - item.currentStock).toFixed(4));
  return writeStock(state, set, item, "ADJUSTMENT", delta, nextStock, reason, date);
}

function writeStock(
  state: AppState,
  set: (partial: Partial<AppState>) => void,
  item: InventoryItem,
  type: InventoryTransactionType,
  quantityChange: number,
  newStock: number,
  reason: string,
  date?: string
): ActionResult {
  const updated: InventoryItem = {
    ...item,
    currentStock: newStock,
    lastUpdated: date ? new Date(date).toISOString() : nowIso(),
  };
  const transaction = {
    id: createId(),
    inventoryItemId: item.id,
    type,
    quantityChange,
    previousStock: item.currentStock,
    newStock,
    reason: reason.trim() || (type === "IN" ? "Stock received" : type === "OUT" ? "Stock removed" : "Stock adjusted"),
    createdAt: date ? new Date(date).toISOString() : nowIso(),
  };
  const next = {
    ...snapshot(state),
    inventory: state.inventory.map((row) => (row.id === item.id ? updated : row)),
    transactions: [transaction, ...state.transactions],
  };
  persist(next);
  set(next);
  return { ok: true, id: item.id };
}

function sortAccounts(a: Account, b: Account) {
  return a.code.localeCompare(b.code);
}

function validateAccountInput(accounts: Account[], input: AccountInput, id?: string) {
  if (!input.code.trim()) return "Account code is required.";
  if (!/^\d{4,6}$/.test(input.code.trim())) return "Use a 4 to 6 digit account code.";
  if (!input.name.trim()) return "Account name is required.";
  const duplicateCode = accounts.some(
    (account) => account.id !== id && account.code === input.code.trim()
  );
  if (duplicateCode) return "An account with this code already exists.";
  const types: AccountType[] = ["asset", "liability", "equity", "income", "expense"];
  if (!types.includes(input.type)) return "Select an account type.";
  return null;
}

function creditAccountForPayment(accounts: Account[], payment: PurchasePayment | AssetFunding) {
  if (payment === "cash") return accountByCode(accounts, SYSTEM_ACCOUNT_CODES.cash);
  if (payment === "bank") return accountByCode(accounts, SYSTEM_ACCOUNT_CODES.bank);
  if (payment === "capital") return accountByCode(accounts, SYSTEM_ACCOUNT_CODES.capital);
  return accountByCode(accounts, SYSTEM_ACCOUNT_CODES.payable);
}

function chargeOneAsset(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  id: string,
  asOfDate?: string
): ActionResult {
  const state = get();
  const asset = (state.assets ?? []).find((row) => row.id === id);
  if (!asset) return { ok: false, error: "Asset not found." };
  if (!asset.depreciates) return { ok: false, error: "This asset does not depreciate." };
  const date = asOfDate || new Date().toISOString().slice(0, 10);
  const amount = pendingDepreciation(asset, date);
  if (amount <= 0) return { ok: false, error: "This asset is already depreciated up to this date." };
  const expenseAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.depreciation);
  const accumAccount = accountByCode(state.accounts, SYSTEM_ACCOUNT_CODES.accumDep);
  if (!expenseAccount || !accumAccount) {
    return { ok: false, error: "Depreciation accounts are missing from the chart of accounts." };
  }
  const journal: JournalEntry = {
    id: createId(),
    number: nextDocumentNumber(
      "JNL",
      state.journalEntries.map((row) => row.number)
    ),
    date,
    description: `Depreciation ${asset.number} ${asset.name}`,
    source: "depreciation",
    sourceId: asset.id,
    lines: [
      {
        id: createId(),
        accountId: expenseAccount.id,
        description: "Straight-line depreciation",
        debit: amount,
        credit: 0,
      },
      {
        id: createId(),
        accountId: accumAccount.id,
        description: asset.name,
        debit: 0,
        credit: amount,
      },
    ],
    createdAt: nowIso(),
  };
  const next = {
    ...snapshot(state),
    journalEntries: [journal, ...state.journalEntries],
    assets: (state.assets ?? []).map((row) =>
      row.id === id
        ? {
            ...row,
            accumulatedDepreciation: Number((row.accumulatedDepreciation + amount).toFixed(2)),
            lastDepreciationDate: date,
            updatedAt: nowIso(),
          }
        : row
    ),
  };
  persist(next);
  set(next);
  return { ok: true, id: asset.id };
}
