import { STAFF_PASSWORD, STORAGE_KEY } from "@/lib/constants";
import {
  createSampleOrders,
  createSeedData,
  IDS,
  ensureSystemAccounts,
  makeSampleAccounting,
  makeUnits,
} from "@/data/seed";
import { makeHolidays, makeSamplePayroll } from "@/data/payroll-seed";
import { defaultCompany } from "@/lib/company";
import { defaultPayrollPolicy } from "@/lib/payroll";
import type { AppData, Employee, Ingredient, MeasurementUnit } from "@/types";

type LegacyIngredient = Ingredient & { unit?: string };
type StoredEmployee = Omit<Employee, "bankCode" | "portalPassword"> & {
  bankCode?: string;
  portalPassword?: string;
};

const BANK_CODES: Record<string, string> = {
  mcb: "MCBLMUMU",
  sbm: "STCBMUMU",
  afrasia: "AFBLMUMU",
};

function withBankCodes(employees: StoredEmployee[]): Employee[] {
  return employees.map((employee) => {
    const demoHost = employee.employeeNumber === "EMP-1005";
    const bankName = employee.bankName?.trim() || (demoHost ? "MCB" : "");
    const email = employee.email?.trim() || (demoHost ? "nadia.labonne@b42.mu" : "");
    return {
      ...employee,
      bankName,
      bankCode: employee.bankCode?.trim() || BANK_CODES[bankName.toLowerCase()] || "",
      bankAccount: employee.bankAccount?.trim() || (demoHost ? "000444555666" : ""),
      nid: employee.nid?.trim() || (demoHost ? "L1402921801567" : ""),
      email,
      portalPassword: employee.portalPassword?.trim() || (email.endsWith("@b42.mu") ? STAFF_PASSWORD : ""),
    };
  });
}

export function emptyData(): AppData {
  return {
    zones: [],
    tables: [],
    categories: [],
    units: [],
    ingredients: [],
    menuItems: [],
    inventory: [],
    transactions: [],
    customers: [],
    orders: [],
    accounts: [],
    journalEntries: [],
    purchases: [],
    expenses: [],
    assets: [],
    employees: [],
    holidays: [],
    leaveRequests: [],
    attendance: [],
    payslips: [],
    payrollRuns: [],
    payrollPolicy: defaultPayrollPolicy(),
    company: defaultCompany(),
  };
}

function migrate(parsed: Partial<AppData> & { ingredients?: LegacyIngredient[] }): AppData {
  const units = parsed.units?.length ? parsed.units : makeUnits();
  const unitByAbbr = new Map(units.map((unit) => [unit.abbreviation.toLowerCase(), unit.id]));

  const ingredients = ((parsed.ingredients ?? []) as LegacyIngredient[]).map((ingredient) => {
    const { unit: legacyUnit, ...rest } = ingredient;
    if (rest.unitId) return rest;
    const legacy = legacyUnit?.toLowerCase();
    return {
      ...rest,
      unitId: (legacy && unitByAbbr.get(legacy)) || IDS.units.kg,
    };
  });

  const accounting = parsed.accounts?.length
    ? {
        accounts: parsed.accounts,
        journalEntries: parsed.journalEntries ?? [],
        purchases: parsed.purchases ?? [],
        expenses: parsed.expenses ?? [],
        assets: parsed.assets ?? [],
      }
    : makeSampleAccounting(ingredients);

  const payroll = parsed.employees?.length ? {
    employees: parsed.employees,
    holidays: parsed.holidays ?? [],
    leaveRequests: parsed.leaveRequests ?? [],
    attendance: parsed.attendance ?? [],
    payslips: parsed.payslips ?? [],
    payrollRuns: parsed.payrollRuns ?? [],
    payrollPolicy: parsed.payrollPolicy ?? defaultPayrollPolicy(),
  } : makeSamplePayroll();

  return {
    ...emptyData(),
    ...parsed,
    units,
    ingredients,
    zones: parsed.zones ?? [],
    tables: parsed.tables ?? [],
    categories: parsed.categories ?? [],
    menuItems: parsed.menuItems ?? [],
    inventory: parsed.inventory ?? [],
    transactions: parsed.transactions ?? [],
    customers: parsed.customers ?? [],
    orders: (parsed.orders ?? createSampleOrders(parsed.tables ?? [], parsed.menuItems ?? [])).map(
      (order) => ({
        ...order,
        customerId: order.customerId ?? null,
        customerName: order.customerName ?? "",
        customerPhone: order.customerPhone ?? "",
      })
    ),
    accounts: ensureSystemAccounts(
      parsed.accounts?.length ? parsed.accounts : accounting.accounts
    ),
    journalEntries: parsed.journalEntries ?? accounting.journalEntries,
    purchases: parsed.purchases ?? accounting.purchases,
    expenses: parsed.expenses ?? accounting.expenses,
    assets: parsed.assets ?? accounting.assets,
    holidays: parsed.holidays?.length ? parsed.holidays : makeHolidays(),
    leaveRequests: parsed.leaveRequests ?? payroll.leaveRequests,
    attendance: parsed.attendance ?? payroll.attendance,
    payslips: parsed.payslips ?? payroll.payslips,
    payrollRuns: parsed.payrollRuns ?? [],
    payrollPolicy: parsed.payrollPolicy ?? payroll.payrollPolicy,
    employees: withBankCodes(parsed.employees?.length ? parsed.employees : payroll.employees),
    company: parsed.company?.name?.trim()
      ? { ...defaultCompany(), ...parsed.company, logo: parsed.company.logo ?? null }
      : defaultCompany(),
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createSeedData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedData();
      saveAppData(seeded);
      return seeded;
    }
    const migrated = migrate(JSON.parse(raw) as Partial<AppData>);
    saveAppData(migrated);
    return migrated;
  } catch {
    const seeded = createSeedData();
    saveAppData(seeded);
    return seeded;
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetAppData(): AppData {
  const seeded = createSeedData();
  saveAppData(seeded);
  return seeded;
}

export function ensureDefaultUnits(units: MeasurementUnit[]) {
  return units.length ? units : makeUnits();
}
