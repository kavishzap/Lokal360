"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FormModal } from "@/components/shared/form-modal";
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
import { ATTENDANCE_STATUSES, employeeName } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { AttendanceRecord } from "@/types";

const schema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "leave", "holiday", "off"]),
  clockIn: z.string(),
  clockOut: z.string(),
  hoursWorked: z.number().min(0),
  overtimeHours: z.number().min(0),
  publicHolidayHours: z.number().min(0),
  notes: z.string(),
});

type Values = z.infer<typeof schema>;

export function AttendanceForm({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: Partial<AttendanceRecord> | null;
}) {
  const employees = useAppStore((state) => state.employees);
  const upsertAttendance = useAppStore((state) => state.upsertAttendance);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      date: new Date().toISOString().slice(0, 10),
      status: "present",
      clockIn: "08:00",
      clockOut: "16:00",
      hoursWorked: 8,
      overtimeHours: 0,
      publicHolidayHours: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      employeeId: preset?.employeeId ?? employees.find((row) => row.isActive)?.id ?? "",
      date: preset?.date ?? new Date().toISOString().slice(0, 10),
      status: preset?.status ?? "present",
      clockIn: preset?.clockIn ?? "08:00",
      clockOut: preset?.clockOut ?? "16:00",
      hoursWorked: preset?.hoursWorked ?? 8,
      overtimeHours: preset?.overtimeHours ?? 0,
      publicHolidayHours: preset?.publicHolidayHours ?? 0,
      notes: preset?.notes ?? "",
    });
  }, [open, preset, employees, form]);

  const onSubmit = (values: Values) => {
    const result = upsertAttendance(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Attendance saved");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Attendance"
      description="Clock times, overtime and public-holiday hours feed the monthly payslip."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Employee" error={form.formState.errors.employeeId?.message}>
          <Controller
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {employeeName(row)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" error={form.formState.errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </Field>
          <Field label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUSES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Clock in">
            <Input type="time" {...form.register("clockIn")} />
          </Field>
          <Field label="Clock out">
            <Input type="time" {...form.register("clockOut")} />
          </Field>
          <Field label="Hours worked">
            <Input type="number" min={0} step={0.25} {...form.register("hoursWorked", { valueAsNumber: true })} />
          </Field>
          <Field label="Overtime hours (1.5x)">
            <Input type="number" min={0} step={0.25} {...form.register("overtimeHours", { valueAsNumber: true })} />
          </Field>
          <Field label="Public holiday hours (2x)">
            <Input
              type="number"
              min={0}
              step={0.25}
              {...form.register("publicHolidayHours", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={2} {...form.register("notes")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save attendance</Button>
        </div>
      </form>
    </FormModal>
  );
}
