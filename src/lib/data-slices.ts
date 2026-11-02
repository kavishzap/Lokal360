export const DATA_SLICES = [
  "company",
  "policy",
  "holidays",
  "zones",
  "tables",
  "categories",
  "units",
  "ingredients",
  "menu",
  "inventory",
  "movements",
  "orders",
  "accounts",
  "journals",
  "purchases",
  "expenses",
  "assets",
  "employees",
  "leave",
  "attendance",
  "payslips",
  "runs",
] as const;

export type DataSlice = (typeof DATA_SLICES)[number];

function under(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function routeSlices(pathname: string): DataSlice[] {
  if (under(pathname, "/dashboard/ai-analytics")) return ["company"];
  if (under(pathname, "/dashboard/zones")) return ["company", "zones", "tables"];
  if (under(pathname, "/dashboard/tables")) return ["company", "zones", "tables"];
  if (under(pathname, "/dashboard/categories")) return ["company", "categories", "menu"];
  if (under(pathname, "/dashboard/units")) return ["company", "units", "ingredients"];
  if (under(pathname, "/dashboard/ingredients")) return ["company", "ingredients", "units", "menu", "inventory"];
  if (under(pathname, "/dashboard/menu-items")) return ["company", "menu", "categories", "ingredients"];
  if (under(pathname, "/dashboard/orders")) return ["company", "orders", "tables", "zones", "categories", "menu"];
  if (under(pathname, "/dashboard/inventory")) return ["company", "inventory", "movements", "ingredients", "units"];
  if (under(pathname, "/dashboard/balance-inventory")) {
    return ["company", "orders", "menu", "ingredients", "inventory", "movements", "units"];
  }
  if (under(pathname, "/dashboard/purchases")) {
    return ["company", "purchases", "ingredients", "units", "accounts", "journals", "inventory", "movements"];
  }
  if (under(pathname, "/dashboard/expenses")) return ["company", "expenses", "accounts", "journals"];
  if (under(pathname, "/dashboard/assets")) return ["company", "assets", "accounts", "journals", "inventory"];
  if (under(pathname, "/dashboard/chart-of-accounts")) return ["company", "accounts", "journals"];
  if (under(pathname, "/dashboard/journal")) return ["company", "journals", "accounts"];
  if (under(pathname, "/dashboard/ledger")) return ["company", "journals", "accounts"];
  if (under(pathname, "/dashboard/cashbook")) return ["company", "journals", "accounts"];
  if (under(pathname, "/dashboard/reports/expenses")) return ["company", "expenses", "accounts"];
  if (under(pathname, "/dashboard/reports/sales")) return ["company", "orders", "tables", "zones", "categories"];
  if (under(pathname, "/dashboard/reports/pnl")) return ["company", "orders", "journals", "accounts"];
  if (under(pathname, "/dashboard/payroll/employees")) return ["company", "employees"];
  if (under(pathname, "/dashboard/payroll/leave")) return ["company", "employees", "leave", "policy"];
  if (under(pathname, "/dashboard/payroll/attendance")) return ["company", "employees", "attendance", "holidays"];
  if (under(pathname, "/dashboard/payroll/payslips")) {
    return ["company", "employees", "payslips", "attendance", "leave", "holidays", "policy"];
  }
  if (under(pathname, "/dashboard/payroll/run")) {
    return [
      "company",
      "employees",
      "payslips",
      "runs",
      "accounts",
      "journals",
      "attendance",
      "leave",
      "holidays",
      "policy",
    ];
  }
  if (under(pathname, "/dashboard/payroll/policies")) return ["company", "policy", "holidays"];
  if (under(pathname, "/dashboard/settings")) return ["company"];
  if (under(pathname, "/dashboard/me")) {
    return ["company", "policy", "holidays", "employees", "leave", "attendance", "payslips"];
  }
  if (pathname === "/dashboard") return ["company", "orders", "purchases", "expenses", "journals", "accounts"];
  return ["company"];
}

export function slicesForPath(pathname: string, staff: boolean): DataSlice[] {
  const slices = staff
    ? (["company", "policy", "holidays", "employees", "leave", "attendance", "payslips"] as DataSlice[])
    : routeSlices(pathname);
  return [...new Set(slices)];
}
