"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FormModal } from "@/components/shared/form-modal";
import { ZoneSelector } from "@/components/shared/zone-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import type { RestaurantTable } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Table name is required"),
  zoneId: z.string().min(1, "Zone is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function TableForm({
  open,
  onOpenChange,
  table,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: RestaurantTable | null;
}) {
  const createTable = useAppStore((state) => state.createTable);
  const updateTable = useAppStore((state) => state.updateTable);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", zoneId: "", capacity: 4, isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      table
        ? {
            name: table.name,
            zoneId: table.zoneId,
            capacity: table.capacity,
            isActive: table.isActive,
          }
        : { name: "", zoneId: "", capacity: 4, isActive: true }
    );
  }, [open, table, form]);

  const onSubmit = (values: Values) => {
    const result = table ? updateTable(table.id, values) : createTable(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(table ? "Table updated" : "Table created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={table ? "Edit table" : "Add table"}
      description="Every table must belong to a restaurant zone."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Table name / number" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Table 11" />
        </Field>
        <Field label="Zone" error={form.formState.errors.zoneId?.message}>
          <Controller
            control={form.control}
            name="zoneId"
            render={({ field }) => (
              <ZoneSelector
                value={field.value || null}
                onChange={(value) => field.onChange(value ?? "")}
                placeholder="Select a zone"
              />
            )}
          />
        </Field>
        <Field label="Seating capacity" error={form.formState.errors.capacity?.message}>
          <Input type="number" min={1} {...form.register("capacity", { valueAsNumber: true })} />
        </Field>
        <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          Active
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{table ? "Save changes" : "Create table"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
