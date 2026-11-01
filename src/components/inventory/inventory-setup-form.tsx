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
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { InventoryItem } from "@/types";

const schema = z.object({
  ingredientId: z.string().min(1, "Select an ingredient"),
  currentStock: z.number().min(0, "Cannot be negative"),
  minimumStock: z.number().min(0, "Cannot be negative"),
  costPerUnit: z.number().min(0, "Cannot be negative"),
});

type Values = z.infer<typeof schema>;

export function InventorySetupForm({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
}) {
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const inventory = useAppStore((state) => state.inventory);
  const setupInventory = useAppStore((state) => state.setupInventory);
  const updateInventoryMeta = useAppStore((state) => state.updateInventoryMeta);

  const availableIngredients = useMemo(() => {
    const used = new Set(inventory.map((row) => row.ingredientId));
    return ingredients.filter(
      (ingredient) => !used.has(ingredient.id) || ingredient.id === item?.ingredientId
    );
  }, [ingredients, inventory, item]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      ingredientId: "",
      currentStock: 0,
      minimumStock: 0,
      costPerUnit: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      item
        ? {
            ingredientId: item.ingredientId,
            currentStock: item.currentStock,
            minimumStock: item.minimumStock,
            costPerUnit: item.costPerUnit,
          }
        : {
            ingredientId: "",
            currentStock: 0,
            minimumStock: 0,
            costPerUnit: 0,
          }
    );
  }, [open, item, form]);

  const onSubmit = (values: Values) => {
    const result = item
      ? updateInventoryMeta(item.id, {
          minimumStock: values.minimumStock,
          costPerUnit: values.costPerUnit,
        })
      : setupInventory(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(item ? "Inventory settings updated" : "Inventory item created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit inventory settings" : "Track ingredient"}
      description="Each ingredient can have only one inventory record."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Ingredient" error={form.formState.errors.ingredientId?.message}>
          <Controller
            control={form.control}
            name="ingredientId"
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={field.onChange}
                disabled={Boolean(item)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {availableIngredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({unitAbbreviation(units, ingredient.unitId)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {!item ? (
          <Field label="Opening stock" error={form.formState.errors.currentStock?.message}>
            <Input type="number" min={0} step="any" {...form.register("currentStock", { valueAsNumber: true })} />
          </Field>
        ) : null}
        <Field label="Minimum stock level" error={form.formState.errors.minimumStock?.message}>
          <Input type="number" min={0} step="any" {...form.register("minimumStock", { valueAsNumber: true })} />
        </Field>
        <Field label="Cost per unit (MUR)" error={form.formState.errors.costPerUnit?.message}>
          <Input type="number" min={0} step="0.01" {...form.register("costPerUnit", { valueAsNumber: true })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{item ? "Save changes" : "Create record"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
