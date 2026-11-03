"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { phoneKey } from "@/lib/customers";
import { formatMUR } from "@/lib/format";
import { ORDER_STATUSES, orderTotal } from "@/lib/orders";
import { useAppStore } from "@/store/app-store";
import type { Order } from "@/types";

const schema = z.object({
  zoneId: z.string().min(1, "Zone is required"),
  tableId: z.string().min(1, "Table is required"),
  status: z.enum(["open", "preparing", "served", "completed", "cancelled"]),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        categoryId: z.string(),
        name: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, "Add at least one menu item"),
});

type Values = z.infer<typeof schema>;

export function OrderForm({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}) {
  return (
    <OrderFormInner
      key={`${open ? "open" : "closed"}-${order?.id ?? "new"}`}
      open={open}
      onOpenChange={onOpenChange}
      order={order}
    />
  );
}

function OrderFormInner({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}) {
  const zones = useAppStore((state) => state.zones);
  const tables = useAppStore((state) => state.tables);
  const categories = useAppStore((state) => state.categories);
  const menuItems = useAppStore((state) => state.menuItems);
  const customers = useAppStore((state) => state.customers);
  const createOrder = useAppStore((state) => state.createOrder);
  const updateOrder = useAppStore((state) => state.updateOrder);
  const [categoryId, setCategoryId] = useState<string | null>("all");
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      zoneId: "",
      tableId: "",
      status: "open",
      customerName: "",
      customerPhone: "",
      notes: "",
      items: [],
    },
  });

  const selectedZoneId = useWatch({ control: form.control, name: "zoneId" });
  const items = useWatch({ control: form.control, name: "items" }) ?? [];

  useEffect(() => {
    if (!open) return;
    const table = tables.find((row) => row.id === order?.tableId);
    form.reset(
      order
        ? {
            zoneId: table?.zoneId ?? order.zoneId,
            tableId: order.tableId,
            status: order.status,
            customerName: order.customerName ?? "",
            customerPhone: order.customerPhone ?? "",
            notes: order.notes,
            items: order.items.map((item) => ({
              menuItemId: item.menuItemId,
              categoryId: item.categoryId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          }
        : {
            zoneId: "",
            tableId: "",
            status: "open",
            customerName: "",
            customerPhone: "",
            notes: "",
            items: [],
          }
    );
  }, [open, order, tables, form]);

  const zoneTables = useMemo(
    () => tables.filter((table) => table.zoneId === selectedZoneId && table.isActive),
    [tables, selectedZoneId]
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = categoryId === "all" || categoryId == null || item.categoryId === categoryId;
      const available = item.isAvailable || item.id === menuItemId;
      return matchesCategory && available;
    });
  }, [menuItems, categoryId, menuItemId]);

  const addItem = () => {
    const menuItem = menuItems.find((item) => item.id === menuItemId);
    if (!menuItem) {
      toast.error("Select a menu item to add.");
      return;
    }
    if (quantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    const existing = items.find((item) => item.menuItemId === menuItem.id);
    if (existing) {
      form.setValue(
        "items",
        items.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      form.setValue("items", [
        ...items,
        {
          menuItemId: menuItem.id,
          categoryId: menuItem.categoryId,
          name: menuItem.name,
          quantity,
          unitPrice: menuItem.price,
        },
      ]);
    }
    setMenuItemId(null);
    setQuantity(1);
  };

  const onSubmit = (values: Values) => {
    const payload = {
      tableId: values.tableId,
      status: values.status,
      customerName: values.customerName ?? "",
      customerPhone: values.customerPhone ?? "",
      notes: values.notes ?? "",
      items: values.items,
    };
    const result = order ? updateOrder(order.id, payload) : createOrder(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(order ? "Order updated" : "Order created");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={order ? `Edit ${order.orderNumber}` : "New order"}
      description="Link the order to a zone, table, and menu items from your categories."
      className="sm:max-w-2xl"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Zone" error={form.formState.errors.zoneId?.message}>
            <Controller
              control={form.control}
              name="zoneId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? "");
                    form.setValue("tableId", "");
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Table" error={form.formState.errors.tableId?.message}>
            <Controller
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <Select value={field.value || null} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {zoneTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} · {table.capacity} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Customer name">
            <Input {...form.register("customerName")} placeholder="Asha Boolaky" />
          </Field>
          <Field label="Phone number">
            <Input
              {...form.register("customerPhone")}
              placeholder="5712 3456"
              onBlur={(event) => {
                const match = customers.find((customer) => phoneKey(customer.phone) === phoneKey(event.target.value));
                if (match && !(form.getValues("customerName") ?? "").trim()) {
                  form.setValue("customerName", match.name);
                }
              }}
            />
          </Field>
          <Field label="Status">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <section className="space-y-3 rounded-xl border bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Menu items</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_88px_auto]">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={menuItemId} onValueChange={setMenuItemId}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue placeholder="Menu item" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {filteredMenuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {formatMUR(item.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-9 bg-white"
            />
            <Button type="button" className="h-9" onClick={addItem}>
              <Plus /> Add
            </Button>
          </div>
          {form.formState.errors.items?.message ? (
            <p className="text-xs text-red-600">{form.formState.errors.items.message}</p>
          ) : null}
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No items on this order yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const category = categories.find((row) => row.id === item.categoryId);
                return (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">{category?.name ?? "Uncategorised"}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      className="h-8 w-16"
                      onChange={(event) => {
                        const nextQty = Number(event.target.value);
                        form.setValue(
                          "items",
                          items.map((row) =>
                            row.menuItemId === item.menuItemId
                              ? { ...row, quantity: nextQty }
                              : row
                          )
                        );
                      }}
                    />
                    <span className="w-24 text-right text-sm font-medium">
                      {formatMUR(item.quantity * item.unitPrice)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        form.setValue(
                          "items",
                          items.filter((row) => row.menuItemId !== item.menuItemId)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
              <p className="text-right text-sm font-semibold">
                Total {formatMUR(orderTotal({ items }))}
              </p>
            </div>
          )}
        </section>

        <Field label="Notes">
          <Textarea rows={2} {...form.register("notes")} placeholder="Optional kitchen or service notes" />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{order ? "Save changes" : "Create order"}</Button>
        </div>
      </form>
    </FormModal>
  );
}
