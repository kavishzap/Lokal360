"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { employeeName, JOB_TYPES } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { Employee } from "@/types";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  nid: z.string(),
  gender: z.enum(["female", "male", "other"]),
  dateOfBirth: z.string(),
  nationality: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  maritalStatus: z.enum(["single", "married", "other"]),
  bankName: z.string(),
  bankAccount: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string(),
  jobType: z.enum(["full_time", "part_time", "casual", "atypical"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  isActive: z.boolean(),
  basicSalary: z.number().min(0, "Salary cannot be negative"),
  workDaysPerWeek: z.enum(["5", "6"]),
  hoursPerWeek: z.number().min(1, "Hours per week are required"),
  edfReliefAnnual: z.number().min(0),
  prgfEligible: z.boolean(),
  notes: z.string(),
});

type Values = z.infer<typeof schema>;

function toValues(employee?: Employee | null): Values {
  return {
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    nid: employee?.nid ?? "",
    gender: employee?.gender ?? "female",
    dateOfBirth: employee?.dateOfBirth ?? "",
    nationality: employee?.nationality ?? "Mauritian",
    address: employee?.address ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    maritalStatus: employee?.maritalStatus ?? "single",
    bankName: employee?.bankName ?? "",
    bankAccount: employee?.bankAccount ?? "",
    jobTitle: employee?.jobTitle ?? "",
    department: employee?.department ?? "",
    jobType: employee?.jobType ?? "full_time",
    startDate: employee?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: employee?.endDate ?? "",
    isActive: employee?.isActive ?? true,
    basicSalary: employee?.basicSalary ?? 0,
    workDaysPerWeek: String(employee?.workDaysPerWeek ?? 6) as "5" | "6",
    hoursPerWeek: employee?.hoursPerWeek ?? 45,
    edfReliefAnnual: employee?.edfReliefAnnual ?? 0,
    prgfEligible: employee?.prgfEligible ?? true,
    notes: employee?.notes ?? "",
  };
}

const LIST_PATH = "/dashboard/payroll/employees";

export function EmployeeForm({ employee }: { employee?: Employee | null }) {
  const router = useRouter();
  const createEmployee = useAppStore((state) => state.createEmployee);
  const updateEmployee = useAppStore((state) => state.updateEmployee);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(employee),
  });

  useEffect(() => {
    form.reset(toValues(employee));
  }, [employee, form]);

  const onSubmit = (values: Values) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      nid: values.nid,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      nationality: values.nationality,
      address: values.address,
      phone: values.phone,
      email: values.email,
      maritalStatus: values.maritalStatus,
      bankName: values.bankName,
      bankAccount: values.bankAccount,
      jobTitle: values.jobTitle,
      department: values.department,
      jobType: values.jobType,
      startDate: values.startDate,
      endDate: values.endDate.trim() ? values.endDate : null,
      isActive: values.isActive,
      basicSalary: values.basicSalary,
      payFrequency: "monthly" as const,
      workDaysPerWeek: Number(values.workDaysPerWeek) as 5 | 6,
      hoursPerWeek: values.hoursPerWeek,
      edfReliefAnnual: values.edfReliefAnnual,
      prgfEligible: values.prgfEligible,
      notes: values.notes,
    };
    const result = employee ? updateEmployee(employee.id, payload) : createEmployee(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(employee ? "Employee updated" : "Employee added");
    router.push(LIST_PATH);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={employee ? employeeName(employee) : "Add employee"}
        description="Personal, job and pay details used for CSG, NSF, PRGF, PAYE and leave."
      />
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Personal</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="NIC / NID">
              <Input {...form.register("nid")} placeholder="National identity number" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field label="Gender">
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Marital status">
              <Controller
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Nationality">
              <Input {...form.register("nationality")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="Email">
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Address">
              <Input {...form.register("address")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Job</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job title" error={form.formState.errors.jobTitle?.message}>
              <Input {...form.register("jobTitle")} placeholder="Head chef" />
            </Field>
            <Field label="Department">
              <Input {...form.register("department")} placeholder="Kitchen" />
            </Field>
            <Field label="Job type">
              <Controller
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Start date" error={form.formState.errors.startDate?.message}>
              <Input type="date" {...form.register("startDate")} />
            </Field>
            <Field label="End date">
              <Input type="date" {...form.register("endDate")} />
            </Field>
            <Field label="Work days / week">
              <Controller
                control={form.control}
                name="workDaysPerWeek"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="6">6 days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Hours / week" error={form.formState.errors.hoursPerWeek?.message}>
              <Input type="number" min={1} step={0.5} {...form.register("hoursPerWeek", { valueAsNumber: true })} />
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            Active on payroll
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Pay</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Basic salary (MUR / month)" error={form.formState.errors.basicSalary?.message}>
              <Input type="number" min={0} step={0.01} {...form.register("basicSalary", { valueAsNumber: true })} />
            </Field>
            <Field label="EDF relief (annual MUR)">
              <Input type="number" min={0} step={1} {...form.register("edfReliefAnnual", { valueAsNumber: true })} />
            </Field>
            <Field label="Bank">
              <Input {...form.register("bankName")} placeholder="MCB" />
            </Field>
            <Field label="Account number">
              <Input {...form.register("bankAccount")} />
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            PRGF eligible (citizens with basic under Rs 200,000)
            <Controller
              control={form.control}
              name="prgfEligible"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </label>
          <Field label="Notes">
            <Textarea rows={3} {...form.register("notes")} />
          </Field>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(LIST_PATH)}>
            Cancel
          </Button>
          <Button type="submit">{employee ? "Save employee" : "Add employee"}</Button>
        </div>
      </form>
    </div>
  );
}
