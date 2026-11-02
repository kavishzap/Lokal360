import { toast } from "sonner";
import { ensureSystemAccounts } from "@/data/seed";
import { defaultCompany } from "@/lib/company";
import { type DataSlice } from "@/lib/data-slices";
import { defaultPayrollPolicy } from "@/lib/payroll";
import { getSupabase } from "@/lib/supabase/client";
import type {
  Account,
  AppData,
  AssetCategory,
  AssetFunding,
  AttendanceRecord,
  Employee,
  Expense,
  FixedAsset,
  InventoryItem,
  InventoryTransaction,
  JournalEntry,
  JournalSource,
  LeaveRequest,
  MenuItem,
  Order,
  OrderStatus,
  PayrollRun,
  Purchase,
  PurchasePayment,
} from "@/types";

type Row = Record<string, unknown>;

let ready = false;
let actor: "administrator" | "staff" = "administrator";
let actorEmployeeId: string | null = null;
let sessionNoted = false;
const loaded = new Set<DataSlice>();
const baseline = new Map<DataSlice, string>();
const inflight = new Map<DataSlice, Promise<Partial<AppData>>>();
let queuedSave: AppData | null = null;
let saving = false;

export function noteActor(role: string, employeeId: string | null) {
  actor = role === "staff" ? "staff" : "administrator";
  actorEmployeeId = employeeId;
  sessionNoted = true;
  ready = true;
}

export function noteSignedOut() {
  actor = "administrator";
  actorEmployeeId = null;
  sessionNoted = true;
  ready = false;
  loaded.clear();
  baseline.clear();
  inflight.clear();
  queuedSave = null;
}

export function isRemoteSignedIn() {
  return sessionNoted && ready;
}

export function loadedSliceNames() {
  return [...loaded];
}

function num(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function time(value: unknown) {
  const raw = text(value);
  return raw ? raw.slice(0, 5) : "";
}

function nullableDate(value: unknown) {
  const raw = text(value);
  return raw || null;
}

async function rows(table: string, filters?: Record<string, string>) {
  let query = getSupabase().from(table).select("*");
  if (filters) {
    for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  }
  const { data, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

let activeDirty: Set<DataSlice> | null = null;

function sliceForTable(table: string): DataSlice | null {
  const map: Record<string, DataSlice> = {
    company: "company",
    payroll_policy: "policy",
    public_holidays: "holidays",
    zones: "zones",
    restaurant_tables: "tables",
    menu_categories: "categories",
    measurement_units: "units",
    ingredients: "ingredients",
    menu_items: "menu",
    menu_item_ingredients: "menu",
    inventory_items: "inventory",
    inventory_transactions: "movements",
    orders: "orders",
    order_items: "orders",
    accounts: "accounts",
    journal_entries: "journals",
    journal_lines: "journals",
    purchases: "purchases",
    purchase_lines: "purchases",
    expenses: "expenses",
    expense_lines: "expenses",
    fixed_assets: "assets",
    employees: "employees",
    leave_requests: "leave",
    attendance_records: "attendance",
    payslips: "payslips",
    payroll_runs: "runs",
  };
  return map[table] ?? null;
}

function sliceValue(slice: DataSlice, data: Partial<AppData>) {
  switch (slice) {
    case "company":
      return data.company ?? null;
    case "policy":
      return data.payrollPolicy ?? null;
    case "holidays":
      return data.holidays ?? [];
    case "zones":
      return data.zones ?? [];
    case "tables":
      return data.tables ?? [];
    case "categories":
      return data.categories ?? [];
    case "units":
      return data.units ?? [];
    case "ingredients":
      return data.ingredients ?? [];
    case "menu":
      return data.menuItems ?? [];
    case "inventory":
      return data.inventory ?? [];
    case "movements":
      return data.transactions ?? [];
    case "orders":
      return data.orders ?? [];
    case "accounts":
      return data.accounts ?? [];
    case "journals":
      return data.journalEntries ?? [];
    case "purchases":
      return data.purchases ?? [];
    case "expenses":
      return data.expenses ?? [];
    case "assets":
      return data.assets ?? [];
    case "employees":
      return data.employees ?? [];
    case "leave":
      return data.leaveRequests ?? [];
    case "attendance":
      return data.attendance ?? [];
    case "payslips":
      return data.payslips ?? [];
    case "runs":
      return data.payrollRuns ?? [];
  }
}

function fingerprint(slice: DataSlice, data: Partial<AppData>) {
  return JSON.stringify(sliceValue(slice, data));
}

function ownFilter(column: string) {
  if (actor !== "staff") return undefined;
  return { [column]: actorEmployeeId ?? "00000000-0000-0000-0000-000000000000" };
}

async function upsert(table: string, records: Row[], onConflict = "id") {
  const slice = sliceForTable(table);
  if (activeDirty && slice && !activeDirty.has(slice)) return;
  if (records.length === 0) return;
  for (let index = 0; index < records.length; index += 200) {
    const { error } = await getSupabase().from(table).upsert(records.slice(index, index + 200), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function retain(table: string, ids: string[]) {
  const slice = sliceForTable(table);
  if (activeDirty && slice && !activeDirty.has(slice)) return;
  const query = getSupabase().from(table).delete();
  const { error } =
    ids.length === 0 ? await query.not("id", "is", null) : await query.not("id", "in", `(${ids.join(",")})`);
  if (error) throw new Error(`${table}: ${error.message}`);
}

function companyFrom(row: Row | undefined): AppData["company"] {
  if (!row) return defaultCompany();
  return {
    name: text(row.name),
    legalName: text(row.legal_name),
    brn: text(row.brn),
    vatNumber: text(row.vat_number),
    tan: text(row.tan),
    address: text(row.address),
    city: text(row.city),
    phone: text(row.phone),
    email: text(row.email),
    website: text(row.website),
    logo: text(row.logo) || null,
  };
}

function policyFrom(row: Row | undefined): AppData["payrollPolicy"] {
  const base = defaultPayrollPolicy();
  if (!row) return base;
  return {
    annualLeaveDays: num(row.annual_leave_days),
    extraLeaveDays: num(row.extra_leave_days),
    sickLeaveDays: num(row.sick_leave_days),
    sickLeaveMaxAccum: num(row.sick_leave_max_accum),
    urgentLeaveDays: num(row.urgent_leave_days),
    specialMarriageDays: num(row.special_marriage_days),
    vacationLeaveDays: num(row.vacation_leave_days),
    vacationAfterYears: num(row.vacation_after_years),
    maternityWeeks: num(row.maternity_weeks),
    paternityDays: num(row.paternity_days),
    csgThreshold: num(row.csg_threshold),
    csgEmployeeLow: num(row.csg_employee_low),
    csgEmployerLow: num(row.csg_employer_low),
    csgEmployeeHigh: num(row.csg_employee_high),
    csgEmployerHigh: num(row.csg_employer_high),
    nsfEmployee: num(row.nsf_employee),
    nsfEmployer: num(row.nsf_employer),
    nsfCeiling: num(row.nsf_ceiling),
    hrdcLevy: num(row.hrdc_levy),
    prgfRate: num(row.prgf_rate),
    payeExemptMonthly: num(row.paye_exempt_monthly),
    overtimeWeekday: num(row.overtime_weekday),
    overtimePublicHoliday: num(row.overtime_public_holiday),
    standardHoursWeek: num(row.standard_hours_week),
    notes: text(row.notes),
  };
}

export async function loadSlices(names: DataSlice[]): Promise<Partial<AppData>> {
  const missing = [...new Set(names)].filter((name) => !loaded.has(name));
  if (missing.length === 0) return {};
  const parts = await Promise.all(
    missing.map((name) => {
      const existing = inflight.get(name);
      if (existing) return existing;
      const job = fetchSlice(name)
        .then((part) => {
          loaded.add(name);
          baseline.set(name, fingerprint(name, part));
          return part;
        })
        .finally(() => {
          if (inflight.get(name) === job) inflight.delete(name);
        });
      inflight.set(name, job);
      return job;
    })
  );
  return Object.assign({}, ...parts);
}

async function fetchSlice(slice: DataSlice): Promise<Partial<AppData>> {
  switch (slice) {
    case "company":
      return { company: companyFrom((await rows("company"))[0]) };
    case "policy":
      return { payrollPolicy: policyFrom((await rows("payroll_policy"))[0]) };
    case "holidays":
      return {
        holidays: (await rows("public_holidays")).map((row) => ({
          id: text(row.id),
          date: text(row.holiday_date),
          name: text(row.name),
        })),
      };
    case "zones":
      return {
        zones: (await rows("zones")).map((row) => ({
          id: text(row.id),
          name: text(row.name),
          description: text(row.description),
          isActive: Boolean(row.is_active),
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    case "tables":
      return {
        tables: (await rows("restaurant_tables")).map((row) => ({
          id: text(row.id),
          name: text(row.name),
          zoneId: text(row.zone_id),
          capacity: num(row.capacity),
          isActive: Boolean(row.is_active),
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    case "categories":
      return {
        categories: (await rows("menu_categories")).map((row) => ({
          id: text(row.id),
          name: text(row.name),
          description: text(row.description),
          image: text(row.image) || null,
          displayOrder: num(row.display_order),
          isActive: Boolean(row.is_active),
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    case "units":
      return {
        units: (await rows("measurement_units")).map((row) => ({
          id: text(row.id),
          name: text(row.name),
          abbreviation: text(row.abbreviation),
          isActive: Boolean(row.is_active),
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    case "ingredients":
      return {
        ingredients: (await rows("ingredients")).map((row) => ({
          id: text(row.id),
          name: text(row.name),
          description: text(row.description),
          unitId: text(row.unit_id),
          isActive: Boolean(row.is_active),
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    case "menu": {
      const [itemRows, recipeRows] = await Promise.all([rows("menu_items"), rows("menu_item_ingredients")]);
      const recipes = new Map<string, MenuItem["ingredients"]>();
      for (const row of recipeRows) {
        const itemId = text(row.menu_item_id);
        const list = recipes.get(itemId) ?? [];
        list.push({ ingredientId: text(row.ingredient_id), quantity: num(row.quantity) });
        recipes.set(itemId, list);
      }
      return {
        menuItems: itemRows.map((row) => ({
          id: text(row.id),
          name: text(row.name),
          description: text(row.description),
          categoryId: text(row.category_id),
          price: num(row.price),
          image: text(row.image) || null,
          preparationTime: row.preparation_time == null ? null : num(row.preparation_time),
          isAvailable: Boolean(row.is_available),
          isFeatured: Boolean(row.is_featured),
          ingredients: recipes.get(text(row.id)) ?? [],
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    }
    case "inventory":
      return {
        inventory: (await rows("inventory_items")).map(
          (row): InventoryItem => ({
            id: text(row.id),
            ingredientId: text(row.ingredient_id),
            currentStock: num(row.current_stock),
            minimumStock: num(row.minimum_stock),
            costPerUnit: num(row.cost_per_unit),
            lastUpdated: text(row.last_updated),
          })
        ),
      };
    case "movements":
      return {
        transactions: (await rows("inventory_transactions")).map(
          (row): InventoryTransaction => ({
            id: text(row.id),
            inventoryItemId: text(row.inventory_item_id),
            type: text(row.type) as InventoryTransaction["type"],
            quantityChange: num(row.quantity_change),
            previousStock: num(row.previous_stock),
            newStock: num(row.new_stock),
            reason: text(row.reason),
            createdAt: text(row.created_at),
          })
        ),
      };
    case "orders": {
      const [orderRows, orderItemRows] = await Promise.all([rows("orders"), rows("order_items")]);
      const orderItems = new Map<string, Order["items"]>();
      for (const row of orderItemRows) {
        const orderId = text(row.order_id);
        const list = orderItems.get(orderId) ?? [];
        list.push({
          id: text(row.id),
          menuItemId: text(row.menu_item_id),
          categoryId: text(row.category_id),
          name: text(row.name),
          quantity: num(row.quantity),
          unitPrice: num(row.unit_price),
        });
        orderItems.set(orderId, list);
      }
      return {
        orders: orderRows.map((row) => ({
          id: text(row.id),
          orderNumber: text(row.order_number),
          tableId: text(row.table_id),
          zoneId: text(row.zone_id),
          status: text(row.status) as OrderStatus,
          notes: text(row.notes),
          items: orderItems.get(text(row.id)) ?? [],
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    }
    case "accounts":
      return {
        accounts: ensureSystemAccounts(
          (await rows("accounts")).map(
            (row): Account => ({
              id: text(row.id),
              code: text(row.code),
              name: text(row.name),
              type: text(row.type) as Account["type"],
              isCash: Boolean(row.is_cash),
              isSystem: Boolean(row.is_system),
              isActive: Boolean(row.is_active),
              createdAt: text(row.created_at),
              updatedAt: text(row.updated_at),
            })
          )
        ),
      };
    case "journals": {
      const [journalRows, journalLineRows] = await Promise.all([rows("journal_entries"), rows("journal_lines")]);
      const linesByJournal = new Map<string, JournalEntry["lines"]>();
      for (const row of journalLineRows) {
        const entryId = text(row.journal_entry_id);
        const list = linesByJournal.get(entryId) ?? [];
        list.push({
          id: text(row.id),
          accountId: text(row.account_id),
          description: text(row.description),
          debit: num(row.debit),
          credit: num(row.credit),
        });
        linesByJournal.set(entryId, list);
      }
      return {
        journalEntries: journalRows.map((row) => ({
          id: text(row.id),
          number: text(row.number),
          date: text(row.entry_date),
          description: text(row.description),
          source: text(row.source) as JournalSource,
          sourceId: text(row.source_id) || null,
          lines: linesByJournal.get(text(row.id)) ?? [],
          createdAt: text(row.created_at),
        })),
      };
    }
    case "purchases": {
      const [purchaseRows, purchaseLineRows] = await Promise.all([rows("purchases"), rows("purchase_lines")]);
      const purchaseLines = new Map<string, Purchase["lines"]>();
      for (const row of purchaseLineRows) {
        const purchaseId = text(row.purchase_id);
        const list = purchaseLines.get(purchaseId) ?? [];
        list.push({
          id: text(row.id),
          description: text(row.description),
          ingredientId: text(row.ingredient_id) || null,
          quantity: num(row.quantity),
          unitCost: num(row.unit_cost),
          postedToInventory: Boolean(row.posted_to_inventory),
        });
        purchaseLines.set(purchaseId, list);
      }
      return {
        purchases: purchaseRows.map((row) => ({
          id: text(row.id),
          number: text(row.number),
          supplier: text(row.supplier),
          invoiceNumber: text(row.invoice_number),
          date: text(row.purchase_date),
          payment: text(row.payment) as PurchasePayment,
          notes: text(row.notes),
          lines: purchaseLines.get(text(row.id)) ?? [],
          journalEntryId: text(row.journal_entry_id) || null,
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    }
    case "expenses": {
      const [expenseRows, expenseLineRows] = await Promise.all([rows("expenses"), rows("expense_lines")]);
      const expenseLines = new Map<string, Expense["lines"]>();
      for (const row of expenseLineRows) {
        const expenseId = text(row.expense_id);
        const list = expenseLines.get(expenseId) ?? [];
        list.push({
          id: text(row.id),
          description: text(row.description),
          accountId: text(row.account_id),
          amount: num(row.amount),
        });
        expenseLines.set(expenseId, list);
      }
      return {
        expenses: expenseRows.map((row) => ({
          id: text(row.id),
          number: text(row.number),
          payee: text(row.payee),
          reference: text(row.reference),
          date: text(row.expense_date),
          payment: text(row.payment) as PurchasePayment,
          notes: text(row.notes),
          lines: expenseLines.get(text(row.id)) ?? [],
          journalEntryId: text(row.journal_entry_id) || null,
          createdAt: text(row.created_at),
          updatedAt: text(row.updated_at),
        })),
      };
    }
    case "assets":
      return {
        assets: (await rows("fixed_assets")).map(
          (row): FixedAsset => ({
            id: text(row.id),
            number: text(row.number),
            name: text(row.name),
            category: text(row.category) as AssetCategory,
            acquiredOn: text(row.acquired_on),
            cost: num(row.cost),
            funding: text(row.funding) as AssetFunding,
            depreciates: Boolean(row.depreciates),
            usefulLifeMonths: num(row.useful_life_months),
            residualValue: num(row.residual_value),
            accumulatedDepreciation: num(row.accumulated_depreciation),
            lastDepreciationDate: nullableDate(row.last_depreciation_date),
            notes: text(row.notes),
            journalEntryId: text(row.journal_entry_id) || null,
            createdAt: text(row.created_at),
            updatedAt: text(row.updated_at),
          })
        ),
      };
    case "employees":
      return { employees: (await rows("employees", ownFilter("id"))).map(employeeFrom) };
    case "leave":
      return { leaveRequests: (await rows("leave_requests", ownFilter("employee_id"))).map(leaveFrom) };
    case "attendance":
      return { attendance: (await rows("attendance_records", ownFilter("employee_id"))).map(attendanceFrom) };
    case "payslips":
      return { payslips: (await rows("payslips", ownFilter("employee_id"))).map(payslipFrom) };
    case "runs":
      return {
        payrollRuns: (await rows("payroll_runs")).map(
          (row): PayrollRun => ({
            id: text(row.id),
            period: text(row.period),
            journalEntryId: text(row.journal_entry_id) || null,
            paymentJournalId: text(row.payment_journal_id) || null,
            remittanceJournalId: text(row.remittance_journal_id) || null,
            paidOn: nullableDate(row.paid_on),
            filedOn: nullableDate(row.filed_on),
            paymentReference: text(row.payment_reference),
            filingReference: text(row.filing_reference),
            createdAt: text(row.created_at),
            updatedAt: text(row.updated_at),
          })
        ),
      };
  }
}

function employeeFrom(row: Row): Employee {
  return {
    id: text(row.id),
    employeeNumber: text(row.employee_number),
    firstName: text(row.first_name),
    lastName: text(row.last_name),
    nid: text(row.nid),
    gender: text(row.gender) as Employee["gender"],
    dateOfBirth: text(row.date_of_birth),
    nationality: text(row.nationality),
    address: text(row.address),
    phone: text(row.phone),
    email: text(row.email),
    maritalStatus: text(row.marital_status) as Employee["maritalStatus"],
    bankName: text(row.bank_name),
    bankCode: text(row.bank_code),
    bankAccount: text(row.bank_account),
    jobTitle: text(row.job_title),
    department: text(row.department),
    jobType: text(row.job_type) as Employee["jobType"],
    startDate: text(row.start_date),
    endDate: nullableDate(row.end_date),
    isActive: Boolean(row.is_active),
    basicSalary: num(row.basic_salary),
    payFrequency: "monthly",
    workDaysPerWeek: num(row.work_days_per_week) === 6 ? 6 : 5,
    hoursPerWeek: num(row.hours_per_week),
    edfReliefAnnual: num(row.edf_relief_annual),
    prgfEligible: Boolean(row.prgf_eligible),
    notes: text(row.notes),
    portalPassword: "",
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function leaveFrom(row: Row): LeaveRequest {
  return {
    id: text(row.id),
    employeeId: text(row.employee_id),
    type: text(row.type) as LeaveRequest["type"],
    from: text(row.starts_on),
    to: text(row.ends_on),
    days: num(row.days),
    reason: text(row.reason),
    status: text(row.status) as LeaveRequest["status"],
    createdAt: text(row.created_at),
  };
}

function attendanceFrom(row: Row): AttendanceRecord {
  return {
    id: text(row.id),
    employeeId: text(row.employee_id),
    date: text(row.work_date),
    status: text(row.status) as AttendanceRecord["status"],
    clockIn: time(row.clock_in),
    clockOut: time(row.clock_out),
    hoursWorked: num(row.hours_worked),
    overtimeHours: num(row.overtime_hours),
    publicHolidayHours: num(row.public_holiday_hours),
    notes: text(row.notes),
  };
}

function payslipFrom(row: Row): AppData["payslips"][number] {
  return {
    id: text(row.id),
    number: text(row.number),
    employeeId: text(row.employee_id),
    period: text(row.period),
    basic: num(row.basic),
    overtimePay: num(row.overtime_pay),
    publicHolidayPay: num(row.public_holiday_pay),
    unpaidDeduction: num(row.unpaid_deduction),
    gross: num(row.gross),
    csgEmployee: num(row.csg_employee),
    nsfEmployee: num(row.nsf_employee),
    paye: num(row.paye),
    otherDeductions: num(row.other_deductions),
    net: num(row.net),
    csgEmployer: num(row.csg_employer),
    nsfEmployer: num(row.nsf_employer),
    hrdcLevy: num(row.hrdc_levy),
    prgf: num(row.prgf),
    daysPresent: num(row.days_present),
    daysLeave: num(row.days_leave),
    daysUnpaid: num(row.days_unpaid),
    overtimeHours: num(row.overtime_hours),
    status: text(row.status) as AppData["payslips"][number]["status"],
    createdAt: text(row.created_at),
  };
}

async function saveAll(data: AppData) {
  const policy = data.payrollPolicy;
  await upsert("company", [
    {
      id: 1,
      name: data.company.name,
      legal_name: data.company.legalName,
      brn: data.company.brn,
      vat_number: data.company.vatNumber,
      tan: data.company.tan,
      address: data.company.address,
      city: data.company.city,
      phone: data.company.phone,
      email: data.company.email,
      website: data.company.website,
      logo: data.company.logo,
    },
  ]);
  await upsert("payroll_policy", [
    {
      id: 1,
      annual_leave_days: policy.annualLeaveDays,
      extra_leave_days: policy.extraLeaveDays,
      sick_leave_days: policy.sickLeaveDays,
      sick_leave_max_accum: policy.sickLeaveMaxAccum,
      urgent_leave_days: policy.urgentLeaveDays,
      special_marriage_days: policy.specialMarriageDays,
      vacation_leave_days: policy.vacationLeaveDays,
      vacation_after_years: policy.vacationAfterYears,
      maternity_weeks: policy.maternityWeeks,
      paternity_days: policy.paternityDays,
      csg_threshold: policy.csgThreshold,
      csg_employee_low: policy.csgEmployeeLow,
      csg_employer_low: policy.csgEmployerLow,
      csg_employee_high: policy.csgEmployeeHigh,
      csg_employer_high: policy.csgEmployerHigh,
      nsf_employee: policy.nsfEmployee,
      nsf_employer: policy.nsfEmployer,
      nsf_ceiling: policy.nsfCeiling,
      hrdc_levy: policy.hrdcLevy,
      prgf_rate: policy.prgfRate,
      paye_exempt_monthly: policy.payeExemptMonthly,
      overtime_weekday: policy.overtimeWeekday,
      overtime_public_holiday: policy.overtimePublicHoliday,
      standard_hours_week: policy.standardHoursWeek,
      notes: policy.notes,
    },
  ]);
  await upsert(
    "zones",
    data.zones.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "measurement_units",
    data.units.map((row) => ({
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "menu_categories",
    data.categories.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      display_order: row.displayOrder,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "accounts",
    data.accounts.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      is_cash: row.isCash,
      is_system: row.isSystem,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "ingredients",
    data.ingredients.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unit_id: row.unitId,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "menu_items",
    data.menuItems.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category_id: row.categoryId,
      price: row.price,
      image: row.image,
      preparation_time: row.preparationTime,
      is_available: row.isAvailable,
      is_featured: row.isFeatured,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "restaurant_tables",
    data.tables.map((row) => ({
      id: row.id,
      name: row.name,
      zone_id: row.zoneId,
      capacity: row.capacity,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "inventory_items",
    data.inventory.map((row) => ({
      id: row.id,
      ingredient_id: row.ingredientId,
      current_stock: row.currentStock,
      minimum_stock: row.minimumStock,
      cost_per_unit: row.costPerUnit,
      last_updated: row.lastUpdated,
    }))
  );
  await upsert(
    "orders",
    data.orders.map((row) => ({
      id: row.id,
      order_number: row.orderNumber,
      table_id: row.tableId,
      zone_id: row.zoneId,
      status: row.status,
      notes: row.notes,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "journal_entries",
    data.journalEntries.map((row) => ({
      id: row.id,
      number: row.number,
      entry_date: row.date,
      description: row.description,
      source: row.source,
      source_id: row.sourceId,
      created_at: row.createdAt,
    }))
  );
  await upsert(
    "employees",
    data.employees.map((row) => ({
      id: row.id,
      employee_number: row.employeeNumber,
      first_name: row.firstName,
      last_name: row.lastName,
      nid: row.nid,
      gender: row.gender,
      date_of_birth: row.dateOfBirth,
      nationality: row.nationality,
      address: row.address,
      phone: row.phone,
      email: row.email,
      marital_status: row.maritalStatus,
      bank_name: row.bankName,
      bank_code: row.bankCode,
      bank_account: row.bankAccount,
      job_title: row.jobTitle,
      department: row.department,
      job_type: row.jobType,
      start_date: row.startDate,
      end_date: row.endDate,
      is_active: row.isActive,
      basic_salary: row.basicSalary,
      pay_frequency: "monthly",
      work_days_per_week: row.workDaysPerWeek,
      hours_per_week: row.hoursPerWeek,
      edf_relief_annual: row.edfReliefAnnual,
      prgf_eligible: row.prgfEligible,
      notes: row.notes,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "purchases",
    data.purchases.map((row) => ({
      id: row.id,
      number: row.number,
      supplier: row.supplier,
      invoice_number: row.invoiceNumber,
      purchase_date: row.date,
      payment: row.payment,
      notes: row.notes,
      journal_entry_id: row.journalEntryId,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "expenses",
    data.expenses.map((row) => ({
      id: row.id,
      number: row.number,
      payee: row.payee,
      reference: row.reference,
      expense_date: row.date,
      payment: row.payment,
      notes: row.notes,
      journal_entry_id: row.journalEntryId,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "fixed_assets",
    data.assets.map((row) => ({
      id: row.id,
      number: row.number,
      name: row.name,
      category: row.category,
      acquired_on: row.acquiredOn,
      cost: row.cost,
      funding: row.funding,
      depreciates: row.depreciates,
      useful_life_months: row.usefulLifeMonths,
      residual_value: row.residualValue,
      accumulated_depreciation: row.accumulatedDepreciation,
      last_depreciation_date: row.lastDepreciationDate,
      notes: row.notes,
      journal_entry_id: row.journalEntryId,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await upsert(
    "public_holidays",
    data.holidays.map((row) => ({ id: row.id, holiday_date: row.date, name: row.name }))
  );
  await upsert(
    "payroll_runs",
    data.payrollRuns.map((row) => ({
      id: row.id,
      period: row.period,
      journal_entry_id: row.journalEntryId,
      payment_journal_id: row.paymentJournalId,
      remittance_journal_id: row.remittanceJournalId,
      paid_on: row.paidOn,
      filed_on: row.filedOn,
      payment_reference: row.paymentReference,
      filing_reference: row.filingReference,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );

  await upsert(
    "menu_item_ingredients",
    data.menuItems.flatMap((item) =>
      item.ingredients.map((line) => ({
        menu_item_id: item.id,
        ingredient_id: line.ingredientId,
        quantity: line.quantity,
      }))
    ),
    "menu_item_id,ingredient_id"
  );
  await upsert(
    "order_items",
    data.orders.flatMap((order) =>
      order.items.map((line) => ({
        id: line.id,
        order_id: order.id,
        menu_item_id: line.menuItemId,
        category_id: line.categoryId,
        name: line.name,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      }))
    )
  );
  await upsert(
    "journal_lines",
    data.journalEntries.flatMap((entry) =>
      entry.lines.map((line) => ({
        id: line.id,
        journal_entry_id: entry.id,
        account_id: line.accountId,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
      }))
    )
  );
  await upsert(
    "purchase_lines",
    data.purchases.flatMap((purchase) =>
      purchase.lines.map((line) => ({
        id: line.id,
        purchase_id: purchase.id,
        description: line.description,
        ingredient_id: line.ingredientId,
        quantity: line.quantity,
        unit_cost: line.unitCost,
        posted_to_inventory: line.postedToInventory,
      }))
    )
  );
  await upsert(
    "expense_lines",
    data.expenses.flatMap((expense) =>
      expense.lines.map((line) => ({
        id: line.id,
        expense_id: expense.id,
        description: line.description,
        account_id: line.accountId,
        amount: line.amount,
      }))
    )
  );
  await upsert(
    "inventory_transactions",
    data.transactions.map((row) => ({
      id: row.id,
      inventory_item_id: row.inventoryItemId,
      type: row.type,
      quantity_change: row.quantityChange,
      previous_stock: row.previousStock,
      new_stock: row.newStock,
      reason: row.reason,
      created_at: row.createdAt,
    }))
  );
  await upsert(
    "leave_requests",
    data.leaveRequests.map((row) => ({
      id: row.id,
      employee_id: row.employeeId,
      type: row.type,
      starts_on: row.from,
      ends_on: row.to,
      days: row.days,
      reason: row.reason,
      status: row.status,
      created_at: row.createdAt,
    }))
  );
  await upsert(
    "attendance_records",
    data.attendance.map((row) => ({
      id: row.id,
      employee_id: row.employeeId,
      work_date: row.date,
      status: row.status,
      clock_in: row.clockIn || null,
      clock_out: row.clockOut || null,
      hours_worked: row.hoursWorked,
      overtime_hours: row.overtimeHours,
      public_holiday_hours: row.publicHolidayHours,
      notes: row.notes,
    }))
  );
  await upsert(
    "payslips",
    data.payslips.map((row) => ({
      id: row.id,
      number: row.number,
      employee_id: row.employeeId,
      period: row.period,
      basic: row.basic,
      overtime_pay: row.overtimePay,
      public_holiday_pay: row.publicHolidayPay,
      unpaid_deduction: row.unpaidDeduction,
      gross: row.gross,
      csg_employee: row.csgEmployee,
      nsf_employee: row.nsfEmployee,
      paye: row.paye,
      other_deductions: row.otherDeductions,
      net: row.net,
      csg_employer: row.csgEmployer,
      nsf_employer: row.nsfEmployer,
      hrdc_levy: row.hrdcLevy,
      prgf: row.prgf,
      days_present: row.daysPresent,
      days_leave: row.daysLeave,
      days_unpaid: row.daysUnpaid,
      overtime_hours: row.overtimeHours,
      status: row.status,
      created_at: row.createdAt,
    }))
  );

  await retainRecipes(data);
  await retain("order_items", data.orders.flatMap((order) => order.items.map((line) => line.id)));
  await retain("journal_lines", data.journalEntries.flatMap((entry) => entry.lines.map((line) => line.id)));
  await retain("purchase_lines", data.purchases.flatMap((purchase) => purchase.lines.map((line) => line.id)));
  await retain("expense_lines", data.expenses.flatMap((expense) => expense.lines.map((line) => line.id)));
  await retain("inventory_transactions", data.transactions.map((row) => row.id));
  await retain("leave_requests", data.leaveRequests.map((row) => row.id));
  await retain("attendance_records", data.attendance.map((row) => row.id));
  await retain("payslips", data.payslips.map((row) => row.id));
  await retain("orders", data.orders.map((row) => row.id));
  await retain("payroll_runs", data.payrollRuns.map((row) => row.id));
  await retain("purchases", data.purchases.map((row) => row.id));
  await retain("expenses", data.expenses.map((row) => row.id));
  await retain("fixed_assets", data.assets.map((row) => row.id));
  await retain("journal_entries", data.journalEntries.map((row) => row.id));
  await retain("inventory_items", data.inventory.map((row) => row.id));
  await retain("menu_items", data.menuItems.map((row) => row.id));
  await retain("restaurant_tables", data.tables.map((row) => row.id));
  await retain("ingredients", data.ingredients.map((row) => row.id));
  await retain("employees", data.employees.map((row) => row.id));
  await retain("public_holidays", data.holidays.map((row) => row.id));
  await retain("menu_categories", data.categories.map((row) => row.id));
  await retain("measurement_units", data.units.map((row) => row.id));
  await retain("zones", data.zones.map((row) => row.id));
  await retain("accounts", data.accounts.map((row) => row.id));
}

async function retainRecipes(data: AppData) {
  if (activeDirty && !activeDirty.has("menu")) return;
  const kept = new Set(data.menuItems.flatMap((item) => item.ingredients.map((line) => `${item.id}:${line.ingredientId}`)));
  const existing = await rows("menu_item_ingredients");
  const stale = existing.filter((row) => !kept.has(`${text(row.menu_item_id)}:${text(row.ingredient_id)}`));
  for (const row of stale) {
    const { error } = await getSupabase()
      .from("menu_item_ingredients")
      .delete()
      .eq("menu_item_id", text(row.menu_item_id))
      .eq("ingredient_id", text(row.ingredient_id));
    if (error) throw new Error(`menu_item_ingredients: ${error.message}`);
  }
}

async function saveOwnLeave(data: AppData) {
  if (!actorEmployeeId) return;
  const own = data.leaveRequests.filter((row) => row.employeeId === actorEmployeeId);
  await upsert(
    "leave_requests",
    own.map((row) => ({
      id: row.id,
      employee_id: row.employeeId,
      type: row.type,
      starts_on: row.from,
      ends_on: row.to,
      days: row.days,
      reason: row.reason,
      status: row.status,
      created_at: row.createdAt,
    }))
  );
}

function dirtySlices(data: AppData) {
  const dirty = new Set<DataSlice>();
  for (const slice of loaded) {
    if (fingerprint(slice, data) !== baseline.get(slice)) dirty.add(slice);
  }
  return dirty;
}

async function saveDirty(data: AppData) {
  const dirty = dirtySlices(data);
  if (dirty.size === 0) return;
  activeDirty = dirty;
  try {
    if (actor === "staff") {
      if (dirty.has("leave")) await saveOwnLeave(data);
    } else {
      await saveAll(data);
    }
    for (const slice of dirty) baseline.set(slice, fingerprint(slice, data));
  } finally {
    activeDirty = null;
  }
}

export function scheduleRemoteSave(data: AppData) {
  if (!ready) return;
  queuedSave = data;
  if (saving) return;
  saving = true;
  void pumpSaves();
}

async function pumpSaves() {
  try {
    while (queuedSave) {
      const snapshot = queuedSave;
      queuedSave = null;
      try {
        await saveDirty(snapshot);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Could not save to Supabase.");
      }
    }
  } finally {
    saving = false;
    if (queuedSave) {
      saving = true;
      void pumpSaves();
    }
  }
}
