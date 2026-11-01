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
import type { Zone } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Zone name is required"),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function ZoneForm({
  open,
  onOpenChange,
  zone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: Zone | null;
}) {
  const createZone = useAppStore((state) => state.createZone);
  const updateZone = useAppStore((state) => state.updateZone);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(zone ? { name: zone.name, isActive: zone.isActive } : { name: "", isActive: true });
  }, [open, zone, form]);

  const onSubmit = (values: Values) => {
    const payload = {
      name: values.name,
      description: zone?.description ?? "",
      isActive: values.isActive,
    };
    const result = zone ? updateZone(zone.id, payload) : createZone(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(zone ? "Zone updated" : "Zone created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={zone ? "Edit zone" : "Add zone"}
      description="Zones represent physical areas of the restaurant."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Zone name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Indoor Dining" />
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
          <Button type="submit">{zone ? "Save changes" : "Create zone"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
