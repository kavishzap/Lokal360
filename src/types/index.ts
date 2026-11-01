export type InventoryTransactionType = "IN" | "OUT" | "ADJUSTMENT";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Zone {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantTable {
  id: string;
  name: string;
  zoneId: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  unitId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemIngredient {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  image: string | null;
  preparationTime: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  ingredients: MenuItemIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  ingredientId: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export type OrderStatus = "open" | "preparing" | "served" | "completed" | "cancelled";

export interface OrderItem {
  id: string;
  menuItemId: string;
  categoryId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  zoneId: string;
  status: OrderStatus;
  notes: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type PurchasePayment = "cash" | "bank" | "credit";

export type JournalSource =
  | "manual"
  | "purchase"
  | "inventory"
  | "expense"
  | "asset"
  | "depreciation"
  | "payroll";

export type AssetFunding = PurchasePayment | "capital";

export type AssetCategory =
  | "vehicle"
  | "kitchen"
  | "furniture"
  | "it"
  | "building"
  | "land"
  | "other";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isCash: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  source: JournalSource;
  sourceId: string | null;
  lines: JournalLine[];
  createdAt: string;
}

export interface PurchaseLine {
  id: string;
  description: string;
  ingredientId: string | null;
  quantity: number;
  unitCost: number;
  postedToInventory: boolean;
}

export interface Purchase {
  id: string;
  number: string;
  supplier: string;
  invoiceNumber: string;
  date: string;
  payment: PurchasePayment;
  notes: string;
  lines: PurchaseLine[];
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseLine {
  id: string;
  description: string;
  accountId: string;
  amount: number;
}

export interface Expense {
  id: string;
  number: string;
  payee: string;
  reference: string;
  date: string;
  payment: PurchasePayment;
  notes: string;
  lines: ExpenseLine[];
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixedAsset {
  id: string;
  number: string;
  name: string;
  category: AssetCategory;
  acquiredOn: string;
  cost: number;
  funding: AssetFunding;
  depreciates: boolean;
  usefulLifeMonths: number;
  residualValue: number;
  accumulatedDepreciation: number;
  lastDepreciationDate: string | null;
  notes: string;
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type JobType = "full_time" | "part_time" | "casual" | "atypical";
export type PayFrequency = "monthly";
export type LeaveType =
  | "annual"
  | "sick"
  | "urgent"
  | "special"
  | "vacation"
  | "maternity"
  | "paternity"
  | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent" | "leave" | "holiday" | "off";
export type PayslipStatus = "draft" | "final";

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  nid: string;
  gender: "female" | "male" | "other";
  dateOfBirth: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  maritalStatus: "single" | "married" | "other";
  bankName: string;
  bankCode: string;
  bankAccount: string;
  jobTitle: string;
  department: string;
  jobType: JobType;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  basicSalary: number;
  payFrequency: PayFrequency;
  workDaysPerWeek: 5 | 6;
  hoursPerWeek: number;
  edfReliefAnnual: number;
  prgfEligible: boolean;
  notes: string;
  portalPassword: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  overtimeHours: number;
  publicHolidayHours: number;
  notes: string;
}

export interface Payslip {
  id: string;
  number: string;
  employeeId: string;
  period: string;
  basic: number;
  overtimePay: number;
  publicHolidayPay: number;
  unpaidDeduction: number;
  gross: number;
  csgEmployee: number;
  nsfEmployee: number;
  paye: number;
  otherDeductions: number;
  net: number;
  csgEmployer: number;
  nsfEmployer: number;
  hrdcLevy: number;
  prgf: number;
  daysPresent: number;
  daysLeave: number;
  daysUnpaid: number;
  overtimeHours: number;
  status: PayslipStatus;
  createdAt: string;
}

export interface PayrollRun {
  id: string;
  period: string;
  journalEntryId: string | null;
  paymentJournalId: string | null;
  remittanceJournalId: string | null;
  paidOn: string | null;
  filedOn: string | null;
  paymentReference: string;
  filingReference: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPolicy {
  annualLeaveDays: number;
  extraLeaveDays: number;
  sickLeaveDays: number;
  sickLeaveMaxAccum: number;
  urgentLeaveDays: number;
  specialMarriageDays: number;
  vacationLeaveDays: number;
  vacationAfterYears: number;
  maternityWeeks: number;
  paternityDays: number;
  csgThreshold: number;
  csgEmployeeLow: number;
  csgEmployerLow: number;
  csgEmployeeHigh: number;
  csgEmployerHigh: number;
  nsfEmployee: number;
  nsfEmployer: number;
  nsfCeiling: number;
  hrdcLevy: number;
  prgfRate: number;
  payeExemptMonthly: number;
  overtimeWeekday: number;
  overtimePublicHoliday: number;
  standardHoursWeek: number;
  notes: string;
}

export interface CompanyProfile {
  name: string;
  legalName: string;
  brn: string;
  vatNumber: string;
  tan: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
}

export interface AppData {
  zones: Zone[];
  tables: RestaurantTable[];
  categories: MenuCategory[];
  units: MeasurementUnit[];
  ingredients: Ingredient[];
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  orders: Order[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  purchases: Purchase[];
  expenses: Expense[];
  assets: FixedAsset[];
  employees: Employee[];
  holidays: PublicHoliday[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  payrollRuns: PayrollRun[];
  payrollPolicy: PayrollPolicy;
  company: CompanyProfile;
}

export interface SessionUser {
  email: string;
  name: string;
  role: string;
  employeeId: string | null;
  rememberMe: boolean;
  loggedInAt: string;
}

export type ActionResult =
  | { ok: true; id?: string; warning?: string }
  | { ok: false; error: string };
