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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ASSET_CATEGORIES, monthlyDepreciation } from "@/lib/assets";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  name: z.string().min(1, "Asset name is required"),
  category: z.enum(["vehicle", "kitchen", "furniture", "it", "building", "land", "other"]),
  acquiredOn: z.string().min(1, "Acquisition date is required"),
  cost: z.number().positive("Cost must be greater than zero"),
  funding: z.enum(["cash", "bank", "credit", "capital"]),
  depreciates: z.boolean(),
  usefulLifeYears: z.number().min(0),
  residualValue: z.number().min(0),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function AssetForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <AssetFormInner key={open ? "open" : "closed"} open={open} onOpenChange={onOpenChange} />;
}

function AssetFormInner({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createAsset = useAppStore((state) => state.createAsset);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "vehicle",
      acquiredOn: new Date().toISOString().slice(0, 10),
      cost: 0,
      funding: "bank",
      depreciates: true,
      usefulLifeYears: 5,
      residualValue: 0,
      notes: "",
    },
  });
  const depreciates = useWatch({ control: form.control, name: "depreciates" });
  const cost = useWatch({ control: form.control, name: "cost" }) || 0;
  const usefulLifeYears = useWatch({ control: form.control, name: "usefulLifeYears" }) || 0;
  const residualValue = useWatch({ control: form.control, name: "residualValue" }) || 0;
  const monthly = monthlyDepreciation({
    cost,
    residualValue,
    depreciates: Boolean(depreciates),
    usefulLifeMonths: Math.round(usefulLifeYears * 12),
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: "",
      category: "vehicle",
      acquiredOn: new Date().toISOString().slice(0, 10),
      cost: 0,
      funding: "bank",
      depreciates: true,
      usefulLifeYears: 5,
      residualValue: 0,
      notes: "",
    });
  }, [open, form]);

  const onSubmit = (values: Values) => {
    const result = createAsset({
      ...values,
      notes: values.notes ?? "",
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Asset registered");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Register asset"
      description="Vehicles, kitchen plant, furniture and land. Depreciating items reduce book value each month on a straight-line basis."
      className="sm:max-w-lg"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Toyota Hiace delivery van" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Acquired on" error={form.formState.errors.acquiredOn?.message}>
            <Input type="date" {...form.register("acquiredOn")} />
          </Field>
          <Field label="Cost" error={form.formState.errors.cost?.message}>
            <Input
              type="number"
              step="0.01"
              min={0}
              {...form.register("cost", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Paid with">
            <Controller
              control={form.control}
              name="funding"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">On credit</SelectItem>
                    <SelectItem value="capital">Owner capital</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          This asset depreciates
          <Controller
            control={form.control}
            name="depreciates"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </label>
        {depreciates ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Useful life (years)">
              <Input
                type="number"
                min={1}
                step={1}
                {...form.register("usefulLifeYears", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Residual value">
              <Input
                type="number"
                step="0.01"
                min={0}
                {...form.register("residualValue", { valueAsNumber: true })}
              />
            </Field>
            <p className="sm:col-span-2 text-xs text-slate-500">
              Straight-line charge of {formatMUR(monthly)} per month until residual.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Land and similar items stay at cost. They still count in the business value.
          </p>
        )}
        <Field label="Notes">
          <Textarea rows={2} {...form.register("notes")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save asset</Button>
        </div>
      </form>
    </FormModal>
  );
}
