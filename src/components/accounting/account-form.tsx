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
import { ACCOUNT_TYPES } from "@/lib/accounting";
import { useAppStore } from "@/store/app-store";
import type { Account } from "@/types";

const schema = z.object({
  code: z.string().min(4, "Use a 4 to 6 digit code").max(6),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  isCash: z.boolean(),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function AccountForm({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}) {
  const createAccount = useAppStore((state) => state.createAccount);
  const updateAccount = useAppStore((state) => state.updateAccount);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      type: "expense",
      isCash: false,
      isActive: true,
    },
  });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      account
        ? {
            code: account.code,
            name: account.name,
            type: account.type,
            isCash: account.isCash,
            isActive: account.isActive,
          }
        : {
            code: "",
            name: "",
            type: "expense",
            isCash: false,
            isActive: true,
          }
    );
  }, [open, account, form]);

  const onSubmit = (values: Values) => {
    const result = account ? updateAccount(account.id, values) : createAccount(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(account ? "Account updated" : "Account created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={account ? "Edit account" : "Add account"}
      description="Accounts used in the journal, ledger and cashbook."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Code" error={form.formState.errors.code?.message}>
          <Input {...form.register("code")} placeholder="5200" disabled={account?.isSystem} />
        </Field>
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Packaging" />
        </Field>
        <Field label="Type" error={form.formState.errors.type?.message}>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={account?.isSystem}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {type === "asset" ? (
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            Include in cashbook
            <Controller
              control={form.control}
              name="isCash"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </label>
        ) : null}
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
          <Button type="submit">{account ? "Save changes" : "Create account"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
