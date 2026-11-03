"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CategoryForm } from "@/components/categories/category-form";
import { Field, FormModal } from "@/components/shared/form-modal";
import { ImageUpload } from "@/components/shared/image-upload";
import { IngredientMultiSelect } from "@/components/shared/ingredient-multi-select";
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
import { useAppStore } from "@/store/app-store";
import type { MenuItem } from "@/types";

const schema = z.object({
  name: z.string().min(1, "French name is required"),
  nameEn: z.string().min(1, "English name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price cannot be negative"),
  manufacturedPrice: z.number().min(0, "Manufactured price cannot be negative"),
  image: z.string().nullable(),
  preparationTime: z.number().min(0).nullable(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  ingredients: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.number().gt(0, "Quantity must be greater than zero"),
    })
  ),
});

type Values = z.infer<typeof schema>;

export function MenuItemForm({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categories = useAppStore((state) => state.categories);
  const ingredients = useAppStore((state) => state.ingredients);
  const createMenuItem = useAppStore((state) => state.createMenuItem);
  const updateMenuItem = useAppStore((state) => state.updateMenuItem);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nameEn: "",
      description: "",
      categoryId: "",
      price: 0,
      manufacturedPrice: 0,
      image: null,
      preparationTime: 10,
      isAvailable: true,
      isFeatured: false,
      ingredients: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      item
        ? {
            name: item.name,
            nameEn: item.nameEn ?? "",
            description: item.description,
            categoryId: item.categoryId,
            price: item.price,
            manufacturedPrice: item.manufacturedPrice ?? 0,
            image: item.image,
            preparationTime: item.preparationTime,
            isAvailable: item.isAvailable,
            isFeatured: item.isFeatured,
            ingredients: item.ingredients,
          }
        : {
            name: "",
            nameEn: "",
            description: "",
            categoryId: "",
            price: 0,
            manufacturedPrice: 0,
            image: null,
            preparationTime: 10,
            isAvailable: true,
            isFeatured: false,
            ingredients: [],
          }
    );
  }, [open, item, form]);

  const onSubmit = (values: Values) => {
    const payload = {
      name: values.name,
      nameEn: values.nameEn,
      description: values.description ?? "",
      categoryId: values.categoryId,
      price: values.price,
      manufacturedPrice: values.manufacturedPrice,
      image: values.image,
      preparationTime: values.preparationTime,
      isAvailable: values.isAvailable,
      isFeatured: values.isFeatured,
      ingredients: values.ingredients,
    };
    const result = item ? updateMenuItem(item.id, payload) : createMenuItem(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.warning) toast.warning(result.warning);
    else toast.success(item ? "Menu item updated" : "Menu item created");
    onOpenChange(false);
  };

  return (
    <>
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit menu item" : "Add menu item"}
      description="Create a sellable dish with category, price and recipe."
      className="sm:max-w-2xl"
    >
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">1. Basic information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="French name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Burger de poulet" />
            </Field>
            <Field label="English name" error={form.formState.errors.nameEn?.message}>
              <Input {...form.register("nameEn")} placeholder="Chicken Burger" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} {...form.register("description")} />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">2. Category and pricing</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" error={form.formState.errors.categoryId?.message}>
              <div className="flex gap-2">
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value || null} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                  aria-label="Add category"
                  onClick={() => setCategoryOpen(true)}
                >
                  <Plus />
                </Button>
              </div>
            </Field>
            <Field label="Selling price (MUR)" error={form.formState.errors.price?.message}>
              <Input type="number" min={0} step="0.01" {...form.register("price", { valueAsNumber: true })} />
            </Field>
            <Field label="Manufactured price (MUR)" error={form.formState.errors.manufacturedPrice?.message}>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...form.register("manufacturedPrice", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Preparation time (minutes)">
              <Input type="number" min={0} {...form.register("preparationTime", { valueAsNumber: true })} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">3. Ingredients / recipe</h3>
          <Controller
            control={form.control}
            name="ingredients"
            render={({ field }) => (
              <IngredientMultiSelect
                ingredients={ingredients}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {form.formState.errors.ingredients ? (
            <p className="text-xs text-red-600">
              {form.formState.errors.ingredients.message ??
                "Check ingredient quantities. Each ingredient can only be selected once."}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">4. Image and availability</h3>
          <Controller
            control={form.control}
            name="image"
            render={({ field }) => (
              <ImageUpload value={field.value} onChange={field.onChange} />
            )}
          />
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            Available
            <Controller
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            Featured item
            <Controller
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </label>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{item ? "Save changes" : "Create menu item"}</Button>
        </div>
      </form>
    </FormModal>
    <CategoryForm
      open={categoryOpen}
      onOpenChange={setCategoryOpen}
      onCreated={(id) => form.setValue("categoryId", id, { shouldValidate: true })}
    />
    </>
  );
}
