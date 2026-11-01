"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { lineAmount, purchaseTotal } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  payment: z.enum(["cash", "bank", "credit"]),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        ingredientId: z.string().nullable(),
        quantity: z.number().positive("Quantity must be greater than zero"),
        unitCost: z.number().min(0),
        addToInventory: z.boolean(),
      })
    )
    .min(1, "Add at least one line"),
});

type Values = z.infer<typeof schema>;

const emptyLine = {
  description: "",
  ingredientId: null as string | null,
  quantity: 1,
  unitCost: 0,
  addToInventory: false,
};

export function PurchaseForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PurchaseFormInner key={open ? "open" : "closed"} open={open} onOpenChange={onOpenChange} />
  );
}

function PurchaseFormInner({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const createPurchase = useAppStore((state) => state.createPurchase);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier: "",
      invoiceNumber: "",
      date: new Date().toISOString().slice(0, 10),
      payment: "credit",
      notes: "",
      lines: [emptyLine],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const total = purchaseTotal({ lines });

  useEffect(() => {
    if (!open) return;
    form.reset({
      supplier: "",
      invoiceNumber: "",
      date: new Date().toISOString().slice(0, 10),
      payment: "credit",
      notes: "",
      lines: [emptyLine],
    });
  }, [open, form]);

  const onSubmit = (values: Values) => {
    const result = createPurchase({
      supplier: values.supplier,
      invoiceNumber: values.invoiceNumber ?? "",
      date: values.date,
      payment: values.payment,
      notes: values.notes ?? "",
      lines: values.lines,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.warning) toast.warning(result.warning);
    else toast.success("Purchase recorded");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Record purchase"
      description="The bill posts to the journal immediately. Tick Add to inventory on a line if the goods should increase stock now."
      className="sm:max-w-4xl"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Supplier" error={form.formState.errors.supplier?.message}>
            <Input {...form.register("supplier")} placeholder="Island Foods Ltd" />
          </Field>
          <Field label="Invoice no.">
            <Input {...form.register("invoiceNumber")} placeholder="INV-4421" />
          </Field>
          <Field label="Date" error={form.formState.errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </Field>
          <Field label="Paid with">
            <Controller
              control={form.control}
              name="payment"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">On credit (accounts payable)</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit cost</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Add to inventory</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const line = lines[index];
                const ingredient = ingredients.find((row) => row.id === line?.ingredientId);
                return (
                  <tr key={field.id} className="border-t">
                    <td className="px-3 py-2">
                      <Controller
                        control={form.control}
                        name={`lines.${index}.ingredientId`}
                        render={({ field: ingredientField }) => (
                          <Select
                            value={ingredientField.value ?? "none"}
                            onValueChange={(value) => {
                              const nextId = value === "none" ? null : value;
                              ingredientField.onChange(nextId);
                              const match = ingredients.find((row) => row.id === nextId);
                              if (match && !form.getValues(`lines.${index}.description`)) {
                                form.setValue(`lines.${index}.description`, match.name);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not stocked</SelectItem>
                              {ingredients.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input {...form.register(`lines.${index}.description`)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="w-20"
                          {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <span className="text-xs text-slate-500">
                          {unitAbbreviation(units, ingredient?.unitId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        className="w-24"
                        {...form.register(`lines.${index}.unitCost`, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {formatMUR(line ? lineAmount(line) : 0)}
                    </td>
                    <td className="px-3 py-2">
                      <Controller
                        control={form.control}
                        name={`lines.${index}.addToInventory`}
                        render={({ field: stockField }) => (
                          <Switch
                            checked={stockField.value}
                            onCheckedChange={stockField.onChange}
                          />
                        )}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-slate-50 font-medium">
                <td className="px-3 py-2" colSpan={4}>
                  Invoice total
                </td>
                <td className="px-3 py-2">{formatMUR(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <Field label="Notes">
          <Textarea rows={2} {...form.register("notes")} />
        </Field>
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => append(emptyLine)}>
            <Plus /> Add line
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save purchase</Button>
          </div>
        </div>
      </form>
    </FormModal>
  );
}
