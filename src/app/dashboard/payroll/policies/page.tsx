"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { defaultPayrollPolicy } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  annualLeaveDays: z.number().min(0),
  extraLeaveDays: z.number().min(0),
  sickLeaveDays: z.number().min(0),
  sickLeaveMaxAccum: z.number().min(0),
  urgentLeaveDays: z.number().min(0),
  specialMarriageDays: z.number().min(0),
  vacationLeaveDays: z.number().min(0),
  vacationAfterYears: z.number().min(0),
  maternityWeeks: z.number().min(0),
  paternityDays: z.number().min(0),
  csgThreshold: z.number().min(0),
  csgEmployeeLowPct: z.number().min(0),
  csgEmployerLowPct: z.number().min(0),
  csgEmployeeHighPct: z.number().min(0),
  csgEmployerHighPct: z.number().min(0),
  nsfEmployeePct: z.number().min(0),
  nsfEmployerPct: z.number().min(0),
  nsfCeiling: z.number().min(0),
  hrdcLevyPct: z.number().min(0),
  prgfRatePct: z.number().min(0),
  payeExemptMonthly: z.number().min(0),
  overtimeWeekday: z.number().min(0),
  overtimePublicHoliday: z.number().min(0),
  standardHoursWeek: z.number().min(1),
  notes: z.string(),
});

type Values = z.infer<typeof schema>;

function toForm(policy: ReturnType<typeof defaultPayrollPolicy>): Values {
  return {
    annualLeaveDays: policy.annualLeaveDays,
    extraLeaveDays: policy.extraLeaveDays,
    sickLeaveDays: policy.sickLeaveDays,
    sickLeaveMaxAccum: policy.sickLeaveMaxAccum,
    urgentLeaveDays: policy.urgentLeaveDays,
    specialMarriageDays: policy.specialMarriageDays,
    vacationLeaveDays: policy.vacationLeaveDays,
    vacationAfterYears: policy.vacationAfterYears,
    maternityWeeks: policy.maternityWeeks,
    paternityDays: policy.paternityDays,
    csgThreshold: policy.csgThreshold,
    csgEmployeeLowPct: policy.csgEmployeeLow * 100,
    csgEmployerLowPct: policy.csgEmployerLow * 100,
    csgEmployeeHighPct: policy.csgEmployeeHigh * 100,
    csgEmployerHighPct: policy.csgEmployerHigh * 100,
    nsfEmployeePct: policy.nsfEmployee * 100,
    nsfEmployerPct: policy.nsfEmployer * 100,
    nsfCeiling: policy.nsfCeiling,
    hrdcLevyPct: policy.hrdcLevy * 100,
    prgfRatePct: policy.prgfRate * 100,
    payeExemptMonthly: policy.payeExemptMonthly,
    overtimeWeekday: policy.overtimeWeekday,
    overtimePublicHoliday: policy.overtimePublicHoliday,
    standardHoursWeek: policy.standardHoursWeek,
    notes: policy.notes,
  };
}

export default function PayrollPoliciesPage() {
  const policy = useAppStore((state) => state.payrollPolicy);
  const holidays = useAppStore((state) => state.holidays);
  const updatePayrollPolicy = useAppStore((state) => state.updatePayrollPolicy);
  const addHoliday = useAppStore((state) => state.addHoliday);
  const deleteHoliday = useAppStore((state) => state.deleteHoliday);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: toForm(policy ?? defaultPayrollPolicy()),
  });

  const onSubmit = (values: Values) => {
    const result = updatePayrollPolicy({
      annualLeaveDays: values.annualLeaveDays,
      extraLeaveDays: values.extraLeaveDays,
      sickLeaveDays: values.sickLeaveDays,
      sickLeaveMaxAccum: values.sickLeaveMaxAccum,
      urgentLeaveDays: values.urgentLeaveDays,
      specialMarriageDays: values.specialMarriageDays,
      vacationLeaveDays: values.vacationLeaveDays,
      vacationAfterYears: values.vacationAfterYears,
      maternityWeeks: values.maternityWeeks,
      paternityDays: values.paternityDays,
      csgThreshold: values.csgThreshold,
      csgEmployeeLow: values.csgEmployeeLowPct / 100,
      csgEmployerLow: values.csgEmployerLowPct / 100,
      csgEmployeeHigh: values.csgEmployeeHighPct / 100,
      csgEmployerHigh: values.csgEmployerHighPct / 100,
      nsfEmployee: values.nsfEmployeePct / 100,
      nsfEmployer: values.nsfEmployerPct / 100,
      nsfCeiling: values.nsfCeiling,
      hrdcLevy: values.hrdcLevyPct / 100,
      prgfRate: values.prgfRatePct / 100,
      payeExemptMonthly: values.payeExemptMonthly,
      overtimeWeekday: values.overtimeWeekday,
      overtimePublicHoliday: values.overtimePublicHoliday,
      standardHoursWeek: values.standardHoursWeek,
      notes: values.notes,
    });
    if (!result.ok) toast.error(result.error);
    else toast.success("Payroll policy saved");
  };

  return (
    <div>
      <PageHeader
        title="Payroll policies"
        description="Leave entitlements, contribution rates and public holidays used by payslips. Defaults match MRA CSG/NSF/HRDC/PRGF guidance and the Workers' Rights Act 2019."
      />

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Leave (WRA)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Annual leave (days)">
              <Input type="number" min={0} {...form.register("annualLeaveDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Extra annual days">
              <Input type="number" min={0} {...form.register("extraLeaveDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Sick leave (days)">
              <Input type="number" min={0} {...form.register("sickLeaveDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Sick leave max accum.">
              <Input type="number" min={0} {...form.register("sickLeaveMaxAccum", { valueAsNumber: true })} />
            </Field>
            <Field label="Urgent leave (house)">
              <Input type="number" min={0} {...form.register("urgentLeaveDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Special / marriage (days)">
              <Input type="number" min={0} {...form.register("specialMarriageDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Vacation leave (days)">
              <Input type="number" min={0} {...form.register("vacationLeaveDays", { valueAsNumber: true })} />
            </Field>
            <Field label="Vacation after (years)">
              <Input type="number" min={0} {...form.register("vacationAfterYears", { valueAsNumber: true })} />
            </Field>
            <Field label="Maternity (weeks)">
              <Input type="number" min={0} {...form.register("maternityWeeks", { valueAsNumber: true })} />
            </Field>
            <Field label="Paternity (days)">
              <Input type="number" min={0} {...form.register("paternityDays", { valueAsNumber: true })} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributions &amp; tax</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="CSG threshold (MUR)">
              <Input type="number" min={0} {...form.register("csgThreshold", { valueAsNumber: true })} />
            </Field>
            <Field label="CSG employee ≤ threshold (%)">
              <Input type="number" min={0} step={0.1} {...form.register("csgEmployeeLowPct", { valueAsNumber: true })} />
            </Field>
            <Field label="CSG employer ≤ threshold (%)">
              <Input type="number" min={0} step={0.1} {...form.register("csgEmployerLowPct", { valueAsNumber: true })} />
            </Field>
            <Field label="CSG employee &gt; threshold (%)">
              <Input type="number" min={0} step={0.1} {...form.register("csgEmployeeHighPct", { valueAsNumber: true })} />
            </Field>
            <Field label="CSG employer &gt; threshold (%)">
              <Input type="number" min={0} step={0.1} {...form.register("csgEmployerHighPct", { valueAsNumber: true })} />
            </Field>
            <Field label="NSF employee (%)">
              <Input type="number" min={0} step={0.1} {...form.register("nsfEmployeePct", { valueAsNumber: true })} />
            </Field>
            <Field label="NSF employer (%)">
              <Input type="number" min={0} step={0.1} {...form.register("nsfEmployerPct", { valueAsNumber: true })} />
            </Field>
            <Field label="NSF ceiling (MUR)">
              <Input type="number" min={0} {...form.register("nsfCeiling", { valueAsNumber: true })} />
            </Field>
            <Field label="HRDC levy (%)">
              <Input type="number" min={0} step={0.1} {...form.register("hrdcLevyPct", { valueAsNumber: true })} />
            </Field>
            <Field label="PRGF (%)">
              <Input type="number" min={0} step={0.1} {...form.register("prgfRatePct", { valueAsNumber: true })} />
            </Field>
            <Field label="PAYE monthly exempt (MUR)">
              <Input type="number" min={0} {...form.register("payeExemptMonthly", { valueAsNumber: true })} />
            </Field>
            <Field label="Standard hours / week">
              <Input type="number" min={1} {...form.register("standardHoursWeek", { valueAsNumber: true })} />
            </Field>
            <Field label="OT weekday multiplier">
              <Input type="number" min={0} step={0.1} {...form.register("overtimeWeekday", { valueAsNumber: true })} />
            </Field>
            <Field label="OT public holiday multiplier">
              <Input type="number" min={0} step={0.1} {...form.register("overtimePublicHoliday", { valueAsNumber: true })} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Field label="Policy notes">
                <Textarea rows={4} {...form.register("notes")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset(toForm(defaultPayrollPolicy()));
              toast.message("Restored Mauritian default rates. Save to keep them.");
            }}
          >
            Restore legal defaults
          </Button>
          <Button type="submit">Save policy</Button>
        </div>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Public holidays</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const result = addHoliday(holidayDate, holidayName);
              if (!result.ok) toast.error(result.error);
              else {
                toast.success("Holiday added");
                setHolidayDate("");
                setHolidayName("");
              }
            }}
          >
            <Input type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} className="h-9 sm:w-48" />
            <Input
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
              placeholder="Holiday name"
              className="h-9"
            />
            <Button type="submit" className="h-9">
              Add holiday
            </Button>
          </form>
          <ul className="divide-y rounded-lg border">
            {holidays.map((holiday) => (
              <li key={holiday.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{formatDate(holiday.date)}</span>
                  <span className="text-slate-500"> · {holiday.name}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const result = deleteHoliday(holiday.id);
                    if (!result.ok) toast.error(result.error);
                    else toast.success("Holiday removed");
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
