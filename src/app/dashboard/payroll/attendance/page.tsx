"use client";

import { useMemo, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AttendanceForm } from "@/components/payroll/attendance-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDate } from "@/lib/format";
import {
  ATTENDANCE_STATUSES,
  employeeName,
  isWorkingDay,
  monthDays,
  periodBounds,
} from "@/lib/payroll";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { AttendanceRecord } from "@/types";

const STATUS_CLASS: Record<AttendanceRecord["status"], string> = {
  present: "bg-emerald-50 text-emerald-800 border-emerald-200",
  absent: "bg-red-50 text-red-700 border-red-200",
  leave: "bg-blue-50 text-blue-700 border-blue-200",
  holiday: "bg-amber-50 text-amber-800 border-amber-200",
  off: "bg-slate-50 text-slate-500 border-slate-200",
};

export default function AttendancePage() {
  const employees = useAppStore((state) => state.employees);
  const attendance = useAppStore((state) => state.attendance);
  const holidays = useAppStore((state) => state.holidays);
  const upsertAttendance = useAppStore((state) => state.upsertAttendance);
  const deleteAttendance = useAppStore((state) => state.deleteAttendance);
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [employeeId, setEmployeeId] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Partial<AttendanceRecord> | null>(null);
  const [deleting, setDeleting] = useState<AttendanceRecord | null>(null);

  useCreateRequest("attendance", () => {
    setPreset(null);
    setOpen(true);
  });

  const { from, to } = periodBounds(period);
  const days = monthDays(period);
  const selected = employees.find((row) => row.id === employeeId);

  const monthRows = useMemo(() => {
    return attendance
      .filter((row) => row.date >= from && row.date <= to && (employeeId === "all" || !employeeId || row.employeeId === employeeId))
      .sort((a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId));
  }, [attendance, from, to, employeeId]);

  const present = monthRows.filter((row) => row.status === "present").length;
  const overtime = monthRows.reduce((sum, row) => sum + row.overtimeHours, 0);

  const openDay = (date: string) => {
    const existing = attendance.find((row) => row.employeeId === selected?.id && row.date === date);
    setPreset(
      existing ?? {
        employeeId: selected?.id,
        date,
        status: holidays.some((holiday) => holiday.date === date) ? "holiday" : "present",
        clockIn: "08:00",
        clockOut: "16:00",
        hoursWorked: 8,
        overtimeHours: 0,
        publicHolidayHours: 0,
        notes: "",
      }
    );
    setOpen(true);
  };

  const fillWorkingDays = () => {
    if (!selected) {
      toast.error("Pick an employee first.");
      return;
    }
    let filled = 0;
    for (const date of days) {
      if (!isWorkingDay(date, selected.workDaysPerWeek, holidays)) continue;
      if (attendance.some((row) => row.employeeId === selected.id && row.date === date)) continue;
      upsertAttendance({
        employeeId: selected.id,
        date,
        status: "present",
        clockIn: "08:00",
        clockOut: "16:00",
        hoursWorked: selected.hoursPerWeek / selected.workDaysPerWeek,
        overtimeHours: 0,
        publicHolidayHours: 0,
        notes: "",
      });
      filled += 1;
    }
    toast.success(filled ? `Marked ${filled} working day${filled === 1 ? "" : "s"} present.` : "All working days already marked.");
  };

  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      header: "Employee",
      cell: (row) => employeeName(employees.find((employee) => employee.id === row.employeeId) ?? { firstName: "Unknown", lastName: "" }),
    },
    { header: "Date", cell: (row) => formatDate(row.date) },
    {
      header: "Status",
      cell: (row) => ATTENDANCE_STATUSES.find((option) => option.value === row.status)?.label ?? row.status,
    },
    { header: "Hours", cell: (row) => row.hoursWorked },
    { header: "OT", cell: (row) => row.overtimeHours },
    { header: "PH hours", cell: (row) => row.publicHolidayHours },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreset(row);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(row)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Daily clocking, absences, overtime and public-holiday hours. Payslips use this register for the month."
        actionLabel="Add attendance"
        onAction={() => {
          setPreset(!employeeId || employeeId === "all" ? null : { employeeId });
          setOpen(true);
        }}
      >
        <Button variant="outline" className="h-9" onClick={fillWorkingDays}>
          Mark remaining working days
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Records this month" value={monthRows.length} icon={Clock} />
        <StatCard title="Present marks" value={present} icon={Clock} tone="green" />
        <StatCard title="Overtime hours" value={overtime} icon={Clock} tone="amber" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 sm:w-48" />
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employeeName(employee)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <div className="mb-6 rounded-xl border bg-white p-4">
          <p className="mb-3 text-sm font-medium">{employeeName(selected)} · {period}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="py-1 font-medium">
                {label}
              </div>
            ))}
            {Array.from({ length: new Date(`${from}T12:00:00`).getDay() }).map((_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {days.map((date) => {
              const record = attendance.find((row) => row.employeeId === selected.id && row.date === date);
              const holiday = holidays.find((row) => row.date === date);
              const status = record?.status ?? (holiday ? "holiday" : undefined);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => openDay(date)}
                  className={cn(
                    "flex min-h-14 flex-col rounded-md border px-1 py-1 text-left",
                    status ? STATUS_CLASS[status] : "bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs font-semibold">{date.slice(-2)}</span>
                  <span className="truncate text-[10px]">
                    {record
                      ? ATTENDANCE_STATUSES.find((option) => option.value === record.status)?.label
                      : holiday
                        ? holiday.name
                        : isWorkingDay(date, selected.workDaysPerWeek, holidays)
                          ? "—"
                          : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">Select one employee to mark the month on the calendar.</p>
      )}

      <DataTable
        data={monthRows}
        columns={columns}
        rowKey={(row) => row.id}
        empty={
          <EmptyState
            icon={Clock}
            title="No attendance this month"
            description="Add a day, or pick an employee and mark remaining working days present."
            actionLabel="Add attendance"
            onAction={() => {
              setPreset(null);
              setOpen(true);
            }}
          />
        }
      />

      <AttendanceForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPreset(null);
        }}
        preset={preset}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete attendance?"
        description="This day will no longer count on the next payslip run."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteAttendance(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Attendance deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
