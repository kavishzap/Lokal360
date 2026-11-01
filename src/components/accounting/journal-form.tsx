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
import { journalTotals } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Narration is required"),
  lines: z
    .array(
      z.object({
        accountId: z.string().min(1, "Account is required"),
        description: z.string().optional(),
        debit: z.number().min(0),
        credit: z.number().min(0),
      })
    )
    .min(2),
});

type Values = z.infer<typeof schema>;

const emptyLine = { accountId: "", description: "", debit: 0, credit: 0 };

export function JournalForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <JournalFormInner key={open ? "open" : "closed"} open={open} onOpenChange={onOpenChange} />;
}

function JournalFormInner({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const accounts = useAppStore((state) => state.accounts);
  const createJournal = useAppStore((state) => state.createJournal);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      description: "",
      lines: [emptyLine, emptyLine],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const totals = journalTotals(lines);
  const activeAccounts = accounts.filter((account) => account.isActive);

  useEffect(() => {
    if (!open) return;
    form.reset({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      lines: [emptyLine, emptyLine],
    });
  }, [open, form]);

  const onSubmit = (values: Values) => {
    const result = createJournal({
      date: values.date,
      description: values.description,
      lines: values.lines.map((line) => ({
        accountId: line.accountId,
        description: line.description ?? "",
        debit: line.debit,
        credit: line.credit,
      })),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Journal entry posted");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Manual journal entry"
      description="Debits must equal credits. Use this for adjustments, expenses and opening items."
      className="sm:max-w-3xl"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" error={form.formState.errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </Field>
          <Field label="Narration" error={form.formState.errors.description?.message}>
            <Input {...form.register("description")} placeholder="Rent for October" />
          </Field>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Line note</th>
                <th className="px-3 py-2">Debit</th>
                <th className="px-3 py-2">Credit</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="px-3 py-2">
                    <Controller
                      control={form.control}
                      name={`lines.${index}.accountId`}
                      render={({ field: accountField }) => (
                        <Select value={accountField.value} onValueChange={accountField.onChange}>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeAccounts.map((account) => (
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
                    <Input {...form.register(`lines.${index}.description`)} />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...form.register(`lines.${index}.debit`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...form.register(`lines.${index}.credit`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={fields.length <= 2}
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
                  {totals.balanced ? "In balance" : "Out of balance"}
                </td>
                <td className="px-3 py-2">{formatMUR(totals.debit)}</td>
                <td className="px-3 py-2">{formatMUR(totals.credit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => append(emptyLine)}>
            <Plus /> Add line
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Post entry</Button>
          </div>
        </div>
      </form>
    </FormModal>
  );
}
