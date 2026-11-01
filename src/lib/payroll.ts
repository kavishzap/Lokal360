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
      "Rates follow MRA CSG/NSF/HRDC guidance and the Workers' Rights Act 2019. PAYE uses a simplified monthly estimate (0% if monthly emoluments do not exceed Rs 38,462; otherwise 10% of chargeable income above the Rs 500,000 annual band, spread over 12 months). Always confirm against the current MRA tables before filing.",
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

export function estimatePaye(monthlyEmoluments: number, reliefAnnual: number, policy: PayrollPolicy) {
  if (monthlyEmoluments <= policy.payeExemptMonthly) return 0;
  const annual = monthlyEmoluments * 12;
  const chargeable = Math.max(0, annual - 500000 - reliefAnnual);
  let tax = 0;
  if (chargeable <= 500000) tax = chargeable * 0.1;
  else tax = 500000 * 0.1 + (chargeable - 500000) * 0.2;
  return Math.floor(tax / 12);
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
  const paye = estimatePaye(gross, employee.edfReliefAnnual, policy);
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
