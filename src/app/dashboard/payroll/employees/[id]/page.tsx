"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { EmployeeForm } from "@/components/payroll/employee-form";
import { StatusScreen } from "@/components/shared/status-screen";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrated = useAppStore((state) => state.hydrated);
  const employeesLoaded = useAppStore((state) => state.loadedSlices.includes("employees"));
  const employee = useAppStore((state) => state.employees.find((row) => row.id === id));

  if (!hydrated) return null;
  if (isSupabaseConfigured() && !employeesLoaded) {
    return (
      <StatusScreen
        embedded
        title="This page could not be loaded."
        description="This page could not be opened. Your books are unchanged."
      />
    );
  }
  if (!employee) notFound();

  return <EmployeeForm employee={employee} />;
}
