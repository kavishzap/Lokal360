"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Field, FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
});

type Values = z.infer<typeof schema>;

export function CustomerForm({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}) {
  const createCustomer = useAppStore((state) => state.createCustomer);
  const updateCustomer = useAppStore((state) => state.updateCustomer);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(customer ? { name: customer.name, phone: customer.phone } : { name: "", phone: "" });
  }, [open, customer, form]);

  const onSubmit = (values: Values) => {
    const payload = { name: values.name ?? "", phone: values.phone };
    const result = customer ? updateCustomer(customer.id, payload) : createCustomer(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(customer ? "Customer updated" : "Customer created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={customer ? "Edit customer" : "Add customer"}
      description="A phone number belongs to one customer."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Customer name">
          <Input {...form.register("name")} placeholder="Asha Boolaky" />
        </Field>
        <Field label="Phone number" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="5712 3456" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{customer ? "Save changes" : "Create customer"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
