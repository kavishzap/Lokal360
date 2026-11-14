"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/i18n/use-translate";
import { useAppStore } from "@/store/app-store";
import type { Supplier } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string(),
  email: z.string(),
});

type Values = z.infer<typeof schema>;

export function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onCreated?: (id: string) => void;
}) {
  const { t } = useTranslate();
  const createSupplier = useAppStore((state) => state.createSupplier);
  const updateSupplier = useAppStore((state) => state.updateSupplier);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      supplier
        ? { name: supplier.name, phone: supplier.phone, email: supplier.email }
        : { name: "", phone: "", email: "" }
    );
  }, [open, supplier, form]);

  const onSubmit = (values: Values) => {
    const payload = { name: values.name, phone: values.phone, email: values.email };
    const result = supplier ? updateSupplier(supplier.id, payload) : createSupplier(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(supplier ? t("Save changes") : t("Add supplier"));
    if (!supplier && result.id) onCreated?.(result.id);
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={supplier ? "Edit" : "Add supplier"}
      description="Companies you buy from."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Supplier name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Island Foods Ltd" />
        </Field>
        <Field label="Phone">
          <Input {...form.register("phone")} placeholder="263 1100" />
        </Field>
        <Field label="Email">
          <Input {...form.register("email")} placeholder="orders@islandfoods.mu" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button type="submit">{supplier ? t("Save changes") : t("Add supplier")}</Button>
        </div>
      </form>
    </FormModal>
  );
}
