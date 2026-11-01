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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import type { MenuCategory } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function CategoryForm({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: MenuCategory | null;
}) {
  const categories = useAppStore((state) => state.categories);
  const createCategory = useAppStore((state) => state.createCategory);
  const updateCategory = useAppStore((state) => state.updateCategory);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      category
        ? {
            name: category.name,
            description: category.description,
            isActive: category.isActive,
          }
        : {
            name: "",
            description: "",
            isActive: true,
          }
    );
  }, [open, category, form]);

  const onSubmit = (values: Values) => {
    const payload = {
      name: values.name,
      description: values.description ?? "",
      image: category?.image ?? null,
      displayOrder: category?.displayOrder ?? categories.length + 1,
      isActive: values.isActive,
    };
    const result = category ? updateCategory(category.id, payload) : createCategory(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(category ? "Category updated" : "Category created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit category" : "Add category"}
      description="Categories organise the restaurant menu."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Category name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Burgers" />
        </Field>
        <Field label="Description">
          <Textarea rows={3} {...form.register("description")} />
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
          <Button type="submit">{category ? "Save changes" : "Create category"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
