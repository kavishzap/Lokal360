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
import { Textarea } from "@/components/ui/textarea";
import { expenseTotal, SYSTEM_ACCOUNT_CODES } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  payee: z.string().min(1, "Payee is required"),
  reference: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  payment: z.enum(["cash", "bank", "credit"]),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        accountId: z.string().min(1, "Account is required"),
        amount: z.number().positive("Amount must be greater than zero"),
      })
    )
    .min(1, "Add at least one line"),
});

type Values = z.infer<typeof schema>;

export function ExpenseForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ExpenseFormInner key={open ? "open" : "closed"} open={open} onOpenChange={onOpenChange} />
  );
}

function ExpenseFormInner({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const accounts = useAppStore((state) => state.accounts);
  const createExpense = useAppStore((state) => state.createExpense);
  const expenseAccounts = accounts.filter((account) => account.type === "expense" && account.isActive);
  const defaultAccountId =
    expenseAccounts.find((account) => account.code === SYSTEM_ACCOUNT_CODES.expenses)?.id ??
    expenseAccounts[0]?.id ??
    "";

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      payee: "",
      reference: "",
      date: new Date().toISOString().slice(0, 10),
      payment: "bank",
      notes: "",
      lines: [{ description: "", accountId: defaultAccountId, amount: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const total = expenseTotal({ lines });

  useEffect(() => {
    if (!open) return;
    form.reset({
      payee: "",
      reference: "",
      date: new Date().toISOString().slice(0, 10),
      payment: "bank",
      notes: "",
      lines: [{ description: "", accountId: defaultAccountId, amount: 0 }],
    });
  }, [open, form, defaultAccountId]);

  const onSubmit = (values: Values) => {
    const result = createExpense({
      payee: values.payee,
      reference: values.reference ?? "",
      date: values.date,
      payment: values.payment,
      notes: values.notes ?? "",
      lines: values.lines,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Expense recorded");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Record expense"
      description="Operating costs such as rent, electricity, wages and cleaning. The bill posts to the journal at once."
      className="sm:max-w-3xl"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Payee" error={form.formState.errors.payee?.message}>
            <Input {...form.register("payee")} placeholder="CEB" />
          </Field>
          <Field label="Reference">
            <Input {...form.register("reference")} placeholder="EL-SEP-26" />
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
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="px-3 py-2">
                    <Input
                      {...form.register(`lines.${index}.description`)}
                      placeholder="Electricity"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Controller
                      control={form.control}
                      name={`lines.${index}.accountId`}
                      render={({ field: accountField }) => (
                        <Select value={accountField.value} onValueChange={accountField.onChange}>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Expense account" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      className="w-28"
                      {...form.register(`lines.${index}.amount`, { valueAsNumber: true })}
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
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-slate-50 font-medium">
                <td className="px-3 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2">{formatMUR(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <Field label="Notes">
          <Textarea rows={2} {...form.register("notes")} />
        </Field>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ description: "", accountId: defaultAccountId, amount: 0 })
            }
          >
            <Plus /> Add line
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save expense</Button>
          </div>
        </div>
      </form>
    </FormModal>
  );
}
