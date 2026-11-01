"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { unitDisplayName } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { Ingredient } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  description: z.string().optional(),
  unitId: z.string().min(1, "Unit of measurement is required"),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function IngredientForm({
  open,
  onOpenChange,
  ingredient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
}) {
  const units = useAppStore((state) => state.units);
  const createIngredient = useAppStore((state) => state.createIngredient);
  const updateIngredient = useAppStore((state) => state.updateIngredient);
  const selectableUnits = useMemo(() => {
    return units.filter((unit) => unit.isActive || unit.id === ingredient?.unitId);
  }, [units, ingredient?.unitId]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", unitId: "", isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      ingredient
        ? {
            name: ingredient.name,
            description: ingredient.description,
            unitId: ingredient.unitId,
            isActive: ingredient.isActive,
          }
        : { name: "", description: "", unitId: "", isActive: true }
    );
  }, [open, ingredient, form]);

  const onSubmit = (values: Values) => {
    const result = ingredient
      ? updateIngredient(ingredient.id, {
          name: values.name,
          description: values.description ?? "",
          unitId: values.unitId,
          isActive: values.isActive,
        })
      : createIngredient({
          name: values.name,
          description: values.description ?? "",
          unitId: values.unitId,
          isActive: values.isActive,
        });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(ingredient ? "Ingredient updated" : "Ingredient created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={ingredient ? "Edit ingredient" : "Add ingredient"}
      description="Ingredients are master data. Stock is managed in Inventory."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Ingredient name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Chicken Breast" />
        </Field>
        <Field label="Description">
          <Textarea rows={3} {...form.register("description")} />
        </Field>
        <Field label="Unit of measurement" error={form.formState.errors.unitId?.message}>
          <Controller
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <Select value={field.value || null} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {selectableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unitDisplayName(units, unit.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {units.length === 0 ? (
            <p className="text-xs text-amber-700">
              Add a unit of measurement first from the Units page.
            </p>
          ) : null}
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
          <Button type="submit">{ingredient ? "Save changes" : "Create ingredient"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
