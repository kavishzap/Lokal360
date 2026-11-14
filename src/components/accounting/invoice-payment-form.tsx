"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { useTranslate } from "@/i18n/use-translate";
import { invoiceTotals } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Invoice } from "@/types";

const schema = z.object({
  date: z.string().min(1, "Payment date is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.enum(["cash", "bank"]),
  reference: z.string(),
});

type Values = z.infer<typeof schema>;

export function InvoicePaymentForm({
  invoice,
  onOpenChange,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslate();
  const recordInvoicePayment = useAppStore((state) => state.recordInvoicePayment);
  const balance = invoice ? invoiceTotals(invoice).balance : 0;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      amount: balance,
      method: "bank",
      reference: "",
    },
  });

  useEffect(() => {
    if (!invoice) return;
    form.reset({
      date: new Date().toISOString().slice(0, 10),
      amount: invoiceTotals(invoice).balance,
      method: "bank",
      reference: "",
    });
  }, [invoice, form]);

  const onSubmit = (values: Values) => {
    if (!invoice) return;
    const result = recordInvoicePayment(invoice.id, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("Record payment"));
    onOpenChange(false);
  };

  return (
    <FormModal
      open={Boolean(invoice)}
      onOpenChange={onOpenChange}
      title="Record payment"
      description={invoice ? `${invoice.number} · ${t("Balance")} ${formatMUR(balance)}` : undefined}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Payment date" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register("date")} />
        </Field>
        <Field label="Amount" error={form.formState.errors.amount?.message}>
          <Input type="number" min={0} step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </Field>
        <Field label="Paid with">
          <Controller
            control={form.control}
            name="method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">{t("Bank")}</SelectItem>
                  <SelectItem value="cash">{t("Cash")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Reference">
          <Input {...form.register("reference")} placeholder="TRF-1044" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">{t("Record payment")}</Button>
        </div>
      </form>
    </FormModal>
  );
}
