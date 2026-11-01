"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormModal, Field } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { InventoryItem } from "@/types";

const schema = z.object({
  quantity: z.number().min(0, "Quantity cannot be negative"),
  reason: z.string().min(1, "Reason is required"),
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof schema>;
type Mode = "IN" | "OUT" | "ADJUSTMENT";

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  mode: Mode;
}) {
  const addStock = useAppStore((state) => state.addStock);
  const removeStock = useAppStore((state) => state.removeStock);
  const adjustStock = useAppStore((state) => state.adjustStock);
  const ingredient = useAppStore((state) =>
    state.ingredients.find((row) => row.id === item?.ingredientId)
  );
  const units = useAppStore((state) => state.units);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 0,
      reason: "",
      date: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (open && item) {
      form.reset({
        quantity: mode === "ADJUSTMENT" ? item.currentStock : 0,
        reason: "",
        date: new Date().toISOString().slice(0, 16),
      });
    }
  }, [open, item, mode, form]);

  const titles = {
    IN: "Add Stock",
    OUT: "Remove Stock",
    ADJUSTMENT: "Adjust Stock",
  };

  const onSubmit = (values: FormValues) => {
    if (!item) return;
    const result =
      mode === "IN"
        ? addStock(item.id, values.quantity, values.reason, values.date)
        : mode === "OUT"
          ? removeStock(item.id, values.quantity, values.reason, values.date)
          : adjustStock(item.id, values.quantity, values.reason, values.date);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Inventory updated");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={titles[mode]}
      description={
        ingredient
          ? `${ingredient.name} · current stock ${item?.currentStock ?? 0} ${unitAbbreviation(units, ingredient.unitId)}`
          : undefined
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field
          label={mode === "ADJUSTMENT" ? "New quantity" : "Quantity"}
          error={form.formState.errors.quantity?.message}
        >
          <Input type="number" step="any" min={0} {...form.register("quantity", { valueAsNumber: true })} />
        </Field>
        <Field label="Reason / notes" error={form.formState.errors.reason?.message}>
          <Textarea rows={3} {...form.register("reason")} />
        </Field>
        <Field label="Date" error={form.formState.errors.date?.message}>
          <Input type="datetime-local" {...form.register("date")} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </FormModal>
  );
}
