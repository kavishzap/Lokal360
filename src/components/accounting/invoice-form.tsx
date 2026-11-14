"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CustomerForm } from "@/components/customers/customer-form";
import { Field } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslate } from "@/i18n/use-translate";
import { invoiceLineNet, invoiceLineVat, invoiceTotals } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Invoice } from "@/types";

const schema = z.object({
  customerId: z.string().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  billTo: z.string(),
  date: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        menuItemId: z.string().nullable(),
        quantity: z.number().positive("Quantity must be greater than zero"),
        unitPrice: z.number().min(0),
        vatRate: z.union([z.literal(0), z.literal(15)]),
      })
    )
    .min(1, "Add at least one line"),
});

type Values = z.infer<typeof schema>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dueFrom(date: string) {
  const next = new Date(`${date || today()}T12:00:00`);
  next.setDate(next.getDate() + 14);
  return next.toISOString().slice(0, 10);
}

const emptyLine = {
  description: "",
  menuItemId: null as string | null,
  quantity: 1,
  unitPrice: 0,
  vatRate: 15 as 0 | 15,
};

function valuesFrom(invoice: Invoice | null): Values {
  const date = invoice?.date || today();
  return {
    customerId: invoice?.customerId ?? null,
    customerName: invoice?.customerName ?? "",
    customerPhone: invoice?.customerPhone ?? "",
    billTo: invoice?.billTo ?? "",
    date,
    dueDate: invoice?.dueDate || dueFrom(date),
    notes: invoice?.notes ?? "",
    lines: invoice?.lines.length
      ? invoice.lines.map((line) => ({
          description: line.description,
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate === 0 ? 0 : 15,
        }))
      : [emptyLine],
  };
}

const LIST_PATH = "/dashboard/invoices";

export function InvoiceForm({ invoice }: { invoice?: Invoice | null }) {
  const { t } = useTranslate();
  const router = useRouter();
  const [customerOpen, setCustomerOpen] = useState(false);
  const customers = useAppStore((state) => state.customers);
  const menuItems = useAppStore((state) => state.menuItems);
  const saveInvoice = useAppStore((state) => state.saveInvoice);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesFrom(invoice ?? null),
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const totals = invoiceTotals({ lines });

  useEffect(() => {
    form.reset(valuesFrom(invoice ?? null));
  }, [invoice, form]);

  const submit = (issue: boolean) =>
    form.handleSubmit((values) => {
      const result = saveInvoice(
        {
          customerId: values.customerId,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          billTo: values.billTo,
          date: values.date,
          dueDate: values.dueDate,
          notes: values.notes,
          issue,
          lines: values.lines,
        },
        invoice?.id
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(issue ? t("Issue invoice") : t("Save draft"));
      router.push(LIST_PATH);
    })();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={invoice ? "Edit invoice" : "Create invoice"}
        description="Prices are before VAT. Issuing posts the sale, the VAT, and the amount the customer owes."
      />
      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(false);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer">
            <div className="flex gap-2">
              <Controller
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => {
                      const id = value === "none" ? null : value;
                      field.onChange(id);
                      const customer = customers.find((row) => row.id === id);
                      if (customer) {
                        form.setValue("customerName", customer.name);
                        form.setValue("customerPhone", customer.phone);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder={t("Walk-in or new customer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("Walk-in or new customer")}</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="shrink-0"
                aria-label={t("Add customer")}
                onClick={() => setCustomerOpen(true)}
              >
                <Plus />
              </Button>
            </div>
          </Field>
          <Field label="Customer name" error={form.formState.errors.customerName?.message}>
            <Input {...form.register("customerName")} placeholder="Harbour Events Ltd" />
          </Field>
          <Field label="Phone">
            <Input {...form.register("customerPhone")} placeholder="+230 5..." />
          </Field>
          <Field label="Bill to">
            <Input {...form.register("billTo")} placeholder="Royal Road, Grand Baie" />
          </Field>
          <Field label="Invoice date" error={form.formState.errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </Field>
          <Field label="Due date" error={form.formState.errors.dueDate?.message}>
            <Input type="date" {...form.register("dueDate")} />
          </Field>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
            const line = lines[index];
            return (
              <div key={field.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <Field label="Menu item">
                    <Controller
                      control={form.control}
                      name={`lines.${index}.menuItemId`}
                      render={({ field: menuField }) => (
                        <Select
                          value={menuField.value ?? "none"}
                          onValueChange={(value) => {
                            const id = value === "none" ? null : value;
                            menuField.onChange(id);
                            const item = menuItems.find((row) => row.id === id);
                            if (!item) return;
                            form.setValue(`lines.${index}.description`, item.nameEn || item.name);
                            form.setValue(`lines.${index}.unitPrice`, item.price);
                          }}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder={t("None")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("None")}</SelectItem>
                            {menuItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nameEn || item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Description" error={form.formState.errors.lines?.[index]?.description?.message}>
                    <Input {...form.register(`lines.${index}.description`)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Qty">
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Price">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="VAT">
                    <Controller
                      control={form.control}
                      name={`lines.${index}.vatRate`}
                      render={({ field: vatField }) => (
                        <Select
                          value={String(vatField.value)}
                          onValueChange={(value) => vatField.onChange(value === "0" ? 0 : 15)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">{t("15% VAT")}</SelectItem>
                            <SelectItem value="0">{t("No VAT")}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-between sm:col-span-12">
                  <p className="text-xs text-slate-500">
                    {formatMUR(invoiceLineNet(line ?? emptyLine))} + {formatMUR(invoiceLineVat(line ?? emptyLine))} {t("VAT")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine)}>
            <Plus /> {t("Add line")}
          </Button>
          {form.formState.errors.lines?.message ? (
            <p className="text-xs text-red-600">{form.formState.errors.lines.message}</p>
          ) : null}
        </div>

        <Field label="Notes">
          <Textarea {...form.register("notes")} rows={2} />
        </Field>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-200 pt-3">
          <div className="text-sm text-slate-600">
            <p>
              {t("Net")} {formatMUR(totals.net)}
            </p>
            <p>
              {t("VAT")} {formatMUR(totals.vat)}
            </p>
            <p className="font-semibold text-slate-900">
              {t("Total")} {formatMUR(totals.gross)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(LIST_PATH)}>
              {t("Cancel")}
            </Button>
            <Button type="button" variant="outline" onClick={() => void submit(false)}>
              {t("Save draft")}
            </Button>
            <Button type="button" onClick={() => void submit(true)}>
              {t("Issue invoice")}
            </Button>
          </div>
        </div>
      </form>
      <CustomerForm
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        onCreated={(id) => {
          const customer = useAppStore.getState().customers.find((row) => row.id === id);
          form.setValue("customerId", id);
          if (!customer) return;
          form.setValue("customerName", customer.name);
          form.setValue("customerPhone", customer.phone);
        }}
      />
    </div>
  );
}
