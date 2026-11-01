"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { employeeName, LEAVE_TYPES, leaveEntitlement, leaveTaken } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  type: z.enum(["annual", "sick", "urgent", "special", "vacation", "maternity", "paternity", "unpaid"]),
  from: z.string().min(1, "Start date is required"),
  to: z.string().min(1, "End date is required"),
  reason: z.string(),
});

type Values = z.infer<typeof schema>;

export function LeaveForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const employees = useAppStore((state) => state.employees);
  const leaveRequests = useAppStore((state) => state.leaveRequests);
  const payrollPolicy = useAppStore((state) => state.payrollPolicy);
  const createLeave = useAppStore((state) => state.createLeave);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      type: "annual",
      from: new Date().toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      reason: "",
    },
  });
  const employeeId = useWatch({ control: form.control, name: "employeeId" });
  const type = useWatch({ control: form.control, name: "type" });
  const employee = employees.find((row) => row.id === employeeId);
  const hint = LEAVE_TYPES.find((row) => row.value === type)?.hint;
  const remaining =
    employee && type !== "unpaid"
      ? leaveEntitlement(employee, type, payrollPolicy) - leaveTaken(employee.id, type, leaveRequests)
      : null;

  useEffect(() => {
    if (!open) return;
    form.reset({
      employeeId: employees.find((row) => row.isActive)?.id ?? "",
      type: "annual",
      from: new Date().toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      reason: "",
    });
  }, [open, employees, form]);

  const onSubmit = (values: Values) => {
    const result = createLeave(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Leave request recorded");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Request leave"
      description="Annual, sick, special, vacation and family leave follow the Workers' Rights Act. Urgent leave is a house policy."
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
                      {employeeName(row)} · {row.employeeNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Leave type">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        {remaining != null ? (
          <p className="text-xs text-slate-600">
            Remaining this year: {remaining} day{remaining === 1 ? "" : "s"}
            {remaining < 0 ? " (over entitlement — still recorded)" : ""}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" error={form.formState.errors.from?.message}>
            <Input type="date" {...form.register("from")} />
          </Field>
          <Field label="To" error={form.formState.errors.to?.message}>
            <Input type="date" {...form.register("to")} />
          </Field>
        </div>
        <Field label="Reason">
          <Textarea rows={2} {...form.register("reason")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save request</Button>
        </div>
      </form>
    </FormModal>
  );
}
