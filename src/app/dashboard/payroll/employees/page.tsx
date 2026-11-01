"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDate, formatMUR } from "@/lib/format";
import { employeeName, JOB_TYPES } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const router = useRouter();
  const employees = useAppStore((state) => state.employees);
  const deleteEmployee = useAppStore((state) => state.deleteEmployee);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [deleting, setDeleting] = useState<Employee | null>(null);

  useCreateRequest("employee", () => {
    router.push("/dashboard/payroll/employees/new");
  });

  const filtered = useMemo(() => {
    return [...employees]
      .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber))
      .filter((employee) => {
        const hay = `${employee.firstName} ${employee.lastName} ${employee.employeeNumber} ${employee.jobTitle} ${employee.nid}`.toLowerCase();
        const matchesQuery = !query || hay.includes(query.toLowerCase());
        const matchesStatus =
          status === "all" ||
          status == null ||
          (status === "active" && employee.isActive) ||
          (status === "inactive" && !employee.isActive);
        return matchesQuery && matchesStatus;
      });
  }, [employees, query, status]);

  const wageBill = employees.filter((row) => row.isActive).reduce((sum, row) => sum + row.basicSalary, 0);

  const columns: DataTableColumn<Employee>[] = [
    {
      header: "Employee",
      cell: (employee) => (
        <button
          type="button"
          className="text-left"
          onClick={() => router.push(`/dashboard/payroll/employees/${employee.id}`)}
        >
          <p className="font-medium text-slate-900">{employeeName(employee)}</p>
          <p className="text-xs text-slate-500">
            {employee.employeeNumber} · {employee.nid || "No NIC"}
          </p>
        </button>
      ),
    },
    {
      header: "Role",
      cell: (employee) => (
        <div>
          <p>{employee.jobTitle}</p>
          <p className="text-xs text-slate-500">
            {JOB_TYPES.find((row) => row.value === employee.jobType)?.label} · {employee.department}
          </p>
        </div>
      ),
    },
    { header: "Started", cell: (employee) => formatDate(employee.startDate) },
    { header: "Basic", cell: (employee) => formatMUR(employee.basicSalary) },
    {
      header: "Status",
      cell: (employee) => <StatusBadge active={employee.isActive} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (employee) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${employeeName(employee)}`}
            onClick={() => router.push(`/dashboard/payroll/employees/${employee.id}`)}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(employee)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Personal details, job type, start date and pay-role settings for Mauritian CSG, NSF, PRGF and PAYE."
        actionLabel="Add employee"
        onAction={() => router.push("/dashboard/payroll/employees/new")}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="On payroll" value={employees.filter((row) => row.isActive).length} icon={Users} />
        <StatCard title="Inactive" value={employees.filter((row) => !row.isActive).length} icon={Users} tone="slate" />
        <StatCard title="Monthly basic bill" value={formatMUR(wageBill)} icon={Users} tone="green" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search employees..." className="sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(employee) => employee.id}
        empty={
          <EmptyState
            icon={Users}
            title="No employees"
            description="Add the first team member to start leave, attendance and payslips."
            actionLabel="Add employee"
            onAction={() => router.push("/dashboard/payroll/employees/new")}
          />
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete employee?"
        description="Employees with payslips cannot be deleted. Deactivate the record instead."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteEmployee(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Employee deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
