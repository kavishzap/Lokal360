import { differenceInCalendarDays, differenceInYears, eachDayOfInterval, format, parseISO } from "date-fns";
import type {
  AttendanceRecord,
  Employee,
  LeaveRequest,
  LeaveType,
  PayrollPolicy,
  Payslip,
  PublicHoliday,
} from "@/types";

export const JOB_TYPES: { value: Employee["jobType"]; label: string }[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "casual", label: "Casual" },
  { value: "atypical", label: "Atypical" },
];

export const ATTENDANCE_STATUSES: { value: AttendanceRecord["status"]; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent (unpaid)" },
  { value: "leave", label: "On leave" },
  { value: "holiday", label: "Public holiday" },
  { value: "off", label: "Rostered off" },
];

export const LEAVE_TYPES: { value: LeaveType; label: string; hint: string }[] = [
  { value: "annual", label: "Annual leave", hint: "WRA s.45 — 20 working days after 12 months, plus 2 extra days" },
  { value: "sick", label: "Sick leave", hint: "WRA s.46 — 15 working days, unused up to 90" },
  { value: "urgent", label: "Urgent leave", hint: "House policy — short paid leave for family emergencies" },
  { value: "special", label: "Special leave", hint: "WRA s.48 — marriage or bereavement" },
  { value: "vacation", label: "Vacation leave", hint: "WRA s.47 — after 5 years' continuous service" },
  { value: "maternity", label: "Maternity leave", hint: "WRA s.52" },
  { value: "paternity", label: "Paternity leave", hint: "WRA s.53" },
  { value: "unpaid", label: "Unpaid leave", hint: "Deducted from the month's pay" },
];

export function defaultPayrollPolicy(): PayrollPolicy {
  return {
    annualLeaveDays: 20,
    extraLeaveDays: 2,
    sickLeaveDays: 15,
    sickLeaveMaxAccum: 90,
    urgentLeaveDays: 3,
    specialMarriageDays: 6,
    vacationLeaveDays: 30,
    vacationAfterYears: 5,
    maternityWeeks: 14,
    paternityDays: 5,
    csgThreshold: 50000,
    csgEmployeeLow: 0.015,
    csgEmployerLow: 0.03,
    csgEmployeeHigh: 0.03,
    csgEmployerHigh: 0.06,
    nsfEmployee: 0.01,
    nsfEmployer: 0.025,
    nsfCeiling: 29710,
    hrdcLevy: 0.015,
    prgfRate: 0.045,
    payeExemptMonthly: 38462,
    overtimeWeekday: 1.5,
    overtimePublicHoliday: 2,
    standardHoursWeek: 45,
    notes:
      "Rates follow MRA CSG, NSF, HRDC and PRGF guidance and the Workers' Rights Act 2019. PAYE is the cumulative July–June method: 0% then 10% then 20%, and 35% above Rs 12 million from July 2026, rounded down to the rupee. No PAYE when the month's emoluments do not exceed Rs 38,462. Confirm the return in MRA e-services before you submit it.",
  };
}

export const MU_HOLIDAYS_2026: { date: string; name: string }[] = [
  { date: "2026-01-01", name: "New Year" },
  { date: "2026-01-02", name: "New Year" },
  { date: "2026-02-01", name: "Abolition of Slavery / Thaipoosam Cavadee" },
  { date: "2026-02-15", name: "Maha Shivaratree" },
  { date: "2026-02-17", name: "Chinese Spring Festival" },
  { date: "2026-03-12", name: "Independence and Republic Day" },
  { date: "2026-03-19", name: "Ugaadi" },
  { date: "2026-03-21", name: "Eid-Ul-Fitr" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-08-15", name: "Assumption" },
  { date: "2026-09-15", name: "Ganesh Chaturthi" },
  { date: "2026-11-02", name: "Arrival of Indentured Labourers" },
  { date: "2026-11-08", name: "Divali" },
  { date: "2026-12-25", name: "Christmas" },
];

export function employeeName(employee: Pick<Employee, "firstName" | "lastName">) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function hourlyRate(employee: Pick<Employee, "basicSalary" | "hoursPerWeek">) {
  const monthlyHours = (employee.hoursPerWeek * 52) / 12;
  if (monthlyHours <= 0) return 0;
  return Number((employee.basicSalary / monthlyHours).toFixed(4));
}

export function csgRates(basic: number, policy: PayrollPolicy) {
  const high = basic > policy.csgThreshold;
  return {
    employee: high ? policy.csgEmployeeHigh : policy.csgEmployeeLow,
    employer: high ? policy.csgEmployerHigh : policy.csgEmployerLow,
  };
}

export function nsfBase(basic: number, policy: PayrollPolicy) {
  return Math.min(Math.max(basic, 0), policy.nsfCeiling);
}

/** Cumulative 0% band and month-count from the MRA PAYE table (income year July–June). December includes the end-of-year bonus slot. */
const PAYE_MONTH: Record<number, { zero: number; slices: number }> = {
  7: { zero: 38462, slices: 1 },
  8: { zero: 76924, slices: 2 },
  9: { zero: 115386, slices: 3 },
  10: { zero: 153848, slices: 4 },
  11: { zero: 192310, slices: 5 },
  12: { zero: 269234, slices: 7 },
  1: { zero: 307696, slices: 8 },
  2: { zero: 346158, slices: 9 },
  3: { zero: 384620, slices: 10 },
  4: { zero: 423082, slices: 11 },
  5: { zero: 461544, slices: 12 },
  6: { zero: 500000, slices: 13 },
};

export function incomeYearPeriods(period: string) {
  const [year, month] = period.split("-").map(Number);
  const startYear = month >= 7 ? year : year - 1;
  const periods: string[] = [];
  let cursorYear = startYear;
  let cursorMonth = 7;
  for (let guard = 0; guard < 18; guard += 1) {
    const key = `${cursorYear}-${String(cursorMonth).padStart(2, "0")}`;
    periods.push(key);
    if (key === period) break;
    cursorMonth += 1;
    if (cursorMonth === 13) {
      cursorMonth = 1;
      cursorYear += 1;
    }
  }
  return periods;
}

export function incomeYearLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = month >= 7 ? year : year - 1;
  return `${start}/${String(start + 1).slice(2)}`;
}

function taxOnChargeable(chargeable: number, zeroBand: number, topRate: number) {
  const tenBand = zeroBand;
  if (chargeable <= zeroBand) return 0;
  if (chargeable <= zeroBand + tenBand) return (chargeable - zeroBand) * 0.1;
  const above = chargeable - zeroBand - tenBand;
  if (topRate <= 0.2) return zeroBand * 0.1 + above * 0.2;
  const cap = 12_000_000 * (zeroBand / 500_000);
  if (chargeable <= cap) return zeroBand * 0.1 + above * 0.2;
  const taxableAtTwenty = cap - zeroBand - tenBand;
  return zeroBand * 0.1 + taxableAtTwenty * 0.2 + (chargeable - cap) * topRate;
}

export function payeForMonth(input: {
  employee: Pick<Employee, "id" | "basicSalary" | "startDate" | "edfReliefAnnual">;
  period: string;
  gross: number;
  prior: Pick<Payslip, "employeeId" | "period" | "gross" | "paye">[];
  exemptMonthly: number;
}) {
  if (input.gross <= input.exemptMonthly) return 0;
  const startMonth = input.employee.startDate.slice(0, 7);
  let cumulativeGross = 0;
  let cumulativePaye = 0;
  for (const key of incomeYearPeriods(input.period)) {
    if (key < startMonth) continue;
    const monthNumber = Number(key.slice(5, 7));
    const band = PAYE_MONTH[monthNumber];
    if (!band) continue;
    const isCurrent = key === input.period;
    const slip = isCurrent
      ? undefined
      : input.prior.find((row) => row.employeeId === input.employee.id && row.period === key);
    const monthGross = isCurrent ? input.gross : (slip?.gross ?? input.employee.basicSalary);
    cumulativeGross += monthGross;
    if (!isCurrent && slip) {
      cumulativePaye += slip.paye;
      continue;
    }
    if (monthGross <= input.exemptMonthly) continue;
    const relief = (input.employee.edfReliefAnnual / 13) * band.slices;
    const chargeable = Math.max(0, cumulativeGross - relief);
    const topRate = key >= "2026-07" ? 0.35 : 0.2;
    const tax = taxOnChargeable(chargeable, band.zero, topRate);
    const fairShare = monthGross > 923_077 ? (monthGross - 923_077) * 0.15 : 0;
    const withheld = Math.max(0, Math.floor(tax - cumulativePaye + fairShare));
    cumulativePaye += withheld;
    if (isCurrent) return withheld;
  }
  return 0;
}

export function leaveDaysInRange(from: string, to: string) {
  try {
    const start = parseISO(`${from}T12:00:00`);
    const end = parseISO(`${to}T12:00:00`);
    return Math.max(1, differenceInCalendarDays(end, start) + 1);
  } catch {
    return 1;
  }
}

export function leaveEntitlement(employee: Employee, type: LeaveType, policy: PayrollPolicy) {
  const years = Math.max(0, differenceInYears(new Date(), parseISO(`${employee.startDate}T12:00:00`)));
  const partTime = employee.jobType === "part_time" ? employee.hoursPerWeek / policy.standardHoursWeek : 1;
  const scale = (days: number) => Number((days * partTime).toFixed(1));
  switch (type) {
    case "annual":
      return years >= 1 ? scale(policy.annualLeaveDays + policy.extraLeaveDays) : scale(Math.min(6, years * 12));
    case "sick":
      return years >= 1 ? scale(policy.sickLeaveDays) : 0;
    case "urgent":
      return scale(policy.urgentLeaveDays);
    case "special":
      return scale(policy.specialMarriageDays);
    case "vacation":
      return years >= policy.vacationAfterYears ? scale(policy.vacationLeaveDays) : 0;
    case "maternity":
      return employee.gender === "female" ? policy.maternityWeeks * 7 : 0;
    case "paternity":
      return employee.gender === "male" ? policy.paternityDays : 0;
    default:
      return 0;
  }
}

export function leaveTaken(
  employeeId: string,
  type: LeaveType,
  requests: LeaveRequest[],
  year = new Date().getFullYear()
) {
  return requests
    .filter(
      (request) =>
        request.employeeId === employeeId &&
        request.type === type &&
        request.status === "approved" &&
        request.from.startsWith(String(year))
    )
    .reduce((sum, request) => sum + request.days, 0);
}

export function periodBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  const from = `${period}-01`;
  const last = new Date(year, month, 0).getDate();
  const to = `${period}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export function monthDays(period: string) {
  const { from, to } = periodBounds(period);
  return eachDayOfInterval({
    start: parseISO(`${from}T12:00:00`),
    end: parseISO(`${to}T12:00:00`),
  }).map((day) => format(day, "yyyy-MM-dd"));
}

export function isWorkingDay(date: string, workDaysPerWeek: 5 | 6, holidays: PublicHoliday[]) {
  const day = parseISO(`${date}T12:00:00`).getDay();
  if (holidays.some((holiday) => holiday.date === date)) return false;
  if (day === 0) return false;
  if (workDaysPerWeek === 5 && day === 6) return false;
  return true;
}

export function buildPayslip(input: {
  employee: Employee;
  period: string;
  attendance: AttendanceRecord[];
  leave: LeaveRequest[];
  holidays: PublicHoliday[];
  policy: PayrollPolicy;
  number: string;
  priorPayslips?: Pick<Payslip, "employeeId" | "period" | "gross" | "paye">[];
}): Omit<Payslip, "id" | "createdAt"> {
  const { employee, period, attendance, leave, holidays, policy, number } = input;
  const { from, to } = periodBounds(period);
  const days = monthDays(period);
  const monthAttendance = attendance.filter(
    (row) => row.employeeId === employee.id && row.date >= from && row.date <= to
  );
  const approvedUnpaid = leave.filter(
    (row) =>
      row.employeeId === employee.id &&
      row.status === "approved" &&
      row.type === "unpaid" &&
      row.from <= to &&
      row.to >= from
  );
  const unpaidFromLeave = approvedUnpaid.reduce((sum, row) => sum + row.days, 0);
  const daysPresent = monthAttendance.filter((row) => row.status === "present").length;
  const daysLeave = monthAttendance.filter((row) => row.status === "leave").length;
  const daysUnpaid =
    unpaidFromLeave + monthAttendance.filter((row) => row.status === "absent").length;
  const overtimeHours = monthAttendance.reduce((sum, row) => sum + row.overtimeHours, 0);
  const publicHolidayHours = monthAttendance.reduce((sum, row) => sum + row.publicHolidayHours, 0);
  const scheduled = days.filter((date) => isWorkingDay(date, employee.workDaysPerWeek, holidays)).length;
  const daily = scheduled > 0 ? employee.basicSalary / scheduled : 0;
  const rate = hourlyRate(employee);
  const overtimePay = Number((overtimeHours * rate * policy.overtimeWeekday).toFixed(2));
  const publicHolidayPay = Number((publicHolidayHours * rate * policy.overtimePublicHoliday).toFixed(2));
  const unpaidDeduction = Number((daysUnpaid * daily).toFixed(2));
  const basic = employee.basicSalary;
  const gross = Number((basic + overtimePay + publicHolidayPay - unpaidDeduction).toFixed(2));
  const csg = csgRates(basic, policy);
  const nsf = nsfBase(basic, policy);
  const csgEmployee = Number((basic * csg.employee).toFixed(2));
  const nsfEmployee = Number((nsf * policy.nsfEmployee).toFixed(2));
  const paye = payeForMonth({
    employee,
    period,
    gross,
    prior: input.priorPayslips ?? [],
    exemptMonthly: policy.payeExemptMonthly,
  });
  const net = Number((gross - csgEmployee - nsfEmployee - paye).toFixed(2));
  return {
    number,
    employeeId: employee.id,
    period,
    basic,
    overtimePay,
    publicHolidayPay,
    unpaidDeduction,
    gross,
    csgEmployee,
    nsfEmployee,
    paye,
    otherDeductions: 0,
    net,
    csgEmployer: Number((basic * csg.employer).toFixed(2)),
    nsfEmployer: Number((nsf * policy.nsfEmployer).toFixed(2)),
    hrdcLevy: Number((basic * policy.hrdcLevy).toFixed(2)),
    prgf: employee.prgfEligible ? Number(((basic + overtimePay) * policy.prgfRate).toFixed(2)) : 0,
    daysPresent,
    daysLeave,
    daysUnpaid,
    overtimeHours,
    status: "final",
  };
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function payrollTotals(slips: Payslip[]) {
  const sum = (pick: (slip: Payslip) => number) => roundMoney(slips.reduce((total, slip) => total + pick(slip), 0));
  const paye = sum((slip) => slip.paye);
  const csgEmployee = sum((slip) => slip.csgEmployee);
  const csgEmployer = sum((slip) => slip.csgEmployer);
  const nsfEmployee = sum((slip) => slip.nsfEmployee);
  const nsfEmployer = sum((slip) => slip.nsfEmployer);
  const hrdc = sum((slip) => slip.hrdcLevy);
  const prgf = sum((slip) => slip.prgf);
  const net = sum((slip) => slip.net);
  const gross = sum((slip) => slip.gross);
  const wagesExpense = roundMoney(net + paye + csgEmployee + nsfEmployee);
  return {
    gross,
    paye,
    csgEmployee,
    csgEmployer,
    nsfEmployee,
    nsfEmployer,
    hrdc,
    prgf,
    net,
    wagesExpense,
    csgPayable: roundMoney(csgEmployee + csgEmployer),
    nsfPayable: roundMoney(nsfEmployee + nsfEmployer),
    remittance: roundMoney(paye + csgEmployee + csgEmployer + nsfEmployee + nsfEmployer + hrdc + prgf),
    employerCost: roundMoney(wagesExpense + csgEmployer + nsfEmployer + hrdc + prgf),
  };
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvRow(cells: (string | number)[]) {
  return cells.map(csvCell).join(",");
}

export function salaryPaymentCsv(input: {
  employer: string;
  tan: string;
  period: string;
  reference: string;
  rows: { number: string; name: string; bank: string; bankCode: string; account: string; amount: number }[];
}) {
  const lines = [
    csvRow(["Employer", input.employer]),
    csvRow(["TAN", input.tan]),
    csvRow(["Period", input.period]),
    csvRow(["Reference", input.reference]),
    csvRow(["Employee number", "Name", "Bank", "Bank code", "Account number", "Currency", "Amount", "Narration"]),
    ...input.rows.map((row) =>
      csvRow([
        row.number,
        row.name,
        row.bank,
        row.bankCode,
        row.account,
        "MUR",
        row.amount.toFixed(2),
        `Salary ${input.period}`,
      ])
    ),
  ];
  return lines.join("\n");
}

export function mraReturnCsv(input: {
  legalName: string;
  tan: string;
  brn: string;
  period: string;
  rows: {
    nid: string;
    surname: string;
    otherNames: string;
    emoluments: number;
    paye: number;
    csgEmployee: number;
    csgEmployer: number;
    nsfEmployee: number;
    nsfEmployer: number;
    hrdc: number;
    prgf: number;
  }[];
}) {
  const totals = input.rows.reduce(
    (sum, row) => ({
      emoluments: sum.emoluments + row.emoluments,
      paye: sum.paye + row.paye,
      csgEmployee: sum.csgEmployee + row.csgEmployee,
      csgEmployer: sum.csgEmployer + row.csgEmployer,
      nsfEmployee: sum.nsfEmployee + row.nsfEmployee,
      nsfEmployer: sum.nsfEmployer + row.nsfEmployer,
      hrdc: sum.hrdc + row.hrdc,
      prgf: sum.prgf + row.prgf,
    }),
    {
      emoluments: 0,
      paye: 0,
      csgEmployee: 0,
      csgEmployer: 0,
      nsfEmployee: 0,
      nsfEmployer: 0,
      hrdc: 0,
      prgf: 0,
    }
  );
  const lines = [
    csvRow(["Monthly return prepared for MRA e-services. This file is not submitted automatically."]),
    csvRow(["Employer", input.legalName]),
    csvRow(["TAN", input.tan]),
    csvRow(["BRN", input.brn]),
    csvRow(["Period", input.period]),
    csvRow(["Income year", incomeYearLabel(input.period)]),
    csvRow([
      "NID",
      "Surname",
      "Other names",
      "Emoluments",
      "PAYE",
      "CSG employee",
      "CSG employer",
      "NSF employee",
      "NSF employer",
      "HRDC",
      "PRGF",
    ]),
    ...input.rows.map((row) =>
      csvRow([
        row.nid,
        row.surname,
        row.otherNames,
        row.emoluments.toFixed(2),
        row.paye.toFixed(2),
        row.csgEmployee.toFixed(2),
        row.csgEmployer.toFixed(2),
        row.nsfEmployee.toFixed(2),
        row.nsfEmployer.toFixed(2),
        row.hrdc.toFixed(2),
        row.prgf.toFixed(2),
      ])
    ),
    csvRow([
      "",
      "Total",
      String(input.rows.length),
      roundMoney(totals.emoluments).toFixed(2),
      roundMoney(totals.paye).toFixed(2),
      roundMoney(totals.csgEmployee).toFixed(2),
      roundMoney(totals.csgEmployer).toFixed(2),
      roundMoney(totals.nsfEmployee).toFixed(2),
      roundMoney(totals.nsfEmployer).toFixed(2),
      roundMoney(totals.hrdc).toFixed(2),
      roundMoney(totals.prgf).toFixed(2),
    ]),
  ];
  return lines.join("\n");
}
