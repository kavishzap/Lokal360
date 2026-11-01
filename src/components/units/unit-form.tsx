"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import type { MeasurementUnit } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Unit name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function UnitForm({
  open,
  onOpenChange,
  unit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: MeasurementUnit | null;
}) {
  const createUnit = useAppStore((state) => state.createUnit);
  const updateUnit = useAppStore((state) => state.updateUnit);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", abbreviation: "", isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      unit
        ? { name: unit.name, abbreviation: unit.abbreviation, isActive: unit.isActive }
        : { name: "", abbreviation: "", isActive: true }
    );
  }, [open, unit, form]);

  const onSubmit = (values: Values) => {
    const result = unit ? updateUnit(unit.id, values) : createUnit(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(unit ? "Unit updated" : "Unit created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={unit ? "Edit unit" : "Add unit of measurement"}
      description="Units are used when creating ingredients and tracking inventory."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Unit name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Kilogram" />
        </Field>
        <Field label="Abbreviation" error={form.formState.errors.abbreviation?.message}>
          <Input {...form.register("abbreviation")} placeholder="kg" />
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
          <Button type="submit">{unit ? "Save changes" : "Create unit"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
