"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { LeaveForm } from "@/components/payroll/leave-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { formatDate } from "@/lib/format";
import { employeeName, LEAVE_TYPES, leaveEntitlement, leaveTaken } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { LeaveRequest } from "@/types";

const STATUS_CLASS = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-slate-100 text-slate-600",
};

export default function LeavePage() {
  const employees = useAppStore((state) => state.employees);
  const leaveRequests = useAppStore((state) => state.leaveRequests);
  const payrollPolicy = useAppStore((state) => state.payrollPolicy);
  const setLeaveStatus = useAppStore((state) => state.setLeaveStatus);
  const deleteLeave = useAppStore((state) => state.deleteLeave);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<LeaveRequest | null>(null);

  useCreateRequest("leave", () => setOpen(true));

  const filtered = useMemo(() => {
    return [...leaveRequests]
      .sort((a, b) => b.from.localeCompare(a.from))
      .filter((request) => {
        const employee = employees.find((row) => row.id === request.employeeId);
        const hay = `${employee ? employeeName(employee) : "Unknown"} ${request.reason}`.toLowerCase();
        const matchesQuery = !query || hay.includes(query.toLowerCase());
        const matchesType = type === "all" || type == null || request.type === type;
        return matchesQuery && matchesType;
      });
  }, [leaveRequests, query, type, employees]);

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      header: "Employee",
      cell: (request) => {
        const employee = employees.find((row) => row.id === request.employeeId);
        return employee ? employeeName(employee) : "Unknown";
      },
    },
    {
      header: "Type",
      cell: (request) => LEAVE_TYPES.find((row) => row.value === request.type)?.label ?? request.type,
    },
    {
      header: "Dates",
      cell: (request) => (
        <div>
          <p>
            {formatDate(request.from)} – {formatDate(request.to)}
          </p>
          <p className="text-xs text-slate-500">
            {request.days} day{request.days === 1 ? "" : "s"}
          </p>
        </div>
      ),
    },
    { header: "Reason", cell: (request) => request.reason || "—" },
    {
      header: "Status",
      cell: (request) => (
        <Badge variant="outline" className={`border-transparent capitalize ${STATUS_CLASS[request.status]}`}>
          {request.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (request) => (
        <div className="flex justify-end gap-1">
          {request.status === "pending" ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  const result = setLeaveStatus(request.id, "approved");
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Leave approved");
                }}
              >
                <Check />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  const result = setLeaveStatus(request.id, "rejected");
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Leave rejected");
                }}
              >
                <X />
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(request)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  const balances = employees.filter((row) => row.isActive).map((employee) => ({
    employee,
    annual: leaveEntitlement(employee, "annual", payrollPolicy) - leaveTaken(employee.id, "annual", leaveRequests),
    sick: leaveEntitlement(employee, "sick", payrollPolicy) - leaveTaken(employee.id, "sick", leaveRequests),
    urgent: leaveEntitlement(employee, "urgent", payrollPolicy) - leaveTaken(employee.id, "urgent", leaveRequests),
  }));

  return (
    <div>
      <PageHeader
        title="Leave"
        description="Annual, sick, urgent, special, vacation, maternity and paternity leave. Entitlements follow the Workers' Rights Act 2019 and house policy."
        actionLabel="Request leave"
        onAction={() => setOpen(true)}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending"
          value={leaveRequests.filter((row) => row.status === "pending").length}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          title="Approved"
          value={leaveRequests.filter((row) => row.status === "approved").length}
          icon={CalendarDays}
          tone="green"
        />
        <StatCard title="All requests" value={leaveRequests.length} icon={CalendarDays} />
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-4 py-2 font-medium">Annual left</th>
              <th className="px-4 py-2 font-medium">Sick left</th>
              <th className="px-4 py-2 font-medium">Urgent left</th>
            </tr>
          </thead>
          <tbody>
            {balances.map(({ employee, annual, sick, urgent }) => (
              <tr key={employee.id} className="border-b last:border-0">
                <td className="px-4 py-2">{employeeName(employee)}</td>
                <td className="px-4 py-2">{annual}</td>
                <td className="px-4 py-2">{sick}</td>
                <td className="px-4 py-2">{urgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Search leave..." className="sm:max-w-xs" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LEAVE_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(request) => request.id}
        empty={
          <EmptyState
            icon={CalendarDays}
            title="No leave recorded"
            description="Request annual, sick or urgent leave for an employee."
            actionLabel="Request leave"
            onAction={() => setOpen(true)}
          />
        }
      />

      <LeaveForm open={open} onOpenChange={setOpen} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete leave request?"
        description="This removes the request from the leave register."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteLeave(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Leave request deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
