"use client";

import Link from "next/link";
import { use } from "react";
import { EmployeeForm } from "@/components/payroll/employee-form";
import { useAppStore } from "@/store/app-store";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const employee = useAppStore((state) => state.employees.find((row) => row.id === id));

  if (!employee) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium text-slate-900">This employee is not in the books.</p>
        <Link href="/dashboard/payroll/employees" className="mt-3 inline-block text-sm text-blue-700">
          Back to employees
        </Link>
      </div>
    );
  }

  return <EmployeeForm employee={employee} />;
}
