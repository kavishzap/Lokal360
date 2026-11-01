"use client";

import { useMemo, useState } from "react";
import { Banknote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormModal } from "@/components/shared/form-modal";
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
import { formatDate, formatMUR } from "@/lib/format";
import { employeeName } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { Payslip } from "@/types";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "font-medium"}>{value}</span>
    </div>
  );
}

export default function PayslipsPage() {
  const employees = useAppStore((state) => state.employees);
  const payslips = useAppStore((state) => state.payslips);
  const generatePayslips = useAppStore((state) => state.generatePayslips);
  const deletePayslip = useAppStore((state) => state.deletePayslip);
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [employeeId, setEmployeeId] = useState<string | null>("all");
  const [viewing, setViewing] = useState<Payslip | null>(null);
  const [deleting, setDeleting] = useState<Payslip | null>(null);

  const run = (id?: string) => {
    const result = generatePayslips(period, id === "all" ? undefined : id);
    if (!result.ok) toast.error(result.error);
    else toast.success(result.warning ?? "Payslips generated");
  };

  useCreateRequest("payslip", () => run());

  const shown = useMemo(() => {
    return [...payslips]
      .sort((a, b) => b.period.localeCompare(a.period) || b.number.localeCompare(a.number))
      .filter((slip) => employeeId === "all" || !employeeId || slip.employeeId === employeeId);
  }, [payslips, employeeId]);

  const periodSlips = shown.filter((slip) => slip.period === period);
  const netTotal = periodSlips.reduce((sum, slip) => sum + slip.net, 0);
  const employerCost = periodSlips.reduce(
    (sum, slip) => sum + slip.gross + slip.csgEmployer + slip.nsfEmployer + slip.hrdcLevy + slip.prgf,
    0
  );

  const columns: DataTableColumn<Payslip>[] = [
    {
      header: "Payslip",
      cell: (slip) => (
        <div>
          <p className="font-medium">{slip.number}</p>
          <p className="text-xs text-slate-500">{slip.period}</p>
        </div>
      ),
    },
    {
      header: "Employee",
      cell: (slip) =>
        employeeName(employees.find((row) => row.id === slip.employeeId) ?? { firstName: "Unknown", lastName: "" }),
    },
    { header: "Gross", cell: (slip) => formatMUR(slip.gross) },
    { header: "CSG", cell: (slip) => formatMUR(slip.csgEmployee) },
    { header: "NSF", cell: (slip) => formatMUR(slip.nsfEmployee) },
    { header: "PAYE", cell: (slip) => formatMUR(slip.paye) },
    {
      header: "Net",
      cell: (slip) => <span className="font-medium">{formatMUR(slip.net)}</span>,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (slip) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewing(slip)}>
            View
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(slip)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  const employee = viewing ? employees.find((row) => row.id === viewing.employeeId) : null;

  return (
    <div>
      <PageHeader
        title="Payslips"
        description="Generate monthly payslips for one employee or the whole team. CSG, NSF, PAYE, HRDC and PRGF follow MRA rates stored in Policies."
        actionLabel="Generate all"
        onAction={() => run()}
      >
        <Button variant="outline" className="h-9" onClick={() => run(!employeeId || employeeId === "all" ? undefined : employeeId)}>
          Generate selected
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title={`Net pay ${period}`} value={formatMUR(netTotal)} icon={Banknote} tone="green" />
        <StatCard title="Employer cost (approx.)" value={formatMUR(employerCost)} icon={Banknote} tone="amber" />
        <StatCard title="Slips this period" value={periodSlips.length} icon={Banknote} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 sm:w-48" />
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employees.map((row) => (
              <SelectItem key={row.id} value={row.id}>
                {employeeName(row)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={shown}
        columns={columns}
        rowKey={(slip) => slip.id}
        empty={
          <EmptyState
            icon={Banknote}
            title="No payslips"
            description="Choose a month and generate slips for one employee or everyone."
            actionLabel="Generate all"
            onAction={() => run()}
          />
        }
      />

      <FormModal
        open={Boolean(viewing)}
        onOpenChange={(next) => {
          if (!next) setViewing(null);
        }}
        title={viewing ? viewing.number : "Payslip"}
        description={employee ? `${employeeName(employee)} · ${viewing?.period}` : undefined}
      >
        {viewing ? (
          <div className="space-y-3">
            <Row label="Basic" value={formatMUR(viewing.basic)} />
            <Row label="Overtime" value={formatMUR(viewing.overtimePay)} />
            <Row label="Public holiday pay" value={formatMUR(viewing.publicHolidayPay)} />
            <Row label="Unpaid deduction" value={formatMUR(-viewing.unpaidDeduction)} />
            <Row label="Gross" value={formatMUR(viewing.gross)} strong />
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Employee deductions</p>
              <Row label="CSG" value={formatMUR(viewing.csgEmployee)} />
              <Row label="NSF" value={formatMUR(viewing.nsfEmployee)} />
              <Row label="PAYE (estimate)" value={formatMUR(viewing.paye)} />
            </div>
            <Row label="Net pay" value={formatMUR(viewing.net)} strong />
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Employer contributions</p>
              <Row label="CSG" value={formatMUR(viewing.csgEmployer)} />
              <Row label="NSF" value={formatMUR(viewing.nsfEmployer)} />
              <Row label="HRDC levy" value={formatMUR(viewing.hrdcLevy)} />
              <Row label="PRGF" value={formatMUR(viewing.prgf)} />
            </div>
            <p className="text-xs text-slate-500">
              Present {viewing.daysPresent} · leave {viewing.daysLeave} · unpaid {viewing.daysUnpaid} · OT{" "}
              {viewing.overtimeHours}h · issued {formatDate(viewing.createdAt)}
            </p>
          </div>
        ) : null}
      </FormModal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete payslip?"
        description="You can generate it again for the same month."
        onConfirm={() => {
          if (!deleting) return;
          const result = deletePayslip(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Payslip deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
