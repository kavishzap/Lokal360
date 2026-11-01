"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslate } from "@/i18n/use-translate";
import { formatDate, formatMUR } from "@/lib/format";
import { LEAVE_TYPES, leaveEntitlement, leaveTaken } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import type { LeaveType } from "@/types";

export default function MyPayPage() {
  const { t } = useTranslate();
  const employeeId = useAuthStore((state) => state.session?.employeeId);
  const employee = useAppStore((state) => state.employees.find((row) => row.id === employeeId));
  const payslips = useAppStore((state) => state.payslips);
  const leaveRequests = useAppStore((state) => state.leaveRequests);
  const policy = useAppStore((state) => state.payrollPolicy);
  const createLeave = useAppStore((state) => state.createLeave);
  const [type, setType] = useState<LeaveType>("annual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  if (!employee) {
    return <p className="text-sm text-slate-600">{t("This sign-in is not linked to an employee.")}</p>;
  }

  const slips = payslips
    .filter((slip) => slip.employeeId === employee.id)
    .sort((a, b) => b.period.localeCompare(a.period));
  const latest = slips[0];
  const mine = leaveRequests.filter((request) => request.employeeId === employee.id);

  const ask = () => {
    const result = createLeave({ employeeId: employee.id, type, from, to, reason });
    if (!result.ok) toast.error(result.error);
    else {
      toast.success(t("Leave request sent"));
      setReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {t("Hello")}, {employee.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {employee.jobTitle} · {employee.employeeNumber}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">{t("Latest payslip")}</h2>
        {latest ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{latest.period}</span>
              <span className="font-semibold">{formatMUR(latest.net)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("Gross")}</span>
              <span>{formatMUR(latest.gross)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("PAYE")}</span>
              <span>{formatMUR(latest.paye)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CSG + NSF</span>
              <span>{formatMUR(latest.csgEmployee + latest.nsfEmployee)}</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t("No payslip has been issued yet.")}</p>
        )}
        {slips.length > 1 ? (
          <ul className="mt-4 divide-y text-sm">
            {slips.slice(1).map((slip) => (
              <li key={slip.id} className="flex justify-between py-2">
                <span>{slip.period}</span>
                <span>{formatMUR(slip.net)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">{t("Leave")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {LEAVE_TYPES.filter((item) => item.value !== "unpaid").map((item) => {
            const allowed = leaveEntitlement(employee, item.value, policy);
            const used = leaveTaken(employee.id, item.value, leaveRequests);
            if (allowed <= 0 && used <= 0) return null;
            return (
              <div key={item.value} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium">{t(item.label)}</p>
                <p className="text-slate-500">
                  {used} / {allowed} {t("days")}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select value={type} onValueChange={(value) => setType(value as LeaveType)}>
            <SelectTrigger className="h-9 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {t(item.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9" />
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder={t("Reason")} />
        </div>
        <Button className="mt-3" onClick={ask}>
          {t("Request leave")}
        </Button>
        {mine.length ? (
          <ul className="mt-4 divide-y text-sm">
            {mine.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {t(LEAVE_TYPES.find((item) => item.value === request.type)?.label ?? request.type)} · {formatDate(request.from)}
                </span>
                <span className="text-slate-500">{t(request.status)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
